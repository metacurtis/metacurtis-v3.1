// src/main.jsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import './styles/index.css'; // Correct relative path to CSS
import App from './App';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Failed to find the root element with ID 'root'");
}
const root = createRoot(rootElement);

root.render(
  <StrictMode>
    <App />
  </StrictMode>
);
