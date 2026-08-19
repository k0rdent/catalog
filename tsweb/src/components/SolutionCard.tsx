import React from 'react';
import { B, MONO, tagAccent } from '../constants';
import { AppLogo } from './AppLogo';

export function SolutionCard({ sol, onClick }) {
  var bc = tagAccent(sol.category);
  var badgeC = sol.badge==="Validated"?B.green:bc;
  return (
    <div onClick={onClick}
      onMouseEnter={function(e){e.currentTarget.style.borderColor=B.textMut;e.currentTarget.style.background=B.tile;}}
      onMouseLeave={function(e){e.currentTarget.style.borderColor=B.border;e.currentTarget.style.background=B.card;}}
      style={{background:B.card,border:"1px solid "+B.border,borderRadius:8,overflow:"hidden",cursor:"pointer",position:"relative",transition:"border-color 160ms ease, background 160ms ease"}}
    >
      <div style={{height:2,background:"linear-gradient(90deg,"+bc+","+bc+"40)"}}/>
      <div style={{padding:"20px 22px 18px"}}>
        <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",gap:10,marginBottom:10}}>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            {sol.logo ? <AppLogo name={sol.appName||""} size={38} accent={bc} logo={sol.logo}/> : <div style={{width:38,height:38,borderRadius:9,background:bc+"18",border:"1px solid "+bc+"30",display:"flex",alignItems:"center",justifyContent:"center",fontSize:17,color:bc,flexShrink:0}}>{sol.icon}</div>}
            <div>
              <div style={{fontSize:17,lineHeight:"22px",fontWeight:700,color:B.textPri}}>{sol.title}{sol.beta&&<span style={{fontSize:8,marginLeft:5,padding:"1px 4px",borderRadius:3,background:B.amber+"20",color:B.amber,fontWeight:700,textTransform:"uppercase",verticalAlign:"super"}}>Beta</span>}</div>
              <div style={{fontSize:12,lineHeight:"17px",color:B.textDim,marginTop:3}}>{sol.tagline}</div>
              <div style={{marginTop:3}}><span style={{fontSize:11,fontWeight:800,textTransform:"uppercase",letterSpacing:"0.1em",padding:"3px 9px 1px",borderRadius:4,color:B.textSec,border:"1px solid "+B.border}}>{sol.category}</span></div>
            </div>
          </div>
          {!sol.beta&&<span style={{fontSize:11,fontWeight:800,textTransform:"uppercase",letterSpacing:"0.08em",color:badgeC,whiteSpace:"nowrap",flexShrink:0}}>{"✓ "+sol.badge}</span>}
        </div>
        <p style={{fontSize:13,color:B.textSec,lineHeight:"20px",margin:"0 0 16px"}}>{sol.desc.slice(0,155)}...</p>
        <div style={{marginBottom:10}}>
          <div style={{fontSize:11,fontWeight:800,letterSpacing:"0.12em",color:B.textDim,textTransform:"uppercase",marginBottom:8}}>Components</div>
          <div style={{display:"flex",flexWrap:"wrap",gap:4}}>
            {sol.components.map(function(c){
              return <span key={c.name} style={{fontSize:11,padding:"3px 8px 1px",borderRadius:4,color:B.textSec,border:"1px solid "+B.border,fontFamily:MONO}}>{c.name}</span>;
            })}
          </div>
        </div>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <div style={{display:"flex",gap:4}}>
            {sol.clouds.slice(0,3).map(function(c){return <span key={c} style={{fontSize:11,color:B.textDim,fontFamily:MONO,borderRadius:4,padding:"3px 8px 1px",border:"1px solid "+B.border}}>{c.replace("AWS ","").replace("Azure ","")}</span>;})}
            {sol.clouds.length>3&&<span style={{fontSize:9,color:B.textMut}}>+{String(sol.clouds.length-3)}</span>}
          </div>
          <span style={{fontSize:11,fontWeight:800,textTransform:"uppercase",letterSpacing:"0.1em",color:B.textMut}}>View solution →</span>
        </div>
      </div>
    </div>
  );
}
