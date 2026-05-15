export function assertSupabasePublicArtworkUrl(urlStr: string) {
  const supabaseBase = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  if (!supabaseBase) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL is not set");
  }
  let url: URL;
  let base: URL;
  try {
    url = new URL(urlStr);
    base = new URL(supabaseBase);
  } catch {
    throw new Error("Invalid artwork URL");
  }
  if (url.protocol !== "https:") {
    throw new Error("Artwork URL must use HTTPS");
  }
  if (url.hostname !== base.hostname || !base.hostname) {
    throw new Error("Artwork URL must be hosted on the configured Supabase project");
  }
  if (!url.pathname.includes("/storage/v1/object/public/")) {
    throw new Error("Artwork URL must be a public Supabase Storage object");
  }
}
