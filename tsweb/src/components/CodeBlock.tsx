import React, { useState } from 'react';
import { B } from '../constants';

export function CodeBlock({ text }) {
  var [copied, setCopied] = useState(false);
  function doCopy() {
    if (navigator.clipboard) navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(function(){ setCopied(false); }, 1500);
  }
  return (
    <div style={{position:"relative",marginBottom:8}}>
      <pre style={{background:B.bg2,border:"1px solid "+B.border,borderRadius:7,padding:"12px 14px",fontSize:11,color:B.code,fontFamily:"monospace",lineHeight:1.6,overflowX:"auto",margin:0,whiteSpace:"pre"}}>{text}</pre>
      <button onClick={doCopy} style={{position:"absolute",top:6,right:6,background:copied?B.green+"30":B.bg2,border:"1px solid "+B.borderHi,borderRadius:5,padding:"2px 8px",fontSize:9.5,color:copied?B.green:B.textSec,cursor:"pointer",fontFamily:"inherit"}}>{copied?"Copied":"Copy"}</button>
    </div>
  );
}
