interface Props { message?: string; fullPage?: boolean; }

export default function Spinner({ message = 'Chargement…', fullPage }: Props) {
  if (fullPage) {
    return (
      <div className="spinner-page">
        <div className="spinner" />
        <span className="spinner-label">{message}</span>
      </div>
    );
  }
  return (
    <div className="spinner-inline">
      <div className="spinner spinner-sm" />
      <span className="spinner-label">{message}</span>
    </div>
  );
}
