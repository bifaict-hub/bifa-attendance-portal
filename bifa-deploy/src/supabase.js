const SUPABASE_URL = "https://gcgkikdmfybjrtlqzors.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdjZ2tpa2RtZnlianJ0bHF6b3JzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk2NTY4NjQsImV4cCI6MjA5NTIzMjg2NH0.TQI-jwDdk5kQ3SYglMLt8tDfFMgzIB-HdCVmqJgTXrM";

const headers = {
  apikey: SUPABASE_KEY,
  Authorization: `Bearer ${SUPABASE_KEY}`,
  "Content-Type": "application/json",
};

const sb = async (path, opts = {}) => {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    headers: { ...headers, Prefer: opts.prefer || "return=representation", ...opts.headers },
    ...opts,
  });
  if (!res.ok) {
    const e = await res.json().catch(() => ({}));
    throw new Error(e.message || e.hint || `HTTP ${res.status}`);
  }
  const t = await res.text();
  return t ? JSON.parse(t) : [];
};

export const db = {
  get: (table, query = "") => sb(`${table}?${query}`),
  post: (table, data) => sb(table, { method: "POST", body: JSON.stringify(data) }),
  patch: (table, query, data) => sb(`${table}?${query}`, { method: "PATCH", body: JSON.stringify(data) }),
  delete: (table, query) => sb(`${table}?${query}`, { method: "DELETE", prefer: "return=minimal" }),
  upsert: (table, data) => sb(table, {
    method: "POST",
    body: JSON.stringify(Array.isArray(data) ? data : [data]),
    headers: { Prefer: "resolution=merge-duplicates,return=representation" },
  }),
};
