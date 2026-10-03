// Desktop Window Manager for AttackBox Environment
class WindowManager {
  constructor() {
    this.windows = {};
    this.activeWindow = null;
    this.highestZ = 100;
    this.dragTarget = null;
    this.dragOffset = { x: 0, y: 0 };
  }

  init() {
    // Setup window drag listeners
    document.addEventListener('mousemove', (e) => this.handleDrag(e));
    document.addEventListener('mouseup', () => this.stopDrag());

    // Setup desktop shortcut buttons
    document.querySelectorAll('.desktop-icon-btn').forEach(btn => {
      btn.addEventListener('dblclick', () => {
        const winId = btn.dataset.targetWindow;
        if (winId) this.openWindow(winId);
      });
      btn.addEventListener('click', () => {
        AudioFX.playClick();
      });
    });
  }

  registerWindow(winId, elem) {
    this.windows[winId] = {
      elem: elem,
      minimized: false,
      maximized: false,
      prevRect: null
    };

    // Window focus on click
    elem.addEventListener('mousedown', () => this.bringToFront(winId));

    // Window controls
    const titleBar = elem.querySelector('.window-title-bar');
    if (titleBar) {
      titleBar.addEventListener('mousedown', (e) => this.startDrag(e, winId));
    }

    const minBtn = elem.querySelector('.win-control-btn.minimize');
    if (minBtn) minBtn.addEventListener('click', (e) => { e.stopPropagation(); this.minimizeWindow(winId); });

    const maxBtn = elem.querySelector('.win-control-btn.maximize');
    if (maxBtn) maxBtn.addEventListener('click', (e) => { e.stopPropagation(); this.toggleMaximize(winId); });

    const closeBtn = elem.querySelector('.win-control-btn.close');
    if (closeBtn) closeBtn.addEventListener('click', (e) => { e.stopPropagation(); this.closeWindow(winId); });
  }

  bringToFront(winId) {
    const win = this.windows[winId];
    if (!win) return;
    this.highestZ += 1;
    win.elem.style.zIndex = this.highestZ;
    
    // Remove active class from others
    Object.values(this.windows).forEach(w => w.elem.classList.remove('active'));
    win.elem.classList.add('active');
    this.activeWindow = winId;
    this.updateTaskbar();
  }

  openWindow(winId) {
    const win = this.windows[winId];
    if (!win) return;
    AudioFX.playClick();
    win.elem.classList.remove('minimized');
    win.minimized = false;
    this.bringToFront(winId);
  }

  minimizeWindow(winId) {
    const win = this.windows[winId];
    if (!win) return;
    AudioFX.playClick();
    win.elem.classList.add('minimized');
    win.minimized = true;
    this.updateTaskbar();
  }

  toggleMaximize(winId) {
    const win = this.windows[winId];
    if (!win) return;
    AudioFX.playClick();
    win.elem.classList.toggle('maximized');
    win.maximized = win.elem.classList.contains('maximized');
  }

  closeWindow(winId) {
    const win = this.windows[winId];
    if (!win) return;
    AudioFX.playClick();
    win.elem.classList.add('minimized');
    win.minimized = true;
    this.updateTaskbar();
  }

  startDrag(e, winId) {
    const win = this.windows[winId];
    if (!win || win.maximized) return;
    this.bringToFront(winId);
    this.dragTarget = win.elem;
    const rect = win.elem.getBoundingClientRect();
    this.dragOffset.x = e.clientX - rect.left;
    this.dragOffset.y = e.clientY - rect.top;
  }

  handleDrag(e) {
    if (!this.dragTarget) return;
    const parent = this.dragTarget.parentElement.getBoundingClientRect();
    let left = e.clientX - parent.left - this.dragOffset.x;
    let top = e.clientY - parent.top - this.dragOffset.y;

    // Constrain inside parent
    left = Math.max(0, Math.min(left, parent.width - 150));
    top = Math.max(0, Math.min(top, parent.height - 80));

    this.dragTarget.style.left = `${left}px`;
    this.dragTarget.style.top = `${top}px`;
  }

  stopDrag() {
    this.dragTarget = null;
  }

  updateTaskbar() {
    const list = document.getElementById('taskbar-items-list');
    if (!list) return;
    list.innerHTML = '';

    Object.entries(this.windows).forEach(([winId, win]) => {
      const title = win.elem.querySelector('.window-title-text')?.textContent || winId;
      const btn = document.createElement('button');
      btn.className = `taskbar-item-btn ${(!win.minimized && this.activeWindow === winId) ? 'active' : ''}`;
      btn.innerHTML = `<span class="taskbar-dot"></span> ${title}`;
      btn.addEventListener('click', () => {
        if (win.minimized) {
          this.openWindow(winId);
        } else if (this.activeWindow === winId) {
          this.minimizeWindow(winId);
        } else {
          this.bringToFront(winId);
        }
      });
      list.appendChild(btn);
    });
  }
}

const WinManager = new WindowManager();
