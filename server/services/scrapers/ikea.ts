import { ProductScrapeResult } from './falabella';
import { parseCleanPrice, resolveUrl, extractMeta } from './utils';

export async function resolveIkeaProduct(parsedUrl: URL): Promise<ProductScrapeResult | null> {
  const pathParts = parsedUrl.pathname.split('/').filter(Boolean);
  const lastPart = pathParts[pathParts.length - 1] || '';
  const idMatch = lastPart.match(/(?:s|e)?(\d{7,10})$/i) || parsedUrl.pathname.match(/(\d{7,10})/);
  const slugPart = lastPart.replace(/[-_]?(?:s|e)?\d{7,10}$/i, '');

  let fallbackTitle: string | null = null;
  if (slugPart) {
    fallbackTitle = slugPart
      .replace(/[-_]+/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase())
      .trim();
  }

  let iTitle: string | null = null;
  let iImage: string | null = null;
  let iPrice: number | null = null;
  let iRegularPrice: number | null = null;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);

  try {
    const res = await fetch(parsedUrl.href, {
      signal: controller.signal,
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'Accept-Language': 'es-CL,es-ES;q=0.9,es;q=0.8,en;q=0.7',
      },
    });
    clearTimeout(timeout);

    if (res.ok) {
      const html = await res.text();

      // 1. JSON-LD extraction
      const jsonLdScripts = html.match(/<script\b[^>]*\btype=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi);
      if (jsonLdScripts) {
        for (const block of jsonLdScripts) {
          try {
            const cleanContent = block.replace(/^<script\b[^>]*>/i, '').replace(/<\/script>$/i, '').trim();
            const parsed = JSON.parse(cleanContent);
            const items = Array.isArray(parsed) ? parsed : [parsed];

            for (const item of items) {
              if (item['@type'] === 'Product' || item['@type'] === 'ItemPage') {
                if (!iTitle && typeof item.name === 'string') {
                  iTitle = item.name.replace(/\s*[|\-–—]\s*(?:IKEA.*)$/i, '').trim();
                }

                if (!iImage) {
                  if (typeof item.image === 'string') {
                    iImage = resolveUrl(item.image, parsedUrl.href);
                  } else if (Array.isArray(item.image)) {
                    const firstImg = item.image[0];
                    if (typeof firstImg === 'string') {
                      iImage = resolveUrl(firstImg, parsedUrl.href);
                    } else if (firstImg && typeof firstImg === 'object') {
                      iImage = resolveUrl(firstImg.contentUrl || firstImg.url, parsedUrl.href);
                    }
                  } else if (item.image && typeof item.image === 'object') {
                    iImage = resolveUrl(item.image.contentUrl || item.image.url, parsedUrl.href);
                  }
                }

                if (item.offers) {
                  const offersList = Array.isArray(item.offers) ? item.offers : [item.offers];
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
                      if (iPrice === null || lowest < iPrice) {
                        iPrice = lowest;
                      }
                    }
                  }
                }
              }
            }
          } catch {
            // Ignore parse errors
          }
        }
      }

      // 2. utag_data extraction
      if (!iPrice) {
        const utagMatch = html.match(/var\s+utag_data\s*=\s*(\{[\s\S]*?\});/);
        if (utagMatch) {
          try {
            const utag = JSON.parse(utagMatch[1]);
            if (utag.price) {
              const rawP = Array.isArray(utag.price) ? utag.price[0] : utag.price;
              const parsedP = parseCleanPrice(rawP, utag.currency_code || 'CLP');
              if (parsedP && parsedP > 0) {
                iPrice = parsedP;
              }
            }
            if (!iTitle && utag.product_item_names) {
              const nameCandidate = Array.isArray(utag.product_item_names) ? utag.product_item_names[0] : utag.product_item_names;
              if (nameCandidate) {
                iTitle = String(nameCandidate).trim().replace(/\b\w/g, (c) => c.toUpperCase());
              }
            }
          } catch {
            // Ignore
          }
        }
      }

      // 3. Fallback to OpenGraph / Meta tags
      if (!iImage) {
        const ogImage =
          extractMeta(html, /<meta\s+(?:property|name)=["']og:image(?::secure_url)?["']\s+content=["']([^"']+)["']/i) ||
          extractMeta(html, /<meta\s+content=["']([^"']+)["']\s+(?:property|name)=["']og:image(?::secure_url)?["']/i);
        if (ogImage) iImage = resolveUrl(ogImage, parsedUrl.href);
      }

      if (!iTitle) {
        const ogTitle =
          extractMeta(html, /<meta\s+(?:property|name)=["']og:title["']\s+content=["']([^"']+)["']/i) ||
          extractMeta(html, /<meta\s+content=["']([^"']+)["']\s+(?:property|name)=["']og:title["']/i);
        if (ogTitle) {
          iTitle = ogTitle.replace(/\s*[|\-–—]\s*(?:IKEA.*)$/i, '').trim();
        }
      }
    }
  } catch (err) {
    clearTimeout(timeout);
    console.warn('Ikea product scrape warning:', err);
  }

  const finalTitle = iTitle || fallbackTitle;

  if (finalTitle || iImage || iPrice) {
    return {
      success: true,
      url: parsedUrl.href,
      image: iImage,
      title: finalTitle,
      price: iPrice,
      regularPrice: iRegularPrice,
      siteName: 'IKEA',
    };
  }

  return null;
}
