import { useNavigate } from 'react-router-dom';
import { Calendar } from 'lucide-react';
import { useCRM } from '../context';

const MOIS_COURTS = ['Jan','Fév','Mar','Avr','Mai','Jui','Jul','Aoû','Sep','Oct','Nov','Déc'];

export default function UpcomingWidget() {
  const { data } = useCRM();
  const navigate = useNavigate();
  const today = new Date().toISOString().slice(0, 10);

  const upcoming = data.appointments
    .filter(r => r.date >= today)
    .sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time))
    .slice(0, 5);

  return (
    <div className="card" style={{ alignSelf: 'start' }}>
      <div className="card-header">
        <span className="card-title">
          <Calendar size={14} style={{ display: 'inline', marginRight: 6 }} />Prochains rendez-vous
        </span>
        <button className="btn btn-outline btn-sm" onClick={() => navigate('/agenda')} style={{ fontSize: 11 }}>
          Voir l'agenda
        </button>
      </div>
      <div className="card-body">
        {upcoming.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>Aucun rendez-vous à venir.</p>
        ) : (
          <div className="upcoming-list">
            {upcoming.map(r => {
              const d = new Date(r.date);
              const contact = r.linked_contact_id
                ? data.contacts.find(c => c.id === r.linked_contact_id)
                : null;
              const contactName = contact
                ? (contact.type === 'person'
                    ? `${contact.first_name ?? ''} ${contact.last_name ?? ''}`.trim()
                    : contact.company_name ?? '')
                : null;
              const opp = r.linked_opportunity_id
                ? data.opportunities.find(o => o.id === r.linked_opportunity_id)
                : null;
              return (
                <div key={r.id} className="upcoming-item">
                  <div className="upcoming-date-badge">
                    <span>{d.getDate()}</span>
                    {MOIS_COURTS[d.getMonth()]}
                  </div>
                  <div className="upcoming-info">
                    <div className="upcoming-sujet">{r.title}</div>
                    <div className="upcoming-meta">
                      {r.time} · {r.duration} min
                      {contactName && ` · ${contactName}`}
                      {opp && ` · ${opp.company}`}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
