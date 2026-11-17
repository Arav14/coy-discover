// Client-side API helpers.
async function request(path, opts) {
  const res = await fetch(path, { cache: "no-store", ...opts });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.message || `Request failed (${res.status})`);
    err.status = res.status;
    err.code = data.error;
    throw err;
  }
  return data;
}

export const api = {
  feed: () => request("/feed"),
  matches: () => request("/matches"),
  swipe: (profileId, action) =>
    request("/swipe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ profileId, action }),
    }),
  reset: () => request("/reset", { method: "POST" }),
};
