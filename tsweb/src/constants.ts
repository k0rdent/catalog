export var DARK = {
  bg0:"#0a0e1a",bg1:"#0f1424",bg2:"#151b2e",bg3:"#1c2540",
  border:"#1e2d4a",borderHi:"#2a3f6a",
  teal:"#00c8c8",tealBg:"#00c8c810",cyan:"#00e5ff",
  textPri:"#e8edf8",textSec:"#7a8aaa",textMut:"#8e94a5",
  green:"#00d48a",amber:"#f5a623",red:"#ff4d6a",purple:"#a78bfa",
  code:"#7dd3fc",
};
export var LIGHT = {
  bg0:"#f0f4f8",bg1:"#ffffff",bg2:"#e8edf5",bg3:"#dce3ee",
  border:"#c8d3e6",borderHi:"#a0b0cc",
  teal:"#0097a7",tealBg:"#0097a710",cyan:"#0077b6",
  textPri:"#0f1e3a",textSec:"#4a5a78",textMut:"#8a9ab8",
  green:"#00875a",amber:"#b45309",red:"#c0162e",purple:"#6d28d9",
  code:"#0550ae",
};
export var B = Object.assign({}, DARK) as Record<string,string>;
export var IS_DARK = true;
export function applyTheme(dark:boolean) {
  IS_DARK = dark;
  var src = dark ? DARK : LIGHT;
  Object.keys(src).forEach(function(k){ (B as any)[k] = (src as any)[k]; });
  var hljsLink = document.getElementById("hljs-theme") as HTMLLinkElement|null;
  if (hljsLink) hljsLink.href = "https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.11.1/styles/" + (dark ? "github-dark" : "github") + ".min.css";
  document.body.style.background = B.bg0;
}
export function appendTheme(url:string):string {
  if (IS_DARK) return url;
  var sep = url.indexOf("?") >= 0 ? "&" : "?";
  return url + sep + "theme=light";
}

