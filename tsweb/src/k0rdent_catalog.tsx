import React, { useState, useMemo, useEffect } from "react";

var DARK = {
  bg0:"#0a0e1a",bg1:"#0f1424",bg2:"#151b2e",bg3:"#1c2540",
  border:"#1e2d4a",borderHi:"#2a3f6a",
  teal:"#00c8c8",tealBg:"#00c8c810",cyan:"#00e5ff",
  textPri:"#e8edf8",textSec:"#7a8aaa",textMut:"#8e94a5",
  green:"#00d48a",amber:"#f5a623",red:"#ff4d6a",purple:"#a78bfa",
  code:"#7dd3fc",
};
var LIGHT = {
  bg0:"#f0f4f8",bg1:"#ffffff",bg2:"#e8edf5",bg3:"#dce3ee",
  border:"#c8d3e6",borderHi:"#a0b0cc",
  teal:"#0097a7",tealBg:"#0097a710",cyan:"#0077b6",
  textPri:"#0f1e3a",textSec:"#4a5a78",textMut:"#8a9ab8",
  green:"#00875a",amber:"#b45309",red:"#c0162e",purple:"#6d28d9",
  code:"#0550ae",
};
var B = Object.assign({}, DARK) as Record<string,string>;
var IS_DARK = true;
function applyTheme(dark:boolean) {
  IS_DARK = dark;
  var src = dark ? DARK : LIGHT;
  Object.keys(src).forEach(function(k){ (B as any)[k] = (src as any)[k]; });
  var hljsLink = document.getElementById("hljs-theme") as HTMLLinkElement|null;
  if (hljsLink) hljsLink.href = "https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.11.1/styles/" + (dark ? "github-dark" : "github") + ".min.css";
  document.body.style.background = B.bg0;
}
function appendTheme(url:string):string {
  if (IS_DARK) return url;
  var sep = url.indexOf("?") >= 0 ? "&" : "?";
  return url + sep + "theme=light";
}

var CLOUDS = ["AWS EC2","AWS EKS","Azure VM","Azure AKS","vSphere","OpenStack","Bare Metal","GCP GKE"];
var K8S_VERS = ["1.28","1.29","1.30","1.31","1.32"];
var CLOUD_COMPAT = {
  community:["AWS EC2","AWS EKS","Azure VM","Azure AKS","vSphere","OpenStack","Bare Metal","GCP GKE"],
  partner:["AWS EC2","AWS EKS","Azure VM","Azure AKS","vSphere","Bare Metal"],
  "mirantis-certified":["AWS EC2","AWS EKS","Azure VM","Azure AKS","vSphere","OpenStack","Bare Metal"],
};
var K8S_COMPAT = {
  community:["1.28","1.29","1.30","1.31","1.32"],
  partner:["1.29","1.30","1.31","1.32"],
  "mirantis-certified":["1.29","1.30","1.31","1.32"],
};
var MIRANTIS_CERTIFIED = {"amd-gpu":1,"nvidia":1,"nvidia-network-operator":1,"ceph":1,"cert-manager":1,"external-secrets":1,"mirantis-kyverno-guardrails":1,"mirantis-velero":1,"msr":1,"runai-cp":1,"stacklight":1};
var SUPPORT_LABEL = {community:"Community",partner:"Verified Partner","mirantis-certified":"Mirantis Certified"};
var SUPPORT_STYLE = {
  community:{bg:"#ffffff08",text:B.textSec,border:"#ffffff15"},
  partner:{bg:"#00d48a10",text:B.green,border:"#00d48a30"},
  "mirantis-certified":{bg:"#00c8c810",text:B.teal,border:"#00c8c840"},
};
var TIER_DESC = {
  "mirantis-certified":"Fully verified and tested end-to-end with k0rdent AI Enterprise. Provided with Mirantis Enterprise Support.",
  partner:"Functionally tested and supported for use with k0rdent AI Enterprise. Eligibility for Mirantis Enterprise Support is evaluated on a case-by-case basis.",
  community:"Compatible but not supported. Intended for self-service (DIY) use without formal support.",
};
var COMPLIANCE = {
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
var COMPLIANCE_STYLE = {
  "SOC 2":{bg:"#00c8c812",text:"#00c8c8",border:"#00c8c830"},
  "HIPAA":{bg:"#a78bfa12",text:"#a78bfa",border:"#a78bfa30"},
  "PCI DSS":{bg:"#f5a62312",text:"#f5a623",border:"#f5a62330"},
  "FedRAMP":{bg:"#00d48a12",text:"#00d48a",border:"#00d48a30"},
};
var TAG_ACCENTS = {
  "AI/ML":"#38bdf8","AI/Machine Learning":"#38bdf8","Monitoring":"#f59e0b","Security":"#a78bfa","Networking":"#38bdf8",
  "Database":"#34d399","Storage":"#00e5ff","CI/CD":"#f472b6","Backup":"#fb923c",
  "Auth":"#818cf8","Autoscaling":"#6ee7b7","Serverless":"#67e8f9","Runtime":"#a3e635",
  "Drivers":"#94a3b8","Registry":"#e879f9","Developer Tools":"#fbbf24","Other":"#7a8aaa",
  "Observability":"#f59e0b",
};
function tagAccent(t) { return TAG_ACCENTS[t] || "#7a8aaa"; }

var SIMPLE_ICONS = {
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

var BRAND_COLORS = {
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

var LOGO_CACHE = {};

function getLogoUrl(name) {
  var slug = SIMPLE_ICONS[name];
  if (!slug) return null;
  return "https://cdn.jsdelivr.net/npm/simple-icons@latest/icons/" + slug + ".svg";
}

function AppLogo({ name, size, accent, logo, brandColor, isInfra }:{ name:string, size?:number, accent?:string, logo?:string, brandColor?:string, isInfra?:boolean }) {
  var sz = size || 32;
  var [svgContent, setSvgContent] = React.useState(LOGO_CACHE[name] || null);
  var [failed, setFailed] = React.useState(false);
  var color = brandColor || BRAND_COLORS[name] || accent || "#7a8aaa";
  var bg = "#ffffff";
  var logoBorder = isInfra && brandColor ? "2px solid " + brandColor : "none";
  var border = color + "30";

  // If catalog data provides a logo URL, use it directly as an <img>
  if (logo) {
    var logoSrc = logo.startsWith("http") ? logo : BASE + logo;
    return (
      <div style={{width:sz,height:sz,borderRadius:sz>36?9:7,background:bg,border:logoBorder,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,padding:sz>36?5:3,boxSizing:"border-box"}}>
        <img src={logoSrc} alt={name} style={{width:sz-10,height:sz-10,objectFit:"contain"}} />
      </div>
    );
  }

  // Fallback: fetch from SimpleIcons CDN
  React.useEffect(function() {
    if (svgContent || failed) return;
    var url = getLogoUrl(name);
    if (!url) { setFailed(true); return; }
    if (LOGO_CACHE[name]) { setSvgContent(LOGO_CACHE[name]); return; }
    fetch(url)
      .then(function(r) { return r.ok ? r.text() : Promise.reject(); })
      .then(function(txt) {
        var filled = txt.replace(/(<svg[^>]*)(>)/, function(m, p1, p2) {
          if (p1.indexOf("fill") === -1) return p1 + ' fill="' + color + '"' + p2;
          return m;
        });
        LOGO_CACHE[name] = filled;
        setSvgContent(filled);
      })
      .catch(function() { setFailed(true); });
  }, [name]);

  var parts = name.replace(/-/g," ").split(" ");
  var initials = "";
  for (var pi=0;pi<Math.min(2,parts.length);pi++) initials+=parts[pi][0].toUpperCase();

  if (svgContent && !failed) {
    return (
      <div style={{width:sz,height:sz,borderRadius:sz>36?9:7,background:bg,border:logoBorder,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,padding:sz>36?7:5,boxSizing:"border-box"}}
        dangerouslySetInnerHTML={{__html:svgContent.replace(/width="[^"]*"/, 'width="'+(sz-10)+'"').replace(/height="[^"]*"/, 'height="'+(sz-10)+'"')}}
      />
    );
  }

  return (
    <div style={{width:sz,height:sz,borderRadius:sz>36?9:7,background:bg,border:logoBorder,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,fontSize:sz>36?13:11,fontWeight:700,color:color,fontFamily:"monospace"}}>
      {initials}
    </div>
  );
}

function getEff(item) {
  if (MIRANTIS_CERTIFIED[item.name]) return "mirantis-certified";
  if (item.support === "enterprise") return "mirantis-certified";
  return item.support;
}

var DEPLOY_DATA = {
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
function deployStats(name) {
  if (DEPLOY_DATA[name]) return DEPLOY_DATA[name];
  var seed = 0;
  for (var i = 0; i < name.length; i++) seed += name.charCodeAt(i);
  return {deploys:200+(seed*37)%1800,trend:"+"+(1+(seed*13)%18)+"%",stars:0,hot:false};
}
function fmtNum(n) { return n >= 1000 ? (n/1000).toFixed(1)+"k" : String(n); }

// ciResults removed — replaced by real validated_* data from catalog.json
var STATUS_STYLE = {
  pass:{bg:"#00d48a18",text:"#00d48a",border:"#00d48a30",label:"Pass"},
  fail:{bg:"#ff4d6a18",text:"#ff4d6a",border:"#ff4d6a30",label:"Fail"},
  skip:{bg:"#f5a62318",text:"#f5a623",border:"#f5a62330",label:"Skip"},
  pending:{bg:"#3d4d6a30",text:"#7a8aaa",border:"#3d4d6a50",label:"Pending"},
  "n/a":{bg:"transparent",text:"#3d4d6a",border:"transparent",label:"n/a"},
};

function CIBadge({ s }) {
  var st = STATUS_STYLE[s] || STATUS_STYLE["n/a"];
  var icon = s==="pass"?"✓":s==="fail"?"✕":s==="skip"?"~":"…";
  return (
    <span style={{fontSize:9,padding:"1px 5px",borderRadius:3,background:st.bg,color:st.text,border:"1px solid "+st.border,fontWeight:600,fontFamily:"monospace"}}>
      {icon}
    </span>
  );
}

var RAW:any[] = [];
var SOLUTIONS:any[] = [];
var INFRA:any[] = [];
var CONFIGURATOR_SOLUTIONS:any[] = [];
var HARDCODED_SOLUTIONS:any[] = [
];
var _catalogLoaded = false;

// loadCatalog logic is now inline in App.doLoad() with cache-busting

var ALL_TAGS:string[] = ["All"];
var ALL_SUPPORT = ["All","mirantis-certified","partner","community"];

var CONTRIB_STEPS = [
  {n:1,title:"Fork the repository",body:"Fork the k0rdent catalog repository to your GitHub account. Enable GitHub Actions and GitHub Pages (Settings > Pages > branch: gh-pages) so your changes preview on every push.",code:"git clone https://github.com/YOUR_USERNAME/catalog.git\ncd catalog"},
  {n:2,title:"Create application Helm charts",body:"Inside your app folder create a charts/ directory. Add st-charts.yaml defining the upstream chart source, then generate charts automatically.",code:"# st-charts.yaml\nst-charts:\n  - name: my-app\n    dep_name: my-app\n    version: 1.0.0\n    repository: https://charts.example.com/\n\nsource ./scripts/setup_python.sh\npython3 ./scripts/chart_ctl.py generate my-app"},
  {n:3,title:"Create application metadata",body:"Create an assets/ folder with your logo (SVG preferred). Then create data.yaml with required fields: title, tags, summary, logo, description, charts, deploy_code, and created timestamp.",code:"title: \"My App\"\ntags:\n  - Monitoring\nsummary: \"Brief description.\"\nlogo: \"./assets/icon.svg\"\ncreated: \"2026-03-16T10:00:00Z\"\ndescription: |\n  Full description..."},
  {n:4,title:"Add a Helm chart example",body:"Add an example/ folder with Chart.yaml and values.yaml used for automated CI testing across AWS, Azure, vSphere, and local environments.",code:"# example/Chart.yaml\napiVersion: v2\nname: example\ntype: application\nversion: 1.0.0\ndependencies:\n  - name: my-app\n    version: 1.0.0\n    repository: oci://ghcr.io/k0rdent/catalog/charts"},
  {n:5,title:"Validate and spell-check",body:"Run the spell-check script. Add unknown words to hunspell_dict.txt. Re-run until you see Spell check OK.",code:"docker run --rm -it -v $(pwd):/catalog -w /catalog \\\n  ghcr.io/josca/hunspell:latest scripts/spellcheck.sh my-app"},
  {n:6,title:"Commit, push, and open a PR",body:"Commit and push to your fork. Open a Pull Request against the main k0rdent catalog repository with a clear title explaining the application.",code:"git add ./apps/my-app\ngit commit -m \"feat: add my-app integration\"\ngit push origin main"},
];
var ALLOWED_TAGS = ["AI/Machine Learning","Application Runtime","Authentication","Backup and Recovery","CI/CD","Container Registry","Database","Developer Tools","Drivers and plugins","Monitoring","Networking","Security","Serverless","Storage"];

function installCmd(item, ver) {
  return "helm upgrade --install " + item.name + " oci://ghcr.io/k0rdent/catalog/charts/kgst \\\n  --set \"chart=" + item.chartName + ":" + ver + "\" \\\n  -n kcm-system";
}
function verifyCmd(item, ver) {
  var slug = (item.chartName + "-" + ver).replace(/\./g, "-");
  return "kubectl get servicetemplates -A\n# kcm-system   " + slug + "   true";
}
function deployYamlFn(item, ver) {
  var slug = (item.chartName + "-" + ver).replace(/\./g, "-");
  return "apiVersion: k0rdent.mirantis.com/v1beta1\nkind: MultiClusterService\nmetadata:\n  name: " + item.name + "\nspec:\n  clusterSelector:\n    matchLabels:\n      group: demo\n  serviceSpec:\n    services:\n    - template: " + slug + "\n      name: " + item.name + "\n      namespace: " + item.name;
}

function CodeBlock({ text }) {
  var [copied, setCopied] = useState(false);
  function doCopy() {
    if (navigator.clipboard) navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(function(){ setCopied(false); }, 1500);
  }
  return (
    <div style={{position:"relative",marginBottom:8}}>
      <pre style={{background:B.bg2,border:"1px solid "+B.border,borderRadius:7,padding:"12px 14px",fontSize:11,color:B.code,fontFamily:"monospace",lineHeight:1.6,overflowX:"auto",margin:0,whiteSpace:"pre"}}>{text}</pre>
      <button onClick={doCopy} style={{position:"absolute",top:6,right:6,background:copied?B.green+"30":B.bg2,border:"1px solid "+B.borderHi,borderRadius:5,padding:"2px 8px",fontSize:9.5,color:copied?B.green:B.textSec,cursor:"pointer",fontFamily:"inherit"}}>{copied?"Copied":"Copy"}</button>
    </div>
  );
}

function TestResults({ item }) {
  var v = item.validated || {};
  var architectures = [
    {key:"amd64", label:"AMD64", icon:"🖥"},
    {key:"arm64", label:"ARM64", icon:"📱"},
  ];
  var providers = [
    {key:"aws", label:"AWS", icon:"☁"},
    {key:"azure", label:"Azure", icon:"☁"},
    {key:"local", label:"Bare Metal", icon:"💻"},
  ];
  var allPlatforms = architectures.concat(providers);
  var passed=0, failed=0, pending=0;
  for (var pi=0;pi<allPlatforms.length;pi++){
    var val=v[allPlatforms[pi].key]||"-";
    if(val==="y")passed++;
    else if(val==="n")failed++;
    else pending++;
  }
  function renderTable(title:string, items:any[]) {
    return (
      <div style={{marginBottom:14}}>
        <div style={{fontSize:9.5,fontWeight:600,color:B.textMut,textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:6}}>{title}</div>
        <div style={{border:"1px solid "+B.border,borderRadius:8,overflow:"hidden"}}>
          <table style={{width:"100%",borderCollapse:"collapse"}}>
            <tbody>
              {items.map(function(p,pi){
                var val=v[p.key]||"-";
                var color=val==="y"?B.green:val==="n"?B.red:B.textMut;
                var label=val==="y"?"Validated":val==="n"?"Unsupported":"To be tested";
                var icon=val==="y"?"✓":val==="n"?"✕":"—";
                return (
                  <tr key={p.key} style={{borderTop:pi>0?"1px solid "+B.border:"none",background:pi%2===0?B.bg2+"40":"transparent"}}>
                    <td style={{padding:"9px 10px",fontSize:12,color:B.textPri,fontWeight:500}}><span style={{marginRight:6}}>{p.icon}</span>{p.label}</td>
                    <td style={{padding:"9px 10px",textAlign:"center"}}>
                      <span style={{fontSize:10,padding:"2px 8px",borderRadius:4,background:color+"18",color:color,border:"1px solid "+color+"30",fontWeight:600}}>{icon} {label}</span>
                    </td>
                  </tr>
                );
            })}
            </tbody>
          </table>
        </div>
      </div>
    );
  }
  return (
    <div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8,marginBottom:14}}>
        {[{n:passed,l:"Validated",c:B.green},{n:failed,l:"Unsupported",c:B.red},{n:pending,l:"To be tested",c:B.textMut}].map(function(s){
          return <div key={s.l} style={{background:B.bg2,border:"1px solid "+B.border,borderRadius:8,padding:"10px",textAlign:"center"}}><div style={{fontSize:18,fontWeight:700,color:s.c,fontFamily:"monospace"}}>{s.n}</div><div style={{fontSize:10,color:B.textMut,marginTop:2}}>{s.l}</div></div>;
        })}
      </div>
      {renderTable("Architecture", architectures)}
      {renderTable("Provider", providers)}
    </div>
  );
}

function sevColor(sev:string) {
  if (sev === "critical" || sev === "CRITICAL") return "#ff4d6a";
  if (sev === "high" || sev === "HIGH") return "#ff8c00";
  if (sev === "medium" || sev === "MEDIUM") return "#ffcc00";
  return B.textMut;
}

function useScanData(itemName:string, k0rdentVer?:string) {
  var [scanData, setScanData] = useState<any>(null);
  var [loading, setLoading] = useState(true);
  var [error, setError] = useState("");
  useEffect(function(){
    setLoading(true); setError("");
    fetch(dataPrefix(k0rdentVer || "") + "apps/" + itemName + "/scan.json?t=" + Date.now())
      .then(function(r){ if (!r.ok) throw new Error("HTTP " + r.status); return r.json(); })
      .then(function(d){ setScanData(d); setLoading(false); })
      .catch(function(e){ setError(String(e)); setLoading(false); });
  }, [itemName]);
  return {scanData, loading, error};
}

function scanVersions(scanData:any) {
  if (!scanData || !scanData.charts) return [];
  var chartNames = Object.keys(scanData.charts);
  var all:string[] = [];
  for (var ci=0;ci<chartNames.length;ci++){
    var vs = scanData.charts[chartNames[ci]].versions;
    for (var vi=0;vi<vs.length;vi++){
      if (all.indexOf(vs[vi]) === -1) all.push(vs[vi]);
    }
  }
  all.sort(function(a,b){
    var pa=a.split("."), pb=b.split(".");
    for(var i=0;i<Math.max(pa.length,pb.length);i++){
      var na=parseInt(pa[i]||"0"), nb=parseInt(pb[i]||"0");
      if(na!==nb) return nb-na;
    }
    return 0;
  });
  return all;
}

function ScanVersionPicker({ allVersions, effectiveVer, setSelVer }:any) {
  return (
    <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:16}}>
      <span style={{fontSize:12,color:B.textSec}}>Version:</span>
      <select value={effectiveVer} onChange={function(e:any){setSelVer(e.target.value);}} style={{padding:"5px 9px",border:"1px solid "+B.borderHi,borderRadius:5,background:B.bg3,color:B.textPri,fontSize:12,outline:"none",cursor:"pointer",fontFamily:"monospace"}}>
        {allVersions.map(function(v:string){return <option key={v} value={v}>{v}</option>;})}
      </select>
    </div>
  );
}

