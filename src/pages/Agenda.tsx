import { useState, useMemo } from 'react';
import { Plus, ChevronLeft, ChevronRight } from 'lucide-react';
import { useCRM } from '../context';
import type { Appointment, AppointmentInsert } from '../types';
import RdvForm from '../components/RdvForm';

const HOURS   = Array.from({ length: 12 }, (_, i) => i + 8);
const JOURS_FR = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
const MOIS_FR  = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];

function getMonday(d: Date): Date {
  const date = new Date(d);
  const day  = date.getDay();
  date.setDate(date.getDate() + (day === 0 ? -6 : 1 - day));
  date.setHours(0, 0, 0, 0);
  return date;
}
function addDays(d: Date, n: number): Date { const r = new Date(d); r.setDate(r.getDate() + n); return r; }
function toYMD(d: Date): string { return d.toISOString().slice(0, 10); }

export default function Agenda() {
  const { data, addAppointment, updateAppointment, deleteAppointment } = useCRM();
  const [weekStart,   setWeekStart]   = useState(() => getMonday(new Date()));
  const [showForm,    setShowForm]    = useState(false);
  const [editRdv,     setEditRdv]     = useState<Appointment | null>(null);
  const [prefillDate, setPrefillDate] = useState('');
  const [saving,      setSaving]      = useState(false);
  const [saveErr,     setSaveErr]     = useState<string | null>(null);

  const weekDays = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)), [weekStart]);

  const rdvByDayHour = useMemo(() => {
    const map: Record<string, Record<number, Appointment[]>> = {};
    for (const rdv of data.appointments) {
      const h = parseInt(rdv.time.split(':')[0]);
      if (!map[rdv.date]) map[rdv.date] = {};
      if (!map[rdv.date][h]) map[rdv.date][h] = [];
      map[rdv.date][h].push(rdv);
    }
    return map;
  }, [data.appointments]);

  async function handleSave(row: AppointmentInsert) {
    setSaving(true); setSaveErr(null);
    try {
      if (editRdv) {
        await updateAppointment(editRdv.id, row);
      } else {
        await addAppointment(row);
      }
      setShowForm(false);
      setEditRdv(null);
      setPrefillDate('');
    } catch (e: any) {
      setSaveErr(e?.message ?? 'Erreur lors de l\'enregistrement');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Supprimer ce rendez-vous ?')) return;
    await deleteAppointment(id);
    setEditRdv(null);
    setShowForm(false);
  }

  const weekLabel = (() => {
    const end = addDays(weekStart, 6);
    if (weekStart.getMonth() === end.getMonth()) {
      return `${weekStart.getDate()} – ${end.getDate()} ${MOIS_FR[weekStart.getMonth()]} ${weekStart.getFullYear()}`;
    }
    return `${weekStart.getDate()} ${MOIS_FR[weekStart.getMonth()]} – ${end.getDate()} ${MOIS_FR[end.getMonth()]} ${weekStart.getFullYear()}`;
  })();

  return (
    <>
      <div className="page-header">
        <h2 className="page-title">Agenda</h2>
        <button className="btn btn-gold" onClick={() => { setPrefillDate(''); setEditRdv(null); setShowForm(true); }}>
          <Plus size={16} /> Nouveau rendez-vous
        </button>
      </div>

      <div className="page-body">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <button className="btn-icon" onClick={() => setWeekStart(d => addDays(d, -7))}><ChevronLeft size={16} /></button>
          <span style={{ fontWeight: 600, fontSize: 15, minWidth: 260, textAlign: 'center' }}>{weekLabel}</span>
          <button className="btn-icon" onClick={() => setWeekStart(d => addDays(d, 7))}><ChevronRight size={16} /></button>
          <button className="btn btn-outline btn-sm" onClick={() => setWeekStart(getMonday(new Date()))}>Aujourd'hui</button>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <div className="calendar-grid">
            <div className="cal-header cal-header-empty" />
            {weekDays.map((d, i) => {
              const isToday = toYMD(d) === toYMD(new Date());
              return (
                <div key={i} className="cal-header" style={isToday ? { background: 'var(--gold)', color: 'var(--navy)' } : {}}>
                  <div>{JOURS_FR[i]}</div>
                  <div style={{ fontSize: 16, fontWeight: 700 }}>{d.getDate()}</div>
                </div>
              );
            })}

            {HOURS.map(h => (
              <>
                <div key={`t${h}`} className="cal-time">{h}:00</div>
                {weekDays.map((d, di) => {
                  const ymd  = toYMD(d);
                  const rdvs = rdvByDayHour[ymd]?.[h] || [];
                  return (
                    <div
                      key={`c${h}-${di}`}
                      className="cal-cell"
                      onClick={() => { setPrefillDate(ymd); setEditRdv(null); setShowForm(true); }}
                    >
                      {rdvs.map(r => (
                        <div
                          key={r.id}
                          className="cal-event"
                          style={{ top: `${(parseInt(r.time.split(':')[1]) / 60) * 50}px`, height: `${Math.min((r.duration / 60) * 50, 48)}px` }}
                          onClick={e => { e.stopPropagation(); setEditRdv(r); setShowForm(true); }}
                          title={r.title}
                        >
                          {r.time} {r.title}
                        </div>
                      ))}
                    </div>
                  );
                })}
              </>
            ))}
          </div>
        </div>

        <div style={{ marginTop: 24 }}>
          <div className="card">
            <div className="card-header"><span className="card-title">Prochains rendez-vous</span></div>
            <div className="card-body">
              {(() => {
                const today    = toYMD(new Date());
                const upcoming = data.appointments
                  .filter(r => r.date >= today)
                  .sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time))
                  .slice(0, 10);
                if (!upcoming.length) return <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>Aucun rendez-vous à venir.</p>;
                return (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 12 }}>
                    {upcoming.map(r => {
                      const contact = r.linked_contact_id ? data.contacts.find(c => c.id === r.linked_contact_id) : null;
                      const opp     = r.linked_opportunity_id ? data.opportunities.find(o => o.id === r.linked_opportunity_id) : null;
                      const contactName = contact
                        ? (contact.type === 'person'
                            ? `${contact.first_name ?? ''} ${contact.last_name ?? ''}`.trim()
                            : contact.company_name ?? '')
                        : null;
                      return (
                        <div
                          key={r.id}
                          style={{ background: 'var(--bg)', borderRadius: 8, padding: '12px 14px', border: '1px solid var(--border)', cursor: 'pointer' }}
                          onClick={() => { setEditRdv(r); setShowForm(true); }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                            <span style={{ fontWeight: 600, fontSize: 13 }}>{r.title}</span>
                            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{r.duration} min</span>
                          </div>
                          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                            {new Date(r.date).toLocaleDateString('fr-FR')} à {r.time}
                          </div>
                          {contactName && <div style={{ fontSize: 12, marginTop: 4 }}><span className="badge badge-blue" style={{ fontSize: 11 }}>{contactName}</span></div>}
                          {opp && <div style={{ fontSize: 12, marginTop: 4 }}><span className="badge badge-navy" style={{ fontSize: 11 }}>{opp.company}</span></div>}
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      </div>

      {showForm && (
        <RdvForm
          initial={editRdv || undefined}
          prefillDate={prefillDate}
          saving={saving}
          error={saveErr}
          onSave={handleSave}
          onDelete={editRdv ? () => handleDelete(editRdv!.id) : undefined}
          onClose={() => { setShowForm(false); setEditRdv(null); setPrefillDate(''); setSaveErr(null); }}
        />
      )}
    </>
  );
}
