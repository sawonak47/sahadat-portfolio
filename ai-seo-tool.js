/* ═══════════════════════════════════════════════════════════════
   SAHADAT AI — AI SEO TOOL ENGINE (ai-seo-tool.js)
   Supports: PNG, JPG, JPEG, WEBP, GIF, SVG, PDF
   Engine Branding: "Sahadat AI"
   ═══════════════════════════════════════════════════════════════ */

'use strict';

(() => {
  // ── SAHADAT AI CONFIGURATION ──
  // For public GitHub Pages deployment, set proxyUrl to your deployed worker/sahadat-ai-proxy.js URL
  // OR connect your API key locally via the in-page "Sahadat AI Key" modal (saved in browser localStorage).
  const SAHADAT_AI_CONFIG = {
    proxyUrl: 'https://sahadat-ai.mohammedabdulmalek19781.workers.dev',
    apiKey: '',
    endpoint: 'https://openrouter.ai/api/v1/chat/completions',
    models: [
      'nvidia/nemotron-3.5-super-vl:free',
      'nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free'
    ],
    engineName: 'Sahadat AI',
    maxImageEdge: 1024,
    jpegQuality: 0.84
  };

  const STORAGE_KEY_API = 'sahadat_ai_api_key';
  const STORAGE_KEY_PROXY = 'sahadat_ai_proxy_url';
  const STORAGE_KEY_HISTORY = 'sahadat_ai_seo_history';

  // Configure PDF.js worker if available
  if (typeof window.pdfjsLib !== 'undefined') {
    window.pdfjsLib.GlobalWorkerOptions.workerSrc =
      'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
  }

  // ── STATE ──
  const state = {
    files: [], // { id, file, name, ext, formatLabel, sizeBytes, width, height, pageCount, previewDataUrl, visionDataUrl, extractedText, dominantColors, result }
    activeId: null,
    tagCount: 50,
    isGenerating: false,
    history: []
  };

  // ── DOM ELEMENTS ──
  const dropZone = document.getElementById('seoDropZone');
  const fileInput = document.getElementById('seoFileInput');
  const fileQueueWrap = document.getElementById('fileQueueWrap');
  const fileQueue = document.getElementById('fileQueue');
  const fileCountNum = document.getElementById('fileCountNum');
  const clearFilesBtn = document.getElementById('clearFilesBtn');

  const previewStage = document.getElementById('previewStage');
  const activePreviewImg = document.getElementById('activePreviewImg');
  const previewFileName = document.getElementById('previewFileName');
  const previewFileSpecs = document.getElementById('previewFileSpecs');

  const tagCountRange = document.getElementById('tagCountRange');
  const tagCountInput = document.getElementById('tagCountInput');
  const tagPresets = document.getElementById('tagPresets');
  const platformSelect = document.getElementById('platformSelect');
  const languageSelect = document.getElementById('languageSelect');
  const contextInput = document.getElementById('contextInput');

  const generateBtn = document.getElementById('generateBtn');
  const generateBtnLabel = document.getElementById('generateBtnLabel');
  const generateAllBtn = document.getElementById('generateAllBtn');

  const emptyResults = document.getElementById('emptyResults');
  const loadingResults = document.getElementById('loadingResults');
  const loadingStepText = document.getElementById('loadingStepText');
  const resultsContent = document.getElementById('resultsContent');
  const resultSourceBadge = document.getElementById('resultSourceBadge');

  const seoScoreNum = document.getElementById('seoScoreNum');
  const seoGradeTitle = document.getElementById('seoGradeTitle');
  const resultFileBadge = document.getElementById('resultFileBadge');
  const seoTipsWrap = document.getElementById('seoTipsWrap');

  const outSeoTitle = document.getElementById('outSeoTitle');
  const outSeoSlug = document.getElementById('outSeoSlug');
  const outMetaDesc = document.getElementById('outMetaDesc');
  const outAltText = document.getElementById('outAltText');
  const outCaption = document.getElementById('outCaption');
  const titleCharCount = document.getElementById('titleCharCount');
  const descCharCount = document.getElementById('descCharCount');

  const tagsCloud = document.getElementById('tagsCloud');
  const selectedTagsCounter = document.getElementById('selectedTagsCounter');
  const selectAllTagsBtn = document.getElementById('selectAllTagsBtn');
  const deselectAllTagsBtn = document.getElementById('deselectAllTagsBtn');
  const customTagInput = document.getElementById('customTagInput');
  const addCustomTagBtn = document.getElementById('addCustomTagBtn');
  const longTailWrap = document.getElementById('longTailWrap');
  const longTailRow = document.getElementById('longTailRow');

  const copyCommaBtn = document.getElementById('copyCommaBtn');
  const copyHashtagsBtn = document.getElementById('copyHashtagsBtn');
  const copyLinesBtn = document.getElementById('copyLinesBtn');
  const copyHtmlBtn = document.getElementById('copyHtmlBtn');
  const exportCsvBtn = document.getElementById('exportCsvBtn');
  const exportTxtBtn = document.getElementById('exportTxtBtn');
  const exportJsonBtn = document.getElementById('exportJsonBtn');

  const engineStatusChip = document.getElementById('engineStatusChip');
  const engineStatusText = document.getElementById('engineStatusText');
  const openAdminBtn = document.getElementById('openAdminBtn');
  const adminModalBackdrop = document.getElementById('adminModalBackdrop');
  const closeAdminModalBtn = document.getElementById('closeAdminModalBtn');
  const adminFeedback = document.getElementById('adminFeedback');
  const adminUnlockForm = document.getElementById('adminUnlockForm');
  const workerUrlRow = document.getElementById('workerUrlRow');
  const adminWorkerUrlInput = document.getElementById('adminWorkerUrlInput');
  const adminPasswordInput = document.getElementById('adminPasswordInput');
  const adminUnlockBtn = document.getElementById('adminUnlockBtn');
  const adminUpdateForm = document.getElementById('adminUpdateForm');
  const adminActiveProvider = document.getElementById('adminActiveProvider');
  const adminActiveModel = document.getElementById('adminActiveModel');
  const adminMaskedKey = document.getElementById('adminMaskedKey');
  const adminUpdatedAt = document.getElementById('adminUpdatedAt');
  const adminProviderSelect = document.getElementById('adminProviderSelect');
  const adminCustomEndpointRow = document.getElementById('adminCustomEndpointRow');
  const adminEndpointInput = document.getElementById('adminEndpointInput');
  const adminNewKeyInput = document.getElementById('adminNewKeyInput');
  const adminModelSelect = document.getElementById('adminModelSelect');
  const adminFetchModelsBtn = document.getElementById('adminFetchModelsBtn');
  const adminModelInput = document.getElementById('adminModelInput');
  const adminLockBtn = document.getElementById('adminLockBtn');
  const adminSaveKeyBtn = document.getElementById('adminSaveKeyBtn');

  const historySection = document.getElementById('historySection');
  const historyGrid = document.getElementById('historyGrid');
  const clearHistoryBtn = document.getElementById('clearHistoryBtn');
  const seoToast = document.getElementById('seoToast');

  // ── HELPERS ──
  let toastTimer = null;
  function showToast(msg, tone = 'success') {
    if (!seoToast) return;
    seoToast.textContent = msg;
    const gradients = {
      success: 'linear-gradient(135deg, #10B981, #059669)',
      info: 'linear-gradient(135deg, #6C3EFF, #00A8E8)',
      warn: 'linear-gradient(135deg, #F59E0B, #D97706)',
      error: 'linear-gradient(135deg, #EF4444, #DC2626)'
    };
    seoToast.style.background = gradients[tone] || gradients.success;
    seoToast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => seoToast.classList.remove('show'), 3200);
  }

  function getActiveApiKey() {
    const saved = (localStorage.getItem(STORAGE_KEY_API) || '').trim();
    const localCfg = (window.SAHADAT_AI_LOCAL_CONFIG && window.SAHADAT_AI_LOCAL_CONFIG.apiKey || '').trim();
    return saved || localCfg || (SAHADAT_AI_CONFIG.apiKey || '').trim();
  }

  function getActiveProxyUrl() {
    const savedProxy = (localStorage.getItem(STORAGE_KEY_PROXY) || '').trim();
    const localProxy = (window.SAHADAT_AI_LOCAL_CONFIG && window.SAHADAT_AI_LOCAL_CONFIG.proxyUrl || '').trim();
    const base = (SAHADAT_AI_CONFIG.proxyUrl || '').trim() || localProxy || savedProxy;
    return base.replace(/\/+$/, '');
  }

  function hasLiveSahadatAI() {
    return Boolean(getActiveProxyUrl() || getActiveApiKey());
  }

  function updateEngineChipUI() {
    if (!engineStatusChip || !engineStatusText) return;
    if (hasLiveSahadatAI()) {
      engineStatusChip.classList.add('live');
      engineStatusText.textContent = 'Sahadat AI Live';
    } else {
      engineStatusChip.classList.remove('live');
      engineStatusText.textContent = 'Sahadat AI Ready';
    }
  }

  function formatBytes(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  }

  function getExtension(filename) {
    const m = filename.toLowerCase().match(/\.([a-z0-9]+)$/);
    return m ? m[1] : '';
  }

  function escapeHtml(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function getActiveEntry() {
    return state.files.find(f => f.id === state.activeId) || null;
  }

  function setTagCount(val) {
    const n = Math.max(5, Math.min(150, parseInt(val, 10) || 50));
    state.tagCount = n;
    tagCountInput.value = n;
    tagCountRange.value = Math.min(100, n);
    tagPresets.querySelectorAll('.preset-pill').forEach(btn => {
      btn.classList.toggle('active', parseInt(btn.dataset.count, 10) === n);
    });
    updateGenerateButtonLabel();
  }

  function updateGenerateButtonLabel() {
    if (state.isGenerating) return;
    generateBtnLabel.textContent = `Generate ${state.tagCount} SEO Tags with Sahadat AI`;
  }

  // ── COLOR PALETTE EXTRACTION (FOR SMART CONTEXT) ──
  function rgbToColorName(r, g, b) {
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const l = (max + min) / 510;
    const d = max - min;
    const s = d === 0 ? 0 : d / (255 - Math.abs(2 * l * 255 - 255));
    if (l < 0.14) return 'dark black';
    if (l > 0.9 && s < 0.18) return 'clean white';
    if (s < 0.14) return l > 0.55 ? 'soft gray' : 'charcoal gray';
    let h = 0;
    if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) * 60;
    else if (max === g) h = ((b - r) / d + 2) * 60;
    else h = ((r - g) / d + 4) * 60;
    if (h < 18 || h >= 345) return l > 0.65 ? 'coral pink' : 'vibrant red';
    if (h < 42) return 'warm orange';
    if (h < 68) return 'golden yellow';
    if (h < 155) return l > 0.6 ? 'mint green' : 'emerald green';
    if (h < 200) return 'cyan teal';
    if (h < 252) return l < 0.35 ? 'navy blue' : 'royal blue';
    if (h < 298) return 'electric violet';
    return 'magenta rose';
  }

  function extractDominantColors(canvas) {
    try {
      const sample = document.createElement('canvas');
      sample.width = 24;
      sample.height = 24;
      const sctx = sample.getContext('2d');
      sctx.drawImage(canvas, 0, 0, 24, 24);
      const data = sctx.getImageData(0, 0, 24, 24).data;
      const counts = {};
      for (let i = 0; i < data.length; i += 4) {
        if (data[i + 3] < 80) continue;
        const name = rgbToColorName(data[i], data[i + 1], data[i + 2]);
        counts[name] = (counts[name] || 0) + 1;
      }
      return Object.entries(counts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([name]) => name);
    } catch {
      return [];
    }
  }

  // ── FILE PROCESSING (RASTER, SVG, PDF) ──
  function resizeCanvasToVisionJpeg(sourceCanvas, bgFill = '#FFFFFF') {
    const maxEdge = SAHADAT_AI_CONFIG.maxImageEdge;
    let w = sourceCanvas.width || 800;
    let h = sourceCanvas.height || 600;
    const scale = Math.min(1, maxEdge / Math.max(w, h));
    const tw = Math.max(1, Math.round(w * scale));
    const th = Math.max(1, Math.round(h * scale));
    const out = document.createElement('canvas');
    out.width = tw;
    out.height = th;
    const ctx = out.getContext('2d');
    if (bgFill) {
      ctx.fillStyle = bgFill;
      ctx.fillRect(0, 0, tw, th);
    }
    ctx.drawImage(sourceCanvas, 0, 0, tw, th);
    return out.toDataURL('image/jpeg', SAHADAT_AI_CONFIG.jpegQuality);
  }

  async function processRasterImage(file) {
    const dataUrl = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
    const img = await new Promise((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = reject;
      el.src = dataUrl;
    });
    const canvas = document.createElement('canvas');
    canvas.width = img.naturalWidth || img.width;
    canvas.height = img.naturalHeight || img.height;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0);
    const dominantColors = extractDominantColors(canvas);
    const visionDataUrl = resizeCanvasToVisionJpeg(canvas, '#FFFFFF');
    return {
      width: canvas.width,
      height: canvas.height,
      pageCount: 1,
      previewDataUrl: dataUrl,
      visionDataUrl,
      extractedText: '',
      dominantColors
    };
  }

  async function processSvgFile(file) {
    const svgText = await file.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(svgText, 'image/svg+xml');
    const svgEl = doc.querySelector('svg');

    let width = 800;
    let height = 800;
    const textBits = [];

    if (svgEl) {
      const vb = svgEl.getAttribute('viewBox');
      if (vb) {
        const parts = vb.trim().split(/[\s,]+/).map(Number);
        if (parts.length === 4 && parts[2] > 0 && parts[3] > 0) {
          width = Math.round(parts[2]);
          height = Math.round(parts[3]);
        }
      } else {
        const attrW = parseFloat(svgEl.getAttribute('width'));
        const attrH = parseFloat(svgEl.getAttribute('height'));
        if (attrW > 0 && attrH > 0) {
          width = Math.round(attrW);
          height = Math.round(attrH);
        }
      }
      doc.querySelectorAll('title, desc, text, tspan').forEach(node => {
        const t = (node.textContent || '').trim();
        if (t) textBits.push(t);
      });
    }

    const svgBlob = new Blob([svgText], { type: 'image/svg+xml;charset=utf-8' });
    const blobUrl = URL.createObjectURL(svgBlob);
    try {
      const img = await new Promise((resolve, reject) => {
        const el = new Image();
        el.onload = () => resolve(el);
        el.onerror = reject;
        el.src = blobUrl;
      });
      const renderScale = Math.min(1, 1024 / Math.max(width, height, 1));
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(256, Math.round(width * renderScale));
      canvas.height = Math.max(256, Math.round(height * renderScale));
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      const dominantColors = extractDominantColors(canvas);
      const previewDataUrl = canvas.toDataURL('image/png');
      const visionDataUrl = resizeCanvasToVisionJpeg(canvas, '#FFFFFF');
      return {
        width,
        height,
        pageCount: 1,
        previewDataUrl,
        visionDataUrl,
        extractedText: textBits.join(' | ').slice(0, 1500),
        dominantColors
      };
    } finally {
      URL.revokeObjectURL(blobUrl);
    }
  }

  async function processPdfFile(file) {
    if (typeof window.pdfjsLib === 'undefined') {
      throw new Error('PDF renderer is still loading. Please retry in a moment.');
    }
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await window.pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    const pageCount = pdf.numPages || 1;

    // Extract metadata + text from first 3 pages
    const textChunks = [];
    try {
      const meta = await pdf.getMetadata();
      const info = (meta && meta.info) || {};
      if (info.Title) textChunks.push('Title: ' + info.Title);
      if (info.Subject) textChunks.push('Subject: ' + info.Subject);
      if (info.Keywords) textChunks.push('Keywords: ' + info.Keywords);
    } catch {
      // Metadata optional
    }

    const pagesToRead = Math.min(pageCount, 3);
    for (let p = 1; p <= pagesToRead; p++) {
      try {
        const page = await pdf.getPage(p);
        const content = await page.getTextContent();
        const pageText = content.items.map(it => it.str).join(' ').replace(/\s+/g, ' ').trim();
        if (pageText) textChunks.push(pageText);
      } catch {
        // Ignore single page read errors
      }
    }

    // Render Page 1 onto canvas for thumbnail + vision AI
    const firstPage = await pdf.getPage(1);
    const baseViewport = firstPage.getViewport({ scale: 1 });
    const renderScale = Math.min(1.6, 1024 / Math.max(baseViewport.width, baseViewport.height, 1));
    const viewport = firstPage.getViewport({ scale: renderScale });

    const canvas = document.createElement('canvas');
    canvas.width = Math.round(viewport.width);
    canvas.height = Math.round(viewport.height);
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    await firstPage.render({ canvasContext: ctx, viewport }).promise;
    const dominantColors = extractDominantColors(canvas);
    const previewDataUrl = canvas.toDataURL('image/png');
    const visionDataUrl = resizeCanvasToVisionJpeg(canvas, '#FFFFFF');

    return {
      width: Math.round(baseViewport.width),
      height: Math.round(baseViewport.height),
      pageCount,
      previewDataUrl,
      visionDataUrl,
      extractedText: textChunks.join('\n').slice(0, 3200),
      dominantColors
    };
  }

  async function ingestFiles(fileList) {
    const allowedExt = new Set(['png', 'jpg', 'jpeg', 'webp', 'gif', 'svg', 'pdf']);
    const incoming = Array.from(fileList || []);
    if (!incoming.length) return;

    let addedCount = 0;
    for (const file of incoming) {
      const ext = getExtension(file.name);
      const isSvg = file.type === 'image/svg+xml' || ext === 'svg';
      const isPdf = file.type === 'application/pdf' || ext === 'pdf';
      const isImg = file.type.startsWith('image/') && !isSvg;

      if (!isSvg && !isPdf && !isImg && !allowedExt.has(ext)) {
        showToast(`Unsupported file: ${file.name}`, 'warn');
        continue;
      }
      if (file.size > 25 * 1024 * 1024) {
        showToast(`${file.name} exceeds 25MB limit`, 'warn');
        continue;
      }

      try {
        let processed;
        let formatLabel = (ext || 'IMG').toUpperCase();
        if (isPdf) {
          formatLabel = 'PDF';
          processed = await processPdfFile(file);
        } else if (isSvg) {
          formatLabel = 'SVG';
          processed = await processSvgFile(file);
        } else {
          if (formatLabel === 'JPEG') formatLabel = 'JPG';
          processed = await processRasterImage(file);
        }

        const entry = {
          id: 'f_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7),
          file,
          name: file.name,
          ext: ext || formatLabel.toLowerCase(),
          formatLabel,
          sizeBytes: file.size,
          ...processed,
          result: null
        };
        state.files.push(entry);
        state.activeId = entry.id;
        addedCount++;
      } catch (err) {
        console.error('File processing error:', err);
        showToast(`Could not read ${file.name}`, 'error');
      }
    }

    if (addedCount > 0) {
      renderQueue();
      renderActivePreview();
      const active = getActiveEntry();
      if (active && active.result) {
        renderResult(active);
      } else {
        showEmptyState();
      }
      showToast(
        addedCount === 1 ? `Loaded "${state.files[state.files.length - 1].name}"` : `Loaded ${addedCount} files`,
        'info'
      );
    }
  }

  // ── UI RENDERING (QUEUE & PREVIEW) ──
  function renderQueue() {
    const count = state.files.length;
    fileCountNum.textContent = count;
    fileQueueWrap.classList.toggle('hidden', count === 0);
    generateBtn.disabled = count === 0 || state.isGenerating;
    generateAllBtn.classList.toggle('hidden', count < 2);

    fileQueue.innerHTML = state.files
      .map(item => `
        <div class="file-queue-item ${item.id === state.activeId ? 'active' : ''}" data-id="${item.id}" title="${escapeHtml(item.name)}">
          <img src="${item.previewDataUrl}" alt="${escapeHtml(item.name)}" />
          <span class="file-queue-badge">${escapeHtml(item.formatLabel)}</span>
          ${item.result ? '<span class="file-queue-done" title="Generated"><i class="fas fa-check"></i></span>' : ''}
          <button type="button" class="file-queue-remove" data-remove="${item.id}" aria-label="Remove file">
            <i class="fas fa-times"></i>
          </button>
        </div>
      `)
      .join('');
  }

  function renderActivePreview() {
    const entry = getActiveEntry();
    if (!entry) {
      previewStage.classList.add('hidden');
      return;
    }
    previewStage.classList.remove('hidden');
    activePreviewImg.src = entry.previewDataUrl;
    activePreviewImg.alt = entry.name;
    previewFileName.textContent = entry.name;

    const dims = entry.formatLabel === 'PDF'
      ? `${entry.pageCount} pg${entry.pageCount > 1 ? 's' : ''} · ${entry.width}×${entry.height}pt`
      : `${entry.width} × ${entry.height}px`;
    previewFileSpecs.textContent = `${entry.formatLabel} · ${dims} · ${formatBytes(entry.sizeBytes)}`;
  }

  function showEmptyState() {
    emptyResults.classList.remove('hidden');
    loadingResults.classList.add('hidden');
    resultsContent.classList.add('hidden');
    resultSourceBadge.classList.add('hidden');
  }

  function showLoadingState(stepMsg) {
    emptyResults.classList.add('hidden');
    resultsContent.classList.add('hidden');
    loadingResults.classList.remove('hidden');
    previewStage.classList.add('scanning');
    loadingStepText.textContent = stepMsg || 'Sahadat AI is analyzing visual content & crafting SEO tags...';
  }

  // ── FILE AUDIT SCORE CALCULATOR ──
  function computeFileAudit(entry) {
    let score = 78;
    const tips = [];

    // 1. Filename quality
    const base = entry.name.replace(/\.[^.]+$/, '');
    const isGenericName = /^(img|image|dsc|screenshot|whatsapp|photo|untitled|file|document|scan|copy|new)[\s_-]*\d*$/i.test(base);
    if (isGenericName || base.length < 4) {
      score -= 12;
      tips.push('Rename file using the generated SEO slug');
    } else if (/^[a-z0-9-]+$/.test(base)) {
      score += 8;
      tips.push('SEO-friendly lowercase kebab filename');
    } else {
      tips.push('Use hyphenated lowercase slug for best indexing');
    }

    // 2. Weight / Format check
    if (entry.formatLabel === 'WEBP' || entry.formatLabel === 'SVG') {
      score += 10;
      tips.push(`Modern ${entry.formatLabel} format is fast for Core Web Vitals`);
    } else if (entry.formatLabel === 'PDF') {
      if (entry.extractedText && entry.extractedText.length > 40) {
        score += 9;
        tips.push('PDF contains indexable text layer');
      } else {
        score -= 8;
        tips.push('PDF has minimal text — add title & alt metadata');
      }
    } else if (entry.sizeBytes > 450 * 1024) {
      score -= 10;
      tips.push(`Compress or convert ${formatBytes(entry.sizeBytes)} ${entry.formatLabel} to WebP`);
    } else {
      score += 6;
      tips.push(`Lightweight file size (${formatBytes(entry.sizeBytes)})`);
    }

    // 3. Resolution
    if (entry.formatLabel !== 'PDF') {
      if (entry.width >= 600 && entry.height >= 400) {
        score += 4;
        tips.push(`Crisp resolution (${entry.width}×${entry.height})`);
      } else if (entry.width < 300 || entry.height < 300) {
        score -= 6;
        tips.push('Small resolution — consider 1200px wide for Discover/OG');
      }
    }

    score = Math.max(48, Math.min(99, score));
    return { score, tips: tips.slice(0, 3) };
  }

  // ── NORMALIZE & ENFORCE EXACT TAG COUNT ──
  function cleanTag(t) {
    return String(t || '')
      .replace(/^#+/, '')
      .replace(/["'`]/g, '')
      .replace(/\s+/g, ' ')
      .trim()
      .toLowerCase();
  }

  function enforceExactTags(rawTags, targetCount, fallbackPool) {
    const seen = new Set();
    const out = [];

    const pushIfValid = (item) => {
      const c = cleanTag(item);
      if (!c || c.length < 2 || c.length > 55 || seen.has(c)) return;
      seen.add(c);
      out.push(c);
    };

    (rawTags || []).forEach(pushIfValid);
    (fallbackPool || []).forEach(t => {
      if (out.length < targetCount) pushIfValid(t);
    });

    return out.slice(0, targetCount);
  }

  // ── PLATFORM VOCABULARY & SMART LOCAL FALLBACK ENGINE ──
  function getPlatformMeta(platformKey) {
    const map = {
      google: {
        name: 'Google & Website SEO',
        boosters: [
          'seo optimized', 'high resolution', 'web graphic', 'digital asset', 'modern design',
          'creative visual', 'professional layout', 'online resource', 'featured image',
          'website banner', 'visual content', 'brand identity', 'clean aesthetic', 'hd quality',
          'minimalist style', 'digital media', 'editorial visual', 'web ready', 'responsive design',
          'trending visual', 'search optimized', 'hero graphic', 'content marketing', 'ui asset'
        ]
      },
      stock: {
        name: 'Stock Platforms (Freepik, Adobe Stock, Shutterstock)',
        boosters: [
          'stock asset', 'commercial use', 'royalty free', 'graphic element', 'design template',
          'isolated concept', 'editable graphic', 'print ready', 'creative background', 'trendy design',
          'branding mockup', 'marketing visual', 'advertising layout', 'presentation graphic',
          'contemporary art', 'flat style', 'premium quality', 'studio composition', 'clean backdrop',
          'designer resource', 'creative concept', 'business visual', 'modern illustration', 'high detail'
        ]
      },
      ecommerce: {
        name: 'E-Commerce & Product Listing',
        boosters: [
          'product showcase', 'online shopping', 'best seller', 'premium quality', 'featured item',
          'buy online', 'studio product shot', 'clean display', 'retail ready', 'brand collection',
          'gift idea', 'new arrival', 'modern lifestyle', 'high conversion', 'shop now',
          'authentic design', 'everyday essential', 'catalog photo', 'storefront visual', 'top rated',
          'exclusive edition', 'minimal packaging', 'customer favorite', 'value deal'
        ]
      },
      social: {
        name: 'Social Media & YouTube',
        boosters: [
          'viral visual', 'social media post', 'instagram aesthetic', 'youtube thumbnail', 'content creator',
          'trending now', 'scroll stopping', 'digital creator', 'feed design', 'creative reel',
          'audience growth', 'brand story', 'shareable graphic', 'engagement boost', 'modern creator',
          'visual storytelling', 'bold typography', 'social branding', 'daily inspiration', 'creative hub',
          'influencer style', 'digital marketing', 'promo graphic', 'eye catching'
        ]
      },
      blog: {
        name: 'Blog & Pinterest',
        boosters: [
          'blog graphic', 'pinterest pin', 'editorial guide', 'how to visual', 'step by step',
          'creative inspiration', 'featured article', 'infographic style', 'save for later',
          'ultimate guide', 'tips and tricks', 'curated ideas', 'aesthetic moodboard', 'content strategy',
          'visual guide', 'resource hub', 'pro tips', 'lifestyle blog', 'creative journal',
          'expert insights', 'knowledge share', 'readable layout', 'modern blog', 'inspiration board'
        ]
      }
    };
    return map[platformKey] || map.google;
  }

  function extractMeaningfulWords(text) {
    const stop = new Set([
      'the', 'and', 'for', 'with', 'from', 'that', 'this', 'your', 'have', 'are', 'was',
      'were', 'been', 'will', 'into', 'about', 'over', 'after', 'before', 'between', 'under',
      'page', 'file', 'image', 'img', 'dsc', 'png', 'jpg', 'jpeg', 'webp', 'svg', 'pdf',
      'copy', 'final', 'v1', 'v2', 'untitled', 'screenshot', 'whatsapp', 'document'
    ]);
    return String(text || '')
      .toLowerCase()
      .replace(/[^a-z0-9\u0980-\u09FF\s-]/g, ' ')
      .split(/[\s_-]+/)
      .filter(w => w.length >= 3 && !stop.has(w) && !/^\d+$/.test(w));
  }

  function buildFallbackPool(entry, platformKey, userContext) {
    const plat = getPlatformMeta(platformKey);
    const filenameWords = extractMeaningfulWords(entry.name.replace(/\.[^.]+$/, ''));
    const contextWords = extractMeaningfulWords(userContext);
    const docWords = extractMeaningfulWords(entry.extractedText).slice(0, 28);
    const colors = entry.dominantColors || [];

    const orient = entry.width > entry.height * 1.15
      ? 'landscape horizontal'
      : entry.height > entry.width * 1.15
        ? 'portrait vertical'
        : 'square balanced';

    const formatTags = {
      SVG: ['vector graphic', 'scalable svg', 'crisp icon', 'flat vector', 'editable vector', 'clean illustration', 'svg asset', 'minimal logo'],
      PDF: ['pdf document', 'digital guide', 'printable resource', 'structured report', 'ebook layout', 'business document', 'downloadable pdf', 'information sheet'],
      PNG: ['png graphic', 'crisp png', 'high resolution png', 'digital artwork', 'graphic design', 'sharp detail', 'web image', 'visual design'],
      JPG: ['photography', 'high resolution photo', 'jpg image', 'visual capture', 'sharp composition', 'creative photo', 'editorial image', 'web photo'],
      WEBP: ['webp image', 'fast loading graphic', 'next gen format', 'web optimized image', 'lightweight visual', 'core web vitals', 'modern web asset', 'compressed photo']
    }[entry.formatLabel] || ['digital graphic', 'visual design', 'high quality image'];

    const pool = [];
    // Prioritize user context + filename + document words
    const primarySeeds = [...new Set([...contextWords, ...filenameWords, ...docWords])];
    primarySeeds.forEach(w => pool.push(w));

    // Create 2-word SEO combinations from seeds
    for (let i = 0; i < Math.min(primarySeeds.length, 10); i++) {
      for (let j = i + 1; j < Math.min(primarySeeds.length, 10); j++) {
        pool.push(`${primarySeeds[i]} ${primarySeeds[j]}`);
      }
    }

    // Add color-enriched phrases
    colors.forEach(c => {
      pool.push(c);
      pool.push(`${c} aesthetic`);
      pool.push(`${c} palette`);
      if (primarySeeds[0]) pool.push(`${c} ${primarySeeds[0]}`);
    });

    // Add format + orientation + platform tags
    formatTags.forEach(t => pool.push(t));
    pool.push(orient);
    pool.push(`${entry.formatLabel.toLowerCase()} template`);
    pool.push(`${entry.formatLabel.toLowerCase()} download`);
    plat.boosters.forEach(b => pool.push(b));

    // Extra evergreen high-volume SEO tags so up to 150 tags are always clean & unique
    const evergreen = [
      'creative design', 'visual branding', 'digital strategy', 'professional aesthetic',
      'graphic layout', 'marketing collateral', 'modern visual', 'high impact design',
      'clean composition', 'brand storytelling', 'user experience', 'creative portfolio',
      'color harmony', 'typography design', 'digital showcase', 'contemporary style',
      'studio quality', 'minimalist composition', 'eye catching visual', 'design inspiration',
      'online presence', 'visual identity', 'creative concept', 'business growth',
      'social ready', 'media kit', 'content optimization', 'search friendly',
      'seo metadata', 'alt text ready', 'accessible media', 'digital publishing',
      'modern workflow', 'brand consistency', 'creative studio', 'visual hierarchy',
      'premium aesthetic', 'clean background', 'sleek style', 'fresh design',
      'innovative layout', 'polished finish', 'next gen visual', 'smart branding',
      'audience engagement', 'click worthy', 'conversion focused', 'brand awareness',
      'art direction', 'visual appeal', 'digital craft', 'creative asset',
      'multi purpose graphic', 'ready to publish', 'pro layout', 'designer choice',
      'sharp contrast', 'modern palette', 'minimal aesthetic', 'dynamic visual',
      'creative edge', 'digital innovation', 'brand elevation', 'standout visual',
      'high clarity', 'refined design', 'trend forward', 'editorial quality',
      'commercial graphic', 'web publishing', 'seo friendly asset', 'digital toolkit',
      'creative showcase', 'styled visual', 'impactful design', 'visual excellence',
      'modern communication', 'branded content', 'design system', 'creative excellence',
      'crisp rendering', 'balanced framing', 'bold aesthetic', 'visual clarity',
      'digital presentation', 'portfolio highlight', 'professional finish', 'smart design',
      'media optimization', 'top ranking visual', 'keyword rich', 'discoverable asset',
      'rich media', 'engaging content', 'clean vector look', 'modern craft',
      'digital expression', 'creative direction', 'versatile graphic', 'authentic visual',
      'structured design', 'focused composition', 'sleek presentation', 'modern media',
      'curated visual', 'precision design', 'high value asset', 'creative spark'
    ];
    evergreen.forEach(e => pool.push(e));
    return pool;
  }

  function generateSmartLocalSEO(entry, tagCount, platformKey, language, userContext) {
    const plat = getPlatformMeta(platformKey);
    const filenameClean = entry.name
      .replace(/\.[^.]+$/, '')
      .replace(/[_-]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    const topic = (userContext || '').trim() ||
      (filenameClean && !/^(img|image|dsc|screenshot|whatsapp|untitled|photo)\s*\d*$/i.test(filenameClean)
        ? filenameClean
        : entry.formatLabel === 'PDF'
          ? 'Professional Digital Document Guide'
          : entry.formatLabel === 'SVG'
            ? 'Modern Scalable Vector Graphic'
            : 'Creative High-Resolution Visual Design');

    const titleCap = topic.replace(/\b\w/g, ch => ch.toUpperCase());
    const colorsStr = (entry.dominantColors || []).slice(0, 2).join(' and ');
    const slugBase = titleCap
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-')
      .slice(0, 56) || 'seo-optimized-asset';

    const fallbackPool = buildFallbackPool(entry, platformKey, userContext);
    const keywords = enforceExactTags(fallbackPool, tagCount, fallbackPool);

    const isBn = language === 'Bengali';
    const isMix = language === 'English + Bengali';

    const seoTitle = isBn
      ? `${titleCap} — হাই-কোয়ালিটি ${entry.formatLabel} SEO অ্যাসেট`
      : isMix
        ? `${titleCap} | ${entry.formatLabel} SEO Asset (${plat.name.split(' ')[0]})`
        : `${titleCap} — High-Quality ${entry.formatLabel} Asset for ${plat.name.split(' ')[0]}`;

    const metaDescription = isBn
      ? `${titleCap} (${entry.formatLabel}) — ${plat.name}-এর জন্য সম্পূর্ণ অপ্টিমাইজড ভিজ্যুয়াল ও মেটাডাটা। ${colorsStr ? colorsStr + ' কালার টোনে ' : ''}দ্রুত র‍্যাংকিংয়ের জন্য তৈরি।`
      : `Explore ${titleCap}, a clean ${entry.formatLabel} asset${colorsStr ? ` featuring ${colorsStr} tones` : ''}, crafted for ${plat.name}. Optimized with high-intent keywords, crisp framing, and search-ready metadata.`;

    const altText = entry.formatLabel === 'PDF'
      ? `Cover preview of ${titleCap} (${entry.pageCount}-page PDF document)${colorsStr ? ` with ${colorsStr} accents` : ''}`
      : `${titleCap} — ${entry.formatLabel} graphic${colorsStr ? ` in ${colorsStr} color tones` : ''} (${entry.width}×${entry.height})`;

    const caption = isBn
      ? `${titleCap} এখন পুরোপুরি SEO-রেডি! আপনার প্রজেক্ট, ব্লগ বা সোশ্যাল মিডিয়ায় ব্যবহারের জন্য পারফেক্ট।`
      : `${titleCap} — ready to publish across ${plat.name}. Designed for clarity, strong click-through rate, and effortless search discovery.`;

    const longTailKeywords = [
      `${titleCap.toLowerCase()} ${entry.formatLabel.toLowerCase()} download`,
      `modern ${titleCap.toLowerCase()} design`,
      `high resolution ${titleCap.toLowerCase()}`,
      `${titleCap.toLowerCase()} for ${platformKey} seo`,
      colorsStr ? `${colorsStr} ${titleCap.toLowerCase()}` : `professional ${titleCap.toLowerCase()} template`,
      `clean ${titleCap.toLowerCase()} visual asset`
    ];

    const audit = computeFileAudit(entry);

    return {
      seoTitle: seoTitle.slice(0, 70),
      metaDescription: metaDescription.slice(0, 165),
      altText,
      seoSlug: `${slugBase}.${entry.ext || 'png'}`,
      seoCaption: caption,
      keywords,
      longTailKeywords,
      seoScore: audit.score,
      seoTips: audit.tips,
      engineMode: 'preview'
    };
  }

  // ── LIVE SAHADAT AI CALL (OPENROUTER VISION MULTIMODAL) ──
  function parseJsonFromAiResponse(rawContent) {
    let text = String(rawContent || '').trim();
    // Strip reasoning tags if present
    text = text.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
    // Strip markdown fences
    const fenceMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
    if (fenceMatch) text = fenceMatch[1].trim();
    // Locate outermost JSON object
    const start = text.indexOf('{');
    const end = text.lastIndexOf('}');
    if (start !== -1 && end !== -1 && end > start) {
      text = text.slice(start, end + 1);
    }
    return JSON.parse(text);
  }

  async function callSahadatLiveAI(entry, tagCount, platformKey, language, userContext, apiKey) {
    const plat = getPlatformMeta(platformKey);
    const systemPrompt = [
      'You are Sahadat AI, an elite visual SEO strategist and metadata specialist.',
      'Analyze the provided image/SVG/PDF page visually AND any extracted document text carefully.',
      'Return ONLY a valid raw JSON object (no markdown fences, no commentary) with these exact keys:',
      '{',
      '  "seoTitle": "compelling 50-65 char SEO title",',
      '  "metaDescription": "persuasive 140-160 char meta description",',
      '  "altText": "descriptive accessible alt text describing what is actually visible",',
      '  "seoSlug": "lowercase-hyphenated-seo-filename.' + (entry.ext || 'png') + '",',
      '  "seoCaption": "engaging 1-2 sentence caption",',
      '  "keywords": ["tag 1", "tag 2", ... EXACTLY ' + tagCount + ' unique high-ranking SEO tags],',
      '  "longTailKeywords": ["6 high-intent 3-5 word SEO phrases"],',
      '  "seoTips": ["3 concise, specific SEO optimization tips for this asset"]',
      '}',
      `Rules: "keywords" MUST contain EXACTLY ${tagCount} distinct, non-duplicate, relevant SEO tags (1-3 words each, no # prefix).`,
      `Target platform: ${plat.name}. Output language: ${language}.`
    ].join('\n');

    const userMetaText = [
      `File name: ${entry.name}`,
      `Format: ${entry.formatLabel} (${entry.width}x${entry.height}${entry.formatLabel === 'PDF' ? `, ${entry.pageCount} pages` : ''}, ${formatBytes(entry.sizeBytes)})`,
      entry.dominantColors.length ? `Dominant colors detected: ${entry.dominantColors.join(', ')}` : '',
      userContext ? `User topic/niche hint: ${userContext}` : '',
      entry.extractedText ? `Extracted text from file:\n${entry.extractedText}` : '',
      `Generate EXACTLY ${tagCount} relevant SEO tags plus the complete SEO metadata JSON.`
    ]
      .filter(Boolean)
      .join('\n');

    const userContent = [
      { type: 'text', text: userMetaText },
      {
        type: 'image_url',
        image_url: { url: entry.visionDataUrl }
      }
    ];

    let lastError = null;
    const proxyUrl = getActiveProxyUrl();
    const targetUrl = proxyUrl || SAHADAT_AI_CONFIG.endpoint;
    const attempts = proxyUrl ? [null] : SAHADAT_AI_CONFIG.models;

    for (let i = 0; i < attempts.length; i++) {
      const modelId = attempts[i];
      if (i > 0) {
        loadingStepText.textContent = 'Sahadat AI is switching to backup neural engine...';
      }
      try {
        const headers = { 'Content-Type': 'application/json' };
        if (!proxyUrl) {
          headers['Authorization'] = `Bearer ${apiKey}`;
          headers['HTTP-Referer'] = window.location.origin || 'https://sawonak47.github.io/sahadat-portfolio/';
          headers['X-Title'] = 'Sahadat AI SEO Tool';
        }

        const bodyObj = {
          temperature: 0.4,
          max_tokens: Math.max(3200, tagCount * 24 + 1400),
          reasoning: { effort: 'low' },
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userContent }
          ]
        };
        if (modelId) bodyObj.model = modelId;

        const res = await fetch(targetUrl, {
          method: 'POST',
          headers,
          body: JSON.stringify(bodyObj)
        });

        if (!res.ok) {
          const errBody = await res.text().catch(() => '');
          throw new Error(`HTTP ${res.status}: ${errBody.slice(0, 180)}`);
        }

        const data = await res.json();
        const choice = data && data.choices && data.choices[0];
        const rawText = choice && choice.message && choice.message.content;
        if (!rawText) throw new Error('Empty response from Sahadat AI');

        const parsed = parseJsonFromAiResponse(rawText);
        const fallbackPool = buildFallbackPool(entry, platformKey, userContext);
        const audit = computeFileAudit(entry);

        const keywords = enforceExactTags(parsed.keywords, tagCount, [
          ...(Array.isArray(parsed.longTailKeywords) ? parsed.longTailKeywords : []),
          ...fallbackPool
        ]);

        const cleanSlug = String(parsed.seoSlug || '')
          .toLowerCase()
          .replace(/[^a-z0-9.-]+/g, '-')
          .replace(/-+/g, '-')
          .replace(/^-|-$/g, '');

        return {
          seoTitle: String(parsed.seoTitle || '').trim() || entry.name,
          metaDescription: String(parsed.metaDescription || '').trim(),
          altText: String(parsed.altText || '').trim(),
          seoSlug: cleanSlug || `sahadat-seo-asset.${entry.ext || 'png'}`,
          seoCaption: String(parsed.seoCaption || '').trim(),
          keywords,
          longTailKeywords: Array.isArray(parsed.longTailKeywords) && parsed.longTailKeywords.length
            ? parsed.longTailKeywords.slice(0, 8)
            : keywords.slice(0, 6),
          seoScore: audit.score,
          seoTips: Array.isArray(parsed.seoTips) && parsed.seoTips.length
            ? parsed.seoTips.slice(0, 3)
            : audit.tips,
          engineMode: 'live'
        };
      } catch (err) {
        lastError = err;
        console.warn('Sahadat AI attempt failed:', err.message);
      }
    }
    throw lastError || new Error('Sahadat AI request failed');
  }

  // ── RUN GENERATION FOR A FILE ──
  async function generateForEntry(entry) {
    const tagCount = state.tagCount;
    const platformKey = platformSelect.value;
    const language = languageSelect.value;
    const userContext = contextInput.value.trim();
    const apiKey = getActiveApiKey();
    const isLive = hasLiveSahadatAI();

    state.isGenerating = true;
    generateBtn.disabled = true;
    generateBtnLabel.textContent = 'Sahadat AI is working...';
    showLoadingState(
      isLive
        ? `Sahadat AI is scanning "${entry.name}" for ${tagCount} SEO tags...`
        : `Sahadat Smart Preview is extracting ${tagCount} SEO tags from "${entry.name}"...`
    );

    try {
      let result;
      if (isLive) {
        result = await callSahadatLiveAI(entry, tagCount, platformKey, language, userContext, apiKey);
      } else {
        // Brief smooth scanning delay so preview feels natural & responsive
        await new Promise(r => setTimeout(r, 480));
        result = generateSmartLocalSEO(entry, tagCount, platformKey, language, userContext);
      }

      // Track selection state per tag
      result.tags = result.keywords.map(text => ({ text, selected: true }));
      entry.result = result;

      saveToHistory(entry, result);
      renderQueue();
      if (entry.id === state.activeId) {
        renderResult(entry);
      }

      showToast(
        `Sahadat AI generated ${result.tags.length} SEO tags!`,
        'success'
      );
    } catch (err) {
      console.error('Generation failed:', err);
      // Graceful fallback to smart local generator if upstream is busy
      const fallbackResult = generateSmartLocalSEO(entry, tagCount, platformKey, language, userContext);
      fallbackResult.tags = fallbackResult.keywords.map(text => ({ text, selected: true }));
      fallbackResult.engineMode = 'fallback';
      entry.result = fallbackResult;
      renderQueue();
      if (entry.id === state.activeId) renderResult(entry);
      showToast('Sahadat AI generated smart SEO tags (instant mode).', 'info');
    } finally {
      state.isGenerating = false;
      previewStage.classList.remove('scanning');
      generateBtn.disabled = state.files.length === 0;
      updateGenerateButtonLabel();
    }
  }

  // ── RENDER RESULT PANEL ──
  function updateCharCounts() {
    titleCharCount.textContent = `${outSeoTitle.value.length} chars`;
    descCharCount.textContent = `${outMetaDesc.value.length} chars`;
  }

  function renderTagsCloud(entry) {
    const tags = (entry && entry.result && entry.result.tags) || [];
    const selectedCount = tags.filter(t => t.selected).length;
    selectedTagsCounter.textContent = `${selectedCount} / ${tags.length} selected`;

    tagsCloud.innerHTML = tags
      .map((tag, idx) => `
        <span class="seo-tag-chip ${tag.selected ? '' : 'deselected'}" data-idx="${idx}" title="Click to toggle">
          <span class="tag-idx">${idx + 1}</span>
          <span>${escapeHtml(tag.text)}</span>
          <i class="fas fa-times tag-x" data-delete-idx="${idx}" title="Remove tag"></i>
        </span>
      `)
      .join('');
  }

  function renderResult(entry) {
    if (!entry || !entry.result) {
      showEmptyState();
      return;
    }
    const r = entry.result;
    emptyResults.classList.add('hidden');
    loadingResults.classList.add('hidden');
    resultsContent.classList.remove('hidden');

    resultSourceBadge.classList.remove('hidden');
    if (r.engineMode === 'live') {
      resultSourceBadge.innerHTML = '<i class="fas fa-wand-magic-sparkles mr-1" style="color:#22c55e"></i> Sahadat AI Live';
      resultSourceBadge.style.borderColor = 'rgba(34, 197, 94, 0.4)';
      resultSourceBadge.style.color = '#22c55e';
    } else {
      resultSourceBadge.innerHTML = '<i class="fas fa-bolt mr-1" style="color:var(--cyan)"></i> Sahadat Smart Preview';
      resultSourceBadge.style.borderColor = 'rgba(0, 200, 255, 0.35)';
      resultSourceBadge.style.color = 'var(--cyan)';
    }

    seoScoreNum.textContent = r.seoScore;
    const scoreArc = document.getElementById('scoreArc');
    if (scoreArc) {
      const circumference = 213.6;
      const offset = circumference - (Math.max(0, Math.min(100, r.seoScore)) / 100) * circumference;
      scoreArc.style.strokeDashoffset = circumference;
      requestAnimationFrame(() => {
        scoreArc.style.strokeDashoffset = offset.toFixed(1);
      });
    }
    seoGradeTitle.textContent =
      r.seoScore >= 88 ? 'Excellent SEO Readiness' :
      r.seoScore >= 75 ? 'Strong SEO Readiness' : 'Good — Quick Wins Available';
    resultFileBadge.textContent = `${entry.formatLabel} · ${formatBytes(entry.sizeBytes)}`;

    seoTipsWrap.innerHTML = (r.seoTips || [])
      .map(tip => `<span class="score-tip-pill"><i class="fas fa-check-circle mr-1" style="color:#22c55e"></i>${escapeHtml(tip)}</span>`)
      .join('');

    outSeoTitle.value = r.seoTitle || '';
    outSeoSlug.value = r.seoSlug || '';
    outMetaDesc.value = r.metaDescription || '';
    outAltText.value = r.altText || '';
    outCaption.value = r.seoCaption || '';
    updateCharCounts();

    renderTagsCloud(entry);

    if (r.longTailKeywords && r.longTailKeywords.length) {
      longTailWrap.classList.remove('hidden');
      longTailRow.innerHTML = r.longTailKeywords
        .map(phrase => `<span class="longtail-chip" data-copy-phrase="${escapeHtml(phrase)}"><i class="fas fa-plus-circle mr-1" style="color:var(--cyan)"></i>${escapeHtml(phrase)}</span>`)
        .join('');
    } else {
      longTailWrap.classList.add('hidden');
    }
  }

  // ── SELECTED TAGS & COPY/EXPORT UTILITIES ──
  function getSelectedTagTexts() {
    const entry = getActiveEntry();
    if (!entry || !entry.result) return [];
    return entry.result.tags.filter(t => t.selected).map(t => t.text);
  }

  async function copyText(text, successMsg) {
    if (!text) {
      showToast('Nothing to copy yet!', 'warn');
      return;
    }
    try {
      await navigator.clipboard.writeText(text);
      showToast(successMsg || 'Copied to clipboard!');
    } catch {
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      ta.remove();
      showToast(successMsg || 'Copied to clipboard!');
    }
  }

  function downloadFile(filename, content, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  // ── HISTORY (LOCALSTORAGE) ──
  function loadHistory() {
    try {
      state.history = JSON.parse(localStorage.getItem(STORAGE_KEY_HISTORY) || '[]');
    } catch {
      state.history = [];
    }
    renderHistory();
  }

  function saveToHistory(entry, result) {
    const record = {
      id: Date.now(),
      fileName: entry.name,
      formatLabel: entry.formatLabel,
      seoTitle: result.seoTitle,
      seoSlug: result.seoSlug,
      metaDescription: result.metaDescription,
      altText: result.altText,
      seoCaption: result.seoCaption,
      keywords: result.tags.map(t => t.text),
      date: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    state.history = [record, ...state.history.filter(h => h.fileName !== entry.name)].slice(0, 9);
    try {
      localStorage.setItem(STORAGE_KEY_HISTORY, JSON.stringify(state.history));
    } catch {
      // Ignore storage quota errors
    }
    renderHistory();
  }

  function renderHistory() {
    if (!state.history.length) {
      historySection.classList.add('hidden');
      return;
    }
    historySection.classList.remove('hidden');
    historyGrid.innerHTML = state.history
      .map(h => `
        <div class="seo-result-card flex flex-col justify-between gap-3">
          <div>
            <div class="flex items-center justify-between gap-2 mb-2">
              <span class="format-badge">${escapeHtml(h.formatLabel)} · ${h.keywords.length} tags</span>
              <span class="font-mono text-xs" style="color:var(--text-muted)">${escapeHtml(h.date)}</span>
            </div>
            <h4 class="font-display font-bold text-sm mb-1" style="color:var(--text-primary)">${escapeHtml(h.seoTitle)}</h4>
            <p class="font-mono text-xs truncate" style="color:var(--text-muted)">${escapeHtml(h.fileName)}</p>
          </div>
          <div class="flex items-center gap-2">
            <button type="button" class="mini-copy-btn flex-1 justify-center" data-history-copy="${h.id}">
              <i class="fas fa-copy"></i> Copy ${h.keywords.length} Tags
            </button>
          </div>
        </div>
      `)
      .join('');
  }

  // ── EVENT LISTENERS ──
  dropZone.addEventListener('click', () => fileInput.click());
  dropZone.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      fileInput.click();
    }
  });
  fileInput.addEventListener('change', e => {
    ingestFiles(e.target.files);
    fileInput.value = '';
  });

  dropZone.addEventListener('dragover', e => {
    e.preventDefault();
    dropZone.classList.add('drag-over');
  });
  dropZone.addEventListener('dragleave', () => dropZone.classList.remove('drag-over'));
  dropZone.addEventListener('drop', e => {
    e.preventDefault();
    dropZone.classList.remove('drag-over');
    ingestFiles(e.dataTransfer.files);
  });

  // Clipboard paste support (Ctrl+V / Cmd+V)
  document.addEventListener('paste', e => {
    if (['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) return;
    const files = e.clipboardData && e.clipboardData.files;
    if (files && files.length) ingestFiles(files);
  });

  // File queue clicks & removals
  fileQueue.addEventListener('click', e => {
    const removeBtn = e.target.closest('[data-remove]');
    if (removeBtn) {
      e.stopPropagation();
      const id = removeBtn.dataset.remove;
      state.files = state.files.filter(f => f.id !== id);
      if (state.activeId === id) {
        state.activeId = state.files.length ? state.files[0].id : null;
      }
      renderQueue();
      renderActivePreview();
      const next = getActiveEntry();
      next && next.result ? renderResult(next) : showEmptyState();
      return;
    }
    const item = e.target.closest('.file-queue-item');
    if (item) {
      state.activeId = item.dataset.id;
      renderQueue();
      renderActivePreview();
      const active = getActiveEntry();
      active && active.result ? renderResult(active) : showEmptyState();
    }
  });

  clearFilesBtn.addEventListener('click', () => {
    state.files = [];
    state.activeId = null;
    renderQueue();
    renderActivePreview();
    showEmptyState();
  });

  // Tag count slider, input & presets
  tagCountRange.addEventListener('input', e => setTagCount(e.target.value));
  tagCountInput.addEventListener('change', e => setTagCount(e.target.value));
  tagPresets.addEventListener('click', e => {
    const pill = e.target.closest('.preset-pill');
    if (pill) setTagCount(pill.dataset.count);
  });

  // Generate current file
  generateBtn.addEventListener('click', () => {
    const entry = getActiveEntry();
    if (!entry) {
      showToast('Please upload a file first!', 'warn');
      return;
    }
    generateForEntry(entry);
  });

  // Batch generate all uploaded files
  generateAllBtn.addEventListener('click', async () => {
    if (!state.files.length || state.isGenerating) return;
    for (const entry of state.files) {
      state.activeId = entry.id;
      renderQueue();
      renderActivePreview();
      await generateForEntry(entry);
    }
    showToast(`Finished generating SEO tags for all ${state.files.length} files!`);
  });

  // Sync manual edits on title/description
  outSeoTitle.addEventListener('input', () => {
    const entry = getActiveEntry();
    if (entry && entry.result) entry.result.seoTitle = outSeoTitle.value;
    updateCharCounts();
  });
  outMetaDesc.addEventListener('input', () => {
    const entry = getActiveEntry();
    if (entry && entry.result) entry.result.metaDescription = outMetaDesc.value;
    updateCharCounts();
  });
  outAltText.addEventListener('input', () => {
    const entry = getActiveEntry();
    if (entry && entry.result) entry.result.altText = outAltText.value;
  });
  outSeoSlug.addEventListener('input', () => {
    const entry = getActiveEntry();
    if (entry && entry.result) entry.result.seoSlug = outSeoSlug.value;
  });
  outCaption.addEventListener('input', () => {
    const entry = getActiveEntry();
    if (entry && entry.result) entry.result.seoCaption = outCaption.value;
  });

  // Individual field copy buttons
  document.querySelectorAll('[data-copy-target]').forEach(btn => {
    btn.addEventListener('click', () => {
      const target = document.getElementById(btn.dataset.copyTarget);
      if (target) copyText(target.value.trim(), 'Copied!');
    });
  });

  // Tags cloud interactions (toggle / remove)
  tagsCloud.addEventListener('click', e => {
    const entry = getActiveEntry();
    if (!entry || !entry.result) return;

    const delBtn = e.target.closest('[data-delete-idx]');
    if (delBtn) {
      e.stopPropagation();
      const idx = parseInt(delBtn.dataset.deleteIdx, 10);
      entry.result.tags.splice(idx, 1);
      renderTagsCloud(entry);
      return;
    }

    const chip = e.target.closest('.seo-tag-chip');
    if (chip) {
      const idx = parseInt(chip.dataset.idx, 10);
      if (entry.result.tags[idx]) {
        entry.result.tags[idx].selected = !entry.result.tags[idx].selected;
        renderTagsCloud(entry);
      }
    }
  });

  selectAllTagsBtn.addEventListener('click', () => {
    const entry = getActiveEntry();
    if (!entry || !entry.result) return;
    entry.result.tags.forEach(t => { t.selected = true; });
    renderTagsCloud(entry);
  });

  deselectAllTagsBtn.addEventListener('click', () => {
    const entry = getActiveEntry();
    if (!entry || !entry.result) return;
    entry.result.tags.forEach(t => { t.selected = false; });
    renderTagsCloud(entry);
  });

  // Add custom tag
  function addCustomTags() {
    const entry = getActiveEntry();
    if (!entry || !entry.result) return;
    const raw = customTagInput.value.trim();
    if (!raw) return;
    const parts = raw.split(',').map(cleanTag).filter(Boolean);
    const existing = new Set(entry.result.tags.map(t => t.text.toLowerCase()));
    let added = 0;
    parts.forEach(p => {
      if (!existing.has(p)) {
        entry.result.tags.push({ text: p, selected: true });
        existing.add(p);
        added++;
      }
    });
    customTagInput.value = '';
    if (added > 0) {
      renderTagsCloud(entry);
      showToast(`Added ${added} custom tag${added > 1 ? 's' : ''}`);
    }
  }
  addCustomTagBtn.addEventListener('click', addCustomTags);
  customTagInput.addEventListener('keydown', e => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addCustomTags();
    }
  });

  // Long-tail phrase copy
  longTailRow.addEventListener('click', e => {
    const chip = e.target.closest('[data-copy-phrase]');
    if (chip) copyText(chip.dataset.copyPhrase, 'Copied SEO phrase!');
  });

  // Bulk copy & export actions
  copyCommaBtn.addEventListener('click', () => {
    const tags = getSelectedTagTexts();
    copyText(tags.join(', '), `Copied ${tags.length} comma-separated SEO tags!`);
  });
  copyHashtagsBtn.addEventListener('click', () => {
    const tags = getSelectedTagTexts();
    const hashes = tags.map(t => '#' + t.replace(/[^a-z0-9\u0980-\u09FF]+/gi, ''));
    copyText(hashes.join(' '), `Copied ${tags.length} #hashtags!`);
  });
  copyLinesBtn.addEventListener('click', () => {
    const tags = getSelectedTagTexts();
    copyText(tags.join('\n'), `Copied ${tags.length} tags (one per line)!`);
  });
  copyHtmlBtn.addEventListener('click', () => {
    const entry = getActiveEntry();
    const tags = getSelectedTagTexts();
    const title = outSeoTitle.value.trim();
    const desc = outMetaDesc.value.trim();
    const alt = outAltText.value.trim();
    const slug = outSeoSlug.value.trim();
    const snippet = entry && entry.formatLabel === 'PDF'
      ? `<meta name="title" content="${escapeHtml(title)}">\n<meta name="description" content="${escapeHtml(desc)}">\n<meta name="keywords" content="${escapeHtml(tags.join(', '))}">\n<a href="${escapeHtml(slug)}" title="${escapeHtml(title)}">${escapeHtml(alt)}</a>`
      : `<meta name="title" content="${escapeHtml(title)}">\n<meta name="description" content="${escapeHtml(desc)}">\n<meta name="keywords" content="${escapeHtml(tags.join(', '))}">\n<img src="${escapeHtml(slug)}" alt="${escapeHtml(alt)}" title="${escapeHtml(title)}" loading="lazy" />`;
    copyText(snippet, 'Copied HTML SEO metadata snippet!');
  });

  exportCsvBtn.addEventListener('click', () => {
    const tags = getSelectedTagTexts();
    const csvEscape = s => `"${String(s || '').replace(/"/g, '""')}"`;
    const csv = [
      'Filename,Title,Description,Alt Text,Keywords',
      [
        csvEscape(outSeoSlug.value.trim()),
        csvEscape(outSeoTitle.value.trim()),
        csvEscape(outMetaDesc.value.trim()),
        csvEscape(outAltText.value.trim()),
        csvEscape(tags.join(', '))
      ].join(',')
    ].join('\n');
    downloadFile((outSeoSlug.value.trim().replace(/\.[^.]+$/, '') || 'sahadat-seo') + '.csv', csv, 'text/csv;charset=utf-8');
    showToast('Exported CSV file!');
  });

  exportTxtBtn.addEventListener('click', () => {
    const tags = getSelectedTagTexts();
    const txt = [
      '=== SAHADAT AI — SEO REPORT ===',
      `SEO Title: ${outSeoTitle.value.trim()}`,
      `SEO Filename: ${outSeoSlug.value.trim()}`,
      `Meta Description: ${outMetaDesc.value.trim()}`,
      `Alt Text: ${outAltText.value.trim()}`,
      `Caption: ${outCaption.value.trim()}`,
      '',
      `SEO Tags (${tags.length}):`,
      tags.join(', ')
    ].join('\n');
    downloadFile((outSeoSlug.value.trim().replace(/\.[^.]+$/, '') || 'sahadat-seo') + '.txt', txt, 'text/plain;charset=utf-8');
    showToast('Exported TXT report!');
  });

  exportJsonBtn.addEventListener('click', () => {
    const tags = getSelectedTagTexts();
    const payload = {
      generator: 'Sahadat AI',
      seoTitle: outSeoTitle.value.trim(),
      seoSlug: outSeoSlug.value.trim(),
      metaDescription: outMetaDesc.value.trim(),
      altText: outAltText.value.trim(),
      seoCaption: outCaption.value.trim(),
      tagCount: tags.length,
      keywords: tags
    };
    downloadFile((outSeoSlug.value.trim().replace(/\.[^.]+$/, '') || 'sahadat-seo') + '.json', JSON.stringify(payload, null, 2), 'application/json');
    showToast('Exported JSON metadata!');
  });

  // History actions
  historyGrid.addEventListener('click', e => {
    const btn = e.target.closest('[data-history-copy]');
    if (!btn) return;
    const rec = state.history.find(h => String(h.id) === btn.dataset.historyCopy);
    if (rec) copyText(rec.keywords.join(', '), `Copied ${rec.keywords.length} tags from history!`);
  });
  clearHistoryBtn.addEventListener('click', () => {
    state.history = [];
    localStorage.removeItem(STORAGE_KEY_HISTORY);
    renderHistory();
    showToast('History cleared', 'info');
  });

  // ── PASSWORD-PROTECTED ADMIN MODAL ("CHANGE AI") ──
  let unlockedAdminPassword = '';

  function setAdminFeedback(msg, type) {
    if (!adminFeedback) return;
    adminFeedback.className = 'admin-feedback' + (type ? ' ' + type : '');
    adminFeedback.textContent = msg || '';
  }

  function resetAdminModalToLocked() {
    unlockedAdminPassword = '';
    if (adminPasswordInput) adminPasswordInput.value = '';
    if (adminNewKeyInput) adminNewKeyInput.value = '';
    if (adminModelInput) adminModelInput.value = '';
    if (adminProviderSelect) adminProviderSelect.value = 'auto';
    if (adminCustomEndpointRow) adminCustomEndpointRow.classList.add('hidden');
    setAdminFeedback('', '');
    if (adminUnlockForm) adminUnlockForm.classList.remove('hidden');
    if (adminUpdateForm) adminUpdateForm.classList.add('hidden');
    if (workerUrlRow) {
      const hasHardcodedProxy = Boolean((SAHADAT_AI_CONFIG.proxyUrl || '').trim());
      workerUrlRow.classList.toggle('hidden', hasHardcodedProxy);
      if (!hasHardcodedProxy && adminWorkerUrlInput) {
        adminWorkerUrlInput.value = getActiveProxyUrl();
      }
    }
  }

  // Curated quick-pick vision models per provider (admin modal only)
  const ADMIN_MODEL_PRESETS = {
    openrouter: [
      { id: 'nvidia/nemotron-3.5-super-vl:free', label: 'Nemotron 3.5 Super VL (Free)' },
      { id: 'nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free', label: 'Nemotron 3 Nano Omni (Free)' },
      { id: 'google/gemini-2.5-flash', label: 'Google Gemini 2.5 Flash (via OpenRouter)' },
      { id: 'openai/gpt-4o-mini', label: 'OpenAI GPT-4o Mini (via OpenRouter)' },
      { id: 'anthropic/claude-sonnet-4', label: 'Claude Sonnet 4 (via OpenRouter)' }
    ],
    openai: [
      { id: 'gpt-4o-mini', label: 'GPT-4o Mini (Fast & Vision)' },
      { id: 'gpt-4o', label: 'GPT-4o (Flagship Vision)' },
      { id: 'gpt-4.1-mini', label: 'GPT-4.1 Mini' },
      { id: 'gpt-4.1', label: 'GPT-4.1' }
    ],
    gemini: [
      { id: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash (Fast Vision)' },
      { id: 'gemini-2.5-pro', label: 'Gemini 2.5 Pro' },
      { id: 'gemini-2.0-flash', label: 'Gemini 2.0 Flash' }
    ],
    anthropic: [
      { id: 'claude-sonnet-4-20250514', label: 'Claude Sonnet 4 (Vision)' },
      { id: 'claude-3-5-sonnet-latest', label: 'Claude 3.5 Sonnet' },
      { id: 'claude-3-5-haiku-latest', label: 'Claude 3.5 Haiku' }
    ],
    groq: [
      { id: 'meta-llama/llama-4-scout-17b-16e-instruct', label: 'Llama 4 Scout 17B (Vision)' },
      { id: 'meta-llama/llama-4-maverick-17b-128e-instruct', label: 'Llama 4 Maverick 17B (Vision)' }
    ],
    xai: [
      { id: 'grok-2-vision-latest', label: 'Grok 2 Vision Latest' }
    ],
    custom: []
  };

  function detectAdminProviderGuess(fallbackProvider) {
    const sel = adminProviderSelect ? adminProviderSelect.value : 'auto';
    if (sel !== 'auto') return sel;
    const key = adminNewKeyInput ? adminNewKeyInput.value.trim() : '';
    if (key.startsWith('sk-or-')) return 'openrouter';
    if (key.startsWith('sk-ant-')) return 'anthropic';
    if (key.startsWith('AIza')) return 'gemini';
    if (key.startsWith('gsk_')) return 'groq';
    if (key.startsWith('xai-')) return 'xai';
    if (key.startsWith('sk-')) return 'openai';
    return fallbackProvider || 'openrouter';
  }

  let lastServerActiveProvider = 'openrouter';

  function populateAdminModelDropdown(modelsList, currentModelId) {
    if (!adminModelSelect) return;
    const items = Array.isArray(modelsList) ? modelsList : [];
    const options = [
      '<option value="">✨ Auto Default (Best vision model for provider)</option>',
      ...items.map(m => `<option value="${escapeHtml(m.id)}">${escapeHtml(m.label || m.id)}</option>`),
      '<option value="__custom__">✏️ Custom Model ID (Type in box below)</option>'
    ];
    adminModelSelect.innerHTML = options.join('');
    if (currentModelId && items.some(m => m.id === currentModelId)) {
      adminModelSelect.value = currentModelId;
    } else if (currentModelId) {
      adminModelSelect.value = '__custom__';
    } else {
      adminModelSelect.value = '';
    }
  }

  function refreshAdminPresetModels(selectCurrent = false) {
    const prov = detectAdminProviderGuess(lastServerActiveProvider);
    const presets = ADMIN_MODEL_PRESETS[prov] || ADMIN_MODEL_PRESETS.openrouter;
    populateAdminModelDropdown(presets, selectCurrent ? adminModelInput.value.trim() : '');
  }

  if (adminProviderSelect) {
    adminProviderSelect.addEventListener('change', () => {
      if (adminCustomEndpointRow) {
        adminCustomEndpointRow.classList.toggle('hidden', adminProviderSelect.value !== 'custom');
      }
      refreshAdminPresetModels(false);
      // Clear model box when switching provider so auto-default or fresh pick applies cleanly
      if (adminModelInput) adminModelInput.value = '';
    });
  }

  let lastDetectedAdminProvider = 'openrouter';

  if (adminNewKeyInput) {
    adminNewKeyInput.addEventListener('input', () => {
      if (adminProviderSelect && adminProviderSelect.value === 'auto') {
        const guessed = detectAdminProviderGuess(lastServerActiveProvider);
        if (guessed !== lastDetectedAdminProvider) {
          lastDetectedAdminProvider = guessed;
          const presets = ADMIN_MODEL_PRESETS[guessed] || [];
          const autoDef = presets[0] ? presets[0].id : '';
          if (adminModelInput) adminModelInput.value = autoDef;
          populateAdminModelDropdown(presets, autoDef);
        }
      }
    });
  }

  if (adminModelSelect) {
    adminModelSelect.addEventListener('change', () => {
      if (!adminModelInput) return;
      const val = adminModelSelect.value;
      if (val === '__custom__') {
        adminModelInput.focus();
      } else {
        adminModelInput.value = val;
      }
    });
  }

  if (adminModelInput) {
    adminModelInput.addEventListener('input', () => {
      if (!adminModelSelect) return;
      const typed = adminModelInput.value.trim();
      const match = Array.from(adminModelSelect.options).find(opt => opt.value === typed);
      adminModelSelect.value = match ? typed : (typed ? '__custom__' : '');
    });
  }

  if (adminFetchModelsBtn) {
    adminFetchModelsBtn.addEventListener('click', async () => {
      const proxyUrl = getActiveProxyUrl();
      if (!proxyUrl || !unlockedAdminPassword) return;
      setAdminFeedback('', '');
      adminFetchModelsBtn.disabled = true;
      adminFetchModelsBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Loading...';
      try {
        const res = await fetch(`${proxyUrl}/admin/models`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            password: unlockedAdminPassword,
            provider: adminProviderSelect ? adminProviderSelect.value : 'auto',
            apiKey: adminNewKeyInput ? adminNewKeyInput.value.trim() : ''
          })
        });
        const data = await res.json().catch(() => ({}));
        if (res.ok && data.ok && Array.isArray(data.models) && data.models.length) {
          populateAdminModelDropdown(data.models, adminModelInput.value.trim());
          setAdminFeedback(`Loaded ${data.models.length} live models from ${data.providerLabel}. Pick one or type any Model ID below.`, 'success');
        } else {
          refreshAdminPresetModels(true);
          setAdminFeedback('Showing recommended presets (update Cloudflare Worker code for live model fetching).', 'error');
        }
      } catch {
        refreshAdminPresetModels(true);
        setAdminFeedback('Could not load live list — showing built-in presets.', 'error');
      } finally {
        adminFetchModelsBtn.disabled = false;
        adminFetchModelsBtn.innerHTML = '<i class="fas fa-rotate"></i> Load Live Models';
      }
    });
  }

  function openAdminModal() {
    resetAdminModalToLocked();
    adminModalBackdrop.classList.add('open');
    setTimeout(() => {
      if (workerUrlRow && !workerUrlRow.classList.contains('hidden') && !adminWorkerUrlInput.value) {
        adminWorkerUrlInput.focus();
      } else if (adminPasswordInput) {
        adminPasswordInput.focus();
      }
    }, 60);
  }

  function closeAdminModal() {
    unlockedAdminPassword = '';
    if (adminPasswordInput) adminPasswordInput.value = '';
    if (adminNewKeyInput) adminNewKeyInput.value = '';
    adminModalBackdrop.classList.remove('open');
  }

  if (openAdminBtn) openAdminBtn.addEventListener('click', openAdminModal);
  if (closeAdminModalBtn) closeAdminModalBtn.addEventListener('click', closeAdminModal);
  if (adminLockBtn) adminLockBtn.addEventListener('click', resetAdminModalToLocked);
  if (adminModalBackdrop) {
    adminModalBackdrop.addEventListener('click', e => {
      if (e.target === adminModalBackdrop) closeAdminModal();
    });
  }
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && adminModalBackdrop && adminModalBackdrop.classList.contains('open')) {
      closeAdminModal();
    }
  });

  if (adminUnlockForm) {
    adminUnlockForm.addEventListener('submit', async e => {
      e.preventDefault();
      setAdminFeedback('', '');

      const enteredWorker = adminWorkerUrlInput ? adminWorkerUrlInput.value.trim().replace(/\/+$/, '') : '';
      const proxyUrl = (SAHADAT_AI_CONFIG.proxyUrl || '').trim().replace(/\/+$/, '') || enteredWorker || getActiveProxyUrl();
      const password = adminPasswordInput.value.trim();

      if (!proxyUrl) {
        setAdminFeedback('Please enter your Cloudflare Worker URL first (from your Cloudflare setup).', 'error');
        return;
      }
      if (!password) {
        setAdminFeedback('Please enter the admin password.', 'error');
        return;
      }

      adminUnlockBtn.disabled = true;
      adminUnlockBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Verifying...';

      try {
        const res = await fetch(`${proxyUrl}/admin/verify`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ password })
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data.ok) {
          setAdminFeedback(data.error || 'Incorrect password or Worker not ready.', 'error');
          return;
        }

        if (enteredWorker && !(SAHADAT_AI_CONFIG.proxyUrl || '').trim()) {
          localStorage.setItem(STORAGE_KEY_PROXY, enteredWorker);
          updateEngineChipUI();
        }

        unlockedAdminPassword = password;
        lastServerActiveProvider = data.activeProvider || 'openrouter';
        lastDetectedAdminProvider = lastServerActiveProvider;
        if (adminActiveProvider) adminActiveProvider.textContent = data.providerLabel || 'OpenRouter';
        if (adminActiveModel) adminActiveModel.textContent = data.activeModel || 'Auto default';
        adminMaskedKey.textContent = data.maskedKey || 'Not set';
        adminUpdatedAt.textContent = data.updatedAt && data.updatedAt !== 'Initial secret'
          ? new Date(data.updatedAt).toLocaleString()
          : (data.updatedAt || 'Initial secret');
        if (adminProviderSelect) adminProviderSelect.value = 'auto';
        if (adminCustomEndpointRow) adminCustomEndpointRow.classList.add('hidden');
        if (adminEndpointInput) adminEndpointInput.value = data.activeEndpoint || '';
        adminModelInput.value = data.activeModel || '';
        refreshAdminPresetModels(true);
        adminUnlockForm.classList.add('hidden');
        adminUpdateForm.classList.remove('hidden');
        setAdminFeedback('Unlocked. Paste any API key and choose or type any Model ID below.', 'success');
        setTimeout(() => adminNewKeyInput.focus(), 60);
      } catch {
        setAdminFeedback('Could not reach Cloudflare Worker URL. Double-check the URL and try again.', 'error');
      } finally {
        adminUnlockBtn.disabled = false;
        adminUnlockBtn.innerHTML = '<i class="fas fa-unlock-keyhole"></i> Unlock Settings';
      }
    });
  }

  if (adminUpdateForm) {
    adminUpdateForm.addEventListener('submit', async e => {
      e.preventDefault();
      setAdminFeedback('', '');
      const proxyUrl = getActiveProxyUrl();
      const provider = adminProviderSelect ? adminProviderSelect.value : 'auto';
      const endpoint = adminEndpointInput ? adminEndpointInput.value.trim() : '';
      const newKey = adminNewKeyInput.value.trim();
      const newModel = adminModelInput.value.trim();

      if (!newKey && !newModel && provider === 'auto' && !endpoint) {
        setAdminFeedback('Enter a new API key or model ID to update.', 'error');
        return;
      }
      if (provider === 'custom' && !/^https:\/\//i.test(endpoint)) {
        setAdminFeedback('Please enter a valid https:// custom chat completions URL.', 'error');
        return;
      }

      adminSaveKeyBtn.disabled = true;
      adminSaveKeyBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Validating & Saving...';

      try {
        const res = await fetch(`${proxyUrl}/admin/update-key`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            password: unlockedAdminPassword,
            provider,
            endpoint,
            apiKey: newKey,
            model: newModel
          })
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data.ok) {
          setAdminFeedback(data.error || 'Failed to update API key.', 'error');
          return;
        }

        if (adminActiveProvider) adminActiveProvider.textContent = data.providerLabel || provider;
        if (adminActiveModel) adminActiveModel.textContent = data.activeModel || 'Auto default';
        adminMaskedKey.textContent = data.maskedKey || 'Updated';
        adminUpdatedAt.textContent = data.updatedAt ? new Date(data.updatedAt).toLocaleString() : 'Just now';
        adminNewKeyInput.value = '';
        adminModelInput.value = '';
        updateEngineChipUI();
        setAdminFeedback(data.message || 'Sahadat AI updated globally for all visitors!', 'success');
        showToast('Sahadat AI updated globally!');
      } catch {
        setAdminFeedback('Network error while saving to Cloudflare Worker.', 'error');
      } finally {
        adminSaveKeyBtn.disabled = false;
        adminSaveKeyBtn.innerHTML = '<i class="fas fa-cloud-arrow-up"></i> Update Live AI';
      }
    });
  }

  // ── OPTIONAL LOCALHOST CONFIG LOADER (only when no Worker proxy is set) ──
  function loadLocalDevConfigIfLocalhost() {
    if ((SAHADAT_AI_CONFIG.proxyUrl || '').trim()) return;
    const host = window.location.hostname;
    if (host !== 'localhost' && host !== '127.0.0.1') return;
    const s = document.createElement('script');
    s.src = 'ai-seo-config.local.js';
    s.onload = () => updateEngineChipUI();
    s.onerror = () => {};
    document.head.appendChild(s);
  }

  // ── INIT ──
  setTagCount(50);
  updateEngineChipUI();
  loadLocalDevConfigIfLocalhost();
  loadHistory();
})();