var scanThStyle:any = {padding:"7px 10px",fontSize:10,fontWeight:600,color:B.textMut,textTransform:"uppercase",letterSpacing:"0.05em",textAlign:"left",borderBottom:"1px solid "+B.border,background:B.bg2};
var scanTdStyle:any = {padding:"6px 10px",fontSize:11,color:B.textPri,borderBottom:"1px solid "+B.border};

function ImagePackagesDetail({ imageName, chartName, version, k0rdentVer, appName }:any) {
  var [detail, setDetail] = useState<any>(null);
  var [loading, setLoading] = useState(true);
  var [error, setError] = useState("");
  useEffect(function(){
    setLoading(true); setError("");
    fetch(dataPrefix(k0rdentVer || "") + "apps/" + appName + "/scan-detail-" + chartName + "-" + version + ".json?t=" + Date.now())
      .then(function(r){ if (!r.ok) throw new Error("HTTP " + r.status); return r.json(); })
      .then(function(d){ setDetail(d); setLoading(false); })
      .catch(function(e){ setError(String(e)); setLoading(false); });
  }, [appName, chartName, version]);
  if (loading) return <div style={{padding:20,color:B.textSec,fontSize:12}}>Loading packages...</div>;
  if (error) return <div style={{padding:20,color:B.red,fontSize:12}}>{error}</div>;
  var imgData = detail && detail.images ? detail.images[imageName] : null;
  if (!imgData) return <div style={{padding:20,color:B.textMut,fontSize:12}}>No data for this image.</div>;
  var pkgs = (imgData.packages || []).filter(function(p:any){ return p.name && p.name.indexOf("..") === -1; });
  return (
    <div>
      <div style={{fontSize:12,fontWeight:600,color:B.textPri,marginBottom:12,fontFamily:"monospace",wordBreak:"break-all"}}>{imageName}</div>
      {pkgs.length === 0 ? <div style={{fontSize:11,color:B.textMut,padding:10}}>No packages found.</div> :
      <div style={{border:"1px solid "+B.border,borderRadius:8,overflow:"hidden"}}>
        <table style={{width:"100%",borderCollapse:"collapse"}}>
          <thead><tr><th style={scanThStyle}>Name</th><th style={scanThStyle}>Version</th></tr></thead>
          <tbody>
            {pkgs.map(function(p:any, i:number){
              return <tr key={i} style={{background:i%2===0?"transparent":B.bg2+"40"}}><td style={{...scanTdStyle,fontFamily:"monospace",fontSize:10}}>{p.name}</td><td style={{...scanTdStyle,fontFamily:"monospace",fontSize:10}}>{p.version}</td></tr>;
            })}
          </tbody>
        </table>
      </div>}
    </div>
  );
}

