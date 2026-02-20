// ============================================
// Dynamic Paper Loader
// ============================================
// Reads the manifest from PaperRegistry and dynamically
// loads all paper data files before booting the app.
// 
// To add a new paper:
//   1. Create js/data/your-paper.js (call PaperRegistry.register())
//   2. Add 'your-paper' to PaperRegistry._manifest in registry.js
//   That's it. No other files need changes.

const PaperLoader = {
  _version: 7,  // bump to cache-bust all paper files

  /**
   * Load all papers listed in the manifest, then call the callback.
   */
  loadAll(callback) {
    const manifest = PaperRegistry.getManifest();

    if (!manifest || manifest.length === 0) {
      callback();
      return;
    }

    let loaded = 0;
    const total = manifest.length;

    manifest.forEach(fileName => {
      const script = document.createElement('script');
      script.src = `js/data/${fileName}.js?v=${this._version}`;
      script.onload = () => {
        loaded++;
        if (loaded === total) callback();
      };
      script.onerror = () => {
        console.warn(`[PaperLoader] Failed to load: ${fileName}`);
        loaded++;
        if (loaded === total) callback();
      };
      document.body.appendChild(script);
    });
  }
};
