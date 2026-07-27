import axios from 'axios';
import type { ActConfig, Ticket } from '../types/workspace';

const STORAGE_KEY = 'lepkom_hub_act_config';

const CANDIDATE_URLS = [
  import.meta.env.VITE_ACT_API_BASE_URL,
  'https://act.cloudj5.my.id',
  'http://act.cloudj5.my.id',
  'http://192.168.28.14',
  'http://192.168.28.115',
  'http://172.16.0.115',
  'http://act.local',
  'http://act-lepkom-v2.test',
  'http://localhost/act-lepkom-v2/public',
  'http://localhost:8000',
].filter(Boolean) as string[];

const getCandidateUrls = (userBaseUrl?: string): string[] => {
  const list: string[] = [];
  if (userBaseUrl) {
    list.push(userBaseUrl.replace(/\/+$/, ''));
  }
  CANDIDATE_URLS.forEach((u) => {
    const clean = u.replace(/\/+$/, '');
    if (!list.includes(clean)) {
      list.push(clean);
    }
  });
  return list;
};

export const getActConfig = (): ActConfig => {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      if (parsed.baseUrl) return parsed;
    } catch (e) {
      console.error(e);
    }
  }
  return {
    baseUrl: 'http://act-lepkom-v2.test',
    apiKey: '',
    isConnected: false,
  };
};

export const saveActConfig = (config: ActConfig): void => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
};

const requestWithFallback = async <T = any>(
  makeRequest: (baseUrl: string) => Promise<T>
): Promise<T> => {
  const cfg = getActConfig();
  const candidates = getCandidateUrls(cfg.baseUrl);
  let lastError: any = null;

  for (const url of candidates) {
    try {
      const res = await makeRequest(url);
      if (url !== cfg.baseUrl) {
        saveActConfig({ ...cfg, baseUrl: url, isConnected: true });
      }
      return res;
    } catch (err: any) {
      lastError = err;
      // If the server responded with an HTTP status (e.g. 400, 422, 500), don't try next candidate
      if (err.response) {
        throw err;
      }
      // If network error / connection refused, continue trying next candidate
    }
  }
  throw lastError;
};

export const checkActConnection = async (config?: ActConfig): Promise<boolean> => {
  const cfg = config || getActConfig();
  const candidates = getCandidateUrls(cfg.baseUrl);
  for (const url of candidates) {
    try {
      const res = await axios.get(`${url}/api/announcements`, { timeout: 4000 });
      if (res.status === 200) {
        saveActConfig({ ...cfg, baseUrl: url, isConnected: true });
        return true;
      }
    } catch (error) {
      // try next
    }
  }
  return false;
};

export const uploadMaterialToAct = async (formData: FormData): Promise<{ success: boolean; message: string }> => {
  const cfg = getActConfig();
  const headers = {
    'Content-Type': 'multipart/form-data',
    ...(cfg.apiKey ? { Authorization: `Bearer ${cfg.apiKey}` } : {}),
  };

  try {
    const res = await requestWithFallback(async (url) => {
      try {
        return await axios.post(`${url}/api/hub/upload`, formData, { headers });
      } catch (e: any) {
        if (!e.response) throw e;
        return await axios.post(`${url}/public/upload`, formData, { headers });
      }
    });
    return { success: true, message: res.data?.message || 'Materi berhasil diunggah ke Web ACT!' };
  } catch (err: any) {
    return {
      success: false,
      message: err.response?.data?.message || 'Gagal terhubung ke server ACT.',
    };
  }
};

export const createMaterialLinkInAct = async (payload: {
  level_id: string;
  course_id: string;
  name: string;
  type: string;
  path: string;
  meeting_number: string;
}): Promise<{ success: boolean; message: string }> => {
  const cfg = getActConfig();
  const headers = {
    'Content-Type': 'application/json',
    ...(cfg.apiKey ? { Authorization: `Bearer ${cfg.apiKey}` } : {}),
  };

  try {
    const res = await requestWithFallback((url) =>
      axios.post(`${url}/api/hub/materials/link`, payload, { headers })
    );
    return { success: true, message: res.data?.message || 'Tautan materi berhasil ditambahkan ke Web ACT!' };
  } catch (err: any) {
    return {
      success: false,
      message: err.response?.data?.message || err.message || 'Gagal terhubung ke server ACT.',
    };
  }
};

