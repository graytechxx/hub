import React, { useState } from 'react';
import { Plus, Search, Filter, Bell, Mail, Send, Trash2, Calendar, Tag, FileText } from 'lucide-react';
import type { ProjectItem, User } from '../../types/workspace';

interface ProjectTableModuleProps {
  currentUser: User | null;
}

export const ProjectTableModule: React.FC<ProjectTableModuleProps> = ({ currentUser }) => {
  const userEmail = currentUser ? currentUser.email : 'anggita@lepkom.gunadarma.ac.id';

  const [tasks, setTasks] = useState<ProjectItem[]>([
    {
      id: 'TASK-1',
      name: 'Pemeriksaan PC Lab Lanjut 2 & Instalasi VS Code',
      status: 'Sedang Dikerjakan',
      dueDate: '2026-07-22 14:00',
      priority: 'Tinggi',
      notes: 'Pastikan extension PHP & Python sudah terpasang',
      label: 'Lab Hardware',
      reminderEnabled: true,
      reminderEmail: userEmail,
      reminderStatus: 'Dijadwalkan',
    },
    {
      id: 'TASK-2',
      name: 'Upload Modul Praktikum Algoritma Pertemuan 2',
      status: 'Belum Mulai',
      dueDate: '2026-07-24 09:00',
      priority: 'Mendesak',
      notes: 'Format file PDF maksimal 10MB',
      label: 'Modul ACT',
      reminderEnabled: true,
      reminderEmail: userEmail,
      reminderStatus: 'Dijadwalkan',
    },
    {
      id: 'TASK-3',
      name: 'Export CSV Bulk Enrollment Moodle Kelas 2IA01',
      status: 'Selesai',
      dueDate: '2026-07-18 17:00',
      priority: 'Sedang',
      notes: 'Sudah disinkronkan dengan LMS Moodle',
      label: 'Moodle LMS',
      reminderEnabled: false,
      reminderEmail: userEmail,
      reminderStatus: 'Terkirim ke Email',
    },
  ]);

  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('All');
  const [showAddRow, setShowAddRow] = useState(false);
  const [notificationToast, setNotificationToast] = useState<string | null>(null);

  // New Row State
  const [name, setName] = useState('');
  const [status, setStatus] = useState<ProjectItem['status']>('Belum Mulai');
  const [dueDate, setDueDate] = useState('');
  const [priority, setPriority] = useState<ProjectItem['priority']>('Sedang');
  const [notes, setNotes] = useState('');
  const [label, setLabel] = useState('Teknis');
  const [reminderEnabled, setReminderEnabled] = useState(true);

  const filteredTasks = tasks.filter((t) => {
    const matchesSearch =
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.notes.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === 'All' || t.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const handleTaskFieldUpdate = (id: string, field: keyof ProjectItem, value: any) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, [field]: value } : t))
    );
  };

  const handleAddRowSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;

    const newTask: ProjectItem = {
      id: `TASK-${tasks.length + 1}`,
      name,
      status,
      dueDate: dueDate || new Date().toISOString().slice(0, 16).replace('T', ' '),
      priority,
      notes,
      label: label || 'Teknis',
      reminderEnabled,
      reminderEmail: userEmail,
      reminderStatus: reminderEnabled ? 'Dijadwalkan' : 'Nonaktif',
    };

    setTasks([newTask, ...tasks]);

    if (reminderEnabled) {
      triggerEmailToast(`Pengingat tugas "${name}" dijadwalkan ke ${userEmail}`);
    }

    setName('');
    setNotes('');
    setDueDate('');
    setShowAddRow(false);
  };

  const handleDeleteTask = (id: string) => {
    setTasks(tasks.filter((t) => t.id !== id));
  };

  const toggleReminder = (id: string) => {
    setTasks(
      tasks.map((t) => {
        if (t.id === id) {
          const nextEnabled = !t.reminderEnabled;
          if (nextEnabled) {
            triggerEmailToast(`Pengingat diaktifkan ke ${t.reminderEmail || userEmail}`);
          }
          return {
            ...t,
            reminderEnabled: nextEnabled,
            reminderStatus: nextEnabled ? 'Dijadwalkan' : 'Nonaktif',
          };
        }
        return t;
      })
    );
  };

  const triggerSendEmailReminderNow = (task: ProjectItem) => {
    setTasks(tasks.map((t) => (t.id === task.id ? { ...t, reminderStatus: 'Terkirim ke Email' } : t)));
    triggerEmailToast(`[Simulasi Email] Email pengingat "${task.name}" dikirim ke ${task.reminderEmail || userEmail}`);
  };

  const triggerEmailToast = (msg: string) => {
    setNotificationToast(msg);
    setTimeout(() => setNotificationToast(null), 3500);
  };

  return (
    <div className="space-y-4 max-w-7xl mx-auto text-xs text-zinc-800">
      {/* Quiet Toast */}
      {notificationToast && (
        <div className="p-2.5 bg-zinc-900 text-zinc-100 rounded-md text-xs flex items-center justify-between shadow-xs animate-in fade-in">
          <div className="flex items-center gap-2">
            <Mail className="w-3.5 h-3.5 text-zinc-400" />
            <span className="truncate">{notificationToast}</span>
          </div>
          <span className="text-[10px] text-zinc-400 font-mono shrink-0 ml-2">Notified</span>
        </div>
      )}

      {/* Database Title & Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-1">
        <div>
          <h2 className="text-sm font-bold text-zinc-900">Database Tugas</h2>
          <p className="text-xs text-zinc-500">Tabel tugas teknis dengan edit langsung (inline editable) & pengingat email.</p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
          {/* Search */}
          <div className="relative w-full sm:w-48 md:w-64">
            <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-2.5 top-2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter tugas..."
              className="w-full bg-zinc-50 border border-zinc-200 rounded pl-8 pr-2.5 py-1 text-xs text-zinc-900 focus:outline-none focus:border-zinc-400"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {/* Filter Status */}
            <div className="flex items-center gap-1 bg-zinc-50 border border-zinc-200 rounded px-2 py-1 flex-1 sm:flex-none">
              <Filter className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="bg-transparent text-zinc-700 text-xs focus:outline-none w-full"
              >
                <option value="All">Semua Status</option>
                <option value="Belum Mulai">Belum Mulai</option>
                <option value="Sedang Dikerjakan">Sedang Dikerjakan</option>
                <option value="Menunggu Review">Menunggu Review</option>
                <option value="Selesai">Selesai</option>
              </select>
            </div>

            <button
              onClick={() => setShowAddRow(!showAddRow)}
              className="px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-white rounded text-xs font-medium flex items-center justify-center gap-1 transition-colors shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Tambah Tugas</span>
            </button>
          </div>
        </div>
      </div>

      {/* Add New Row Form */}
      {showAddRow && (
        <form onSubmit={handleAddRowSubmit} className="p-3 border border-zinc-300 rounded bg-zinc-50 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <div>
              <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-0.5">Nama Tugas *</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nama tugas baru..."
                className="w-full bg-white border border-zinc-200 rounded px-2.5 py-1 text-xs focus:outline-none focus:border-zinc-400"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-0.5">Tenggat Waktu</label>
              <input
                type="text"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                placeholder="YYYY-MM-DD HH:mm"
                className="w-full bg-white border border-zinc-200 rounded px-2.5 py-1 text-xs font-mono focus:outline-none focus:border-zinc-400"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-0.5">Label Kategori</label>
              <input
                type="text"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="Misal: Hardware, ACT"
                className="w-full bg-white border border-zinc-200 rounded px-2.5 py-1 text-xs focus:outline-none focus:border-zinc-400"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div>
              <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-0.5">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="w-full bg-white border border-zinc-200 rounded px-2 py-1 text-xs"
              >
                <option value="Belum Mulai">Belum Mulai</option>
                <option value="Sedang Dikerjakan">Sedang Dikerjakan</option>
                <option value="Menunggu Review">Menunggu Review</option>
                <option value="Selesai">Selesai</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-0.5">Prioritas</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as any)}
                className="w-full bg-white border border-zinc-200 rounded px-2 py-1 text-xs"
              >
                <option value="Rendah">Rendah</option>
                <option value="Sedang">Sedang</option>
                <option value="Tinggi">Tinggi</option>
                <option value="Mendesak">Mendesak</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-0.5">Catatan</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Catatan rincian tugas..."
              className="w-full bg-white border border-zinc-200 rounded p-2 text-xs focus:outline-none focus:border-zinc-400"
            />
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1">
            <label className="flex items-center gap-1.5 text-xs text-zinc-600 cursor-pointer">
              <input
                type="checkbox"
                checked={reminderEnabled}
                onChange={(e) => setReminderEnabled(e.target.checked)}
                className="rounded border-zinc-300"
              />
              <span>Kirim pengingat ke <strong className="font-mono">{userEmail}</strong></span>
            </label>

            <div className="flex gap-1.5 justify-end">
              <button
                type="button"
                onClick={() => setShowAddRow(false)}
                className="px-2.5 py-1 text-xs text-zinc-500 hover:text-zinc-800"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-3 py-1 bg-zinc-900 text-white rounded text-xs font-medium"
              >
                Simpan Tugas
              </button>
            </div>
          </div>
        </form>
      )}

      {/* 1. DESKTOP VIEW: Full Notion Spreadsheet Table (md:block) */}
      <div className="hidden md:block border border-zinc-200 rounded overflow-hidden bg-white">
        <div className="overflow-x-auto min-w-[900px]">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-zinc-50 border-b border-zinc-200 text-zinc-500 font-mono text-[11px]">
                <th className="py-2 px-3 font-medium border-r border-zinc-200 w-[240px]">1. Nama Tugas</th>
                <th className="py-2 px-3 font-medium border-r border-zinc-200 w-[140px]">2. Status</th>
                <th className="py-2 px-3 font-medium border-r border-zinc-200 w-[140px]">3. Tenggat Waktu</th>
                <th className="py-2 px-3 font-medium border-r border-zinc-200 w-[110px]">4. Prioritas</th>
                <th className="py-2 px-3 font-medium border-r border-zinc-200 w-[180px]">5. Catatan</th>
                <th className="py-2 px-3 font-medium border-r border-zinc-200 w-[120px]">6. Label</th>
                <th className="py-2 px-3 font-medium border-r border-zinc-200 w-[200px]">7. Pengingat Email</th>
                <th className="py-2 px-2 font-medium text-center w-[40px]"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 text-zinc-900">
              {filteredTasks.map((t) => (
                <tr key={t.id} className="hover:bg-zinc-50/70 transition-colors">
                  {/* 1. Nama Tugas */}
                  <td className="py-1.5 px-3 border-r border-zinc-100">
                    <input
                      type="text"
                      value={t.name}
                      onChange={(e) => handleTaskFieldUpdate(t.id, 'name', e.target.value)}
                      className="w-full bg-transparent focus:bg-white focus:outline-none focus:ring-1 focus:ring-zinc-400 font-medium px-1 rounded"
                    />
                  </td>

                  {/* 2. Status */}
                  <td className="py-1.5 px-2 border-r border-zinc-100">
                    <select
                      value={t.status}
                      onChange={(e) => handleTaskFieldUpdate(t.id, 'status', e.target.value as any)}
                      className="w-full bg-transparent focus:bg-white focus:outline-none text-xs font-medium text-zinc-700 px-1 py-0.5 rounded cursor-pointer"
                    >
                      <option value="Belum Mulai">Belum Mulai</option>
                      <option value="Sedang Dikerjakan">Sedang Dikerjakan</option>
                      <option value="Menunggu Review">Menunggu Review</option>
                      <option value="Selesai">Selesai</option>
                    </select>
                  </td>

                  {/* 3. Tenggat Waktu */}
                  <td className="py-1.5 px-2 border-r border-zinc-100 font-mono text-[11px] text-zinc-600">
                    <input
                      type="text"
                      value={t.dueDate}
                      onChange={(e) => handleTaskFieldUpdate(t.id, 'dueDate', e.target.value)}
                      className="w-full bg-transparent focus:bg-white focus:outline-none px-1 rounded"
                    />
                  </td>

                  {/* 4. Prioritas */}
                  <td className="py-1.5 px-2 border-r border-zinc-100 font-mono text-[11px]">
                    <select
                      value={t.priority}
                      onChange={(e) => handleTaskFieldUpdate(t.id, 'priority', e.target.value as any)}
                      className="w-full bg-transparent focus:bg-white focus:outline-none px-1 py-0.5 rounded cursor-pointer text-zinc-700 font-medium"
                    >
                      <option value="Rendah">Rendah</option>
                      <option value="Sedang">Sedang</option>
                      <option value="Tinggi">Tinggi</option>
                      <option value="Mendesak">Mendesak</option>
                    </select>
                  </td>

                  {/* 5. Catatan */}
                  <td className="py-1.5 px-2 border-r border-zinc-100 text-zinc-600">
                    <input
                      type="text"
                      value={t.notes}
                      onChange={(e) => handleTaskFieldUpdate(t.id, 'notes', e.target.value)}
                      placeholder="Catatan..."
                      className="w-full bg-transparent focus:bg-white focus:outline-none px-1 rounded text-zinc-600"
                    />
                  </td>

                  {/* 6. Label */}
                  <td className="py-1.5 px-2 border-r border-zinc-100">
                    <input
                      type="text"
                      value={t.label}
                      onChange={(e) => handleTaskFieldUpdate(t.id, 'label', e.target.value)}
                      className="w-full bg-transparent focus:bg-white focus:outline-none text-[11px] font-mono font-medium text-zinc-700 px-1 rounded"
                    />
                  </td>

                  {/* 7. Pengingat Email */}
                  <td className="py-1.5 px-2 border-r border-zinc-100">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => toggleReminder(t.id)}
                        className={`p-1 rounded ${t.reminderEnabled ? 'text-zinc-900 bg-zinc-200' : 'text-zinc-400'}`}
                        title="Toggle Pengingat"
                      >
                        <Bell className="w-3 h-3" />
                      </button>
                      <input
                        type="email"
                        value={t.reminderEmail}
                        onChange={(e) => handleTaskFieldUpdate(t.id, 'reminderEmail', e.target.value)}
                        className="w-full bg-transparent focus:bg-white focus:outline-none text-[11px] font-mono text-zinc-700 px-1 rounded"
                      />
                      <button
                        onClick={() => triggerSendEmailReminderNow(t)}
                        className="p-1 text-zinc-500 hover:text-zinc-900"
                        title="Kirim email pengingat"
                      >
                        <Send className="w-3 h-3" />
                      </button>
                    </div>
                  </td>

                  {/* Delete */}
                  <td className="py-1.5 px-1 text-center">
                    <button
                      onClick={() => handleDeleteTask(t.id)}
                      className="p-1 text-zinc-300 hover:text-rose-600 rounded transition-colors"
                      title="Hapus"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 2. MOBILE VIEW: Mobile-Friendly Editable Task Cards (md:hidden) */}
      <div className="block md:hidden space-y-3">
        {filteredTasks.length === 0 ? (
          <div className="p-8 text-center text-zinc-400 border border-dashed border-zinc-200 rounded-lg">
            Tidak ada tugas ditemukan.
          </div>
        ) : (
          filteredTasks.map((t) => (
            <div key={t.id} className="border border-zinc-200 rounded-lg p-3.5 bg-white space-y-3 shadow-2xs">
              {/* Header: Nama Tugas & Delete */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-0.5">Nama Tugas</label>
                  <input
                    type="text"
                    value={t.name}
                    onChange={(e) => handleTaskFieldUpdate(t.id, 'name', e.target.value)}
                    className="w-full font-bold text-xs text-zinc-900 bg-zinc-50 border border-zinc-200 rounded px-2 py-1 focus:bg-white focus:outline-none focus:border-zinc-400"
                  />
                </div>
                <button
                  onClick={() => handleDeleteTask(t.id)}
                  className="p-1 text-zinc-400 hover:text-rose-600 rounded shrink-0 mt-4"
                  title="Hapus Tugas"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {/* Grid 1: Status & Prioritas */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-0.5">Status</label>
                  <select
                    value={t.status}
                    onChange={(e) => handleTaskFieldUpdate(t.id, 'status', e.target.value as any)}
                    className="w-full bg-zinc-50 border border-zinc-200 text-xs font-semibold text-zinc-800 rounded px-2 py-1 focus:outline-none"
                  >
                    <option value="Belum Mulai">Belum Mulai</option>
                    <option value="Sedang Dikerjakan">Sedang Dikerjakan</option>
                    <option value="Menunggu Review">Menunggu Review</option>
                    <option value="Selesai">Selesai</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-0.5">Prioritas</label>
                  <select
                    value={t.priority}
                    onChange={(e) => handleTaskFieldUpdate(t.id, 'priority', e.target.value as any)}
                    className="w-full bg-zinc-50 border border-zinc-200 text-xs font-semibold text-zinc-800 rounded px-2 py-1 focus:outline-none"
                  >
                    <option value="Rendah">Rendah</option>
                    <option value="Sedang">Sedang</option>
                    <option value="Tinggi">Tinggi</option>
                    <option value="Mendesak">Mendesak</option>
                  </select>
                </div>
              </div>

              {/* Grid 2: Tenggat Waktu & Label */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-0.5 flex items-center gap-1">
                    <Calendar className="w-3 h-3" /> Tenggat
                  </label>
                  <input
                    type="text"
                    value={t.dueDate}
                    onChange={(e) => handleTaskFieldUpdate(t.id, 'dueDate', e.target.value)}
                    className="w-full bg-zinc-50 border border-zinc-200 text-xs font-mono text-zinc-800 rounded px-2 py-1 focus:bg-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-0.5 flex items-center gap-1">
                    <Tag className="w-3 h-3" /> Label
                  </label>
                  <input
                    type="text"
                    value={t.label}
                    onChange={(e) => handleTaskFieldUpdate(t.id, 'label', e.target.value)}
                    className="w-full bg-zinc-50 border border-zinc-200 text-xs font-mono font-medium text-zinc-800 rounded px-2 py-1 focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              {/* Catatan */}
              <div>
                <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-0.5 flex items-center gap-1">
                  <FileText className="w-3 h-3" /> Catatan
                </label>
                <input
                  type="text"
                  value={t.notes}
                  onChange={(e) => handleTaskFieldUpdate(t.id, 'notes', e.target.value)}
                  placeholder="Tambah catatan..."
                  className="w-full bg-zinc-50 border border-zinc-200 text-xs text-zinc-700 rounded px-2 py-1 focus:bg-white focus:outline-none"
                />
              </div>

              {/* Pengingat Email & Actions */}
              <div className="pt-2 border-t border-zinc-100 flex flex-col gap-1.5">
                <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Pengingat Email</label>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => toggleReminder(t.id)}
                    className={`p-1.5 rounded text-xs flex items-center gap-1 font-medium ${
                      t.reminderEnabled ? 'bg-zinc-900 text-white' : 'bg-zinc-100 text-zinc-400'
                    }`}
                  >
                    <Bell className="w-3.5 h-3.5" />
                    <span>{t.reminderEnabled ? 'On' : 'Off'}</span>
                  </button>

                  <input
                    type="email"
                    value={t.reminderEmail}
                    onChange={(e) => handleTaskFieldUpdate(t.id, 'reminderEmail', e.target.value)}
                    className="flex-1 bg-zinc-50 border border-zinc-200 text-xs font-mono text-zinc-800 rounded px-2 py-1 focus:bg-white focus:outline-none truncate"
                  />

                  <button
                    onClick={() => triggerSendEmailReminderNow(t)}
                    className="p-1.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded shrink-0"
                    title="Kirim email pengingat"
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
