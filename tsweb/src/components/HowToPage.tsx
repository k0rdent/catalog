import React, { useState } from 'react';
import { B, GRAD, MONO, FONT } from '../constants';
import { PageHero } from './PageHero';

// Guided tour of deploying a catalog application across a fleet. The flow is
// management-cluster only: ServiceTemplate says what, MultiClusterService says
// where, ClusterSummary is the per-cluster receipt.
var STEPS = [
  {
    label: "Prerequisites",
    title: "Confirm the management cluster is ready",
    body: "Everything in this tour runs against the k0rdent management cluster — never against a child cluster directly. Check that the Management object is reconciled and that at least one ClusterDeployment already exists to receive services.",
    codeLabel: "verify",
    code: `kubectl get management kcm
# NAME   READY   RELEASE
# kcm    True    kcm-1-3-2

kubectl get clusterdeployment -n kcm-system
# NAME       READY   STATUS
# prod-eu     True   ClusterDeployment is ready
# prod-us     True   ClusterDeployment is ready`,
    note: "If READY is False, resolve the management cluster first — service reconciliation will not start.",
  },
  {
    label: "Templates",
    title: "Register the application as a ServiceTemplate",
    body: "Every catalog entry maps to one ServiceTemplate in the kcm-system namespace. It pins the chart, its version and its source repository, so the same artifact lands on every cluster that requests it.",
    codeLabel: "kyverno-servicetemplate.yaml",
    code: `apiVersion: k0rdent.mirantis.com/v1beta1
kind: ServiceTemplate
metadata:
  name: kyverno-3-3-4
  namespace: kcm-system
spec:
  helm:
    chartSpec:
      chart: kyverno
      version: 3.3.4
      sourceRef:
        kind: HelmRepository
        name: kyverno-charts`,
    note: "Copy this block from any application's Install tab — it is generated per entry and per version.",
  },
  {
    label: "Selectors",
    title: "Label the child clusters that should receive it",
    body: "MultiClusterService targets clusters by label, not by name. Labelling is how you express intent once and have it hold as the fleet grows — a new cluster with the same label picks up the whole service set automatically.",
    codeLabel: "label",
    code: `kubectl label clusterdeployment prod-eu \\
  -n kcm-system tier=production

kubectl label clusterdeployment prod-us \\
  -n kcm-system tier=production

kubectl get clusterdeployment -n kcm-system --show-labels`,
    note: "Prefer intent labels (tier, region, workload) over per-cluster labels — they survive fleet churn.",
  },
  {
    label: "MultiClusterService",
    title: "Declare the services once for the whole fleet",
    body: "A MultiClusterService is a fleet-wide object: a cluster selector plus an ordered list of services. k0rdent hands each matching cluster to Sveltos, which installs the charts in order and keeps them reconciled.",
    codeLabel: "production-baseline.yaml",
    code: `apiVersion: k0rdent.mirantis.com/v1beta1
kind: MultiClusterService
metadata:
  name: production-baseline
spec:
  clusterSelector:
    matchLabels:
      tier: production
  serviceSpec:
    priority: 100
    services:
      - template: cert-manager-1-16-3
        namespace: cert-manager
      - template: kyverno-3-3-4
        namespace: kyverno
      - template: prometheus-25-30-1
        namespace: monitoring`,
    note: "Higher priority wins when two MultiClusterServices target the same cluster with the same chart.",
  },
  {
    label: "Reconcile",
    title: "Watch it land on every matching cluster",
    body: "Apply the object and k0rdent reports per-cluster state. Reconciliation is continuous: delete a release by hand on a child cluster and it comes back.",
    codeLabel: "apply and watch",
    code: `kubectl apply -f production-baseline.yaml

kubectl get multiclusterservice production-baseline
# NAME                   READY   STATUS
# production-baseline    True    All services deployed

kubectl get clustersummary -A
# CLUSTER   PROFILE               STATUS
# prod-eu   production-baseline   Provisioned
# prod-us   production-baseline   Provisioned`,
    note: "ClusterSummary is the per-cluster receipt — check it first when one cluster lags behind.",
  },
  {
    label: "Upgrade",
    title: "Upgrade or roll back by version, fleet-wide",
    body: "Register the new version as a second ServiceTemplate, then point the MultiClusterService at it. Every matching cluster upgrades in the same order; reverting the reference rolls the fleet back.",
    codeLabel: "upgrade",
    code: `kubectl apply -f kyverno-3-4-0-servicetemplate.yaml

kubectl patch multiclusterservice production-baseline \\
  --type json -p '[{
    "op": "replace",
    "path": "/spec/serviceSpec/services/1/template",
    "value": "kyverno-3-4-0"
  }]'`,
    note: "Roll out to a canary label first, confirm ClusterSummary, then widen the selector.",
  },
];

