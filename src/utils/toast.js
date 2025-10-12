const palette = {
  info: { background: '#3b82f6', color: '#ffffff' },
  success: { background: '#22c55e', color: '#000000' },
  error: { background: '#ef4444', color: '#ffffff' }
};

let animationsInjected = false;

function ensureAnimations() {
  if (animationsInjected || typeof document === 'undefined') return;
  const style = document.createElement('style');
  style.textContent = `
@keyframes toastSlideIn {
  from { transform: translateX(100%); opacity: 0; }
  to { transform: translateX(0); opacity: 1; }
}
@keyframes toastSlideOut {
  from { transform: translateX(0); opacity: 1; }
  to { transform: translateX(100%); opacity: 0; }
}
`;
  document.head.appendChild(style);
  animationsInjected = true;
}

export function showToast(message, options = {}) {
  if (typeof document === 'undefined') return;

  const {
    duration = 2000,
    type = 'info',
    position = 'top-right'
  } = options;

  const colors = palette[type] || palette.info;

  ensureAnimations();

  const toast = document.createElement('div');
  toast.textContent = message;
  toast.style.position = 'fixed';
  toast.style.zIndex = '9999';
  toast.style.padding = '12px 20px';
  toast.style.borderRadius = '6px';
  toast.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
  toast.style.fontFamily = 'Inter, system-ui, sans-serif';
  toast.style.fontSize = '14px';
  toast.style.background = colors.background;
  toast.style.color = colors.color;
  toast.style.animation = 'toastSlideIn 0.3s ease-out';

  if (position.includes('top')) {
    toast.style.top = '20px';
  } else {
    toast.style.bottom = '20px';
  }

  if (position.includes('right')) {
    toast.style.right = '20px';
  } else {
    toast.style.left = '20px';
  }

  document.body.appendChild(toast);

  const removeToast = () => {
    toast.style.animation = 'toastSlideOut 0.3s ease-in forwards';
    setTimeout(() => toast.remove(), 300);
  };

  const timeoutId = setTimeout(removeToast, duration);

  toast.addEventListener('mouseenter', () => clearTimeout(timeoutId));
  toast.addEventListener('mouseleave', () => setTimeout(removeToast, 300));
}

if (typeof window !== 'undefined') {
  window.toast = showToast;
}
