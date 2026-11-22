import { ProductScrapeResult } from './falabella';

export async function resolveMercadoLibreProduct(parsedUrl: URL): Promise<ProductScrapeResult | null> {
  const meliMatch =
    parsedUrl.pathname.match(/ML[A-Z]-?(\d+)/i) || parsedUrl.href.match(/ML[A-Z]-?(\d+)/i);

  if (!meliMatch) return null;

  const prefix = meliMatch[0].substring(0, 3).toUpperCase();
  const cleanId = `${prefix}${meliMatch[1]}`;

  try {
    const meliRes = await fetch(`https://api.mercadolibre.com/items/${cleanId}`, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
    });

    if (meliRes.ok) {
      const meliData: any = await meliRes.json();
      return {
        success: true,
        url: parsedUrl.href,
        image: meliData.pictures?.[0]?.secure_url || meliData.thumbnail || null,
        title: meliData.title || null,
        price: meliData.price || null,
        siteName: 'Mercado Libre',
      };
    }
  } catch (meliErr) {
    console.error('MercadoLibre API error:', meliErr);
  }

  return null;
}
