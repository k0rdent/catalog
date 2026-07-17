import React from 'react';
import { B } from '../constants';

export function ScanVersionPicker({ allVersions, effectiveVer, setSelVer }:any) {
  return (
    <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:16}}>
      <span style={{fontSize:12,color:B.textSec}}>Version:</span>
      <select value={effectiveVer} onChange={function(e:any){setSelVer(e.target.value);}} style={{padding:"5px 9px",border:"1px solid "+B.borderHi,borderRadius:5,background:B.bg3,color:B.textPri,fontSize:12,outline:"none",cursor:"pointer",fontFamily:"monospace"}}>
        {allVersions.map(function(v:string){return <option key={v} value={v}>{v}</option>;})}
      </select>
    </div>
  );
}
