import { useState } from 'react';
import { X } from 'lucide-react';
import type { Opportunity, OpportunityInsert, UIStage } from '../types';
import { AVANCEMENT_LABELS, stageToFields, fieldsToStage } from '../types';

const TYPE_MISSIONS = [
  'Conseil stratégique', 'Transformation digitale', 'Management de transition',
  'Audit & Diagnostic', 'Formation', 'Autre',
];

interface Props {
  initial?: Opportunity;
  saving?: boolean;
  error?: string | null;
  onSave:  (row: OpportunityInsert) => void;
  onClose: () => void;
}

export default function OpportuniteForm({ initial, saving, error, onSave, onClose }: Props) {
  const initStage: UIStage = initial
    ? fieldsToStage(initial.advancement, initial.status)
    : '0';

  const [company,         setCompany]        = useState(initial?.company          ?? '');
  const [mainContact,     setMainContact]     = useState(initial?.main_contact     ?? '');
  const [otherContacts,   setOtherContacts]   = useState(initial?.other_contacts   ?? '');
  const [typeMission,     setTypeMission]     = useState(initial?.mission_type     ?? TYPE_MISSIONS[0]);
  const [montant,         setMontant]         = useState(String(initial?.estimated_amount ?? ''));
  const [stage,           setStage]           = useState<UIStage>(initStage);
  const [closingDate,     setClosingDate]     = useState(initial?.closing_date     ?? '');
  const [description,     setDescription]     = useState(initial?.description      ?? '');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!company.trim()) return;
    const { advancement, status } = stageToFields(stage);
    onSave({
      company:          company.trim(),
      main_contact:     mainContact.trim(),
      other_contacts:   otherContacts.trim(),
      mission_type:     typeMission,
      estimated_amount: parseFloat(montant) || 0,
      advancement,
      status,
      closing_date:     closingDate || undefined,
      description:      description.trim(),
      comments:         initial?.comments ?? [],
    });
  }

  return (
    <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal">
        <div className="modal-header">
          <span className="modal-title">{initial ? "Modifier l'opportunité" : 'Nouvelle opportunité'}</span>
          <button className="btn-icon" onClick={onClose}><X size={16} /></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {error && <div className="error-banner">{error}</div>}
            <div className="form-row">
              <div className="form-group">
                <label className="form-label required">Entreprise</label>
                <input className="form-input" value={company} onChange={e => setCompany(e.target.value)} placeholder="Nom de l'entreprise" required />
              </div>
              <div className="form-group">
                <label className="form-label">Contact principal</label>
                <input className="form-input" value={mainContact} onChange={e => setMainContact(e.target.value)} placeholder="Nom du contact" />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Autres contacts</label>
              <input className="form-input" value={otherContacts} onChange={e => setOtherContacts(e.target.value)} placeholder="Noms séparés par des virgules" />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label required">Type de mission</label>
                <select className="form-select" value={typeMission} onChange={e => setTypeMission(e.target.value)} required>
                  {TYPE_MISSIONS.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Montant estimé (€)</label>
                <input className="form-input" type="number" min="0" step="1000" value={montant} onChange={e => setMontant(e.target.value)} placeholder="0" />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label required">Avancement</label>
                <select className="form-select" value={stage} onChange={e => setStage(e.target.value as UIStage)} required>
                  {(Object.keys(AVANCEMENT_LABELS) as UIStage[]).map(k => (
                    <option key={k} value={k}>{AVANCEMENT_LABELS[k]}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Date de clôture estimée</label>
                <input className="form-input" type="date" value={closingDate} onChange={e => setClosingDate(e.target.value)} />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Description</label>
              <textarea className="form-textarea" value={description} onChange={e => setDescription(e.target.value)} placeholder="Description de la mission, contexte…" />
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-outline" onClick={onClose} disabled={saving}>Annuler</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Enregistrement…' : initial ? 'Enregistrer' : "Créer l'opportunité"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
