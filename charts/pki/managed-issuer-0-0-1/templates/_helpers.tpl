{{/*
Validate that only one issuer type is enabled
*/}}
{{- define "managed-issuer.validateIssuerConfig" -}}
{{- if and .Values.issuer.acme.enabled .Values.issuer.existingPKI.enabled -}}
{{- fail "Configuration error: Both issuer.acme.enabled and issuer.existingPKI.enabled cannot be true simultaneously. Please enable only one issuer type." -}}
{{- end -}}

{{/* Validate that solvers are provided when ACME is enabled */}}
{{- if .Values.issuer.acme.enabled -}}
  {{- if empty .Values.issuer.acme.solvers -}}
    {{- fail "Configuration error: When issuer.acme.enabled is true, you must provide at least one solver in issuer.acme.solvers." -}}
  {{- end -}}
{{- end -}}
{{- end -}}
