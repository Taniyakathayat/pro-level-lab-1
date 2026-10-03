// Cyber Terminal Tool Implementation
class CyberTerminal {
  constructor() {
    this.history = [];
    this.historyIndex = -1;
    this.cwd = '/home/analyst';
  }

  init() {
    const input = document.getElementById('terminal-active-input');
    const outputArea = document.getElementById('terminal-output-area');

    if (input) {
      input.addEventListener('keydown', async (e) => {
        AudioFX.playKeypress();

        if (e.key === 'Enter') {
          const cmd = input.value.trim();
          if (!cmd) return;

          this.history.push(cmd);
          this.historyIndex = this.history.length;
          input.value = '';

          this.appendCommand(cmd);
          await this.execute(cmd);
        } else if (e.key === 'ArrowUp') {
          if (this.historyIndex > 0) {
            this.historyIndex--;
            input.value = this.history[this.historyIndex];
          }
          e.preventDefault();
        } else if (e.key === 'ArrowDown') {
          if (this.historyIndex < this.history.length - 1) {
            this.historyIndex++;
            input.value = this.history[this.historyIndex];
          } else {
            this.historyIndex = this.history.length;
            input.value = '';
          }
          e.preventDefault();
        }
      });
    }

    // Print welcome banner
    this.printWelcome();
  }

  printWelcome() {
    const outputArea = document.getElementById('terminal-output-area');
    if (!outputArea) return;

    outputArea.innerHTML = `
<div style="color:var(--accent-cyan);font-weight:700;">AURELIA CYBER THREAT INVESTIGATION TERMINAL (v2.4-SEC)</div>
<div style="color:var(--text-dim);">Type 'help' to inspect available forensic commands. All network routes are sandboxed.</div>
<div style="color:#64748b;margin-bottom:8px;">--------------------------------------------------------------------------------</div>
`;
  }

  appendCommand(cmd) {
    const outputArea = document.getElementById('terminal-output-area');
    if (!outputArea) return;

    const div = document.createElement('div');
    div.className = 'terminal-entry';
    div.innerHTML = `
      <div class="terminal-cmd-line">
        <span class="terminal-prompt-user">analyst@aurelia-soc</span>:<span class="terminal-prompt-path">${this.cwd}</span>$ <span>${cmd}</span>
      </div>
    `;
    outputArea.appendChild(div);
    outputArea.scrollTop = outputArea.scrollHeight;
  }

  async execute(cmd) {
    const outputArea = document.getElementById('terminal-output-area');
    if (!outputArea) return;

    try {
      const res = await fetch('/api/terminal/exec', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: 'default_investigator',
          command: cmd,
          cwd: this.cwd
        })
      });

      const data = await res.json();
      this.cwd = data.cwd || this.cwd;

      // Update prompt path in UI
      const promptPath = document.getElementById('terminal-cwd-indicator');
      if (promptPath) promptPath.textContent = this.cwd;

      if (data.clear) {
        outputArea.innerHTML = '';
        this.printWelcome();
        return;
      }

      if (data.output) {
        const outDiv = document.createElement('div');
        outDiv.className = `terminal-response-text ${data.status === 'error' ? 'error' : ''}`;
        outDiv.textContent = data.output;
        outputArea.appendChild(outDiv);
      }

      // Check if evidence was found or state updated
      LabState.fetchState();

    } catch (err) {
      const errDiv = document.createElement('div');
      errDiv.className = 'terminal-response-text error';
      errDiv.textContent = 'Terminal daemon execution failure.';
      outputArea.appendChild(errDiv);
    }

    outputArea.scrollTop = outputArea.scrollHeight;
  }
}

const CyberTerminalInstance = new CyberTerminal();