export var CLOUDS = ["AWS EC2","AWS EKS","Azure VM","Azure AKS","vSphere","OpenStack","Bare Metal","GCP GKE"];
export var K8S_VERS = ["1.28","1.29","1.30","1.31","1.32"];
export var CLOUD_COMPAT = {
  community:["AWS EC2","AWS EKS","Azure VM","Azure AKS","vSphere","OpenStack","Bare Metal","GCP GKE"],
  partner:["AWS EC2","AWS EKS","Azure VM","Azure AKS","vSphere","Bare Metal"],
  "mirantis-certified":["AWS EC2","AWS EKS","Azure VM","Azure AKS","vSphere","OpenStack","Bare Metal"],
};
export var K8S_COMPAT = {
  community:["1.28","1.29","1.30","1.31","1.32"],
  partner:["1.29","1.30","1.31","1.32"],
  "mirantis-certified":["1.29","1.30","1.31","1.32"],
};
export var MIRANTIS_CERTIFIED = {"amd-gpu":1,"nvidia":1,"nvidia-network-operator":1,"ceph":1,"cert-manager":1,"external-secrets":1,"mirantis-kyverno-guardrails":1,"mirantis-velero":1,"msr":1,"runai-cp":1,"stacklight":1};
export var SUPPORT_LABEL = {community:"Community",partner:"Verified Partner","mirantis-certified":"Mirantis Certified"};
export var SUPPORT_STYLE = {
  community:{bg:"#ffffff08",text:B.textSec,border:"#ffffff15"},
  partner:{bg:"#00d48a10",text:B.green,border:"#00d48a30"},
  "mirantis-certified":{bg:"#00c8c810",text:B.teal,border:"#00c8c840"},
};
export var TIER_DESC = {
  "mirantis-certified":"Fully verified and tested end-to-end with k0rdent AI Enterprise. Provided with Mirantis Enterprise Support.",
  partner:"Functionally tested and supported for use with k0rdent AI Enterprise. Eligibility for Mirantis Enterprise Support is evaluated on a case-by-case basis.",
  community:"Compatible but not supported. Intended for self-service (DIY) use without formal support.",
};
export var COMPLIANCE = {
  "cert-manager":["SOC 2","HIPAA","PCI DSS"],"external-secrets":["SOC 2","HIPAA","PCI DSS","FedRAMP"],
  "falco":["SOC 2","HIPAA","PCI DSS","FedRAMP"],"gatekeeper":["SOC 2","HIPAA","PCI DSS","FedRAMP"],
  "kyverno":["SOC 2","HIPAA","PCI DSS","FedRAMP"],"kyverno-guardrails":["SOC 2","HIPAA","PCI DSS","FedRAMP"],
  "mirantis-kyverno-guardrails":["SOC 2","HIPAA","PCI DSS","FedRAMP"],"nirmata":["SOC 2","HIPAA","PCI DSS","FedRAMP"],
  "teleport":["SOC 2","HIPAA","PCI DSS","FedRAMP"],"dex":["SOC 2","HIPAA"],"keycloak":["SOC 2","HIPAA"],
  "external-dns":["SOC 2"],"velero":["SOC 2","HIPAA"],"mirantis-velero":["SOC 2","HIPAA","PCI DSS"],
  "cloudcasa":["SOC 2","HIPAA"],"harbor":["SOC 2","PCI DSS"],"msr":["SOC 2","PCI DSS"],
  "cilium":["SOC 2","HIPAA","PCI DSS","FedRAMP"],"istio":["SOC 2","HIPAA","PCI DSS"],
  "istio-ambient":["SOC 2","HIPAA","PCI DSS"],"tetrate-istio":["SOC 2","HIPAA","PCI DSS","FedRAMP"],
  "kgateway":["SOC 2","PCI DSS"],"nginx-ingress-f5":["SOC 2","HIPAA","PCI DSS"],
  "ingress-nginx":["SOC 2","PCI DSS"],"traefik":["SOC 2"],"envoy-gateway":["SOC 2","PCI DSS"],
  "prometheus":["SOC 2"],"kube-prometheus-stack":["SOC 2"],"grafana":["SOC 2"],"loki":["SOC 2","HIPAA"],
  "tempo":["SOC 2"],"opentelemetry":["SOC 2","HIPAA"],"datadog":["SOC 2","HIPAA","PCI DSS"],
  "stacklight":["SOC 2","HIPAA"],"node-feature-discovery":["SOC 2"],"opencost":["SOC 2"],
  "kubecost":["SOC 2"],"finops-agent":["SOC 2"],"postgresql":["SOC 2","HIPAA","PCI DSS"],
  "postgresql-operator":["SOC 2","HIPAA","PCI DSS"],"mysql":["SOC 2","HIPAA","PCI DSS"],
  "mongodb":["SOC 2","HIPAA"],"redis":["SOC 2","HIPAA","PCI DSS"],"valkey":["SOC 2"],
  "milvus":["SOC 2"],"qdrant":["SOC 2"],"arangodb":["SOC 2"],"influxdb":["SOC 2","HIPAA"],
  "minio":["SOC 2","HIPAA","PCI DSS"],"ceph":["SOC 2","HIPAA","PCI DSS","FedRAMP"],
  "netapp":["SOC 2","HIPAA","PCI DSS"],"hpe-csi":["SOC 2","PCI DSS"],"pure":["SOC 2","PCI DSS"],
  "dell":["SOC 2","PCI DSS"],"elasticsearch":["SOC 2","HIPAA"],"argo-cd":["SOC 2"],
  "flux-operator":["SOC 2"],"gitlab":["SOC 2","HIPAA"],"jenkins":["SOC 2"],"harness":["SOC 2","HIPAA"],
  "nvidia":["SOC 2"],"amd-gpu":["SOC 2"],"kuberay":["SOC 2"],"kserve":["SOC 2","HIPAA"],
  "clearml":["SOC 2"],"mlflow":["SOC 2","HIPAA"],"wandb":["SOC 2"],"runai-cp":["SOC 2"],
  "soperator":["SOC 2"],"jupyterhub":["SOC 2","HIPAA"],
};
export var COMPLIANCE_STYLE = {
  "SOC 2":{bg:"#00c8c812",text:"#00c8c8",border:"#00c8c830"},
  "HIPAA":{bg:"#a78bfa12",text:"#a78bfa",border:"#a78bfa30"},
  "PCI DSS":{bg:"#f5a62312",text:"#f5a623",border:"#f5a62330"},
  "FedRAMP":{bg:"#00d48a12",text:"#00d48a",border:"#00d48a30"},
};
export var TAG_ACCENTS = {
  "AI/ML":"#38bdf8","AI/Machine Learning":"#38bdf8","Monitoring":"#f59e0b","Security":"#a78bfa","Networking":"#38bdf8",
  "Database":"#34d399","Storage":"#00e5ff","CI/CD":"#f472b6","Backup":"#fb923c",
  "Auth":"#818cf8","Autoscaling":"#6ee7b7","Serverless":"#67e8f9","Runtime":"#a3e635",
  "Drivers":"#94a3b8","Registry":"#e879f9","Developer Tools":"#fbbf24","Other":"#7a8aaa",
  "Observability":"#f59e0b",
};
export function tagAccent(t) { return TAG_ACCENTS[t] || "#7a8aaa"; }

