import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow:     "/",
        disallow:  [
          "/api/",
          "/admin/",
          "/lk/",
          "/corporate",
        ],
      },
    ],
    sitemap: "https://finnice.ru/sitemap.xml",
    host:    "https://finnice.ru",
  };
}
