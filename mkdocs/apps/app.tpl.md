---
tags:
{%- for tag in tags %}
    - {{ tag }}
{%- endfor %}
title: {{ title }}
description: {{ summary }}
logo: "{{ logo }}"
---
![logo]({{ logo }}){ align="right", width="100" }
# {{ title }}

=== "Description"

    {{ description | replace("\n", "\n    ") }}

    {% if support_link %}
    <br>
    Looking for Commercial Support? [LEARN MORE]({{ support_link }}){ target="_blank" .bold }
    {% endif %}


=== "Install"

    #### Prerequisites

    Deploy k0rdent: [QuickStart](https://docs.k0rdent.io/v0.1.0/guide-to-quickstarts/#guide-to-quickstarts)

    #### Install template to k0rdent
    {{ install_code | replace("\n", "\n    ") }}

    {% if type == "infra" %}
    #### Verify cluster template
    {% else %}
    #### Verify service template
    {% endif %}
    {{ verify_code | replace("\n", "\n    ") }}

    {% if type == "infra" %}
    #### Create a cluster on {{ title }}
    {% else %}
    #### Deploy service template
    {% endif %}
    {{ deploy_code | replace("\n", "\n    ") }}

    {% if doc_link %}
    - [Official docs]({{ doc_link }}){ target="_blank" }
    {% endif %}
