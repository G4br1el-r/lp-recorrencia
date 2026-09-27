import type { NextConfig } from "next";
import { IMAGE_QUALITIES } from "./lib/constants/images";

const ALL_ROUTES_SOURCE = "/:path*";
const X_FRAME_OPTIONS_VALUE = "DENY";
const DEVELOPMENT_ENV = "development";
const IS_DEVELOPMENT = process.env.NODE_ENV === DEVELOPMENT_ENV;
const SCRIPT_SOURCES = IS_DEVELOPMENT
  ? "'self' 'unsafe-inline' 'unsafe-eval'"
  : "'self' 'unsafe-inline'";
const CONTENT_SECURITY_POLICY_DIRECTIVES = [
  "default-src 'self'",
  `script-src ${SCRIPT_SOURCES}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self'",
  "connect-src 'self'",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "object-src 'none'",
];
const CONTENT_SECURITY_POLICY_SEPARATOR = "; ";
const CONTENT_SECURITY_POLICY_VALUE = CONTENT_SECURITY_POLICY_DIRECTIVES.join(
  CONTENT_SECURITY_POLICY_SEPARATOR,
);
const X_CONTENT_TYPE_OPTIONS_VALUE = "nosniff";
const REFERRER_POLICY_VALUE = "strict-origin-when-cross-origin";
const PERMISSIONS_POLICY_VALUE = "camera=(), microphone=(), geolocation=()";
const TWO_YEARS_IN_SECONDS = 63072000;
const STRICT_TRANSPORT_SECURITY_VALUE = `max-age=${TWO_YEARS_IN_SECONDS}; includeSubDomains; preload`;
const DEV_ORIGINS_SEPARATOR = ",";

const SECURITY_HEADERS = [
  { key: "X-Frame-Options", value: X_FRAME_OPTIONS_VALUE },
  { key: "Content-Security-Policy", value: CONTENT_SECURITY_POLICY_VALUE },
  { key: "X-Content-Type-Options", value: X_CONTENT_TYPE_OPTIONS_VALUE },
  { key: "Referrer-Policy", value: REFERRER_POLICY_VALUE },
  { key: "Permissions-Policy", value: PERMISSIONS_POLICY_VALUE },
  {
    key: "Strict-Transport-Security",
    value: STRICT_TRANSPORT_SECURITY_VALUE,
  },
];

const devOrigins = (process.env.DEV_ORIGINS ?? "")
  .split(DEV_ORIGINS_SEPARATOR)
  .map((origin) => origin.trim())
  .filter((origin) => origin.length > 0);

const nextConfig: NextConfig = {
  reactCompiler: true,
  poweredByHeader: false,
  allowedDevOrigins: devOrigins,
  images: { qualities: IMAGE_QUALITIES },
  experimental: { inlineCss: true },
  async headers() {
    return [{ source: ALL_ROUTES_SOURCE, headers: SECURITY_HEADERS }];
  },
};

export default nextConfig;
