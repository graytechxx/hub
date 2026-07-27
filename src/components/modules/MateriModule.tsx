import React, { useState, useEffect, useCallback } from 'react';
import { Upload, FileText, CheckCircle2, AlertCircle, RefreshCw, Send, Layers, Link as LinkIcon, ExternalLink, Search, Folder, Trash2 } from 'lucide-react';
import type { MaterialItem } from '../../types/workspace';
import { uploadMaterialToAct, createMaterialLinkInAct, fetchActMaterials, deleteActMaterial } from '../../services/actApi';

interface MateriModuleProps {
  materials?: MaterialItem[];
  onAddMaterial: (mat: MaterialItem) => void;
}

// Official act-lepkom-v2 level & course structure from CourseSeeder
const ACT_COURSES_BY_LEVEL: Record<string, { id: string; name: string }[]> = {
  '1': [ // Tingkat 1
    { id: '1', name: 'Web' },
    { id: '2', name: 'Network' },
    { id: '3', name: 'Desktop' },
  ],
  '2': [ // Tingkat 2
    { id: '4', name: 'Golang' },
    { id: '5', name: 'Cisco' },
    { id: '6', name: 'Java' },
    { id: '7', name: 'Sql Server' },
  ],
  '3': [ // Tingkat 3
    { id: '8', name: 'Golang' },
    { id: '9', name: 'Cisco' },
    { id: '10', name: 'Java' },
    { id: '11', name: 'Oracle' },
  ],
};

