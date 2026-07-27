import React, { useState, useEffect } from 'react';
import { BookOpen, Plus, Search, Tag, FileText, Code2, Wrench, ShieldAlert, Edit3, Save, Trash2, CheckCircle2, Eye } from 'lucide-react';
import type { NoteDoc } from '../../types/workspace';

const STORAGE_KEY = 'lepkom_hub_kb_docs';

const DEFAULT_DOCS: NoteDoc[] = [
  {
    id: '1',
    title: 'SOP Penanganan PC Lab Mati Total / No Display',
    category: 'SOP Teknis',
    icon: 'SOP',
    updatedAt: '2026-07-19',
    tags: ['Hardware', 'Lab', 'PC'],
    content: `1. Cek kabel power & saklar utama di Meja Instruktur/Panel Utama Lab.
2. Periksa RAM: lepas RAM, bersihkan pin dengan penghapus pensil, pasang kembali secara presisi.
3. Tes ganti kabel VGA / DisplayPort ke Monitor.
4. Jika fan tidak berputar sama sekali, lakukan swab PSU dengan unit cadangan di Gudang Teknis.`,
  },
  {
    id: '2',
    title: 'Command Restart Web Server & Queue Laravel ACT',
    category: 'Code Snippet',
    icon: 'CLI',
    updatedAt: '2026-07-18',
    tags: ['Laravel', 'CLI', 'ACT'],
    content: `php artisan config:clear
php artisan cache:clear
php artisan queue:restart
npm run build`,
  },
  {
    id: '3',
    title: 'Panduan Import User Moodle Bulk',
    category: 'Troubleshooting',
    icon: 'LMS',
    updatedAt: '2026-07-15',
    tags: ['Moodle', 'LMS', 'CSV'],
    content: `Pastikan header CSV menggunakan huruf kecil persis:
username,firstname,lastname,email,course1,role1
Jangan gunakan titik koma (;) sebagai delimiter. Gunakan koma (,).`,
  },
];

