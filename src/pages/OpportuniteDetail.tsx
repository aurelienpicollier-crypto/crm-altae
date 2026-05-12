import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Edit2, Trash2, Plus } from 'lucide-react';
import { useCRM } from '../context';
import { useAuth } from '../lib/AuthContext';
import type { OpportunityInsert } from '../types';
import { AVANCEMENT_LABELS, fieldsToStage } from '../types';
import OpportuniteForm from '../components/OpportuniteForm';

function formatEur(n: number) {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n);
}

export default function OpportuniteDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data, updateOpportunity, deleteOpportunity } = useCRM();

  const [editing,    setEditing]    = useState(false);
  const [saving,     setSaving]     = useState(false);
  const [saveErr,    setSaveErr]    = useState<string | null>(null);
  const [newComment, setNewComment] = useState('');
  const [addingCmt,  setAddingCmt]  = useState(false);

  const opp = data.opportunities.find(o => o.id === id);
  if (!opp) return (
    <div className="page-body">
      <button className="btn btn-outline" onClick={() => navigate('/')}><ArrowLeft size={15} /> Retour</button>
      <div className="empty-state"><p>Opportunité introuvable.</p></div>
    </div>
  );

  const stage   = fieldsToStage(opp!.advancement, opp!.status);
  const pct     = opp.advancement;

  async function handleUpdate(updates: OpportunityInsert) {
    setSaving(true); setSaveErr(null);
    try {
      await updateOpportunity(opp!.id, updates);
      setEditing(false);
    } catch (e: any) {
      setSaveErr(e?.message ?? 'Erreur lors de la mise à jour');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!confirm('Supprimer cette opportunité ?')) return;
    await deleteOpportunity(opp!.id);
    navigate('/');
  }

  async function addComment() {
    if (!newComment.trim()) return;
    setAddingCmt(true);
    try {
      const newComments = [
        ...opp!.comments,
        { date: new Date().toISOString(), author: user?.email ?? 'moi', text: newComment.trim() },
      ];
      await updateOpportunity(opp!.id, { comments: newComments });
      setNewComment('');
    } finally {
      setAddingCmt(false);
    }
  }

  return (
    <>
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button className="btn-icon" onClick={() => navigate('/')}><ArrowLeft size={16} /></button>
          <h2 className="page-title">{opp.company}</h2>
          <span className="badge badge-navy">{opp.mission_type}</span>
          <span style={{ fontFamily: 'monospace', fontSize: 12, color: 'var(--text-muted)' }}>{opp.numero}</span>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-outline" onClick={() => setEditing(true)}><Edit2 size={14} /> Modifier</button>
          <button className="btn btn-danger" onClick={handleDelete}><Trash2 size={14} /> Supprimer</button>
        </div>
      </div>

      <div className="page-body">
        <div className="detail-grid">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="card">
              <div className="card-header"><span className="card-title">Informations générales</span></div>
              <div className="card-body">
                <div className="form-row">
                  <div className="detail-field">
                    <div className="detail-field-label">Entreprise</div>
                    <div className="detail-field-value" style={{ fontWeight: 600 }}>{opp.company}</div>
                  </div>
                  <div className="detail-field">
                    <div className="detail-field-label">Contact principal</div>
                    <div className="detail-field-value">{opp.main_contact || '—'}</div>
                  </div>
                  <div className="detail-field">
                    <div className="detail-field-label">Autres contacts</div>
                    <div className="detail-field-value">{opp.other_contacts || '—'}</div>
                  </div>
                  <div className="detail-field">
                    <div className="detail-field-label">Montant estimé</div>
                    <div className="detail-field-value" style={{ fontWeight: 700, color: 'var(--navy)', fontSize: 18 }}>
                      {formatEur(opp.estimated_amount || 0)}
                    </div>
                  </div>
                  <div className="detail-field">
                    <div className="detail-field-label">Montant pondéré</div>
                    <div className="detail-field-value" style={{ fontWeight: 600, color: 'var(--accent)' }}>
                      {formatEur(opp.weighted_amount || 0)}
                    </div>
                  </div>
                  <div className="detail-field">
                    <div className="detail-field-label">Clôture estimée</div>
                    <div className="detail-field-value">
                      {opp.closing_date ? new Date(opp.closing_date).toLocaleDateString('fr-FR') : '—'}
                    </div>
                  </div>
                  <div className="detail-field">
                    <div className="detail-field-label">Statut</div>
                    <div className="detail-field-value">
                      <span className={`badge ${opp.status === 'won' ? 'badge-green' : opp.status === 'lost' ? 'badge-red' : 'badge-blue'}`}>
                        {opp.status === 'won' ? 'Gagné' : opp.status === 'lost' ? 'Perdu' : 'Actif'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="detail-field" style={{ marginTop: 8 }}>
                  <div className="detail-field-label">Avancement</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 6 }}>
                    <span className="badge badge-gold">{AVANCEMENT_LABELS[stage]}</span>
                    <div className="progress-bar-wrap" style={{ flex: 1 }}>
                      <div className="progress-bar-fill" style={{ width: `${pct}%` }} />
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--navy)' }}>{pct}%</span>
                  </div>
                </div>

                {opp.description && (
                  <div className="detail-field">
                    <div className="detail-field-label">Description</div>
                    <div className="detail-field-value" style={{ whiteSpace: 'pre-wrap' }}>{opp.description}</div>
                  </div>
                )}
              </div>
            </div>

            <div className="card">
              <div className="card-header"><span className="card-title">Notes & Commentaires</span></div>
              <div className="card-body">
                {opp.comments.length === 0 && (
                  <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 12 }}>Aucun commentaire pour l'instant.</p>
                )}
                <div className="comment-list">
                  {[...opp.comments].reverse().map((c, i) => (
                    <div key={i} className="comment-item">
                      <div className="comment-date">
                        {new Date(c.date).toLocaleString('fr-FR')} — {c.author}
                      </div>
                      <div className="comment-text">{c.text}</div>
                    </div>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <textarea
                    className="form-textarea"
                    style={{ flex: 1, minHeight: 60 }}
                    placeholder="Ajouter un commentaire… (Ctrl+Entrée)"
                    value={newComment}
                    onChange={e => setNewComment(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter' && e.ctrlKey) addComment(); }}
                  />
                  <button className="btn btn-primary" onClick={addComment} disabled={addingCmt} style={{ alignSelf: 'flex-end' }}>
                    <Plus size={15} /> {addingCmt ? '…' : 'Ajouter'}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="card" style={{ alignSelf: 'start' }}>
            <div className="card-header"><span className="card-title">Rendez-vous liés</span></div>
            <div className="card-body">
              {data.appointments.filter(r => r.linked_opportunity_id === id).length === 0 ? (
                <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>Aucun rendez-vous lié.</p>
              ) : (
                <div className="upcoming-list">
                  {data.appointments
                    .filter(r => r.linked_opportunity_id === id)
                    .sort((a, b) => a.date.localeCompare(b.date))
                    .map(r => (
                      <div key={r.id} className="upcoming-item">
                        <div className="upcoming-info">
                          <div className="upcoming-sujet">{r.title}</div>
                          <div className="upcoming-meta">
                            {new Date(r.date).toLocaleDateString('fr-FR')} à {r.time}
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {editing && (
        <OpportuniteForm
          initial={opp}
          saving={saving}
          error={saveErr}
          onSave={handleUpdate}
          onClose={() => { setEditing(false); setSaveErr(null); }}
        />
      )}
    </>
  );
}
