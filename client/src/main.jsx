import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
// Global styles first, so component and page CSS (imported by App) can override them.
import './styles/variables.css';
import './styles/base.css';
import './styles/components.css';
import App from './App.jsx';
import { AuthProvider } from './context/AuthContext.jsx';
import ErrorBoundary from './components/layout/ErrorBoundary.jsx';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <ErrorBoundary>
          <App />
        </ErrorBoundary>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: { fontFamily: 'var(--font-body)', fontSize: '0.92rem', borderRadius: '10px' },
          }}
        />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
