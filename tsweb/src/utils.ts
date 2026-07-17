import React from 'react';
import { B, MIRANTIS_CERTIFIED, appendTheme } from './constants';
import { DEPLOY_DATA } from './state';

export function getEff(item) {
  if (MIRANTIS_CERTIFIED[item.name]) return "mirantis-certified";
  if (item.support === "enterprise") return "mirantis-certified";
  return item.support;
}

export function deployStats(name) {
  if (DEPLOY_DATA[name]) return DEPLOY_DATA[name];
  var seed = 0;
  for (var i = 0; i < name.length; i++) seed += name.charCodeAt(i);
  return {deploys:200+(seed*37)%1800,trend:"+"+(1+(seed*13)%18)+"%",stars:0,hot:false};
}
export function fmtNum(n) { return n >= 1000 ? (n/1000).toFixed(1)+"k" : String(n); }

export function fmt$(n) { return n>=1000 ? "$"+(n/1000).toFixed(1)+"k" : "$"+Math.round(n); }

export function sevColor(sev:string) {
  if (sev === "critical" || sev === "CRITICAL") return "#ff4d6a";
  if (sev === "high" || sev === "HIGH") return "#ff8c00";
  if (sev === "medium" || sev === "MEDIUM") return "#ffcc00";
  return B.textMut;
}

export function imgStripSha(full:string) {
  // "registry.io/app@sha256:abc123..." -> "registry.io/app"
  return full.split("@")[0];
}

export function imgShortName(full:string) {
  // "quay.io/jetstack/cert-manager-cainjector:v1.20.2" -> "cert-manager-cainjector"
  var noTag = imgStripSha(full).split(":")[0];
  var parts = noTag.split("/");
  return parts[parts.length - 1];
}

var STATUS_STYLE = {
  pass:{bg:"#00d48a18",text:"#00d48a",border:"#00d48a30",label:"Pass"},
  fail:{bg:"#ff4d6a18",text:"#ff4d6a",border:"#ff4d6a30",label:"Fail"},
  skip:{bg:"#f5a62318",text:"#f5a623",border:"#f5a62330",label:"Skip"},
  pending:{bg:"#3d4d6a30",text:"#7a8aaa",border:"#3d4d6a50",label:"Pending"},
  "n/a":{bg:"transparent",text:"#3d4d6a",border:"transparent",label:"n/a"},
};

export function CIBadge({ s }) {
  var st = STATUS_STYLE[s] || STATUS_STYLE["n/a"];
  var icon = s==="pass"?"✓":s==="fail"?"✕":s==="skip"?"~":"…";
  return (
    React.createElement('span', {style:{fontSize:9,padding:"1px 5px",borderRadius:3,background:st.bg,color:st.text,border:"1px solid "+st.border,fontWeight:600,fontFamily:"monospace"}}, icon)
  );
}

// Detect base path and current k0rdent version from URL
export var BASE = (function(){
  var b = document.querySelector("base");
  if (b) return b.getAttribute("href") || "/";
  var s = document.querySelector('script[src*="k0rdent_catalog"]');
  if (s) { var m = (s as HTMLScriptElement).src.match(/^(.*?)\/?(?:src|assets)\//); if (m) return new URL(m[1]).pathname + "/"; }
  var p = window.location.pathname.replace(/\/apps\/[^/]+\/?$/, "/").replace(/\/infra\/[^/]+\/?$/, "/").replace(/\/(contribute|solutions|infra|configurator)\/?$/, "/").replace(/\/+$/, "/");
  return p || "/";
})();

// Detect k0rdent version from URL path (e.g. /v1.7.0/ or /latest/)
export function detectUrlVersion(): string {
  var m = window.location.pathname.match(/\/(v\d+\.\d+\.\d+)\//);
  return m ? m[1] : "";
}

// Build data URL prefix for a given k0rdent version
export function dataPrefix(k0rdentVer: string): string {
  if (!k0rdentVer) return BASE;
  // If BASE already contains the version (e.g. /v1.7.0/), use it as-is
  if (BASE.indexOf(k0rdentVer) !== -1) return BASE;
  // Otherwise, insert version into the path: /latest/ -> /v1.7.0/
  return BASE.replace(/\/(latest|v\d+\.\d+\.\d+)\/$/, "/" + k0rdentVer + "/");
}

export function readUrlParams() {
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

export function versionBase(k0rdentVer:string):string {
  if (!k0rdentVer) return BASE;
  return BASE.replace(/\/(latest|v\d+\.\d+\.\d+)\/$/, "/" + k0rdentVer + "/");
}

export function buildAppUrl(appName:string, dtab:string, ver:string, k0rdentVer?:string, img?:string, imgChart?:string, imgSub?:string):string {
  var p = new URLSearchParams();
  if (dtab && dtab !== "overview") p.set("dtab", dtab);
  if (ver) p.set("ver", ver);
  if (img) p.set("img", img);
  if (imgChart) p.set("imgChart", imgChart);
  if (imgSub) p.set("imgSub", imgSub);
  var qs = p.toString();
  return appendTheme(versionBase(k0rdentVer || "") + "apps/" + appName + "/" + (qs ? "?" + qs : ""));
}

export function buildCatalogUrl(state:{view:string, search:string, tag:string, support:string, sort:string, compliance:string, sol?:string, scat?:string, shide?:string, usecase?:string, ccloud?:string, cscale?:string}, k0rdentVer?:string):string {
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

export function slugify(s:string):string { return (s||"").toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,""); }

export function filterVerifyBash(text:string, hiddenNames:any):string {
  if (!text) return text;
  var lines = text.split("\n");
  var filtered = lines.filter(function(line) {
    var m = line.match(/^#\s+kcm-system\s+(\S+)/);
    if (!m) return true;
    return !templateMatchesHidden(m[1], hiddenNames);
  });
  return filtered.join("\n");
}

export function filterContentHtml(contentHtml:string, hiddenNames:any):string {
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

export function filterInstallBash(bash:string, hiddenNames:any):string {
  if (!bash) return bash;
  var cmds = bash.split(/(?=helm upgrade --install )/);
  var filtered = cmds.filter(function(cmd) {
    var m = cmd.match(/chart=([^:]+):/);
    if (!m) return !!cmd.trim();
    return !hiddenNames[m[1]];
  });
  return filtered.join("").trim();
}

export function templateMatchesHidden(templateSlug:string, hiddenNames:any):boolean {
  for (var name in hiddenNames) {
    if (hiddenNames[name] && templateSlug.indexOf(name+"-") === 0) return true;
  }
  return false;
}

export function removeDependsOnRefs(block:string, removedNames:any):string {
  if (block.indexOf("dependsOn") === -1) return block;
  var result = block.replace(/^      - name: (\S+)\n(?:        namespace: \S+\n)?/gm, function(match, refName) {
    return removedNames[refName] ? "" : match;
  });
  result = result.replace(/^      dependsOn:\n(?=      [a-z]|    - template:|\s*$)/gm, "");
  return result;
}

export function filterMcsYaml(yaml:string, hiddenNames:any):string {
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
