import React from 'react';
import { B } from '../constants';

function Col({ title, children }:any) {
  return <div style={{display:"flex",flexDirection:"column",gap:12}}>
    <span style={{fontSize:11,fontWeight:800,textTransform:"uppercase",letterSpacing:"0.12em",color:B.textMut}}>{title}</span>
    {children}
  </div>;
}

function FLink({ href, onClick, children }:any) {
  return <a href={href} onClick={onClick} target={onClick?undefined:"_blank"} rel="noreferrer"
    onMouseEnter={function(e:any){e.currentTarget.style.color=B.textPri;}}
    onMouseLeave={function(e:any){e.currentTarget.style.color=B.textSec;}}
    style={{fontSize:14,color:B.textSec,textDecoration:"none",cursor:"pointer"}}>{children}</a>;
}

export function SiteFooter({ onNavigate }:{onNavigate?:(v:string)=>void}) {
  function go(v:string) {
    return function(e:any){ e.preventDefault(); if (onNavigate) onNavigate(v); };
  }
  return (
    <footer style={{borderTop:"1px solid "+B.border,background:B.bg0}}>
      <div className="k0-footer" style={{maxWidth:1440,margin:"0 auto",padding:"64px 40px",display:"flex",
        alignItems:"flex-start",justifyContent:"space-between",gap:64,flexWrap:"wrap"}}>
        <div style={{display:"flex",flexDirection:"column",gap:16,maxWidth:"34ch"}}>
          <span style={{fontSize:22,fontWeight:800,letterSpacing:"-0.02em",color:B.textPri}}>
            k<span style={{backgroundImage:B.gradText,WebkitBackgroundClip:"text",backgroundClip:"text",color:"transparent"}}>0</span>rdent
          </span>
          <p style={{margin:0,fontSize:14,lineHeight:"22px",color:B.textDim}}>
            The open source Kubernetes platform built for AI. From Metal-to-Model — ZeroOps for AI.
          </p>
        </div>
        <div style={{display:"flex",gap:64,flexWrap:"wrap"}}>
          <Col title="Catalog">
            <FLink href="#" onClick={go("catalog")}>All applications</FLink>
            <FLink href="#" onClick={go("infra")}>Infrastructure</FLink>
            <FLink href="#" onClick={go("solutions")}>Solutions</FLink>
            <FLink href="#" onClick={go("configurator")}>Configurator</FLink>
          </Col>
          <Col title="Project">
            <FLink href="https://docs.k0rdent.io/">Documentation</FLink>
            <FLink href="https://github.com/k0rdent/catalog">GitHub</FLink>
            <FLink href="#" onClick={go("contribute")}>Contribute</FLink>
          </Col>
          <Col title="Enterprise">
            <FLink href="https://www.mirantis.com/support/enterprise-support-options/">Enterprise support</FLink>
            <FLink href="https://www.mirantis.com/">Mirantis</FLink>
          </Col>
        </div>
      </div>
      <div style={{borderTop:"1px solid "+B.border}}>
        <div style={{maxWidth:1440,margin:"0 auto",padding:"20px 40px",display:"flex",justifyContent:"space-between",
          alignItems:"center",flexWrap:"wrap",gap:16}}>
          <span style={{fontSize:12,color:B.textDim}}>Application Catalog · originated by Mirantis</span>
          <div style={{display:"flex",gap:20}}>
            <span style={{fontSize:12,color:B.textDim}}>Privacy Policy</span>
            <span style={{fontSize:12,color:B.textDim}}>Terms of Use</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