export const MateriModule: React.FC<MateriModuleProps> = ({ onAddMaterial }) => {
  const [creationMode, setCreationMode] = useState<'upload' | 'manual'>('upload');

  // Form state fields matching act-lepkom-v2
  const [levelId, setLevelId] = useState('1'); // 1: Tingkat 1, 2: Tingkat 2, 3: Tingkat 3
  const [courseId, setCourseId] = useState('1'); // course_id
  const [courseName, setCourseName] = useState('Web');
  const [meetingNumber, setMeetingNumber] = useState('1');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Manual link state
  const [manualTitle, setManualTitle] = useState('');
  const [manualUrl, setManualUrl] = useState('');

  // Realtime materials from ACT DB
  const [liveMaterials, setLiveMaterials] = useState<Record<string, any>[]>([]);
  const [isLoadingLive, setIsLoadingLive] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [lastRefreshed, setLastRefreshed] = useState<string | null>(null);

  const [isUploading, setIsUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<number | string | null>(null);
  const [uploadMessage, setUploadMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const loadRealtimeMaterials = useCallback(async (showToast = false) => {
    setIsLoadingLive(true);
    try {
      const data = await fetchActMaterials();
      setLiveMaterials(data);
      setLastRefreshed(new Date().toLocaleTimeString('id-ID'));
      if (showToast) {
        setUploadMessage({
          type: 'success',
          text: `Berhasil memuat ${data.length} materi realtime dari server ACT!`,
        });
      }
    } catch (e) {
      if (showToast) {
        setUploadMessage({
          type: 'error',
          text: 'Gagal memuat materi realtime dari server ACT.',
        });
      }
    } finally {
      setIsLoadingLive(false);
    }
  }, []);

  useEffect(() => {
    loadRealtimeMaterials(false);
  }, [loadRealtimeMaterials]);

  // Auto-update course dropdown when level changes
  useEffect(() => {
    const availableCourses = ACT_COURSES_BY_LEVEL[levelId] || [];
    if (availableCourses.length > 0) {
      setCourseId(availableCourses[0].id);
      setCourseName(availableCourses[0].name);
    }
  }, [levelId]);

  const handleLevelChange = (newLevelId: string) => {
    setLevelId(newLevelId);
  };

  const handleCourseChange = (selectedCourseId: string) => {
    setCourseId(selectedCourseId);
    const availableCourses = ACT_COURSES_BY_LEVEL[levelId] || [];
    const found = availableCourses.find((c) => c.id === selectedCourseId);
    if (found) {
      setCourseName(found.name);
    }
  };

  const getLevelName = (lvl: any) => {
    const s = String(lvl || '');
    if (s === '1') return 'Tingkat 1';
    if (s === '2') return 'Tingkat 2';
    if (s === '3') return 'Tingkat 3';
    return `Tingkat ${s}`;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleDeleteMaterial = async (id: number | string, name: string) => {
    if (!window.confirm(`Apakah Anda yakin ingin menghapus materi "${name}" dari server ACT?`)) {
      return;
    }

    setDeletingId(id);
    setUploadMessage(null);

    const result = await deleteActMaterial(id);
    setDeletingId(null);

    if (result.success) {
      setUploadMessage({
        type: 'success',
        text: `Berhasil menghapus "${name}" dari server ACT!`,
      });
      await loadRealtimeMaterials(false);
    } else {
      setUploadMessage({
        type: 'error',
        text: result.message || 'Gagal menghapus materi.',
      });
    }
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile || !courseName) {
      setUploadMessage({ type: 'error', text: 'Mohon isi nama mata praktikum dan pilih berkas file!' });
      return;
    }

    setIsUploading(true);
    setUploadMessage(null);

    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('level_id', levelId);
    formData.append('course_id', courseId);
    formData.append('course_name', courseName);
    formData.append('meeting_number', meetingNumber);
    formData.append('room_name', 'Lepkom Hub');

    const result = await uploadMaterialToAct(formData);
    setIsUploading(false);

    if (result.success) {
      setUploadMessage({ type: 'success', text: result.message });

      const newMaterial: MaterialItem = {
        id: String(Date.now()),
        title: selectedFile.name,
        courseName: `${getLevelName(levelId)} — ${courseName}`,
        level: getLevelName(levelId),
        meeting: Number(meetingNumber),
        fileName: selectedFile.name,
        fileSize: `${(selectedFile.size / 1024 / 1024).toFixed(2)} MB`,
        uploadedAt: new Date().toLocaleDateString('id-ID'),
        syncedToAct: true,
      };

      onAddMaterial(newMaterial);
      setSelectedFile(null);
      await loadRealtimeMaterials(false);
    } else {
      setUploadMessage({ type: 'error', text: result.message });
    }
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualTitle || !manualUrl) {
      setUploadMessage({ type: 'error', text: 'Mohon isi judul materi dan URL tautan!' });
      return;
    }

    setIsUploading(true);
    setUploadMessage(null);

    const result = await createMaterialLinkInAct({
      level_id: levelId,
      course_id: courseId,
      name: manualTitle,
      type: 'link',
      path: manualUrl,
      meeting_number: meetingNumber,
    });

    setIsUploading(false);

    if (result.success) {
      const newMaterial: MaterialItem = {
        id: String(Date.now()),
        title: manualTitle,
        courseName: `${getLevelName(levelId)} — ${courseName}`,
        level: getLevelName(levelId),
        meeting: Number(meetingNumber),
        fileName: manualUrl,
        fileSize: 'LINK WEB',
        uploadedAt: new Date().toLocaleDateString('id-ID'),
        syncedToAct: true,
      };

      onAddMaterial(newMaterial);
      setUploadMessage({ type: 'success', text: result.message });
      setManualTitle('');
      setManualUrl('');
      await loadRealtimeMaterials(false);
    } else {
      setUploadMessage({ type: 'error', text: result.message });
    }
  };

  const availableCourses = ACT_COURSES_BY_LEVEL[levelId] || [];

  // Filter materials for live view
  const filteredLiveMaterials = liveMaterials.filter((m) => {
    if (!searchTerm.trim()) return true;
    const q = searchTerm.toLowerCase();
    const nameStr = String(m.name || '').toLowerCase();
    const courseStr = String(m.course?.name || '').toLowerCase();
    const levelStr = String(m.level?.name || '').toLowerCase();
    return nameStr.includes(q) || courseStr.includes(q) || levelStr.includes(q);
  });

  return (
    <div className="space-y-4 max-w-7xl mx-auto text-xs text-zinc-800">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-1 border-b border-zinc-200 pb-3">
        <div>
          <h2 className="text-sm font-bold text-zinc-900 flex items-center gap-1.5">
            <Upload className="w-4 h-4 text-purple-600" />
            Materi & Modul Praktikum (Realtime ACT Sync)
          </h2>
          <p className="text-xs text-zinc-500">
            Unggah berkas modul (PDF/ZIP) atau Tautan Drive langsung ke database `act-lepkom-v2` secara realtime.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => loadRealtimeMaterials(true)}
            disabled={isLoadingLive}
            className="px-2.5 py-1.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 rounded text-xs font-semibold border border-zinc-300 transition-colors flex items-center gap-1.5 disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-indigo-600 ${isLoadingLive ? 'animate-spin' : ''}`} />
            <span>Refres Data ACT</span>
          </button>
          
          <span className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-300 text-[11px] font-mono font-bold">
            <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse"></span>
            Realtime DB ({liveMaterials.length})
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Dual Mode Form */}
        <div className="lg:col-span-1 border border-zinc-200 rounded-xl p-4 bg-white space-y-4 shadow-sm">
          {/* Mode Switcher */}
          <div className="flex bg-zinc-100 p-1 rounded-lg border border-zinc-200">
            <button
              onClick={() => setCreationMode('upload')}
              className={`grow text-xs font-semibold py-1.5 rounded-md transition-all ${
                creationMode === 'upload' ? 'bg-white text-purple-700 font-bold shadow-xs' : 'text-zinc-500 hover:text-zinc-900'
              }`}
            >
              Unggah File
            </button>
            <button
              onClick={() => setCreationMode('manual')}
              className={`grow text-xs font-semibold py-1.5 rounded-md transition-all ${
                creationMode === 'manual' ? 'bg-white text-purple-700 font-bold shadow-xs' : 'text-zinc-500 hover:text-zinc-900'
              }`}
            >
              Tautan Web (Link)
            </button>
          </div>

          {/* Toast Alert */}
          {uploadMessage && (
            <div
              className={`p-2.5 rounded-lg text-xs flex items-start gap-2 border ${
                uploadMessage.type === 'success'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                  : 'bg-rose-50 border-rose-200 text-rose-900'
              }`}
            >
              {uploadMessage.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              )}
              <span>{uploadMessage.text}</span>
            </div>
          )}

          {creationMode === 'upload' ? (
            /* Mode 1: File Upload Form */
            <form onSubmit={handleUploadSubmit} className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-600 mb-1">
                  Tingkat Studi
                </label>
                <select
                  value={levelId}
                  onChange={(e) => handleLevelChange(e.target.value)}
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-lg px-2.5 py-1.5 text-xs text-zinc-900 focus:outline-none focus:border-purple-600 font-medium"
                >
                  <option value="1">Tingkat 1 (Dasar)</option>
                  <option value="2">Tingkat 2 (Menengah)</option>
                  <option value="3">Tingkat 3 (Lanjut)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-600 mb-1">
                  Mata Praktikum <span className="text-rose-500">*</span>
                </label>
                <select
                  value={courseId}
                  onChange={(e) => handleCourseChange(e.target.value)}
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-lg px-2.5 py-1.5 text-xs text-zinc-900 focus:outline-none focus:border-purple-600 font-semibold"
                >
                  {availableCourses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-600 mb-1">
                  Pertemuan Ke-
                </label>
                <select
                  value={meetingNumber}
                  onChange={(e) => setMeetingNumber(e.target.value)}
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-lg px-2.5 py-1.5 text-xs text-zinc-900 focus:outline-none focus:border-purple-600 font-mono"
                >
                  {Array.from({ length: 8 }).map((_, i) => (
                    <option key={i + 1} value={String(i + 1)}>
                      Pertemuan {i + 1}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-600 mb-1">
                  Pilih Berkas (Max 50MB) <span className="text-rose-500">*</span>
                </label>
                <div className="border border-dashed border-zinc-300 hover:border-purple-500 rounded-lg p-4 text-center cursor-pointer bg-zinc-50/50 transition-colors">
                  <input
                    type="file"
                    id="materi-file-input"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <label htmlFor="materi-file-input" className="cursor-pointer block">
                    <FileText className="w-6 h-6 mx-auto text-purple-500 mb-1" />
                    {selectedFile ? (
                      <div className="text-xs text-zinc-900 font-bold truncate">
                        {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                      </div>
                    ) : (
                      <div className="text-xs text-zinc-500">
                        Klik untuk pilih berkas fisik (PDF, ZIP, DOCX)
                      </div>
                    )}
                  </label>
                </div>
              </div>

              <button
                type="submit"
                disabled={isUploading}
                className="w-full py-2 bg-purple-700 hover:bg-purple-800 text-white font-semibold text-xs rounded-lg transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50 shadow-sm"
              >
                {isUploading ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Mengunggah Ke Server ACT...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>Unggah Berkas Ke ACT</span>
                  </>
                )}
              </button>
            </form>
          ) : (
            /* Mode 2: Manual Link Form */
            <form onSubmit={handleManualSubmit} className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-600 mb-1">
                  Tingkat Studi & Mata Praktikum
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <select
                    value={levelId}
                    onChange={(e) => handleLevelChange(e.target.value)}
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-lg px-2 py-1 text-xs font-medium"
                  >
                    <option value="1">Tingkat 1</option>
                    <option value="2">Tingkat 2</option>
                    <option value="3">Tingkat 3</option>
                  </select>
                  <select
                    value={courseId}
                    onChange={(e) => handleCourseChange(e.target.value)}
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-lg px-2 py-1 text-xs font-semibold"
                  >
                    {availableCourses.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-600 mb-1">
                  Judul Materi / Modul <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={manualTitle}
                  onChange={(e) => setManualTitle(e.target.value)}
                  placeholder="Contoh: Modul Google Drive Pertemuan 1"
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-lg px-2.5 py-1.5 text-xs text-zinc-900 focus:outline-none focus:border-purple-600"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-600 mb-1">
                  URL / Link Google Drive <span className="text-rose-500">*</span>
                </label>
                <input
                  type="url"
                  required
                  value={manualUrl}
                  onChange={(e) => setManualUrl(e.target.value)}
                  placeholder="https://drive.google.com/file/d/..."
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-lg px-2.5 py-1.5 text-xs text-zinc-900 font-mono focus:outline-none focus:border-purple-600"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-600 mb-1">
                  Pertemuan Ke-
                </label>
                <select
                  value={meetingNumber}
                  onChange={(e) => setMeetingNumber(e.target.value)}
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-lg px-2.5 py-1.5 text-xs text-zinc-900 focus:outline-none focus:border-purple-600 font-mono"
                >
                  {Array.from({ length: 8 }).map((_, i) => (
                    <option key={i + 1} value={String(i + 1)}>
                      Pertemuan {i + 1}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                disabled={isUploading}
                className="w-full py-2 bg-purple-700 hover:bg-purple-800 text-white font-semibold text-xs rounded-lg transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50 shadow-sm"
              >
                {isUploading ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Menyimpan Ke Server ACT...</span>
                  </>
                ) : (
                  <>
                    <LinkIcon className="w-3.5 h-3.5" />
                    <span>Simpan Tautan Ke ACT</span>
                  </>
                )}
              </button>
            </form>
          )}
        </div>

        {/* Right Column: Realtime Uploaded Materials List */}
        <div className="lg:col-span-2 border border-zinc-200 rounded-xl p-4 bg-white space-y-3 shadow-sm flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-zinc-200 pb-2.5">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-purple-600" />
                <h3 className="text-xs font-bold text-zinc-900">
                  Daftar Materi Realtime (`act-lepkom-v2`) ({filteredLiveMaterials.length})
                </h3>
              </div>

              <div className="relative w-full sm:w-56">
                <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Cari nama, mata praktikum..."
                  className="w-full pl-8 pr-3 py-1 bg-zinc-50 border border-zinc-200 rounded-lg text-xs focus:outline-none focus:border-purple-600"
                />
              </div>
            </div>

            {isLoadingLive ? (
              <div className="py-16 text-center text-xs text-zinc-500 flex flex-col items-center justify-center gap-2">
                <RefreshCw className="w-5 h-5 text-purple-600 animate-spin" />
                <span>Memuat daftar materi realtime dari database ACT...</span>
              </div>
            ) : filteredLiveMaterials.length === 0 ? (
              <div className="py-16 text-center text-xs text-zinc-400">
                {searchTerm ? 'Tidak ada materi yang cocok dengan pencarian.' : 'Belum ada materi di server ACT.'}
              </div>
            ) : (
              <div className="space-y-2 max-h-[520px] overflow-y-auto pr-1 divide-y divide-zinc-100 scrollbar-thin">
                {filteredLiveMaterials.map((item) => {
                  const isLink = item.type === 'link' || item.type === 'folder' || String(item.path || '').startsWith('http');
                  const levelName = item.level?.name || getLevelName(item.level_id);
                  const courseName = item.course?.name || 'Praktikum';
                  const formattedSize = item.size ? `${(item.size / 1024 / 1024).toFixed(2)} MB` : (item.type === 'folder' ? 'FOLDER DRIVE' : 'LINK DRIVE');

                  return (
                    <div key={item.id} className="pt-2.5 pb-1 flex items-center justify-between hover:bg-purple-50/40 p-2 rounded-lg transition-colors">
                      <div className="flex items-start gap-2.5 overflow-hidden">
                        {item.type === 'folder' ? (
                          <Folder className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                        ) : isLink ? (
                          <LinkIcon className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                        ) : (
                          <FileText className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
                        )}

                        <div className="truncate space-y-0.5">
                          <div className="text-xs font-bold text-zinc-900 truncate flex items-center gap-1.5">
                            <span>{item.name}</span>
                            {isLink && (
                              <a
                                href={item.path}
                                target="_blank"
                                rel="noreferrer"
                                className="text-indigo-600 hover:text-indigo-800 shrink-0 inline-flex items-center gap-0.5 text-[11px]"
                              >
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            )}
                          </div>
                          <div className="text-[11px] text-zinc-500 font-mono truncate">
                            {levelName} • <span className="font-semibold text-zinc-700">{courseName}</span> • Pertemuan {item.meeting_number || 1} • {formattedSize}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[10px] px-2 py-0.5 rounded font-mono uppercase font-bold bg-zinc-100 border border-zinc-200 text-zinc-700">
                          {item.type || 'file'}
                        </span>

                        <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-300 font-mono font-bold flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          ACT Realtime
                        </span>

                        <button
                          onClick={() => handleDeleteMaterial(item.id, item.name)}
                          disabled={deletingId === item.id}
                          className="p-1.5 hover:bg-rose-50 text-zinc-400 hover:text-rose-600 rounded-lg transition-colors disabled:opacity-50"
                          title="Hapus Materi dari Server ACT"
                        >
                          {deletingId === item.id ? (
                            <RefreshCw className="w-3.5 h-3.5 animate-spin text-rose-600" />
                          ) : (
                            <Trash2 className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {lastRefreshed && (
            <div className="text-[11px] text-zinc-400 font-mono border-t border-zinc-100 pt-2 flex items-center justify-between">
              <span>Terhubung dengan database `act-lepkom-v2`</span>
              <span>Terakhir diperbarui: {lastRefreshed}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};


