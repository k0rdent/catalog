#### Install template to k0rdent

{{ install_code }}

#### Verify service template

{{ verify_code }}

#### Deploy service template

{{ deploy_code }}

#### Test and Develop ML apps in Notebooks
Open Jupyter notebook:
~~~bash
open http://<cluster-ip>
# use any name to access Jupyter UI
~~~

Run Python code testing `KServe` inference workload:
~~~python
import requests
url = "http://sklearn-iris-predictor.kserve/v1/models/sklearn-iris:predict"
payload = {
    "instances": [[6.8, 2.8, 4.8, 1.4]]
}
r = requests.post(url, json=payload, timeout=30)
print(r.status_code)
print(r.text)
~~~

Run Python code testing `Ollama` local LLM service:
~~~python
import requests
r = requests.post(
    "http://ollama.ollama:11434/api/generate",
    json={
        "model": "smollm:135m",
        "prompt": "Summarize Python language pros and cons.",
        "stream": False,
    },
)
print(r.json()["response"])
~~~