export var SIMPLE_ICONS = {
  "amd-gpu":"amd","apisix":"apacheapisix","argo-cd":"argo","cadvisor":"google","ceph":"ceph","clearml":"clearml","nvidia":"nvidia","grafana":"grafana","prometheus":"prometheus",
  "gitlab":"gitlab","datadog":"datadog","jenkins":"jenkins","harbor":"harbor",
  "istio":"istio","cilium":"cilium","velero":"velero","falco":"falco",
  "keycloak":"keycloak","minio":"minio","postgresql":"postgresql",
  "mysql":"mysql","mongodb":"mongodb","redis":"redis","elasticsearch":"elasticsearch",
  "influxdb":"influxdb","loki":"grafana","tempo":"grafana","alloy":"grafana",
  "kube-prometheus-stack":"prometheus","kiali":"istio",
  "flux-operator":"flux","gitops":"flux","qdrant":"qdrant","mlflow":"mlflow",
  "kuberay":"ray","wandb":"weightsandbiases","jupyterhub":"jupyter",
  "traefik":"traefik","cert-manager":"letsencrypt","teleport":"teleport",
  "github":"github","n8n":"n8n","nats":"natsdotio","rabbitmq":"rabbitmq",
  "kafka":"apachekafka","strimzi-kafka-operator":"apachekafka",
  "kubeflow-spark-operator":"apachespark","tika":"apache",
  "opentelemetry":"opentelemetry","dapr":"dapr","knative":"knative",
  "victoria":"victoriametrics","victoriametrics":"victoriametrics",
  "penpot":"penpot","ollama":"ollama","open-webui":"openai",
  "keda":"keda","arangodb":"arangodb","netapp":"netapp","dell":"dell",
  "cloudcasa":"veeam","milvus":"milvus","dex":"dex",
};

export var BRAND_COLORS = {
  "amd-gpu":"#ED1C24","apisix":"#E8353C","cadvisor":"#4285F4","ceph":"#EF5C55","clearml":"#EB4F52","nvidia":"#76B900","grafana":"#F46800","prometheus":"#E6522C",
  "gitlab":"#FC6D26","datadog":"#632CA6","jenkins":"#D33833","harbor":"#60B932",
  "istio":"#466BB0","cilium":"#F8C517","velero":"#3DAE2B","falco":"#00AEC7",
  "keycloak":"#4D4D4D","minio":"#C72C48","postgresql":"#336791","mysql":"#4479A1",
  "mongodb":"#47A248","redis":"#FF4438","elasticsearch":"#005571",
  "influxdb":"#22ADF6","flux-operator":"#5468FF","qdrant":"#24386C",
  "mlflow":"#0194E2","kuberay":"#028CF0","wandb":"#FFBE00","jupyterhub":"#F37726",
  "traefik":"#24A1C1","teleport":"#512FC9","n8n":"#EA4B71","rabbitmq":"#FF6600",
  "strimzi-kafka-operator":"#231F20","kubeflow-spark-operator":"#E25A1C",
  "opentelemetry":"#F5A800","dapr":"#0D2192","knative":"#0865AD",
  "penpot":"#7238F8","keda":"#326CE5","arangodb":"#68B637",
  "victoriametrics":"#621773","loki":"#F46800","tempo":"#F46800","alloy":"#F46800",
  "kube-prometheus-stack":"#E6522C","kiali":"#466BB0","nats":"#27AAE1",
  "milvus":"#00A1EA","dell":"#007DB8","netapp":"#0067C5","tika":"#D22128",
};

export var LOGO_CACHE = {};

export function getLogoUrl(name) {
  var slug = SIMPLE_ICONS[name];
  if (!slug) return null;
  return "https://cdn.jsdelivr.net/npm/simple-icons@latest/icons/" + slug + ".svg";
}

