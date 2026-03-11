import axios from "axios";

const API = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  withCredentials: true,
  timeout: 8000,
});

let access = "";
export function setAccess(t) {
  access = t || "";
  // console.log('[ACCESS] set', { present: !!t, len: t?.length || 0, preview: previewJwt(t) });
}
export function getAccess() {
  return access;
}

API.interceptors.request.use((cfg) => {
  if (access) cfg.headers.Authorization = `Bearer ${access}`;
  return cfg;
});

let refreshPromise = null;
function ensureRefreshed() {
  if (!refreshPromise) {
    refreshPromise = API.post("/auth/refresh")
      .then((r) => {
        const t = r.data?.access_token;
        if (t) setAccess(t);
        //  console.log('[REFRESH] ok');
      })
      .catch(() => {
        setAccess("");
      })
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
}

API.interceptors.response.use(
  (r) => r,
  async (err) => {
    const status = err.response?.status;
    const msg = err.response?.data?.message;
    const url = err.config?.url || "";
    if (url.includes("/auth/refresh")) throw err;
    if (
      status === 401 &&
      (msg === "TokenExpired" || (!getAccess() && msg === "Unauthorized"))
    ) {
      await ensureRefreshed();
      if (getAccess()) return API.request(err.config);
    }
    throw err;
  },
);

export async function rehydrateAccess() {
  try {
    const { data } = await API.post("/auth/refresh");
    setAccess(data?.access_token || "");
    return !!data?.access_token;
  } catch {
    setAccess("");
    return false;
  }
}

export function previewJwt(t) {
  if (!t) return null;
  const [h, p] = t.split(".");
  return { header: b64json(h), payload: b64json(p) };
}
function b64json(part) {
  try {
    const b64 = part.replace(/-/g, "+").replace(/_/g, "/");
    const pad = "=".repeat((4 - (b64.length % 4)) % 4);
    return JSON.parse(atob(b64 + pad));
  } catch {
    return null;
  }
}

export default API;
