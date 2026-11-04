#!/bin/bash
set -euo pipefail

debug="${DEBUG:-}"
TIMEOUT=$((25 * 60))
# Seconds between heartbeats while nothing changes.
POD_TICK_INTERVAL="${POD_TICK_INTERVAL:-30}"
SECONDS=0
last_summary=""
last_state=""
last_tick=0

# pod_summary -- one line per pod: name, phase, ready containers, the waiting
# or terminated reason behind the ones that are not, and how old it is. Sorted,
# so a reordering by the API server does not read as a change.
#
# Age is the last field on purpose: it ticks on every poll, so everything that
# compares two summaries cuts it off first. kubectl computes the AGE column on
# the client and `-o json` does not carry it, so it is worked out here from the
# same creationTimestamp kubectl uses.
pod_summary() {
    jq -r '
      def age($s):
        if $s == null then "-"
        elif $s < 60 then "\($s | floor)s"
        elif $s < 3600 then "\(($s / 60) | floor)m"
        elif $s < 86400 then "\(($s / 3600) | floor)h"
        else "\(($s / 86400) | floor)d" end;
      .items[] as $p
      | (($p.status.containerStatuses // [])) as $cs
      | ( [ $cs[] | (.state.waiting.reason // .state.terminated.reason // empty) ]
          | unique | join(",") ) as $r
      | ( if ($p.metadata.creationTimestamp | type) == "string"
          then now - ($p.metadata.creationTimestamp | fromdateiso8601)
          else null end ) as $a
      | [ $p.metadata.name,
          ($p.status.phase // "-"),
          (([ $cs[] | select(.ready == true) ] | length | tostring)
             + "/" + ($cs | length | tostring)),
          (if $r == "" then "-" else $r end),
          age($a)
        ] | @tsv' <<< "$1" | sort
}

# pod_state SUMMARY -- the fields a change is judged on, which is everything
# but the age.
pod_state() { cut -f1-4 <<< "$1"; }

# pod_table SUMMARY -- aligned. Printed in full on the first poll and again at
# the end; in between only what moved, see pod_changes.
pod_table() {
    [[ -n "$1" ]] || return 0
    awk -F'\t' '{ printf "   %-46s %-10s %-6s %-6s %s\n", $1, $2, $3, $5, $4 }' <<< "$1"
}

# pod_changes NOW BEFORE -- the rows that differ from the last poll: pods that
# changed state, pods that appeared, and pods that are no longer there. A
# cluster coming up is mostly pods that already settled, and reprinting thirty
# Running 1/1 lines every few seconds buries the one that did move.
#
# awk rather than bash associative arrays, so this still runs under the bash
# 3.2 that macOS ships. It compares fields 1-4 and prints the whole row, which
# is how the age gets shown without a tick of the clock reading as a change.
pod_changes() {
    awk -F'\t' -v OFS='\t' '
        NR == FNR { before[$1] = $2 OFS $3 OFS $4; next }
        { now[$1] = 1
          if (!($1 in before) || before[$1] != ($2 OFS $3 OFS $4)) print }
        END { for (n in before) if (!(n in now)) print n, "gone", "-", "-", "-" }
    ' <(printf '%s\n' "$2") <(printf '%s\n' "$1") | sort
}

echo "⏳ Waiting for pods in '$TEST_MODE/$NAMESPACE'"

while (( SECONDS < TIMEOUT )); do
    pods_json=$(KUBECONFIG="kcfg_$TEST_MODE" kubectl get pods -n "$NAMESPACE" -o json 2>/dev/null || true)

    if [[ -z "$pods_json" ]]; then
        echo "No pods found or error getting pods"
        sleep 3
        continue
    fi

    all_ready=true
    all_running=true
    all_creating=true

    pod_count=$(jq '.items | length' <<< "$pods_json")
    if [[ "$pod_count" -eq 0 ]]; then
        echo "⏳ No pods found in the namespace '$NAMESPACE' yet"
        sleep 3
        continue
    fi

    # Loop over each pod
    for row in $(jq -r '.items[] | @base64' <<< "$pods_json"); do
        _jq() {
            echo "${row}" | base64 --decode | jq -r "${1}"
        }

        name=$(_jq '.metadata.name')
        status=$(_jq '.status.phase')
        pod_reason=$(_jq '.status.reason')
        reason=$(_jq '.status.containerStatuses[]?.state.waiting.reason')
        ready_containers=$(_jq 'if .status.containerStatuses != null then [.status.containerStatuses[] | select(.ready == true)] | length else 0 end')
        total_containers=$(_jq 'if .status.containerStatuses != null then .status.containerStatuses | length else 0 end')

        if [[ "$status" == "Succeeded" ]]; then
            continue
        elif [[ "$status" == "Failed" && "$pod_reason" == "Evicted" ]]; then
            # Terminal evicted pods are replaced by the controller; ignore them.
            continue
        elif [[ "$status" == "Running" ]]; then
            if [[ "$ready_containers" -ne "$total_containers" ]]; then
                all_ready=false
            fi
        else
            if [[ $debug == "1" ]]; then
                echo "Pod '$name', status: '$status'"
                KUBECONFIG="kcfg_$TEST_MODE" kubectl describe pod "$name" -n "$NAMESPACE"
            fi
            if [[ "$reason" != ContainerCreating ]]; then
                all_creating=false
            fi
            all_ready=false
            all_running=false
        fi
    done

    for wait_for_pod in ${WAIT_FOR_PODS:-}; do
        if ! jq -r '.items[].metadata.name' <<< "$pods_json" | grep -q "$wait_for_pod"; then
           all_ready=false
           all_running=false
           all_creating=false
           echo "Expected pod '$wait_for_pod' not found!"
           break
        fi
    done

    summary="$(pod_summary "$pods_json")"
    # A pod with no container statuses yet is not ready, so it must not count
    # as 0/0 "all ready".
    ready_pods="$(jq '[ .items[]
        | (.status.containerStatuses // []) as $cs
        | select(($cs | length) > 0
                 and ([ $cs[] | select(.ready == true) ] | length) == ($cs | length))
      ] | length' <<< "$pods_json")"

    if [[ "${WAIT_FOR_RUNNING:-}" == "true" ]]; then
        if $all_running; then
            echo "✅ All '$NAMESPACE' pods running!"
            pod_table "$summary"
            break
        fi
        waiting_for="running"
    elif [[ "${WAIT_FOR_CREATING:-}" == "true" ]]; then
        if $all_creating; then
            echo "✅ All '$NAMESPACE' pods at least in ContainerCreating state!"
            pod_table "$summary"
            break
        fi
        waiting_for="creating"
    else
        if $all_ready; then
            echo "✅ All '$NAMESPACE' pods are ready!"
            pod_table "$summary"
            break
        fi
        waiting_for="ready"
    fi

    # Everything the first time, only what moved after that, a heartbeat when
    # nothing did: a cluster coming up changes often enough to follow, and a
    # stuck one must not scroll the reason for being stuck off the top.
    state="$(pod_state "$summary")"
    if [[ "$state" != "$last_state" ]]; then
        echo "⏳ waiting for pods to be $waiting_for -- $ready_pods/$pod_count ready (${SECONDS}s)"
        if [[ -z "$last_state" ]]; then
            pod_table "$summary"
        else
            pod_table "$(pod_changes "$summary" "$last_summary")"
        fi
        last_summary="$summary"
        last_state="$state"
        last_tick=$SECONDS
    elif (( SECONDS - last_tick >= POD_TICK_INTERVAL )); then
        echo "⏳ unchanged -- $ready_pods/$pod_count ready (${SECONDS}s)"
        last_tick=$SECONDS
    fi

    sleep 3
done

if (( SECONDS >= TIMEOUT )); then
    echo "❌ Timeout reached: Some pods '$NAMESPACE' are still not ready"
    echo "🔍 Dumping '$NAMESPACE' pod statuses for debugging..."

    for row in $(jq -r '.items[] | @base64' <<< "$pods_json"); do
        _jq() {
            echo "${row}" | base64 --decode | jq -r "${1}"
        }

        pod_name=$(_jq '.metadata.name')
        pod_phase=$(_jq '.status.phase')

        echo "📦 Pod: $pod_name (Phase: $pod_phase)"

        container_count=$(_jq '.status.containerStatuses | length')
        for (( i=0; i<container_count; i++ )); do
            cname=$(_jq ".status.containerStatuses[$i].name")
            ready=$(_jq ".status.containerStatuses[$i].ready")
            state=$(_jq ".status.containerStatuses[$i].state | keys[0]")
            reason=$(_jq ".status.containerStatuses[$i].state.${state}.reason // \"-\"")
            message=$(_jq ".status.containerStatuses[$i].state.${state}.message // \"-\"")

            echo " └─ Container: $cname"
            echo "    • Ready: $ready"
            echo "    • State: $state"
            echo "    • Reason: $reason"
            echo "    • Message: $message"
        done

        echo ""
    done

    exit 1
fi
