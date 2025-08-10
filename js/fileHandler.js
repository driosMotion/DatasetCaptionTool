// js/fileHandler.js

import { createCardControls } from './cardControls.js';
import { gallery } from './domRefs.js';

export const uploadedFiles = {
  images: {},
  captions: {}
};

export let activeCaptionBox = null;

export function handleFiles(fileList) {
  console.log("📦 handleFiles() called with:", fileList); // ✅ visible log

  const files = Array.from(fileList);
  const images = files.filter(f => f.type.startsWith("image/"));
  const captions = files.filter(f => f.name.endsWith(".txt"));

  console.log("🖼️ Images:", images);
  console.log("📝 Captions:", captions);

  const captionMap = {};

  const captionPromises = captions.map(file => {
    const baseName = file.name.replace(/\.[^/.]+$/, "").toLowerCase();
    uploadedFiles.captions[baseName] = "";

    return new Promise(resolve => {
      const reader = new FileReader();
      reader.onload = () => {
        const content = reader.result.trim();
        captionMap[baseName] = content;
        uploadedFiles.captions[baseName] = content;
        resolve();
      };
      reader.readAsText(file);
    });
  });

  Promise.all(captionPromises).then(() => {
    images.forEach(imageFile => {
      const baseName = imageFile.name.replace(/\.[^/.]+$/, "").toLowerCase();
      uploadedFiles.images[baseName] = imageFile;

      const reader = new FileReader();
      reader.onload = () => {
        const card = document.createElement("div");
        card.className = "card";

        const img = document.createElement("img");
        img.src = reader.result;

        const imageWrapper = document.createElement("div");
        imageWrapper.className = "image-container";
        imageWrapper.appendChild(img);

        const nameLabel = document.createElement("div");
        nameLabel.className = "filename";
        nameLabel.textContent = imageFile.name;

        const captionText = captionMap[baseName] || "(No caption)";
        const captionBox = document.createElement("div");
        captionBox.className = "caption";
        captionBox.contentEditable = "true";
        captionBox.textContent = captionText;
        captionBox.setAttribute("data-filename", baseName);

        captionBox.addEventListener("input", () => {
          uploadedFiles.captions[baseName] = captionBox.textContent;
        });
        captionBox.addEventListener("focus", () => {
          activeCaptionBox = captionBox;
        });

        const controlsRow = createCardControls(card, baseName, captionBox);
        card.append(nameLabel, imageWrapper, controlsRow, captionBox);

        gallery.appendChild(card);
      };

      reader.readAsDataURL(imageFile);
    });
  });
}
