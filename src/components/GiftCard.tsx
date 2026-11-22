import React, { useState } from 'react';
import { ExternalLink, Copy, Check, Edit2, Trash2, Gift as GiftIcon, Lightbulb } from 'lucide-react';
import { Gift } from '../types';
import { detectGiftEmoji } from '../lib/emojiUtils';

interface GiftCardProps {
  gift: Gift;
  isAdmin: boolean;
  onEdit: (gift: Gift) => void;
  onDelete: (giftId: string) => void;
}

export const GiftCard: React.FC<GiftCardProps> = ({
  gift,
  isAdmin,
  onEdit,
  onDelete,
}) => {
  const [copied, setCopied] = useState(false);
  const [imgError, setImgError] = useState(false);

  const formatPrice = (price: number | null) => {
    if (price === null || isNaN(price)) return null;
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      maximumFractionDigits: 0,
    }).format(price);
  };

  const handleCopyLink = () => {
    if (!gift.url) return;
    navigator.clipboard.writeText(gift.url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const domain = gift.url
    ? (() => {
        try {
          return new URL(gift.url).hostname.replace(/^www\./i, '');
        } catch {
          return null;
        }
      })()
    : null;

  const isOpenIdea = !gift.url;

  return (
    <div className="group relative flex items-start gap-3 rounded-2xl bg-white/[0.04] hover:bg-white/[0.07] border border-white/10 hover:border-emerald-500/30 transition-all p-3 duration-200">
      {/* Thumbnail Left (Compact) */}
      <div className="relative w-20 h-20 sm:w-22 sm:h-22 rounded-xl overflow-hidden bg-black/40 border border-white/10 shrink-0 flex items-center justify-center">
        {gift.image_url?.startsWith('emoji:') ? (
          <div className="flex items-center justify-center p-1">
            <span className="text-3xl sm:text-4xl select-none filter drop-shadow-md transition-transform group-hover:scale-110 duration-200">
              {gift.image_url.replace('emoji:', '')}
            </span>
          </div>
        ) : gift.image_url && !imgError ? (
          <img
            src={gift.image_url}
            alt={gift.name}
            onError={() => setImgError(true)}
            className="w-full h-full object-contain p-1 group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
        ) : (
          <div className="flex items-center justify-center p-1">
            <span className="text-3xl sm:text-4xl select-none filter drop-shadow-md transition-transform group-hover:scale-110 duration-200">
              {detectGiftEmoji(gift.name)}
            </span>
          </div>
        )}
      </div>

      {/* Info Right */}
      <div className="flex-1 min-w-0 flex flex-col justify-between self-stretch">
        <div>
          {/* Header Tag / Domain */}
          <div className="flex items-center justify-between gap-1 mb-1">
            {domain ? (
              <span className="inline-flex items-center gap-1 text-[10px] font-medium text-emerald-300/90 truncate">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0"></span>
                <span className="truncate">{domain}</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-amber-500/15 text-amber-300 text-[10px] font-medium border border-amber-500/25">
                <Lightbulb className="w-2.5 h-2.5" />
                <span>Idea abierta</span>
              </span>
            )}

            {/* Price Badge */}
            {gift.price !== null && (
              <span className="px-2 py-0.5 rounded-md bg-emerald-950/80 text-emerald-300 font-bold text-xs border border-emerald-500/30 whitespace-nowrap shrink-0">
                {formatPrice(gift.price)}
              </span>
            )}
          </div>

          {/* Product Name */}
          <h4 className="text-xs sm:text-sm font-medium text-white line-clamp-2 leading-snug">
            {gift.name}
          </h4>
        </div>

        {/* Actions Bottom */}
        <div className="pt-2 border-t border-white/5 flex flex-wrap items-center justify-between gap-1.5 mt-1.5">
          <div className="flex flex-wrap items-center gap-1.5 flex-1 min-w-0">
            {gift.url ? (
              <>
                <a
                  href={gift.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-200 hover:text-white text-xs font-medium border border-emerald-500/30 transition-all text-center"
                >
                  <span>Ver sitio web</span>
                  <ExternalLink className="w-3 h-3 shrink-0" />
                </a>

                <button
                  onClick={handleCopyLink}
                  title={copied ? '¡Copiado al portapapeles!' : 'Copiar enlace'}
                  className="inline-flex items-center justify-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white text-xs font-medium border border-white/10 transition-all cursor-pointer shrink-0"
                >
                  {copied ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-400" />
                      <span className="text-emerald-400 font-semibold">¡Copiado!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3 text-slate-400" />
                      <span>Copiar enlace</span>
                    </>
                  )}
                </button>
              </>
            ) : (
              <span className="text-[10px] text-slate-400 italic">Cualquier marca o modelo</span>
            )}
          </div>

          {/* Admin Edit/Delete */}
          {isAdmin && (
            <div className="flex items-center gap-1 shrink-0 ml-1">
              <button
                onClick={() => onEdit(gift)}
                title="Editar"
                className="p-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 transition-all cursor-pointer"
              >
                <Edit2 className="w-3 h-3" />
              </button>
              <button
                onClick={() => onDelete(gift.id)}
                title="Eliminar"
                className="p-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 transition-all cursor-pointer"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
