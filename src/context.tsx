import React, {
  createContext, useContext, useEffect, useRef, useState, useCallback,
} from 'react';
import { supabase } from './lib/supabase';
import { useAuth } from './lib/AuthContext';
import {
  dbFetchOpportunities, dbInsertOpportunity, dbUpdateOpportunity, dbDeleteOpportunity,
  dbFetchContacts,      dbInsertContact,      dbUpdateContact,      dbDeleteContact,
  dbFetchAppointments,  dbInsertAppointment,  dbUpdateAppointment,  dbDeleteAppointment,
} from './lib/db';
import type {
  AppData, Opportunity, Contact, Appointment,
  OpportunityInsert, ContactInsert, AppointmentInsert,
} from './types';

// ── Local-storage key (legacy — kept only for migration detection) ──
export const LS_KEY = 'crm_altae_data';

// ── Context shape ─────────────────────────────────────────────
interface CRMContextType {
  data:    AppData;
  loading: boolean;
  error:   string | null;
  toast:   string | null;
  clearToast: () => void;
  hasMigrationData: boolean;

  // Opportunities
  addOpportunity:    (row: OpportunityInsert) => Promise<Opportunity>;
  updateOpportunity: (id: string, updates: Partial<OpportunityInsert>) => Promise<Opportunity>;
  deleteOpportunity: (id: string) => Promise<void>;

  // Contacts
  addContact:    (row: ContactInsert) => Promise<Contact>;
  updateContact: (id: string, updates: Partial<ContactInsert>) => Promise<Contact>;
  deleteContact: (id: string) => Promise<void>;

  // Agenda
  addAppointment:    (row: AppointmentInsert) => Promise<Appointment>;
  updateAppointment: (id: string, updates: Partial<AppointmentInsert>) => Promise<Appointment>;
  deleteAppointment: (id: string) => Promise<void>;

  // Migration
  importFromLocalStorage: () => Promise<void>;
  dismissMigration: () => void;
}

const CRMContext = createContext<CRMContextType | null>(null);

const EMPTY: AppData = { opportunities: [], contacts: [], appointments: [] };

