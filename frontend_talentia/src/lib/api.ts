// src/lib/api.ts
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

// --- Helper for Auth Headers ---
export const getAuthHeaders = () => {
  const token = localStorage.getItem('access_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// --- Register User ---
export const register = async (email: string, password: string, full_name: string) => {
  const response = await fetch(`${API_BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, full_name }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail || 'Échec de l\'inscription');
  }

  const data = await response.json();
  localStorage.setItem('access_token', data.access_token);
  localStorage.setItem('user_id', data.user_id);
  localStorage.setItem('user_name', full_name);
  localStorage.setItem('user_email', email);
  return data;
};

// --- Login User ---
export const login = async (email: string, password: string) => {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, full_name: "" }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail || 'Échec de la connexion');
  }

  const data = await response.json();
  localStorage.setItem('access_token', data.access_token);
  localStorage.setItem('user_id', data.user_id);

  // Fetch user details
  const userResponse = await fetch(`${API_BASE_URL}/auth/me`, {
    headers: getAuthHeaders(),
  });

  if (userResponse.ok) {
    const userData = await userResponse.json();
    localStorage.setItem('user_name', userData.full_name || userData.email.split('@')[0]);
    localStorage.setItem('user_email', userData.email);
  }

  return data;
};

// --- Upload CV ---
export const uploadCV = async (file: File) => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${API_BASE_URL}/candidates/upload`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail || 'Échec du téléchargement');
  }

  return response.json();
};

// --- Match Jobs ---
// ✅ FIXED: Properly pass top_k parameter to backend
export const matchJobs = async (candidateId: string, topK: number = 100) => {
  console.log('matchJobs called with:', { candidateId, topK });
  
  // Build URL with query parameter
  const url = `${API_BASE_URL}/jobs/match/${candidateId}?top_k=${topK}`;
  console.log('Fetching from URL:', url);
  
  const response = await fetch(url, {
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail || 'Échec de la recherche de correspondances');
  }

  const data = await response.json();
  console.log('matchJobs response:', data);
  console.log('Number of matches returned:', data?.matches?.length);
  
  return data;
};

// --- Get All Jobs ---
export const getAllJobs = async (opts?: {
  page?: number;
  page_size?: number;
  q?: string;
  location?: string;
  contract?: string;
}) => {
  const page = opts?.page ?? 1;
  const page_size = opts?.page_size ?? 20;
  const params = new URLSearchParams({
    page: String(page),
    page_size: String(page_size),
  });

  if (opts?.q) params.set('q', opts.q);
  if (opts?.location) params.set('location', opts.location);
  if (opts?.contract) params.set('contract', opts.contract);

  const response = await fetch(`${API_BASE_URL}/jobs/all?${params.toString()}`, {
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail || 'Échec de la récupération des offres');
  }

  return response.json();
};

// --- Get Single Job ---
export const getJob = async (jobId: string) => {
  const response = await fetch(`${API_BASE_URL}/jobs/${jobId}`, {
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail || 'Échec de la récupération de l\'offre');
  }

  return response.json();
};

// --- Trigger Scraper (Admin) ---
export const runScraper = async (adminKey: string, q = 'data scientist', location = '', limit = 20) => {
  const response = await fetch(
    `${API_BASE_URL}/jobs/scrape?q=${encodeURIComponent(q)}&location=${encodeURIComponent(location)}&limit=${limit}`,
    {
      method: 'POST',
      headers: {
        'X-ADMIN-KEY': adminKey,
        ...getAuthHeaders()
      },
    }
  );

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail || 'Échec du déclenchement du scraper');
  }

  return response.json();
};