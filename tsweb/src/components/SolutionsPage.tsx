import React, { useState, useEffect } from 'react';
import { B, tagAccent } from '../constants';
import { buildCatalogUrl } from '../utils';
import { SOLUTIONS } from '../state';
import { SolutionCard } from './SolutionCard';
import { SolutionDetail } from './SolutionDetail';

export function SolutionsPage({ initSolId, initScat, initShide, k0rdentVer }:{ initSolId?:string, initScat?:string, initShide?:string, k0rdentVer?:string }) {
  var [selected, setSelected] = useState<any>(null);
  var [catFilter, setCatFilter] = useState(initScat || "All");
  var [shide, setShide] = useState(initShide || "");
  var cats=["All","AI/ML","Observability","Security"];
  var filtered=SOLUTIONS.filter(function(s){return catFilter==="All"||s.category===catFilter;});

  // Restore selected solution from URL param
  useEffect(function(){
    if (initSolId && !selected) {
      var found = SOLUTIONS.find(function(s:any){ return s.id === initSolId; });
      if (found) setSelected(found);
    }
  }, [initSolId]);

  function updateUrl(sol?:string, cat?:string, hide?:string) {
    history.replaceState(null, "", buildCatalogUrl({view:"solutions",search:"",tag:"All",support:"All",sort:"A-Z",compliance:"All",sol:sol||"",scat:cat||catFilter,shide:hide||""}, k0rdentVer));
  }
  function openSol(sol:any) {
    setSelected(sol);
    setShide("");
    history.pushState(null, "", buildCatalogUrl({view:"solutions",search:"",tag:"All",support:"All",sort:"A-Z",compliance:"All",sol:sol.id,scat:catFilter}, k0rdentVer));
  }
  function closeSol() {
    setSelected(null);
    setShide("");
    history.pushState(null, "", buildCatalogUrl({view:"solutions",search:"",tag:"All",support:"All",sort:"A-Z",compliance:"All",scat:catFilter}, k0rdentVer));
  }
  function onShideChange(newShide:string) {
    setShide(newShide);
    updateUrl(selected?selected.id:"", catFilter, newShide);
  }
  function changeCat(c:string) {
    setCatFilter(c);
    history.replaceState(null, "", buildCatalogUrl({view:"solutions",search:"",tag:"All",support:"All",sort:"A-Z",compliance:"All",scat:c}, k0rdentVer));
  }

  return (
    <div style={{maxWidth:1140,margin:"0 auto",padding:"28px 20px 0"}}>
      <div style={{marginBottom:22,paddingBottom:18,borderBottom:"1px solid "+B.border}}>
        <div style={{fontSize:9.5,fontWeight:600,color:B.teal,textTransform:"uppercase",letterSpacing:"0.14em",marginBottom:7}}>Validated · Composable · Production-ready</div>
        <h1 style={{fontSize:24,fontWeight:700,color:B.textPri,margin:"0 0 7px"}}>Solution bundles for <span style={{color:B.teal}}>AI infrastructure</span></h1>
        <p style={{fontSize:14,color:B.textSec,lineHeight:1.8,maxWidth:720,margin:"0 0 14px",textAlign:"justify"}}>Named solution bundles are curated sets of applications forming fully functional, production-ready configurations for AI and cloud-native use cases. Each bundle is a validated combination of interoperable components with predefined deployment templates.</p>
        <div style={{display:"flex",gap:6,flexWrap:"wrap",alignItems:"center"}}>
          {cats.map(function(c){var active=catFilter===c;var ac=c==="All"?B.teal:tagAccent(c);return <button key={c} onClick={function(){changeCat(c);}} style={{padding:"4px 13px",border:"1px solid "+(active?ac+"60":B.border),borderRadius:20,fontSize:11,background:active?ac+"15":B.bg2,color:active?ac:B.textSec,cursor:"pointer",fontFamily:"inherit"}}>{c}</button>;})}
          <span style={{marginLeft:"auto",fontSize:11,color:B.textMut}}>{filtered.length} bundles</span>
        </div>
      </div>
      <div className="k0-sol-grid" style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(310px,1fr))",gap:13}}>
        {filtered.map(function(sol){return <SolutionCard key={sol.id} sol={sol} onClick={function(){openSol(sol);}}/>;}) }
      </div>
      <div style={{marginTop:28,padding:"16px 20px",background:B.bg2,border:"1px solid "+B.border,borderRadius:9,display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:10}}>
        <div><div style={{fontSize:13,fontWeight:600,color:B.textPri,marginBottom:3}}>Want to contribute a solution bundle?</div><div style={{fontSize:12,color:B.textSec}}>Open a PR with your bundle definition and component list.</div></div>
        <a href="https://github.com/k0rdent/catalog" target="_blank" rel="noreferrer" style={{padding:"8px 16px",background:B.teal,color:B.bg0,borderRadius:6,fontSize:12,fontWeight:700,textDecoration:"none",whiteSpace:"nowrap"}}>Contribute a bundle</a>
      </div>
      {selected!==null&&<SolutionDetail sol={selected} onClose={closeSol} initShide={shide} onShideChange={onShideChange}/>}
    </div>
  );
}
