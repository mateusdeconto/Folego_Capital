import * as Sentry from '@sentry/react';
import posthog from 'posthog-js';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.jsx';
import ErrorBoundary from './components/ErrorBoundary.jsx';

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN || '',
  environment: import.meta.env.MODE,
  tracesSampleRate: 0.2,
});

posthog.init('phc_yS9cGLF7V9rzM4YojJtbwZKgLwvBtwjEEKQHMtmgnCHU', {
  api_host: 'https://eu.i.posthog.com',
  person_profiles: 'identified_only',
  capture_pageview: true,
  capture_pageleave: true,
  session_recording: {
    maskAllInputs: true, // nunca grava campos sensíveis (senha, dados financeiros)
  },
});

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>
);
