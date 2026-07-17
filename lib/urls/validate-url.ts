import { isIP } from "node:net";
const BLOCKED_HOSTS=new Set(["localhost","localhost.localdomain","0.0.0.0"]);
function privateIp(host:string):boolean {
  const version=isIP(host);
  if(version===4){const [a,b]=host.split(".").map(Number);return a===10||a===127||a===0||(a===169&&b===254)||(a===172&&b>=16&&b<=31)||(a===192&&b===168)||(a===100&&b>=64&&b<=127);}
  if(version===6){const value=host.toLowerCase();return value==="::1"||value==="::"||value.startsWith("fc")||value.startsWith("fd")||value.startsWith("fe80:");}
  return false;
}
export function validatePublicUrl(value:string):{valid:true;url:URL}|{valid:false;reason:string}{
  try{const url=new URL(value);if(!["http:","https:"].includes(url.protocol))return{valid:false,reason:"Only HTTP(S) URLs are allowed"};const host=url.hostname.replace(/^\[|\]$/g,"").toLowerCase();if(BLOCKED_HOSTS.has(host)||host.endsWith(".localhost")||host.endsWith(".local")||privateIp(host))return{valid:false,reason:"Internal network URLs are not allowed"};if(!host.includes(".")&&!isIP(host))return{valid:false,reason:"Invalid hostname"};return{valid:true,url};}catch{return{valid:false,reason:"Invalid URL"};}
}
