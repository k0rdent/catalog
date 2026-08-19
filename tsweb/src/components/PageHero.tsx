import React from 'react';
import { B, GRAD } from '../constants';

// Shared page masthead: gradient wash into the page, a gradient rule + eyebrow,
// an oversized headline, and an optional hairline grid of counts on the right.
// Every top-level view uses this so the site reads as one system.
export function PageHero({ eyebrow, title, lede, stats, children }:{
  eyebrow:string, title:any, lede?:any,
  stats?:Array<{n:any,l:string,grad?:boolean}>, children?:any
}) {
  return (
    <section style={{background:"linear-gradient(180deg,"+B.bg0+" 0%,"+B.panel+" 100%)",borderBottom:"1px solid "+B.border}}>
      <div className="k0-hero" style={{maxWidth:1440,margin:"0 auto",padding:"44px 40px 32px",
        display:"grid",gridTemplateColumns:stats&&stats.length?"minmax(0,1fr) minmax(0,0.7fr)":"minmax(0,1fr)",
        gap:64,alignItems:"start"}}>
        <div style={{display:"flex",flexDirection:"column",gap:16}}>
          <div style={{display:"flex",alignItems:"center",gap:12}}>
            <span style={{width:32,height:2,background:GRAD}}/>
            <span style={{fontSize:12,fontWeight:800,textTransform:"uppercase",letterSpacing:"0.12em",color:B.textPri}}>{eyebrow}</span>
          </div>
          <h1 style={{margin:0,fontSize:40,lineHeight:"44px",fontWeight:700,letterSpacing:"-0.01em",color:B.textPri,maxWidth:"28ch",textWrap:"pretty"}}>{title}</h1>
          {lede&&<p style={{margin:0,fontSize:15,lineHeight:"24px",color:B.textSec,maxWidth:"78ch",textWrap:"pretty"}}>{lede}</p>}
        </div>
        {stats&&stats.length>0&&(
          <div className="k0-stats-row" style={{display:"grid",gridTemplateColumns:stats.length>2?"1fr 1fr":"1fr",gap:1,background:B.border,border:"1px solid "+B.border}}>
            {stats.map(function(s,si){
              var spans = stats.length>2 && si===stats.length-1 && stats.length%2===1;
              return <div key={s.l} style={{background:B.bg0,padding:"18px 20px",display:"flex",flexDirection:"column",gap:4,gridColumn:spans?"1 / -1":"auto"}}>
                <span style={Object.assign({fontSize:34,lineHeight:1,fontWeight:800,letterSpacing:"-0.02em"},
                  s.grad?{backgroundImage:B.gradText,WebkitBackgroundClip:"text",backgroundClip:"text",color:"transparent"}:{color:B.textPri})}>{s.n}</span>
                <span style={{fontSize:12,fontWeight:800,textTransform:"uppercase",letterSpacing:"0.12em",color:B.textMut}}>{s.l}</span>
              </div>;
            })}
          </div>
        )}
      </div>
      {children&&<div style={{maxWidth:1440,margin:"0 auto",padding:"0 40px 32px"}}>{children}</div>}
    </section>
  );
}

// Pill filter used under the heroes on Solutions and Infrastructure.
export function FilterPill({ label, active, color, onClick }:{label:string,active:boolean,color?:string,onClick:()=>void}) {
  var ac = color || B.textPri;
  return <button onClick={onClick}
    onMouseEnter={function(e:any){ if(!active) e.currentTarget.style.background=B.hover; }}
    onMouseLeave={function(e:any){ if(!active) e.currentTarget.style.background="none"; }}
    style={{padding:"9px 18px 7px",border:"2px solid "+(active?ac:B.border),borderRadius:20,
      background:active?ac+"18":"none",color:active?ac:B.textSec,
      fontSize:12,fontWeight:800,textTransform:"uppercase",letterSpacing:"0.06em",
      cursor:"pointer",fontFamily:"inherit",transition:"background 160ms ease"}}>{label}</button>;
}
