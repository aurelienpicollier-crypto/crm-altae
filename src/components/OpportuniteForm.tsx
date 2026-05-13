import React, { useState, useRef, useEffect } from 'react';
import { X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { Opportunity, OpportunityInsert, UIStage } from '../types';
import { AVANCEMENT_LABELS, stageToFields, fieldsToStage } from '../types';
import { useCRM } from '../context';

const TYPE_MISSIONS = [
  'Audit & Diagnostic', 'Autre', 'Conseil stratégique', 'Expertise comptable',
  'Formation', 'Management de transition', 'Modélisation / Création outil',
  'Transformation digitale',
];

interface ComboboxOption { id: string; label: string; }

function Combobox({ options, value, onChange, placeholder, emptyMessage }: {
  options: ComboboxOption[];
  value: string;
  onChange: (id: string, label: string) => void;
  placeholder: string;
  emptyMessage?: React.ReactNode;
}) {
  const [open, setOpen]   = useState(false);
  const [query, setQuery] = useState('');
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false); setQuery('');
      }
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const selectedLabel = options.find(o => o.id === value)?.label ?? '';
  const filtered = query
    ? options.filter(o => o.label.toLowerCase().includes(query.toLowerCase()))
    : options;

  return (
    <div className="combobox" ref={ref}>
      <div className="combobox-input-wrap">
        <input
          className="form-input"
          style={{ width: '100%' }}
          value={open ? query : selectedLabel}
          placeholder={placeholder}
          onFocus={() => { setOpen(true); setQuery(''); }}
          onChange={e => setQuery(e.target.value)}
        />
        {value && !open && (
          <button type="button" className="combobox-clear" onClick={() => onChange('', '')}>
            <X size={13} />
          </button>
        )}
      </div>
      {open && (
        <div className="combobox-dropdown">
          {filtered.length === 0 ? (
            <div className="combobox-empty">{emptyMessage ?? 'Aucun résultat'}</div>
          ) : (
            filtered.map(o => (
              <div
                key={o.id}
                className={`combobox-option${o.id === value ? ' selected' : ''}`}
                onMouseDown={e => { e.preventDefault(); onChange(o.id, o.label); setOpen(false); setQuery(''); }}
              >
                {o.label}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

function MultiCombobox({ options, values, onChange, placeholder, emptyMessage }: {
  options: ComboboxOption[];
  values: string[];
  onChange: (ids: string[]) => void;
  placeholder: string;
  emptyMessage?: React.ReactNode;
}) {
  const [open, setOpen]   = useState(false);
  const [query, setQuery] = useState('');
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false); setQuery('');
      }
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const available = options.filter(o => !values.includes(o.id));
  const filtered  = query
    ? available.filter(o => o.label.toLowerCase().includes(query.toLowerCase()))
    : available;
  const selected  = values
    .map(id => options.find(o => o.id === id))
    .filter((o): o is ComboboxOption => !!o);

  const showDropdown = open && (filtered.length > 0 || (available.length === 0 && !!emptyMessage));

  return (
    <div className="combobox" ref={ref}>
      <div className="chip-list">
        {selected.map(o => (
          <span key={o.id} className="chip">
            {o.label}
            <button type="button" className="chip-remove" onClick={() => onChange(values.filter(v => v !== o.id))}>
              <X size={11} />
            </button>
          </span>
        ))}
        <input
          className="chip-input"
          value={query}
          placeholder={values.length === 0 ? placeholder : 'Ajouter…'}
          onFocus={() => setOpen(true)}
          onChange={e => { setQuery(e.target.value); setOpen(true); }}
        />
      </div>
      {showDropdown && (
        <div className="combobox-dropdown">
          {filtered.length === 0 && available.length === 0
            ? <div className="combobox-empty">{emptyMessage}</div>
            : filtered.map(o => (
                <div
                  key={o.id}
                  className="combobox-option"
                  onMouseDown={e => { e.preventDefault(); onChange([...values, o.id]); setQuery(''); }}
                >
                  {o.label}
                </div>
              ))
          }
        </div>
      )}
    </div>
  );
}

interface Props {
  initial?: Opportunity;
  saving?:  boolean;
  error?:   string | null;
  onSave:   (row: OpportunityInsert) => void;
  onClose:  () => void;
}

export default function OpportuniteForm({ initial, saving, error, onSave, onClose }: Props) {
  const navigate  = useNavigate();
  const { data }  = useCRM();

  const initStage: UIStage = initial
    ? fieldsToStage(initial.advancement, initial.status)
    : '0';

  const companies = data.contacts
    .filter(c => c.type === 'company')
    .map(c => ({ id: c.id, label: c.company_name ?? '' }))
    .filter(c => c.label);

  const [companyId,        setCompanyId]        = useState(initial?.company_id       ?? '');
  const [companyLabel,     setCompanyLabel]      = useState(initial?.company          ?? '');
  const [mainContactId,    setMainContactId]     = useState(initial?.main_contact_id  ?? '');
  const [mainContactLabel, setMainContactLabel]  = useState(initial?.main_contact     ?? '');
  const [otherIds,         setOtherIds]          = useState<string[]>(initial?.other_contact_ids ?? []);
  const [typeMission,      setTypeMission]       = useState(initial?.mission_type     ?? TYPE_MISSIONS[0]);
  const [montant,          setMontant]           = useState(String(initial?.estimated_amount ?? ''));
  const [stage,            setStage]             = useState<UIStage>(initStage);
  const [closingDate,      setClosingDate]       = useState(initial?.closing_date     ?? '');
  const [description,      setDescription]       = useState(initial?.description      ?? '');

  const people = data.contacts
    .filter(c => c.type === 'person' && (!companyId || c.parent_company_id === companyId))
    .map(c => ({
      id:    c.id,
      label: `${c.first_name ?? ''} ${c.last_name ?? ''}`.trim() || c.email || c.id,
    }));

  const allPeople = data.contacts
    .filter(c => c.type === 'person')
    .map(c => ({
      id:    c.id,
      label: `${c.first_name ?? ''} ${c.last_name ?? ''}`.trim() || c.email || c.id,
    }));

  function handleCompanyChange(id: string, label: string) {
    setCompanyId(id);
    setCompanyLabel(label);
    // Clear main contact if it no longer belongs to the newly selected company
    if (mainContactId && id) {
      const mc = data.contacts.find(c => c.id === mainContactId);
      if (mc && mc.parent_company_id !== id) {
        setMainContactId('');
        setMainContactLabel('');
      }
    }
  }

  function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!companyLabel.trim()) return;
    const { advancement, status } = stageToFields(stage);
    const otherLabels = otherIds
      .map(id => allPeople.find(p => p.id === id)?.label ?? '')
      .filter(Boolean);

    onSave({
      company:            companyLabel.trim(),
      company_id:         companyId     || undefined,
      main_contact:       mainContactLabel.trim(),
      main_contact_id:    mainContactId || undefined,
      other_contacts:     otherLabels.join(', '),
      other_contact_ids:  otherIds,
      mission_type:       typeMission,
      estimated_amount:   parseFloat(montant) || 0,
      advancement,
      status,
      closing_date:       closingDate || undefined,
      description:        description.trim(),
      comments:           initial?.comments ?? [],
    });
  }

  const noContactsLink = (msg: string) => (
    <span>
      {msg}{' '}
      <span className="info-banner-link" onClick={() => navigate('/contacts')}>
        créer un contact
      </span>
    </span>
  );

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
            {data.contacts.length === 0 && (
              <div className="info-banner">
                Aucun contact enregistré —{' '}
                <span className="info-banner-link" onClick={() => navigate('/contacts')}>
                  créez d'abord un contact
                </span>
              </div>
            )}
            <div className="form-row">
              <div className="form-group">
                <label className="form-label required">Entreprise</label>
                <Combobox
                  options={companies}
                  value={companyId}
                  onChange={handleCompanyChange}
                  placeholder="Rechercher une entreprise…"
                  emptyMessage={noContactsLink('Aucune entreprise —')}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Contact principal</label>
                <Combobox
                  options={people}
                  value={mainContactId}
                  onChange={(id, label) => { setMainContactId(id); setMainContactLabel(label); }}
                  placeholder="Rechercher un contact…"
                  emptyMessage={
                    companyId
                      ? 'Aucun contact rattaché à cette entreprise'
                      : noContactsLink('Aucun contact —')
                  }
                />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Autres contacts</label>
              <MultiCombobox
                options={allPeople}
                values={otherIds}
                onChange={setOtherIds}
                placeholder="Sélectionner des contacts…"
                emptyMessage={noContactsLink('Aucun contact —')}
              />
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
            <button type="submit" className="btn btn-primary" disabled={saving || !companyLabel.trim()}>
              {saving ? 'Enregistrement…' : initial ? 'Enregistrer' : "Créer l'opportunité"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
