import { Router } from 'express';
import { resolveFalabellaProduct } from '../services/scrapers/falabella';
import { resolveMercadoLibreProduct } from '../services/scrapers/mercadoLibre';
import { resolveCruzVerdeProduct } from '../services/scrapers/cruzVerde';
import { resolveIkeaProduct } from '../services/scrapers/ikea';
import { resolveGenericProduct } from '../services/scrapers/generic';

const router = Router();

export async function resolveProductMeta(url: string) {
  let parsedUrl: URL;
  try {
    let normalized = url.trim();
    if (/^(?:m\/|\/)?falabella-cl\//i.test(normalized)) {
      normalized = `https://www.falabella.com/${normalized.replace(/^(?:m\/|\/)?/, '')}`;
    }
    if (!/^https?:\/\//i.test(normalized)) {
      normalized = `https://${normalized}`;
    }
    parsedUrl = new URL(normalized);

    if (parsedUrl.hostname.includes('falabella.')) {
      parsedUrl.hostname = 'www.falabella.com';
      parsedUrl.protocol = 'https:';
    }
  } catch {
    return {
      success: false,
      url,
      image: null,
      title: null,
      price: null,
      siteName: '',
      error: 'Formato de URL inválido',
    };
  }

  const hostname = parsedUrl.hostname.toLowerCase();
  const siteName = hostname.replace(/^www\./i, '');

  // 1. Falabella Chile
  if (hostname.includes('falabella.')) {
    const result = await resolveFalabellaProduct(parsedUrl);
    if (result) return result;
  }

  // 2. Mercado Libre
  if (hostname.includes('mercadolibre') || hostname.includes('mercadolivre')) {
    const result = await resolveMercadoLibreProduct(parsedUrl);
    if (result) return result;
  }

  // 3. Cruz Verde Chile
  if (hostname.includes('cruzverde.cl')) {
    const result = await resolveCruzVerdeProduct(parsedUrl);
    if (result) return result;
  }

  // 4. IKEA Chile
  if (hostname.includes('ikea.')) {
    const result = await resolveIkeaProduct(parsedUrl);
    if (result) return result;
  }

  // 5. General HTML / OpenGraph Resolver (Paris, Ripley, Lider, Zara, Amazon, etc.)
  return await resolveGenericProduct(parsedUrl, siteName);
}

router.post('/fetch-product-meta', async (req, res) => {
  try {
    const { url } = req.body;
    if (!url || typeof url !== 'string') {
      return res.status(400).json({ error: 'La URL es requerida' });
    }

    const result = await resolveProductMeta(url);
    return res.json(result);
  } catch (err: any) {
    console.error('Error en /api/fetch-product-meta:', err?.message || err);
    return res.json({
      success: false,
      image: null,
      title: null,
      price: null,
      error: err?.message || 'No se pudo obtener información',
    });
  }
});

export default router;
