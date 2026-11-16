import { useEffect } from 'react';

export function useDocumentTitle(title: string) {
  useEffect(() => {
    document.title = title ? `${title} · Startup Lab` : 'Startup Lab — Crie sua Empresa';
  }, [title]);
}
