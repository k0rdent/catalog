import React, { useState, useEffect } from 'react';
import { B } from '../constants';
import { BASE } from '../utils';
import { HtmlWithCopy } from './HtmlWithCopy';

export function ContributePage() {
  var [html, setHtml] = useState("");
  var [loading, setLoading] = useState(true);
  useEffect(function(){
    fetch(BASE + "contribute.json?t=" + Date.now())
      .then(function(r){ return r.ok ? r.json() : null; })
      .then(function(d){ if (d && d.contentHtml) setHtml(d.contentHtml); setLoading(false); })
      .catch(function(){ setLoading(false); });
  }, []);
  return (
    <div style={{maxWidth:860,margin:"0 auto",padding:"30px 20px 0"}}>
      {loading ? <div style={{color:B.textSec,fontSize:13}}>Loading...</div>
        : html ? <HtmlWithCopy html={html} style={{fontSize:14,color:B.textSec,lineHeight:1.8}}/>
        : <div style={{color:B.textMut,fontSize:13}}>Contribute page not available.</div>
      }
    </div>
  );
}
