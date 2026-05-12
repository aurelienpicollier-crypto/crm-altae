import { useEffect } from 'react';
import { Bell, X } from 'lucide-react';
import { useCRM } from '../context';

export default function Toast() {
  const { toast, clearToast } = useCRM();

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(clearToast, 4000);
    return () => clearTimeout(t);
  }, [toast, clearToast]);

  if (!toast) return null;

  return (
    <div className="toast">
      <Bell size={14} className="toast-icon" />
      <span>{toast}</span>
      <button className="toast-close" onClick={clearToast}><X size={13} /></button>
    </div>
  );
}
