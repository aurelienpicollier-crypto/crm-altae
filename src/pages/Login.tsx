import React, { useState } from 'react';
import { useAuth } from '../lib/AuthContext';
import { Lock, Mail, AlertCircle, ArrowLeft, CheckCircle } from 'lucide-react';

export default function Login() {
  const { signIn, sendPasswordReset } = useAuth();

  // Login state
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [error,    setError]    = useState<string | null>(null);
  const [loading,  setLoading]  = useState(false);

  // Reset state
  const [showReset,   setShowReset]   = useState(false);
  const [resetEmail,  setResetEmail]  = useState('');
  const [resetSent,   setResetSent]   = useState(false);
  const [resetError,  setResetError]  = useState<string | null>(null);
  const [resetLoading, setResetLoading] = useState(false);

  async function handleSubmit(e: React.SyntheticEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const err = await signIn(email.trim(), password);
    if (err) setError('Identifiants incorrects. Veuillez réessayer.');
    setLoading(false);
  }

  async function handleReset(e: React.SyntheticEvent) {
    e.preventDefault();
    setResetError(null);
    setResetLoading(true);
    const err = await sendPasswordReset(resetEmail.trim());
    if (err) {
      setResetError('Impossible d\'envoyer l\'email. Vérifiez l\'adresse et réessayez.');
    } else {
      setResetSent(true);
    }
    setResetLoading(false);
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-header">
          <div className="login-logo">ALTAE</div>
          <div className="login-logo-bar" />
          <p className="login-subtitle">CRM Consulting — Accès sécurisé</p>
        </div>

        {/* ── PASSWORD RESET PANEL ── */}
        {showReset ? (
          <div className="login-form">
            {resetSent ? (
              <div style={{ textAlign: 'center', padding: '8px 0 16px' }}>
                <CheckCircle size={36} style={{ color: '#2ecc71', margin: '0 auto 12px', display: 'block' }} />
                <p style={{ fontWeight: 600, marginBottom: 6 }}>Email envoyé !</p>
                <p style={{ color: 'var(--text-muted)', fontSize: 13, lineHeight: 1.5 }}>
                  Vérifiez votre boîte mail et cliquez sur le lien pour réinitialiser votre mot de passe.
                </p>
                <button
                  className="btn btn-outline"
                  style={{ marginTop: 20, width: '100%', justifyContent: 'center' }}
                  onClick={() => { setShowReset(false); setResetSent(false); setResetEmail(''); }}
                >
                  Retour à la connexion
                </button>
              </div>
            ) : (
              <>
                <button
                  type="button"
                  className="btn-icon"
                  style={{ marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                  onClick={() => { setShowReset(false); setResetError(null); }}
                >
                  <ArrowLeft size={14} /> Retour
                </button>
                <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16, lineHeight: 1.5 }}>
                  Saisissez votre adresse email pour recevoir un lien de réinitialisation.
                </p>
                {resetError && (
                  <div className="login-error">
                    <AlertCircle size={15} /><span>{resetError}</span>
                  </div>
                )}
                <form onSubmit={handleReset}>
                  <div className="form-group">
                    <label className="form-label required">Adresse email</label>
                    <div className="login-input-wrap">
                      <Mail size={15} className="login-input-icon" />
                      <input
                        className="form-input login-input"
                        type="email"
                        autoComplete="email"
                        placeholder="votre@email.com"
                        value={resetEmail}
                        onChange={e => setResetEmail(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                  <button
                    type="submit"
                    className="btn btn-gold"
                    style={{ width: '100%', justifyContent: 'center', marginTop: 8 }}
                    disabled={resetLoading}
                  >
                    {resetLoading ? 'Envoi…' : 'Envoyer le lien de réinitialisation'}
                  </button>
                </form>
              </>
            )}
          </div>
        ) : (

        /* ── LOGIN PANEL ── */
          <form onSubmit={handleSubmit} className="login-form">
            {error && (
              <div className="login-error">
                <AlertCircle size={15} /><span>{error}</span>
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

            <button
              type="button"
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 12, marginTop: 14, width: '100%', textAlign: 'center', textDecoration: 'underline' }}
              onClick={() => { setShowReset(true); setResetEmail(email); }}
            >
              Mot de passe oublié ?
            </button>
          </form>
        )}

        <p className="login-footer">
          Accès réservé aux utilisateurs autorisés.<br />
          Contactez votre administrateur pour obtenir un accès.
        </p>
      </div>
    </div>
  );
}
