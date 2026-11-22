import React, { useState, useEffect } from 'react';
import { Search, Heart, Download, ArrowUpRight, Lock, Unlock, LogOut } from 'lucide-react';
import { Participant, Gift as GiftType } from './types';
import { Navbar } from './components/Navbar';
import { ParticipantCard } from './components/ParticipantCard';
import { GiftModal } from './components/GiftModal';
import { AdminLoginModal } from './components/AdminLoginModal';
import { SnowEffect } from './components/SnowEffect';

export const App: React.FC = () => {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<string>('all');
  const [snowEnabled, setSnowEnabled] = useState(true);

  // Modals state
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isGiftModalOpen, setIsGiftModalOpen] = useState(false);
  const [activeParticipant, setActiveParticipant] = useState<Participant | null>(null);
  const [editingGift, setEditingGift] = useState<GiftType | null>(null);

  // Fetch participants & check auth on mount
  const fetchParticipants = async () => {
    try {
      const res = await fetch('/api/participants');
      if (res.ok) {
        const data = await res.json();
        if (data.participants) {
          setParticipants(data.participants);
        }
      }
    } catch (err) {
      console.error('Error cargando participantes:', err);
    } finally {
      setLoading(false);
    }
  };

  const checkAuth = async () => {
    try {
      const res = await fetch('/api/auth/me');
      if (res.ok) {
        const data = await res.json();
        setIsAdmin(Boolean(data.isAdmin));
      }
    } catch {
      setIsAdmin(false);
    }
  };

  useEffect(() => {
    fetchParticipants();
    checkAuth();
  }, []);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      setIsAdmin(false);
    } catch {
      // ignore
    }
  };

  // Gift actions
  const handleOpenAddGift = (participant: Participant) => {
    setActiveParticipant(participant);
    setEditingGift(null);
    setIsGiftModalOpen(true);
  };

  const handleOpenEditGift = (gift: GiftType) => {
    const parent = participants.find((p) => p.id === gift.participant_id) || null;
    setActiveParticipant(parent);
    setEditingGift(gift);
    setIsGiftModalOpen(true);
  };

  const handleSaveGift = async (giftData: {
    participant_id: string;
    name: string;
    price: number | null;
    url: string | null;
    image_url: string | null;
  }) => {
    if (editingGift) {
      // Update
      const res = await fetch(`/api/gifts/${editingGift.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(giftData),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Error al actualizar el regalo');
      }
    } else {
      // Create
      const res = await fetch('/api/gifts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(giftData),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Error al agregar el regalo');
      }
    }

    await fetchParticipants();
  };

  const handleDeleteGift = async (giftId: string) => {
    if (!window.confirm('¿Estás seguro de que deseas eliminar esta opción de regalo?')) {
      return;
    }

    try {
      const res = await fetch(`/api/gifts/${giftId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        await fetchParticipants();
      } else {
        alert('No se pudo eliminar el regalo');
      }
    } catch {
      alert('Error de conexión al eliminar');
    }
  };

  // Filter participants
  const filteredParticipants = participants.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.gifts.some((g) => g.name.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesChip = selectedFilter === 'all' || p.id === selectedFilter;

    return matchesSearch && matchesChip;
  });



  return (
    <div className="relative min-h-screen flex flex-col">
      {/* Falling Snow Canvas */}
      <SnowEffect enabled={snowEnabled} />

      {/* Floating Snow Toggle */}
      <Navbar
        snowEnabled={snowEnabled}
        onToggleSnow={() => setSnowEnabled(!snowEnabled)}
      />

      {/* Hero Section */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-4 md:px-8">
        <section className="text-center pt-2 pb-4 md:pt-4 md:pb-6">
          <h1 className="font-heading font-extrabold text-3xl sm:text-4xl md:text-5xl text-white tracking-tight mb-6 leading-tight">
            Opciones de regalo para
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-amber-300 whitespace-nowrap mt-1">
              Amigo Secreto 2026
            </span>
          </h1>

          {/* Search & Filter Container (Identical Width & Alignment) */}
          <div className="max-w-4xl mx-auto space-y-3 px-2">
            {/* Search Bar */}
            <div className="relative w-full">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar por nombre (ej: Joaquín, Coni, Cote...)"
                className="w-full bg-white/[0.06] border border-white/10 rounded-2xl pl-10 pr-4 py-3 text-xs sm:text-sm text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 shadow-lg shadow-black/20"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            </div>

            {/* Quick Filter Buttons (Uniform width, balanced rows) */}
            <div className="w-full grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
              <button
                onClick={() => setSelectedFilter('all')}
                className={`w-full py-2 px-1.5 rounded-xl text-[11px] sm:text-xs font-medium transition-all border cursor-pointer flex items-center justify-center text-center ${
                  selectedFilter === 'all'
                    ? 'bg-emerald-600 text-white border-emerald-500 shadow-sm'
                    : 'bg-white/5 text-slate-300 border-white/10 hover:text-white hover:bg-white/10'
                }`}
              >
                <span className="truncate">Todos ({participants.length})</span>
              </button>

              {participants.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setSelectedFilter(p.id)}
                  className={`w-full py-2 px-1.5 rounded-xl text-[11px] sm:text-xs font-medium transition-all border cursor-pointer flex items-center justify-center text-center gap-1 ${
                    selectedFilter === p.id
                      ? 'bg-rose-600 text-white border-rose-500 shadow-sm'
                      : 'bg-white/5 text-slate-300 border-white/10 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <span className="truncate">{p.name}</span>
                  {p.gifts.length > 0 && (
                    <span className="opacity-75 text-[10px] shrink-0">({p.gifts.length})</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Participants Cards Grid */}
        {loading ? (
          <div className="py-20 text-center flex flex-col items-center justify-center gap-3">
            <div className="w-10 h-10 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-xs text-slate-400">Cargando opciones de regalos...</p>
          </div>
        ) : filteredParticipants.length > 0 ? (
          <div className="space-y-6">
            {filteredParticipants.map((participant) => (
              <ParticipantCard
                key={participant.id}
                participant={participant}
                isAdmin={isAdmin}
                onAddGift={handleOpenAddGift}
                onEditGift={handleOpenEditGift}
                onDeleteGift={handleDeleteGift}
              />
            ))}
          </div>
        ) : (
          <div className="py-16 text-center rounded-2xl liquid-glass p-8">
            <p className="text-sm text-slate-400 mb-2">
              No se encontraron participantes con el filtro seleccionado.
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedFilter('all');
              }}
              className="text-xs text-emerald-400 underline underline-offset-4 font-semibold"
            >
              Restablecer filtros
            </button>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="w-full py-8 px-4 border-t border-white/10 mt-12 text-center text-xs text-slate-500">
        <div className="max-w-md mx-auto flex flex-col items-center justify-center gap-3">
          <p className="flex items-center justify-center gap-1.5 text-xs text-slate-400">
            <span>Hecho con</span>
            <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500 inline" />
            <span>por Ignacio</span>
          </p>

          {/* Admin Access below */}
          {isAdmin ? (
            <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-semibold">
                <Unlock className="w-3.5 h-3.5 text-rose-400" />
                <span>Modo Administrador</span>
                <button
                  onClick={handleLogout}
                  title="Cerrar sesión de administrador"
                  className="p-1 rounded-full hover:bg-rose-500/30 text-rose-300 hover:text-white transition-colors cursor-pointer ml-1"
                >
                  <LogOut className="w-3 h-3" />
                </button>
              </div>

              <a
                href="/api/backup/export"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 hover:bg-white/10 text-slate-300 text-xs border border-white/10 transition-colors"
              >
                <Download className="w-3 h-3 text-emerald-400" />
                <span>Descargar Respaldo JSON</span>
              </a>
            </div>
          ) : (
            <button
              onClick={() => setIsLoginOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/[0.04] hover:bg-white/[0.08] text-slate-400 hover:text-slate-200 text-xs border border-white/10 transition-all cursor-pointer"
            >
              <Lock className="w-3 h-3 text-amber-400/80" />
              <span>Acceso Administrador</span>
            </button>
          )}
        </div>
      </footer>

      {/* Modals */}
      <AdminLoginModal
        isOpen={isLoginOpen}
        onClose={() => setIsLoginOpen(false)}
        onLoginSuccess={() => {
          setIsAdmin(true);
          fetchParticipants();
        }}
      />

      <GiftModal
        isOpen={isGiftModalOpen}
        onClose={() => setIsGiftModalOpen(false)}
        participant={activeParticipant}
        editingGift={editingGift}
        onSave={handleSaveGift}
      />
    </div>
  );
};
