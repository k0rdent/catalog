import React, { useState, useEffect } from 'react';
import { B } from '../constants';
import { buildCatalogUrl, dataPrefix, slugify } from '../utils';
import { SOLUTIONS, CONFIGURATOR_SOLUTIONS } from '../state';
import { HtmlWithCopy } from './HtmlWithCopy';
import { CldCostEstimator } from './FinOpsEstimator';

export function ConfiguratorPage({ initUsecase, initCcloud, initCscale, k0rdentVer }:{ initUsecase?:string, initCcloud?:string, initCscale?:string, k0rdentVer?:string }) {
  var [step, setStep] = useState(0); // 0=solution, 1=cloud, 2=scale
  var [selectedSol, setSelectedSol] = useState<any>(null);
  var [cloud, setCloud] = useState("");
  var [scale, setScale] = useState("");
  var [copied, setCopied] = useState(false);
  var [resultTab, setResultTab] = useState("cluster"); // "cluster" or "services"
  var [solDetail, setSolDetail] = useState<any>(null);
  var [solDetailLoading, setSolDetailLoading] = useState(false);

  // Use configurator solutions list from config.yaml, resolve full solution data by solId
  var configSolutions = CONFIGURATOR_SOLUTIONS.map(function(cs:any){
    var sol = SOLUTIONS.find(function(s:any){ return s.id === cs.solId; });
    return sol ? Object.assign({}, sol, {cfgIcon:cs.icon, cfgTitle:cs.title, cfgSubtitle:cs.subtitle}) : null;
  }).filter(Boolean);

  // Restore state from URL params — match by slugified title
  useEffect(function(){
    if (initUsecase && !selectedSol) {
      var found = configSolutions.find(function(s:any){ return slugify(s.cfgTitle||s.title) === initUsecase; });
      if (found) {
        setSelectedSol(found);
        if (initCcloud) { setCloud(initCcloud); setStep(2); }
        else { setStep(1); }
        if (initCscale) setScale(initCscale);
      }
    }
  }, [initUsecase, configSolutions.length]);

  function solSlug(sol:any):string { return slugify(sol?sol.cfgTitle||sol.title:""); }

  function updateUrl(sol?:any, cl?:string, sc?:string) {
    history.replaceState(null, "", buildCatalogUrl({view:"configurator",search:"",tag:"All",support:"All",sort:"A-Z",compliance:"All",usecase:sol?solSlug(sol):"",ccloud:cl||"",cscale:sc||""}, k0rdentVer));
  }

  function selectSolution(sol:any) { setSelectedSol(sol); setCloud(""); setScale(""); setResultTab("cluster"); updateUrl(sol); setTimeout(function(){ setStep(1); }, 200); }
  function selectCloud(id:string) { setCloud(id); setScale(""); updateUrl(selectedSol,id); setTimeout(function(){ setStep(2); }, 200); }
  function selectScale(id:string) { setScale(id); updateUrl(selectedSol,cloud,id); }
  function back() { if(step===2){setStep(1);setScale("");updateUrl(selectedSol,cloud);} else if(step===1){setStep(0);setCloud("");setScale("");updateUrl();} }
  function reset() { setStep(0); setSelectedSol(null); setCloud(""); setScale(""); setSolDetail(null); updateUrl(); }

  // Fetch solution detail for Services tab
  useEffect(function(){
    if (!selectedSol || !selectedSol.appName) { setSolDetail(null); return; }
    setSolDetail(null); setSolDetailLoading(true);
    var solKey = selectedSol.id.replace(selectedSol.appName + "_", "");
    fetch(dataPrefix("") + "apps/" + selectedSol.appName + "/solution_" + solKey + ".json?t=" + Date.now())
      .then(function(r){ return r.ok ? r.json() : null; })
      .then(function(d){ setSolDetail(d); setSolDetailLoading(false); })
      .catch(function(){ setSolDetailLoading(false); });
  }, [selectedSol ? selectedSol.id : ""]);

  // configurator is now an array of infra providers
  var infraList:any[] = selectedSol && Array.isArray(selectedSol.configurator) ? selectedSol.configurator : [];
  var selectedInfra:any = cloud ? infraList.find(function(p:any){return p.id===cloud;}) || null : null;
  var costData = selectedInfra ? (selectedInfra.cost||{}) : {};
  var cldsList:any[] = selectedInfra ? (selectedInfra.clds||[]) : [];
  var selectedCld:any = scale ? cldsList.find(function(c:any){return (c.id||slugify(c.title))===scale;}) || null : null;
  var yaml = selectedCld ? (selectedCld.cld||"") : "";

  function doCopy() {
    if(navigator.clipboard) navigator.clipboard.writeText(yaml);
    setCopied(true);
    setTimeout(function(){setCopied(false);},1500);
  }

  var stepLabels = [
    {label:"Use Case", value:selectedSol?(selectedSol.cfgTitle||selectedSol.title):null},
    {label:"Infrastructure", value:selectedInfra?selectedInfra.title:null},
    {label:"Scale", value:selectedCld?selectedCld.title:null},
  ];

  return (
    <div style={{maxWidth:1140,margin:"0 auto",padding:"28px 20px 0"}}>
      <div style={{marginBottom:24,paddingBottom:20,borderBottom:"1px solid "+B.border}}>
        <div style={{fontSize:9.5,fontWeight:600,color:B.teal,textTransform:"uppercase",letterSpacing:"0.14em",marginBottom:8}}>Validated · Composable · One-click deploy</div>
        <h1 style={{fontSize:24,fontWeight:700,color:B.textPri,margin:"0 0 6px"}}>Stack <span style={{color:B.teal}}>configurator</span></h1>
        <p style={{fontSize:13,color:B.textSec,lineHeight:1.8,maxWidth:760,margin:"0 0 14px",textAlign:"justify"}}>
          Choose a solution, target infrastructure, and scale to get a validated ClusterDeployment manifest you can apply directly to your k0rdent management cluster.
        </p>
      </div>

      {/* Progress bar */}
      <div style={{display:"flex",gap:0,marginBottom:28,background:B.bg2,borderRadius:8,overflow:"hidden",border:"1px solid "+B.border,maxWidth:720,margin:"0 auto 28px"}}>
        {stepLabels.map(function(s,si){
          var isActive=si===step;
          var isDone=si<step||(si===2&&!!scale);
          return (
            <div key={s.label} onClick={function(){if(si<step){setStep(si);}}} style={{flex:1,padding:"10px 12px",background:isActive?B.teal+"18":isDone?B.bg3:"transparent",borderRight:si<stepLabels.length-1?"1px solid "+B.border:"none",cursor:si<step?"pointer":"default"}}>
              <div style={{fontSize:9,fontWeight:600,color:isActive?B.teal:isDone?B.green:B.textMut,textTransform:"uppercase",marginBottom:2}}>{si+1}. {s.label}</div>
              <div style={{fontSize:10,color:isActive?B.textPri:isDone?B.textSec:B.textMut}}>
                {isDone && s.value ? s.value : (si===0?"What are you building?":si===1?"Where are you deploying?":"Select cluster scale")}
              </div>
            </div>
          );
        })}
      </div>

      {/* Step 0: Pick solution */}
      {step===0 && (
        <div style={{maxWidth:720,margin:"0 auto"}}>
          <h2 style={{fontSize:18,fontWeight:700,color:B.textPri,margin:"0 0 16px"}}>What are you building?</h2>

          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))",gap:10}}>
            {configSolutions.map(function(sol:any){
              return (
                <div key={sol.id} onClick={function(){selectSolution(sol);}}
                  onMouseEnter={function(e){e.currentTarget.style.borderColor=B.teal+"40";e.currentTarget.style.background=B.bg2;}}
                  onMouseLeave={function(e){e.currentTarget.style.borderColor=B.border;e.currentTarget.style.background=B.bg1;}}
                  style={{background:B.bg1,border:"1px solid "+B.border,borderRadius:10,padding:"14px 16px",cursor:"pointer",transition:"all 0.15s"}}
                >
                  <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:6}}>
                    <span style={{fontSize:16,color:B.textMut}}>{sol.cfgIcon||sol.icon||"◈"}</span>
                  </div>
                  <div style={{fontSize:13,fontWeight:600,color:B.textPri,marginBottom:3}}>{sol.cfgTitle||sol.title}</div>
                  <div style={{fontSize:11,color:B.textSec,lineHeight:1.5}}>{sol.cfgSubtitle||sol.tagline}</div>
                </div>
              );
            })}
          </div>
          {configSolutions.length===0&&<div style={{padding:20,textAlign:"center",color:B.textMut,fontSize:12}}>No solutions with configurator metadata found.</div>}
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginTop:20}}>
            <button style={{padding:"8px 18px",background:B.bg2,border:"1px solid "+B.border,borderRadius:7,fontSize:12,color:B.textSec,opacity:0.4,cursor:"default",fontFamily:"inherit"}}>Back</button>
            <span style={{fontSize:11,color:B.textMut}}>Step 1 of 3</span>
            <div style={{width:80}}/>
          </div>
        </div>
      )}

      {/* Step 1: Pick infrastructure */}
      {step===1 && (
        <div style={{maxWidth:720,margin:"0 auto"}}>
          <h2 style={{fontSize:18,fontWeight:700,color:B.textPri,margin:"0 0 16px"}}>Where are you deploying?</h2>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))",gap:10}}>
            {infraList.map(function(provider:any){
              var active=cloud===provider.id;
              return (
                <div key={provider.id} onClick={function(){selectCloud(provider.id);}}
                  onMouseEnter={function(e){if(!active){e.currentTarget.style.borderColor=B.teal+"40";e.currentTarget.style.background=B.bg2;}}}
                  onMouseLeave={function(e){if(!active){e.currentTarget.style.borderColor=B.border;e.currentTarget.style.background=B.bg1;}}}
                  style={{background:active?B.teal+"18":B.bg1,border:"1px solid "+(active?B.teal+"60":B.border),borderRadius:10,padding:"14px 16px",cursor:"pointer",transition:"all 0.15s"}}
                >
                  <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:6}}>
                    <span style={{fontSize:16,color:active?B.teal:B.textMut}}>{provider.icon}</span>
                    {active&&<span style={{width:14,height:14,borderRadius:"50%",background:B.teal,display:"flex",alignItems:"center",justifyContent:"center",fontSize:8,color:B.bg0,fontWeight:700}}>✓</span>}
                  </div>
                  <div style={{fontSize:13,fontWeight:600,color:active?B.teal:B.textPri,marginBottom:3}}>{provider.title}</div>
                  <div style={{fontSize:11,color:B.textSec,lineHeight:1.5}}>{provider.subtitle}</div>
                </div>
              );
            })}
          </div>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginTop:20}}>
            <button onClick={back} style={{padding:"8px 18px",background:B.bg2,border:"1px solid "+B.border,borderRadius:7,fontSize:12,color:B.textSec,cursor:"pointer",fontFamily:"inherit"}}>Back</button>
            <span style={{fontSize:11,color:B.textMut}}>Step 2 of 3</span>
            <div style={{width:80}}/>
          </div>
        </div>
      )}

      {/* Step 2: Pick scale */}
      {step===2 && !scale && (
        <div style={{maxWidth:720,margin:"0 auto"}}>
          <h2 style={{fontSize:18,fontWeight:700,color:B.textPri,margin:"0 0 16px"}}>What is your expected cluster scale?</h2>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))",gap:10}}>
            {cldsList.map(function(cldItem:any){
              var cldId=cldItem.id||slugify(cldItem.title);
              return (
                <div key={cldId} onClick={function(){selectScale(cldId);}}
                  onMouseEnter={function(e){e.currentTarget.style.borderColor=B.teal+"40";e.currentTarget.style.background=B.bg2;}}
                  onMouseLeave={function(e){e.currentTarget.style.borderColor=B.border;e.currentTarget.style.background=B.bg1;}}
                  style={{background:B.bg1,border:"1px solid "+B.border,borderRadius:10,padding:"14px 16px",cursor:"pointer",transition:"all 0.15s"}}
                >
                  <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:6}}>
                    <span style={{fontSize:16,color:B.textMut}}>{cldItem.icon}</span>
                  </div>
                  <div style={{fontSize:13,fontWeight:600,color:B.textPri,marginBottom:3}}>{cldItem.title}</div>
                  <div style={{fontSize:11,color:B.textSec,lineHeight:1.5}}>{cldItem.subtitle}</div>
                </div>
              );
            })}
          </div>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginTop:20}}>
            <button onClick={back} style={{padding:"8px 18px",background:B.bg2,border:"1px solid "+B.border,borderRadius:7,fontSize:12,color:B.textSec,cursor:"pointer",fontFamily:"inherit"}}>Back</button>
            <span style={{fontSize:11,color:B.textMut}}>Step 3 of 3</span>
            <div style={{width:80}}/>
          </div>
        </div>
      )}

      {/* Result */}
      {scale && selectedSol && (
        <div>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:12,marginBottom:20}}>
            <div>
              <h2 style={{fontSize:18,fontWeight:700,color:B.textPri,margin:"0 0 4px"}}>{selectedSol.cfgTitle||selectedSol.title} <span style={{color:B.teal}}>— {selectedInfra?selectedInfra.title:cloud} / {selectedCld?selectedCld.title:scale}</span></h2>
              <div style={{fontSize:12,color:B.textSec}}>Validated deployment for k0rdent</div>
            </div>
            <div style={{display:"flex",gap:8}}>
              <button onClick={reset} style={{padding:"7px 16px",background:B.bg2,border:"1px solid "+B.border,borderRadius:7,fontSize:12,color:B.textSec,cursor:"pointer",fontFamily:"inherit"}}>Start over</button>
            </div>
          </div>

          <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:20}}>
            {stepLabels.map(function(s){return s.value?<div key={s.label} style={{display:"flex",alignItems:"center",gap:6,background:B.bg2,border:"1px solid "+B.teal+"40",borderRadius:20,padding:"4px 12px"}}><span style={{fontSize:9.5,color:B.textMut,textTransform:"uppercase",fontWeight:600}}>{s.label}</span><span style={{fontSize:11,color:B.teal,fontWeight:500}}>{s.value}</span></div>:null;})}
          </div>

          {/* Tabs */}
          <div style={{display:"flex",gap:0,marginBottom:20,borderBottom:"1px solid "+B.border}}>
            {[{id:"cluster",label:"Cluster deployment"},{id:"services",label:"Services deployment"}].map(function(tab){
              var active=resultTab===tab.id;
              return <button key={tab.id} onClick={function(){setResultTab(tab.id);}} style={{padding:"8px 18px",fontSize:12,color:active?B.teal:B.textSec,background:"transparent",border:"none",borderBottom:"2px solid "+(active?B.teal:"transparent"),cursor:"pointer",fontFamily:"inherit",fontWeight:active?600:400}}>{tab.label}</button>;
            })}
          </div>

          {/* Cluster deployment tab */}
          {resultTab==="cluster" && (function(){
            // Parse CLD YAML for cost estimation
            var costItems:any[] = [];
            if (yaml && Object.keys(costData).length > 0) {
              // Extract controlPlane instanceType/vmSize/flavor and count
              var cpType = (yaml.match(/controlPlane:[\s\S]*?(?:instanceType|vmSize|flavor):\s*"?([^\s"]+)"?/) || [])[1];
              var cpCount = parseInt((yaml.match(/controlPlaneNumber:\s*(\d+)/) || [])[1] || "1");
              // Extract worker instanceType/vmSize/flavor and count
              var wType = (yaml.match(/worker:[\s\S]*?(?:instanceType|vmSize|flavor):\s*"?([^\s"]+)"?/) || [])[1];
              var wCount = parseInt((yaml.match(/workersNumber:\s*(\d+)/) || [])[1] || "1");
              if (cpType && costData[cpType]) costItems.push({role:"Control plane", type:cpType, count:cpCount, priceHr:costData[cpType]});
              if (wType && costData[wType]) costItems.push({role:"Worker", type:wType, count:wCount, priceHr:costData[wType]});
            }
            var totalHr = 0; for(var ci2=0;ci2<costItems.length;ci2++) totalHr += costItems[ci2].priceHr * costItems[ci2].count;
            var totalMo = totalHr * 730;
            return (
            <div>
              <div style={{position:"relative"}}>
                {yaml ? <HtmlWithCopy html={'<pre><code class="language-yaml">'+yaml.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")+'</code></pre>'} style={{fontSize:12,color:B.textSec,lineHeight:1.8}}/> : <div style={{background:B.bg2,border:"1px solid "+B.border,borderRadius:8,padding:"14px 16px",fontSize:11,color:B.textMut}}>No manifest available for this combination.</div>}
              </div>
              <div style={{marginTop:10,padding:"10px 14px",background:B.tealBg,border:"1px solid "+B.teal+"30",borderRadius:7,fontSize:11.5,color:B.textSec,lineHeight:1.65}}>
                <span style={{color:B.teal,fontWeight:600}}>Next step: </span>
                Apply this ClusterDeployment manifest to your k0rdent management cluster to provision the infrastructure.
              </div>
              {costItems.length > 0 && <CldCostEstimator costItems={costItems} cloudLabel={selectedInfra?selectedInfra.title:cloud}/>}
            </div>
            );
          })()}

          {/* Services deployment tab */}
          {resultTab==="services" && (
            <div>
              {solDetailLoading ? <div style={{padding:12}}><span style={{fontSize:11,color:B.textSec}}>Loading solution documentation...</span></div> : solDetail && solDetail.contentHtml ? (function(){
                // Extract only install, verify, and MCS pre blocks
                var blocks = solDetail.contentHtml.match(/<pre>[\s\S]*?<\/pre>/g) || [];
                var parts:string[] = [];
                for (var bi=0;bi<blocks.length;bi++) {
                  var text = blocks[bi].replace(/<[^>]+>/g,"");
                  if (text.indexOf("helm upgrade --install") !== -1) { parts.push('<div style="margin-bottom:16px"><div style="font-size:9.5px;font-weight:600;color:'+B.textMut+';text-transform:uppercase;margin-bottom:7px">Install service templates</div>'+blocks[bi]+'</div>'); }
                  else if (text.indexOf("kubectl get servicetemplates") !== -1) { parts.push('<div style="margin-bottom:16px"><div style="font-size:9.5px;font-weight:600;color:'+B.textMut+';text-transform:uppercase;margin-bottom:7px">Verify service templates</div>'+blocks[bi]+'</div>'); }
                  else if (text.indexOf("MultiClusterService") !== -1) { parts.push('<div style="margin-bottom:16px"><div style="font-size:9.5px;font-weight:600;color:'+B.textMut+';text-transform:uppercase;margin-bottom:7px">Deploy MultiClusterService</div>'+blocks[bi]+'</div>'); }
                }
                return parts.length > 0 ? <HtmlWithCopy html={parts.join("")} style={{fontSize:12,color:B.textSec,lineHeight:1.8}}/> : <div style={{padding:12,fontSize:11,color:B.textMut}}>No service deployment snippets found.</div>;
              })() : <div style={{padding:12,fontSize:11,color:B.textMut}}>No documentation available for this solution.</div>}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
