import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, X, Building2, User, Download } from 'lucide-react';
import { useCRM } from '../context';
import type { ContactInsert } from '../types';
import ContactForm from '../components/ContactForm';
import { exportContacts } from '../export';

const SECTEURS = [
  'Cabinet d\'expertise comptable', 'Conseil', 'Énergie', 'Finance',
  'Greentech / Cleantech', 'Hospitality', 'Industrie', 'Public',
  'Restauration', 'Retail', 'Santé', 'Technologie', 'Autre',
];
const RELATION_STATUTS = [
  { value: 'prospect',      label: 'Prospect' },
  { value: 'client',        label: 'Client actif' },
  { value: 'ancien_client', label: 'Ancien client' },
  { value: 'partenaire',    label: 'Partenaire / Réseau' },
];

function relationBadge(status: string | undefined) {
  switch (status) {
    case 'client':        return <span className="badge badge-green">Client actif</span>;
    case 'ancien_client': return <span className="badge badge-orange">Ancien client</span>;
    case 'partenaire':    return <span className="badge badge-blue">Partenaire / Réseau</span>;
    default:              return <span className="badge badge-gray">Prospect</span>;
  }
}

export default function Contacts() {
  const { data, addContact } = useCRM();
  const navigate = useNavigate();
  const [showForm,  setShowForm]  = useState(false);
  const [saving,    setSaving]    = useState(false);
  const [saveErr,   setSaveErr]   = useState<string | null>(null);
  const [filterEntreprise, setFilterEntreprise] = useState('');
  const [filterSecteur,    setFilterSecteur]    = useState('');
  const [filterStatut,     setFilterStatut]     = useState('');
  const [filterDateMin,    setFilterDateMin]    = useState('');

  const entreprises = useMemo(() => {
    return data.contacts.filter(c => c.type === 'company').map(c => c.company_name ?? '').filter(Boolean);
  }, [data.contacts]);

  const filtered = useMemo(() => {
    return data.contacts.filter(c => {
      if (filterEntreprise) {
        if (c.type === 'company' && c.company_name !== filterEntreprise) return false;
        if (c.type === 'person') {
          const emp = data.contacts.find(e => e.id === c.parent_company_id);
          if (!emp || emp.company_name !== filterEntreprise) return false;
        }
      }
      if (filterSecteur) {
        if (c.type === 'company' && c.sector !== filterSecteur) return false;
        if (c.type === 'person') {
          const emp = data.contacts.find(e => e.id === c.parent_company_id);
          if (!emp || emp.sector !== filterSecteur) return false;
        }
      }
      if (filterStatut) {
        if (c.type === 'company' && c.relation_status !== filterStatut) return false;
        if (c.type === 'person') {
          const emp = data.contacts.find(e => e.id === c.parent_company_id);
          if (!emp || emp.relation_status !== filterStatut) return false;
        }
      }
      if (filterDateMin && c.last_contact_date && c.last_contact_date < filterDateMin) return false;
      return true;
    });
  }, [data.contacts, filterEntreprise, filterSecteur, filterStatut, filterDateMin]);

  async function handleSave(row: ContactInsert) {
    setSaving(true); setSaveErr(null);
    try {
      await addContact(row);
      setShowForm(false);
    } catch (e: any) {
      setSaveErr(e?.message ?? 'Erreur lors de la création');
    } finally {
      setSaving(false);
    }
  }

  function clearFilters() {
    setFilterEntreprise('');
    setFilterSecteur('');
    setFilterStatut('');
    setFilterDateMin('');
  }

  const hasFilters = filterEntreprise || filterSecteur || filterStatut || filterDateMin;

  return (
    <>
      <div className="page-header">
        <h2 className="page-title">Contacts</h2>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-outline" onClick={() => exportContacts(filtered)} title="Exporter la vue filtrée en Excel">
            <Download size={15} /> Exporter Excel
          </button>
          <button className="btn btn-gold" onClick={() => setShowForm(true)}>
            <Plus size={16} /> Nouveau contact
          </button>
        </div>
      </div>

      <div className="page-body">
        <div className="filters-row">
          <div className="filter-group">
            <span className="filter-label">Entreprise</span>
            <select className="form-select" value={filterEntreprise} onChange={e => setFilterEntreprise(e.target.value)}>
              <option value="">Toutes</option>
              {entreprises.map(e => <option key={e} value={e}>{e}</option>)}
            </select>
          </div>
          <div className="filter-group">
            <span className="filter-label">Secteur</span>
            <select className="form-select" value={filterSecteur} onChange={e => setFilterSecteur(e.target.value)}>
              <option value="">Tous</option>
              {SECTEURS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className="filter-group">
            <span className="filter-label">Statut</span>
            <select className="form-select" value={filterStatut} onChange={e => setFilterStatut(e.target.value)}>
              <option value="">Tous</option>
              {RELATION_STATUTS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </div>
          <div className="filter-group">
            <span className="filter-label">Dernier contact depuis</span>
            <input type="date" className="form-input" value={filterDateMin} onChange={e => setFilterDateMin(e.target.value)} />
          </div>
          {hasFilters && (
            <div className="filter-group" style={{ justifyContent: 'flex-end' }}>
              <span className="filter-label" style={{ opacity: 0 }}>-</span>
              <button className="btn btn-outline btn-sm" onClick={clearFilters}><X size={13} /> Effacer</button>
            </div>
          )}
        </div>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Type</th>
                <th>Prénom</th>
                <th>Nom / Raison sociale</th>
                <th>Secteur / Poste</th>
                <th>Statut</th>
                <th>Entreprise</th>
                <th>Téléphone</th>
                <th>Email</th>
                <th>Dernier contact</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={9}>
                    <div className="empty-state">
                      <p>Aucun contact trouvé.<br />Cliquez sur « Nouveau contact » pour commencer.</p>
                    </div>
                  </td>
                </tr>
              ) : filtered.map(c => {
                const entreprise = c.type === 'person' && c.parent_company_id
                  ? data.contacts.find(e => e.id === c.parent_company_id)
                  : null;
                return (
                  <tr key={c.id} className="row-link" onClick={() => navigate(`/contacts/${c.id}`)}>
                    <td>
                      {c.type === 'company'
                        ? <span className="badge badge-navy"><Building2 size={11} style={{ marginRight: 4 }} />Entreprise</span>
                        : <span className="badge badge-blue"><User size={11} style={{ marginRight: 4 }} />Personne</span>
                      }
                    </td>
                    <td>{c.type === 'person' ? (c.first_name || '—') : '—'}</td>
                    <td style={{ fontWeight: 600 }}>
                      {c.type === 'person' ? (c.last_name || '—') : (c.company_name || '—')}
                    </td>
                    <td>{c.type === 'person' ? (c.position || '—') : (c.sector || '—')}</td>
                    <td>{c.type === 'company' ? relationBadge(c.relation_status) : '—'}</td>
                    <td>{entreprise ? (entreprise.company_name || '—') : '—'}</td>
                    <td>{c.phone || '—'}</td>
                    <td>{c.email || '—'}</td>
                    <td>{c.last_contact_date ? new Date(c.last_contact_date).toLocaleDateString('fr-FR') : '—'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {showForm && (
        <ContactForm
          saving={saving}
          error={saveErr}
          onSave={handleSave}
          onClose={() => { setShowForm(false); setSaveErr(null); }}
        />
      )}
    </>
  );
}
