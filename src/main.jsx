// src/main.jsx (Reverted)

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import './styles/index.css';
import App from './App'; // Keep importing App

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Failed to find the root element with ID 'root'");
}
const root = createRoot(rootElement);

root.render(
  <StrictMode>
    {/* No BrowserRouter needed */}
    <App />
  </StrictMode>
);