export var CLOUD_PRICING = {
  aws:       { cpu_hr:0.048,  gpu_hr:2.20,  mem_gb_hr:0.006, storage_gb_mo:0.023, egress_gb:0.09,  label:"AWS"   },
  azure:     { cpu_hr:0.052,  gpu_hr:2.48,  mem_gb_hr:0.007, storage_gb_mo:0.020, egress_gb:0.087, label:"Azure" },
  vsphere:   { cpu_hr:0.018,  gpu_hr:1.10,  mem_gb_hr:0.003, storage_gb_mo:0.010, egress_gb:0.01,  label:"vSphere (on-prem)" },
  baremetal: { cpu_hr:0.012,  gpu_hr:0.85,  mem_gb_hr:0.002, storage_gb_mo:0.008, egress_gb:0.005, label:"Bare Metal" },
  hybrid:    { cpu_hr:0.035,  gpu_hr:1.65,  mem_gb_hr:0.005, storage_gb_mo:0.016, egress_gb:0.05,  label:"Hybrid" },
};
export var APP_RESOURCES = {
  "nvidia":{cpu:2,gpu:0,mem:4,storage:10},"kserve":{cpu:4,gpu:2,mem:16,storage:50},
  "ollama":{cpu:4,gpu:1,mem:16,storage:100},"open-webui":{cpu:1,gpu:0,mem:2,storage:5},
  "keda":{cpu:1,gpu:0,mem:1,storage:2},"lws":{cpu:2,gpu:0,mem:4,storage:5},
  "mlflow":{cpu:2,gpu:0,mem:4,storage:20},"kuberay":{cpu:8,gpu:4,mem:32,storage:50},
  "kubeflow-spark-operator":{cpu:8,gpu:0,mem:16,storage:100},"minio":{cpu:2,gpu:0,mem:4,storage:500},
  "jupyterhub":{cpu:2,gpu:0,mem:8,storage:20},"qdrant":{cpu:4,gpu:0,mem:16,storage:100},
  "milvus":{cpu:4,gpu:0,mem:16,storage:200},"tika":{cpu:2,gpu:0,mem:4,storage:10},
  "redis":{cpu:1,gpu:0,mem:4,storage:10},"strimzi-kafka-operator":{cpu:4,gpu:0,mem:8,storage:100},
  "postgresql":{cpu:2,gpu:0,mem:8,storage:50},"influxdb":{cpu:2,gpu:0,mem:4,storage:50},
  "kube-prometheus-stack":{cpu:4,gpu:0,mem:8,storage:50},"grafana":{cpu:1,gpu:0,mem:2,storage:10},
  "loki":{cpu:2,gpu:0,mem:4,storage:100},"tempo":{cpu:2,gpu:0,mem:4,storage:50},
  "opencost":{cpu:1,gpu:0,mem:2,storage:5},"finops-agent":{cpu:1,gpu:0,mem:1,storage:2},
  "falco":{cpu:1,gpu:0,mem:2,storage:5},"kyverno":{cpu:1,gpu:0,mem:2,storage:2},
  "external-secrets":{cpu:1,gpu:0,mem:1,storage:1},"teleport":{cpu:2,gpu:0,mem:4,storage:10},
  "cert-manager":{cpu:1,gpu:0,mem:1,storage:1},"gatekeeper":{cpu:1,gpu:0,mem:2,storage:1},
  "argo-cd":{cpu:2,gpu:0,mem:4,storage:10},"ingress-nginx":{cpu:2,gpu:0,mem:2,storage:2},
  "cluster-autoscaler":{cpu:1,gpu:0,mem:1,storage:1},"velero":{cpu:1,gpu:0,mem:2,storage:20},
  "n8n":{cpu:1,gpu:0,mem:2,storage:5},"prometheus":{cpu:2,gpu:0,mem:4,storage:50},
};
export function getAppRes(name) {
  return APP_RESOURCES[name] || {cpu:1,gpu:0,mem:2,storage:5};
}

