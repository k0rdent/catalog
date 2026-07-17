import React, { useState, useMemo, useEffect } from "react";
import { B, SUPPORT_STYLE, SUPPORT_LABEL, TIER_DESC, COMPLIANCE, tagAccent, applyTheme, appendTheme } from "../constants";
import { RAW, SOLUTIONS, INFRA, CONFIGURATOR_SOLUTIONS, HARDCODED_SOLUTIONS, _catalogLoaded, ALL_TAGS, ALL_SUPPORT } from "../state";
import { getEff, BASE, detectUrlVersion, dataPrefix, readUrlParams, versionBase, buildAppUrl, buildCatalogUrl, fmtNum } from "../utils";
import { Nav } from "./Nav";
import { Card } from "./Card";
import { DetailPanel } from "./DetailPanel";
import { ContributePage } from "./ContributePage";
import { SolutionsPage } from "./SolutionsPage";
import { InfraPage } from "./InfraPage";
import { ConfiguratorPage } from "./ConfiguratorPage";

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
    // Use a local variable since _catalogLoaded is imported as a value binding
    var catalogLoadedLocal = false;

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
        catalogLoadedLocal = true;
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
