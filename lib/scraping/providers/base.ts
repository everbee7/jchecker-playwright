import type { JobScraper,ScrapeContext,ScrapedJob } from "@/types/scraping";
import { extractGeneric } from "../extract-generic";
export class ProviderScraper implements JobScraper{constructor(private domains:string[],private provider:string){}canHandle(url:URL){return this.domains.some(domain=>url.hostname.includes(domain));}async scrape(context:ScrapeContext):Promise<ScrapedJob>{const job=extractGeneric(context);return{...job,source:this.provider,scrapingMethod:"provider-parser"};}}
