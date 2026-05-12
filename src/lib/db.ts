import { supabase } from './supabase';
import type {
  Opportunity, OpportunityInsert,
  Contact,     ContactInsert,
  Appointment, AppointmentInsert,
} from '../types';

// ── Opportunities ─────────────────────────────────────────────

export async function dbFetchOpportunities(): Promise<Opportunity[]> {
  const { data, error } = await supabase
    .from('opportunites')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as Opportunity[];
}

export async function dbInsertOpportunity(row: OpportunityInsert): Promise<Opportunity> {
  const { data, error } = await supabase
    .from('opportunites')
    .insert(row)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data as Opportunity;
}

export async function dbUpdateOpportunity(
  id: string,
  updates: Partial<OpportunityInsert>,
): Promise<Opportunity> {
  const { data, error } = await supabase
    .from('opportunites')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data as Opportunity;
}

export async function dbDeleteOpportunity(id: string): Promise<void> {
  const { error } = await supabase.from('opportunites').delete().eq('id', id);
  if (error) throw new Error(error.message);
}

// ── Contacts ──────────────────────────────────────────────────

export async function dbFetchContacts(): Promise<Contact[]> {
  const { data, error } = await supabase
    .from('contacts')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as Contact[];
}

export async function dbInsertContact(row: ContactInsert): Promise<Contact> {
  const { data, error } = await supabase
    .from('contacts')
    .insert(row)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data as Contact;
}

export async function dbUpdateContact(
  id: string,
  updates: Partial<ContactInsert>,
): Promise<Contact> {
  const { data, error } = await supabase
    .from('contacts')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data as Contact;
}

export async function dbDeleteContact(id: string): Promise<void> {
  const { error } = await supabase.from('contacts').delete().eq('id', id);
  if (error) throw new Error(error.message);
}

// ── Agenda ────────────────────────────────────────────────────

export async function dbFetchAppointments(): Promise<Appointment[]> {
  const { data, error } = await supabase
    .from('rendez_vous')
    .select('*')
    .order('date', { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []) as Appointment[];
}

export async function dbInsertAppointment(row: AppointmentInsert): Promise<Appointment> {
  const { data, error } = await supabase
    .from('rendez_vous')
    .insert(row)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data as Appointment;
}

export async function dbUpdateAppointment(
  id: string,
  updates: Partial<AppointmentInsert>,
): Promise<Appointment> {
  const { data, error } = await supabase
    .from('rendez_vous')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data as Appointment;
}

export async function dbDeleteAppointment(id: string): Promise<void> {
  const { error } = await supabase.from('rendez_vous').delete().eq('id', id);
  if (error) throw new Error(error.message);
}
