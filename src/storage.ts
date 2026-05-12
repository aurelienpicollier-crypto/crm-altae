import type { AppData, Opportunite, Contact, RendezVous } from './types';

const KEY = 'crm_altae_data';

const defaultData: AppData = {
  opportunites: [],
  contacts: [],
  rendezVous: [],
};

export function loadData(): AppData {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return defaultData;
    return JSON.parse(raw) as AppData;
  } catch {
    return defaultData;
  }
}

export function saveData(data: AppData): void {
  localStorage.setItem(KEY, JSON.stringify(data));
}

export function getData(): AppData {
  return loadData();
}

export function saveOpportunites(items: Opportunite[]): void {
  const data = loadData();
  data.opportunites = items;
  saveData(data);
}

export function saveContacts(items: Contact[]): void {
  const data = loadData();
  data.contacts = items;
  saveData(data);
}

export function saveRendezVous(items: RendezVous[]): void {
  const data = loadData();
  data.rendezVous = items;
  saveData(data);
}

export function genId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}
