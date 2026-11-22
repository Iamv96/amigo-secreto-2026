import React from 'react';
import { Snowflake } from 'lucide-react';

interface NavbarProps {
  snowEnabled: boolean;
  onToggleSnow: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  snowEnabled,
  onToggleSnow,
}) => {
  return (
    <div className="w-full pt-4 pb-2 flex items-center justify-center">
      <button
        onClick={onToggleSnow}
        title={snowEnabled ? 'Desactivar nieve' : 'Activar nieve'}
        className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer backdrop-blur-md border shadow-md shadow-black/25 ${
          snowEnabled
            ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/40 hover:bg-emerald-900/90'
            : 'bg-black/60 text-slate-400 border-white/10 hover:text-white hover:bg-white/10'
        }`}
      >
        <Snowflake className={`w-3.5 h-3.5 ${snowEnabled ? 'animate-spin-slow text-emerald-400' : 'text-slate-400'}`} />
        <span>{snowEnabled ? 'Desactivar nieve' : 'Activar nieve'}</span>
      </button>
    </div>
  );
};
