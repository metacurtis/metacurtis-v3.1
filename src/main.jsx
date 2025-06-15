// src/main.jsx
import _React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles/index.css'; // Your global styles, including Tailwind
// import './console-shim.js'; // Only if still needed

const appRootElement = document.getElementById('root');
if (appRootElement) {
  ReactDOM.createRoot(appRootElement).render(
    // <React.StrictMode>
    <App />
    // </React.StrictMode>
  );
} else {
  console.error('Failed to find the main app root element #root');
}