export function CRMProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [data,    setData]    = useState<AppData>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);
  const [toast,   setToast]   = useState<string | null>(null);
  const [hasMigrationData, setHasMigrationData] = useState(false);

  // Track IDs that the local user just mutated so we can suppress
  // the "updated by associate" toast for our own real-time echo.
  const localMutations = useRef<Set<string>>(new Set());
  function trackLocal(id: string) {
    localMutations.current.add(id);
    setTimeout(() => localMutations.current.delete(id), 3000);
  }

  function showToast(msg: string) {
    setToast(msg);
  }
  const clearToast = useCallback(() => setToast(null), []);

  // ── Initial load ───────────────────────────────────────────
  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    setLoading(true);
    setError(null);

    Promise.all([
      dbFetchOpportunities(),
      dbFetchContacts(),
      dbFetchAppointments(),
    ])
      .then(([opportunities, contacts, appointments]) => {
        if (!cancelled) setData({ opportunities, contacts, appointments });
      })
      .catch((err: Error) => {
        if (!cancelled) setError(`Erreur de chargement : ${err.message}`);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    // Check for legacy localStorage data to migrate
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        const hasData =
          (parsed.opportunites?.length  > 0) ||
          (parsed.contacts?.length      > 0) ||
          (parsed.rendezVous?.length    > 0);
        if (hasData) setHasMigrationData(true);
      }
    } catch { /* ignore */ }

    return () => { cancelled = true; };
  }, [user]);

  // ── Real-time subscriptions ────────────────────────────────
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('crm-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'opportunites' },
        (payload) => {
          const id = (payload.new as Opportunity | undefined)?.id
                  ?? (payload.old as Opportunity | undefined)?.id ?? '';
          const isOwn = localMutations.current.has(id);

          setData(prev => {
            const opps = applyChange(prev.opportunities, payload) as Opportunity[];
            return { ...prev, opportunities: opps };
          });
          if (!isOwn) showToast('Opportunités mises à jour par votre associé');
        },
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'contacts' },
        (payload) => {
          const id = (payload.new as Contact | undefined)?.id
                  ?? (payload.old as Contact | undefined)?.id ?? '';
          const isOwn = localMutations.current.has(id);

          setData(prev => {
            const contacts = applyChange(prev.contacts, payload) as Contact[];
            return { ...prev, contacts };
          });
          if (!isOwn) showToast('Contacts mis à jour par votre associé');
        },
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'rendez_vous' },
        (payload) => {
          const id = (payload.new as Appointment | undefined)?.id
                  ?? (payload.old as Appointment | undefined)?.id ?? '';
          const isOwn = localMutations.current.has(id);

          setData(prev => {
            const appointments = applyChange(prev.appointments, payload) as Appointment[];
            return { ...prev, appointments };
          });
          if (!isOwn) showToast('Agenda mis à jour par votre associé');
        },
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user]);

  // ── CRUD helpers ───────────────────────────────────────────

  const addOpportunity = useCallback(async (row: OpportunityInsert) => {
    const opp = await dbInsertOpportunity(row);
    trackLocal(opp.id);
    setData(prev => ({ ...prev, opportunities: [opp, ...prev.opportunities] }));
    return opp;
  }, []);

  const updateOpportunity = useCallback(async (id: string, updates: Partial<OpportunityInsert>) => {
    trackLocal(id);
    const opp = await dbUpdateOpportunity(id, updates);
    setData(prev => ({
      ...prev,
      opportunities: prev.opportunities.map(o => o.id === id ? opp : o),
    }));
    return opp;
  }, []);

  const deleteOpportunity = useCallback(async (id: string) => {
    trackLocal(id);
    await dbDeleteOpportunity(id);
    setData(prev => ({
      ...prev,
      opportunities: prev.opportunities.filter(o => o.id !== id),
    }));
  }, []);

  const addContact = useCallback(async (row: ContactInsert) => {
    const contact = await dbInsertContact(row);
    trackLocal(contact.id);
    setData(prev => ({ ...prev, contacts: [contact, ...prev.contacts] }));
    return contact;
  }, []);

  const updateContact = useCallback(async (id: string, updates: Partial<ContactInsert>) => {
    trackLocal(id);
    const contact = await dbUpdateContact(id, updates);
    setData(prev => ({
      ...prev,
      contacts: prev.contacts.map(c => c.id === id ? contact : c),
    }));
    return contact;
  }, []);

  const deleteContact = useCallback(async (id: string) => {
    trackLocal(id);
    await dbDeleteContact(id);
    setData(prev => ({
      ...prev,
      contacts: prev.contacts.filter(c => c.id !== id),
    }));
  }, []);

  const addAppointment = useCallback(async (row: AppointmentInsert) => {
    const apt = await dbInsertAppointment(row);
    trackLocal(apt.id);
    setData(prev => ({ ...prev, appointments: [...prev.appointments, apt] }));
    return apt;
  }, []);

  const updateAppointment = useCallback(async (id: string, updates: Partial<AppointmentInsert>) => {
    trackLocal(id);
    const apt = await dbUpdateAppointment(id, updates);
    setData(prev => ({
      ...prev,
      appointments: prev.appointments.map(a => a.id === id ? apt : a),
    }));
    return apt;
  }, []);

  const deleteAppointment = useCallback(async (id: string) => {
    trackLocal(id);
    await dbDeleteAppointment(id);
    setData(prev => ({
      ...prev,
      appointments: prev.appointments.filter(a => a.id !== id),
    }));
  }, []);

  // ── localStorage → Supabase migration ─────────────────────
  const importFromLocalStorage = useCallback(async () => {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return;
    const legacy = JSON.parse(raw);
    const authorEmail = user?.email ?? 'import';

    // 1. Import contacts first, build old-id → new-id map
    const contactIdMap = new Map<string, string>();
    for (const c of legacy.contacts ?? []) {
      try {
        const row: ContactInsert = c.type === 'entreprise'
          ? {
              type: 'company',
              company_name: c.raisonSociale ?? '',
              sector:       c.secteur,
              revenue:      c.chiffreAffaires,
              address:      c.adresse,
              comments:     (c.commentaires ?? []).map((x: any) => ({
                date: x.date, author: authorEmail, text: x.texte ?? '',
              })),
            }
          : {
              type:       'person',
              first_name: c.prenom,
              last_name:  c.nom ?? '',
              position:   c.poste,
              phone:      c.telephone,
              email:      c.email,
              last_contact_date: c.dernierContact,
              comments:   (c.commentaires ?? []).map((x: any) => ({
                date: x.date, author: authorEmail, text: x.texte ?? '',
              })),
            };
        const saved = await dbInsertContact(row);
        contactIdMap.set(c.id, saved.id);
        setData(prev => ({ ...prev, contacts: [saved, ...prev.contacts] }));
      } catch { /* skip individual errors */ }
    }

    // Patch parent_company_id now that we have UUID mapping
    for (const c of legacy.contacts ?? []) {
      if (c.entrepriseId && contactIdMap.has(c.id) && contactIdMap.has(c.entrepriseId)) {
        try {
          const newId = contactIdMap.get(c.id)!;
          const newParentId = contactIdMap.get(c.entrepriseId)!;
          await dbUpdateContact(newId, { parent_company_id: newParentId });
          setData(prev => ({
            ...prev,
            contacts: prev.contacts.map(x =>
              x.id === newId ? { ...x, parent_company_id: newParentId } : x,
            ),
          }));
        } catch { /* skip */ }
      }
    }

    // 2. Import opportunities, build old-id → new-id map
    const oppIdMap = new Map<string, string>();
    for (const o of legacy.opportunites ?? []) {
      try {
        const advancement = o.avancement === 'perdue' ? 0 : parseInt(o.avancement, 10) || 0;
        const status =
          o.avancement === 'perdue' ? 'lost' :
          o.avancement === '100'    ? 'won'  : 'active';
        const row: OpportunityInsert = {
          company:          o.entreprise ?? '',
          main_contact:     o.contact ?? '',
          other_contacts:   '',
          estimated_amount: o.montantEstime ?? 0,
          advancement,
          closing_date:     o.dateClotureEstimee ?? '',
          mission_type:     o.typeMission ?? '',
          status:           status as 'active' | 'won' | 'lost',
          description:      o.description ?? '',
          comments:         (o.commentaires ?? []).map((x: any) => ({
            date: x.date, author: authorEmail, text: x.texte ?? '',
          })),
        };
        const saved = await dbInsertOpportunity(row);
        oppIdMap.set(o.id, saved.id);
        setData(prev => ({ ...prev, opportunities: [saved, ...prev.opportunities] }));
      } catch { /* skip */ }
    }

    // 3. Import agenda
    for (const r of legacy.rendezVous ?? []) {
      try {
        const row: AppointmentInsert = {
          title:                  r.sujet ?? '',
          date:                   r.date ?? '',
          time:                   r.heure ?? '09:00',
          duration:               r.duree ?? 60,
          subject:                r.sujet ?? '',
          linked_contact_id:     r.contactId     ? (contactIdMap.get(r.contactId) ?? undefined) : undefined,
          linked_opportunity_id: r.opportuniteId ? (oppIdMap.get(r.opportuniteId) ?? undefined) : undefined,
          notes:                  r.notes ?? '',
        };
        const saved = await dbInsertAppointment(row);
        setData(prev => ({ ...prev, appointments: [...prev.appointments, saved] }));
      } catch { /* skip */ }
    }

    localStorage.removeItem(LS_KEY);
    setHasMigrationData(false);
  }, [user]);

  const dismissMigration = useCallback(() => {
    localStorage.removeItem(LS_KEY);
    setHasMigrationData(false);
  }, []);

  return (
    <CRMContext.Provider value={{
      data, loading, error, toast, clearToast, hasMigrationData,
      addOpportunity, updateOpportunity, deleteOpportunity,
      addContact,     updateContact,     deleteContact,
      addAppointment, updateAppointment, deleteAppointment,
      importFromLocalStorage, dismissMigration,
    }}>
      {children}
    </CRMContext.Provider>
  );
}

export function useCRM() {
  const ctx = useContext(CRMContext);
  if (!ctx) throw new Error('useCRM must be used within CRMProvider');
  return ctx;
}

// ── Real-time state patch helper ───────────────────────────────
function applyChange<T extends { id: string }>(
  list: T[],
  payload: { eventType: string; new: unknown; old: unknown },
): T[] {
  if (payload.eventType === 'INSERT') return [payload.new as T, ...list];
  if (payload.eventType === 'DELETE') return list.filter(x => x.id !== (payload.old as T).id);
  if (payload.eventType === 'UPDATE') return list.map(x => x.id === (payload.new as T).id ? payload.new as T : x);
  return list;
}
