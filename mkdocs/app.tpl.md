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
---
![logo]({{ logo }}){ align="right", width="100" }
# {{ title }}

=== "Description"

    {{ description | replace("\n", "\n    ") }}

    {% if support_link %}
    <br>
    Looking for Commercial Support? [LEARN MORE]({{ support_link }}){ target="_blank" .bold }
    {% endif %}

{% if support_type != "Enterprise" %}
=== "Install"

    #### Prerequisites

    Deploy k0rdent: [QuickStart](https://docs.k0rdent.io/v0.1.0/guide-to-quickstarts/#guide-to-quickstarts){ target="_blank" }

    {% if use_ingress %}
    Deploy [Ingress-nginx](../../../apps/ingress-nginx/ingress-nginx/#__tabbed_1_2){ target="_blank" } to expose application web UI
    {%- endif %}

    #### Install template to k0rdent
    {{ install_code | replace("\n", "\n    ") }}

    {% if type == "infra" %}
    #### Verify cluster template
    {% else %}
    #### Verify service template
    {% endif %}
    {{ verify_code | replace("\n", "\n    ") }}

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
