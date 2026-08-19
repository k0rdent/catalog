import React, { useState, useEffect } from 'react';
import { B, MONO, INFRA_FILTERS, INFRA_GROUPS, appendTheme } from '../constants';
import { versionBase } from '../utils';
import { INFRA } from '../state';
import { AppLogo } from './AppLogo';
import { AppDetailPage } from './AppDetailPage';
import { PageHero, FilterPill } from './PageHero';

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
    window.scrollTo(0, 0);
  }
  function closeInfra() {
    setSelected(null);
    setDetailTab("overview");
    setDetailVer("");
    history.pushState(null, "", infraUrl());
    window.scrollTo(0, 0);
  }




  if (selected) {
    return <AppDetailPage item={selected} tab={detailTab} setTab={setDetailTab} selVer={detailVer} setSelVer={setDetailVer}
      k0rdentVer={k0rdentVer} detailImg="" setDetailImg={function(){}} detailImgChart="" setDetailImgChart={function(){}}
      detailImgSub="" setDetailImgSub={function(){}} backLabel="Back to infrastructure" onBack={closeInfra}/>;
  }

  return (
    <div>
      <PageHero
        eyebrow="Cloud · On-premises · Hybrid"
        title="Target infrastructure"
        lede="k0rdent deploys and manages catalog integrations across public cloud, private cloud, and bare metal environments from a single management cluster. Every integration is validated against one or more of the target environments below."
        stats={[
          {n:String(INFRA.length),l:"Target environments",grad:true},
          {n:String(INFRA.filter(function(i:any){return i.infraGroup==="public";}).length),l:"Public cloud"},
          {n:String(INFRA.filter(function(i:any){return i.infraGroup==="private";}).length),l:"Private / on-prem"},
        ]}
      />
      <div style={{maxWidth:1440,margin:"0 auto",padding:"40px 40px 0"}}>
      <div style={{display:"flex",gap:10,flexWrap:"wrap",alignItems:"center",marginBottom:32}}>
        {INFRA_FILTERS.map(function(f){
          var active=infraFilter===f.key;
          var grp=INFRA_GROUPS.find(function(g){return g.key===f.key;});
          var color=grp?grp.color:B.teal;
          return <FilterPill key={f.key} label={f.label} active={active} color={color} onClick={function(){changeFilter(f.key);}}/>;
        })}
      </div>
      {INFRA_GROUPS.filter(function(g){ return infraFilter === "All" || g.key === infraFilter; }).map(function(group){
        var groupItems = INFRA.filter(function(i:any){ return i.infraGroup === group.key; }).sort(function(a:any,b:any){ return (a.title||a.name).localeCompare(b.title||b.name); });
        if (groupItems.length === 0) return null;
        return (
          <div key={group.key} style={{marginBottom:44}}>
            <div style={{display:"flex",alignItems:"baseline",gap:12,marginBottom:20,paddingBottom:14,borderBottom:"1px solid "+B.border}}>
              <span style={{width:8,height:8,borderRadius:2,background:group.color,alignSelf:"center"}}/>
              <span style={{fontSize:24,lineHeight:"32px",fontWeight:700,color:B.textPri}}>{group.label}</span>
              <span style={{marginLeft:"auto",fontFamily:MONO,fontSize:13,color:B.textDim}}>{groupItems.length} provider{groupItems.length>1?"s":""}</span>
            </div>
            <div className="k0-infra-grid" style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(min(340px,100%),1fr))",gap:16}}>
              {groupItems.map(function(item:any){
                var accent = item.brandColor || group.color;
                return (
                  <div key={item.name} onClick={function(){openInfra(item);}} style={{background:B.card,border:"1px solid "+B.border,borderRadius:8,overflow:"hidden",cursor:"pointer",transition:"border-color 160ms ease, background 160ms ease"}}>
                    <div style={{height:3,background:"linear-gradient(90deg,"+accent+","+accent+"60)"}}/>
                    <div style={{padding:"14px 16px"}}>
                      <div style={{display:"flex",alignItems:"flex-start",gap:12,marginBottom:10}}>
                        <AppLogo name={item.name} size={40} accent={accent} logo={item.logo} brandColor={item.brandColor} isInfra/>
                        <div style={{flex:1}}>
                          <div style={{fontSize:17,lineHeight:"22px",fontWeight:700,color:B.textPri,marginBottom:6}}>{item.title||item.name}</div>
                          <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>
                            {(item.tags||[]).map(function(t:string){return <span key={t} style={{fontSize:11,fontWeight:800,textTransform:"uppercase",letterSpacing:"0.1em",color:B.textSec,padding:"3px 9px 1px",border:"1px solid "+B.border,borderRadius:4}}>{t}</span>;})}
                          </div>
                        </div>
                      </div>
                      <p style={{fontSize:13,color:B.textSec,margin:"0 0 10px",lineHeight:1.65}}>{item.desc}</p>
                      <div style={{display:"flex",alignItems:"center",justifyContent:"flex-end"}}>
                        <span style={{fontSize:11,fontWeight:800,textTransform:"uppercase",letterSpacing:"0.1em",color:B.textMut}}>View details →</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
      </div>
    </div>
  );
}
