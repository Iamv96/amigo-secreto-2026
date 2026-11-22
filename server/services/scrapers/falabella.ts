import { parseCleanPrice } from './utils';

export interface ProductScrapeResult {
  success: boolean;
  url: string;
  image: string | null;
  title: string | null;
  price: number | null;
  regularPrice?: number | null;
  siteName: string;
}

export async function resolveFalabellaProduct(parsedUrl: URL): Promise<ProductScrapeResult | null> {
  const pathParts = parsedUrl.pathname.split('/').filter(Boolean);
  const prodId = pathParts.find((p) => /^\d{6,10}$/.test(p));
  const variantId = pathParts.length >= 5 && /^\d{6,10}$/.test(pathParts[4]) ? pathParts[4] : prodId;
  const slugPart = pathParts.find((p) => p !== 'falabella-cl' && p !== 'product' && !/^\d+$/.test(p));

  let fallbackTitle: string | null = null;
  if (slugPart) {
    fallbackTitle = slugPart
      .replace(/[-_]+/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase())
      .trim();
  }
  const fallbackImage = variantId
    ? `https://media.falabella.com/falabellaCL/${variantId}/public`
    : prodId
    ? `https://media.falabella.com/falabellaCL/${prodId}/public`
    : null;

  let fTitle: string | null = null;
  let fImage: string | null = null;
  let fPrice: number | null = null;
  let fRegularPrice: number | null = null;

  const fController = new AbortController();
  const fTimeout = setTimeout(() => fController.abort(), 8000);

  try {
    const fRes = await fetch(parsedUrl.href, {
      signal: fController.signal,
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'es-CL,es;q=0.9',
      },
    });
    clearTimeout(fTimeout);

    if (fRes.ok) {
      const fHtml = await fRes.text();
      const nextMatch = fHtml.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/);
      if (nextMatch) {
        try {
          const nextData = JSON.parse(nextMatch[1]);
          const pData = nextData.props?.pageProps?.productData;
          if (pData) {
            const rawName = pData.name || pData.displayName || '';
            const brand = pData.brandName || '';
            if (brand && rawName && !rawName.toLowerCase().includes(brand.toLowerCase())) {
              fTitle = `${brand} - ${rawName}`;
            } else {
              fTitle = rawName || fallbackTitle;
            }

            const variant =
              (pData.variants && pData.variants.find((v: any) => v.id === variantId)) || pData.variants?.[0];
            if (variant?.medias && Array.isArray(variant.medias)) {
              const validMedia = variant.medias.find((m: any) => m.url && !m.url.includes('NoImage'));
              if (validMedia) fImage = validMedia.url;
            }
            if (!fImage && pData.medias && Array.isArray(pData.medias)) {
              const validMedia = pData.medias.find((m: any) => m.url && !m.url.includes('NoImage'));
              if (validMedia) fImage = validMedia.url;
            }

            const priceList = variant?.prices || pData.prices || [];
            if (Array.isArray(priceList)) {
              for (const pr of priceList) {
                const rawStr = Array.isArray(pr.price)
                  ? pr.price[0]
                  : typeof pr.price === 'string'
                  ? pr.price
                  : null;
                if (rawStr) {
                  const num = parseCleanPrice(rawStr, 'CLP');
                  if (num && num > 0) {
                    if (pr.type === 'cmrPrice' || pr.icons?.includes('cmr')) {
                      fPrice = num;
                    } else if (
                      pr.type === 'internetPrice' ||
                      pr.type === 'normalPrice' ||
                      pr.type === 'eventPrice'
                    ) {
                      if (!fPrice) fPrice = num;
                      if (!fRegularPrice || num > fRegularPrice) fRegularPrice = num;
                    } else {
                      if (!fPrice) fPrice = num;
                    }
                  }
                }
              }
            }
          }
        } catch (jsonErr) {
          console.warn('Falabella __NEXT_DATA__ parse warning:', jsonErr);
        }
      }

      // Fallbacks from HTML meta if not found in __NEXT_DATA__
      if (!fImage) {
        const ogImg = fHtml.match(/<meta[^>]+property=["']og:image(?::secure_url)?["'][^>]+content=["']([^"']+)["']/i);
        if (ogImg) fImage = ogImg[1];
      }
      if (!fTitle) {
        const ogT = fHtml.match(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i);
        if (ogT) fTitle = ogT[1].replace(/\s*[|\-–—]\s*(?:Falabella).*$/i, '').trim();
      }
    }
  } catch (fFetchErr) {
    clearTimeout(fTimeout);
    console.warn('Falabella fetch HTML warning:', fFetchErr);
  }

  const finalTitle = fTitle || fallbackTitle;
  const finalImage = fImage || fallbackImage;

  if (finalTitle || finalImage) {
    return {
      success: true,
      url: parsedUrl.href,
      image: finalImage,
      title: finalTitle,
      price: fPrice || null,
      regularPrice: fRegularPrice || null,
      siteName: 'Falabella',
    };
  }

  return null;
}
