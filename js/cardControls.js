// js/cardControls.js

import { uploadedFiles, activeCaptionBox } from './fileHandler.js';
import { gallery, myTokensContainer } from './domRefs.js';

export function createCardControls(card, baseName, captionBox) {
  const controlsRow = document.createElement("div");
  controlsRow.className = "card-controls";

  // ✅ Checkbox
  const checkbox = document.createElement("input");
  checkbox.type = "checkbox";
  checkbox.className = "select-checkbox";
  checkbox.title = "Select this image";

  // ✅ Delete button
  const deleteBtn = document.createElement("button");
  deleteBtn.className = "delete-btn";
  deleteBtn.textContent = "🗑️";
  deleteBtn.title = "Delete image and caption";

  let deleteTimeout;
  deleteBtn.addEventListener("mousedown", () => {
    deleteBtn.classList.add("loading");
    deleteTimeout = setTimeout(() => {
      gallery.removeChild(card);
      delete uploadedFiles.images[baseName];
      delete uploadedFiles.captions[baseName];
    }, 1000);
  });
  deleteBtn.addEventListener("mouseup", cancelDelete);
  deleteBtn.addEventListener("mouseleave", cancelDelete);
  function cancelDelete() {
    clearTimeout(deleteTimeout);
    deleteBtn.classList.remove("loading");
  }

  // ✅ Keep token button
  const keepBtn = document.createElement("button");
  keepBtn.className = "keep-btn";
  keepBtn.textContent = "Keep Token";
  keepBtn.title = "Add selected text to My Tokens";

  keepBtn.addEventListener("click", () => {
    const selection = window.getSelection();
    const selectedText = selection ? selection.toString().trim() : "";
    if (!selectedText) return alert("⚠️ Select some text in the caption first.");

    const existingTokens = Array.from(myTokensContainer.querySelectorAll(".token-btn span"))
      .map(span => span.textContent);
    if (existingTokens.includes(selectedText)) return alert("⚠️ Token already exists.");

    const tokenBtn = document.createElement("div");
    tokenBtn.className = "token-btn";
    tokenBtn.title = "Click to use this token";

    const span = document.createElement("span");
    span.textContent = selectedText;

    const x = document.createElement("span");
    x.className = "delete-token";
    x.textContent = "✖";
    x.title = "Remove this token";
    x.addEventListener("click", e => {
      e.stopPropagation();
      tokenBtn.remove();
    });

    tokenBtn.addEventListener("click", e => {
      if (e.target.classList.contains("delete-token")) return;

      const selectedCards = [...gallery.querySelectorAll(".card")]
        .filter(card => card.querySelector(".select-checkbox")?.checked);

      const applyTo = selectedCards.length > 0 ? selectedCards : (activeCaptionBox ? [activeCaptionBox] : []);

      if (applyTo.length === 0) {
        alert("No caption selected.");
        return;
      }

      applyTo.forEach(target => {
        const box = target.classList.contains("caption") ? target : target.querySelector(".caption");
        const base = box.dataset.filename;
        const space = box.textContent && !box.textContent.endsWith(" ") ? " " : "";
        box.textContent += space + selectedText;
        uploadedFiles.captions[base] = box.textContent;
      });
    });

    tokenBtn.append(span, x);
    myTokensContainer.appendChild(tokenBtn);
  });

  controlsRow.append(checkbox, deleteBtn, keepBtn);
  return controlsRow;
}
