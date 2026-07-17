import React, { useState, useEffect } from 'react';
import { B, SUPPORT_STYLE, SUPPORT_LABEL, COMPLIANCE, tagAccent } from '../constants';
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
