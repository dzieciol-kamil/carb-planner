import type { StateStorage } from 'zustand/middleware';

export function createDebouncedLocalStorage(delay: number): StateStorage {
  let timer: ReturnType<typeof setTimeout> | null = null;
  let pendingKey: string | null = null;
  let pendingValue: string | null = null;

  const flush = () => {
    if (timer) clearTimeout(timer);
    timer = null;
    if (pendingKey !== null && pendingValue !== null) {
      localStorage.setItem(pendingKey, pendingValue);
    }
    pendingKey = null;
    pendingValue = null;
  };

  if (typeof window !== 'undefined') {
    window.addEventListener('pagehide', flush);
    window.addEventListener('beforeunload', flush);
  }

  return {
    getItem: (name) => localStorage.getItem(name),
    setItem: (name, value) => {
      pendingKey = name;
      pendingValue = value;
      if (timer) clearTimeout(timer);
      timer = setTimeout(flush, delay);
    },
    removeItem: (name) => {
      if (timer) clearTimeout(timer);
      timer = null;
      pendingKey = null;
      pendingValue = null;
      localStorage.removeItem(name);
    },
  };
}
