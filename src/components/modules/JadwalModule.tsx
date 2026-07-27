import React, { useState, useEffect, useCallback } from 'react';
import { Calendar, FileSpreadsheet, Download, UploadCloud, CheckCircle2, RefreshCw, AlertCircle, Search, Database, Columns, LayoutGrid, Table as TableIcon, Clock, MapPin, User, Users, BookOpen } from 'lucide-react';
import { parseExcelFile, generateLepkomScheduleExcel } from '../../services/excelService';
import { pushScheduleToAct, fetchActSchedules } from '../../services/actApi';

const DAYS_ORDER = ['SENIN', 'SELASA', 'RABU', 'KAMIS', "JUM'AT", 'SABTU'];

export const JadwalModule: React.FC = () => {
  const [schedules, setSchedules] = useState<Record<string, any>[]>([]);
  const [isLoadingLive, setIsLoadingLive] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isLiveSource, setIsLiveSource] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDay, setSelectedDay] = useState<string>('SEMUA');
  const [viewMode, setViewMode] = useState<'columns' | 'matrix' | 'table'>('columns');
  const [syncStatus, setSyncStatus] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  const loadLiveSchedules = useCallback(async (showToast = false) => {
    setIsLoadingLive(true);
    try {
      const data = await fetchActSchedules();
      if (data && data.length > 0) {
        setSchedules(data);
        setIsLiveSource(true);
        setLastUpdated(new Date().toLocaleTimeString('id-ID'));
        if (showToast) {
          setSyncStatus({
            type: 'success',
            text: `Berhasil memuat ${data.length} entri jadwal realtime dari server ACT.`,
          });
        }
      } else {
        setIsLiveSource(false);
        if (showToast) {
          setSyncStatus({
            type: 'info',
            text: 'Belum ada data jadwal di server ACT atau koneksi terputus. Silakan unggah file Excel.',
          });
        }
      }
    } catch (e) {
      if (showToast) {
        setSyncStatus({
          type: 'error',
          text: 'Gagal mengambil data jadwal dari server ACT.',
        });
      }
    } finally {
      setIsLoadingLive(false);
    }
  }, []);

  useEffect(() => {
    loadLiveSchedules(false);
  }, [loadLiveSchedules]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      try {
        const file = e.target.files[0];
        const parsed = await parseExcelFile<any>(file);
        
        if (parsed.length === 0) {
          setSyncStatus({ type: 'error', text: 'Berkas Excel kosong atau tidak ada data.' });
          return;
        }

        setSchedules(parsed);
        setIsLiveSource(false);
        setSyncStatus({
          type: 'info',
          text: `Pratinjau Berkas (${file.name}): ${parsed.length} entri dibaca dari Excel. Klik "Push Jadwal ke Dasbor ACT" untuk menyimpan ke server.`,
        });
      } catch (err: any) {
        setSyncStatus({
          type: 'error',
          text: 'Gagal membaca file Excel. Pastikan format kolom sesuai template.',
        });
      }
    }
  };

  const handlePushToAct = async () => {
    if (schedules.length === 0) {
      setSyncStatus({ type: 'error', text: 'Tidak ada data jadwal untuk dikirim.' });
      return;
    }

    setIsSyncing(true);
    setSyncStatus(null);

    const result = await pushScheduleToAct(schedules);
    setIsSyncing(false);

    if (result.success) {
      setSyncStatus({
        type: 'success',
        text: `Berhasil mengirim ${result.count} data jadwal asisten ke Web ACT! Memuat ulang data realtime...`,
      });
      await loadLiveSchedules(false);
    } else {
      setSyncStatus({
        type: 'error',
        text: result.message || 'Gagal terhubung ke server ACT.',
      });
    }
  };

  const handleDownloadTemplate = () => {
    generateLepkomScheduleExcel(schedules.length > 0 ? (schedules as any) : [
      { Hari: 'SENIN', Jam: '07:30 - 09:30', Ruang: 'J5 121', 'Mata Praktikum': 'Pemrograman Web 2', 'Penanggung Jawab': 'Anggita', Tutor: 'Rizky', 'Asisten 1': 'Diva' },
      { Hari: 'SENIN', Jam: '09:30 - 11:30', Ruang: 'J5 122', 'Mata Praktikum': 'Basis Data Lanjut', 'Penanggung Jawab': 'Fikri', Tutor: 'Farhan', 'Asisten 1': 'Maya' },
    ], 'Template_Jadwal_Asisten_ACT.xlsx');
  };

  // Normalization helper
  const normalizeDay = (dayStr: any) => {
    const d = String(dayStr || '').toUpperCase().trim();
    if (d.startsWith('JUM')) return "JUM'AT";
    return d;
  };

  // Filtered schedules by search & selected day tab
  const filteredSchedules = schedules.filter((row) => {
    const dayName = normalizeDay(row.Hari);
    if (selectedDay !== 'SEMUA' && dayName !== selectedDay) return false;
    if (!searchTerm.trim()) return true;
    const q = searchTerm.toLowerCase();
    return Object.values(row).some((val) => String(val || '').toLowerCase().includes(q));
  });

  // Group by day for Column View
  const groupedByDay: Record<string, Record<string, any>[]> = {};
  DAYS_ORDER.forEach((day) => {
    groupedByDay[day] = [];
  });

  filteredSchedules.forEach((item) => {
    const day = normalizeDay(item.Hari);
    if (!groupedByDay[day]) {
      groupedByDay[day] = [];
    }
    groupedByDay[day].push(item);
  });

  // Unique days present in data
  const availableDays = DAYS_ORDER.filter((d) => (groupedByDay[d] && groupedByDay[d].length > 0) || selectedDay === d || selectedDay === 'SEMUA');

  // Unique rooms
  const allRooms = Array.from(new Set(schedules.map((s) => String(s.Ruang || '').trim()).filter(Boolean))).sort();

  const headers = schedules.length > 0 ? Object.keys(schedules[0]) : [];

  return (
    <div className="space-y-4 max-w-[1600px] mx-auto text-xs text-zinc-800">
      {/* Banner & Actions Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pt-1 border-b border-zinc-200 pb-3">
        <div>
          <h2 className="text-sm font-bold text-zinc-900 flex items-center gap-2">
            <Calendar className="w-4.5 h-4.5 text-purple-600" />
            Jadwal Praktikum & Asisten ACT
          </h2>
          <p className="text-xs text-zinc-500">
            Penataan jadwal praktikum per-kolom hari, matriks ruang & sesi, serta sinkronisasi realtime dengan `act-lepkom-v2`.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => loadLiveSchedules(true)}
            disabled={isLoadingLive}
            className="px-2.5 py-1.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 rounded-lg text-xs font-semibold border border-zinc-300 transition-colors flex items-center gap-1.5 disabled:opacity-50"
            title="Muat Ulang Data Realtime ACT"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-indigo-600 ${isLoadingLive ? 'animate-spin' : ''}`} />
            <span>Refres Data ACT</span>
          </button>

          <button
            onClick={handleDownloadTemplate}
            className="px-2.5 py-1.5 bg-white hover:bg-zinc-100 text-zinc-800 rounded-lg text-xs font-semibold border border-zinc-300 transition-colors flex items-center gap-1.5 shrink-0"
          >
            <Download className="w-3.5 h-3.5 text-purple-600" />
            <span>Template Excel</span>
          </button>
        </div>
      </div>

      {/* Alert Status Toast */}
      {syncStatus && (
        <div
          className={`p-3 rounded-lg text-xs flex items-start gap-2 border shadow-sm ${
            syncStatus.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : syncStatus.type === 'info'
              ? 'bg-blue-50 border-blue-200 text-blue-900'
              : 'bg-rose-50 border-rose-200 text-rose-900'
          }`}
        >
          {syncStatus.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          ) : syncStatus.type === 'info' ? (
            <Database className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          )}
          <span>{syncStatus.text}</span>
        </div>
      )}

      {/* Control Actions Bar */}
      <div className="border border-zinc-200 rounded-xl p-3.5 bg-white flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <label className="px-3.5 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer flex items-center justify-center gap-2 shrink-0">
            <FileSpreadsheet className="w-4 h-4 text-purple-400" />
            <span>Unggah Excel Baru (.xlsx)</span>
            <input
              type="file"
              accept=".xlsx, .xls, .csv"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>
          
          <div className="flex items-center gap-2">
            {isLiveSource ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
                <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse"></span>
                Realtime ACT Database ({schedules.length} entri)
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold bg-amber-100 text-amber-800 border border-amber-300">
                Pratinjau Berkas Excel ({schedules.length} entri)
              </span>
            )}
            {lastUpdated && <span className="text-[11px] text-zinc-400 font-mono">Pukul: {lastUpdated}</span>}
          </div>
        </div>

        <button
          onClick={handlePushToAct}
          disabled={isSyncing || schedules.length === 0}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-2 disabled:opacity-50 shadow-sm"
        >
          {isSyncing ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Menyimpan Ke Dasbor ACT...</span>
            </>
          ) : (
            <>
              <UploadCloud className="w-4 h-4" />
              <span>Push Jadwal ke Dasbor ACT</span>
            </>
          )}
        </button>
      </div>

      {/* Toolbar: Day Tabs + Search + View Switcher */}
      <div className="border border-zinc-200 rounded-xl p-3 bg-white flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 shadow-sm">
        {/* Day Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 lg:pb-0 scrollbar-thin">
          <button
            onClick={() => setSelectedDay('SEMUA')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 ${
              selectedDay === 'SEMUA'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
            }`}
          >
            Semua Hari
          </button>
          {DAYS_ORDER.map((day) => {
            const count = (groupedByDay[day] || []).length;
            const isActive = selectedDay === day;
            return (
              <button
                key={day}
                onClick={() => setSelectedDay(day)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shrink-0 flex items-center gap-1.5 ${
                  isActive
                    ? 'bg-purple-600 text-white shadow-sm font-bold'
                    : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200'
                }`}
              >
                <span>{day}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
                    isActive ? 'bg-purple-800 text-purple-100' : 'bg-zinc-200 text-zinc-700'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Right Section: Search & View Switcher */}
        <div className="flex items-center gap-2.5 justify-between lg:justify-end">
          {/* Search Box */}
          <div className="relative flex-1 lg:w-64">
            <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Cari Praktikum, Ruang, PJ, Asisten..."
              className="w-full pl-8 pr-3 py-1.5 bg-zinc-50 border border-zinc-200 rounded-lg text-xs focus:outline-none focus:border-purple-600"
            />
          </div>

          {/* View Mode Switcher */}
          <div className="flex items-center bg-zinc-100 p-1 rounded-lg border border-zinc-200 shrink-0">
            <button
              onClick={() => setViewMode('columns')}
              className={`p-1.5 rounded text-xs flex items-center gap-1 font-semibold transition-colors ${
                viewMode === 'columns' ? 'bg-white text-purple-700 shadow-sm font-bold' : 'text-zinc-600 hover:text-zinc-900'
              }`}
              title="Tampilan Kolom Per-Hari (Side-by-Side)"
            >
              <Columns className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Kolom Hari</span>
            </button>
            <button
              onClick={() => setViewMode('matrix')}
              className={`p-1.5 rounded text-xs flex items-center gap-1 font-semibold transition-colors ${
                viewMode === 'matrix' ? 'bg-white text-purple-700 shadow-sm font-bold' : 'text-zinc-600 hover:text-zinc-900'
              }`}
              title="Tampilan Matriks (Jam x Ruang)"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Matriks Ruang</span>
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded text-xs flex items-center gap-1 font-semibold transition-colors ${
                viewMode === 'table' ? 'bg-white text-purple-700 shadow-sm font-bold' : 'text-zinc-600 hover:text-zinc-900'
              }`}
              title="Tampilan Tabel Raw"
            >
              <TableIcon className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Tabel Raw</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      {isLoadingLive ? (
        <div className="border border-zinc-200 bg-white rounded-xl p-16 text-center text-xs text-zinc-500 flex flex-col items-center justify-center gap-2.5">
          <RefreshCw className="w-6 h-6 text-purple-600 animate-spin" />
          <span className="font-semibold">Memuat data jadwal realtime dari database ACT...</span>
        </div>
      ) : filteredSchedules.length === 0 ? (
        <div className="border border-zinc-200 bg-white rounded-xl p-16 text-center text-xs text-zinc-400">
          {searchTerm || selectedDay !== 'SEMUA'
            ? 'Tidak ada data jadwal yang cocok dengan filter atau pencarian Anda.'
            : 'Belum ada data jadwal di server ACT. Silakan unggah file Excel.'}
        </div>
      ) : (
        <>
          {/* VIEW 1: DAY COLUMNS (SIDE BY SIDE) */}
          {viewMode === 'columns' && (
            <div className="overflow-x-auto pb-4">
              <div className="flex items-start gap-4 min-w-[1200px]">
                {availableDays.map((day) => {
                  const dayItems = groupedByDay[day] || [];
                  if (selectedDay !== 'SEMUA' && selectedDay !== day) return null;

                  return (
                    <div key={day} className="flex-1 min-w-[300px] max-w-[360px] bg-zinc-50/80 rounded-xl border border-zinc-200 overflow-hidden flex flex-col">
                      {/* Column Header */}
                      <div className="bg-gradient-to-r from-zinc-900 to-zinc-800 text-white px-3.5 py-2.5 flex items-center justify-between shadow-sm">
                        <div className="flex items-center gap-2 font-bold text-xs">
                          <Calendar className="w-3.5 h-3.5 text-purple-400" />
                          <span>{day}</span>
                        </div>
                        <span className="bg-purple-900/80 text-purple-200 text-[11px] font-mono font-bold px-2 py-0.5 rounded-full border border-purple-700/50">
                          {dayItems.length} Sesi
                        </span>
                      </div>

                      {/* Column Body Cards */}
                      <div className="p-3 space-y-3 max-h-[750px] overflow-y-auto scrollbar-thin">
                        {dayItems.length === 0 ? (
                          <div className="p-6 text-center text-zinc-400 italic text-[11px]">Tidak ada jadwal untuk hari ini</div>
                        ) : (
                          dayItems.map((item, idx) => {
                            const assistants: string[] = [];
                            Object.keys(item).forEach((k) => {
                              if (k.toLowerCase().startsWith('asisten') && item[k]) {
                                assistants.push(item[k]);
                              }
                            });

                            return (
                              <div
                                key={idx}
                                className="bg-white rounded-lg border border-zinc-200 p-3 shadow-xs hover:shadow-md hover:border-purple-300 transition-all space-y-2.5"
                              >
                                {/* Top Badge Row: Time & Room */}
                                <div className="flex items-center justify-between gap-1 text-[11px]">
                                  <span className="inline-flex items-center gap-1 font-mono font-bold text-purple-700 bg-purple-50 border border-purple-200 px-2 py-0.5 rounded">
                                    <Clock className="w-3 h-3 text-purple-600" />
                                    {item.Jam || item.jam || '-'}
                                  </span>

                                  <span className="inline-flex items-center gap-1 font-mono font-bold text-zinc-800 bg-zinc-100 border border-zinc-200 px-2 py-0.5 rounded">
                                    <MapPin className="w-3 h-3 text-zinc-500" />
                                    {item.Ruang || item.ruang || '-'}
                                  </span>
                                </div>

                                {/* Subject Title */}
                                <div>
                                  <div className="font-bold text-zinc-900 text-xs leading-snug flex items-start gap-1.5">
                                    <BookOpen className="w-3.5 h-3.5 text-indigo-600 shrink-0 mt-0.5" />
                                    <span>{item['Mata Praktikum'] || item.course || item.materi || '-'}</span>
                                  </div>
                                </div>

                                {/* Divider */}
                                <div className="border-t border-zinc-100 pt-2 space-y-1 text-[11px]">
                                  {/* Penanggung Jawab */}
                                  <div className="flex items-center justify-between text-zinc-600">
                                    <span className="flex items-center gap-1 text-zinc-400">
                                      <User className="w-3 h-3 text-amber-500" />
                                      <span>PJ:</span>
                                    </span>
                                    <span className="font-semibold text-zinc-800 text-right">{item['Penanggung Jawab'] || item.pj || '-'}</span>
                                  </div>

                                  {/* Tutor */}
                                  <div className="flex items-center justify-between text-zinc-600">
                                    <span className="flex items-center gap-1 text-zinc-400">
                                      <User className="w-3 h-3 text-blue-500" />
                                      <span>Tutor:</span>
                                    </span>
                                    <span className="font-semibold text-zinc-800 text-right">{item.Tutor || item.tutor || '-'}</span>
                                  </div>

                                  {/* Assistants list */}
                                  {assistants.length > 0 && (
                                    <div className="pt-1 border-t border-dashed border-zinc-100">
                                      <div className="flex items-center gap-1 text-zinc-400 text-[10px] font-semibold mb-1">
                                        <Users className="w-3 h-3 text-emerald-500" />
                                        <span>Asisten ({assistants.length}):</span>
                                      </div>
                                      <div className="flex flex-wrap gap-1">
                                        {assistants.map((ast, aIdx) => (
                                          <span
                                            key={aIdx}
                                            className="bg-emerald-50 text-emerald-800 border border-emerald-200 rounded px-1.5 py-0.5 text-[10px] font-medium"
                                          >
                                            {ast}
                                          </span>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* VIEW 2: ROOM x TIME MATRIX */}
          {viewMode === 'matrix' && (
            <div className="border border-zinc-200 rounded-xl bg-white overflow-hidden shadow-sm">
              <div className="p-3 bg-zinc-50 border-b border-zinc-200 font-bold text-xs text-zinc-900 flex items-center justify-between">
                <span>Matriks Ruang Praktikum & Sesi Jam</span>
                <span className="text-[11px] text-zinc-500 font-mono">Daftar Ruang: {allRooms.join(', ')}</span>
              </div>

              <div className="overflow-x-auto max-h-[700px]">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-zinc-900 text-white font-mono text-[11px]">
                      <th className="p-3 border-r border-zinc-800 w-28">Hari / Jam</th>
                      <th className="p-3 border-r border-zinc-800 w-32">Waktu</th>
                      {allRooms.map((room) => (
                        <th key={room} className="p-3 border-r border-zinc-800 min-w-[220px]">
                          Ruang {room}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200 text-zinc-900">
                    {DAYS_ORDER.map((day) => {
                      if (selectedDay !== 'SEMUA' && selectedDay !== day) return null;
                      const dayItems = groupedByDay[day] || [];
                      if (dayItems.length === 0) return null;

                      // Get unique time slots for this day
                      const dayTimes = Array.from(new Set(dayItems.map((s) => String(s.Jam || '').trim()).filter(Boolean)));

                      return dayTimes.map((time, tIdx) => (
                        <tr key={`${day}-${time}`} className="hover:bg-zinc-50/80 transition-colors">
                          {tIdx === 0 && (
                            <td
                              rowSpan={dayTimes.length}
                              className="p-3 font-bold border-r border-zinc-200 bg-purple-50 text-purple-900 align-top font-mono"
                            >
                              {day}
                            </td>
                          )}

                          <td className="p-3 font-mono font-semibold border-r border-zinc-200 text-zinc-700 bg-zinc-50/50 align-top">
                            {time}
                          </td>

                          {allRooms.map((room) => {
                            const match = dayItems.find(
                              (s) => String(s.Jam || '').trim() === time && String(s.Ruang || '').trim() === room
                            );

                            if (!match) {
                              return <td key={room} className="p-3 border-r border-zinc-100 bg-zinc-50/20 text-zinc-300 italic align-top text-[11px]">-</td>;
                            }

                            const assistants: string[] = [];
                            Object.keys(match).forEach((k) => {
                              if (k.toLowerCase().startsWith('asisten') && match[k]) {
                                assistants.push(match[k]);
                              }
                            });

                            return (
                              <td key={room} className="p-3 border-r border-zinc-200 align-top bg-white">
                                <div className="space-y-1.5">
                                  <div className="font-bold text-zinc-900 leading-snug">{match['Mata Praktikum'] || match.course || '-'}</div>
                                  <div className="text-[11px] text-zinc-600 flex items-center justify-between border-t border-zinc-100 pt-1">
                                    <span className="text-zinc-400">PJ:</span>
                                    <span className="font-semibold text-zinc-800">{match['Penanggung Jawab'] || '-'}</span>
                                  </div>
                                  <div className="text-[11px] text-zinc-600 flex items-center justify-between">
                                    <span className="text-zinc-400">Tutor:</span>
                                    <span className="font-semibold text-zinc-800">{match.Tutor || '-'}</span>
                                  </div>
                                  {assistants.length > 0 && (
                                    <div className="flex flex-wrap gap-1 pt-1 border-t border-dashed border-zinc-100">
                                      {assistants.map((ast, aIdx) => (
                                        <span key={aIdx} className="bg-emerald-50 text-emerald-800 text-[10px] px-1.5 py-0.5 rounded border border-emerald-200">
                                          {ast}
                                        </span>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              </td>
                            );
                          })}
                        </tr>
                      ));
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* VIEW 3: RAW TABLE VIEW */}
          {viewMode === 'table' && (
            <div className="border border-zinc-200 rounded-xl overflow-hidden bg-white shadow-sm">
              <div className="p-3 border-b border-zinc-200 font-bold text-xs text-zinc-900 flex items-center justify-between">
                <span>Tabel Data Lengkap ({filteredSchedules.length} entri)</span>
                <span className="text-[11px] text-zinc-400 font-mono">key: assistant_schedule</span>
              </div>

              <div className="overflow-x-auto max-h-[650px]">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-zinc-50 border-b border-zinc-200 text-zinc-600 font-mono text-[11px]">
                      {headers.map((h) => (
                        <th key={h} className="p-3 font-semibold border-r border-zinc-200 whitespace-nowrap">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200 text-zinc-900">
                    {filteredSchedules.map((row, idx) => (
                      <tr key={idx} className="hover:bg-purple-50/50 transition-colors">
                        {headers.map((h) => (
                          <td key={h} className="p-2.5 border-r border-zinc-100 whitespace-nowrap font-medium">
                            {row[h] || '-'}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};


