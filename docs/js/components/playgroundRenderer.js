// Playground Renderer — Interactive "What-If" Architecture Playground
// Users toggle architectural blocks on/off and see tradeoff impacts in real-time.

const PlaygroundRenderer = {

  _instances: {},

  render(block, blockId) {
    const config = block.config;
    const id = `playground-${blockId}`;

    // Store config for runtime use
    this._instances[id] = {
      config,
      activeToggles: new Set(config.defaultActive || [])
    };

    return `
      <div class="block-playground" id="${id}">
        <div class="block-playground__header">
          <div class="block-playground__title">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
            </svg>
            ${block.title}
          </div>
          <span class="block-playground__badge">Interactive</span>
        </div>

        <div class="block-playground__body">
          <!-- Architecture canvas -->
          <div class="block-playground__canvas" id="${id}-canvas">
            ${this._renderArchitecture(id, config)}
          </div>

          <!-- Toggle blocks -->
          <div class="block-playground__toggles">
            <div class="block-playground__toggles-label">Try adding:</div>
            <div class="block-playground__toggle-list">
              ${config.toggles.map(t => `
                <button class="block-playground__toggle ${(config.defaultActive || []).includes(t.id) ? 'block-playground__toggle--active' : ''}"
                        id="${id}-toggle-${t.id}"
                        onclick="PlaygroundRenderer.toggle('${id}', '${t.id}')">
                  <span class="block-playground__toggle-icon">${t.icon || '+'}</span>
                  <span>${t.label}</span>
                </button>
              `).join('')}
            </div>
          </div>

          <!-- Metrics panel -->
          <div class="block-playground__metrics" id="${id}-metrics">
            ${this._renderMetrics(id, config)}
          </div>

          <!-- Insight box -->
          <div class="block-playground__insight" id="${id}-insight">
            <div class="block-playground__insight-icon">💡</div>
            <div class="block-playground__insight-text" id="${id}-insight-text">
              ${config.baseInsight}
            </div>
          </div>
        </div>
      </div>
    `;
  },

  // ────────────────────── Toggle handler ──────────────────────

  toggle(instanceId, toggleId) {
    const instance = this._instances[instanceId];
    if (!instance) return;

    const btn = document.getElementById(`${instanceId}-toggle-${toggleId}`);

    if (instance.activeToggles.has(toggleId)) {
      instance.activeToggles.delete(toggleId);
      btn?.classList.remove('block-playground__toggle--active');
    } else {
      instance.activeToggles.add(toggleId);
      btn?.classList.add('block-playground__toggle--active');
    }

    // Re-render everything
    this._updateAll(instanceId);
  },

  _updateAll(instanceId) {
    const instance = this._instances[instanceId];
    const config = instance.config;

    // Update architecture diagram
    const canvas = document.getElementById(`${instanceId}-canvas`);
    if (canvas) canvas.innerHTML = this._renderArchitecture(instanceId, config);

    // Update metrics
    const metricsEl = document.getElementById(`${instanceId}-metrics`);
    if (metricsEl) metricsEl.innerHTML = this._renderMetrics(instanceId, config);

    // Update insight
    const insightText = document.getElementById(`${instanceId}-insight-text`);
    if (insightText) insightText.innerHTML = this._getInsight(instanceId, config);

    // Animate the insight box
    const insightBox = document.getElementById(`${instanceId}-insight`);
    if (insightBox) {
      insightBox.classList.remove('block-playground__insight--flash');
      void insightBox.offsetWidth; // trigger reflow
      insightBox.classList.add('block-playground__insight--flash');
    }
  },

  // ────────────────────── Architecture SVG ──────────────────────

  _renderArchitecture(instanceId, config) {
    const active = this._instances[instanceId].activeToggles;
    const nodes = config.architecture.nodes;
    const connections = config.architecture.connections;

    // Determine which nodes are visible
    const visibleNodes = nodes.filter(n => {
      if (!n.requiresToggle) return true;
      return active.has(n.requiresToggle);
    });

    const visibleIds = new Set(visibleNodes.map(n => n.id));

    // Determine which connections are visible
    const visibleConns = connections.filter(c => {
      return visibleIds.has(c.from) && visibleIds.has(c.to);
    });

    const svgWidth = 700;
    const svgHeight = config.architecture.height || 200;

    let svg = `<svg viewBox="0 0 ${svgWidth} ${svgHeight}" class="block-playground__svg">`;

    // Draw connections
    visibleConns.forEach(c => {
      const fromNode = visibleNodes.find(n => n.id === c.from);
      const toNode = visibleNodes.find(n => n.id === c.to);
      if (!fromNode || !toNode) return;

      const dashed = c.dashed ? 'stroke-dasharray="6,4"' : '';
      const color = c.color || '#4b5563';
      svg += `<line x1="${fromNode.x}" y1="${fromNode.y}" x2="${toNode.x}" y2="${toNode.y}" 
              stroke="${color}" stroke-width="2" ${dashed} opacity="0.6"/>`;

      // Arrow head
      const angle = Math.atan2(toNode.y - fromNode.y, toNode.x - fromNode.x);
      const arrowLen = 8;
      const ax = toNode.x - 20 * Math.cos(angle);
      const ay = toNode.y - 20 * Math.sin(angle);
      svg += `<polygon points="${ax},${ay} ${ax - arrowLen * Math.cos(angle - 0.4)},${ay - arrowLen * Math.sin(angle - 0.4)} ${ax - arrowLen * Math.cos(angle + 0.4)},${ay - arrowLen * Math.sin(angle + 0.4)}" fill="${color}" opacity="0.6"/>`;

      // Connection label
      if (c.label) {
        const mx = (fromNode.x + toNode.x) / 2;
        const my = (fromNode.y + toNode.y) / 2 - 8;
        svg += `<text x="${mx}" y="${my}" text-anchor="middle" class="block-playground__svg-label">${c.label}</text>`;
      }
    });

    // Draw nodes
    visibleNodes.forEach(n => {
      const isNew = n.requiresToggle && active.has(n.requiresToggle);
      const glow = isNew ? `filter="url(#glow-${instanceId})"` : '';
      const w = n.width || 110;
      const h = n.height || 38;

      if (isNew) {
        svg += `<defs><filter id="glow-${instanceId}" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="3" result="blur"/>
          <feComposite in="SourceGraphic" in2="blur" operator="over"/>
        </filter></defs>`;
      }

      svg += `<rect x="${n.x - w/2}" y="${n.y - h/2}" width="${w}" height="${h}" rx="8" 
              fill="${n.color}" opacity="${isNew ? '1' : '0.85'}" ${glow}/>`;
      svg += `<text x="${n.x}" y="${n.y + 4}" text-anchor="middle" class="block-playground__svg-text">${n.label}</text>`;
    });

    svg += `</svg>`;
    return svg;
  },

  // ────────────────────── Metrics ──────────────────────

  _renderMetrics(instanceId, config) {
    const active = this._instances[instanceId].activeToggles;
    const scenario = this._getScenario(active, config);

    return scenario.metrics.map(m => {
      const changeClass = m.change === 'better' ? 'block-playground__metric--better' 
                        : m.change === 'worse' ? 'block-playground__metric--worse' 
                        : '';
      const arrow = m.change === 'better' ? '↑' : m.change === 'worse' ? '↓' : '';
      return `
        <div class="block-playground__metric ${changeClass}">
          <div class="block-playground__metric-value">${m.value} ${arrow}</div>
          <div class="block-playground__metric-label">${m.label}</div>
        </div>
      `;
    }).join('');
  },

  // ────────────────────── Insight text ──────────────────────

  _getInsight(instanceId, config) {
    const active = this._instances[instanceId].activeToggles;
    const scenario = this._getScenario(active, config);
    return scenario.insight;
  },

  // Find matching scenario for current toggle combination
  _getScenario(activeSet, config) {
    const activeKey = [...activeSet].sort().join('+') || '_base';

    // Exact match first
    if (config.scenarios[activeKey]) return config.scenarios[activeKey];

    // Fallback to base
    return config.scenarios['_base'];
  }
};
