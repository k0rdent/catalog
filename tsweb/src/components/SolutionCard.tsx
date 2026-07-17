import React from 'react';
import { B, tagAccent } from '../constants';
import { AppLogo } from './AppLogo';

export function SolutionCard({ sol, onClick }) {
  var bc = tagAccent(sol.category);
  var badgeC = sol.badge==="Validated"?B.green:bc;
  return (
    <div onClick={onClick}
      onMouseEnter={function(e){e.currentTarget.style.boxShadow="0 0 20px "+bc+"28";e.currentTarget.style.transform="translateY(-2px)";}}
      onMouseLeave={function(e){e.currentTarget.style.boxShadow="none";e.currentTarget.style.transform="none";}}
      style={{background:B.bg1,border:"1px solid "+B.borderHi,borderRadius:12,overflow:"hidden",cursor:"pointer",position:"relative",transition:"box-shadow 0.15s,transform 0.15s"}}
    >
      <div style={{height:3,background:"linear-gradient(90deg,"+bc+","+bc+"60)"}}/>
      <div style={{padding:"16px 18px"}}>
        <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",gap:10,marginBottom:10}}>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            {sol.logo ? <AppLogo name={sol.appName||""} size={38} accent={bc} logo={sol.logo}/> : <div style={{width:38,height:38,borderRadius:9,background:bc+"18",border:"1px solid "+bc+"30",display:"flex",alignItems:"center",justifyContent:"center",fontSize:17,color:bc,flexShrink:0}}>{sol.icon}</div>}
            <div>
              <div style={{fontSize:13.5,fontWeight:700,color:B.textPri}}>{sol.title}{sol.beta&&<span style={{fontSize:8,marginLeft:5,padding:"1px 4px",borderRadius:3,background:B.amber+"20",color:B.amber,fontWeight:700,textTransform:"uppercase",verticalAlign:"super"}}>Beta</span>}</div>
              <div style={{fontSize:10,color:B.textMut,marginTop:1}}>{sol.tagline}</div>
              <div style={{marginTop:3}}><span style={{fontSize:9,padding:"1px 5px",borderRadius:3,background:bc+"15",color:bc,fontWeight:500,border:"1px solid "+bc+"25"}}>{sol.category}</span></div>
            </div>
          </div>
          {!sol.beta&&<span style={{fontSize:9.5,color:badgeC,whiteSpace:"nowrap",flexShrink:0}}>{"✓ "+sol.badge}</span>}
        </div>
        <p style={{fontSize:11.5,color:B.textSec,lineHeight:1.6,margin:"0 0 11px"}}>{sol.desc.slice(0,155)}...</p>
        <div style={{marginBottom:10}}>
          <div style={{fontSize:9,color:B.textMut,textTransform:"uppercase",marginBottom:5}}>Components</div>
          <div style={{display:"flex",flexWrap:"wrap",gap:4}}>
            {sol.components.map(function(c){
              return <span key={c.name} style={{fontSize:9.5,padding:"1px 7px",borderRadius:4,background:bc+"12",color:bc,border:"1px solid "+bc+"25",fontWeight:500,fontFamily:"monospace"}}>{c.name}</span>;
            })}
          </div>
        </div>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <div style={{display:"flex",gap:4}}>
            {sol.clouds.slice(0,3).map(function(c){return <span key={c} style={{fontSize:9,color:B.textMut,background:B.bg3,borderRadius:3,padding:"1px 5px",border:"1px solid "+B.border}}>{c.replace("AWS ","").replace("Azure ","")}</span>;})}
            {sol.clouds.length>3&&<span style={{fontSize:9,color:B.textMut}}>+{String(sol.clouds.length-3)}</span>}
          </div>
          <span style={{fontSize:10,color:bc,fontWeight:600}}>View solution</span>
        </div>
      </div>
    </div>
  );
}
