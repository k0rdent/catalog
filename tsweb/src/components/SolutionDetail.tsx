import React, { useState, useEffect } from 'react';
import { B, SUPPORT_STYLE, SUPPORT_LABEL, K8S_VERS, tagAccent } from '../constants';
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
  useEffect(function(){
    var h=function(e){if(e.key==="Escape")onClose();};
    window.addEventListener("keydown",h);
    return function(){window.removeEventListener("keydown",h);};
  },[]);
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
    <div onClick={onClose} style={{position:"fixed",top:0,left:0,right:0,bottom:0,zIndex:1000,display:"flex",alignItems:"stretch",justifyContent:"flex-end"}}>
      <div className="k0-backdrop" style={{position:"absolute",top:0,left:0,right:0,bottom:0,background:"rgba(5,8,20,0.75)"}}/>
      <div className="k0-detail-panel" onClick={function(e){e.stopPropagation();}} style={{position:"relative",width:"min(700px,100vw)",background:B.bg1,borderLeft:"1px solid "+B.borderHi,display:"flex",flexDirection:"column",overflowY:"auto"}}>
        <div style={{height:3,background:"linear-gradient(90deg,"+bc+","+bc+"50)",flexShrink:0}}/>
        <div className="k0-detail-header" style={{padding:"20px 24px 0",flexShrink:0}}>
          <div style={{display:"flex",gap:12,alignItems:"flex-start",marginBottom:12}}>
            {sol.logo ? <AppLogo name={sol.appName||""} size={48} accent={bc} logo={sol.logo}/> : <div style={{width:48,height:48,borderRadius:11,background:bc+"18",border:"1px solid "+bc+"35",display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,color:bc,flexShrink:0}}>{sol.icon}</div>}
            <div style={{flex:1}}>
              <div style={{display:"flex",alignItems:"center",gap:7,flexWrap:"wrap",marginBottom:3}}>
                <h2 style={{fontSize:19,fontWeight:700,color:B.textPri,margin:0}}>{sol.title}{sol.beta&&<span style={{fontSize:9,marginLeft:6,padding:"2px 5px",borderRadius:3,background:B.amber+"20",color:B.amber,fontWeight:700,textTransform:"uppercase",verticalAlign:"middle"}}>Beta</span>}</h2>
                {!sol.beta&&<span style={{fontSize:9.5,color:badgeC}}>{"✓ "+sol.badge}</span>}
                {!sol.beta&&<span style={{fontSize:8.5,padding:"2px 7px",borderRadius:3,background:ss.bg,color:ss.text,border:"1px solid "+ss.border,fontWeight:600,textTransform:"uppercase"}}>{SUPPORT_LABEL[sol.tier]}</span>}
              </div>
              <div style={{fontSize:11.5,color:B.textMut}}>{sol.tagline}</div>
            </div>
            <button onClick={onClose} style={{background:"transparent",border:"1px solid "+B.border,borderRadius:6,width:30,height:30,display:"flex",alignItems:"center",justifyContent:"center",color:B.textSec,cursor:"pointer",fontSize:13,fontFamily:"inherit",flexShrink:0}}>✕</button>
          </div>
          <p style={{fontSize:14,color:B.textSec,lineHeight:1.8,margin:"0 0 16px"}}>{sol.desc}</p>
        </div>
        <div className="k0-detail-content" style={{padding:"0 24px 24px",flex:1}}>
          <div style={{marginBottom:16}}>
            <div style={{fontSize:9.5,fontWeight:600,color:B.textMut,textTransform:"uppercase",marginBottom:8}}>Use cases</div>
            {sol.useCases.map(function(u){return <div key={u} style={{display:"flex",gap:8,marginBottom:6}}><span style={{color:bc,fontSize:11,flexShrink:0}}>◈</span><span style={{fontSize:13,color:B.textSec,lineHeight:1.6}}>{u}</span></div>;})}
          </div>
          <div style={{marginBottom:16}}>
            <div style={{fontSize:9.5,fontWeight:600,color:B.textMut,textTransform:"uppercase",marginBottom:8}}>Components</div>
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
                        <td style={{padding:"8px 10px",whiteSpace:"nowrap"}}><span style={{fontSize:10.5,fontFamily:"monospace",fontWeight:600,color:hidden?B.textMut:bc}}>{c.name}</span><span style={{fontSize:8.5,color:B.textMut,marginLeft:4,fontFamily:"monospace"}}>{c.version}</span></td>
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
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:16}}>
            <div>
              <div style={{fontSize:9.5,fontWeight:600,color:B.textMut,textTransform:"uppercase",marginBottom:7}}>Kubernetes versions</div>
              <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
                {K8S_VERS.map(function(v){var ok=sol.k8s.indexOf(v)!==-1;return <span key={v} style={{fontSize:10.5,padding:"3px 9px",borderRadius:5,border:"1px solid "+(ok?bc+"40":B.border),background:ok?bc+"12":B.bg2,color:ok?bc:B.textMut,fontFamily:"monospace",fontWeight:ok?600:400}}>{v}</span>;})}
              </div>
            </div>
            <div>
              <div style={{fontSize:9.5,fontWeight:600,color:B.textMut,textTransform:"uppercase",marginBottom:7}}>Cloud providers</div>
              <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>
                {sol.clouds.map(function(c){return <span key={c} style={{fontSize:10,padding:"2px 7px",borderRadius:4,background:B.bg3,border:"1px solid "+B.border,color:B.textSec}}>{c}</span>;})}
              </div>
            </div>
          </div>
          {detailLoading ? <div style={{padding:12}}><span style={{fontSize:11,color:B.textSec}}>Loading documentation...</span></div> : detail && detail.contentHtml ? (
            <div style={{marginTop:16,borderTop:"1px solid "+B.border,paddingTop:16}}>
              <div style={{fontSize:9.5,fontWeight:600,color:B.textMut,textTransform:"uppercase",marginBottom:7}}>Documentation</div>
              <HtmlWithCopy html={filterContentHtml(detail.contentHtml, hiddenApps)} style={{fontSize:12,color:B.textSec,lineHeight:1.8}}/>
            </div>
          ) : null}
          <div style={{marginTop:12}}>
            <FinOpsEstimator stackItems={sol.components.filter(function(c){return !hiddenApps[c.name];})} defaultCloud="aws"/>
          </div>
        </div>
      </div>
    </div>
  );
}
