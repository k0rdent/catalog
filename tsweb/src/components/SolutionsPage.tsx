import React, { useState, useEffect } from 'react';
import { B, GRAD, MONO, tagAccent } from '../constants';
import { buildCatalogUrl } from '../utils';
import { SOLUTIONS } from '../state';
import { SolutionCard } from './SolutionCard';
import { SolutionDetail } from './SolutionDetail';
import { PageHero, FilterPill } from './PageHero';

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
    <div>
      <PageHero
        eyebrow="Validated · Composable · Production-ready"
        title={<>Solution bundles for AI infrastructure</>}
        lede="Named solution bundles are curated sets of applications forming fully functional, production-ready configurations for AI and cloud-native use cases. Each bundle is a validated combination of interoperable components with predefined deployment templates."
        stats={[{n:SOLUTIONS.length,l:"Bundles",grad:true}]}
      />
      <div style={{maxWidth:1440,margin:"0 auto",padding:"40px 40px 0"}}>
      <div style={{display:"flex",gap:10,flexWrap:"wrap",alignItems:"center",marginBottom:28}}>
        {cats.map(function(c){var active=catFilter===c;var ac=c==="All"?B.teal:tagAccent(c);return <FilterPill key={c} label={c} active={active} color={ac} onClick={function(){changeCat(c);}}/>;})}
        <span style={{marginLeft:"auto",fontFamily:MONO,fontSize:13,color:B.textDim}}>{filtered.length} bundles</span>
      </div>
      <div className="k0-sol-grid" style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(min(360px,100%),1fr))",gap:16}}>
        {filtered.map(function(sol){return <SolutionCard key={sol.id} sol={sol} onClick={function(){openSol(sol);}}/>;}) }
      </div>
      <div style={{marginTop:48,padding:"22px 24px",background:B.tile,border:"1px solid "+B.border,borderRadius:8,display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:16}}>
        <div><div style={{fontSize:16,fontWeight:700,color:B.textPri,marginBottom:4}}>Want to contribute a solution bundle?</div><div style={{fontSize:13,lineHeight:"20px",color:B.textSec}}>Open a PR with your bundle definition and component list.</div></div>
        <a href="https://github.com/k0rdent/catalog" target="_blank" rel="noreferrer" style={{padding:"12px 24px 9px",background:GRAD,color:"#000",border:"2px solid #000",borderRadius:20,fontSize:12,fontWeight:900,textTransform:"uppercase",letterSpacing:"0.06em",textDecoration:"none",whiteSpace:"nowrap"}}>Contribute a bundle</a>
      </div>
      {selected!==null&&<SolutionDetail sol={selected} onClose={closeSol} initShide={shide} onShideChange={onShideChange}/>}
      </div>
    </div>
  );
}
