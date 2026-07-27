import React, { useState } from 'react';
import { MessageSquare, Send, Code, User, Trash2 } from 'lucide-react';
import type { ChatMessage, User as UserType } from '../../types/workspace';
import { getActConfig } from '../../services/actApi';

interface ChatModuleProps {
  currentUser: UserType | null;
  onOpenAuth: () => void;
}

export const ChatModule: React.FC<ChatModuleProps> = ({ currentUser, onOpenAuth }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [inputCode, setInputCode] = useState('');
  const [showCodeInput, setShowCodeInput] = useState(false);

  const handleClearChat = async () => {
    if (!confirm('Apakah Anda yakin ingin menghapus seluruh pesan di ruang chat ini?')) return;
    setMessages([]);
    try {
      const cfg = getActConfig();
      await fetch(`${cfg.baseUrl}/api/hub/chat/clear`, { method: 'POST' });
    } catch (e) {}
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() && !inputCode.trim()) return;

    const senderName = currentUser ? currentUser.name : 'Asisten (Guest)';
    const senderRole = currentUser ? currentUser.role : 'Asisten Jaga';

    const newMsg: ChatMessage = {
      id: String(Date.now()),
      senderName,
      senderRole,
      content: inputMessage,
      timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
      isMe: true,
      codeSnippet: inputCode.trim() || undefined,
    };

    setMessages([...messages, newMsg]);
    setInputMessage('');
    setInputCode('');
    setShowCodeInput(false);
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-200">
      {/* Banner */}
      <div className="p-5 notion-card rounded-xl border border-indigo-200 bg-indigo-50/50 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-zinc-900 flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-indigo-600" />
            Ruang Chat & Koordinasi Asisten / Staff
          </h2>
          <p className="text-xs text-zinc-600 mt-1">
            Kanal obrolan teknis internal untuk diskusi laboratorium, berbagi snippet kode, dan update jadwal.
          </p>
        </div>

        {!currentUser && (
          <button
            onClick={onOpenAuth}
            className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-sm shrink-0"
          >
            <User className="w-4 h-4" />
            <span>Login Pengirim Chat</span>
          </button>
        )}
      </div>

      {/* Chat Messages Container */}
      <div className="notion-card rounded-xl border border-zinc-200 flex flex-col h-[520px] overflow-hidden shadow-2xs">
        {/* Messages Header Bar */}
        <div className="px-4 py-3 bg-zinc-100 border-b border-zinc-200 flex items-center justify-between">
          <span className="text-xs font-bold text-zinc-800 font-mono"># ruang-teknis-lepkom</span>
          <div className="flex items-center gap-3">
            <span className="text-[11px] text-zinc-500 font-medium hidden sm:inline">
              Tersambung sebagai: <strong className="text-indigo-600">{currentUser ? currentUser.name : 'Guest (Asisten)'}</strong>
            </span>
            <button
              onClick={handleClearChat}
              className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded text-xs font-semibold transition-colors flex items-center gap-1"
              title="Bersihkan Semua Chat"
            >
              <Trash2 className="w-3 h-3" />
              <span>Clear Chat</span>
            </button>
          </div>
        </div>

        {/* Message Feed */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-zinc-50/40">
          {messages.map((msg) => {
            const isSelf = msg.isMe || (currentUser && msg.senderName.includes(currentUser.name));
            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isSelf ? 'items-end' : 'items-start'}`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-bold text-zinc-900">{msg.senderName}</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-zinc-200 text-zinc-700 font-mono font-medium">
                    {msg.senderRole}
                  </span>
                  <span className="text-[10px] text-zinc-400 font-mono">{msg.timestamp}</span>
                </div>

                <div
                  className={`p-3 rounded-xl max-w-xl text-xs leading-relaxed ${
                    isSelf
                      ? 'bg-indigo-600 text-white font-medium rounded-tr-none shadow-2xs'
                      : 'bg-white border border-zinc-200 text-zinc-800 rounded-tl-none shadow-2xs'
                  }`}
                >
                  {msg.content}

                  {msg.codeSnippet && (
                    <div className="mt-2 p-2.5 bg-zinc-900 text-emerald-400 font-mono text-[11px] rounded-lg overflow-x-auto border border-zinc-700">
                      <pre>{msg.codeSnippet}</pre>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Optional Code Snippet Drawer */}
        {showCodeInput && (
          <div className="p-3 bg-zinc-900 border-t border-zinc-800 text-xs font-mono space-y-2">
            <div className="flex items-center justify-between text-zinc-300 font-semibold">
              <span className="flex items-center gap-1.5">
                <Code className="w-4 h-4 text-emerald-400" />
                Sisipkan Code Snippet / Script
              </span>
              <button
                onClick={() => setShowCodeInput(false)}
                className="text-zinc-500 hover:text-zinc-300"
              >
                Tutup
              </button>
            </div>
            <textarea
              rows={3}
              value={inputCode}
              onChange={(e) => setInputCode(e.target.value)}
              placeholder="Tempelkan snippet kode di sini (misal: command terminal / SQL)..."
              className="w-full bg-zinc-950 text-emerald-300 border border-zinc-700 rounded-lg p-2 focus:outline-none"
            />
          </div>
        )}

        {/* Input Bar */}
        <form onSubmit={handleSendMessage} className="p-3 bg-white border-t border-zinc-200 flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowCodeInput(!showCodeInput)}
            className={`p-2 rounded-lg border transition-colors ${
              showCodeInput ? 'bg-indigo-100 border-indigo-300 text-indigo-700' : 'bg-zinc-100 border-zinc-200 text-zinc-600 hover:bg-zinc-200'
            }`}
            title="Tambah Code Snippet"
          >
            <Code className="w-4 h-4" />
          </button>

          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder="Tulis pesan ke ruang chat teknis..."
            className="flex-1 bg-zinc-50 border border-zinc-300 rounded-lg px-3 py-2 text-xs text-zinc-900 focus:outline-none focus:border-indigo-600"
          />

          <button
            type="submit"
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 shadow-xs"
          >
            <Send className="w-4 h-4" />
            <span>Kirim</span>
          </button>
        </form>
      </div>
    </div>
  );
};
