/* ═══════════════════════════════════════════════════════════════════════════
   SAHADAT AI — AI SEO & MICROSTOCK METADATA ENGINE (ai-seo-tool.js)
   Features:
   • Multi-Provider BYOK API Secrets Vault (Gemini, OpenRouter, Mistral, Groq, OpenAI, Claude)
   • API Key Toggle (Sahadat AI Server vs Own API Key) + Model Selection + Auto-Rotation
   • METADATA Mode & PROMPT Mode (Image-to-Prompt + Style Toggles)
   • 18 Stock & Web SEO Platforms + Platform-Specific CSV & All-18 ZIP Exports
   • Multi-Format Ingestion: JPG, PNG, WEBP, GIF, SVG, EPS, AI, PDF, MP4, MOV, WEBM
   • Lossless Binary EXIF/IPTC/XMP Scrubbing & Injection + Bulk SEO .ZIP Export
   • Concurrent Batch Processor (1x–4x) + Detail View & Batch Cards View
   ═══════════════════════════════════════════════════════════════════════════ */

'use strict';

(() => {
  // ── SAHADAT AI SERVER CONFIG ──
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
  const STORAGE_KEY_SECRETS = 'sahadat_ai_secrets_vault_v1';
  const STORAGE_KEY_CUSTOM_PROMPT = 'sahadat_ai_custom_system_prompt';
  const STORAGE_KEY_PREFS = 'sahadat_ai_seo_prefs_v1';

  if (typeof window.pdfjsLib !== 'undefined') {
    window.pdfjsLib.GlobalWorkerOptions.workerSrc =
      'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
  }

  // ── 6 MULTI-PROVIDER BYOK SPECS (API SECRETS MANAGEMENT) ──
  const BYOK_PROVIDERS = {
    gemini: {
      id: 'gemini',
      label: 'Gemini',
      getKeyLabel: 'Get API Key from Google',
      getKeyUrl: 'https://aistudio.google.com/app/apikey',
      placeholder: 'AIza...',
      style: 'gemini',
      models: [
        { id: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash (Recommended)' },
        { id: 'gemini-2.5-flash-lite', label: 'Gemini 2.5 Flash-Lite (Fast)' },
        { id: 'gemini-2.5-pro', label: 'Gemini 2.5 Pro (Best Quality)' },
        { id: 'gemini-2.0-flash', label: 'Gemini 2.0 Flash' },
        { id: 'gemini-3.1-flash-lite-preview', label: 'Gemini 3.1 Flash-Lite Preview' }
      ]
    },
    openrouter: {
      id: 'openrouter',
      label: 'OpenRouter',
      getKeyLabel: 'Get API Key from OpenRouter',
      getKeyUrl: 'https://openrouter.ai/keys',
      placeholder: 'sk-or-v1-...',
      endpoint: 'https://openrouter.ai/api/v1/chat/completions',
      style: 'openai',
      models: [
        { id: 'nvidia/nemotron-3.5-super-vl:free', label: 'Nemotron 3.5 Super VL (Free)' },
        { id: 'google/gemma-4-26b-a4b-it', label: 'Google Gemma 4 26B' },
        { id: 'google/gemma-4-31b-it', label: 'Google Gemma 4 31B' },
        { id: 'google/gemini-2.5-flash', label: 'Google Gemini 2.5 Flash' },
        { id: 'openai/gpt-4o-mini', label: 'OpenAI GPT-4o Mini' },
        { id: 'anthropic/claude-sonnet-4', label: 'Claude Sonnet 4' }
      ]
    },
    mistral: {
      id: 'mistral',
      label: 'Mistral',
      getKeyLabel: 'Get API Key from Mistral',
      getKeyUrl: 'https://console.mistral.ai/api-keys/',
      placeholder: 'Enter Mistral Key...',
      endpoint: 'https://api.mistral.ai/v1/chat/completions',
      style: 'openai',
      models: [
        { id: 'pixtral-12b-2409', label: 'Pixtral 12B (Vision)' },
        { id: 'pixtral-large-latest', label: 'Pixtral Large (Vision)' },
        { id: 'mistral-small-latest', label: 'Mistral Small 3.1 (Vision)' }
      ]
    },
    groq: {
      id: 'groq',
      label: 'Groq',
      getKeyLabel: 'Get API Key from Groq',
      getKeyUrl: 'https://console.groq.com/keys',
      placeholder: 'gsk_...',
      endpoint: 'https://api.groq.com/openai/v1/chat/completions',
      style: 'openai',
      models: [
        { id: 'meta-llama/llama-4-scout-17b-16e-instruct', label: 'Llama 4 Scout 17B (Vision)' },
        { id: 'meta-llama/llama-4-maverick-17b-128e-instruct', label: 'Llama 4 Maverick 17B (Vision)' }
      ]
    },
    openai: {
      id: 'openai',
      label: 'OpenAI',
      getKeyLabel: 'Get API Key from OpenAI',
      getKeyUrl: 'https://platform.openai.com/api-keys',
      placeholder: 'sk-...',
      endpoint: 'https://api.openai.com/v1/chat/completions',
      style: 'openai',
      models: [
        { id: 'gpt-4o-mini', label: 'GPT-4o Mini Paid (Fast Vision)' },
        { id: 'gpt-4o', label: 'GPT-4o Paid (Flagship Vision)' },
        { id: 'gpt-4.1-mini', label: 'GPT-4.1 Mini Paid' },
        { id: 'gpt-4.1', label: 'GPT-4.1 Paid' },
        { id: 'gpt-4-turbo', label: 'GPT-4 Turbo Paid' }
      ]
    },
    claude: {
      id: 'claude',
      label: 'Claude',
      getKeyLabel: 'Get API Key from Claude',
      getKeyUrl: 'https://console.anthropic.com/settings/keys',
      placeholder: 'sk-ant-...',
      endpoint: 'https://api.anthropic.com/v1/messages',
      style: 'anthropic',
      models: [
        { id: 'claude-sonnet-4-20250514', label: 'Claude Sonnet 4 Paid (Vision)' },
        { id: 'claude-3-7-sonnet-latest', label: 'Claude 3.7 Sonnet Paid' },
        { id: 'claude-3-5-sonnet-latest', label: 'Claude 3.5 Sonnet Paid' },
        { id: 'claude-3-5-haiku-latest', label: 'Claude 3.5 Haiku Paid' }
      ]
    }
  };

  // ── ADOBE STOCK / UNIVERSAL CATEGORY MAP (1–21) ──
  const STOCK_CATEGORIES = {
    1: 'Animals',
    2: 'Buildings and Architecture',
    3: 'Business',
    4: 'Drinks',
    5: 'The Environment',
    6: 'States of Mind',
    7: 'Food',
    8: 'Graphic Resources',
    9: 'Hobbies and Leisure',
    10: 'Industry',
    11: 'Landscapes',
    12: 'Lifestyle',
    13: 'People',
    14: 'Plants and Flowers',
    15: 'Culture and Religion',
    16: 'Science',
    17: 'Social Issues',
    18: 'Sports',
    19: 'Technology',
    20: 'Transport',
    21: 'Travel'
  };

  // ── 18 STOCK & SEO PLATFORMS WITH OFFICIAL CSV FORMATS ──
  const PLATFORMS = {
    general: {
      id: 'general',
      name: 'General',
      hint: 'General · Web & Universal SEO',
      csvFile: 'general-seo-metadata.csv',
      headers: ['Filename', 'SEO Slug', 'Title', 'Description', 'Alt Text', 'Caption', 'Keywords', 'Category', 'Prompt'],
      row: (e, r, kws) => [
        e.name,
        r.seoSlug || e.name,
        r.seoTitle,
        r.metaDescription,
        r.altText,
        r.seoCaption,
        kws.join(', '),
        STOCK_CATEGORIES[r.categoryId] || 'Graphic Resources',
        r.generatedPrompt || ''
      ]
    },
    adobe: {
      id: 'adobe',
      name: 'Adobe Stock',
      hint: 'Adobe Stock · Filename, Title, Keywords, Category (1–21), Releases',
      csvFile: 'adobe-stock.csv',
      headers: ['Filename', 'Title', 'Keywords', 'Category', 'Releases'],
      row: (e, r, kws) => [e.name, r.seoTitle, kws.slice(0, 49).join(', '), String(r.categoryId || 8), '']
    },
    shutter: {
      id: 'shutter',
      name: 'Shutterstock',
      hint: 'Shutterstock · Filename, Description, Keywords, Categories, Editorial',
      csvFile: 'shutterstock.csv',
      headers: ['Filename', 'Description', 'Keywords', 'Categories', 'Editorial', 'Mature content', 'Illustration'],
      row: (e, r, kws) => [
        e.name,
        r.seoTitle || r.metaDescription,
        kws.slice(0, 50).join(', '),
        STOCK_CATEGORIES[r.categoryId] || 'Graphic Resources',
        'no',
        'no',
        ['SVG', 'EPS', 'AI'].includes(e.formatLabel) ? 'yes' : 'no'
      ]
    },
    freepik: {
      id: 'freepik',
      name: 'Freepik',
      hint: 'Freepik · File name, Title, Keywords, Prompt, Model',
      csvFile: 'freepik.csv',
      headers: ['File name', 'Title', 'Keywords', 'Prompt', 'Model'],
      row: (e, r, kws) => [
        e.name,
        r.seoTitle,
        kws.slice(0, 50).join(', '),
        r.generatedPrompt || r.metaDescription,
        r.generatedPrompt ? 'Midjourney 6' : ''
      ]
    },
    vecteezy: {
      id: 'vecteezy',
      name: 'Vecteezy',
      hint: 'Vecteezy · Filename, Title, Description, Keywords, License',
      csvFile: 'vecteezy.csv',
      headers: ['Filename', 'Title', 'Description', 'Keywords', 'License'],
      row: (e, r, kws) => [e.name, r.seoTitle, r.metaDescription, kws.slice(0, 50).join(', '), 'Pro']
    },
    miricanvas: {
      id: 'miricanvas',
      name: 'MiriCanvas',
      hint: 'MiriCanvas · fileName, elementName, keywords, tier',
      csvFile: 'miricanvas.csv',
      headers: ['fileName', 'elementName', 'keywords', 'tier'],
      row: (e, r, kws) => [e.name, r.seoTitle, kws.slice(0, 45).join(', '), 'Pro']
    },
    canva: {
      id: 'canva',
      name: 'Canva',
      hint: 'Canva · filename, title, keywords, artist, locale, description',
      csvFile: 'canva.csv',
      headers: ['filename', 'title', 'keywords', 'artist', 'locale', 'description'],
      row: (e, r, kws) => [e.name, r.seoTitle, kws.slice(0, 50).join(', '), '', 'en', r.metaDescription]
    },
    '123rf': {
      id: '123rf',
      name: '123RF',
      hint: '123RF · Old Filename, New Filename, Title, Description, Keywords',
      csvFile: '123rf.csv',
      headers: ['Old Filename', 'New Filename', 'Title', 'Description', 'Keywords', 'Country'],
      row: (e, r, kws) => [e.name, r.seoSlug || e.name, r.seoTitle, r.metaDescription, kws.slice(0, 50).join(', '), '']
    },
    deposit: {
      id: 'deposit',
      name: 'Depositphotos',
      hint: 'Depositphotos · Filename, Description, Keywords, Nudity, Editorial',
      csvFile: 'depositphotos.csv',
      headers: ['Filename', 'Description', 'Keywords', 'Nudity', 'Editorial'],
      row: (e, r, kws) => [e.name, r.seoTitle, kws.slice(0, 50).join(', '), 'no', 'no']
    },
    dreamstime: {
      id: 'dreamstime',
      name: 'Dreamstime',
      hint: 'Dreamstime · Filename, Image Name, Description, Categories, Keywords',
      csvFile: 'dreamstime.csv',
      headers: ['Filename', 'Image Name', 'Description', 'Category 1', 'Category 2', 'Category 3', 'Keywords', 'Free', 'W-EL', 'P-EL', 'SR-EL', 'SR-Price', 'Editorial'],
      row: (e, r, kws) => [e.name, r.seoTitle, r.metaDescription, STOCK_CATEGORIES[r.categoryId] || 'Graphic Resources', '', '', kws.slice(0, 50).join(', '), '0', '1', '1', '0', '0', '0']
    },
    istock: {
      id: 'istock',
      name: 'iStock',
      hint: 'iStock · file name, title, description, keywords, country, brief code',
      csvFile: 'istock.csv',
      headers: ['file name', 'title', 'description', 'keywords', 'country', 'brief code'],
      row: (e, r, kws) => [e.name, r.seoTitle, r.metaDescription, kws.slice(0, 50).join(', '), '', '']
    },
    getty: {
      id: 'getty',
      name: 'Getty Images',
      hint: 'Getty Images · file name, title, description, keywords, editorial',
      csvFile: 'getty-images.csv',
      headers: ['file name', 'title', 'description', 'keywords', 'country', 'editorial'],
      row: (e, r, kws) => [e.name, r.seoTitle, r.metaDescription, kws.slice(0, 50).join(', '), '', 'no']
    },
    alamy: {
      id: 'alamy',
      name: 'Alamy',
      hint: 'Alamy · Filename, Caption, Tags, Is Editorial, Location',
      csvFile: 'alamy.csv',
      headers: ['Filename', 'Caption', 'Tags', 'Is Editorial', 'Location'],
      row: (e, r, kws) => [e.name, r.seoTitle + '. ' + r.metaDescription, kws.slice(0, 50).join(', '), 'No', '']
    },
    pngtree: {
      id: 'pngtree',
      name: 'Pngtree',
      hint: 'Pngtree · Filename, Title, Keywords, Category',
      csvFile: 'pngtree.csv',
      headers: ['Filename', 'Title', 'Keywords', 'Category'],
      row: (e, r, kws) => [e.name, r.seoTitle, kws.slice(0, 40).join(', '), STOCK_CATEGORIES[r.categoryId] || 'Graphic Resources']
    },
    pikbest: {
      id: 'pikbest',
      name: 'Pikbest',
      hint: 'Pikbest · Filename, Title, Keywords, Category',
      csvFile: 'pikbest.csv',
      headers: ['Filename', 'Title', 'Keywords', 'Category'],
      row: (e, r, kws) => [e.name, r.seoTitle, kws.slice(0, 40).join(', '), STOCK_CATEGORIES[r.categoryId] || 'Graphic Resources']
    },
    pond5: {
      id: 'pond5',
      name: 'Pond5',
      hint: 'Pond5 · Filename, Title, Description, Keywords, Price, Editorial',
      csvFile: 'pond5.csv',
      headers: ['Filename', 'Title', 'Description', 'Keywords', 'Price', 'Editorial'],
      row: (e, r, kws) => [e.name, r.seoTitle, r.metaDescription, kws.slice(0, 50).join(', '), '', 'No']
    },
    envato: {
      id: 'envato',
      name: 'Envato',
      hint: 'Envato Elements · Filename, Title, Description, Keywords, Category',
      csvFile: 'envato.csv',
      headers: ['Filename', 'Title', 'Description', 'Keywords', 'Category'],
      row: (e, r, kws) => [e.name, r.seoTitle, r.metaDescription, kws.slice(0, 50).join(', '), STOCK_CATEGORIES[r.categoryId] || 'Graphic Resources']
    },
    bigstock: {
      id: 'bigstock',
      name: 'Bigstock',
      hint: 'Bigstock · Filename, Title, Description, Keywords, Categories',
      csvFile: 'bigstock.csv',
      headers: ['Filename', 'Title', 'Description', 'Keywords', 'Categories'],
      row: (e, r, kws) => [e.name, r.seoTitle, r.metaDescription, kws.slice(0, 50).join(', '), STOCK_CATEGORIES[r.categoryId] || 'Graphic Resources']
    }
  };

  // ── STATE ──
  const state = {
    files: [], // { id, file, name, ext, formatLabel, sizeBytes, width, height, pageCount, duration, previewDataUrl, visionDataUrl, extractedText, dominantColors, status:'waiting'|'processing'|'done'|'failed', errorMsg, result, batchEditingKw:false }
    activeId: null,
    mode: 'metadata', // 'metadata' | 'prompt'
    viewMode: 'detail', // 'detail' | 'batch'
    platform: 'general',
    titleMinLen: 65,
    titleMaxLen: 120,
    descLen: 160,
    tagCount: 50,
    promptMaxWords: 60,
    promptStyles: {
      silhouette: false,
      whiteBg: false,
      digitalArt: false
    },
    isGenerating: false,
    batchRunning: false,
    batchAborted: false,
    keywordsRawEditing: false,
    history: [],
    modalProviderTab: 'gemini'
  };

  // ── BYOK SECRETS VAULT ──
  function createDefaultVault() {
    const providers = {};
    Object.keys(BYOK_PROVIDERS).forEach(pid => {
      providers[pid] = {
        model: BYOK_PROVIDERS[pid].models[0].id,
        customModel: '',
        selectedKeyId: null,
        keys: []
      };
    });
    return {
      useOwnKey: false,
      activeProvider: 'gemini',
      autoRotate: true,
      providers
    };
  }

  let secretsVault = createDefaultVault();

  function loadSecretsVault() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_SECRETS);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      const base = createDefaultVault();
      base.useOwnKey = Boolean(parsed.useOwnKey);
      base.activeProvider = BYOK_PROVIDERS[parsed.activeProvider] ? parsed.activeProvider : 'gemini';
      base.autoRotate = parsed.autoRotate !== false;
      Object.keys(BYOK_PROVIDERS).forEach(pid => {
        const savedP = parsed.providers && parsed.providers[pid];
        if (savedP) {
          base.providers[pid].model = savedP.model || BYOK_PROVIDERS[pid].models[0].id;
          base.providers[pid].customModel = savedP.customModel || '';
          base.providers[pid].selectedKeyId = savedP.selectedKeyId || null;
          base.providers[pid].keys = Array.isArray(savedP.keys)
            ? savedP.keys.map(k => ({
                id: k.id,
                value: k.value,
                keyId4: k.keyId4 || String(Math.floor(1000 + Math.random() * 9000)),
                status: k.status || 'untested',
                revealed: false
              }))
            : [];
        }
      });
      secretsVault = base;
    } catch {
      secretsVault = createDefaultVault();
    }
  }

  function saveSecretsVault() {
    try {
      const clean = {
        useOwnKey: secretsVault.useOwnKey,
        activeProvider: secretsVault.activeProvider,
        autoRotate: secretsVault.autoRotate,
        providers: {}
      };
      Object.keys(secretsVault.providers).forEach(pid => {
        const p = secretsVault.providers[pid];
        clean.providers[pid] = {
          model: p.model,
          customModel: p.customModel || '',
          selectedKeyId: p.selectedKeyId,
          keys: (p.keys || []).map(k => ({
            id: k.id,
            value: k.value,
            keyId4: k.keyId4,
            status: k.status
          }))
        };
      });
      localStorage.setItem(STORAGE_KEY_SECRETS, JSON.stringify(clean));
    } catch {
      // Ignore storage quota errors
    }
  }

  function getSelectedKeyForProvider(provId) {
    const p = secretsVault.providers[provId];
    if (!p || !p.keys.length) return null;
    return p.keys.find(k => k.id === p.selectedKeyId) || p.keys[0];
  }

  function getEffectiveModelForProvider(provId) {
    const p = secretsVault.providers[provId];
    if (!p) return '';
    if (p.model === '__custom__' && p.customModel) return p.customModel.trim();
    return p.model || BYOK_PROVIDERS[provId].models[0].id;
  }

  // ── DOM REFERENCES ──
  const openApiSecretsBtn = document.getElementById('openApiSecretsBtn');
  const engineChipLabel = document.getElementById('engineChipLabel');
  const useOwnKeyToggle = document.getElementById('useOwnKeyToggle');
  const apiModeStatusSub = document.getElementById('apiModeStatusSub');
  const apiQuickControls = document.getElementById('apiQuickControls');
  const quickProviderSelect = document.getElementById('quickProviderSelect');
  const quickModelSelect = document.getElementById('quickModelSelect');
  const apiKeyMissingWarn = document.getElementById('apiKeyMissingWarn');
  const missingKeyProvName = document.getElementById('missingKeyProvName');
  const quickAddKeyBtn = document.getElementById('quickAddKeyBtn');

  const tabMetadataBtn = document.getElementById('tabMetadataBtn');
  const tabPromptBtn = document.getElementById('tabPromptBtn');
  const metadataConfig = document.getElementById('metadataConfig');
  const promptConfig = document.getElementById('promptConfig');

  const titleMinLenSlider = document.getElementById('titleMinLenSlider');
  const titleMinLenVal = document.getElementById('titleMinLenVal');
  const titleMaxLenSlider = document.getElementById('titleMaxLenSlider');
  const titleMaxLenVal = document.getElementById('titleMaxLenVal');
  const descLenSlider = document.getElementById('descLenSlider');
  const descLenVal = document.getElementById('descLenVal');
  const tagCountRange = document.getElementById('tagCountRange');
  const tagCountInput = document.getElementById('tagCountInput');
  const tagPresets = document.getElementById('tagPresets');
  const languageSelect = document.getElementById('languageSelect');

  const promptLenSlider = document.getElementById('promptLenSlider');
  const promptLenVal = document.getElementById('promptLenVal');
  const toggleSilhouette = document.getElementById('toggleSilhouette');
  const toggleWhiteBg = document.getElementById('toggleWhiteBg');
  const toggleDigital = document.getElementById('toggleDigital');

  const contentTypeSelect = document.getElementById('contentTypeSelect');
  const batchSpeedSelect = document.getElementById('batchSpeedSelect');
  const customPromptInput = document.getElementById('customPromptInput');
  const restorePromptBtn = document.getElementById('restorePromptBtn');

  const generateBtn = document.getElementById('generateBtn');
  const generateBtnLabel = document.getElementById('generateBtnLabel');
  const stopBatchBtnSide = document.getElementById('stopBatchBtnSide');

  const platformGrid = document.getElementById('platformGrid');
  const activePlatformHint = document.getElementById('activePlatformHint');
  const dropZone = document.getElementById('seoDropZone');
  const fileInput = document.getElementById('seoFileInput');
  const fileQueueWrap = document.getElementById('fileQueueWrap');
  const fileQueue = document.getElementById('fileQueue');
  const fileCountNum = document.getElementById('fileCountNum');

  const batchStatusDot = document.getElementById('batchStatusDot');
  const batchStatusText = document.getElementById('batchStatusText');
  const clearFilesBtn = document.getElementById('clearFilesBtn');
  const runBatchBtn = document.getElementById('runBatchBtn');
  const stopBatchBtn = document.getElementById('stopBatchBtn');
  const csvDropdownBtn = document.getElementById('csvDropdownBtn');
  const csvDropdownMenu = document.getElementById('csvDropdownMenu');
  const exportActivePlatformCsvBtn = document.getElementById('exportActivePlatformCsvBtn');
  const exportActivePlatformCsvLabel = document.getElementById('exportActivePlatformCsvLabel');
  const exportAll18CsvZipBtn = document.getElementById('exportAll18CsvZipBtn');
  const exportBatchJsonBtn = document.getElementById('exportBatchJsonBtn');
  const exportBatchTxtBtn = document.getElementById('exportBatchTxtBtn');
  const exportSeoZipBtn = document.getElementById('exportSeoZipBtn');

  const resultSourceBadge = document.getElementById('resultSourceBadge');
  const emptyResults = document.getElementById('emptyResults');
  const batchResultsList = document.getElementById('batchResultsList');

  // API Secrets Management Modal DOM
  const apiSecretsBackdrop = document.getElementById('apiSecretsBackdrop');
  const apiSecretsModalBox = document.getElementById('apiSecretsModalBox');
  const closeApiSecretsBtn = document.getElementById('closeApiSecretsBtn');
  const apiSecretsLockGate = document.getElementById('apiSecretsLockGate');
  const apiSecretsFeedback = document.getElementById('apiSecretsFeedback');
  const apiSecretsUnlockForm = document.getElementById('apiSecretsUnlockForm');
  const apiSecretsPasswordInput = document.getElementById('apiSecretsPasswordInput');
  const apiSecretsUnlockBtn = document.getElementById('apiSecretsUnlockBtn');
  const apiSecretsUnlockedBody = document.getElementById('apiSecretsUnlockedBody');
  const apiSecretsLockBtn = document.getElementById('apiSecretsLockBtn');
  const apiProviderTabs = document.getElementById('apiProviderTabs');
  const apiProvBadge = document.getElementById('apiProvBadge');
  const apiModalModelSelect = document.getElementById('apiModalModelSelect');
  const apiCustomModelWrap = document.getElementById('apiCustomModelWrap');
  const apiCustomModelInput = document.getElementById('apiCustomModelInput');
  const apiModalKeyInput = document.getElementById('apiModalKeyInput');
  const toggleNewKeyVisBtn = document.getElementById('toggleNewKeyVisBtn');
  const saveProviderKeyBtn = document.getElementById('saveProviderKeyBtn');
  const getApiKeyLink = document.getElementById('getApiKeyLink');
  const getApiKeyLabel = document.getElementById('getApiKeyLabel');
  const autoRotateKeysToggle = document.getElementById('autoRotateKeysToggle');
  const storedKeysCountNum = document.getElementById('storedKeysCountNum');
  const storedKeysGlobalActions = document.getElementById('storedKeysGlobalActions');
  const copyAllKeysBtn = document.getElementById('copyAllKeysBtn');
  const testAllKeysBtn = document.getElementById('testAllKeysBtn');
  const storedKeysList = document.getElementById('storedKeysList');
  const modalOwnKeyToggle = document.getElementById('modalOwnKeyToggle');
  const openAdminFromSecretsBtn = document.getElementById('openAdminFromSecretsBtn');
  const apiSecretsDoneBtn = document.getElementById('apiSecretsDoneBtn');

  // Admin Modal DOM
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

  // Lightbox & History & Toast
  const lightboxBackdrop = document.getElementById('lightboxBackdrop');
  const closeLightboxBtn = document.getElementById('closeLightboxBtn');
  const lightboxImg = document.getElementById('lightboxImg');
  const lightboxTitle = document.getElementById('lightboxTitle');
  const lightboxSpecs = document.getElementById('lightboxSpecs');

  const historySection = document.getElementById('historySection');
  const historyGrid = document.getElementById('historyGrid');
  const clearHistoryBtn = document.getElementById('clearHistoryBtn');
  const seoToast = document.getElementById('seoToast');

  // ── UTILITIES ──
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

  function formatBytes(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  }

  function getExtension(filename) {
    const m = String(filename || '').toLowerCase().match(/\.([a-z0-9]+)$/);
    return m ? m[1] : '';
  }

  function escapeHtml(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function escapeXml(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }

  function maskApiKey(key) {
    const k = String(key || '').trim();
    if (k.length <= 10) return '••••••';
    return k.slice(0, 8) + '••••' + k.slice(-4);
  }

  function getActiveEntry() {
    return state.files.find(f => f.id === state.activeId) || null;
  }

  function getActiveProxyUrl() {
    const savedProxy = (localStorage.getItem(STORAGE_KEY_PROXY) || '').trim();
    const localProxy = (window.SAHADAT_AI_LOCAL_CONFIG && window.SAHADAT_AI_LOCAL_CONFIG.proxyUrl || '').trim();
    const base = (SAHADAT_AI_CONFIG.proxyUrl || '').trim() || localProxy || savedProxy;
    return base.replace(/\/+$/, '');
  }

  function getLegacyLocalApiKey() {
    const saved = (localStorage.getItem(STORAGE_KEY_API) || '').trim();
    const localCfg = (window.SAHADAT_AI_LOCAL_CONFIG && window.SAHADAT_AI_LOCAL_CONFIG.apiKey || '').trim();
    return saved || localCfg || (SAHADAT_AI_CONFIG.apiKey || '').trim();
  }

  function isUsingBYOK() {
    return Boolean(secretsVault.useOwnKey);
  }

  function hasLiveAI() {
    if (isUsingBYOK()) {
      return Boolean(getSelectedKeyForProvider(secretsVault.activeProvider));
    }
    return Boolean(getActiveProxyUrl() || getLegacyLocalApiKey());
  }

  // ── SYNC SIDEBAR API TOGGLE + QUICK MODEL PICKER ──
  function populateQuickModelSelect(provId) {
    const spec = BYOK_PROVIDERS[provId] || BYOK_PROVIDERS.gemini;
    const provState = secretsVault.providers[provId];
    const opts = [
      ...spec.models.map(m => `<option value="${escapeHtml(m.id)}">${escapeHtml(m.label)}</option>`),
      `<option value="__custom__">${provState.customModel ? `Custom: ${escapeHtml(provState.customModel)}` : 'Custom Model ID...'}</option>`
    ];
    quickModelSelect.innerHTML = opts.join('');
    if (provState.model === '__custom__') {
      quickModelSelect.value = '__custom__';
    } else if (spec.models.some(m => m.id === provState.model)) {
      quickModelSelect.value = provState.model;
    } else {
      quickModelSelect.value = spec.models[0].id;
    }
  }

  let unlockedAdminPassword = '';
  let secretsUnlocked = false;
  let lastVerifiedAdminData = null;
  let pendingToggleAfterUnlock = null;

  function setApiSecretsFeedback(msg, type) {
    if (!apiSecretsFeedback) return;
    apiSecretsFeedback.className = 'admin-feedback' + (type ? ' ' + type : '');
    apiSecretsFeedback.textContent = msg || '';
  }

  function resetApiSecretsModalToLocked() {
    secretsUnlocked = false;
    pendingToggleAfterUnlock = null;
    if (apiSecretsPasswordInput) apiSecretsPasswordInput.value = '';
    if (apiModalKeyInput) apiModalKeyInput.value = '';
    if (storedKeysList) storedKeysList.innerHTML = '';
    setApiSecretsFeedback('', '');
    if (apiSecretsModalBox) apiSecretsModalBox.classList.remove('wide-modal');
    if (apiSecretsLockGate) apiSecretsLockGate.classList.remove('hidden');
    if (apiSecretsUnlockedBody) apiSecretsUnlockedBody.classList.add('hidden');
    syncApiToggleUI();
  }

  function syncApiToggleUI() {
    const own = secretsVault.useOwnKey;
    const provId = secretsVault.activeProvider;
    const spec = BYOK_PROVIDERS[provId] || BYOK_PROVIDERS.gemini;
    const provState = secretsVault.providers[provId];
    const activeKey = getSelectedKeyForProvider(provId);

    if (useOwnKeyToggle) useOwnKeyToggle.checked = own;
    if (modalOwnKeyToggle) modalOwnKeyToggle.checked = own;
    if (autoRotateKeysToggle) autoRotateKeysToggle.checked = secretsVault.autoRotate;

    if (quickProviderSelect) quickProviderSelect.value = provId;
    populateQuickModelSelect(provId);

    // Keep provider/model/key details hidden in sidebar unless unlocked by admin password
    if (!secretsUnlocked) {
      if (apiQuickControls) apiQuickControls.classList.add('hidden');
      if (apiKeyMissingWarn) apiKeyMissingWarn.classList.add('hidden');
      apiModeStatusSub.textContent = own
        ? 'ON · Custom API Key Active (Password Protected)'
        : 'OFF · Using Sahadat AI Server';
      engineChipLabel.textContent = 'API Keys';
      openApiSecretsBtn.classList.toggle('live', hasLiveAI());
      updateGenerateButtonLabels();
      return;
    }

    if (own) {
      apiQuickControls.classList.remove('hidden');
      if (activeKey) {
        apiKeyMissingWarn.classList.add('hidden');
        const keyIdx = provState.keys.findIndex(k => k.id === activeKey.id) + 1;
        apiModeStatusSub.textContent = `ON · ${spec.label} · Key #${keyIdx} (${getEffectiveModelForProvider(provId)})`;
        engineChipLabel.textContent = `${spec.label} BYOK`;
        openApiSecretsBtn.classList.add('live');
      } else {
        apiKeyMissingWarn.classList.remove('hidden');
        missingKeyProvName.textContent = spec.label;
        apiModeStatusSub.textContent = `ON · Add a ${spec.label} API key`;
        engineChipLabel.textContent = 'Add API Key';
        openApiSecretsBtn.classList.remove('live');
      }
    } else {
      apiQuickControls.classList.add('hidden');
      apiModeStatusSub.textContent = 'OFF · Using Sahadat AI Server';
      engineChipLabel.textContent = 'API Keys';
      openApiSecretsBtn.classList.toggle('live', Boolean(getActiveProxyUrl() || getLegacyLocalApiKey()));
    }

    updateGenerateButtonLabels();
  }

  // ── API SECRETS MANAGEMENT MODAL UI ──
  function updateProviderTabCounts() {
    Object.keys(BYOK_PROVIDERS).forEach(pid => {
      const badge = document.querySelector(`[data-prov-count="${pid}"]`);
      if (badge) badge.textContent = String((secretsVault.providers[pid].keys || []).length);
    });
  }

  function renderApiSecretsModal() {
    if (!secretsUnlocked) return;
    const provId = state.modalProviderTab;
    const spec = BYOK_PROVIDERS[provId] || BYOK_PROVIDERS.gemini;
    const provState = secretsVault.providers[provId];

    // Active tab styling
    apiProviderTabs.querySelectorAll('.api-prov-tab').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.prov === provId);
    });
    updateProviderTabCounts();

    apiProvBadge.textContent = spec.label;
    apiModalKeyInput.placeholder = spec.placeholder;
    getApiKeyLink.href = spec.getKeyUrl;
    getApiKeyLabel.textContent = spec.getKeyLabel;

    // Model dropdown
    const opts = [
      ...spec.models.map(m => `<option value="${escapeHtml(m.id)}">${escapeHtml(m.label)}</option>`),
      '<option value="__custom__">Custom Model ID...</option>'
    ];
    apiModalModelSelect.innerHTML = opts.join('');
    if (provState.model === '__custom__') {
      apiModalModelSelect.value = '__custom__';
      apiCustomModelWrap.classList.remove('hidden');
      apiCustomModelInput.value = provState.customModel || '';
    } else {
      apiModalModelSelect.value = spec.models.some(m => m.id === provState.model) ? provState.model : spec.models[0].id;
      apiCustomModelWrap.classList.add('hidden');
    }

    // Stored keys list
    const keys = provState.keys || [];
    storedKeysCountNum.textContent = String(keys.length);
    storedKeysGlobalActions.classList.toggle('hidden', keys.length === 0);

    if (!keys.length) {
      storedKeysList.innerHTML = `
        <div class="stored-keys-empty">
          <i class="fas fa-key"></i>
          <strong class="font-display text-sm" style="color:var(--text-secondary)">No keys found</strong>
          <span class="font-mono text-xs">Add your ${escapeHtml(spec.label)} API key on the left. Stored locally in your browser.</span>
        </div>
      `;
      return;
    }

    const activeKey = getSelectedKeyForProvider(provId);
    storedKeysList.innerHTML = keys
      .map((k, idx) => {
        const isSelected = activeKey && activeKey.id === k.id;
        const statusMap = {
          untested: { cls: 'untested', txt: 'Not Tested' },
          testing: { cls: 'testing', txt: 'Testing...' },
          valid: { cls: 'valid', txt: 'Valid' },
          invalid: { cls: 'invalid', txt: 'Invalid' }
        };
        const st = statusMap[k.status] || statusMap.untested;
        const displayVal = k.revealed ? k.value : maskApiKey(k.value);

        return `
          <div class="stored-key-card ${isSelected ? 'selected' : ''}" data-key-id="${escapeHtml(k.id)}">
            <div class="stored-key-top">
              <div class="min-w-0">
                <span class="font-mono text-xs mr-1.5" style="color:var(--violet);font-weight:700">#${idx + 1}</span>
                <span class="stored-key-val">${escapeHtml(displayVal)}</span>
              </div>
              <div class="flex items-center gap-1 shrink-0">
                ${isSelected
                  ? '<span class="key-status-badge valid"><i class="fas fa-check mr-1"></i>Selected</span>'
                  : `<button type="button" class="mini-copy-btn" data-key-action="select" data-key-id="${escapeHtml(k.id)}">Select</button>`
                }
              </div>
            </div>
            <div class="stored-key-meta">
              <div class="flex items-center gap-2">
                <span>Key ID: ${escapeHtml(k.keyId4)}</span>
                <span class="key-status-badge ${st.cls}">${st.txt}</span>
              </div>
              <div class="flex items-center gap-1.5">
                <button type="button" class="mini-copy-btn" data-key-action="reveal" data-key-id="${escapeHtml(k.id)}" title="Show/Hide Key">
                  <i class="fas ${k.revealed ? 'fa-eye-slash' : 'fa-eye'}"></i>
                </button>
                <button type="button" class="mini-copy-btn" data-key-action="copy" data-key-id="${escapeHtml(k.id)}" title="Copy Key">
                  <i class="fas fa-copy"></i>
                </button>
                <button type="button" class="mini-copy-btn" data-key-action="test" data-key-id="${escapeHtml(k.id)}" title="Test API Key">
                  <i class="fas fa-vial"></i> Test
                </button>
                <button type="button" class="mini-copy-btn" data-key-action="delete" data-key-id="${escapeHtml(k.id)}" title="Delete Key" style="color:#ef4444">
                  <i class="fas fa-trash"></i>
                </button>
              </div>
            </div>
          </div>
        `;
      })
      .join('');
  }

  async function verifyProviderApiKey(provId, apiKey) {
    const k = String(apiKey || '').trim();
    if (!k) return false;
    try {
      if (provId === 'gemini') {
        const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(k)}`);
        return r.ok;
      }
      if (provId === 'openrouter') {
        const r = await fetch('https://openrouter.ai/api/v1/auth/key', {
          headers: { Authorization: `Bearer ${k}` }
        });
        return r.ok;
      }
      if (provId === 'mistral') {
        const r = await fetch('https://api.mistral.ai/v1/models', {
          headers: { Authorization: `Bearer ${k}` }
        });
        return r.ok;
      }
      if (provId === 'groq') {
        const r = await fetch('https://api.groq.com/openai/v1/models', {
          headers: { Authorization: `Bearer ${k}` }
        });
        return r.ok;
      }
      if (provId === 'openai') {
        const r = await fetch('https://api.openai.com/v1/models', {
          headers: { Authorization: `Bearer ${k}` }
        });
        return r.ok;
      }
      if (provId === 'claude') {
        const r = await fetch('https://api.anthropic.com/v1/models', {
          headers: {
            'x-api-key': k,
            'anthropic-version': '2023-06-01',
            'anthropic-dangerous-direct-browser-access': 'true'
          }
        });
        return r.ok;
      }
      return false;
    } catch {
      return false;
    }
  }

  function openApiSecretsModal(focusProvider, toggleAfterUnlock = null) {
    state.modalProviderTab = BYOK_PROVIDERS[focusProvider] ? focusProvider : secretsVault.activeProvider;
    resetApiSecretsModalToLocked();
    pendingToggleAfterUnlock = toggleAfterUnlock;
    apiSecretsBackdrop.classList.add('open');
    setTimeout(() => {
      if (apiSecretsPasswordInput) apiSecretsPasswordInput.focus();
    }, 60);
  }

  function closeApiSecretsModal(clearAdminSession = true) {
    apiSecretsBackdrop.classList.remove('open');
    if (clearAdminSession) {
      unlockedAdminPassword = '';
      lastVerifiedAdminData = null;
    }
    resetApiSecretsModalToLocked();
  }

  // ── PREFS SAVE / LOAD (CUSTOM PROMPT, SLIDERS, PLATFORM) ──
  function savePrefs() {
    try {
      localStorage.setItem(STORAGE_KEY_PREFS, JSON.stringify({
        platform: state.platform,
        mode: state.mode,
        titleMinLen: state.titleMinLen,
        titleMaxLen: state.titleMaxLen,
        descLen: state.descLen,
        tagCount: state.tagCount,
        promptMaxWords: state.promptMaxWords,
        promptStyles: state.promptStyles,
        language: languageSelect.value,
        contentType: contentTypeSelect.value,
        batchSpeed: batchSpeedSelect.value
      }));
    } catch {
      // ignore
    }
  }

  function loadPrefs() {
    const savedPrompt = localStorage.getItem(STORAGE_KEY_CUSTOM_PROMPT);
    if (savedPrompt !== null && customPromptInput) {
      customPromptInput.value = savedPrompt;
    }
    try {
      const raw = localStorage.getItem(STORAGE_KEY_PREFS);
      if (!raw) return;
      const p = JSON.parse(raw);
      if (p.platform && PLATFORMS[p.platform]) state.platform = p.platform;
      if (p.mode === 'prompt' || p.mode === 'metadata') state.mode = p.mode;
      if (Number.isFinite(p.titleMinLen)) state.titleMinLen = Math.max(30, Math.min(150, p.titleMinLen));
      if (Number.isFinite(p.titleMaxLen)) state.titleMaxLen = Math.max(70, Math.min(200, p.titleMaxLen));
      if (Number.isFinite(p.descLen)) state.descLen = Math.max(50, Math.min(250, p.descLen));
      if (Number.isFinite(p.tagCount)) state.tagCount = Math.max(5, Math.min(150, p.tagCount));
      if (Number.isFinite(p.promptMaxWords)) state.promptMaxWords = Math.max(20, Math.min(150, p.promptMaxWords));
      if (p.promptStyles) {
        state.promptStyles.silhouette = Boolean(p.promptStyles.silhouette);
        state.promptStyles.whiteBg = Boolean(p.promptStyles.whiteBg);
        state.promptStyles.digitalArt = Boolean(p.promptStyles.digitalArt);
      }
      if (p.language && languageSelect) languageSelect.value = p.language;
      if (p.contentType && contentTypeSelect) contentTypeSelect.value = p.contentType;
      if (p.batchSpeed && batchSpeedSelect) batchSpeedSelect.value = String(p.batchSpeed);
    } catch {
      // ignore
    }
  }

  function applyPrefsToControls() {
    titleMinLenSlider.value = state.titleMinLen;
    titleMinLenVal.textContent = state.titleMinLen;
    titleMaxLenSlider.value = state.titleMaxLen;
    titleMaxLenVal.textContent = state.titleMaxLen;
    descLenSlider.value = state.descLen;
    descLenVal.textContent = state.descLen;
    setTagCount(state.tagCount, false);

    promptLenSlider.value = state.promptMaxWords;
    promptLenVal.textContent = state.promptMaxWords;
    toggleSilhouette.checked = state.promptStyles.silhouette;
    toggleWhiteBg.checked = state.promptStyles.whiteBg;
    toggleDigital.checked = state.promptStyles.digitalArt;
    syncPromptStylePills();

    setMode(state.mode, false);
    setPlatform(state.platform, false);
  }

  function syncPromptStylePills() {
    [toggleSilhouette, toggleWhiteBg, toggleDigital].forEach(cb => {
      if (cb && cb.parentElement) {
        cb.parentElement.classList.toggle('active', cb.checked);
      }
    });
  }

  function setMode(mode, shouldSave = true) {
    state.mode = mode === 'prompt' ? 'prompt' : 'metadata';
    const isMeta = state.mode === 'metadata';
    tabMetadataBtn.classList.toggle('active', isMeta);
    tabMetadataBtn.setAttribute('aria-selected', String(isMeta));
    tabPromptBtn.classList.toggle('active', !isMeta);
    tabPromptBtn.setAttribute('aria-selected', String(!isMeta));
    metadataConfig.classList.toggle('hidden', !isMeta);
    promptConfig.classList.toggle('hidden', isMeta);
    updateGenerateButtonLabels();
    if (state.files.length) {
      renderBatchCards();
    }
    if (shouldSave) savePrefs();
  }

  function setPlatform(platId, announce = true) {
    if (!PLATFORMS[platId]) return;
    state.platform = platId;
    const spec = PLATFORMS[platId];
    platformGrid.querySelectorAll('.platform-pill').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.platform === platId);
    });
    activePlatformHint.textContent = spec.hint;
    exportActivePlatformCsvLabel.textContent = `Download ${spec.name} CSV`;
    if (state.files.length) {
      renderBatchCards();
    }
    if (announce) {
      savePrefs();
      showToast(`Switched to ${spec.name} format`, 'info');
    }
  }

  function setTagCount(val, shouldSave = true) {
    const n = Math.max(5, Math.min(150, parseInt(val, 10) || 50));
    state.tagCount = n;
    tagCountInput.value = n;
    tagCountRange.value = Math.min(100, n);
    tagPresets.querySelectorAll('.preset-pill').forEach(btn => {
      btn.classList.toggle('active', parseInt(btn.dataset.count, 10) === n);
    });
    updateGenerateButtonLabels();
    if (state.files.length) {
      renderBatchCards();
    }
    if (shouldSave) savePrefs();
  }

  function getEntryMode(entry) {
    return (entry && entry.options && entry.options.mode) || state.mode;
  }

  function getEntryPlatform(entry) {
    const pid = entry && entry.options && entry.options.platform;
    return (pid && PLATFORMS[pid]) ? pid : state.platform;
  }

  function getEntryTagCount(entry) {
    const n = entry && entry.options && entry.options.tagCount;
    return (Number.isFinite(n) && n >= 5 && n <= 150) ? n : state.tagCount;
  }

  function getEntryHint(entry) {
    return String((entry && entry.options && entry.options.hint) || '').trim();
  }

  function updateGenerateButtonLabels() {
    if (state.isGenerating || state.batchRunning) return;
    const engineLabel = (secretsUnlocked && isUsingBYOK())
      ? (BYOK_PROVIDERS[secretsVault.activeProvider]?.label || 'BYOK')
      : 'Sahadat AI';
    const n = state.files.length;
    if (n > 1) {
      generateBtnLabel.textContent = state.mode === 'prompt'
        ? `Generate Separate Prompts (${n} Files · ${batchSpeedSelect.value}x)`
        : `Generate Separate SEO (${n} Files · ${batchSpeedSelect.value}x)`;
    } else if (state.mode === 'prompt') {
      generateBtnLabel.textContent = `Generate AI Prompt (${engineLabel})`;
    } else {
      generateBtnLabel.textContent = `Generate ${state.tagCount} SEO Tags (${engineLabel})`;
    }
  }

  // ── COLOR PALETTE EXTRACTION ──
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

  function resizeCanvasToVisionJpeg(sourceCanvas, bgFill = '#FFFFFF') {
    const maxEdge = SAHADAT_AI_CONFIG.maxImageEdge;
    const w = sourceCanvas.width || 800;
    const h = sourceCanvas.height || 600;
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

  // ── MULTI-FORMAT FILE PROCESSORS (RASTER, SVG, PDF, VIDEO, EPS/AI) ──
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
      duration: 0,
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
        duration: 0,
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
    const textChunks = [];
    try {
      const meta = await pdf.getMetadata();
      const info = (meta && meta.info) || {};
      if (info.Title) textChunks.push('Title: ' + info.Title);
      if (info.Subject) textChunks.push('Subject: ' + info.Subject);
      if (info.Keywords) textChunks.push('Keywords: ' + info.Keywords);
    } catch {
      // optional
    }

    const pagesToRead = Math.min(pageCount, 3);
    for (let p = 1; p <= pagesToRead; p++) {
      try {
        const page = await pdf.getPage(p);
        const content = await page.getTextContent();
        const pageText = content.items.map(it => it.str).join(' ').replace(/\s+/g, ' ').trim();
        if (pageText) textChunks.push(pageText);
      } catch {
        // ignore
      }
    }

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
      duration: 0,
      previewDataUrl,
      visionDataUrl,
      extractedText: textChunks.join('\n').slice(0, 3200),
      dominantColors
    };
  }

  async function processVideoFile(file) {
    const blobUrl = URL.createObjectURL(file);
    try {
      const result = await new Promise((resolve, reject) => {
        const video = document.createElement('video');
        video.muted = true;
        video.playsInline = true;
        video.preload = 'auto';
        video.src = blobUrl;

        const timer = setTimeout(() => reject(new Error('Video frame timeout')), 12000);

        const capture = () => {
          clearTimeout(timer);
          const w = video.videoWidth || 1280;
          const h = video.videoHeight || 720;
          const canvas = document.createElement('canvas');
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(video, 0, 0, w, h);
          const dominantColors = extractDominantColors(canvas);
          const previewDataUrl = resizeCanvasToVisionJpeg(canvas, '#0D0D1A');
          resolve({
            width: w,
            height: h,
            pageCount: 1,
            duration: Number.isFinite(video.duration) ? video.duration : 0,
            previewDataUrl,
            visionDataUrl: previewDataUrl,
            extractedText: `Video clip (${w}x${h}, ${Number.isFinite(video.duration) ? video.duration.toFixed(1) + 's' : 'video'})`,
            dominantColors
          });
        };

        video.onloadedmetadata = () => {
          const seekTo = Number.isFinite(video.duration) && video.duration > 0.5
            ? Math.min(1.5, video.duration * 0.15)
            : 0.1;
          try {
            video.currentTime = seekTo;
          } catch {
            capture();
          }
        };
        video.onseeked = capture;
        video.onerror = () => {
          clearTimeout(timer);
          reject(new Error('Could not decode video'));
        };
      });
      return result;
    } finally {
      URL.revokeObjectURL(blobUrl);
    }
  }

  function makeVectorPlaceholderCanvas(label, filename) {
    const canvas = document.createElement('canvas');
    canvas.width = 640;
    canvas.height = 480;
    const ctx = canvas.getContext('2d');
    const grad = ctx.createLinearGradient(0, 0, 640, 480);
    grad.addColorStop(0, '#16162E');
    grad.addColorStop(1, '#261B5A');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 640, 480);

    ctx.strokeStyle = 'rgba(0, 200, 255, 0.35)';
    ctx.lineWidth = 3;
    ctx.strokeRect(26, 26, 588, 428);

    ctx.fillStyle = '#00C8FF';
    ctx.font = 'bold 64px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(label, 320, 230);

    ctx.fillStyle = '#F0F4FF';
    ctx.font = '22px monospace';
    const shortName = filename.length > 36 ? filename.slice(0, 33) + '...' : filename;
    ctx.fillText(shortName, 320, 290);
    return canvas;
  }

  async function processEpsOrAiFile(file, formatLabel) {
    // Modern .ai files are PDF-compatible — try PDF.js first for real visual rendering!
    if (formatLabel === 'AI' && typeof window.pdfjsLib !== 'undefined') {
      try {
        return await processPdfFile(file);
      } catch {
        // Fallback to PostScript header parsing
      }
    }
    const slice = await file.slice(0, 65536).text();
    const lines = [];
    const titleMatch = slice.match(/%%Title:\s*(.+)/i);
    if (titleMatch) lines.push('Title: ' + titleMatch[1].trim());
    const creatorMatch = slice.match(/%%Creator:\s*(.+)/i);
    if (creatorMatch) lines.push('Creator: ' + creatorMatch[1].trim());
    const bboxMatch = slice.match(/%%BoundingBox:\s*(\d+)\s+(\d+)\s+(\d+)\s+(\d+)/i);
    let width = 1000;
    let height = 1000;
    if (bboxMatch) {
      width = Math.max(100, parseInt(bboxMatch[3], 10) - parseInt(bboxMatch[1], 10));
      height = Math.max(100, parseInt(bboxMatch[4], 10) - parseInt(bboxMatch[2], 10));
    }
    const rdfMatches = Array.from(slice.matchAll(/<rdf:li[^>]*>([^<]{2,120})<\/rdf:li>/gi)).map(m => m[1].trim());
    if (rdfMatches.length) lines.push('Embedded XMP: ' + rdfMatches.slice(0, 25).join(', '));

    const canvas = makeVectorPlaceholderCanvas(formatLabel + ' VECTOR', file.name);
    const previewDataUrl = canvas.toDataURL('image/png');
    const visionDataUrl = resizeCanvasToVisionJpeg(canvas, '#16162E');
    return {
      width,
      height,
      pageCount: 1,
      duration: 0,
      previewDataUrl,
      visionDataUrl,
      extractedText: lines.join('\n').slice(0, 2000),
      dominantColors: ['electric violet', 'cyan teal']
    };
  }

  async function ingestFiles(fileList) {
    const allowedExt = new Set(['png', 'jpg', 'jpeg', 'webp', 'gif', 'svg', 'pdf', 'mp4', 'mov', 'webm', 'eps', 'ai']);
    const incoming = Array.from(fileList || []);
    if (!incoming.length) return;

    let addedCount = 0;
    for (const file of incoming) {
      const ext = getExtension(file.name);
      const isSvg = file.type === 'image/svg+xml' || ext === 'svg';
      const isPdf = file.type === 'application/pdf' || ext === 'pdf';
      const isVideo = file.type.startsWith('video/') || ['mp4', 'mov', 'webm'].includes(ext);
      const isVector = ext === 'eps' || ext === 'ai';
      const isImg = file.type.startsWith('image/') && !isSvg;

      if (!isSvg && !isPdf && !isVideo && !isVector && !isImg && !allowedExt.has(ext)) {
        showToast(`Unsupported file: ${file.name}`, 'warn');
        continue;
      }
      if (file.size > 50 * 1024 * 1024) {
        showToast(`${file.name} exceeds 50MB limit`, 'warn');
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
        } else if (isVideo) {
          formatLabel = ext ? ext.toUpperCase() : 'MP4';
          processed = await processVideoFile(file);
        } else if (isVector) {
          formatLabel = ext.toUpperCase();
          processed = await processEpsOrAiFile(file, formatLabel);
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
          status: 'waiting',
          errorMsg: '',
          result: null,
          batchEditingKw: false,
          options: {
            mode: '',
            platform: '',
            tagCount: null,
            hint: ''
          }
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
      // Automatically show Separate Cards when 2+ files are uploaded so every file has its own options & output
      if (state.files.length >= 2) {
        state.viewMode = 'batch';
      }
      updateQueueAndActionBar();
      renderWorkspaceView();
      showToast(
        state.files.length >= 2
          ? `Loaded ${addedCount} file(s) — each file now has its own separate options & SEO card!`
          : `Loaded "${state.files[state.files.length - 1].name}"`,
        'info'
      );
    }
  }

  // ── QUEUE & ACTION BAR RENDERING ──
  function updateQueueAndActionBar() {
    const total = state.files.length;
    const done = state.files.filter(f => f.status === 'done' && f.result).length;
    const failed = state.files.filter(f => f.status === 'failed').length;
    const pending = total - done - failed;

    fileCountNum.textContent = String(total);
    fileQueueWrap.classList.toggle('hidden', total < 2);

    generateBtn.disabled = total === 0 || state.isGenerating || state.batchRunning;
    stopBatchBtnSide.classList.toggle('hidden', !state.batchRunning);

    clearFilesBtn.disabled = total === 0 || state.batchRunning;
    runBatchBtn.disabled = total === 0 || state.batchRunning || state.isGenerating;
    runBatchBtn.classList.toggle('hidden', state.batchRunning);
    stopBatchBtn.classList.toggle('hidden', !state.batchRunning);
    csvDropdownBtn.disabled = done === 0;
    exportSeoZipBtn.disabled = done === 0;

    batchStatusDot.classList.toggle('running', state.batchRunning || state.isGenerating);
    if (total === 0) {
      batchStatusText.textContent = 'System Ready.';
    } else if (state.batchRunning) {
      batchStatusText.textContent = `Processing Batch · Files: ${total} | Done: ${done} | Failed: ${failed} | Pending: ${pending}`;
    } else {
      batchStatusText.textContent = `Files: ${total} | Done: ${done} | Failed: ${failed} | Pending: ${pending}`;
    }

    updateGenerateButtonLabels();

    fileQueue.innerHTML = state.files
      .map(item => {
        let statusIcon = '';
        if (item.status === 'done') statusIcon = '<span class="file-queue-status done" title="Done"><i class="fas fa-check"></i></span>';
        else if (item.status === 'processing') statusIcon = '<span class="file-queue-status processing" title="Processing"><i class="fas fa-spinner fa-spin"></i></span>';
        else if (item.status === 'failed') statusIcon = '<span class="file-queue-status failed" title="Failed"><i class="fas fa-exclamation"></i></span>';
        return `
          <div class="file-queue-item ${item.id === state.activeId ? 'active' : ''}" data-id="${item.id}" title="${escapeHtml(item.name)}">
            <img src="${item.previewDataUrl}" alt="${escapeHtml(item.name)}" />
            <span class="file-queue-badge">${escapeHtml(item.formatLabel)}</span>
            ${statusIcon}
            <button type="button" class="file-queue-remove" data-remove="${item.id}" aria-label="Remove file">
              <i class="fas fa-times"></i>
            </button>
          </div>
        `;
      })
      .join('');
  }

  function renderWorkspaceView() {
    if (state.files.length === 0) {
      emptyResults.classList.remove('hidden');
      batchResultsList.classList.add('hidden');
      resultSourceBadge.classList.add('hidden');
      return;
    }

    emptyResults.classList.add('hidden');
    batchResultsList.classList.remove('hidden');

    const anyLive = state.files.some(f => f.result && f.result.engineMode === 'live');
    const anyDone = state.files.some(f => f.result);
    if (anyDone) {
      resultSourceBadge.classList.remove('hidden');
      if (anyLive) {
        resultSourceBadge.innerHTML = `<i class="fas fa-wand-magic-sparkles" style="color:#22c55e"></i> Sahadat AI Live`;
        resultSourceBadge.style.borderColor = 'rgba(34, 197, 94, 0.4)';
        resultSourceBadge.style.color = '#22c55e';
      } else {
        resultSourceBadge.innerHTML = `<i class="fas fa-bolt" style="color:var(--cyan)"></i> Sahadat Smart Preview`;
        resultSourceBadge.style.borderColor = 'rgba(0, 200, 255, 0.35)';
        resultSourceBadge.style.color = 'var(--cyan)';
      }
    } else {
      resultSourceBadge.classList.add('hidden');
    }

    renderBatchCards();
  }

  // ── FILE AUDIT SCORE CALCULATOR ──
  function computeFileAudit(entry) {
    let score = 78;
    const tips = [];
    const base = entry.name.replace(/\.[^.]+$/, '');
    const isGenericName = /^(img|image|dsc|screenshot|whatsapp|photo|untitled|file|document|scan|copy|new)[\s_-]*\d*$/i.test(base);
    if (isGenericName || base.length < 4) {
      score -= 10;
      tips.push('Rename file using the generated SEO slug');
    } else if (/^[a-z0-9-]+$/.test(base)) {
      score += 8;
      tips.push('SEO-friendly lowercase kebab filename');
    } else {
      tips.push('Use hyphenated lowercase slug for web SEO');
    }

    if (['WEBP', 'SVG'].includes(entry.formatLabel)) {
      score += 10;
      tips.push(`Modern ${entry.formatLabel} format is fast for web`);
    } else if (entry.formatLabel === 'PDF') {
      if (entry.extractedText && entry.extractedText.length > 40) {
        score += 9;
        tips.push('PDF contains indexable text layer');
      } else {
        score -= 6;
        tips.push('Add rich title & description metadata for PDF');
      }
    } else if (['MP4', 'MOV', 'WEBM'].includes(entry.formatLabel)) {
      score += 8;
      tips.push(`Video clip ready (${entry.width}×${entry.height})`);
    } else if (entry.sizeBytes > 650 * 1024) {
      score -= 6;
      tips.push(`High-res ${formatBytes(entry.sizeBytes)} ${entry.formatLabel} (great for stock)`);
    } else {
      score += 6;
      tips.push(`Lightweight file size (${formatBytes(entry.sizeBytes)})`);
    }

    if (entry.width >= 600 && entry.height >= 400) {
      score += 4;
      tips.push(`Crisp resolution (${entry.width}×${entry.height})`);
    }
    return { score: Math.max(52, Math.min(99, score)), tips: tips.slice(0, 3) };
  }

  // ── TAG NORMALIZATION & LOCAL SMART FALLBACK ──
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
    const pushIfValid = item => {
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

  function extractMeaningfulWords(text) {
    const stop = new Set([
      'the', 'and', 'for', 'with', 'from', 'that', 'this', 'your', 'have', 'are', 'was',
      'were', 'been', 'will', 'into', 'about', 'over', 'after', 'before', 'between', 'under',
      'page', 'file', 'image', 'img', 'dsc', 'png', 'jpg', 'jpeg', 'webp', 'svg', 'pdf', 'mp4',
      'mov', 'eps', 'copy', 'final', 'untitled', 'screenshot', 'whatsapp', 'document'
    ]);
    return String(text || '')
      .toLowerCase()
      .replace(/[^a-z0-9\u0980-\u09FF\s-]/g, ' ')
      .split(/[\s_-]+/)
      .filter(w => w.length >= 3 && !stop.has(w) && !/^\d+$/.test(w));
  }

  function buildFallbackPool(entry, customHint) {
    const filenameWords = extractMeaningfulWords(entry.name.replace(/\.[^.]+$/, ''));
    const hintWords = extractMeaningfulWords(customHint);
    const docWords = extractMeaningfulWords(entry.extractedText).slice(0, 24);
    const colors = entry.dominantColors || [];
    const pool = [];
    const seeds = [...new Set([...hintWords, ...filenameWords, ...docWords])];
    seeds.forEach(w => pool.push(w));
    for (let i = 0; i < Math.min(seeds.length, 9); i++) {
      for (let j = i + 1; j < Math.min(seeds.length, 9); j++) {
        pool.push(`${seeds[i]} ${seeds[j]}`);
      }
    }
    colors.forEach(c => {
      pool.push(c, `${c} aesthetic`, `${c} palette`);
      if (seeds[0]) pool.push(`${c} ${seeds[0]}`);
    });
    const evergreens = [
      'commercial stock', 'royalty free', 'high resolution', 'creative design', 'modern visual',
      'digital asset', 'professional layout', 'clean background', 'minimalist style', 'graphic element',
      'branding concept', 'editorial visual', 'marketing collateral', 'studio quality', 'contemporary art',
      'visual storytelling', 'print ready', 'web graphic', 'featured visual', 'color harmony',
      'sharp detail', 'creative concept', 'design resource', 'isolated element', 'seo optimized',
      'versatile graphic', 'business visual', 'clean composition', 'trendy aesthetic', 'digital craft',
      'art direction', 'visual identity', 'modern presentation', 'polished finish', 'creative backdrop',
      'dynamic framing', 'bold aesthetic', 'editorial quality', 'social media visual', 'content creation',
      'premium asset', 'smart layout', 'balanced design', 'vibrant tones', 'creative portfolio',
      'media kit', 'online showcase', 'visual hierarchy', 'modern style', 'design inspiration',
      'top quality', 'authentic look', 'clean framing', 'professional media', 'searchable asset'
    ];
    evergreens.forEach(e => pool.push(e));
    return pool;
  }

  function generateSmartLocalResult(entry) {
    const entryPlatId = getEntryPlatform(entry);
    const platSpec = PLATFORMS[entryPlatId] || PLATFORMS.general;
    const entryTagCount = getEntryTagCount(entry);
    const entryMode = getEntryMode(entry);
    const fileHint = getEntryHint(entry);
    const customHint = [fileHint, customPromptInput.value.trim()].filter(Boolean).join(' ');
    const filenameClean = entry.name.replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' ').replace(/\s+/g, ' ').trim();
    const topic = fileHint ||
      ((filenameClean && !/^(img|image|dsc|screenshot|whatsapp|untitled|photo)\s*\d*$/i.test(filenameClean))
        ? filenameClean
        : entry.formatLabel === 'PDF' ? 'Professional Digital Document Guide'
        : ['SVG', 'EPS', 'AI'].includes(entry.formatLabel) ? 'Modern Scalable Vector Graphic'
        : ['MP4', 'MOV', 'WEBM'].includes(entry.formatLabel) ? 'Cinematic High-Resolution Stock Footage'
        : 'Creative High-Resolution Visual Design');

    const titleCap = topic.replace(/\b\w/g, ch => ch.toUpperCase());
    const colorsStr = (entry.dominantColors || []).slice(0, 2).join(' and ');
    const slugBase = titleCap.toLowerCase().replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-').slice(0, 56) || 'seo-optimized-asset';
    const fallbackPool = buildFallbackPool(entry, customHint);
    const keywords = enforceExactTags(fallbackPool, entryTagCount, fallbackPool);
    const audit = computeFileAudit(entry);

    const styleSuffix = [];
    if (state.promptStyles.silhouette) styleSuffix.push('clean black silhouette style');
    if (state.promptStyles.whiteBg) styleSuffix.push('isolated on a pure white background');
    if (state.promptStyles.digitalArt) styleSuffix.push('detailed modern digital art illustration');

    const generatedPrompt = `${titleCap}${colorsStr ? ` featuring ${colorsStr} color palette` : ''}, crisp composition, studio lighting, ultra-detailed commercial stock quality${styleSuffix.length ? ', ' + styleSuffix.join(', ') : ''}.`;

    return {
      mode: entryMode,
      platform: entryPlatId,
      seoTitle: `${titleCap} — High-Quality ${entry.formatLabel} Asset for ${platSpec.name}`.slice(0, state.titleMaxLen),
      metaDescription: `Explore ${titleCap}, a clean ${entry.formatLabel} asset${colorsStr ? ` with ${colorsStr} tones` : ''}, crafted for ${platSpec.name}. Optimized with high-intent commercial keywords and search-ready metadata.`.slice(0, state.descLen),
      altText: `${titleCap} — ${entry.formatLabel} visual${colorsStr ? ` in ${colorsStr} tones` : ''} (${entry.width}×${entry.height})`,
      seoSlug: `${slugBase}.${entry.ext || 'png'}`,
      seoCaption: `${titleCap} — ready to publish across ${platSpec.name} with optimized discoverability and crisp visual clarity.`,
      categoryId: ['SVG', 'EPS', 'AI'].includes(entry.formatLabel) ? 8 : 12,
      generatedPrompt,
      keywords,
      tags: keywords.map(text => ({ text, selected: true })),
      seoScore: audit.score,
      seoTips: audit.tips,
      engineMode: 'preview',
      engineLabel: 'Sahadat Smart Preview'
    };
  }

  // ── AI PROMPT BUILDER & MULTI-PROVIDER CALLER (SERVER PROXY + 6 BYOK PROVIDERS) ──
  function parseJsonFromAiResponse(rawContent) {
    let text = String(rawContent || '').trim();
    text = text.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
    const fenceMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
    if (fenceMatch) text = fenceMatch[1].trim();
    const start = text.indexOf('{');
    const end = text.lastIndexOf('}');
    if (start !== -1 && end !== -1 && end > start) {
      text = text.slice(start, end + 1);
    }
    return JSON.parse(text);
  }

  function buildGenerationMessages(entry) {
    const entryPlatId = getEntryPlatform(entry);
    const entryMode = getEntryMode(entry);
    const entryTagCount = getEntryTagCount(entry);
    const fileHint = getEntryHint(entry);
    const platSpec = PLATFORMS[entryPlatId] || PLATFORMS.general;
    const forcedType = contentTypeSelect.value !== 'None' ? contentTypeSelect.value : entry.formatLabel;
    const customSys = customPromptInput.value.trim();
    const language = languageSelect.value;

    if (entryMode === 'prompt') {
      const styleDirectives = [];
      if (state.promptStyles.silhouette) styleDirectives.push('MUST incorporate clean silhouette style');
      if (state.promptStyles.whiteBg) styleDirectives.push('MUST specify isolated on a pure white background');
      if (state.promptStyles.digitalArt) styleDirectives.push('MUST describe it in rich digital art style');

      const sys = [
        'You are Sahadat AI, an expert visual prompt engineer for Midjourney, Adobe Firefly, DALL-E, and Freepik AI.',
        'Analyze this specific uploaded visual carefully and reverse-engineer a vivid, production-ready generation prompt.',
        'Return ONLY a valid raw JSON object (no markdown fences, no commentary):',
        '{',
        `  "generatedPrompt": "detailed image generation prompt up to ${state.promptMaxWords} words max",`,
        '  "seoTitle": "concise descriptive title (50-90 chars)",',
        '  "keywords": ["10 to 20 descriptive style and subject keywords"]',
        '}',
        styleDirectives.length ? `Required style constraints: ${styleDirectives.join('; ')}.` : '',
        fileHint ? `Specific topic/focus for this file: ${fileHint}` : '',
        customSys ? `Additional user instructions: ${customSys}` : ''
      ].filter(Boolean).join('\n');

      const usrText = [
        `File: ${entry.name} (${forcedType}, ${entry.width}x${entry.height})`,
        entry.dominantColors.length ? `Colors: ${entry.dominantColors.join(', ')}` : '',
        fileHint ? `File-specific hint: ${fileHint}` : '',
        entry.extractedText ? `Extracted text:\n${entry.extractedText}` : '',
        `Create a reverse-engineered AI prompt of at most ${state.promptMaxWords} words.`
      ].filter(Boolean).join('\n');

      return {
        systemPrompt: sys,
        userText: usrText,
        visionDataUrl: entry.visionDataUrl
      };
    }

    // METADATA MODE
    const categoryListText = Object.entries(STOCK_CATEGORIES).map(([id, name]) => `${id}=${name}`).join(', ');
    const sys = [
      'You are Sahadat AI, an elite microstock metadata & SEO specialist (Adobe Stock, Shutterstock, Freepik, Google SEO).',
      'Analyze this specific visual/document carefully. Avoid trademarked brand names, camera brands, spam repetition, and fluff.',
      'Return ONLY a valid raw JSON object (no markdown fences, no extra prose) with these exact keys:',
      '{',
      `  "seoTitle": "compelling commercial title between ${state.titleMinLen} and ${state.titleMaxLen} characters",`,
      `  "metaDescription": "persuasive SEO description around ${state.descLen} characters",`,
      '  "altText": "clear accessible alt text describing what is visible",',
      `  "seoSlug": "lowercase-hyphenated-seo-filename.${entry.ext || 'png'}",`,
      '  "seoCaption": "engaging 1-2 sentence caption",',
      `  "categoryId": 8,`,
      '  "generatedPrompt": "concise 25-45 word visual prompt describing the image for Freepik/AI metadata",',
      `  "keywords": ["tag 1", "tag 2", ... EXACTLY ${entryTagCount} unique, non-duplicate, high-ranking SEO keywords],`,
      '  "seoTips": ["3 concise, specific SEO optimization tips for this asset"]',
      '}',
      `Rules:`,
      `- "seoTitle" MUST be between ${state.titleMinLen} and ${state.titleMaxLen} characters.`,
      `- "metaDescription" MUST be close to ${state.descLen} characters (do not exceed ${state.descLen + 20}).`,
      `- "keywords" MUST contain EXACTLY ${entryTagCount} distinct, single or 2-word relevant keywords (no # prefix, no duplicates, no brand names).`,
      `- "categoryId" MUST be one integer from: ${categoryListText}.`,
      `- Target platform: ${platSpec.name}. Content type: ${forcedType}. Output language: ${language}.`,
      fileHint ? `- Specific topic/focus for this file: ${fileHint}` : '',
      customSys ? `- Custom user system instructions: ${customSys}` : ''
    ].filter(Boolean).join('\n');

    const usrText = [
      `File name: ${entry.name}`,
      `Format: ${forcedType} (${entry.width}x${entry.height}${entry.formatLabel === 'PDF' ? `, ${entry.pageCount} pages` : ''}${entry.duration ? `, ${entry.duration.toFixed(1)}s` : ''}, ${formatBytes(entry.sizeBytes)})`,
      entry.dominantColors.length ? `Dominant colors: ${entry.dominantColors.join(', ')}` : '',
      fileHint ? `File-specific topic/hint: ${fileHint}` : '',
      entry.extractedText ? `Extracted text/metadata:\n${entry.extractedText}` : '',
      `Generate EXACTLY ${entryTagCount} unique SEO keywords plus full metadata JSON for ${platSpec.name}.`
    ].filter(Boolean).join('\n');

    return {
      systemPrompt: sys,
      userText: usrText,
      visionDataUrl: entry.visionDataUrl
    };
  }

  async function callSingleByokKey(provId, apiKey, modelId, promptPack, maxTokens) {
    const spec = BYOK_PROVIDERS[provId];
    const m = String(promptPack.visionDataUrl || '').match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);

    // 1. Native Google Gemini REST API (100% browser CORS compatible!)
    if (spec.style === 'gemini') {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(modelId)}:generateContent?key=${encodeURIComponent(apiKey)}`;
      const parts = [{ text: promptPack.userText }];
      if (m) {
        parts.push({ inline_data: { mime_type: m[1], data: m[2] } });
      }
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: promptPack.systemPrompt }] },
          contents: [{ role: 'user', parts }],
          generationConfig: {
            temperature: 0.4,
            maxOutputTokens: maxTokens,
            responseMimeType: 'application/json'
          }
        })
      });
      if (!res.ok) {
        const errTxt = await res.text().catch(() => '');
        const err = new Error(`Gemini HTTP ${res.status}: ${errTxt.slice(0, 180)}`);
        err.status = res.status;
        throw err;
      }
      const data = await res.json();
      const text = data?.candidates?.[0]?.content?.parts?.map(p => p.text || '').join('\n') || '';
      if (!text) throw new Error('Empty response from Gemini');
      return text;
    }

    // 2. Anthropic Claude Messages API (with direct browser access header)
    if (spec.style === 'anthropic') {
      const blocks = [{ type: 'text', text: promptPack.userText }];
      if (m) {
        blocks.push({
          type: 'image',
          source: { type: 'base64', media_type: m[1], data: m[2] }
        });
      }
      const res = await fetch(spec.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true'
        },
        body: JSON.stringify({
          model: modelId,
          max_tokens: Math.min(maxTokens, 4096),
          temperature: 0.4,
          system: promptPack.systemPrompt,
          messages: [{ role: 'user', content: blocks }]
        })
      });
      if (!res.ok) {
        const errTxt = await res.text().catch(() => '');
        const err = new Error(`Claude HTTP ${res.status}: ${errTxt.slice(0, 180)}`);
        err.status = res.status;
        throw err;
      }
      const data = await res.json();
      const text = (data.content || []).filter(b => b.type === 'text').map(b => b.text).join('\n');
      if (!text) throw new Error('Empty response from Claude');
      return text;
    }

    // 3. OpenAI-Compatible Providers (OpenRouter, Mistral, Groq, OpenAI)
    const headers = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`
    };
    if (provId === 'openrouter') {
      headers['HTTP-Referer'] = window.location.origin || 'https://sawonak47.github.io/';
      headers['X-Title'] = 'Sahadat AI SEO Tool';
    }
    const bodyObj = {
      model: modelId,
      temperature: 0.4,
      max_tokens: Math.min(maxTokens, 4096),
      messages: [
        { role: 'system', content: promptPack.systemPrompt },
        {
          role: 'user',
          content: [
            { type: 'text', text: promptPack.userText },
            { type: 'image_url', image_url: { url: promptPack.visionDataUrl } }
          ]
        }
      ]
    };
    if (provId === 'openrouter' && /nemotron/i.test(modelId)) {
      bodyObj.reasoning = { effort: 'low' };
    }

    const res = await fetch(spec.endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify(bodyObj)
    });
    if (!res.ok) {
      const errTxt = await res.text().catch(() => '');
      const err = new Error(`${spec.label} HTTP ${res.status}: ${errTxt.slice(0, 180)}`);
      err.status = res.status;
      throw err;
    }
    const data = await res.json();
    const text = data?.choices?.[0]?.message?.content || '';
    if (!text) throw new Error(`Empty response from ${spec.label}`);
    return text;
  }

  async function callLiveAI(entry) {
    const promptPack = buildGenerationMessages(entry);
    const maxTokens = Math.max(3000, state.tagCount * 24 + 1400);
    let rawText = '';
    let engineLabel = 'Sahadat AI Live';

    if (isUsingBYOK()) {
      const provId = secretsVault.activeProvider;
      const spec = BYOK_PROVIDERS[provId];
      const provState = secretsVault.providers[provId];
      const modelId = getEffectiveModelForProvider(provId);
      const selected = getSelectedKeyForProvider(provId);
      if (!selected) {
        throw new Error(`No API key saved for ${spec.label}. Open API Secrets Management to add one.`);
      }

      // Build ordered key attempts (selected key first, then remaining if autoRotate is on)
      const orderedKeys = secretsVault.autoRotate
        ? [selected, ...provState.keys.filter(k => k.id !== selected.id)]
        : [selected];

      let lastErr = null;
      for (let idx = 0; idx < orderedKeys.length; idx++) {
        const keyObj = orderedKeys[idx];
        try {
          rawText = await callSingleByokKey(provId, keyObj.value, modelId, promptPack, maxTokens);
          if (keyObj.status === 'untested') {
            keyObj.status = 'valid';
            saveSecretsVault();
          }
          if (idx > 0) {
            provState.selectedKeyId = keyObj.id;
            saveSecretsVault();
            syncApiToggleUI();
            showToast(`Auto-rotated to ${spec.label} Key #${provState.keys.indexOf(keyObj) + 1}`, 'info');
          }
          engineLabel = `${spec.label} · ${modelId}`;
          lastErr = null;
          break;
        } catch (err) {
          lastErr = err;
          if (err.status === 401 || err.status === 403) {
            keyObj.status = 'invalid';
            saveSecretsVault();
          }
          // Rotate on rate limit / quota / auth errors when more keys exist
          if (idx < orderedKeys.length - 1 && (err.status === 429 || err.status === 503 || err.status === 401 || err.status === 403)) {
            continue;
          }
          break;
        }
      }
      if (lastErr) throw lastErr;
    } else {
      // Default Sahadat AI Server Proxy (Cloudflare Worker)
      const proxyUrl = getActiveProxyUrl();
      const legacyKey = getLegacyLocalApiKey();
      const targetUrl = proxyUrl || SAHADAT_AI_CONFIG.endpoint;
      const attempts = proxyUrl ? [null, null] : SAHADAT_AI_CONFIG.models;

      let lastErr = null;
      for (let i = 0; i < attempts.length; i++) {
        if (i > 0) await new Promise(r => setTimeout(r, 850));
        const modelId = attempts[i];
        try {
          const headers = { 'Content-Type': 'application/json' };
          if (!proxyUrl) {
            headers.Authorization = `Bearer ${legacyKey}`;
            headers['HTTP-Referer'] = window.location.origin || 'https://sawonak47.github.io/';
            headers['X-Title'] = 'Sahadat AI SEO Tool';
          }
          const bodyObj = {
            temperature: 0.4,
            max_tokens: maxTokens,
            reasoning: { effort: 'low' },
            messages: [
              { role: 'system', content: promptPack.systemPrompt },
              {
                role: 'user',
                content: [
                  { type: 'text', text: promptPack.userText },
                  { type: 'image_url', image_url: { url: promptPack.visionDataUrl } }
                ]
              }
            ]
          };
          if (modelId) bodyObj.model = modelId;

          const res = await fetch(targetUrl, {
            method: 'POST',
            headers,
            body: JSON.stringify(bodyObj)
          });
          if (!res.ok) {
            const errTxt = await res.text().catch(() => '');
            throw new Error(`HTTP ${res.status}: ${errTxt.slice(0, 180)}`);
          }
          const data = await res.json();
          rawText = data?.choices?.[0]?.message?.content || '';
          if (!rawText) throw new Error('Empty response from Sahadat AI');
          lastErr = null;
          break;
        } catch (err) {
          lastErr = err;
        }
      }
      if (lastErr) throw lastErr;
    }

    const entryMode = getEntryMode(entry);
    const entryPlatId = getEntryPlatform(entry);
    const entryTagCount = getEntryTagCount(entry);
    const parsed = parseJsonFromAiResponse(rawText);
    const fallbackPool = buildFallbackPool(entry, [getEntryHint(entry), customPromptInput.value.trim()].filter(Boolean).join(' '));
    const audit = computeFileAudit(entry);
    const targetTagCount = entryMode === 'prompt' ? Math.max(10, Math.min(25, (parsed.keywords || []).length || 15)) : entryTagCount;
    const keywords = enforceExactTags(parsed.keywords, targetTagCount, fallbackPool);

    const cleanSlug = String(parsed.seoSlug || '')
      .toLowerCase()
      .replace(/[^a-z0-9.-]+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');

    const catNum = parseInt(parsed.categoryId, 10);
    const categoryId = STOCK_CATEGORIES[catNum] ? catNum : 8;

    return {
      mode: entryMode,
      platform: entryPlatId,
      seoTitle: String(parsed.seoTitle || '').trim() || entry.name,
      metaDescription: String(parsed.metaDescription || '').trim(),
      altText: String(parsed.altText || '').trim(),
      seoSlug: cleanSlug || `sahadat-seo-asset.${entry.ext || 'png'}`,
      seoCaption: String(parsed.seoCaption || '').trim(),
      categoryId,
      generatedPrompt: String(parsed.generatedPrompt || '').trim(),
      keywords,
      tags: keywords.map(text => ({ text, selected: true })),
      seoScore: audit.score,
      seoTips: Array.isArray(parsed.seoTips) && parsed.seoTips.length ? parsed.seoTips.slice(0, 3) : audit.tips,
      engineMode: 'live',
      engineLabel
    };
  }

  // ── SINGLE & CONCURRENT BATCH GENERATION ──
  async function generateForEntry(entry, isPartOfBatch = false) {
    if (!entry) return;
    const entryMode = getEntryMode(entry);
    entry.status = 'processing';
    entry.errorMsg = '';
    if (!isPartOfBatch) {
      state.isGenerating = true;
    }
    updateQueueAndActionBar();
    renderWorkspaceView();

    try {
      let result;
      if (hasLiveAI()) {
        result = await callLiveAI(entry);
      } else {
        await new Promise(r => setTimeout(r, 420));
        result = generateSmartLocalResult(entry);
      }
      entry.result = result;
      entry.status = 'done';
      saveToHistory(entry, result);
      if (!isPartOfBatch) {
        showToast(
          entryMode === 'prompt'
            ? `Generated AI prompt for "${entry.name}"!`
            : `Generated ${result.tags.length} SEO tags for "${entry.name}"!`,
          'success'
        );
      }
    } catch (err) {
      console.error('Generation failed:', err);
      if (isUsingBYOK()) {
        entry.status = 'failed';
        entry.errorMsg = err.message || 'API call failed';
        if (!isPartOfBatch) {
          showToast(err.message || 'BYOK API call failed — check your API key.', 'error');
        }
      } else {
        // Graceful fallback for visitors when server is busy
        const fallback = generateSmartLocalResult(entry);
        fallback.engineMode = 'fallback';
        fallback.engineLabel = 'Sahadat Smart Preview';
        entry.result = fallback;
        entry.status = 'done';
        if (!isPartOfBatch) {
          showToast('Generated smart SEO metadata (instant fallback mode).', 'info');
        }
      }
    } finally {
      if (!isPartOfBatch) {
        state.isGenerating = false;
      }
      updateQueueAndActionBar();
      renderWorkspaceView();
    }
  }

  async function runConcurrentBatch() {
    if (!state.files.length || state.batchRunning || state.isGenerating) return;
    if (isUsingBYOK() && !getSelectedKeyForProvider(secretsVault.activeProvider)) {
      showToast(`Please add a ${BYOK_PROVIDERS[secretsVault.activeProvider].label} API key first!`, 'warn');
      openApiSecretsModal(secretsVault.activeProvider);
      return;
    }

    // Process pending/failed items; if all are done, regenerate all
    let queue = state.files.filter(f => f.status !== 'done');
    if (!queue.length) {
      queue = [...state.files];
    }

    const concurrency = Math.max(1, Math.min(4, parseInt(batchSpeedSelect.value, 10) || 2));
    state.batchRunning = true;
    state.batchAborted = false;
    // Automatically show Batch Cards when processing multiple files so user sees live progress on every card
    if (queue.length >= 2) {
      state.viewMode = 'batch';
    }
    updateQueueAndActionBar();
    renderWorkspaceView();

    let pointer = 0;
    const workers = Array.from({ length: Math.min(concurrency, queue.length) }, async () => {
      while (pointer < queue.length && !state.batchAborted) {
        const entry = queue[pointer++];
        await generateForEntry(entry, true);
      }
    });

    await Promise.all(workers);
    const wasAborted = state.batchAborted;
    state.batchRunning = false;
    state.batchAborted = false;
    updateQueueAndActionBar();
    renderWorkspaceView();

    const doneCount = state.files.filter(f => f.status === 'done').length;
    showToast(
      wasAborted
        ? `Batch stopped (${doneCount}/${state.files.length} completed).`
        : `Batch complete! ${doneCount}/${state.files.length} files ready for CSV & SEO export.`,
      wasAborted ? 'warn' : 'success'
    );
  }

  // ── RENDER CONTINUOUS SERIAL OUTPUT PAGE (IMAGE #1 -> SEO/METADATA/TAGS #1 -> IMAGE #2 -> ...) ──
  function renderBatchCards() {
    batchResultsList.innerHTML = state.files
      .map((entry, fileIdx) => {
        const r = entry.result;
        const effMode = getEntryMode(entry);
        const effPlatId = getEntryPlatform(entry);
        const effTagCount = getEntryTagCount(entry);
        const platLabel = (PLATFORMS[effPlatId] || PLATFORMS.general).name;
        const statusCls = entry.status || 'waiting';
        const statusLabel =
          statusCls === 'done' ? '<i class="fas fa-check"></i> Done' :
          statusCls === 'processing' ? '<i class="fas fa-spinner fa-spin"></i> Analyzing...' :
          statusCls === 'failed' ? '<i class="fas fa-triangle-exclamation"></i> Failed' :
          'Waiting...';

        const dims = entry.formatLabel === 'PDF'
          ? `${entry.pageCount} pg${entry.pageCount > 1 ? 's' : ''} · ${entry.width}×${entry.height}pt`
          : entry.duration > 0
            ? `${entry.width}×${entry.height}px · ${entry.duration.toFixed(1)}s`
            : `${entry.width}×${entry.height}px`;

        const titleVal = r ? (r.seoTitle || '') : '';
        const slugVal = r ? (r.seoSlug || '') : '';
        const descVal = r ? (r.metaDescription || '') : '';
        const altVal = r ? (r.altText || '') : '';
        const capVal = r ? (r.seoCaption || '') : '';
        const promptVal = r ? (r.generatedPrompt || '') : '';
        const promptWords = promptVal.trim() ? promptVal.trim().split(/\s+/).length : 0;
        const catId = r ? (r.categoryId || 8) : 8;
        const catName = STOCK_CATEGORIES[catId] || 'Graphic Resources';
        const tags = r ? (r.tags || []) : [];
        const activeTags = tags.filter(t => t.selected);

        const titlePillCls = titleVal.length >= state.titleMinLen && titleVal.length <= state.titleMaxLen ? 'good' : (titleVal.length > 0 ? 'warn' : '');
        const descPillCls = descVal.length >= 50 && descVal.length <= state.descLen + 25 ? 'good' : (descVal.length > 0 ? 'warn' : '');

        const kwHtml = entry.batchEditingKw
          ? `
            <textarea class="seo-textarea font-mono text-xs" rows="4" data-batch-kw-raw="${entry.id}" placeholder="Enter keywords separated by commas...">${escapeHtml(tags.map(t => t.text).join(', '))}</textarea>
            <div class="flex justify-end mt-2">
              <button type="button" class="mini-copy-btn copy-all-accent" data-batch-action="kw-done" data-id="${entry.id}"><i class="fas fa-check"></i> Done Editing</button>
            </div>
          `
          : `
            <p class="font-mono text-xs mb-2.5" style="color:var(--text-muted)">
              Click any tag to include/exclude it, or click <strong>Edit</strong> to bulk-edit comma-separated keywords.
            </p>
            <div class="tags-cloud" style="max-height:220px;">
              ${tags.map((t, idx) => `
                <span class="seo-tag-chip ${t.selected ? '' : 'deselected'}" data-batch-tag-toggle="${entry.id}" data-idx="${idx}" title="Click to toggle">
                  <span class="tag-idx">${idx + 1}</span>
                  <span>${escapeHtml(t.text)}</span>
                  <i class="fas fa-times tag-x" data-batch-tag-del="${entry.id}" data-idx="${idx}" title="Remove tag"></i>
                </span>
              `).join('')}
            </div>
          `;

        const catSelectInner = Object.entries(STOCK_CATEGORIES)
          .map(([cid, cname]) => `<option value="${cid}" ${String(catId) === String(cid) ? 'selected' : ''}>${cid} — ${escapeHtml(cname)}</option>`)
          .join('');

        let contentBelowImage = '';
        if (statusCls === 'processing') {
          contentBelowImage = `
            <div class="serial-loading-inline">
              <div class="ai-loader-emblem" style="width:48px;height:48px;margin-bottom:0;flex-shrink:0;">
                <div class="ai-spinner-ring"></div>
                <div class="ai-spinner-ring inner" style="inset:6px;"></div>
              </div>
              <div class="min-w-0 flex-1">
                <strong class="font-display text-sm block">Sahadat AI is analyzing #${fileIdx + 1} (${escapeHtml(entry.name)})...</strong>
                <span class="font-mono text-xs" style="color:var(--cyan)">
                  Generating ${effMode === 'prompt' ? 'reverse-engineered AI prompt' : `${effTagCount} ${escapeHtml(platLabel)} SEO tags & full metadata`}...
                </span>
                <div class="ai-progress-bar" style="width:100%;max-width:280px;margin-top:8px;"><div class="ai-progress-fill"></div></div>
              </div>
            </div>
          `;
        } else if (!r) {
          contentBelowImage = `
            <div class="flex flex-wrap items-center justify-between gap-3 px-4 py-3.5 rounded-xl" style="border:1px dashed var(--border);background:rgba(108,62,255,0.03)">
              <span class="font-mono text-xs" style="color:var(--text-muted)">
                ${statusCls === 'failed'
                  ? `<i class="fas fa-triangle-exclamation mr-1" style="color:#ef4444"></i> ${escapeHtml(entry.errorMsg || 'Generation failed — click retry.')}`
                  : `Queued #${fileIdx + 1} · Ready for ${effMode === 'prompt' ? 'AI Prompt' : `${effTagCount} ${escapeHtml(platLabel)} SEO tags & metadata`}.`
                }
              </span>
              <button type="button" class="mini-copy-btn copy-all-accent" data-batch-action="regen" data-id="${entry.id}">
                <i class="fas fa-wand-magic-sparkles"></i> ${statusCls === 'failed' ? 'Retry File' : 'Generate This File'}
              </button>
            </div>
          `;
        } else if (effMode === 'prompt') {
          contentBelowImage = `
            <div class="seo-result-card">
              <div class="seo-result-header">
                <span class="seo-result-label"><i class="fas fa-wand-magic-sparkles"></i> Generated AI Prompt</span>
                <div class="flex items-center gap-2">
                  <span class="char-pill"><span data-b-pcount="${entry.id}">${promptWords}</span> words</span>
                  <button type="button" class="mini-copy-btn copy-all-accent" data-batch-action="copy-prompt" data-id="${entry.id}"><i class="fas fa-copy"></i> Copy Prompt</button>
                </div>
              </div>
              <textarea class="seo-editable" rows="4" data-batch-prompt="${entry.id}" placeholder="Generated reverse-engineered AI prompt...">${escapeHtml(promptVal)}</textarea>
            </div>
          `;
        } else {
          const circumference = 213.6;
          const dashOffset = (circumference - (Math.max(0, Math.min(100, r.seoScore || 90)) / 100) * circumference).toFixed(1);
          const gradeTitle = (r.seoScore >= 88) ? 'Excellent SEO Readiness' : (r.seoScore >= 75) ? 'Strong SEO Readiness' : 'Good — Quick Wins Available';
          const gradId = `sahadatScoreGrad_${entry.id}`;

          const promptBoxHtml = promptVal
            ? `
              <div class="seo-result-card mb-3">
                <div class="seo-result-header">
                  <span class="seo-result-label"><i class="fas fa-wand-magic-sparkles"></i> Generated AI Prompt</span>
                  <div class="flex items-center gap-2">
                    <span class="char-pill"><span data-b-pcount="${entry.id}">${promptWords}</span> words · ${promptVal.length} chars</span>
                    <button type="button" class="mini-copy-btn copy-all-accent" data-batch-action="copy-prompt" data-id="${entry.id}"><i class="fas fa-copy"></i> Copy Prompt</button>
                  </div>
                </div>
                <textarea class="seo-editable" rows="3" data-batch-prompt="${entry.id}" placeholder="Generated AI prompt...">${escapeHtml(promptVal)}</textarea>
              </div>
            `
            : '';

          contentBelowImage = `
            ${promptBoxHtml}
            <!-- SEO Score & Quick Audit -->
            <div class="seo-score-banner">
              <div class="score-ring">
                <svg viewBox="0 0 80 80" aria-hidden="true">
                  <defs>
                    <linearGradient id="${gradId}" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stop-color="#6C3EFF"/>
                      <stop offset="60%" stop-color="#00C8FF"/>
                      <stop offset="100%" stop-color="#22c55e"/>
                    </linearGradient>
                  </defs>
                  <circle class="score-track" cx="40" cy="40" r="34"></circle>
                  <circle class="score-arc" cx="40" cy="40" r="34" style="stroke:url(#${gradId});stroke-dashoffset:${dashOffset};"></circle>
                </svg>
                <span class="num">${r.seoScore}</span>
                <span class="lbl">SEO</span>
              </div>
              <div class="flex-1 min-w-0">
                <div class="flex flex-wrap items-center gap-2">
                  <strong class="font-display text-base">${gradeTitle}</strong>
                  <span class="format-badge" style="color:var(--violet)" data-b-catbadge="${entry.id}">Category: ${escapeHtml(catName)}</span>
                </div>
                <div class="score-tips">
                  ${(r.seoTips || []).map(tip => `<span class="score-tip-pill"><i class="fas fa-check-circle mr-1" style="color:#22c55e"></i>${escapeHtml(tip)}</span>`).join('')}
                </div>
              </div>
            </div>

            <!-- SEO Title & Slug -->
            <div class="seo-fields-grid two-col">
              <div class="seo-result-card">
                <div class="seo-result-header">
                  <span class="seo-result-label"><i class="fas fa-heading"></i> SEO Title</span>
                  <div class="flex items-center gap-2">
                    <span class="char-pill ${titlePillCls}" data-b-tcount="${entry.id}">${titleVal.length} chars</span>
                    <button type="button" class="mini-copy-btn" data-batch-action="copy-title" data-id="${entry.id}"><i class="fas fa-copy"></i> Copy</button>
                  </div>
                </div>
                <textarea class="seo-editable" rows="2" data-batch-title="${entry.id}" placeholder="SEO Title...">${escapeHtml(titleVal)}</textarea>
              </div>

              <div class="seo-result-card">
                <div class="seo-result-header">
                  <span class="seo-result-label"><i class="fas fa-link"></i> SEO Filename / Slug</span>
                  <button type="button" class="mini-copy-btn" data-batch-action="copy-slug" data-id="${entry.id}"><i class="fas fa-copy"></i> Copy</button>
                </div>
                <textarea class="seo-editable mono" rows="2" data-batch-slug="${entry.id}" placeholder="seo-friendly-slug.jpg">${escapeHtml(slugVal)}</textarea>
              </div>
            </div>

            <!-- Meta Description & Alt Text -->
            <div class="seo-fields-grid two-col">
              <div class="seo-result-card">
                <div class="seo-result-header">
                  <span class="seo-result-label"><i class="fas fa-align-left"></i> Meta Description</span>
                  <div class="flex items-center gap-2">
                    <span class="char-pill ${descPillCls}" data-b-dcount="${entry.id}">${descVal.length} chars</span>
                    <button type="button" class="mini-copy-btn" data-batch-action="copy-desc" data-id="${entry.id}"><i class="fas fa-copy"></i> Copy</button>
                  </div>
                </div>
                <textarea class="seo-editable" rows="3" data-batch-desc="${entry.id}" placeholder="Meta description...">${escapeHtml(descVal)}</textarea>
              </div>

              <div class="seo-result-card">
                <div class="seo-result-header">
                  <span class="seo-result-label"><i class="fas fa-universal-access"></i> Image / Asset Alt Text</span>
                  <button type="button" class="mini-copy-btn" data-batch-action="copy-alt" data-id="${entry.id}"><i class="fas fa-copy"></i> Copy</button>
                </div>
                <textarea class="seo-editable" rows="3" data-batch-alt="${entry.id}" placeholder="Accessible alt text...">${escapeHtml(altVal)}</textarea>
              </div>
            </div>

            <!-- SEO Caption & Category -->
            <div class="seo-fields-grid two-col">
              <div class="seo-result-card">
                <div class="seo-result-header">
                  <span class="seo-result-label"><i class="fas fa-quote-left"></i> SEO Caption / Post Copy</span>
                  <button type="button" class="mini-copy-btn" data-batch-action="copy-caption" data-id="${entry.id}"><i class="fas fa-copy"></i> Copy</button>
                </div>
                <textarea class="seo-editable" rows="2" data-batch-caption="${entry.id}" placeholder="SEO caption...">${escapeHtml(capVal)}</textarea>
              </div>

              <div class="seo-result-card">
                <div class="seo-result-header">
                  <span class="seo-result-label"><i class="fas fa-folder-tree"></i> Stock Category (Adobe / Shutter)</span>
                </div>
                <select class="seo-select compact mt-1" data-batch-cat="${entry.id}">${catSelectInner}</select>
              </div>
            </div>

            <!-- SEO Tags & Keywords Cloud -->
            <div class="tags-section">
              <div class="tags-toolbar">
                <div class="flex items-center gap-2">
                  <span class="seo-result-label"><i class="fas fa-tags"></i> SEO Tags &amp; Keywords</span>
                  <span class="tag-count-badge">${activeTags.length} / ${tags.length}</span>
                </div>
                <div class="flex flex-wrap items-center gap-2">
                  <button type="button" class="mini-copy-btn" data-batch-action="kw-edit" data-id="${entry.id}">
                    <i class="fas ${entry.batchEditingKw ? 'fa-eye' : 'fa-pen'}"></i> ${entry.batchEditingKw ? 'View' : 'Edit'}
                  </button>
                  <button type="button" class="mini-copy-btn copy-all-accent" data-batch-action="copy-kw" data-id="${entry.id}">
                    <i class="fas fa-copy"></i> Copy All
                  </button>
                  <button type="button" class="mini-copy-btn" data-batch-action="kw-toggle-all" data-id="${entry.id}">
                    ${activeTags.length === 0 ? 'Select All' : 'Clear Selection'}
                  </button>
                </div>
              </div>
              ${kwHtml}
              <div class="batch-card-exports">
                <button type="button" class="action-btn primary" data-batch-action="copy-kw" data-id="${entry.id}"><i class="fas fa-copy"></i> Copy Comma Tags</button>
                <button type="button" class="action-btn" data-batch-action="copy-hash" data-id="${entry.id}"><i class="fas fa-hashtag"></i> Copy #Hashtags</button>
                <button type="button" class="action-btn" data-batch-action="copy-lines" data-id="${entry.id}"><i class="fas fa-list"></i> Copy Lines</button>
                <button type="button" class="action-btn" data-batch-action="copy-html" data-id="${entry.id}"><i class="fas fa-code"></i> Copy HTML Meta</button>
                <button type="button" class="action-btn" data-batch-action="exp-csv" data-id="${entry.id}"><i class="fas fa-file-csv"></i> CSV</button>
                <button type="button" class="action-btn" data-batch-action="exp-txt" data-id="${entry.id}"><i class="fas fa-file-alt"></i> TXT</button>
                <button type="button" class="action-btn" data-batch-action="exp-json" data-id="${entry.id}"><i class="fas fa-file-code"></i> JSON</button>
                <button type="button" class="action-btn cyan-btn" data-batch-action="seo-file" data-id="${entry.id}"><i class="fas fa-file-shield"></i> SEO File</button>
              </div>
            </div>
          `;
        }

        return `
          <article class="batch-item-card ${entry.id === state.activeId ? 'is-active' : ''}" data-batch-card="${entry.id}">
            <div class="batch-card-head">
              <div class="batch-card-file">
                <span class="file-index-pill">#${fileIdx + 1}</span>
                <div class="min-w-0">
                  <div class="flex flex-wrap items-center gap-2">
                    <strong class="font-display text-sm truncate" style="max-width:280px">${escapeHtml(entry.name)}</strong>
                    <span class="format-badge">${escapeHtml(entry.formatLabel)}</span>
                    <span class="status-pill ${statusCls}">${statusLabel}</span>
                  </div>
                  <span class="font-mono text-xs block mt-0.5" style="color:var(--text-muted)">
                    ${dims} · ${formatBytes(entry.sizeBytes)}
                  </span>
                </div>
              </div>
              <div class="flex flex-wrap items-center gap-1.5">
                <button type="button" class="mini-copy-btn" data-batch-action="regen" data-id="${entry.id}" ${statusCls === 'processing' ? 'disabled' : ''} title="Generate / Regenerate this file">
                  <i class="fas fa-rotate"></i> ${r ? 'Regenerate' : 'Generate'}
                </button>
                <button type="button" class="mini-copy-btn seo-file-accent" data-batch-action="seo-file" data-id="${entry.id}" ${!r ? 'disabled style="opacity:0.45;cursor:not-allowed"' : ''} title="Download this file with EXIF/IPTC/XMP SEO embedded">
                  <i class="fas fa-file-shield"></i> SEO File
                </button>
                <button type="button" class="mini-copy-btn" data-batch-action="remove" data-id="${entry.id}" title="Remove file" style="color:#ef4444">
                  <i class="fas fa-times"></i>
                </button>
              </div>
            </div>

            <!-- 1. IMAGE / FILE PREVIEW FIRST -->
            <div class="serial-preview-stage" data-batch-action="zoom" data-id="${entry.id}" title="Click to preview full size">
              ${statusCls === 'processing' ? '<div class="serial-scan-laser"></div>' : ''}
              <img src="${entry.previewDataUrl}" alt="${escapeHtml(entry.name)}" />
              <span class="serial-preview-zoom"><i class="fas fa-expand"></i> Full Preview</span>
            </div>

            <!-- 2. FULL SEO, METADATA & TAGS DIRECTLY BELOW ITS IMAGE -->
            ${contentBelowImage}
          </article>
        `;
      })
      .join('');
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // BINARY EXIF / IPTC / XMP SCRUBBER & METADATA INJECTOR (LOSSLESS)
  // Supports: JPEG (EXIF+IPTC+XMP), PNG (iTXt XMP+tEXt), WEBP (VP8X+XMP),
  //           GIF (XMP AppExt), SVG (RDF/DC/XMP), + .xmp sidecar for Video/PDF/EPS/AI
  // ═══════════════════════════════════════════════════════════════════════════
  const textEnc = new TextEncoder();

  function buildXmpXml(meta) {
    const kwLis = (meta.keywords || [])
      .map(k => `          <rdf:li>${escapeXml(k)}</rdf:li>`)
      .join('\n');
    return `<?xpacket begin="\uFEFF" id="W5M0MpCehiHzreSzNTczkc9d"?>
<x:xmpmeta xmlns:x="adobe:ns:meta/">
  <rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#">
    <rdf:Description rdf:about=""
      xmlns:dc="http://purl.org/dc/elements/1.1/"
      xmlns:xmp="http://ns.adobe.com/xap/1.0/"
      xmlns:photoshop="http://ns.adobe.com/photoshop/1.0/"
      xmlns:Iptc4xmpCore="http://iptc.org/std/Iptc4xmpCore/1.0/xmlns/">
      <xmp:Rating>5</xmp:Rating>
      <xmp:CreatorTool>Sahadat AI SEO Tool</xmp:CreatorTool>
      <photoshop:Headline>${escapeXml(meta.title)}</photoshop:Headline>
      <dc:title>
        <rdf:Alt><rdf:li xml:lang="x-default">${escapeXml(meta.title)}</rdf:li></rdf:Alt>
      </dc:title>
      <dc:description>
        <rdf:Alt><rdf:li xml:lang="x-default">${escapeXml(meta.description)}</rdf:li></rdf:Alt>
      </dc:description>
      <Iptc4xmpCore:AltTextAccessibility>
        <rdf:Alt><rdf:li xml:lang="x-default">${escapeXml(meta.altText || meta.title)}</rdf:li></rdf:Alt>
      </Iptc4xmpCore:AltTextAccessibility>
      <dc:subject>
        <rdf:Bag>
${kwLis}
        </rdf:Bag>
      </dc:subject>
    </rdf:Description>
  </rdf:RDF>
</x:xmpmeta>
<?xpacket end="w"?>`;
  }

  function concatUint8(arrays) {
    const total = arrays.reduce((sum, a) => sum + a.length, 0);
    const out = new Uint8Array(total);
    let offset = 0;
    for (const a of arrays) {
      out.set(a, offset);
      offset += a.length;
    }
    return out;
  }

  function utf16LeNullBytes(str) {
    const s = String(str || '');
    const out = new Uint8Array((s.length + 1) * 2);
    for (let i = 0; i < s.length; i++) {
      const code = s.charCodeAt(i);
      out[i * 2] = code & 0xff;
      out[i * 2 + 1] = (code >> 8) & 0xff;
    }
    return out;
  }

  // Build minimal Little-Endian TIFF EXIF APP1 payload (ImageDescription, Rating=5, Windows XPTitle/XPComment/XPKeywords/XPSubject)
  function buildJpegExifSegment(meta) {
    const descBytes = concatUint8([textEnc.encode(meta.description || meta.title || ''), new Uint8Array([0])]);
    const xpTitle = utf16LeNullBytes(meta.title || '');
    const xpComment = utf16LeNullBytes(meta.description || '');
    const xpKeywords = utf16LeNullBytes((meta.keywords || []).join(';'));
    const xpSubject = utf16LeNullBytes(meta.altText || meta.title || '');

    // Sorted by tag ID ascending (strict TIFF spec)
    const entries = [
      { tag: 0x010e, type: 2, data: descBytes },      // ImageDescription (ASCII)
      { tag: 0x4746, type: 3, shortVal: 5 },          // Rating = 5 stars
      { tag: 0x4749, type: 3, shortVal: 99 },         // RatingPercent = 99
      { tag: 0x9c9b, type: 1, data: xpTitle },        // XPTitle (Windows)
      { tag: 0x9c9c, type: 1, data: xpComment },      // XPComment (Windows)
      { tag: 0x9c9e, type: 1, data: xpKeywords },     // XPKeywords (Windows)
      { tag: 0x9c9f, type: 1, data: xpSubject }       // XPSubject (Windows)
    ];

    const tiffHeaderSize = 8;
    const ifdSize = 2 + entries.length * 12 + 4;
    let dataCursor = tiffHeaderSize + ifdSize;

    const dataChunks = [];
    const ifdBuf = new Uint8Array(ifdSize);
    const ifdView = new DataView(ifdBuf.buffer);
    ifdView.setUint16(0, entries.length, true);

    entries.forEach((ent, i) => {
      const base = 2 + i * 12;
      ifdView.setUint16(base, ent.tag, true);
      ifdView.setUint16(base + 2, ent.type, true);
      if (ent.type === 3) {
        ifdView.setUint32(base + 4, 1, true);
        ifdView.setUint16(base + 8, ent.shortVal, true);
      } else {
        const bytes = ent.data;
        ifdView.setUint32(base + 4, bytes.length, true);
        if (bytes.length <= 4) {
          for (let b = 0; b < bytes.length; b++) ifdBuf[base + 8 + b] = bytes[b];
        } else {
          ifdView.setUint32(base + 8, dataCursor, true);
          dataChunks.push(bytes);
          dataCursor += bytes.length;
        }
      }
    });
    ifdView.setUint32(2 + entries.length * 12, 0, true); // next IFD = 0

    const tiffHeader = new Uint8Array([0x49, 0x49, 0x2a, 0x00, 0x08, 0x00, 0x00, 0x00]);
    const exifHeader = textEnc.encode('Exif\0\0');
    const payload = concatUint8([exifHeader, tiffHeader, ifdBuf, ...dataChunks]);
    if (payload.length + 2 > 65535) return new Uint8Array(0);
    const seg = new Uint8Array(4 + payload.length);
    seg[0] = 0xff;
    seg[1] = 0xe1;
    seg[2] = ((payload.length + 2) >> 8) & 0xff;
    seg[3] = (payload.length + 2) & 0xff;
    seg.set(payload, 4);
    return seg;
  }

  // Build XMP APP1 segment
  function buildJpegXmpSegment(meta) {
    const header = textEnc.encode('http://ns.adobe.com/xap/1.0/\0');
    const xmpBytes = textEnc.encode(buildXmpXml(meta));
    const payload = concatUint8([header, xmpBytes]);
    if (payload.length + 2 > 65535) return new Uint8Array(0);
    const seg = new Uint8Array(4 + payload.length);
    seg[0] = 0xff;
    seg[1] = 0xe1;
    seg[2] = ((payload.length + 2) >> 8) & 0xff;
    seg[3] = (payload.length + 2) & 0xff;
    seg.set(payload, 4);
    return seg;
  }

  // Build IPTC-IIM APP13 segment (Photoshop 3.0 8BIM 0x0404 — read by Adobe Stock, Shutterstock, Lightroom)
  function buildJpegIptcSegment(meta) {
    const datasets = [];
    const pushDataset = (record, datasetNum, byteData) => {
      const len = Math.min(byteData.length, 32767);
      const hdr = new Uint8Array([0x1c, record, datasetNum, (len >> 8) & 0xff, len & 0xff]);
      datasets.push(hdr, byteData.slice(0, len));
    };

    // Envelope 1:90 CodedCharacterSet = UTF-8 (ESC % G)
    pushDataset(1, 90, new Uint8Array([0x1b, 0x25, 0x47]));
    if (meta.title) {
      pushDataset(2, 5, textEnc.encode(meta.title).slice(0, 64));    // Object Name
      pushDataset(2, 105, textEnc.encode(meta.title).slice(0, 256)); // Headline
    }
    if (meta.description) {
      pushDataset(2, 120, textEnc.encode(meta.description).slice(0, 2000)); // Caption-Abstract
    }
    (meta.keywords || []).forEach(kw => {
      const b = textEnc.encode(kw).slice(0, 64);
      if (b.length) pushDataset(2, 25, b); // Keywords
    });

    const iptcData = concatUint8(datasets);
    const pad = iptcData.length % 2 === 1 ? new Uint8Array([0]) : new Uint8Array(0);
    const psHeader = textEnc.encode('Photoshop 3.0\0');
    const bimHdr = new Uint8Array([
      0x38, 0x42, 0x49, 0x4d, // '8BIM'
      0x04, 0x04,             // IPTC-NAA resource ID
      0x00, 0x00,             // empty Pascal string + pad
      (iptcData.length >> 24) & 0xff,
      (iptcData.length >> 16) & 0xff,
      (iptcData.length >> 8) & 0xff,
      iptcData.length & 0xff
    ]);
    const payload = concatUint8([psHeader, bimHdr, iptcData, pad]);
    if (payload.length + 2 > 65535) return new Uint8Array(0);
    const seg = new Uint8Array(4 + payload.length);
    seg[0] = 0xff;
    seg[1] = 0xed;
    seg[2] = ((payload.length + 2) >> 8) & 0xff;
    seg[3] = (payload.length + 2) & 0xff;
    seg.set(payload, 4);
    return seg;
  }

  function injectJpegMetadata(arrayBuffer, meta) {
    const bytes = new Uint8Array(arrayBuffer);
    if (bytes.length < 4 || bytes[0] !== 0xff || bytes[1] !== 0xd8) {
      return new Blob([bytes], { type: 'image/jpeg' });
    }
    const keptBeforeSos = [];
    let app0Segment = null;
    let pos = 2;
    let sosOffset = -1;

    while (pos < bytes.length - 1) {
      if (bytes[pos] !== 0xff) {
        pos++;
        continue;
      }
      while (pos < bytes.length && bytes[pos] === 0xff) pos++;
      if (pos >= bytes.length) break;
      const marker = bytes[pos++];
      if (marker === 0xd9) break; // EOI
      if (marker === 0xda) {      // SOS — rest is compressed image scan
        sosOffset = pos - 2;
        break;
      }
      if ((marker >= 0xd0 && marker <= 0xd7) || marker === 0x01 || marker === 0x00) {
        continue;
      }
      if (pos + 2 > bytes.length) break;
      const segLen = (bytes[pos] << 8) | bytes[pos + 1];
      if (segLen < 2 || pos + segLen > bytes.length) break;

      const segStart = pos - 2;
      const segEnd = pos + segLen;
      // Scrub APP1 (EXIF/XMP), APP13 (IPTC), APP11 (JUMBF/C2PA), COM (AI prompt comments)
      const isScrubbed = marker === 0xe1 || marker === 0xed || marker === 0xeb || marker === 0xfe;
      if (!isScrubbed) {
        const slice = bytes.slice(segStart, segEnd);
        if (marker === 0xe0 && !app0Segment) {
          app0Segment = slice;
        } else {
          keptBeforeSos.push(slice);
        }
      }
      pos = segEnd;
    }

    const parts = [new Uint8Array([0xff, 0xd8])];
    if (app0Segment) parts.push(app0Segment);
    parts.push(buildJpegExifSegment(meta));
    parts.push(buildJpegXmpSegment(meta));
    parts.push(buildJpegIptcSegment(meta));
    keptBeforeSos.forEach(s => parts.push(s));
    if (sosOffset !== -1) {
      parts.push(bytes.slice(sosOffset));
    } else {
      parts.push(new Uint8Array([0xff, 0xd9]));
    }
    return new Blob([concatUint8(parts)], { type: 'image/jpeg' });
  }

  // CRC32 Table for PNG Chunks
  const CRC32_TABLE = (() => {
    const t = new Uint32Array(256);
    for (let n = 0; n < 256; n++) {
      let c = n;
      for (let k = 0; k < 8; k++) c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
      t[n] = c >>> 0;
    }
    return t;
  })();

  function crc32(bytes) {
    let c = 0xffffffff;
    for (let i = 0; i < bytes.length; i++) {
      c = CRC32_TABLE[(c ^ bytes[i]) & 0xff] ^ (c >>> 8);
    }
    return (c ^ 0xffffffff) >>> 0;
  }

  function makePngChunk(typeStr, dataBytes) {
    const typeBytes = textEnc.encode(typeStr);
    const len = dataBytes.length;
    const chunk = new Uint8Array(12 + len);
    const dv = new DataView(chunk.buffer);
    dv.setUint32(0, len, false);
    chunk.set(typeBytes, 4);
    chunk.set(dataBytes, 8);
    const crcVal = crc32(chunk.subarray(4, 8 + len));
    dv.setUint32(8 + len, crcVal, false);
    return chunk;
  }

  function latin1SafeBytes(str) {
    const s = String(str || '').replace(/[^\x20-\x7e]/g, ' ').replace(/\s+/g, ' ').trim();
    const out = new Uint8Array(s.length);
    for (let i = 0; i < s.length; i++) out[i] = s.charCodeAt(i) & 0xff;
    return out;
  }

  function injectPngMetadata(arrayBuffer, meta) {
    const bytes = new Uint8Array(arrayBuffer);
    const sig = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
    if (bytes.length < 24 || !sig.every((b, i) => bytes[i] === b)) {
      return new Blob([bytes], { type: 'image/png' });
    }

    const xmpPayload = concatUint8([
      textEnc.encode('XML:com.adobe.xmp\0'),
      new Uint8Array([0, 0, 0, 0]), // uncompressed, no language tag, no translated keyword
      textEnc.encode(buildXmpXml(meta))
    ]);
    const injectedChunks = [
      makePngChunk('iTXt', xmpPayload),
      makePngChunk('tEXt', concatUint8([textEnc.encode('Title\0'), latin1SafeBytes(meta.title)])),
      makePngChunk('tEXt', concatUint8([textEnc.encode('Description\0'), latin1SafeBytes(meta.description)])),
      makePngChunk('tEXt', concatUint8([textEnc.encode('Keywords\0'), latin1SafeBytes((meta.keywords || []).join(', '))]))
    ];

    const outParts = [bytes.slice(0, 8)];
    let pos = 8;
    let inserted = false;
    const scrubTypes = new Set(['tEXt', 'iTXt', 'zTXt', 'eXIf', 'caBX']);

    while (pos + 12 <= bytes.length) {
      const dv = new DataView(bytes.buffer, bytes.byteOffset + pos, 8);
      const len = dv.getUint32(0, false);
      const type = String.fromCharCode(bytes[pos + 4], bytes[pos + 5], bytes[pos + 6], bytes[pos + 7]);
      const chunkEnd = pos + 12 + len;
      if (chunkEnd > bytes.length) break;

      if (!scrubTypes.has(type)) {
        outParts.push(bytes.slice(pos, chunkEnd));
      }
      if (type === 'IHDR' && !inserted) {
        injectedChunks.forEach(c => outParts.push(c));
        inserted = true;
      }
      pos = chunkEnd;
      if (type === 'IEND') break;
    }

    return new Blob([concatUint8(outParts)], { type: 'image/png' });
  }

  function injectWebpMetadata(arrayBuffer, meta, width, height) {
    const bytes = new Uint8Array(arrayBuffer);
    const dv = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    if (bytes.length < 16 ||
      String.fromCharCode(bytes[0], bytes[1], bytes[2], bytes[3]) !== 'RIFF' ||
      String.fromCharCode(bytes[8], bytes[9], bytes[10], bytes[11]) !== 'WEBP') {
      return new Blob([bytes], { type: 'image/webp' });
    }

    const chunks = [];
    let hasVp8x = false;
    let hasAlpha = false;
    let pos = 12;
    while (pos + 8 <= bytes.length) {
      const fourcc = String.fromCharCode(bytes[pos], bytes[pos + 1], bytes[pos + 2], bytes[pos + 3]);
      const sz = dv.getUint32(pos + 4, true);
      const paddedSz = sz + (sz % 2);
      const chunkEnd = Math.min(bytes.length, pos + 8 + paddedSz);
      if (fourcc !== 'EXIF' && fourcc !== 'XMP ') {
        const chunkCopy = bytes.slice(pos, chunkEnd);
        if (fourcc === 'VP8X') {
          hasVp8x = true;
          chunkCopy[8] |= 0x04; // Set XMP flag bit
        }
        if (fourcc === 'ALPH' || fourcc === 'VP8L') hasAlpha = true;
        chunks.push(chunkCopy);
      }
      pos = pos + 8 + paddedSz;
    }

    if (!hasVp8x) {
      const w = Math.max(1, (width || 1) - 1);
      const h = Math.max(1, (height || 1) - 1);
      const vp8x = new Uint8Array(18);
      vp8x.set(textEnc.encode('VP8X'), 0);
      new DataView(vp8x.buffer).setUint32(4, 10, true);
      vp8x[8] = 0x04 | (hasAlpha ? 0x10 : 0x00); // XMP (+ Alpha if VP8L)
      vp8x[12] = w & 0xff;
      vp8x[13] = (w >> 8) & 0xff;
      vp8x[14] = (w >> 16) & 0xff;
      vp8x[15] = h & 0xff;
      vp8x[16] = (h >> 8) & 0xff;
      vp8x[17] = (h >> 16) & 0xff;
      chunks.unshift(vp8x);
    }

    const xmpBytes = textEnc.encode(buildXmpXml(meta));
    const pad = xmpBytes.length % 2 === 1 ? new Uint8Array([0]) : new Uint8Array(0);
    const xmpHdr = new Uint8Array(8);
    xmpHdr.set(textEnc.encode('XMP '), 0);
    new DataView(xmpHdr.buffer).setUint32(4, xmpBytes.length, true);
    chunks.push(concatUint8([xmpHdr, xmpBytes, pad]));

    const body = concatUint8(chunks);
    const riff = new Uint8Array(12);
    riff.set(textEnc.encode('RIFF'), 0);
    new DataView(riff.buffer).setUint32(4, 4 + body.length, true);
    riff.set(textEnc.encode('WEBP'), 8);
    return new Blob([concatUint8([riff, body])], { type: 'image/webp' });
  }

  function injectGifMetadata(arrayBuffer, meta) {
    const bytes = new Uint8Array(arrayBuffer);
    if (bytes.length < 14 || bytes[bytes.length - 1] !== 0x3b) {
      return new Blob([bytes], { type: 'image/gif' });
    }
    const xmpBytes = textEnc.encode(buildXmpXml(meta));
    const magicTrailer = new Uint8Array(258);
    magicTrailer[0] = 0x01;
    for (let i = 1; i <= 255; i++) magicTrailer[i] = 256 - i;
    magicTrailer[256] = 0x00;
    magicTrailer[257] = 0x00;

    const appExtHeader = new Uint8Array([
      0x21, 0xff, 0x0b,
      ...textEnc.encode('XMP DataXMP')
    ]);
    const bodyWithoutTrailer = bytes.slice(0, bytes.length - 1);
    return new Blob([
      concatUint8([bodyWithoutTrailer, appExtHeader, xmpBytes, magicTrailer, new Uint8Array([0x3b])])
    ], { type: 'image/gif' });
  }

  async function injectSvgMetadata(file, meta) {
    let text = await file.text();
    text = text.replace(/<!--[\s\S]*?-->/g, '');
    text = text.replace(/<metadata[\s\S]*?<\/metadata>/gi, '');
    text = text.replace(/<title[\s\S]*?<\/title>/gi, '');
    text = text.replace(/<desc[\s\S]*?<\/desc>/gi, '');

    const xmpInner = buildXmpXml(meta).replace(/<\?xpacket[\s\S]*?\?>/g, '').trim();
    const injection = `\n  <title>${escapeXml(meta.title)}</title>\n  <desc>${escapeXml(meta.description)}</desc>\n  <metadata>${xmpInner}</metadata>\n`;
    const svgOpenMatch = text.match(/<svg\b[^>]*>/i);
    if (svgOpenMatch) {
      const idx = svgOpenMatch.index + svgOpenMatch[0].length;
      text = text.slice(0, idx) + injection + text.slice(idx);
    }
    return new Blob([text], { type: 'image/svg+xml;charset=utf-8' });
  }

  function getEntrySeoMeta(entry) {
    const r = entry.result || {};
    const selectedKws = (r.tags || []).filter(t => t.selected).map(t => t.text);
    return {
      title: r.seoTitle || entry.name,
      description: r.metaDescription || r.generatedPrompt || '',
      altText: r.altText || r.seoTitle || '',
      keywords: selectedKws.length ? selectedKws : (r.keywords || [])
    };
  }

  async function buildSeoInjectedOutput(entry) {
    const meta = getEntrySeoMeta(entry);
    const fmt = entry.formatLabel;
    if (fmt === 'JPG' || fmt === 'JPEG') {
      const buf = await entry.file.arrayBuffer();
      return { blob: injectJpegMetadata(buf, meta), filename: entry.name, sidecar: null };
    }
    if (fmt === 'PNG') {
      const buf = await entry.file.arrayBuffer();
      return { blob: injectPngMetadata(buf, meta), filename: entry.name, sidecar: null };
    }
    if (fmt === 'WEBP') {
      const buf = await entry.file.arrayBuffer();
      return { blob: injectWebpMetadata(buf, meta, entry.width, entry.height), filename: entry.name, sidecar: null };
    }
    if (fmt === 'GIF') {
      const buf = await entry.file.arrayBuffer();
      return { blob: injectGifMetadata(buf, meta), filename: entry.name, sidecar: null };
    }
    if (fmt === 'SVG') {
      const blob = await injectSvgMetadata(entry.file, meta);
      return { blob, filename: entry.name, sidecar: null };
    }
    // PDF, MP4, MOV, WEBM, EPS, AI -> preserve lossless binary + attach standard Adobe XMP sidecar
    const xmpName = entry.name.replace(/\.[^.]+$/, '') + '.xmp';
    return {
      blob: entry.file,
      filename: entry.name,
      sidecar: { filename: xmpName, blob: new Blob([buildXmpXml(meta)], { type: 'application/rdf+xml;charset=utf-8' }) }
    };
  }

  async function downloadSingleSeoFile(entry) {
    if (!entry || !entry.result) {
      showToast('Generate SEO metadata for this file first!', 'warn');
      return;
    }
    try {
      const out = await buildSeoInjectedOutput(entry);
      downloadBlob(out.filename, out.blob);
      if (out.sidecar) {
        setTimeout(() => downloadBlob(out.sidecar.filename, out.sidecar.blob), 350);
        showToast(`Downloaded ${out.filename} + XMP SEO sidecar!`, 'success');
      } else {
        showToast(`Downloaded SEO-injected ${out.filename} (EXIF/IPTC/XMP embedded, AI traces purged)!`, 'success');
      }
    } catch (err) {
      console.error('SEO file export error:', err);
      showToast('Could not build SEO-injected file.', 'error');
    }
  }

  async function exportAllSeoFilesZip() {
    const completed = state.files.filter(f => f.status === 'done' && f.result);
    if (!completed.length) {
      showToast('Generate metadata for at least one file first!', 'warn');
      return;
    }
    if (typeof window.JSZip === 'undefined') {
      showToast('JSZip library is loading. Please retry in a moment.', 'warn');
      return;
    }
    exportSeoZipBtn.disabled = true;
    const origHtml = exportSeoZipBtn.innerHTML;
    exportSeoZipBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Packaging ZIP...';
    try {
      const zip = new window.JSZip();
      const usedNames = new Set();
      const uniqueName = name => {
        if (!usedNames.has(name)) {
          usedNames.add(name);
          return name;
        }
        const dot = name.lastIndexOf('.');
        const base = dot > 0 ? name.slice(0, dot) : name;
        const ext = dot > 0 ? name.slice(dot) : '';
        let n = 2;
        while (usedNames.has(`${base}_${n}${ext}`)) n++;
        const finalName = `${base}_${n}${ext}`;
        usedNames.add(finalName);
        return finalName;
      };

      for (const entry of completed) {
        const out = await buildSeoInjectedOutput(entry);
        zip.file(uniqueName(out.filename), out.blob);
        if (out.sidecar) {
          zip.file(uniqueName(out.sidecar.filename), out.sidecar.blob);
        }
      }
      // Also include the active platform CSV right inside the SEO ZIP for stock convenience!
      const platSpec = PLATFORMS[state.platform] || PLATFORMS.general;
      zip.file(platSpec.csvFile, buildCsvForPlatform(state.platform, completed));

      const zipBlob = await zip.generateAsync({ type: 'blob' });
      downloadBlob(`sahadat-ai-seo-files-${completed.length}.zip`, zipBlob);
      showToast(`Exported ${completed.length} SEO-injected files + ${platSpec.name} CSV (.ZIP)!`, 'success');
    } catch (err) {
      console.error('SEO ZIP error:', err);
      showToast('Failed to package SEO ZIP.', 'error');
    } finally {
      exportSeoZipBtn.innerHTML = origHtml;
      updateQueueAndActionBar();
    }
  }

  // ── CSV / ALL-18 CSV ZIP / TXT / JSON EXPORTS ──
  function csvEscape(val) {
    return `"${String(val ?? '').replace(/"/g, '""')}"`;
  }

  function buildCsvForPlatform(platId, entries) {
    const spec = PLATFORMS[platId] || PLATFORMS.general;
    const lines = [spec.headers.map(csvEscape).join(',')];
    entries.forEach(entry => {
      if (!entry.result) return;
      const kws = (entry.result.tags || []).filter(t => t.selected).map(t => t.text);
      const finalKws = kws.length ? kws : (entry.result.keywords || []);
      lines.push(spec.row(entry, entry.result, finalKws).map(csvEscape).join(','));
    });
    return '\uFEFF' + lines.join('\r\n');
  }

  async function exportAll18PlatformsZip() {
    const completed = state.files.filter(f => f.status === 'done' && f.result);
    if (!completed.length) {
      showToast('Generate metadata for at least one file first!', 'warn');
      return;
    }
    if (typeof window.JSZip === 'undefined') {
      showToast('JSZip is loading. Please try again in a second.', 'warn');
      return;
    }
    const zip = new window.JSZip();
    Object.keys(PLATFORMS).forEach(pid => {
      const spec = PLATFORMS[pid];
      zip.file(spec.csvFile, buildCsvForPlatform(pid, completed));
    });
    const blob = await zip.generateAsync({ type: 'blob' });
    downloadBlob(`sahadat-ai-all-18-platforms-csv.zip`, blob);
    showToast(`Exported all 18 platform CSVs (.ZIP) for ${completed.length} file(s)!`, 'success');
  }

  // ── COPY & DOWNLOAD HELPERS ──
  function getSelectedTagTexts(entry) {
    const target = entry || getActiveEntry();
    if (!target || !target.result) return [];
    return (target.result.tags || []).filter(t => t.selected).map(t => t.text);
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

  function downloadBlob(filename, blob) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function downloadFile(filename, content, mimeType) {
    downloadBlob(filename, new Blob([content], { type: mimeType }));
  }

  // ── LIGHTBOX ──
  function openLightbox(entry) {
    if (!entry) return;
    lightboxImg.src = entry.previewDataUrl;
    lightboxTitle.textContent = entry.name;
    lightboxSpecs.textContent = `${entry.formatLabel} · ${entry.width}×${entry.height} · ${formatBytes(entry.sizeBytes)}`;
    lightboxBackdrop.classList.add('open');
  }

  function closeLightbox() {
    lightboxBackdrop.classList.remove('open');
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
      id: Date.now() + Math.floor(Math.random() * 999),
      fileName: entry.name,
      formatLabel: entry.formatLabel,
      platform: PLATFORMS[state.platform]?.name || 'General',
      seoTitle: result.seoTitle,
      seoSlug: result.seoSlug,
      metaDescription: result.metaDescription,
      altText: result.altText,
      seoCaption: result.seoCaption,
      generatedPrompt: result.generatedPrompt || '',
      keywords: (result.tags || []).map(t => t.text),
      date: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    state.history = [record, ...state.history.filter(h => h.fileName !== entry.name)].slice(0, 9);
    try {
      localStorage.setItem(STORAGE_KEY_HISTORY, JSON.stringify(state.history));
    } catch {
      // ignore
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

  // ── EVENT LISTENERS: API KEY TOGGLE & PASSWORD-PROTECTED SECRETS MANAGEMENT ──
  openApiSecretsBtn.addEventListener('click', () => openApiSecretsModal());
  closeApiSecretsBtn.addEventListener('click', () => closeApiSecretsModal(true));
  if (apiSecretsLockBtn) {
    apiSecretsLockBtn.addEventListener('click', () => {
      unlockedAdminPassword = '';
      lastVerifiedAdminData = null;
      resetApiSecretsModalToLocked();
      showToast('API Secrets locked.', 'info');
      setTimeout(() => {
        if (apiSecretsPasswordInput) apiSecretsPasswordInput.focus();
      }, 60);
    });
  }
  apiSecretsDoneBtn.addEventListener('click', () => {
    if (secretsUnlocked) {
      const tabProv = state.modalProviderTab;
      if (secretsVault.providers[tabProv].keys.length > 0) {
        secretsVault.activeProvider = tabProv;
        saveSecretsVault();
      }
    }
    closeApiSecretsModal(true);
  });
  apiSecretsBackdrop.addEventListener('click', e => {
    if (e.target === apiSecretsBackdrop) closeApiSecretsModal(true);
  });

  if (apiSecretsUnlockForm) {
    apiSecretsUnlockForm.addEventListener('submit', async e => {
      e.preventDefault();
      setApiSecretsFeedback('', '');
      const proxyUrl = getActiveProxyUrl();
      const password = apiSecretsPasswordInput.value.trim();
      if (!proxyUrl) {
        setApiSecretsFeedback('Cloudflare Worker URL is not configured.', 'error');
        return;
      }
      if (!password) {
        setApiSecretsFeedback('Please enter the admin password.', 'error');
        return;
      }
      apiSecretsUnlockBtn.disabled = true;
      apiSecretsUnlockBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Verifying...';
      try {
        const res = await fetch(`${proxyUrl}/admin/verify`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ password })
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data.ok) {
          setApiSecretsFeedback(data.error || 'Incorrect password.', 'error');
          apiSecretsPasswordInput.select();
          return;
        }
        unlockedAdminPassword = password;
        lastVerifiedAdminData = data;
        secretsUnlocked = true;
        apiSecretsPasswordInput.value = '';
        if (pendingToggleAfterUnlock !== null) {
          secretsVault.useOwnKey = pendingToggleAfterUnlock;
          saveSecretsVault();
          pendingToggleAfterUnlock = null;
        }
        if (apiSecretsModalBox) apiSecretsModalBox.classList.add('wide-modal');
        if (apiSecretsLockGate) apiSecretsLockGate.classList.add('hidden');
        if (apiSecretsUnlockedBody) apiSecretsUnlockedBody.classList.remove('hidden');
        renderApiSecretsModal();
        syncApiToggleUI();
        showToast('API Secrets Management unlocked!', 'success');
      } catch {
        setApiSecretsFeedback('Could not reach verification server. Please try again.', 'error');
      } finally {
        apiSecretsUnlockBtn.disabled = false;
        apiSecretsUnlockBtn.innerHTML = '<i class="fas fa-unlock-keyhole"></i> Unlock API Secrets';
      }
    });
  }

  function handleOwnKeyToggleChange(checked) {
    secretsVault.useOwnKey = checked;
    saveSecretsVault();
    syncApiToggleUI();
    if (checked) {
      const provSpec = BYOK_PROVIDERS[secretsVault.activeProvider];
      if (!getSelectedKeyForProvider(secretsVault.activeProvider)) {
        showToast(`Own API Key enabled — add your ${provSpec.label} key to start!`, 'info');
      } else {
        showToast(`Switched to your ${provSpec.label} API key!`, 'success');
      }
    } else {
      showToast('Switched back to Sahadat AI Server (Default).', 'info');
    }
  }

  useOwnKeyToggle.addEventListener('click', e => {
    if (!secretsUnlocked) {
      e.preventDefault();
      openApiSecretsModal(secretsVault.activeProvider, !secretsVault.useOwnKey);
    }
  });
  useOwnKeyToggle.addEventListener('change', e => {
    if (!secretsUnlocked) {
      e.target.checked = secretsVault.useOwnKey;
      return;
    }
    handleOwnKeyToggleChange(e.target.checked);
  });
  modalOwnKeyToggle.addEventListener('change', e => {
    if (!secretsUnlocked) {
      e.target.checked = secretsVault.useOwnKey;
      return;
    }
    handleOwnKeyToggleChange(e.target.checked);
  });

  quickProviderSelect.addEventListener('change', e => {
    secretsVault.activeProvider = e.target.value;
    saveSecretsVault();
    syncApiToggleUI();
  });

  quickModelSelect.addEventListener('change', e => {
    const val = e.target.value;
    const provState = secretsVault.providers[secretsVault.activeProvider];
    if (val === '__custom__') {
      openApiSecretsModal(secretsVault.activeProvider);
      apiModalModelSelect.value = '__custom__';
      apiCustomModelWrap.classList.remove('hidden');
      apiCustomModelInput.focus();
      return;
    }
    provState.model = val;
    saveSecretsVault();
    syncApiToggleUI();
  });

  quickAddKeyBtn.addEventListener('click', () => openApiSecretsModal(secretsVault.activeProvider));

  apiProviderTabs.addEventListener('click', e => {
    const btn = e.target.closest('.api-prov-tab');
    if (!btn) return;
    state.modalProviderTab = btn.dataset.prov;
    renderApiSecretsModal();
  });

  apiModalModelSelect.addEventListener('change', e => {
    const provState = secretsVault.providers[state.modalProviderTab];
    provState.model = e.target.value;
    apiCustomModelWrap.classList.toggle('hidden', e.target.value !== '__custom__');
    if (e.target.value === '__custom__') apiCustomModelInput.focus();
    saveSecretsVault();
    syncApiToggleUI();
  });

  apiCustomModelInput.addEventListener('input', e => {
    secretsVault.providers[state.modalProviderTab].customModel = e.target.value.trim();
    saveSecretsVault();
    syncApiToggleUI();
  });

  toggleNewKeyVisBtn.addEventListener('click', () => {
    const isPwd = apiModalKeyInput.type === 'password';
    apiModalKeyInput.type = isPwd ? 'text' : 'password';
    toggleNewKeyVisBtn.innerHTML = `<i class="fas ${isPwd ? 'fa-eye-slash' : 'fa-eye'}"></i>`;
  });

  function saveNewProviderKey() {
    const val = apiModalKeyInput.value.trim();
    if (!val || val.length < 8) {
      showToast('Please paste a valid API key first.', 'warn');
      return;
    }
    const provId = state.modalProviderTab;
    const provState = secretsVault.providers[provId];
    if (provState.keys.some(k => k.value === val)) {
      showToast('That API key is already stored.', 'warn');
      return;
    }
    const newKeyObj = {
      id: 'k_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
      value: val,
      keyId4: String(Math.floor(1000 + Math.random() * 9000)),
      status: 'untested',
      revealed: false
    };
    provState.keys.push(newKeyObj);
    if (!provState.selectedKeyId) provState.selectedKeyId = newKeyObj.id;
    secretsVault.activeProvider = provId;
    secretsVault.useOwnKey = true;
    apiModalKeyInput.value = '';
    saveSecretsVault();
    renderApiSecretsModal();
    syncApiToggleUI();
    showToast(`Saved ${BYOK_PROVIDERS[provId].label} API key & activated Own API Key mode!`, 'success');
  }

  saveProviderKeyBtn.addEventListener('click', saveNewProviderKey);
  apiModalKeyInput.addEventListener('keydown', e => {
    if (e.key === 'Enter') {
      e.preventDefault();
      saveNewProviderKey();
    }
  });

  autoRotateKeysToggle.addEventListener('change', e => {
    secretsVault.autoRotate = e.target.checked;
    saveSecretsVault();
  });

  storedKeysList.addEventListener('click', async e => {
    const btn = e.target.closest('[data-key-action]');
    if (!btn) return;
    const action = btn.dataset.keyAction;
    const keyId = btn.dataset.keyId;
    const provId = state.modalProviderTab;
    const provState = secretsVault.providers[provId];
    const keyObj = provState.keys.find(k => k.id === keyId);
    if (!keyObj) return;

    if (action === 'select') {
      provState.selectedKeyId = keyObj.id;
      secretsVault.activeProvider = provId;
      saveSecretsVault();
      renderApiSecretsModal();
      syncApiToggleUI();
      showToast('Key Selected!', 'success');
    } else if (action === 'reveal') {
      keyObj.revealed = !keyObj.revealed;
      renderApiSecretsModal();
    } else if (action === 'copy') {
      copyText(keyObj.value, 'Copied API key!');
    } else if (action === 'test') {
      keyObj.status = 'testing';
      renderApiSecretsModal();
      const ok = await verifyProviderApiKey(provId, keyObj.value);
      keyObj.status = ok ? 'valid' : 'invalid';
      saveSecretsVault();
      renderApiSecretsModal();
      showToast(ok ? `${BYOK_PROVIDERS[provId].label} key is valid!` : 'Key validation failed (check key or permissions).', ok ? 'success' : 'error');
    } else if (action === 'delete') {
      if (!window.confirm('Delete this API key?')) return;
      provState.keys = provState.keys.filter(k => k.id !== keyId);
      if (provState.selectedKeyId === keyId) {
        provState.selectedKeyId = provState.keys[0] ? provState.keys[0].id : null;
      }
      saveSecretsVault();
      renderApiSecretsModal();
      syncApiToggleUI();
      showToast('API key deleted.', 'info');
    }
  });

  copyAllKeysBtn.addEventListener('click', () => {
    const keys = secretsVault.providers[state.modalProviderTab].keys || [];
    if (!keys.length) return;
    copyText(keys.map(k => k.value).join('\n'), `Copied ${keys.length} API key(s)!`);
  });

  testAllKeysBtn.addEventListener('click', async () => {
    const provId = state.modalProviderTab;
    const keys = secretsVault.providers[provId].keys || [];
    if (!keys.length) return;
    keys.forEach(k => { k.status = 'testing'; });
    renderApiSecretsModal();
    let validCount = 0;
    for (const k of keys) {
      const ok = await verifyProviderApiKey(provId, k.value);
      k.status = ok ? 'valid' : 'invalid';
      if (ok) validCount++;
      renderApiSecretsModal();
    }
    saveSecretsVault();
    showToast(`Tested ${keys.length} key(s): ${validCount} valid.`, validCount > 0 ? 'success' : 'warn');
  });

  openAdminFromSecretsBtn.addEventListener('click', () => {
    const verifiedPwd = unlockedAdminPassword;
    const verifiedData = lastVerifiedAdminData;
    closeApiSecretsModal(false);
    openAdminModal(verifiedPwd, verifiedData);
  });

  // ── EVENT LISTENERS: MODE, SLIDERS, PLATFORMS, PROMPT STYLES ──
  tabMetadataBtn.addEventListener('click', () => setMode('metadata'));
  tabPromptBtn.addEventListener('click', () => setMode('prompt'));

  titleMinLenSlider.addEventListener('input', e => {
    state.titleMinLen = parseInt(e.target.value, 10);
    if (state.titleMinLen > state.titleMaxLen) {
      state.titleMaxLen = Math.min(200, state.titleMinLen + 10);
      titleMaxLenSlider.value = state.titleMaxLen;
      titleMaxLenVal.textContent = state.titleMaxLen;
    }
    titleMinLenVal.textContent = state.titleMinLen;
    savePrefs();
  });

  titleMaxLenSlider.addEventListener('input', e => {
    state.titleMaxLen = parseInt(e.target.value, 10);
    if (state.titleMaxLen < state.titleMinLen) {
      state.titleMinLen = Math.max(30, state.titleMaxLen - 10);
      titleMinLenSlider.value = state.titleMinLen;
      titleMinLenVal.textContent = state.titleMinLen;
    }
    titleMaxLenVal.textContent = state.titleMaxLen;
    savePrefs();
  });

  descLenSlider.addEventListener('input', e => {
    state.descLen = parseInt(e.target.value, 10);
    descLenVal.textContent = state.descLen;
    savePrefs();
  });

  tagCountRange.addEventListener('input', e => setTagCount(e.target.value));
  tagCountInput.addEventListener('change', e => setTagCount(e.target.value));
  tagPresets.addEventListener('click', e => {
    const pill = e.target.closest('.preset-pill');
    if (pill) setTagCount(pill.dataset.count);
  });

  promptLenSlider.addEventListener('input', e => {
    state.promptMaxWords = parseInt(e.target.value, 10);
    promptLenVal.textContent = state.promptMaxWords;
    savePrefs();
  });

  [
    [toggleSilhouette, 'silhouette'],
    [toggleWhiteBg, 'whiteBg'],
    [toggleDigital, 'digitalArt']
  ].forEach(([el, key]) => {
    el.addEventListener('change', () => {
      state.promptStyles[key] = el.checked;
      syncPromptStylePills();
      savePrefs();
    });
  });

  languageSelect.addEventListener('change', savePrefs);
  contentTypeSelect.addEventListener('change', savePrefs);
  batchSpeedSelect.addEventListener('change', () => {
    updateGenerateButtonLabels();
    savePrefs();
  });

  customPromptInput.addEventListener('input', () => {
    try {
      localStorage.setItem(STORAGE_KEY_CUSTOM_PROMPT, customPromptInput.value);
    } catch {
      // ignore
    }
  });
  restorePromptBtn.addEventListener('click', () => {
    customPromptInput.value = '';
    localStorage.removeItem(STORAGE_KEY_CUSTOM_PROMPT);
    showToast('Custom System Prompt reset to default.', 'info');
  });

  platformGrid.addEventListener('click', e => {
    const btn = e.target.closest('.platform-pill');
    if (btn) setPlatform(btn.dataset.platform, true);
  });

  // ── EVENT LISTENERS: UPLOAD, QUEUE, VIEW SWITCH, BATCH ACTIONS ──
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

  document.addEventListener('paste', e => {
    if (['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName)) return;
    const files = e.clipboardData && e.clipboardData.files;
    if (files && files.length) ingestFiles(files);
  });

  fileQueue.addEventListener('click', e => {
    const removeBtn = e.target.closest('[data-remove]');
    if (removeBtn) {
      e.stopPropagation();
      const id = removeBtn.dataset.remove;
      state.files = state.files.filter(f => f.id !== id);
      if (state.activeId === id) {
        state.activeId = state.files.length ? state.files[0].id : null;
      }
      updateQueueAndActionBar();
      renderWorkspaceView();
      return;
    }
    const item = e.target.closest('.file-queue-item');
    if (item) {
      state.activeId = item.dataset.id;
      updateQueueAndActionBar();
      const card = batchResultsList.querySelector(`[data-batch-card="${state.activeId}"]`);
      if (card) {
        batchResultsList.querySelectorAll('.batch-item-card').forEach(c => c.classList.remove('is-active'));
        card.classList.add('is-active');
        card.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  });

  clearFilesBtn.addEventListener('click', () => {
    if (state.batchRunning) return;
    state.files = [];
    state.activeId = null;
    updateQueueAndActionBar();
    renderWorkspaceView();
    const h3 = emptyResults.querySelector('h3');
    if (h3) h3.textContent = 'Sahadat AI is ready';
    showToast('Queue cleared.', 'info');
  });

  generateBtn.addEventListener('click', () => {
    if (!state.files.length) {
      showToast('Please upload a file first!', 'warn');
      return;
    }
    if (isUsingBYOK() && !getSelectedKeyForProvider(secretsVault.activeProvider)) {
      showToast(`Add a ${BYOK_PROVIDERS[secretsVault.activeProvider].label} API key first!`, 'warn');
      openApiSecretsModal(secretsVault.activeProvider);
      return;
    }
    // When multiple files are uploaded, generate separate metadata/SEO for EVERY file individually!
    if (state.files.length > 1) {
      runConcurrentBatch();
      return;
    }
    const entry = getActiveEntry();
    if (entry) generateForEntry(entry, false);
  });

  runBatchBtn.addEventListener('click', runConcurrentBatch);

  const abortBatch = () => {
    state.batchAborted = true;
    showToast('Stopping batch after active item(s) finish...', 'warn');
  };
  stopBatchBtn.addEventListener('click', abortBatch);
  stopBatchBtnSide.addEventListener('click', abortBatch);

  // Export CSV dropdown menu
  csvDropdownBtn.addEventListener('click', e => {
    e.stopPropagation();
    csvDropdownMenu.classList.toggle('open');
  });
  document.addEventListener('click', e => {
    if (!e.target.closest('.export-dropdown-wrap')) {
      csvDropdownMenu.classList.remove('open');
    }
  });

  exportActivePlatformCsvBtn.addEventListener('click', () => {
    csvDropdownMenu.classList.remove('open');
    const completed = state.files.filter(f => f.status === 'done' && f.result);
    if (!completed.length) return;
    const spec = PLATFORMS[state.platform] || PLATFORMS.general;
    downloadFile(spec.csvFile, buildCsvForPlatform(state.platform, completed), 'text/csv;charset=utf-8');
    showToast(`Exported ${spec.name} CSV (${completed.length} file${completed.length > 1 ? 's' : ''})!`);
  });

  exportAll18CsvZipBtn.addEventListener('click', () => {
    csvDropdownMenu.classList.remove('open');
    exportAll18PlatformsZip();
  });

  exportBatchJsonBtn.addEventListener('click', () => {
    csvDropdownMenu.classList.remove('open');
    const completed = state.files.filter(f => f.status === 'done' && f.result);
    if (!completed.length) return;
    const payload = completed.map(e => ({
      filename: e.name,
      format: e.formatLabel,
      platform: PLATFORMS[state.platform]?.name || 'General',
      seoTitle: e.result.seoTitle,
      seoSlug: e.result.seoSlug,
      metaDescription: e.result.metaDescription,
      altText: e.result.altText,
      seoCaption: e.result.seoCaption,
      category: STOCK_CATEGORIES[e.result.categoryId] || 'Graphic Resources',
      generatedPrompt: e.result.generatedPrompt || '',
      keywords: getSelectedTagTexts(e)
    }));
    downloadFile(`sahadat-ai-batch-${completed.length}.json`, JSON.stringify(payload, null, 2), 'application/json');
    showToast(`Exported Batch JSON (${completed.length} files)!`);
  });

  exportBatchTxtBtn.addEventListener('click', () => {
    csvDropdownMenu.classList.remove('open');
    const completed = state.files.filter(f => f.status === 'done' && f.result);
    if (!completed.length) return;
    const txt = completed.map((e, i) => [
      `=== [${i + 1}] ${e.name} ===`,
      `Title: ${e.result.seoTitle}`,
      `Description: ${e.result.metaDescription}`,
      `Alt Text: ${e.result.altText}`,
      `Keywords (${getSelectedTagTexts(e).length}): ${getSelectedTagTexts(e).join(', ')}`,
      e.result.generatedPrompt ? `Prompt: ${e.result.generatedPrompt}` : ''
    ].filter(Boolean).join('\n')).join('\n\n');
    downloadFile(`sahadat-ai-batch-${completed.length}.txt`, txt, 'text/plain;charset=utf-8');
    showToast(`Exported Batch TXT (${completed.length} files)!`);
  });

  exportSeoZipBtn.addEventListener('click', exportAllSeoFilesZip);

  // ── CONTINUOUS SERIAL CARDS DELEGATED EVENTS ──
  batchResultsList.addEventListener('click', e => {
    const delTag = e.target.closest('[data-batch-tag-del]');
    if (delTag) {
      e.stopPropagation();
      const entry = state.files.find(f => f.id === delTag.dataset.batchTagDel);
      if (entry && entry.result) {
        entry.result.tags.splice(parseInt(delTag.dataset.idx, 10), 1);
        renderBatchCards();
      }
      return;
    }

    const togTag = e.target.closest('[data-batch-tag-toggle]');
    if (togTag) {
      const entry = state.files.find(f => f.id === togTag.dataset.batchTagToggle);
      const idx = parseInt(togTag.dataset.idx, 10);
      if (entry && entry.result && entry.result.tags[idx]) {
        entry.result.tags[idx].selected = !entry.result.tags[idx].selected;
        renderBatchCards();
      }
      return;
    }

    const actionEl = e.target.closest('[data-batch-action]');
    if (!actionEl) return;
    const action = actionEl.dataset.batchAction;
    const id = actionEl.dataset.id;
    const entry = state.files.find(f => f.id === id);
    if (!entry) return;

    if (action === 'zoom') {
      openLightbox(entry);
    } else if (action === 'inspect') {
      state.activeId = entry.id;
      state.viewMode = 'detail';
      updateQueueAndActionBar();
      renderWorkspaceView();
    } else if (action === 'regen') {
      if (!state.batchRunning && !state.isGenerating) {
        state.activeId = entry.id;
        generateForEntry(entry, false);
      }
    } else if (action === 'seo-file') {
      downloadSingleSeoFile(entry);
    } else if (action === 'remove') {
      state.files = state.files.filter(f => f.id !== id);
      if (state.activeId === id) state.activeId = state.files[0]?.id || null;
      updateQueueAndActionBar();
      renderWorkspaceView();
    } else if (action === 'copy-title') {
      copyText(entry.result?.seoTitle || '', 'Copied title!');
    } else if (action === 'copy-slug') {
      copyText(entry.result?.seoSlug || '', 'Copied SEO slug!');
    } else if (action === 'copy-desc') {
      copyText(entry.result?.metaDescription || '', 'Copied description!');
    } else if (action === 'copy-alt') {
      copyText(entry.result?.altText || '', 'Copied alt text!');
    } else if (action === 'copy-caption') {
      copyText(entry.result?.seoCaption || '', 'Copied caption!');
    } else if (action === 'copy-prompt') {
      copyText(entry.result?.generatedPrompt || '', 'Copied AI prompt!');
    } else if (action === 'copy-kw') {
      const kws = getSelectedTagTexts(entry);
      copyText(kws.join(', '), `Copied ${kws.length} tags for "${entry.name}"!`);
    } else if (action === 'copy-hash') {
      const kws = getSelectedTagTexts(entry);
      copyText(kws.map(t => '#' + t.replace(/[^a-z0-9\u0980-\u09FF]+/gi, '')).join(' '), `Copied ${kws.length} #hashtags for "${entry.name}"!`);
    } else if (action === 'copy-lines') {
      const kws = getSelectedTagTexts(entry);
      copyText(kws.join('\n'), `Copied ${kws.length} lines for "${entry.name}"!`);
    } else if (action === 'copy-html') {
      if (!entry.result) return;
      const kws = getSelectedTagTexts(entry);
      const r = entry.result;
      const snippet = entry.formatLabel === 'PDF'
        ? `<meta name="title" content="${escapeHtml(r.seoTitle)}">\n<meta name="description" content="${escapeHtml(r.metaDescription)}">\n<meta name="keywords" content="${escapeHtml(kws.join(', '))}">\n<a href="${escapeHtml(r.seoSlug)}" title="${escapeHtml(r.seoTitle)}">${escapeHtml(r.altText)}</a>`
        : `<meta name="title" content="${escapeHtml(r.seoTitle)}">\n<meta name="description" content="${escapeHtml(r.metaDescription)}">\n<meta name="keywords" content="${escapeHtml(kws.join(', '))}">\n<img src="${escapeHtml(r.seoSlug)}" alt="${escapeHtml(r.altText)}" title="${escapeHtml(r.seoTitle)}" loading="lazy" />`;
      copyText(snippet, `Copied HTML meta for "${entry.name}"!`);
    } else if (action === 'exp-csv') {
      if (!entry.result) return;
      const pid = getEntryPlatform(entry);
      const spec = PLATFORMS[pid] || PLATFORMS.general;
      const base = (entry.result.seoSlug || entry.name).replace(/\.[^.]+$/, '');
      downloadFile(`${base}-${spec.id}.csv`, buildCsvForPlatform(pid, [entry]), 'text/csv;charset=utf-8');
      showToast(`Exported ${spec.name} CSV for "${entry.name}"!`);
    } else if (action === 'exp-txt') {
      if (!entry.result) return;
      const r = entry.result;
      const kws = getSelectedTagTexts(entry);
      const txt = [
        `=== SAHADAT AI — SEO REPORT (${entry.name}) ===`,
        `Platform: ${(PLATFORMS[getEntryPlatform(entry)] || PLATFORMS.general).name}`,
        `SEO Title: ${r.seoTitle}`,
        `SEO Filename: ${r.seoSlug}`,
        `Meta Description: ${r.metaDescription}`,
        `Alt Text: ${r.altText}`,
        `Caption: ${r.seoCaption}`,
        r.generatedPrompt ? `Prompt: ${r.generatedPrompt}` : '',
        '',
        `SEO Tags (${kws.length}):`,
        kws.join(', ')
      ].filter(Boolean).join('\n');
      downloadFile(((r.seoSlug || entry.name).replace(/\.[^.]+$/, '') || 'sahadat-seo') + '.txt', txt, 'text/plain;charset=utf-8');
      showToast(`Exported TXT for "${entry.name}"!`);
    } else if (action === 'exp-json') {
      if (!entry.result) return;
      const r = entry.result;
      const kws = getSelectedTagTexts(entry);
      const payload = {
        generator: 'Sahadat AI',
        filename: entry.name,
        platform: (PLATFORMS[getEntryPlatform(entry)] || PLATFORMS.general).name,
        seoTitle: r.seoTitle,
        seoSlug: r.seoSlug,
        metaDescription: r.metaDescription,
        altText: r.altText,
        seoCaption: r.seoCaption,
        category: STOCK_CATEGORIES[r.categoryId || 8],
        generatedPrompt: r.generatedPrompt || '',
        tagCount: kws.length,
        keywords: kws
      };
      downloadFile(((r.seoSlug || entry.name).replace(/\.[^.]+$/, '') || 'sahadat-seo') + '.json', JSON.stringify(payload, null, 2), 'application/json');
      showToast(`Exported JSON for "${entry.name}"!`);
    } else if (action === 'kw-toggle-all') {
      if (!entry.result) return;
      const anySelected = entry.result.tags.some(t => t.selected);
      entry.result.tags.forEach(t => { t.selected = !anySelected; });
      renderBatchCards();
    } else if (action === 'kw-edit') {
      if (!entry.result) return;
      if (entry.batchEditingKw) {
        const ta = batchResultsList.querySelector(`[data-batch-kw-raw="${id}"]`);
        if (ta) {
          const unique = [...new Set(ta.value.split(',').map(cleanTag).filter(Boolean))];
          entry.result.tags = unique.map(text => ({ text, selected: true }));
          entry.result.keywords = unique;
        }
        entry.batchEditingKw = false;
      } else {
        entry.batchEditingKw = true;
      }
      renderBatchCards();
    } else if (action === 'kw-done') {
      const ta = batchResultsList.querySelector(`[data-batch-kw-raw="${id}"]`);
      if (entry.result && ta) {
        const unique = [...new Set(ta.value.split(',').map(cleanTag).filter(Boolean))];
        entry.result.tags = unique.map(text => ({ text, selected: true }));
        entry.result.keywords = unique;
      }
      entry.batchEditingKw = false;
      renderBatchCards();
    }
  });

  batchResultsList.addEventListener('change', e => {
    const optName = e.target.dataset.fileOpt;
    if (optName) {
      const entry = state.files.find(f => f.id === e.target.dataset.id);
      if (!entry) return;
      if (!entry.options) entry.options = { mode: '', platform: '', tagCount: null, hint: '' };
      if (optName === 'mode') {
        entry.options.mode = e.target.value;
        renderBatchCards();
      } else if (optName === 'platform') {
        entry.options.platform = e.target.value;
        if (!entry.result) renderBatchCards();
      } else if (optName === 'tagCount') {
        const n = Math.max(5, Math.min(150, parseInt(e.target.value, 10) || state.tagCount));
        entry.options.tagCount = n;
        e.target.value = n;
        if (!entry.result) renderBatchCards();
      }
      return;
    }
    const catIdTarget = e.target.dataset.batchCat;
    if (catIdTarget) {
      const entry = state.files.find(f => f.id === catIdTarget);
      if (entry && entry.result) {
        const cid = parseInt(e.target.value, 10) || 8;
        entry.result.categoryId = cid;
        const badge = batchResultsList.querySelector(`[data-b-catbadge="${catIdTarget}"]`);
        if (badge) badge.textContent = `Category: ${STOCK_CATEGORIES[cid] || 'Graphic Resources'}`;
      }
    }
  });

  batchResultsList.addEventListener('input', e => {
    const tId = e.target.dataset.batchTitle;
    if (tId) {
      const entry = state.files.find(f => f.id === tId);
      if (entry && entry.result) {
        entry.result.seoTitle = e.target.value;
        const cnt = batchResultsList.querySelector(`[data-b-tcount="${tId}"]`);
        if (cnt) {
          const len = e.target.value.length;
          cnt.textContent = `${len} chars`;
          cnt.className = 'char-pill ' + (len >= state.titleMinLen && len <= state.titleMaxLen ? 'good' : (len > 0 ? 'warn' : ''));
        }
      }
      return;
    }
    const sId = e.target.dataset.batchSlug;
    if (sId) {
      const entry = state.files.find(f => f.id === sId);
      if (entry && entry.result) entry.result.seoSlug = e.target.value;
      return;
    }
    const dId = e.target.dataset.batchDesc;
    if (dId) {
      const entry = state.files.find(f => f.id === dId);
      if (entry && entry.result) {
        entry.result.metaDescription = e.target.value;
        const cnt = batchResultsList.querySelector(`[data-b-dcount="${dId}"]`);
        if (cnt) {
          const len = e.target.value.length;
          cnt.textContent = `${len} chars`;
          cnt.className = 'char-pill ' + (len >= 50 && len <= state.descLen + 25 ? 'good' : (len > 0 ? 'warn' : ''));
        }
      }
      return;
    }
    const aId = e.target.dataset.batchAlt;
    if (aId) {
      const entry = state.files.find(f => f.id === aId);
      if (entry && entry.result) entry.result.altText = e.target.value;
      return;
    }
    const cId = e.target.dataset.batchCaption;
    if (cId) {
      const entry = state.files.find(f => f.id === cId);
      if (entry && entry.result) entry.result.seoCaption = e.target.value;
      return;
    }
    const pId = e.target.dataset.batchPrompt;
    if (pId) {
      const entry = state.files.find(f => f.id === pId);
      if (entry && entry.result) {
        entry.result.generatedPrompt = e.target.value;
        const words = e.target.value.trim() ? e.target.value.trim().split(/\s+/).length : 0;
        const cnt = batchResultsList.querySelector(`[data-b-pcount="${pId}"]`);
        if (cnt) cnt.textContent = String(words);
      }
    }
  });

  // ── HISTORY & LIGHTBOX EVENTS ──
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

  closeLightboxBtn.addEventListener('click', closeLightbox);
  lightboxBackdrop.addEventListener('click', e => {
    if (e.target === lightboxBackdrop) closeLightbox();
  });

  // ── PASSWORD-PROTECTED SITE ADMIN MODAL (CLOUDFLARE WORKER) ──
  let lastServerActiveProvider = 'openrouter';
  let lastDetectedAdminProvider = 'openrouter';

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
    mistral: [
      { id: 'pixtral-12b-2409', label: 'Pixtral 12B (Vision)' },
      { id: 'pixtral-large-latest', label: 'Pixtral Large (Vision)' }
    ],
    groq: [
      { id: 'meta-llama/llama-4-scout-17b-16e-instruct', label: 'Llama 4 Scout 17B (Vision)' },
      { id: 'meta-llama/llama-4-maverick-17b-128e-instruct', label: 'Llama 4 Maverick 17B (Vision)' }
    ],
    xai: [{ id: 'grok-2-vision-latest', label: 'Grok 2 Vision Latest' }],
    custom: []
  };

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
      if (!hasHardcodedProxy && adminWorkerUrlInput) adminWorkerUrlInput.value = getActiveProxyUrl();
    }
  }

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

  function populateAdminModelDropdown(modelsList, currentModelId) {
    if (!adminModelSelect) return;
    const items = Array.isArray(modelsList) ? modelsList : [];
    adminModelSelect.innerHTML = [
      '<option value="">✨ Auto Default (Best vision model for provider)</option>',
      ...items.map(m => `<option value="${escapeHtml(m.id)}">${escapeHtml(m.label || m.id)}</option>`),
      '<option value="__custom__">✏️ Custom Model ID (Type in box below)</option>'
    ].join('');
    if (currentModelId && items.some(m => m.id === currentModelId)) adminModelSelect.value = currentModelId;
    else if (currentModelId) adminModelSelect.value = '__custom__';
    else adminModelSelect.value = '';
  }

  function refreshAdminPresetModels(selectCurrent = false) {
    const prov = detectAdminProviderGuess(lastServerActiveProvider);
    const presets = ADMIN_MODEL_PRESETS[prov] || ADMIN_MODEL_PRESETS.openrouter;
    populateAdminModelDropdown(presets, selectCurrent ? adminModelInput.value.trim() : '');
  }

  if (adminProviderSelect) {
    adminProviderSelect.addEventListener('change', () => {
      if (adminCustomEndpointRow) adminCustomEndpointRow.classList.toggle('hidden', adminProviderSelect.value !== 'custom');
      refreshAdminPresetModels(false);
      if (adminModelInput) adminModelInput.value = '';
    });
  }
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
      if (adminModelSelect.value === '__custom__') adminModelInput.focus();
      else adminModelInput.value = adminModelSelect.value;
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
          setAdminFeedback(`Loaded ${data.models.length} live models from ${data.providerLabel}.`, 'success');
        } else {
          refreshAdminPresetModels(true);
          setAdminFeedback('Showing recommended presets.', 'error');
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

  function openAdminModal(verifiedPwd = '', verifiedData = null) {
    resetAdminModalToLocked();
    if (verifiedPwd && verifiedData) {
      unlockedAdminPassword = verifiedPwd;
      lastServerActiveProvider = verifiedData.activeProvider || 'openrouter';
      lastDetectedAdminProvider = lastServerActiveProvider;
      adminActiveProvider.textContent = verifiedData.providerLabel || 'OpenRouter';
      adminActiveModel.textContent = verifiedData.activeModel || 'Auto default';
      adminMaskedKey.textContent = verifiedData.maskedKey || 'Not set';
      adminUpdatedAt.textContent = verifiedData.updatedAt && verifiedData.updatedAt !== 'Initial secret'
        ? new Date(verifiedData.updatedAt).toLocaleString()
        : (verifiedData.updatedAt || 'Initial secret');
      adminProviderSelect.value = 'auto';
      adminCustomEndpointRow.classList.add('hidden');
      adminEndpointInput.value = verifiedData.activeEndpoint || '';
      adminModelInput.value = verifiedData.activeModel || '';
      refreshAdminPresetModels(true);
      adminUnlockForm.classList.add('hidden');
      adminUpdateForm.classList.remove('hidden');
      setAdminFeedback('Unlocked. Paste any API key and choose or type any Model ID below.', 'success');
    }
    adminModalBackdrop.classList.add('open');
    setTimeout(() => {
      if (verifiedPwd && verifiedData) {
        if (adminNewKeyInput) adminNewKeyInput.focus();
      } else if (workerUrlRow && !workerUrlRow.classList.contains('hidden') && !adminWorkerUrlInput.value) {
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
    if (e.key === 'Escape') {
      if (lightboxBackdrop.classList.contains('open')) closeLightbox();
      else if (apiSecretsBackdrop.classList.contains('open')) closeApiSecretsModal();
      else if (adminModalBackdrop.classList.contains('open')) closeAdminModal();
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
        setAdminFeedback('Please enter your Cloudflare Worker URL first.', 'error');
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
        }
        unlockedAdminPassword = password;
        lastServerActiveProvider = data.activeProvider || 'openrouter';
        lastDetectedAdminProvider = lastServerActiveProvider;
        adminActiveProvider.textContent = data.providerLabel || 'OpenRouter';
        adminActiveModel.textContent = data.activeModel || 'Auto default';
        adminMaskedKey.textContent = data.maskedKey || 'Not set';
        adminUpdatedAt.textContent = data.updatedAt && data.updatedAt !== 'Initial secret'
          ? new Date(data.updatedAt).toLocaleString()
          : (data.updatedAt || 'Initial secret');
        adminProviderSelect.value = 'auto';
        adminCustomEndpointRow.classList.add('hidden');
        adminEndpointInput.value = data.activeEndpoint || '';
        adminModelInput.value = data.activeModel || '';
        refreshAdminPresetModels(true);
        adminUnlockForm.classList.add('hidden');
        adminUpdateForm.classList.remove('hidden');
        setAdminFeedback('Unlocked. Paste any API key and choose or type any Model ID below.', 'success');
      } catch {
        setAdminFeedback('Could not reach Cloudflare Worker URL.', 'error');
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
      const provider = adminProviderSelect.value;
      const endpoint = adminEndpointInput.value.trim();
      const newKey = adminNewKeyInput.value.trim();
      const newModel = adminModelInput.value.trim();
      if (!newKey && !newModel && provider === 'auto' && !endpoint) {
        setAdminFeedback('Enter a new API key or model ID to update.', 'error');
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
        adminActiveProvider.textContent = data.providerLabel || provider;
        adminActiveModel.textContent = data.activeModel || 'Auto default';
        adminMaskedKey.textContent = data.maskedKey || 'Updated';
        adminUpdatedAt.textContent = data.updatedAt ? new Date(data.updatedAt).toLocaleString() : 'Just now';
        adminNewKeyInput.value = '';
        adminModelInput.value = '';
        syncApiToggleUI();
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

  // ── INIT ──
  loadSecretsVault();
  loadPrefs();
  applyPrefsToControls();
  syncApiToggleUI();
  updateQueueAndActionBar();
  renderWorkspaceView();
  loadHistory();
})();
