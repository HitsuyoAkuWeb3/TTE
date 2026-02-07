import React from 'react';
import ReactDOM from 'react-dom/client';
import { ClerkProvider } from '@clerk/clerk-react';
import { VernacularProvider } from './contexts/VernacularContext';
import { OrgProvider } from './contexts/OrgContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import App from './App';

const CLERK_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

if (!CLERK_KEY) {
  throw new Error('Missing VITE_CLERK_PUBLISHABLE_KEY in .env');
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <ClerkProvider publishableKey={CLERK_KEY}>
        <OrgProvider>
          <VernacularProvider>
            <App />
          </VernacularProvider>
        </OrgProvider>
      </ClerkProvider>
    </ErrorBoundary>
  </React.StrictMode>
);