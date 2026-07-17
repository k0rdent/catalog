import React, { useState, useEffect } from 'react';
import { B } from '../constants';
import { dataPrefix } from '../utils';
import { HtmlWithCopy } from './HtmlWithCopy';

export function InstallTab({ item, selVer, setSelVer, k0rdentVer }:{ item:any, selVer:string, setSelVer:any, k0rdentVer?:string }) {
  var [installData, setInstallData] = useState<any>(null);
  var [loading, setLoading] = useState(true);
  var [error, setError] = useState("");

  useEffect(function(){
    setLoading(true);
    setError("");
    fetch(dataPrefix(k0rdentVer || "") + "apps/" + item.name + "/install.json?t=" + Date.now())
      .then(function(r){ if (!r.ok) throw new Error("HTTP " + r.status); return r.json(); })
      .then(function(d){ setInstallData(d); setLoading(false); })
      .catch(function(e){ setError(String(e)); setLoading(false); });
  }, [item.name]);

  if (loading) return <div style={{padding:20,color:B.textSec,fontSize:12}}>Loading install data...</div>;
  if (error) return <div style={{padding:20,color:B.red,fontSize:12}}>{error}</div>;
  if (!installData) return null;

  var effectiveVer = selVer || (installData.versions[0] && installData.versions[0].version) || "";
  var verData = installData.versions.find(function(v:any){ return v.version === effectiveVer; }) || installData.versions[0];

  function stepBlock(n:number, title:string, html:string) {
    if (!html) return null;
    return (
      <div key={n} style={{marginBottom:14}}>
        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:7}}>
          <div style={{width:20,height:20,borderRadius:"50%",background:B.tealBg,border:"1px solid "+B.teal+"40",display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:700,color:B.teal,flexShrink:0}}>{n}</div>
          <span style={{fontSize:12,fontWeight:600,color:B.textPri}}>{title}</span>
        </div>
        <HtmlWithCopy html={html} style={{paddingLeft:28,fontSize:13,color:B.textSec}}/>
      </div>
    );
  }

  return (
    <div>
      {item.versions && item.versions.length > 0 && <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:16}}>
        <span style={{fontSize:12,color:B.textSec}}>Version:</span>
        <select value={effectiveVer} onChange={function(e:any){setSelVer(e.target.value);}} style={{padding:"5px 9px",border:"1px solid "+B.borderHi,borderRadius:5,background:B.bg3,color:B.textPri,fontSize:12,outline:"none",cursor:"pointer",fontFamily:"monospace"}}>
          {item.versions.map(function(v:string){return <option key={v} value={v}>{v}</option>;})}
        </select>
        {item.tested&&<span style={{fontSize:9.5,color:B.green,background:B.green+"15",border:"1px solid "+B.green+"30",borderRadius:3,padding:"2px 7px"}}>CI-validated</span>}
      </div>}
      {stepBlock(1, "Prerequisites", installData.prerequisitesHtml)}
      {verData && <div key={"install-"+effectiveVer}>{stepBlock(2, "Install template to k0rdent", verData.installHtml)}</div>}
      {verData && <div key={"verify-"+effectiveVer}>{stepBlock(3, "Verify "+(item.type==="infra"?"cluster":"service")+" template", verData.verifyHtml)}</div>}
      {verData && <div key={"deploy-"+effectiveVer}>{stepBlock(4, "Deploy "+(item.type==="infra"?"cluster":"service"), verData.deployHtml)}</div>}
      {installData.examples.length > 0 && (
        <div style={{marginTop:20,borderTop:"1px solid "+B.border,paddingTop:16}}>
          <div style={{fontSize:11,fontWeight:600,color:B.textPri,marginBottom:12,textTransform:"uppercase",letterSpacing:0.5}}>Examples</div>
          {installData.examples.map(function(ex:any, i:number){
            return (
              <div key={i} style={{marginBottom:16,padding:14,background:B.bg2,borderRadius:8,border:"1px solid "+B.border}}>
                <div style={{fontSize:12,fontWeight:600,color:B.textPri,marginBottom:8}}>{ex.title}</div>
                {ex.contentHtml && <HtmlWithCopy html={ex.contentHtml} style={{fontSize:12,color:B.textSec}}/>}
                {!ex.contentHtml && ex.installHtml && <div style={{marginTop:8}}><div style={{fontSize:10,color:B.textMut,marginBottom:4}}>Install</div><HtmlWithCopy html={ex.installHtml} style={{fontSize:12,color:B.textSec}}/></div>}
                {!ex.contentHtml && ex.verifyHtml && <div style={{marginTop:8}}><div style={{fontSize:10,color:B.textMut,marginBottom:4}}>Verify</div><HtmlWithCopy html={ex.verifyHtml} style={{fontSize:12,color:B.textSec}}/></div>}
                {!ex.contentHtml && ex.deployHtml && <div style={{marginTop:8}}><div style={{fontSize:10,color:B.textMut,marginBottom:4}}>Deploy</div><HtmlWithCopy html={ex.deployHtml} style={{fontSize:12,color:B.textSec}}/></div>}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
