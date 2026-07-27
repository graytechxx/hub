import { useState, useEffect } from 'react';
import type { ModuleId, MaterialItem, Ticket, ActConfig, User } from './types/workspace';
import { getActConfig, checkActConnection } from './services/actApi';
import { NotionSidebar } from './components/layout/NotionSidebar';
import { NotionHeader } from './components/layout/NotionHeader';
import { CommandPalette } from './components/layout/CommandPalette';
import { AuthModal } from './components/auth/AuthModal';
import { DashboardModule } from './components/modules/DashboardModule';
import { ProjectTableModule } from './components/modules/ProjectTableModule';
import { MateriModule } from './components/modules/MateriModule';
import { JadwalModule } from './components/modules/JadwalModule';
import { ExcelMakerModule } from './components/modules/ExcelMakerModule';
import { MoodleBulkModule } from './components/modules/MoodleBulkModule';
import { ActUserBulkModule } from './components/modules/ActUserBulkModule';
import { TicketModule } from './components/modules/TicketModule';
import { ChatModule } from './components/modules/ChatModule';
import { KnowledgeBaseModule } from './components/modules/KnowledgeBaseModule';
import { SettingsModule } from './components/modules/SettingsModule';

const AUTH_USER_KEY = 'lepkom_hub_auth_user';
const SIDEBAR_COLLAPSED_KEY = 'lepkom_sidebar_collapsed';

export function App() {
  const [currentModule, setCurrentModule] = useState<ModuleId>('dashboard');
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [actConfig, setActConfig] = useState<ActConfig>(getActConfig());

  // Sidebar minimize & mobile state
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(() => {
    return localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === 'true';
  });
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    if (window.innerWidth < 768) {
      setMobileSidebarOpen((prev) => !prev);
    } else {
      setSidebarCollapsed((prev) => {
        const next = !prev;
        localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(next));
        return next;
      });
    }
  };

  // User state
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem(AUTH_USER_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return {
      id: '1',
      name: 'Anggita (Staff Teknis)',
      email: 'anggita@lepkom.gunadarma.ac.id',
      role: 'Staff Teknis',
      tag: 'TEKNIS',
    };
  });

  // Workspace state with default dummy mock data for offline resilience
  const [materials, setMaterials] = useState<MaterialItem[]>([
    {
      id: '1',
      title: 'Modul 01 - Pengenalan Algoritma.pdf',
      courseName: 'Algoritma & Pemrograman 1',
      level: 'Dasar',
      meeting: 1,
      fileName: 'Modul_01_Algo.pdf',
      fileSize: '1.45 MB',
      uploadedAt: '2026-07-20',
      syncedToAct: true,
    },
  ]);

  const [tickets, setTickets] = useState<Ticket[]>([
    {
      id: 'TICK-101',
      title: 'PC 08 Lab Lanjut 2 mati mendadak saat praktikum',
      category: 'PC/Hardware',
      status: 'In Progress',
      priority: 'Urgent',
      assignee: 'Budi (Teknisi)',
      room: 'Lab Lanjut 2',
      createdAt: '2026-07-20',
      description: 'Fan prosessor berbunyi bising lalu PC mati sendiri saat menjalankan VS Code.',
    },
    {
      id: 'TICK-102',
      title: 'Update Moodle Quiz Kelas 2IA05 belum tersambung',
      category: 'Software/Lab',
      status: 'Backlog',
      priority: 'High',
      assignee: 'Asisten PJ',
      room: 'Lab Komputasi',
      createdAt: '2026-07-19',
      description: 'Enrollment key belum terdaftar untuk praktikan susulan.',
    },
  ]);

  // Initial ACT Server Connectivity check
  useEffect(() => {
    const initCheck = async () => {
      const ok = await checkActConnection(actConfig);
      setActConfig((prev) => ({ ...prev, isConnected: ok }));
    };
    initCheck();
  }, []);

  const handleRefresh = async () => {
    const ok = await checkActConnection(actConfig);
    setActConfig((prev) => ({ ...prev, isConnected: ok }));
  };

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem(AUTH_USER_KEY);
  };

  const handleAddMaterial = (mat: MaterialItem) => {
    setMaterials((prev) => [mat, ...prev]);
  };

  const handleAddTicket = (t: Ticket) => {
    setTickets((prev) => [t, ...prev]);
  };

  const handleUpdateTicketStatus = (id: string, status: Ticket['status']) => {
    setTickets((prev) =>
      prev.map((t) => (t.id === id ? { ...t, status } : t))
    );
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-white text-zinc-900 font-sans">
      {/* Notion Collapsible & Responsive Sidebar */}
      <NotionSidebar
        currentModule={currentModule}
        onSelectModule={setCurrentModule}
        onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
        isConnectedToAct={actConfig.isConnected}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => {
          setSidebarCollapsed((prev) => {
            const next = !prev;
            localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(next));
            return next;
          });
        }}
        mobileOpen={mobileSidebarOpen}
        onCloseMobile={() => setMobileSidebarOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden bg-white min-w-0">
        {/* Header Bar */}
        <NotionHeader
          currentModule={currentModule}
          actBaseUrl={actConfig.baseUrl}
          isConnected={actConfig.isConnected}
          currentUser={currentUser}
          sidebarCollapsed={sidebarCollapsed}
          onToggleSidebar={toggleSidebar}
          onRefresh={handleRefresh}
          onOpenAuth={() => setIsAuthModalOpen(true)}
          onSelectModule={setCurrentModule}
        />

        {/* Dynamic Module Router */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8">
          {currentModule === 'dashboard' && (
            <DashboardModule
              onSelectModule={setCurrentModule}
              isConnected={actConfig.isConnected}
              tickets={tickets}
            />
          )}

          {currentModule === 'projects' && <ProjectTableModule currentUser={currentUser} />}

          {currentModule === 'materi' && (
            <MateriModule
              materials={materials}
              onAddMaterial={handleAddMaterial}
            />
          )}

          {currentModule === 'jadwal' && <JadwalModule />}

          {currentModule === 'excel-maker' && <ExcelMakerModule />}

          {currentModule === 'moodle-bulk' && <MoodleBulkModule />}

          {currentModule === 'act-user-bulk' && <ActUserBulkModule />}

          {currentModule === 'tickets' && (
            <TicketModule
              tickets={tickets}
              onAddTicket={handleAddTicket}
              onUpdateTicketStatus={handleUpdateTicketStatus}
            />
          )}

          {currentModule === 'chat' && (
            <ChatModule
              currentUser={currentUser}
              onOpenAuth={() => setIsAuthModalOpen(true)}
            />
          )}

          {currentModule === 'knowledge-base' && <KnowledgeBaseModule />}

          {currentModule === 'settings' && (
            <SettingsModule
              config={actConfig}
              onUpdateConfig={setActConfig}
            />
          )}
        </main>
      </div>

      {/* Cmd+K / Ctrl+K Command Palette */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        onSelectModule={setCurrentModule}
      />

      {/* Login & Profile Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        currentUser={currentUser}
        onClose={() => setIsAuthModalOpen(false)}
        onLogin={handleLogin}
        onLogout={handleLogout}
      />
    </div>
  );
}

export default App;
