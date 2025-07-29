
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
dropzone.addEventListener("click", () => {
  fileInput.click();
});

// Modal
closeBtn.addEventListener("click", () => previewModal.classList.add("hidden"));
document.addEventListener("keydown", e => {
  if (e.key === "Escape") previewModal.classList.add("hidden");
});

// Cerrar modal haciendo click fuera de la imagen
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
        checkbox.title = "Seleccionar esta imagen";

        const deleteBtn = document.createElement("button");
        deleteBtn.className = "delete-btn";
        deleteBtn.textContent = "🗑️";
        deleteBtn.title = "Delete image and caption";
        let deleteTimeout; // Variable para almacenar el temporizador

        // Al mantener presionado el botón
        deleteBtn.addEventListener("mousedown", () => {
          deleteBtn.classList.add("loading"); // activa la animación visual

          // después de 1 segundo, elimina la tarjeta
          deleteTimeout = setTimeout(() => {
            gallery.removeChild(card);
            delete uploadedFiles.images[baseName];
            delete uploadedFiles.captions[baseName];
          }, 1000);
        });

        // Si el usuario suelta el botón antes de 1 segundo
        deleteBtn.addEventListener("mouseup", cancelDelete);
        deleteBtn.addEventListener("mouseleave", cancelDelete);

        // Función para cancelar la eliminación y la animación
        function cancelDelete() {
          clearTimeout(deleteTimeout); // cancela el temporizador
          deleteBtn.classList.remove("loading"); // detiene la animación visual
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

            // Buscar todos los cards con checkbox marcado
            const selectedCards = [...gallery.querySelectorAll(".card")]
              .filter(card => card.querySelector(".select-checkbox")?.checked);

            // Si hay al menos uno marcado, se aplica a todos
            if (selectedCards.length > 0) {
              selectedCards.forEach(card => {
                const captionBox = card.querySelector(".caption");
                const baseName = captionBox.dataset.filename;
                const space = captionBox.textContent && !captionBox.textContent.endsWith(" ") ? " " : "";
                captionBox.textContent += space + selectedText;
                uploadedFiles.captions[baseName] = captionBox.textContent;
              });
            } else if (activeCaptionBox) {
              // Fallback a comportamiento normal si no hay ninguno seleccionado
              const space = activeCaptionBox.textContent && !activeCaptionBox.textContent.endsWith(" ") ? " " : "";
              activeCaptionBox.textContent += space + selectedText;
              uploadedFiles.captions[activeCaptionBox.dataset.filename] = activeCaptionBox.textContent;
            } else {
              alert("No caption selected.");
            }
          });


          tokenBtn.append(span, x);
          myTokensContainer.appendChild(tokenBtn);
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

