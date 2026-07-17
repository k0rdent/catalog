import React from 'react';
import { B, BRAND_COLORS, LOGO_CACHE, getLogoUrl } from '../constants';
import { BASE } from '../utils';

export function AppLogo({ name, size, accent, logo, brandColor, isInfra }:{ name:string, size?:number, accent?:string, logo?:string, brandColor?:string, isInfra?:boolean }) {
  var sz = size || 32;
  var [svgContent, setSvgContent] = React.useState(LOGO_CACHE[name] || null);
  var [failed, setFailed] = React.useState(false);
  var color = brandColor || BRAND_COLORS[name] || accent || "#7a8aaa";
  var bg = "#ffffff";
  var logoBorder = isInfra && brandColor ? "2px solid " + brandColor : "none";
  var border = color + "30";

  // If catalog data provides a logo URL, use it directly as an <img>
  if (logo) {
    var logoSrc = logo.startsWith("http") ? logo : BASE + logo;
    return (
      <div style={{width:sz,height:sz,borderRadius:sz>36?9:7,background:bg,border:logoBorder,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,padding:sz>36?5:3,boxSizing:"border-box"}}>
        <img src={logoSrc} alt={name} style={{width:sz-10,height:sz-10,objectFit:"contain"}} />
      </div>
    );
  }

  // Fallback: fetch from SimpleIcons CDN
  React.useEffect(function() {
    if (svgContent || failed) return;
    var url = getLogoUrl(name);
    if (!url) { setFailed(true); return; }
    if (LOGO_CACHE[name]) { setSvgContent(LOGO_CACHE[name]); return; }
    fetch(url)
      .then(function(r) { return r.ok ? r.text() : Promise.reject(); })
      .then(function(txt) {
        var filled = txt.replace(/(<svg[^>]*)(>)/, function(m, p1, p2) {
          if (p1.indexOf("fill") === -1) return p1 + ' fill="' + color + '"' + p2;
          return m;
        });
        LOGO_CACHE[name] = filled;
        setSvgContent(filled);
      })
      .catch(function() { setFailed(true); });
  }, [name]);

  var parts = name.replace(/-/g," ").split(" ");
  var initials = "";
  for (var pi=0;pi<Math.min(2,parts.length);pi++) initials+=parts[pi][0].toUpperCase();

  if (svgContent && !failed) {
    return (
      <div style={{width:sz,height:sz,borderRadius:sz>36?9:7,background:bg,border:logoBorder,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,padding:sz>36?7:5,boxSizing:"border-box"}}
        dangerouslySetInnerHTML={{__html:svgContent.replace(/width="[^"]*"/, 'width="'+(sz-10)+'"').replace(/height="[^"]*"/, 'height="'+(sz-10)+'"')}}
      />
    );
  }

  return (
    <div style={{width:sz,height:sz,borderRadius:sz>36?9:7,background:bg,border:logoBorder,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,fontSize:sz>36?13:11,fontWeight:700,color:color,fontFamily:"monospace"}}>
      {initials}
    </div>
  );
}
