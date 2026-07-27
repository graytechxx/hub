import React, { useState } from 'react';
import { Settings, ShieldCheck, RefreshCw, CheckCircle2, AlertCircle, Globe, Key } from 'lucide-react';
import type { ActConfig } from '../../types/workspace';
import { checkActConnection, saveActConfig } from '../../services/actApi';

interface SettingsModuleProps {
  config: ActConfig;
  onUpdateConfig: (cfg: ActConfig) => void;
}

export const SettingsModule: React.FC<SettingsModuleProps> = ({ config, onUpdateConfig }) => {
  const [baseUrl, setBaseUrl] = useState(config.baseUrl);
  const [apiKey, setApiKey] = useState(config.apiKey);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);

    const testCfg: ActConfig = { baseUrl, apiKey, isConnected: false };
    const ok = await checkActConnection(testCfg);

    setIsTesting(false);

    if (ok) {
      setTestResult({
        success: true,
        message: 'Koneksi ke Web ACT (act-lepkom-v2) berhasil terhubung!',
      });
      const updated = { ...testCfg, isConnected: true, lastChecked: new Date().toLocaleTimeString('id-ID') };
      saveActConfig(updated);
      onUpdateConfig(updated);
    } else {
      setTestResult({
        success: false,
        message: 'Gagal terhubung ke URL ACT Server. Pastikan Laragon / php artisan serve di act-lepkom-v2 sedang aktif.',
      });
      const updated = { ...testCfg, isConnected: false, lastChecked: new Date().toLocaleTimeString('id-ID') };
      saveActConfig(updated);
      onUpdateConfig(updated);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    handleTestConnection();
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-200 max-w-3xl">
      {/* Banner */}
      <div className="p-5 notion-card rounded-xl border border-zinc-200 bg-zinc-50 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-zinc-900 flex items-center gap-2">
            <Settings className="w-5 h-5 text-indigo-600" />
            Pengaturan Integrasi & REST API Bridge ACT
          </h2>
          <p className="text-xs text-zinc-600 mt-1">
            Lepkom Hub dapat terhubung ke proyek `act-lepkom-v2` melalui REST API endpoint.
          </p>
        </div>

        <div className="px-3 py-1.5 rounded-lg bg-white border border-zinc-300 text-zinc-800 text-xs font-mono font-bold">
          Status: {config.isConnected ? 'CONNECTED' : 'DISCONNECTED'}
        </div>
      </div>

      {testResult && (
        <div
          className={`p-4 rounded-xl text-xs flex items-start gap-2 border ${
            testResult.success
              ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
              : 'bg-rose-50 border-rose-300 text-rose-900'
          }`}
        >
          {testResult.success ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          )}
          <div>
            <div className="font-bold">{testResult.success ? 'Koneksi Berhasil' : 'Koneksi Terputus'}</div>
            <div>{testResult.message}</div>
          </div>
        </div>
      )}

      <div className="notion-card p-6 rounded-xl space-y-5">
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-zinc-700 mb-1 flex items-center gap-1.5">
              <Globe className="w-4 h-4 text-indigo-600" />
              Base URL Web ACT (act-lepkom-v2)
            </label>
            <input
              type="url"
              required
              value={baseUrl}
              onChange={(e) => setBaseUrl(e.target.value)}
              placeholder="http://localhost:8000 atau http://act-lepkom-v2.test"
              className="w-full bg-zinc-50 border border-zinc-300 rounded-lg p-3 text-xs text-zinc-900 font-mono focus:outline-none focus:border-indigo-600"
            />
            <span className="text-[11px] text-zinc-500 mt-1 block">
              Default Laragon domain atau port local serving (contoh: http://localhost:8000).
            </span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 mb-1 flex items-center gap-1.5">
              <Key className="w-4 h-4 text-amber-600" />
              API Key / Sanctum Token (Opsional)
            </label>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Masukkan token rahasia (bila API dilindungi)..."
              className="w-full bg-zinc-50 border border-zinc-300 rounded-lg p-3 text-xs text-zinc-900 font-mono focus:outline-none focus:border-indigo-600"
            />
          </div>

          <div className="pt-2 flex items-center gap-3">
            <button
              type="submit"
              disabled={isTesting}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold transition-colors flex items-center gap-2 shadow-sm disabled:opacity-50"
            >
              {isTesting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Menguji Koneksi...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>Tes & Simpan Konfigurasi</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