var CONCEPTS = [
  {k:"ServiceTemplate", v:"What to install, and at which version"},
  {k:"MultiClusterService", v:"Which clusters get it, and in what order"},
  {k:"ClusterSummary", v:"Per-cluster proof that it landed"},
];

export function HowToPage({ onGoCatalog }:{onGoCatalog?:()=>void}) {
  var [step, setStep] = useState(0);
  var [copied, setCopied] = useState(false);
  var s = STEPS[step];
  var progress = Math.round(((step+1)/STEPS.length)*100);

  function jump(i:number) { setStep(i); setCopied(false); window.scrollTo(0,0); }
  function copyCode() {
    if (navigator.clipboard) navigator.clipboard.writeText(s.code);
    setCopied(true);
    setTimeout(function(){ setCopied(false); }, 1500);
  }

  return (
    <div style={{fontFamily:FONT,color:B.textPri}}>
      <PageHero
        eyebrow="Guided tour"
        title="Deploy a catalog application to child clusters"
        lede="Six steps from a registered ServiceTemplate to a reconciled fleet, using MultiClusterService. Everything runs against the management cluster — you never touch a child cluster by hand."
      >
        <div className="k0-howto-concepts" style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(240px,1fr))",gap:1,background:B.border,border:"1px solid "+B.border}}>
          {CONCEPTS.map(function(c){
            return <div key={c.k} style={{background:B.bg0,padding:"18px",display:"flex",flexDirection:"column",gap:6}}>
              <span style={{fontSize:11,fontWeight:800,textTransform:"uppercase",letterSpacing:"0.12em",color:B.textDim}}>{c.k}</span>
              <span style={{fontSize:13,lineHeight:"19px",color:B.bright}}>{c.v}</span>
            </div>;
          })}
        </div>
      </PageHero>

      <section className="k0-catalog-layout" style={{maxWidth:1440,margin:"0 auto",padding:"48px 40px 96px",display:"grid",gridTemplateColumns:"264px minmax(0,1fr)",gap:56,alignItems:"start"}}>
        <aside className="k0-sidebar" style={{position:"sticky",top:96,display:"flex",flexDirection:"column",gap:12}}>
          <span style={{fontSize:12,fontWeight:800,textTransform:"uppercase",letterSpacing:"0.12em",color:B.textMut}}>Tour steps</span>
          <div style={{display:"flex",flexDirection:"column"}}>
            {STEPS.map(function(r,i){
              var active = i===step;
              var done = i<step;
              return <div key={r.label} onClick={function(){jump(i);}}
                onMouseEnter={function(e){ if(!active) e.currentTarget.style.background=B.tile; }}
                onMouseLeave={function(e){ if(!active) e.currentTarget.style.background="transparent"; }}
                style={{display:"flex",alignItems:"center",gap:12,padding:"11px 12px 10px",cursor:"pointer",
                  background:active?B.tile:"transparent",transition:"background 160ms ease"}}>
                <span style={{flex:"none",width:24,height:24,borderRadius:"50%",display:"flex",alignItems:"center",
                  justifyContent:"center",fontFamily:MONO,fontSize:12,
                  background:active?GRAD:"transparent",color:active?"#000":done?B.textPri:B.textDim,
                  border:active?"none":"1px solid "+(done?B.textMut:B.border)}}>{i+1}</span>
                <span style={{flex:1,fontSize:14,lineHeight:"20px",fontWeight:700,color:active?B.textPri:B.textSec}}>{r.label}</span>
              </div>;
            })}
          </div>
        </aside>

        <div style={{minWidth:0,display:"flex",flexDirection:"column",gap:28}}>
          <div style={{height:4,borderRadius:120,background:B.panel,overflow:"hidden"}}>
            <div style={{height:"100%",width:progress+"%",background:GRAD,borderRadius:120,transition:"width 220ms ease"}}/>
          </div>

          <div style={{display:"flex",flexDirection:"column",gap:12}}>
            <span style={{fontSize:11,fontWeight:800,textTransform:"uppercase",letterSpacing:"0.12em",color:B.textDim}}>Step {step+1} of {STEPS.length} · {s.label}</span>
            <h2 style={{margin:0,fontSize:32,lineHeight:"38px",fontWeight:700,color:B.textPri,maxWidth:"26ch",textWrap:"pretty"}}>{s.title}</h2>
            <p style={{margin:0,fontSize:16,lineHeight:"26px",color:B.textSec,maxWidth:"72ch",textWrap:"pretty"}}>{s.body}</p>
          </div>

          <div style={{border:"1px solid "+B.border,background:B.card,borderRadius:8,overflow:"hidden"}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:12,padding:"12px 18px",borderBottom:"1px solid "+B.border,background:B.tile}}>
              <span style={{fontFamily:MONO,fontSize:12,color:B.textMut}}>{s.codeLabel}</span>
              <button onClick={copyCode}
                style={{background:"none",border:"1px solid "+B.border,borderRadius:6,padding:"4px 12px 3px",
                  color:copied?B.teal:B.textMut,fontSize:11,fontWeight:800,textTransform:"uppercase",
                  letterSpacing:"0.08em",cursor:"pointer",fontFamily:"inherit"}}>{copied?"Copied":"Copy"}</button>
            </div>
            <pre style={{margin:0,padding:"22px 20px",overflowX:"auto",fontFamily:MONO,fontSize:13,lineHeight:"22px",color:B.bright}}>{s.code}</pre>
          </div>

          <div style={{display:"flex",gap:14,padding:"18px 20px",border:"1px solid "+B.border,background:B.bg0}}>
            <span style={{flex:"none",fontSize:11,fontWeight:800,textTransform:"uppercase",letterSpacing:"0.12em",color:B.teal,paddingTop:2}}>Note</span>
            <span style={{flex:1,fontSize:14,lineHeight:"22px",color:B.textSec,textWrap:"pretty"}}>{s.note}</span>
          </div>

          <div style={{display:"flex",alignItems:"center",gap:12,paddingTop:4,flexWrap:"wrap"}}>
            {step>0&&<button onClick={function(){jump(step-1);}}
              onMouseEnter={function(e){e.currentTarget.style.background=B.hover;}}
              onMouseLeave={function(e){e.currentTarget.style.background="none";}}
              style={{padding:"12px 24px 9px",border:"2px solid "+B.textPri,borderRadius:20,background:"none",
                color:B.textPri,fontSize:13,fontWeight:900,textTransform:"uppercase",letterSpacing:"0.06em",
                cursor:"pointer",fontFamily:"inherit"}}>Previous</button>}
            {step<STEPS.length-1
              ? <button onClick={function(){jump(step+1);}}
                  onMouseEnter={function(e){e.currentTarget.style.filter="brightness(1.08)";}}
                  onMouseLeave={function(e){e.currentTarget.style.filter="none";}}
                  style={{padding:"12px 28px 9px",border:"2px solid #000",borderRadius:20,background:GRAD,color:"#000",
                    fontSize:13,fontWeight:900,textTransform:"uppercase",letterSpacing:"0.06em",cursor:"pointer",fontFamily:"inherit"}}>Next step</button>
              : <button onClick={function(){ if(onGoCatalog) onGoCatalog(); }}
                  onMouseEnter={function(e){e.currentTarget.style.filter="brightness(1.08)";}}
                  onMouseLeave={function(e){e.currentTarget.style.filter="none";}}
                  style={{padding:"12px 28px 9px",border:"2px solid #000",borderRadius:20,background:GRAD,color:"#000",
                    fontSize:13,fontWeight:900,textTransform:"uppercase",letterSpacing:"0.06em",cursor:"pointer",fontFamily:"inherit"}}>Browse the catalog</button>}
          </div>
        </div>
      </section>
    </div>
  );
}
