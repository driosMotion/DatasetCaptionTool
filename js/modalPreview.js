// js/modalPreview.js

import { previewModal, previewImage, closeBtn } from './domRefs.js';

export function setupModalPreview() {
  document.addEventListener("click", (e) => {
    if (e.target.tagName === "IMG" && e.target.closest(".image-container")) {
      previewImage.src = e.target.src;
      previewModal.style.display = "flex";
    }
  });

  closeBtn.addEventListener("click", () => {
    previewModal.style.display = "none";
  });
}
