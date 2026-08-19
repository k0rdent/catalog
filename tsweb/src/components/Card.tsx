import React from 'react';
import { B, GRAD, MONO, SUPPORT_LABEL, tagAccent } from '../constants';
import { getEff } from '../utils';
import { AppLogo } from './AppLogo';

// Tier mark: certified gets the gradient dot, partner an outlined chip,
// community stays quiet — the same hierarchy used in the tier legend.
function TierMark({ eff }:{eff:string}) {
  if (eff === "mirantis-certified") {
    return <span style={{display:"inline-flex",alignItems:"center",gap:8,fontSize:11,fontWeight:800,textTransform:"uppercase",letterSpacing:"0.1em",color:B.teal}}>
      <span style={{width:7,height:7,borderRadius:"50%",background:GRAD}}/>{SUPPORT_LABEL["mirantis-certified"]}
    </span>;
  }
  if (eff === "partner") {
    return <span style={{alignSelf:"flex-start",fontSize:11,fontWeight:800,textTransform:"uppercase",letterSpacing:"0.1em",color:B.textPri,border:"1px solid "+B.textMut,borderRadius:4,padding:"3px 8px 1px"}}>{SUPPORT_LABEL.partner}</span>;
  }
  return <span style={{fontSize:11,fontWeight:800,textTransform:"uppercase",letterSpacing:"0.1em",color:B.textDim}}>{SUPPORT_LABEL.community}</span>;
}

export function Card({ item, onOpen }) {
  var eff = getEff(item);
  var cat = item.tags && item.tags.length ? item.tags[0] : "Other";
  var accent = tagAccent(cat);
  // Upstream org reads as the publisher; fall back to the catalog id.
  var publisher = item.githubRepo ? String(item.githubRepo).split("/")[0] : item.name;
  var version = String(item.version || "").replace(/^v/, "");
  return (
    <div onClick={onOpen}
      onMouseEnter={function(e){e.currentTarget.style.borderColor=B.textMut;e.currentTarget.style.background=B.tile;}}
      onMouseLeave={function(e){e.currentTarget.style.borderColor=B.border;e.currentTarget.style.background=B.card;}}
      style={{position:"relative",display:"flex",flexDirection:"column",gap:14,padding:"20px 20px 18px",
        background:B.card,border:"1px solid "+B.border,borderRadius:8,cursor:"pointer",
        transition:"border-color 160ms ease, background 160ms ease"}}
    >
      <div style={{display:"flex",alignItems:"flex-start",gap:14}}>
        <AppLogo name={item.name} size={42} accent={accent} logo={item.logo} brandColor={item.brandColor}/>
        <div style={{flex:1,minWidth:0,display:"flex",flexDirection:"column",gap:3,paddingTop:2}}>
          <span style={{fontSize:17,lineHeight:"22px",fontWeight:700,color:B.textPri,overflowWrap:"anywhere"}}>{item.title||item.name}</span>
          <span style={{fontSize:11,fontWeight:800,textTransform:"uppercase",letterSpacing:"0.1em",color:B.textDim,overflowWrap:"anywhere"}}>{publisher}</span>
        </div>
      </div>

      <p style={{margin:0,fontSize:13,lineHeight:"20px",color:B.textSec,textWrap:"pretty",
        display:"-webkit-box",WebkitLineClamp:3,WebkitBoxOrient:"vertical",overflow:"hidden"}}>{item.desc}</p>

      <div style={{marginTop:"auto",paddingTop:8,display:"flex",flexDirection:"column",gap:12}}>
        <div style={{display:"flex",alignItems:"center",gap:10,flexWrap:"wrap"}}>
          <TierMark eff={eff}/>
          {item.tested&&<span style={{fontSize:11,fontWeight:700,color:B.textMut,letterSpacing:"0.04em"}}>{"✓ CI-validated"}</span>}
        </div>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:"8px 12px",borderTop:"1px solid "+B.border,paddingTop:12}}>
          <span style={{fontSize:11,fontWeight:800,textTransform:"uppercase",letterSpacing:"0.1em",color:B.textSec,padding:"4px 10px 2px",border:"1px solid "+B.border,borderRadius:4}}>{cat}</span>
          {version&&<span style={{fontFamily:MONO,fontSize:12,color:B.textDim}}>v{version}</span>}
        </div>
      </div>
    </div>
  );
}
