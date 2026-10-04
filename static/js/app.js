// Master Application Bootstrapper
document.addEventListener('DOMContentLoaded', async () => {
  console.log("[*] Initializing Aurelia Cyber Systems — Investigation Platform (Case NX-047)...");

  // 1. Initialize Audio SFX
  const muteBtn = document.getElementById('audio-toggle-btn');
  if (muteBtn) {
    muteBtn.addEventListener('click', () => {
      const isMuted = AudioFX.toggleMute();
      muteBtn.textContent = isMuted ? '🔇 AUDIO OFF' : '🔊 AUDIO ON';
      if (!isMuted) AudioFX.playBeep(1000, 0.05);
    });
  }

  // 2. Initialize Window Manager & Register Windows
  WinManager.init();
  const winBrowser = document.getElementById('window-browser');
  const winTerminal = document.getElementById('window-terminal');
  const winComposer = document.getElementById('window-composer');
  const winVault = document.getElementById('window-vault');
  const winMap = document.getElementById('window-map');

  if (winBrowser) WinManager.registerWindow('browser', winBrowser);
  if (winTerminal) WinManager.registerWindow('terminal', winTerminal);
  if (winComposer) WinManager.registerWindow('composer', winComposer);
  if (winVault) WinManager.registerWindow('vault', winVault);
  if (winMap) WinManager.registerWindow('map', winMap);

  // Open default tool windows on load
  WinManager.openWindow('browser');

  // 3. Initialize Interactive Cyber Tools
  CyberBrowserInstance.init();
  CyberTerminalInstance.init();
  RequestComposerInstance.init();
  EvidenceVaultInstance.init();
  ArchitectureMapInstance.init();
  AttackGraphBuilderInstance.init();
  KnowledgeCheckInstance.init();
  MissionControllerInstance.init();
  InstructorPanelInstance.init();

  // 4. Setup Start Lab & Reset Buttons
  const startBtn = document.getElementById('hud-start-lab-btn');
  const provisionStartBtn = document.getElementById('provision-start-btn');
  const resetBtn = document.getElementById('hud-reset-lab-btn');
  const overlay = document.getElementById('lab-provision-overlay');

  const triggerStart = async () => {
    AudioFX.playClick();
    if (overlay) overlay.classList.add('hidden');
    await LabState.startLab();
  };

  if (startBtn) startBtn.addEventListener('click', triggerStart);
  if (provisionStartBtn) provisionStartBtn.addEventListener('click', triggerStart);

  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      if (confirm("Reset investigation progress and restart timer?")) {
        AudioFX.playClick();
        LabState.resetLab();
      }
    });
  }

  // 5. Setup Quick Tool Launchers from Center Panel
  const openBrowserBtn = document.getElementById('hero-open-browser-btn');
  const openTerminalBtn = document.getElementById('hero-open-terminal-btn');

  if (openBrowserBtn) {
    openBrowserBtn.addEventListener('click', () => {
      if (overlay) overlay.classList.add('hidden');
      WinManager.openWindow('browser');
      // Switch to attackbox view if on mobile
      switchToMobilePanel('attackbox-workspace-panel');
    });
  }

  if (openTerminalBtn) {
    openTerminalBtn.addEventListener('click', () => {
      if (overlay) overlay.classList.add('hidden');
      WinManager.openWindow('terminal');
      // Switch to attackbox view if on mobile
      switchToMobilePanel('attackbox-workspace-panel');
    });
  }

  // 6. Mobile Viewport Switcher Logic
  const mobileNavBtns = document.querySelectorAll('.mobile-nav-tab-btn');
  const sidebarPanel = document.getElementById('sidebar-nav');
  const centerPanel = document.getElementById('main-briefing-panel');
  const attackboxPanel = document.getElementById('attackbox-workspace');

  function switchToMobilePanel(panelClass) {
    mobileNavBtns.forEach(btn => {
      btn.classList.toggle('active', btn.dataset.mobilePanel === panelClass);
    });

    if (sidebarPanel) sidebarPanel.classList.toggle('mobile-active', panelClass === 'sidebar-nav-panel');
    if (centerPanel) centerPanel.classList.toggle('mobile-active', panelClass === 'center-task-panel');
    if (attackboxPanel) attackboxPanel.classList.toggle('mobile-active', panelClass === 'attackbox-workspace-panel');
  }

  mobileNavBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      AudioFX.playClick();
      switchToMobilePanel(btn.dataset.mobilePanel);
    });
  });

  // Default mobile active panel: Tasks Workspace
  switchToMobilePanel('center-task-panel');

  // 7. Subscribe to Lab State
  LabState.subscribe((state) => {
    if (state.lab_started && overlay) {
      overlay.classList.add('hidden');
    }
  });

  // 8. Fetch initial state
  await LabState.fetchState();

  console.log("[*] Platform Ready. Desktop & Mobile viewports initialized.");
});
