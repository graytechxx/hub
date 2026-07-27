import React, { useState, useRef, useEffect } from 'react';
import { ExternalLink, RefreshCw, User as UserIcon, PanelLeft, Key, Shield, LogOut, ChevronDown, Camera, Lock } from 'lucide-react';
import type { ModuleId, User } from '../../types/workspace';

interface NotionHeaderProps {
  currentModule: ModuleId;
  actBaseUrl: string;
  isConnected: boolean;
  currentUser: User | null;
  sidebarCollapsed: boolean;
  onToggleSidebar: () => void;
  onRefresh: () => void;
  onOpenAuth: () => void;
  onSelectModule?: (mod: ModuleId) => void;
}

const moduleTitles: Record<ModuleId, { title: string; subtitle: string }> = {
  dashboard: { title: 'Dashboard', subtitle: 'Pusat kontrol operasional & statistik ringkas' },
  projects: { title: 'Tabel Tugas', subtitle: 'Database tugas & pengingat email' },
  materi: { title: 'Materi ACT', subtitle: 'Manajemen file & modul praktikum' },
  jadwal: { title: 'Jadwal Praktikum', subtitle: 'Spreadsheet jadwal & parser ACT' },
  'excel-maker': { title: 'Excel Maker', subtitle: 'Generator rekap presensi & nilai' },
  'moodle-bulk': { title: 'Moodle Bulk CSV', subtitle: 'CSV import user & enrolment LMS' },
  'act-user-bulk': { title: 'User ACT Bulk', subtitle: 'Import & buat akun user database ACT' },
  tickets: { title: 'Ticketing Desk', subtitle: 'Pelaporan & penanganan kendala lab' },
  chat: { title: 'Ruang Chat', subtitle: 'Diskusi internal & snippet kode' },
  'knowledge-base': { title: 'Knowledge Base', subtitle: 'Dokumentasi teknis & SOP lab' },
  settings: { title: 'Pengaturan API', subtitle: 'Konfigurasi koneksi act-lepkom-v2' },
};

