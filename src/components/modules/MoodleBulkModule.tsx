import React, { useState, useMemo } from 'react';
import { Users, Download, Plus, Trash2, Clipboard, BookOpen, CheckCircle2, AlertCircle, FileSpreadsheet } from 'lucide-react';
import { parseExcelFile } from '../../services/excelService';

interface UserRow {
  username: string;
  password?: string;
  firstname: string;
  lastname: string;
  email: string;
}

export const MoodleBulkModule: React.FC = () => {
  const getDefaultYearSuffix = () => {
    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();
    if (month <= 2) {
      return String(year - 1).slice(-2);
    }
    return String(year).slice(-2);
  };

  const [yearSuffix, setYearSuffix] = useState(getDefaultYearSuffix());
  const [rows, setRows] = useState<UserRow[]>([
    { username: '', password: 'lepkomnewnormal', firstname: '', lastname: '', email: '' }
  ]);
  const [guideOpen, setGuideOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const handleInputChange = (index: number, field: keyof UserRow, value: string) => {
    const updated = [...rows];
    let val = value;
    if (field === 'username') {
      val = value.trim().replace(/^(PTA|ATA)\d+-/i, '');
    }
    updated[index] = {
      ...updated[index],
      [field]: val
    };

    if (field === 'username') {
      const cleanUser = val.toLowerCase().replace(/\s+/g, '');
      updated[index].email = cleanUser ? `pta/ata${yearSuffix}-${cleanUser}@lepkom.com` : '';
    }

    setRows(updated);
  };

  const addRow = () => {
    setRows([...rows, { username: '', password: 'lepkomnewnormal', firstname: '', lastname: '', email: '' }]);
  };

  const deleteRow = (index: number) => {
    if (rows.length > 1) {
      setRows(rows.filter((_, i) => i !== index));
    } else {
      setRows([{ username: '', password: 'lepkomnewnormal', firstname: '', lastname: '', email: '' }]);
    }
  };

  // Filter rows and generate BOTH PTA and ATA rows for each entry
  const previewRows = useMemo(() => {
    const result: UserRow[] = [];

    rows
      .filter(r => r.username.trim() !== '' || r.firstname.trim() !== '')
      .forEach(row => {
        const cleanUser = row.username.trim().replace(/^(PTA|ATA)\d+-/i, '');
        if (cleanUser) {
          // 1. PTA Row
          const ptaUser = `PTA${yearSuffix}-${cleanUser}`;
          result.push({
            ...row,
            username: ptaUser,
            email: `${ptaUser.toLowerCase()}@lepkom.com`
          });

          // 2. ATA Row
          const ataUser = `ATA${yearSuffix}-${cleanUser}`;
          result.push({
            ...row,
            username: ataUser,
            email: `${ataUser.toLowerCase()}@lepkom.com`
          });
        }
      });

    return result;
  }, [rows, yearSuffix]);

  const validationStatus = useMemo(() => {
    if (previewRows.length === 0) return { valid: false, message: 'Isi data user terlebih dahulu.' };

    let hasEmptyFields = false;
    for (const row of previewRows) {
      if (!row.username.trim() || !row.firstname.trim() || !row.lastname.trim() || !row.email.trim()) {
        hasEmptyFields = true;
        break;
      }
    }

    if (hasEmptyFields) {
      return { valid: false, warning: true, message: 'Masih ada kolom wajib (NPM/Username, Nama Depan, Nama Belakang, Email) yang kosong.' };
    }

    return { valid: true, message: `${previewRows.length} akun (${previewRows.length / 2} pasang PTA & ATA) siap diunduh!` };
  }, [previewRows]);

  const downloadCsv = () => {
    if (previewRows.length === 0) return;

    const headers = ['username', 'password', 'firstname', 'lastname', 'email'];
    const csvContent = [
      headers.join(','),
      ...previewRows.map(row =>
        headers.map(header => {
          const val = (row as any)[header] || '';
          return `"${val.replace(/"/g, '""')}"`;
        }).join(',')
      )
    ].join('\r\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `users_moodle_PTA_ATA_${yearSuffix}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setToastMsg(`Berhasil mengunduh CSV Moodle users_moodle_PTA_ATA_${yearSuffix}.csv!`);
  };

  const pasteFromClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);

      const newRows: UserRow[] = lines.map(line => {
        const delimiter = line.includes('\t') ? '\t' : (line.includes(',') ? ',' : ';');
        const parts = line.split(delimiter).map(p => p.trim());
        const rawUsername = parts[0] || '';
        const username = rawUsername.replace(/^(PTA|ATA)\d+-/i, '');

        let firstname = '';
        let lastname = '';

        if (parts.length <= 3) {
          firstname = parts[1] || '';
          lastname = parts[2] || '';
        } else {
          firstname = parts[2] || '';
          lastname = parts[3] || '';
        }

        const cleanUser = username.toLowerCase().replace(/\s+/g, '');

        return {
          username: username,
          password: 'lepkomnewnormal',
          firstname: firstname,
          lastname: lastname,
          email: cleanUser ? `pta/ata${yearSuffix}-${cleanUser}@lepkom.com` : '',
        };
      });

      if (newRows.length > 0) {
        if (rows.length === 1 && !rows[0].username && !rows[0].firstname) {
          setRows(newRows);
        } else {
          setRows([...rows, ...newRows]);
        }
        setToastMsg(`Berhasil menempel ${newRows.length} baris data dari Excel!`);
      }
    } catch (err) {
      alert('Gagal membaca clipboard. Pastikan izin clipboard diaktifkan.');
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      try {
        const file = e.target.files[0];
        const parsed = await parseExcelFile<any>(file);
        if (parsed.length === 0) return;

        const newRows: UserRow[] = parsed.map((row) => {
          const rawUser = String(row['username'] || row['NPM'] || row['ID'] || row['Username'] || '').trim();
          const username = rawUser.replace(/^(PTA|ATA)\d+-/i, '');
          const cleanUser = username.toLowerCase().replace(/\s+/g, '');
          const fn = String(row['firstname'] || row['Nama Depan'] || row['Nama'] || '').trim();
          const ln = String(row['lastname'] || row['Nama Belakang'] || '').trim();

          return {
            username,
            password: 'lepkomnewnormal',
            firstname: fn,
            lastname: ln,
            email: cleanUser ? `pta/ata${yearSuffix}-${cleanUser}@lepkom.com` : '',
          };
        });

        setRows(newRows);
        setToastMsg(`Berhasil membaca ${newRows.length} baris dari file Excel (${file.name}).`);
      } catch (err) {
        setToastMsg('Gagal membaca file Excel/CSV.');
      }
    }
  };

  return (
    <div className="space-y-4 max-w-7xl mx-auto text-xs text-zinc-800">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-1 border-b border-zinc-200 pb-3">
        <div>
          <h2 className="text-sm font-bold text-zinc-900 flex items-center gap-1.5">
            <Users className="w-4 h-4 text-amber-600" />
            Moodle Bulk User Upload (PTA & ATA Dual Generator)
          </h2>
          <p className="text-xs text-zinc-500">
            Isi data user sekali, otomatis generate pasang akun PTA dan ATA sekaligus.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <label className="px-2.5 py-1.5 bg-white hover:bg-zinc-100 text-zinc-800 rounded text-xs font-semibold border border-zinc-300 transition-colors cursor-pointer flex items-center gap-1.5 shrink-0">
            <FileSpreadsheet className="w-3.5 h-3.5 text-amber-600" />
            <span>Upload File Excel</span>
            <input type="file" accept=".xlsx, .xls, .csv" onChange={handleFileUpload} className="hidden" />
          </label>

          <button
            onClick={pasteFromClipboard}
            className="px-2.5 py-1.5 bg-white hover:bg-zinc-100 text-zinc-800 rounded text-xs font-semibold border border-zinc-300 transition-colors flex items-center gap-1.5"
            title="Paste dari Excel (Clipboard)"
          >
            <Clipboard className="w-3.5 h-3.5 text-indigo-600" />
            <span>Paste Excel</span>
          </button>

          <button
            onClick={() => setGuideOpen(!guideOpen)}
            className="px-2.5 py-1.5 bg-white hover:bg-zinc-100 text-zinc-800 rounded text-xs font-semibold border border-zinc-300 transition-colors flex items-center gap-1.5"
          >
            <BookOpen className="w-3.5 h-3.5 text-zinc-600" />
            <span>{guideOpen ? 'Tutup Panduan' : 'Panduan'}</span>
          </button>
        </div>
      </div>

      {toastMsg && (
        <div className="p-3 bg-amber-50 border border-amber-200 text-amber-900 rounded text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-amber-600 shrink-0" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Configuration Panel */}
      <div className="border border-zinc-200 rounded-lg p-3 bg-zinc-50 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <label className="text-xs font-semibold text-zinc-700">Suffix Tahun Ajaran (2 Digit):</label>
          <input
            type="text"
            maxLength={2}
            value={yearSuffix}
            onChange={(e) => setYearSuffix(e.target.value.trim().replace(/\D/g, ''))}
            className="w-16 px-2.5 py-1 rounded border border-zinc-300 bg-white text-zinc-900 font-mono font-bold text-center text-xs focus:outline-none focus:border-zinc-500"
            placeholder="26"
          />
          <span className="text-[11px] text-zinc-500 italic">
            (Menghasilkan akun <strong className="text-amber-800">PTA{yearSuffix}-</strong> dan <strong className="text-amber-800">ATA{yearSuffix}-</strong> secara bersamaan)
          </span>
        </div>
      </div>

      {/* Guide Panel */}
      {guideOpen && (
        <div className="border border-indigo-200 bg-indigo-50/50 rounded-lg p-4 space-y-2">
          <h3 className="text-xs font-bold text-indigo-900 flex items-center gap-1.5">
            <BookOpen className="w-4 h-4 text-indigo-600" />
            Panduan Cara Upload File CSV ke Moodle LMS
          </h3>
          <ol className="list-decimal list-inside text-xs text-zinc-700 space-y-1.5 font-medium leading-relaxed">
            <li>Klik tombol <strong className="text-indigo-800">Download CSV</strong> setelah mengisi data di bawah.</li>
            <li>Login ke Moodle Anda sebagai <strong className="text-zinc-900">Admin</strong>.</li>
            <li>Buka menu <strong className="text-zinc-900">Site administration → Users → Accounts → Upload users</strong>.</li>
            <li>Pilih file CSV yang baru saja diunduh (<code className="text-indigo-900 font-mono">users_moodle_PTA_ATA_{yearSuffix}.csv</code>).</li>
            <li>Atur bagian <strong className="text-zinc-900">New user password</strong> menjadi <span className="text-indigo-800 font-bold">"Field required in file"</span>.</li>
            <li>Klik <strong className="text-indigo-800">Upload users</strong> untuk memproses seluruh akun!</li>
          </ol>
        </div>
      )}

      {/* Form Input Table */}
      <div className="border border-zinc-200 rounded-lg p-4 bg-white space-y-3">
        <div className="flex justify-between items-center border-b border-zinc-200 pb-2">
          <h3 className="text-xs font-bold text-zinc-900 uppercase tracking-wider">
            Input Daftar User ({rows.length} Baris)
          </h3>
          <button
            onClick={addRow}
            className="px-2.5 py-1 bg-zinc-900 hover:bg-zinc-800 text-white rounded text-[11px] font-semibold transition-colors flex items-center gap-1"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Tambah Baris</span>
          </button>
        </div>

        <div className="overflow-x-auto rounded border border-zinc-200 max-h-[380px]">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-zinc-50 border-b border-zinc-200 text-zinc-600 font-mono text-[11px]">
                <th className="py-2 px-3 w-10 text-center border-r border-zinc-200">No</th>
                <th className="py-2 px-3 border-r border-zinc-200">NPM/Username*</th>
                <th className="py-2 px-3 border-r border-zinc-200">Password</th>
                <th className="py-2 px-3 border-r border-zinc-200">Nama Depan*</th>
                <th className="py-2 px-3 border-r border-zinc-200">Nama Belakang*</th>
                <th className="py-2 px-3 border-r border-zinc-200">Email Preview</th>
                <th className="py-2 px-3 w-12 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200">
              {rows.map((row, idx) => (
                <tr key={idx} className="hover:bg-zinc-50">
                  <td className="py-2 px-3 text-center font-bold text-zinc-400 border-r border-zinc-100">{idx + 1}</td>
                  <td className="py-1.5 px-2 border-r border-zinc-100">
                    <div className="flex items-center w-full px-2 py-1 rounded border border-zinc-200 bg-zinc-50 focus-within:border-zinc-400">
                      <span className="text-zinc-400 font-mono font-bold pr-1 select-none text-[11px]">PTA/ATA{yearSuffix}-</span>
                      <input
                        type="text"
                        value={row.username.replace(/^(PTA|ATA)\d+-/i, '')}
                        onChange={(e) => handleInputChange(idx, 'username', e.target.value)}
                        className="w-full bg-transparent text-zinc-900 text-xs focus:outline-none font-mono"
                        placeholder="NPM"
                      />
                    </div>
                  </td>
                  <td className="py-1.5 px-2 border-r border-zinc-100">
                    <input
                      type="text"
                      value={row.password}
                      disabled
                      className="w-full px-2 py-1 rounded border border-zinc-200 bg-zinc-100 text-zinc-500 text-xs cursor-not-allowed font-mono select-none"
                    />
                  </td>
                  <td className="py-1.5 px-2 border-r border-zinc-100">
                    <input
                      type="text"
                      value={row.firstname}
                      onChange={(e) => handleInputChange(idx, 'firstname', e.target.value)}
                      className="w-full px-2 py-1 rounded border border-zinc-200 bg-zinc-50 text-zinc-900 text-xs focus:outline-none focus:border-zinc-400"
                      placeholder="Nama Depan"
                    />
                  </td>
                  <td className="py-1.5 px-2 border-r border-zinc-100">
                    <input
                      type="text"
                      value={row.lastname}
                      onChange={(e) => handleInputChange(idx, 'lastname', e.target.value)}
                      className="w-full px-2 py-1 rounded border border-zinc-200 bg-zinc-50 text-zinc-900 text-xs focus:outline-none focus:border-zinc-400"
                      placeholder="Nama Belakang"
                    />
                  </td>
                  <td className="py-1.5 px-2 border-r border-zinc-100">
                    <input
                      type="email"
                      value={row.username ? `pta/ata${yearSuffix}-${row.username.toLowerCase()}@lepkom.com` : ''}
                      disabled
                      className="w-full px-2 py-1 rounded border border-zinc-200 bg-zinc-100 text-zinc-500 text-xs cursor-not-allowed font-mono select-none"
                      placeholder="pta/ata26-username@lepkom.com"
                    />
                  </td>
                  <td className="py-1.5 px-2 text-center">
                    <button
                      type="button"
                      onClick={() => deleteRow(idx)}
                      className="p-1 rounded text-zinc-400 hover:text-rose-600 transition-colors"
                      title="Hapus baris"
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

      {/* Validation Status & Action */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 border border-zinc-200 rounded-lg p-3 bg-white">
        <div className="flex items-center gap-2">
          {validationStatus.warning ? (
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
          ) : validationStatus.valid ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-zinc-400 shrink-0" />
          )}
          <span className={`text-xs font-medium ${validationStatus.warning ? 'text-amber-800' : validationStatus.valid ? 'text-emerald-800' : 'text-zinc-600'}`}>
            {validationStatus.message}
          </span>
        </div>

        {previewRows.length > 0 && (
          <button
            onClick={downloadCsv}
            className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs rounded transition-colors flex items-center justify-center gap-1.5 shadow-sm"
          >
            <Download className="w-4 h-4" />
            <span>Download CSV Moodle ({previewRows.length} User)</span>
          </button>
        )}
      </div>

      {/* Preview Panel */}
      {previewRows.length > 0 && (
        <div className="border border-zinc-200 rounded-lg p-4 bg-white space-y-3">
          <h3 className="text-xs font-bold text-zinc-900 uppercase tracking-wider">
            Pratinjau Hasil CSV ({previewRows.length} Akun - Pasangan PTA & ATA)
          </h3>

          <div className="overflow-x-auto rounded border border-zinc-200 max-h-[350px]">
            <table className="w-full text-left border-collapse text-xs font-mono">
              <thead>
                <tr className="bg-zinc-50 border-b border-zinc-200 text-zinc-600 text-[11px]">
                  <th className="py-2 px-3 border-r border-zinc-200">Username</th>
                  <th className="py-2 px-3 border-r border-zinc-200">Password</th>
                  <th className="py-2 px-3 border-r border-zinc-200">Firstname</th>
                  <th className="py-2 px-3 border-r border-zinc-200">Lastname</th>
                  <th className="py-2 px-3">Email</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200">
                {previewRows.map((row, idx) => (
                  <tr key={idx} className="hover:bg-zinc-50">
                    <td className="py-1.5 px-3 font-bold text-amber-900 border-r border-zinc-100">{row.username}</td>
                    <td className="py-1.5 px-3 text-zinc-500 border-r border-zinc-100">{row.password || '-'}</td>
                    <td className="py-1.5 px-3 text-zinc-800 border-r border-zinc-100">{row.firstname}</td>
                    <td className="py-1.5 px-3 text-zinc-800 border-r border-zinc-100">{row.lastname}</td>
                    <td className="py-1.5 px-3 text-zinc-600">{row.email}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
