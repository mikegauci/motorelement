import { printifyFetch } from "./client";

export interface PrintifyUploadResult {
  id: string;
  file_name?: string;
  height?: number;
  width?: number;
  mime_type?: string;
  preview_url?: string;
}

export async function uploadPrintifyImageByUrl(opts: {
  file_name: string;
  url: string;
}): Promise<PrintifyUploadResult> {
  return printifyFetch<PrintifyUploadResult>("/uploads/images.json", {
    method: "POST",
    body: JSON.stringify({
      file_name: opts.file_name,
      url: opts.url,
    }),
  });
}

export async function uploadPrintifyImageByBase64(opts: {
  file_name: string;
  contents: string;
}): Promise<PrintifyUploadResult> {
  return printifyFetch<PrintifyUploadResult>("/uploads/images.json", {
    method: "POST",
    body: JSON.stringify({
      file_name: opts.file_name,
      contents: opts.contents,
    }),
  });
}
