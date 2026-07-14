export type RemoteStatus = "remote" | "hybrid" | "onsite" | "unknown";
export type ScrapingMethod = "json-ld" | "provider-parser" | "html" | "playwright";
export interface ScrapedJob { url:string; normalizedUrl:string; source:string; title:string|null; company:string|null; location:string|null; remoteStatus:RemoteStatus; employmentType:string|null; salary:string|null; descriptionText:string; descriptionHtml:string|null; datePosted:string|null; validThrough:string|null; scrapingMethod:ScrapingMethod; finalUrl:string; }
export interface ScrapeContext { url:URL; html:string; finalUrl:string; normalizedUrl:string; }
export interface JobScraper { canHandle(url:URL):boolean; scrape(context:ScrapeContext):Promise<ScrapedJob>; }
export interface FetchedPage { html:string; finalUrl:string; status:number; }
