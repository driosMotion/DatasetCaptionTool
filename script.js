// script.js — now acts as app initializer

import { setupDragDrop } from './js/dragDrop.js';
import { setupModalPreview } from './js/modalPreview.js';
import { setupToolbarActions } from './js/toolbarActions.js';
import { setupTokenManager } from './js/tokenManager.js';
import { setupDownloadZip } from './js/zipDownloader.js';

// Optional: ensure fileHandler and cardControls are loaded
import './js/fileHandler.js';
import './js/cardControls.js';

// ===== App Initialization =====
function initApp() {
  setupDragDrop();
  setupModalPreview();
  setupToolbarActions();
  setupTokenManager();
  setupDownloadZip();

  console.log('✅ Dataset Caption Tool initialized via script.js');
}

// Run app
initApp();
