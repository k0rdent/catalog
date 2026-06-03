# AI Data Platform

A composable data platform for AI teams needing reliable storage, messaging,
and workflow orchestration for training pipelines. Supports the full data
lifecycle from ingestion to model-ready datasets.

#### Install template to k0rdent

{{ install_code }}

#### Verify service template

{{ verify_code }}

#### Deploy service

{{ deploy_code }}

#### Verify MinIO object storage

~~~bash
# Port-forward MinIO console
kubectl port-forward svc/minio -n minio 9001:9001

# Access MinIO Console at http://localhost:9001
# Default credentials are set in the Helm values
~~~

#### Verify Milvus vector database

~~~bash
# Port-forward Milvus
kubectl port-forward svc/milvus -n milvus 19530:19530

# Test connection with Python
python3 -c "
from pymilvus import connections
connections.connect('default', host='localhost', port='19530')
print('Milvus connected')
"
~~~

#### Verify Kafka streaming

~~~bash
# Create a test topic
kubectl exec -n kafka -it kafka-cluster-kafka-0 -- \
  bin/kafka-topics.sh --create --topic test-topic \
  --bootstrap-server localhost:9092

# List topics
kubectl exec -n kafka -it kafka-cluster-kafka-0 -- \
  bin/kafka-topics.sh --list \
  --bootstrap-server localhost:9092
~~~
