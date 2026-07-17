import React, { useState, useEffect } from 'react';
import { B, scanThStyle, scanTdStyle } from '../constants';
import { dataPrefix, imgStripSha, imgShortName } from '../utils';
import { useScanData, scanVersions } from '../hooks/useScanData';
import { ScanVersionPicker } from './ScanVersionPicker';

export function ImagePackagesDetail({ imageName, chartName, version, k0rdentVer, appName }:any) {
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

export function ScanImagesTab({ item, selVer, setSelVer, k0rdentVer, detailImg, setDetailImg, detailImgChart, setDetailImgChart }:any) {
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
