import React, { useEffect } from 'react';
import { B, IS_DARK } from '../constants';

export function HtmlWithCopy({ html, style }:{ html:string, style?:any }) {
  var ref = React.useRef<HTMLDivElement>(null);
  useEffect(function(){
    if (!ref.current) return;
    var pres = ref.current.querySelectorAll("pre");
    pres.forEach(function(pre:HTMLPreElement){
      pre.style.position = "relative";
      pre.style.background = B.bg2;
      pre.style.border = "1px solid " + B.border;
      pre.style.borderRadius = "7px";
      pre.style.padding = "12px 14px";
      pre.style.fontSize = "11px";
      pre.style.fontFamily = "monospace";
      pre.style.lineHeight = "1.6";
      pre.style.overflowX = "auto";
      pre.style.whiteSpace = "pre";
      pre.style.margin = "0 0 8px 0";
      // Update existing copy button styles or create new one
      var existingBtn = pre.querySelector(".copy-btn") as HTMLButtonElement|null;
      if (existingBtn) {
        existingBtn.style.background = B.bg2;
        existingBtn.style.borderColor = B.borderHi;
        existingBtn.style.color = B.textSec;
        return;
      }
      var btn = document.createElement("button");
      btn.className = "copy-btn";
      btn.textContent = "Copy";
      btn.style.cssText = "position:absolute;top:6px;right:6px;background:"+B.bg2+";border:1px solid "+B.borderHi+";border-radius:5px;padding:2px 8px;font-size:9.5px;color:"+B.textSec+";cursor:pointer;font-family:inherit;";
      btn.onclick = function(){
        var code = pre.querySelector("code");
        var text = code ? code.textContent || "" : pre.textContent || "";
        if (navigator.clipboard) navigator.clipboard.writeText(text);
        btn.textContent = "Copied";
        btn.style.color = B.green;
        btn.style.background = B.green + "30";
        setTimeout(function(){ btn.textContent = "Copy"; btn.style.color = B.textSec; btn.style.background = B.bg2; }, 1500);
      };
      pre.appendChild(btn);
    });
    // Syntax highlighting
    if ((window as any).hljs) {
      ref.current.querySelectorAll("pre code").forEach(function(block:any){
        delete block.dataset.highlighted;
        (window as any).hljs.highlightElement(block);
      });
    }
  }, [html, IS_DARK]);
  return <div ref={ref} style={style} dangerouslySetInnerHTML={{__html:html}}/>;
}
