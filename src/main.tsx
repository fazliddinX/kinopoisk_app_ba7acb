import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { initMetrica } from './utils/metrica';

initMetrica();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
