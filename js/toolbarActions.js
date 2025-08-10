// js/toolbarActions.js

import { uploadedFiles } from './fileHandler.js';
import { gallery, searchReplaceBtn, deleteDuplicatesBtn } from './domRefs.js';


export function setupReplaceAction() {
  searchReplaceBtn.addEventListener("click", () => {
    const from = prompt("Replace which word?");
    if (!from) return;

    const to = prompt(`Replace "${from}" with:`);
    if (to === null) return;

    Object.keys(uploadedFiles.captions).forEach(baseName => {
      const current = uploadedFiles.captions[baseName];
      const updated = current.split(from).join(to);
      uploadedFiles.captions[baseName] = updated;

      const captionBox = gallery.querySelector(`.caption[data-filename="${baseName}"]`);
      if (captionBox) captionBox.textContent = updated;
    });

    alert(`Replaced "${from}" with "${to}"`);
  });

}


export function setupDuplicateRemover() {
  deleteDuplicatesBtn.addEventListener("click", () => {
    const seen = {};
    let removed = 0;

    [...gallery.children].forEach(card => {
      const nameDiv = card.querySelector(".filename");
      if (!nameDiv) return;

      const filename = nameDiv.textContent.trim();
      const baseName = filename
        .replace(/\.[^/.]+$/, "")
        .toLowerCase()
        .replace(/\s*\(\d+\)|_copy|\s*copy/i, "");

      const file = uploadedFiles.images[baseName];
      if (!file) return;

      const key = `${baseName}_${file.size}`;
      if (seen[key]) {
        gallery.removeChild(card);
        delete uploadedFiles.images[baseName];
        delete uploadedFiles.captions[baseName];
        removed++;
      } else {
        seen[key] = true;
      }
    });

    alert(`🧹 Removed ${removed} suspected duplicate image(s).`);
  });
}

export function setupRenameFiles() {
  renameFilesBtn.addEventListener("click", () => {
    const baseName = prompt("Enter base name for renaming files (e.g., img_):");
    if (!baseName) return;

    const imageKeys = Object.keys(uploadedFiles.images);
    imageKeys.forEach((oldBaseName, index) => {
      const newBaseName = `${baseName}${String(index + 1).padStart(3, "0")}`;
      const imageFile = uploadedFiles.images[oldBaseName];
      const captionText = uploadedFiles.captions[oldBaseName];

      // Update internal structure
      uploadedFiles.images[newBaseName] = imageFile;
      uploadedFiles.captions[newBaseName] = captionText;
      delete uploadedFiles.images[oldBaseName];
      delete uploadedFiles.captions[oldBaseName];

      // Update DOM
      const captionBox = gallery.querySelector(`.caption[data-filename="${oldBaseName}"]`);
      if (captionBox) {
        captionBox.setAttribute("data-filename", newBaseName);
        const filenameDiv = captionBox.parentElement.querySelector(".filename");
        if (filenameDiv) filenameDiv.textContent = `${newBaseName}.jpg`;
      }
    });

    alert(`✅ Renamed ${imageKeys.length} files using base name "${baseName}"`);
  });
}
import { downloadZipBtn } from './domRefs.js';

export function setupDownloadZip() {
  downloadZipBtn.addEventListener("click", async () => {
    const JSZip = (await import("https://cdn.jsdelivr.net/npm/jszip@3.10.1/+esm")).default;

    const zip = new JSZip();
    const imgFolder = zip.folder("images");
    const txtFolder = zip.folder("captions");

    const entries = Object.entries(uploadedFiles.images);
    if (entries.length === 0) {
      alert("No images to export!");
      return;
    }

    for (const [baseName, imageFile] of entries) {
      const caption = uploadedFiles.captions[baseName] || "";

      const imgBlob = await imageFile.arrayBuffer();
      imgFolder.file(imageFile.name, imgBlob);

      const captionBlob = new Blob([caption], { type: "text/plain" });
      txtFolder.file(`${baseName}.txt`, captionBlob);
    }

    const zipBlob = await zip.generateAsync({ type: "blob" });
    const url = URL.createObjectURL(zipBlob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "captions_and_images.zip";
    a.click();
    URL.revokeObjectURL(url);
  });
}


export function setupTriggerAdder() {
  addTriggerBtn.addEventListener("click", () => {
    const trigger = prompt("Enter the trigger word to add:");
    if (!trigger) return;

    let added = 0;

    Object.entries(uploadedFiles.captions).forEach(([baseName, caption]) => {
      if (!caption.startsWith(trigger)) {
        const updated = `${trigger} ${caption}`;
        uploadedFiles.captions[baseName] = updated;

        const captionBox = gallery.querySelector(`.caption[data-filename="${baseName}"]`);
        if (captionBox) captionBox.textContent = updated;

        added++;
      }
    });

    alert(`✅ Trigger "${trigger}" added to ${added} captions.`);
  });
}
