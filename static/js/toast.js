// Tactical Toast Notification System
const Toast = {
  show(title, message, type = 'info', duration = 4000) {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;

    let icon = '◉';
    if (type === 'success') {
      icon = '✓';
      AudioFX.playSuccess();
    } else if (type === 'warning') {
      icon = '⚠';
      AudioFX.playBeep(600, 0.1, 'sawtooth');
    } else if (type === 'danger') {
      icon = '✕';
      AudioFX.playAlert();
    } else {
      AudioFX.playBeep(900, 0.05);
    }

    toast.innerHTML = `
      <div class="toast-icon">${icon}</div>
      <div class="toast-content">
        <div class="toast-title">${title}</div>
        <div class="toast-message">${message}</div>
      </div>
      <button class="toast-close">&times;</button>
    `;

    toast.querySelector('.toast-close').addEventListener('click', () => {
      toast.remove();
    });

    container.appendChild(toast);

    if (duration > 0) {
      setTimeout(() => {
        if (toast.parentElement) {
          toast.style.opacity = '0';
          toast.style.transform = 'translateY(10px)';
          setTimeout(() => toast.remove(), 200);
        }
      }, duration);
    }
  },

  success(title, message) { this.show(title, message, 'success'); },
  warning(title, message) { this.show(title, message, 'warning'); },
  danger(title, message) { this.show(title, message, 'danger'); },
  info(title, message) { this.show(title, message, 'info'); }
};