export function estimateCost(stackItems, cloud, clusters, hoursPerMonth) {
  var pricing = CLOUD_PRICING[cloud] || CLOUD_PRICING.aws;
  var hrs = hoursPerMonth || 730;
  var breakdown = [];
  var totalMonthly = 0;
  for (var i=0; i<stackItems.length; i++) {
    var res = getAppRes(stackItems[i].name);
    var cpuCost     = res.cpu  * pricing.cpu_hr      * hrs;
    var gpuCost2    = res.gpu  * pricing.gpu_hr      * hrs;
    var memCost     = res.mem  * pricing.mem_gb_hr   * hrs;
    var storageCost = res.storage * pricing.storage_gb_mo;
    var appTotal    = (cpuCost + gpuCost2 + memCost + storageCost) * clusters;
    totalMonthly   += appTotal;
    breakdown.push({name:stackItems[i].name,cpu:res.cpu,gpu:res.gpu,mem:res.mem,storage:res.storage,monthly:appTotal,isGpu:res.gpu>0});
  }
  breakdown.sort(function(a,b){return b.monthly-a.monthly;});
  var topCost = breakdown.length ? breakdown[0].monthly : 1;
  return {breakdown:breakdown,total:totalMonthly,topCost:topCost,pricing:pricing};
}

export var INFRA_FILTERS = [{key:"All",label:"All"},{key:"public",label:"Public Cloud"},{key:"private",label:"Private Cloud / On-premises"}];
export var INFRA_GROUPS = [{key:"public",label:"Public Cloud",color:"#00c8c8"},{key:"private",label:"Private Cloud / On-premises",color:"#a78bfa"}];

export var CONTRIB_STEPS = [
  {n:1,title:"Fork the repository",body:"Fork the k0rdent catalog repository to your GitHub account. Enable GitHub Actions and GitHub Pages (Settings > Pages > branch: gh-pages) so your changes preview on every push.",code:"git clone https://github.com/YOUR_USERNAME/catalog.git\ncd catalog"},
  {n:2,title:"Create application Helm charts",body:"Inside your app folder create a charts/ directory. Add st-charts.yaml defining the upstream chart source, then generate charts automatically.",code:"# st-charts.yaml\nst-charts:\n  - name: my-app\n    dep_name: my-app\n    version: 1.0.0\n    repository: https://charts.example.com/\n\nsource ./scripts/setup_python.sh\npython3 ./scripts/chart_ctl.py generate my-app"},
  {n:3,title:"Create application metadata",body:"Create an assets/ folder with your logo (SVG preferred). Then create data.yaml with required fields: title, tags, summary, logo, description, charts, deploy_code, and created timestamp.",code:"title: \"My App\"\ntags:\n  - Monitoring\nsummary: \"Brief description.\"\nlogo: \"./assets/icon.svg\"\ncreated: \"2026-03-16T10:00:00Z\"\ndescription: |\n  Full description..."},
  {n:4,title:"Add a Helm chart example",body:"Add an example/ folder with Chart.yaml and values.yaml used for automated CI testing across AWS, Azure, vSphere, and local environments.",code:"# example/Chart.yaml\napiVersion: v2\nname: example\ntype: application\nversion: 1.0.0\ndependencies:\n  - name: my-app\n    version: 1.0.0\n    repository: oci://ghcr.io/k0rdent/catalog/charts"},
  {n:5,title:"Validate and spell-check",body:"Run the spell-check script. Add unknown words to hunspell_dict.txt. Re-run until you see Spell check OK.",code:"docker run --rm -it -v $(pwd):/catalog -w /catalog \\\n  ghcr.io/josca/hunspell:latest scripts/spellcheck.sh my-app"},
  {n:6,title:"Commit, push, and open a PR",body:"Commit and push to your fork. Open a Pull Request against the main k0rdent catalog repository with a clear title explaining the application.",code:"git add ./apps/my-app\ngit commit -m \"feat: add my-app integration\"\ngit push origin main"},
];
export var ALLOWED_TAGS = ["AI/Machine Learning","Application Runtime","Authentication","Backup and Recovery","CI/CD","Container Registry","Database","Developer Tools","Drivers and plugins","Monitoring","Networking","Security","Serverless","Storage"];

export var scanThStyle:any = {padding:"7px 10px",fontSize:10,fontWeight:600,color:B.textMut,textTransform:"uppercase",letterSpacing:"0.05em",textAlign:"left",borderBottom:"1px solid "+B.border,background:B.bg2};
export var scanTdStyle:any = {padding:"6px 10px",fontSize:11,color:B.textPri,borderBottom:"1px solid "+B.border};
