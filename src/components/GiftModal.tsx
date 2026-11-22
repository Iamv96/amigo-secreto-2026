import React, { useState, useEffect } from 'react';
import {
  X,
  Sparkles,
  Link2,
  DollarSign,
  Image as ImageIcon,
  Loader2,
  Check,
  AlertCircle,
  ExternalLink,
  Lightbulb,
} from 'lucide-react';
import { Gift, Participant } from '../types';
import { detectGiftEmoji, POPULAR_EMOJIS } from '../lib/emojiUtils';

interface GiftModalProps {
  isOpen: boolean;
  onClose: () => void;
  participant: Participant | null;
  editingGift: Gift | null;
  onSave: (giftData: {
    participant_id: string;
    name: string;
    price: number | null;
    url: string | null;
    image_url: string | null;
  }) => Promise<void>;
}

export const GiftModal: React.FC<GiftModalProps> = ({
  isOpen,
  onClose,
  participant,
  editingGift,
  onSave,
}) => {
  const [url, setUrl] = useState('');
  const [name, setName] = useState('');
  const [priceStr, setPriceStr] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [showCustomImage, setShowCustomImage] = useState(false);

  const [isFetchingMeta, setIsFetchingMeta] = useState(false);
  const [fetchStatus, setFetchStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [detectedStore, setDetectedStore] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (editingGift) {
        setUrl(editingGift.url || '');
        setName(editingGift.name || '');
        setPriceStr(editingGift.price ? String(editingGift.price) : '');
        setImageUrl(editingGift.image_url || '');
        setShowCustomImage(Boolean(editingGift.image_url));
      } else {
        setUrl('');
        setName('');
        setPriceStr('');
        setImageUrl('');
        setShowCustomImage(false);
      }
      setFetchStatus('idle');
      setDetectedStore(null);
      setErrorMessage(null);
    }
  }, [isOpen, editingGift]);

  if (!isOpen || !participant) return null;

  // Auto-fetch metadata from URL (WealthPulse scraper)
  const handleFetchMeta = async (targetUrl: string) => {
    const cleanUrl = targetUrl.trim();
    if (!cleanUrl || !cleanUrl.includes('.') || cleanUrl.length < 5) return;

    setIsFetchingMeta(true);
    setFetchStatus('idle');
    setErrorMessage(null);

    try {
      const res = await fetch('/api/fetch-product-meta', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: cleanUrl }),
      });

      if (res.ok) {
        const data = await res.json();
        let foundAnything = false;

        if (data.title && (!name.trim() || editingGift?.name === name)) {
          setName(data.title);
          foundAnything = true;
        }

        if (data.image) {
          setImageUrl(data.image);
          setShowCustomImage(true);
          foundAnything = true;
        }

        if (data.price && (!priceStr.trim() || editingGift?.price === Number(priceStr))) {
          setPriceStr(String(data.price));
          foundAnything = true;
        }

        if (data.siteName) {
          setDetectedStore(data.siteName);
        }

        if (foundAnything) {
          setFetchStatus('success');
        } else {
          setFetchStatus('idle');
        }
      } else {
        setFetchStatus('error');
      }
    } catch (err: any) {
      console.warn('Error detectando producto:', err);
      setFetchStatus('error');
    } finally {
      setIsFetchingMeta(false);
    }
  };

  const handleUrlPasteOrBlur = (val: string) => {
    setUrl(val);
    if (!editingGift && val.trim().length > 8 && (val.startsWith('http') || val.includes('.'))) {
      handleFetchMeta(val);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMessage('Por favor ingresa un nombre para el regalo');
      return;
    }

    setIsSaving(true);
    setErrorMessage(null);

    try {
      const cleanPrice = priceStr.trim() ? parseInt(priceStr.replace(/[^0-9]/g, ''), 10) : null;
      await onSave({
        participant_id: participant.id,
        name: name.trim(),
        price: cleanPrice && !isNaN(cleanPrice) ? cleanPrice : null,
        url: url.trim() || null,
        image_url: imageUrl.trim() || null,
      });
      onClose();
    } catch (err: any) {
      setErrorMessage(err?.message || 'Error al guardar el regalo');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="liquid-glass-modal rounded-3xl w-full max-w-lg p-6 relative max-h-[92vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 rounded-full bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="mb-5">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xl">🎁</span>
            <h3 className="font-heading font-bold text-xl text-white">
              {editingGift ? 'Editar opción de regalo' : 'Nueva opción de regalo'}
            </h3>
          </div>
          <p className="text-xs text-slate-400">
            Para <strong className="text-emerald-300 font-semibold">{participant.name}</strong>
          </p>
        </div>

        {errorMessage && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Tip for Open ideas */}
        <div className="mb-4 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-200/90 text-xs flex items-start gap-2">
          <Lightbulb className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <span>
            <strong>¿Idea abierta?</strong> Si es algo general (ej: <em>"Un limpiador facial para pieles sensibles"</em> o <em>"Un libro de misterio"</em>), déjalo sin enlace ni foto. Solo escribe el nombre y el presupuesto si lo hay.
          </span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* URL Input with Auto-detect button */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="gift-url" className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
                <Link2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Enlace a la tienda (Opcional):</span>
              </label>
              {detectedStore && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  {detectedStore}
                </span>
              )}
            </div>

            <div className="relative">
              <input
                id="gift-url"
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onBlur={(e) => handleUrlPasteOrBlur(e.target.value)}
                placeholder="Opcional: https://www.falabella.com/... (déjalo vacío si es idea abierta)"
                className="w-full bg-white/[0.05] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 pr-24"
              />

              <button
                type="button"
                onClick={() => handleFetchMeta(url)}
                disabled={isFetchingMeta || !url.trim()}
                className="absolute right-1.5 top-1.5 bottom-1.5 px-2.5 rounded-lg bg-emerald-600/40 hover:bg-emerald-600/60 disabled:opacity-40 text-emerald-200 text-xs font-medium flex items-center gap-1 transition-all border border-emerald-500/30 cursor-pointer"
              >
                {isFetchingMeta ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Sparkles className="w-3.5 h-3.5" />
                )}
                <span>Detectar</span>
              </button>
            </div>

            {fetchStatus === 'success' && (
              <p className="text-[11px] text-emerald-400 mt-1 flex items-center gap-1">
                <Check className="w-3 h-3" />
                ¡Datos e imagen extraídos automáticamente!
              </p>
            )}
          </div>

          {/* Product Name */}
          <div>
            <label htmlFor="gift-name" className="block text-xs font-medium text-slate-300 mb-1.5">
              ¿Qué regalo o idea es?: <span className="text-rose-400">*</span>
            </label>
            <input
              id="gift-name"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej: Un limpiador facial para pieles sensibles, Polerón negro..."
              className="w-full bg-white/[0.05] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          {/* Price */}
          <div>
            <label htmlFor="gift-price" className="text-xs font-medium text-slate-300 flex items-center gap-1.5 mb-1.5">
              <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
              <span>Precio aproximado / presupuesto (CLP, opcional):</span>
            </label>
            <input
              id="gift-price"
              type="text"
              value={priceStr}
              onChange={(e) => setPriceStr(e.target.value.replace(/[^0-9]/g, ''))}
              placeholder="Ej: 19990"
              className="w-full bg-white/[0.05] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
            />
            {priceStr && (
              <p className="text-[11px] text-slate-400 mt-1">
                Formato:{' '}
                <span className="text-emerald-300 font-semibold">
                  {new Intl.NumberFormat('es-CL', {
                    style: 'currency',
                    currency: 'CLP',
                    maximumFractionDigits: 0,
                  }).format(Number(priceStr))}
                </span>
              </p>
            )}
          </div>

          {/* Image Preview & Custom URL */}
          <div className="pt-2 border-t border-white/10">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
                <ImageIcon className="w-3.5 h-3.5 text-emerald-400" />
                <span>Foto del producto:</span>
              </span>
              <button
                type="button"
                onClick={() => setShowCustomImage(!showCustomImage)}
                className="text-[11px] text-slate-400 hover:text-emerald-300 underline cursor-pointer"
              >
                {showCustomImage ? 'Ocultar URL de imagen' : 'Editar URL de imagen'}
              </button>
            </div>

            {imageUrl.startsWith('emoji:') ? (
              <div className="flex items-center gap-3 p-2.5 rounded-xl bg-white/[0.03] border border-white/10 mb-2">
                <div className="w-12 h-12 rounded-lg bg-black/40 border border-white/10 shrink-0 flex items-center justify-center text-2xl shadow-inner">
                  {imageUrl.replace('emoji:', '')}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-white font-medium flex items-center gap-1.5">
                    <span>Emoji seleccionado:</span>
                    <span className="text-base">{imageUrl.replace('emoji:', '')}</span>
                  </p>
                  <p className="text-[10px] text-slate-400">Personalizado para esta tarjeta</p>
                </div>
                <button
                  type="button"
                  onClick={() => setImageUrl('')}
                  className="text-xs text-rose-400 hover:text-rose-300 px-2 py-1 rounded-md hover:bg-rose-500/10 transition-colors"
                >
                  Restablecer
                </button>
              </div>
            ) : imageUrl ? (
              <div className="flex items-center gap-3 p-2.5 rounded-xl bg-white/[0.03] border border-white/10 mb-2">
                <img
                  src={imageUrl}
                  alt="Vista previa"
                  className="w-14 h-14 rounded-lg object-contain bg-black/40 border border-white/10 shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-white truncate font-medium">Imagen detectada</p>
                  <p className="text-[10px] text-slate-400 truncate">{imageUrl}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setImageUrl('')}
                  className="text-xs text-rose-400 hover:text-rose-300 px-2 py-1 rounded-md hover:bg-rose-500/10 transition-colors"
                >
                  Quitar
                </button>
              </div>
            ) : (
              <div className="space-y-2 mb-2">
                <div className="flex items-center gap-3 p-2.5 rounded-xl bg-white/[0.03] border border-white/10">
                  <div className="w-12 h-12 rounded-lg bg-black/40 border border-white/10 shrink-0 flex items-center justify-center text-2xl shadow-inner">
                    {detectGiftEmoji(name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-white font-medium flex items-center gap-1.5">
                      <span>Emoji para miniatura:</span>
                      <span className="text-base">{detectGiftEmoji(name)}</span>
                    </p>
                    <p className="text-[10px] text-slate-400">
                      {name.trim()
                        ? `Asignado automáticamente para "${name}"`
                        : 'Escribe el nombre del regalo arriba para ver su emoji'}
                    </p>
                  </div>
                </div>

                {/* Quick Emoji Picker */}
                <div className="pt-1.5">
                  <p className="text-[10px] text-slate-400 mb-1.5 font-medium">O elige un emoji manualmente:</p>
                  <div className="flex flex-wrap gap-1.5">
                    {POPULAR_EMOJIS.map((em) => (
                      <button
                        key={em}
                        type="button"
                        onClick={() => setImageUrl(`emoji:${em}`)}
                        className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/15 border border-white/10 hover:border-emerald-500/50 flex items-center justify-center text-sm transition-transform active:scale-90 cursor-pointer"
                        title={`Usar emoji ${em}`}
                      >
                        {em}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {showCustomImage && (
              <input
                type="url"
                value={imageUrl.startsWith('emoji:') ? '' : imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://ejemplo.com/foto-producto.jpg"
                className="w-full bg-white/[0.05] border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 mt-2"
              />
            )}
          </div>

          {/* Modal Footer / Submit */}
          <div className="pt-4 border-t border-white/10 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-medium border border-white/10 transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-semibold shadow-lg shadow-emerald-950/50 flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
            >
              {isSaving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>{editingGift ? 'Guardar Cambios' : 'Agregar Regalo'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