export const fetchActSchedules = async (): Promise<Record<string, any>[]> => {
  const cfg = getActConfig();
  const headers = cfg.apiKey ? { Authorization: `Bearer ${cfg.apiKey}` } : {};

  try {
    const res = await requestWithFallback((baseUrl) =>
      axios.get(`${baseUrl}/api/hub/schedules`, { headers })
    );
    if (res.data && res.data.success && Array.isArray(res.data.data)) {
      return res.data.data;
    }
  } catch (e) {}
  return [];
};

export const fetchActMaterials = async (): Promise<Record<string, any>[]> => {
  const cfg = getActConfig();
  const headers = cfg.apiKey ? { Authorization: `Bearer ${cfg.apiKey}` } : {};

  try {
    const res = await requestWithFallback((baseUrl) =>
      axios.get(`${baseUrl}/api/hub/materials`, { headers })
    );
    if (res.data && res.data.success && Array.isArray(res.data.data)) {
      return res.data.data;
    }
  } catch (e) {}
  return [];
};

export const deleteActMaterial = async (id: number | string): Promise<{ success: boolean; message: string }> => {
  const cfg = getActConfig();
  const headers = {
    'Content-Type': 'application/json',
    ...(cfg.apiKey ? { Authorization: `Bearer ${cfg.apiKey}` } : {}),
  };

  try {
    const res = await requestWithFallback((baseUrl) =>
      axios.post(`${baseUrl}/api/hub/materials/delete`, { id }, { headers })
    );
    return {
      success: true,
      message: res.data?.message || 'Materi berhasil dihapus dari server ACT!',
    };
  } catch (err: any) {
    return {
      success: false,
      message: err.response?.data?.message || 'Gagal menghapus materi dari server ACT.',
    };
  }
};

export const pushScheduleToAct = async (data: Record<string, any>[]): Promise<{ success: boolean; message: string; count: number }> => {
  const cfg = getActConfig();
  const headers = {
    'Content-Type': 'application/json',
    ...(cfg.apiKey ? { Authorization: `Bearer ${cfg.apiKey}` } : {}),
  };

  try {
    const res = await requestWithFallback((url) =>
      axios.post(`${url}/api/hub/schedules`, { data }, { headers })
    );
    return {
      success: true,
      message: res.data?.message || 'Jadwal asisten berhasil disinkronkan ke Dasbor ACT!',
      count: data.length,
    };
  } catch (err: any) {
    return {
      success: false,
      message: err.response?.data?.message || err.message || 'Gagal terhubung ke server ACT.',
      count: 0,
    };
  }
};

export const pushBulkUsersToAct = async (users: Record<string, any>[]): Promise<{ success: boolean; message: string; created: number; updated: number }> => {
  const cfg = getActConfig();
  const headers = {
    'Content-Type': 'application/json',
    ...(cfg.apiKey ? { Authorization: `Bearer ${cfg.apiKey}` } : {}),
  };

  try {
    const res = await requestWithFallback((url) =>
      axios.post(`${url}/api/hub/users/bulk`, { users }, { headers })
    );
    return {
      success: true,
      message: res.data?.message || 'Data user berhasil di-push ke Web ACT!',
      created: res.data?.created || 0,
      updated: res.data?.updated || 0,
    };
  } catch (err: any) {
    return {
      success: false,
      message: err.response?.data?.message || err.message || 'Gagal terhubung ke server ACT.',
      created: 0,
      updated: 0,
    };
  }
};

export const fetchSheetsUrlViaAct = async (url: string): Promise<Record<string, any>[]> => {
  const cfg = getActConfig();
  const headers = {
    'Content-Type': 'application/json',
    ...(cfg.apiKey ? { Authorization: `Bearer ${cfg.apiKey}` } : {}),
  };

  try {
    const res = await requestWithFallback((baseUrl) =>
      axios.post(`${baseUrl}/api/hub/sheets/import`, { url }, { headers })
    );
    if (res.data && res.data.success && Array.isArray(res.data.data)) {
      return res.data.data;
    }
  } catch (e) {}
  return [];
};

export const fetchActUsers = async (): Promise<Record<string, any>[]> => {
  const cfg = getActConfig();
  const headers = cfg.apiKey ? { Authorization: `Bearer ${cfg.apiKey}` } : {};

  try {
    const res = await requestWithFallback((baseUrl) =>
      axios.get(`${baseUrl}/api/hub/users`, { headers })
    );
    if (res.data && res.data.success && Array.isArray(res.data.data)) {
      return res.data.data;
    }
  } catch (e) {}
  return [];
};

