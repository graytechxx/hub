import React, { useState, useEffect } from 'react';
import { Search, LayoutDashboard, Upload, Calendar, FileSpreadsheet, Users, Ticket, BookOpen, Settings, X, ArrowRight } from 'lucide-react';
import type { ModuleId } from '../../types/workspace';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectModule: (module: ModuleId) => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  onSelectModule,
}) => {
  const [query, setQuery] = useState('');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
        else {
          setQuery('');
        }
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const commands: { id: ModuleId; title: string; category: string; icon: any; keywords: string }[] = [
    { id: 'dashboard', title: 'Buka Dashboard Utama', category: 'General', icon: LayoutDashboard, keywords: 'home overview status' },
    { id: 'materi', title: 'Upload Materi ke Web ACT', category: 'Teknis ACT', icon: Upload, keywords: 'materi upload modul pdf ppt docx' },
    { id: 'jadwal', title: 'Upload & Parse Jadwal Praktikum', category: 'Teknis ACT', icon: Calendar, keywords: 'jadwal schedule asisten shift kalender excel' },
    { id: 'excel-maker', title: 'Buka Lepkom Excel Maker', category: 'Tools Generator', icon: FileSpreadsheet, keywords: 'excel xlsx spreadsheet nilaimpresensi' },
    { id: 'moodle-bulk', title: 'Buka Moodle Bulk User (CSV LMS)', category: 'Tools Generator', icon: Users, keywords: 'moodle bulk import csv user enrolment lms' },
    { id: 'act-user-bulk', title: 'Buka Bulk User Database ACT', category: 'Teknis ACT', icon: Users, keywords: 'act user bulk import excel asisten staff akun sync database' },
    { id: 'tickets', title: 'Buka Notion Kanban Ticketing', category: 'Operations', icon: Ticket, keywords: 'ticket tiket kendala pc lab rusak' },
    { id: 'knowledge-base', title: 'Buka Knowledge Base / SOP', category: 'Documentation', icon: BookOpen, keywords: 'sop notes catatan lab snippets' },
    { id: 'settings', title: 'Konfigurasi Rest API ACT', category: 'Settings', icon: Settings, keywords: 'config url token api connection' },
  ];

  const filtered = commands.filter((c) =>
    c.title.toLowerCase().includes(query.toLowerCase()) ||
    c.keywords.toLowerCase().includes(query.toLowerCase()) ||
    c.category.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-start justify-center pt-24 px-4 animate-in fade-in duration-150">
      <div className="w-full max-w-xl bg-white border border-zinc-200 rounded-xl shadow-2xl overflow-hidden flex flex-col">
        {/* Input Bar */}
        <div className="p-3 border-b border-zinc-200 flex items-center gap-3">
          <Search className="w-4 h-4 text-zinc-400 shrink-0" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ketik nama modul atau perintah (contoh: upload, excel, moodle)..."
            className="w-full bg-transparent text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none"
          />
          <button
            onClick={onClose}
            className="p-1 text-zinc-400 hover:text-zinc-700 rounded-md hover:bg-zinc-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Results List */}
        <div className="max-h-80 overflow-y-auto p-2 space-y-1">
          {filtered.length === 0 ? (
            <div className="py-8 text-center text-xs text-zinc-400">
              Tidak ada modul yang cocok dengan "{query}"
            </div>
          ) : (
            filtered.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onSelectModule(item.id);
                    onClose();
                  }}
                  className="w-full flex items-center justify-between p-2.5 hover:bg-zinc-100 rounded-lg text-left transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-zinc-100 border border-zinc-200 rounded-lg text-indigo-600 group-hover:bg-indigo-50">
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-zinc-800 group-hover:text-indigo-600">
                        {item.title}
                      </div>
                      <div className="text-[11px] text-zinc-500">{item.category}</div>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-zinc-400 group-hover:text-indigo-600 transition-transform group-hover:translate-x-0.5" />
                </button>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2 border-t border-zinc-200 bg-zinc-50 text-[11px] text-zinc-500 flex items-center justify-between">
          <span>Pilih perintah dengan klik atau Enter</span>
          <kbd className="px-1.5 py-0.5 bg-zinc-100 rounded border border-zinc-200 text-zinc-500 font-mono text-[10px]">
            ESC untuk menutup
          </kbd>
        </div>
      </div>
    </div>
  );
};
