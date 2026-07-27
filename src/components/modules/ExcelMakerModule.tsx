import React, { useState, useRef } from 'react';
import { FileSpreadsheet, Download, RefreshCw, UploadCloud, Info, CheckCircle2, Terminal, FileCheck } from 'lucide-react';
import { generateExcelMaker, getActConfig } from '../../services/actApi';

export const ExcelMakerModule: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [generating, setGenerating] = useState(false);
  const [logs, setLogs] = useState<string>('');
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [infoOpen, setInfoOpen] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
      setLogs('');
      setDownloadUrl(null);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile.name.endsWith('.xlsx') || droppedFile.name.endsWith('.xls')) {
        setFile(droppedFile);
        setLogs('');
        setDownloadUrl(null);
      } else {
        alert('Hanya file Excel (.xlsx, .xls) yang diperbolehkan.');
      }
    }
  };

  const triggerBrowse = () => {
    fileInputRef.current?.click();
  };

  const handleGenerate = async () => {
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    setGenerating(true);
    setLogs('[PROSES] Sedang mengunggah berkas master dan memulai proses generator Python...\n');
    setDownloadUrl(null);

    try {
      const data = await generateExcelMaker(formData);
      setLogs(data.logs || '');

      if (data.success && data.download_url) {
        // Fix relative download URL if needed
        const cfg = getActConfig();
        const fullUrl = data.download_url.startsWith('http')
          ? data.download_url
          : `${cfg.baseUrl}${data.download_url}`;

        setDownloadUrl(fullUrl);
      } else {
        setLogs((prev) => prev + '\n[ERROR] Pembuatan spreadsheet gagal. Silakan periksa log di atas.');
      }
    } catch (err: any) {
      setLogs((prev) => prev + `\n[ERROR] Hubungan ke server gagal: ${err.message || err}`);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-200 text-xs">
      {/* Header Banner */}
      <div className="p-5 notion-card rounded-xl border border-indigo-200 bg-indigo-50/50 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-zinc-900 flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-indigo-600" />
            Lepkom Excel Maker
          </h2>
          <p className="text-xs text-zinc-600 mt-1">
            Generate spreadsheet penilaian kursus pengulangan (remedial) otomatis dari satu file master Excel.
          </p>
        </div>

        <button
          onClick={() => setInfoOpen(!infoOpen)}
          className="px-3.5 py-2 bg-white border border-zinc-300 rounded-lg text-xs font-semibold text-zinc-700 hover:bg-zinc-100 transition flex items-center gap-1.5 shadow-2xs shrink-0"
        >
          <Info className="w-4 h-4 text-indigo-600" />
          <span>{infoOpen ? 'Sembunyikan Aturan Format' : 'Tampilkan Aturan Format'}</span>
        </button>
      </div>

      {/* Info Rules Box */}
      {infoOpen && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in">
          <div className="p-4 notion-card rounded-xl border border-indigo-200 bg-indigo-50/40 space-y-2">
            <h3 className="text-xs font-bold text-indigo-900 uppercase flex items-center gap-1.5">
              <FileCheck className="w-4 h-4 text-indigo-600" />
              Sheet 1: Jadwal Asisten
            </h3>
            <p className="text-[11px] text-zinc-500 font-semibold uppercase">Memetakan PJ, Asisten, dan Tanggal Kloter</p>
            <ul className="list-disc list-inside text-xs text-zinc-700 space-y-1">
              <li>Wajib memiliki kolom untuk tiap materi (<strong className="text-indigo-900">DBMS, DESKTOP, WEB, NETWORK</strong>).</li>
              <li>Baris <strong className="text-indigo-700">PJ Penilai</strong> berisi nama PJ masing-masing materi.</li>
              <li>Baris <strong className="text-teal-700">Asisten</strong> berisi daftar nama asisten.</li>
              <li>Harus ada cell yang berisi rentang tanggal, contoh: <code className="bg-white px-1 py-0.5 rounded text-indigo-800 font-mono font-semibold border border-indigo-200">(23 - 28 JUNI 2026)</code>.</li>
            </ul>
          </div>

          <div className="p-4 notion-card rounded-xl border border-indigo-200 bg-indigo-50/40 space-y-2">
            <h3 className="text-xs font-bold text-indigo-900 uppercase flex items-center gap-1.5">
              <FileCheck className="w-4 h-4 text-indigo-600" />
              Sheet 2: Data Pengulangan
            </h3>
            <p className="text-[11px] text-zinc-500 font-semibold uppercase">Daftar Praktikan Remedial</p>
            <ul className="list-disc list-inside text-xs text-zinc-700 space-y-1">
              <li>Harus memiliki kolom: <strong className="text-indigo-900">NPM, NAMA, KELAS, MATERI KURSUS, TURUNAN MATERI, KATEGORI PENGULANGAN</strong>.</li>
              <li><strong className="text-indigo-700">TURUNAN MATERI</strong> diisi: <code className="bg-white px-1 py-0.5 rounded text-indigo-800 font-mono font-semibold border border-indigo-200">TURUNAN DBMS</code> / <code className="bg-white px-1 py-0.5 rounded text-indigo-800 font-mono border border-indigo-200">DESKTOP</code>, dll.</li>
              <li><strong className="text-teal-700">KATEGORI PENGULANGAN</strong> diisi: <code className="bg-white px-1 py-0.5 rounded text-indigo-800 font-mono border border-indigo-200">ULANG UJIAN</code> atau <code className="bg-white px-1 py-0.5 rounded text-indigo-800 font-mono border border-indigo-200">ULANG KURSUS</code>.</li>
            </ul>
          </div>
        </div>
      )}

      {/* Main Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Drag & Drop Upload */}
        <div className="lg:col-span-1 notion-card p-5 rounded-xl border border-zinc-200 bg-white flex flex-col justify-between space-y-4">
          <div>
            <h3 className="text-xs font-bold text-zinc-900 uppercase tracking-wider mb-3 flex items-center gap-1.5 border-b border-zinc-200 pb-2">
              <UploadCloud className="w-4 h-4 text-indigo-600" />
              Upload File Master (.xlsx, .xls)
            </h3>

            <div
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onClick={triggerBrowse}
              className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center min-h-[190px] ${
                file
                  ? 'border-emerald-500 bg-emerald-50/50'
                  : 'border-zinc-300 bg-zinc-50/80 hover:border-zinc-400 hover:bg-zinc-100/50'
              }`}
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept=".xlsx, .xls"
                className="hidden"
              />

              {file ? (
                <CheckCircle2 className="w-10 h-10 text-emerald-600 mb-2 animate-bounce" />
              ) : (
                <FileSpreadsheet className="w-10 h-10 text-zinc-400 mb-2" />
              )}

              {file ? (
                <div className="space-y-1">
                  <p className="text-xs font-bold text-zinc-900 truncate max-w-[200px]">{file.name}</p>
                  <p className="text-[11px] text-emerald-700 font-mono font-semibold uppercase">{(file.size / 1024).toFixed(1)} KB</p>
                </div>
              ) : (
                <div className="space-y-1">
                  <p className="text-xs font-bold text-zinc-800">Drag & drop file master di sini</p>
                  <p className="text-[11px] text-zinc-500">atau klik untuk menelusuri berkas (.xlsx, .xls)</p>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-3 pt-2 border-t border-zinc-100">
            {file && (
              <button
                onClick={handleGenerate}
                disabled={generating}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-lg transition-colors flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
              >
                {generating ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Membuat Spreadsheet...</span>
                  </>
                ) : (
                  <>
                    <FileSpreadsheet className="w-4 h-4" />
                    <span>Generate Spreadsheet</span>
                  </>
                )}
              </button>
            )}

            {downloadUrl && (
              <a
                href={downloadUrl}
                target="_blank"
                rel="noreferrer"
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg transition-colors flex items-center justify-center gap-2 shadow-md text-center animate-bounce"
              >
                <Download className="w-4 h-4" />
                <span>Download Hasil (.zip)</span>
              </a>
            )}
          </div>
        </div>

        {/* Log Console Output */}
        <div className="lg:col-span-2 notion-card p-5 rounded-xl border border-zinc-200 bg-white flex flex-col space-y-3">
          <div className="flex items-center justify-between border-b border-zinc-200 pb-2">
            <h3 className="text-xs font-bold text-zinc-900 uppercase tracking-wider flex items-center gap-1.5">
              <Terminal className="w-4 h-4 text-zinc-700" />
              Log Progress Generator Python
            </h3>
            {generating && (
              <span className="flex items-center gap-1.5 text-[11px] text-indigo-600 font-mono font-bold">
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Processing...</span>
              </span>
            )}
          </div>

          <div className="flex-1 min-h-[260px] rounded-lg bg-zinc-950 p-4 border border-zinc-800 font-mono text-[11px] text-emerald-400 leading-relaxed overflow-y-auto max-h-[380px] whitespace-pre-wrap select-text">
            {logs ? (
              logs
            ) : (
              <span className="text-zinc-500 italic font-sans">
                Console log generator akan ditampilkan di sini setelah Anda memilih file master dan mengklik tombol Generate...
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
