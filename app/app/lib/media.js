// app/app/lib/media.js

// --- helpers ---
const base = (name) => (name || '').toLowerCase().replace(/\.[^.]+$/, '');

// ---------- Image processing ----------
export async function maybeDownscale(file, maxDim = 2000, targetType = 'image/jpeg') {
  if (!file?.type?.startsWith?.('image/')) return file;

  const dataUrl = await new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(r.result);
    r.onerror = rej;
    r.readAsDataURL(file);
  });

  const img = await new Promise((res, rej) => {
    const el = new Image();
    el.onload = () => res(el);
    el.onerror = rej;
    el.src = dataUrl;
  });

  const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
  const w = Math.round(img.width * scale);
  const h = Math.round(img.height * scale);

  if (scale === 1 && file.type === targetType) return file;

  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(img, 0, 0, w, h);

  for (const q of [0.9, 0.8, 0.7, 0.6]) {
    const blob = await new Promise((res) => canvas.toBlob(res, targetType, q));
    if (blob && blob.size < 9 * 1024 * 1024) {
      return new File([blob], file.name.replace(/\.[^.]+$/, '.jpg'), { type: targetType });
    }
  }
  const blob = await new Promise((res) => canvas.toBlob(res, targetType, 0.6));
  return new File([blob], file.name.replace(/\.[^.]+$/, '.jpg'), { type: targetType });
}

// ---------- Upload (images + .txt captions) ----------
// Feature: if a .txt and photo share the same base name, the .txt becomes the image's caption
export async function uploadFiles({
  fileList,
  projectId,
  BUCKET,
  pendingCaptions,
  images,
  setImages,
  setPendingCaptions,
  setStatus,
  supabase,
  fetchImages,
}) {
  try {
    if (!projectId) { setStatus('Select a project first'); return; }
    if (!fileList?.length) { setStatus('No files to upload'); return; }

    setStatus(`Uploading ${fileList.length} file(s)…`);
    let uploaded = 0;
    let appliedCaptions = 0;

    const files = Array.from(fileList);
    const justInserted = {}; // baseName -> inserted image id (same-batch)

    for (const f of files) {
      const isImage = f.type?.startsWith('image/');
      const isTxt = /\.txt$/i.test(f.name);

      // ---------- IMAGE ----------
      if (isImage) {
        const processed = await maybeDownscale(f);
        const name = `${crypto.randomUUID()}-${processed.name}`;
        const path = `projects/${projectId}/${name}`;

        const up = await supabase.storage.from(BUCKET).upload(path, processed, { upsert: false });
        if (up.error) { setStatus(up.error.message); return; }

        const { data: inserted, error: insErr } = await supabase
          .from('images')
          .insert({
            project_id: projectId,
            s3_key: path,
            original_name: f.name,
            mime: processed.type,
            caption: ''
          })
          .select()
          .single();
        if (insErr) { setStatus(insErr.message); return; }

        uploaded++;
        const baseName = base(f.name);
        justInserted[baseName] = inserted.id;

        // If a matching .txt was seen earlier in the batch, apply it now
        const pending = pendingCaptions[baseName];
        if (pending) {
          const { error: capErr } = await supabase
            .from('images')
            .update({ caption: pending })
            .eq('id', inserted.id);
          if (capErr) { setStatus(capErr.message); return; }
          appliedCaptions++;

          // Reflect in UI if the image is already in state; otherwise fetch at the end will bring it in
          setImages((prev) =>
            prev.map((img) => (img.id === inserted.id ? { ...img, caption: pending } : img))
          );
          setPendingCaptions((prev) => {
            const copy = { ...prev };
            delete copy[baseName];
            return copy;
          });
        }
        continue;
      }

      // ---------- TXT ----------
      if (isTxt) {
        const text = await f.text();
        const baseName = base(f.name);

        // 1) Try images already in UI
        let targetId =
          images.find((img) => base(img.original_name || img.s3_key.split('/').pop()) === baseName)
            ?.id;

        // 2) Or image inserted earlier in this same batch
        if (!targetId && justInserted[baseName]) targetId = justInserted[baseName];

        if (targetId) {
          const { error } = await supabase
            .from('images')
            .update({ caption: text })
            .eq('id', targetId);
          if (error) { setStatus(error.message); return; }
          appliedCaptions++;

          // Immediate UI update if target is already rendered
          setImages((prev) =>
            prev.map((img) => (img.id === targetId ? { ...img, caption: text } : img))
          );
        } else {
          // 3) Image not present yet — stash for later (will be picked up when the image arrives)
          setPendingCaptions((prev) => ({ ...prev, [baseName]: text }));
        }
        continue;
      }

      // ---------- UNSUPPORTED ----------
      setStatus(`Skipped unsupported file: ${f.name}`);
    }

    await fetchImages(projectId);
    setStatus(`Uploaded ${uploaded} image(s) • Applied ${appliedCaptions} caption(s)`);
  } catch (err) {
    setStatus(`Upload error: ${String(err?.message || err)}`);
  }
}

