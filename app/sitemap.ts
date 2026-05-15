import type { MetadataRoute } from "next";
import { PRODUCTS, PHONES_CATALOG, CATALOG_CATS } from "@/lib/data";
import { BLOG } from "@/lib/blog-data";

const BASE = "https://finnice.ru";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  /* Статические страницы */
  const staticPages: MetadataRoute.Sitemap = [
    { url: `${BASE}/`,                 lastModified: now, changeFrequency: "daily",   priority: 1.0 },
    { url: `${BASE}/catalog/`,         lastModified: now, changeFrequency: "daily",   priority: 0.9 },
    { url: `${BASE}/company/`,         lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE}/blog/`,            lastModified: now, changeFrequency: "weekly",  priority: 0.7 },
    { url: `${BASE}/contacts/`,        lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE}/faq/`,             lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${BASE}/info/vacancy/`,    lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    { url: `${BASE}/partners/`,        lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    { url: `${BASE}/politika/`,        lastModified: now, changeFrequency: "yearly",  priority: 0.3 },
    { url: `${BASE}/wb/`,              lastModified: now, changeFrequency: "monthly", priority: 0.6 },
  ];

  /* Категории каталога */
  const categoryPages: MetadataRoute.Sitemap = CATALOG_CATS.map(cat => ({
    url:            `${BASE}/catalog/?cat=${cat.cat}`,
    lastModified:   now,
    changeFrequency: "weekly",
    priority:       0.6,
  }));

  /* Карточки товаров */
  const productPages: MetadataRoute.Sitemap = PRODUCTS.map(p => ({
    url:             `${BASE}/product/${p.id}`,
    lastModified:    now,
    changeFrequency: "weekly",
    priority:        0.5,
  }));

  const phonePages: MetadataRoute.Sitemap = PHONES_CATALOG.map(p => ({
    url:             `${BASE}/product/${p.id}`,
    lastModified:    now,
    changeFrequency: "weekly",
    priority:        0.5,
  }));

  /* Блог */
  const blogPages: MetadataRoute.Sitemap = BLOG.map(post => {
    const parsed = post.date ? new Date(post.date) : now;
    const safe = isNaN(parsed.getTime()) ? now : parsed;
    return {
      url:             `${BASE}/blog/${post.slug}`,
      lastModified:    safe,
      changeFrequency: "monthly" as const,
      priority:        0.4,
    };
  });

  return [...staticPages, ...categoryPages, ...productPages, ...phonePages, ...blogPages];
}
