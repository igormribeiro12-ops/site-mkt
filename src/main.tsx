import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import '@fontsource-variable/plus-jakarta-sans';
import '@fontsource-variable/fredoka';
import '@fontsource-variable/playfair-display';
import '@fontsource-variable/space-grotesk';
import './index.css';
import { App } from './App';

// HashRouter: funciona em qualquer hospedagem estática (ex.: GitHub Pages)
// e ao atualizar a página, sem configuração de servidor.
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HashRouter>
      <App />
    </HashRouter>
  </StrictMode>,
);
