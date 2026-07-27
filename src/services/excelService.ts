import * as XLSX from 'xlsx';
import type { MoodleUserRecord, ScheduleItem } from '../types/workspace';

/**
 * Generate & download Lepkom Schedule Excel template
 */
export const generateLepkomScheduleExcel = (items: ScheduleItem[], filename = 'Jadwal_Jaga_Lepkom.xlsx') => {
  const data = items.map((item) => ({
    'Hari': item.day,
    'Shift': item.shift,
    'Mata Praktikum': item.course,
    'Kelas': item.class,
    'Ruang Lab': item.room,
    'Nama Asisten': item.assistant,
    'Status': item.status,
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Jadwal');
  XLSX.writeFile(workbook, filename);
};

/**
 * Generate & download Lepkom Grade/Attendance Spreadsheet Template
 */
export const generateLepkomGradeExcel = (courseName: string, className: string, studentCount = 30) => {
  const students = Array.from({ length: studentCount }, (_, i) => ({
    'No': i + 1,
    'NPM': `10121${String(i + 1).padStart(3, '0')}`,
    'Nama Mahasiswa': `Mahasiswa Test ${i + 1}`,
    'Kelas': className,
    'Tugas 1': 85 + (i % 15),
    'Tugas 2': 80 + (i % 20),
    'Ujian M2': 90 - (i % 10),
    'Nilai Akhir': 87,
    'Keterangan': 'LULUS',
  }));

  const worksheet = XLSX.utils.json_to_sheet(students);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Rekap Nilai');
  XLSX.writeFile(workbook, `Rekap_Nilai_${courseName.replace(/\s+/g, '_')}_${className}.xlsx`);
};

/**
 * Generate Moodle CSV Bulk User Import File
 */
export const generateMoodleBulkUserCsv = (records: MoodleUserRecord[], filename = 'moodle_users_bulk.csv') => {
  const worksheet = XLSX.utils.json_to_sheet(records);
  const csvOutput = XLSX.utils.sheet_to_csv(worksheet);
  
  const blob = new Blob([csvOutput], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

/**
 * Parse matrix format jadwal asisten from raw 2D array.
 * Matches act-lepkom-v2 exact matrix parsing behavior.
 */

function parseMatrixSchedule(rawData: any[][]): Record<string, any>[] {
  const DAY_NAMES = ['SENIN', 'SELASA', 'RABU', 'KAMIS', "JUM'AT", 'JUMAT', 'SABTU'];

  let hariRowIdx = -1, ruangRowIdx = -1;
  for (let r = 0; r < rawData.length; r++) {
    const v = String(rawData[r]?.[0] || '').trim().toUpperCase();
    if (v === 'HARI') hariRowIdx = r;
    else if (v === 'RUANG' && hariRowIdx >= 0) ruangRowIdx = r;
    if (hariRowIdx >= 0 && ruangRowIdx >= 0) break;
  }

  if (hariRowIdx < 0 || ruangRowIdx < 0) {
    return [];
  }

  const hariRow = rawData[hariRowIdx];
  const ruangRow = rawData[ruangRowIdx];

  let currentDay = '';
  const colMap: Record<number, { day: string; room: string }> = {};
  for (let c = 0; c < Math.max(hariRow.length, ruangRow.length); c++) {
    const d = String(hariRow[c] || '').trim().toUpperCase();
    if (DAY_NAMES.includes(d) || d.startsWith("JUM")) {
      currentDay = d.startsWith("JUM") ? "JUM'AT" : d;
    }
    
    const roomVal = String(ruangRow[c] || '').trim().toUpperCase();
    if (c >= 2 && currentDay && roomVal) {
      colMap[c] = { day: currentDay, room: roomVal };
    }
  }

  const colKeys = Object.keys(colMap).map(Number);
  if (colKeys.length === 0) return [];

  const maxCol = Math.max(...colKeys);
  const entries: Record<string, any>[] = [];
  let lastMateriRow: any[] = [];

  let r = ruangRowIdx + 1;
  while (r < rawData.length) {
    const row = rawData[r];
    if (!row || row.length === 0) { r++; continue; }

    const col0 = String(row[0] || '').trim();

    if (col0 === 'Materi') {
      lastMateriRow = row;
      r++;
      continue;
    }

    if (col0.toUpperCase().startsWith('SESI')) {
      const tutorRow = row;
      let pjRow: any[] | null = null;
      let asistenRows: any[][] = [];
      let scanR = r + 1;

      while (scanR < rawData.length) {
        const sRow = rawData[scanR];
        if (!sRow || sRow.length === 0) { scanR++; continue; }
        const sCol0 = String(sRow[0] || '').trim();
        const sCol1 = String(sRow[1] || '').trim();

        if (sCol1 === 'ASISTEN PJ' && /^[\d.:\s-]+$/.test(sCol0)) {
          pjRow = sRow;
          scanR++;
          break;
        }
        scanR++;
      }

      if (!pjRow) { r++; continue; }

      while (scanR < rawData.length) {
        const aRow = rawData[scanR];
        if (!aRow || aRow.length === 0) { scanR++; break; }

        const aCol0 = String(aRow[0] || '').trim();
        const aCol1 = String(aRow[1] || '').trim();

        if (aCol0 === '' && aCol1 === 'ASISTEN') {
          asistenRows.push(aRow);
          scanR++;
        } else {
          break;
        }
      }

      const time = String(pjRow[0] || '').trim();

      for (let c = 2; c <= maxCol; c++) {
        if (!colMap[c]) continue;
        const pjName = String(pjRow[c] || '').trim();
        if (!pjName) continue;

        const entry: Record<string, any> = {
          Hari: colMap[c].day,
          Jam: time,
          Ruang: colMap[c].room,
          'Mata Praktikum': String(lastMateriRow[c] || '').trim(),
          'Penanggung Jawab': pjName,
          'Tutor': String(tutorRow[c] || '').trim(),
        };

        asistenRows.forEach((aRow, i) => {
          const name = String(aRow[c] || '').trim();
          if (name) entry[`Asisten ${i + 1}`] = name;
        });

        entries.push(entry);
      }

      r = scanR;
      continue;
    }

    r++;
  }

  return entries;
}

/**
 * Read XLSX or CSV File into JSON Array
 */
export const parseExcelFile = <T = any>(file: File): Promise<T[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];

        const rawMatrixData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];

        // Check if matrix format
        let isMatrix = false;
        for (let r = 0; r < Math.min(10, rawMatrixData.length); r++) {
          const row = rawMatrixData[r];
          if (row && String(row[0] || '').trim().toUpperCase() === 'HARI') {
            isMatrix = true;
            break;
          }
        }

        if (isMatrix) {
          const matrixParsed = parseMatrixSchedule(rawMatrixData);
          if (matrixParsed.length > 0) {
            resolve(matrixParsed as unknown as T[]);
            return;
          }
        }

        // Fallback to flat json data
        const jsonData = XLSX.utils.sheet_to_json<T>(worksheet);
        resolve(jsonData);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = (error) => reject(error);
    reader.readAsArrayBuffer(file);
  });
};

/**
 * Read XLSX or CSV from Web Link / Google Sheets Public Link into JSON Array
 */
export const parseExcelFromUrl = async <T = any>(url: string): Promise<T[]> => {
  let downloadUrl = url.trim();

  // Convert Google Sheets edit link to CSV export link
  const googleSheetMatch = downloadUrl.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (googleSheetMatch && googleSheetMatch[1]) {
    const sheetId = googleSheetMatch[1];
    downloadUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv`;
  }

  const response = await fetch(downloadUrl);
  if (!response.ok) {
    throw new Error(`Gagal mendownload lembar kerja (${response.statusText}). Pastikan link Google Sheets publik atau dapat diakses.`);
  }

  const arrayBuffer = await response.arrayBuffer();
  const data = new Uint8Array(arrayBuffer);
  const workbook = XLSX.read(data, { type: 'array' });
  const firstSheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[firstSheetName];
  return XLSX.utils.sheet_to_json<T>(worksheet);
};
