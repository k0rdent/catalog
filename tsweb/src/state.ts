export var RAW:any[] = [];
export var SOLUTIONS:any[] = [];
export var INFRA:any[] = [];
export var CONFIGURATOR_SOLUTIONS:any[] = [];
export var HARDCODED_SOLUTIONS:any[] = [
];
export var _catalogLoaded = false;

// loadCatalog logic is now inline in App.doLoad() with cache-busting

export var ALL_TAGS:string[] = ["All"];
export var ALL_SUPPORT = ["All","mirantis-certified","partner","community"];

export var DEPLOY_DATA = {
  "prometheus":{deploys:18420,trend:"+12%",stars:14200,hot:true},
  "grafana":{deploys:17380,trend:"+9%",stars:13800,hot:true},
  "ingress-nginx":{deploys:16900,trend:"+7%",stars:12400,hot:true},
  "cert-manager":{deploys:15700,trend:"+8%",stars:11900,hot:true},
  "argo-cd":{deploys:14200,trend:"+15%",stars:14600,hot:true},
  "kube-prometheus-stack":{deploys:13800,trend:"+11%",stars:10200,hot:true},
  "nvidia":{deploys:12600,trend:"+28%",stars:8400,hot:true},
  "velero":{deploys:11200,trend:"+6%",stars:8800,hot:false},
  "external-secrets":{deploys:10900,trend:"+18%",stars:4200,hot:true},
  "kyverno":{deploys:10400,trend:"+14%",stars:5600,hot:true},
  "cilium":{deploys:9800,trend:"+16%",stars:10100,hot:true},
  "istio":{deploys:9600,trend:"+5%",stars:13400,hot:false},
  "harbor":{deploys:8400,trend:"+4%",stars:12400,hot:false},
  "keda":{deploys:7800,trend:"+19%",stars:8200,hot:true},
  "opentelemetry":{deploys:6600,trend:"+22%",stars:4200,hot:true},
  "kuberay":{deploys:5400,trend:"+34%",stars:3200,hot:true},
  "ollama":{deploys:5100,trend:"+41%",stars:9800,hot:true},
  "open-webui":{deploys:4900,trend:"+38%",stars:6600,hot:true},
  "kserve":{deploys:4600,trend:"+24%",stars:3400,hot:true},
  "milvus":{deploys:3800,trend:"+29%",stars:8200,hot:true},
  "qdrant":{deploys:3600,trend:"+33%",stars:6400,hot:true},
  "mlflow":{deploys:2200,trend:"+16%",stars:9400,hot:true},
};
