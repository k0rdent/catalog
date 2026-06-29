{{- define "k0rdent-catalog-web.fullname" -}}
{{- default .Chart.Name .Release.Name | trunc 63 | trimSuffix "-" }}
{{- end }}

{{- define "k0rdent-catalog-web.labels" -}}
app.kubernetes.io/name: {{ .Chart.Name }}
app.kubernetes.io/instance: {{ .Release.Name }}
app.kubernetes.io/version: {{ .Values.image.tag | quote }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- end }}

{{- define "k0rdent-catalog-web.selectorLabels" -}}
app.kubernetes.io/name: {{ .Chart.Name }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end }}
