// DOM references
const dropzone = document.getElementById("dropzone");
const fileInput = document.getElementById("fileInput");
const gallery = document.getElementById("gallery");
const previewModal = document.getElementById("previewModal");
const previewImage = document.getElementById("previewImage");
const closeBtn = document.getElementById("closeBtn");
const myTokensContainer = document.getElementById("myTokens");

let currentZipName = "captions_and_images";
let activeCaptionBox = null;

const uploadedFiles = {
  images: {},
  captions: {}
};

// Drag and Drop
dropzone.addEventListener("dragover", e => {
  e.preventDefault();
  dropzone.classList.add("hover");
});
dropzone.addEventListener("dragleave", () => dropzone.classList.remove("hover"));
dropzone.addEventListener("drop", e => {
  e.preventDefault();
  dropzone.classList.remove("hover");
  handleFiles(e.dataTransfer.files);
});
fileInput.addEventListener("change", () => handleFiles(fileInput.files));
dropzone.addEventListener("click", () => fileInput.click());

// Modal
closeBtn.addEventListener("click", () => previewModal.classList.add("hidden"));
document.addEventListener("keydown", e => {
  if (e.key === "Escape") previewModal.classList.add("hidden");
});

// Close modal by clicking outside the image
previewModal.addEventListener("click", () => {
  previewModal.classList.add("hidden");
});

// File extension helper
function getFileExtension(filename) {
  return filename.slice(filename.lastIndexOf('.'));
}

// File handler
function handleFiles(fileList) {
  const files = Array.from(fileList);
  const images = files.filter(f => f.type.startsWith("image/"));
  const captions = files.filter(f => f.name.endsWith(".txt"));

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
        img.addEventListener("click", () => {
          previewImage.src = img.src;
          previewModal.classList.remove("hidden");
        });

        const imageWrapper = document.createElement("div");
        imageWrapper.className = "image-container";
        imageWrapper.appendChild(img);

        const nameLabel = document.createElement("div");
        nameLabel.className = "filename";
        nameLabel.textContent = `${baseName}${getFileExtension(imageFile.name)}`;

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

        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.className = "select-checkbox";
        checkbox.title = "Select this image";

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

          createToken(selectedText);
        });

        const controlsRow = document.createElement("div");
        controlsRow.className = "card-controls";
        controlsRow.append(checkbox, deleteBtn, keepBtn);

        card.append(nameLabel, imageWrapper, controlsRow, captionBox);
        gallery.appendChild(card);
      };

      reader.readAsDataURL(imageFile);
    });
  });
}

function createToken(token) {
  const existingTokens = Array.from(myTokensContainer.querySelectorAll(".token-btn span"))
    .map(span => span.textContent);
  if (existingTokens.includes(token)) {
    alert("⚠️ This token already exists.");
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

    if (selectedCards.length > 0) {
      selectedCards.forEach(card => {
        const captionBox = card.querySelector(".caption");
        const baseName = captionBox.dataset.filename;
        const space = captionBox.textContent && !captionBox.textContent.endsWith(" ") ? " " : "";
        captionBox.textContent += space + token;
        uploadedFiles.captions[baseName] = captionBox.textContent;
      });
    } else if (activeCaptionBox) {
      const space = activeCaptionBox.textContent && !activeCaptionBox.textContent.endsWith(" ") ? " " : "";
      activeCaptionBox.textContent += space + token;
      uploadedFiles.captions[activeCaptionBox.dataset.filename] = activeCaptionBox.textContent;
    } else {
      alert("No caption selected.");
    }
  });

  tokenBtn.append(span, x);
  myTokensContainer.appendChild(tokenBtn);
  newTokenInput.value = "";
}
