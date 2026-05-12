import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, AlertCircle, CheckCircle } from 'lucide-react';
import { useAuth } from '../lib/AuthContext';
import Spinner from '../components/Spinner';

export default function SetPassword() {
  const { user, loading, needsPasswordSetup, updatePassword, clearPasswordSetup } = useAuth();
  const navigate = useNavigate();

  const [password, setPassword] = useState('');
  const [confirm,  setConfirm]  = useState('');
  const [error,    setError]    = useState<string | null>(null);
  const [saving,   setSaving]   = useState(false);
  const [done,     setDone]     = useState(false);

  useEffect(() => {
    // If there's no valid session and no setup pending, send back to login
    if (!loading && !user && !needsPasswordSetup) {
      navigate('/', { replace: true });
    }
  }, [loading, user, needsPasswordSetup, navigate]);

  async function handleSubmit(e: React.SyntheticEvent) {
    e.preventDefault();
    setError(null);
    if (password.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères.');
      return;
    }
    if (password !== confirm) {
      setError('Les mots de passe ne correspondent pas.');
      return;
    }
    setSaving(true);
    const err = await updatePassword(password);
    if (err) {
      setError('Une erreur est survenue : ' + err);
      setSaving(false);
    } else {
      setDone(true);
      clearPasswordSetup();
      setTimeout(() => navigate('/', { replace: true }), 2500);
    }
  }

  if (loading) return <Spinner fullPage />;

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-header">
          <div className="login-logo">ALTAE</div>
          <div className="login-logo-bar" />
          <p className="login-subtitle">CRM Consulting — Création du mot de passe</p>
        </div>

        {done ? (
          <div style={{ textAlign: 'center', padding: '24px 0' }}>
            <CheckCircle size={40} style={{ color: '#2ecc71', margin: '0 auto 12px', display: 'block' }} />
            <p style={{ fontWeight: 600, marginBottom: 6 }}>Mot de passe défini avec succès !</p>
            <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>Redirection vers le CRM…</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="login-form">
            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16, lineHeight: 1.5 }}>
              Bienvenue ! Veuillez créer votre mot de passe pour accéder au CRM ALTAE.
            </p>

            {error && (
              <div className="login-error">
                <AlertCircle size={15} />
                <span>{error}</span>
              </div>
            )}

            <div className="form-group">
              <label className="form-label required">Nouveau mot de passe</label>
              <div className="login-input-wrap">
                <Lock size={15} className="login-input-icon" />
                <input
                  className="form-input login-input"
                  type="password"
                  autoComplete="new-password"
                  placeholder="Minimum 8 caractères"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  minLength={8}
                />
              </div>
              {password.length > 0 && password.length < 8 && (
                <p style={{ fontSize: 12, color: 'var(--red)', marginTop: 4 }}>
                  {8 - password.length} caractère{8 - password.length > 1 ? 's' : ''} manquant{8 - password.length > 1 ? 's' : ''}
                </p>
              )}
            </div>

            <div className="form-group">
              <label className="form-label required">Confirmer le mot de passe</label>
              <div className="login-input-wrap">
                <Lock size={15} className="login-input-icon" />
                <input
                  className="form-input login-input"
                  type="password"
                  autoComplete="new-password"
                  placeholder="Répétez le mot de passe"
                  value={confirm}
                  onChange={e => setConfirm(e.target.value)}
                  required
                />
              </div>
              {confirm.length > 0 && confirm !== password && (
                <p style={{ fontSize: 12, color: 'var(--red)', marginTop: 4 }}>
                  Les mots de passe ne correspondent pas
                </p>
              )}
            </div>

            <button
              type="submit"
              className="btn btn-gold"
              style={{ width: '100%', justifyContent: 'center', marginTop: 8 }}
              disabled={saving}
            >
              {saving ? 'Enregistrement…' : 'Définir mon mot de passe'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
