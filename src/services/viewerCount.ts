const VIEWER_ID_STORAGE_KEY = 'chess-home-viewer-id-v1';
const DEFAULT_VIEWER_API_URL = 'https://chess-backend-gbxl.onrender.com';

const VIEWER_API_URL =
  import.meta.env.VITE_SOCKET_URL ||
  (import.meta.env.DEV ? 'http://localhost:3001' : DEFAULT_VIEWER_API_URL);

interface ViewerCountResponse {
  count: number;
}

function normalizeApiUrl(url: string) {
  return url.replace(/\/$/, '');
}

function getStoredViewerId() {
  try {
    return localStorage.getItem(VIEWER_ID_STORAGE_KEY);
  } catch {
    return null;
  }
}

function setStoredViewerId(visitorId: string) {
  try {
    localStorage.setItem(VIEWER_ID_STORAGE_KEY, visitorId);
  } catch {
    // Storage can be blocked. The counter still works for this load.
  }
}

function createViewerId() {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function getViewerId() {
  const existingId = getStoredViewerId();
  if (existingId) return existingId;

  const nextId = createViewerId();
  setStoredViewerId(nextId);
  return nextId;
}

async function readCountResponse(response: Response) {
  if (!response.ok) {
    throw new Error(`Viewer count request failed with ${response.status}`);
  }

  const data = (await response.json()) as Partial<ViewerCountResponse>;
  return typeof data.count === 'number' && Number.isFinite(data.count) ? data.count : 0;
}

async function requestViewerCount(path: string, init?: RequestInit) {
  const urls = [normalizeApiUrl(VIEWER_API_URL)];
  const defaultUrl = normalizeApiUrl(DEFAULT_VIEWER_API_URL);
  if (import.meta.env.DEV && urls[0] !== defaultUrl) {
    urls.push(defaultUrl);
  }

  let lastError: unknown;
  for (const url of urls) {
    try {
      const response = await fetch(`${url}${path}`, init);
      return await readCountResponse(response);
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError instanceof Error ? lastError : new Error('Viewer count request failed');
}

export function getAllTimeViewerCount() {
  return requestViewerCount('/viewer-count');
}

export function registerHomeViewer() {
  return requestViewerCount('/viewer-count/register', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ visitorId: getViewerId() }),
  });
}
