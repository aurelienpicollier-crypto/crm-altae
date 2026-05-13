import { useState } from 'react';
import { X } from 'lucide-react';
import type { Contact, ContactInsert, ContactType } from '../types';
import { useCRM } from '../context';

const SECTEURS = [
  'Cabinet d\'expertise comptable', 'Conseil', 'Énergie', 'Finance',
  'Greentech / Cleantech', 'Hospitality', 'Industrie', 'Public',
  'Restauration', 'Retail', 'Santé', 'Technologie', 'Autre',
];
const TITRES   = ['M.', 'Mme', 'Dr', 'Pr', ''];

interface Props {
  initial?: Contact;
  saving?:  boolean;
  error?:   string | null;
  onSave:   (row: ContactInsert) => void;
  onClose:  () => void;
}

export default function ContactForm({ initial, saving, error, onSave, onClose }: Props) {
  const { data } = useCRM();
  const [type, setType] = useState<ContactType>(initial?.type ?? 'person');

  // Person fields
  const [firstName,       setFirstName]       = useState(initial?.first_name       ?? '');
  const [lastName,        setLastName]         = useState(initial?.last_name        ?? '');
  const [titre,           setTitre]            = useState('');
  const [position,        setPosition]         = useState(initial?.position         ?? '');
  const [phone,           setPhone]            = useState(initial?.phone            ?? '');
  const [email,           setEmail]            = useState(initial?.email            ?? '');
  const [parentCompanyId, setParentCompanyId]  = useState(initial?.parent_company_id ?? '');
  const [lastContactDate, setLastContactDate]  = useState(initial?.last_contact_date ?? '');

  // Company fields
  const [companyName, setCompanyName] = useState(initial?.company_name ?? '');
  const [sector,      setSector]      = useState(initial?.sector       ?? '');
  const [revenue,     setRevenue]     = useState(String(initial?.revenue ?? ''));
  const [address,     setAddress]     = useState(initial?.address      ?? '');

  const companies = data.contacts.filter(c => c.type === 'company' && c.id !== initial?.id);

  function handleSubmit(e: React.SyntheticEvent) {
    e.preventDefault();
    const base = { comments: initial?.comments ?? [] };
    if (type === 'person') {
      if (!lastName.trim()) return;
      onSave({
        ...base, type,
        first_name:        firstName.trim(),
        last_name:         lastName.trim(),
        position:          position.trim(),
        phone:             phone.trim(),
        email:             email.trim(),
        last_contact_date: lastContactDate || undefined,
        parent_company_id: parentCompanyId || undefined,
      });
    } else {
      if (!companyName.trim()) return;
      onSave({
        ...base, type,
        company_name: companyName.trim(),
        sector,
        revenue:  parseFloat(revenue) || undefined,
        address:  address.trim(),
      });
    }
  }

  return (
    <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal">
        <div className="modal-header">
          <span className="modal-title">{initial ? 'Modifier le contact' : 'Nouveau contact'}</span>
          <button className="btn-icon" onClick={onClose}><X size={16} /></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {error && <div className="error-banner">{error}</div>}

            {!initial && (
              <div className="form-group">
                <label className="form-label">Type de fiche</label>
                <div style={{ display: 'flex', gap: 10 }}>
                  {(['person', 'company'] as ContactType[]).map(t => (
                    <label key={t} style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                      <input type="radio" value={t} checked={type === t} onChange={() => setType(t)} />
                      {t === 'person' ? 'Personne' : 'Entreprise'}
                    </label>
                  ))}
                </div>
              </div>
            )}

            {type === 'person' ? (
              <>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Titre</label>
                    <select className="form-select" value={titre} onChange={e => setTitre(e.target.value)}>
                      {TITRES.map(t => <option key={t} value={t}>{t || '—'}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Prénom</label>
                    <input className="form-input" value={firstName} onChange={e => setFirstName(e.target.value)} placeholder="Prénom" />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label required">Nom</label>
                    <input className="form-input" value={lastName} onChange={e => setLastName(e.target.value)} placeholder="Nom de famille" required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Poste</label>
                    <input className="form-input" value={position} onChange={e => setPosition(e.target.value)} placeholder="Directeur financier…" />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Téléphone</label>
                    <input className="form-input" type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+33 6 …" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Email</label>
                    <input className="form-input" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="prenom@entreprise.com" />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Entreprise</label>
                    <select className="form-select" value={parentCompanyId} onChange={e => setParentCompanyId(e.target.value)}>
                      <option value="">— Aucune —</option>
                      {companies.map(c => <option key={c.id} value={c.id}>{c.company_name}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Dernier contact</label>
                    <input className="form-input" type="date" value={lastContactDate} onChange={e => setLastContactDate(e.target.value)} />
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="form-group">
                  <label className="form-label required">Raison sociale</label>
                  <input className="form-input" value={companyName} onChange={e => setCompanyName(e.target.value)} placeholder="Nom de l'entreprise" required />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Secteur</label>
                    <select className="form-select" value={sector} onChange={e => setSector(e.target.value)}>
                      <option value="">— Sélectionner —</option>
                      {SECTEURS.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Chiffre d'affaires (€)</label>
                    <input className="form-input" type="number" min="0" value={revenue} onChange={e => setRevenue(e.target.value)} placeholder="0" />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Adresse</label>
                  <input className="form-input" value={address} onChange={e => setAddress(e.target.value)} placeholder="123 rue de la Paix, 75001 Paris" />
                </div>
              </>
            )}
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-outline" onClick={onClose} disabled={saving}>Annuler</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Enregistrement…' : initial ? 'Enregistrer' : 'Créer le contact'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
