{{/* Generate a comma-separated list of IP addresses with optional quoting */}}
{{- define "kyverno-guardrails.ipList" -}}
{{- $quoted := .quoted | default false -}}
{{- range $i, $ip := .ips }}{{ if $i }}, {{ end }}{{ if $quoted }}\"{{ $ip }}\"{{ else }}{{ $ip }}{{ end }}{{- end }}
{{- end -}}

{{/* Generate a registry prefix check expression for CEL */}}
{{- define "kyverno-guardrails.registryPrefixCheck" -}}
{{- if .registries -}}
{{- range $i, $registry := .registries }}{{ if $i }} || {{ end }}container.image.startsWith('{{ $registry }}'){{- end }}
{{- else -}}
false
{{- end -}}
{{- end -}}

{{/* Generate a CEL expression to check for required labels */}}
{{- define "kyverno-guardrails.requiredLabelsCheck" -}}
{{- range $i, $label := . }}
{{- if $i }} && {{ end -}}
object.metadata.?labels[?'{{ $label }}'].orValue('') != ""
{{- end -}}
{{- end -}}

{{/* Determine policy action for a specific policy */}}
{{- define "kyverno-guardrails.policyAction" -}}
{{- $policyName := index . 0 -}}
{{- $root := index . 1 -}}
{{- $globalAction := $root.Values.global.policyAction -}}
{{- $policySpecificAction := index $root.Values $policyName "policyAction" -}}
{{- if and $policySpecificAction (ne $policySpecificAction "") -}}
{{- $policySpecificAction -}}
{{- else -}}
{{- $globalAction -}}
{{- end -}}
{{- end -}}

{{/* Determine background scanning for a specific policy */}}
{{- define "kyverno-guardrails.background" -}}
{{- $policyName := index . 0 -}}
{{- $root := index . 1 -}}
{{- $globalBackground := $root.Values.global.background -}}
{{- if hasKey (index $root.Values $policyName) "background" -}}
{{- $policyBackground := index $root.Values $policyName "background" -}}
{{- $policyBackground -}}
{{- else -}}
{{- $globalBackground -}}
{{- end -}}
{{- end -}}
