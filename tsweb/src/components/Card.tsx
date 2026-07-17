import React from 'react';
import { B, SUPPORT_STYLE, SUPPORT_LABEL, COMPLIANCE, tagAccent } from '../constants';
import { getEff } from '../utils';
import { AppLogo } from './AppLogo';

export function Card({ item, onOpen }) {
  var eff = getEff(item);
  var ss = SUPPORT_STYLE[eff];
  var accent = tagAccent(item.tags[0]||"Other");
  var compTags = COMPLIANCE[item.name]||[];
  var isCert = eff==="mirantis-certified";
  var initials = "";
  var parts = item.name.replace(/-/g," ").split(" ");
  for(var pi=0;pi<Math.min(2,parts.length);pi++) initials+=parts[pi][0].toUpperCase();
  return (
    <div onClick={onOpen}
      onMouseEnter={function(e){e.currentTarget.style.borderColor=B.teal+"80";e.currentTarget.style.boxShadow="0 0 18px "+B.teal+"18";e.currentTarget.style.transform="translateY(-1px)";}}
      onMouseLeave={function(e){e.currentTarget.style.borderColor=isCert?B.teal+"30":B.border;e.currentTarget.style.boxShadow=isCert?"0 0 10px "+B.teal+"10":"none";e.currentTarget.style.transform="none";}}
      style={{background:B.bg1,border:"1px solid "+(isCert?B.teal+"30":B.border),borderRadius:10,padding:"13px",display:"flex",flexDirection:"column",cursor:"pointer",position:"relative",overflow:"hidden",transition:"border-color 0.15s,box-shadow 0.15s,transform 0.15s"}}
    >
      {isCert&&<div style={{position:"absolute",top:0,left:0,right:0,height:2,background:"linear-gradient(90deg,"+B.teal+","+B.cyan+")"}}/>}
      <div style={{display:"flex",gap:9,alignItems:"flex-start"}}>
        <AppLogo name={item.name} size={32} accent={accent} logo={item.logo} brandColor={item.brandColor}/>
        <div style={{flex:1,minWidth:0}}>
          <div style={{display:"flex",alignItems:"center",gap:5,flexWrap:"wrap"}}>
            <span style={{fontWeight:600,fontSize:14,color:B.textPri}}>{item.title||item.name}</span>
            <span style={{fontSize:8.5,padding:"1px 5px",borderRadius:3,background:ss.bg,color:ss.text,border:"1px solid "+ss.border,fontWeight:600,textTransform:"uppercase"}}>{SUPPORT_LABEL[eff]}</span>
          </div>
          <div style={{display:"flex",gap:4,marginTop:3,flexWrap:"wrap"}}>
            {item.tags.slice(0,2).map(function(t){return <span key={t} style={{fontSize:9,padding:"1px 5px",borderRadius:3,background:tagAccent(t)+"15",color:tagAccent(t),fontWeight:500,border:"1px solid "+tagAccent(t)+"25"}}>{t}</span>;})}
            <span style={{fontSize:8.5,color:B.textMut,fontFamily:"monospace"}}>{item.version}</span>
          </div>
        </div>
      </div>
      <p style={{fontSize:13,color:B.textSec,marginTop:8,paddingBottom:2,lineHeight:1.6,display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical",overflow:"hidden",flex:1,textAlign:"justify"}}>{item.desc}</p>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginTop:8,paddingTop:7,borderTop:"1px solid "+B.border}}>
        {item.tested&&<span style={{fontSize:9.5,color:B.green}}>{"✓ CI-validated"}</span>}
        <span style={{fontSize:9.5,color:B.teal,fontWeight:500}}>View details</span>
      </div>
    </div>
  );
}
