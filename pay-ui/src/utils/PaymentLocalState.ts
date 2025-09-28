export type SavedPaymentGateway = {
  contractAddress: string;
  label?: string;
  createdAt: string; // ISO
  lastUsedAt?: string; // ISO
};

export type SavedPaymentUser = {
  paymentContractAddress: string; // Which payment gateway this user belongs to
  entityId: string; // Entity ID (merchant or customer)
  entityType: 'merchant' | 'customer';
  label?: string;
  createdAt: string; // ISO
  lastUsedAt?: string; // ISO
};

const PAYMENT_GATEWAYS_KEY = 'payment-ui.gateways';
const PAYMENT_USERS_KEY = 'payment-ui.users';

// Payment Gateway storage functions
function readAllPaymentGateways(): SavedPaymentGateway[] {
  try {
    const raw = window.localStorage.getItem(PAYMENT_GATEWAYS_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw) as SavedPaymentGateway[];
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

function writeAllPaymentGateways(list: SavedPaymentGateway[]): void {
  window.localStorage.setItem(PAYMENT_GATEWAYS_KEY, JSON.stringify(list));
}

export function listPaymentGateways(): SavedPaymentGateway[] {
  return readAllPaymentGateways().sort((a, b) => (b.lastUsedAt ?? b.createdAt).localeCompare(a.lastUsedAt ?? a.createdAt));
}

export function savePaymentGateway(entry: SavedPaymentGateway): void {
  const all = readAllPaymentGateways();
  const without = all.filter((g) => g.contractAddress !== entry.contractAddress);
  writeAllPaymentGateways([entry, ...without]);
}

export function touchPaymentGateway(contractAddress: string): void {
  const all = readAllPaymentGateways();
  const idx = all.findIndex((g) => g.contractAddress === contractAddress);
  if (idx >= 0) {
    all[idx] = { ...all[idx], lastUsedAt: new Date().toISOString() };
    writeAllPaymentGateways(all);
  }
}

// Payment User storage functions
function readAllPaymentUsers(): SavedPaymentUser[] {
  try {
    const raw = window.localStorage.getItem(PAYMENT_USERS_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw) as SavedPaymentUser[];
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

function writeAllPaymentUsers(list: SavedPaymentUser[]): void {
  window.localStorage.setItem(PAYMENT_USERS_KEY, JSON.stringify(list));
}

export function listPaymentUsers(): SavedPaymentUser[] {
  return readAllPaymentUsers().sort((a, b) => (b.lastUsedAt ?? b.createdAt).localeCompare(a.lastUsedAt ?? a.createdAt));
}

export function listPaymentUsersForGateway(paymentContractAddress: string): SavedPaymentUser[] {
  return readAllPaymentUsers()
    .filter((u) => u.paymentContractAddress === paymentContractAddress)
    .sort((a, b) => (b.lastUsedAt ?? b.createdAt).localeCompare(a.lastUsedAt ?? a.createdAt));
}

export function savePaymentUser(entry: SavedPaymentUser): void {
  const all = readAllPaymentUsers();
  const without = all.filter((u) => !(u.paymentContractAddress === entry.paymentContractAddress && u.entityId === entry.entityId));
  writeAllPaymentUsers([entry, ...without]);
}

export function touchPaymentUser(paymentContractAddress: string, entityId: string): void {
  const all = readAllPaymentUsers();
  const idx = all.findIndex((u) => u.paymentContractAddress === paymentContractAddress && u.entityId === entityId);
  if (idx >= 0) {
    all[idx] = { ...all[idx], lastUsedAt: new Date().toISOString() };
    writeAllPaymentUsers(all);
  }
}

// Utility functions for current session
export function getCurrentPaymentGateway(): string | null {
  try {
    return window.sessionStorage.getItem('current-payment-gateway');
  } catch {
    return null;
  }
}

export function setCurrentPaymentGateway(contractAddress: string): void {
  try {
    window.sessionStorage.setItem('current-payment-gateway', contractAddress);
    touchPaymentGateway(contractAddress);
  } catch {
    // Ignore storage errors
  }
}

export function getCurrentEntityId(): string | null {
  try {
    return window.sessionStorage.getItem('current-entity-id');
  } catch {
    return null;
  }
}

export function setCurrentEntityId(entityId: string): void {
  try {
    window.sessionStorage.setItem('current-entity-id', entityId);
  } catch {
    // Ignore storage errors
  }
}

export function getCurrentEntityType(): 'merchant' | 'customer' | null {
  try {
    const type = window.sessionStorage.getItem('current-entity-type');
    return type === 'merchant' || type === 'customer' ? type : null;
  } catch {
    return null;
  }
}

export function setCurrentEntityType(entityType: 'merchant' | 'customer'): void {
  try {
    window.sessionStorage.setItem('current-entity-type', entityType);
  } catch {
    // Ignore storage errors
  }
}