import { extractUrls } from "@/lib/urls/extract-urls";import { apiError,extractLinksSchema } from "@/lib/validation/schemas";
export async function POST(request:Request){try{const {text}=extractLinksSchema.parse(await request.json());return Response.json(extractUrls(text));}catch(error){return apiError(error);}}
