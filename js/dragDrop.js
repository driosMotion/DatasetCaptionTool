// js/dragDrop.js

import { dropzone, fileInput } from './domRefs.js';
import { handleFiles } from './fileHandler.js';

export function setupDragAndDrop() {
  dropzone.addEventListener("dragover", e => {
    e.preventDefault();
    dropzone.classList.add("hover");
  });

  dropzone.addEventListener("dragleave", () => {
    dropzone.classList.remove("hover");
  });

  dropzone.addEventListener("drop", e => {
    e.preventDefault();
    dropzone.classList.remove("hover");
    handleFiles(e.dataTransfer.files);
  });

  dropzone.addEventListener("click", () => {
    console.log("🖱️ Dropzone clicked");
    fileInput.click();
  });

  fileInput.addEventListener("change", () => {
    console.log("📤 Files selected:", fileInput.files);
    handleFiles(fileInput.files); // 🧠 ✅ this line is key
  });
}
