const BASE_URL = "https://api.printify.com/v1";

function getApiKey(): string {
  const key = process.env.PRINTIFY_API_KEY;
  if (!key) throw new Error("PRINTIFY_API_KEY is not set");
  return key;
}

function getShopId(): string {
  const id = process.env.PRINTIFY_SHOP_ID;
  if (!id) throw new Error("PRINTIFY_SHOP_ID is not set");
  return id;
}

export async function printifyFetch<T = unknown>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${BASE_URL}${path}`;
  const headers: Record<string, string> = {
    Authorization: `Bearer ${getApiKey()}`,
    "Content-Type": "application/json",
    "User-Agent": "MotorElement/1.0",
    ...(options.headers as Record<string, string>),
  };

  const res = await fetch(url, { ...options, headers });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(
      `Printify API ${res.status} ${res.statusText}: ${body}`
    );
  }

  return res.json() as Promise<T>;
}

export function shopPath(path: string): string {
  return `/shops/${getShopId()}${path}`;
}
