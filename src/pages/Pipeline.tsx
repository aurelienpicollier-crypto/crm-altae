import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, X, TrendingUp, DollarSign, Target, Download } from 'lucide-react';
import { useCRM } from '../context';
import type { OpportunityInsert, UIStage } from '../types';
import { AVANCEMENT_LABELS, fieldsToStage } from '../types';
import UpcomingWidget from '../components/UpcomingWidget';
import OpportuniteForm from '../components/OpportuniteForm';
import { exportOpportunites } from '../export';

const TYPE_MISSIONS = [
  'Conseil stratégique', 'Transformation digitale', 'Management de transition',
  'Audit & Diagnostic', 'Formation', 'Autre',
];

function stageBadgeClass(stage: UIStage): string {
  if (stage === 'perdue') return 'badge-red';
  if (stage === '100')    return 'badge-green';
  if (stage === '75')     return 'badge-gold';
  if (stage === '50')     return 'badge-blue';
  if (stage === '30')     return 'badge-navy';
  if (stage === '15')     return 'badge-orange';
  return 'badge-gray';
}

function formatEur(n: number) {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n);
}

export default function Pipeline() {
  const { data, addOpportunity } = useCRM();
  const navigate = useNavigate();
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving]     = useState(false);
  const [saveErr, setSaveErr]   = useState<string | null>(null);
  const [filterStage,   setFilterStage]   = useState('');
  const [filterType,    setFilterType]    = useState('');
  const [filterDateMin, setFilterDateMin] = useState('');
  const [filterDateMax, setFilterDateMax] = useState('');

  const filtered = useMemo(() => {
    return data.opportunities.filter(o => {
      if (filterStage) {
        const uiStage = fieldsToStage(o.advancement, o.status);
        if (uiStage !== filterStage) return false;
      }
      if (filterType    && o.mission_type  !== filterType)    return false;
      if (filterDateMin && o.closing_date  <  filterDateMin)  return false;
      if (filterDateMax && o.closing_date  >  filterDateMax)  return false;
      return true;
    });
  }, [data.opportunities, filterStage, filterType, filterDateMin, filterDateMax]);

  const totalPipeline = filtered.reduce((s, o) => s + (o.estimated_amount || 0), 0);
  const totalPondere  = filtered.reduce((s, o) => s + (o.weighted_amount  || 0), 0);
  const activeCount   = filtered.filter(o => o.status === 'active').length;

  async function handleSave(row: OpportunityInsert) {
    setSaving(true); setSaveErr(null);
    try {
      await addOpportunity(row);
      setShowForm(false);
    } catch (e: any) {
      setSaveErr(e?.message ?? 'Erreur lors de la création');
    } finally {
      setSaving(false);
    }
  }

  function clearFilters() {
    setFilterStage(''); setFilterType(''); setFilterDateMin(''); setFilterDateMax('');
  }

  const hasFilters = filterStage || filterType || filterDateMin || filterDateMax;

  return (
    <>
      <div className="page-header">
        <h2 className="page-title">Pipeline Commercial</h2>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-outline" onClick={() => exportOpportunites(filtered)}>
            <Download size={15} /> Exporter Excel
          </button>
          <button className="btn btn-gold" onClick={() => setShowForm(true)}>
            <Plus size={16} /> Nouvelle opportunité
          </button>
        </div>
      </div>

      <div className="page-body">
        <div className="stats-row">
          <div className="stat-card">
            <div className="stat-label"><TrendingUp size={12} style={{ display: 'inline', marginRight: 4 }} />Pipeline total</div>
            <div className="stat-value">{formatEur(totalPipeline)}</div>
            <div className="stat-sub">{filtered.length} opportunité(s)</div>
          </div>
          <div className="stat-card">
            <div className="stat-label"><DollarSign size={12} style={{ display: 'inline', marginRight: 4 }} />Montant pondéré</div>
            <div className="stat-value">{formatEur(totalPondere)}</div>
            <div className="stat-sub">calculé par la base de données</div>
          </div>
          <div className="stat-card">
            <div className="stat-label"><Target size={12} style={{ display: 'inline', marginRight: 4 }} />En cours</div>
            <div className="stat-value">{activeCount}</div>
            <div className="stat-sub">opportunités actives</div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 20, alignItems: 'start' }}>
          <div>
            <div className="filters-row">
              <div className="filter-group">
                <span className="filter-label">Avancement</span>
                <select className="form-select" value={filterStage} onChange={e => setFilterStage(e.target.value)}>
                  <option value="">Tous</option>
                  {(Object.keys(AVANCEMENT_LABELS) as UIStage[]).map(k => (
                    <option key={k} value={k}>{AVANCEMENT_LABELS[k]}</option>
                  ))}
                </select>
              </div>
              <div className="filter-group">
                <span className="filter-label">Type de mission</span>
                <select className="form-select" value={filterType} onChange={e => setFilterType(e.target.value)}>
                  <option value="">Tous</option>
                  {TYPE_MISSIONS.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div className="filter-group">
                <span className="filter-label">Clôture min</span>
                <input type="date" className="form-input" value={filterDateMin} onChange={e => setFilterDateMin(e.target.value)} />
              </div>
              <div className="filter-group">
                <span className="filter-label">Clôture max</span>
                <input type="date" className="form-input" value={filterDateMax} onChange={e => setFilterDateMax(e.target.value)} />
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
                    <th>Numéro</th>
                    <th>Entreprise</th>
                    <th>Contact</th>
                    <th>Type mission</th>
                    <th>Montant estimé</th>
                    <th>Avancement</th>
                    <th>Montant pondéré</th>
                    <th>Clôture estimée</th>
                    <th>Statut</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr><td colSpan={9}>
                      <div className="empty-state">
                        <p>Aucune opportunité trouvée.<br />Cliquez sur « Nouvelle opportunité » pour commencer.</p>
                      </div>
                    </td></tr>
                  ) : filtered.map(o => {
                    const stage = fieldsToStage(o.advancement, o.status);
                    return (
                      <tr key={o.id} className="row-link" onClick={() => navigate(`/opportunites/${o.id}`)}>
                        <td style={{ fontFamily: 'monospace', fontSize: 12, color: 'var(--text-muted)' }}>
                          {o.numero}
                        </td>
                        <td style={{ fontWeight: 600 }}>{o.company}</td>
                        <td>{o.main_contact || '—'}</td>
                        <td><span className="badge badge-navy">{o.mission_type}</span></td>
                        <td>{formatEur(o.estimated_amount || 0)}</td>
                        <td>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 140 }}>
                            <span className={`badge ${stageBadgeClass(stage)}`}>{AVANCEMENT_LABELS[stage]}</span>
                            {o.status !== 'lost' && (
                              <div className="progress-bar-wrap">
                                <div className="progress-bar-fill" style={{ width: `${o.advancement}%` }} />
                              </div>
                            )}
                          </div>
                        </td>
                        <td style={{ fontWeight: 600, color: 'var(--navy)' }}>{formatEur(o.weighted_amount || 0)}</td>
                        <td>{o.closing_date ? new Date(o.closing_date).toLocaleDateString('fr-FR') : '—'}</td>
                        <td>
                          <span className={`badge ${o.status === 'won' ? 'badge-green' : o.status === 'lost' ? 'badge-red' : 'badge-blue'}`}>
                            {o.status === 'won' ? 'Gagné' : o.status === 'lost' ? 'Perdu' : 'Actif'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <UpcomingWidget />
        </div>
      </div>

      {showForm && (
        <OpportuniteForm
          saving={saving}
          error={saveErr}
          onSave={handleSave}
          onClose={() => { setShowForm(false); setSaveErr(null); }}
        />
      )}
    </>
  );
}
