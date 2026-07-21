const STATUS_META = {
  pending: { label: 'Pendiente', bg: 'var(--status-neutral-bg)', fg: 'var(--text-secondary)' },
  queued: { label: 'En cola', bg: 'var(--status-neutral-bg)', fg: 'var(--text-secondary)' },
  calling: { label: 'Llamando', bg: 'var(--status-active-bg)', fg: 'var(--series-blue)' },
  ringing: { label: 'Llamando', bg: 'var(--status-active-bg)', fg: 'var(--series-blue)' },
  in_progress: { label: 'En conversación', bg: 'var(--status-active-bg)', fg: 'var(--series-blue)' },
  completed: { label: 'Completada', bg: 'var(--status-good-bg)', fg: 'var(--status-good)' },
  no_answer: { label: 'No contestó', bg: 'var(--status-warning-bg)', fg: 'var(--status-warning)' },
  voicemail: { label: 'Buzón de voz', bg: 'var(--status-warning-bg)', fg: 'var(--status-warning)' },
  failed: { label: 'Falló', bg: 'var(--status-critical-bg)', fg: 'var(--status-critical)' },
};

export default function StatusBadge({ status }) {
  const meta = STATUS_META[status] || { label: status, bg: 'var(--status-neutral-bg)', fg: 'var(--text-secondary)' };
  return (
    <span className="status-badge" style={{ background: meta.bg, color: meta.fg }}>
      <span className="dot" style={{ background: meta.fg }} />
      {meta.label}
    </span>
  );
}
