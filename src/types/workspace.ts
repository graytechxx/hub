export type ModuleId = 
  | 'dashboard'
  | 'projects'
  | 'materi'
  | 'jadwal'
  | 'excel-maker'
  | 'moodle-bulk'
  | 'act-user-bulk'
  | 'tickets'
  | 'chat'
  | 'knowledge-base'
  | 'settings';

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'Superadmin' | 'Staff Teknis' | 'Asisten PJ' | 'Asisten';
  avatar?: string;
  tag?: string;
}

export interface ProjectItem {
  id: string;
  name: string; // Nama Tugas
  status: 'Belum Mulai' | 'Sedang Dikerjakan' | 'Menunggu Review' | 'Selesai'; // Status
  dueDate: string; // Tenggat Waktu
  priority: 'Rendah' | 'Sedang' | 'Tinggi' | 'Mendesak'; // Prioritas
  notes: string; // Catatan
  label: string; // Label
  reminderEnabled: boolean; // Pengingat
  reminderEmail: string; // Email yang dipakai login
  reminderStatus: 'Nonaktif' | 'Dijadwalkan' | 'Terkirim ke Email';
}

export interface ChatMessage {
  id: string;
  senderName: string;
  senderRole: string;
  senderAvatar?: string;
  content: string;
  timestamp: string;
  isMe?: boolean;
  codeSnippet?: string;
}

export interface ActConfig {
  baseUrl: string;
  apiKey: string;
  isConnected: boolean;
  lastChecked?: string;
}

export interface Ticket {
  id: string;
  title: string;
  category: 'PC/Hardware' | 'Software/Lab' | 'Asisten' | 'Jadwal' | 'Lainnya';
  status: 'Backlog' | 'In Progress' | 'Resolved' | 'Cancelled';
  priority: 'Low' | 'Medium' | 'High' | 'Urgent';
  assignee: string;
  room?: string;
  createdAt: string;
  description: string;
}

export interface MaterialItem {
  id: string;
  title: string;
  courseName: string;
  level: string;
  meeting: number;
  fileName: string;
  fileSize: string;
  uploadedAt: string;
  syncedToAct: boolean;
}

export interface ScheduleItem {
  id: string;
  day: string;
  shift: string;
  course: string;
  class: string;
  room: string;
  assistant: string;
  status: 'Pending' | 'Uploaded to ACT' | 'Draft';
}

export interface MoodleUserRecord {
  username: string;
  firstname: string;
  lastname: string;
  email: string;
  course1: string;
  role1: string;
}

export interface NoteDoc {
  id: string;
  title: string;
  icon: string;
  category: 'SOP Teknis' | 'Code Snippet' | 'Catatan Lab' | 'Troubleshooting';
  content: string;
  updatedAt: string;
  tags: string[];
}
