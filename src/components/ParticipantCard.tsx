import React from 'react';
import { Plus, Gift as GiftIcon, Sparkles } from 'lucide-react';
import { Participant, Gift } from '../types';
import { GiftCard } from './GiftCard';

interface ParticipantCardProps {
  participant: Participant;
  isAdmin: boolean;
  onAddGift: (participant: Participant) => void;
  onEditGift: (gift: Gift) => void;
  onDeleteGift: (giftId: string) => void;
}

export const ParticipantCard: React.FC<ParticipantCardProps> = ({
  participant,
  isAdmin,
  onAddGift,
  onEditGift,
  onDeleteGift,
}) => {
  const giftsCount = participant.gifts.length;

  return (
    <div
      id={`participant-${participant.id}`}
      className="liquid-glass-card rounded-2xl p-5 flex flex-col justify-between"
    >
      {/* Header */}
      <div>
        <div className="flex items-center justify-between pb-3.5 border-b border-white/10 mb-4">
          <div className="flex items-center gap-3">
            {/* Avatar with festive gradient */}
            <div
              className={`w-11 h-11 rounded-xl bg-gradient-to-tr ${participant.avatar_color} flex items-center justify-center font-bold text-lg text-white shadow-md border border-white/20`}
            >
              {participant.name.charAt(0).toUpperCase()}
            </div>

            <div>
              <h3 className="font-heading font-bold text-lg text-white flex items-center gap-1.5">
                {participant.name}
              </h3>
              <p className="text-xs text-slate-400">
                {giftsCount === 0
                  ? 'Aún sin opciones'
                  : giftsCount === 1
                  ? '1 opción de regalo'
                  : `${giftsCount} opciones de regalo`}
              </p>
            </div>
          </div>

          {/* Admin Add Gift Button */}
          {isAdmin && (
            <button
              onClick={() => onAddGift(participant)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs shadow-md shadow-emerald-950/40 transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Agregar</span>
            </button>
          )}
        </div>

        {/* Gifts Grid or Empty State */}
        {giftsCount > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {participant.gifts.map((gift) => (
              <GiftCard
                key={gift.id}
                gift={gift}
                isAdmin={isAdmin}
                onEdit={onEditGift}
                onDelete={onDeleteGift}
              />
            ))}
          </div>
        ) : (
          <div className="py-8 px-4 rounded-xl border border-dashed border-white/10 text-center flex flex-col items-center justify-center gap-2">
            <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-slate-400">
              <GiftIcon className="w-5 h-5 text-emerald-400/50" />
            </div>
            <p className="text-xs text-slate-400">
              {participant.name} todavía no tiene opciones de regalo registradas.
            </p>
            {isAdmin && (
              <button
                onClick={() => onAddGift(participant)}
                className="mt-1 text-xs text-emerald-400 hover:text-emerald-300 font-semibold underline underline-offset-4 cursor-pointer"
              >
                + Agregar la primera opción
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
