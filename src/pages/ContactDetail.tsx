import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Edit2, Trash2, Plus, Building2, User } from 'lucide-react';
import { useCRM } from '../context';
import { useAuth } from '../lib/AuthContext';
import type { ContactInsert } from '../types';
import ContactForm from '../components/ContactForm';

function formatEur(n: number) {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n);
}

export default function ContactDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data, updateContact, deleteContact } = useCRM();

  const [editing,    setEditing]    = useState(false);
  const [saving,     setSaving]     = useState(false);
  const [saveErr,    setSaveErr]    = useState<string | null>(null);
  const [newComment, setNewComment] = useState('');
  const [addingCmt,  setAddingCmt]  = useState(false);

  const contact = data.contacts.find(c => c.id === id);
  if (!contact) return (
    <div className="page-body">
      <button className="btn btn-outline" onClick={() => navigate('/contacts')}><ArrowLeft size={15} /> Retour</button>
      <div className="empty-state"><p>Contact introuvable.</p></div>
    </div>
  );

  const isCompany = contact.type === 'company';
  const parentCompany = !isCompany && contact.parent_company_id
    ? data.contacts.find(c => c.id === contact.parent_company_id)
    : null;
  const employees = isCompany
    ? data.contacts.filter(c => c.type === 'person' && c.parent_company_id === id)
    : [];
  const linkedOpps = data.opportunities.filter(o =>
    isCompany ? o.company === (contact.company_name ?? '') : false
  );
  const linkedAppts = data.appointments.filter(r => r.linked_contact_id === id);

  const displayName = isCompany
    ? (contact.company_name ?? '—')
    : `${contact.first_name ?? ''} ${contact.last_name ?? ''}`.trim();

  async function handleUpdate(updates: ContactInsert) {
    setSaving(true); setSaveErr(null);
    try {
      await updateContact(contact!.id, updates);
      setEditing(false);
    } catch (e: any) {
      setSaveErr(e?.message ?? 'Erreur lors de la mise à jour');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!confirm('Supprimer ce contact ?')) return;
    await deleteContact(contact!.id);
    navigate('/contacts');
  }

  async function addComment() {
    if (!newComment.trim()) return;
    setAddingCmt(true);
    try {
      const newComments = [
        ...contact!.comments,
        { date: new Date().toISOString(), author: user?.email ?? 'moi', text: newComment.trim() },
      ];
      await updateContact(contact!.id, { comments: newComments });
      setNewComment('');
    } finally {
      setAddingCmt(false);
    }
  }

  return (
    <>
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button className="btn-icon" onClick={() => navigate('/contacts')}><ArrowLeft size={16} /></button>
          <h2 className="page-title">{displayName}</h2>
          <span className={`badge ${isCompany ? 'badge-navy' : 'badge-blue'}`}>
            {isCompany
              ? <><Building2 size={11} style={{ marginRight: 4 }} />Entreprise</>
              : <><User size={11} style={{ marginRight: 4 }} />Personne</>}
          </span>
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
              <div className="card-header">
                <span className="card-title">{isCompany ? 'Informations entreprise' : 'Informations personnelles'}</span>
              </div>
              <div className="card-body">
                <div className="form-row">
                  {isCompany ? (
                    <>
                      <div className="detail-field">
                        <div className="detail-field-label">Raison sociale</div>
                        <div className="detail-field-value" style={{ fontWeight: 600 }}>{contact.company_name}</div>
                      </div>
                      <div className="detail-field">
                        <div className="detail-field-label">Secteur</div>
                        <div className="detail-field-value">{contact.sector || '—'}</div>
                      </div>
                      <div className="detail-field">
                        <div className="detail-field-label">Chiffre d'affaires</div>
                        <div className="detail-field-value">{contact.revenue ? formatEur(contact.revenue) : '—'}</div>
                      </div>
                      <div className="detail-field">
                        <div className="detail-field-label">Adresse</div>
                        <div className="detail-field-value">{contact.address || '—'}</div>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="detail-field">
                        <div className="detail-field-label">Prénom</div>
                        <div className="detail-field-value">{contact.first_name || '—'}</div>
                      </div>
                      <div className="detail-field">
                        <div className="detail-field-label">Nom</div>
                        <div className="detail-field-value" style={{ fontWeight: 600 }}>{contact.last_name || '—'}</div>
                      </div>
                      <div className="detail-field">
                        <div className="detail-field-label">Poste</div>
                        <div className="detail-field-value">{contact.position || '—'}</div>
                      </div>
                      <div className="detail-field">
                        <div className="detail-field-label">Entreprise</div>
                        <div className="detail-field-value">
                          {parentCompany ? (
                            <span style={{ color: 'var(--blue)', cursor: 'pointer' }} onClick={() => navigate(`/contacts/${parentCompany.id}`)}>
                              {parentCompany.company_name}
                            </span>
                          ) : '—'}
                        </div>
                      </div>
                      <div className="detail-field">
                        <div className="detail-field-label">Téléphone</div>
                        <div className="detail-field-value">{contact.phone || '—'}</div>
                      </div>
                      <div className="detail-field">
                        <div className="detail-field-label">Email</div>
                        <div className="detail-field-value">{contact.email || '—'}</div>
                      </div>
                      <div className="detail-field">
                        <div className="detail-field-label">Dernier contact</div>
                        <div className="detail-field-value">
                          {contact.last_contact_date ? new Date(contact.last_contact_date).toLocaleDateString('fr-FR') : '—'}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            {isCompany && employees.length > 0 && (
              <div className="card">
                <div className="card-header"><span className="card-title">Contacts associés ({employees.length})</span></div>
                <div className="card-body" style={{ padding: 0 }}>
                  <table>
                    <thead>
                      <tr>
                        <th>Prénom</th>
                        <th>Nom</th>
                        <th>Poste</th>
                        <th>Téléphone</th>
                        <th>Email</th>
                      </tr>
                    </thead>
                    <tbody>
                      {employees.map(e => (
                        <tr key={e.id} className="row-link" onClick={() => navigate(`/contacts/${e.id}`)}>
                          <td>{e.first_name || '—'}</td>
                          <td style={{ fontWeight: 600 }}>{e.last_name || '—'}</td>
                          <td>{e.position || '—'}</td>
                          <td>{e.phone || '—'}</td>
                          <td>{e.email || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <div className="card">
              <div className="card-header"><span className="card-title">Notes & Commentaires</span></div>
              <div className="card-body">
                {contact.comments.length === 0 && (
                  <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 12 }}>Aucun commentaire pour l'instant.</p>
                )}
                <div className="comment-list">
                  {[...contact.comments].reverse().map((c, i) => (
                    <div key={i} className="comment-item">
                      <div className="comment-date">{new Date(c.date).toLocaleString('fr-FR')} — {c.author}</div>
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

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {linkedOpps.length > 0 && (
              <div className="card">
                <div className="card-header"><span className="card-title">Opportunités liées</span></div>
                <div className="card-body">
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {linkedOpps.map(o => (
                      <div key={o.id} style={{ padding: '8px 0', borderBottom: '1px solid var(--border)', cursor: 'pointer' }} onClick={() => navigate(`/opportunites/${o.id}`)}>
                        <div style={{ fontWeight: 600, fontSize: 13 }}>{o.company}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{o.mission_type}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            <div className="card" style={{ alignSelf: 'start' }}>
              <div className="card-header"><span className="card-title">Rendez-vous liés</span></div>
              <div className="card-body">
                {linkedAppts.length === 0 ? (
                  <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>Aucun rendez-vous lié.</p>
                ) : (
                  <div className="upcoming-list">
                    {linkedAppts.sort((a, b) => a.date.localeCompare(b.date)).map(r => (
                      <div key={r.id} className="upcoming-item">
                        <div className="upcoming-info">
                          <div className="upcoming-sujet">{r.title}</div>
                          <div className="upcoming-meta">{new Date(r.date).toLocaleDateString('fr-FR')} à {r.time}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {editing && (
        <ContactForm
          initial={contact}
          saving={saving}
          error={saveErr}
          onSave={handleUpdate}
          onClose={() => { setEditing(false); setSaveErr(null); }}
        />
      )}
    </>
  );
}
