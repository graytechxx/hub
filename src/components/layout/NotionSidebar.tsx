import React from 'react';
import {
  LayoutDashboard,
  Kanban,
  Upload,
  Calendar,
  FileSpreadsheet,
  Users,
  Ticket,
  MessageSquare,
  BookOpen,
  Settings,
  Command,
  PanelLeftClose,
  PanelLeftOpen,
  X
} from 'lucide-react';
import type { ModuleId } from '../../types/workspace';

interface NotionSidebarProps {
  currentModule: ModuleId;
  onSelectModule: (module: ModuleId) => void;
  onOpenCommandPalette: () => void;
  isConnectedToAct: boolean;
  collapsed: boolean;
  onToggleCollapse: () => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

export const NotionSidebar: React.FC<NotionSidebarProps> = ({
  currentModule,
  onSelectModule,
  onOpenCommandPalette,
  collapsed,
  onToggleCollapse,
  mobileOpen,
  onCloseMobile,
}) => {
  const mainWorkspaceItems = [
    { id: 'dashboard' as ModuleId, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'projects' as ModuleId, label: 'Tabel Tugas', icon: Kanban },
    { id: 'materi' as ModuleId, label: 'Upload Materi', icon: Upload },
    { id: 'jadwal' as ModuleId, label: 'Jadwal Praktikum', icon: Calendar },
    { id: 'excel-maker' as ModuleId, label: 'Excel Maker', icon: FileSpreadsheet },
    { id: 'moodle-bulk' as ModuleId, label: 'Moodle Bulk CSV', icon: Users },
    { id: 'act-user-bulk' as ModuleId, label: 'User ACT Bulk', icon: Users },
    { id: 'tickets' as ModuleId, label: 'Ticketing Desk', icon: Ticket },
    { id: 'chat' as ModuleId, label: 'Ruang Chat', icon: MessageSquare },
    { id: 'knowledge-base' as ModuleId, label: 'Knowledge Base', icon: BookOpen },
  ];

  const handleItemClick = (id: ModuleId) => {
    onSelectModule(id);
    onCloseMobile();
  };

  return (
    <>
      {/* Mobile Drawer Overlay Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-xs z-40 md:hidden transition-opacity"
          onClick={onCloseMobile}
        />
      )}

      {/* Main Sidebar Component */}
      <aside
        className={`
          fixed md:static inset-y-0 left-0 z-50 bg-zinc-50 border-r border-zinc-200 
          flex flex-col h-screen select-none shrink-0 text-zinc-700 font-sans transition-all duration-200 ease-in-out
          ${mobileOpen ? 'translate-x-0 w-64' : '-translate-x-full md:translate-x-0'}
          ${collapsed ? 'md:w-14' : 'md:w-56'}
        `}
      >
        {/* Workspace Title & Minimize Toggle */}
        <div className="px-3.5 py-3 border-b border-zinc-200 flex items-center justify-between h-14 shrink-0">
          {(!collapsed || mobileOpen) ? (
            <div className="flex items-center gap-2 overflow-hidden">
              <div className="w-5 h-5 bg-zinc-900 text-white rounded flex items-center justify-center font-extrabold text-[10px] shrink-0">
                L
              </div>
              <span className="text-xs font-semibold text-zinc-900 tracking-tight truncate">
                Lepkom Hub
              </span>
            </div>
          ) : (
            <div className="w-full flex justify-center">
              <div className="w-6 h-6 bg-zinc-900 text-white rounded flex items-center justify-center font-extrabold text-xs">
                L
              </div>
            </div>
          )}

          {/* Desktop Minimize Toggle Button */}
          <button
            onClick={onToggleCollapse}
            className="hidden md:flex p-1 text-zinc-400 hover:text-zinc-900 hover:bg-zinc-200/70 rounded transition-colors"
            title={collapsed ? 'Perluas Sidebar' : 'Kecilkan Sidebar'}
          >
            {collapsed ? <PanelLeftOpen className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
          </button>

          {/* Mobile Close Button */}
          <button
            onClick={onCloseMobile}
            className="md:hidden p-1 text-zinc-400 hover:text-zinc-900 hover:bg-zinc-200 rounded"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Quick Search Trigger */}
        <div className="p-2 border-b border-zinc-100">
          <button
            onClick={() => {
              onOpenCommandPalette();
              onCloseMobile();
            }}
            className={`
              w-full flex items-center bg-white hover:bg-zinc-100 border border-zinc-200 rounded text-xs text-zinc-500 transition-colors
              ${collapsed ? 'md:justify-center p-2' : 'justify-between px-2.5 py-1.5'}
            `}
            title="Cari (Ctrl+K)"
          >
            <span className="flex items-center gap-1.5 text-[11px]">
              <Command className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
              {(!collapsed || mobileOpen) && <span>Cari...</span>}
            </span>
            {(!collapsed || mobileOpen) && <kbd className="text-[10px] text-zinc-400 font-mono hidden sm:inline">Ctrl K</kbd>}
          </button>
        </div>

        {/* Navigation List */}
        <div className="flex-1 overflow-y-auto px-2 py-2 space-y-4">
          <div>
            {(!collapsed || mobileOpen) && (
              <div className="px-2 py-1 text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">
                Workspace
              </div>
            )}

            <nav className="mt-0.5 space-y-0.5">
              {mainWorkspaceItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentModule === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleItemClick(item.id)}
                    title={collapsed ? item.label : undefined}
                    className={`
                      w-full notion-sidebar-item flex items-center gap-2 rounded px-2 py-1.5 text-xs transition-colors
                      ${isActive ? 'bg-zinc-200/80 font-semibold text-zinc-900' : 'hover:bg-zinc-100 text-zinc-600'}
                      ${collapsed ? 'md:justify-center md:px-0' : ''}
                    `}
                  >
                    <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-zinc-900' : 'text-zinc-400'}`} />
                    {(!collapsed || mobileOpen) && (
                      <span className="truncate flex-1 text-left">{item.label}</span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>

          <div>
            {(!collapsed || mobileOpen) && (
              <div className="px-2 py-1 text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">
                Sistem
              </div>
            )}

            <nav className="mt-0.5 space-y-0.5">
              <button
                onClick={() => handleItemClick('settings')}
                title={collapsed ? 'Pengaturan API' : undefined}
                className={`
                  w-full notion-sidebar-item flex items-center gap-2 rounded px-2 py-1.5 text-xs transition-colors
                  ${currentModule === 'settings' ? 'bg-zinc-200/80 font-semibold text-zinc-900' : 'hover:bg-zinc-100 text-zinc-600'}
                  ${collapsed ? 'md:justify-center md:px-0' : ''}
                `}
              >
                <Settings className={`w-4 h-4 shrink-0 ${currentModule === 'settings' ? 'text-zinc-900' : 'text-zinc-400'}`} />
                {(!collapsed || mobileOpen) && (
                  <span className="truncate flex-1 text-left">Pengaturan API</span>
                )}
              </button>
            </nav>
          </div>
        </div>

        {/* Footer info */}
        {(!collapsed || mobileOpen) ? (
          <div className="p-3 border-t border-zinc-200 text-[11px] text-zinc-400 font-mono">
            Lepkom Hub v2.1
          </div>
        ) : (
          <div className="p-2 border-t border-zinc-200 text-[10px] text-zinc-400 font-mono text-center">
            v2.1
          </div>
        )}
      </aside>
    </>
  );
};
