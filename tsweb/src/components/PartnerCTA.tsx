import React from 'react';
import { B, GRAD } from '../constants';

// "Become a partner" band — the last block above the footer on the index
// pages (catalog, solutions, infrastructure). Hairline panel over a 104deg
// wash, oversized headline, gradient primary CTA into the contribute page.
export function PartnerCTA({ href, onContribute }:{ href:string, onContribute:()=>void }) {
  return (
    <section className="k0-partner" style={{maxWidth:1440,margin:"0 auto",padding:"120px 40px 0"}}>
      <div className="k0-partner-panel" style={{border:"1px solid "+B.border,
        background:"linear-gradient(104deg,"+B.bg0+" 25%,"+B.panelHi+" 100%)",
        padding:"64px 56px",display:"flex",alignItems:"center",justifyContent:"space-between",
        gap:56,flexWrap:"wrap"}}>
        <div className="k0-partner-copy" style={{flex:1,minWidth:340,display:"flex",flexDirection:"column",gap:16}}>
          <span style={{fontSize:14,fontWeight:800,textTransform:"uppercase",letterSpacing:"0.12em",color:B.textMut}}>For partners</span>
          <h2 style={{margin:0,fontSize:40,lineHeight:"44px",fontWeight:700,color:B.textPri,maxWidth:"24ch",textWrap:"pretty"}}>
            List your product where platform teams are already shopping.
          </h2>
          <p style={{margin:0,fontSize:16,lineHeight:"26px",color:B.textSec,maxWidth:"58ch"}}>
            Ship a Helm chart and a ServiceTemplate manifest. Mirantis validates it against the current k0rdent release and publishes it as verified.
          </p>
        </div>
        <a href={href} onClick={function(e:any){e.preventDefault();onContribute();}}
          onMouseEnter={function(e:any){e.currentTarget.style.filter="brightness(1.08)";}}
          onMouseLeave={function(e:any){e.currentTarget.style.filter="none";}}
          style={{flex:"none",display:"inline-flex",alignItems:"center",padding:"18px 40px 14px",
            border:"2px solid #000",borderRadius:40,background:GRAD,color:"#000",fontSize:14,fontWeight:900,
            textTransform:"uppercase",letterSpacing:"0.06em",textDecoration:"none",
            boxShadow:"0 4px 4px rgba(0,0,0,0.25)"}}>Become a partner</a>
      </div>
    </section>
  );
}
