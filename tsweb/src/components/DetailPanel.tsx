import React, { useState, useEffect } from 'react';
import { B, GRAD, MONO, FONT, SUPPORT_LABEL, COMPLIANCE, tagAccent } from '../constants';
import { getEff, deployStats, fmtNum } from '../utils';
import { RAW } from '../state';
import { useScanData, scanVersions } from '../hooks/useScanData';
import { AppLogo } from './AppLogo';
import { HtmlWithCopy } from './HtmlWithCopy';
import { InstallTab } from './InstallTab';
import { TestResults } from './TestResults';
import { ScanImagesTab } from './ScanImagesTab';
import { ScanVulnsTab } from './ScanVulnsTab';
import { FinOpsEstimator } from './FinOpsEstimator';

export function DetailPanel({ item, onClose, tab, setTab, selVer, setSelVer, k0rdentVer, detailImg, setDetailImg, detailImgChart, setDetailImgChart, detailImgSub, setDetailImgSub }:any) {
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
    return {padding:"12px 14px 10px",fontSize:12,fontWeight:800,textTransform:"uppercase" as const,letterSpacing:"0.08em",
      color:active?B.textPri:B.textMut,background:"transparent",border:"none",
      borderBottom:"2px solid "+(active?B.teal:"transparent"),cursor:"pointer",whiteSpace:"nowrap" as const,fontFamily:"inherit"};
  }

  // Tier mark shared with the cards, so the panel reads as the same system.
  var tierMark = eff==="mirantis-certified"
    ? <span style={{display:"inline-flex",alignItems:"center",gap:8,fontSize:11,fontWeight:800,textTransform:"uppercase",letterSpacing:"0.1em",color:B.teal}}><span style={{width:7,height:7,borderRadius:"50%",background:GRAD}}/>{SUPPORT_LABEL[eff]}</span>
    : eff==="partner"
      ? <span style={{fontSize:11,fontWeight:800,textTransform:"uppercase",letterSpacing:"0.1em",color:B.textPri,border:"1px solid "+B.textMut,borderRadius:4,padding:"3px 8px 1px"}}>{SUPPORT_LABEL[eff]}</span>
      : <span style={{fontSize:11,fontWeight:800,textTransform:"uppercase",letterSpacing:"0.1em",color:B.textDim}}>{SUPPORT_LABEL[eff]}</span>;

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
      <div className="k0-backdrop" style={{position:"absolute",top:0,left:0,right:0,bottom:0,background:"rgba(0,0,0,0.72)",backdropFilter:"blur(2px)"}}/>
      <div className="k0-detail-panel" onClick={function(e){e.stopPropagation();}} style={{position:"relative",width:"min(720px,100vw)",background:B.card,borderLeft:"1px solid "+B.border,display:"flex",flexDirection:"column",overflowY:"auto",fontFamily:FONT,color:B.textPri}}>
        {eff==="mirantis-certified"&&<div style={{height:2,background:GRAD,flexShrink:0}}/>}
        <div className="k0-detail-header" style={{padding:"22px 26px 0",flexShrink:0,background:B.bg0,borderBottom:"1px solid "+B.border}}>
          <div style={{display:"flex",alignItems:"flex-start",gap:12,marginBottom:12}}>
            <AppLogo name={item.name} size={44} accent={accent} logo={item.logo} brandColor={item.brandColor}/>
            <div style={{flex:1}}>
              <div style={{display:"flex",alignItems:"center",gap:7,flexWrap:"wrap",marginBottom:4}}>
                <h2 style={{fontSize:24,lineHeight:"30px",fontWeight:700,letterSpacing:"-0.01em",color:B.textPri,margin:0}}>{item.title||item.name}</h2>
                {tierMark}
              </div>
              <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
                {item.tags.map(function(t){return <span key={t} style={{fontSize:11,fontWeight:800,textTransform:"uppercase",letterSpacing:"0.1em",color:B.textSec,padding:"4px 10px 2px",border:"1px solid "+B.border,borderRadius:4}}>{t}</span>;})}
              </div>
            </div>
            <button onClick={onClose} style={{background:"none",border:"2px solid "+B.textPri,borderRadius:"50%",width:34,height:34,display:"flex",alignItems:"center",justifyContent:"center",color:B.textPri,cursor:"pointer",fontSize:14,fontFamily:"inherit",flexShrink:0}}>✕</button>
          </div>
          <div className="k0-detail-tabs" style={{display:"flex",flexWrap:"wrap",alignItems:"flex-end",marginLeft:-26,marginRight:-26,paddingLeft:26,paddingRight:26,gap:4}}>
            {["overview","install","validation","images","vulnerabilities","cost"].filter(function(t){ if(t==="install"&&item.showInstall===false)return false; if(item.type==="infra"&&(t==="validation"||t==="cost"||t==="images"||t==="vulnerabilities"))return false; if((t==="images"||t==="vulnerabilities")&&!item.hasScan)return false; return true; }).map(function(t){
              var tLabel = t.charAt(0).toUpperCase()+t.slice(1);
              var tCount = t==="images"?_scanCounts.images:t==="vulnerabilities"?_scanCounts.vulns:-1;
              var tActive = tab===t;
              return <button key={t} onClick={function(){setTab(t);if(t==="images"||t==="vulnerabilities"){setImagesKey(function(k){return k+1;});setDetailImg("");setDetailImgChart("");setDetailImgSub("");}}} style={tabStyle(tActive)}>{tLabel}{tCount>=0&&<span style={{marginLeft:6,fontFamily:MONO,fontSize:11,padding:"1px 7px",borderRadius:10,background:tActive?B.teal:B.panel,color:tActive?"#000":B.textSec,fontWeight:700}}>{tCount}</span>}</button>;
            })}
            <div style={{flex:1,minWidth:20}}/>
            {item.doc_link && <a href={item.doc_link} target="_blank" rel="noreferrer" style={{padding:"9px 20px 6px",fontSize:12,fontWeight:900,textTransform:"uppercase",letterSpacing:"0.06em",color:"#000",textDecoration:"none",background:GRAD,border:"2px solid #000",borderRadius:20,alignSelf:"center",marginBottom:8}}>Docs</a>}
          </div>
        </div>
        <div className="k0-detail-content" style={{padding:"22px 26px",flex:1}}>
          {tab==="overview" && item.type==="infra" && (
            <div>
              {item.descriptionHtml ? <HtmlWithCopy html={item.descriptionHtml} style={{fontSize:14,color:B.textSec,lineHeight:1.8,marginTop:0}}/> : <p style={{fontSize:14,color:B.textSec,lineHeight:1.8,marginTop:0}}>{item.desc}</p>}
              <div style={{marginTop:20,padding:"16px 18px",background:B.tile,border:"1px solid "+B.border,borderRadius:8,display:"flex",justifyContent:"space-between",alignItems:"center",gap:12,flexWrap:"wrap"}}>
                <span style={{fontSize:12,fontWeight:800,textTransform:"uppercase",letterSpacing:"0.1em",color:B.textPri}}>Ready to deploy?</span>
                <button onClick={function(){setTab("install");}} style={{background:GRAD,border:"2px solid #000",borderRadius:20,padding:"10px 20px 7px",fontSize:12,color:"#000",fontWeight:900,textTransform:"uppercase",letterSpacing:"0.06em",cursor:"pointer",fontFamily:"inherit"}}>View install steps</button>
              </div>
              {item.supportLink&&<div style={{marginTop:10,padding:"16px 18px",background:B.tile,border:"1px solid "+B.border,borderRadius:8,display:"flex",justifyContent:"space-between",alignItems:"center",gap:12,flexWrap:"wrap"}}>
                <span style={{fontSize:12,color:B.textSec}}>Looking for Commercial Support?</span>
                <a href={item.supportLink} target="_blank" rel="noreferrer" style={{fontSize:12,color:B.teal,fontWeight:700,textDecoration:"none",textTransform:"uppercase",letterSpacing:"0.05em"}}>Learn more</a>
              </div>}
            </div>
          )}
          {tab==="overview" && item.type!=="infra" && (
            <div>
              <p style={{fontSize:14,color:B.textSec,lineHeight:1.8,marginTop:0}}>{item.desc}</p>
              <div style={{background:B.tile,border:"1px solid "+B.border,borderRadius:8,padding:"16px 18px",marginBottom:20,display:"flex",gap:12}}>
                <span style={{width:7,height:7,borderRadius:"50%",background:GRAD,flexShrink:0,marginTop:6}}/>
                <div>
                  <div style={{fontSize:11,fontWeight:800,color:B.textPri,textTransform:"uppercase",letterSpacing:"0.12em",marginBottom:8}}>Why this is in the catalog</div>
                  <div style={{fontSize:13,color:B.textSec,lineHeight:"20px"}}>{whyCopy}</div>
                </div>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:14}}>
                {[{l:"Latest version",v:item.version},{l:"Chart name",v:item.chartName},{l:"Support tier",v:SUPPORT_LABEL[eff]},{l:"CI validated",v:item.tested?"Yes":"Not yet"},{l:"Versions available",v:String(item.versions.length)},{l:"Last updated",v:item.lastUpdated?item.lastUpdated.slice(0,10):"—"}].map(function(r){
                  return <div key={r.l} style={{background:B.tile,borderRadius:8,padding:"12px 14px",border:"1px solid "+B.border}}><div style={{fontSize:11,fontWeight:800,color:B.textDim,textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:4}}>{r.l}</div><div style={{fontSize:12.5,color:B.textPri,fontWeight:500,fontFamily:(r.l.includes("ersion")||r.l.includes("Chart"))?MONO:"inherit"}}>{r.v}</div></div>;
                })}
              </div>
              <div style={{marginBottom:14}}>
                <div style={{fontSize:9.5,color:B.textMut,textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:8}}>Deploy and usage signals</div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:8}}>
                  {[{l:"Total downloads",v:item.pulls>0?fmtNum(item.pulls):"—",c:B.teal,href:item.chartName?"https://github.com/k0rdent/catalog/pkgs/container/catalog%2Fcharts%2F"+encodeURIComponent(item.chartName):""},{l:"GitHub stars",v:item.stars>0?fmtNum(item.stars):"—",c:B.cyan,href:item.githubRepo?"https://github.com/"+item.githubRepo:""}].map(function(r:any){
                    var box = <div style={{background:B.bg2,borderRadius:7,padding:"9px 12px",border:"1px solid "+B.border,cursor:r.href?"pointer":"default"}}><div style={{fontSize:11,fontWeight:800,color:B.textDim,textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:4}}>{r.l}{r.href&&<span style={{marginLeft:4,fontSize:8}}>↗</span>}</div><div style={{fontSize:14,color:r.c,fontWeight:700,fontFamily:MONO}}>{r.v}</div></div>;
                    return r.href ? <a key={r.l} href={r.href} target="_blank" rel="noreferrer" style={{textDecoration:"none"}}>{box}</a> : <div key={r.l}>{box}</div>;
                  })}
                </div>
                <div style={{fontSize:9.5,color:B.textMut,marginBottom:3}}>Popularity vs peak ({fmtNum(maxD)} pulls)</div>
                <div style={{height:5,background:B.bg3,borderRadius:3,overflow:"hidden"}}><div style={{height:"100%",width:pct+"%",background:GRAD,borderRadius:3}}/></div>
                <div style={{display:"flex",justifyContent:"space-between",marginTop:2}}><span style={{fontSize:9,color:B.textMut}}>0</span><span style={{fontSize:9,color:B.teal,fontWeight:600}}>{pct}%</span><span style={{fontSize:9,color:B.textMut}}>{fmtNum(maxD)}</span></div>
              </div>
              <div style={{marginTop:20,padding:"16px 18px",background:B.tile,border:"1px solid "+B.border,borderRadius:8,display:"flex",justifyContent:"space-between",alignItems:"center",gap:12,flexWrap:"wrap"}}>
                <span style={{fontSize:12,fontWeight:800,textTransform:"uppercase",letterSpacing:"0.1em",color:B.textPri}}>Ready to deploy?</span>
                <button onClick={function(){setTab("install");}} style={{background:GRAD,border:"2px solid #000",borderRadius:20,padding:"10px 20px 7px",fontSize:12,color:"#000",fontWeight:900,textTransform:"uppercase",letterSpacing:"0.06em",cursor:"pointer",fontFamily:"inherit"}}>View install steps</button>
              </div>
              {item.supportLink&&<div style={{marginTop:10,padding:"16px 18px",background:B.tile,border:"1px solid "+B.border,borderRadius:8,display:"flex",justifyContent:"space-between",alignItems:"center",gap:12,flexWrap:"wrap"}}>
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
