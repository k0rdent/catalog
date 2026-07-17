import React, { useState } from 'react';
import { B, CLOUD_PRICING, estimateCost } from '../constants';
import { fmt$ } from '../utils';

export function FinOpsEstimator({ stackItems, defaultCloud }) {
  var [cloud, setCloud] = useState(defaultCloud || "aws");
  var [clusters, setClusters] = useState(1);
  var [hoursPerMonth, setHoursPerMonth] = useState(730);

  var est = estimateCost(stackItems, cloud, clusters, hoursPerMonth);
  var annual = est.total * 12;
  var gpuCost = 0;
  for(var i=0;i<est.breakdown.length;i++){if(est.breakdown[i].isGpu)gpuCost+=est.breakdown[i].monthly;}
  var gpuPct = est.total > 0 ? Math.round(gpuCost/est.total*100) : 0;

  return (
    <div style={{background:B.bg1,border:"1px solid "+B.border,borderRadius:10,overflow:"hidden"}}>
      <div style={{padding:"12px 16px",background:B.bg2,borderBottom:"1px solid "+B.border,display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:8}}>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <span style={{fontSize:14,color:B.amber}}>◈</span>
          <span style={{fontSize:12.5,fontWeight:600,color:B.textPri}}>FinOps Cost Estimator</span>
          <span style={{fontSize:9.5,padding:"1px 7px",borderRadius:10,background:B.amber+"18",color:B.amber,border:"1px solid "+B.amber+"30",fontWeight:500}}>Estimated</span>
        </div>
        <div style={{display:"flex",gap:10,flexWrap:"wrap",alignItems:"center"}}>
          <div style={{display:"flex",alignItems:"center",gap:5}}>
            <span style={{fontSize:10,color:B.textMut}}>Cloud</span>
            <select value={cloud} onChange={function(e){setCloud(e.target.value);}} style={{padding:"3px 7px",border:"1px solid "+B.borderHi,borderRadius:5,fontSize:11,background:B.bg3,color:B.textPri,outline:"none",cursor:"pointer"}}>
              {Object.entries(CLOUD_PRICING).map(function(e){return <option key={e[0]} value={e[0]}>{e[1].label}</option>;})}
            </select>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:5}}>
            <span style={{fontSize:10,color:B.textMut}}>Clusters</span>
            <input type="number" min="1" max="100" value={clusters} onChange={function(e){setClusters(Math.max(1,parseInt(e.target.value)||1));}} style={{width:52,padding:"3px 7px",border:"1px solid "+B.borderHi,borderRadius:5,fontSize:11,background:B.bg3,color:B.textPri,outline:"none",textAlign:"center"}}/>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:5}}>
            <span style={{fontSize:10,color:B.textMut}}>Hrs/mo</span>
            <input type="number" min="1" max="730" value={hoursPerMonth} onChange={function(e){setHoursPerMonth(Math.max(1,Math.min(730,parseInt(e.target.value)||730)));}} style={{width:52,padding:"3px 7px",border:"1px solid "+B.borderHi,borderRadius:5,fontSize:11,background:B.bg3,color:B.textPri,outline:"none",textAlign:"center"}}/>
          </div>
        </div>
      </div>
      <div style={{display:"flex",gap:0,borderBottom:"1px solid "+B.border}}>
        {[
          {l:"Monthly estimate",v:fmt$(est.total),sub:CLOUD_PRICING[cloud].label,c:B.amber},
          {l:"Annual estimate",v:fmt$(annual),sub:"12 months",c:B.teal},
          {l:"Per cluster/mo",v:fmt$(est.total/Math.max(1,clusters)),sub:clusters+" cluster"+(clusters>1?"s":""),c:B.cyan},
          {l:"GPU cost share",v:gpuPct+"%",sub:"of total spend",c:gpuCost>0?B.red:B.textMut},
        ].map(function(s,si,arr){
          return (
            <div key={s.l} style={{flex:"1 1 0",padding:"12px 14px",borderRight:si<arr.length-1?"1px solid "+B.border:"none"}}>
              <div style={{fontSize:10,color:B.textMut,marginBottom:2}}>{s.l}</div>
              <div style={{fontSize:17,fontWeight:700,color:s.c,fontFamily:"monospace",lineHeight:1}}>{s.v}</div>
              <div style={{fontSize:9.5,color:B.textMut,marginTop:2}}>{s.sub}</div>
            </div>
          );
        })}
      </div>
      <div style={{padding:"12px 16px"}}>
        <div style={{fontSize:9.5,fontWeight:600,color:B.textMut,textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:10}}>Cost breakdown by component</div>
        <div style={{display:"flex",flexDirection:"column",gap:6}}>
          {est.breakdown.slice(0,8).map(function(item){
            var barPct = est.topCost > 0 ? Math.round(item.monthly/est.topCost*100) : 0;
            var barColor = item.isGpu ? B.red : item.monthly/est.total > 0.2 ? B.amber : B.teal;
            return (
              <div key={item.name}>
                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:3}}>
                  <div style={{display:"flex",alignItems:"center",gap:6}}>
                    <span style={{fontSize:10.5,fontFamily:"monospace",color:B.textPri,fontWeight:500}}>{item.name}</span>
                    {item.isGpu&&<span style={{fontSize:8.5,padding:"1px 5px",borderRadius:3,background:B.red+"18",color:B.red,border:"1px solid "+B.red+"30",fontWeight:600}}>GPU</span>}
                    <span style={{fontSize:9.5,color:B.textMut}}>{item.cpu}vCPU{item.gpu>0?" · "+item.gpu+"GPU":""} · {item.mem}GB · {item.storage}GB</span>
                  </div>
                  <span style={{fontSize:11,fontFamily:"monospace",color:barColor,fontWeight:600}}>{fmt$(item.monthly)}<span style={{fontSize:9,color:B.textMut,fontWeight:400}}>/mo</span></span>
                </div>
                <div style={{height:5,background:B.bg3,borderRadius:3,overflow:"hidden"}}>
                  <div style={{height:"100%",width:barPct+"%",background:"linear-gradient(90deg,"+barColor+","+barColor+"90)",borderRadius:3,transition:"width 0.3s"}}/>
                </div>
              </div>
            );
          })}
          {est.breakdown.length>8&&<div style={{fontSize:10.5,color:B.textMut,paddingTop:4}}>+ {est.breakdown.length-8} more components</div>}
        </div>
        <div style={{marginTop:12,padding:"8px 12px",background:B.bg3,borderRadius:6,fontSize:10,color:B.textMut,lineHeight:1.6}}>
          Estimates are indicative only, based on public list pricing for {CLOUD_PRICING[cloud].label}. Actual costs vary with reserved instances, spot pricing, and workload patterns.
        </div>
      </div>
    </div>
  );
}

