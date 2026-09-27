const LOCAL_DEV_PORT = 3000;
const LOCAL_SITE_URL = `http://localhost:${LOCAL_DEV_PORT}`;

function resolveSiteUrl(): string {
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return new URL(process.env.NEXT_PUBLIC_SITE_URL).origin;
  }
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  }
  return LOCAL_SITE_URL;
}

export const SITE_URL = resolveSiteUrl();

export function absoluteUrl(path: string): string {
  return new URL(path, SITE_URL).href;
}
