import React, { useState, useMemo, useEffect } from "react";
import { B, GRAD, MONO, FONT, SUPPORT_LABEL, TIER_DESC, COMPLIANCE, tagAccent, applyTheme, appendTheme } from "../constants";
import { RAW, SOLUTIONS, INFRA, CONFIGURATOR_SOLUTIONS, HARDCODED_SOLUTIONS, _catalogLoaded, ALL_TAGS, ALL_SUPPORT } from "../state";
import { getEff, BASE, detectUrlVersion, dataPrefix, readUrlParams, versionBase, buildAppUrl, buildCatalogUrl, fmtNum } from "../utils";
import { Nav } from "./Nav";
import { Card } from "./Card";
import { AppDetailPage } from "./AppDetailPage";
import { SiteFooter } from "./SiteFooter";
import { ContributePage } from "./ContributePage";
import { SolutionsPage } from "./SolutionsPage";
import { InfraPage } from "./InfraPage";
import { ConfiguratorPage } from "./ConfiguratorPage";
import { HowToPage } from "./HowToPage";
import { PartnerCTA } from "./PartnerCTA";

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
  // Bumped on every top-nav click so sub-pages holding their own detail
  // selection (infra targets, solution bundles) return to their index.
  var [navToken, setNavToken] = useState(0);

  // Restore selected app from URL after data loads
  useEffect(function(){
    if (loading) return;
    var params = readUrlParams();
    if (params.app) {
      var found = RAW.find(function(i:any){ return i.name === params.app; });
      if (found) {
        setSelected(found);
        setDetailTab(params.dtab);
        if (params.ver) setDetailVer(params.ver);
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
    if (!loading && !selected && !window.location.pathname.match(/\/apps\/[^/]+/) && !window.location.pathname.match(/\/infra\/[^/]+/) && !window.location.pathname.match(/\/(contribute|solutions|infra|configurator|howto)\/?$/)) {
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
    // Replace version in current URL, preserving path and params
    var currentUrl = window.location.pathname + window.location.search;
    var newUrl = currentUrl.replace(/\/(latest|v\d+\.\d+\.\d+)\//, "/" + newVer + "/");
    history.pushState(null, "", newUrl);
    doLoad(newVer);
  }

  useEffect(function(){ doLoad(); }, []);

  // Every top-level navigation clears whatever detail page is open, so the
  // header keeps working while an application page is mounted.
  function navigateTo(v:string) {
    setSelected(null);
    setDetailTab("overview");
    setDetailVer("");
    setDetailImg("");
    setDetailImgChart("");
    setDetailImgSub("");
    setView(v);
    setNavToken(function(t:number){ return t + 1; });
    if (v === "catalog") {
      setSearch(""); setTag("All"); setSupport("All"); setSort("A-Z"); setCompliance("All");
      history.pushState(null, "", appendTheme(versionBase(k0rdentVer || "")));
    } else {
      history.pushState(null, "", appendTheme(versionBase(k0rdentVer || "") + v + "/"));
    }
    window.scrollTo(0, 0);
  }

  // Opening an app is a page navigation now, not an overlay, so it pushes a
  // history entry and the catalog view stands down while the page is mounted.
  function openApp(next:any) {
    setSelected(next);
    setDetailTab("overview");
    setDetailVer("");
    setDetailImg("");
    setDetailImgChart("");
    setDetailImgSub("");
    history.pushState(null, "", buildAppUrl(next.name, "overview", "", k0rdentVer));
    window.scrollTo(0, 0);
  }
  function closeApp() {
    setSelected(null);
    setDetailTab("overview");
    setDetailVer("");
    setDetailImg("");
    setDetailImgChart("");
    setDetailImgSub("");
    history.pushState(null, "", buildCatalogUrl({view,search,tag,support,sort,compliance}, k0rdentVer));
    window.scrollTo(0, 0);
  }

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

  var testedCount=0; var certCount=0; var partnerCount=0;
  var catCounts:Record<string,number> = {};
  if (!loading) {
    for(var i=0;i<RAW.length;i++){
      if(RAW[i].tested)testedCount++;
      var effI=getEff(RAW[i]);
      if(effI==="mirantis-certified")certCount++;
      if(effI==="partner")partnerCount++;
      for(var ti=0;ti<RAW[i].tags.length;ti++){ var tg=RAW[i].tags[ti]; catCounts[tg]=(catCounts[tg]||0)+1; }
    }
  }
  var catCount = ALL_TAGS.length > 0 ? ALL_TAGS.length - 1 : 0;

  if (loading || loadError) {
    return (
      <div style={{fontFamily:FONT,background:B.bg0,minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:16}}>
        {loading && <span style={{fontSize:12,fontWeight:800,textTransform:"uppercase",letterSpacing:"0.12em",color:B.textMut}}>Loading catalog…</span>}
        {loadError && <>
          <span style={{color:B.red,fontSize:14}}>{loadError}</span>
          <button onClick={function(){doLoad();}} style={{padding:"12px 26px 9px",background:GRAD,color:"#000",border:"2px solid #000",borderRadius:20,cursor:"pointer",fontWeight:900,fontSize:13,textTransform:"uppercase",letterSpacing:"0.06em",fontFamily:"inherit"}}>Retry</button>
        </>}
      </div>
    );
  }

  return (
    <div style={{fontFamily:FONT,background:B.bg0,minHeight:"100vh",color:B.textPri}}>
      <style>{`
        /* Wide layout collapses to a single column before the sidebar and the
           hero's two-up grid start crowding each other. */
        @media (max-width: 1080px) {
          .k0-hero { grid-template-columns: 1fr !important; gap: 32px !important; padding: 36px 24px 28px !important; }
          .k0-catalog-layout { grid-template-columns: 1fr !important; gap: 28px !important; padding: 32px 24px 0 !important; }
          .k0-sidebar { position: static !important; max-height: none !important; overflow: visible !important; }
          .k0-nav-inner { padding: 0 24px !important; }
          .k0-detail-body { grid-template-columns: 1fr !important; gap: 40px !important; padding: 40px 24px 72px !important; }
          .k0-detail-aside { position: static !important; }
          .k0-detail-hero { padding: 20px 24px 36px !important; }
          .k0-footer { padding: 48px 24px !important; gap: 40px !important; }
          .k0-partner { padding: 80px 24px 0 !important; }
          .k0-partner-panel { padding: 48px 32px !important; gap: 32px !important; }
        }
        @media (max-width: 760px) {
          .k0-nav-inner { height: auto !important; flex-wrap: wrap; padding: 12px 16px !important; gap: 12px !important; row-gap: 10px !important; }
          .k0-nav-tabs { order: 3; width: 100%; overflow-x: auto; gap: 14px !important; }
          .k0-nav-tabs button { font-size: 11px !important; white-space: nowrap; }
          .k0-nav-cta { padding: 8px 16px 6px !important; font-size: 11px !important; }
          .k0-nav-ver { order: 4; margin-left: auto; }
          .k0-hero { padding: 28px 16px 24px !important; }
          .k0-hero h1 { font-size: 30px !important; line-height: 34px !important; }
          .k0-stats-row { grid-template-columns: 1fr 1fr !important; }
          .k0-tier-row { grid-template-columns: 1fr !important; }
          .k0-catalog-layout { padding: 24px 16px 0 !important; }
          .k0-filter-row > div:first-child { min-width: 0 !important; }
          .k0-card-grid { grid-template-columns: 1fr !important; }
          .k0-infra-grid { grid-template-columns: 1fr !important; }
          .k0-sol-grid { grid-template-columns: 1fr !important; }
          .k0-detail-hero { padding: 16px 16px 32px !important; }
          .k0-detail-hero h1 { font-size: 30px !important; line-height: 34px !important; }
          .k0-detail-cta { width: 100% !important; }
          .k0-detail-cta > * { width: 100% !important; }
          .k0-detail-body { padding: 32px 16px 64px !important; }
          .k0-detail-tabs { width: 100% !important; overflow-x: auto !important; border-radius: 8px !important; }
          .k0-detail-tabs button { padding: 11px 14px 9px !important; font-size: 11px !important; }
          .k0-ver-row { grid-template-columns: 1fr auto !important; gap: 8px 16px !important; }
          .k0-footer { padding: 40px 16px !important; gap: 32px !important; }
          .k0-partner { padding: 56px 16px 0 !important; }
          .k0-partner-panel { padding: 32px 20px !important; gap: 24px !important; }
          .k0-partner-copy { min-width: 0 !important; }
          .k0-partner h2 { font-size: 28px !important; line-height: 32px !important; }
          .k0-partner a { width: 100% !important; justify-content: center !important; }
          .k0-catalog-header { flex-direction: column !important; align-items: flex-start !important; gap: 8px !important; }
        }
        .anchor-link { color: ${B.textDim}; text-decoration: none; margin-left: 6px; opacity: 0; transition: opacity 0.15s; font-size: 0.8em; }
        h1:hover .anchor-link, h2:hover .anchor-link, h3:hover .anchor-link, h4:hover .anchor-link { opacity: 1; }
        a { color: ${B.link}; }
        a:hover { color: ${B.linkHover}; }
        ::-webkit-scrollbar { width: 10px; height: 10px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: ${B.border}; border-radius: 6px; }
        ::-webkit-scrollbar-thumb:hover { background: ${B.borderHi}; }
      `}</style>
      <Nav view={view} versions={versions} k0rdentVer={k0rdentVer} onVersionChange={switchK0rdentVersion} dark={dark} toggleTheme={toggleTheme} onNavigate={navigateTo}/>

      {view==="contribute"&&!selected&&<ContributePage/>}
      {view==="solutions"&&!selected&&<SolutionsPage initSolId={initParams.sol} initScat={initParams.scat} initShide={initParams.shide} k0rdentVer={k0rdentVer} navToken={navToken}/>}
      {view==="infra"&&!selected&&(function(){ var p=readUrlParams(); return <InfraPage key={k0rdentVer} k0rdentVer={k0rdentVer} initInfraApp={p.infraApp} initDtab={p.dtab} initIgrp={p.igrp} navToken={navToken}/>; })()}
      {view==="howto"&&!selected&&<HowToPage onGoCatalog={function(){navigateTo("catalog");}}/>}
      {view==="configurator"&&!selected&&<ConfiguratorPage initUsecase={initParams.usecase} initCcloud={initParams.ccloud} initCscale={initParams.cscale} k0rdentVer={k0rdentVer}/>}

      {view==="catalog"&&!selected&&(
        <div>
          {/* Hero: gradient wash, eyebrow rule, headline, and the counts that
              frame the catalog before any filtering happens. */}
          <section style={{background:"linear-gradient(180deg,"+B.bg0+" 0%,"+B.panelHi+" 100%)",borderBottom:"1px solid "+B.border}}>
            <div className="k0-hero" style={{maxWidth:1440,margin:"0 auto",padding:"44px 40px 32px",display:"grid",gridTemplateColumns:"minmax(0,1.15fr) minmax(0,0.85fr)",gap:64,alignItems:"start"}}>
              <div style={{display:"flex",flexDirection:"column",gap:16}}>
                <div style={{display:"flex",alignItems:"center",gap:12}}>
                  <span style={{width:32,height:2,background:GRAD}}/>
                  <span style={{fontSize:12,fontWeight:800,textTransform:"uppercase",letterSpacing:"0.12em",color:B.textPri}}>The k0rdent catalog</span>
                </div>
                <h1 style={{margin:0,fontSize:40,lineHeight:"44px",fontWeight:700,letterSpacing:"-0.01em",color:B.textPri,maxWidth:"28ch"}}>Best-in-class software for the AI infrastructure stack</h1>
                <p style={{margin:0,fontSize:14,lineHeight:"22px",color:B.textSec,maxWidth:"84ch"}}>
                  Every integration sits at the intersection of AI workloads and cloud-native Kubernetes infrastructure — production-hardened on real enterprise clusters, composable by design, and relevant across the full AI lifecycle from GPU provisioning through model serving, RAG pipelines, observability, security, and FinOps. Not a directory of everything that exists, but a curated set of best-in-class integrations validated by Mirantis platform engineers and deployable in minutes on any infrastructure.
                </p>
              </div>
              {/* Hairline grid: 1px gaps over a rule-coloured backdrop. */}
              <div className="k0-stats-row" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:1,background:B.border,border:"1px solid "+B.border}}>
                {[{n:RAW.length,l:"Applications",grad:true},{n:catCount,l:"Categories"},{n:certCount,l:"Mirantis Certified"},{n:partnerCount,l:"Verified Partner"}].map(function(s){
                  return <div key={s.l} style={{background:B.bg0,padding:"18px 20px",display:"flex",flexDirection:"column",gap:4}}>
                    <span style={Object.assign({fontSize:34,lineHeight:1,fontWeight:800,letterSpacing:"-0.02em"},
                      s.grad?{backgroundImage:B.gradText,WebkitBackgroundClip:"text",backgroundClip:"text",color:"transparent"}:{color:B.textPri})}>{s.n}</span>
                    <span style={{fontSize:12,fontWeight:800,textTransform:"uppercase",letterSpacing:"0.12em",color:B.textMut}}>{s.l}</span>
                  </div>;
                })}
              </div>
            </div>
            {/* Tier legend doubles as a filter: clicking a tile scopes the grid. */}
            <div style={{maxWidth:1440,margin:"0 auto",padding:"0 40px 44px"}}>
              <div className="k0-tier-row" style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(280px,1fr))",gap:1,background:B.border,border:"1px solid "+B.border}}>
                {Object.entries(TIER_DESC).map(function(entry){
                  var k=entry[0]; var desc=entry[1] as string;
                  var isActive=support===k;
                  var cnt=0; for(var ii=0;ii<RAW.length;ii++){if(getEff(RAW[ii])===k)cnt++;}
                  return <div key={k} onClick={function(){setSupport(isActive?"All":k);}}
                    onMouseEnter={function(e){ if(!isActive) e.currentTarget.style.background=B.tile; }}
                    onMouseLeave={function(e){ if(!isActive) e.currentTarget.style.background=B.bg0; }}
                    style={{background:isActive?B.tile:B.bg0,padding:"22px 22px 20px",display:"flex",flexDirection:"column",gap:10,cursor:"pointer",transition:"background 160ms ease"}}>
                    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:10}}>
                      {k==="mirantis-certified"
                        ?<span style={{display:"inline-flex",alignItems:"center",gap:8,fontSize:11,fontWeight:800,textTransform:"uppercase",letterSpacing:"0.1em",color:B.teal}}><span style={{width:7,height:7,borderRadius:"50%",background:GRAD}}/>{SUPPORT_LABEL[k]}</span>
                        :k==="partner"
                          ?<span style={{fontSize:11,fontWeight:800,textTransform:"uppercase",letterSpacing:"0.1em",color:B.textPri,border:"1px solid "+B.textMut,borderRadius:4,padding:"3px 8px 1px"}}>{SUPPORT_LABEL[k]}</span>
                          :<span style={{fontSize:11,fontWeight:800,textTransform:"uppercase",letterSpacing:"0.1em",color:B.textDim}}>{SUPPORT_LABEL[k]}</span>}
                      <span style={{fontFamily:MONO,fontSize:12,color:B.textDim}}>{cnt}</span>
                    </div>
                    <p style={{margin:0,fontSize:13,lineHeight:"20px",color:B.textSec,textWrap:"pretty"}}>{desc.indexOf("Mirantis Enterprise Support")!==-1?<>{desc.split("Mirantis Enterprise Support")[0]}<a href="https://www.mirantis.com/support/enterprise-support-options/" target="_blank" rel="noreferrer" onClick={function(e:any){e.stopPropagation();}} style={{color:B.link}}>Mirantis Enterprise Support</a>{desc.split("Mirantis Enterprise Support")[1]}</>:desc}</p>
                  </div>;
                })}
              </div>
            </div>
          </section>

          <section className="k0-catalog-layout" style={{maxWidth:1440,margin:"0 auto",padding:"40px 40px 0",display:"grid",gridTemplateColumns:"264px minmax(0,1fr)",gap:56,alignItems:"start"}}>
            <aside className="k0-sidebar" style={{position:"sticky",top:96,maxHeight:"calc(100vh - 120px)",overflowY:"auto",overscrollBehavior:"contain",scrollbarWidth:"thin",paddingRight:8,display:"flex",flexDirection:"column",gap:20}}>
              <div style={{display:"flex",flexDirection:"column",gap:10,paddingBottom:20,borderBottom:"1px solid "+B.border}}>
                <span style={{fontSize:12,fontWeight:800,textTransform:"uppercase",letterSpacing:"0.12em",color:B.textMut}}>Support tier</span>
                <div style={{display:"flex",flexDirection:"column",gap:1,background:B.border,border:"1px solid "+B.border}}>
                  {ALL_SUPPORT.map(function(s){
                    var active=support===s;
                    var cnt=0;
                    if (s==="All") cnt=RAW.length; else for(var ii=0;ii<RAW.length;ii++){if(getEff(RAW[ii])===s)cnt++;}
                    return <button key={s} onClick={function(){setSupport(s);}}
                      onMouseEnter={function(e){ if(!active) e.currentTarget.style.background=B.tile; }}
                      onMouseLeave={function(e){ if(!active) e.currentTarget.style.background=B.bg0; }}
                      style={{textAlign:"left",padding:"11px 14px 9px",border:"none",background:active?B.panel:B.bg0,
                        color:active?B.textPri:B.textSec,cursor:"pointer",fontFamily:"inherit",
                        fontSize:12,fontWeight:800,textTransform:"uppercase",letterSpacing:"0.08em",transition:"background 160ms ease"}}>
                      <span style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:10}}>
                        <span>{s==="All"?"All tiers":SUPPORT_LABEL[s]}</span>
                        <span style={{fontFamily:MONO,fontWeight:400,letterSpacing:0,color:B.textDim}}>{cnt}</span>
                      </span>
                    </button>;
                  })}
                </div>
              </div>

              <span style={{fontSize:12,fontWeight:800,textTransform:"uppercase",letterSpacing:"0.12em",color:B.textMut}}>Browse by category</span>
              <div style={{display:"flex",flexDirection:"column"}}>
                {ALL_TAGS.map(function(t){
                  var active=tag===t;
                  var color=t==="All"?B.textMut:tagAccent(t);
                  var cnt=t==="All"?RAW.length:(catCounts[t]||0);
                  return <div key={t} onClick={function(){setTag(t);}}
                    onMouseEnter={function(e){ if(!active) e.currentTarget.style.background=B.tile; }}
                    onMouseLeave={function(e){ if(!active) e.currentTarget.style.background="transparent"; }}
                    style={{display:"flex",alignItems:"center",gap:10,padding:"9px 10px 8px 0",cursor:"pointer",
                      background:active?B.tile:"transparent",transition:"background 160ms ease"}}>
                    <span style={{flex:"none",width:2,alignSelf:"stretch",background:active?color:"transparent"}}/>
                    <span style={{flex:"none",width:8,height:8,borderRadius:2,background:color,opacity:active?1:0.45,marginLeft:8}}/>
                    <span style={{flex:1,minWidth:0,fontSize:14,lineHeight:"20px",fontWeight:700,color:active?B.textPri:B.textSec}}>{t==="All"?"All applications":t}</span>
                    <span style={{flex:"none",fontFamily:MONO,fontSize:12,color:B.textDim}}>{cnt}</span>
                  </div>;
                })}
              </div>
            </aside>

            <div style={{minWidth:0}}>
              <div className="k0-filter-row" style={{display:"flex",gap:16,alignItems:"center",flexWrap:"wrap"}}>
                <div style={{flex:1,minWidth:320,display:"flex",alignItems:"center",gap:14,height:60,padding:"0 24px",border:"1px solid "+B.border,borderRadius:120,background:B.tile}}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={B.textMut} strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="7"/><path d="M20 20l-4.3-4.3"/></svg>
                  <input value={search} onChange={function(e){setSearch(e.target.value);}} placeholder={'Search the catalog — try "gpu", "policy", "postgres"'}
                    style={{flex:1,minWidth:0,background:"none",border:"none",color:B.textPri,fontSize:16,lineHeight:"24px",fontFamily:"inherit"}}/>
                  {search&&<button onClick={function(){setSearch("");}} style={{background:"none",border:"none",color:B.textMut,fontSize:20,lineHeight:1,cursor:"pointer",padding:"0 4px"}}>×</button>}
                </div>
                <div style={{flex:"none",display:"flex",alignItems:"center",gap:10,height:60,padding:"0 22px",border:"1px solid "+B.border,borderRadius:120}}>
                  <span style={{fontSize:11,fontWeight:800,textTransform:"uppercase",letterSpacing:"0.12em",color:B.textDim}}>Sort</span>
                  <select value={sort} onChange={function(e){setSort(e.target.value);}} style={{background:"none",border:"none",color:B.textPri,fontSize:14,fontWeight:700,cursor:"pointer",fontFamily:"inherit",outline:"none"}}>
                    {["A-Z","Z-A","By Newest","Last updated","Tested first","Certified first","Most popular"].map(function(o){
                      return <option key={o} value={o} style={{background:B.tile,color:B.textPri}}>{o}</option>;
                    })}
                  </select>
                </div>
              </div>

              <div style={{display:"flex",alignItems:"baseline",justifyContent:"space-between",gap:24,padding:"28px 0 16px",borderBottom:"1px solid "+B.border}}>
                <h3 style={{margin:0,fontSize:24,lineHeight:"32px",fontWeight:700,color:B.textPri}}>
                  {search?'Results for "'+search+'"':tag!=="All"?tag:support!=="All"?SUPPORT_LABEL[support]:"All applications"}
                </h3>
                <span style={{fontFamily:MONO,fontSize:13,color:B.textDim}}>{filtered.length} of {RAW.length}</span>
              </div>

              {filtered.length===0
                ?<div style={{padding:"80px 0",display:"flex",flexDirection:"column",alignItems:"center",gap:16}}>
                  <span style={{fontSize:15,color:B.textMut}}>No applications match your filters.</span>
                  <button onClick={function(){setSearch("");setTag("All");setSupport("All");setCompliance("All");}}
                    style={{padding:"12px 24px 9px",border:"2px solid "+B.textPri,borderRadius:20,background:"none",color:B.textPri,fontSize:13,fontWeight:900,textTransform:"uppercase",letterSpacing:"0.06em",cursor:"pointer",fontFamily:"inherit"}}>Clear filters</button>
                </div>
                :<div className="k0-card-grid" style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(min(300px,100%),1fr))",gap:16,padding:"28px 0 0"}}>
                  {filtered.map(function(item){return <Card key={item.name} item={item} onOpen={function(){openApp(item);}}/>;}) }
                </div>
              }
            </div>
          </section>

        </div>
      )}

      {selected&&<AppDetailPage item={selected} tab={detailTab} setTab={setDetailTab} selVer={detailVer} setSelVer={setDetailVer}
        k0rdentVer={k0rdentVer} detailImg={detailImg} setDetailImg={setDetailImg} detailImgChart={detailImgChart}
        setDetailImgChart={setDetailImgChart} detailImgSub={detailImgSub} setDetailImgSub={setDetailImgSub}
        backLabel="Back to catalog"
        onOpenApp={function(next:any){ openApp(next); }}
        onBack={function(){ closeApp(); }}/>}

      {/* Partner band rides above the footer on the index pages — not on an
          application page, the contribute doc, the configurator or the tour. */}
      {!selected&&view!=="contribute"&&view!=="configurator"&&view!=="howto"&&
        <PartnerCTA href={appendTheme(versionBase(k0rdentVer||"")+"contribute/")} onContribute={function(){navigateTo("contribute");}}/>}

      <SiteFooter onNavigate={navigateTo}/>
    </div>
  );
}
