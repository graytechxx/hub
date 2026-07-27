import React, { useState, useEffect, useCallback } from 'react';
import { Users, Plus, Trash2, CheckCircle2, FileText, UploadCloud, RefreshCw, FileSpreadsheet, AlertCircle, Link, Globe, Tag, Search } from 'lucide-react';
import { parseExcelFile, parseExcelFromUrl } from '../../services/excelService';
import { pushBulkUsersToAct, fetchSheetsUrlViaAct, fetchActUsers, deleteActUser, updateActUserRealtime, clearAllActUsers } from '../../services/actApi';

const SAVED_SHEETS_LINK_KEY = 'lepkom_act_user_sheets_link';

export const ActUserBulkModule: React.FC = () => {
  const [records, setRecords] = useState<Record<string, any>[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  const [username, setUsername] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState('asisten');
  const [tag, setTag] = useState('');
  const [password, setPassword] = useState('lepkomnewnormal');

  const [defaultTag, setDefaultTag] = useState('');
  const [sheetsUrl, setSheetsUrl] = useState(() => {
    return localStorage.getItem(SAVED_SHEETS_LINK_KEY) || '';
  });

  const [isFetchingDb, setIsFetchingDb] = useState(false);
  const [isLoadingUrl, setIsLoadingUrl] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [toastMsg, setToastMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Fetch real live database users from Web ACT
  const loadDbUsers = useCallback(async (showNotification = false) => {
    setIsFetchingDb(true);
    const dbUsers = await fetchActUsers();
    setIsFetchingDb(false);

    if (dbUsers && dbUsers.length > 0) {
      const formatted = dbUsers
        .filter((u) => u.role !== 'superadmin' && u.email !== 'admin001' && u.username !== 'admin001')
        .map((u) => ({
          id: u.id,
          username: u.username || u.email,
          name: u.name,
          email: u.email,
          role: u.role || 'asisten',
          tag: u.tag || '',
          password: 'lepkomnewnormal',
        }));
      setRecords(formatted);
      if (showNotification) {
        setToastMsg({
          type: 'success',
          text: `Berhasil menyinkronkan ${formatted.length} user langsung dari database Web ACT!`,
        });
      }
    } else if (showNotification) {
      setToastMsg({
        type: 'error',
        text: 'Tidak ada data user yang ditemukan di database Web ACT.',
      });
    }
  }, []);

  useEffect(() => {
    loadDbUsers(false);
  }, [loadDbUsers]);

  const processParsedData = (parsed: any[]): Record<string, any>[] => {
    if (!parsed || parsed.length === 0) return [];

    const mapped: Record<string, any>[] = [];

    parsed.forEach((row) => {
      if (!row || typeof row !== 'object') return;

      let idAsisten = '';
      let fullName = '';
      let roleVal = 'asisten';
      let tagVal = defaultTag;

      const entries = Object.entries(row);

      // 1. Strict extraction: ID Asisten MUST start with 'J' followed by digits (e.g. J0918003, J1221003)
      for (const [_, v] of entries) {
        if (v !== undefined && v !== null) {
          const str = String(v).trim();
          if (/^J\d+/i.test(str)) {
            idAsisten = str;
            break;
          }
        }
      }

      // If no valid ID starting with 'J' is found, skip this row ("selain itu gausah")
      if (!idAsisten) {
        return;
      }

      // 2. Extract Full Name
      for (const [k, v] of entries) {
        if (v === undefined || v === null) continue;
        const valStr = String(v).trim();
        if (valStr === idAsisten) continue;

        const cleanK = k.toLowerCase().replace(/[^a-z0-9]/g, '');

        if (
          cleanK.includes('namaasisten') ||
          cleanK.includes('namalengkap') ||
          cleanK.includes('studentname') ||
          cleanK.includes('namamahasiswa') ||
          cleanK.includes('nama') ||
          cleanK.includes('name') ||
          cleanK.includes('fullname') ||
          cleanK === 'asisten'
        ) {
          fullName = valStr;
          break;
        }
      }

      // Fallback for Full Name if column header wasn't matched
      if (!fullName) {
        for (const [_, v] of entries) {
          if (v === undefined || v === null) continue;
          const valStr = String(v).trim();
          if (valStr && valStr !== idAsisten && !/^\d+$/.test(valStr) && valStr.length > 2) {
            fullName = valStr;
            break;
          }
        }
      }

      // 3. Extract Role & Tag
      for (const [k, v] of entries) {
        if (v === undefined || v === null) continue;
        const cleanK = k.toLowerCase().replace(/[^a-z0-9]/g, '');
        const valStr = String(v).trim();

        if (cleanK.includes('role') || cleanK.includes('peran')) {
          if (valStr.toLowerCase().includes('staff')) roleVal = 'staff';
          else if (valStr.toLowerCase().includes('admin')) roleVal = 'superadmin';
        }
        if (cleanK.includes('tag') || cleanK.includes('divisi')) {
          const str = valStr.toUpperCase();
          if (str.includes('ADMIN')) tagVal = 'ADMIN';
          else if (str.includes('TEKNIS')) tagVal = 'TEKNIS';
        }
      }

      mapped.push({
        username: idAsisten,
        name: fullName || idAsisten,
        email: idAsisten,
        role: roleVal,
        tag: tagVal,
        password: 'lepkomnewnormal',
      });
    });

    return mapped;
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      try {
        const file = e.target.files[0];
        const parsed = await parseExcelFile<any>(file);
        const mapped = processParsedData(parsed);

        if (mapped.length === 0) {
          setToastMsg({ type: 'error', text: 'Tidak ada data user valid di file Excel.' });
          return;
        }

        setRecords(mapped);
        setToastMsg({
          type: 'success',
          text: `Berhasil memuat ${mapped.length} user dari file ${file.name}! Silakan periksa atau ubah Role & Tag, lalu klik 'Register User ke Web ACT' di bawah tabel.`,
        });
      } catch (err: any) {
        setToastMsg({
          type: 'error',
          text: 'Gagal membaca file Excel. Pastikan format file sesuai.',
        });
      }
    }
  };

  const handleImportUrl = async () => {
    if (!sheetsUrl.trim()) return;

    setIsLoadingUrl(true);
    setToastMsg(null);
    localStorage.setItem(SAVED_SHEETS_LINK_KEY, sheetsUrl.trim());

    try {
      let parsed = await fetchSheetsUrlViaAct(sheetsUrl.trim());
      if (!parsed || parsed.length === 0) {
        parsed = await parseExcelFromUrl(sheetsUrl.trim());
      }

      const mapped = processParsedData(parsed);

      if (mapped.length === 0) {
        setToastMsg({
          type: 'error',
          text: 'Google Sheets berhasil diakses, namun tidak ditemukan kolom ID ASISTEN dan NAMA ASISTEN.',
        });
        return;
      }

      setRecords(mapped);
      setToastMsg({
        type: 'success',
        text: `Berhasil memuat ${mapped.length} user dari Google Sheets! Silakan periksa atau sesuaikan Role & Tag, lalu klik tombol 'Register User ke Web ACT' di bawah tabel.`,
      });
    } catch (err: any) {
      setToastMsg({
        type: 'error',
        text: err.message || 'Gagal memuat spreadsheet dari link. Pastikan akses Google Sheets publik (Siapa saja yang memiliki link).',
      });
    } finally {
      setIsLoadingUrl(false);
    }
  };

  // Real-time edit role / tag per row directly to ACT DB!
  const handleRowChange = async (index: number, field: string, val: string) => {
    const targetUser = records[index];
    if (!targetUser) return;

    const updatedUser = { ...targetUser, [field]: val };

    // Update UI state immediately
    setRecords((prev) => {
      const updated = [...prev];
      updated[index] = updatedUser;
      return updated;
    });

    // Real-time sync to ACT database
    const success = await updateActUserRealtime({
      email: updatedUser.email || updatedUser.username,
      role: updatedUser.role,
      tag: updatedUser.tag,
      name: updatedUser.name,
    });

    if (success) {
      setToastMsg({
        type: 'success',
        text: `⚡ Realtime Sync: ${field.toUpperCase()} untuk user ${updatedUser.name} (${updatedUser.username}) berhasil diperbarui di database ACT!`,
      });
    }
  };

  const handleApplyGlobalTag = async (newTag: string) => {
    setDefaultTag(newTag);
    const updatedRecords = records.map((r) => ({ ...r, tag: newTag }));
    setRecords(updatedRecords);

    if (records.length > 0) {
      setIsSyncing(true);
      await pushBulkUsersToAct(updatedRecords);
      setIsSyncing(false);
      setToastMsg({
        type: 'success',
        text: `⚡ Realtime Sync: Tag '${newTag || 'Tanpa Tag'}' berhasil diterapkan ke seluruh database Web ACT!`,
      });
    }
  };

  const handleAddRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !username) return;

    const newRecord = {
      username,
      name,
      email: username,
      role,
      tag,
      password: password || 'lepkomnewnormal',
    };

    setRecords((prev) => [newRecord, ...prev]);
    setUsername('');
    setName('');
    setPassword('lepkomnewnormal');

    // Realtime sync to database
    await pushBulkUsersToAct([newRecord]);
    setToastMsg({ type: 'success', text: `⚡ Realtime Sync: User ${name} (${username}) berhasil ditambahkan ke database ACT!` });
  };

  const handleDelete = async (index: number, emailToDelete: string) => {
    const confirmDelete = window.confirm(`Apakah Anda yakin ingin menghapus user ${emailToDelete}?`);
    if (!confirmDelete) return;

    // Remove from UI state
    setRecords((prev) => prev.filter((_, i) => i !== index));

    // Also delete from live ACT DB
    await deleteActUser(emailToDelete);
    setToastMsg({ type: 'success', text: `⚡ Realtime Sync: User ${emailToDelete} berhasil dihapus dari database ACT.` });
  };

  const handleClearUser = async () => {
    const confirmClear = window.confirm('Apakah Anda yakin ingin MENGHAPUS SELURUH USER dari database Web ACT (kecuali Super Admin)?');
    if (!confirmClear) return;

    setIsSyncing(true);
    setRecords([]);

    const res = await clearAllActUsers();
    setIsSyncing(false);

    if (res.success) {
      setToastMsg({ type: 'success', text: `⚡ Realtime Sync: ${res.message}` });
    } else {
      setToastMsg({ type: 'error', text: res.message });
    }
  };

  const handlePushToAct = async () => {
    if (records.length === 0) {
      setToastMsg({ type: 'error', text: 'Tidak ada data user untuk dikirim.' });
      return;
    }

    setIsSyncing(true);
    setToastMsg(null);

    const result = await pushBulkUsersToAct(records);
    setIsSyncing(false);

    if (result.success) {
      setToastMsg({
        type: 'success',
        text: `${result.message} (Dibuat: ${result.created}, Diperbarui: ${result.updated}). Password: lepkomnewnormal`,
      });
      loadDbUsers(false);
    } else {
      setToastMsg({
        type: 'error',
        text: result.message || 'Gagal terhubung ke server ACT.',
      });
    }
  };

  const filteredRecords = records.filter((r) => {
    if (r.role === 'superadmin' || r.username === 'admin001' || r.email === 'admin001') return false;
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      (r.name && r.name.toLowerCase().includes(q)) ||
      (r.username && r.username.toLowerCase().includes(q)) ||
      (r.email && r.email.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-4 max-w-7xl mx-auto text-xs text-zinc-800">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-1 border-b border-zinc-200 pb-3">
        <div>
          <h2 className="text-sm font-bold text-zinc-900 flex items-center gap-1.5">
            <Users className="w-4 h-4 text-emerald-600" />
            Kelola User Web ACT (Realtime 2-Way Sync Database `act-lepkom-v2`)
          </h2>
          <p className="text-xs text-zinc-500">
            Perubahan Role & Tag disinkronkan <strong>secara realtime</strong>. Semua akun ber-tag <span className="bg-blue-100 text-blue-800 font-bold px-1.5 py-0.5 rounded text-[10px]">TEKNIS</span> otomatis terdaftar dengan password default <code className="bg-zinc-100 px-1 py-0.5 rounded text-indigo-700 font-mono font-bold">lepkomnewnormal</code> & Force Change Password saat login pertama di Web ACT.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => loadDbUsers(true)}
            disabled={isFetchingDb}
            className="px-3 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 rounded text-xs font-semibold transition-colors flex items-center gap-1.5 border border-zinc-300 disabled:opacity-50"
            title="Muat Ulang Data dari Database ACT"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isFetchingDb ? 'animate-spin' : ''}`} />
            <span>Reload DB</span>
          </button>

          <button
            onClick={handleClearUser}
            disabled={records.length === 0}
            className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 hover:text-rose-800 border border-rose-200 rounded text-xs font-semibold transition-colors flex items-center gap-1.5 disabled:opacity-50"
            title="Bersihkan Tampilan Daftar User"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear User</span>
          </button>

          <button
            onClick={handlePushToAct}
            disabled={isSyncing || records.length === 0}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-semibold transition-colors flex items-center justify-center gap-2 disabled:opacity-50 shrink-0 shadow-sm"
          >
            {isSyncing ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Menyinkronkan...</span>
              </>
            ) : (
              <>
                <UploadCloud className="w-4 h-4" />
                <span>Sinkron Massal Ke ACT</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Toast Alert */}
      {toastMsg && (
        <div
          className={`p-3 rounded text-xs flex items-start gap-2 border ${
            toastMsg.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900 font-medium'
              : 'bg-rose-50 border-rose-200 text-rose-900'
          }`}
        >
          {toastMsg.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          )}
          <span>{toastMsg.text}</span>
        </div>
      )}

      {/* Global Tag & Customization Bar */}
      <div className="border border-zinc-200 rounded-lg p-3 bg-zinc-50 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Tag className="w-4 h-4 text-amber-600" />
          <span className="text-xs font-semibold text-zinc-700">Set Tag Default (Auto-Sync Realtime):</span>
          <div className="flex items-center gap-1.5">
            {['TEKNIS', 'ADMIN', ''].map((t) => (
              <button
                key={t}
                onClick={() => handleApplyGlobalTag(t)}
                className={`px-2.5 py-1 rounded text-xs font-semibold transition-colors border ${
                  defaultTag === t
                    ? 'bg-zinc-900 text-white border-zinc-900'
                    : 'bg-white text-zinc-700 border-zinc-300 hover:bg-zinc-100'
                }`}
              >
                {t === '' ? 'Tanpa Tag' : t}
              </button>
            ))}
          </div>
        </div>
        <span className="text-[11px] text-zinc-500 italic">
          Default Password: <code className="font-mono font-bold text-zinc-900">lepkomnewnormal</code>
        </span>
      </div>

      {/* Import Methods Panel */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Method 1: Local File Upload */}
        <div className="border border-zinc-200 rounded-lg p-3.5 bg-white space-y-2">
          <div className="flex items-center gap-1.5 font-bold text-zinc-800 text-xs">
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Opsi A: Upload File Spreadsheet (.xlsx, .csv)</span>
          </div>
          <p className="text-[11px] text-zinc-500">
            Membaca file lokal. Headers <code className="bg-zinc-100 px-1 rounded text-zinc-800 font-mono">ID ASISTEN</code> dan <code className="bg-zinc-100 px-1 rounded text-zinc-800 font-mono">NAMA</code> otomatis dipetakan.
          </p>
          <label className="inline-flex items-center justify-center px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-white rounded text-xs font-semibold transition-colors cursor-pointer gap-2 mt-1">
            <UploadCloud className="w-3.5 h-3.5" />
            <span>Pilih Berkas Excel / CSV</span>
            <input
              type="file"
              accept=".xlsx, .xls, .csv"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>
        </div>

        {/* Method 2: Google Sheets URL Import */}
        <div className="border border-zinc-200 rounded-lg p-3.5 bg-white space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 font-bold text-zinc-800 text-xs">
              <Globe className="w-4 h-4 text-indigo-600" />
              <span>Opsi B: Import Tautan Google Sheets (Link Public)</span>
            </div>
          </div>
          <p className="text-[11px] text-zinc-500">
            Tempel link Google Sheets, sistem akan membaca data user & memasukkannya ke tabel antrean.
          </p>
          <div className="flex gap-2">
            <input
              type="url"
              value={sheetsUrl}
              onChange={(e) => setSheetsUrl(e.target.value)}
              placeholder="https://docs.google.com/spreadsheets/d/.../edit"
              className="grow bg-zinc-50 border border-zinc-200 rounded px-2.5 py-1.5 text-xs text-zinc-900 font-mono focus:outline-none focus:border-zinc-400"
            />
            <button
              onClick={handleImportUrl}
              disabled={isLoadingUrl || !sheetsUrl.trim()}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded transition-colors flex items-center gap-1.5 disabled:opacity-50 shrink-0"
            >
              {isLoadingUrl ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Link className="w-3.5 h-3.5" />}
              <span>Muat Link</span>
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form Add User Manual */}
        <div className="lg:col-span-1 border border-zinc-200 rounded-lg p-4 bg-white space-y-3">
          <h3 className="text-xs font-bold text-zinc-900 flex items-center gap-1.5 border-b border-zinc-200 pb-2">
            <Plus className="w-3.5 h-3.5 text-emerald-600" />
            Tambah User Manual
          </h3>

          <form onSubmit={handleAddRecord} className="space-y-3">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-600 mb-1">
                ID Asisten <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Contoh: AST001"
                className="w-full bg-zinc-50 border border-zinc-200 rounded px-2.5 py-1.5 text-xs text-zinc-900 focus:outline-none focus:border-zinc-400 font-mono"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-600 mb-1">
                Nama Lengkap <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Contoh: Raden Haikal"
                className="w-full bg-zinc-50 border border-zinc-200 rounded px-2.5 py-1.5 text-xs text-zinc-900 focus:outline-none focus:border-zinc-400 font-medium"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-600 mb-1">Role</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full bg-zinc-50 border border-zinc-200 rounded px-2 py-1.5 text-xs text-zinc-900 focus:outline-none"
                >
                  <option value="asisten">Asisten</option>
                  <option value="staff">Staff</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-600 mb-1">Tag</label>
                <select
                  value={tag}
                  onChange={(e) => setTag(e.target.value)}
                  className="w-full bg-zinc-50 border border-zinc-200 rounded px-2 py-1.5 text-xs text-zinc-900 focus:outline-none font-mono"
                >
                  <option value="">Tanpa Tag</option>
                  <option value="TEKNIS">TEKNIS</option>
                  <option value="ADMIN">ADMIN</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-600 mb-1">Kata Sandi</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Default: lepkomnewnormal"
                className="w-full bg-zinc-50 border border-zinc-200 rounded px-2.5 py-1.5 text-xs text-zinc-900 focus:outline-none focus:border-zinc-400 font-mono"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2 bg-zinc-900 hover:bg-zinc-800 text-white font-semibold text-xs rounded transition-colors flex items-center justify-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Tambah User ke ACT DB</span>
            </button>
          </form>
        </div>

        {/* User Table Preview */}
        <div className="lg:col-span-2 border border-zinc-200 rounded-lg p-4 bg-white space-y-3">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-zinc-200 pb-2">
            <h3 className="text-xs font-bold text-zinc-900 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-emerald-600" />
              Daftar User Web ACT ({filteredRecords.length})
              <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-mono font-normal">
                ⚡ Realtime Sync Active
              </span>
            </h3>

            {/* Search Input */}
            <div className="relative w-full sm:w-48">
              <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-2 top-2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari ID / Nama..."
                className="w-full bg-zinc-50 border border-zinc-200 rounded pl-7 pr-2.5 py-1 text-xs text-zinc-900 focus:outline-none focus:border-zinc-400"
              />
            </div>
          </div>

          <div className="overflow-x-auto max-h-[420px]">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-zinc-50 border-b border-zinc-200 text-zinc-600 font-mono text-[11px]">
                  <th className="p-2 border-r border-zinc-200">ID Asisten</th>
                  <th className="p-2 border-r border-zinc-200">Nama Lengkap</th>
                  <th className="p-2 border-r border-zinc-200">Role (Realtime)</th>
                  <th className="p-2 border-r border-zinc-200">Tag (Realtime)</th>
                  <th className="p-2 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 text-zinc-900">
                {filteredRecords.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-6 text-center text-zinc-400 font-mono text-xs">
                      {isFetchingDb ? 'Memuat data dari database Web ACT...' : 'Tidak ada data user terdaftar.'}
                    </td>
                  </tr>
                ) : (
                  filteredRecords.map((r, idx) => (
                    <tr key={idx} className="hover:bg-zinc-50 transition-colors">
                      <td className="p-2 border-r border-zinc-100 font-mono font-bold text-emerald-900">{r.username || r.email}</td>
                      <td className="p-2 border-r border-zinc-100 font-medium text-zinc-900">{r.name}</td>
                      <td className="p-2 border-r border-zinc-100">
                        <select
                          value={r.role || 'asisten'}
                          onChange={(e) => handleRowChange(idx, 'role', e.target.value)}
                          className="bg-emerald-50 border border-emerald-300 rounded px-1.5 py-0.5 text-xs font-mono font-semibold uppercase text-emerald-900 focus:outline-none cursor-pointer"
                        >
                          <option value="asisten">asisten</option>
                          <option value="staff">staff</option>
                        </select>
                      </td>
                      <td className="p-2 border-r border-zinc-100">
                        <select
                          value={r.tag || ''}
                          onChange={(e) => handleRowChange(idx, 'tag', e.target.value)}
                          className="bg-amber-50 border border-amber-300 rounded px-1.5 py-0.5 text-xs font-mono font-semibold text-amber-900 focus:outline-none cursor-pointer"
                        >
                          <option value="">Tanpa Tag</option>
                          <option value="TEKNIS">TEKNIS</option>
                          <option value="ADMIN">ADMIN</option>
                        </select>
                      </td>
                      <td className="p-2 text-right">
                        <button
                          onClick={() => handleDelete(idx, r.username || r.email)}
                          className="text-zinc-400 hover:text-rose-600 p-1 transition-colors"
                          title="Hapus Akun dari DB"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Register Button Below Table */}
          <div className="pt-3 border-t border-zinc-200 flex flex-col sm:flex-row items-center justify-between gap-3">
            <span className="text-xs text-zinc-500 font-mono flex items-center gap-1">
              Total {records.length} akun terdaftar di database ACT
            </span>

            <button
              onClick={handlePushToAct}
              disabled={isSyncing || records.length === 0}
              className="w-full sm:w-auto px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isSyncing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Sedang Menyinkronkan Ke Web ACT...</span>
                </>
              ) : (
                <>
                  <UploadCloud className="w-4 h-4" />
                  <span>Register / Sinkron Massal {records.length} User ke Web ACT</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
