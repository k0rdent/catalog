import React, { useState, useEffect } from 'react';
import { B, scanThStyle, scanTdStyle } from '../constants';
import { dataPrefix, sevColor, imgStripSha } from '../utils';
import { useScanData, scanVersions } from '../hooks/useScanData';
import { ScanVersionPicker } from './ScanVersionPicker';

export function ImageVulnsDetail({ imageName, chartName, version, k0rdentVer, appName }:any) {
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

export function ScanVulnsTab({ item, selVer, setSelVer, k0rdentVer, detailImg, setDetailImg, detailImgChart, setDetailImgChart }:any) {
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