export function CldCostEstimator({ costItems, cloudLabel }:{ costItems:any[], cloudLabel:string }) {
  var [clusters, setClusters] = useState(1);
  var [hoursPerMonth, setHoursPerMonth] = useState(730);

  var totalHr = 0;
  for (var i=0;i<costItems.length;i++) totalHr += costItems[i].priceHr * costItems[i].count;
  var totalMo = totalHr * hoursPerMonth * clusters;
  var annual = totalMo * 12;
  var perCluster = totalMo / Math.max(1, clusters);

  return (
    <div style={{marginTop:20,background:B.bg1,border:"1px solid "+B.border,borderRadius:10,overflow:"hidden"}}>
      <div style={{padding:"12px 16px",background:B.bg2,borderBottom:"1px solid "+B.border,display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:8}}>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <span style={{fontSize:14,color:B.amber}}>◈</span>
          <span style={{fontSize:12.5,fontWeight:600,color:B.textPri}}>FinOps Cost Estimator</span>
          <span style={{fontSize:9.5,padding:"1px 7px",borderRadius:10,background:B.amber+"18",color:B.amber,border:"1px solid "+B.amber+"30",fontWeight:500}}>Estimated</span>
        </div>
        <div style={{display:"flex",gap:10,flexWrap:"wrap",alignItems:"center"}}>
          <div style={{display:"flex",alignItems:"center",gap:5}}>
            <span style={{fontSize:10,color:B.textMut}}>Clusters</span>
            <input type="number" min={1} max={100} value={clusters} onChange={function(e:any){setClusters(Math.max(1,parseInt(e.target.value)||1));}} style={{width:52,padding:"3px 7px",border:"1px solid "+B.borderHi,borderRadius:5,fontSize:11,background:B.bg3,color:B.textPri,outline:"none",textAlign:"center"}}/>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:5}}>
            <span style={{fontSize:10,color:B.textMut}}>Hrs/mo</span>
            <input type="number" min={1} max={730} value={hoursPerMonth} onChange={function(e:any){setHoursPerMonth(Math.max(1,Math.min(730,parseInt(e.target.value)||730)));}} style={{width:52,padding:"3px 7px",border:"1px solid "+B.borderHi,borderRadius:5,fontSize:11,background:B.bg3,color:B.textPri,outline:"none",textAlign:"center"}}/>
          </div>
        </div>
      </div>
      <div style={{display:"flex",gap:0,borderBottom:"1px solid "+B.border}}>
        {[
          {l:"Monthly estimate",v:fmt$(totalMo),sub:cloudLabel,c:B.amber},
          {l:"Annual estimate",v:fmt$(annual),sub:"12 months",c:B.teal},
          {l:"Per cluster/mo",v:fmt$(perCluster),sub:clusters+" cluster"+(clusters>1?"s":""),c:B.cyan},
        ].map(function(s,si,arr){
          return (
            <div key={s.l} style={{flex:"1 1 0",padding:"12px 14px",borderRight:si<arr.length-1?"1px solid "+B.border:"none"}}>
              <div style={{fontSize:10,color:B.textMut,marginBottom:2}}>{s.l}</div>
              <div style={{fontSize:17,fontWeight:700,color:s.c,fontFamily:"monospace",lineHeight:1}}>{s.v}</div>
              <div style={{fontSize:9.5,color:B.textMut,marginTop:2}}>{s.sub}</div>
            </div>
          );
        })}
      </div>
      <div style={{padding:"12px 16px"}}>
        <div style={{fontSize:9.5,fontWeight:600,color:B.textMut,textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:10}}>Cost breakdown by node role</div>
        <div style={{display:"flex",flexDirection:"column",gap:6}}>
          {costItems.map(function(item:any){
            var itemMo = item.priceHr * item.count * hoursPerMonth * clusters;
            var barPct = totalMo > 0 ? Math.round(itemMo/totalMo*100) : 0;
            return (
              <div key={item.role}>
                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:3}}>
                  <div style={{display:"flex",alignItems:"center",gap:6}}>
                    <span style={{fontSize:10.5,fontFamily:"monospace",color:B.textPri,fontWeight:500}}>{item.role}</span>
                    <span style={{fontSize:9.5,color:B.textMut}}>{item.count}× {item.type} · ${item.priceHr}/hr each</span>
                  </div>
                  <span style={{fontSize:11,fontFamily:"monospace",color:B.amber,fontWeight:600}}>{fmt$(itemMo)}<span style={{fontSize:9,color:B.textMut,fontWeight:400}}>/mo</span></span>
                </div>
                <div style={{height:5,background:B.bg3,borderRadius:3,overflow:"hidden"}}>
                  <div style={{height:"100%",width:barPct+"%",background:"linear-gradient(90deg,"+B.amber+","+B.amber+"90)",borderRadius:3,transition:"width 0.3s"}}/>
                </div>
              </div>
            );
          })}
        </div>
        <div style={{marginTop:12,padding:"8px 12px",background:B.bg3,borderRadius:6,fontSize:10,color:B.textMut,lineHeight:1.6}}>
          Estimates are indicative only, based on on-demand list pricing for {cloudLabel}. Actual costs vary with reserved instances, spot pricing, and provider discounts.
        </div>
      </div>
    </div>
  );
}
