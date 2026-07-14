import { MetadataRoute } from 'next';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://leave-ledger.vercel.app';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: ['/', '/login', '/register'],
      disallow: ['/api/', '/dashboard/'],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
