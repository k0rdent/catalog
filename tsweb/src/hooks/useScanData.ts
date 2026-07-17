import { useState, useEffect } from 'react';
import { dataPrefix } from '../utils';

export function useScanData(itemName:string, k0rdentVer?:string) {
  var [scanData, setScanData] = useState<any>(null);
  var [loading, setLoading] = useState(true);
  var [error, setError] = useState("");
  useEffect(function(){
    setLoading(true); setError("");
    fetch(dataPrefix(k0rdentVer || "") + "apps/" + itemName + "/scan.json?t=" + Date.now())
      .then(function(r){ if (!r.ok) throw new Error("HTTP " + r.status); return r.json(); })
      .then(function(d){ setScanData(d); setLoading(false); })
      .catch(function(e){ setError(String(e)); setLoading(false); });
  }, [itemName]);
  return {scanData, loading, error};
}

export function scanVersions(scanData:any) {
  if (!scanData || !scanData.charts) return [];
  var chartNames = Object.keys(scanData.charts);
  var all:string[] = [];
  for (var ci=0;ci<chartNames.length;ci++){
    var vs = scanData.charts[chartNames[ci]].versions;
    for (var vi=0;vi<vs.length;vi++){
      if (all.indexOf(vs[vi]) === -1) all.push(vs[vi]);
    }
  }
  all.sort(function(a,b){
    var pa=a.split("."), pb=b.split(".");
    for(var i=0;i<Math.max(pa.length,pb.length);i++){
      var na=parseInt(pa[i]||"0"), nb=parseInt(pb[i]||"0");
      if(na!==nb) return nb-na;
    }
    return 0;
  });
  return all;
}
