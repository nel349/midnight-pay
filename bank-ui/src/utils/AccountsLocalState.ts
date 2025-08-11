export type SavedAccount = {
  address: string;
  label?: string;
  createdAt: string; // ISO
  lastUsedAt?: string; // ISO
};

const KEY = 'bank-ui.accounts';

function readAll(): SavedAccount[] {
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw) as SavedAccount[];
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

function writeAll(list: SavedAccount[]): void {
  window.localStorage.setItem(KEY, JSON.stringify(list));
}

export function listAccounts(): SavedAccount[] {
  return readAll().sort((a, b) => (b.lastUsedAt ?? b.createdAt).localeCompare(a.lastUsedAt ?? a.createdAt));
}

export function saveAccount(entry: SavedAccount): void {
  const all = readAll();
  const without = all.filter((a) => a.address !== entry.address);
  writeAll([entry, ...without]);
}

export function touchAccount(address: string): void {
  const all = readAll();
  const idx = all.findIndex((a) => a.address === address);
  if (idx >= 0) {
    all[idx] = { ...all[idx], lastUsedAt: new Date().toISOString() };
    writeAll(all);
  }
}


