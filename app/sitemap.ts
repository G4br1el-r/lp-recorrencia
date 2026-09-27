import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/site";

const HOME_PRIORITY = 1;

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: absoluteUrl("/"),
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: HOME_PRIORITY,
    },
  ];
}