// Toolbar functionality
document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("downloadZipBtn")?.addEventListener("click", async () => {
    const zip = new JSZip();

    for (const baseName in uploadedFiles.images) {
      const file = uploadedFiles.images[baseName];
      zip.file(`${baseName}${getFileExtension(file.name)}`, file);
    }

    for (const baseName in uploadedFiles.captions) {
      const text = uploadedFiles.captions[baseName] || "(No caption)";
      zip.file(`${baseName}.txt`, text);
    }

    const content = await zip.generateAsync({ type: "blob" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(content);
    link.download = `${currentZipName}.zip`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  });

  document.getElementById("renameFilesBtn")?.addEventListener("click", () => {
    const newName = prompt("Enter new base name:");
    if (!newName) return;
    currentZipName = newName;

    let counter = 1;
    const pad = (n, l) => n.toString().padStart(l, "0");
    const newImages = {}, newCaptions = {};

    [...gallery.children].forEach(card => {
      const nameDiv = card.querySelector(".filename");
      const captionDiv = card.querySelector(".caption");
      const oldBase = nameDiv.textContent.replace(/\.[^/.]+$/, "");
      const ext = getFileExtension(uploadedFiles.images[oldBase]?.name || ".jpg");
      const newBase = `${newName}_${pad(counter++, 3)}`;

      nameDiv.textContent = newBase + ext;
      captionDiv.dataset.filename = newBase;

      const file = uploadedFiles.images[oldBase];
      if (file) {
        Object.defineProperty(file, "name", { value: newBase + ext, writable: true });
        newImages[newBase] = file;
      }

      newCaptions[newBase] = uploadedFiles.captions[oldBase];
    });

    uploadedFiles.images = newImages;
    uploadedFiles.captions = newCaptions;

    alert("✅ Files renamed.");
  });

  document.getElementById("deleteDuplicatesBtn")?.addEventListener("click", () => {
    const seen = {}, removed = [];
    [...gallery.children].forEach(card => {
      const nameDiv = card.querySelector(".filename");
      if (!nameDiv) return;

      const filename = nameDiv.textContent.trim();
      const baseName = filename.replace(/\.[^/.]+$/, "").toLowerCase().replace(/\s*\(\d+\)|_copy|\s*copy/i, "");
      const file = uploadedFiles.images[baseName];
      if (!file) return;

      const key = `${baseName}_${file.size}`;
      if (seen[key]) {
        gallery.removeChild(card);
        delete uploadedFiles.images[baseName];
        delete uploadedFiles.captions[baseName];
        removed.push(baseName);
      } else {
        seen[key] = true;
      }
    });

    alert(`🧹 Removed ${removed.length} suspected duplicates.`);
  });

  document.getElementById("addTriggerBtn")?.addEventListener("click", () => {
    const trigger = prompt("Enter trigger word:");
    if (!trigger) return;

    [...gallery.children].forEach(card => {
      const captionDiv = card.querySelector(".caption");
      const baseName = captionDiv.dataset.filename;
      const caption = uploadedFiles.captions[baseName];
      if (!caption.startsWith(trigger)) {
        const updated = `${trigger} ${caption}`;
        captionDiv.textContent = updated;
        uploadedFiles.captions[baseName] = updated;
      }
    });

    alert(`✅ Trigger "${trigger}" added to all captions.`);
  });

  document.getElementById("searchReplaceBtn")?.addEventListener("click", () => {
    const search = prompt("Word to search?");
    if (!search) return;
    const replace = prompt(`Replace "${search}" with:`);
    if (replace === null) return;

    let count = 0;
    [...gallery.children].forEach(card => {
      const captionDiv = card.querySelector(".caption");
      const baseName = captionDiv.dataset.filename;
      const original = uploadedFiles.captions[baseName];
      if (original.includes(search)) {
        const updated = original.split(search).join(replace);
        captionDiv.textContent = updated;
        uploadedFiles.captions[baseName] = updated;
        count++;
      }
    });

    alert(`🔁 ${count} replacements made.`);
  });
});
const newTokenInput = document.getElementById("newTokenInput");
const addTokenBtn = document.getElementById("addTokenBtn");

addTokenBtn.addEventListener("click", () => {
  const token = newTokenInput.value.trim();
  if (!token) return;

  const existingTokens = Array.from(myTokensContainer.querySelectorAll(".token-btn span"))
    .map(span => span.textContent);
  if (existingTokens.includes(token)) {
    alert("⚠️ Ese token ya existe.");
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
});


function createToken(token) {
  const existingTokens = Array.from(myTokensContainer.querySelectorAll(".token-btn span"))
    .map(span => span.textContent);
  if (existingTokens.includes(token)) {
    alert("⚠️ Ese token ya existe.");
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

addTokenBtn.addEventListener("click", () => {
  const token = newTokenInput.value.trim();
  if (token) createToken(token);
});

newTokenInput.addEventListener("keydown", e => {
  if (e.key === "Enter") {
    e.preventDefault();
    const token = newTokenInput.value.trim();
    if (token) createToken(token);
  }
});
