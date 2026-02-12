---
{% if tags %}
tags:
{%- for tag in tags %}
    - {{ tag }}
{%- endfor %}
{% else %}
tags: []
{% endif %}
title: {{ title }}
description: {{ summary }}
logo: "{{ logo }}"
type: "{{ type }}"
support_type: "{{ support_type | replace('Partner', 'Enterprise') }}" # Temporarily represent "Partner" support type as "Enterprise"
created: "{{ created }}"
---
![logo]({{ logo_big }}){ align="right", width="100" }
# {{ title }}

=== "Description"

    {{ description | replace("\n", "\n    ") }}

    {% if support_link %}
    <br>
    Looking for Commercial Support? [LEARN MORE]({{ support_link }}){ target="_blank" .bold }
    {% endif %}

{% if show_install_tab %}
=== "Install"

    {% if prerequisites %}
    {{ prerequisites | replace("\n", "\n    ") }}
    {%- else %}
    #### Prerequisites

    Deploy k0rdent {{ version }}: [QuickStart](https://docs.k0rdent.io/{{ version }}/admin/installation/install-k0rdent/){ target="_blank" }
    {%- endif %}

    {% if use_ingress %}
    Deploy [Ingress-nginx](../../../{{ version }}/apps/ingress-nginx/#install){ target="_blank" } to expose application web UI
    {%- endif %}

    {% if verify_code %}
    #### Install template to k0rdent
    {{ install_code | replace("\n", "\n    ") }}
    {% endif %}

    {% if verify_code %}
    {% if type == "infra" %}
    #### Verify cluster template
    {% else %}
    #### Verify service template
    {% endif %}
    {{ verify_code | replace("\n", "\n    ") }}
    {% endif %}

    {% if deploy_code %}
        {% if type == "infra" %}
    #### Create a cluster on {{ title }}
        {% else %}
    #### Deploy service template
        {% endif %}
    {{ deploy_code | replace("\n", "\n    ") }}
    {% endif %}

    {% if doc_link %}
    - [Official docs]({{ doc_link }}){ target="_blank" }
    {% endif %}
{% endif %}

{% if security %}
=== "Security"

    #### Aggregated CVE Summary

    This table provides an aggregated overview of known [CVEs](https://www.cve.org/About/Overview) affecting this application.

    <table>
    <thead>
        <tr>
            <th>Critical</th>
            <th>High</th>
            <th>Medium</th>
            <th>Low</th>
            <th>Unknown</th>
        </tr>
    </thead>
    <tbody>
        <tr>
            <td>{{ security.critical }}</td>
            <td>{{ security.high }}</td>
            <td>{{ security.medium }}</td>
            <td>{{ security.low }}</td>
            <td>{{ security.unknown }}</td>
        </tr>
    </tbody>
    </table>

    The counts represent the number of unique CVE identifiers detected across the entire application stack, including all associated Helm charts, container images, and underlying OS or language-level packages.
    If the same CVE appears in multiple images or packages, it is counted only once in this summary.

    The vulnerability data is generated using the [Trivy security scanner](https://trivy.dev/), which analyzes container images and their dependencies against multiple vulnerability databases. The results reflect the state of the analyzed images at the time of scanning.

    #### Severity levels
    CVEs are grouped by severity according to [standard vulnerability scoring](https://www.first.org/cvss/):

    - **Critical** – Vulnerabilities that can be easily exploited and may lead to full system compromise, remote code execution, or severe data exposure.
	- **High** – Serious vulnerabilities that could significantly impact confidentiality, integrity, or availability, often requiring prompt remediation.
	- **Medium** – Vulnerabilities with moderate impact that typically require specific conditions or configurations to be exploitable.
	- **Low** – Issues with limited impact or difficult exploitation, often informational or defense-in-depth concerns.
	- **Unknown** – CVEs for which a severity score is not available or could not be determined at the time of analysis.

    This summary is intended to provide a high-level security posture of the application.

{%- endif %}

{% if examples %}
{%- for key, example in examples.items() %}

=== "Example: {{ example.title }}"

    {% if example.content %}
    {{ example.content | replace("\n", "\n    ") }}
    {% else %}
    
    #### Prerequisites
    {% if prerequisites %}
    {{ prerequisites | replace("\n", "\n    ") }}
    {%- else %}
    Deploy k0rdent {{ version }}: [QuickStart](https://docs.k0rdent.io/{{ version }}/admin/installation/install-k0rdent/){ target="_blank" }
    {%- endif %}

    {% if example.install_code %}
    #### Install template to k0rdent
    {{ example.install_code | replace("\n", "\n    ") }}
    {% endif %}

    {% if example.verify_code %}
    #### Verify service template
    {{ example.verify_code | replace("\n", "\n    ") }}
    {% endif %}

    {% if example.deploy_code %}
    #### Deploy service template
    {{ example.deploy_code | replace("\n", "\n    ") }}
    {% endif %}

    {%- endif %}

{%- endfor %}
{%- endif %}
