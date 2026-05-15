export function escapeHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

// Aplica bold markdown sobre texto já escapado — asteriscos não são especiais em HTML
export function applyBold(escaped) {
  return escaped.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
}
