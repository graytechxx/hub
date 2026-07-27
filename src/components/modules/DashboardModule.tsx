import React from 'react';
import {
  Upload,
  Calendar,
  FileSpreadsheet,
  Users,
  Ticket,
  BookOpen,
  ArrowUpRight,
  ShieldCheck,
  Zap,
  Activity,
  CheckCircle2,
  Clock,
  AlertCircle
} from 'lucide-react';
import type { ModuleId, Ticket as TicketType } from '../../types/workspace';

interface DashboardModuleProps {
  onSelectModule: (module: ModuleId) => void;
  isConnected: boolean;
  tickets: TicketType[];
}

export const DashboardModule: React.FC<DashboardModuleProps> = ({
  onSelectModule,
  isConnected,
  tickets,
}) => {
  const openTickets = tickets.filter((t) => t.status !== 'Resolved' && t.status !== 'Cancelled');

  const quickTools = [
    {
      id: 'materi' as ModuleId,
      title: 'Upload Materi ACT',
      desc: 'Unggah file modul/ppt praktikum ke server ACT',
      icon: Upload,
      color: 'bg-blue-50 border-blue-200 text-blue-600',
    },
    {
      id: 'jadwal' as ModuleId,
      title: 'Upload & Parse Jadwal',
      desc: 'Proses spreadsheet jadwal asisten & sync ke ACT',
      icon: Calendar,
      color: 'bg-purple-50 border-purple-200 text-purple-600',
    },
    {
      id: 'excel-maker' as ModuleId,
      title: 'Excel Maker Studio',
      desc: 'Buat file Excel rekap nilai, presensi, & template',
      icon: FileSpreadsheet,
      color: 'bg-emerald-50 border-emerald-200 text-emerald-600',
    },
    {
      id: 'moodle-bulk' as ModuleId,
      title: 'Moodle Bulk Tools',
      desc: 'Generate file CSV import user & enrolment LMS',
      icon: Users,
      color: 'bg-amber-50 border-amber-200 text-amber-600',
    },
    {
      id: 'tickets' as ModuleId,
      title: 'Ticketing Desk',
      desc: 'Lapor & pantau perbaikan PC / kendala teknis lab',
      icon: Ticket,
      color: 'bg-rose-50 border-rose-200 text-rose-600',
    },
    {
      id: 'knowledge-base' as ModuleId,
      title: 'Knowledge Base / SOP',
      desc: 'Kumpulan SOP teknis lab, snippets & panduan asisten',
      icon: BookOpen,
      color: 'bg-cyan-50 border-cyan-200 text-cyan-600',
    },
  ];

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-200">
      {/* Banner Notion Style Callout */}
      <div className="p-4 rounded-xl bg-gradient-to-r from-indigo-50 via-purple-50 to-white border border-indigo-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-2xs">
        <div className="flex items-start gap-3.5">
          <div className="p-2.5 rounded-lg bg-indigo-100 text-indigo-600 border border-indigo-200 shrink-0">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-zinc-900 flex items-center gap-2">
              Selamat Datang di Lepkom Hub Workspace
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 font-mono font-medium border border-indigo-200">
                All-in-One Teknis
              </span>
            </h2>
            <p className="text-xs text-zinc-600 mt-0.5 leading-relaxed">
              Koneksi terpisah yang siap membantu Anda mengelola upload materi, parse jadwal, generate Excel, bulk Moodle, dan ticketing tanpa harus membuka banyak tab.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0 self-end md:self-center">
          <button
            onClick={() => onSelectModule('settings')}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-semibold border flex items-center gap-1.5 transition-all ${
              isConnected
                ? 'bg-emerald-50 border-emerald-300 text-emerald-700 hover:bg-emerald-100'
                : 'bg-amber-50 border-amber-300 text-amber-700 hover:bg-amber-100'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>{isConnected ? 'ACT Bridge Ready' : 'ACT Bridge Standby'}</span>
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="notion-card p-4 rounded-xl">
          <div className="text-[11px] font-medium text-zinc-500 flex items-center justify-between">
            <span>Status Server ACT</span>
            <Activity className="w-3.5 h-3.5 text-emerald-600" />
          </div>
          <div className="text-lg font-bold text-zinc-900 mt-1 font-mono flex items-center gap-2">
            {isConnected ? 'ONLINE' : 'LOCAL ONLY'}
            <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
          </div>
          <div className="text-[10px] text-zinc-500 mt-1">Direct HTTP / REST Bridge API</div>
        </div>

        <div className="notion-card p-4 rounded-xl">
          <div className="text-[11px] font-medium text-zinc-500 flex items-center justify-between">
            <span>Tiket Kendala Aktif</span>
            <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
          </div>
          <div className="text-lg font-bold text-zinc-900 mt-1 font-mono">
            {openTickets.length} Tiket
          </div>
          <div className="text-[10px] text-zinc-500 mt-1">Butuh penanganan teknisi / asisten</div>
        </div>

        <div className="notion-card p-4 rounded-xl">
          <div className="text-[11px] font-medium text-zinc-500 flex items-center justify-between">
            <span>Tools Tersedia</span>
            <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600" />
          </div>
          <div className="text-lg font-bold text-zinc-900 mt-1 font-mono">
            6 Modul
          </div>
          <div className="text-[10px] text-zinc-500 mt-1">All-in-one workspace siap pakai</div>
        </div>

        <div className="notion-card p-4 rounded-xl">
          <div className="text-[11px] font-medium text-zinc-500 flex items-center justify-between">
            <span>Mode Integrasi</span>
            <Clock className="w-3.5 h-3.5 text-purple-600" />
          </div>
          <div className="text-lg font-bold text-zinc-900 mt-1 font-mono">
            Independen
          </div>
          <div className="text-[10px] text-zinc-500 mt-1">Berjalan mandiri di lepkom-hub</div>
        </div>
      </div>

      {/* Quick Tools Grid */}
      <div>
        <h3 className="text-xs font-bold tracking-wider text-zinc-400 uppercase mb-3 flex items-center justify-between">
          <span>AKSES CEPAT ALAT TEKNIS</span>
          <span className="text-[11px] font-normal text-zinc-500">Pilih modul di bawah untuk memulai</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {quickTools.map((tool) => {
            const Icon = tool.icon;
            return (
              <div
                key={tool.id}
                onClick={() => onSelectModule(tool.id)}
                className="notion-card p-4 rounded-xl cursor-pointer group hover:border-indigo-400 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className={`p-2.5 rounded-lg border ${tool.color}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <ArrowUpRight className="w-4 h-4 text-zinc-400 group-hover:text-indigo-600 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  </div>
                  <h4 className="text-sm font-bold text-zinc-900 group-hover:text-indigo-600 transition-colors">
                    {tool.title}
                  </h4>
                  <p className="text-xs text-zinc-600 mt-1 leading-relaxed">
                    {tool.desc}
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-zinc-100 flex items-center justify-between text-[11px] text-zinc-500 group-hover:text-zinc-700">
                  <span>Buka Modul</span>
                  <span className="font-mono text-indigo-600 font-bold">→</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent Open Tickets Section */}
      <div className="notion-card p-5 rounded-xl space-y-3">
        <div className="flex items-center justify-between border-b border-zinc-200 pb-3">
          <div className="flex items-center gap-2">
            <Ticket className="w-4 h-4 text-rose-600" />
            <h3 className="text-sm font-bold text-zinc-900">Daftar Tiket Kendala Terakhir</h3>
          </div>
          <button
            onClick={() => onSelectModule('tickets')}
            className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1"
          >
            <span>Lihat Semua Tiket</span>
            <span>→</span>
          </button>
        </div>

        {openTickets.length === 0 ? (
          <div className="py-6 text-center text-xs text-zinc-500">
            Tidak ada tiket kendala aktif saat ini. Semua sistem lab berjalan lancar!
          </div>
        ) : (
          <div className="space-y-2">
            {openTickets.slice(0, 3).map((ticket) => (
              <div
                key={ticket.id}
                onClick={() => onSelectModule('tickets')}
                className="p-3 bg-zinc-50 hover:bg-zinc-100 border border-zinc-200 rounded-lg flex items-center justify-between cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="px-2 py-0.5 text-[10px] font-mono font-semibold rounded bg-rose-100 text-rose-700 border border-rose-200">
                    {ticket.priority}
                  </span>
                  <div>
                    <div className="text-xs font-semibold text-zinc-900">{ticket.title}</div>
                    <div className="text-[11px] text-zinc-500">{ticket.category} • Ruang {ticket.room || 'Lab'}</div>
                  </div>
                </div>
                <span className="text-[11px] text-zinc-600 font-mono bg-zinc-200 px-2 py-1 rounded font-medium">
                  {ticket.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
