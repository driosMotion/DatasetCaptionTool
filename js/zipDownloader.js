// js/zipDownloader.js

import { downloadZipBtn } from './domRefs.js';
import { uploadedFiles } from './fileHandler.js';

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
