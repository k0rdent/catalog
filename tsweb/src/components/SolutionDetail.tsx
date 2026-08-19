import React, { useState, useEffect } from 'react';
import { B, GRAD, MONO, FONT, SUPPORT_STYLE, SUPPORT_LABEL, K8S_VERS, tagAccent } from '../constants';
import { dataPrefix, filterContentHtml } from '../utils';
import { RAW } from '../state';
import { AppLogo } from './AppLogo';
import { HtmlWithCopy } from './HtmlWithCopy';
import { FinOpsEstimator } from './FinOpsEstimator';

export function SolutionDetail({ sol, onClose, initShide, onShideChange }) {
  var bc = tagAccent(sol.category);
  var badgeC = sol.badge==="Validated"?B.green:bc;
  var ss = SUPPORT_STYLE[sol.tier]||SUPPORT_STYLE.community;
  var [copied, setCopied] = useState(false);
  var [detail, setDetail] = useState<any>(null);
  var [detailLoading, setDetailLoading] = useState(true);
  var [hiddenApps, setHiddenApps] = useState<any>(function(){
    if (!initShide) return {};
    var h={}; initShide.split(",").forEach(function(n){ if(n) h[n]=true; }); return h;
  });
  useEffect(function(){ window.scrollTo(0,0); },[sol.id]);
  var solIdRef = React.useRef(sol.id);
  useEffect(function(){
    if (!sol.appName) { setDetailLoading(false); return; }
    if (solIdRef.current !== sol.id) { setHiddenApps({}); solIdRef.current = sol.id; }
    var solKey = sol.id.replace(sol.appName + "_", "");
    fetch(dataPrefix("") + "apps/" + sol.appName + "/solution_" + solKey + ".json?t=" + Date.now())
      .then(function(r){ return r.ok ? r.json() : null; })
      .then(function(d){ setDetail(d); setDetailLoading(false); })
      .catch(function(){ setDetailLoading(false); });
  },[sol.id]);
  function toggleApp(name:string) {
    setHiddenApps(function(prev:any){
      var nx=Object.assign({},prev); if(nx[name]) delete nx[name]; else nx[name]=true;
      if (onShideChange) {
        var names=Object.keys(nx).filter(function(k){return nx[k];});
        onShideChange(names.join(","));
      }
      return nx;
    });
  }
  var deployYaml = detail ? detail.deployYaml : (sol.deployYaml || "");
  function doCopy(){if(navigator.clipboard)navigator.clipboard.writeText(deployYaml);setCopied(true);setTimeout(function(){setCopied(false);},1500);}
  return (
    <div style={{fontFamily:FONT,color:B.textPri}}>
      <section style={{background:"linear-gradient(180deg,"+B.bg0+" 0%,"+B.panel+" 100%)",borderBottom:"1px solid "+B.border}}>
        <div className="k0-detail-hero" style={{maxWidth:1440,margin:"0 auto",padding:"24px 40px 44px"}}>
          <button onClick={onClose}
            onMouseEnter={function(e:any){e.currentTarget.style.color=B.textPri;}}
            onMouseLeave={function(e:any){e.currentTarget.style.color=B.textMut;}}
            style={{display:"inline-flex",alignItems:"center",gap:8,background:"none",border:"none",padding:0,marginBottom:28,
              color:B.textMut,fontSize:12,fontWeight:800,textTransform:"uppercase",letterSpacing:"0.12em",cursor:"pointer",fontFamily:"inherit"}}>
            <span style={{fontSize:14}}>←</span> Back to solutions
          </button>
          <div style={{display:"flex",alignItems:"flex-start",gap:32,flexWrap:"wrap"}}>
            {sol.logo
              ? <AppLogo name={sol.appName||""} size={96} accent={bc} logo={sol.logo}/>
              : <div style={{width:96,height:96,borderRadius:8,background:B.tile,border:"1px solid "+B.border,display:"flex",alignItems:"center",justifyContent:"center",fontSize:38,color:bc,flexShrink:0}}>{sol.icon}</div>}
            <div style={{flex:1,minWidth:340,display:"flex",flexDirection:"column",gap:14}}>
              <div style={{display:"flex",alignItems:"center",gap:16,flexWrap:"wrap"}}>
                <h1 style={{margin:0,fontSize:40,lineHeight:"44px",fontWeight:700,letterSpacing:"-0.01em",color:B.textPri}}>{sol.title}</h1>
                {sol.beta
                  ? <span style={{fontSize:11,fontWeight:800,letterSpacing:"0.1em",padding:"3px 9px 1px",borderRadius:4,background:B.amber+"20",color:B.amber,textTransform:"uppercase"}}>Beta</span>
                  : <span style={{fontSize:11,fontWeight:800,letterSpacing:"0.1em",padding:"3px 9px 1px",borderRadius:4,background:ss.bg,color:ss.text,border:"1px solid "+(ss.border==="transparent"?B.border:ss.border),textTransform:"uppercase"}}>{SUPPORT_LABEL[sol.tier]}</span>}
                {!sol.beta&&<span style={{fontSize:11,fontWeight:800,textTransform:"uppercase",letterSpacing:"0.1em",color:badgeC}}>{"✓ "+sol.badge}</span>}
              </div>
              <span style={{fontSize:14,fontWeight:800,textTransform:"uppercase",letterSpacing:"0.12em",color:B.textMut}}>{sol.category} · {sol.tagline}</span>
              <p style={{margin:"8px 0 0",fontSize:20,lineHeight:"32px",color:B.textSec,maxWidth:"70ch",textWrap:"pretty"}}>{sol.desc}</p>
            </div>
          </div>
        </div>
      </section>
      <div className="k0-sol-body" style={{maxWidth:1440,margin:"0 auto",padding:"48px 40px 96px"}}>
          <div style={{marginBottom:32}}>
            <div style={{fontSize:12,fontWeight:800,color:B.textMut,textTransform:"uppercase",letterSpacing:"0.12em",marginBottom:12}}>Use cases</div>
            {sol.useCases.map(function(u){return <div key={u} style={{display:"flex",gap:8,marginBottom:6}}><span style={{width:7,height:7,borderRadius:"50%",background:GRAD,flexShrink:0,marginTop:8}}/><span style={{fontSize:15,color:B.textSec,lineHeight:"24px"}}>{u}</span></div>;})}
          </div>
          <div style={{marginBottom:32}}>
            <div style={{fontSize:12,fontWeight:800,color:B.textMut,textTransform:"uppercase",letterSpacing:"0.12em",marginBottom:12}}>Components</div>
            <div style={{border:"1px solid "+B.border,borderRadius:8,overflow:"hidden"}}>
              <table style={{width:"100%",borderCollapse:"collapse"}}>
                <thead><tr style={{background:B.bg3}}>
                  <th style={{padding:"6px 10px",fontSize:9,fontWeight:600,color:B.textMut,textTransform:"uppercase",textAlign:"left",width:30}}/>
                  <th style={{padding:"6px 10px",fontSize:9,fontWeight:600,color:B.textMut,textTransform:"uppercase",textAlign:"left"}}>App</th>
                  <th style={{padding:"6px 10px",fontSize:9,fontWeight:600,color:B.textMut,textTransform:"uppercase",textAlign:"left"}}>Role</th>
                  <th style={{padding:"6px 10px",fontSize:9,fontWeight:600,color:B.textMut,textTransform:"uppercase",textAlign:"left"}}>Why included</th>
                  <th style={{padding:"6px 10px",fontSize:9,fontWeight:600,color:B.textMut,textTransform:"uppercase",textAlign:"center",width:40}}>Include</th>
                </tr></thead>
                <tbody>
                  {sol.components.map(function(c,ci){
                    var hidden=!!hiddenApps[c.name];
                    var app=null;
                    for(var ii=0;ii<RAW.length;ii++){if(RAW[ii].chartName===c.name||RAW[ii].name===c.name){app=RAW[ii];break;}}
                    if(!app){for(var ii2=0;ii2<RAW.length;ii2++){if(c.name.indexOf(RAW[ii2].name)===0){app=RAW[ii2];break;}}}
                    return (
                      <tr key={c.name+c.version} style={{borderTop:"1px solid "+B.border,background:ci%2===0?B.bg2+"50":"transparent",opacity:hidden?0.4:1,transition:"opacity 0.15s"}}>
                        <td style={{padding:"6px 10px"}}>{app && app.logo ? <AppLogo name={app.name} size={22} accent={bc} logo={app.logo} brandColor={app.brandColor}/> : <div style={{width:22,height:22,borderRadius:5,background:bc+"18",display:"flex",alignItems:"center",justifyContent:"center",fontSize:8,fontWeight:700,color:bc,fontFamily:"monospace"}}>{c.name.slice(0,2).toUpperCase()}</div>}</td>
                        <td style={{padding:"8px 10px",whiteSpace:"nowrap"}}><span style={{fontSize:10.5,fontFamily:MONO,fontWeight:600,color:hidden?B.textMut:B.textPri}}>{c.name}</span><span style={{fontSize:11,color:B.textDim,marginLeft:6,fontFamily:MONO}}>{c.version}</span></td>
                        <td style={{padding:"8px 10px",fontSize:11,color:c.role?(hidden?B.textMut:bc):B.red,fontWeight:500,whiteSpace:"nowrap"}}>{c.role||"EMPTY"}</td>
                        <td style={{padding:"8px 10px",fontSize:11,color:c.why?B.textSec:B.red,lineHeight:1.5}}>{c.why||"EMPTY"}</td>
                        <td style={{padding:"8px 10px",textAlign:"center"}}><input type="checkbox" checked={!hidden} onChange={function(){toggleApp(c.name);}} style={{accentColor:B.teal,cursor:"pointer",width:14,height:14}}/></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(280px,1fr))",gap:32,marginBottom:32}}>
            <div>
              <div style={{fontSize:12,fontWeight:800,color:B.textMut,textTransform:"uppercase",letterSpacing:"0.12em",marginBottom:10}}>Kubernetes versions</div>
              <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
                {K8S_VERS.map(function(v){var ok=sol.k8s.indexOf(v)!==-1;return <span key={v} style={{fontSize:12,padding:"5px 12px 3px",borderRadius:4,border:"1px solid "+(ok?B.textMut:B.border),color:ok?B.textPri:B.textDim,fontFamily:MONO}}>{v}</span>;})}
              </div>
            </div>
            <div>
              <div style={{fontSize:12,fontWeight:800,color:B.textMut,textTransform:"uppercase",letterSpacing:"0.12em",marginBottom:10}}>Cloud providers</div>
              <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>
                {sol.clouds.map(function(c){return <span key={c} style={{fontSize:12,padding:"5px 12px 3px",borderRadius:4,border:"1px solid "+B.border,color:B.textSec,fontFamily:MONO}}>{c}</span>;})}
              </div>
            </div>
          </div>
          {detailLoading ? <div style={{padding:12}}><span style={{fontSize:11,color:B.textSec}}>Loading documentation...</span></div> : detail && detail.contentHtml ? (
            <div style={{marginTop:16,borderTop:"1px solid "+B.border,paddingTop:16}}>
              <div style={{fontSize:12,fontWeight:800,color:B.textMut,textTransform:"uppercase",letterSpacing:"0.12em",marginBottom:10}}>Documentation</div>
              <HtmlWithCopy html={filterContentHtml(detail.contentHtml, hiddenApps)} style={{fontSize:12,color:B.textSec,lineHeight:1.8}}/>
            </div>
          ) : null}
          <div style={{marginTop:32}}>
            <FinOpsEstimator stackItems={sol.components.filter(function(c){return !hiddenApps[c.name];})} defaultCloud="aws"/>
          </div>
      </div>
    </div>
  );
}
