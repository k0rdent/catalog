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

{% if examples %}
{%- for key, example in examples.items() %}

=== "Solution: {{ example.title }}"

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
