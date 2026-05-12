import { useState } from 'react';
import { Upload, X, CheckCircle, AlertCircle } from 'lucide-react';
import { useCRM } from '../context';

export default function DataMigration() {
  const { hasMigrationData, importFromLocalStorage, dismissMigration } = useCRM();
  const [state, setState] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');
  const [errMsg, setErrMsg] = useState('');

  if (!hasMigrationData) return null;

  async function handleImport() {
    setState('loading');
    try {
      await importFromLocalStorage();
      setState('done');
      setTimeout(() => setState('idle'), 3000);
    } catch (e: any) {
      setErrMsg(e?.message ?? 'Erreur inconnue');
      setState('error');
    }
  }

  return (
    <div className="migration-banner">
      <div className="migration-inner">
        {state === 'idle' && (
          <>
            <Upload size={16} className="migration-icon" />
            <span>Des données locales ont été détectées.</span>
            <button className="btn btn-primary btn-sm" onClick={handleImport}>
              Importer mes données existantes
            </button>
            <button className="btn btn-outline btn-sm" onClick={dismissMigration}>
              Ignorer
            </button>
          </>
        )}
        {state === 'loading' && (
          <>
            <div className="spinner spinner-sm" />
            <span>Import en cours…</span>
          </>
        )}
        {state === 'done' && (
          <>
            <CheckCircle size={16} style={{ color: 'var(--green)' }} />
            <span>Import terminé avec succès !</span>
          </>
        )}
        {state === 'error' && (
          <>
            <AlertCircle size={16} style={{ color: 'var(--red)' }} />
            <span>Erreur lors de l'import : {errMsg}</span>
            <button className="btn btn-outline btn-sm" onClick={() => setState('idle')}>
              Réessayer
            </button>
            <button className="btn-icon" onClick={dismissMigration}><X size={14} /></button>
          </>
        )}
      </div>
    </div>
  );
}
