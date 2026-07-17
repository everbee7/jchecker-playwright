const TRACKING=new Set(["utm_source","utm_medium","utm_campaign","utm_term","utm_content","utm_id","src","source","fbclid","gclid"]);
export function normalizeUrl(value:string):string {
  const url=new URL(value.trim());
  url.hash="";
  url.hostname=url.hostname.toLowerCase();
  for(const key of [...url.searchParams.keys()]) if(TRACKING.has(key.toLowerCase())) url.searchParams.delete(key);
  url.searchParams.sort();
  if((url.protocol==="https:"&&url.port==="443")||(url.protocol==="http:"&&url.port==="80")) url.port="";
  if(url.pathname.length>1) url.pathname=url.pathname.replace(/\/+$/,"");
  return url.toString();
}
