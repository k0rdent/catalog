{{/* Generate a comma-separated list of IP addresses with optional quoting */}}
{{- define "kyverno-guardrails.ipList" -}}
{{- $quoted := .quoted | default false -}}
{{- range $i, $ip := .ips }}{{ if $i }}, {{ end }}{{ if $quoted }}\"{{ $ip }}\"{{ else }}{{ $ip }}{{ end }}{{- end }}
{{- end -}}

{{/* Generate a registry prefix check expression for CEL */}}
{{- define "kyverno-guardrails.registryPrefixCheck" -}}
{{- range $i, $registry := .registries }}{{ if $i }} || {{ end }}container.image.startsWith('{{ $registry }}'){{- end }}
{{- end -}}

{{/* Generate a CEL expression to check for required labels */}}
{{- define "kyverno-guardrails.requiredLabelsCheck" -}}
{{- range $i, $label := . }}
{{- if $i }} && {{ end -}}
object.metadata.?labels[?'{{ $label }}'].orValue('') != ""
{{- end -}}
{{- end -}}