import * as XLSX from 'xlsx';
import type { Opportunity, Contact } from './types';
import { AVANCEMENT_LABELS, fieldsToStage } from './types';

function formatDate(s?: string | null) {
  if (!s) return '';
  return new Date(s).toLocaleDateString('fr-FR');
}

export function exportOpportunites(opportunities: Opportunity[]) {
  const rows = opportunities.map(o => ({
    'N°':                o.numero ?? '',
    'Entreprise':        o.company,
    'Contact principal': o.main_contact ?? '',
    'Autres contacts':   o.other_contacts ?? '',
    'Type de mission':   o.mission_type ?? '',
    'Montant estimé (€)': o.estimated_amount ?? 0,
    'Avancement':        AVANCEMENT_LABELS[fieldsToStage(o.advancement, o.status)],
    '% Avancement':      o.advancement,
    'Montant pondéré (€)': o.weighted_amount ?? 0,
    'Clôture estimée':   formatDate(o.closing_date),
    'Statut':            o.status === 'won' ? 'Gagné' : o.status === 'lost' ? 'Perdu' : 'Actif',
    'Description':       o.description ?? '',
    'Créé le':           formatDate(o.created_at),
  }));

  const ws = XLSX.utils.json_to_sheet(rows);
  ws['!cols'] = [
    { wch: 14 }, { wch: 28 }, { wch: 22 }, { wch: 22 }, { wch: 24 },
    { wch: 18 }, { wch: 26 }, { wch: 14 }, { wch: 20 },
    { wch: 16 }, { wch: 10 }, { wch: 40 }, { wch: 14 },
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Pipeline');
  XLSX.writeFile(wb, `Pipeline_ALTAE_${new Date().toISOString().slice(0, 10)}.xlsx`);
}

export function exportContacts(contacts: Contact[]) {
  const rows = contacts.map(c => {
    if (c.type === 'company') {
      return {
        'Type':            'Entreprise',
        'Raison sociale':  c.company_name ?? '',
        'Prénom':          '',
        'Nom':             '',
        'Poste':           '',
        'Téléphone':       c.phone ?? '',
        'Email':           c.email ?? '',
        'Secteur':         c.sector ?? '',
        'CA (€)':          c.revenue ?? '',
        'Adresse':         c.address ?? '',
        'Dernier contact': '',
      };
    }
    return {
      'Type':            'Personne',
      'Raison sociale':  '',
      'Prénom':          c.first_name ?? '',
      'Nom':             c.last_name ?? '',
      'Poste':           c.position ?? '',
      'Téléphone':       c.phone ?? '',
      'Email':           c.email ?? '',
      'Secteur':         '',
      'CA (€)':          '',
      'Adresse':         '',
      'Dernier contact': formatDate(c.last_contact_date),
    };
  });

  const ws = XLSX.utils.json_to_sheet(rows);
  ws['!cols'] = [
    { wch: 12 }, { wch: 28 }, { wch: 16 }, { wch: 18 },
    { wch: 24 }, { wch: 16 }, { wch: 28 },
    { wch: 14 }, { wch: 16 }, { wch: 36 }, { wch: 16 },
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Contacts');
  XLSX.writeFile(wb, `Contacts_ALTAE_${new Date().toISOString().slice(0, 10)}.xlsx`);
}
