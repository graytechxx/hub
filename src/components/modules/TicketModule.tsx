import React, { useState, useEffect, useCallback } from 'react';
import { Ticket as TicketIcon, Plus, LayoutGrid, List, CheckCircle2, Clock, AlertTriangle, RefreshCw } from 'lucide-react';
import type { Ticket } from '../../types/workspace';
import { syncTicketToAct, fetchActTickets, updateActTicketStatusRealtime } from '../../services/actApi';

interface TicketModuleProps {
  tickets: Ticket[];
  onAddTicket: (t: Ticket) => void;
  onUpdateTicketStatus: (id: string, status: Ticket['status']) => void;
}

export const TicketModule: React.FC<TicketModuleProps> = ({
  tickets: localTickets,
  onAddTicket,
  onUpdateTicketStatus,
}) => {
  const [tickets, setTickets] = useState<Ticket[]>(localTickets);
  const [viewMode, setViewMode] = useState<'kanban' | 'table'>('kanban');
  const [showForm, setShowForm] = useState(false);
  const [isFetching, setIsFetching] = useState(false);

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<Ticket['category']>('PC/Hardware');
  const [priority] = useState<Ticket['priority']>('Medium');
  const [room] = useState('Lab J5');
  const [assignee] = useState('Teknisi Lab');
  const [description, setDescription] = useState('');

  // 1. Fetch live tickets from Web ACT DB
  const loadActTickets = useCallback(async () => {
    setIsFetching(true);
    const dbTickets = await fetchActTickets();
    setIsFetching(false);

    if (dbTickets && dbTickets.length > 0) {
      setTickets(dbTickets);
    }
  }, []);

  useEffect(() => {
    loadActTickets();
    const interval = setInterval(() => {
      loadActTickets();
    }, 3000);
    return () => clearInterval(interval);
  }, [loadActTickets]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !description) return;

    const newTicket: Ticket = {
      id: `TICK-${Date.now().toString().slice(-4)}`,
      title,
      category,
      priority,
      status: 'Backlog',
      assignee,
      room,
      createdAt: new Date().toLocaleDateString('id-ID'),
      description,
    };

    onAddTicket(newTicket);
    await syncTicketToAct(newTicket);
    await loadActTickets();

    setTitle('');
    setDescription('');
    setShowForm(false);
  };

  const handleStatusChange = async (id: string, newStatus: Ticket['status']) => {
    // Update local state immediately
    setTickets((prev) =>
      prev.map((t) => (t.id === id ? { ...t, status: newStatus } : t))
    );
    onUpdateTicketStatus(id, newStatus);

    // Realtime sync to Web ACT database
    await updateActTicketStatusRealtime(id, newStatus);
    await loadActTickets();
  };

  const columns: { status: Ticket['status']; label: string; color: string; icon: any }[] = [
    { status: 'Backlog', label: 'Antrean Baru (Open)', color: 'border-rose-300 bg-rose-50 text-rose-900', icon: Clock },
    { status: 'In Progress', label: 'Sedang Ditangani', color: 'border-amber-300 bg-amber-50 text-amber-900', icon: AlertTriangle },
    { status: 'Resolved', label: 'Selesai / Solved', color: 'border-emerald-300 bg-emerald-50 text-emerald-900', icon: CheckCircle2 },
  ];

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-200">
      {/* Header Banner */}
      <div className="p-5 notion-card rounded-xl border border-rose-200 bg-rose-50/50 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-zinc-900 flex items-center gap-2">
            <TicketIcon className="w-5 h-5 text-rose-600" />
            Ticketing & Issue Desk Lab (Realtime Sync Web ACT)
            <span className="text-[10px] bg-rose-100 text-rose-800 px-2 py-0.5 rounded-full font-mono font-semibold">
              ⚡ Realtime 2-Way Sync Active
            </span>
          </h2>
          <p className="text-xs text-zinc-600 mt-1">
            Sistem pelaporan kendala PC laboratorium, software, jaringan, atau permintaan bantuan asisten teknis yang tersinkronisasi langsung dengan database Web ACT.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => loadActTickets()}
            disabled={isFetching}
            className="px-3 py-1.5 bg-white border border-zinc-300 rounded-lg text-xs font-semibold text-zinc-700 hover:bg-zinc-100 transition flex items-center gap-1.5"
            title="Muat Ulang Tiket dari Database ACT"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin' : ''}`} />
            <span>Reload Tiket</span>
          </button>

          <div className="flex items-center bg-white p-1 border border-zinc-300 rounded-lg text-xs shadow-2xs">
            <button
              onClick={() => setViewMode('kanban')}
              className={`px-2.5 py-1 rounded flex items-center gap-1.5 transition-colors ${
                viewMode === 'kanban' ? 'bg-indigo-50 text-indigo-700 font-bold' : 'text-zinc-600 hover:text-zinc-900'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Kanban</span>
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`px-2.5 py-1 rounded flex items-center gap-1.5 transition-colors ${
                viewMode === 'table' ? 'bg-indigo-50 text-indigo-700 font-bold' : 'text-zinc-600 hover:text-zinc-900'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span>Tabel</span>
            </button>
          </div>

          <button
            onClick={() => setShowForm(!showForm)}
            className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-sm shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Buat Tiket Baru</span>
          </button>
        </div>
      </div>

      {/* Form Overlay Modal / Card */}
      {showForm && (
        <div className="notion-card p-5 rounded-xl border border-rose-300 bg-white space-y-4 animate-in slide-in-from-top-2 duration-150">
          <h3 className="text-xs font-bold tracking-wider text-rose-700 uppercase flex items-center gap-2">
            <Plus className="w-4 h-4" />
            BUAT TIKET KENDALA TEKNIS / ADMIN
          </h3>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1">Judul Masalah / Tiket</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Contoh: PC 12 Lab Lanjut mati total saat praktikum"
                  className="w-full bg-zinc-50 border border-zinc-300 rounded-lg px-3 py-2 text-xs text-zinc-900 focus:outline-none focus:border-rose-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1">Tujuan Tiket (Target)</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as Ticket['category'])}
                  className="w-full bg-zinc-50 border border-zinc-300 rounded-lg px-3 py-2 text-xs text-zinc-900 focus:outline-none focus:border-rose-500"
                >
                  <option value="PC/Hardware">TEKNIS (Kendala Hardware / Software / PC)</option>
                  <option value="Lainnya">ADMIN (Kelengkapan Kelas / ATK / Administrasi)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1">Deskripsi Rinci</label>
              <textarea
                rows={3}
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Jelaskan detail kendala, nomor PC/Lab, dan kronologinya..."
                className="w-full bg-zinc-50 border border-zinc-300 rounded-lg px-3 py-2 text-xs text-zinc-900 focus:outline-none focus:border-rose-500"
              />
            </div>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-xs font-semibold rounded-lg transition"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-lg transition"
              >
                Kirim Tiket Ke ACT DB
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Main Content: Kanban View or Table View */}
      {viewMode === 'kanban' ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {columns.map((col) => {
            const colTickets = tickets.filter((t) => t.status === col.status);
            const Icon = col.icon;

            return (
              <div key={col.status} className="space-y-3">
                <div className={`p-3 rounded-lg border ${col.color} flex items-center justify-between font-bold text-xs`}>
                  <div className="flex items-center gap-2">
                    <Icon className="w-4 h-4" />
                    <span>{col.label}</span>
                  </div>
                  <span className="bg-white/80 px-2 py-0.5 rounded text-[11px] font-mono">{colTickets.length}</span>
                </div>

                <div className="space-y-3 min-h-[350px]">
                  {colTickets.length === 0 ? (
                    <div className="p-6 text-center text-zinc-400 text-xs font-mono bg-zinc-50/50 rounded-xl border border-dashed border-zinc-200">
                      Tidak ada tiket
                    </div>
                  ) : (
                    colTickets.map((t) => (
                      <div key={t.id} className="p-4 notion-card rounded-xl border border-zinc-200 bg-white space-y-3 shadow-2xs hover:border-zinc-300 transition">
                        <div className="flex items-start justify-between gap-2">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase font-mono ${
                            t.category === 'Lainnya' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                          }`}>
                            {t.category}
                          </span>
                          <span className="text-[10px] text-zinc-400 font-mono">{t.createdAt}</span>
                        </div>

                        <div>
                          <h4 className="font-bold text-zinc-900 text-xs leading-snug">{t.title}</h4>
                          <p className="text-zinc-600 text-[11px] mt-1 line-clamp-2">{t.description}</p>
                        </div>

                        <div className="pt-2 border-t border-zinc-100 flex items-center justify-between text-[11px] text-zinc-500">
                          <span>By: <strong className="text-zinc-800 font-medium">{t.assignee || 'Asisten'}</strong></span>
                          
                          {/* Quick Status Buttons */}
                          <div className="flex items-center gap-1">
                            {t.status !== 'Backlog' && (
                              <button
                                onClick={() => handleStatusChange(t.id, 'Backlog')}
                                className="px-2 py-0.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded text-[10px] font-semibold transition"
                              >
                                Re-Open
                              </button>
                            )}
                            {t.status !== 'In Progress' && (
                              <button
                                onClick={() => handleStatusChange(t.id, 'In Progress')}
                                className="px-2 py-0.5 bg-amber-100 hover:bg-amber-200 text-amber-800 rounded text-[10px] font-semibold transition"
                              >
                                Proses
                              </button>
                            )}
                            {t.status !== 'Resolved' && (
                              <button
                                onClick={() => handleStatusChange(t.id, 'Resolved')}
                                className="px-2 py-0.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 rounded text-[10px] font-semibold transition"
                              >
                                Selesai
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="notion-card rounded-xl border border-zinc-200 bg-white overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-zinc-50 border-b border-zinc-200 text-zinc-600 font-mono text-[11px]">
                  <th className="p-3 border-r border-zinc-200">ID</th>
                  <th className="p-3 border-r border-zinc-200">Judul Tiket</th>
                  <th className="p-3 border-r border-zinc-200">Kategori</th>
                  <th className="p-3 border-r border-zinc-200">Status (Realtime)</th>
                  <th className="p-3 border-r border-zinc-200">Pelapor</th>
                  <th className="p-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200">
                {tickets.map((t) => (
                  <tr key={t.id} className="hover:bg-zinc-50 transition">
                    <td className="p-3 border-r border-zinc-100 font-mono font-bold text-zinc-800">#{t.id}</td>
                    <td className="p-3 border-r border-zinc-100 font-semibold text-zinc-900">{t.title}</td>
                    <td className="p-3 border-r border-zinc-100">
                      <span className="px-2 py-0.5 bg-zinc-100 text-zinc-800 rounded text-[10px] font-mono">
                        {t.category}
                      </span>
                    </td>
                    <td className="p-3 border-r border-zinc-100">
                      <select
                        value={t.status}
                        onChange={(e) => handleStatusChange(t.id, e.target.value as Ticket['status'])}
                        className="bg-zinc-50 border border-zinc-300 rounded px-2 py-1 text-xs font-semibold text-zinc-900 focus:outline-none cursor-pointer"
                      >
                        <option value="Backlog">Backlog (Open)</option>
                        <option value="In Progress">In Progress (Diproses)</option>
                        <option value="Resolved">Resolved (Selesai)</option>
                      </select>
                    </td>
                    <td className="p-3 border-r border-zinc-100 font-medium text-zinc-700">{t.assignee || 'Asisten'}</td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => handleStatusChange(t.id, 'Resolved')}
                        className="text-emerald-600 hover:text-emerald-800 font-bold text-xs"
                      >
                        Set Selesai
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
