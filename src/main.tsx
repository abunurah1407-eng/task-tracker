import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Error boundary for initial render
try {
  const rootElement = document.getElementById('root');
  if (!rootElement) {
    throw new Error('Root element not found');
  }

  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  );
} catch (error) {
  console.error('Failed to render app:', error);
  document.body.innerHTML = `
    <div style="padding: 20px; font-family: Arial;">
      <h1>Application Error</h1>
      <p>Failed to load the application. Please check the console for details.</p>
      <p>Error: ${error instanceof Error ? error.message : String(error)}</p>
    </div>
  `;
}