function ImageVulnsDetail({ imageName, chartName, version, k0rdentVer, appName }:any) {
  var [detail, setDetail] = useState<any>(null);
  var [loading, setLoading] = useState(true);
  var [error, setError] = useState("");
  useEffect(function(){
    setLoading(true); setError("");
    fetch(dataPrefix(k0rdentVer || "") + "apps/" + appName + "/scan-detail-" + chartName + "-" + version + ".json?t=" + Date.now())
      .then(function(r){ if (!r.ok) throw new Error("HTTP " + r.status); return r.json(); })
      .then(function(d){ setDetail(d); setLoading(false); })
      .catch(function(e){ setError(String(e)); setLoading(false); });
  }, [appName, chartName, version]);
  if (loading) return <div style={{padding:20,color:B.textSec,fontSize:12}}>Loading vulnerabilities...</div>;
  if (error) return <div style={{padding:20,color:B.red,fontSize:12}}>{error}</div>;
  var imgData = detail && detail.images ? detail.images[imageName] : null;
  if (!imgData) return <div style={{padding:20,color:B.textMut,fontSize:12}}>No data for this image.</div>;
  var vulns = imgData.vulnerabilities || [];
  return (
    <div>
      <div style={{fontSize:12,fontWeight:600,color:B.textPri,marginBottom:12,fontFamily:"monospace",wordBreak:"break-all"}}>{imageName}</div>
      {vulns.length === 0 ? <div style={{fontSize:11,color:B.green,padding:10}}>No vulnerabilities found.</div> :
      <div style={{border:"1px solid "+B.border,borderRadius:8,overflow:"hidden"}}>
        <table style={{width:"100%",borderCollapse:"collapse"}}>
          <thead><tr><th style={scanThStyle}>ID</th><th style={scanThStyle}>Severity</th><th style={scanThStyle}>Package</th><th style={scanThStyle}>Installed</th><th style={scanThStyle}>Fixed</th></tr></thead>
          <tbody>
            {vulns.map(function(v:any, i:number){
              var sc = sevColor(v.severity);
              return (
                <tr key={i} style={{background:i%2===0?"transparent":B.bg2+"40"}}>
                  <td style={scanTdStyle}>{v.id && v.id.startsWith("CVE-") ? <a href={"https://www.cve.org/CVERecord?id="+v.id} target="_blank" rel="noreferrer" style={{color:B.cyan,textDecoration:"none",fontSize:11}}>{v.id}</a> : v.id}</td>
                  <td style={scanTdStyle}><span style={{fontSize:9.5,padding:"2px 6px",borderRadius:3,background:sc+"18",color:sc,border:"1px solid "+sc+"30",fontWeight:600}}>{v.severity}</span></td>
                  <td style={{...scanTdStyle,fontFamily:"monospace",fontSize:10}}>{v.package}</td>
                  <td style={{...scanTdStyle,fontFamily:"monospace",fontSize:10}}>{v.installed}</td>
                  <td style={{...scanTdStyle,fontFamily:"monospace",fontSize:10}}>{v.fixed || <span style={{color:B.textMut}}>—</span>}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>}
    </div>
  );
}

function imgStripSha(full:string) {
  // "registry.io/app@sha256:abc123..." -> "registry.io/app"
  return full.split("@")[0];
}

function imgShortName(full:string) {
  // "quay.io/jetstack/cert-manager-cainjector:v1.20.2" -> "cert-manager-cainjector"
  var noTag = imgStripSha(full).split(":")[0];
  var parts = noTag.split("/");
  return parts[parts.length - 1];
}

function ScanImagesTab({ item, selVer, setSelVer, k0rdentVer, detailImg, setDetailImg, detailImgChart, setDetailImgChart }:any) {
  var {scanData, loading, error} = useScanData(item.name, k0rdentVer);
  if (loading) return <div style={{padding:20,color:B.textSec,fontSize:12}}>Loading scan data...</div>;
  if (error) return <div style={{padding:20,color:B.red,fontSize:12}}>{error}</div>;
  if (!scanData || !scanData.charts) return null;

  var allVersions = scanVersions(scanData);
  var chartNames = Object.keys(scanData.charts);
  var effectiveVer = selVer || allVersions[0] || "";

  if (detailImg) {
    return <ImagePackagesDetail imageName={detailImg} chartName={detailImgChart} version={effectiveVer} k0rdentVer={k0rdentVer} appName={item.name}/>;
  }

  return (
    <div>
      <ScanVersionPicker allVersions={allVersions} effectiveVer={effectiveVer} setSelVer={setSelVer} />
      <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:8,marginBottom:16}}>
        <div style={{background:B.bg2,borderRadius:7,padding:"9px 12px",border:"1px solid "+B.border}}>
          <div style={{fontSize:9.5,color:B.textMut,textTransform:"uppercase",letterSpacing:"0.07em",marginBottom:2}}>Images</div>
          <div style={{fontSize:14,color:B.textPri,fontWeight:600}}>{(function(){ var t=0; for(var c=0;c<chartNames.length;c++){var s=(scanData.charts[chartNames[c]].scans||{})[effectiveVer]; if(s)t+=s.totalImages;} return t; })()}</div>
        </div>
        <div style={{background:B.bg2,borderRadius:7,padding:"9px 12px",border:"1px solid "+B.border}}>
          <div style={{fontSize:9.5,color:B.textMut,textTransform:"uppercase",letterSpacing:"0.07em",marginBottom:2}}>Last scan</div>
          <div style={{fontSize:14,color:B.textPri,fontWeight:600}}>{scanData.lastScan || "—"}</div>
        </div>
      </div>
      {chartNames.map(function(chartName:string){
        var scan = (scanData.charts[chartName].scans || {})[effectiveVer];
        if (!scan) return <div key={chartName} style={{marginBottom:16}}><div style={{fontSize:13,fontWeight:600,color:B.textPri,marginBottom:8,borderBottom:"1px solid "+B.border,paddingBottom:6}}>{chartName}</div><div style={{fontSize:11,color:B.textMut,fontStyle:"italic"}}>No scan data for version {effectiveVer}</div></div>;
        return (
          <div key={chartName} style={{marginBottom:16}}>
            <div style={{fontSize:13,fontWeight:600,color:B.textPri,marginBottom:8,borderBottom:"1px solid "+B.border,paddingBottom:6}}>{chartName}</div>
            <div style={{border:"1px solid "+B.border,borderRadius:8,overflow:"hidden"}}>
              <table style={{width:"100%",borderCollapse:"collapse"}}>
                <thead><tr><th style={scanThStyle}>Image ID</th><th style={scanThStyle}>Name</th><th style={scanThStyle}>Packages</th></tr></thead>
                <tbody>
                  {scan.images.map(function(img:any, i:number){
                    return <tr key={i} onClick={function(){setDetailImg(img.image);setDetailImgChart(chartName);}} style={{cursor:"pointer",background:i%2===0?"transparent":B.bg2+"40"}} onMouseEnter={function(e:any){e.currentTarget.style.background=B.bg3;}} onMouseLeave={function(e:any){e.currentTarget.style.background=i%2===0?"transparent":B.bg2+"40";}}>
                      <td style={{...scanTdStyle,fontFamily:"monospace",fontSize:10,fontWeight:500}}>{imgStripSha(img.image)}</td>
                      <td style={{...scanTdStyle,fontWeight:500}}>{imgShortName(img.image)}</td>
                      <td style={{...scanTdStyle,textAlign:"center"}}>{img.packages || 0}</td>
                    </tr>;
                  })}
                </tbody>
              </table>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function ScanVulnsTab({ item, selVer, setSelVer, k0rdentVer, detailImg, setDetailImg, detailImgChart, setDetailImgChart }:any) {
  var {scanData, loading, error} = useScanData(item.name, k0rdentVer);
  if (loading) return <div style={{padding:20,color:B.textSec,fontSize:12}}>Loading scan data...</div>;
  if (error) return <div style={{padding:20,color:B.red,fontSize:12}}>{error}</div>;
  if (!scanData || !scanData.charts) return null;

  var allVersions = scanVersions(scanData);
  var chartNames = Object.keys(scanData.charts);
  var effectiveVer = selVer || allVersions[0] || "";

  if (detailImg) {
    return <ImageVulnsDetail imageName={detailImg} chartName={detailImgChart} version={effectiveVer} k0rdentVer={k0rdentVer} appName={item.name}/>;
  }

  var totalVulns = 0;
  for (var ci=0;ci<chartNames.length;ci++){
    var scan = (scanData.charts[chartNames[ci]].scans || {})[effectiveVer];
    if (scan) totalVulns += scan.totalVulnerabilities;
  }

  return (
    <div>
      <ScanVersionPicker allVersions={allVersions} effectiveVer={effectiveVer} setSelVer={setSelVer} />
      <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:8,marginBottom:16}}>
        <div style={{background:B.bg2,borderRadius:7,padding:"9px 12px",border:"1px solid "+B.border}}>
          <div style={{fontSize:9.5,color:B.textMut,textTransform:"uppercase",letterSpacing:"0.07em",marginBottom:2}}>Total vulnerabilities</div>
          <div style={{fontSize:14,color:totalVulns > 0 ? "#ff8c00" : B.green,fontWeight:600}}>{totalVulns}</div>
        </div>
        <div style={{background:B.bg2,borderRadius:7,padding:"9px 12px",border:"1px solid "+B.border}}>
          <div style={{fontSize:9.5,color:B.textMut,textTransform:"uppercase",letterSpacing:"0.07em",marginBottom:2}}>Last scan</div>
          <div style={{fontSize:14,color:B.textPri,fontWeight:600}}>{scanData.lastScan || "—"}</div>
        </div>
      </div>
      {chartNames.map(function(chartName:string){
        var scan = (scanData.charts[chartName].scans || {})[effectiveVer];
        if (!scan) return <div key={chartName} style={{marginBottom:16}}><div style={{fontSize:13,fontWeight:600,color:B.textPri,marginBottom:8,borderBottom:"1px solid "+B.border,paddingBottom:6}}>{chartName}</div><div style={{fontSize:11,color:B.textMut,fontStyle:"italic"}}>No scan data for version {effectiveVer}</div></div>;
        return (
          <div key={chartName} style={{marginBottom:16}}>
            <div style={{fontSize:13,fontWeight:600,color:B.textPri,marginBottom:8,borderBottom:"1px solid "+B.border,paddingBottom:6}}>{chartName}</div>
            <div style={{border:"1px solid "+B.border,borderRadius:8,overflow:"hidden"}}>
              <table style={{width:"100%",borderCollapse:"collapse"}}>
                <thead><tr><th style={scanThStyle}>Image ID</th><th style={{...scanThStyle,textAlign:"center"}}>Critical</th><th style={{...scanThStyle,textAlign:"center"}}>High</th><th style={{...scanThStyle,textAlign:"center"}}>Medium</th><th style={{...scanThStyle,textAlign:"center"}}>Low</th><th style={{...scanThStyle,textAlign:"center"}}>Unknown</th></tr></thead>
                <tbody>
                  {scan.images.map(function(img:any, i:number){
                    return <tr key={i} onClick={function(){setDetailImg(img.image);setDetailImgChart(chartName);}} style={{cursor:"pointer",background:i%2===0?"transparent":B.bg2+"40"}} onMouseEnter={function(e:any){e.currentTarget.style.background=B.bg3;}} onMouseLeave={function(e:any){e.currentTarget.style.background=i%2===0?"transparent":B.bg2+"40";}}>
                      <td style={{...scanTdStyle,fontFamily:"monospace",fontSize:10}}>{imgStripSha(img.image)}</td>
                      <td style={{...scanTdStyle,textAlign:"center",color:img.critical>0?sevColor("critical"):B.textMut}}>{img.critical||0}</td>
                      <td style={{...scanTdStyle,textAlign:"center",color:img.high>0?sevColor("high"):B.textMut}}>{img.high||0}</td>
                      <td style={{...scanTdStyle,textAlign:"center",color:img.medium>0?sevColor("medium"):B.textMut}}>{img.medium||0}</td>
                      <td style={{...scanTdStyle,textAlign:"center",color:img.low>0?B.textSec:B.textMut}}>{img.low||0}</td>
                      <td style={{...scanTdStyle,textAlign:"center",color:B.textMut}}>{img.unknown||0}</td>
                    </tr>;
                  })}
                </tbody>
              </table>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function HtmlWithCopy({ html, style }:{ html:string, style?:any }) {
  var ref = React.useRef<HTMLDivElement>(null);
  useEffect(function(){
    if (!ref.current) return;
    var pres = ref.current.querySelectorAll("pre");
    pres.forEach(function(pre:HTMLPreElement){
      pre.style.position = "relative";
      pre.style.background = B.bg2;
      pre.style.border = "1px solid " + B.border;
      pre.style.borderRadius = "7px";
      pre.style.padding = "12px 14px";
      pre.style.fontSize = "11px";
      pre.style.fontFamily = "monospace";
      pre.style.lineHeight = "1.6";
      pre.style.overflowX = "auto";
      pre.style.whiteSpace = "pre";
      pre.style.margin = "0 0 8px 0";
      // Update existing copy button styles or create new one
      var existingBtn = pre.querySelector(".copy-btn") as HTMLButtonElement|null;
      if (existingBtn) {
        existingBtn.style.background = B.bg2;
        existingBtn.style.borderColor = B.borderHi;
        existingBtn.style.color = B.textSec;
        return;
      }
      var btn = document.createElement("button");
      btn.className = "copy-btn";
      btn.textContent = "Copy";
      btn.style.cssText = "position:absolute;top:6px;right:6px;background:"+B.bg2+";border:1px solid "+B.borderHi+";border-radius:5px;padding:2px 8px;font-size:9.5px;color:"+B.textSec+";cursor:pointer;font-family:inherit;";
      btn.onclick = function(){
        var code = pre.querySelector("code");
        var text = code ? code.textContent || "" : pre.textContent || "";
        if (navigator.clipboard) navigator.clipboard.writeText(text);
        btn.textContent = "Copied";
        btn.style.color = B.green;
        btn.style.background = B.green + "30";
        setTimeout(function(){ btn.textContent = "Copy"; btn.style.color = B.textSec; btn.style.background = B.bg2; }, 1500);
      };
      pre.appendChild(btn);
    });
    // Syntax highlighting
    if ((window as any).hljs) {
      ref.current.querySelectorAll("pre code").forEach(function(block:any){
        delete block.dataset.highlighted;
        (window as any).hljs.highlightElement(block);
      });
    }
  }, [html, IS_DARK]);
  return <div ref={ref} style={style} dangerouslySetInnerHTML={{__html:html}}/>;
}

function InstallTab({ item, selVer, setSelVer, k0rdentVer }:{ item:any, selVer:string, setSelVer:any, k0rdentVer?:string }) {
  var [installData, setInstallData] = useState<any>(null);
  var [loading, setLoading] = useState(true);
  var [error, setError] = useState("");

  useEffect(function(){
    setLoading(true);
    setError("");
    fetch(dataPrefix(k0rdentVer || "") + "apps/" + item.name + "/install.json?t=" + Date.now())
      .then(function(r){ if (!r.ok) throw new Error("HTTP " + r.status); return r.json(); })
      .then(function(d){ setInstallData(d); setLoading(false); })
      .catch(function(e){ setError(String(e)); setLoading(false); });
  }, [item.name]);

  if (loading) return <div style={{padding:20,color:B.textSec,fontSize:12}}>Loading install data...</div>;
  if (error) return <div style={{padding:20,color:B.red,fontSize:12}}>{error}</div>;
  if (!installData) return null;

  var effectiveVer = selVer || (installData.versions[0] && installData.versions[0].version) || "";
  var verData = installData.versions.find(function(v:any){ return v.version === effectiveVer; }) || installData.versions[0];

  function stepBlock(n:number, title:string, html:string) {
    if (!html) return null;
    return (
      <div key={n} style={{marginBottom:14}}>
        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:7}}>
          <div style={{width:20,height:20,borderRadius:"50%",background:B.tealBg,border:"1px solid "+B.teal+"40",display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:700,color:B.teal,flexShrink:0}}>{n}</div>
          <span style={{fontSize:12,fontWeight:600,color:B.textPri}}>{title}</span>
        </div>
        <HtmlWithCopy html={html} style={{paddingLeft:28,fontSize:13,color:B.textSec}}/>
      </div>
    );
  }

  return (
    <div>
      {item.versions && item.versions.length > 0 && <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:16}}>
        <span style={{fontSize:12,color:B.textSec}}>Version:</span>
        <select value={effectiveVer} onChange={function(e:any){setSelVer(e.target.value);}} style={{padding:"5px 9px",border:"1px solid "+B.borderHi,borderRadius:5,background:B.bg3,color:B.textPri,fontSize:12,outline:"none",cursor:"pointer",fontFamily:"monospace"}}>
          {item.versions.map(function(v:string){return <option key={v} value={v}>{v}</option>;})}
        </select>
        {item.tested&&<span style={{fontSize:9.5,color:B.green,background:B.green+"15",border:"1px solid "+B.green+"30",borderRadius:3,padding:"2px 7px"}}>CI-validated</span>}
      </div>}
      {stepBlock(1, "Prerequisites", installData.prerequisitesHtml)}
      {verData && <div key={"install-"+effectiveVer}>{stepBlock(2, "Install template to k0rdent", verData.installHtml)}</div>}
      {verData && <div key={"verify-"+effectiveVer}>{stepBlock(3, "Verify "+(item.type==="infra"?"cluster":"service")+" template", verData.verifyHtml)}</div>}
      {verData && <div key={"deploy-"+effectiveVer}>{stepBlock(4, "Deploy "+(item.type==="infra"?"cluster":"service"), verData.deployHtml)}</div>}
      {installData.examples.length > 0 && (
        <div style={{marginTop:20,borderTop:"1px solid "+B.border,paddingTop:16}}>
          <div style={{fontSize:11,fontWeight:600,color:B.textPri,marginBottom:12,textTransform:"uppercase",letterSpacing:0.5}}>Examples</div>
          {installData.examples.map(function(ex:any, i:number){
            return (
              <div key={i} style={{marginBottom:16,padding:14,background:B.bg2,borderRadius:8,border:"1px solid "+B.border}}>
                <div style={{fontSize:12,fontWeight:600,color:B.textPri,marginBottom:8}}>{ex.title}</div>
                {ex.contentHtml && <HtmlWithCopy html={ex.contentHtml} style={{fontSize:12,color:B.textSec}}/>}
                {!ex.contentHtml && ex.installHtml && <div style={{marginTop:8}}><div style={{fontSize:10,color:B.textMut,marginBottom:4}}>Install</div><HtmlWithCopy html={ex.installHtml} style={{fontSize:12,color:B.textSec}}/></div>}
                {!ex.contentHtml && ex.verifyHtml && <div style={{marginTop:8}}><div style={{fontSize:10,color:B.textMut,marginBottom:4}}>Verify</div><HtmlWithCopy html={ex.verifyHtml} style={{fontSize:12,color:B.textSec}}/></div>}
                {!ex.contentHtml && ex.deployHtml && <div style={{marginTop:8}}><div style={{fontSize:10,color:B.textMut,marginBottom:4}}>Deploy</div><HtmlWithCopy html={ex.deployHtml} style={{fontSize:12,color:B.textSec}}/></div>}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function DetailPanel({ item, onClose, tab, setTab, selVer, setSelVer, k0rdentVer, detailImg, setDetailImg, detailImgChart, setDetailImgChart, detailImgSub, setDetailImgSub }:any) {
  var [imagesKey, setImagesKey] = useState(0);
  var {scanData: _scanData} = useScanData(item.hasScan ? item.name : "", k0rdentVer);
  var _scanCounts = {images:0, vulns:0};
  if (_scanData && _scanData.charts) {
    var _chartNames = Object.keys(_scanData.charts);
    var _allVers = scanVersions(_scanData);
    var _ev = selVer || _allVers[0] || "";
    for (var _ci=0;_ci<_chartNames.length;_ci++){
      var _s = (_scanData.charts[_chartNames[_ci]].scans || {})[_ev];
      if (_s) { _scanCounts.images += _s.totalImages; _scanCounts.vulns += _s.totalVulnerabilities; }
    }
  }
  var eff = getEff(item);
  var ss = SUPPORT_STYLE[eff];
  var compTags = COMPLIANCE[item.name] || [];
  var accent = tagAccent(item.tags[0] || "Other");
  var initials = "";
  var parts = item.name.replace(/-/g," ").split(" ");
  for (var pi=0;pi<Math.min(2,parts.length);pi++) initials += parts[pi][0].toUpperCase();
  var d = deployStats(item.name);
  var maxD = 1;
  for (var ri=0;ri<RAW.length;ri++){if((RAW[ri].pulls||0)>maxD)maxD=RAW[ri].pulls;}
  var pct = maxD>0?Math.round((item.pulls||0)/maxD*100):0;

  useEffect(function(){
    var h = function(e){ if(e.key==="Escape") onClose(); };
    window.addEventListener("keydown",h);
    return function(){ window.removeEventListener("keydown",h); };
  },[]);

  function tabStyle(active) {
    return {padding:"8px 14px",fontSize:13,fontWeight:active?600:400,color:active?"#35db78":"#ffffff",background:"transparent",border:"none",borderBottom:"2px solid "+(active?"#35db78":"transparent"),cursor:"pointer",whiteSpace:"nowrap",fontFamily:"inherit"};
  }

  var whyCopy = item.whyInCatalog || (function(){
    var tg = item.tags[0]||"";
    if(tg==="AI/ML") return "Selected for its role in the AI infrastructure stack — from model training and serving to MLOps and GPU orchestration.";
    if(tg==="Security") return "Security is non-negotiable in AI environments. This integration provides policy enforcement, secrets management, or runtime protection across multi-cluster deployments.";
    if(tg==="Monitoring") return "Observability is the foundation of reliable AI infrastructure. This tool provides the metrics, logs, or traces needed to understand GPU utilization, model latency, and cluster health.";
    if(tg==="Networking") return "Modern AI workloads demand high-throughput, low-latency networking. This integration was selected for cluster connectivity, traffic management, or service mesh capabilities.";
    if(tg==="Storage") return "AI training and inference are storage-intensive. This integration provides persistent, high-throughput, or object storage capabilities.";
    if(tg==="Database") return "Data is the foundation of AI. This database is relevant for AI workloads as a vector store, feature store, or operational database.";
    if(tg==="CI/CD") return "Reliable AI delivery requires robust CI/CD and GitOps pipelines.";
    if(tg==="Backup") return "Data protection is critical for AI workloads training on unique, hard-to-reproduce datasets.";
    return "Carefully selected by Mirantis platform engineers for its production-grade quality and proven interoperability with k0rdent-managed clusters.";
  })();

  return (
    <div onClick={onClose} style={{position:"fixed",top:0,left:0,right:0,bottom:0,zIndex:1000,display:"flex",alignItems:"stretch",justifyContent:"flex-end"}}>
      <div className="k0-backdrop" style={{position:"absolute",top:0,left:0,right:0,bottom:0,background:"rgba(5,8,20,0.7)"}}/>
      <div className="k0-detail-panel" onClick={function(e){e.stopPropagation();}} style={{position:"relative",width:"min(680px,100vw)",background:B.bg1,borderLeft:"1px solid "+B.borderHi,display:"flex",flexDirection:"column",overflowY:"auto"}}>
        {eff==="mirantis-certified"&&<div style={{height:2,background:"linear-gradient(90deg,"+B.teal+","+B.cyan+")",flexShrink:0}}/>}
        <div className="k0-detail-header" style={{padding:"18px 22px 0",flexShrink:0,background:"#000000"}}>
          <div style={{display:"flex",alignItems:"flex-start",gap:12,marginBottom:12}}>
            <AppLogo name={item.name} size={44} accent={accent} logo={item.logo} brandColor={item.brandColor}/>
            <div style={{flex:1}}>
              <div style={{display:"flex",alignItems:"center",gap:7,flexWrap:"wrap",marginBottom:4}}>
                <h2 style={{fontSize:19,fontWeight:700,color:"#ffffff",margin:0}}>{item.title||item.name}</h2>
                <span style={{fontSize:9,padding:"2px 7px",borderRadius:3,background:ss.bg,color:ss.text,border:"1px solid "+ss.border,fontWeight:600,textTransform:"uppercase"}}>{SUPPORT_LABEL[eff]}</span>
              </div>
              <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
                {item.tags.map(function(t){return <span key={t} style={{fontSize:9.5,padding:"1px 6px",borderRadius:3,background:tagAccent(t)+"15",color:tagAccent(t),border:"1px solid "+tagAccent(t)+"25",fontWeight:500}}>{t}</span>;})}
              </div>
            </div>
            <button onClick={onClose} style={{background:"transparent",border:"1px solid #555760",borderRadius:6,width:30,height:30,display:"flex",alignItems:"center",justifyContent:"center",color:"#ffffff",cursor:"pointer",fontSize:14,fontFamily:"inherit",flexShrink:0}}>✕</button>
          </div>
          <div className="k0-detail-tabs" style={{display:"flex",flexWrap:"wrap",borderBottom:"1px solid #555760",marginLeft:-22,marginRight:-22,paddingLeft:22,gap:0}}>
            {["overview","install","validation","images","vulnerabilities","cost"].filter(function(t){ if(t==="install"&&item.showInstall===false)return false; if(item.type==="infra"&&(t==="validation"||t==="cost"||t==="images"||t==="vulnerabilities"))return false; if((t==="images"||t==="vulnerabilities")&&!item.hasScan)return false; return true; }).map(function(t){
              var tLabel = t.charAt(0).toUpperCase()+t.slice(1);
              var tCount = t==="images"?_scanCounts.images:t==="vulnerabilities"?_scanCounts.vulns:-1;
              var tActive = tab===t;
              return <button key={t} onClick={function(){setTab(t);if(t==="images"||t==="vulnerabilities"){setImagesKey(function(k){return k+1;});setDetailImg("");setDetailImgChart("");setDetailImgSub("");}}} style={tabStyle(tActive)}>{tLabel}{tCount>=0&&<span style={{marginLeft:6,fontSize:10,padding:"1px 6px",borderRadius:10,background:tActive?"#35db78":"#ffffff",color:tActive?"#000000":"#000000",fontWeight:700}}>{tCount}</span>}</button>;
            })}
            <div style={{flex:1,minWidth:20}}/>
            {item.doc_link && <a href={item.doc_link} target="_blank" rel="noreferrer" style={{padding:"8px 16px",fontSize:11,color:"#000000",textDecoration:"none",background:"#35db78",fontWeight:600,alignSelf:"flex-end",marginBottom:-1,borderTopLeftRadius:5,borderTopRightRadius:5}}>Docs</a>}
          </div>
        </div>
        <div className="k0-detail-content" style={{padding:"18px 22px",flex:1}}>
          {tab==="overview" && item.type==="infra" && (
            <div>
              {item.descriptionHtml ? <HtmlWithCopy html={item.descriptionHtml} style={{fontSize:14,color:B.textSec,lineHeight:1.8,marginTop:0}}/> : <p style={{fontSize:14,color:B.textSec,lineHeight:1.8,marginTop:0}}>{item.desc}</p>}
              <div style={{marginTop:16,padding:"11px 14px",background:B.tealBg,border:"1px solid "+B.teal+"30",borderRadius:7,display:"flex",justifyContent:"space-between",alignItems:"center",gap:8}}>
                <span style={{fontSize:12,color:B.teal,fontWeight:500}}>Ready to deploy?</span>
                <button onClick={function(){setTab("install");}} style={{background:B.teal,border:"none",borderRadius:5,padding:"5px 14px",fontSize:12,color:B.bg0,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>View install steps</button>
              </div>
              {item.supportLink&&<div style={{marginTop:8,padding:"11px 14px",background:B.bg2,border:"1px solid "+B.border,borderRadius:7,display:"flex",justifyContent:"space-between",alignItems:"center",gap:8}}>
                <span style={{fontSize:12,color:B.textSec}}>Looking for Commercial Support?</span>
                <a href={item.supportLink} target="_blank" rel="noreferrer" style={{fontSize:12,color:B.teal,fontWeight:700,textDecoration:"none",textTransform:"uppercase",letterSpacing:"0.05em"}}>Learn more</a>
              </div>}
            </div>
          )}
          {tab==="overview" && item.type!=="infra" && (
            <div>
              <p style={{fontSize:14,color:B.textSec,lineHeight:1.8,marginTop:0}}>{item.desc}</p>
              <div style={{background:B.bg2,border:"1px solid "+B.borderHi,borderRadius:8,padding:"12px 14px",marginBottom:16,display:"flex",gap:10}}>
                <span style={{fontSize:16,color:B.teal,flexShrink:0}}>◈</span>
                <div>
                  <div style={{fontSize:10,fontWeight:600,color:B.teal,textTransform:"uppercase",letterSpacing:"0.07em",marginBottom:4}}>Why this is in the catalog</div>
                  <div style={{fontSize:13,color:B.textSec,lineHeight:1.7}}>{whyCopy}</div>
                </div>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:14}}>
                {[{l:"Latest version",v:item.version},{l:"Chart name",v:item.chartName},{l:"Support tier",v:SUPPORT_LABEL[eff]},{l:"CI validated",v:item.tested?"Yes":"Not yet"},{l:"Versions available",v:String(item.versions.length)},{l:"Last updated",v:item.lastUpdated?item.lastUpdated.slice(0,10):"—"}].map(function(r){
                  return <div key={r.l} style={{background:B.bg2,borderRadius:7,padding:"9px 12px",border:"1px solid "+B.border}}><div style={{fontSize:9.5,color:B.textMut,textTransform:"uppercase",letterSpacing:"0.07em",marginBottom:2}}>{r.l}</div><div style={{fontSize:12.5,color:B.textPri,fontWeight:500,fontFamily:(r.l.includes("ersion")||r.l.includes("Chart"))?"monospace":"inherit"}}>{r.v}</div></div>;
                })}
              </div>
              <div style={{marginBottom:14}}>
                <div style={{fontSize:9.5,color:B.textMut,textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:8}}>Deploy and usage signals</div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:8}}>
                  {[{l:"Total downloads",v:item.pulls>0?fmtNum(item.pulls):"—",c:B.teal,href:item.chartName?"https://github.com/k0rdent/catalog/pkgs/container/catalog%2Fcharts%2F"+encodeURIComponent(item.chartName):""},{l:"GitHub stars",v:item.stars>0?fmtNum(item.stars):"—",c:B.cyan,href:item.githubRepo?"https://github.com/"+item.githubRepo:""}].map(function(r:any){
                    var box = <div style={{background:B.bg2,borderRadius:7,padding:"9px 12px",border:"1px solid "+B.border,cursor:r.href?"pointer":"default"}}><div style={{fontSize:9.5,color:B.textMut,textTransform:"uppercase",letterSpacing:"0.07em",marginBottom:2}}>{r.l}{r.href&&<span style={{marginLeft:4,fontSize:8}}>↗</span>}</div><div style={{fontSize:12.5,color:r.c,fontWeight:600,fontFamily:"monospace"}}>{r.v}</div></div>;
                    return r.href ? <a key={r.l} href={r.href} target="_blank" rel="noreferrer" style={{textDecoration:"none"}}>{box}</a> : <div key={r.l}>{box}</div>;
                  })}
                </div>
                <div style={{fontSize:9.5,color:B.textMut,marginBottom:3}}>Popularity vs peak ({fmtNum(maxD)} pulls)</div>
                <div style={{height:5,background:B.bg3,borderRadius:3,overflow:"hidden"}}><div style={{height:"100%",width:pct+"%",background:"linear-gradient(90deg,"+B.teal+","+B.cyan+")",borderRadius:3}}/></div>
                <div style={{display:"flex",justifyContent:"space-between",marginTop:2}}><span style={{fontSize:9,color:B.textMut}}>0</span><span style={{fontSize:9,color:B.teal,fontWeight:600}}>{pct}%</span><span style={{fontSize:9,color:B.textMut}}>{fmtNum(maxD)}</span></div>
              </div>
              <div style={{marginTop:16,padding:"11px 14px",background:B.tealBg,border:"1px solid "+B.teal+"30",borderRadius:7,display:"flex",justifyContent:"space-between",alignItems:"center",gap:8}}>
                <span style={{fontSize:12,color:B.teal,fontWeight:500}}>Ready to deploy?</span>
                <button onClick={function(){setTab("install");}} style={{background:B.teal,border:"none",borderRadius:5,padding:"5px 14px",fontSize:12,color:B.bg0,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>View install steps</button>
              </div>
              {item.supportLink&&<div style={{marginTop:8,padding:"11px 14px",background:B.bg2,border:"1px solid "+B.border,borderRadius:7,display:"flex",justifyContent:"space-between",alignItems:"center",gap:8}}>
                <span style={{fontSize:12,color:B.textSec}}>Looking for Commercial Support?</span>
                <a href={item.supportLink} target="_blank" rel="noreferrer" style={{fontSize:12,color:B.teal,fontWeight:700,textDecoration:"none",textTransform:"uppercase",letterSpacing:"0.05em"}}>Learn more</a>
              </div>}
            </div>
          )}
          {tab==="install" && (
            <InstallTab item={item} selVer={selVer} setSelVer={setSelVer} k0rdentVer={k0rdentVer}/>
          )}
          {tab==="validation" && <TestResults item={item}/>}
          {tab==="images" && <ScanImagesTab key={"img"+imagesKey} item={item} selVer={selVer} setSelVer={setSelVer} k0rdentVer={k0rdentVer} detailImg={detailImg} setDetailImg={setDetailImg} detailImgChart={detailImgChart} setDetailImgChart={setDetailImgChart}/>}
          {tab==="vulnerabilities" && <ScanVulnsTab key={"vul"+imagesKey} item={item} selVer={selVer} setSelVer={setSelVer} k0rdentVer={k0rdentVer} detailImg={detailImg} setDetailImg={setDetailImg} detailImgChart={detailImgChart} setDetailImgChart={setDetailImgChart}/>}
          {tab==="cost" && (
            <div>
              <p style={{fontSize:12,color:B.textSec,lineHeight:1.7,marginTop:0,marginBottom:14}}>
                Estimated monthly infrastructure cost for running <span style={{color:B.textPri,fontWeight:500}}>{item.name}</span> on a k0rdent-managed cluster. Adjust cloud provider, cluster count, and active hours to model your deployment scenario.
              </p>
              <FinOpsEstimator stackItems={[item]} defaultCloud="aws"/>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Card({ item, onOpen }) {
  var eff = getEff(item);
  var ss = SUPPORT_STYLE[eff];
  var accent = tagAccent(item.tags[0]||"Other");
  var compTags = COMPLIANCE[item.name]||[];
  var isCert = eff==="mirantis-certified";
  var initials = "";
  var parts = item.name.replace(/-/g," ").split(" ");
  for(var pi=0;pi<Math.min(2,parts.length);pi++) initials+=parts[pi][0].toUpperCase();
  return (
    <div onClick={onOpen}
      onMouseEnter={function(e){e.currentTarget.style.borderColor=B.teal+"80";e.currentTarget.style.boxShadow="0 0 18px "+B.teal+"18";e.currentTarget.style.transform="translateY(-1px)";}}
      onMouseLeave={function(e){e.currentTarget.style.borderColor=isCert?B.teal+"30":B.border;e.currentTarget.style.boxShadow=isCert?"0 0 10px "+B.teal+"10":"none";e.currentTarget.style.transform="none";}}
      style={{background:B.bg1,border:"1px solid "+(isCert?B.teal+"30":B.border),borderRadius:10,padding:"13px",display:"flex",flexDirection:"column",cursor:"pointer",position:"relative",overflow:"hidden",transition:"border-color 0.15s,box-shadow 0.15s,transform 0.15s"}}
    >
      {isCert&&<div style={{position:"absolute",top:0,left:0,right:0,height:2,background:"linear-gradient(90deg,"+B.teal+","+B.cyan+")"}}/>}
      <div style={{display:"flex",gap:9,alignItems:"flex-start"}}>
        <AppLogo name={item.name} size={32} accent={accent} logo={item.logo} brandColor={item.brandColor}/>
        <div style={{flex:1,minWidth:0}}>
          <div style={{display:"flex",alignItems:"center",gap:5,flexWrap:"wrap"}}>
            <span style={{fontWeight:600,fontSize:14,color:B.textPri}}>{item.title||item.name}</span>
            <span style={{fontSize:8.5,padding:"1px 5px",borderRadius:3,background:ss.bg,color:ss.text,border:"1px solid "+ss.border,fontWeight:600,textTransform:"uppercase"}}>{SUPPORT_LABEL[eff]}</span>
          </div>
          <div style={{display:"flex",gap:4,marginTop:3,flexWrap:"wrap"}}>
            {item.tags.slice(0,2).map(function(t){return <span key={t} style={{fontSize:9,padding:"1px 5px",borderRadius:3,background:tagAccent(t)+"15",color:tagAccent(t),fontWeight:500,border:"1px solid "+tagAccent(t)+"25"}}>{t}</span>;})}
            <span style={{fontSize:8.5,color:B.textMut,fontFamily:"monospace"}}>{item.version}</span>
          </div>
        </div>
      </div>
      <p style={{fontSize:13,color:B.textSec,marginTop:8,paddingBottom:2,lineHeight:1.6,display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical",overflow:"hidden",flex:1,textAlign:"justify"}}>{item.desc}</p>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginTop:8,paddingTop:7,borderTop:"1px solid "+B.border}}>
        {item.tested&&<span style={{fontSize:9.5,color:B.green}}>{"✓ CI-validated"}</span>}
        <span style={{fontSize:9.5,color:B.teal,fontWeight:500}}>View details</span>
      </div>
    </div>
  );
}

var CLOUD_PRICING = {
  aws:       { cpu_hr:0.048,  gpu_hr:2.20,  mem_gb_hr:0.006, storage_gb_mo:0.023, egress_gb:0.09,  label:"AWS"   },
  azure:     { cpu_hr:0.052,  gpu_hr:2.48,  mem_gb_hr:0.007, storage_gb_mo:0.020, egress_gb:0.087, label:"Azure" },
  vsphere:   { cpu_hr:0.018,  gpu_hr:1.10,  mem_gb_hr:0.003, storage_gb_mo:0.010, egress_gb:0.01,  label:"vSphere (on-prem)" },
  baremetal: { cpu_hr:0.012,  gpu_hr:0.85,  mem_gb_hr:0.002, storage_gb_mo:0.008, egress_gb:0.005, label:"Bare Metal" },
  hybrid:    { cpu_hr:0.035,  gpu_hr:1.65,  mem_gb_hr:0.005, storage_gb_mo:0.016, egress_gb:0.05,  label:"Hybrid" },
};
var APP_RESOURCES = {
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
function getAppRes(name) {
  return APP_RESOURCES[name] || {cpu:1,gpu:0,mem:2,storage:5};
}

function estimateCost(stackItems, cloud, clusters, hoursPerMonth) {
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
function fmt$(n) { return n>=1000 ? "$"+(n/1000).toFixed(1)+"k" : "$"+Math.round(n); }

function FinOpsEstimator({ stackItems, defaultCloud }) {
  var [cloud, setCloud] = useState(defaultCloud || "aws");
  var [clusters, setClusters] = useState(1);
  var [hoursPerMonth, setHoursPerMonth] = useState(730);

  var est = estimateCost(stackItems, cloud, clusters, hoursPerMonth);
  var annual = est.total * 12;
  var gpuCost = 0;
  for(var i=0;i<est.breakdown.length;i++){if(est.breakdown[i].isGpu)gpuCost+=est.breakdown[i].monthly;}
  var gpuPct = est.total > 0 ? Math.round(gpuCost/est.total*100) : 0;

  return (
    <div style={{background:B.bg1,border:"1px solid "+B.border,borderRadius:10,overflow:"hidden"}}>
      <div style={{padding:"12px 16px",background:B.bg2,borderBottom:"1px solid "+B.border,display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:8}}>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <span style={{fontSize:14,color:B.amber}}>◈</span>
          <span style={{fontSize:12.5,fontWeight:600,color:B.textPri}}>FinOps Cost Estimator</span>
          <span style={{fontSize:9.5,padding:"1px 7px",borderRadius:10,background:B.amber+"18",color:B.amber,border:"1px solid "+B.amber+"30",fontWeight:500}}>Estimated</span>
        </div>
        <div style={{display:"flex",gap:10,flexWrap:"wrap",alignItems:"center"}}>
          <div style={{display:"flex",alignItems:"center",gap:5}}>
            <span style={{fontSize:10,color:B.textMut}}>Cloud</span>
            <select value={cloud} onChange={function(e){setCloud(e.target.value);}} style={{padding:"3px 7px",border:"1px solid "+B.borderHi,borderRadius:5,fontSize:11,background:B.bg3,color:B.textPri,outline:"none",cursor:"pointer"}}>
              {Object.entries(CLOUD_PRICING).map(function(e){return <option key={e[0]} value={e[0]}>{e[1].label}</option>;})}
            </select>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:5}}>
            <span style={{fontSize:10,color:B.textMut}}>Clusters</span>
            <input type="number" min="1" max="100" value={clusters} onChange={function(e){setClusters(Math.max(1,parseInt(e.target.value)||1));}} style={{width:52,padding:"3px 7px",border:"1px solid "+B.borderHi,borderRadius:5,fontSize:11,background:B.bg3,color:B.textPri,outline:"none",textAlign:"center"}}/>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:5}}>
            <span style={{fontSize:10,color:B.textMut}}>Hrs/mo</span>
            <input type="number" min="1" max="730" value={hoursPerMonth} onChange={function(e){setHoursPerMonth(Math.max(1,Math.min(730,parseInt(e.target.value)||730)));}} style={{width:52,padding:"3px 7px",border:"1px solid "+B.borderHi,borderRadius:5,fontSize:11,background:B.bg3,color:B.textPri,outline:"none",textAlign:"center"}}/>
          </div>
        </div>
      </div>
      <div style={{display:"flex",gap:0,borderBottom:"1px solid "+B.border}}>
        {[
          {l:"Monthly estimate",v:fmt$(est.total),sub:CLOUD_PRICING[cloud].label,c:B.amber},
          {l:"Annual estimate",v:fmt$(annual),sub:"12 months",c:B.teal},
          {l:"Per cluster/mo",v:fmt$(est.total/Math.max(1,clusters)),sub:clusters+" cluster"+(clusters>1?"s":""),c:B.cyan},
          {l:"GPU cost share",v:gpuPct+"%",sub:"of total spend",c:gpuCost>0?B.red:B.textMut},
        ].map(function(s,si,arr){
          return (
            <div key={s.l} style={{flex:"1 1 0",padding:"12px 14px",borderRight:si<arr.length-1?"1px solid "+B.border:"none"}}>
              <div style={{fontSize:10,color:B.textMut,marginBottom:2}}>{s.l}</div>
              <div style={{fontSize:17,fontWeight:700,color:s.c,fontFamily:"monospace",lineHeight:1}}>{s.v}</div>
              <div style={{fontSize:9.5,color:B.textMut,marginTop:2}}>{s.sub}</div>
            </div>
          );
        })}
      </div>
      <div style={{padding:"12px 16px"}}>
        <div style={{fontSize:9.5,fontWeight:600,color:B.textMut,textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:10}}>Cost breakdown by component</div>
        <div style={{display:"flex",flexDirection:"column",gap:6}}>
          {est.breakdown.slice(0,8).map(function(item){
            var barPct = est.topCost > 0 ? Math.round(item.monthly/est.topCost*100) : 0;
            var barColor = item.isGpu ? B.red : item.monthly/est.total > 0.2 ? B.amber : B.teal;
            return (
              <div key={item.name}>
                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:3}}>
                  <div style={{display:"flex",alignItems:"center",gap:6}}>
                    <span style={{fontSize:10.5,fontFamily:"monospace",color:B.textPri,fontWeight:500}}>{item.name}</span>
                    {item.isGpu&&<span style={{fontSize:8.5,padding:"1px 5px",borderRadius:3,background:B.red+"18",color:B.red,border:"1px solid "+B.red+"30",fontWeight:600}}>GPU</span>}
                    <span style={{fontSize:9.5,color:B.textMut}}>{item.cpu}vCPU{item.gpu>0?" · "+item.gpu+"GPU":""} · {item.mem}GB · {item.storage}GB</span>
                  </div>
                  <span style={{fontSize:11,fontFamily:"monospace",color:barColor,fontWeight:600}}>{fmt$(item.monthly)}<span style={{fontSize:9,color:B.textMut,fontWeight:400}}>/mo</span></span>
                </div>
                <div style={{height:5,background:B.bg3,borderRadius:3,overflow:"hidden"}}>
                  <div style={{height:"100%",width:barPct+"%",background:"linear-gradient(90deg,"+barColor+","+barColor+"90)",borderRadius:3,transition:"width 0.3s"}}/>
                </div>
              </div>
            );
          })}
          {est.breakdown.length>8&&<div style={{fontSize:10.5,color:B.textMut,paddingTop:4}}>+ {est.breakdown.length-8} more components</div>}
        </div>
        <div style={{marginTop:12,padding:"8px 12px",background:B.bg3,borderRadius:6,fontSize:10,color:B.textMut,lineHeight:1.6}}>
          Estimates are indicative only, based on public list pricing for {CLOUD_PRICING[cloud].label}. Actual costs vary with reserved instances, spot pricing, and workload patterns.
        </div>
      </div>
    </div>
  );
}

function SolutionCard({ sol, onClick }) {
  var bc = tagAccent(sol.category);
  var badgeC = sol.badge==="Validated"?B.green:bc;
  return (
    <div onClick={onClick}
      onMouseEnter={function(e){e.currentTarget.style.boxShadow="0 0 20px "+bc+"28";e.currentTarget.style.transform="translateY(-2px)";}}
      onMouseLeave={function(e){e.currentTarget.style.boxShadow="none";e.currentTarget.style.transform="none";}}
      style={{background:B.bg1,border:"1px solid "+B.borderHi,borderRadius:12,overflow:"hidden",cursor:"pointer",position:"relative",transition:"box-shadow 0.15s,transform 0.15s"}}
    >
      <div style={{height:3,background:"linear-gradient(90deg,"+bc+","+bc+"60)"}}/>
      <div style={{padding:"16px 18px"}}>
        <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",gap:10,marginBottom:10}}>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            {sol.logo ? <AppLogo name={sol.appName||""} size={38} accent={bc} logo={sol.logo}/> : <div style={{width:38,height:38,borderRadius:9,background:bc+"18",border:"1px solid "+bc+"30",display:"flex",alignItems:"center",justifyContent:"center",fontSize:17,color:bc,flexShrink:0}}>{sol.icon}</div>}
            <div>
              <div style={{fontSize:13.5,fontWeight:700,color:B.textPri}}>{sol.title}{sol.beta&&<span style={{fontSize:8,marginLeft:5,padding:"1px 4px",borderRadius:3,background:B.amber+"20",color:B.amber,fontWeight:700,textTransform:"uppercase",verticalAlign:"super"}}>Beta</span>}</div>
              <div style={{fontSize:10,color:B.textMut,marginTop:1}}>{sol.tagline}</div>
              <div style={{marginTop:3}}><span style={{fontSize:9,padding:"1px 5px",borderRadius:3,background:bc+"15",color:bc,fontWeight:500,border:"1px solid "+bc+"25"}}>{sol.category}</span></div>
            </div>
          </div>
          {!sol.beta&&<span style={{fontSize:9.5,color:badgeC,whiteSpace:"nowrap",flexShrink:0}}>{"✓ "+sol.badge}</span>}
        </div>
        <p style={{fontSize:11.5,color:B.textSec,lineHeight:1.6,margin:"0 0 11px"}}>{sol.desc.slice(0,155)}...</p>
        <div style={{marginBottom:10}}>
          <div style={{fontSize:9,color:B.textMut,textTransform:"uppercase",marginBottom:5}}>Components</div>
          <div style={{display:"flex",flexWrap:"wrap",gap:4}}>
            {sol.components.map(function(c){
              return <span key={c.name} style={{fontSize:9.5,padding:"1px 7px",borderRadius:4,background:bc+"12",color:bc,border:"1px solid "+bc+"25",fontWeight:500,fontFamily:"monospace"}}>{c.name}</span>;
            })}
          </div>
        </div>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <div style={{display:"flex",gap:4}}>
            {sol.clouds.slice(0,3).map(function(c){return <span key={c} style={{fontSize:9,color:B.textMut,background:B.bg3,borderRadius:3,padding:"1px 5px",border:"1px solid "+B.border}}>{c.replace("AWS ","").replace("Azure ","")}</span>;})}
            {sol.clouds.length>3&&<span style={{fontSize:9,color:B.textMut}}>+{String(sol.clouds.length-3)}</span>}
          </div>
          <span style={{fontSize:10,color:bc,fontWeight:600}}>View solution</span>
        </div>
      </div>
    </div>
  );
}

function SolutionDetail({ sol, onClose, initShide, onShideChange }) {
  var bc = tagAccent(sol.category);
  var badgeC = sol.badge==="Validated"?B.green:bc;
  var ss = SUPPORT_STYLE[sol.tier]||SUPPORT_STYLE.community;
  var [copied, setCopied] = useState(false);
  var [detail, setDetail] = useState<any>(null);
  var [detailLoading, setDetailLoading] = useState(true);
  var [hiddenApps, setHiddenApps] = useState<any>(function(){
    if (!initShide) return {};
    var h={}; initShide.split(",").forEach(function(n){ if(n) h[n]=true; }); return h;
  });
  useEffect(function(){
    var h=function(e){if(e.key==="Escape")onClose();};
    window.addEventListener("keydown",h);
    return function(){window.removeEventListener("keydown",h);};
  },[]);
  var solIdRef = React.useRef(sol.id);
  useEffect(function(){
    if (!sol.appName) { setDetailLoading(false); return; }
    if (solIdRef.current !== sol.id) { setHiddenApps({}); solIdRef.current = sol.id; }
    var solKey = sol.id.replace(sol.appName + "_", "");
    fetch(dataPrefix("") + "apps/" + sol.appName + "/solution_" + solKey + ".json?t=" + Date.now())
      .then(function(r){ return r.ok ? r.json() : null; })
      .then(function(d){ setDetail(d); setDetailLoading(false); })
      .catch(function(){ setDetailLoading(false); });
  },[sol.id]);
  function toggleApp(name:string) {
    setHiddenApps(function(prev:any){
      var nx=Object.assign({},prev); if(nx[name]) delete nx[name]; else nx[name]=true;
      if (onShideChange) {
        var names=Object.keys(nx).filter(function(k){return nx[k];});
        onShideChange(names.join(","));
      }
      return nx;
    });
  }
  var deployYaml = detail ? detail.deployYaml : (sol.deployYaml || "");
  function doCopy(){if(navigator.clipboard)navigator.clipboard.writeText(deployYaml);setCopied(true);setTimeout(function(){setCopied(false);},1500);}
  return (
    <div onClick={onClose} style={{position:"fixed",top:0,left:0,right:0,bottom:0,zIndex:1000,display:"flex",alignItems:"stretch",justifyContent:"flex-end"}}>
      <div className="k0-backdrop" style={{position:"absolute",top:0,left:0,right:0,bottom:0,background:"rgba(5,8,20,0.75)"}}/>
      <div className="k0-detail-panel" onClick={function(e){e.stopPropagation();}} style={{position:"relative",width:"min(700px,100vw)",background:B.bg1,borderLeft:"1px solid "+B.borderHi,display:"flex",flexDirection:"column",overflowY:"auto"}}>
        <div style={{height:3,background:"linear-gradient(90deg,"+bc+","+bc+"50)",flexShrink:0}}/>
        <div className="k0-detail-header" style={{padding:"20px 24px 0",flexShrink:0}}>
          <div style={{display:"flex",gap:12,alignItems:"flex-start",marginBottom:12}}>
            {sol.logo ? <AppLogo name={sol.appName||""} size={48} accent={bc} logo={sol.logo}/> : <div style={{width:48,height:48,borderRadius:11,background:bc+"18",border:"1px solid "+bc+"35",display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,color:bc,flexShrink:0}}>{sol.icon}</div>}
            <div style={{flex:1}}>
              <div style={{display:"flex",alignItems:"center",gap:7,flexWrap:"wrap",marginBottom:3}}>
                <h2 style={{fontSize:19,fontWeight:700,color:B.textPri,margin:0}}>{sol.title}{sol.beta&&<span style={{fontSize:9,marginLeft:6,padding:"2px 5px",borderRadius:3,background:B.amber+"20",color:B.amber,fontWeight:700,textTransform:"uppercase",verticalAlign:"middle"}}>Beta</span>}</h2>
                {!sol.beta&&<span style={{fontSize:9.5,color:badgeC}}>{"✓ "+sol.badge}</span>}
                {!sol.beta&&<span style={{fontSize:8.5,padding:"2px 7px",borderRadius:3,background:ss.bg,color:ss.text,border:"1px solid "+ss.border,fontWeight:600,textTransform:"uppercase"}}>{SUPPORT_LABEL[sol.tier]}</span>}
              </div>
              <div style={{fontSize:11.5,color:B.textMut}}>{sol.tagline}</div>
            </div>
            <button onClick={onClose} style={{background:"transparent",border:"1px solid "+B.border,borderRadius:6,width:30,height:30,display:"flex",alignItems:"center",justifyContent:"center",color:B.textSec,cursor:"pointer",fontSize:13,fontFamily:"inherit",flexShrink:0}}>✕</button>
          </div>
          <p style={{fontSize:14,color:B.textSec,lineHeight:1.8,margin:"0 0 16px"}}>{sol.desc}</p>
        </div>
        <div className="k0-detail-content" style={{padding:"0 24px 24px",flex:1}}>
          <div style={{marginBottom:16}}>
            <div style={{fontSize:9.5,fontWeight:600,color:B.textMut,textTransform:"uppercase",marginBottom:8}}>Use cases</div>
            {sol.useCases.map(function(u){return <div key={u} style={{display:"flex",gap:8,marginBottom:6}}><span style={{color:bc,fontSize:11,flexShrink:0}}>◈</span><span style={{fontSize:13,color:B.textSec,lineHeight:1.6}}>{u}</span></div>;})}
          </div>
          <div style={{marginBottom:16}}>
            <div style={{fontSize:9.5,fontWeight:600,color:B.textMut,textTransform:"uppercase",marginBottom:8}}>Components</div>
            <div style={{border:"1px solid "+B.border,borderRadius:8,overflow:"hidden"}}>
              <table style={{width:"100%",borderCollapse:"collapse"}}>
                <thead><tr style={{background:B.bg3}}>
                  <th style={{padding:"6px 10px",fontSize:9,fontWeight:600,color:B.textMut,textTransform:"uppercase",textAlign:"left",width:30}}/>
                  <th style={{padding:"6px 10px",fontSize:9,fontWeight:600,color:B.textMut,textTransform:"uppercase",textAlign:"left"}}>App</th>
                  <th style={{padding:"6px 10px",fontSize:9,fontWeight:600,color:B.textMut,textTransform:"uppercase",textAlign:"left"}}>Role</th>
                  <th style={{padding:"6px 10px",fontSize:9,fontWeight:600,color:B.textMut,textTransform:"uppercase",textAlign:"left"}}>Why included</th>
                  <th style={{padding:"6px 10px",fontSize:9,fontWeight:600,color:B.textMut,textTransform:"uppercase",textAlign:"center",width:40}}>Include</th>
                </tr></thead>
                <tbody>
                  {sol.components.map(function(c,ci){
                    var hidden=!!hiddenApps[c.name];
                    var app=null;
                    for(var ii=0;ii<RAW.length;ii++){if(RAW[ii].chartName===c.name||RAW[ii].name===c.name){app=RAW[ii];break;}}
                    if(!app){for(var ii2=0;ii2<RAW.length;ii2++){if(c.name.indexOf(RAW[ii2].name)===0){app=RAW[ii2];break;}}}
                    return (
                      <tr key={c.name+c.version} style={{borderTop:"1px solid "+B.border,background:ci%2===0?B.bg2+"50":"transparent",opacity:hidden?0.4:1,transition:"opacity 0.15s"}}>
                        <td style={{padding:"6px 10px"}}>{app && app.logo ? <AppLogo name={app.name} size={22} accent={bc} logo={app.logo} brandColor={app.brandColor}/> : <div style={{width:22,height:22,borderRadius:5,background:bc+"18",display:"flex",alignItems:"center",justifyContent:"center",fontSize:8,fontWeight:700,color:bc,fontFamily:"monospace"}}>{c.name.slice(0,2).toUpperCase()}</div>}</td>
                        <td style={{padding:"8px 10px",whiteSpace:"nowrap"}}><span style={{fontSize:10.5,fontFamily:"monospace",fontWeight:600,color:hidden?B.textMut:bc}}>{c.name}</span><span style={{fontSize:8.5,color:B.textMut,marginLeft:4,fontFamily:"monospace"}}>{c.version}</span></td>
                        <td style={{padding:"8px 10px",fontSize:11,color:c.role?(hidden?B.textMut:bc):B.red,fontWeight:500,whiteSpace:"nowrap"}}>{c.role||"EMPTY"}</td>
                        <td style={{padding:"8px 10px",fontSize:11,color:c.why?B.textSec:B.red,lineHeight:1.5}}>{c.why||"EMPTY"}</td>
                        <td style={{padding:"8px 10px",textAlign:"center"}}><input type="checkbox" checked={!hidden} onChange={function(){toggleApp(c.name);}} style={{accentColor:B.teal,cursor:"pointer",width:14,height:14}}/></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:16}}>
            <div>
              <div style={{fontSize:9.5,fontWeight:600,color:B.textMut,textTransform:"uppercase",marginBottom:7}}>Kubernetes versions</div>
              <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
                {K8S_VERS.map(function(v){var ok=sol.k8s.indexOf(v)!==-1;return <span key={v} style={{fontSize:10.5,padding:"3px 9px",borderRadius:5,border:"1px solid "+(ok?bc+"40":B.border),background:ok?bc+"12":B.bg2,color:ok?bc:B.textMut,fontFamily:"monospace",fontWeight:ok?600:400}}>{v}</span>;})}
              </div>
            </div>
            <div>
              <div style={{fontSize:9.5,fontWeight:600,color:B.textMut,textTransform:"uppercase",marginBottom:7}}>Cloud providers</div>
              <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>
                {sol.clouds.map(function(c){return <span key={c} style={{fontSize:10,padding:"2px 7px",borderRadius:4,background:B.bg3,border:"1px solid "+B.border,color:B.textSec}}>{c}</span>;})}
              </div>
            </div>
          </div>
          {detailLoading ? <div style={{padding:12}}><span style={{fontSize:11,color:B.textSec}}>Loading documentation...</span></div> : detail && detail.contentHtml ? (
            <div style={{marginTop:16,borderTop:"1px solid "+B.border,paddingTop:16}}>
              <div style={{fontSize:9.5,fontWeight:600,color:B.textMut,textTransform:"uppercase",marginBottom:7}}>Documentation</div>
              <HtmlWithCopy html={filterContentHtml(detail.contentHtml, hiddenApps)} style={{fontSize:12,color:B.textSec,lineHeight:1.8}}/>
            </div>
          ) : null}
          <div style={{marginTop:12}}>
            <FinOpsEstimator stackItems={sol.components.filter(function(c){return !hiddenApps[c.name];})} defaultCloud="aws"/>
          </div>
        </div>
      </div>
    </div>
  );
}

function SolutionsPage({ initSolId, initScat, initShide, k0rdentVer }:{ initSolId?:string, initScat?:string, initShide?:string, k0rdentVer?:string }) {
  var [selected, setSelected] = useState<any>(null);
  var [catFilter, setCatFilter] = useState(initScat || "All");
  var [shide, setShide] = useState(initShide || "");
  var cats=["All","AI/ML","Observability","Security"];
  var filtered=SOLUTIONS.filter(function(s){return catFilter==="All"||s.category===catFilter;});

  // Restore selected solution from URL param
  useEffect(function(){
    if (initSolId && !selected) {
      var found = SOLUTIONS.find(function(s:any){ return s.id === initSolId; });
      if (found) setSelected(found);
    }
  }, [initSolId]);

  function updateUrl(sol?:string, cat?:string, hide?:string) {
    history.replaceState(null, "", buildCatalogUrl({view:"solutions",search:"",tag:"All",support:"All",sort:"A-Z",compliance:"All",sol:sol||"",scat:cat||catFilter,shide:hide||""}, k0rdentVer));
  }
  function openSol(sol:any) {
    setSelected(sol);
    setShide("");
    history.pushState(null, "", buildCatalogUrl({view:"solutions",search:"",tag:"All",support:"All",sort:"A-Z",compliance:"All",sol:sol.id,scat:catFilter}, k0rdentVer));
  }
  function closeSol() {
    setSelected(null);
    setShide("");
    history.pushState(null, "", buildCatalogUrl({view:"solutions",search:"",tag:"All",support:"All",sort:"A-Z",compliance:"All",scat:catFilter}, k0rdentVer));
  }
  function onShideChange(newShide:string) {
    setShide(newShide);
    updateUrl(selected?selected.id:"", catFilter, newShide);
  }
  function changeCat(c:string) {
    setCatFilter(c);
    history.replaceState(null, "", buildCatalogUrl({view:"solutions",search:"",tag:"All",support:"All",sort:"A-Z",compliance:"All",scat:c}, k0rdentVer));
  }

  return (
    <div style={{maxWidth:1140,margin:"0 auto",padding:"28px 20px 0"}}>
      <div style={{marginBottom:22,paddingBottom:18,borderBottom:"1px solid "+B.border}}>
        <div style={{fontSize:9.5,fontWeight:600,color:B.teal,textTransform:"uppercase",letterSpacing:"0.14em",marginBottom:7}}>Validated · Composable · Production-ready</div>
        <h1 style={{fontSize:24,fontWeight:700,color:B.textPri,margin:"0 0 7px"}}>Solution bundles for <span style={{color:B.teal}}>AI infrastructure</span></h1>
        <p style={{fontSize:14,color:B.textSec,lineHeight:1.8,maxWidth:720,margin:"0 0 14px",textAlign:"justify"}}>Named solution bundles are curated sets of applications forming fully functional, production-ready configurations for AI and cloud-native use cases. Each bundle is a validated combination of interoperable components with predefined deployment templates.</p>
        <div style={{display:"flex",gap:6,flexWrap:"wrap",alignItems:"center"}}>
          {cats.map(function(c){var active=catFilter===c;var ac=c==="All"?B.teal:tagAccent(c);return <button key={c} onClick={function(){changeCat(c);}} style={{padding:"4px 13px",border:"1px solid "+(active?ac+"60":B.border),borderRadius:20,fontSize:11,background:active?ac+"15":B.bg2,color:active?ac:B.textSec,cursor:"pointer",fontFamily:"inherit"}}>{c}</button>;})}
          <span style={{marginLeft:"auto",fontSize:11,color:B.textMut}}>{filtered.length} bundles</span>
        </div>
      </div>
      <div className="k0-sol-grid" style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(310px,1fr))",gap:13}}>
        {filtered.map(function(sol){return <SolutionCard key={sol.id} sol={sol} onClick={function(){openSol(sol);}}/>;}) }
      </div>
      <div style={{marginTop:28,padding:"16px 20px",background:B.bg2,border:"1px solid "+B.border,borderRadius:9,display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:10}}>
        <div><div style={{fontSize:13,fontWeight:600,color:B.textPri,marginBottom:3}}>Want to contribute a solution bundle?</div><div style={{fontSize:12,color:B.textSec}}>Open a PR with your bundle definition and component list.</div></div>
        <a href="https://github.com/k0rdent/catalog" target="_blank" rel="noreferrer" style={{padding:"8px 16px",background:B.teal,color:B.bg0,borderRadius:6,fontSize:12,fontWeight:700,textDecoration:"none",whiteSpace:"nowrap"}}>Contribute a bundle</a>
      </div>
      {selected!==null&&<SolutionDetail sol={selected} onClose={closeSol} initShide={shide} onShideChange={onShideChange}/>}
    </div>
  );
}

function filterVerifyBash(text:string, hiddenNames:any):string {
  if (!text) return text;
  var lines = text.split("\n");
  var filtered = lines.filter(function(line) {
    var m = line.match(/^#\s+kcm-system\s+(\S+)/);
    if (!m) return true;
    return !templateMatchesHidden(m[1], hiddenNames);
  });
  return filtered.join("\n");
}

function filterContentHtml(contentHtml:string, hiddenNames:any):string {
  if (!contentHtml) return contentHtml;
  var hasHidden = false;
  for (var k in hiddenNames) { if (hiddenNames[k]) { hasHidden = true; break; } }
  if (!hasHidden) return contentHtml;
  return contentHtml.replace(/<pre>[\s\S]*?<\/pre>/g, function(block) {
    var text = block.replace(/<[^>]+>/g, "").replace(/&amp;/g,"&").replace(/&lt;/g,"<").replace(/&gt;/g,">").replace(/&quot;/g,"\"").replace(/&#39;/g,"'");
    if (text.indexOf("helm upgrade --install") !== -1) {
      var filtered = filterInstallBash(text.trim(), hiddenNames);
      return '<pre><code class="language-bash">' + filtered.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;") + '</code></pre>';
    }
    if (text.indexOf("kubectl get servicetemplates") !== -1) {
      var filtered2 = filterVerifyBash(text.trim(), hiddenNames);
      return '<pre><code class="language-bash">' + filtered2.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;") + '</code></pre>';
    }
    if (text.indexOf("MultiClusterService") !== -1) {
      var filtered3 = filterMcsYaml(text.trim(), hiddenNames);
      return '<pre><code class="language-yaml">' + filtered3.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;") + '</code></pre>';
    }
    return block;
  });
}

function filterInstallBash(bash:string, hiddenNames:any):string {
  if (!bash) return bash;
  var cmds = bash.split(/(?=helm upgrade --install )/);
  var filtered = cmds.filter(function(cmd) {
    var m = cmd.match(/chart=([^:]+):/);
    if (!m) return !!cmd.trim();
    return !hiddenNames[m[1]];
  });
  return filtered.join("").trim();
}

function templateMatchesHidden(templateSlug:string, hiddenNames:any):boolean {
  for (var name in hiddenNames) {
    if (hiddenNames[name] && templateSlug.indexOf(name+"-") === 0) return true;
  }
  return false;
}

function removeDependsOnRefs(block:string, removedNames:any):string {
  if (block.indexOf("dependsOn") === -1) return block;
  var result = block.replace(/^      - name: (\S+)\n(?:        namespace: \S+\n)?/gm, function(match, refName) {
    return removedNames[refName] ? "" : match;
  });
  result = result.replace(/^      dependsOn:\n(?=      [a-z]|    - template:|\s*$)/gm, "");
  return result;
}

function filterMcsYaml(yaml:string, hiddenNames:any):string {
  if (!yaml) return yaml;
  var docs = yaml.split(/^---$/m);
  var resultDocs:string[] = [];
  for (var di=0;di<docs.length;di++) {
    var doc = docs[di];
    var servicesIdx = doc.indexOf("    - template:");
    if (servicesIdx === -1) { if(doc.trim()) resultDocs.push(doc); continue; }
    var header = doc.slice(0, servicesIdx);
    var rest = doc.slice(servicesIdx);
    var blocks = rest.split(/(?=    - template:)/);
    var removedNames = {};
    for (var bi=0;bi<blocks.length;bi++) {
      var tm = blocks[bi].match(/template:\s+(\S+)/);
      if (tm && templateMatchesHidden(tm[1], hiddenNames)) {
        var nm = blocks[bi].match(/\n\s+name:\s+(\S+)/);
        if (nm) removedNames[nm[1]] = true;
      }
    }
    var filtered = blocks.filter(function(block) {
      var m = block.match(/template:\s+(\S+)/);
      if (!m) return true;
      return !templateMatchesHidden(m[1], hiddenNames);
    }).map(function(block) {
      return removeDependsOnRefs(block, removedNames);
    });
    if (filtered.length > 0) resultDocs.push(header + filtered.join(""));
  }
  return resultDocs.join("\n---\n");
}

function CldCostEstimator({ costItems, cloudLabel }:{ costItems:any[], cloudLabel:string }) {
  var [clusters, setClusters] = useState(1);
  var [hoursPerMonth, setHoursPerMonth] = useState(730);

  var totalHr = 0;
  for (var i=0;i<costItems.length;i++) totalHr += costItems[i].priceHr * costItems[i].count;
  var totalMo = totalHr * hoursPerMonth * clusters;
  var annual = totalMo * 12;
  var perCluster = totalMo / Math.max(1, clusters);

  return (
    <div style={{marginTop:20,background:B.bg1,border:"1px solid "+B.border,borderRadius:10,overflow:"hidden"}}>
      <div style={{padding:"12px 16px",background:B.bg2,borderBottom:"1px solid "+B.border,display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:8}}>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <span style={{fontSize:14,color:B.amber}}>◈</span>
          <span style={{fontSize:12.5,fontWeight:600,color:B.textPri}}>FinOps Cost Estimator</span>
          <span style={{fontSize:9.5,padding:"1px 7px",borderRadius:10,background:B.amber+"18",color:B.amber,border:"1px solid "+B.amber+"30",fontWeight:500}}>Estimated</span>
        </div>
        <div style={{display:"flex",gap:10,flexWrap:"wrap",alignItems:"center"}}>
          <div style={{display:"flex",alignItems:"center",gap:5}}>
            <span style={{fontSize:10,color:B.textMut}}>Clusters</span>
            <input type="number" min={1} max={100} value={clusters} onChange={function(e:any){setClusters(Math.max(1,parseInt(e.target.value)||1));}} style={{width:52,padding:"3px 7px",border:"1px solid "+B.borderHi,borderRadius:5,fontSize:11,background:B.bg3,color:B.textPri,outline:"none",textAlign:"center"}}/>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:5}}>
            <span style={{fontSize:10,color:B.textMut}}>Hrs/mo</span>
            <input type="number" min={1} max={730} value={hoursPerMonth} onChange={function(e:any){setHoursPerMonth(Math.max(1,Math.min(730,parseInt(e.target.value)||730)));}} style={{width:52,padding:"3px 7px",border:"1px solid "+B.borderHi,borderRadius:5,fontSize:11,background:B.bg3,color:B.textPri,outline:"none",textAlign:"center"}}/>
          </div>
        </div>
      </div>
      <div style={{display:"flex",gap:0,borderBottom:"1px solid "+B.border}}>
        {[
          {l:"Monthly estimate",v:fmt$(totalMo),sub:cloudLabel,c:B.amber},
          {l:"Annual estimate",v:fmt$(annual),sub:"12 months",c:B.teal},
          {l:"Per cluster/mo",v:fmt$(perCluster),sub:clusters+" cluster"+(clusters>1?"s":""),c:B.cyan},
        ].map(function(s,si,arr){
          return (
            <div key={s.l} style={{flex:"1 1 0",padding:"12px 14px",borderRight:si<arr.length-1?"1px solid "+B.border:"none"}}>
              <div style={{fontSize:10,color:B.textMut,marginBottom:2}}>{s.l}</div>
              <div style={{fontSize:17,fontWeight:700,color:s.c,fontFamily:"monospace",lineHeight:1}}>{s.v}</div>
              <div style={{fontSize:9.5,color:B.textMut,marginTop:2}}>{s.sub}</div>
            </div>
          );
        })}
      </div>
      <div style={{padding:"12px 16px"}}>
        <div style={{fontSize:9.5,fontWeight:600,color:B.textMut,textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:10}}>Cost breakdown by node role</div>
        <div style={{display:"flex",flexDirection:"column",gap:6}}>
          {costItems.map(function(item:any){
            var itemMo = item.priceHr * item.count * hoursPerMonth * clusters;
            var barPct = totalMo > 0 ? Math.round(itemMo/totalMo*100) : 0;
            return (
              <div key={item.role}>
                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:3}}>
                  <div style={{display:"flex",alignItems:"center",gap:6}}>
                    <span style={{fontSize:10.5,fontFamily:"monospace",color:B.textPri,fontWeight:500}}>{item.role}</span>
                    <span style={{fontSize:9.5,color:B.textMut}}>{item.count}× {item.type} · ${item.priceHr}/hr each</span>
                  </div>
                  <span style={{fontSize:11,fontFamily:"monospace",color:B.amber,fontWeight:600}}>{fmt$(itemMo)}<span style={{fontSize:9,color:B.textMut,fontWeight:400}}>/mo</span></span>
                </div>
                <div style={{height:5,background:B.bg3,borderRadius:3,overflow:"hidden"}}>
                  <div style={{height:"100%",width:barPct+"%",background:"linear-gradient(90deg,"+B.amber+","+B.amber+"90)",borderRadius:3,transition:"width 0.3s"}}/>
                </div>
              </div>
            );
          })}
        </div>
        <div style={{marginTop:12,padding:"8px 12px",background:B.bg3,borderRadius:6,fontSize:10,color:B.textMut,lineHeight:1.6}}>
          Estimates are indicative only, based on on-demand list pricing for {cloudLabel}. Actual costs vary with reserved instances, spot pricing, and provider discounts.
        </div>
      </div>
    </div>
  );
}


function slugify(s:string):string { return (s||"").toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,""); }

function ConfiguratorPage({ initUsecase, initCcloud, initCscale, k0rdentVer }:{ initUsecase?:string, initCcloud?:string, initCscale?:string, k0rdentVer?:string }) {
  var [step, setStep] = useState(0); // 0=solution, 1=cloud, 2=scale
  var [selectedSol, setSelectedSol] = useState<any>(null);
  var [cloud, setCloud] = useState("");
  var [scale, setScale] = useState("");
  var [copied, setCopied] = useState(false);
  var [resultTab, setResultTab] = useState("cluster"); // "cluster" or "services"
  var [solDetail, setSolDetail] = useState<any>(null);
  var [solDetailLoading, setSolDetailLoading] = useState(false);

  // Use configurator solutions list from config.yaml, resolve full solution data by solId
  var configSolutions = CONFIGURATOR_SOLUTIONS.map(function(cs:any){
    var sol = SOLUTIONS.find(function(s:any){ return s.id === cs.solId; });
    return sol ? Object.assign({}, sol, {cfgIcon:cs.icon, cfgTitle:cs.title, cfgSubtitle:cs.subtitle}) : null;
  }).filter(Boolean);

  // Restore state from URL params — match by slugified title
  useEffect(function(){
    if (initUsecase && !selectedSol) {
      var found = configSolutions.find(function(s:any){ return slugify(s.cfgTitle||s.title) === initUsecase; });
      if (found) {
        setSelectedSol(found);
        if (initCcloud) { setCloud(initCcloud); setStep(2); }
        else { setStep(1); }
        if (initCscale) setScale(initCscale);
      }
    }
  }, [initUsecase, configSolutions.length]);

  function solSlug(sol:any):string { return slugify(sol?sol.cfgTitle||sol.title:""); }

  function updateUrl(sol?:any, cl?:string, sc?:string) {
    history.replaceState(null, "", buildCatalogUrl({view:"configurator",search:"",tag:"All",support:"All",sort:"A-Z",compliance:"All",usecase:sol?solSlug(sol):"",ccloud:cl||"",cscale:sc||""}, k0rdentVer));
  }

  function selectSolution(sol:any) { setSelectedSol(sol); setCloud(""); setScale(""); setResultTab("cluster"); updateUrl(sol); setTimeout(function(){ setStep(1); }, 200); }
  function selectCloud(id:string) { setCloud(id); setScale(""); updateUrl(selectedSol,id); setTimeout(function(){ setStep(2); }, 200); }
  function selectScale(id:string) { setScale(id); updateUrl(selectedSol,cloud,id); }
  function back() { if(step===2){setStep(1);setScale("");updateUrl(selectedSol,cloud);} else if(step===1){setStep(0);setCloud("");setScale("");updateUrl();} }
  function reset() { setStep(0); setSelectedSol(null); setCloud(""); setScale(""); setSolDetail(null); updateUrl(); }

  // Fetch solution detail for Services tab
  useEffect(function(){
    if (!selectedSol || !selectedSol.appName) { setSolDetail(null); return; }
    setSolDetail(null); setSolDetailLoading(true);
    var solKey = selectedSol.id.replace(selectedSol.appName + "_", "");
    fetch(dataPrefix("") + "apps/" + selectedSol.appName + "/solution_" + solKey + ".json?t=" + Date.now())
      .then(function(r){ return r.ok ? r.json() : null; })
      .then(function(d){ setSolDetail(d); setSolDetailLoading(false); })
      .catch(function(){ setSolDetailLoading(false); });
  }, [selectedSol ? selectedSol.id : ""]);

  // configurator is now an array of infra providers
  var infraList:any[] = selectedSol && Array.isArray(selectedSol.configurator) ? selectedSol.configurator : [];
  var selectedInfra:any = cloud ? infraList.find(function(p:any){return p.id===cloud;}) || null : null;
  var costData = selectedInfra ? (selectedInfra.cost||{}) : {};
  var cldsList:any[] = selectedInfra ? (selectedInfra.clds||[]) : [];
  var selectedCld:any = scale ? cldsList.find(function(c:any){return (c.id||slugify(c.title))===scale;}) || null : null;
  var yaml = selectedCld ? (selectedCld.cld||"") : "";

  function doCopy() {
    if(navigator.clipboard) navigator.clipboard.writeText(yaml);
    setCopied(true);
    setTimeout(function(){setCopied(false);},1500);
  }

  var stepLabels = [
    {label:"Use Case", value:selectedSol?(selectedSol.cfgTitle||selectedSol.title):null},
    {label:"Infrastructure", value:selectedInfra?selectedInfra.title:null},
    {label:"Scale", value:selectedCld?selectedCld.title:null},
  ];

  return (
    <div style={{maxWidth:1140,margin:"0 auto",padding:"28px 20px 0"}}>
      <div style={{marginBottom:24,paddingBottom:20,borderBottom:"1px solid "+B.border}}>
        <div style={{fontSize:9.5,fontWeight:600,color:B.teal,textTransform:"uppercase",letterSpacing:"0.14em",marginBottom:8}}>Validated · Composable · One-click deploy</div>
        <h1 style={{fontSize:24,fontWeight:700,color:B.textPri,margin:"0 0 6px"}}>Stack <span style={{color:B.teal}}>configurator</span></h1>
        <p style={{fontSize:13,color:B.textSec,lineHeight:1.8,maxWidth:760,margin:"0 0 14px",textAlign:"justify"}}>
          Choose a solution, target infrastructure, and scale to get a validated ClusterDeployment manifest you can apply directly to your k0rdent management cluster.
        </p>
      </div>

      {/* Progress bar */}
      <div style={{display:"flex",gap:0,marginBottom:28,background:B.bg2,borderRadius:8,overflow:"hidden",border:"1px solid "+B.border,maxWidth:720,margin:"0 auto 28px"}}>
        {stepLabels.map(function(s,si){
          var isActive=si===step;
          var isDone=si<step||(si===2&&!!scale);
          return (
            <div key={s.label} onClick={function(){if(si<step){setStep(si);}}} style={{flex:1,padding:"10px 12px",background:isActive?B.teal+"18":isDone?B.bg3:"transparent",borderRight:si<stepLabels.length-1?"1px solid "+B.border:"none",cursor:si<step?"pointer":"default"}}>
              <div style={{fontSize:9,fontWeight:600,color:isActive?B.teal:isDone?B.green:B.textMut,textTransform:"uppercase",marginBottom:2}}>{si+1}. {s.label}</div>
              <div style={{fontSize:10,color:isActive?B.textPri:isDone?B.textSec:B.textMut}}>
                {isDone && s.value ? s.value : (si===0?"What are you building?":si===1?"Where are you deploying?":"Select cluster scale")}
              </div>
            </div>
          );
        })}
      </div>

      {/* Step 0: Pick solution */}
      {step===0 && (
        <div style={{maxWidth:720,margin:"0 auto"}}>
          <h2 style={{fontSize:18,fontWeight:700,color:B.textPri,margin:"0 0 16px"}}>What are you building?</h2>

          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))",gap:10}}>
            {configSolutions.map(function(sol:any){
              return (
                <div key={sol.id} onClick={function(){selectSolution(sol);}}
                  onMouseEnter={function(e){e.currentTarget.style.borderColor=B.teal+"40";e.currentTarget.style.background=B.bg2;}}
                  onMouseLeave={function(e){e.currentTarget.style.borderColor=B.border;e.currentTarget.style.background=B.bg1;}}
                  style={{background:B.bg1,border:"1px solid "+B.border,borderRadius:10,padding:"14px 16px",cursor:"pointer",transition:"all 0.15s"}}
                >
                  <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:6}}>
                    <span style={{fontSize:16,color:B.textMut}}>{sol.cfgIcon||sol.icon||"◈"}</span>
                  </div>
                  <div style={{fontSize:13,fontWeight:600,color:B.textPri,marginBottom:3}}>{sol.cfgTitle||sol.title}</div>
                  <div style={{fontSize:11,color:B.textSec,lineHeight:1.5}}>{sol.cfgSubtitle||sol.tagline}</div>
                </div>
              );
            })}
          </div>
          {configSolutions.length===0&&<div style={{padding:20,textAlign:"center",color:B.textMut,fontSize:12}}>No solutions with configurator metadata found.</div>}
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginTop:20}}>
            <button style={{padding:"8px 18px",background:B.bg2,border:"1px solid "+B.border,borderRadius:7,fontSize:12,color:B.textSec,opacity:0.4,cursor:"default",fontFamily:"inherit"}}>Back</button>
            <span style={{fontSize:11,color:B.textMut}}>Step 1 of 3</span>
            <div style={{width:80}}/>
          </div>
        </div>
      )}

      {/* Step 1: Pick infrastructure */}
      {step===1 && (
        <div style={{maxWidth:720,margin:"0 auto"}}>
          <h2 style={{fontSize:18,fontWeight:700,color:B.textPri,margin:"0 0 16px"}}>Where are you deploying?</h2>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))",gap:10}}>
            {infraList.map(function(provider:any){
              var active=cloud===provider.id;
              return (
                <div key={provider.id} onClick={function(){selectCloud(provider.id);}}
                  onMouseEnter={function(e){if(!active){e.currentTarget.style.borderColor=B.teal+"40";e.currentTarget.style.background=B.bg2;}}}
                  onMouseLeave={function(e){if(!active){e.currentTarget.style.borderColor=B.border;e.currentTarget.style.background=B.bg1;}}}
                  style={{background:active?B.teal+"18":B.bg1,border:"1px solid "+(active?B.teal+"60":B.border),borderRadius:10,padding:"14px 16px",cursor:"pointer",transition:"all 0.15s"}}
                >
                  <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:6}}>
                    <span style={{fontSize:16,color:active?B.teal:B.textMut}}>{provider.icon}</span>
                    {active&&<span style={{width:14,height:14,borderRadius:"50%",background:B.teal,display:"flex",alignItems:"center",justifyContent:"center",fontSize:8,color:B.bg0,fontWeight:700}}>✓</span>}
                  </div>
                  <div style={{fontSize:13,fontWeight:600,color:active?B.teal:B.textPri,marginBottom:3}}>{provider.title}</div>
                  <div style={{fontSize:11,color:B.textSec,lineHeight:1.5}}>{provider.subtitle}</div>
                </div>
              );
            })}
          </div>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginTop:20}}>
            <button onClick={back} style={{padding:"8px 18px",background:B.bg2,border:"1px solid "+B.border,borderRadius:7,fontSize:12,color:B.textSec,cursor:"pointer",fontFamily:"inherit"}}>Back</button>
            <span style={{fontSize:11,color:B.textMut}}>Step 2 of 3</span>
            <div style={{width:80}}/>
          </div>
        </div>
      )}

      {/* Step 2: Pick scale */}
      {step===2 && !scale && (
        <div style={{maxWidth:720,margin:"0 auto"}}>
          <h2 style={{fontSize:18,fontWeight:700,color:B.textPri,margin:"0 0 16px"}}>What is your expected cluster scale?</h2>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))",gap:10}}>
            {cldsList.map(function(cldItem:any){
              var cldId=cldItem.id||slugify(cldItem.title);
              return (
                <div key={cldId} onClick={function(){selectScale(cldId);}}
                  onMouseEnter={function(e){e.currentTarget.style.borderColor=B.teal+"40";e.currentTarget.style.background=B.bg2;}}
                  onMouseLeave={function(e){e.currentTarget.style.borderColor=B.border;e.currentTarget.style.background=B.bg1;}}
                  style={{background:B.bg1,border:"1px solid "+B.border,borderRadius:10,padding:"14px 16px",cursor:"pointer",transition:"all 0.15s"}}
                >
                  <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:6}}>
                    <span style={{fontSize:16,color:B.textMut}}>{cldItem.icon}</span>
                  </div>
                  <div style={{fontSize:13,fontWeight:600,color:B.textPri,marginBottom:3}}>{cldItem.title}</div>
                  <div style={{fontSize:11,color:B.textSec,lineHeight:1.5}}>{cldItem.subtitle}</div>
                </div>
              );
            })}
          </div>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginTop:20}}>
            <button onClick={back} style={{padding:"8px 18px",background:B.bg2,border:"1px solid "+B.border,borderRadius:7,fontSize:12,color:B.textSec,cursor:"pointer",fontFamily:"inherit"}}>Back</button>
            <span style={{fontSize:11,color:B.textMut}}>Step 3 of 3</span>
            <div style={{width:80}}/>
          </div>
        </div>
      )}

      {/* Result */}
      {scale && selectedSol && (
        <div>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:12,marginBottom:20}}>
            <div>
              <h2 style={{fontSize:18,fontWeight:700,color:B.textPri,margin:"0 0 4px"}}>{selectedSol.cfgTitle||selectedSol.title} <span style={{color:B.teal}}>— {selectedInfra?selectedInfra.title:cloud} / {selectedCld?selectedCld.title:scale}</span></h2>
              <div style={{fontSize:12,color:B.textSec}}>Validated deployment for k0rdent</div>
            </div>
            <div style={{display:"flex",gap:8}}>
              <button onClick={reset} style={{padding:"7px 16px",background:B.bg2,border:"1px solid "+B.border,borderRadius:7,fontSize:12,color:B.textSec,cursor:"pointer",fontFamily:"inherit"}}>Start over</button>
            </div>
          </div>

          <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:20}}>
            {stepLabels.map(function(s){return s.value?<div key={s.label} style={{display:"flex",alignItems:"center",gap:6,background:B.bg2,border:"1px solid "+B.teal+"40",borderRadius:20,padding:"4px 12px"}}><span style={{fontSize:9.5,color:B.textMut,textTransform:"uppercase",fontWeight:600}}>{s.label}</span><span style={{fontSize:11,color:B.teal,fontWeight:500}}>{s.value}</span></div>:null;})}
          </div>

          {/* Tabs */}
          <div style={{display:"flex",gap:0,marginBottom:20,borderBottom:"1px solid "+B.border}}>
            {[{id:"cluster",label:"Cluster deployment"},{id:"services",label:"Services deployment"}].map(function(tab){
              var active=resultTab===tab.id;
              return <button key={tab.id} onClick={function(){setResultTab(tab.id);}} style={{padding:"8px 18px",fontSize:12,color:active?B.teal:B.textSec,background:"transparent",border:"none",borderBottom:"2px solid "+(active?B.teal:"transparent"),cursor:"pointer",fontFamily:"inherit",fontWeight:active?600:400}}>{tab.label}</button>;
            })}
          </div>

          {/* Cluster deployment tab */}
          {resultTab==="cluster" && (function(){
            // Parse CLD YAML for cost estimation
            var costItems:any[] = [];
            if (yaml && Object.keys(costData).length > 0) {
              // Extract controlPlane instanceType/vmSize/flavor and count
              var cpType = (yaml.match(/controlPlane:[\s\S]*?(?:instanceType|vmSize|flavor):\s*"?([^\s"]+)"?/) || [])[1];
              var cpCount = parseInt((yaml.match(/controlPlaneNumber:\s*(\d+)/) || [])[1] || "1");
              // Extract worker instanceType/vmSize/flavor and count
              var wType = (yaml.match(/worker:[\s\S]*?(?:instanceType|vmSize|flavor):\s*"?([^\s"]+)"?/) || [])[1];
              var wCount = parseInt((yaml.match(/workersNumber:\s*(\d+)/) || [])[1] || "1");
              if (cpType && costData[cpType]) costItems.push({role:"Control plane", type:cpType, count:cpCount, priceHr:costData[cpType]});
              if (wType && costData[wType]) costItems.push({role:"Worker", type:wType, count:wCount, priceHr:costData[wType]});
            }
            var totalHr = 0; for(var ci2=0;ci2<costItems.length;ci2++) totalHr += costItems[ci2].priceHr * costItems[ci2].count;
            var totalMo = totalHr * 730;
            return (
            <div>
              <div style={{position:"relative"}}>
                {yaml ? <HtmlWithCopy html={'<pre><code class="language-yaml">'+yaml.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")+'</code></pre>'} style={{fontSize:12,color:B.textSec,lineHeight:1.8}}/> : <div style={{background:B.bg2,border:"1px solid "+B.border,borderRadius:8,padding:"14px 16px",fontSize:11,color:B.textMut}}>No manifest available for this combination.</div>}
              </div>
              <div style={{marginTop:10,padding:"10px 14px",background:B.tealBg,border:"1px solid "+B.teal+"30",borderRadius:7,fontSize:11.5,color:B.textSec,lineHeight:1.65}}>
                <span style={{color:B.teal,fontWeight:600}}>Next step: </span>
                Apply this ClusterDeployment manifest to your k0rdent management cluster to provision the infrastructure.
              </div>
              {costItems.length > 0 && <CldCostEstimator costItems={costItems} cloudLabel={selectedInfra?selectedInfra.title:cloud}/>}
            </div>
            );
          })()}

          {/* Services deployment tab */}
          {resultTab==="services" && (
            <div>
              {solDetailLoading ? <div style={{padding:12}}><span style={{fontSize:11,color:B.textSec}}>Loading solution documentation...</span></div> : solDetail && solDetail.contentHtml ? (function(){
                // Extract only install, verify, and MCS pre blocks
                var blocks = solDetail.contentHtml.match(/<pre>[\s\S]*?<\/pre>/g) || [];
                var parts:string[] = [];
                for (var bi=0;bi<blocks.length;bi++) {
                  var text = blocks[bi].replace(/<[^>]+>/g,"");
                  if (text.indexOf("helm upgrade --install") !== -1) { parts.push('<div style="margin-bottom:16px"><div style="font-size:9.5px;font-weight:600;color:'+B.textMut+';text-transform:uppercase;margin-bottom:7px">Install service templates</div>'+blocks[bi]+'</div>'); }
                  else if (text.indexOf("kubectl get servicetemplates") !== -1) { parts.push('<div style="margin-bottom:16px"><div style="font-size:9.5px;font-weight:600;color:'+B.textMut+';text-transform:uppercase;margin-bottom:7px">Verify service templates</div>'+blocks[bi]+'</div>'); }
                  else if (text.indexOf("MultiClusterService") !== -1) { parts.push('<div style="margin-bottom:16px"><div style="font-size:9.5px;font-weight:600;color:'+B.textMut+';text-transform:uppercase;margin-bottom:7px">Deploy MultiClusterService</div>'+blocks[bi]+'</div>'); }
                }
                return parts.length > 0 ? <HtmlWithCopy html={parts.join("")} style={{fontSize:12,color:B.textSec,lineHeight:1.8}}/> : <div style={{padding:12,fontSize:11,color:B.textMut}}>No service deployment snippets found.</div>;
              })() : <div style={{padding:12,fontSize:11,color:B.textMut}}>No documentation available for this solution.</div>}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

var INFRA_FILTERS = [{key:"All",label:"All"},{key:"public",label:"Public Cloud"},{key:"private",label:"Private Cloud / On-premises"}];
var INFRA_GROUPS = [{key:"public",label:"Public Cloud",color:"#00c8c8"},{key:"private",label:"Private Cloud / On-premises",color:"#a78bfa"}];

function InfraPage({ k0rdentVer, initInfraApp, initDtab, initIgrp }:{ k0rdentVer?:string, initInfraApp?:string, initDtab?:string, initIgrp?:string }) {
  var [selected, setSelected] = useState<any>(null);
  var [detailTab, setDetailTab] = useState(initDtab || "overview");
  var [detailVer, setDetailVer] = useState("");
  var [infraFilter, setInfraFilter] = useState(initIgrp || "All");

  // Restore selected infra from URL
  useEffect(function(){
    if (initInfraApp && !selected) {
      var found = INFRA.find(function(i:any){ return i.name === initInfraApp; });
      if (found) setSelected(found);
    }
  }, [initInfraApp]);

  // Sync detail tab to URL
  useEffect(function(){
    if (selected) {
      var dtabParam:Record<string,string> = {};
      if (detailTab && detailTab !== "overview") dtabParam["dtab"] = detailTab;
      history.replaceState(null, "", infraUrl(selected.name + "/", dtabParam));
    }
  }, [detailTab]);

  function infraUrl(suffix?:string, params?:Record<string,string>) {
    var p = new URLSearchParams();
    if (infraFilter !== "All") p.set("igrp", infraFilter);
    if (params) Object.keys(params).forEach(function(k){ if(params[k]) p.set(k, params[k]); });
    var qs = p.toString();
    return appendTheme(versionBase(k0rdentVer || "") + "infra/" + (suffix || "") + (qs ? "?" + qs : ""));
  }

  function changeFilter(f:string) {
    setInfraFilter(f);
    var p = new URLSearchParams();
    if (f !== "All") p.set("igrp", f);
    var qs = p.toString();
    history.replaceState(null, "", appendTheme(versionBase(k0rdentVer || "") + "infra/" + (qs ? "?" + qs : "")));
  }

  function openInfra(item:any) {
    setSelected(item);
    setDetailTab("overview");
    setDetailVer("");
    history.pushState(null, "", infraUrl(item.name + "/"));
  }
  function closeInfra() {
    setSelected(null);
    setDetailTab("overview");
    setDetailVer("");
    history.pushState(null, "", infraUrl());
  }




  return (
    <div style={{maxWidth:1140,margin:"0 auto",padding:"28px 20px 0"}}>
      <div style={{marginBottom:24,paddingBottom:20,borderBottom:"1px solid "+B.border}}>
        <div style={{fontSize:10,fontWeight:600,color:B.teal,textTransform:"uppercase",letterSpacing:"0.14em",marginBottom:7}}>Cloud · On-premises · Hybrid</div>
        <h1 style={{fontSize:24,fontWeight:700,color:B.textPri,margin:"0 0 10px"}}>Target <span style={{color:B.teal}}>infrastructure</span></h1>
        <p style={{fontSize:14,color:B.textSec,lineHeight:1.8,maxWidth:720,margin:"0 0 16px"}}>k0rdent deploys and manages catalog integrations across public cloud, private cloud, and bare metal environments from a single management cluster. Every integration is validated against one or more of the target environments below.</p>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))",gap:8,marginBottom:16}}>
          {[{n:String(INFRA.length),l:"Target environments",c:B.teal},{n:String(INFRA.filter(function(i:any){return i.infraGroup==="public";}).length),l:"Public cloud providers",c:B.cyan},{n:String(INFRA.filter(function(i:any){return i.infraGroup==="private";}).length),l:"Private cloud / on-premises",c:B.purple}].map(function(s:any){
            return <div key={s.l} style={{background:B.bg2,border:"1px solid "+B.border,borderRadius:8,padding:"10px 14px"}}>
              <div style={{fontSize:22,fontWeight:700,color:s.c,fontFamily:"monospace"}}>{s.n}</div>
              <div style={{fontSize:12,color:B.textSec,marginTop:2}}>{s.l}</div>
            </div>;
          })}
        </div>
        <div style={{display:"flex",gap:6,flexWrap:"wrap",alignItems:"center"}}>
          {INFRA_FILTERS.map(function(f){
            var active=infraFilter===f.key;
            var grp=INFRA_GROUPS.find(function(g){return g.key===f.key;});
            var color=grp?grp.color:B.teal;
            return <button key={f.key} onClick={function(){changeFilter(f.key);}} style={{padding:"4px 13px",border:"1px solid "+(active?color+"60":B.border),borderRadius:20,fontSize:12,background:active?color+"15":B.bg2,color:active?color:B.textSec,cursor:"pointer",fontFamily:"inherit"}}>{f.label}</button>;
          })}
        </div>
      </div>
      {INFRA_GROUPS.filter(function(g){ return infraFilter === "All" || g.key === infraFilter; }).map(function(group){
        var groupItems = INFRA.filter(function(i:any){ return i.infraGroup === group.key; }).sort(function(a:any,b:any){ return (a.title||a.name).localeCompare(b.title||b.name); });
        if (groupItems.length === 0) return null;
        return (
          <div key={group.key} style={{marginBottom:20}}>
            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10,paddingBottom:8,borderBottom:"1px solid "+B.border}}>
              <div style={{width:12,height:12,borderRadius:3,background:group.color}}/>
              <span style={{fontSize:14,fontWeight:700,color:B.textPri}}>{group.label}</span>
              <span style={{fontSize:11,color:B.textMut}}>{groupItems.length} provider{groupItems.length>1?"s":""}</span>
            </div>
            <div className="k0-infra-grid" style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(340px,1fr))",gap:10}}>
              {groupItems.map(function(item:any){
                var accent = item.brandColor || group.color;
                return (
                  <div key={item.name} onClick={function(){openInfra(item);}} style={{background:B.bg1,border:"1px solid "+B.border,borderRadius:10,overflow:"hidden",cursor:"pointer",transition:"border-color 0.15s"}}>
                    <div style={{height:3,background:"linear-gradient(90deg,"+accent+","+accent+"60)"}}/>
                    <div style={{padding:"14px 16px"}}>
                      <div style={{display:"flex",alignItems:"flex-start",gap:12,marginBottom:10}}>
                        <AppLogo name={item.name} size={40} accent={accent} logo={item.logo} brandColor={item.brandColor} isInfra/>
                        <div style={{flex:1}}>
                          <div style={{fontSize:15,fontWeight:700,color:B.textPri,marginBottom:3}}>{item.title||item.name}</div>
                          <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>
                            {(item.tags||[]).map(function(t:string){return <span key={t} style={{fontSize:9,padding:"1px 6px",borderRadius:3,background:accent+"12",color:accent,border:"1px solid "+accent+"25",fontWeight:500}}>{t}</span>;})}
                          </div>
                        </div>
                      </div>
                      <p style={{fontSize:13,color:B.textSec,margin:"0 0 10px",lineHeight:1.65}}>{item.desc}</p>
                      <div style={{display:"flex",alignItems:"center",justifyContent:"flex-end"}}>
                        <span style={{fontSize:10.5,color:B.teal,fontWeight:500}}>View details →</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
      {selected&&<DetailPanel item={selected} tab={detailTab} setTab={setDetailTab} selVer={detailVer} setSelVer={setDetailVer} k0rdentVer={k0rdentVer} detailImg="" setDetailImg={function(){}} detailImgChart="" setDetailImgChart={function(){}} detailImgSub="" setDetailImgSub={function(){}} onClose={closeInfra}/>}
    </div>
  );
}

function ContributePage() {
  var [html, setHtml] = useState("");
  var [loading, setLoading] = useState(true);
  useEffect(function(){
    fetch(BASE + "contribute.json?t=" + Date.now())
      .then(function(r){ return r.ok ? r.json() : null; })
      .then(function(d){ if (d && d.contentHtml) setHtml(d.contentHtml); setLoading(false); })
      .catch(function(){ setLoading(false); });
  }, []);
  return (
    <div style={{maxWidth:860,margin:"0 auto",padding:"30px 20px 0"}}>
      {loading ? <div style={{color:B.textSec,fontSize:13}}>Loading...</div>
        : html ? <HtmlWithCopy html={html} style={{fontSize:14,color:B.textSec,lineHeight:1.8}}/>
        : <div style={{color:B.textMut,fontSize:13}}>Contribute page not available.</div>
      }
    </div>
  );
}

function Nav({ view, setView, resetFilters, versions, k0rdentVer, onVersionChange, dark, toggleTheme }:any) {
  function navTo(v:string) {
    if (v === "catalog") { resetFilters(); }
    setView(v);
    if (v === "catalog") {
      history.pushState(null, "", appendTheme(versionBase(k0rdentVer || "")));
    } else {
      history.pushState(null, "", appendTheme(versionBase(k0rdentVer || "") + v + "/"));
    }
  }
  var displayVer = k0rdentVer || versions.latest || "";
  return (
    <div style={{background:"#000000",borderBottom:"1px solid #555760",padding:"0 20px",position:"sticky",top:0,zIndex:100}}>
      <div className="k0-nav-inner" style={{maxWidth:1140,margin:"0 auto",display:"flex",alignItems:"center",justifyContent:"space-between",height:52}}>
        <div className="k0-nav-left" style={{display:"flex",alignItems:"center",gap:14}}>
          <img onClick={function(){navTo("catalog");}} src={BASE+"k0rdent-logo.svg"} alt="k0rdent" style={{cursor:"pointer",height:22}} />
          {versions.versions.length > 0 && (
            <select value={displayVer} onChange={function(e:any){onVersionChange(e.target.value);}} style={{padding:"3px 6px",fontSize:10,background:"#161618",color:"#ffffff",border:"1px solid #555760",borderRadius:4,cursor:"pointer",fontFamily:"monospace",outline:"none"}}>
              {versions.versions.slice().reverse().map(function(v:string){
                return <option key={v} value={v}>{v}{v===versions.latest?" (latest)":""}</option>;
              })}
            </select>
          )}
          <div className="k0-nav-actions" style={{display:"none",gap:5,alignItems:"center"}}>
            <button onClick={toggleTheme} title={dark?"Switch to light theme":"Switch to dark theme"} style={{width:34,height:20,borderRadius:10,border:"1px solid #555760",background:"#000000",cursor:"pointer",position:"relative",padding:0,flexShrink:0}}><span style={{position:"absolute",top:2,left:dark?2:"auto",right:dark?"auto":2,width:14,height:14,borderRadius:"50%",background:"#f1f4fb",display:"flex",alignItems:"center",justifyContent:"center",fontSize:8}}>{dark?"\u263E":"\u2600"}</span></button>
            <a href="https://github.com/k0rdent/catalog" target="_blank" rel="noreferrer" style={{fontSize:10,color:"#ffffff",textDecoration:"none",padding:"3px 10px",border:"1px solid #ffffff",borderRadius:999,background:"transparent"}}>G</a>
            <a href={BASE+"contribute/"} onClick={function(e:any){e.preventDefault();setView("contribute");history.pushState(null,"",appendTheme(versionBase(k0rdentVer||"")+"contribute/"));}} style={{fontSize:10,color:"#000000",padding:"3px 10px",borderRadius:999,background:"#35db78",fontWeight:600,border:"none",cursor:"pointer",fontFamily:"inherit",textDecoration:"none"}}>C</a>
          </div>
          <div className="k0-nav-tabs" style={{display:"flex",gap:0,height:52,alignItems:"stretch"}}>
            {["catalog","infra","solutions","configurator"].map(function(v){
              var active=view===v;
              var label=v==="infra"?"Infrastructure":v;
              return <button key={v} onClick={function(){navTo(v);}} style={{padding:"0 14px",fontSize:12,color:active?"#35db78":"#ffffff",background:"transparent",border:"none",borderBottom:"2px solid "+(active?"#35db78":"transparent"),cursor:"pointer",fontFamily:"inherit",fontWeight:active?600:400,textTransform:"capitalize"}}>{label}</button>;
            })}
          </div>
        </div>
        <div className="k0-nav-right" style={{display:"flex",gap:8,alignItems:"center"}}>
          <button onClick={toggleTheme} title={dark?"Switch to light theme":"Switch to dark theme"} style={{width:40,height:24,borderRadius:12,border:"1px solid #555760",background:"#000000",cursor:"pointer",position:"relative",padding:0,flexShrink:0,transition:"background 0.2s"}}><span style={{position:"absolute",top:2,left:dark?2:"auto",right:dark?"auto":2,width:18,height:18,borderRadius:"50%",background:"#f1f4fb",transition:"left 0.2s,right 0.2s",display:"flex",alignItems:"center",justifyContent:"center",fontSize:10}}>{dark?"\u263E":"\u2600"}</span></button>
          <a href="https://github.com/k0rdent/catalog" target="_blank" rel="noreferrer" style={{fontSize:11,color:"#ffffff",textDecoration:"none",padding:"5px 14px",border:"1px solid #ffffff",borderRadius:999,background:"transparent"}}>GitHub</a>
          <a href={BASE+"contribute/"} onClick={function(e:any){e.preventDefault();setView("contribute");history.pushState(null,"",appendTheme(versionBase(k0rdentVer||"")+"contribute/"));}} style={{fontSize:11,color:"#000000",padding:"5px 14px",borderRadius:999,background:"#35db78",fontWeight:600,border:"none",cursor:"pointer",fontFamily:"inherit",textDecoration:"none"}}>Contribute</a>
        </div>
      </div>
    </div>
  );
}

// Detect base path and current k0rdent version from URL
var BASE = (function(){
  var b = document.querySelector("base");
  if (b) return b.getAttribute("href") || "/";
  var s = document.querySelector('script[src*="k0rdent_catalog"]');
  if (s) { var m = (s as HTMLScriptElement).src.match(/^(.*?)\/?(?:src|assets)\//); if (m) return new URL(m[1]).pathname + "/"; }
  var p = window.location.pathname.replace(/\/apps\/[^/]+\/?$/, "/").replace(/\/infra\/[^/]+\/?$/, "/").replace(/\/(contribute|solutions|infra|configurator)\/?$/, "/").replace(/\/+$/, "/");
  return p || "/";
})();

// Detect k0rdent version from URL path (e.g. /v1.7.0/ or /latest/)
function detectUrlVersion(): string {
  var m = window.location.pathname.match(/\/(v\d+\.\d+\.\d+)\//);
  return m ? m[1] : "";
}

// Build data URL prefix for a given k0rdent version
function dataPrefix(k0rdentVer: string): string {
  if (!k0rdentVer) return BASE;
  // If BASE already contains the version (e.g. /v1.7.0/), use it as-is
  if (BASE.indexOf(k0rdentVer) !== -1) return BASE;
  // Otherwise, insert version into the path: /latest/ -> /v1.7.0/
  return BASE.replace(/\/(latest|v\d+\.\d+\.\d+)\/$/, "/" + k0rdentVer + "/");
}

function readUrlParams() {
  var p = new URLSearchParams(window.location.search);
  var pathname = window.location.pathname;
  // Parse app name from /apps/<name>/ path
  var appMatch = pathname.match(/\/apps\/([^/]+)/);
  var app = appMatch ? appMatch[1] : (p.get("app") || "");
  // Parse infra name from /infra/<name>/ path
  var infraMatch = pathname.match(/\/infra\/([^/]+)/);
  var infraApp = infraMatch ? infraMatch[1] : "";
  // Detect view from path
  var pathView = infraMatch ? "infra" : (pathname.match(/\/(contribute|solutions|infra|configurator)\/?$/) || [null,null])[1];
  return {
    view: pathView || (p.get("view") || "catalog"),
    search: p.get("q") || "",
    tag: p.get("tag") || "All",
    support: p.get("support") || "All",
    sort: p.get("sort") || "A-Z",
    compliance: p.get("compliance") || "All",
    app: app,
    dtab: p.get("dtab") || "overview",
    ver: p.get("ver") || "",
    sol: p.get("sol") || "",
    scat: p.get("scat") || "All",
    shide: p.get("shide") || "",
    usecase: p.get("usecase") || "",
    ccloud: p.get("ccloud") || "",
    cscale: p.get("cscale") || "",
    infraApp: infraApp,
    igrp: p.get("igrp") || "All",
    img: p.get("img") || "",
    imgChart: p.get("imgChart") || "",
    imgSub: p.get("imgSub") || "",
    theme: p.get("theme") || "",
  };
}

function versionBase(k0rdentVer:string):string {
  if (!k0rdentVer) return BASE;
  return BASE.replace(/\/(latest|v\d+\.\d+\.\d+)\/$/, "/" + k0rdentVer + "/");
}

function buildAppUrl(appName:string, dtab:string, ver:string, k0rdentVer?:string, img?:string, imgChart?:string, imgSub?:string):string {
  var p = new URLSearchParams();
  if (dtab && dtab !== "overview") p.set("dtab", dtab);
  if (ver) p.set("ver", ver);
  if (img) p.set("img", img);
  if (imgChart) p.set("imgChart", imgChart);
  if (imgSub) p.set("imgSub", imgSub);
  var qs = p.toString();
  return appendTheme(versionBase(k0rdentVer || "") + "apps/" + appName + "/" + (qs ? "?" + qs : ""));
}

function buildCatalogUrl(state:{view:string, search:string, tag:string, support:string, sort:string, compliance:string, sol?:string, scat?:string, shide?:string, usecase?:string, ccloud?:string, cscale?:string}, k0rdentVer?:string):string {
  if (state.view === "contribute" || state.view === "solutions" || state.view === "infra" || state.view === "configurator") {
    var base = versionBase(k0rdentVer || "") + state.view + "/";
    var sp = new URLSearchParams();
    if (state.sol) sp.set("sol", state.sol);
    if (state.scat && state.scat !== "All") sp.set("scat", state.scat);
    if (state.shide) sp.set("shide", state.shide);
    if (state.usecase) sp.set("usecase", state.usecase);
    if (state.ccloud) sp.set("ccloud", state.ccloud);
    if (state.cscale) sp.set("cscale", state.cscale);
    var sqs = sp.toString();
    return appendTheme(base + (sqs ? "?" + sqs : ""));
  }
  var p = new URLSearchParams();
  if (state.view !== "catalog") p.set("view", state.view);
  if (state.search) p.set("q", state.search);
  if (state.tag !== "All") p.set("tag", state.tag);
  if (state.support !== "All") p.set("support", state.support);
  if (state.sort !== "A-Z") p.set("sort", state.sort);
  if (state.compliance !== "All") p.set("compliance", state.compliance);
  if (state.sol) p.set("sol", state.sol);
  if (state.scat && state.scat !== "All") p.set("scat", state.scat);
  var qs = p.toString();
  return appendTheme(versionBase(k0rdentVer || "") + (qs ? "?" + qs : ""));
}

export default function App() {
  var initParams = useMemo(readUrlParams, []);
  var [renderKey, setRenderKey] = useState(0);
  var [dark, setDark] = useState(initParams.theme !== "light");
  function toggleTheme() {
    var next = !dark;
    applyTheme(next);
    setDark(next);
    setRenderKey(function(k:number){ return k + 1; });
    // Update theme in current URL
    var u = new URL(window.location.href);
    if (next) { u.searchParams.delete("theme"); } else { u.searchParams.set("theme", "light"); }
    history.replaceState(null, "", u.pathname + (u.search || ""));
  }
  applyTheme(dark);
  var [loading, setLoading] = useState(true);
  var [loadError, setLoadError] = useState("");
  var [k0rdentVer, setK0rdentVer] = useState(detectUrlVersion);
  var [versions, setVersions] = useState<{versions:string[],latest:string}>({versions:[],latest:""});
  var [view, setView] = useState(initParams.view);
  var [search, setSearch] = useState(initParams.search);
  var [tag, setTag] = useState(initParams.tag);
  var [support, setSupport] = useState(initParams.support);
  var [sort, setSort] = useState(initParams.sort);
  var [compliance, setCompliance] = useState(initParams.compliance);
  var [selected, setSelected] = useState<any>(null);
  var [detailTab, setDetailTab] = useState(initParams.dtab);
  var [detailVer, setDetailVer] = useState(initParams.ver);
  var [detailImg, setDetailImg] = useState(initParams.img);
  var [detailImgChart, setDetailImgChart] = useState(initParams.imgChart);
  var [detailImgSub, setDetailImgSub] = useState(initParams.imgSub);
  var [sidebarOpen, setSidebarOpen] = useState(function(){ return window.innerWidth > 640; });

  // Restore selected app from URL after data loads
  useEffect(function(){
    if (!loading && initParams.app && !selected) {
      var found = RAW.find(function(i:any){ return i.name === initParams.app; });
      if (found) {
        setSelected(found);
        if (initParams.ver) setDetailVer(initParams.ver);
      }
    }
  }, [loading]);

  // Handle browser back/forward
  useEffect(function(){
    function onPopState() {
      var params = readUrlParams();
      if (params.app) {
        var found = RAW.find(function(i:any){ return i.name === params.app; });
        if (found) {
          setSelected(found);
          setDetailTab(params.dtab);
          setDetailVer(params.ver || found.version);
          setDetailImg(params.img || "");
          setDetailImgChart(params.imgChart || "");
          setDetailImgSub(params.imgSub || "");
          return;
        }
      }
      setSelected(null);
      setDetailTab("overview");
      setDetailVer("");
      setDetailImg("");
      setDetailImgChart("");
      setDetailImgSub("");
      // Restore catalog filters from URL
      setView(params.view);
      setSearch(params.search);
      setTag(params.tag);
      setSupport(params.support);
      setSort(params.sort);
      setCompliance(params.compliance);
    }
    window.addEventListener("popstate", onPopState);
    return function(){ window.removeEventListener("popstate", onPopState); };
  }, []);

  // Sync URL when app detail tab/version changes (replaceState, no history entry)
  useEffect(function(){
    if (!loading && selected) {
      history.replaceState(null, "", buildAppUrl(selected.name, detailTab, detailVer, k0rdentVer, detailImg, detailImgChart, detailImgSub));
    }
  }, [detailTab, detailVer, detailImg, detailImgChart, detailImgSub]);

  // Sync catalog filters to URL (replaceState)
  useEffect(function(){
    // Don't overwrite /apps/<name>/ URL before the app is restored from URL
    if (!loading && !selected && !window.location.pathname.match(/\/apps\/[^/]+/) && !window.location.pathname.match(/\/infra\/[^/]+/) && !window.location.pathname.match(/\/(contribute|solutions|infra|configurator)\/?$/)) {
      history.replaceState(null, "", buildCatalogUrl({view, search, tag, support, sort, compliance}, k0rdentVer));
    }
  }, [view, search, tag, support, sort, compliance, loading]);

  function doLoad(ver?:string) {
    var prefix = dataPrefix(ver || k0rdentVer);
    setLoading(true);
    setLoadError("");
    _catalogLoaded = false;

    // Fetch versions.json (once)
    var versionsPromise = versions.versions.length > 0
      ? Promise.resolve()
      : fetch(BASE + "versions.json?t=" + Date.now())
          .then(function(r){ return r.ok ? r.json() : null; })
          .then(function(d:any){ if (d) setVersions(d); })
          .catch(function(){});

    // Fetch catalog data for the selected version
    var catalogPromise = fetch(prefix + "catalog.json?t=" + Date.now())
      .then(function(r){
        if (!r.ok) throw new Error("HTTP " + r.status);
        return r.json();
      })
      .then(function(data:any){
        var apps = Array.isArray(data) ? data : (data.apps || []);
        var solutions = Array.isArray(data) ? [] : (data.solutions || []);
        var infraData = Array.isArray(data) ? [] : (data.infra || []);
        RAW.length = 0;
        Array.prototype.push.apply(RAW, apps);
        SOLUTIONS.length = 0;
        Array.prototype.push.apply(SOLUTIONS, solutions);
        Array.prototype.push.apply(SOLUTIONS, HARDCODED_SOLUTIONS);
        SOLUTIONS.sort(function(a:any,b:any){ return (a.title||"").localeCompare(b.title||""); });
        INFRA.length = 0;
        Array.prototype.push.apply(INFRA, infraData);
        CONFIGURATOR_SOLUTIONS.length = 0;
        var cfgSols = Array.isArray(data) ? [] : (data.configuratorSolutions || []);
        Array.prototype.push.apply(CONFIGURATOR_SOLUTIONS, cfgSols);
        ALL_TAGS.length = 0;
        ALL_TAGS.push("All");
        var seen:any = {};
        for (var i = 0; i < RAW.length; i++) {
          for (var j = 0; j < RAW[i].tags.length; j++) {
            if (!seen[RAW[i].tags[j]]) { seen[RAW[i].tags[j]] = 1; ALL_TAGS.push(RAW[i].tags[j]); }
          }
        }
        ALL_TAGS.sort(function(a:string,b:string){ return a==="All"?-1:b==="All"?1:a.localeCompare(b); });
        _catalogLoaded = true;
      });

    Promise.all([versionsPromise, catalogPromise])
      .then(function(){ setLoading(false); })
      .catch(function(e:any){ setLoadError(String(e)); setLoading(false); });
  }

  function switchK0rdentVersion(newVer:string) {
    setK0rdentVer(newVer);
    setSelected(null);
    setDetailTab("overview");
    setDetailVer("");
    // Navigate to the new version URL
    var newBase = BASE.replace(/\/(latest|v\d+\.\d+\.\d+)\/$/, "/" + newVer + "/");
    history.pushState(null, "", newBase);
    doLoad(newVer);
  }

  useEffect(function(){ doLoad(); }, []);

  var filtered = useMemo(function(){
    if (loading) return [];
    var r=RAW.filter(function(i){
      return (tag==="All"||i.tags.indexOf(tag)!==-1)&&
             (support==="All"||getEff(i)===support)&&
             (compliance==="All"||(COMPLIANCE[i.name]||[]).indexOf(compliance)!==-1)&&
             (!search||i.name.toLowerCase().indexOf(search.toLowerCase())!==-1||i.desc.toLowerCase().indexOf(search.toLowerCase())!==-1||i.tags.join(" ").toLowerCase().indexOf(search.toLowerCase())!==-1);
    });
    if(sort==="A-Z") r.sort(function(a,b){return a.name.localeCompare(b.name);});
    if(sort==="Z-A") r.sort(function(a,b){return b.name.localeCompare(a.name);});
    if(sort==="Tested first") r.sort(function(a,b){return b.tested-a.tested;});
    if(sort==="Certified first") r.sort(function(a,b){return (getEff(b)==="mirantis-certified"?1:0)-(getEff(a)==="mirantis-certified"?1:0);});
    if(sort==="Most popular") r.sort(function(a,b){return (b.pulls||0)-(a.pulls||0);});
    if(sort==="By Newest") r.sort(function(a,b){return (b.created||"").localeCompare(a.created||"");});
    if(sort==="Last updated") r.sort(function(a,b){return (b.lastUpdated||"").localeCompare(a.lastUpdated||"");});
    return r;
  },[loading,search,tag,support,sort,compliance]);

  var testedCount=0; var certCount=0;
  if (!loading) {
    for(var i=0;i<RAW.length;i++){if(RAW[i].tested)testedCount++;if(getEff(RAW[i])==="mirantis-certified")certCount++;}
  }

  if (loading || loadError) {
    return (
      <div style={{fontFamily:"'Inter',-apple-system,sans-serif",background:B.bg0,minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:16}}>
        {loading && <span style={{color:B.teal,fontSize:16}}>Loading catalog...</span>}
        {loadError && <>
          <span style={{color:B.red,fontSize:14}}>{loadError}</span>
          <button onClick={doLoad} style={{padding:"8px 20px",background:B.teal,color:B.bg0,border:"none",borderRadius:6,cursor:"pointer",fontWeight:600,fontSize:13}}>Retry</button>
        </>}
      </div>
    );
  }

  return (
    <div style={{fontFamily:"'Inter',-apple-system,sans-serif",background:B.bg0,minHeight:"100vh",padding:"0 0 40px"}}>
      <style>{`
        @media (max-width: 640px) {
          .k0-nav-inner { flex-wrap: wrap; height: auto !important; padding: 8px 0 !important; gap: 6px !important; }
          .k0-nav-left { flex-wrap: wrap; gap: 8px !important; }
          .k0-nav-tabs { height: 36px !important; }
          .k0-nav-tabs button { padding: 0 8px !important; font-size: 11px !important; }
          .k0-nav-right { display: none !important; }
          .k0-nav-actions { display: flex !important; }
          .k0-backdrop { display: none !important; }
          .k0-detail-panel { width: 100vw !important; border-left: none !important; }
          .k0-detail-tabs { padding-left: 12px !important; margin-left: -12px !important; margin-right: -12px !important; }
          .k0-detail-tabs button { padding: 6px 8px !important; font-size: 11px !important; white-space: nowrap !important; }
          .k0-detail-content { padding: 12px 14px !important; }
          .k0-detail-header { padding: 12px 14px 0 !important; }
          .k0-card-grid { grid-template-columns: 1fr !important; }
          .k0-infra-grid { grid-template-columns: 1fr !important; }
          .k0-sol-grid { grid-template-columns: 1fr !important; }
          .k0-stats-row { display: grid !important; grid-template-columns: repeat(3, 1fr) !important; gap: 0 !important; }
          .k0-stats-row > div { padding: 5px 7px !important; font-size: 9px !important; }
          .k0-filter-row { flex-wrap: wrap !important; }
          .k0-catalog-header { flex-direction: column !important; align-items: flex-start !important; gap: 8px !important; }
          .k0-catalog-layout { flex-direction: column !important; }
          .k0-sidebar { width: 100% !important; position: static !important; gap: 10px !important; }
        }
        @media (max-width: 400px) {
          .k0-nav-tabs button { padding: 0 5px !important; font-size: 10px !important; }
        }
        .anchor-link { color: #3d4d6a; text-decoration: none; margin-left: 6px; opacity: 0; transition: opacity 0.15s; font-size: 0.8em; }
        h1:hover .anchor-link, h2:hover .anchor-link, h3:hover .anchor-link, h4:hover .anchor-link { opacity: 1; }
        a { color: #00c8c8; }
        a:hover { color: #00e5ff; }
      `}</style>
      <Nav view={view} setView={setView} versions={versions} k0rdentVer={k0rdentVer} onVersionChange={switchK0rdentVersion} dark={dark} toggleTheme={toggleTheme} resetFilters={function(){ setSearch(""); setTag("All"); setSupport("All"); setSort("A-Z"); setCompliance("All"); setSelected(null); setDetailTab("overview"); setDetailVer(""); history.pushState(null,"",buildCatalogUrl({view:"catalog",search:"",tag:"All",support:"All",sort:"A-Z",compliance:"All"})); }}/>

      {view==="contribute"&&<ContributePage/>}
      {view==="solutions"&&<SolutionsPage initSolId={initParams.sol} initScat={initParams.scat} initShide={initParams.shide} k0rdentVer={k0rdentVer}/>}
      {view==="infra"&&<InfraPage k0rdentVer={k0rdentVer} initInfraApp={initParams.infraApp} initDtab={initParams.dtab} initIgrp={initParams.igrp}/>}
      {view==="configurator"&&<ConfiguratorPage initUsecase={initParams.usecase} initCcloud={initParams.ccloud} initCscale={initParams.cscale} k0rdentVer={k0rdentVer}/>}

      {view==="catalog"&&(
        <div style={{maxWidth:1140,margin:"0 auto",padding:"18px 20px 0"}}>
          <div style={{marginBottom:12,paddingBottom:12,borderBottom:"1px solid "+B.border}}>
            <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:5}}>
              <span style={{fontSize:9.5,fontWeight:600,color:B.teal,textTransform:"uppercase",letterSpacing:"0.14em"}}>Curated for AI-native Kubernetes</span>
            </div>
            <h1 style={{fontSize:24,fontWeight:700,color:B.textPri,margin:"0 0 8px",letterSpacing:"-0.02em"}}>Best-in-class software for <span style={{color:B.teal}}>the AI infrastructure stack</span></h1>
            <p style={{fontSize:14,color:B.textSec,margin:"0 0 10px",lineHeight:1.8,textAlign:"justify"}}>
              Every integration sits at the intersection of <span style={{color:B.textPri,fontWeight:500}}>AI workloads</span> and <span style={{color:B.textPri,fontWeight:500}}>cloud-native Kubernetes infrastructure</span> — production-hardened on real enterprise clusters, composable by design, and relevant across the full AI lifecycle from GPU provisioning through model serving, RAG pipelines, observability, security, and FinOps. Not a directory of everything that exists, but a curated set of <span style={{color:B.teal,fontWeight:500}}>best-in-class integrations</span> validated by Mirantis platform engineers and deployable in minutes on any infrastructure.
            </p>
            <div className="k0-stats-row" style={{display:"flex",gap:0,background:B.bg2,border:"1px solid "+B.border,borderRadius:8,overflow:"hidden",marginBottom:10}}>
              {[{n:RAW.length,l:"Integrations",sub:"hand-selected",c:B.teal},{n:testedCount,l:"CI-validated",sub:"across 6 providers",c:B.green},{n:certCount,l:"Certified",sub:"Enterprise Support SLA",c:B.cyan},{n:"13",l:"Categories",sub:"GPU to GitOps",c:B.purple}].map(function(s,si,arr){
                return <div key={s.l} style={{flex:"1 1 0",padding:"9px 12px",borderRight:si<arr.length-1?"1px solid "+B.border:"none",minWidth:0}}><div style={{fontSize:16,fontWeight:700,color:s.c,fontFamily:"monospace",lineHeight:1}}>{s.n}</div><div style={{fontSize:10.5,color:B.textPri,fontWeight:500,marginTop:2,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{s.l}</div><div style={{fontSize:9,color:B.textMut,marginTop:1,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{s.sub}</div></div>;
              })}
            </div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8}}>
              {Object.entries(TIER_DESC).map(function(entry){
                var k=entry[0]; var desc=entry[1];
                var ss=SUPPORT_STYLE[k];
                var cnt=0; for(var ii=0;ii<RAW.length;ii++){if(getEff(RAW[ii])===k)cnt++;}
                var isActive=support===k;
                return <div key={k} style={{background:isActive?ss.bg:B.bg2,border:"1px solid "+(isActive?ss.text+"60":ss.border),borderLeft:"2px solid "+ss.text,borderRadius:7,padding:"9px 12px",display:"flex",gap:9,transition:"background 0.2s, border-color 0.2s"}}>
                  <span style={{width:7,height:7,borderRadius:"50%",background:ss.text,flexShrink:0,marginTop:3,display:"inline-block"}}/>
                  <div style={{flex:1}}>
                    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:3}}>
                      <span style={{fontSize:10.5,fontWeight:700,color:ss.text}}>{SUPPORT_LABEL[k]}</span>
                      <span style={{fontSize:9,fontFamily:"monospace",color:B.textMut,background:B.bg3,border:"1px solid "+B.border,borderRadius:3,padding:"1px 5px"}}>{cnt}</span>
                    </div>
                    <div style={{fontSize:10,color:B.textSec,lineHeight:1.55}}>{desc.indexOf("Mirantis Enterprise Support")!==-1?<>{desc.split("Mirantis Enterprise Support")[0]}<a href="https://www.mirantis.com/support/enterprise-support-options/" target="_blank" rel="noreferrer" style={{color:B.teal}}>Mirantis Enterprise Support</a>{desc.split("Mirantis Enterprise Support")[1]}</>:desc}</div>
                  </div>
                </div>;
              })}
            </div>
          </div>

          <div className="k0-catalog-layout" style={{display:"flex",gap:13,alignItems:"flex-start"}}>
            {sidebarOpen && <div className="k0-sidebar" style={{width:196,flexShrink:0,display:"flex",flexDirection:"column",gap:13,position:"sticky",top:62}}>
              <div>
                <div style={{fontSize:9,fontWeight:600,color:B.textMut,textTransform:"uppercase",letterSpacing:"0.09em",marginBottom:5}}>Sort</div>
                <select value={sort} onChange={function(e){setSort(e.target.value);}} style={{width:"100%",padding:"5px 7px",border:"1px solid "+B.borderHi,borderRadius:6,fontSize:11.5,background:B.bg3,color:B.textSec,outline:"none",cursor:"pointer"}}>
                  <option>A-Z</option><option>Z-A</option><option>By Newest</option><option>Last updated</option><option>Tested first</option><option>Certified first</option><option>Most popular</option>
                </select>
              </div>
              <div>
                <div style={{fontSize:9,fontWeight:600,color:B.textMut,textTransform:"uppercase",letterSpacing:"0.09em",marginBottom:5}}>Support tier</div>
                <div style={{display:"flex",flexDirection:"column",gap:3}}>
                  {ALL_SUPPORT.map(function(s){
                    var active=support===s;
                    var color=s==="mirantis-certified"?B.teal:s==="partner"?B.green:B.textSec;
                    return <button key={s} onClick={function(){setSupport(s);}} style={{textAlign:"left",padding:"5px 9px",border:"1px solid "+(active?color+"60":B.border),borderRadius:5,fontSize:11,background:active?color+"15":B.bg2,color:active?color:B.textSec,cursor:"pointer",fontWeight:active?600:400,fontFamily:"inherit"}}>{s==="All"?"All tiers":SUPPORT_LABEL[s]}</button>;
                  })}
                </div>
              </div>
              <div>
                <div style={{fontSize:9,fontWeight:600,color:B.textMut,textTransform:"uppercase",letterSpacing:"0.09em",marginBottom:5}}>Category</div>
                <div style={{display:"flex",flexDirection:"column",gap:3}}>
                  {ALL_TAGS.map(function(t){
                    var active=tag===t; var color=tagAccent(t);
                    return <button key={t} onClick={function(){setTag(t);}} style={{textAlign:"left",padding:"4px 9px",border:"1px solid "+(active?color+"50":B.border),borderRadius:5,fontSize:10.5,background:active?color+"12":B.bg2,color:active?color:B.textSec,cursor:"pointer",fontWeight:active?600:400,display:"flex",alignItems:"center",justifyContent:"space-between",fontFamily:"inherit"}}>
                      <span>{t}</span>{active&&<span style={{fontSize:8,opacity:0.7}}>✕</span>}
                    </button>;
                  })}
                </div>
              </div>
            </div>}

            <div style={{flex:1,minWidth:0}}>
              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8,flexWrap:"wrap"}}>
                <button onClick={function(){setSidebarOpen(!sidebarOpen);}} style={{display:"flex",alignItems:"center",gap:5,padding:"4px 10px",border:"1px solid "+B.border,borderRadius:5,fontSize:10,background:sidebarOpen?B.teal+"15":B.bg2,color:sidebarOpen?B.teal:B.textSec,cursor:"pointer",fontFamily:"inherit",fontWeight:500}}>
                  <span style={{fontSize:12}}>{sidebarOpen?"◂":"▸"}</span> Filters
                  {(tag!=="All"||support!=="All"||compliance!=="All")&&<span style={{width:6,height:6,borderRadius:"50%",background:B.teal,flexShrink:0}}/>}
                </button>
                <div style={{position:"relative",flex:1,minWidth:120}}>
                  <span style={{position:"absolute",left:8,top:"50%",transform:"translateY(-50%)",color:B.textMut,fontSize:12,pointerEvents:"none"}}>⌕</span>
                  <input value={search} onChange={function(e){setSearch(e.target.value);}} placeholder="Search apps..." style={{width:"100%",boxSizing:"border-box",paddingLeft:24,paddingRight:9,paddingTop:5,paddingBottom:5,border:"1px solid "+B.borderHi,borderRadius:6,fontSize:11,outline:"none",background:B.bg3,color:B.textPri}}/>
                </div>
                <span style={{fontSize:10,color:B.textMut,fontFamily:"monospace",flexShrink:0}}>{filtered.length} / {RAW.length}</span>
              </div>
              {filtered.length===0
                ?<div style={{textAlign:"center",padding:"60px 0",color:B.textMut,fontSize:13}}>No applications match your filters.</div>
                :<div className="k0-card-grid" style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(255px,1fr))",gap:10}}>
                  {filtered.map(function(item){return <Card key={item.name} item={item} onOpen={function(){setSelected(item);setDetailTab("overview");setDetailVer("");setDetailImg("");setDetailImgChart("");setDetailImgSub("");history.pushState(null,"",buildAppUrl(item.name,"overview","",k0rdentVer));}}/>;}) }
                </div>
              }
            </div>
          </div>

          <div style={{marginTop:28,paddingTop:18,borderTop:"1px solid "+B.border,display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:9}}>
            <div style={{display:"flex",alignItems:"center",gap:9}}>
              <img src={BASE+(dark?"k0rdent-logo.svg":"k0rdent-logo-dark.svg")} alt="k0rdent" style={{height:15}} />
              <span style={{fontSize:9.5,color:B.textMut}}>Application Catalog v1.8.0 · originated by Mirantis</span>
            </div>
            <div style={{display:"flex",gap:14}}>
              <span style={{fontSize:9.5,color:B.textMut}}>Privacy Policy</span>
              <span style={{fontSize:9.5,color:B.textMut}}>Terms of Use</span>
              <a href={versionBase(k0rdentVer||"")+"contribute/"} onClick={function(e:any){e.preventDefault();setView("contribute");history.pushState(null,"",appendTheme(versionBase(k0rdentVer||"")+"contribute/"));}} style={{fontSize:9.5,color:B.teal,cursor:"pointer",fontWeight:500,textDecoration:"none"}}>Contribute</a>
            </div>
          </div>
        </div>
      )}

      {selected&&<DetailPanel item={selected} tab={detailTab} setTab={setDetailTab} selVer={detailVer} setSelVer={setDetailVer} k0rdentVer={k0rdentVer} detailImg={detailImg} setDetailImg={setDetailImg} detailImgChart={detailImgChart} setDetailImgChart={setDetailImgChart} detailImgSub={detailImgSub} setDetailImgSub={setDetailImgSub} onClose={function(){setSelected(null);setDetailTab("overview");setDetailVer("");setDetailImg("");setDetailImgChart("");setDetailImgSub("");history.pushState(null,"",buildCatalogUrl({view,search,tag,support,sort,compliance}));}}/>}
    </div>
  );
}
