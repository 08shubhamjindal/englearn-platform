// Interactive SVG Diagram Renderer
const DiagramRenderer = {
  currentStep: 0,
  autoPlayInterval: null,

  render(block, blockId) {
    const config = block.config;
    const diagramType = block.diagramType;
    const steps = config.steps || [];

    return `
      <div class="block-diagram" id="diagram-${blockId}">
        <div class="block-diagram__header">
          <div class="block-diagram__title">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83"/></svg>
            ${block.title}
          </div>
          <div class="block-diagram__controls">
            ${steps.length > 1 ? `
              <button class="block-diagram__btn" onclick="DiagramRenderer.prevStep('${blockId}')" title="Previous step">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 18l-6-6 6-6"/></svg>
              </button>
              <button class="block-diagram__btn" onclick="DiagramRenderer.toggleAutoPlay('${blockId}')" id="autoplay-${blockId}" title="Auto-play">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                Play
              </button>
              <button class="block-diagram__btn" onclick="DiagramRenderer.nextStep('${blockId}')" title="Next step">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18l6-6-6-6"/></svg>
              </button>
            ` : ''}
          </div>
        </div>
        <div class="block-diagram__canvas" id="canvas-${blockId}">
          ${this.renderSVG(config, diagramType, blockId)}
        </div>
        ${steps.length > 0 ? `
          <div class="block-diagram__steps" id="steps-${blockId}">
            <div class="block-diagram__step-info">
              <span class="block-diagram__step-number" id="step-num-${blockId}">Step 1 of ${steps.length}</span>
              <span class="block-diagram__step-text" id="step-text-${blockId}">${steps[0].text}</span>
            </div>
          </div>
        ` : ''}
      </div>
    `;
  },

  // ============================================
  // Layout Plugin Registry
  // ============================================
  // To add a new visual layout, call:
  //   DiagramRenderer.registerLayout('sequence', myRenderFn)
  // The render function receives (config, blockId) and returns an SVG string.
  // No need to edit this file — register from any script.

  _layouts: {},

  registerLayout(name, renderFn) {
    this._layouts[name] = renderFn;
  },

  renderSVG(config, diagramType, blockId) {
    // Check for a registered custom layout plugin
    if (this._layouts[diagramType]) {
      return this._layouts[diagramType](config, blockId);
    }
    // Built-in layouts
    if (diagramType === 'hash-ring') {
      return this.renderHashRing(config, blockId);
    }
    // Default: generic flow diagram (handles most cases)
    return this.renderFlowDiagram(config, blockId);
  },

  renderFlowDiagram(config, blockId) {
    const nodes = config.nodes || [];
    const edges = config.edges || [];
    
    // Calculate SVG viewBox based on nodes
    let maxX = 0, maxY = 0;
    nodes.forEach(n => {
      const w = n.width || 140;
      maxX = Math.max(maxX, n.x + w / 2 + 20);
      maxY = Math.max(maxY, n.y + 50);
    });
    const svgW = Math.max(maxX, 780);
    const svgH = Math.max(maxY, 380);

    let svg = `<svg width="100%" viewBox="0 0 ${svgW} ${svgH}" xmlns="http://www.w3.org/2000/svg" style="overflow:visible">`;
    svg += `<defs>
      <marker id="arrow-${blockId}" markerWidth="8" markerHeight="8" refX="8" refY="4" orient="auto">
        <path d="M0,0 L8,4 L0,8" fill="none" stroke="#475569" stroke-width="1.5"/>
      </marker>
      <marker id="arrow-hl-${blockId}" markerWidth="8" markerHeight="8" refX="8" refY="4" orient="auto">
        <path d="M0,0 L8,4 L0,8" fill="none" stroke="#6366f1" stroke-width="1.5"/>
      </marker>
    </defs>`;

    // Render edges
    edges.forEach((edge, i) => {
      const fromNode = nodes.find(n => n.id === edge.from);
      const toNode = nodes.find(n => n.id === edge.to);
      if (!fromNode || !toNode) return;

      const dashStyle = edge.dashed ? 'stroke-dasharray="6 4"' : '';
      svg += `<g class="diagram-edge" id="edge-${blockId}-${i}">
        <line x1="${fromNode.x}" y1="${fromNode.y}" x2="${toNode.x}" y2="${toNode.y}" 
              stroke="#334155" stroke-width="1.5" marker-end="url(#arrow-${blockId})" ${dashStyle}/>
        ${edge.label ? `<text x="${(fromNode.x + toNode.x) / 2}" y="${(fromNode.y + toNode.y) / 2 - 8}" 
              text-anchor="middle" fill="#64748b" font-size="11" font-family="Inter, sans-serif">${edge.label}</text>` : ''}
      </g>`;
    });

    // Render nodes
    nodes.forEach(n => {
      const w = n.width || 140;
      const h = n.type === 'circle' ? 0 : 44;
      const lines = n.label.split('\\n');
      
      if (n.type === 'circle') {
        svg += `<g class="diagram-node" id="node-${blockId}-${n.id}">
          <circle cx="${n.x}" cy="${n.y}" r="30" fill="${n.color}22" stroke="${n.color}" stroke-width="1.5"/>
          <text x="${n.x}" y="${n.y + 4}" text-anchor="middle" fill="${n.color}" font-size="11" font-weight="600" font-family="Inter, sans-serif">${n.label}</text>
        </g>`;
      } else {
        svg += `<g class="diagram-node" id="node-${blockId}-${n.id}">
          <rect x="${n.x - w / 2}" y="${n.y - h / 2}" width="${w}" height="${h}" rx="8" 
                fill="${n.color}15" stroke="${n.color}80" stroke-width="1.5"/>`;
        lines.forEach((line, li) => {
          svg += `<text x="${n.x}" y="${n.y + (li * 16) - (lines.length - 1) * 6 + 4}" text-anchor="middle" 
                fill="#e8ecf4" font-size="12" font-weight="600" font-family="Inter, sans-serif">${line}</text>`;
        });
        svg += `</g>`;
      }
    });

    svg += `</svg>`;
    return svg;
  },

  renderHashRing(config, blockId) {
    const cx = 300, cy = 180, r = 140;
    const nodes = config.nodes || [];
    const keys = config.keys || [];

    let svg = `<svg width="100%" viewBox="0 0 600 360" xmlns="http://www.w3.org/2000/svg" style="overflow:visible">`;

    // Ring
    svg += `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="#1e293b" stroke-width="3" stroke-dasharray="4 4"/>`;
    svg += `<text x="${cx}" y="${cy}" text-anchor="middle" fill="#334155" font-size="12" font-family="Inter, sans-serif">Hash Ring</text>`;

    // Nodes on ring
    nodes.forEach(n => {
      const angle = (n.angle * Math.PI) / 180 - Math.PI / 2;
      const nx = cx + r * Math.cos(angle);
      const ny = cy + r * Math.sin(angle);
      svg += `<g class="diagram-node" id="node-${blockId}-${n.id}">
        <circle cx="${nx}" cy="${ny}" r="20" fill="${n.color}22" stroke="${n.color}" stroke-width="2"/>
        <text x="${nx}" y="${ny + 4}" text-anchor="middle" fill="${n.color}" font-size="10" font-weight="700" font-family="Inter, sans-serif">${n.label.split(' ')[1]}</text>
        <text x="${nx + (Math.cos(angle) > 0 ? 28 : -28)}" y="${ny + 4}" text-anchor="${Math.cos(angle) > 0 ? 'start' : 'end'}" fill="#94a3b8" font-size="10" font-family="Inter, sans-serif">${n.label}</text>
      </g>`;
    });

    // Keys on ring
    keys.forEach(k => {
      const angle = (k.angle * Math.PI) / 180 - Math.PI / 2;
      const kx = cx + (r - 30) * Math.cos(angle);
      const ky = cy + (r - 30) * Math.sin(angle);
      svg += `<g class="diagram-node" id="node-${blockId}-${k.id}">
        <rect x="${kx - 24}" y="${ky - 10}" width="48" height="20" rx="4" fill="#f8717122" stroke="#f87171" stroke-width="1"/>
        <text x="${kx}" y="${ky + 4}" text-anchor="middle" fill="#f87171" font-size="9" font-weight="500" font-family="Inter, sans-serif">${k.label}</text>
      </g>`;
    });

    svg += `</svg>`;
    return svg;
  },

  // Step navigation
  _getStepData(blockId) {
    // Find the diagram block data
    const diagramEl = document.getElementById(`diagram-${blockId}`);
    if (!diagramEl) return null;
    return diagramEl;
  },

  setStep(blockId, stepIndex, config) {
    if (!config || !config.steps) return;
    const steps = config.steps;
    if (stepIndex < 0 || stepIndex >= steps.length) return;

    const step = steps[stepIndex];
    const stepNumEl = document.getElementById(`step-num-${blockId}`);
    const stepTextEl = document.getElementById(`step-text-${blockId}`);

    if (stepNumEl) stepNumEl.textContent = `Step ${stepIndex + 1} of ${steps.length}`;
    if (stepTextEl) {
      stepTextEl.style.opacity = '0';
      setTimeout(() => {
        stepTextEl.textContent = step.text;
        stepTextEl.style.opacity = '1';
        stepTextEl.style.transition = 'opacity 0.3s ease';
      }, 150);
    }

    // Reset all nodes
    const allNodes = document.querySelectorAll(`[id^="node-${blockId}-"]`);
    allNodes.forEach(node => {
      node.style.opacity = '0.35';
      node.style.transform = '';
      const rect = node.querySelector('rect');
      const circle = node.querySelector('circle');
      if (rect) { rect.style.filter = ''; rect.style.strokeWidth = ''; }
      if (circle) { circle.style.filter = ''; circle.style.strokeWidth = ''; }
    });

    // Reset all edges
    const allEdges = document.querySelectorAll(`[id^="edge-${blockId}-"]`);
    allEdges.forEach(edge => {
      edge.style.opacity = '0.2';
      const line = edge.querySelector('line');
      if (line) {
        line.style.stroke = '#334155';
        line.style.strokeDasharray = line.getAttribute('stroke-dasharray') || '';
        line.setAttribute('marker-end', `url(#arrow-${blockId})`);
      }
    });

    // Highlight step nodes
    if (step.highlight) {
      step.highlight.forEach(nodeId => {
        const nodeEl = document.getElementById(`node-${blockId}-${nodeId}`);
        if (nodeEl) {
          nodeEl.style.opacity = '1';
          const rect = nodeEl.querySelector('rect');
          const circle = nodeEl.querySelector('circle');
          if (rect) { rect.style.filter = 'drop-shadow(0 0 8px rgba(99, 102, 241, 0.3))'; }
          if (circle) { circle.style.filter = 'drop-shadow(0 0 8px rgba(99, 102, 241, 0.3))'; }
        }
      });
    }

    // Highlight step edges
    if (step.edgeHighlight) {
      step.edgeHighlight.forEach(edgeIdx => {
        const edgeEl = document.getElementById(`edge-${blockId}-${edgeIdx}`);
        if (edgeEl) {
          edgeEl.style.opacity = '1';
          const line = edgeEl.querySelector('line');
          if (line) {
            line.style.stroke = '#6366f1';
            line.style.strokeDasharray = '8 4';
            line.style.animation = 'dashFlow 1s linear infinite';
            line.setAttribute('marker-end', `url(#arrow-hl-${blockId})`);
          }
        }
      });
    }
  },

  nextStep(blockId) {
    const state = DiagramRenderer._states[blockId];
    if (!state) return;
    state.currentStep = Math.min(state.currentStep + 1, state.config.steps.length - 1);
    this.setStep(blockId, state.currentStep, state.config);
  },

  prevStep(blockId) {
    const state = DiagramRenderer._states[blockId];
    if (!state) return;
    state.currentStep = Math.max(state.currentStep - 1, 0);
    this.setStep(blockId, state.currentStep, state.config);
  },

  toggleAutoPlay(blockId) {
    const state = DiagramRenderer._states[blockId];
    if (!state) return;
    const btn = document.getElementById(`autoplay-${blockId}`);

    if (state.autoPlayInterval) {
      clearInterval(state.autoPlayInterval);
      state.autoPlayInterval = null;
      if (btn) {
        btn.classList.remove('block-diagram__btn--active');
        btn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="5 3 19 12 5 21 5 3"/></svg> Play`;
      }
    } else {
      state.autoPlayInterval = setInterval(() => {
        state.currentStep = (state.currentStep + 1) % state.config.steps.length;
        this.setStep(blockId, state.currentStep, state.config);
      }, 2500);
      if (btn) {
        btn.classList.add('block-diagram__btn--active');
        btn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg> Pause`;
      }
    }
  },

  // Track state per diagram
  _states: {},

  initDiagram(blockId, config) {
    this._states[blockId] = {
      currentStep: 0,
      config: config,
      autoPlayInterval: null
    };
    // Initialize first step after a short delay to let DOM render
    setTimeout(() => {
      this.setStep(blockId, 0, config);
    }, 100);
  },

  cleanup() {
    Object.values(this._states).forEach(state => {
      if (state.autoPlayInterval) clearInterval(state.autoPlayInterval);
    });
    this._states = {};
  }
};
