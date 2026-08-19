import React from 'react';
import { B, GRAD } from '../constants';


var TABS = [
  {id:"catalog",label:"Catalog"},
  {id:"infra",label:"Infrastructure"},
  {id:"solutions",label:"Solutions"},
  {id:"configurator",label:"Configurator"},
  {id:"howto",label:"How to"},
];

// Ghost icon button used for the theme toggle and the GitHub link.
function iconBtnStyle():any {
  return {display:"inline-flex",alignItems:"center",justifyContent:"center",flex:"none",
    width:38,height:38,border:"2px solid "+B.textPri,borderRadius:"50%",background:"none",
    color:B.textPri,cursor:"pointer",padding:0,textDecoration:"none",
    transition:"background 160ms ease"};
}

export function Nav({ view, versions, k0rdentVer, onVersionChange, dark, toggleTheme, onNavigate }:any) {
  // Navigation is owned by App so it can also clear any open detail page.
  function navTo(v:string) { onNavigate(v); }
  var displayVer = k0rdentVer || versions.latest || "";
  function hoverBg(e:any){ e.currentTarget.style.background = B.hover; }
  function clearBg(e:any){ e.currentTarget.style.background = "none"; }

  return (
    <header style={{position:"sticky",top:0,zIndex:100,background:B.header,backdropFilter:"blur(8px)",WebkitBackdropFilter:"blur(8px)",borderBottom:"1px solid "+B.border}}>
      <div className="k0-nav-inner" style={{maxWidth:1440,margin:"0 auto",padding:"0 40px",height:80,display:"flex",alignItems:"center",gap:18}}>
        <div className="k0-nav-brand" onClick={function(){navTo("catalog");}} style={{flex:"none",display:"flex",alignItems:"baseline",gap:12,cursor:"pointer"}}>
          <span style={{fontSize:26,fontWeight:800,letterSpacing:"-0.02em",color:B.textPri}}>
            k<span style={{backgroundImage:B.gradText,WebkitBackgroundClip:"text",backgroundClip:"text",color:"transparent"}}>0</span>rdent
          </span>
        </div>

        <nav className="k0-nav-tabs" style={{flex:"0 1 auto",display:"flex",alignItems:"center",gap:16,marginLeft:2}}>
          {TABS.map(function(t){
            var active = view === t.id;
            return <button key={t.id} onClick={function(){navTo(t.id);}}
              onMouseEnter={function(e){ if(!active) e.currentTarget.style.color = B.textPri; }}
              onMouseLeave={function(e){ if(!active) e.currentTarget.style.color = B.textMut; }}
              style={{background:"none",border:"none",padding:"4px 0",cursor:"pointer",fontFamily:"inherit",
                fontSize:13,fontWeight:800,textTransform:"uppercase",letterSpacing:"0.08em",
                color:active?B.textPri:B.textMut,
                borderBottom:"2px solid "+(active?"transparent":"transparent"),
                backgroundImage:active?B.gradText:"none",
                WebkitBackgroundClip:active?"text":"border-box",
                backgroundClip:active?"text":"border-box",
                WebkitTextFillColor:active?"transparent":"currentColor"}}>{t.label}</button>;
          })}
        </nav>

        {versions.versions.length > 0 && (
          <select value={displayVer} onChange={function(e:any){onVersionChange(e.target.value);}}
            className="k0-nav-ver" title="k0rdent version"
            style={{flex:"none",padding:"5px 8px 4px",fontSize:11,background:B.tile,color:B.textSec,
              border:"1px solid "+B.border,borderRadius:4,cursor:"pointer",
              fontFamily:"'Fira Mono',ui-monospace,Menlo,monospace",outline:"none"}}>
            {versions.versions.slice().reverse().map(function(v:string){
              return <option key={v} value={v} style={{background:B.tile,color:B.textPri}}>{v}{v===versions.latest?" (latest)":""}</option>;
            })}
          </select>
        )}

        <div style={{flex:1}}/>

        <button onClick={toggleTheme} title={dark?"Switch to light theme":"Switch to dark theme"}
          onMouseEnter={hoverBg} onMouseLeave={clearBg} style={iconBtnStyle()}>
          {dark
            ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg>
            : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="4.2"/><path d="M12 2v2.6M12 19.4V22M2 12h2.6M19.4 12H22M4.9 4.9l1.9 1.9M17.2 17.2l1.9 1.9M19.1 4.9l-1.9 1.9M6.8 17.2l-1.9 1.9"/></svg>}
        </button>

        <a href="https://github.com/k0rdent/catalog" target="_blank" rel="noreferrer" title="GitHub"
          onMouseEnter={hoverBg} onMouseLeave={clearBg} style={iconBtnStyle()}>
          <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.58 2 12.25c0 4.53 2.87 8.37 6.84 9.73.5.09.68-.22.68-.49l-.01-1.9c-2.78.62-3.37-1.22-3.37-1.22-.45-1.18-1.11-1.5-1.11-1.5-.91-.64.07-.62.07-.62 1 .07 1.53 1.06 1.53 1.06.89 1.56 2.34 1.11 2.91.85.09-.66.35-1.11.63-1.37-2.22-.26-4.56-1.14-4.56-5.06 0-1.12.39-2.03 1.03-2.75-.1-.26-.45-1.3.1-2.71 0 0 .84-.28 2.75 1.05a9.34 9.34 0 0 1 5 0c1.91-1.33 2.75-1.05 2.75-1.05.55 1.41.2 2.45.1 2.71.64.72 1.03 1.63 1.03 2.75 0 3.93-2.34 4.79-4.57 5.05.36.32.68.94.68 1.9l-.01 2.82c0 .27.18.59.69.49A10.03 10.03 0 0 0 22 12.25C22 6.58 17.52 2 12 2z"/></svg>
        </a>

        <button onClick={function(){navTo("contribute");}}
          onMouseEnter={function(e){ e.currentTarget.style.filter = "brightness(1.08)"; }}
          onMouseLeave={function(e){ e.currentTarget.style.filter = "none"; }}
          className="k0-nav-cta"
          style={{flex:"none",display:"inline-flex",alignItems:"center",padding:"10px 22px 7px",
            border:"2px solid #000",borderRadius:20,background:GRAD,color:"#000",
            fontSize:13,fontWeight:900,textTransform:"uppercase",letterSpacing:"0.06em",
            cursor:"pointer",fontFamily:"inherit"}}>Contribute</button>
      </div>
    </header>
  );
}