export const KnowledgeBaseModule: React.FC = () => {
  const [docs, setDocs] = useState<NoteDoc[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {
        console.error(e);
      }
    }
    return DEFAULT_DOCS;
  });

  const [activeDocId, setActiveDocId] = useState<string>(docs[0]?.id || '1');
  const [searchQuery, setSearchQuery] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Active doc object
  const activeDoc = docs.find((d) => d.id === activeDocId) || docs[0] || DEFAULT_DOCS[0];

  // Form edit states
  const [editTitle, setEditTitle] = useState(activeDoc.title);
  const [editCategory, setEditCategory] = useState(activeDoc.category);
  const [editTagsStr, setEditTagsStr] = useState(activeDoc.tags.join(', '));
  const [editContent, setEditContent] = useState(activeDoc.content);

  // Sync edit form when activeDocId changes or isEditing toggles
  useEffect(() => {
    if (activeDoc) {
      setEditTitle(activeDoc.title);
      setEditCategory(activeDoc.category);
      setEditTagsStr(activeDoc.tags.join(', '));
      setEditContent(activeDoc.content);
    }
  }, [activeDocId, activeDoc]);

  // Persist docs to localStorage
  const saveDocsToStorage = (updatedDocs: NoteDoc[]) => {
    setDocs(updatedDocs);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedDocs));
  };

  const filteredDocs = docs.filter(
    (d) =>
      d.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleAddNewDoc = () => {
    const newDoc: NoteDoc = {
      id: String(Date.now()),
      title: 'Dokumen SOP / Catatan Teknis Baru',
      category: 'SOP Teknis',
      icon: 'DOC',
      updatedAt: new Date().toLocaleDateString('id-ID'),
      tags: ['SOP', 'Teknis'],
      content: 'Tuliskan catatan teknis atau langkah SOP di sini...',
    };
    const updated = [newDoc, ...docs];
    saveDocsToStorage(updated);
    setActiveDocId(newDoc.id);
    setIsEditing(true);
    setToastMessage('Dokumen baru berhasil dibuat. Silakan edit detail di bawah.');
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleSaveDoc = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTitle.trim()) return;

    const parsedTags = editTagsStr
      .split(',')
      .map((t) => t.trim().replace(/^#/, ''))
      .filter(Boolean);

    const updatedDoc: NoteDoc = {
      ...activeDoc,
      title: editTitle.trim(),
      category: editCategory,
      tags: parsedTags.length > 0 ? parsedTags : ['Umum'],
      content: editContent,
      updatedAt: new Date().toLocaleDateString('id-ID'),
    };

    const updatedDocs = docs.map((d) => (d.id === activeDoc.id ? updatedDoc : d));
    saveDocsToStorage(updatedDocs);
    setIsEditing(false);

    setToastMessage('Dokumen berhasil disimpan!');
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleDeleteDoc = () => {
    if (!window.confirm(`Apakah Anda yakin ingin menghapus dokumen "${activeDoc.title}"?`)) {
      return;
    }

    const updatedDocs = docs.filter((d) => d.id !== activeDoc.id);
    saveDocsToStorage(updatedDocs);

    if (updatedDocs.length > 0) {
      setActiveDocId(updatedDocs[0].id);
    }
    setIsEditing(false);
    setToastMessage('Dokumen berhasil dihapus.');
    setTimeout(() => setToastMessage(null), 3000);
  };

  const getDocIcon = (category: string) => {
    if (category === 'SOP Teknis') return <Wrench className="w-4 h-4 text-indigo-600" />;
    if (category === 'Code Snippet') return <Code2 className="w-4 h-4 text-purple-600" />;
    if (category === 'Troubleshooting') return <ShieldAlert className="w-4 h-4 text-amber-600" />;
    return <FileText className="w-4 h-4 text-cyan-600" />;
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-200 max-w-7xl mx-auto">
      {/* Banner */}
      <div className="p-5 notion-card rounded-xl border border-cyan-200 bg-cyan-50/50 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-zinc-900 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-cyan-600" />
            Notion Technical Knowledge Base & SOP
          </h2>
          <p className="text-xs text-zinc-600 mt-1">
            Pusat dokumentasi internal teknis lab, SOP troubleshooting hardware/software, dan repository code snippet.
          </p>
        </div>

        <button
          onClick={handleAddNewDoc}
          className="px-3.5 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-sm shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Buat Dokumen Baru</span>
        </button>
      </div>

      {toastMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs rounded-lg flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sidebar Document List */}
        <div className="lg:col-span-1 notion-card p-4 rounded-xl space-y-3 bg-white border border-zinc-200 shadow-sm">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari SOP atau tag..."
              className="w-full bg-zinc-50 border border-zinc-200 rounded-lg pl-8 pr-3 py-1.5 text-xs text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-cyan-600"
            />
          </div>

          <div className="space-y-1.5 max-h-[600px] overflow-y-auto pr-1 scrollbar-thin">
            {filteredDocs.length === 0 ? (
              <div className="p-6 text-center text-xs text-zinc-400">Tidak ada dokumen yang ditemukan.</div>
            ) : (
              filteredDocs.map((doc) => {
                const isActive = activeDoc.id === doc.id;
                return (
                  <div
                    key={doc.id}
                    onClick={() => {
                      setActiveDocId(doc.id);
                      setIsEditing(false);
                    }}
                    className={`p-3 rounded-lg cursor-pointer transition-all border ${
                      isActive
                        ? 'bg-cyan-50 border-cyan-300 text-cyan-900 shadow-xs'
                        : 'bg-white border-zinc-200 text-zinc-700 hover:bg-zinc-50'
                    }`}
                  >
                    <div className="flex items-center gap-2 font-semibold text-xs text-zinc-900">
                      {getDocIcon(doc.category)}
                      <span className="truncate">{doc.title}</span>
                    </div>
                    <div className="mt-1.5 flex items-center justify-between text-[10px] text-zinc-500">
                      <span className="bg-zinc-100 text-zinc-600 px-1.5 py-0.5 rounded border border-zinc-200">{doc.category}</span>
                      <span className="font-mono">{doc.updatedAt}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Editor & View Area */}
        <div className="lg:col-span-2 notion-card p-6 rounded-xl space-y-5 bg-white border border-zinc-200 shadow-sm">
          {isEditing ? (
            /* EDIT FORM MODE */
            <form onSubmit={handleSaveDoc} className="space-y-4">
              <div className="flex items-center justify-between border-b border-zinc-200 pb-3">
                <div className="flex items-center gap-2 text-xs font-bold text-zinc-900">
                  <Edit3 className="w-4 h-4 text-cyan-600" />
                  <span>Mode Edit Dokumen</span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleDeleteDoc}
                    className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg text-xs font-semibold border border-rose-200 transition-colors flex items-center gap-1"
                    title="Hapus Dokumen"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Hapus</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="px-3 py-1.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-medium rounded-lg text-xs transition-colors border border-zinc-200 flex items-center gap-1"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Batal / Pratinjau</span>
                  </button>

                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-cyan-600 hover:bg-cyan-700 text-white font-bold rounded-lg text-xs transition-colors flex items-center gap-1.5 shadow-xs"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Simpan Perubahan</span>
                  </button>
                </div>
              </div>

              {/* Title & Category Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-600 mb-1">
                    Judul Dokumen SOP / Catatan
                  </label>
                  <input
                    type="text"
                    required
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    placeholder="Masukkan judul dokumen..."
                    className="w-full bg-zinc-50 border border-zinc-300 rounded-lg px-3 py-2 text-xs font-bold text-zinc-900 focus:outline-none focus:border-cyan-600"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-600 mb-1">
                    Kategori Dokumen
                  </label>
                  <select
                    value={editCategory}
                    onChange={(e) => setEditCategory(e.target.value as NoteDoc['category'])}
                    className="w-full bg-zinc-50 border border-zinc-300 rounded-lg px-2.5 py-2 text-xs font-semibold text-zinc-900 focus:outline-none focus:border-cyan-600"
                  >
                    <option value="SOP Teknis">SOP Teknis</option>
                    <option value="Code Snippet">Code Snippet</option>
                    <option value="Troubleshooting">Troubleshooting</option>
                    <option value="Catatan Lab">Catatan Lab</option>
                  </select>
                </div>
              </div>

              {/* Tags Edit */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-600 mb-1">
                  Tag / Label (Pisahkan dengan koma)
                </label>
                <input
                  type="text"
                  value={editTagsStr}
                  onChange={(e) => setEditTagsStr(e.target.value)}
                  placeholder="Hardware, Lab, PC, Network..."
                  className="w-full bg-zinc-50 border border-zinc-300 rounded-lg px-3 py-2 text-xs font-mono text-cyan-900 focus:outline-none focus:border-cyan-600"
                />
              </div>

              {/* Content Textarea */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-600 mb-1">
                  Isi Konten Dokumen (Markdown / Teks)
                </label>
                <textarea
                  rows={14}
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  placeholder="Tuliskan petunjuk teknis atau SOP secara detail di sini..."
                  className="w-full bg-zinc-50 border border-zinc-300 rounded-lg p-4 font-mono text-xs text-zinc-900 focus:outline-none focus:border-cyan-600 leading-relaxed"
                />
              </div>
            </form>
          ) : (
            /* PREVIEW / READ MODE */
            <>
              <div className="flex items-center justify-between border-b border-zinc-200 pb-3">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-cyan-100 rounded-xl">
                    {getDocIcon(activeDoc.category)}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-zinc-900">{activeDoc.title}</h3>
                    <div className="flex items-center gap-2 mt-0.5 text-[11px] text-zinc-500">
                      <span className="font-semibold text-cyan-800">{activeDoc.category}</span>
                      <span>•</span>
                      <span>Diperbarui {activeDoc.updatedAt}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleDeleteDoc}
                    className="p-1.5 hover:bg-rose-50 text-zinc-400 hover:text-rose-600 rounded-lg transition-colors border border-transparent hover:border-rose-200"
                    title="Hapus Dokumen Ini"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => setIsEditing(true)}
                    className="px-3.5 py-1.5 bg-cyan-600 hover:bg-cyan-700 text-white font-bold rounded-lg text-xs transition-colors flex items-center gap-1.5 shadow-xs"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Edit Dokumen</span>
                  </button>
                </div>
              </div>

              {/* Tags Display */}
              <div className="flex items-center gap-2">
                <Tag className="w-3.5 h-3.5 text-zinc-400" />
                <div className="flex items-center gap-1.5 flex-wrap">
                  {activeDoc.tags.map((tag, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-0.5 rounded-full bg-cyan-50 text-[10px] font-mono text-cyan-800 border border-cyan-200 font-semibold"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>

              {/* Body Content Display */}
              <div className="bg-zinc-50/70 border border-zinc-200 rounded-xl p-5 text-xs text-zinc-800 whitespace-pre-wrap font-mono leading-relaxed min-h-[350px]">
                {activeDoc.content}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

