export type SavedBank = {
  contractAddress: string;
  label?: string;
  createdAt: string; // ISO
  lastUsedAt?: string; // ISO
};

export type SavedAccount = {
  bankContractAddress: string; // Which bank this account belongs to
  userId: string; // User ID within that bank
  label?: string;
  createdAt: string; // ISO
  lastUsedAt?: string; // ISO
};

const BANKS_KEY = 'bank-ui.banks';
const ACCOUNTS_KEY = 'bank-ui.accounts';

// Bank storage functions
function readAllBanks(): SavedBank[] {
  try {
    const raw = window.localStorage.getItem(BANKS_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw) as SavedBank[];
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

function writeAllBanks(list: SavedBank[]): void {
  window.localStorage.setItem(BANKS_KEY, JSON.stringify(list));
}

export function listBanks(): SavedBank[] {
  return readAllBanks().sort((a, b) => (b.lastUsedAt ?? b.createdAt).localeCompare(a.lastUsedAt ?? a.createdAt));
}

export function saveBank(entry: SavedBank): void {
  const all = readAllBanks();
  const without = all.filter((b) => b.contractAddress !== entry.contractAddress);
  writeAllBanks([entry, ...without]);
}

export function touchBank(contractAddress: string): void {
  const all = readAllBanks();
  const idx = all.findIndex((b) => b.contractAddress === contractAddress);
  if (idx >= 0) {
    all[idx] = { ...all[idx], lastUsedAt: new Date().toISOString() };
    writeAllBanks(all);
  }
}

// Account storage functions
function readAllAccounts(): SavedAccount[] {
  try {
    const raw = window.localStorage.getItem(ACCOUNTS_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw) as SavedAccount[];
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

function writeAllAccounts(list: SavedAccount[]): void {
  window.localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(list));
}

export function listAccounts(): SavedAccount[] {
  return readAllAccounts().sort((a, b) => (b.lastUsedAt ?? b.createdAt).localeCompare(a.lastUsedAt ?? a.createdAt));
}

export function listAccountsForBank(bankContractAddress: string): SavedAccount[] {
  return readAllAccounts()
    .filter((a) => a.bankContractAddress === bankContractAddress)
    .sort((a, b) => (b.lastUsedAt ?? b.createdAt).localeCompare(a.lastUsedAt ?? a.createdAt));
}

export function saveAccount(entry: SavedAccount): void {
  const all = readAllAccounts();
  const without = all.filter((a) => !(a.bankContractAddress === entry.bankContractAddress && a.userId === entry.userId));
  writeAllAccounts([entry, ...without]);
}

export function touchAccount(bankContractAddress: string, userId: string): void {
  const all = readAllAccounts();
  const idx = all.findIndex((a) => a.bankContractAddress === bankContractAddress && a.userId === userId);
  if (idx >= 0) {
    all[idx] = { ...all[idx], lastUsedAt: new Date().toISOString() };
    writeAllAccounts(all);
  }
}

// Legacy support for old address-based storage (for migration)
export function touchAccountLegacy(address: string): void {
  // For backwards compatibility - treat address as contract address
  touchBank(address);
}


