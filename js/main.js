// js/main.js

import { setupDragAndDrop } from './dragDrop.js';
import { setupModalPreview } from './modalPreview.js';
import { setupTokenManager } from './tokenManager.js';
import { setupReplaceAction, setupDuplicateRemover } from './toolbarActions.js';
import { setupRenameFiles } from './toolbarActions.js';
import { setupDownloadZip } from './zipDownloader.js';
import { setupTriggerAdder } from './toolbarActions.js';



document.addEventListener("DOMContentLoaded", () => {
  setupDragAndDrop();
  setupModalPreview();
  setupTokenManager();
  setupReplaceAction();
  setupDuplicateRemover();
  setupRenameFiles();
  setupDownloadZip();
  setupTriggerAdder();

  
});

