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

  // 4. Setup Resizable Split Panel
  const resizer = document.getElementById('panel-resizer');
  const leftPanel = document.getElementById('left-panel');
  if (resizer && leftPanel) {
    let isResizing = false;
    resizer.addEventListener('mousedown', (e) => {
      isResizing = true;
      resizer.classList.add('dragging');
      document.body.style.cursor = 'col-resize';
    });

    document.addEventListener('mousemove', (e) => {
      if (!isResizing) return;
      const newWidth = Math.max(340, Math.min(e.clientX, 650));
      leftPanel.style.width = `${newWidth}px`;
    });

    document.addEventListener('mouseup', () => {
      if (isResizing) {
        isResizing = false;
        resizer.classList.remove('dragging');
        document.body.style.cursor = 'default';
      }
    });
  }

  // 5. Setup Start Lab & Reset Buttons
  const startBtn = document.getElementById('hud-start-lab-btn');
  const resetBtn = document.getElementById('hud-reset-lab-btn');

  if (startBtn) {
    startBtn.addEventListener('click', () => {
      AudioFX.playClick();
      LabState.startLab();
    });
  }

  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      if (confirm("Reset investigation progress and restart timer?")) {
        AudioFX.playClick();
        LabState.resetLab();
      }
    });
  }

  // 6. Fetch initial state
  await LabState.fetchState();

  // If lab not started, trigger start automatically or prompt
  if (!LabState.state.lab_started) {
    await LabState.startLab();
  }

  console.log("[*] Platform Ready. Good luck, Investigator.");
});
