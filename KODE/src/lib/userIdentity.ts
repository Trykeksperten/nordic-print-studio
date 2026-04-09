const USER_ID_STORAGE_KEY = "trykeksperten:user-id:v1";

const createRandomId = () => {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `user-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
};

export const getAuthenticatedUserId = () => {
  if (typeof window === "undefined") return "";
  const w = window as Window & { __TRYKE_USER_ID__?: string };
  if (typeof w.__TRYKE_USER_ID__ === "string" && w.__TRYKE_USER_ID__.trim()) {
    return w.__TRYKE_USER_ID__.trim();
  }
  try {
    const existing = localStorage.getItem(USER_ID_STORAGE_KEY);
    if (existing) return existing;
    const generated = createRandomId();
    localStorage.setItem(USER_ID_STORAGE_KEY, generated);
    return generated;
  } catch {
    return createRandomId();
  }
};