export const NotionHeader: React.FC<NotionHeaderProps> = ({
  currentModule,
  actBaseUrl,
  isConnected,
  currentUser,
  sidebarCollapsed,
  onToggleSidebar,
  onRefresh,
  onOpenAuth,
  onSelectModule,
}) => {
  const info = moduleTitles[currentModule] || moduleTitles.dashboard;
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="h-14 border-b border-zinc-200 bg-white px-3 sm:px-6 flex items-center justify-between sticky top-0 z-30 shrink-0 select-none">
      {/* Title & Sidebar Toggle */}
      <div className="flex items-center gap-2 overflow-hidden">
        <button
          onClick={onToggleSidebar}
          className="p-1.5 text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 rounded-md transition-colors"
          title={sidebarCollapsed ? 'Buka Sidebar' : 'Tutup Sidebar'}
        >
          <PanelLeft className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-1.5 truncate text-xs">
          <span className="text-zinc-400 font-medium hidden sm:inline">Lepkom Hub</span>
          <span className="text-zinc-300 hidden sm:inline">/</span>
          <h1 className="font-semibold text-zinc-900 truncate">{info.title}</h1>
          <span className="text-zinc-400 hidden xl:inline truncate">— {info.subtitle}</span>
        </div>
      </div>

      {/* Header Actions */}
      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
        <button
          onClick={onRefresh}
          className="p-1.5 text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 rounded-md transition-colors text-xs flex items-center gap-1"
          title="Refresh Data"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span className="hidden md:inline text-[11px]">Refresh</span>
        </button>

        <a
          href={actBaseUrl}
          target="_blank"
          rel="noreferrer"
          className="px-2 py-1 text-xs text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 rounded-md transition-colors flex items-center gap-1"
        >
          <ExternalLink className="w-3.5 h-3.5" />
          <span className="text-[11px] hidden sm:inline">Web ACT</span>
        </a>

        <div className="h-3.5 w-[1px] bg-zinc-200 hidden sm:block"></div>

        {/* Account Menu Button & Hover Dropdown */}
        <div
          className="relative"
          ref={dropdownRef}
          onMouseEnter={() => setDropdownOpen(true)}
        >
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="px-2.5 py-1 bg-zinc-100 hover:bg-zinc-200 text-zinc-900 rounded-md text-[11px] font-medium transition-colors flex items-center gap-1.5 border border-zinc-200 group"
          >
            {currentUser?.avatar ? (
              <img src={currentUser.avatar} alt="Profile" className="w-4 h-4 rounded-full object-cover shrink-0" />
            ) : (
              <UserIcon className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
            )}
            <span className="max-w-[100px] truncate">{currentUser ? currentUser.name.split(' ')[0] : 'Akun'}</span>
            <ChevronDown className={`w-3 h-3 text-zinc-400 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          {/* Account Settings Dropdown Hover Menu */}
          {dropdownOpen && (
            <div
              className="absolute right-0 mt-1 w-72 rounded-2xl bg-white border border-zinc-200 shadow-2xl p-3 z-50 animate-in fade-in zoom-in-95 duration-150 space-y-2"
              onMouseLeave={() => setDropdownOpen(false)}
            >
              {/* Profile Card Header Box */}
              <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-200 space-y-2">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-600 text-white font-black text-sm flex items-center justify-center overflow-hidden shrink-0 shadow-xs">
                    {currentUser?.avatar ? (
                      <img src={currentUser.avatar} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      currentUser?.name ? currentUser.name.charAt(0).toUpperCase() : 'A'
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-zinc-900 truncate">{currentUser ? currentUser.name : 'Asisten ACT'}</p>
                    <p className="text-[11px] text-zinc-500 font-mono truncate">{currentUser?.email || 'asisten@lepkom.gunadarma.ac.id'}</p>
                    <div className="flex items-center gap-1 mt-1">
                      <span className="text-[9px] px-1.5 py-0.2 rounded bg-indigo-100 text-indigo-800 font-mono font-bold uppercase">
                        {currentUser ? currentUser.role : 'Guest'}
                      </span>
                      {currentUser?.tag && (
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-blue-100 text-blue-800 font-mono font-bold uppercase">
                          {currentUser.tag}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="pt-1 border-t border-zinc-200/60 text-[10px] text-zinc-600 flex items-center justify-between font-mono">
                  <span>Password Default:</span>
                  <span className="font-bold text-indigo-700 bg-white px-1.5 py-0.5 rounded border border-zinc-200">
                    lepkomnewnormal
                  </span>
                </div>
              </div>

              {/* Menu Action Items */}
              <div className="space-y-1">
                <button
                  onClick={() => { setDropdownOpen(false); onOpenAuth(); }}
                  className="w-full text-left flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-zinc-700 hover:text-zinc-900 hover:bg-zinc-100 rounded-lg transition group"
                >
                  <Camera className="w-4 h-4 text-indigo-600" />
                  <div className="flex-1">
                    <div className="font-bold text-zinc-900">Ubah Foto Profil & Identitas</div>
                    <div className="text-[10px] text-zinc-500">Ganti foto avatar, nama, dan email</div>
                  </div>
                </button>

                <button
                  onClick={() => { setDropdownOpen(false); onOpenAuth(); }}
                  className="w-full text-left flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-zinc-700 hover:text-zinc-900 hover:bg-zinc-100 rounded-lg transition group"
                >
                  <Lock className="w-4 h-4 text-emerald-600" />
                  <div className="flex-1">
                    <div className="font-bold text-zinc-900">Ganti Password</div>
                    <div className="text-[10px] text-zinc-500">Ubah kata sandi & sync ke Web ACT</div>
                  </div>
                </button>

                {onSelectModule && (
                  <button
                    onClick={() => { setDropdownOpen(false); onSelectModule('settings'); }}
                    className="w-full text-left flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-zinc-700 hover:text-zinc-900 hover:bg-zinc-100 rounded-lg transition"
                  >
                    <Key className="w-4 h-4 text-amber-600" />
                    <span>Pengaturan API Key & Connection</span>
                  </button>
                )}

                <a
                  href={`${actBaseUrl}/profile`}
                  target="_blank"
                  rel="noreferrer"
                  onClick={() => setDropdownOpen(false)}
                  className="w-full text-left flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-zinc-700 hover:text-zinc-900 hover:bg-zinc-100 rounded-lg transition"
                >
                  <Shield className="w-4 h-4 text-blue-600" />
                  <span>Force Password Change (Web ACT)</span>
                </a>

                <div className="border-t border-zinc-100 my-1"></div>

                <button
                  onClick={() => { setDropdownOpen(false); onOpenAuth(); }}
                  className="w-full text-left flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 rounded-lg transition"
                >
                  <LogOut className="w-4 h-4 text-rose-600" />
                  <span>Switch / Logout Akun</span>
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center gap-1 text-[11px] text-zinc-400 font-mono ml-1">
          <span className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-emerald-500' : 'bg-zinc-300'}`}></span>
          <span className="hidden lg:inline">{isConnected ? 'Online' : 'Offline'}</span>
        </div>
      </div>
    </header>
  );
};
