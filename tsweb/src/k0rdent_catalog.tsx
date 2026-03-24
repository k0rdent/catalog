import React, { useState, useMemo, useEffect } from "react";

var B = {
  bg0:"#0a0e1a",bg1:"#0f1424",bg2:"#151b2e",bg3:"#1c2540",
  border:"#1e2d4a",borderHi:"#2a3f6a",
  teal:"#00c8c8",tealBg:"#00c8c810",cyan:"#00e5ff",
  textPri:"#e8edf8",textSec:"#7a8aaa",textMut:"#3d4d6a",
  green:"#00d48a",amber:"#f5a623",red:"#ff4d6a",purple:"#a78bfa",
};

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
var MIRANTIS_CERTIFIED = {"amd-gpu":1,"nvidia":1,"ceph":1,"mirantis-kyverno-guardrails":1,"mirantis-velero":1,"nirmata":1,"runai-cp":1,"stacklight":1,"wandb":1};
var SUPPORT_LABEL = {community:"Community",partner:"Verified Partner","mirantis-certified":"Mirantis Certified"};
var SUPPORT_STYLE = {
  community:{bg:"#ffffff08",text:B.textSec,border:"#ffffff15"},
  partner:{bg:"#00d48a10",text:B.green,border:"#00d48a30"},
  "mirantis-certified":{bg:"#00c8c810",text:B.teal,border:"#00c8c840"},
};
var TIER_DESC = {
  community:"Open-source integrations contributed by the k0rdent community. Tested against k0rdent-managed clusters but without a commercial SLA.",
  partner:"Integrations jointly validated with an ISV partner. Partner provides first-line support; Mirantis ensures k0rdent compatibility.",
  "mirantis-certified":"Fully validated, hardened, and supported by Mirantis engineering. Included in k0rdent Enterprise 24x7 SLA.",
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
  "AI/ML":"#00c8c8","Monitoring":"#00e5ff","Security":"#a78bfa","Networking":"#38bdf8",
  "Database":"#34d399","Storage":"#f59e0b","CI/CD":"#f472b6","Backup":"#fb923c",
  "Auth":"#818cf8","Autoscaling":"#6ee7b7","Serverless":"#67e8f9","Runtime":"#a3e635",
  "Drivers":"#94a3b8","Registry":"#e879f9","Developer Tools":"#fbbf24","Other":"#7a8aaa",
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

function AppLogo({ name, size, accent, logo, brandColor }:{ name:string, size?:number, accent?:string, logo?:string, brandColor?:string }) {
  var sz = size || 32;
  var [svgContent, setSvgContent] = React.useState(LOGO_CACHE[name] || null);
  var [failed, setFailed] = React.useState(false);
  var color = brandColor || BRAND_COLORS[name] || accent || "#7a8aaa";
  var bg = color + "18";
  var border = color + "30";

  // If catalog data provides a logo URL, use it directly as an <img>
  if (logo) {
    return (
      <div style={{width:sz,height:sz,borderRadius:sz>36?9:7,background:bg,border:"1px solid "+border,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,padding:sz>36?5:3,boxSizing:"border-box"}}>
        <img src={logo} alt={name} style={{width:sz-10,height:sz-10,objectFit:"contain"}} />
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
      <div style={{width:sz,height:sz,borderRadius:sz>36?9:7,background:bg,border:"1px solid "+border,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,padding:sz>36?7:5,boxSizing:"border-box"}}
        dangerouslySetInnerHTML={{__html:svgContent.replace(/width="[^"]*"/, 'width="'+(sz-10)+'"').replace(/height="[^"]*"/, 'height="'+(sz-10)+'"')}}
      />
    );
  }

  return (
    <div style={{width:sz,height:sz,borderRadius:sz>36?9:7,background:bg,border:"1px solid "+border,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,fontSize:sz>36?13:11,fontWeight:700,color:color,fontFamily:"monospace"}}>
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

var ENVS = ["AWS EC2","AWS EKS","Azure AKS","vSphere","OpenStack","Bare Metal"];
function ciResults(item) {
  var eff = getEff(item);
  var envs = CLOUD_COMPAT[eff] || CLOUD_COMPAT.community;
  var k8s = K8S_COMPAT[eff] || K8S_COMPAT.community;
  var seed = 0;
  for (var i = 0; i < item.name.length; i++) seed += item.name.charCodeAt(i);
  var out = [];
  for (var ei = 0; ei < ENVS.length; ei++) {
    var env = ENVS[ei];
    var supported = envs.indexOf(env) !== -1;
    if (!supported) { out.push({env:env,status:"n/a",runs:[]}); continue; }
    var runs = [];
    for (var vi = 0; vi < k8s.length; vi++) {
      if (!item.tested) { runs.push({v:k8s[vi],s:"pending"}); continue; }
      var h = (seed*(ei+1)*(vi+1))%17;
      runs.push({v:k8s[vi],s:h===0?"fail":h===1?"skip":"pass"});
    }
    out.push({env:env,status:item.tested?(((seed+ei)%9===0)?"fail":"pass"):"pending",runs:runs});
  }
  return out;
}
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
var _catalogLoaded = false;

// loadCatalog logic is now inline in App.doLoad() with cache-busting

var ALL_TAGS:string[] = ["All"];
var ALL_SUPPORT = ["All","community","partner","mirantis-certified"];

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
      <pre style={{background:B.bg0,border:"1px solid "+B.border,borderRadius:7,padding:"12px 14px",fontSize:11,color:"#7dd3fc",fontFamily:"monospace",lineHeight:1.6,overflowX:"auto",margin:0,whiteSpace:"pre"}}>{text}</pre>
      <button onClick={doCopy} style={{position:"absolute",top:6,right:6,background:copied?B.green+"30":B.bg2,border:"1px solid "+B.borderHi,borderRadius:5,padding:"2px 8px",fontSize:9.5,color:copied?B.green:B.textSec,cursor:"pointer",fontFamily:"inherit"}}>{copied?"Copied":"Copy"}</button>
    </div>
  );
}

function TestResults({ item }) {
  var results = ciResults(item);
  var k8s = K8S_COMPAT[getEff(item)] || K8S_COMPAT.community;
  var passed=0,failed=0,skipped=0,total=0;
  for (var ri=0;ri<results.length;ri++) {
    for (var rj=0;rj<results[ri].runs.length;rj++) {
      var s = results[ri].runs[rj].s;
      if (s!=="n/a"&&s!=="pending") {
        total++;
        if(s==="pass")passed++;
        else if(s==="fail")failed++;
        else if(s==="skip")skipped++;
      }
    }
  }
  var passRate = total ? Math.round(passed/total*100) : 0;
  return (
    <div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:8,marginBottom:14}}>
        {[{n:passed,l:"Passed",c:B.green},{n:failed,l:"Failed",c:B.red},{n:skipped,l:"Skipped",c:B.amber},{n:passRate+"%",l:"Pass rate",c:passRate===100?B.green:passRate>=80?B.amber:B.red}].map(function(s){
          return <div key={s.l} style={{background:B.bg2,border:"1px solid "+B.border,borderRadius:8,padding:"10px",textAlign:"center"}}><div style={{fontSize:18,fontWeight:700,color:s.c,fontFamily:"monospace"}}>{s.n}</div><div style={{fontSize:10,color:B.textMut,marginTop:2}}>{s.l}</div></div>;
        })}
      </div>
      <div style={{border:"1px solid "+B.border,borderRadius:8,overflow:"hidden"}}>
        <table style={{width:"100%",borderCollapse:"collapse"}}>
          <thead>
            <tr style={{background:B.bg3}}>
              <th style={{padding:"7px 10px",fontSize:9,fontWeight:600,color:B.textMut,textTransform:"uppercase",textAlign:"left"}}>Environment</th>
              <th style={{padding:"7px 8px",fontSize:9,fontWeight:600,color:B.textMut,textTransform:"uppercase",textAlign:"center"}}>Overall</th>
              {k8s.map(function(v){return <th key={v} style={{padding:"7px 6px",fontSize:9,fontWeight:600,color:B.textMut,textAlign:"center",fontFamily:"monospace"}}>{v}</th>;})}
            </tr>
          </thead>
          <tbody>
            {results.map(function(r,ri){
              return (
                <tr key={r.env} style={{borderTop:"1px solid "+B.border,background:ri%2===0?B.bg2+"40":"transparent"}}>
                  <td style={{padding:"8px 10px",fontSize:11,color:r.status==="n/a"?B.textMut:B.textPri,fontWeight:500}}>{r.env}</td>
                  <td style={{textAlign:"center",padding:"8px 6px"}}><CIBadge s={r.status}/></td>
                  {r.runs.length>0?r.runs.map(function(run){return <td key={run.v} style={{textAlign:"center",padding:"8px 6px"}}><CIBadge s={run.s}/></td>;}):k8s.map(function(v){return <td key={v} style={{textAlign:"center",padding:"8px 6px"}}><CIBadge s="n/a"/></td>;})}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div style={{marginTop:8,fontSize:10,color:B.textMut,textAlign:"right"}}>Last run: 2026-03-12 · k0rdent v1.8.0</div>
    </div>
  );
}

function DetailPanel({ item, onClose, tab, setTab, selVer, setSelVer }) {
  var eff = getEff(item);
  var ss = SUPPORT_STYLE[eff];
  var compTags = COMPLIANCE[item.name] || [];
  var accent = tagAccent(item.tags[0] || "Other");
  var initials = "";
  var parts = item.name.replace(/-/g," ").split(" ");
  for (var pi=0;pi<Math.min(2,parts.length);pi++) initials += parts[pi][0].toUpperCase();
  var d = deployStats(item.name);
  var maxD = 18420;
  var pct = Math.round(d.deploys/maxD*100);
  var k8s = K8S_COMPAT[eff] || K8S_COMPAT.community;
  var clouds2 = CLOUD_COMPAT[eff] || CLOUD_COMPAT.community;

  useEffect(function(){
    var h = function(e){ if(e.key==="Escape") onClose(); };
    window.addEventListener("keydown",h);
    return function(){ window.removeEventListener("keydown",h); };
  },[]);

  function tabStyle(active) {
    return {padding:"8px 14px",fontSize:12,fontWeight:active?600:400,color:active?B.teal:B.textSec,background:"transparent",border:"none",borderBottom:"2px solid "+(active?B.teal:"transparent"),cursor:"pointer",whiteSpace:"nowrap",fontFamily:"inherit"};
  }

  var whyCopy = (function(){
    var tg = item.tags[0]||"";
    if(tg==="AI/ML") return "Selected for its role in the AI infrastructure stack — from model training and serving to MLOps and GPU orchestration. As AI workloads become the primary driver of infrastructure investment, tools like this represent the critical layer between raw compute and production models.";
    if(tg==="Security") return "Security is non-negotiable in AI environments. This integration provides policy enforcement, secrets management, or runtime protection across multi-cluster deployments — essential for regulated industries running AI at scale.";
    if(tg==="Monitoring") return "Observability is the foundation of reliable AI infrastructure. This tool provides the metrics, logs, or traces needed to understand GPU utilization, model latency, and cluster health.";
    if(tg==="Networking") return "Modern AI workloads demand high-throughput, low-latency networking. This integration was selected for cluster connectivity, traffic management, or service mesh capabilities essential for distributed training.";
    if(tg==="Storage") return "AI training and inference are storage-intensive. This integration provides persistent, high-throughput, or object storage capabilities for model checkpointing, datasets, and vector databases.";
    if(tg==="Database") return "Data is the foundation of AI. This database is relevant for AI workloads as a vector store for RAG pipelines, a feature store for ML, or a reliable operational database.";
    if(tg==="CI/CD") return "Reliable AI delivery requires robust CI/CD and GitOps pipelines. This integration enables teams to manage cluster configuration and model deployments declaratively.";
    if(tg==="Backup") return "Data protection is critical for AI workloads training on unique, hard-to-reproduce datasets. This ensures cluster state and persistent volumes can be recovered quickly.";
    return "Carefully selected by Mirantis platform engineers for its production-grade quality, active community, and proven interoperability with k0rdent-managed clusters.";
  })();

  return (
    <div onClick={onClose} style={{position:"fixed",top:0,left:0,right:0,bottom:0,zIndex:1000,display:"flex",alignItems:"stretch",justifyContent:"flex-end"}}>
      <div style={{position:"absolute",top:0,left:0,right:0,bottom:0,background:"rgba(5,8,20,0.7)"}}/>
      <div onClick={function(e){e.stopPropagation();}} style={{position:"relative",width:"min(680px,100vw)",background:B.bg1,borderLeft:"1px solid "+B.borderHi,display:"flex",flexDirection:"column",overflowY:"auto"}}>
        {eff==="mirantis-certified"&&<div style={{height:2,background:"linear-gradient(90deg,"+B.teal+","+B.cyan+")",flexShrink:0}}/>}
        <div style={{padding:"18px 22px 0",flexShrink:0}}>
          <div style={{display:"flex",alignItems:"flex-start",gap:12,marginBottom:12}}>
            <AppLogo name={item.name} size={44} accent={accent} logo={item.logo} brandColor={item.brandColor}/>
            <div style={{flex:1}}>
              <div style={{display:"flex",alignItems:"center",gap:7,flexWrap:"wrap",marginBottom:4}}>
                <h2 style={{fontSize:19,fontWeight:700,color:B.textPri,margin:0}}>{item.name}</h2>
                <span style={{fontSize:9,padding:"2px 7px",borderRadius:3,background:ss.bg,color:ss.text,border:"1px solid "+ss.border,fontWeight:600,textTransform:"uppercase"}}>{SUPPORT_LABEL[eff]}</span>
              </div>
              <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
                {item.tags.map(function(t){return <span key={t} style={{fontSize:9.5,padding:"1px 6px",borderRadius:3,background:tagAccent(t)+"15",color:tagAccent(t),border:"1px solid "+tagAccent(t)+"25",fontWeight:500}}>{t}</span>;})}
                {compTags.map(function(c){var cs=COMPLIANCE_STYLE[c];return <span key={c} style={{fontSize:9,padding:"1px 5px",borderRadius:3,background:cs.bg,color:cs.text,border:"1px solid "+cs.border,fontWeight:600}}>{c}</span>;})}
              </div>
            </div>
            <button onClick={onClose} style={{background:"transparent",border:"1px solid "+B.border,borderRadius:6,width:30,height:30,display:"flex",alignItems:"center",justifyContent:"center",color:B.textSec,cursor:"pointer",fontSize:14,fontFamily:"inherit",flexShrink:0}}>✕</button>
          </div>
          <div style={{display:"flex",borderBottom:"1px solid "+B.border,marginLeft:-22,marginRight:-22,paddingLeft:22}}>
            {["overview","install","compatibility","test results","cost"].map(function(t){
              return <button key={t} onClick={function(){setTab(t);}} style={tabStyle(tab===t)}>{t.charAt(0).toUpperCase()+t.slice(1)}</button>;
            })}
            <div style={{flex:1}}/>
            <a href={item.docs} target="_blank" rel="noreferrer" style={{padding:"8px 16px",fontSize:11,color:B.bg0,textDecoration:"none",background:B.teal,fontWeight:600,alignSelf:"flex-end",marginBottom:-1,borderTopLeftRadius:5,borderTopRightRadius:5}}>Docs</a>
          </div>
        </div>
        <div style={{padding:"18px 22px",flex:1}}>
          {tab==="overview" && (
            <div>
              <p style={{fontSize:13,color:B.textSec,lineHeight:1.8,marginTop:0}}>{item.desc}</p>
              <div style={{background:B.bg2,border:"1px solid "+B.borderHi,borderRadius:8,padding:"12px 14px",marginBottom:16,display:"flex",gap:10}}>
                <span style={{fontSize:16,color:B.teal,flexShrink:0}}>◈</span>
                <div>
                  <div style={{fontSize:10,fontWeight:600,color:B.teal,textTransform:"uppercase",letterSpacing:"0.07em",marginBottom:4}}>Why this is in the catalog</div>
                  <div style={{fontSize:12,color:B.textSec,lineHeight:1.7}}>{whyCopy}</div>
                </div>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:14}}>
                {[{l:"Latest version",v:item.version},{l:"Chart name",v:item.chartName},{l:"Support tier",v:SUPPORT_LABEL[eff]},{l:"CI validated",v:item.tested?"Yes":"Not yet"},{l:"Versions available",v:String(item.versions.length)},{l:"Last updated",v:"2026-03-12"}].map(function(r){
                  return <div key={r.l} style={{background:B.bg2,borderRadius:7,padding:"9px 12px",border:"1px solid "+B.border}}><div style={{fontSize:9.5,color:B.textMut,textTransform:"uppercase",letterSpacing:"0.07em",marginBottom:2}}>{r.l}</div><div style={{fontSize:12.5,color:B.textPri,fontWeight:500,fontFamily:(r.l.includes("ersion")||r.l.includes("Chart"))?"monospace":"inherit"}}>{r.v}</div></div>;
                })}
              </div>
              <div style={{marginBottom:14}}>
                <div style={{fontSize:9.5,color:B.textMut,textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:8}}>Deploy and usage signals</div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:8}}>
                  {[{l:"Total deploys",v:fmtNum(d.deploys)+" clusters",c:B.teal},{l:"30-day growth",v:d.trend,c:B.green},{l:"GitHub stars",v:d.stars>0?fmtNum(d.stars):"Private",c:B.cyan},{l:"Trending",v:d.hot?"Hot right now":"Stable",c:d.hot?B.red:B.textSec}].map(function(r){
                    return <div key={r.l} style={{background:B.bg2,borderRadius:7,padding:"9px 12px",border:"1px solid "+B.border}}><div style={{fontSize:9.5,color:B.textMut,textTransform:"uppercase",letterSpacing:"0.07em",marginBottom:2}}>{r.l}</div><div style={{fontSize:12.5,color:r.c,fontWeight:600,fontFamily:"monospace"}}>{r.v}</div></div>;
                  })}
                </div>
                <div style={{fontSize:9.5,color:B.textMut,marginBottom:3}}>Popularity vs peak ({fmtNum(maxD)} deploys)</div>
                <div style={{height:5,background:B.bg3,borderRadius:3,overflow:"hidden"}}><div style={{height:"100%",width:pct+"%",background:"linear-gradient(90deg,"+B.teal+","+B.cyan+")",borderRadius:3}}/></div>
                <div style={{display:"flex",justifyContent:"space-between",marginTop:2}}><span style={{fontSize:9,color:B.textMut}}>0</span><span style={{fontSize:9,color:B.teal,fontWeight:600}}>{pct}%</span><span style={{fontSize:9,color:B.textMut}}>{fmtNum(maxD)}</span></div>
              </div>
              {compTags.length>0&&(
                <div>
                  <div style={{fontSize:9.5,color:B.textMut,textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:8}}>Compliance frameworks</div>
                  <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                    {compTags.map(function(c){var cs=COMPLIANCE_STYLE[c];return <div key={c} style={{background:cs.bg,border:"1px solid "+cs.border,borderRadius:6,padding:"7px 12px"}}><div style={{fontSize:12,fontWeight:700,color:cs.text}}>{c}</div><div style={{fontSize:9.5,color:B.textSec,marginTop:2}}>{c==="SOC 2"?"Access controls & audit logging":c==="HIPAA"?"PHI data handling":c==="PCI DSS"?"Payment environments":"US Federal security"}</div></div>;})}
                  </div>
                </div>
              )}
              <div style={{marginTop:16,padding:"11px 14px",background:B.tealBg,border:"1px solid "+B.teal+"30",borderRadius:7,display:"flex",justifyContent:"space-between",alignItems:"center",gap:8}}>
                <span style={{fontSize:12,color:B.teal,fontWeight:500}}>Ready to deploy?</span>
                <button onClick={function(){setTab("install");}} style={{background:B.teal,border:"none",borderRadius:5,padding:"5px 14px",fontSize:12,color:B.bg0,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>View install steps</button>
              </div>
            </div>
          )}
          {tab==="install" && (
            <div>
              <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:16}}>
                <span style={{fontSize:12,color:B.textSec}}>Version:</span>
                <select value={selVer} onChange={function(e){setSelVer(e.target.value);}} style={{padding:"5px 9px",border:"1px solid "+B.borderHi,borderRadius:5,background:B.bg3,color:B.textPri,fontSize:12,outline:"none",cursor:"pointer",fontFamily:"monospace"}}>
                  {item.versions.map(function(v){return <option key={v} value={v}>{v}</option>;})}
                </select>
                {item.tested&&<span style={{fontSize:9.5,color:B.green,background:B.green+"15",border:"1px solid "+B.green+"30",borderRadius:3,padding:"2px 7px"}}>CI-validated</span>}
              </div>
              {[{n:1,title:"Prerequisites",isText:true,content:"Deploy k0rdent v1.8.0 first."},{n:2,title:"Install template to k0rdent",isText:false,content:installCmd(item,selVer)},{n:3,title:"Verify service template",isText:false,content:verifyCmd(item,selVer)},{n:4,title:"Deploy service template",isText:false,content:deployYamlFn(item,selVer)}].map(function(step){
                return (
                  <div key={step.n} style={{marginBottom:14}}>
                    <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:7}}>
                      <div style={{width:20,height:20,borderRadius:"50%",background:B.tealBg,border:"1px solid "+B.teal+"40",display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:700,color:B.teal,flexShrink:0}}>{step.n}</div>
                      <span style={{fontSize:12,fontWeight:600,color:B.textPri}}>{step.title}</span>
                    </div>
                    <div style={{paddingLeft:28}}>
                      {step.isText
                        ? <p style={{fontSize:12,color:B.textSec,margin:0}}>{step.content} <a href="https://docs.k0rdent.io/v1.8.0/admin/installation/install-k0rdent/" target="_blank" rel="noreferrer" style={{color:B.teal}}>QuickStart</a></p>
                        : <CodeBlock text={step.content}/>
                      }
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          {tab==="compatibility" && (
            <div>
              <div style={{marginBottom:16}}>
                <div style={{fontSize:9.5,color:B.textMut,textTransform:"uppercase",marginBottom:8}}>Kubernetes versions</div>
                <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
                  {K8S_VERS.map(function(v){var ok=k8s.indexOf(v)!==-1;return <span key={v} style={{fontSize:11,padding:"4px 12px",borderRadius:6,border:"1px solid "+(ok?B.teal+"40":B.border),background:ok?B.tealBg:B.bg2,color:ok?B.teal:B.textMut,fontFamily:"monospace",fontWeight:ok?600:400}}>{v} {ok?"✓":""}</span>;})}
                </div>
              </div>
              <div style={{fontSize:9.5,color:B.textMut,textTransform:"uppercase",marginBottom:8}}>Cloud providers</div>
              <div style={{border:"1px solid "+B.border,borderRadius:8,overflow:"hidden"}}>
                <table style={{width:"100%",borderCollapse:"collapse"}}>
                  <thead>
                    <tr>
                      <th style={{padding:"6px 10px 8px 0",color:B.textMut,fontSize:9.5,fontWeight:500,textAlign:"left"}}>Provider</th>
                      {K8S_VERS.map(function(v){return <th key={v} style={{padding:"6px 7px 8px",color:k8s.indexOf(v)!==-1?B.teal:B.textMut,fontSize:9.5,fontFamily:"monospace",textAlign:"center",fontWeight:k8s.indexOf(v)!==-1?600:400}}>{v}</th>;})}
                    </tr>
                  </thead>
                  <tbody>
                    {CLOUDS.map(function(c,ci){
                      var cOk = clouds2.indexOf(c)!==-1;
                      return (
                        <tr key={c} style={{borderTop:"1px solid "+B.border,background:ci%2===0?B.bg2+"40":"transparent"}}>
                          <td style={{padding:"7px 10px 7px 0",fontSize:11.5,color:cOk?B.textPri:B.textMut,fontWeight:cOk?500:400}}>{c}</td>
                          {K8S_VERS.map(function(v){
                            var ok=cOk&&k8s.indexOf(v)!==-1;
                            return <td key={v} style={{textAlign:"center",padding:"7px"}}>
                              {ok
                                ? <svg width="12" height="12" viewBox="0 0 12 12"><circle cx="6" cy="6" r="6" fill={B.teal} fillOpacity="0.2"/><path d="M3 6l2 2 4-4" stroke={B.teal} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/></svg>
                                : <svg width="12" height="12" viewBox="0 0 12 12"><circle cx="6" cy="6" r="6" fill={B.textMut} fillOpacity="0.15"/><path d="M3.5 6h5" stroke={B.textMut} strokeWidth="1.5" strokeLinecap="round" fill="none"/></svg>
                              }
                            </td>;
                          })}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <div style={{marginTop:10,padding:"9px 12px",background:B.bg2,borderRadius:7,border:"1px solid "+B.border,fontSize:12,color:item.tested?B.green:B.amber}}>
                {item.tested?"CI-validated on k0rdent "+(eff==="mirantis-certified"?"Enterprise":"managed")+" clusters":"CI testing in progress — community contributions welcome"}
              </div>
            </div>
          )}
          {tab==="test results" && <TestResults item={item}/>}
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
            <span style={{fontWeight:600,fontSize:12.5,color:B.textPri}}>{item.name}</span>
            <span style={{fontSize:8.5,padding:"1px 5px",borderRadius:3,background:ss.bg,color:ss.text,border:"1px solid "+ss.border,fontWeight:600,textTransform:"uppercase"}}>{SUPPORT_LABEL[eff]}</span>
          </div>
          <div style={{display:"flex",gap:4,marginTop:3,flexWrap:"wrap"}}>
            {item.tags.slice(0,2).map(function(t){return <span key={t} style={{fontSize:9,padding:"1px 5px",borderRadius:3,background:tagAccent(t)+"15",color:tagAccent(t),fontWeight:500,border:"1px solid "+tagAccent(t)+"25"}}>{t}</span>;})}
            <span style={{fontSize:8.5,color:B.textMut,fontFamily:"monospace"}}>{item.version}</span>
          </div>
          {compTags.length>0&&<div style={{display:"flex",gap:3,marginTop:3,flexWrap:"wrap"}}>{compTags.map(function(c){var cs=COMPLIANCE_STYLE[c];return <span key={c} style={{fontSize:8,padding:"1px 4px",borderRadius:3,background:cs.bg,color:cs.text,border:"1px solid "+cs.border,fontWeight:600}}>{c}</span>;})}</div>}
        </div>
      </div>
      <p style={{fontSize:11,color:B.textSec,marginTop:8,lineHeight:1.55,display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical",overflow:"hidden",flex:1}}>{item.desc}</p>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginTop:8,paddingTop:7,borderTop:"1px solid "+B.border}}>
        <span style={{fontSize:9.5,color:item.tested?B.green:B.amber}}>{item.tested?"✓ CI-validated":"⚠ Not tested"}</span>
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
  var bc = sol.badgeColor;
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
            <div style={{width:38,height:38,borderRadius:9,background:bc+"18",border:"1px solid "+bc+"30",display:"flex",alignItems:"center",justifyContent:"center",fontSize:17,color:bc,flexShrink:0}}>{sol.icon}</div>
            <div>
              <div style={{fontSize:13.5,fontWeight:700,color:B.textPri}}>{sol.title}</div>
              <div style={{fontSize:10,color:B.textMut,marginTop:1}}>{sol.tagline}</div>
            </div>
          </div>
          <span style={{fontSize:8.5,padding:"2px 7px",borderRadius:4,background:bc+"18",color:bc,border:"1px solid "+bc+"40",fontWeight:700,textTransform:"uppercase",whiteSpace:"nowrap",flexShrink:0}}>{sol.badge}</span>
        </div>
        <p style={{fontSize:11.5,color:B.textSec,lineHeight:1.6,margin:"0 0 11px"}}>{sol.desc.slice(0,155)}...</p>
        <div style={{marginBottom:10}}>
          <div style={{fontSize:9,color:B.textMut,textTransform:"uppercase",marginBottom:5}}>Components</div>
          <div style={{display:"flex",flexWrap:"wrap",gap:4}}>
            {sol.components.map(function(c){
              var app=null;
              for(var ii=0;ii<RAW.length;ii++){if(RAW[ii].name===c.name){app=RAW[ii];break;}}
              var ac=tagAccent(app?app.tags[0]:"Other");
              return <span key={c.name} style={{fontSize:9.5,padding:"1px 7px",borderRadius:4,background:ac+"12",color:ac,border:"1px solid "+ac+"25",fontWeight:500,fontFamily:"monospace"}}>{c.name}</span>;
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

function SolutionDetail({ sol, onClose }) {
  var bc = sol.badgeColor;
  var ss = SUPPORT_STYLE[sol.tier]||SUPPORT_STYLE.community;
  var [copied, setCopied] = useState(false);
  useEffect(function(){
    var h=function(e){if(e.key==="Escape")onClose();};
    window.addEventListener("keydown",h);
    return function(){window.removeEventListener("keydown",h);};
  },[]);
  function doCopy(){if(navigator.clipboard)navigator.clipboard.writeText(sol.deployYaml);setCopied(true);setTimeout(function(){setCopied(false);},1500);}
  return (
    <div onClick={onClose} style={{position:"fixed",top:0,left:0,right:0,bottom:0,zIndex:1000,display:"flex",alignItems:"stretch",justifyContent:"flex-end"}}>
      <div style={{position:"absolute",top:0,left:0,right:0,bottom:0,background:"rgba(5,8,20,0.75)"}}/>
      <div onClick={function(e){e.stopPropagation();}} style={{position:"relative",width:"min(700px,100vw)",background:B.bg1,borderLeft:"1px solid "+B.borderHi,display:"flex",flexDirection:"column",overflowY:"auto"}}>
        <div style={{height:3,background:"linear-gradient(90deg,"+bc+","+bc+"50)",flexShrink:0}}/>
        <div style={{padding:"20px 24px 0",flexShrink:0}}>
          <div style={{display:"flex",gap:12,alignItems:"flex-start",marginBottom:12}}>
            <div style={{width:48,height:48,borderRadius:11,background:bc+"18",border:"1px solid "+bc+"35",display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,color:bc,flexShrink:0}}>{sol.icon}</div>
            <div style={{flex:1}}>
              <div style={{display:"flex",alignItems:"center",gap:7,flexWrap:"wrap",marginBottom:3}}>
                <h2 style={{fontSize:19,fontWeight:700,color:B.textPri,margin:0}}>{sol.title}</h2>
                <span style={{fontSize:8.5,padding:"2px 7px",borderRadius:3,background:bc+"18",color:bc,border:"1px solid "+bc+"40",fontWeight:700,textTransform:"uppercase"}}>{sol.badge}</span>
                <span style={{fontSize:8.5,padding:"2px 7px",borderRadius:3,background:ss.bg,color:ss.text,border:"1px solid "+ss.border,fontWeight:600,textTransform:"uppercase"}}>{SUPPORT_LABEL[sol.tier]}</span>
              </div>
              <div style={{fontSize:11.5,color:B.textMut}}>{sol.tagline}</div>
            </div>
            <button onClick={onClose} style={{background:"transparent",border:"1px solid "+B.border,borderRadius:6,width:30,height:30,display:"flex",alignItems:"center",justifyContent:"center",color:B.textSec,cursor:"pointer",fontSize:13,fontFamily:"inherit",flexShrink:0}}>✕</button>
          </div>
          <p style={{fontSize:12.5,color:B.textSec,lineHeight:1.8,margin:"0 0 16px"}}>{sol.desc}</p>
        </div>
        <div style={{padding:"0 24px 24px",flex:1}}>
          <div style={{marginBottom:16}}>
            <div style={{fontSize:9.5,fontWeight:600,color:B.textMut,textTransform:"uppercase",marginBottom:8}}>Use cases</div>
            {sol.useCases.map(function(u){return <div key={u} style={{display:"flex",gap:8,marginBottom:6}}><span style={{color:bc,fontSize:11,flexShrink:0}}>◈</span><span style={{fontSize:12,color:B.textSec,lineHeight:1.6}}>{u}</span></div>;})}
          </div>
          <div style={{marginBottom:16}}>
            <div style={{fontSize:9.5,fontWeight:600,color:B.textMut,textTransform:"uppercase",marginBottom:8}}>Components</div>
            <div style={{border:"1px solid "+B.border,borderRadius:8,overflow:"hidden"}}>
              <table style={{width:"100%",borderCollapse:"collapse"}}>
                <thead><tr style={{background:B.bg3}}>
                  <th style={{padding:"6px 10px",fontSize:9,fontWeight:600,color:B.textMut,textTransform:"uppercase",textAlign:"left"}}>App</th>
                  <th style={{padding:"6px 10px",fontSize:9,fontWeight:600,color:B.textMut,textTransform:"uppercase",textAlign:"left"}}>Role</th>
                  <th style={{padding:"6px 10px",fontSize:9,fontWeight:600,color:B.textMut,textTransform:"uppercase",textAlign:"left"}}>Why included</th>
                </tr></thead>
                <tbody>
                  {sol.components.map(function(c,ci){
                    var app=null;
                    for(var jj=0;jj<RAW.length;jj++){if(RAW[jj].name===c.name){app=RAW[jj];break;}}
                    var ac=tagAccent(app?app.tags[0]:"Other");
                    return (
                      <tr key={c.name} style={{borderTop:"1px solid "+B.border,background:ci%2===0?B.bg2+"50":"transparent"}}>
                        <td style={{padding:"8px 10px",whiteSpace:"nowrap"}}><span style={{fontSize:10.5,fontFamily:"monospace",fontWeight:600,color:ac}}>{c.name}</span>{app&&app.version&&<span style={{fontSize:8.5,color:B.textMut,marginLeft:4,fontFamily:"monospace"}}>{app.version}</span>}</td>
                        <td style={{padding:"8px 10px",fontSize:11,color:bc,fontWeight:500,whiteSpace:"nowrap"}}>{c.role}</td>
                        <td style={{padding:"8px 10px",fontSize:11,color:B.textSec,lineHeight:1.5}}>{c.why}</td>
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
          <div>
            <div style={{fontSize:9.5,fontWeight:600,color:B.textMut,textTransform:"uppercase",marginBottom:7}}>Deploy this solution</div>
            <div style={{position:"relative"}}>
              <pre style={{background:B.bg0,border:"1px solid "+B.border,borderRadius:7,padding:"13px 15px",fontSize:10.5,color:"#7dd3fc",fontFamily:"monospace",lineHeight:1.7,overflowX:"auto",margin:0,whiteSpace:"pre"}}>{sol.deployYaml}</pre>
              <button onClick={doCopy} style={{position:"absolute",top:7,right:7,background:copied?B.green+"30":B.bg2,border:"1px solid "+B.borderHi,borderRadius:4,padding:"2px 9px",fontSize:9.5,color:copied?B.green:B.textSec,cursor:"pointer",fontFamily:"inherit"}}>{copied?"Copied":"Copy"}</button>
            </div>
          </div>
          <div style={{marginTop:12}}>
            <FinOpsEstimator stackItems={sol.components} defaultCloud="aws"/>
          </div>
        </div>
      </div>
    </div>
  );
}

function SolutionsPage() {
  var [selected, setSelected] = useState(null);
  var [catFilter, setCatFilter] = useState("All");
  var cats=["All","AI/ML","Observability","Security"];
  var filtered=SOLUTIONS.filter(function(s){return catFilter==="All"||s.category===catFilter;});
  return (
    <div style={{maxWidth:1140,margin:"0 auto",padding:"28px 20px 0"}}>
      <div style={{marginBottom:22,paddingBottom:18,borderBottom:"1px solid "+B.border}}>
        <div style={{fontSize:9.5,fontWeight:600,color:B.teal,textTransform:"uppercase",letterSpacing:"0.14em",marginBottom:7}}>Validated · Composable · Production-ready</div>
        <h1 style={{fontSize:23,fontWeight:700,color:B.textPri,margin:"0 0 7px"}}>Solution bundles for <span style={{color:B.teal}}>AI infrastructure</span></h1>
        <p style={{fontSize:13,color:B.textSec,lineHeight:1.8,maxWidth:680,margin:"0 0 14px"}}>Named solution bundles are curated sets of applications forming fully functional, production-ready configurations for AI and cloud-native use cases. Each bundle is a validated combination of interoperable components with predefined deployment templates.</p>
        <div style={{display:"flex",gap:6,flexWrap:"wrap",alignItems:"center"}}>
          {cats.map(function(c){var active=catFilter===c;return <button key={c} onClick={function(){setCatFilter(c);}} style={{padding:"4px 13px",border:"1px solid "+(active?B.teal+"60":B.border),borderRadius:20,fontSize:11,background:active?B.teal+"15":B.bg2,color:active?B.teal:B.textSec,cursor:"pointer",fontFamily:"inherit"}}>{c}</button>;})}
          <span style={{marginLeft:"auto",fontSize:11,color:B.textMut}}>{filtered.length} bundles</span>
        </div>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(310px,1fr))",gap:13}}>
        {filtered.map(function(sol){return <SolutionCard key={sol.id} sol={sol} onClick={function(){setSelected(sol);}}/>;}) }
      </div>
      <div style={{marginTop:28,padding:"16px 20px",background:B.bg2,border:"1px solid "+B.border,borderRadius:9,display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:10}}>
        <div><div style={{fontSize:13,fontWeight:600,color:B.textPri,marginBottom:3}}>Want to contribute a solution bundle?</div><div style={{fontSize:12,color:B.textSec}}>Open a PR with your bundle definition and component list.</div></div>
        <a href="https://github.com/k0rdent/catalog" target="_blank" rel="noreferrer" style={{padding:"8px 16px",background:B.teal,color:B.bg0,borderRadius:6,fontSize:12,fontWeight:700,textDecoration:"none",whiteSpace:"nowrap"}}>Contribute a bundle</a>
      </div>
      {selected!==null&&<SolutionDetail sol={selected} onClose={function(){setSelected(null);}}/>}
    </div>
  );
}

var CONFIGURATOR_STEPS = [
  {
    id:"usecase",label:"Use Case",question:"What are you building?",
    options:[
      {id:"llm-inference",label:"LLM Inference",icon:"⬡",desc:"Serve LLMs and embedding models at scale"},
      {id:"mlops",label:"MLOps Platform",icon:"◈",desc:"Train, track, and deploy ML models"},
      {id:"rag",label:"RAG / Vector Search",icon:"✦",desc:"Build retrieval-augmented AI applications"},
      {id:"ai-data",label:"AI Data Pipeline",icon:"◉",desc:"Ingest, process, and store training data"},
      {id:"observability",label:"AI Observability",icon:"⬡",desc:"Monitor GPU utilization, cost, and model health"},
      {id:"platform",label:"Internal Dev Platform",icon:"◈",desc:"GitOps-driven developer platform with guardrails"},
    ],
  },
  {
    id:"cloud",label:"Infrastructure",question:"Where are you deploying?",
    options:[
      {id:"aws",label:"AWS",icon:"☁",desc:"EC2 or EKS managed clusters"},
      {id:"azure",label:"Azure",icon:"☁",desc:"VMs or AKS managed clusters"},
      {id:"vsphere",label:"vSphere",icon:"◉",desc:"On-premises VMware infrastructure"},
      {id:"baremetal",label:"Bare Metal",icon:"◈",desc:"Direct on-prem or edge servers"},
      {id:"hybrid",label:"Hybrid",icon:"⬡",desc:"Multiple clouds and on-prem combined"},
    ],
  },
  {
    id:"compliance",label:"Compliance",question:"Do you have compliance requirements?",multi:true,
    options:[
      {id:"none",label:"None",icon:"◉",desc:"No specific framework required"},
      {id:"soc2",label:"SOC 2",icon:"◈",desc:"Security controls and audit logging"},
      {id:"hipaa",label:"HIPAA",icon:"⬡",desc:"Healthcare data protection"},
      {id:"pci",label:"PCI DSS",icon:"◈",desc:"Payment card environments"},
      {id:"fedramp",label:"FedRAMP",icon:"◉",desc:"US Federal security requirements"},
    ],
  },
  {
    id:"scale",label:"Scale",question:"What is your expected cluster scale?",
    options:[
      {id:"small",label:"Small",icon:"◈",desc:"1-5 clusters, dev/test or startup"},
      {id:"medium",label:"Medium",icon:"⬡",desc:"5-50 clusters, growing production"},
      {id:"large",label:"Large",icon:"◉",desc:"50+ clusters, enterprise scale"},
    ],
  },
];

function buildStack(selections) {
  var usecase   = selections.usecase   || "";
  var compliance= selections.compliance|| [];
  var scale     = selections.scale     || "";
  var needsCompliance = compliance.length > 0 && compliance.indexOf("none") === -1;
  var stack = [];

  if (usecase === "llm-inference") {
    stack.push({name:"nvidia",reason:"GPU provisioning — automates CUDA, drivers, and device plugins",layer:"Infrastructure"});
    stack.push({name:"kserve",reason:"Model serving — Kubernetes-native inference with autoscaling",layer:"AI/ML"});
    stack.push({name:"ollama",reason:"LLM runtime — lightweight self-hosted model execution",layer:"AI/ML"});
    stack.push({name:"open-webui",reason:"LLM interface — OpenAI-compatible UI with RAG support",layer:"AI/ML"});
    stack.push({name:"keda",reason:"Event-driven autoscaling — scale inference pods on queue depth",layer:"Runtime"});
    stack.push({name:"lws",reason:"Multi-node inference — LeaderWorkerSet for large multi-GPU models",layer:"AI/ML"});
  } else if (usecase === "mlops") {
    stack.push({name:"nvidia",reason:"GPU provisioning for training workloads",layer:"Infrastructure"});
    stack.push({name:"mlflow",reason:"Experiment tracking and model registry",layer:"AI/ML"});
    stack.push({name:"kuberay",reason:"Distributed training — Ray clusters for PyTorch and TensorFlow",layer:"AI/ML"});
    stack.push({name:"kubeflow-spark-operator",reason:"Data processing — Spark for large-scale feature engineering",layer:"AI/ML"});
    stack.push({name:"minio",reason:"Artifact storage — S3-compatible for datasets and model checkpoints",layer:"Storage"});
    stack.push({name:"jupyterhub",reason:"Shared notebooks for data scientists",layer:"Developer Tools"});
  } else if (usecase === "rag") {
    stack.push({name:"qdrant",reason:"Primary vector DB — billion-scale similarity search",layer:"Database"});
    stack.push({name:"milvus",reason:"Alternative vector DB — distributed embeddings at scale",layer:"Database"});
    stack.push({name:"ollama",reason:"LLM backend — self-hosted embedding and generation",layer:"AI/ML"});
    stack.push({name:"open-webui",reason:"RAG interface — document upload, retrieval, and chat UI",layer:"AI/ML"});
    stack.push({name:"tika",reason:"Document processing — extract text from PDFs and Office files",layer:"AI/ML"});
    stack.push({name:"redis",reason:"Semantic cache — reduce LLM API costs with query caching",layer:"Database"});
  } else if (usecase === "ai-data") {
    stack.push({name:"minio",reason:"Object storage — S3-compatible for datasets and model artifacts",layer:"Storage"});
    stack.push({name:"milvus",reason:"Vector store — high-dimensional embedding storage",layer:"Database"});
    stack.push({name:"strimzi-kafka-operator",reason:"Data streaming — real-time events for ML pipelines",layer:"Networking"});
    stack.push({name:"postgresql",reason:"Metadata store — feature metadata, labels, and pipeline state",layer:"Database"});
    stack.push({name:"redis",reason:"Feature cache — low-latency serving for real-time inference",layer:"Database"});
    stack.push({name:"n8n",reason:"Workflow automation — visual pipelines for ETL and data labeling",layer:"AI/ML"});
  } else if (usecase === "observability") {
    stack.push({name:"kube-prometheus-stack",reason:"Metrics and alerting — GPU DCGM metrics and pre-built dashboards",layer:"Monitoring"});
    stack.push({name:"grafana",reason:"Visualization — GPU utilization, cost, and model dashboards",layer:"Monitoring"});
    stack.push({name:"loki",reason:"Log aggregation — correlated logs for training and inference",layer:"Monitoring"});
    stack.push({name:"tempo",reason:"Distributed tracing — end-to-end traces across serving pipelines",layer:"Monitoring"});
    stack.push({name:"opencost",reason:"Cost attribution — per-workload GPU and compute allocation",layer:"Monitoring"});
    stack.push({name:"finops-agent",reason:"Cost forecasting — AI-powered spend forecasting from Prometheus",layer:"AI/ML"});
  } else if (usecase === "platform") {
    stack.push({name:"argo-cd",reason:"GitOps delivery — declarative cluster and app lifecycle management",layer:"CI/CD"});
    stack.push({name:"kyverno",reason:"Policy engine — enforce guardrails and golden paths",layer:"Security"});
    stack.push({name:"ingress-nginx",reason:"Ingress controller — external HTTP/S access to services",layer:"Networking"});
    stack.push({name:"cert-manager",reason:"TLS automation — automated certificate issuance and renewal",layer:"Security"});
    stack.push({name:"keda",reason:"Event-driven autoscaling — scale workloads on external events",layer:"Runtime"});
    stack.push({name:"external-secrets",reason:"Secrets management — sync from Vault and cloud secret stores",layer:"Security"});
  }

  if (usecase !== "observability") {
    stack.push({name:"kube-prometheus-stack",reason:"Baseline observability — cluster health metrics and alerting",layer:"Monitoring"});
  }
  if (needsCompliance) {
    stack.push({name:"falco",reason:"Runtime security — real-time threat detection required for compliance",layer:"Security"});
    stack.push({name:"kyverno",reason:"Policy enforcement — admission control for compliance guardrails",layer:"Security"});
  }
  if (compliance.indexOf("hipaa") !== -1 || compliance.indexOf("fedramp") !== -1) {
    stack.push({name:"teleport",reason:"Zero-trust access — MFA-gated cluster access with full audit logging",layer:"Security"});
  }
  if (compliance.indexOf("soc2") !== -1 || compliance.indexOf("pci") !== -1) {
    stack.push({name:"external-secrets",reason:"Secrets management — centralized, audited secrets for compliance",layer:"Security"});
  }
  if (scale === "large" || scale === "medium") {
    stack.push({name:"cluster-autoscaler",reason:"Cluster autoscaling — right-size nodes across large fleets",layer:"Runtime"});
    stack.push({name:"velero",reason:"Backup and DR — protect cluster state across environments",layer:"Backup"});
  }
  if (scale === "large") {
    stack.push({name:"opencost",reason:"FinOps — cost attribution at scale across many clusters",layer:"Monitoring"});
  }

  var seen = {}; var out = [];
  for (var i=0;i<stack.length;i++) {
    if (!seen[stack[i].name]) { seen[stack[i].name]=1; out.push(stack[i]); }
  }
  return out;
}

function generateDeployYaml(stack) {
  var services = "";
  for (var i=0;i<stack.length;i++) {
    var app = null;
    for (var j=0;j<RAW.length;j++){if(RAW[j].name===stack[i].name){app=RAW[j];break;}}
    if (!app) continue;
    var slug = (app.chartName+"-"+app.version).replace(/\./g,"-");
    services += "    - template: "+slug+"\n      name: "+app.name+"\n      namespace: "+app.name+"\n";
  }
  return "apiVersion: k0rdent.mirantis.com/v1beta1\nkind: MultiClusterService\nmetadata:\n  name: custom-stack\n  namespace: kcm-system\nspec:\n  clusterSelector:\n    matchLabels:\n      stack: custom\n  serviceSpec:\n    services:\n"+services;
}

var LAYER_COLORS = {
  "Infrastructure":B.teal,"AI/ML":"#00c8c8","Database":"#34d399","Storage":"#f59e0b",
  "Monitoring":"#00e5ff","Security":"#a78bfa","Networking":"#38bdf8","CI/CD":"#f472b6",
  "Runtime":"#6ee7b7","Backup":"#fb923c","Developer Tools":"#fbbf24",
};

function ConfiguratorPage() {
  var [step, setStep] = useState(0);
  var [selections, setSelections] = useState({});
  var [done, setDone] = useState(false);
  var [copied, setCopied] = useState(false);

  var currentStep = CONFIGURATOR_STEPS[step];

  function select(optId) {
    var cur = CONFIGURATOR_STEPS[step];
    if (cur.multi) {
      var prev = selections[cur.id] || [];
      var next;
      if (optId === "none") {
        next = ["none"];
      } else {
        var without = prev.filter(function(x){return x!=="none";});
        var idx = without.indexOf(optId);
        if (idx === -1) next = without.concat([optId]);
        else { next = without.slice(); next.splice(idx,1); }
        if (next.length===0) next=["none"];
      }
      setSelections(function(s){ var nx=Object.assign({},s); nx[cur.id]=next; return nx; });
    } else {
      setSelections(function(s){ var nx=Object.assign({},s); nx[cur.id]=optId; return nx; });
      if (step < CONFIGURATOR_STEPS.length-1) {
        setTimeout(function(){ setStep(function(s){return s+1;}); }, 200);
      } else {
        setDone(true);
      }
    }
  }

  function next() {
    if (step < CONFIGURATOR_STEPS.length-1) setStep(step+1);
    else setDone(true);
  }
  function back() { if(step>0){setStep(step-1); setDone(false);} }
  function reset() { setStep(0); setSelections({}); setDone(false); }

  function isSelected(optId) {
    var val = selections[currentStep.id];
    if (currentStep.multi) return (val||[]).indexOf(optId)!==-1;
    return val===optId;
  }

  var resultStack = done ? buildStack(selections) : [];
  var yaml = done ? generateDeployYaml(resultStack) : "";

  function doCopy() {
    if(navigator.clipboard) navigator.clipboard.writeText(yaml);
    setCopied(true);
    setTimeout(function(){setCopied(false);},1500);
  }

  var layers = {};
  for(var ri=0;ri<resultStack.length;ri++){
    var l=resultStack[ri].layer;
    if(!layers[l]) layers[l]=[];
    layers[l].push(resultStack[ri]);
  }

  var cloudKey = selections.cloud==="aws"?"aws":selections.cloud==="azure"?"azure":selections.cloud==="vsphere"?"vsphere":selections.cloud==="baremetal"?"baremetal":"hybrid";

  return (
    <div style={{maxWidth:1140,margin:"0 auto",padding:"28px 20px 0"}}>
      <div style={{marginBottom:24,paddingBottom:20,borderBottom:"1px solid "+B.border}}>
        <div style={{fontSize:9.5,fontWeight:600,color:B.teal,textTransform:"uppercase",letterSpacing:"0.14em",marginBottom:8}}>AI-native · Validated · One-click deploy</div>
        <h1 style={{fontSize:23,fontWeight:700,color:B.textPri,margin:"0 0 6px"}}>Visual stack <span style={{color:B.teal}}>configurator</span></h1>
        <p style={{fontSize:13,color:B.textSec,lineHeight:1.8,maxWidth:760,margin:"0 0 14px"}}>
          Answer four questions about your use case, infrastructure, compliance requirements, and scale. Get a validated MultiClusterService manifest you can apply directly to your k0rdent management cluster.
        </p>
      </div>

      {!done && (
        <div style={{maxWidth:720,margin:"0 auto"}}>
          <div style={{display:"flex",gap:0,marginBottom:28,background:B.bg2,borderRadius:8,overflow:"hidden",border:"1px solid "+B.border}}>
            {CONFIGURATOR_STEPS.map(function(s,si){
              var isActive=si===step;
              var isDone=si<step;
              return (
                <div key={s.id} onClick={function(){if(si<=step){setStep(si);setDone(false);}}} style={{flex:1,padding:"10px 12px",background:isActive?B.teal+"18":isDone?B.bg3:"transparent",borderRight:si<CONFIGURATOR_STEPS.length-1?"1px solid "+B.border:"none",cursor:si<=step?"pointer":"default"}}>
                  <div style={{fontSize:9,fontWeight:600,color:isActive?B.teal:isDone?B.green:B.textMut,textTransform:"uppercase",marginBottom:2}}>{si+1}. {s.label}</div>
                  <div style={{fontSize:10,color:isActive?B.textPri:isDone?B.textSec:B.textMut}}>
                    {isDone && selections[s.id] ? (Array.isArray(selections[s.id])?selections[s.id].join(", "):selections[s.id]) : s.question}
                  </div>
                </div>
              );
            })}
          </div>

          <div style={{marginBottom:24}}>
            <h2 style={{fontSize:18,fontWeight:700,color:B.textPri,margin:"0 0 16px"}}>{currentStep.question}</h2>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))",gap:10}}>
              {currentStep.options.map(function(opt){
                var active=isSelected(opt.id);
                return (
                  <div key={opt.id} onClick={function(){select(opt.id);}}
                    onMouseEnter={function(e){if(!active){e.currentTarget.style.borderColor=B.teal+"40";e.currentTarget.style.background=B.bg2;}}}
                    onMouseLeave={function(e){if(!active){e.currentTarget.style.borderColor=B.border;e.currentTarget.style.background=B.bg1;}}}
                    style={{background:active?B.teal+"18":B.bg1,border:"1px solid "+(active?B.teal+"60":B.border),borderRadius:10,padding:"14px 16px",cursor:"pointer",boxShadow:active?"0 0 14px "+B.teal+"20":"none",transition:"all 0.15s"}}
                  >
                    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:6}}>
                      <span style={{fontSize:16,color:active?B.teal:B.textMut}}>{opt.icon}</span>
                      {active&&<span style={{width:14,height:14,borderRadius:"50%",background:B.teal,display:"flex",alignItems:"center",justifyContent:"center",fontSize:8,color:B.bg0,fontWeight:700}}>✓</span>}
                    </div>
                    <div style={{fontSize:13,fontWeight:600,color:active?B.teal:B.textPri,marginBottom:3}}>{opt.label}</div>
                    <div style={{fontSize:11,color:B.textSec,lineHeight:1.5}}>{opt.desc}</div>
                  </div>
                );
              })}
            </div>
          </div>

          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
            <button onClick={back} style={{padding:"8px 18px",background:B.bg2,border:"1px solid "+B.border,borderRadius:7,fontSize:12,color:B.textSec,cursor:step>0?"pointer":"default",opacity:step>0?1:0.4,fontFamily:"inherit"}}>Back</button>
            <span style={{fontSize:11,color:B.textMut}}>Step {step+1} of {CONFIGURATOR_STEPS.length}</span>
            {currentStep.multi
              ? <button onClick={next} style={{padding:"8px 20px",background:B.teal,border:"none",borderRadius:7,fontSize:12,color:B.bg0,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>{step===CONFIGURATOR_STEPS.length-1?"Build my stack":"Next"}</button>
              : <div style={{width:80}}/>
            }
          </div>
        </div>
      )}

      {done && (
        <div>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:12,marginBottom:20}}>
            <div>
              <h2 style={{fontSize:18,fontWeight:700,color:B.textPri,margin:"0 0 4px"}}>Your custom stack <span style={{color:B.teal}}>({resultStack.length} apps)</span></h2>
              <div style={{fontSize:12,color:B.textSec}}>Based on your selections — validated for k0rdent {selections.cloud||""} deployment</div>
            </div>
            <div style={{display:"flex",gap:8}}>
              <button onClick={reset} style={{padding:"7px 16px",background:B.bg2,border:"1px solid "+B.border,borderRadius:7,fontSize:12,color:B.textSec,cursor:"pointer",fontFamily:"inherit"}}>Start over</button>
              <button onClick={function(){setStep(CONFIGURATOR_STEPS.length-1);setDone(false);}} style={{padding:"7px 16px",background:B.bg2,border:"1px solid "+B.borderHi,borderRadius:7,fontSize:12,color:B.textPri,cursor:"pointer",fontFamily:"inherit"}}>Refine</button>
            </div>
          </div>

          <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:20}}>
            {CONFIGURATOR_STEPS.map(function(s){
              var val=selections[s.id];
              if(!val) return null;
              var label=Array.isArray(val)?val.join(", "):val;
              return <div key={s.id} style={{display:"flex",alignItems:"center",gap:6,background:B.bg2,border:"1px solid "+B.teal+"40",borderRadius:20,padding:"4px 12px"}}><span style={{fontSize:9.5,color:B.textMut,textTransform:"uppercase",fontWeight:600}}>{s.label}</span><span style={{fontSize:11,color:B.teal,fontWeight:500}}>{label}</span></div>;
            })}
          </div>

          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,alignItems:"start"}}>
            <div>
              <div style={{fontSize:9.5,fontWeight:600,color:B.textMut,textTransform:"uppercase",letterSpacing:"0.09em",marginBottom:12}}>Stack composition</div>
              {Object.entries(layers).map(function(entry){
                var layerName=entry[0]; var apps=entry[1];
                var lc=LAYER_COLORS[layerName]||B.textSec;
                return (
                  <div key={layerName} style={{marginBottom:12}}>
                    <div style={{fontSize:10,fontWeight:600,color:lc,textTransform:"uppercase",letterSpacing:"0.07em",marginBottom:6,display:"flex",alignItems:"center",gap:6}}>
                      <span style={{width:6,height:6,borderRadius:"50%",background:lc,display:"inline-block"}}/>
                      {layerName}
                    </div>
                    {apps.map(function(item){
                      var app=null;
                      for(var ii=0;ii<RAW.length;ii++){if(RAW[ii].name===item.name){app=RAW[ii];break;}}
                      return (
                        <div key={item.name} style={{background:B.bg1,border:"1px solid "+B.border,borderRadius:7,padding:"9px 12px",marginBottom:6,display:"flex",gap:10,alignItems:"flex-start"}}>
                          <div style={{width:28,height:28,borderRadius:6,background:lc+"18",border:"1px solid "+lc+"30",display:"flex",alignItems:"center",justifyContent:"center",fontSize:9,fontWeight:700,color:lc,flexShrink:0,fontFamily:"monospace"}}>
                            {item.name.slice(0,2).toUpperCase()}
                          </div>
                          <div style={{flex:1,minWidth:0}}>
                            <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:2}}>
                              <span style={{fontSize:11.5,fontWeight:600,color:B.textPri,fontFamily:"monospace"}}>{item.name}</span>
                              {app&&<span style={{fontSize:9,color:B.textMut,fontFamily:"monospace"}}>{app.version}</span>}
                            </div>
                            <div style={{fontSize:10.5,color:B.textSec,lineHeight:1.5}}>{item.reason}</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>

            <div style={{position:"sticky",top:70}}>
              <div style={{fontSize:9.5,fontWeight:600,color:B.textMut,textTransform:"uppercase",letterSpacing:"0.09em",marginBottom:12}}>Generated deployment manifest</div>
              <div style={{position:"relative"}}>
                <pre style={{background:B.bg0,border:"1px solid "+B.border,borderRadius:8,padding:"14px 16px",fontSize:10.5,color:"#7dd3fc",fontFamily:"monospace",lineHeight:1.7,overflowX:"auto",margin:0,whiteSpace:"pre",maxHeight:480,overflowY:"auto"}}>{yaml}</pre>
                <button onClick={doCopy} style={{position:"absolute",top:8,right:8,background:copied?B.green+"30":B.bg2,border:"1px solid "+B.borderHi,borderRadius:5,padding:"3px 10px",fontSize:9.5,color:copied?B.green:B.textSec,cursor:"pointer",fontFamily:"inherit"}}>{copied?"Copied":"Copy"}</button>
              </div>
              <div style={{marginTop:10,padding:"10px 14px",background:B.tealBg,border:"1px solid "+B.teal+"30",borderRadius:7,fontSize:11.5,color:B.textSec,lineHeight:1.65}}>
                <span style={{color:B.teal,fontWeight:600}}>Next step: </span>
                Apply this manifest to your k0rdent management cluster to deploy all {resultStack.length} components simultaneously.
              </div>
              <div style={{marginTop:8,display:"flex",gap:8,flexWrap:"wrap"}}>
                <a href="https://docs.k0rdent.io/v1.8.0/admin/installation/install-k0rdent/" target="_blank" rel="noreferrer" style={{padding:"7px 14px",background:B.teal,color:B.bg0,borderRadius:6,fontSize:11.5,fontWeight:700,textDecoration:"none"}}>Deploy with k0rdent</a>
                <a href="https://catalog.k0rdent.io/latest/" target="_blank" rel="noreferrer" style={{padding:"7px 14px",background:B.bg2,color:B.textSec,border:"1px solid "+B.border,borderRadius:6,fontSize:11.5,textDecoration:"none"}}>Browse all apps</a>
              </div>
            </div>
          </div>

          <div style={{marginTop:20}}>
            <FinOpsEstimator stackItems={resultStack} defaultCloud={cloudKey}/>
          </div>
        </div>
      )}
    </div>
  );
}

function ContributePage() {
  var [copied, setCopied] = useState({});
  function doCopy(key,text){
    if(navigator.clipboard)navigator.clipboard.writeText(text);
    setCopied(function(c){ var nx=Object.assign({},c); nx[key]=true; return nx; });
    setTimeout(function(){setCopied(function(c){ var nx=Object.assign({},c); nx[key]=false; return nx; });},1500);
  }
  return (
    <div style={{maxWidth:860,margin:"0 auto",padding:"30px 20px 0"}}>
      <div style={{marginBottom:24,paddingBottom:22,borderBottom:"1px solid "+B.border}}>
        <div style={{fontSize:9.5,fontWeight:600,color:B.teal,textTransform:"uppercase",letterSpacing:"0.14em",marginBottom:8}}>Open source · community driven</div>
        <h1 style={{fontSize:24,fontWeight:700,color:B.textPri,margin:"0 0 9px"}}>Add your app to the <span style={{color:B.teal}}>k0rdent catalog</span></h1>
        <p style={{fontSize:13,color:B.textSec,lineHeight:1.8,maxWidth:640,margin:"0 0 18px"}}>The k0rdent catalog is community-driven and open source. Every integration goes through validation, CI testing, and peer review before listing.</p>
        <div style={{display:"flex",gap:9,flexWrap:"wrap"}}>
          <a href="https://github.com/k0rdent/catalog/fork" target="_blank" rel="noreferrer" style={{padding:"8px 16px",background:B.teal,color:B.bg0,borderRadius:6,fontSize:12,fontWeight:700,textDecoration:"none"}}>Fork on GitHub</a>
          <a href="https://github.com/k0rdent/catalog" target="_blank" rel="noreferrer" style={{padding:"8px 16px",background:B.bg2,color:B.textSec,border:"1px solid "+B.border,borderRadius:6,fontSize:12,textDecoration:"none"}}>View repository</a>
        </div>
      </div>
      <div style={{marginBottom:20}}>
        <div style={{fontSize:9.5,fontWeight:600,color:B.textMut,textTransform:"uppercase",marginBottom:12}}>Contribution process</div>
        {CONTRIB_STEPS.map(function(s){return (
          <div key={s.n} style={{background:B.bg1,border:"1px solid "+B.border,borderRadius:9,overflow:"hidden",marginBottom:9}}>
            <div style={{display:"flex",gap:12,padding:"13px 16px",alignItems:"flex-start"}}>
              <div style={{width:26,height:26,borderRadius:"50%",background:B.tealBg,border:"1px solid "+B.teal+"40",display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:700,color:B.teal,flexShrink:0}}>{s.n}</div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:12.5,fontWeight:600,color:B.textPri,marginBottom:4}}>{s.title}</div>
                <div style={{fontSize:11.5,color:B.textSec,lineHeight:1.7,marginBottom:8}}>{s.body}</div>
                <div style={{position:"relative"}}>
                  <pre style={{background:B.bg0,border:"1px solid "+B.border,borderRadius:6,padding:"10px 12px",fontSize:10.5,color:"#7dd3fc",fontFamily:"monospace",lineHeight:1.6,overflowX:"auto",margin:0,whiteSpace:"pre"}}>{s.code}</pre>
                  <button onClick={function(){doCopy(s.n,s.code);}} style={{position:"absolute",top:5,right:5,background:copied[s.n]?B.green+"30":B.bg2,border:"1px solid "+B.borderHi,borderRadius:4,padding:"2px 7px",fontSize:9,color:copied[s.n]?B.green:B.textSec,cursor:"pointer",fontFamily:"inherit"}}>{copied[s.n]?"Copied":"Copy"}</button>
                </div>
              </div>
            </div>
          </div>
        );})}
      </div>
      <div style={{background:B.bg1,border:"1px solid "+B.border,borderRadius:9,padding:"14px 18px",marginBottom:18}}>
        <div style={{fontSize:9.5,fontWeight:600,color:B.textMut,textTransform:"uppercase",marginBottom:9}}>Allowed tags</div>
        <div style={{display:"flex",flexWrap:"wrap",gap:5}}>
          {ALLOWED_TAGS.map(function(t){return <span key={t} style={{fontSize:10.5,padding:"3px 9px",borderRadius:4,background:tagAccent(t)+"15",color:tagAccent(t),border:"1px solid "+tagAccent(t)+"30",fontWeight:500}}>{t}</span>;})}
        </div>
      </div>
    </div>
  );
}

function Nav({ view, setView, resetFilters }) {
  function navTo(v:string) {
    if (v === "catalog") { resetFilters(); }
    setView(v);
  }
  return (
    <div style={{background:B.bg1,borderBottom:"1px solid "+B.border,padding:"0 20px",position:"sticky",top:0,zIndex:100}}>
      <div style={{maxWidth:1140,margin:"0 auto",display:"flex",alignItems:"center",justifyContent:"space-between",height:52}}>
        <div style={{display:"flex",alignItems:"center",gap:14}}>
          <svg onClick={function(){navTo("catalog");}} style={{cursor:"pointer"}} width="100" height="20" viewBox="0 0 100 20"><text x="0" y="16" fontFamily="monospace" fontSize="16" fontWeight="700" fill={B.teal} letterSpacing="-0.5">k0rdent</text></svg>
          <div style={{display:"flex",gap:0,height:52,alignItems:"stretch"}}>
            {["catalog","solutions","configurator"].map(function(v){
              var active=view===v;
              return <button key={v} onClick={function(){navTo(v);}} style={{padding:"0 14px",fontSize:12,color:active?B.teal:B.textSec,background:"transparent",border:"none",borderBottom:"2px solid "+(active?B.teal:"transparent"),cursor:"pointer",fontFamily:"inherit",fontWeight:active?600:400,textTransform:"capitalize"}}>{v}</button>;
            })}
          </div>
        </div>
        <div style={{display:"flex",gap:8,alignItems:"center"}}>
          <a href="https://github.com/k0rdent/catalog" target="_blank" rel="noreferrer" style={{fontSize:11,color:B.textSec,textDecoration:"none",padding:"5px 11px",border:"1px solid "+B.border,borderRadius:6,background:B.bg2}}>GitHub</a>
          <button onClick={function(){navTo("contribute");}} style={{fontSize:11,color:B.bg0,padding:"5px 11px",borderRadius:6,background:B.teal,fontWeight:600,border:"none",cursor:"pointer",fontFamily:"inherit"}}>Contribute</button>
        </div>
      </div>
    </div>
  );
}

function readUrlParams() {
  var p = new URLSearchParams(window.location.search);
  return {
    view: p.get("view") || "catalog",
    search: p.get("q") || "",
    tag: p.get("tag") || "All",
    support: p.get("support") || "All",
    sort: p.get("sort") || "A-Z",
    compliance: p.get("compliance") || "All",
    app: p.get("app") || "",
    dtab: p.get("dtab") || "overview",
    ver: p.get("ver") || "",
  };
}

function updateUrlParams(state: {view:string, search:string, tag:string, support:string, sort:string, compliance:string, app:string, dtab:string, ver:string}) {
  var p = new URLSearchParams();
  if (state.view !== "catalog") p.set("view", state.view);
  if (state.search) p.set("q", state.search);
  if (state.tag !== "All") p.set("tag", state.tag);
  if (state.support !== "All") p.set("support", state.support);
  if (state.sort !== "A-Z") p.set("sort", state.sort);
  if (state.compliance !== "All") p.set("compliance", state.compliance);
  if (state.app) p.set("app", state.app);
  if (state.app && state.dtab !== "overview") p.set("dtab", state.dtab);
  if (state.app && state.ver) p.set("ver", state.ver);
  var qs = p.toString();
  var url = window.location.pathname + (qs ? "?" + qs : "");
  history.replaceState(null, "", url);
}

export default function App() {
  var initParams = useMemo(readUrlParams, []);
  var [loading, setLoading] = useState(true);
  var [loadError, setLoadError] = useState("");
  var [view, setView] = useState(initParams.view);
  var [search, setSearch] = useState(initParams.search);
  var [tag, setTag] = useState(initParams.tag);
  var [support, setSupport] = useState(initParams.support);
  var [sort, setSort] = useState(initParams.sort);
  var [compliance, setCompliance] = useState(initParams.compliance);
  var [selected, setSelected] = useState<any>(null);
  var [detailTab, setDetailTab] = useState(initParams.dtab);
  var [detailVer, setDetailVer] = useState(initParams.ver);

  // Restore selected app from URL after data loads
  useEffect(function(){
    if (!loading && initParams.app && !selected) {
      var found = RAW.find(function(i:any){ return i.name === initParams.app; });
      if (found) setSelected(found);
    }
  }, [loading]);

  // Sync filters to URL
  useEffect(function(){
    if (!loading) updateUrlParams({view, search, tag, support, sort, compliance, app: selected ? selected.name : "", dtab: detailTab, ver: detailVer});
  }, [view, search, tag, support, sort, compliance, selected, detailTab, detailVer, loading]);

  function doLoad() {
    setLoading(true);
    setLoadError("");
    _catalogLoaded = false;
    // Add cache-busting query param to bypass Vite's cached 404
    fetch("catalog.json?t=" + Date.now())
      .then(function(r){
        if (!r.ok) throw new Error("HTTP " + r.status);
        return r.json();
      })
      .then(function(data:any){
        var apps = Array.isArray(data) ? data : (data.apps || []);
        var solutions = Array.isArray(data) ? [] : (data.solutions || []);
        RAW.length = 0;
        Array.prototype.push.apply(RAW, apps);
        SOLUTIONS.length = 0;
        Array.prototype.push.apply(SOLUTIONS, solutions);
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
        setLoading(false);
      })
      .catch(function(e:any){
        setLoadError(String(e));
        setLoading(false);
      });
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
    if(sort==="Most popular") r.sort(function(a,b){return deployStats(b.name).deploys-deployStats(a.name).deploys;});
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
      <Nav view={view} setView={setView} resetFilters={function(){ setSearch(""); setTag("All"); setSupport("All"); setSort("A-Z"); setCompliance("All"); setSelected(null); setDetailTab("overview"); setDetailVer(""); }}/>

      {view==="contribute"&&<ContributePage/>}
      {view==="solutions"&&<SolutionsPage/>}
      {view==="configurator"&&<ConfiguratorPage/>}

      {view==="catalog"&&(
        <div style={{maxWidth:1140,margin:"0 auto",padding:"18px 20px 0"}}>
          <div style={{marginBottom:12,paddingBottom:12,borderBottom:"1px solid "+B.border}}>
            <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:5}}>
              <span style={{fontSize:9.5,fontWeight:600,color:B.teal,textTransform:"uppercase",letterSpacing:"0.14em"}}>Curated for AI-native Kubernetes</span>
            </div>
            <h1 style={{fontSize:19,fontWeight:700,color:B.textPri,margin:"0 0 5px",letterSpacing:"-0.02em"}}>Best-in-class software for <span style={{color:B.teal}}>the AI infrastructure stack</span></h1>
            <p style={{fontSize:12,color:B.textSec,margin:"0 0 10px",lineHeight:1.9}}>
              Every integration in this catalog sits at the intersection of <span style={{color:B.textPri,fontWeight:500}}>AI workloads</span> and <span style={{color:B.textPri,fontWeight:500}}>cloud-native Kubernetes infrastructure</span> — a deliberately narrow space defined by the real operational challenges of running AI in production: provisioning GPU nodes in minutes, serving models that scale to zero when idle and to hundreds of replicas under load, storing billion-scale vector embeddings with sub-10ms retrieval, and meeting the policy and audit requirements that regulated industries demand before a model touches sensitive data. A tool earns a place here by being production-hardened on real enterprise clusters, composable with the other integrations in the catalog, and relevant to the full AI infrastructure lifecycle — from raw compute and distributed training through model serving, RAG pipelines, observability, security, and FinOps. The result is not a directory of everything that exists, but a curated set of <span style={{color:B.teal,fontWeight:500}}>best-in-class integrations</span> that Mirantis platform engineers have validated, assembled into composable blueprints, and made deployable in minutes on any infrastructure.
            </p>
            <div style={{display:"flex",gap:0,background:B.bg2,border:"1px solid "+B.border,borderRadius:8,overflow:"hidden",marginBottom:10}}>
              {[{n:RAW.length,l:"Integrations",sub:"hand-selected",c:B.teal},{n:testedCount,l:"CI-validated",sub:"across 6 providers",c:B.green},{n:certCount,l:"Certified",sub:"enterprise 24x7 SLA",c:B.cyan},{n:"13",l:"Categories",sub:"GPU to GitOps",c:B.purple},{n:"4",l:"Compliance",sub:"SOC 2 · HIPAA · PCI · FedRAMP",c:B.amber}].map(function(s,si,arr){
                return <div key={s.l} style={{flex:"1 1 0",padding:"9px 12px",borderRight:si<arr.length-1?"1px solid "+B.border:"none",minWidth:0}}><div style={{fontSize:16,fontWeight:700,color:s.c,fontFamily:"monospace",lineHeight:1}}>{s.n}</div><div style={{fontSize:10.5,color:B.textPri,fontWeight:500,marginTop:2,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{s.l}</div><div style={{fontSize:9,color:B.textMut,marginTop:1,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{s.sub}</div></div>;
              })}
            </div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8}}>
              {Object.entries(TIER_DESC).map(function(entry){
                var k=entry[0]; var desc=entry[1];
                var ss=SUPPORT_STYLE[k];
                var cnt=0; for(var ii=0;ii<RAW.length;ii++){if(getEff(RAW[ii])===k)cnt++;}
                return <div key={k} style={{background:B.bg2,border:"1px solid "+ss.border,borderLeft:"2px solid "+ss.text,borderRadius:7,padding:"9px 12px",display:"flex",gap:9}}>
                  <span style={{width:7,height:7,borderRadius:"50%",background:ss.text,flexShrink:0,marginTop:3,display:"inline-block"}}/>
                  <div style={{flex:1}}>
                    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:3}}>
                      <span style={{fontSize:10.5,fontWeight:700,color:ss.text}}>{SUPPORT_LABEL[k]}</span>
                      <span style={{fontSize:9,fontFamily:"monospace",color:B.textMut,background:B.bg3,border:"1px solid "+B.border,borderRadius:3,padding:"1px 5px"}}>{cnt}</span>
                    </div>
                    <div style={{fontSize:10,color:B.textSec,lineHeight:1.55}}>{desc}</div>
                  </div>
                </div>;
              })}
            </div>
          </div>

          <div style={{display:"flex",gap:13,alignItems:"flex-start"}}>
            <div style={{width:196,flexShrink:0,display:"flex",flexDirection:"column",gap:13,position:"sticky",top:62}}>
              <div style={{position:"relative"}}>
                <span style={{position:"absolute",left:8,top:"50%",transform:"translateY(-50%)",color:B.textMut,fontSize:12,pointerEvents:"none"}}>⌕</span>
                <input value={search} onChange={function(e){setSearch(e.target.value);}} placeholder="Search apps..." style={{width:"100%",boxSizing:"border-box",paddingLeft:24,paddingRight:9,paddingTop:6,paddingBottom:6,border:"1px solid "+B.borderHi,borderRadius:6,fontSize:11.5,outline:"none",background:B.bg3,color:B.textPri}}/>
              </div>
              <div>
                <div style={{fontSize:9,fontWeight:600,color:B.textMut,textTransform:"uppercase",letterSpacing:"0.09em",marginBottom:5}}>Sort</div>
                <select value={sort} onChange={function(e){setSort(e.target.value);}} style={{width:"100%",padding:"5px 7px",border:"1px solid "+B.borderHi,borderRadius:6,fontSize:11.5,background:B.bg3,color:B.textSec,outline:"none",cursor:"pointer"}}>
                  <option>A-Z</option><option>Z-A</option><option>Tested first</option><option>Certified first</option><option>Most popular</option>
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
                <div style={{fontSize:9,fontWeight:600,color:B.textMut,textTransform:"uppercase",letterSpacing:"0.09em",marginBottom:5}}>Compliance</div>
                <div style={{display:"flex",flexDirection:"column",gap:3}}>
                  {["All","SOC 2","HIPAA","PCI DSS","FedRAMP"].map(function(c){
                    var cs=c==="All"?null:COMPLIANCE_STYLE[c]; var active=compliance===c;
                    var color=cs?cs.text:B.teal;
                    return <button key={c} onClick={function(){setCompliance(c);}} style={{textAlign:"left",padding:"5px 9px",border:"1px solid "+(active?color+"60":B.border),borderRadius:5,fontSize:11,background:active?color+"15":B.bg2,color:active?color:B.textSec,cursor:"pointer",fontWeight:active?600:400,fontFamily:"inherit"}}>{c==="All"?"All frameworks":c}</button>;
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
              <div style={{fontSize:10,color:B.textMut,fontFamily:"monospace",paddingTop:4,borderTop:"1px solid "+B.border}}>{filtered.length} / {RAW.length}</div>
            </div>

            <div style={{flex:1,minWidth:0}}>
              {filtered.length===0
                ?<div style={{textAlign:"center",padding:"60px 0",color:B.textMut,fontSize:13}}>No applications match your filters.</div>
                :<div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(255px,1fr))",gap:10}}>
                  {filtered.map(function(item){return <Card key={item.name} item={item} onOpen={function(){setSelected(item);setDetailTab("overview");setDetailVer(item.version);}}/>;}) }
                </div>
              }
            </div>
          </div>

          <div style={{marginTop:28,paddingTop:18,borderTop:"1px solid "+B.border,display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:9}}>
            <div style={{display:"flex",alignItems:"center",gap:9}}>
              <svg width="70" height="15" viewBox="0 0 70 15"><text x="0" y="12" fontFamily="monospace" fontSize="12" fontWeight="700" fill={B.teal}>k0rdent</text></svg>
              <span style={{fontSize:9.5,color:B.textMut}}>Application Catalog v1.8.0 · originated by Mirantis</span>
            </div>
            <div style={{display:"flex",gap:14}}>
              <span style={{fontSize:9.5,color:B.textMut}}>Privacy Policy</span>
              <span style={{fontSize:9.5,color:B.textMut}}>Terms of Use</span>
              <span onClick={function(){setView("contribute");}} style={{fontSize:9.5,color:B.teal,cursor:"pointer",fontWeight:500}}>Contribute</span>
            </div>
          </div>
        </div>
      )}

      {selected&&<DetailPanel item={selected} tab={detailTab} setTab={setDetailTab} selVer={detailVer} setSelVer={setDetailVer} onClose={function(){setSelected(null);setDetailTab("overview");setDetailVer("");}}/>}
    </div>
  );
}
