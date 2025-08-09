// src/main.jsx
import * as THREE from 'three';
import { ensureCanonGeometry, createCanonMaterial } from '@/renderer/materialFactory';
import { installCanonComplianceShim } from '@/renderer/canonComplianceShim';
installCanonComplianceShim(THREE);
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './styles/index.css';

const rootEl = document.getElementById('root');
if (!rootEl) {
  console.error('❌ Could not find #root element');
} else {
  const root = ReactDOM.createRoot(rootEl);
  // 🔥 No React.StrictMode wrapper here to avoid double-mount in DEV
  root.render(<App />);
}
