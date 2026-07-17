import React from 'react';
import { appendTheme } from '../constants';
import { BASE, versionBase } from '../utils';

export function Nav({ view, setView, resetFilters, versions, k0rdentVer, onVersionChange, dark, toggleTheme }:any) {
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
