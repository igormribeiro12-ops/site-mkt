/** Remove espaços extras e a pontuação final, para encaixar o texto em uma frase. */
export function clause(text: string): string {
  return text.trim().replace(/\s+/g, ' ').replace(/[.!?;:,]+$/, '');
}

/** Divide um texto em itens de lista (quebras de linha, ponto e vírgula ou vírgulas). */
export function toList(text: string, max = 6): string[] {
  const byLine = text
    .split(/\n|;|•/)
    .map((s) => s.trim().replace(/^[-–•*✓✅]\s*/, ''))
    .filter(Boolean);
  const items = byLine.length > 1 ? byLine : text.split(',').map((s) => s.trim()).filter(Boolean);
  return items.slice(0, max).map((s) => s.charAt(0).toUpperCase() + s.slice(1));
}
