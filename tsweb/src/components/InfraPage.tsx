import React, { useState, useEffect } from 'react';
import { B, INFRA_FILTERS, INFRA_GROUPS, appendTheme } from '../constants';
import { versionBase } from '../utils';
import { INFRA } from '../state';
import { AppLogo } from './AppLogo';
import { DetailPanel } from './DetailPanel';

export function InfraPage({ k0rdentVer, initInfraApp, initDtab, initIgrp }:{ k0rdentVer?:string, initInfraApp?:string, initDtab?:string, initIgrp?:string }) {
  var [selected, setSelected] = useState<any>(null);
  var [detailTab, setDetailTab] = useState(initDtab || "overview");
  var [detailVer, setDetailVer] = useState("");
  var [infraFilter, setInfraFilter] = useState(initIgrp || "All");

  // Restore selected infra from URL
  useEffect(function(){
    if (initInfraApp && !selected) {
      var found = INFRA.find(function(i:any){ return i.name === initInfraApp; });
      if (found) setSelected(found);
    }
  }, [initInfraApp]);

  // Sync detail tab to URL
  useEffect(function(){
    if (selected) {
      var dtabParam:Record<string,string> = {};
      if (detailTab && detailTab !== "overview") dtabParam["dtab"] = detailTab;
      history.replaceState(null, "", infraUrl(selected.name + "/", dtabParam));
    }
  }, [detailTab]);

  function infraUrl(suffix?:string, params?:Record<string,string>) {
    var p = new URLSearchParams();
    if (infraFilter !== "All") p.set("igrp", infraFilter);
    if (params) Object.keys(params).forEach(function(k){ if(params[k]) p.set(k, params[k]); });
    var qs = p.toString();
    return appendTheme(versionBase(k0rdentVer || "") + "infra/" + (suffix || "") + (qs ? "?" + qs : ""));
  }

  function changeFilter(f:string) {
    setInfraFilter(f);
    var p = new URLSearchParams();
    if (f !== "All") p.set("igrp", f);
    var qs = p.toString();
    history.replaceState(null, "", appendTheme(versionBase(k0rdentVer || "") + "infra/" + (qs ? "?" + qs : "")));
  }

  function openInfra(item:any) {
    setSelected(item);
    setDetailTab("overview");
    setDetailVer("");
    history.pushState(null, "", infraUrl(item.name + "/"));
  }
  function closeInfra() {
    setSelected(null);
    setDetailTab("overview");
    setDetailVer("");
    history.pushState(null, "", infraUrl());
  }




  return (
    <div style={{maxWidth:1140,margin:"0 auto",padding:"28px 20px 0"}}>
      <div style={{marginBottom:24,paddingBottom:20,borderBottom:"1px solid "+B.border}}>
        <div style={{fontSize:10,fontWeight:600,color:B.teal,textTransform:"uppercase",letterSpacing:"0.14em",marginBottom:7}}>Cloud · On-premises · Hybrid</div>
        <h1 style={{fontSize:24,fontWeight:700,color:B.textPri,margin:"0 0 10px"}}>Target <span style={{color:B.teal}}>infrastructure</span></h1>
        <p style={{fontSize:14,color:B.textSec,lineHeight:1.8,maxWidth:720,margin:"0 0 16px"}}>k0rdent deploys and manages catalog integrations across public cloud, private cloud, and bare metal environments from a single management cluster. Every integration is validated against one or more of the target environments below.</p>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))",gap:8,marginBottom:16}}>
          {[{n:String(INFRA.length),l:"Target environments",c:B.teal},{n:String(INFRA.filter(function(i:any){return i.infraGroup==="public";}).length),l:"Public cloud providers",c:B.cyan},{n:String(INFRA.filter(function(i:any){return i.infraGroup==="private";}).length),l:"Private cloud / on-premises",c:B.purple}].map(function(s:any){
            return <div key={s.l} style={{background:B.bg2,border:"1px solid "+B.border,borderRadius:8,padding:"10px 14px"}}>
              <div style={{fontSize:22,fontWeight:700,color:s.c,fontFamily:"monospace"}}>{s.n}</div>
              <div style={{fontSize:12,color:B.textSec,marginTop:2}}>{s.l}</div>
            </div>;
          })}
        </div>
        <div style={{display:"flex",gap:6,flexWrap:"wrap",alignItems:"center"}}>
          {INFRA_FILTERS.map(function(f){
            var active=infraFilter===f.key;
            var grp=INFRA_GROUPS.find(function(g){return g.key===f.key;});
            var color=grp?grp.color:B.teal;
            return <button key={f.key} onClick={function(){changeFilter(f.key);}} style={{padding:"4px 13px",border:"1px solid "+(active?color+"60":B.border),borderRadius:20,fontSize:12,background:active?color+"15":B.bg2,color:active?color:B.textSec,cursor:"pointer",fontFamily:"inherit"}}>{f.label}</button>;
          })}
        </div>
      </div>
      {INFRA_GROUPS.filter(function(g){ return infraFilter === "All" || g.key === infraFilter; }).map(function(group){
        var groupItems = INFRA.filter(function(i:any){ return i.infraGroup === group.key; }).sort(function(a:any,b:any){ return (a.title||a.name).localeCompare(b.title||b.name); });
        if (groupItems.length === 0) return null;
        return (
          <div key={group.key} style={{marginBottom:20}}>
            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10,paddingBottom:8,borderBottom:"1px solid "+B.border}}>
              <div style={{width:12,height:12,borderRadius:3,background:group.color}}/>
              <span style={{fontSize:14,fontWeight:700,color:B.textPri}}>{group.label}</span>
              <span style={{fontSize:11,color:B.textMut}}>{groupItems.length} provider{groupItems.length>1?"s":""}</span>
            </div>
            <div className="k0-infra-grid" style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(340px,1fr))",gap:10}}>
              {groupItems.map(function(item:any){
                var accent = item.brandColor || group.color;
                return (
                  <div key={item.name} onClick={function(){openInfra(item);}} style={{background:B.bg1,border:"1px solid "+B.border,borderRadius:10,overflow:"hidden",cursor:"pointer",transition:"border-color 0.15s"}}>
                    <div style={{height:3,background:"linear-gradient(90deg,"+accent+","+accent+"60)"}}/>
                    <div style={{padding:"14px 16px"}}>
                      <div style={{display:"flex",alignItems:"flex-start",gap:12,marginBottom:10}}>
                        <AppLogo name={item.name} size={40} accent={accent} logo={item.logo} brandColor={item.brandColor} isInfra/>
                        <div style={{flex:1}}>
                          <div style={{fontSize:15,fontWeight:700,color:B.textPri,marginBottom:3}}>{item.title||item.name}</div>
                          <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>
                            {(item.tags||[]).map(function(t:string){return <span key={t} style={{fontSize:9,padding:"1px 6px",borderRadius:3,background:accent+"12",color:accent,border:"1px solid "+accent+"25",fontWeight:500}}>{t}</span>;})}
                          </div>
                        </div>
                      </div>
                      <p style={{fontSize:13,color:B.textSec,margin:"0 0 10px",lineHeight:1.65}}>{item.desc}</p>
                      <div style={{display:"flex",alignItems:"center",justifyContent:"flex-end"}}>
                        <span style={{fontSize:10.5,color:B.teal,fontWeight:500}}>View details →</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
      {selected&&<DetailPanel item={selected} tab={detailTab} setTab={setDetailTab} selVer={detailVer} setSelVer={setDetailVer} k0rdentVer={k0rdentVer} detailImg="" setDetailImg={function(){}} detailImgChart="" setDetailImgChart={function(){}} detailImgSub="" setDetailImgSub={function(){}} onClose={closeInfra}/>}
    </div>
  );
}
