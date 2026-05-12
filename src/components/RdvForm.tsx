import { useState } from 'react';
import { X, Trash2 } from 'lucide-react';
import type { Appointment, AppointmentInsert } from '../types';
import { useCRM } from '../context';

interface Props {
  initial?:     Appointment;
  prefillDate?: string;
  saving?:      boolean;
  error?:       string | null;
  onSave:       (row: AppointmentInsert) => void;
  onDelete?:    () => void;
  onClose:      () => void;
}

export default function RdvForm({ initial, prefillDate, saving, error, onSave, onDelete, onClose }: Props) {
  const { data } = useCRM();

  const [title,       setTitle]       = useState(initial?.title       ?? '');
  const [date,        setDate]        = useState(initial?.date        ?? prefillDate ?? '');
  const [time,        setTime]        = useState(initial?.time        ?? '09:00');
  const [duration,    setDuration]    = useState(String(initial?.duration ?? 60));
  const [contactId,   setContactId]   = useState(initial?.linked_contact_id     ?? '');
  const [opportuniteId, setOpportuniteId] = useState(initial?.linked_opportunity_id ?? '');
  const [notes,       setNotes]       = useState(initial?.notes       ?? '');

  const persons    = data.contacts.filter(c => c.type === 'person');
  const companies  = data.contacts.filter(c => c.type === 'company');

  function handleSubmit(e: React.SyntheticEvent) {
    e.preventDefault();
    if (!date || !title.trim()) return;
    onSave({
      title:                 title.trim(),
      date,
      time,
      duration:              parseInt(duration) || 60,
      subject:               title.trim(),
      linked_contact_id:     contactId     || undefined,
      linked_opportunity_id: opportuniteId || undefined,
      notes:                 notes.trim(),
    });
  }

  return (
    <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal">
        <div className="modal-header">
          <span className="modal-title">{initial ? 'Modifier le rendez-vous' : 'Nouveau rendez-vous'}</span>
          <div style={{ display: 'flex', gap: 8 }}>
            {onDelete && (
              <button type="button" className="btn-icon" onClick={onDelete} title="Supprimer">
                <Trash2 size={15} style={{ color: 'var(--red)' }} />
              </button>
            )}
            <button className="btn-icon" onClick={onClose}><X size={16} /></button>
          </div>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {error && <div className="error-banner">{error}</div>}
            <div className="form-group">
              <label className="form-label required">Titre</label>
              <input className="form-input" value={title} onChange={e => setTitle(e.target.value)} placeholder="Objet du rendez-vous" required />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label required">Date</label>
                <input className="form-input" type="date" value={date} onChange={e => setDate(e.target.value)} required />
              </div>
              <div className="form-group">
                <label className="form-label required">Heure</label>
                <input className="form-input" type="time" value={time} onChange={e => setTime(e.target.value)} required />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Durée (minutes)</label>
              <select className="form-select" value={duration} onChange={e => setDuration(e.target.value)}>
                {[30, 45, 60, 90, 120, 180, 240].map(d => (
                  <option key={d} value={d}>{d} min{d >= 60 ? ` (${d / 60}h)` : ''}</option>
                ))}
              </select>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Contact lié</label>
                <select className="form-select" value={contactId} onChange={e => setContactId(e.target.value)}>
                  <option value="">— Aucun —</option>
                  {persons.length > 0 && (
                    <optgroup label="Personnes">
                      {persons.map(c => (
                        <option key={c.id} value={c.id}>{c.first_name} {c.last_name}</option>
                      ))}
                    </optgroup>
                  )}
                  {companies.length > 0 && (
                    <optgroup label="Entreprises">
                      {companies.map(c => (
                        <option key={c.id} value={c.id}>{c.company_name}</option>
                      ))}
                    </optgroup>
                  )}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Opportunité liée</label>
                <select className="form-select" value={opportuniteId} onChange={e => setOpportuniteId(e.target.value)}>
                  <option value="">— Aucune —</option>
                  {data.opportunities.map(o => (
                    <option key={o.id} value={o.id}>{o.company} – {o.mission_type}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Notes</label>
              <textarea className="form-textarea" value={notes} onChange={e => setNotes(e.target.value)} placeholder="Ordre du jour, préparation…" />
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-outline" onClick={onClose} disabled={saving}>Annuler</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Enregistrement…' : initial ? 'Enregistrer' : 'Créer le rendez-vous'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
