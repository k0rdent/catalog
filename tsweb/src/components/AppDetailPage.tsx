import React, { useState, useEffect } from 'react';
import { B, GRAD, MONO, FONT, SUPPORT_LABEL, TIER_DESC, tagAccent } from '../constants';
import { getEff, fmtNum } from '../utils';
import { RAW } from '../state';
import { useScanData, scanVersions } from '../hooks/useScanData';
import { AppLogo } from './AppLogo';
import { HtmlWithCopy } from './HtmlWithCopy';
import { InstallTab } from './InstallTab';
import { TestResults } from './TestResults';
import { ScanImagesTab } from './ScanImagesTab';
import { ScanVulnsTab } from './ScanVulnsTab';
import { FinOpsEstimator } from './FinOpsEstimator';

function TierMark({ eff }:{eff:string}) {
  if (eff === "mirantis-certified") {
    return <span style={{display:"inline-flex",alignItems:"center",gap:8,fontSize:11,fontWeight:800,textTransform:"uppercase",letterSpacing:"0.1em",color:B.teal}}>
      <span style={{width:7,height:7,borderRadius:"50%",background:GRAD}}/>{SUPPORT_LABEL["mirantis-certified"]}
    </span>;
  }
  if (eff === "partner") {
    return <span style={{fontSize:11,fontWeight:800,textTransform:"uppercase",letterSpacing:"0.1em",color:B.textPri,border:"1px solid "+B.textMut,borderRadius:4,padding:"3px 8px 1px"}}>{SUPPORT_LABEL.partner}</span>;
  }
  return <span style={{fontSize:11,fontWeight:800,textTransform:"uppercase",letterSpacing:"0.1em",color:B.textDim}}>{SUPPORT_LABEL.community}</span>;
}

function SectionTitle({ children }:any) {
  return <h2 style={{margin:0,fontSize:24,lineHeight:"32px",fontWeight:700,color:B.textPri}}>{children}</h2>;
}

// Hairline grid: 1px gaps over a rule-coloured backdrop, same device as the hero.
function HairGrid({ min, children }:{min:number, children:any}) {
  return <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax("+min+"px,1fr))",gap:1,background:B.border,border:"1px solid "+B.border}}>{children}</div>;
}

