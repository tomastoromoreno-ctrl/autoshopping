import { MetadataRoute } from 'next';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://web-autoshopping.vercel.app';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = [];

  // Static pages
  entries.push(
    { url: SITE_URL, lastModified: new Date(), changeFrequency: 'weekly', priority: 1.0 },
    { url: `${SITE_URL}/pricing`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.8 },
    { url: `${SITE_URL}/onboarding`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.9 },
  );

  // Fetch all active tenants/stores
  try {
    const res = await fetch(`${API_URL}/stores/all/public`, { next: { revalidate: 3600 } });
    if (res.ok) {
      const stores = await res.json();
      for (const store of (Array.isArray(stores) ? stores : [])) {
        const subdomain = store.subdomain;
        entries.push({
          url: `${SITE_URL}/store/${subdomain}`,
          lastModified: new Date(store.updated_at || Date.now()),
          changeFrequency: 'daily',
          priority: 0.8,
        });

        // Fetch products for each store
        try {
          const prodRes = await fetch(`${API_URL}/products/${subdomain}`, { next: { revalidate: 1800 } });
          if (prodRes.ok) {
            const products = await prodRes.json();
            const items = Array.isArray(products) ? products : products.products || products.data || [];
            for (const product of items) {
              entries.push({
                url: `${SITE_URL}/store/${subdomain}/product/${product.slug}`,
                lastModified: new Date(product.updated_at || Date.now()),
                changeFrequency: 'weekly',
                priority: 0.7,
              });
            }
          }
        } catch {}
      }
    }
  } catch {}

  return entries;
}
