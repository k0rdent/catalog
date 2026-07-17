import React from 'react';
import { B } from '../constants';

export function TestResults({ item }) {
  var v = item.validated || {};
  var architectures = [
    {key:"amd64", label:"AMD64", icon:"🖥"},
    {key:"arm64", label:"ARM64", icon:"📱"},
  ];
  var providers = [
    {key:"aws", label:"AWS", icon:"☁"},
    {key:"azure", label:"Azure", icon:"☁"},
    {key:"local", label:"Bare Metal", icon:"💻"},
  ];
  var allPlatforms = architectures.concat(providers);
  var passed=0, failed=0, pending=0;
  for (var pi=0;pi<allPlatforms.length;pi++){
    var val=v[allPlatforms[pi].key]||"-";
    if(val==="y")passed++;
    else if(val==="n")failed++;
    else pending++;
  }
  function renderTable(title:string, items:any[]) {
    return (
      <div style={{marginBottom:14}}>
        <div style={{fontSize:9.5,fontWeight:600,color:B.textMut,textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:6}}>{title}</div>
        <div style={{border:"1px solid "+B.border,borderRadius:8,overflow:"hidden"}}>
          <table style={{width:"100%",borderCollapse:"collapse"}}>
            <tbody>
              {items.map(function(p,pi){
                var val=v[p.key]||"-";
                var color=val==="y"?B.green:val==="n"?B.red:B.textMut;
                var label=val==="y"?"Validated":val==="n"?"Unsupported":"To be tested";
                var icon=val==="y"?"✓":val==="n"?"✕":"—";
                return (
                  <tr key={p.key} style={{borderTop:pi>0?"1px solid "+B.border:"none",background:pi%2===0?B.bg2+"40":"transparent"}}>
                    <td style={{padding:"9px 10px",fontSize:12,color:B.textPri,fontWeight:500}}><span style={{marginRight:6}}>{p.icon}</span>{p.label}</td>
                    <td style={{padding:"9px 10px",textAlign:"center"}}>
                      <span style={{fontSize:10,padding:"2px 8px",borderRadius:4,background:color+"18",color:color,border:"1px solid "+color+"30",fontWeight:600}}>{icon} {label}</span>
                    </td>
                  </tr>
                );
            })}
            </tbody>
          </table>
        </div>
      </div>
    );
  }
  return (
    <div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8,marginBottom:14}}>
        {[{n:passed,l:"Validated",c:B.green},{n:failed,l:"Unsupported",c:B.red},{n:pending,l:"To be tested",c:B.textMut}].map(function(s){
          return <div key={s.l} style={{background:B.bg2,border:"1px solid "+B.border,borderRadius:8,padding:"10px",textAlign:"center"}}><div style={{fontSize:18,fontWeight:700,color:s.c,fontFamily:"monospace"}}>{s.n}</div><div style={{fontSize:10,color:B.textMut,marginTop:2}}>{s.l}</div></div>;
        })}
      </div>
      {renderTable("Architecture", architectures)}
      {renderTable("Provider", providers)}
    </div>
  );
}
