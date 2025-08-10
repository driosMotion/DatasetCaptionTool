// js/tokenManager.js

import { newTokenInput, addTokenBtn, myTokensContainer, gallery } from './domRefs.js';
import { uploadedFiles, activeCaptionBox } from './fileHandler.js';

export function setupTokenManager() {
  addTokenBtn.addEventListener("click", () => {
    const tokens = newTokenInput.value.split(",").map(t => t.trim()).filter(Boolean);
    tokens.forEach(createToken);
    newTokenInput.value = "";
  });

  newTokenInput.addEventListener("keydown", e => {
    if (e.key === "Enter") {
      e.preventDefault();
      const tokens = newTokenInput.value.split(",").map(t => t.trim()).filter(Boolean);
      tokens.forEach(createToken);
      newTokenInput.value = "";
    }
  });
}

function createToken(token) {
  const existing = Array.from(myTokensContainer.querySelectorAll(".token-btn span"))
    .map(span => span.textContent);
  if (existing.includes(token)) {
    alert("⚠️ Token already exists.");
    return;
  }

  const tokenBtn = document.createElement("div");
  tokenBtn.className = "token-btn";
  tokenBtn.title = "Click to use this token";

  const span = document.createElement("span");
  span.textContent = token;

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
      const captionBox = target.classList.contains("caption") ? target : target.querySelector(".caption");
      const baseName = captionBox.dataset.filename;
      const space = captionBox.textContent && !captionBox.textContent.endsWith(" ") ? " " : "";
      captionBox.textContent += space + token;
      uploadedFiles.captions[baseName] = captionBox.textContent;
    });
  });

  tokenBtn.append(span, x);
  myTokensContainer.appendChild(tokenBtn);
}