export const deleteActUser = async (email: string): Promise<boolean> => {
  const cfg = getActConfig();
  const headers = {
    'Content-Type': 'application/json',
    ...(cfg.apiKey ? { Authorization: `Bearer ${cfg.apiKey}` } : {}),
  };

  try {
    const res = await requestWithFallback((baseUrl) =>
      axios.post(`${baseUrl}/api/hub/users/delete`, { email }, { headers })
    );
    return res.data && res.data.success;
  } catch (e) {
    return false;
  }
};

export const updateActUserRealtime = async (user: { email: string; role?: string; tag?: string; name?: string }): Promise<boolean> => {
  const cfg = getActConfig();
  const headers = {
    'Content-Type': 'application/json',
    ...(cfg.apiKey ? { Authorization: `Bearer ${cfg.apiKey}` } : {}),
  };

  try {
    const res = await requestWithFallback((baseUrl) =>
      axios.post(`${baseUrl}/api/hub/users/update`, user, { headers })
    );
    return res.data && res.data.success;
  } catch (e) {
    return false;
  }
};

export const fetchActTickets = async (): Promise<Ticket[]> => {
  const cfg = getActConfig();
  const headers = cfg.apiKey ? { Authorization: `Bearer ${cfg.apiKey}` } : {};

  try {
    const res = await requestWithFallback((baseUrl) =>
      axios.get(`${baseUrl}/api/hub/tickets`, { headers })
    );
    if (res.data && res.data.success && Array.isArray(res.data.data)) {
      return res.data.data.map((t: any) => ({
        id: String(t.id || t.db_id),
        title: t.title,
        category: (t.target === 'TEKNIS' ? 'PC/Hardware' : 'Lainnya') as Ticket['category'],
        priority: 'Medium',
        status: (t.status || (t.act_status === 'open' ? 'Backlog' : (t.act_status === 'progress' ? 'In Progress' : 'Resolved'))) as Ticket['status'],
        assignee: t.userName || t.user?.name || 'Teknisi Lab',
        room: 'Lab J5',
        createdAt: t.createdAt || 'Baru saja',
        description: t.description,
      }));
    }
  } catch (e) {}
  return [];
};

export const updateActTicketStatusRealtime = async (id: string, status: Ticket['status']): Promise<boolean> => {
  const cfg = getActConfig();
  const headers = {
    'Content-Type': 'application/json',
    ...(cfg.apiKey ? { Authorization: `Bearer ${cfg.apiKey}` } : {}),
  };

  try {
    let actStatus = 'open';
    if (status === 'In Progress') actStatus = 'progress';
    if (status === 'Resolved') actStatus = 'resolved';

    const res = await requestWithFallback((baseUrl) =>
      axios.post(`${baseUrl}/api/hub/tickets/update`, { id, status: actStatus }, { headers })
    );
    return res.data && res.data.success;
  } catch (e) {
    return false;
  }
};

export const syncTicketToAct = async (ticket: Ticket): Promise<boolean> => {
  const cfg = getActConfig();
  const headers = {
    'Content-Type': 'application/json',
    ...(cfg.apiKey ? { Authorization: `Bearer ${cfg.apiKey}` } : {}),
  };

  try {
    const target = ticket.category === 'PC/Hardware' || ticket.category === 'Software/Lab' ? 'TEKNIS' : 'ADMIN';
    const res = await requestWithFallback((baseUrl) =>
      axios.post(`${baseUrl}/api/hub/tickets`, { title: ticket.title, description: ticket.description, target }, { headers })
    );
    return res.data && res.data.success;
  } catch (err) {
    return false;
  }
};

export const generateExcelMaker = async (formData: FormData): Promise<{ success: boolean; logs: string; download_url?: string }> => {
  const cfg = getActConfig();
  const headers = {
    'Content-Type': 'multipart/form-data',
    ...(cfg.apiKey ? { Authorization: `Bearer ${cfg.apiKey}` } : {}),
  };

  try {
    const res = await requestWithFallback((baseUrl) =>
      axios.post(`${baseUrl}/api/hub/excel-maker/generate`, formData, { headers })
    );
    return res.data;
  } catch (err: any) {
    return {
      success: false,
      logs: err.response?.data?.logs || err.response?.data?.message || err.message || 'Hubungan ke server ACT gagal.',
    };
  }
};

