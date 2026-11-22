import { ProductScrapeResult } from './falabella';
import { parseCleanPrice, resolveUrl, extractMeta } from './utils';

export async function resolveGenericProduct(parsedUrl: URL, siteName: string): Promise<ProductScrapeResult> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 7000);

  let html = '';
  try {
    const response = await fetch(parsedUrl.href, {
      signal: controller.signal,
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'es-CL,es-ES;q=0.9,es;q=0.8,en;q=0.7',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Sec-Fetch-User': '?1',
        'Upgrade-Insecure-Requests': '1',
      },
    });
    clearTimeout(timeoutId);
    if (response.ok) {
      html = await response.text();
    }
  } catch (fetchErr) {
    clearTimeout(timeoutId);
    console.warn('Fetch HTML error in generic scraper:', fetchErr);
  }

  // 1. Image extraction (OpenGraph, Twitter, Schema, img tag)
  let imageUrl: string | null = null;

  const ogImage =
    extractMeta(html, /<meta\s+(?:property|name)=["']og:image(?::secure_url)?["']\s+content=["']([^"']+)["']/i) ||
    extractMeta(html, /<meta\s+content=["']([^"']+)["']\s+(?:property|name)=["']og:image(?::secure_url)?["']/i);
  if (ogImage) imageUrl = resolveUrl(ogImage, parsedUrl.href);

  if (!imageUrl) {
    const twitterImage =
      extractMeta(html, /<meta\s+(?:property|name)=["']twitter:image(?::src)?["']\s+content=["']([^"']+)["']/i) ||
      extractMeta(html, /<meta\s+content=["']([^"']+)["']\s+(?:property|name)=["']twitter:image(?::src)?["']/i);
    if (twitterImage) imageUrl = resolveUrl(twitterImage, parsedUrl.href);
  }

  if (!imageUrl) {
    const linkImage = extractMeta(html, /<link\s+rel=["']image_src["']\s+href=["']([^"']+)["']/i);
    if (linkImage) imageUrl = resolveUrl(linkImage, parsedUrl.href);
  }

  if (!imageUrl) {
    const itemPropImage =
      extractMeta(html, /<[^>]+itemprop=["']image["'][^>]+content=["']([^"']+)["']/i) ||
      extractMeta(html, /<[^>]+itemprop=["']image["'][^>]+src=["']([^"']+)["']/i);
    if (itemPropImage) imageUrl = resolveUrl(itemPropImage, parsedUrl.href);
  }

  // JSON-LD schema.org extraction
  let jsonLdTitle: string | null = null;
  let jsonLdPrice: number | null = null;
  if (html) {
    const jsonLdMatch = html.match(/<script\b[^>]*\btype=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi);
    if (jsonLdMatch) {
      for (const block of jsonLdMatch) {
        try {
          const cleanContent = block.replace(/^<script\b[^>]*>/i, '').replace(/<\/script>$/i, '').trim();
          const parsed = JSON.parse(cleanContent);

          const inspectObject = (obj: any) => {
            if (!obj || typeof obj !== 'object') return;
            if (!imageUrl) {
              if (typeof obj.image === 'string') imageUrl = resolveUrl(obj.image, parsedUrl.href);
              else if (Array.isArray(obj.image)) {
                const firstImg = obj.image[0];
                if (typeof firstImg === 'string') imageUrl = resolveUrl(firstImg, parsedUrl.href);
                else if (firstImg && typeof firstImg === 'object' && typeof (firstImg.contentUrl || firstImg.url) === 'string') {
                  imageUrl = resolveUrl(firstImg.contentUrl || firstImg.url, parsedUrl.href);
                }
              } else if (obj.image && typeof (obj.image.contentUrl || obj.image.url) === 'string') {
                imageUrl = resolveUrl(obj.image.contentUrl || obj.image.url, parsedUrl.href);
              }
            }
            if (!jsonLdTitle && (obj['@type'] === 'Product' || obj['@type'] === 'ItemPage')) {
              if (typeof obj.name === 'string') jsonLdTitle = obj.name;
            }
            if (obj.offers) {
              const offersList = Array.isArray(obj.offers) ? obj.offers : [obj.offers];
              for (const offer of offersList) {
                if (!offer) continue;
                const possiblePrices = [
                  offer.price,
                  offer.lowPrice,
                  offer.salePrice,
                  offer.priceSpecification?.price,
                ]
                  .map((p) => parseCleanPrice(p, offer.priceCurrency || 'CLP'))
                  .filter((p): p is number => p !== null && p > 0);

                if (possiblePrices.length > 0) {
                  const lowest = Math.min(...possiblePrices);
                  if (jsonLdPrice === null || lowest < jsonLdPrice) {
                    jsonLdPrice = lowest;
                  }
                }
              }
            }
            if (obj['@graph'] && Array.isArray(obj['@graph'])) {
              for (const item of obj['@graph']) {
                inspectObject(item);
              }
            }
          };
          inspectObject(parsed);
        } catch {
          // ignore json parse error
        }
      }
    }
  }

  // Fallback: search for prominent img in HTML
  if (!imageUrl && html) {
    const imgMatch = html.match(/<img\s+[^>]*src=["']([^"']+\.(?:jpg|jpeg|png|webp|avif)(?:\?[^"']*)?)["']/i);
    if (imgMatch) {
      imageUrl = resolveUrl(imgMatch[1], parsedUrl.href);
    }
  }

  // 2. Title extraction
  let title: string | null = jsonLdTitle;
  if (!title) {
    const ogTitle =
      extractMeta(html, /<meta\s+(?:property|name)=["']og:title["']\s+content=["']([^"']+)["']/i) ||
      extractMeta(html, /<meta\s+content=["']([^"']+)["']\s+(?:property|name)=["']og:title["']/i);
    if (ogTitle) {
      title = ogTitle.trim();
    } else {
      const docTitle = html.match(/<title>([^<]+)<\/title>/i);
      if (docTitle && docTitle[1].trim()) {
        title = docTitle[1].trim();
      }
    }
  }

  // Heuristic fallback: extract from URL slug
  if (!title || title.length < 3 || title.toLowerCase().includes('just a moment')) {
    const pathSegments = parsedUrl.pathname.split('/').filter(Boolean);
    const ignoredSegments = new Set([
      'falabella-cl', 'product', 'products', 'producto', 'productos', 'item', 'items',
      'p', 'cl', 'es', 'en', 'buy', 'dp', 'gp', 'store', 'articulo', 'articulos', 'detail',
    ]);
    const candidateSegments = pathSegments.filter(
      (s) => !ignoredSegments.has(s.toLowerCase()) && !/^\d+(?:\.[a-z0-9]+)?$/i.test(s)
    );
    const bestSlug =
      candidateSegments.length > 0
        ? candidateSegments[candidateSegments.length - 1]
        : pathSegments[pathSegments.length - 1] || '';

    if (bestSlug) {
      const cleanSlug = bestSlug
        .replace(/\.(?:html|htm|php|aspx?)$/i, '')
        .replace(/[-_]+/g, ' ')
        .replace(/\b\w/g, (c) => c.toUpperCase())
        .trim();
      if (cleanSlug.length > 2) {
        title = cleanSlug;
      }
    }
  }

  // Clean title from common store suffixes
  if (title) {
    title = title
      .replace(
        /\s*[|\-–—]\s*(?:Cruz Verde|Falabella(?:\.com| Chile)?|Mercado Libre|Paris|Ripley|Lider|Salcobrand|Farmacias Ahumada|IKEA(?:\s*Chile)?|Sodimac|Easy|Amazon).*$/i,
        ''
      )
      .trim();
  }

  // 3. Price extraction
  let price: number | null = jsonLdPrice;
  if (price === null) {
    const metaSalePrice = extractMeta(
      html,
      /<meta\s+(?:property|name)=["'](?:product:sale_price:amount|product:discount_price|og:price:discounted|sale_price)["']\s+content=["']([^"']+)["']/i
    );
    const metaRegularPrice = extractMeta(
      html,
      /<meta\s+(?:property|name)=["'](?:product:price:amount|og:price:amount|price:amount)["']\s+content=["']([^"']+)["']/i
    );

    const saleNum = metaSalePrice ? parseCleanPrice(metaSalePrice, 'CLP') : null;
    const regNum = metaRegularPrice ? parseCleanPrice(metaRegularPrice, 'CLP') : null;

    if (saleNum && saleNum > 0) {
      price = saleNum;
    } else if (regNum && regNum > 0) {
      price = regNum;
    }
  }

  // Fallback: itemprop="price"
  if (price === null && html) {
    const itemPropPrice =
      extractMeta(html, /<[^>]+itemprop=["']price["'][^>]+content=["']([^"']+)["']/i) ||
      extractMeta(html, /<[^>]+content=["']([^"']+)["'][^>]+itemprop=["']price["']/i);
    if (itemPropPrice) {
      const pNum = parseCleanPrice(itemPropPrice, 'CLP');
      if (pNum && pNum > 0) price = pNum;
    }
  }

  return {
    success: true,
    url: parsedUrl.href,
    image: imageUrl,
    title: title || null,
    price: price || null,
    siteName,
  };
}
