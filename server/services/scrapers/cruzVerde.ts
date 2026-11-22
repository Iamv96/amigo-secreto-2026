import { ProductScrapeResult } from './falabella';

export async function resolveCruzVerdeProduct(parsedUrl: URL): Promise<ProductScrapeResult | null> {
  const skuMatch =
    parsedUrl.pathname.match(/\/(\d{5,8})(?:\.html|\/|\?|$)/i) ||
    parsedUrl.search.match(/[?&]pid=(\d+)/i) ||
    parsedUrl.href.match(/(\d{5,8})/);

  if (!skuMatch) return null;
  const sku = skuMatch[1];

  try {
    const ocapiEndpoints = [
      `https://beta.cruzverde.cl/s/Chile/dw/shop/v19_1/products/${sku}?client_id=c19ce24d-1677-4754-b9f7-c193997c5a92&expand=prices,promotions,images`,
      `https://www.cruzverde.cl/s/Chile/dw/shop/v19_1/products/${sku}?client_id=c19ce24d-1677-4754-b9f7-c193997c5a92&expand=prices,promotions,images`,
    ];

    for (const ep of ocapiEndpoints) {
      const cvRes = await fetch(ep, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
          Accept: 'application/json',
        },
      });

      if (cvRes.ok) {
        const cvData: any = await cvRes.json();
        let productImg: string | null = null;
        if (cvData.image_groups && cvData.image_groups[0]?.images?.[0]?.link) {
          productImg = cvData.image_groups[0].images[0].link;
        } else if (cvData.image_groups && cvData.image_groups[0]?.images?.[0]?.dis_base_link) {
          productImg = cvData.image_groups[0].images[0].dis_base_link;
        } else if (cvData.c_metaTags?.['og:image']) {
          productImg = cvData.c_metaTags['og:image'];
        }

        // Extract regular price
        let regularPrice: number | null = null;
        if (typeof cvData.price === 'number') {
          regularPrice = cvData.price;
        } else if (cvData.prices && typeof cvData.prices['price-list-cl'] === 'number') {
          regularPrice = cvData.prices['price-list-cl'];
        }

        // Extract promotional prices
        const promoPrices: number[] = [];
        if (Array.isArray(cvData.product_promotions)) {
          for (const promo of cvData.product_promotions) {
            if (typeof promo.promotional_price === 'number' && promo.promotional_price > 0) {
              promoPrices.push(promo.promotional_price);
            }
          }
        }
        if (cvData.c_appliedPromotions && typeof cvData.c_appliedPromotions === 'object') {
          for (const promoKey of Object.keys(cvData.c_appliedPromotions)) {
            const pObj = cvData.c_appliedPromotions[promoKey];
            if (pObj && typeof pObj.promotionalPrice === 'number' && pObj.promotionalPrice > 0) {
              promoPrices.push(pObj.promotionalPrice);
            }
          }
        }
        if (cvData.prices && typeof cvData.prices['price-sale-cl'] === 'number' && cvData.prices['price-sale-cl'] > 0) {
          promoPrices.push(cvData.prices['price-sale-cl']);
        }

        const productPrice = promoPrices.length > 0 ? Math.min(...promoPrices) : regularPrice;
        const productTitle = cvData.name || cvData.page_title || cvData.c_metaTags?.title;

        if (productTitle || productImg) {
          return {
            success: true,
            url: parsedUrl.href,
            image: productImg,
            title: productTitle || null,
            price: productPrice || null,
            regularPrice: regularPrice || null,
            siteName: 'Cruz Verde',
          };
        }
      }
    }
  } catch (cvErr) {
    console.error('Cruz Verde OCAPI error:', cvErr);
  }

  return null;
}