export function AppDetailPage({ item, onBack, backLabel, tab, setTab, selVer, setSelVer, k0rdentVer,
  detailImg, setDetailImg, detailImgChart, setDetailImgChart, detailImgSub, setDetailImgSub, onOpenApp }:any) {
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
  var isInfra = item.type === "infra";
  var cat = item.tags && item.tags.length ? item.tags[0] : "Other";
  var accent = tagAccent(cat);
  var publisher = item.githubRepo ? String(item.githubRepo).split("/")[0] : item.name;
  var version = String(item.version || "").replace(/^v/, "");

  // Entering a detail page is a navigation, so start at the top of it.
  useEffect(function(){ window.scrollTo(0, 0); }, [item.name]);

  var maxD = 1;
  for (var ri=0;ri<RAW.length;ri++){ if((RAW[ri].pulls||0)>maxD) maxD = RAW[ri].pulls; }
  var pct = maxD>0 ? Math.round((item.pulls||0)/maxD*100) : 0;

  // "Often deployed with": same primary category, most-pulled first.
  var related:any[] = [];
  if (!isInfra) {
    related = RAW.filter(function(r:any){
      return r.name !== item.name && r.tags && r.tags.indexOf(cat) !== -1;
    }).sort(function(a:any,b:any){ return (b.pulls||0)-(a.pulls||0); }).slice(0,3);
  }

  var tabs = ["overview","install","validation","images","vulnerabilities","versions","cost"].filter(function(t){
    if (t==="install" && item.showInstall===false) return false;
    if (isInfra && (t==="validation"||t==="cost"||t==="images"||t==="vulnerabilities"||t==="versions")) return false;
    if ((t==="images"||t==="vulnerabilities") && !item.hasScan) return false;
    if (t==="versions" && !(item.versions && item.versions.length)) return false;
    return true;
  });
  var activeTab = tabs.indexOf(tab) === -1 ? "overview" : tab;

  var whyCopy = item.whyInCatalog || "Carefully selected by Mirantis platform engineers for its production-grade quality and proven interoperability with k0rdent-managed clusters.";

  var signals = [
    {k:"Total downloads", v:item.pulls>0?fmtNum(item.pulls):"—"},
    {k:"GitHub stars", v:item.stars>0?fmtNum(item.stars):"—"},
    {k:"Versions published", v:String((item.versions||[]).length||"—")},
    {k:"CI validated", v:item.tested?"Yes":"Not yet"},
  ];
  var facts = [
    {k:"Latest version", v:version, mono:true},
    {k:"Chart name", v:item.chartName||"", mono:true},
    {k:"Support tier", v:isInfra?"":SUPPORT_LABEL[eff]},
    {k:"Last updated", v:item.lastUpdated?item.lastUpdated.slice(0,10):"", mono:true},
  ].filter(function(f:any){ return !!f.v; });
  // Infra targets carry no tags, version, or tier, so they get their own
  // eyebrow and meta list rather than a column of em dashes.
  var infraGroupLabel = item.infraGroup==="public" ? "Public cloud"
    : item.infraGroup==="private" ? "Private cloud / on-premises"
    : "Infrastructure target";
  var eyebrow = isInfra ? infraGroupLabel : publisher + " · " + cat;
  var meta = (isInfra
    ? [
        {k:"Environment", v:infraGroupLabel},
        {k:"Chart name", v:item.chartName||"", mono:true},
      ]
    : [
        {k:"Category", v:(item.tags||[]).join(", ")},
        {k:"Publisher", v:publisher},
        {k:"Latest version", v:version, mono:true},
        {k:"Chart name", v:item.chartName||"", mono:true},
        {k:"Support tier", v:SUPPORT_LABEL[eff]},
        {k:"Last updated", v:item.lastUpdated?item.lastUpdated.slice(0,10):"", mono:true},
      ]
  ).filter(function(m:any){ return !!m.v; });

  function ghostPill(e:any, on:boolean){ e.currentTarget.style.background = on ? B.hover : "none"; }

  return (
    <div style={{fontFamily:FONT,color:B.textPri}}>
      <section style={{background:"linear-gradient(180deg,"+B.bg0+" 0%,"+B.panel+" 100%)",borderBottom:"1px solid "+B.border}}>
        <div className="k0-detail-hero" style={{maxWidth:1440,margin:"0 auto",padding:"24px 40px 44px"}}>
          <button onClick={onBack}
            onMouseEnter={function(e){e.currentTarget.style.color=B.textPri;}}
            onMouseLeave={function(e){e.currentTarget.style.color=B.textMut;}}
            style={{display:"inline-flex",alignItems:"center",gap:8,background:"none",border:"none",padding:0,marginBottom:28,
              color:B.textMut,fontSize:12,fontWeight:800,textTransform:"uppercase",letterSpacing:"0.12em",cursor:"pointer",fontFamily:"inherit"}}>
            <span style={{fontSize:14}}>←</span> {backLabel||"Back to catalog"}
          </button>

          <div style={{display:"flex",alignItems:"flex-start",gap:32,flexWrap:"wrap"}}>
            <AppLogo name={item.name} size={96} accent={accent} logo={item.logo} brandColor={item.brandColor} isInfra={isInfra}/>
            <div style={{flex:1,minWidth:340,display:"flex",flexDirection:"column",gap:14}}>
              <div style={{display:"flex",alignItems:"center",gap:16,flexWrap:"wrap"}}>
                <h1 style={{margin:0,fontSize:40,lineHeight:"44px",fontWeight:700,letterSpacing:"-0.01em",color:B.textPri}}>{item.title||item.name}</h1>
                {!isInfra&&<TierMark eff={eff}/>}
              </div>
              <span style={{fontSize:14,fontWeight:800,textTransform:"uppercase",letterSpacing:"0.12em",color:B.textMut}}>{eyebrow}</span>
              <p style={{margin:"8px 0 0",fontSize:20,lineHeight:"32px",color:B.textSec,maxWidth:"70ch",textWrap:"pretty"}}>{item.desc}</p>
            </div>
            <div className="k0-detail-cta" style={{flex:"none",display:"flex",flexDirection:"column",gap:12,paddingTop:8}}>
              {item.showInstall!==false&&<button onClick={function(){setTab("install");}}
                onMouseEnter={function(e){e.currentTarget.style.filter="brightness(1.08)";}}
                onMouseLeave={function(e){e.currentTarget.style.filter="none";}}
                style={{display:"inline-flex",alignItems:"center",justifyContent:"center",padding:"16px 34px 12px",
                  border:"2px solid #000",borderRadius:40,background:GRAD,color:"#000",fontSize:14,fontWeight:900,
                  textTransform:"uppercase",letterSpacing:"0.06em",cursor:"pointer",fontFamily:"inherit",
                  boxShadow:"0 4px 4px rgba(0,0,0,0.25)"}}>Deploy to a cluster</button>}
              {item.githubRepo&&<a href={"https://github.com/"+item.githubRepo} target="_blank" rel="noreferrer"
                onMouseEnter={function(e){ghostPill(e,true);}} onMouseLeave={function(e){ghostPill(e,false);}}
                style={{display:"inline-flex",alignItems:"center",justifyContent:"center",padding:"16px 34px 12px",
                  border:"2px solid "+B.textPri,borderRadius:40,color:B.textPri,fontSize:14,fontWeight:900,
                  textTransform:"uppercase",letterSpacing:"0.06em",textDecoration:"none"}}>View source</a>}
              {item.doc_link&&<a href={item.doc_link} target="_blank" rel="noreferrer"
                onMouseEnter={function(e){ghostPill(e,true);}} onMouseLeave={function(e){ghostPill(e,false);}}
                style={{display:"inline-flex",alignItems:"center",justifyContent:"center",padding:"16px 34px 12px",
                  border:"2px solid "+B.border,borderRadius:40,color:B.textSec,fontSize:14,fontWeight:900,
                  textTransform:"uppercase",letterSpacing:"0.06em",textDecoration:"none"}}>Documentation</a>}
            </div>
          </div>
        </div>
      </section>

      <section className="k0-detail-body" style={{maxWidth:1440,margin:"0 auto",padding:"56px 40px 96px",display:"grid",gridTemplateColumns:"minmax(0,1fr) 340px",gap:72,alignItems:"start"}}>
        <div style={{display:"flex",flexDirection:"column",gap:44,minWidth:0}}>
          {/* Segmented pill tab group */}
          <div className="k0-detail-tabs" style={{display:"flex",gap:1,background:B.border,border:"1px solid "+B.border,borderRadius:120,overflow:"hidden",width:"max-content",maxWidth:"100%"}}>
            {tabs.map(function(t){
              var active = activeTab===t;
              var count = t==="images"?_scanCounts.images:t==="vulnerabilities"?_scanCounts.vulns:-1;
              return <button key={t} onClick={function(){
                  setTab(t);
                  if(t==="images"||t==="vulnerabilities"){setImagesKey(function(k:number){return k+1;});setDetailImg("");setDetailImgChart("");setDetailImgSub("");}
                }}
                onMouseEnter={function(e){ if(!active) e.currentTarget.style.background=B.tile; }}
                onMouseLeave={function(e){ if(!active) e.currentTarget.style.background=B.bg0; }}
                style={{padding:"13px 24px 10px",border:"none",background:active?B.panel:B.bg0,
                  color:active?B.textPri:B.textMut,fontSize:12,fontWeight:800,textTransform:"uppercase",
                  letterSpacing:"0.08em",cursor:"pointer",fontFamily:"inherit",whiteSpace:"nowrap",transition:"background 160ms ease"}}>
                {t.charAt(0).toUpperCase()+t.slice(1)}
                {count>=0&&<span style={{marginLeft:8,fontFamily:MONO,fontWeight:400,letterSpacing:0,color:B.textDim}}>{count}</span>}
              </button>;
            })}
          </div>

          {activeTab==="overview" && (
            <div style={{display:"flex",flexDirection:"column",gap:40}}>
              <div style={{display:"flex",flexDirection:"column",gap:16}}>
                <SectionTitle>What it does</SectionTitle>
                {item.descriptionHtml
                  ? <HtmlWithCopy html={item.descriptionHtml} style={{fontSize:16,lineHeight:"26px",color:B.textSec,maxWidth:"72ch"}}/>
                  : <p style={{margin:0,fontSize:16,lineHeight:"26px",color:B.textSec,maxWidth:"72ch",textWrap:"pretty"}}>{item.desc}</p>}
              </div>

              {/* Why it is in the catalog, carrying the tier blurb. */}
              <div style={{border:"1px solid "+B.border,background:B.card}}>
                <div style={{height:2,width:64,background:GRAD}}/>
                <div style={{padding:"24px 22px",display:"flex",flexDirection:"column",gap:10}}>
                  <span style={{fontSize:11,fontWeight:800,textTransform:"uppercase",letterSpacing:"0.12em",color:B.textMut}}>Why this is in the catalog</span>
                  <p style={{margin:0,fontSize:15,lineHeight:"24px",color:B.bright,maxWidth:"70ch",textWrap:"pretty"}}>{whyCopy}</p>
                  {!isInfra&&<p style={{margin:0,fontSize:13,lineHeight:"20px",color:B.textMut,maxWidth:"70ch"}}>
                    <strong style={{color:B.textSec}}>{SUPPORT_LABEL[eff]}</strong> — {TIER_DESC[eff]}
                  </p>}
                </div>
              </div>

              {!isInfra&&(
                <div style={{display:"flex",flexDirection:"column",gap:20}}>
                  <SectionTitle>Deploy and usage signals</SectionTitle>
                  <HairGrid min={180}>
                    {signals.map(function(s){
                      return <div key={s.k} style={{background:B.bg0,padding:"22px 20px",display:"flex",flexDirection:"column",gap:6}}>
                        <span style={{fontSize:26,lineHeight:1.1,fontWeight:800,letterSpacing:"-0.02em",color:B.textPri}}>{s.v}</span>
                        <span style={{fontSize:11,fontWeight:800,textTransform:"uppercase",letterSpacing:"0.12em",color:B.textDim}}>{s.k}</span>
                      </div>;
                    })}
                  </HairGrid>
                  <div style={{border:"1px solid "+B.border,background:B.card,padding:"22px 20px",display:"flex",flexDirection:"column",gap:12}}>
                    <div style={{display:"flex",alignItems:"baseline",justifyContent:"space-between",gap:16}}>
                      <span style={{fontSize:11,fontWeight:800,textTransform:"uppercase",letterSpacing:"0.12em",color:B.textMut}}>Popularity vs the most-pulled chart</span>
                      <span style={{fontFamily:MONO,fontSize:13,color:B.textPri}}>{pct}%</span>
                    </div>
                    <div style={{height:6,borderRadius:120,background:B.panel,overflow:"hidden"}}>
                      <div style={{height:"100%",width:pct+"%",background:GRAD,borderRadius:120}}/>
                    </div>
                    <span style={{fontSize:13,lineHeight:"20px",color:B.textDim}}>
                      {fmtNum(item.pulls||0)} pulls against a catalog peak of {fmtNum(maxD)}.
                    </span>
                  </div>
                </div>
              )}

              {facts.length>0&&<div style={{display:"flex",flexDirection:"column",gap:20}}>
                <SectionTitle>On k0rdent</SectionTitle>
                <HairGrid min={220}>
                  {facts.map(function(f:any){
                    return <div key={f.k} style={{background:B.bg0,padding:"24px 22px",display:"flex",flexDirection:"column",gap:8}}>
                      <span style={{fontSize:11,fontWeight:800,textTransform:"uppercase",letterSpacing:"0.12em",color:B.textDim}}>{f.k}</span>
                      <span style={{fontSize:16,lineHeight:"24px",fontWeight:700,color:B.textPri,fontFamily:f.mono?MONO:"inherit"}}>{f.v}</span>
                    </div>;
                  })}
                </HairGrid>
              </div>}

              {item.supportLink&&<div style={{padding:"20px 22px",background:B.tile,border:"1px solid "+B.border,borderRadius:8,display:"flex",justifyContent:"space-between",alignItems:"center",gap:16,flexWrap:"wrap"}}>
                <span style={{fontSize:14,color:B.textSec}}>Looking for commercial support?</span>
                <a href={item.supportLink} target="_blank" rel="noreferrer" style={{fontSize:12,fontWeight:900,textTransform:"uppercase",letterSpacing:"0.06em",color:B.link,textDecoration:"none"}}>Learn more →</a>
              </div>}
            </div>
          )}

          {activeTab==="install" && <InstallTab item={item} selVer={selVer} setSelVer={setSelVer} k0rdentVer={k0rdentVer}/>}
          {activeTab==="validation" && <TestResults item={item}/>}
          {activeTab==="images" && <ScanImagesTab key={"img"+imagesKey} item={item} selVer={selVer} setSelVer={setSelVer} k0rdentVer={k0rdentVer} detailImg={detailImg} setDetailImg={setDetailImg} detailImgChart={detailImgChart} setDetailImgChart={setDetailImgChart}/>}
          {activeTab==="vulnerabilities" && <ScanVulnsTab key={"vul"+imagesKey} item={item} selVer={selVer} setSelVer={setSelVer} k0rdentVer={k0rdentVer} detailImg={detailImg} setDetailImg={setDetailImg} detailImgChart={detailImgChart} setDetailImgChart={setDetailImgChart}/>}

          {activeTab==="versions" && (
            <div style={{display:"flex",flexDirection:"column",gap:20}}>
              <SectionTitle>Published versions</SectionTitle>
              <div style={{border:"1px solid "+B.border}}>
                {(item.versions||[]).map(function(v:string,vi:number){
                  return <div key={v} className="k0-ver-row" style={{display:"grid",gridTemplateColumns:"160px 1fr 140px",gap:24,alignItems:"center",
                    padding:"18px 22px",borderBottom:vi<(item.versions.length-1)?"1px solid "+B.border:"none",background:B.bg0}}>
                    <span style={{fontFamily:MONO,fontSize:14,color:B.textPri}}>{v}</span>
                    <span style={{fontSize:14,lineHeight:"22px",color:B.textSec}}>{item.chartName?item.chartName+" chart":"Helm chart"}</span>
                    <span style={{fontSize:11,fontWeight:800,textTransform:"uppercase",letterSpacing:"0.1em",color:vi===0?B.teal:B.textDim,textAlign:"right"}}>{vi===0?"Latest":""}</span>
                  </div>;
                })}
              </div>
            </div>
          )}

          {activeTab==="cost" && (
            <div style={{display:"flex",flexDirection:"column",gap:20}}>
              <SectionTitle>Cost estimate</SectionTitle>
              <p style={{margin:0,fontSize:15,lineHeight:"24px",color:B.textSec,maxWidth:"72ch"}}>
                Estimated monthly infrastructure cost for running {item.title||item.name} on a k0rdent-managed cluster. Adjust cloud provider, cluster count, and active hours to model your deployment scenario.
              </p>
              <FinOpsEstimator stackItems={[item]} defaultCloud="aws"/>
            </div>
          )}
        </div>

        <aside className="k0-detail-aside" style={{display:"flex",flexDirection:"column",gap:32,position:"sticky",top:112}}>
          <div style={{border:"1px solid "+B.border,background:B.card}}>
            <div style={{height:2,background:GRAD}}/>
            <div style={{padding:"26px 24px",display:"flex",flexDirection:"column",gap:22}}>
              {meta.map(function(m:any){
                return <div key={m.k} style={{display:"flex",flexDirection:"column",gap:4}}>
                  <span style={{fontSize:11,fontWeight:800,textTransform:"uppercase",letterSpacing:"0.12em",color:B.textDim}}>{m.k}</span>
                  <span style={{fontSize:14,lineHeight:"22px",color:B.textPri,fontFamily:m.mono?MONO:"inherit",overflowWrap:"anywhere"}}>{m.v}</span>
                </div>;
              })}
            </div>
          </div>

          {related.length>0&&(
            <div style={{display:"flex",flexDirection:"column",gap:16}}>
              <span style={{fontSize:12,fontWeight:800,textTransform:"uppercase",letterSpacing:"0.12em",color:B.textMut}}>Often deployed with</span>
              {related.map(function(r:any){
                return <div key={r.name} onClick={function(){ if(onOpenApp) onOpenApp(r); }}
                  onMouseEnter={function(e){e.currentTarget.style.borderColor=B.textMut;}}
                  onMouseLeave={function(e){e.currentTarget.style.borderColor=B.border;}}
                  style={{display:"flex",alignItems:"center",gap:14,padding:"16px 18px",border:"1px solid "+B.border,
                    borderRadius:8,background:B.bg0,cursor:"pointer",transition:"border-color 160ms ease"}}>
                  <AppLogo name={r.name} size={34} accent={tagAccent((r.tags||[])[0]||"Other")} logo={r.logo} brandColor={r.brandColor}/>
                  <div style={{flex:1,minWidth:0,display:"flex",flexDirection:"column"}}>
                    <span style={{fontSize:14,lineHeight:"20px",fontWeight:700,color:B.textPri,overflowWrap:"anywhere"}}>{r.title||r.name}</span>
                    <span style={{fontSize:11,fontWeight:800,textTransform:"uppercase",letterSpacing:"0.1em",color:B.textDim}}>{(r.tags||[])[0]||"Other"}</span>
                  </div>
                </div>;
              })}
            </div>
          )}
        </aside>
      </section>
    </div>
  );
}