// ---------- ZIP (images + captions) ----------
export async function downloadZip({ images, projectId, BUCKET, supabase, setStatus }) {
  if (!projectId) return setStatus('Select a project first');
  if (!images?.length) return setStatus('No images to download');

  setStatus('Preparing ZIP…');

  const JSZip = (await import('jszip')).default;
  const fs = await import('file-saver');
  const saveAs = fs.default || fs.saveAs;
  const zip = new JSZip();

  for (const img of images) {
    const fname = img.original_name || img.s3_key.split('/').pop();
    const urlRes = await supabase.storage.from(BUCKET).createSignedUrl(img.s3_key, 600);
    const imgResp = await fetch(urlRes.data.signedUrl);
    const blob = await imgResp.blob();
    zip.file(fname, blob);

    const b = base(fname);
    const caption = (img.caption || '').trim();
    if (caption) zip.file(`${b}.txt`, caption);
  }

  const content = await zip.generateAsync({ type: 'blob' });
  saveAs(content, `project-${projectId}.zip`);
  setStatus('ZIP ready');
}

// ---------- Duplicates ----------
async function sha1OfBlob(blob) {
  const buf = await blob.arrayBuffer();
  const hash = await crypto.subtle.digest('SHA-1', buf);
  const bytes = new Uint8Array(hash);
  return Array.from(bytes).map((b) => b.toString(16).padStart(2, '0')).join('');
}

export async function findDuplicates({ images, projectId, BUCKET, supabase, setStatus, fetchImages }) {
  if (!projectId) return setStatus('Select a project first');
  if (!images || images.length < 2) return setStatus('Not enough images to compare');
  setStatus('Scanning for duplicates… (this may take a moment)');

  const groups = {}; // hash -> [img, ...]
  for (const img of images) {
    const { data } = await supabase.storage.from(BUCKET).createSignedUrl(img.s3_key, 600);
    const resp = await fetch(data.signedUrl);
    const blob = await resp.blob();
    const h = await sha1OfBlob(blob);
    (groups[h] ||= []).push(img);
  }

  const dupGroups = Object.values(groups).filter((arr) => arr.length > 1);
  if (dupGroups.length === 0) { setStatus('No duplicates found'); return; }

  const totalDupes = dupGroups.reduce((acc, g) => acc + (g.length - 1), 0);
  const ok = confirm(`Found ${totalDupes} duplicate file(s) across ${dupGroups.length} group(s).\nDelete duplicates keeping ONE copy per group?`);
  if (!ok) { setStatus('Duplicate scan finished (no deletion)'); return; }

  for (const group of dupGroups) {
    const toDelete = group.slice(1); // keep the first
    for (const img of toDelete) {
      const { error: dbErr } = await supabase.from('images').delete().eq('id', img.id);
      if (dbErr) return setStatus(dbErr.message);
      const { error: stErr } = await supabase.storage.from(BUCKET).remove([img.s3_key]);
      if (stErr) return setStatus(stErr.message);
    }
  }
  await fetchImages(projectId);
  setStatus(`Deleted ${totalDupes} duplicate(s)`);
}

// ---------- Rename files ----------
export async function renameFiles({ images, projectId, BUCKET, supabase, setStatus, fetchImages }) {
  if (!projectId) return setStatus('Select a project first');
  if (!images?.length) return setStatus('No files to rename');

  const baseName = prompt('Base name (e.g., "Example"):');
  if (!baseName) return;

  // stable order (oldest -> newest)
  const ordered = [...images].sort((a, b) => (a.created_at || '').localeCompare(b.created_at || ''));
  const pad = Math.max(3, String(ordered.length).length);
  let changed = 0;
  setStatus('Renaming files…');

  for (let i = 0; i < ordered.length; i++) {
    const img = ordered[i];
    const oldName = img.original_name || img.s3_key.split('/').pop();
    const ext = (oldName.match(/\.[^.]+$/)?.[0] || '.jpg').toLowerCase();

    const newName = `${baseName}_${String(i + 1).padStart(pad, '0')}${ext}`;
    const oldPath = img.s3_key;
    const dir = oldPath.substring(0, oldPath.lastIndexOf('/') + 1);
    const newPath = dir + newName;

    if (newPath === oldPath) continue;

    const { error: moveErr } = await supabase.storage.from(BUCKET).move(oldPath, newPath);
    if (moveErr) { setStatus(`Rename failed for ${oldName}: ${moveErr.message}`); return; }

    const { error: dbErr } = await supabase
      .from('images')
      .update({ s3_key: newPath, original_name: newName })
      .eq('id', img.id);
    if (dbErr) { setStatus(`DB update failed for ${oldName}: ${dbErr.message}`); return; }

    changed++;
  }

  await fetchImages(projectId);
  setStatus(`Renamed ${changed} file(s)`);
}
