import { useState, FormEvent } from 'react';
import { useAuth } from '../lib/AuthContext';
import { Lock, Mail, AlertCircle } from 'lucide-react';

export default function Login() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const err = await signIn(email.trim(), password);
    if (err) {
      setError('Identifiants incorrects. Veuillez réessayer.');
    }
    setLoading(false);
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-header">
          <div className="login-logo">ALTAE</div>
          <div className="login-logo-bar" />
          <p className="login-subtitle">CRM Consulting — Accès sécurisé</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          {error && (
            <div className="login-error">
              <AlertCircle size={15} />
              <span>{error}</span>
            </div>
          )}

          <div className="form-group">
            <label className="form-label required">Adresse email</label>
            <div className="login-input-wrap">
              <Mail size={15} className="login-input-icon" />
              <input
                className="form-input login-input"
                type="email"
                autoComplete="email"
                placeholder="votre@email.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label required">Mot de passe</label>
            <div className="login-input-wrap">
              <Lock size={15} className="login-input-icon" />
              <input
                className="form-input login-input"
                type="password"
                autoComplete="current-password"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-gold"
            style={{ width: '100%', justifyContent: 'center', marginTop: 8 }}
            disabled={loading}
          >
            {loading ? 'Connexion…' : 'Se connecter'}
          </button>
        </form>

        <p className="login-footer">
          Accès réservé aux utilisateurs autorisés.<br />
          Contactez votre administrateur pour obtenir un accès.
        </p>
      </div>
    </div>
  );
}
