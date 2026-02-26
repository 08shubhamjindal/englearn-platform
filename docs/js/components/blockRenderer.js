// Block Renderer — renders each content block by type
const BlockRenderer = {
  _diagramCounter: 0,

  resetCounter() {
    this._diagramCounter = 0;
  },

  render(block, paperId) {
    switch (block.type) {
      case 'text':
        return this.renderText(block);
      case 'heading':
        return this.renderHeading(block);
      case 'callout':
        return this.renderCallout(block);
      case 'code':
        return this.renderCode(block);
      case 'list':
        return this.renderList(block);
      case 'diagram':
        return this.renderDiagram(block, paperId);
      case 'playground':
        return this.renderPlayground(block, paperId);
      default:
        return '';
    }
  },

  renderText(block) {
    return `<div class="block block-text animate-fade-in">${block.content}</div>`;
  },

  renderHeading(block) {
    return `<h3 class="block block-heading animate-fade-in">${block.content}</h3>`;
  },

  renderCallout(block) {
    return `
      <div class="block block-callout block-callout--${block.variant} animate-fade-in">
        <div class="block-callout__title">${block.title}</div>
        <div class="block-callout__text">${block.text}</div>
      </div>
    `;
  },

  renderCode(block) {
    return `
      <div class="block block-code animate-fade-in">
        <div class="block-code__header">
          <span>${block.language || 'code'}</span>
          <span>${block.title || ''}</span>
        </div>
        <pre class="block-code__content"><code>${block.content}</code></pre>
      </div>
    `;
  },

  renderList(block) {
    const items = block.items.map(item => `<li>${item}</li>`).join('');
    return `<ul class="block block-list animate-fade-in">${items}</ul>`;
  },

  renderDiagram(block, paperId) {
    this._diagramCounter++;
    const blockId = `${paperId}-${this._diagramCounter}`;
    const html = DiagramRenderer.render(block, blockId);
    
    // Schedule initialization after render
    setTimeout(() => {
      DiagramRenderer.initDiagram(blockId, block.config);
    }, 200);

    return html;
  },

  _playgroundCounter: 0,

  renderPlayground(block, paperId) {
    this._playgroundCounter++;
    const blockId = `${paperId}-pg-${this._playgroundCounter}`;
    return PlaygroundRenderer.render(block, blockId);
  }
};
