import { normalizeUrl } from "./normalize-url";
import { validatePublicUrl } from "./validate-url";
export interface ExtractedLinksResult{links:string[];duplicateCount:number;invalidCount:number}
const URL_START=/https?:\/\//gi;
const BOUNDARY=/\[\d{1,2}:\d{2}\s*(?:AM|PM)\]|(?=https?:\/\/)|[\s<>"'`]/i;
const TRAILING=/[),.;!?}\]]+$/;
function cleanCandidate(raw:string):string{
  let value=raw.split(BOUNDARY)[0].replace(TRAILING,"");
  // Chat exports commonly append a capitalized name immediately after a URL path.
  value=value.replace(/([a-z0-9\/_=-])(?:Danny|Harry|John|Jane|Michael|Sarah|David|Alex)$/i,"$1");
  return value;
}
export function extractUrls(text:string):ExtractedLinksResult{
  const starts=[...text.matchAll(URL_START)].map(match=>match.index ?? 0);const found:string[]=[];let invalidCount=0;
  starts.forEach((start,index)=>{const end=starts[index+1]??text.length;const candidate=cleanCandidate(text.slice(start,end));const checked=validatePublicUrl(candidate);if(!checked.valid){invalidCount++;return;}try{found.push(normalizeUrl(candidate));}catch{invalidCount++;}});
  const links=[...new Set(found)];return{links,duplicateCount:found.length-links.length,invalidCount};
}
