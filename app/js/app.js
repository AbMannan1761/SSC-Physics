/**
 * PhysicsCore Pro: SSC Master Edition
 * Main Controller & Teacher Presentation Deck
 */

document.addEventListener('DOMContentLoaded', () => {
  let currentChapterIndex = 0;
  let currentTab = 'book'; // 'book', 'lab', 'traps', 'olympiad', 'formulas'
  let currentBookPage = 5; // Default starts at page 5 (Chapter 1)
  let isBookSinglePane = localStorage.getItem('physics_book_single_pane') !== 'false'; // Default TRUE (closed right panel, full book page)
  let isFitPageMode = localStorage.getItem('physics_book_fit_mode') === 'page';

  // Book Page Annotations (Adobe Acrobat Style)
  let currentAnnotTool = 'texthighlight'; // 'browse', 'texthighlight', 'underline', 'pen', 'eraser'
  let currentAnnotColor = '#facc15'; // Default Adobe Highlighter Yellow
  let annotHistory = [];
  const MAX_ANNOT_HISTORY = 25;
  
  // Labs
  let vernierLab = null;
  let motionLab = null;
  let forceLab = null;
  let energyLab = null;

  // =========================================================================
  // Interactive Smart Board Module (Teacher Classroom Whiteboard)
  // =========================================================================
  const smartboardOverlay = document.getElementById('smartboardOverlay');
  const btnOpenSmartBoard = document.getElementById('btnSmartBoard');
  const btnCloseSmartBoard = document.getElementById('btnCloseSmartboard');
  const sbCanvasWrapper = document.getElementById('smartboardCanvasWrapper');
  const sbCanvas = document.getElementById('smartboardCanvas');
  const sbCtx = sbCanvas.getContext('2d');

  let currentSbTool = 'pen'; // 'pen', 'highlighter', 'line', 'rect', 'circle', 'eraser'
  let currentSbColor = '#38bdf8';
  let currentSbStroke = 4;
  let currentSbTheme = 'dark';
  let isSbDrawing = false;
  let sbStartX = 0;
  let sbStartY = 0;
  let sbLastX = 0;
  let sbLastY = 0;
  let sbHistory = [];
  const MAX_SB_HISTORY = 25;

  const shapeBgCanvas = document.createElement('canvas');
  const shapeBgCtx = shapeBgCanvas.getContext('2d');

  function resizeSmartBoardCanvas(preserve = false) {
    const rect = sbCanvasWrapper.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;

    const dpr = window.devicePixelRatio || 1;
    let tempCanvas = null;
    if (preserve && sbCanvas.width > 0 && sbCanvas.height > 0) {
      tempCanvas = document.createElement('canvas');
      tempCanvas.width = sbCanvas.width;
      tempCanvas.height = sbCanvas.height;
      tempCanvas.getContext('2d').drawImage(sbCanvas, 0, 0);
    }

    sbCanvas.width = Math.round(rect.width * dpr);
    sbCanvas.height = Math.round(rect.height * dpr);
    sbCanvas.style.width = `${rect.width}px`;
    sbCanvas.style.height = `${rect.height}px`;

    sbCtx.setTransform(1, 0, 0, 1, 0, 0);
    sbCtx.scale(dpr, dpr);
    sbCtx.lineCap = 'round';
    sbCtx.lineJoin = 'round';

    if (tempCanvas) {
      sbCtx.save();
      sbCtx.setTransform(1, 0, 0, 1, 0, 0);
      sbCtx.drawImage(tempCanvas, 0, 0);
      sbCtx.restore();
    } else if (sbHistory.length === 0) {
      saveSbState();
    }
  }

  function getCanvasCoords(e) {
    const rect = sbCanvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  }

  function applyToolStyle() {
    if (currentSbTool === 'eraser') {
      sbCtx.globalCompositeOperation = 'destination-out';
      sbCtx.lineWidth = currentSbStroke * 4.5;
      sbCtx.strokeStyle = 'rgba(0,0,0,1)';
      sbCtx.globalAlpha = 1.0;
    } else if (currentSbTool === 'highlighter') {
      sbCtx.globalCompositeOperation = 'source-over';
      sbCtx.strokeStyle = currentSbColor;
      sbCtx.globalAlpha = 0.35;
      sbCtx.lineWidth = currentSbStroke * 3.5;
    } else {
      sbCtx.globalCompositeOperation = 'source-over';
      sbCtx.strokeStyle = currentSbColor;
      sbCtx.globalAlpha = 1.0;
      sbCtx.lineWidth = currentSbStroke;
    }
    sbCtx.lineCap = 'round';
    sbCtx.lineJoin = 'round';
  }

  function saveSbState() {
    if (sbCanvas.width === 0 || sbCanvas.height === 0) return;
    const snapshotCanvas = document.createElement('canvas');
    snapshotCanvas.width = sbCanvas.width;
    snapshotCanvas.height = sbCanvas.height;
    const sCtx = snapshotCanvas.getContext('2d');
    sCtx.drawImage(sbCanvas, 0, 0);

    sbHistory.push(snapshotCanvas);
    if (sbHistory.length > MAX_SB_HISTORY) {
      sbHistory.shift();
    }
  }

  function undoSmartBoard() {
    if (sbHistory.length > 1) {
      sbHistory.pop(); // Remove current state
      const prevState = sbHistory[sbHistory.length - 1];
      sbCtx.save();
      sbCtx.setTransform(1, 0, 0, 1, 0, 0);
      sbCtx.clearRect(0, 0, sbCanvas.width, sbCanvas.height);
      sbCtx.drawImage(prevState, 0, 0);
      sbCtx.restore();
    } else if (sbHistory.length === 1) {
      sbCtx.save();
      sbCtx.setTransform(1, 0, 0, 1, 0, 0);
      sbCtx.clearRect(0, 0, sbCanvas.width, sbCanvas.height);
      sbCtx.restore();
      sbHistory = [];
      saveSbState();
    }
  }

  function clearSmartBoard() {
    sbCtx.save();
    sbCtx.setTransform(1, 0, 0, 1, 0, 0);
    sbCtx.clearRect(0, 0, sbCanvas.width, sbCanvas.height);
    sbCtx.restore();
    saveSbState();
  }

  function startSbDrawing(e) {
    isSbDrawing = true;
    const { x, y } = getCanvasCoords(e);
    sbStartX = x;
    sbStartY = y;
    sbLastX = x;
    sbLastY = y;

    if (currentSbTool === 'line' || currentSbTool === 'rect' || currentSbTool === 'circle') {
      shapeBgCanvas.width = sbCanvas.width;
      shapeBgCanvas.height = sbCanvas.height;
      shapeBgCtx.clearRect(0, 0, shapeBgCanvas.width, shapeBgCanvas.height);
      shapeBgCtx.drawImage(sbCanvas, 0, 0);
    } else {
      applyToolStyle();
      sbCtx.beginPath();
      sbCtx.moveTo(x, y);
      sbCtx.lineTo(x + 0.2, y + 0.2);
      sbCtx.stroke();
    }
  }

  function drawSbDrawing(e) {
    if (!isSbDrawing) return;
    const { x, y } = getCanvasCoords(e);

    if (currentSbTool === 'pen' || currentSbTool === 'highlighter' || currentSbTool === 'eraser') {
      applyToolStyle();
      sbCtx.beginPath();
      sbCtx.moveTo(sbLastX, sbLastY);
      sbCtx.lineTo(x, y);
      sbCtx.stroke();
      sbLastX = x;
      sbLastY = y;
    } else if (currentSbTool === 'line') {
      sbCtx.save();
      sbCtx.setTransform(1, 0, 0, 1, 0, 0);
      sbCtx.clearRect(0, 0, sbCanvas.width, sbCanvas.height);
      sbCtx.drawImage(shapeBgCanvas, 0, 0);
      sbCtx.restore();

      applyToolStyle();
      sbCtx.beginPath();
      sbCtx.moveTo(sbStartX, sbStartY);
      sbCtx.lineTo(x, y);
      sbCtx.stroke();
    } else if (currentSbTool === 'rect') {
      sbCtx.save();
      sbCtx.setTransform(1, 0, 0, 1, 0, 0);
      sbCtx.clearRect(0, 0, sbCanvas.width, sbCanvas.height);
      sbCtx.drawImage(shapeBgCanvas, 0, 0);
      sbCtx.restore();

      applyToolStyle();
      sbCtx.beginPath();
      sbCtx.strokeRect(sbStartX, sbStartY, x - sbStartX, y - sbStartY);
    } else if (currentSbTool === 'circle') {
      sbCtx.save();
      sbCtx.setTransform(1, 0, 0, 1, 0, 0);
      sbCtx.clearRect(0, 0, sbCanvas.width, sbCanvas.height);
      sbCtx.drawImage(shapeBgCanvas, 0, 0);
      sbCtx.restore();

      applyToolStyle();
      const radius = Math.hypot(x - sbStartX, y - sbStartY);
      sbCtx.beginPath();
      sbCtx.arc(sbStartX, sbStartY, radius, 0, Math.PI * 2);
      sbCtx.stroke();
    }
  }

  function stopSbDrawing() {
    if (!isSbDrawing) return;
    isSbDrawing = false;
    saveSbState();
  }

  function saveSmartBoardImage() {
    const exportCanvas = document.createElement('canvas');
    exportCanvas.width = sbCanvas.width;
    exportCanvas.height = sbCanvas.height;
    const expCtx = exportCanvas.getContext('2d');

    let bg = '#090d16';
    if (currentSbTheme === 'green') bg = '#064e3b';
    else if (currentSbTheme === 'grid') bg = '#0f172a';
    else if (currentSbTheme === 'white') bg = '#f8fafc';

    expCtx.fillStyle = bg;
    expCtx.fillRect(0, 0, exportCanvas.width, exportCanvas.height);

    if (currentSbTheme === 'grid') {
      expCtx.strokeStyle = 'rgba(56, 189, 248, 0.12)';
      expCtx.lineWidth = 1;
      const step = 30 * (window.devicePixelRatio || 1);
      for (let x = 0; x < exportCanvas.width; x += step) {
        expCtx.beginPath();
        expCtx.moveTo(x, 0);
        expCtx.lineTo(x, exportCanvas.height);
        expCtx.stroke();
      }
      for (let y = 0; y < exportCanvas.height; y += step) {
        expCtx.beginPath();
        expCtx.moveTo(0, y);
        expCtx.lineTo(exportCanvas.width, y);
        expCtx.stroke();
      }
    }

    expCtx.drawImage(sbCanvas, 0, 0);

    const link = document.createElement('a');
    link.download = `PhysicsCore_SmartBoard_Lecture_${Date.now()}.png`;
    link.href = exportCanvas.toDataURL('image/png');
    link.click();
  }

  function openSmartBoard(bgImgUrl) {
    smartboardOverlay.classList.add('active');
    if (bgImgUrl && sbCanvasWrapper) {
      sbCanvasWrapper.style.backgroundImage = `url('${bgImgUrl}')`;
      sbCanvasWrapper.style.backgroundSize = 'contain';
      sbCanvasWrapper.style.backgroundRepeat = 'no-repeat';
      sbCanvasWrapper.style.backgroundPosition = 'center';
    }
    setTimeout(() => {
      resizeSmartBoardCanvas(true);
    }, 50);
  }

  function closeSmartBoard() {
    smartboardOverlay.classList.remove('active');
    if (sbCanvasWrapper) {
      sbCanvasWrapper.style.backgroundImage = 'none';
    }
  }

  function initSmartBoard() {
    // Tool selection
    document.querySelectorAll('.sb-tool-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.sb-tool-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentSbTool = btn.dataset.tool;
      });
    });

    // Color palette selection
    document.querySelectorAll('.sb-color-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.sb-color-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentSbColor = btn.dataset.color;
        if (currentSbTool === 'eraser') {
          currentSbTool = 'pen';
          document.querySelectorAll('.sb-tool-btn').forEach(b => {
            b.classList.toggle('active', b.dataset.tool === 'pen');
          });
        }
      });
    });

    // Stroke width slider
    const strokeInput = document.getElementById('sbStrokeWidth');
    const strokeVal = document.getElementById('sbStrokeVal');
    if (strokeInput && strokeVal) {
      strokeInput.addEventListener('input', (e) => {
        currentSbStroke = parseInt(e.target.value);
        strokeVal.textContent = currentSbStroke;
      });
    }

    // Theme selector
    document.querySelectorAll('.sb-theme-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.sb-theme-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentSbTheme = btn.dataset.theme;
        sbCanvasWrapper.className = `smartboard-canvas-wrapper theme-${currentSbTheme}`;
      });
    });

    // Undo, Clear, Save
    document.getElementById('btnSbUndo')?.addEventListener('click', undoSmartBoard);
    document.getElementById('btnSbClear')?.addEventListener('click', clearSmartBoard);
    document.getElementById('btnSbSaveImage')?.addEventListener('click', saveSmartBoardImage);

    // Mouse events
    sbCanvas.addEventListener('mousedown', startSbDrawing);
    sbCanvas.addEventListener('mousemove', drawSbDrawing);
    window.addEventListener('mouseup', stopSbDrawing);

    // Touch & Stylus Pen events (Pointer Events for maximum fidelity)
    sbCanvas.addEventListener('touchstart', (e) => {
      e.preventDefault();
      const touch = e.touches[0];
      startSbDrawing({ clientX: touch.clientX, clientY: touch.clientY });
    }, { passive: false });

    sbCanvas.addEventListener('touchmove', (e) => {
      e.preventDefault();
      const touch = e.touches[0];
      drawSbDrawing({ clientX: touch.clientX, clientY: touch.clientY });
    }, { passive: false });

    window.addEventListener('touchend', stopSbDrawing);

    // Overlay Open/Close
    btnOpenSmartBoard?.addEventListener('click', openSmartBoard);
    btnCloseSmartBoard?.addEventListener('click', closeSmartBoard);

    // Window Resize
    window.addEventListener('resize', () => {
      if (smartboardOverlay.classList.contains('active')) {
        resizeSmartBoardCanvas(true);
      }
    });

    // Shortcuts: ESC to close, Ctrl+Z to undo
    window.addEventListener('keydown', (e) => {
      if (!smartboardOverlay.classList.contains('active')) return;
      if (e.key === 'Escape') {
        closeSmartBoard();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        undoSmartBoard();
      }
    });
  }

  // Sidebar Collapse / Toggle Handler
  const appSidebar = document.getElementById('appSidebar');
  const btnCollapseSidebar = document.getElementById('btnCollapseSidebar');
  const btnToggleSidebarTop = document.getElementById('btnToggleSidebarTop');

  function toggleSidebar() {
    if (appSidebar) {
      appSidebar.classList.toggle('collapsed');
    }
  }

  btnCollapseSidebar?.addEventListener('click', toggleSidebar);
  btnToggleSidebarTop?.addEventListener('click', toggleSidebar);

  // Chapter navigation rendering (Unified Left Sidebar Table of Contents)
  function renderSidebar() {
    const list = document.getElementById('navMenuList');
    list.innerHTML = '';

    CHAPTER_DATA.forEach((ch, idx) => {
      const li = document.createElement('li');
      li.className = `nav-item ${idx === currentChapterIndex ? 'active' : ''}`;
      li.innerHTML = `
        <span class="nav-icon">${ch.icon}</span>
        <div style="flex:1; min-width:0;">
          <div style="display:flex; justify-content:space-between; align-items:center; gap:4px;">
            <div style="font-weight:600; font-size:0.83rem; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;" title="অধ্যায় ${ch.number}: ${ch.titleBangla}">অধ্যায় ${ch.number}: ${ch.titleBangla}</div>
            <span class="sidebar-page-pill">পৃষ্ঠা ${ch.startPage + 1}</span>
          </div>
          <div style="font-size:0.68rem; color:var(--text-dim); font-family:var(--font-latin); overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${ch.titleEnglish}</div>
        </div>
      `;
      li.addEventListener('click', () => {
        currentChapterIndex = idx;
        if (ch.startPage !== undefined) currentBookPage = ch.startPage;
        renderSidebar();
        renderMainView();
        if (window.innerWidth <= 900 && appSidebar) {
          appSidebar.classList.add('collapsed');
        }
      });
      list.appendChild(li);
    });
  }

  function switchTab(tabName) {
    currentTab = tabName;
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.tab === tabName);
    });
    renderMainView();
  }

  function renderMainView() {
    stopAudio();
    const ch = CHAPTER_DATA[currentChapterIndex];
    document.getElementById('headerBadge').textContent = `অধ্যায় ${ch.number}`;
    document.getElementById('headerTitle').textContent = `${ch.titleBangla} (${ch.titleEnglish})`;

    const viewArea = document.getElementById('viewArea');

    if (currentTab === 'toc') {
      renderTocView(viewArea);
    } else if (currentTab === 'book') {
      renderBookView(viewArea, ch);
    } else if (currentTab === 'lab') {
      renderLabView(viewArea, ch);
    } else if (currentTab === 'traps') {
      renderTrapsView(viewArea, ch);
    } else if (currentTab === 'olympiad') {
      renderOlympiadView(viewArea, ch);
    } else if (currentTab === 'formulas') {
      renderFormulasView(viewArea, ch);
    }

    // Render LaTeX Math with KaTeX
    if (window.renderMathInElement) {
      window.renderMathInElement(viewArea, {
        delimiters: [
          { left: "$$", right: "$$", display: true },
          { left: "$", right: "$", display: false },
          { left: "\\[", right: "\\]", display: true },
          { left: "\\(", right: "\\)", display: false }
        ]
      });
    }
  }

  function renderTocView(container) {
    document.getElementById('headerBadge').textContent = 'সূচিপত্র';
    document.getElementById('headerTitle').textContent = 'নবম-দশম শ্রেণি: পদার্থবিজ্ঞান (NCTB)';

    let cardsHtml = CHAPTER_DATA.map((ch, idx) => `
      <div class="toc-card" data-ch-index="${idx}" data-page="${ch.startPage}">
        <div class="toc-card-left">
          <div class="toc-icon">${ch.icon}</div>
          <div>
            <div class="toc-number">অধ্যায় ${ch.number}</div>
            <div class="toc-title">${ch.titleBangla}</div>
            <div style="font-size:0.75rem; color:var(--text-dim); font-family:var(--font-latin);">${ch.titleEnglish}</div>
          </div>
        </div>
        <div class="toc-page-badge">পৃষ্ঠা: ${ch.startPage + 1} ➔</div>
      </div>
    `).join('');

    container.innerHTML = `
      <div class="toc-container">
        <div class="toc-header-card">
          <div>
            <h2 style="font-size:1.4rem; font-weight:800; color:#fff; margin-bottom:4px;">📋 পদার্থবিজ্ঞান পাঠ্যবইয়ের পূর্ণাঙ্গ সূচিপত্র</h2>
            <p style="font-size:0.92rem; color:var(--text-muted);">যেকোনো অধ্যায়ে ক্লিক করলেই সাথে সাথে সংশ্লিষ্ট অধ্যায়ের মূল পাতায় নিয়ে যাওয়া হবে।</p>
          </div>
          <button class="btn btn-primary" id="btnTocSearchAction" style="padding:10px 18px;">
            🔍 বইয়ের বিষয় সার্চ
          </button>
        </div>

        <div class="toc-grid">
          ${cardsHtml}
        </div>
      </div>
    `;

    // Hook card clicks
    container.querySelectorAll('.toc-card').forEach(card => {
      card.addEventListener('click', (e) => {
        const idx = parseInt(card.dataset.chIndex);
        const page = parseInt(card.dataset.page);
        currentChapterIndex = idx;
        currentBookPage = page;
        renderSidebar();
        switchTab('book');
      });
    });

    const btnSearch = document.getElementById('btnTocSearchAction');
    if (btnSearch) {
      btnSearch.addEventListener('click', () => openSearchModal());
    }
  }

  async function loadPageLayout(pageIndex) {
    const layoutUrl = `ocr_cache/page_${String(pageIndex).padStart(3, '0')}_layout.json`;
    try {
      const resp = await fetch(layoutUrl);
      if (resp.ok) {
        return await resp.json();
      }
    } catch (e) {
      console.warn("Layout fetch error:", e);
    }
    return null;
  }

  // Realistic Web Audio API Page-Flip Sound Synthesizer
  let audioCtx = null;

  function playPageTurnSound() {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      if (!audioCtx) audioCtx = new AudioCtx();
      if (audioCtx.state === 'suspended') {
        audioCtx.resume();
      }

      const now = audioCtx.currentTime;
      const dur = 0.18; // 180ms
      const bufferSize = Math.floor(audioCtx.sampleRate * dur);
      const noiseBuffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
      const output = noiseBuffer.getChannelData(0);

      // Pinkish/textured noise for authentic paper friction
      let lastOut = 0.0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        lastOut = (lastOut * 0.65) + (white * 0.35);
        output[i] = lastOut;
      }

      const noiseSource = audioCtx.createBufferSource();
      noiseSource.buffer = noiseBuffer;

      // Dynamic Bandpass filter: sweeps down across paper friction frequencies
      const bandpass = audioCtx.createBiquadFilter();
      bandpass.type = 'bandpass';
      bandpass.frequency.setValueAtTime(2400, now);
      bandpass.frequency.exponentialRampToValueAtTime(700, now + dur);
      bandpass.Q.setValueAtTime(1.8, now);

      // Highpass to eliminate boominess
      const highpass = audioCtx.createBiquadFilter();
      highpass.type = 'highpass';
      highpass.frequency.setValueAtTime(350, now);

      // Gain Envelope: quick rustle attack, soft swoosh tail
      const gainNode = audioCtx.createGain();
      gainNode.gain.setValueAtTime(0.001, now);
      gainNode.gain.linearRampToValueAtTime(0.48, now + 0.025);
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + dur);

      noiseSource.connect(bandpass);
      bandpass.connect(highpass);
      highpass.connect(gainNode);
      gainNode.connect(audioCtx.destination);

      noiseSource.start(now);
      noiseSource.stop(now + dur);
    } catch (e) {
      console.warn("Audio flip error:", e);
    }
  }

  // Intelligent Dual-Engine Bangla Audio Reader
  let isSpeaking = false;
  let activeAudioElement = null;
  let activeUtterance = null;
  let audioQueue = [];
  let currentAudioIndex = 0;

  function stopAudio() {
    // Stop HTML5 Audio if running
    if (activeAudioElement) {
      activeAudioElement.pause();
      activeAudioElement.currentTime = 0;
      activeAudioElement = null;
    }
    audioQueue = [];
    currentAudioIndex = 0;

    // Stop Web Speech Synthesis if speaking
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }

    isSpeaking = false;
    activeUtterance = null;
    updateAudioUi(false);
  }

  function updateAudioUi(speaking) {
    const btn = document.getElementById('btnToggleAudioRead');
    const icon = document.getElementById('audioIcon');
    const label = document.getElementById('audioLabel');
    const headingBtn = document.getElementById('btnHeadingAudio');

    if (btn) {
      btn.classList.toggle('speaking', speaking);
      if (icon) icon.textContent = speaking ? '⏹' : '🔊';
      if (label) label.textContent = speaking ? 'অডিও থামান' : 'অডিও শুনুন';
    }

    if (headingBtn) {
      headingBtn.classList.toggle('speaking', speaking);
      headingBtn.textContent = speaking ? '⏹' : '🔊';
    }
  }

  function getCleanPageText(pageIndex) {
    const pageNumKey = String(pageIndex + 1);
    const lines = (typeof BOOK_PAGE_TEXT !== 'undefined' && BOOK_PAGE_TEXT[pageNumKey]) ? BOOK_PAGE_TEXT[pageNumKey] : [];
    if (lines && lines.length > 0) {
      const cleanLines = lines.filter(l => {
        const t = l.trim();
        if (!t) return false;
        if (t.startsWith('ফর্মা-')) return false;
        if (/^[০-৯\d]{1,4}$/.test(t)) return false;
        if (t.startsWith('|') && t.includes('---')) return false;
        return true;
      }).map(l => {
        let t = l.trim();
        t = t.replace(/^[*•-]\s+/, '');
        t = t.replace(/^\|\s*/, '').replace(/\s*\|$/, '').replace(/\|/g, ', ');
        return t;
      });
      if (cleanLines.length > 0) {
        return cleanLines.join('। ');
      }
    }

    // Fallback: extract visible text from parsedPageContent
    const contentArea = document.getElementById('pageTextSegments');
    if (contentArea) {
      const clone = contentArea.cloneNode(true);
      clone.querySelectorAll('button, script, style, .book-element-box').forEach(el => el.remove());
      const raw = clone.innerText || clone.textContent || '';
      return raw.replace(/\s+/g, ' ').trim();
    }
    return "";
  }

  function splitTextIntoBanglaChunks(text, maxLen = 160) {
    if (!text) return [];
    // Split text into natural Bengali sentences using punctuation
    const sentences = text.split(/([।?!]+|\n+)/);
    const chunks = [];
    let current = "";

    for (let i = 0; i < sentences.length; i++) {
      const part = sentences[i].trim();
      if (!part) continue;

      if ((current + " " + part).length <= maxLen) {
        current = current ? (current + " " + part) : part;
      } else {
        if (current) chunks.push(current);
        if (part.length > maxLen) {
          const words = part.split(/\s+/);
          let wChunk = "";
          for (let w of words) {
            if ((wChunk + " " + w).length <= maxLen) {
              wChunk = wChunk ? (wChunk + " " + w) : w;
            } else {
              if (wChunk) chunks.push(wChunk);
              wChunk = w;
            }
          }
          if (wChunk) chunks.push(wChunk);
          current = "";
        } else {
          current = part;
        }
      }
    }
    if (current.trim()) chunks.push(current.trim());
    return chunks.filter(c => c && c.length > 1 && !/^[।?!,;\s]+$/.test(c));
  }

  function playBanglaQueue(chunks) {
    if (!chunks || chunks.length === 0) {
      stopAudio();
      return;
    }

    audioQueue = chunks;
    currentAudioIndex = 0;
    isSpeaking = true;
    updateAudioUi(true);

    function playNext() {
      if (!isSpeaking || currentAudioIndex >= audioQueue.length) {
        stopAudio();
        return;
      }

      const chunk = audioQueue[currentAudioIndex];
      currentAudioIndex++;

      const url = `https://translate.google.com/translate_tts?ie=UTF-8&tl=bn&client=tw-ob&q=${encodeURIComponent(chunk)}`;
      activeAudioElement = new Audio(url);

      activeAudioElement.onended = () => {
        if (isSpeaking) {
          playNext();
        }
      };

      activeAudioElement.onerror = (e) => {
        console.warn("Audio chunk play error, advancing:", e);
        if (isSpeaking) {
          playNext();
        }
      };

      activeAudioElement.play().catch(err => {
        console.warn("Audio playback failed or blocked:", err);
        playViaWebSpeechFallback(chunk);
      });
    }

    playNext();
  }

  function playViaWebSpeechFallback(text) {
    if (!('speechSynthesis' in window)) {
      stopAudio();
      return;
    }
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'bn-BD';
    const voices = window.speechSynthesis.getVoices();
    const bnVoice = voices.find(v => v.lang.startsWith('bn') || (v.name && (v.name.toLowerCase().includes('bangla') || v.name.toLowerCase().includes('bengali'))));
    if (bnVoice) utterance.voice = bnVoice;
    activeUtterance = utterance;
    utterance.onend = () => {
      isSpeaking = false;
      updateAudioUi(false);
    };
    utterance.onerror = () => {
      isSpeaking = false;
      updateAudioUi(false);
    };
    window.speechSynthesis.speak(utterance);
  }

  function playAudioText(textToSpeak) {
    stopAudio();

    if (!textToSpeak) {
      textToSpeak = getCleanPageText(currentBookPage);
    }

    if (!textToSpeak) {
      console.warn("No text found on page to read aloud.");
      return;
    }

    // Check if browser has a native Bengali voice installed in Windows/browser
    const voices = window.speechSynthesis ? window.speechSynthesis.getVoices() : [];
    const localBnVoice = voices.find(v => v.lang.startsWith('bn') || (v.name && (v.name.toLowerCase().includes('bangla') || v.name.toLowerCase().includes('bengali'))));

    if (localBnVoice) {
      // Use local installed Bangla speech engine
      const utterance = new SpeechSynthesisUtterance(textToSpeak);
      utterance.voice = localBnVoice;
      utterance.lang = localBnVoice.lang || 'bn-BD';
      utterance.rate = 0.95;
      utterance.pitch = 1.0;
      utterance.onstart = () => {
        isSpeaking = true;
        updateAudioUi(true);
      };
      utterance.onend = () => {
        stopAudio();
      };
      utterance.onerror = (e) => {
        console.warn("Local TTS error, falling back to online Bangla voice:", e);
        const chunks = splitTextIntoBanglaChunks(textToSpeak);
        playBanglaQueue(chunks);
      };
      isSpeaking = true;
      activeUtterance = utterance;
      updateAudioUi(true);
      window.speechSynthesis.speak(utterance);
    } else {
      // Natural Google Human Bengali Voice engine (crystal clear pure Bangla, zero install required!)
      const chunks = splitTextIntoBanglaChunks(textToSpeak);
      if (chunks.length > 0) {
        playBanglaQueue(chunks);
      }
    }
  }

  function toggleAudio(customText) {
    if (isSpeaking) {
      stopAudio();
    } else {
      playAudioText(customText);
    }
  }

  // =========================================================================
  // Persistent Book Annotations Store (IndexedDB + localStorage fallback)
  // Preserves marks, highlights, and annotations forever, even after PC restart
  // =========================================================================
  const AnnotationsStore = {
    db: null,
    initPromise: null,

    init() {
      if (this.initPromise) return this.initPromise;
      this.initPromise = new Promise((resolve) => {
        if (!window.indexedDB) {
          resolve(false);
          return;
        }
        try {
          const req = indexedDB.open('PhysicsBookAppDB', 2);
          req.onupgradeneeded = (e) => {
            const db = e.target.result;
            if (!db.objectStoreNames.contains('page_annotations')) {
              db.createObjectStore('page_annotations', { keyPath: 'page' });
            }
            if (!db.objectStoreNames.contains('page_notes')) {
              db.createObjectStore('page_notes', { keyPath: 'page' });
            }
          };
          req.onsuccess = (e) => {
            this.db = e.target.result;
            resolve(true);
          };
          req.onerror = () => resolve(false);
        } catch (err) {
          resolve(false);
        }
      });
      return this.initPromise;
    },

    async save(pageIndex, dataUrl) {
      const ready = await this.init();
      if (ready && this.db) {
        try {
          const tx = this.db.transaction('page_annotations', 'readwrite');
          const store = tx.objectStore('page_annotations');
          if (dataUrl) {
            store.put({ page: pageIndex, dataUrl: dataUrl, updated: Date.now() });
          } else {
            store.delete(pageIndex);
          }
        } catch (e) {
          console.warn('IDB save error', e);
        }
      }
      try {
        if (dataUrl) {
          localStorage.setItem(`physics_page_annot_${pageIndex}`, dataUrl);
        } else {
          localStorage.removeItem(`physics_page_annot_${pageIndex}`);
        }
      } catch (e) {}
    },

    async load(pageIndex) {
      const ready = await this.init();
      if (ready && this.db) {
        try {
          const result = await new Promise((resolve) => {
            const tx = this.db.transaction('page_annotations', 'readonly');
            const store = tx.objectStore('page_annotations');
            const req = store.get(pageIndex);
            req.onsuccess = () => {
              if (req.result && req.result.dataUrl) {
                resolve(req.result.dataUrl);
              } else {
                resolve(null);
              }
            };
            req.onerror = () => resolve(null);
          });
          if (result) return result;
        } catch (e) {}
      }
      try {
        return localStorage.getItem(`physics_page_annot_${pageIndex}`);
      } catch (e) {
        return null;
      }
    },

    async clear(pageIndex) {
      const ready = await this.init();
      if (ready && this.db) {
        try {
          const tx = this.db.transaction('page_annotations', 'readwrite');
          const store = tx.objectStore('page_annotations');
          store.delete(pageIndex);
        } catch (e) {}
      }
      try {
        localStorage.removeItem(`physics_page_annot_${pageIndex}`);
      } catch (e) {}
    },

    async saveNotes(pageIndex, notes) {
      const ready = await this.init();
      if (ready && this.db && this.db.objectStoreNames.contains('page_notes')) {
        try {
          const tx = this.db.transaction('page_notes', 'readwrite');
          const store = tx.objectStore('page_notes');
          store.put({ page: pageIndex, notes: notes, updated: Date.now() });
        } catch (e) {
          console.warn('IDB saveNotes error', e);
        }
      }
      try {
        localStorage.setItem(`physics_page_notes_${pageIndex}`, JSON.stringify(notes || []));
      } catch (e) {}
    },

    async loadNotes(pageIndex) {
      const ready = await this.init();
      if (ready && this.db && this.db.objectStoreNames.contains('page_notes')) {
        try {
          const result = await new Promise((resolve) => {
            const tx = this.db.transaction('page_notes', 'readonly');
            const store = tx.objectStore('page_notes');
            const req = store.get(pageIndex);
            req.onsuccess = () => {
              if (req.result && Array.isArray(req.result.notes)) {
                resolve(req.result.notes);
              } else {
                resolve(null);
              }
            };
            req.onerror = () => resolve(null);
          });
          if (result) return result;
        } catch (e) {}
      }
      try {
        const raw = localStorage.getItem(`physics_page_notes_${pageIndex}`);
        return raw ? JSON.parse(raw) : [];
      } catch (e) {
        return [];
      }
    },

    async exportBackup() {
      const backup = {
        version: 1,
        exportedAt: new Date().toISOString(),
        annotations: {},
        notes: {}
      };
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k.startsWith('physics_page_annot_')) {
          backup.annotations[k] = localStorage.getItem(k);
        } else if (k.startsWith('physics_page_notes_')) {
          try {
            backup.notes[k] = JSON.parse(localStorage.getItem(k));
          } catch (e) {}
        }
      }
      return JSON.stringify(backup, null, 2);
    },

    async importBackup(jsonString) {
      try {
        const data = JSON.parse(jsonString);
        if (data.annotations) {
          for (const k in data.annotations) {
            localStorage.setItem(k, data.annotations[k]);
            const pageMatch = k.match(/physics_page_annot_(\d+)/);
            if (pageMatch) {
              await this.save(parseInt(pageMatch[1], 10), data.annotations[k]);
            }
          }
        }
        if (data.notes) {
          for (const k in data.notes) {
            localStorage.setItem(k, JSON.stringify(data.notes[k]));
            const pageMatch = k.match(/physics_page_notes_(\d+)/);
            if (pageMatch) {
              await this.saveNotes(parseInt(pageMatch[1], 10), data.notes[k]);
            }
          }
        }
        return true;
      } catch (e) {
        return false;
      }
    }
  };

  function hexToRgba(hex, alpha) {
    let c = (hex || '#facc15').replace('#', '');
    if (c.length === 3) {
      c = c.split('').map(x => x + x).join('');
    }
    const num = parseInt(c, 16);
    const r = (num >> 16) & 255;
    const g = (num >> 8) & 255;
    const b = num & 255;
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function setupBookAnnotation(pageIndex) {
    const canvas = document.getElementById('bookAnnotateCanvas');
    const previewCanvas = document.getElementById('bookPreviewCanvas');
    const notesLayer = document.getElementById('bookNotesLayer');
    const img = document.getElementById('scannedBookPageImg');
    if (!canvas || !img) return;

    const ctx = canvas.getContext('2d');
    const previewCtx = previewCanvas ? previewCanvas.getContext('2d') : null;
    let isDrawing = false;
    let startPt = { x: 0, y: 0 };
    let lastPt = { x: 0, y: 0 };

    let pageNotes = [];
    let activePopoverEl = null;
    let currentEditingNote = null;
    let modalSelectedColor = currentAnnotColor || '#facc15';
    let modalSelectedType = 'comment';

    function isCanvasBlank(cvs) {
      try {
        const pixelBuffer = new Uint32Array(
          ctx.getImageData(0, 0, cvs.width, cvs.height).data.buffer
        );
        return !pixelBuffer.some(color => color !== 0);
      } catch (e) {
        return false;
      }
    }

    function setCanvasResolution() {
      const nw = img.naturalWidth || 1088;
      const nh = img.naturalHeight || 1425;
      let changed = false;
      if (nw > 0 && nh > 0 && (canvas.width !== nw || canvas.height !== nh)) {
        canvas.width = nw;
        canvas.height = nh;
        changed = true;
      }
      if (previewCanvas && nw > 0 && nh > 0 && (previewCanvas.width !== nw || previewCanvas.height !== nh)) {
        previewCanvas.width = nw;
        previewCanvas.height = nh;
        changed = true;
      }
      if (changed) {
        loadCurrentPageAnnotation();
      }
    }

    loadCurrentPageAnnotation();

    if (img.complete && img.naturalWidth > 0) {
      setCanvasResolution();
    } else {
      img.addEventListener('load', () => setCanvasResolution(), { once: true });
    }

    function getCoords(e) {
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      return {
        x: (clientX - rect.left) * scaleX,
        y: (clientY - rect.top) * scaleY
      };
    }

    function pushUndoSnapshot() {
      try {
        const snapshot = ctx.getImageData(0, 0, canvas.width, canvas.height);
        annotHistory.push(snapshot);
        if (annotHistory.length > MAX_ANNOT_HISTORY) {
          annotHistory.shift();
        }
      } catch (e) {}
    }

    async function loadCurrentPageAnnotation() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      if (previewCtx && previewCanvas) {
        previewCtx.clearRect(0, 0, previewCanvas.width, previewCanvas.height);
      }
      annotHistory = [];
      const savedData = await AnnotationsStore.load(pageIndex);
      if (savedData) {
        const annotImg = new Image();
        annotImg.onload = () => {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(annotImg, 0, 0, canvas.width, canvas.height);
          pushUndoSnapshot();
        };
        annotImg.src = savedData;
      } else {
        pushUndoSnapshot();
      }
      pageNotes = (await AnnotationsStore.loadNotes(pageIndex)) || [];
      renderPageNotes();
      updatePointerEvents();
    }

    function updatePointerEvents() {
      if (currentAnnotTool === 'browse') {
        canvas.style.pointerEvents = 'none';
        canvas.className = 'book-annotate-canvas';
        if (img) img.style.cursor = 'zoom-in';
      } else {
        canvas.style.pointerEvents = 'auto';
        canvas.className = `book-annotate-canvas cursor-${currentAnnotTool}`;
        if (img) img.style.cursor = 'default';
      }
    }

    function onPointerDown(e) {
      if (currentAnnotTool === 'browse') return;
      if (e.touches && e.touches.length > 1) return;
      e.preventDefault();

      if (currentAnnotTool === 'note') {
        const rect = canvas.getBoundingClientRect();
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        const xPct = Math.round(Math.max(1, Math.min(98, ((clientX - rect.left) / rect.width) * 100)) * 10) / 10;
        const yPct = Math.round(Math.max(1, Math.min(98, ((clientY - rect.top) / rect.height) * 100)) * 10) / 10;
        openNoteEditorModal({ x: xPct, y: yPct });
        return;
      }

      isDrawing = true;
      const pt = getCoords(e);
      startPt = pt;
      lastPt = pt;

      if (currentAnnotTool === 'pen') {
        ctx.globalCompositeOperation = 'source-over';
        ctx.strokeStyle = currentAnnotColor;
        ctx.lineWidth = 3.5;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.beginPath();
        ctx.moveTo(pt.x, pt.y);
        ctx.lineTo(pt.x + 0.1, pt.y + 0.1);
        ctx.stroke();
      } else if (currentAnnotTool === 'eraser') {
        ctx.globalCompositeOperation = 'destination-out';
        ctx.lineWidth = 32;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.beginPath();
        ctx.moveTo(pt.x, pt.y);
        ctx.lineTo(pt.x + 0.1, pt.y + 0.1);
        ctx.stroke();
      } else if (currentAnnotTool === 'texthighlight' && previewCtx) {
        previewCtx.clearRect(0, 0, previewCanvas.width, previewCanvas.height);
        previewCtx.fillStyle = hexToRgba(currentAnnotColor, 0.42);
        previewCtx.fillRect(pt.x - 2, pt.y - 12, 4, 24);
      } else if (currentAnnotTool === 'underline' && previewCtx) {
        previewCtx.clearRect(0, 0, previewCanvas.width, previewCanvas.height);
        previewCtx.strokeStyle = currentAnnotColor;
        previewCtx.lineWidth = 3.5;
        previewCtx.lineCap = 'round';
        previewCtx.beginPath();
        previewCtx.moveTo(pt.x - 2, pt.y);
        previewCtx.lineTo(pt.x + 2, pt.y);
        previewCtx.stroke();
      }
      updateSaveIndicator(true);
    }

    function onPointerMove(e) {
      if (!isDrawing || currentAnnotTool === 'browse') return;
      e.preventDefault();
      const pt = getCoords(e);
      lastPt = pt;

      if (currentAnnotTool === 'texthighlight' && previewCtx) {
        previewCtx.clearRect(0, 0, previewCanvas.width, previewCanvas.height);
        const dx = pt.x - startPt.x;
        const dy = pt.y - startPt.y;
        let x, y, w, h;
        if (Math.abs(dy) <= 22) {
          x = Math.min(startPt.x, pt.x);
          w = Math.max(3, Math.abs(dx));
          h = 24;
          y = startPt.y - 12;
        } else {
          x = Math.min(startPt.x, pt.x);
          y = Math.min(startPt.y, pt.y);
          w = Math.max(3, Math.abs(dx));
          h = Math.max(16, Math.abs(dy));
        }
        previewCtx.fillStyle = hexToRgba(currentAnnotColor, 0.42);
        previewCtx.fillRect(x, y, w, h);
      } else if (currentAnnotTool === 'underline' && previewCtx) {
        previewCtx.clearRect(0, 0, previewCanvas.width, previewCanvas.height);
        const x1 = Math.min(startPt.x, pt.x);
        const x2 = Math.max(startPt.x, pt.x);
        const y = startPt.y;
        previewCtx.strokeStyle = currentAnnotColor;
        previewCtx.lineWidth = 3.5;
        previewCtx.lineCap = 'round';
        previewCtx.beginPath();
        previewCtx.moveTo(x1, y);
        previewCtx.lineTo(x2, y);
        previewCtx.stroke();
      } else if (currentAnnotTool === 'pen') {
        ctx.beginPath();
        ctx.moveTo(startPt.x === lastPt.x ? pt.x : lastPt.x, startPt.y === lastPt.y ? pt.y : lastPt.y);
        ctx.lineTo(pt.x, pt.y);
        ctx.stroke();
      } else if (currentAnnotTool === 'eraser') {
        ctx.beginPath();
        ctx.moveTo(lastPt.x, lastPt.y);
        ctx.lineTo(pt.x, pt.y);
        ctx.stroke();
      }
    }

    function onPointerUp(e) {
      if (!isDrawing) return;
      isDrawing = false;

      if (currentAnnotTool === 'texthighlight') {
        if (previewCtx) previewCtx.clearRect(0, 0, previewCanvas.width, previewCanvas.height);
        const endPt = (e.clientX !== undefined) ? getCoords(e) : lastPt;
        const dx = endPt.x - startPt.x;
        const dy = endPt.y - startPt.y;
        if (Math.abs(dx) >= 4 || Math.abs(dy) >= 4) {
          let x, y, w, h;
          if (Math.abs(dy) <= 22) {
            x = Math.min(startPt.x, endPt.x);
            w = Math.max(4, Math.abs(dx));
            h = 24;
            y = startPt.y - 12;
          } else {
            x = Math.min(startPt.x, endPt.x);
            y = Math.min(startPt.y, endPt.y);
            w = Math.max(4, Math.abs(dx));
            h = Math.max(16, Math.abs(dy));
          }
          ctx.globalCompositeOperation = 'source-over';
          ctx.fillStyle = hexToRgba(currentAnnotColor, 0.42);
          ctx.fillRect(x, y, w, h);
        }
      } else if (currentAnnotTool === 'underline') {
        if (previewCtx) previewCtx.clearRect(0, 0, previewCanvas.width, previewCanvas.height);
        const endPt = (e.clientX !== undefined) ? getCoords(e) : lastPt;
        const dx = Math.abs(endPt.x - startPt.x);
        if (dx >= 4) {
          const x1 = Math.min(startPt.x, endPt.x);
          const x2 = Math.max(startPt.x, endPt.x);
          const y = startPt.y;
          ctx.globalCompositeOperation = 'source-over';
          ctx.strokeStyle = currentAnnotColor;
          ctx.lineWidth = 3.5;
          ctx.lineCap = 'round';
          ctx.beginPath();
          ctx.moveTo(x1, y);
          ctx.lineTo(x2, y);
          ctx.stroke();
        }
      } else if (currentAnnotTool === 'pen' || currentAnnotTool === 'eraser') {
        ctx.closePath();
      }

      pushUndoSnapshot();
      persistAnnotation();
    }

    let saveTimer = null;
    function persistAnnotation() {
      clearTimeout(saveTimer);
      saveTimer = setTimeout(async () => {
        const blank = isCanvasBlank(canvas);
        if (blank) {
          await AnnotationsStore.clear(pageIndex);
        } else {
          const dataUrl = canvas.toDataURL('image/png');
          await AnnotationsStore.save(pageIndex, dataUrl);
        }
        updateSaveIndicator(false);
      }, 150);
    }

    function updateSaveIndicator(saving) {
      const pill = document.getElementById('annotSaveStatus');
      if (!pill) return;
      if (saving) {
        pill.classList.add('saving');
        pill.innerHTML = `<span class="save-icon">✏️</span>`;
        pill.title = 'আঁকছেন...';
      } else {
        pill.classList.remove('saving');
        pill.innerHTML = `<span class="save-icon">💾</span>`;
        pill.title = 'পিসিতে স্বয়ংক্রিয়ভাবে সংরক্ষিত';
      }
    }

    // Drawing listeners
    canvas.addEventListener('mousedown', onPointerDown);
    window.addEventListener('mousemove', onPointerMove);
    window.addEventListener('mouseup', onPointerUp);

    canvas.addEventListener('touchstart', onPointerDown, { passive: false });
    window.addEventListener('touchmove', onPointerMove, { passive: false });
    window.addEventListener('touchend', onPointerUp);

    // Undo action
    document.getElementById('annotBtnUndo')?.addEventListener('click', () => {
      if (annotHistory.length > 1) {
        annotHistory.pop();
        const prev = annotHistory[annotHistory.length - 1];
        ctx.putImageData(prev, 0, 0);
        persistAnnotation();
      } else if (annotHistory.length === 1) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        annotHistory = [];
        pushUndoSnapshot();
        persistAnnotation();
      }
    });

    // Clear action
    document.getElementById('annotBtnClear')?.addEventListener('click', () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      if (previewCtx && previewCanvas) {
        previewCtx.clearRect(0, 0, previewCanvas.width, previewCanvas.height);
      }
      pushUndoSnapshot();
      persistAnnotation();
    });

    // Notes, Comments and Links Handling
    function closeActivePopover() {
      if (activePopoverEl && activePopoverEl.parentNode) {
        activePopoverEl.parentNode.removeChild(activePopoverEl);
      }
      activePopoverEl = null;
    }

    function renderPageNotes() {
      if (!notesLayer) return;
      notesLayer.innerHTML = '';
      closeActivePopover();

      pageNotes.forEach((note) => {
        const pin = document.createElement('div');
        pin.className = `book-note-pin ${note.type === 'link' ? 'pin-link' : ''}`;
        pin.style.left = `${note.x}%`;
        pin.style.top = `${note.y}%`;
        pin.style.setProperty('--pin-bg', note.color || '#facc15');
        pin.dataset.noteId = note.id;

        const isLink = note.type === 'link';
        const icon = isLink ? '🔗' : '💬';
        const tooltip = isLink ? (note.linkTitle || note.linkUrl || 'ওয়েব লিংক') : (note.text || 'মন্তব্য');
        pin.title = tooltip;

        pin.innerHTML = `
          <span style="line-height:1;">${icon}</span>
          <span class="pin-pulse"></span>
        `;

        pin.addEventListener('click', (e) => {
          e.stopPropagation();
          showNotePopover(note, pin);
        });

        notesLayer.appendChild(pin);
      });
    }

    function showNotePopover(note, pinEl) {
      closeActivePopover();
      if (!notesLayer) return;

      const popover = document.createElement('div');
      popover.className = 'note-popover-card';
      activePopoverEl = popover;

      const posX = Math.max(4, Math.min(68, note.x));
      popover.style.left = `${posX}%`;
      if (note.y > 60) {
        popover.style.bottom = `${100 - note.y + 2}%`;
        popover.style.top = 'auto';
      } else {
        popover.style.top = `${note.y + 2}%`;
        popover.style.bottom = 'auto';
      }

      const isLink = note.type === 'link';
      const typeBadge = isLink ? '🔗 ওয়েব লিংক' : '💬 কমেন্ট / টেক্সট নোট';

      let linkHtml = '';
      if (isLink && note.linkUrl) {
        linkHtml = `
          <div class="note-popover-title">${escapeHtml(note.linkTitle || 'ওয়েব লিংক')}</div>
          <a href="${escapeHtml(note.linkUrl)}" target="_blank" rel="noopener noreferrer" class="note-link-btn" title="লিংকটি ব্রাউজারে খুলুন">
            <span>🌐 লিংকটি খুলুন</span>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
          </a>
          <div style="font-size:0.72rem; color:var(--text-muted); word-break:break-all; margin-top:6px;">${escapeHtml(note.linkUrl)}</div>
        `;
      }

      let textHtml = '';
      if (note.text) {
        textHtml = `<div class="note-popover-body" style="margin-top:${isLink ? '8px' : '0'};">${escapeHtml(note.text)}</div>`;
      }

      popover.innerHTML = `
        <div class="note-popover-header">
          <span class="note-type-badge">${typeBadge}</span>
          <div class="note-popover-actions">
            <button class="btn-popover-action" id="btnEditPopoverNote" title="নোট সম্পাদনা">✏️</button>
            <button class="btn-popover-action btn-delete-note" id="btnDeletePopoverNote" title="মুছে ফেলুন">🗑️</button>
            <button class="btn-popover-action" id="btnClosePopoverNote" title="বন্ধ করুন">✕</button>
          </div>
        </div>
        ${linkHtml}
        ${textHtml}
      `;

      popover.addEventListener('click', (e) => e.stopPropagation());

      popover.querySelector('#btnClosePopoverNote')?.addEventListener('click', (e) => {
        e.stopPropagation();
        closeActivePopover();
      });

      popover.querySelector('#btnEditPopoverNote')?.addEventListener('click', (e) => {
        e.stopPropagation();
        closeActivePopover();
        openNoteEditorModal(note);
      });

      popover.querySelector('#btnDeletePopoverNote')?.addEventListener('click', async (e) => {
        e.stopPropagation();
        if (confirm('আপনি কি এই নোট/লিংকটি মুছে ফেলতে চান?')) {
          pageNotes = pageNotes.filter(n => n.id !== note.id);
          await AnnotationsStore.saveNotes(pageIndex, pageNotes);
          closeActivePopover();
          renderPageNotes();
        }
      });

      notesLayer.appendChild(popover);
    }

    function openNoteEditorModal(noteData) {
      currentEditingNote = noteData || null;
      const overlay = document.getElementById('noteEditorOverlay');
      if (!overlay) return;

      const titleEl = document.getElementById('noteModalTitle');
      const iconEl = document.getElementById('noteModalIcon');
      const inputNoteText = document.getElementById('inputNoteText');
      const inputLinkTitle = document.getElementById('inputLinkTitle');
      const inputLinkUrl = document.getElementById('inputLinkUrl');
      const inputLinkDesc = document.getElementById('inputLinkDesc');
      const tabComment = document.getElementById('tabNoteComment');
      const tabLink = document.getElementById('tabNoteLink');
      const secComment = document.getElementById('formSectionComment');
      const secLink = document.getElementById('formSectionLink');

      const isEdit = Boolean(noteData && noteData.id);
      if (titleEl) titleEl.textContent = isEdit ? 'নোট বা লিংক সম্পাদনা করুন' : 'কমেন্ট ও টেক্সট নোট যোগ করুন';

      modalSelectedType = (noteData && noteData.type) ? noteData.type : 'comment';
      if (modalSelectedType === 'link') {
        tabComment?.classList.remove('active');
        tabLink?.classList.add('active');
        if (secComment) secComment.style.display = 'none';
        if (secLink) secLink.style.display = 'block';
        if (iconEl) iconEl.textContent = '🔗';
      } else {
        tabComment?.classList.add('active');
        tabLink?.classList.remove('active');
        if (secComment) secComment.style.display = 'block';
        if (secLink) secLink.style.display = 'none';
        if (iconEl) iconEl.textContent = '💬';
      }

      if (inputNoteText) inputNoteText.value = (noteData && noteData.text) || '';
      if (inputLinkTitle) inputLinkTitle.value = (noteData && noteData.linkTitle) || '';
      if (inputLinkUrl) inputLinkUrl.value = (noteData && noteData.linkUrl) || '';
      if (inputLinkDesc) inputLinkDesc.value = (noteData && noteData.type === 'link' && noteData.text) || '';

      modalSelectedColor = (noteData && noteData.color) || currentAnnotColor || '#facc15';
      document.querySelectorAll('.note-modal-color-btn').forEach(btn => {
        if (btn.getAttribute('data-color') === modalSelectedColor) {
          btn.classList.add('active');
        } else {
          btn.classList.remove('active');
        }
      });

      overlay.classList.add('active');
      setTimeout(() => {
        if (modalSelectedType === 'link') {
          inputLinkTitle?.focus();
        } else {
          inputNoteText?.focus();
        }
      }, 100);
    }

    function closeNoteEditorModal() {
      const overlay = document.getElementById('noteEditorOverlay');
      if (overlay) overlay.classList.remove('active');
      currentEditingNote = null;
    }

    // Modal controls
    document.getElementById('tabNoteComment')?.addEventListener('click', () => {
      modalSelectedType = 'comment';
      document.getElementById('tabNoteComment')?.classList.add('active');
      document.getElementById('tabNoteLink')?.classList.remove('active');
      const secComment = document.getElementById('formSectionComment');
      const secLink = document.getElementById('formSectionLink');
      if (secComment) secComment.style.display = 'block';
      if (secLink) secLink.style.display = 'none';
      const iconEl = document.getElementById('noteModalIcon');
      if (iconEl) iconEl.textContent = '💬';
    });

    document.getElementById('tabNoteLink')?.addEventListener('click', () => {
      modalSelectedType = 'link';
      document.getElementById('tabNoteLink')?.classList.add('active');
      document.getElementById('tabNoteComment')?.classList.remove('active');
      const secComment = document.getElementById('formSectionComment');
      const secLink = document.getElementById('formSectionLink');
      if (secComment) secComment.style.display = 'none';
      if (secLink) secLink.style.display = 'block';
      const iconEl = document.getElementById('noteModalIcon');
      if (iconEl) iconEl.textContent = '🔗';
    });

    document.querySelectorAll('.note-modal-color-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        modalSelectedColor = btn.getAttribute('data-color') || '#facc15';
        document.querySelectorAll('.note-modal-color-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
      });
    });

    document.getElementById('btnCloseNoteEditor')?.addEventListener('click', closeNoteEditorModal);
    document.getElementById('btnCancelNoteModal')?.addEventListener('click', closeNoteEditorModal);

    document.getElementById('btnSaveNoteModal')?.addEventListener('click', async () => {
      const isLink = (modalSelectedType === 'link');
      const textVal = isLink 
        ? (document.getElementById('inputLinkDesc')?.value || '').trim() 
        : (document.getElementById('inputNoteText')?.value || '').trim();
      const linkTitleVal = (document.getElementById('inputLinkTitle')?.value || '').trim();
      let linkUrlVal = (document.getElementById('inputLinkUrl')?.value || '').trim();

      if (isLink && !linkUrlVal) {
        alert('অনুগ্রহ করে একটি লিংক URL প্রদান করুন।');
        document.getElementById('inputLinkUrl')?.focus();
        return;
      }
      if (!isLink && !textVal) {
        alert('অনুগ্রহ করে আপনার মন্তব্য বা নোট লিখুন।');
        document.getElementById('inputNoteText')?.focus();
        return;
      }
      if (isLink && linkUrlVal && !linkUrlVal.startsWith('http://') && !linkUrlVal.startsWith('https://')) {
        linkUrlVal = 'https://' + linkUrlVal;
      }

      if (currentEditingNote && currentEditingNote.id) {
        const existing = pageNotes.find(n => n.id === currentEditingNote.id);
        if (existing) {
          existing.type = modalSelectedType;
          existing.text = textVal;
          existing.linkTitle = linkTitleVal;
          existing.linkUrl = linkUrlVal;
          existing.color = modalSelectedColor;
          existing.updated = Date.now();
        }
      } else {
        const newNote = {
          id: 'note_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
          page: pageIndex,
          type: modalSelectedType,
          x: (currentEditingNote && currentEditingNote.x !== undefined) ? currentEditingNote.x : 50,
          y: (currentEditingNote && currentEditingNote.y !== undefined) ? currentEditingNote.y : 50,
          text: textVal,
          linkTitle: linkTitleVal,
          linkUrl: linkUrlVal,
          color: modalSelectedColor,
          created: Date.now()
        };
        pageNotes.push(newNote);
      }

      await AnnotationsStore.saveNotes(pageIndex, pageNotes);
      closeNoteEditorModal();
      renderPageNotes();
    });

    document.addEventListener('click', (e) => {
      if (!e.target.closest('.note-popover-card') && !e.target.closest('.book-note-pin')) {
        closeActivePopover();
      }
    });

    // Tool switching
    const toolBtns = {
      browse: document.getElementById('annotToolBrowse'),
      texthighlight: document.getElementById('annotToolTextHighlight'),
      underline: document.getElementById('annotToolUnderline'),
      pen: document.getElementById('annotToolPen'),
      note: document.getElementById('annotToolNote'),
      eraser: document.getElementById('annotToolEraser')
    };

    function selectTool(toolName) {
      currentAnnotTool = toolName;
      Object.keys(toolBtns).forEach(t => {
        if (toolBtns[t]) {
          if (t === toolName) toolBtns[t].classList.add('active');
          else toolBtns[t].classList.remove('active');
        }
      });
      updatePointerEvents();
    }

    toolBtns.browse?.addEventListener('click', () => selectTool('browse'));
    toolBtns.texthighlight?.addEventListener('click', () => selectTool('texthighlight'));
    toolBtns.underline?.addEventListener('click', () => selectTool('underline'));
    toolBtns.pen?.addEventListener('click', () => selectTool('pen'));
    toolBtns.note?.addEventListener('click', () => selectTool('note'));
    toolBtns.eraser?.addEventListener('click', () => selectTool('eraser'));

    // Color switching
    document.querySelectorAll('.annot-color-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const col = btn.getAttribute('data-color');
        currentAnnotColor = col;
        document.querySelectorAll('.annot-color-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        if (currentAnnotTool === 'browse' || currentAnnotTool === 'eraser') {
          selectTool('texthighlight');
        }
      });
    });

    updatePointerEvents();
  }

  async function renderBookView(container, ch) {
    const pageNumPadded = String(currentBookPage).padStart(3, '0');
    const pageImgUrl = `ocr_cache/page_${pageNumPadded}.png`;

    // Retrieve saved video for this chapter
    const allVideos = getSavedVideos();
    const chapterVideo = allVideos[ch.id] || { title: `${ch.titleBangla} ভিডিও লেকচার`, url: "" };

    const videoIframeHtml = chapterVideo.url ? `
      <div class="video-frame-container">
        <iframe src="${chapterVideo.url}" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
      </div>
    ` : `
      <div class="video-placeholder">
        <div style="font-size:2.2rem; margin-bottom:8px;">🎥</div>
        <div style="font-size:1rem; font-weight:600; color:#e2e8f0; margin-bottom:4px;">কোনো ভিডিও লেকচার যুক্ত নেই</div>
        <div style="font-size:0.8rem; margin-bottom:12px;">উপরে <strong>"⚙️ ভিডিও অ্যাডমিন"</strong> বাটনে ক্লিক করে আপনার ইউটিউব প্রাইভেট ভিডিও লিঙ্ক যুক্ত করুন।</div>
        <button class="btn btn-primary" onclick="document.getElementById('btnAdminModal').click()" style="padding:6px 14px; font-size:0.82rem;">
          ⚙️ ভিডিও লিংক যোগ করুন
        </button>
      </div>
    `;

    container.innerHTML = `
      <div class="book-reader-container ${isBookSinglePane ? 'single-book-mode' : ''}">
        <!-- Left: Original Scanned Textbook High-Res Page -->
        <div class="book-page-viewer">
          <div class="book-toolbar">
            <div style="display:flex; align-items:center; gap:3px;">
              <button class="btn btn-glass" id="btnPrevPage" style="padding:2px 7px; font-size:0.75rem;" title="পূর্ববর্তী পাতা">◀</button>
              <span class="page-indicator-pill" id="pageDisplay">পৃষ্ঠা ${currentBookPage + 1}</span>
              <button class="btn btn-glass" id="btnNextPage" style="padding:2px 7px; font-size:0.75rem;" title="পরবর্তী পাতা">▶</button>
            </div>

            <!-- Compact Adobe Acrobat Style Annotation Toolbar -->
            <div class="annot-toolbar" id="bookAnnotToolbar">
              <button class="annot-tool-btn ${currentAnnotTool === 'browse' ? 'active' : ''}" id="annotToolBrowse" title="👆 পড়া ও স্ক্রল মোড">
                <span class="icon">👆</span>
              </button>
              <button class="annot-tool-btn ${currentAnnotTool === 'texthighlight' ? 'active' : ''}" id="annotToolTextHighlight" title="🖍️ সোজা টেক্সট হাইলাইটার (টেনে ধরলে সোজা টেক্সট লাইন মার্কিং)">
                <span class="icon">🖍️</span>
              </button>
              <button class="annot-tool-btn ${currentAnnotTool === 'underline' ? 'active' : ''}" id="annotToolUnderline" title="📏 সোজা টেক্সট আন্ডারলাইন (টেনে ধরলে সোজা লাইন)">
                <span class="icon">📏</span>
              </button>
              <button class="annot-tool-btn ${currentAnnotTool === 'pen' ? 'active' : ''}" id="annotToolPen" title="🖊️ ফ্রিহ্যান্ড পেন (সার্কেল, গোল বা নিজের মতো দাগানোর বিকল্প)">
                <span class="icon">🖊️</span>
              </button>
              <button class="annot-tool-btn ${currentAnnotTool === 'note' ? 'active' : ''}" id="annotToolNote" title="💬 কমেন্ট, টেক্সট নোট বা ওয়েব লিংক পিন করুন">
                <span class="icon">💬</span>
              </button>
              <button class="annot-tool-btn ${currentAnnotTool === 'eraser' ? 'active' : ''}" id="annotToolEraser" title="🧹 ইরেজার (দাগ মুছুন)">
                <span class="icon">🧹</span>
              </button>

              <div class="annot-divider"></div>

              <div class="annot-palette" id="annotPalette">
                <button class="annot-color-btn ${currentAnnotColor === '#facc15' ? 'active' : ''}" data-color="#facc15" style="--c:#facc15;" title="হলুদ"></button>
                <button class="annot-color-btn ${currentAnnotColor === '#4ade80' ? 'active' : ''}" data-color="#4ade80" style="--c:#4ade80;" title="সবুজ"></button>
                <button class="annot-color-btn ${currentAnnotColor === '#38bdf8' ? 'active' : ''}" data-color="#38bdf8" style="--c:#38bdf8;" title="আকাশি"></button>
                <button class="annot-color-btn ${currentAnnotColor === '#f43f5e' ? 'active' : ''}" data-color="#f43f5e" style="--c:#f43f5e;" title="গোলাপী / লাল"></button>
                <button class="annot-color-btn ${currentAnnotColor === '#a855f7' ? 'active' : ''}" data-color="#a855f7" style="--c:#a855f7;" title="বেগুনি"></button>
              </div>

              <div class="annot-divider"></div>

              <button class="annot-action-btn" id="annotBtnUndo" title="পূর্বাবস্থা (Undo)">
                <span>↩️</span>
              </button>
              <button class="annot-action-btn" id="annotBtnClear" title="এই পাতার সব দাগ মুছুন">
                <span>🗑️</span>
              </button>
              <button class="annot-action-btn" id="annotBtnBackup" title="দাগ ও নোট ব্যাকআপ বা ট্রান্সফার (Export / Import)">
                <span>💾⇄</span>
              </button>
              <input type="file" id="annotFileInput" accept=".json" style="display:none;">

              <div class="annot-save-pill" id="annotSaveStatus" title="পিসিতে স্থায়ীভাবে সংরক্ষিত (Auto-Saved)">
                <span class="save-icon">💾</span>
              </div>
            </div>

            <div style="display:flex; align-items:center; gap:4px;">
              <button class="btn btn-glass" id="btnTogglePageFit" style="padding:2px 7px; font-size:0.75rem; display:flex; align-items:center; gap:3px; cursor:pointer;" title="${isFitPageMode ? 'সম্পূর্ণ পাতা দেখাচ্ছে। পুরো জায়গা জুড়ে দেখতে ক্লিক করুন' : 'পুরো জায়গা জুড়ে দেখাচ্ছে। সম্পূর্ণ পাতা একনজরে দেখতে ক্লিক করুন'}">
                <span>${isFitPageMode ? '↔️' : '↕️'}</span>
                <span id="fitLabel" style="font-weight:600;">${isFitPageMode ? 'প্রস্থ' : 'পাতা'}</span>
              </button>
              <button class="btn btn-glass" id="btnToggleSinglePane" style="padding:2px 7px; font-size:0.75rem; display:flex; align-items:center; gap:3px; cursor:pointer;" title="${isBookSinglePane ? 'দ্বৈত ভিউতে ফিরুন (বই + ডিজিটাল লেআউট)' : 'শুধু মূল বই পুরো পর্দা জুড়ে দেখুন'}">
                <span>${isBookSinglePane ? '📑' : '🖥️'}</span>
                <span id="paneLabel" style="font-weight:600;">${isBookSinglePane ? 'দ্বৈত' : 'একক'}</span>
              </button>
              <button class="btn btn-glass btn-expand-book" id="btnExpandPdfPage" style="padding:2px 8px; font-size:0.75rem; cursor:pointer;" title="বড় আকারে মূল পাঠ্যবই জুম উইন্ডোতে দেখুন">
                <span>🔍 ⛶</span>
              </button>
            </div>
          </div>

          <div class="page-image-scroll-wrapper">
            <!-- Floating Left Arrow for Previous Page -->
            <button class="page-nav-floating btn-page-float-prev" id="btnFloatPrev" title="পূর্ববর্তী পৃষ্ঠা (আগের পাতা)">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="15 18 9 12 15 6"></polyline>
              </svg>
            </button>

            <div class="page-image-scroll ${isFitPageMode ? 'fit-page' : ''}" id="pageImageScrollContainer">
              <div class="book-page-canvas-wrapper" id="bookCanvasWrapper">
                <img id="scannedBookPageImg" class="book-page-img" src="${pageImgUrl}" alt="Page ${currentBookPage + 1}">
                <canvas id="bookAnnotateCanvas" class="book-annotate-canvas" width="1088" height="1425"></canvas>
                <canvas id="bookPreviewCanvas" class="book-preview-canvas" width="1088" height="1425"></canvas>
                <div id="bookNotesLayer" class="book-notes-layer"></div>
              </div>
            </div>

            <!-- Floating Right Arrow for Next Page -->
            <button class="page-nav-floating btn-page-float-next" id="btnFloatNext" title="পরবর্তী পৃষ্ঠা (পরের পাতা)">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="9 18 15 12 9 6"></polyline>
              </svg>
            </button>
          </div>

          <!-- Floating Splitter Toggle Tab on the Seam (চিহ্নিত অংশের বাটন) -->
          <button class="btn-side-pane-toggle" id="btnSidePaneToggle" title="${isBookSinglePane ? 'ডিজিটাল টেক্সট ও ভিডিও প্যানেল খুলুন' : 'ডিজিটাল প্যানেল বন্ধ করুন (বই বড় করুন)'}">
            <span class="toggle-icon">${isBookSinglePane ? '◀' : '▶'}</span>
            <span class="toggle-label">${isBookSinglePane ? 'ডিজিটাল প্যানেল' : 'বন্ধ করুন'}</span>
          </button>
        </div>

        <!-- Right: Structured Text, Math & Video Lecture Panel -->
        <div class="book-text-panel">
          <div class="book-toolbar">
            <div style="font-weight:700; color:var(--accent-cyan); display:flex; align-items:center; gap:6px; font-size:0.86rem;">
              <span>📜</span>
              <span>ডিজিটাল টেক্সট ও ইন্টারঅ্যাক্টিভ লেআউট</span>
            </div>
            <div style="display:flex; align-items:center; gap:8px;">
              <button class="btn btn-glass btn-audio-read" id="btnToggleAudioRead" style="padding:4px 12px; font-size:0.8rem; display:flex; align-items:center; gap:6px;" title="এই পৃষ্ঠার সম্পূর্ণ টেক্সট অডিও আকারে শুনুন">
                <span id="audioIcon">🔊</span>
                <span id="audioLabel">অডিও শুনুন</span>
              </button>
              <button class="btn btn-primary" id="btnJumpToLab" style="padding:4px 10px; font-size:0.78rem;">
                🧪 ল্যাবে যাও
              </button>
            </div>
          </div>

          <div class="book-text-content" id="parsedPageContent">
            <!-- Video Lecture Box Placed in Reader Panel -->
            <div class="book-video-panel">
              <div class="book-video-header">
                <div style="display:flex; align-items:center; gap:8px;">
                  <span style="color:#ef4444; font-size:1.1rem;">▶</span>
                  <span style="font-weight:600; font-size:0.92rem; color:#fff;">${chapterVideo.title || 'অনলাইন লেকচার'}</span>
                </div>
                <button class="btn btn-glass" onclick="document.getElementById('btnAdminModal').click()" style="padding:4px 10px; font-size:0.75rem;">
                  ✏️ ভিডিও এডিট
                </button>
              </div>
              <div style="position:relative; width:100%;">
                ${videoIframeHtml}
              </div>
            </div>

            <div id="pageTextSegments" style="margin-top:20px;">
              <div style="display:flex; justify-content:center; align-items:center; height:120px; color:var(--text-muted);">
                পাতা লোড হচ্ছে...
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    function navigatePage(direction) {
      stopAudio();
      if (direction === 'prev' && currentBookPage > 0) {
        currentBookPage--;
      } else if (direction === 'next' && currentBookPage < 365) {
        currentBookPage++;
      } else {
        return;
      }
      playPageTurnSound();
      renderBookView(container, ch);

      setTimeout(() => {
        const img = document.getElementById('scannedBookPageImg');
        if (img) {
          img.classList.remove('page-flip-anim-next', 'page-flip-anim-prev');
          void img.offsetWidth;
          img.classList.add(direction === 'next' ? 'page-flip-anim-next' : 'page-flip-anim-prev');
        }
      }, 10);
    }

    // Hook page navigation buttons (top toolbar and floating edge buttons)
    document.getElementById('btnPrevPage')?.addEventListener('click', () => navigatePage('prev'));
    document.getElementById('btnFloatPrev')?.addEventListener('click', () => navigatePage('prev'));
    document.getElementById('btnNextPage')?.addEventListener('click', () => navigatePage('next'));
    document.getElementById('btnFloatNext')?.addEventListener('click', () => navigatePage('next'));

    document.getElementById('btnJumpToLab')?.addEventListener('click', () => {
      switchTab('lab');
    });

    document.getElementById('btnExpandPdfPage')?.addEventListener('click', () => {
      openBookZoomModal(currentBookPage);
    });

    // Toggle Page Fit (Fill Width / পুরো জায়গা vs Fit Page / পাতায় ফিট)
    document.getElementById('btnTogglePageFit')?.addEventListener('click', () => {
      isFitPageMode = !isFitPageMode;
      try {
        localStorage.setItem('physics_book_fit_mode', isFitPageMode ? 'page' : 'width');
      } catch (e) {}
      const pageScroll = document.querySelector('.page-image-scroll');
      const fitBtn = document.getElementById('btnTogglePageFit');
      if (pageScroll) {
        if (isFitPageMode) {
          pageScroll.classList.add('fit-page');
        } else {
          pageScroll.classList.remove('fit-page');
        }
      }
      if (fitBtn) {
        fitBtn.innerHTML = `
          <span>${isFitPageMode ? '↔️' : '↕️'}</span>
          <span id="fitLabel" style="font-weight:600;">${isFitPageMode ? 'প্রস্থ' : 'পাতা'}</span>
        `;
        fitBtn.title = isFitPageMode ? 'সম্পূর্ণ পাতা দেখাচ্ছে। পুরো জায়গা জুড়ে দেখতে ক্লিক করুন' : 'পুরো জায়গা জুড়ে দেখাচ্ছে। সম্পূর্ণ পাতা একনজরে দেখতে ক্লিক করুন';
      }
    });

    // Toggle Single Pane / Full Width Reader
    function toggleSinglePaneMode() {
      isBookSinglePane = !isBookSinglePane;
      try {
        localStorage.setItem('physics_book_single_pane', String(isBookSinglePane));
      } catch (e) {}
      const readerContainer = document.querySelector('.book-reader-container');
      const paneBtn = document.getElementById('btnToggleSinglePane');
      const sideToggle = document.getElementById('btnSidePaneToggle');
      if (readerContainer) {
        if (isBookSinglePane) {
          readerContainer.classList.add('single-book-mode');
        } else {
          readerContainer.classList.remove('single-book-mode');
        }
      }
      if (paneBtn) {
        paneBtn.innerHTML = `
          <span>${isBookSinglePane ? '📑' : '🖥️'}</span>
          <span id="paneLabel" style="font-weight:600;">${isBookSinglePane ? 'দ্বৈত' : 'একক'}</span>
        `;
        paneBtn.title = isBookSinglePane ? 'দ্বৈত ভিউতে ফিরুন (বই + ডিজিটাল লেআউট)' : 'শুধু মূল বই পুরো পর্দা জুড়ে দেখুন';
      }
      if (sideToggle) {
        sideToggle.innerHTML = `
          <span class="toggle-icon">${isBookSinglePane ? '◀' : '▶'}</span>
          <span class="toggle-label">${isBookSinglePane ? 'ডিজিটাল প্যানেল' : 'বন্ধ করুন'}</span>
        `;
        sideToggle.title = isBookSinglePane ? 'ডিজিটাল টেক্সট ও ভিডিও প্যানেল খুলুন' : 'ডিজিটাল প্যানেল বন্ধ করুন (বই বড় করুন)';
      }
    }

    document.getElementById('btnToggleSinglePane')?.addEventListener('click', toggleSinglePaneMode);
    document.getElementById('btnSidePaneToggle')?.addEventListener('click', toggleSinglePaneMode);

    // Annotations Backup & Transfer (Export / Import)
    document.getElementById('annotBtnBackup')?.addEventListener('click', async () => {
      const choice = confirm('আপনি কি এই বইয়ের সমস্ত দাগানো অংশ ও নোট ব্যাকআপ ফাইল আকারে ডাউনলোড (Export) করতে চান?\n\n(অন্য কোনো ব্রাউজার বা ডিভাইসে সেভ করা ব্যাকআপ আপলোড করতে Cancel চাপুন)');
      if (choice) {
        const json = await AnnotationsStore.exportBackup();
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `physics_annotations_backup_${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
      } else {
        const doImport = confirm('আপনার কম্পিউটার থেকে আগের সেভ করা ব্যাকআপ ফাইলটি এখানে লোড (Import) করতে চান?');
        if (doImport) {
          document.getElementById('annotFileInput')?.click();
        }
      }
    });

    document.getElementById('annotFileInput')?.addEventListener('change', async (e) => {
      const file = e.target.files && e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = async (ev) => {
          const success = await AnnotationsStore.importBackup(ev.target.result);
          if (success) {
            alert('আপনার সমস্ত দাগ ও নোট সফলভাবে লোড হয়েছে!');
            renderBookView(container, ch);
          } else {
            alert('ফাইলটি সঠিক ব্যাকআপ ফাইল নয়।');
          }
        };
        reader.readAsText(file);
      }
    });

    document.getElementById('scannedBookPageImg')?.addEventListener('click', () => {
      if (currentAnnotTool === 'browse') {
        openBookZoomModal(currentBookPage);
      }
    });

    // Initialize Adobe-like persistent book annotations module for this page
    setupBookAnnotation(currentBookPage);

    // Hook main toolbar audio button
    document.getElementById('btnToggleAudioRead')?.addEventListener('click', () => {
      toggleAudio();
    });

    // Fetch page text from full Word-extracted BOOK_PAGE_TEXT (Pages 1 to 366)
    const pageNumKey = String(currentBookPage + 1);
    const pageLines = (typeof BOOK_PAGE_TEXT !== 'undefined' && BOOK_PAGE_TEXT[pageNumKey]) ? BOOK_PAGE_TEXT[pageNumKey] : null;

    // Optional layout data for visual diagrams / crops
    const layoutData = await loadPageLayout(currentBookPage);
    const contentArea = document.getElementById('pageTextSegments');

    if (!contentArea) return;

    let html = '';
    if (pageLines && pageLines.length > 0) {
      html = formatBookPageLines(pageLines, pageNumPadded, layoutData);
    } else if (layoutData && layoutData.segments && layoutData.segments.length > 0) {
      // Secondary fallback to OCR layout segments
      layoutData.segments.forEach((seg, idx) => {
        if (seg.type === 'text') {
          const txt = seg.value || '';
          const label = seg.label || '';
          if (label === 'heading' || txt.startsWith('১.') || txt.startsWith('২.') || txt.startsWith('৩.') || txt.includes('অধ্যায়') || txt.includes('অধ্যায়')) {
            html += `<h3 class="book-section-heading"><button class="btn-inline-audio" data-speak="${encodeURIComponent(txt)}" title="অডিও শুনুন">🔊</button>${txt}</h3>`;
          } else if (label !== 'header' && label !== 'page_number') {
            html += `<p class="book-paragraph">${txt}</p>`;
          }
        } else if (seg.type === 'element') {
          const elemImgPath = `ocr_cache/page_${pageNumPadded}_element_${String(idx).padStart(2, '0')}.png`;
          const elemLabel = seg.label || 'ডায়াগ্রাম / চিত্র';
          html += `
            <div class="book-element-box">
              <img src="${elemImgPath}" onerror="this.parentElement.style.display='none'" alt="${elemLabel}">
              <div class="book-element-caption">${elemLabel}</div>
            </div>
          `;
        }
      });
    } else {
      // Graceful fallback showing original page note without OCR processing error
      html = `
        <div style="padding:24px; text-align:center; color:var(--text-muted);">
          <div style="font-size:1.8rem; margin-bottom:8px;">📖</div>
          <div style="font-size:0.95rem; font-weight:600; color:var(--text-main); margin-bottom:4px;">পৃষ্ঠা ${currentBookPage + 1}</div>
          <div style="font-size:0.85rem;">বাঁ পাশের প্যানেলে মূল পাঠ্যবইয়ের হাই-রেজ্যুলেশন পৃষ্ঠা দৃশ্যমান রয়েছে।</div>
        </div>
      `;
    }

    contentArea.innerHTML = html;

    // Hook heading inline audio button (user requested beside chapter heading)
    document.getElementById('btnHeadingAudio')?.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleAudio();
    });

    // Hook any section heading audio buttons
    contentArea.querySelectorAll('.btn-inline-audio[data-speak]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const text = decodeURIComponent(btn.getAttribute('data-speak') || '');
        if (text) {
          playAudioText(text);
        }
      });
    });

    // Sync audio UI status if already speaking
    updateAudioUi(isSpeaking);

    // Render any KaTeX math in the loaded text
    if (window.renderMathInElement) {
      window.renderMathInElement(contentArea, {
        delimiters: [
          { left: "$$", right: "$$", display: true },
          { left: "$", right: "$", display: false },
          { left: "\\[", right: "\\]", display: true },
          { left: "\\(", right: "\\)", display: false }
        ],
        throwOnError: false
      });
    }
  }

  function formatBookPageLines(lines, pageNumPadded, layoutData) {
    let html = '';
    let inTable = false;
    let tableRows = [];
    let inList = false;
    let listItems = [];

    function flushList() {
      if (inList && listItems.length > 0) {
        html += `<ul class="book-list">${listItems.map(item => `<li>${item}</li>`).join('')}</ul>`;
        listItems = [];
        inList = false;
      }
    }

    function flushTable() {
      if (inTable && tableRows.length > 0) {
        let tableHtml = '<div class="book-table-wrapper"><table class="book-table">';
        tableRows.forEach((row, rIdx) => {
          if (row.includes('---')) return;
          const cells = row.split('|').map(c => c.trim()).filter((c, i, a) => i > 0 && i < a.length - 1);
          if (cells.length > 0) {
            tableHtml += '<tr>';
            cells.forEach(cell => {
              if (rIdx === 0) {
                tableHtml += `<th>${cell}</th>`;
              } else {
                tableHtml += `<td>${cell}</td>`;
              }
            });
            tableHtml += '</tr>';
          }
        });
        tableHtml += '</table></div>';
        html += tableHtml;
        tableRows = [];
        inTable = false;
      }
    }

    lines.forEach((line, idx) => {
      const trimmed = line.trim();
      if (!trimmed) return;

      // Check if markdown table row
      if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
        flushList();
        inTable = true;
        tableRows.push(trimmed);
        return;
      } else if (inTable) {
        flushTable();
      }

      // Check if bullet item
      if (trimmed.startsWith('* ') || trimmed.startsWith('- ') || trimmed.startsWith('• ')) {
        flushTable();
        inList = true;
        listItems.push(trimmed.replace(/^[*•-]\s+/, ''));
        return;
      } else if (inList) {
        flushList();
      }

      // Chapter title / Heading
      if (trimmed.includes('অধ্যায়') || trimmed.includes('অধ্যায়') || trimmed.startsWith('সূচিপত্র')) {
        html += `<h2 class="book-ch-heading"><button class="btn-inline-audio" id="btnHeadingAudio" title="এই অধ্যায়ের পাঠ্য অডিও আকারে শুনুন">🔊</button>${trimmed}</h2>`;
        return;
      }

      // Exercise, example or creative question blocks
      if (trimmed.startsWith('সৃজনশীল প্রশ্ন') || trimmed.startsWith('অনুশীলনী') || trimmed.startsWith('সংক্ষিপ্ত উত্তর প্রশ্ন') || trimmed === 'নিজে করো' || trimmed === 'উদাহরণ') {
        html += `<div class="book-highlight-heading">${trimmed}</div>`;
        return;
      }

      // Subtitle in parenthesis right under a heading e.g. (Force), (Motion)
      if (trimmed.startsWith('(') && trimmed.endsWith(')') && trimmed.length < 65) {
        html += `<div class="book-ch-subheading">${trimmed}</div>`;
        return;
      }

      // Section titles like ১.১, ২.৩, ৩.১.১ etc.
      if (/^[০-৯\d]+\.[০-৯\d]+/.test(trimmed)) {
        html += `<h3 class="book-section-heading"><button class="btn-inline-audio" data-speak="${encodeURIComponent(trimmed)}" title="অডিও শুনুন">🔊</button>${trimmed}</h3>`;
        return;
      }

      // Footer page number or NCTB publication info
      if (trimmed.startsWith('ফর্মা-') || (/^[০-৯\d]{1,4}$/.test(trimmed) && idx === lines.length - 1)) {
        html += `<div class="book-page-footer-note">${trimmed}</div>`;
        return;
      }

      // Highlighted laws, definitions, question prompts
      if (trimmed.includes('সূত্র:') || trimmed.startsWith('সংজ্ঞা:') || trimmed.startsWith('প্রশ্ন:') || trimmed.startsWith('উত্তর:')) {
        html += `<div class="book-law-box">${trimmed}</div>`;
        return;
      }

      // Formula block
      if (/^[A-Za-z\s\=\+\-\*\/\^²³½\(\)\.\,]+$/.test(trimmed) && trimmed.length < 45 && trimmed.includes('=')) {
        html += `<div class="book-law-box" style="text-align:center; font-family:var(--font-mono); font-size:1.05rem;">$$${trimmed}$$</div>`;
        return;
      }

      // Standard textbook paragraph
      html += `<p class="book-paragraph">${trimmed}</p>`;
    });

    flushList();
    flushTable();

    // If cropped diagrams / formulas exist from OCR cache, append as visual cards
    if (layoutData && layoutData.segments) {
      const elementSegs = layoutData.segments.filter(s => s.type === 'element');
      if (elementSegs.length > 0) {
        html += `<div class="book-elements-container">
          <div class="book-elements-title">📸 চিত্র ও ডায়াগ্রাম ভিউয়ার:</div>
          <div class="book-elements-grid">`;
        elementSegs.forEach((seg, idx) => {
          const elemImgPath = `ocr_cache/page_${pageNumPadded}_element_${String(idx).padStart(2, '0')}.png`;
          const elemLabel = seg.label || 'চিত্র / চিত্রলেখ';
          html += `
            <div class="book-element-box">
              <img src="${elemImgPath}" onerror="this.parentElement.style.display='none'" alt="${elemLabel}">
              <div class="book-element-caption">${elemLabel}</div>
            </div>
          `;
        });
        html += `</div></div>`;
      }
    }

    return html;
  }

  function renderLabView(container, ch) {
    if (ch.number === 1) {
      // Vernier Caliper Lab
      container.innerHTML = `
        <div class="grid-2">
          <div class="glass-card">
            <div class="card-header">
              <div>
                <div class="card-title">🔬 ভার্চুয়াল স্লাইড ক্যালিপার্স সিমুলেটর</div>
                <div class="card-subtitle">গোলক/দণ্ড স্থাপন করে লাইভ ভার্নিয়ার সমপাতন ও নির্ভুল পাঠ নির্ণয়</div>
              </div>
            </div>
            <div class="canvas-wrapper">
              <canvas id="vernierCanvas"></canvas>
            </div>
            <div class="controls-grid">
              <div class="control-item">
                <label>বস্তুর প্রকৃত ব্যাস (d): <span class="val-badge" id="valDiameter">18.7 mm</span></label>
                <input type="range" class="slider" id="sliderDiameter" min="5" max="38" step="0.1" value="18.7">
              </div>
              <div class="control-item">
                <label>যান্ত্রিক ত্রুটি (±e): <span class="val-badge" id="valZeroError">0.00 mm</span></label>
                <input type="range" class="slider" id="sliderZeroError" min="-0.2" max="0.2" step="0.05" value="0.00">
              </div>
            </div>
            <div class="telemetry-row">
              <div class="telemetry-pill">
                <div class="telemetry-label">প্রধান স্কেল পাঠ (M)</div>
                <div class="telemetry-val" id="vernierMainScale">18 mm</div>
              </div>
              <div class="telemetry-pill">
                <div class="telemetry-label">ভার্নিয়ার সমপাতন (V)</div>
                <div class="telemetry-val" id="vernierCoincidence">14</div>
              </div>
              <div class="telemetry-pill">
                <div class="telemetry-label">ভার্নিয়ার ধ্রুবক (VC)</div>
                <div class="telemetry-val" id="vernierVC">0.05 mm</div>
              </div>
              <div class="telemetry-pill">
                <div class="telemetry-label">চূড়ান্ত পাঠ (L)</div>
                <div class="telemetry-val" id="vernierTotal">18.70 mm</div>
              </div>
            </div>
          </div>
          <div class="glass-card">
            <div class="card-title" style="margin-bottom:14px;">💡 মাস্টার টিপস ও ফর্মুলা ল্যাব</div>
            <div class="concept-box">
              <div class="box-header emerald"><span>✓</span> ভার্নিয়ার ধ্রুবকের গাণিতিক সূত্র</div>
              $$VC = \\frac{s}{n} = \\frac{1\\text{ mm}}{20} = 0.05\\text{ mm} = 0.005\\text{ cm}$$
              ভার্নিয়ার স্কেলের দাগ প্রধান স্কেলের দাগের চেয়ে কতটুকু ছোট, সেটাই তার ধ্রুবক।
            </div>
            <div class="concept-box trap">
              <div class="box-header rose"><span>⚠️</span> ত্রুটি সতর্কবার্তা</div>
              প্রকৃত দৈর্ঘ্য = $M + (V \\times VC) - (\\pm e)$। ঋণাত্মক ত্রুটি হলে পরিমাপকৃত মানের সাথে যোগ হবে!
            </div>
          </div>
        </div>
      `;

      setTimeout(() => {
        vernierLab = new VernierLab('vernierCanvas');
        vernierLab.updateTelemetry();
        document.getElementById('sliderDiameter').addEventListener('input', (e) => {
          document.getElementById('valDiameter').textContent = `${parseFloat(e.target.value).toFixed(1)} mm`;
          vernierLab.setDiameter(e.target.value);
        });
        document.getElementById('sliderZeroError').addEventListener('input', (e) => {
          document.getElementById('valZeroError').textContent = `${parseFloat(e.target.value).toFixed(2)} mm`;
          vernierLab.setZeroError(e.target.value);
        });
      }, 50);

    } else if (ch.number === 2) {
      // Kinematics Motion Lab
      container.innerHTML = `
        <div class="grid-2">
          <div class="glass-card">
            <div class="card-header">
              <div>
                <div class="card-title">🏎️ রিয়েল-টাইম কাইনেমেটিক্স ও মোশন ট্র্যাক</div>
                <div class="card-subtitle">আদিবেগ ও ত্বরণ নিয়ন্ত্রণ করে সাথে সাথে গাড়িটির সরণ ও বেগ দেখুন</div>
              </div>
              <div>
                <button class="btn btn-primary" id="btnPlayMotion">▶ প্লে / পজ</button>
                <button class="btn btn-glass" id="btnResetMotion">↺ রিসেট</button>
              </div>
            </div>
            <div class="canvas-wrapper">
              <canvas id="motionTrackCanvas"></canvas>
            </div>
            <div class="controls-grid">
              <div class="control-item">
                <label>আদিবেগ (u): <span class="val-badge" id="valU">0 m/s</span></label>
                <input type="range" class="slider" id="sliderU" min="0" max="15" step="1" value="0">
              </div>
              <div class="control-item">
                <label>ত্বরণ (a): <span class="val-badge" id="valA">2.5 m/s²</span></label>
                <input type="range" class="slider" id="sliderA" min="-4" max="6" step="0.5" value="2.5">
              </div>
            </div>
            <div class="telemetry-row">
              <div class="telemetry-pill">
                <div class="telemetry-label">সময় (t)</div>
                <div class="telemetry-val" id="motionTime">0.00 s</div>
              </div>
              <div class="telemetry-pill">
                <div class="telemetry-label">তাৎক্ষণিক বেগ (v)</div>
                <div class="telemetry-val" id="motionVelocity">0.00 m/s</div>
              </div>
              <div class="telemetry-pill">
                <div class="telemetry-label">অতিক্রান্ত সরণ (s)</div>
                <div class="telemetry-val" id="motionDisplacement">0.00 m</div>
              </div>
              <div class="telemetry-pill">
                <div class="telemetry-label">সুষম ত্বরণ (a)</div>
                <div class="telemetry-val" id="motionAcceleration">2.5 m/s²</div>
              </div>
            </div>
          </div>
          <div class="glass-card">
            <div class="card-title" style="margin-bottom:8px;">📈 লাইভ বেগ-সময় (v-t) লেখচিত্র</div>
            <div class="card-subtitle" style="margin-bottom:14px;">ছায়াবৃত ক্ষেত্রফল = বস্তুটির অতিক্রান্ত সরণ (s)</div>
            <div class="canvas-wrapper">
              <canvas id="motionGraphCanvas"></canvas>
            </div>
            <div class="concept-box" style="margin-top:14px;">
              <div class="box-header emerald"><span>💡</span> গ্রাফ থেকে সরাসরি মান</div>
              $$s = \\text{Area of } v-t = ut + \\frac{1}{2}at^2, \\quad \\text{Slope} = \\frac{dv}{dt} = a$$
            </div>
          </div>
        </div>
      `;

      setTimeout(() => {
        motionLab = new MotionLab('motionTrackCanvas', 'motionGraphCanvas');
        document.getElementById('btnPlayMotion').addEventListener('click', () => motionLab.togglePlay());
        document.getElementById('btnResetMotion').addEventListener('click', () => motionLab.reset());
        document.getElementById('sliderU').addEventListener('input', (e) => {
          document.getElementById('valU').textContent = `${e.target.value} m/s`;
          motionLab.setInitialVelocity(e.target.value);
        });
        document.getElementById('sliderA').addEventListener('input', (e) => {
          document.getElementById('valA').textContent = `${e.target.value} m/s²`;
          motionLab.setAcceleration(e.target.value);
        });
      }, 50);

    } else if (ch.number === 3) {
      // Force & Collision Lab
      container.innerHTML = `
        <div class="grid-2">
          <div class="glass-card">
            <div class="card-header">
              <div>
                <div class="card-title">💥 ভরবেগের নিত্যতা ও সংঘর্ষ ল্যাব</div>
                <div class="card-subtitle">স্থিতিস্থাপক ও অস্থিতিস্থাপক সংঘর্ষে ভরবেগের সংরক্ষণশীলতা পরীক্ষা</div>
              </div>
              <div>
                <button class="btn btn-primary" id="btnPlayForce">▶ ফায়ার / স্টার্ট</button>
                <button class="btn btn-glass" id="btnResetForce">↺ রিসেট</button>
              </div>
            </div>
            <div class="canvas-wrapper">
              <canvas id="forceCanvas"></canvas>
            </div>
            <div class="controls-grid">
              <div class="control-item">
                <label>১ম বস্তুর ভর (m1): <span class="val-badge" id="valM1">2.0 kg</span></label>
                <input type="range" class="slider" id="sliderM1" min="1" max="6" step="0.5" value="2.0">
              </div>
              <div class="control-item">
                <label>১ম বস্তুর আদিবেগ (u1): <span class="val-badge" id="valU1">4.0 m/s</span></label>
                <input type="range" class="slider" id="sliderU1" min="1" max="8" step="0.5" value="4.0">
              </div>
              <div class="control-item">
                <label>২য় বস্তুর ভর (m2): <span class="val-badge" id="valM2">3.0 kg</span></label>
                <input type="range" class="slider" id="sliderM2" min="1" max="6" step="0.5" value="3.0">
              </div>
              <div class="control-item">
                <label>২য় বস্তুর আদিবেগ (u2): <span class="val-badge" id="valU2">-2.0 m/s</span></label>
                <input type="range" class="slider" id="sliderU2" min="-6" max="0" step="0.5" value="-2.0">
              </div>
            </div>
            <div class="telemetry-row">
              <div class="telemetry-pill">
                <div class="telemetry-label">১ম ভরবেগ (p1)</div>
                <div class="telemetry-val" id="forceP1">8.0 kg·m/s</div>
              </div>
              <div class="telemetry-pill">
                <div class="telemetry-label">২য় ভরবেগ (p2)</div>
                <div class="telemetry-val" id="forceP2">-6.0 kg·m/s</div>
              </div>
              <div class="telemetry-pill">
                <div class="telemetry-label">মোট ভরবেগ (P_total)</div>
                <div class="telemetry-val" id="forcePTotal">2.0 kg·m/s</div>
              </div>
              <div class="telemetry-pill">
                <div class="telemetry-label">স্ট্যাটাস</div>
                <div class="telemetry-val" id="forceStatus">সংঘর্ষের পূর্বে</div>
              </div>
            </div>
          </div>
          <div class="glass-card">
            <div class="card-title" style="margin-bottom:14px;">🧠 টপ স্টুডেন্ট কনসেপ্ট</div>
            <div class="concept-box">
              <div class="box-header emerald"><span>✓</span> সার্বজনীন ভরবেগের নিত্যতা</div>
              $$m_1 u_1 + m_2 u_2 = m_1 v_1 + m_2 v_2$$
              বাহ্যিক নিট বল শূন্য হলে সংঘর্ষ স্থিতিস্থাপক কিংবা অস্থিতিস্থাপক যাই হোক না কেন, মোট ভরবেগ সর্বদা সংরক্ষিত থাকবে।
            </div>
            <div class="concept-box trap">
              <div class="box-header rose"><span>⚠️</span> গতিশক্তি সংরক্ষণশীলতা</div>
              স্থিতিস্থাপক সংঘর্ষে মোট গতিশক্তি সংরক্ষিত থাকে ($E_{k1} = E_{k2}$), কিন্তু অস্থিতিস্থাপক সংঘর্ষে গতিশক্তি তাপ ও শব্দ শক্তিতে রূপান্তরের কারণে হ্রাস পায়।
            </div>
          </div>
        </div>
      `;

      setTimeout(() => {
        forceLab = new ForceLab('forceCanvas');
        document.getElementById('btnPlayForce').addEventListener('click', () => forceLab.togglePlay());
        document.getElementById('btnResetForce').addEventListener('click', () => forceLab.reset());
        document.getElementById('sliderM1').addEventListener('input', (e) => {
          document.getElementById('valM1').textContent = `${e.target.value} kg`;
          forceLab.setM1(e.target.value);
        });
        document.getElementById('sliderU1').addEventListener('input', (e) => {
          document.getElementById('valU1').textContent = `${e.target.value} m/s`;
          forceLab.setU1(e.target.value);
        });
        document.getElementById('sliderM2').addEventListener('input', (e) => {
          document.getElementById('valM2').textContent = `${e.target.value} kg`;
          forceLab.setM2(e.target.value);
        });
        document.getElementById('sliderU2').addEventListener('input', (e) => {
          document.getElementById('valU2').textContent = `${e.target.value} m/s`;
          forceLab.setU2(e.target.value);
        });
      }, 50);

    } else if (ch.number === 4) {
      // Energy Conservation Lab
      container.innerHTML = `
        <div class="grid-2">
          <div class="glass-card">
            <div class="card-header">
              <div>
                <div class="card-title">⚡ শক্তি সংরক্ষণশীলতা ও দোলক ল্যাব</div>
                <div class="card-subtitle">গতিশক্তি (Ek) এবং বিভব শক্তির (Ep) পারস্পরিক রূপান্তর লাইভ পর্যবেক্ষণ</div>
              </div>
            </div>
            <div class="canvas-wrapper">
              <canvas id="energyCanvas"></canvas>
            </div>
            <div class="controls-grid">
              <div class="control-item">
                <label>বস্তুর ভর (m): <span class="val-badge" id="valMass">2.0 kg</span></label>
                <input type="range" class="slider" id="sliderMass" min="0.5" max="5" step="0.5" value="2.0">
              </div>
              <div class="control-item">
                <label>বিস্তার কোণ (θ): <span class="val-badge" id="valAngle">45°</span></label>
                <input type="range" class="slider" id="sliderAngle" min="15" max="75" step="5" value="45">
              </div>
            </div>
            <div class="telemetry-row">
              <div class="telemetry-pill">
                <div class="telemetry-label">বিভব শক্তি (Ep)</div>
                <div class="telemetry-val" id="energyEp">0.0 J</div>
              </div>
              <div class="telemetry-pill">
                <div class="telemetry-label">গতিশক্তি (Ek)</div>
                <div class="telemetry-val" id="energyEk">0.0 J</div>
              </div>
              <div class="telemetry-pill">
                <div class="telemetry-label">মোট যান্ত্রিক শক্তি (E)</div>
                <div class="telemetry-val" id="energyTotal">0.0 J</div>
              </div>
              <div class="telemetry-pill">
                <div class="telemetry-label">উচ্চতা (h)</div>
                <div class="telemetry-val" id="energyHeight">0.00 m</div>
              </div>
            </div>
          </div>
          <div class="glass-card">
            <div class="card-title" style="margin-bottom:14px;">📊 লাইভ শক্তি বিনিময় মিটার</div>
            <div style="margin-bottom:16px;">
              <div style="font-size:0.85rem; color:#38bdf8; margin-bottom:6px; display:flex; justify-content:space-between;">
                <span>বিভব শক্তি (Ep = mgh)</span>
              </div>
              <div style="height:14px; background:#1e293b; border-radius:7px; overflow:hidden;">
                <div id="barEp" style="height:100%; width:50%; background:linear-gradient(90deg, #38bdf8, #0284c7); transition:width 0.05s ease;"></div>
              </div>
            </div>
            <div style="margin-bottom:20px;">
              <div style="font-size:0.85rem; color:#10b981; margin-bottom:6px; display:flex; justify-content:space-between;">
                <span>গতিশক্তি (Ek = ½mv²)</span>
              </div>
              <div style="height:14px; background:#1e293b; border-radius:7px; overflow:hidden;">
                <div id="barEk" style="height:100%; width:50%; background:linear-gradient(90deg, #10b981, #059669); transition:width 0.05s ease;"></div>
              </div>
            </div>
            <div class="concept-box">
              <div class="box-header emerald"><span>✓</span> সংরক্ষণশীলতার মূল বাণী</div>
              $$E = E_p + E_k = mgh + \\frac{1}{2}mv^2 = \\text{ধ্রুবক}$$
              সর্বোচ্চ বিন্দুতে $E_k = 0, E = E_p$ এবং সর্বনিম্ন বিন্দুতে $E_p = 0, E = E_k$।
            </div>
          </div>
        </div>
      `;

      setTimeout(() => {
        energyLab = new EnergyLab('energyCanvas');
        document.getElementById('sliderMass').addEventListener('input', (e) => {
          document.getElementById('valMass').textContent = `${e.target.value} kg`;
          energyLab.setMass(e.target.value);
        });
        document.getElementById('sliderAngle').addEventListener('input', (e) => {
          document.getElementById('valAngle').textContent = `${e.target.value}°`;
          energyLab.setAmplitude(e.target.value);
        });
      }, 50);

    } else if (ch.number === 5) {
      // Chapter 5: Hydraulic Press & Buoyancy Lab
      container.innerHTML = `
        <div class="grid-2">
          <div class="glass-card">
            <div class="card-header">
              <div>
                <div class="card-title">🌊 প্যাসকেলের হাইড্রোলিক প্রেস ও প্লবতা ল্যাব</div>
                <div class="card-subtitle">পিস্টন ক্ষেত্রফল ও বল বৃদ্ধি নীতি ($F_1/A_1 = F_2/A_2$) লাইভ ক্যালকুলেটর</div>
              </div>
            </div>
            <div class="controls-grid">
              <div class="control-item">
                <label>১ম পিস্টনে প্রযুক্ত বল ($F_1$): <span class="val-badge" id="valF1">100 N</span></label>
                <input type="range" class="slider" id="sliderF1" min="10" max="500" step="10" value="100">
              </div>
              <div class="control-item">
                <label>১ম পিস্টনের ব্যাসার্ধ ($r_1$): <span class="val-badge" id="valR1">5 cm</span></label>
                <input type="range" class="slider" id="sliderR1" min="1" max="10" step="0.5" value="5">
              </div>
              <div class="control-item">
                <label>২য় পিস্টনের ব্যাসার্ধ ($r_2$): <span class="val-badge" id="valR2">25 cm</span></label>
                <input type="range" class="slider" id="sliderR2" min="10" max="50" step="1" value="25">
              </div>
            </div>
            <div class="telemetry-row">
              <div class="telemetry-pill">
                <div class="telemetry-label">ক্ষেত্রফল অনুপাত ($A_2/A_1$)</div>
                <div class="telemetry-val" id="hydroAreaRatio">25x</div>
              </div>
              <div class="telemetry-pill">
                <div class="telemetry-label">২য় পিস্টনে লব্ধ বল ($F_2$)</div>
                <div class="telemetry-val" id="hydroF2">2500 N</div>
              </div>
              <div class="telemetry-pill">
                <div class="telemetry-label">উত্তোলিত সর্বোচ্চ ভর</div>
                <div class="telemetry-val" id="hydroMass">255 kg</div>
              </div>
            </div>
          </div>
          <div class="glass-card">
            <div class="card-title" style="margin-bottom:14px;">🧠 আর্কিমিডিসের নিমজ্জন অনুপাত</div>
            <div class="concept-box">
              <div class="box-header emerald"><span>✓</span> ডুবা ও ভাসার মূলনীতি</div>
              $$\\frac{V_\\text{ডুবন্ত}}{V_\\text{মোট}} = \\frac{\\rho_\\text{বস্তু}}{\\rho_\\text{তরল}}$$
              বস্তুর ঘনত্ব তরলের চেয়ে কম হলে ভাসে, বেশি হলে ডুবে যায়।
            </div>
            <div class="concept-box trap">
              <div class="box-header rose"><span>⚠️</span> প্যাসকেলের সূত্রে কাজের নিত্যতা</div>
              বল বৃদ্ধি পেলেও মোট কৃতকাজ অপরিবর্তিত থাকে ($W_1 = W_2$)। ১ম পিস্টন যত নিচে নামবে, ২য় পিস্টন ক্ষেত্রফলের অনুপাতে অতি সূক্ষ্মভাবে উপরে উঠবে।
            </div>
          </div>
        </div>
      `;

      function updateHydro() {
        const f1 = parseFloat(document.getElementById('sliderF1').value);
        const r1 = parseFloat(document.getElementById('sliderR1').value);
        const r2 = parseFloat(document.getElementById('sliderR2').value);
        const ratio = (r2 * r2) / (r1 * r1);
        const f2 = f1 * ratio;
        const mass = f2 / 9.8;
        document.getElementById('valF1').textContent = `${f1} N`;
        document.getElementById('valR1').textContent = `${r1} cm`;
        document.getElementById('valR2').textContent = `${r2} cm`;
        document.getElementById('hydroAreaRatio').textContent = `${ratio.toFixed(1)}x`;
        document.getElementById('hydroF2').textContent = `${f2.toFixed(0)} N`;
        document.getElementById('hydroMass').textContent = `${mass.toFixed(1)} kg`;
      }
      setTimeout(() => {
        document.getElementById('sliderF1').addEventListener('input', updateHydro);
        document.getElementById('sliderR1').addEventListener('input', updateHydro);
        document.getElementById('sliderR2').addEventListener('input', updateHydro);
      }, 50);

    } else if (ch.number === 6) {
      // Chapter 6: Heat & Temperature Lab
      container.innerHTML = `
        <div class="grid-2">
          <div class="glass-card">
            <div class="card-header">
              <div>
                <div class="card-title">🌡️ তাপমাত্রা রূপান্তর ও ক্যালরিমিতি ল্যাব</div>
                <div class="card-subtitle">সেলসিয়াস, ফারেনহাইট ও কেলভিন স্কেল রূপান্তর ও তাপ শোষণ হিসাব</div>
              </div>
            </div>
            <div class="controls-grid">
              <div class="control-item">
                <label>সেলসিয়াস তাপমাত্রা (°C): <span class="val-badge" id="valTempC">25 °C</span></label>
                <input type="range" class="slider" id="sliderTempC" min="-50" max="120" step="1" value="25">
              </div>
              <div class="control-item">
                <label>পানির ভর (m): <span class="val-badge" id="valWaterM">2.0 kg</span></label>
                <input type="range" class="slider" id="sliderWaterM" min="0.5" max="10" step="0.5" value="2.0">
              </div>
            </div>
            <div class="telemetry-row">
              <div class="telemetry-pill">
                <div class="telemetry-label">ফারেনহাইট (°F)</div>
                <div class="telemetry-val" id="tempF">77.0 °F</div>
              </div>
              <div class="telemetry-pill">
                <div class="telemetry-label">কেলভিন (K)</div>
                <div class="telemetry-val" id="tempK">298.15 K</div>
              </div>
              <div class="telemetry-pill">
                <div class="telemetry-label">10°C উত্তপ্ত করতে তাপ (Q)</div>
                <div class="telemetry-val" id="tempQ">84 kJ</div>
              </div>
            </div>
          </div>
          <div class="glass-card">
            <div class="card-title" style="margin-bottom:14px;">💡 ক্যালরিমিতির মূলনীতি</div>
            <div class="concept-box">
              <div class="box-header emerald"><span>✓</span> গৃহিত তাপ = বর্জিত তাপ</div>
              $$Q = m s \\Delta T, \\quad s_\\text{পানি} = 4200\\text{ J/(kg}\\cdot\\text{K)}$$
            </div>
            <div class="concept-box trap">
              <div class="box-header rose"><span>⚠️</span> বরফ গলনের সুপ্ততাপ</div>
              0°C বরফ থেকে 0°C পানিতে রূপান্তরে $Q = m L_f$ ($L_f = 3.36 \\times 10^5$ J/kg) তাপ লাগে কোনো তাপমাত্রা বৃদ্ধি ছাড়াই।
            </div>
          </div>
        </div>
      `;

      function updateHeat() {
        const c = parseFloat(document.getElementById('sliderTempC').value);
        const m = parseFloat(document.getElementById('sliderWaterM').value);
        const f = (c * 9/5) + 32;
        const k = c + 273.15;
        const q = (m * 4200 * 10) / 1000; // kJ for 10 deg rise
        document.getElementById('valTempC').textContent = `${c} °C`;
        document.getElementById('valWaterM').textContent = `${m} kg`;
        document.getElementById('tempF').textContent = `${f.toFixed(1)} °F`;
        document.getElementById('tempK').textContent = `${k.toFixed(1)} K`;
        document.getElementById('tempQ').textContent = `${q.toFixed(1)} kJ`;
      }
      setTimeout(() => {
        document.getElementById('sliderTempC').addEventListener('input', updateHeat);
        document.getElementById('sliderWaterM').addEventListener('input', updateHeat);
      }, 50);

    } else if (ch.number === 7) {
      // Chapter 7: Waves & Sound Lab
      container.innerHTML = `
        <div class="grid-2">
          <div class="glass-card">
            <div class="card-header">
              <div>
                <div class="card-title">🔊 শব্দ তরঙ্গ ও প্রতিধ্বনি ল্যাব</div>
                <div class="card-subtitle">কম্পাঙ্ক ($f$), তাপমাত্রা ও প্রতিফলকের দূরত্ব দিয়ে প্রতিধ্বনি সিমুলেশন</div>
              </div>
            </div>
            <div class="controls-grid">
              <div class="control-item">
                <label>বায়ুর তাপমাত্রা (°C): <span class="val-badge" id="valAirT">25 °C</span></label>
                <input type="range" class="slider" id="sliderAirT" min="0" max="45" step="1" value="25">
              </div>
              <div class="control-item">
                <label>প্রতিফলকের দূরত্ব (d): <span class="val-badge" id="valDist">20 m</span></label>
                <input type="range" class="slider" id="sliderDist" min="10" max="60" step="1" value="20">
              </div>
            </div>
            <div class="telemetry-row">
              <div class="telemetry-pill">
                <div class="telemetry-label">শব্দের বেগ (v)</div>
                <div class="telemetry-val" id="soundV">345 m/s</div>
              </div>
              <div class="telemetry-pill">
                <div class="telemetry-label">প্রতিধ্বনির সময় (t)</div>
                <div class="telemetry-val" id="soundEchoT">0.116 s</div>
              </div>
              <div class="telemetry-pill">
                <div class="telemetry-label">প্রতিধ্বনি কি শোনা যাবে?</div>
                <div class="telemetry-val" id="soundStatus" style="color:#10b981;">হ্যাঁ (t ≥ 0.1s)</div>
              </div>
            </div>
          </div>
          <div class="glass-card">
            <div class="card-title" style="margin-bottom:14px;">📐 মৌলিক সম্পর্ক</div>
            <div class="concept-box">
              <div class="box-header emerald"><span>✓</span> তরঙ্গ সমীকরণ ও বেগ</div>
              $$v = f \\lambda, \\quad v = 330 + 0.6 \\times T_C\\text{ m/s}$$
            </div>
            <div class="concept-box trap">
              <div class="box-header rose"><span>⚠️</span> শব্দানুভূতির স্থায়িত্বকাল</div>
              মস্তিষ্কে অনুভূতি 0.1 s থাকে। $t = 2d/v < 0.1\\text{ s}$ হলে মূল শব্দ ও প্রতিধ্বনি আলাদা করে চেনা অসম্ভব।
            </div>
          </div>
        </div>
      `;

      function updateSound() {
        const tc = parseFloat(document.getElementById('sliderAirT').value);
        const d = parseFloat(document.getElementById('sliderDist').value);
        const v = 330 + 0.6 * tc;
        const t = (2 * d) / v;
        const canHear = t >= 0.1;
        document.getElementById('valAirT').textContent = `${tc} °C`;
        document.getElementById('valDist').textContent = `${d} m`;
        document.getElementById('soundV').textContent = `${v.toFixed(1)} m/s`;
        document.getElementById('soundEchoT').textContent = `${t.toFixed(3)} s`;
        const elSt = document.getElementById('soundStatus');
        elSt.textContent = canHear ? "হ্যাঁ (t ≥ 0.1s)" : "না (t < 0.1s)";
        elSt.style.color = canHear ? "#10b981" : "#f43f5e";
      }
      setTimeout(() => {
        document.getElementById('sliderAirT').addEventListener('input', updateSound);
        document.getElementById('sliderDist').addEventListener('input', updateSound);
      }, 50);

    } else if (ch.number === 8 || ch.number === 9) {
      // Optics Lab (Mirror & Lens)
      const isLens = ch.number === 9;
      container.innerHTML = `
        <div class="grid-2">
          <div class="glass-card">
            <div class="card-header">
              <div>
                <div class="card-title">${isLens ? '🔍 লেন্স ও প্রতিসরণ সিমুলেটর' : '🪞 গোলীয় দর্পণ ও প্রতিফলন সিমুলেটর'}</div>
                <div class="card-subtitle">লক্ষ্যবস্তুর দূরত্ব ($u$) পরিবর্তন করে প্রতিবিম্বের অবস্থান ($v$) ও বিবর্ধন ($m$) দেখা</div>
              </div>
            </div>
            <div class="controls-grid">
              <div class="control-item">
                <label>ফোকাস দূরত্ব (f): <span class="val-badge" id="valOpticsF">20 cm</span></label>
                <input type="range" class="slider" id="sliderOpticsF" min="10" max="40" step="5" value="20">
              </div>
              <div class="control-item">
                <label>লক্ষ্যবস্তুর দূরত্ব (u): <span class="val-badge" id="valOpticsU">35 cm</span></label>
                <input type="range" class="slider" id="sliderOpticsU" min="5" max="70" step="1" value="35">
              </div>
            </div>
            <div class="telemetry-row">
              <div class="telemetry-pill">
                <div class="telemetry-label">প্রতিবিম্বের দূরত্ব (v)</div>
                <div class="telemetry-val" id="opticsV">46.7 cm</div>
              </div>
              <div class="telemetry-pill">
                <div class="telemetry-label">রৈখিক বিবর্ধন (m)</div>
                <div class="telemetry-val" id="opticsM">1.33x</div>
              </div>
              <div class="telemetry-pill">
                <div class="telemetry-label">প্রতিবিম্বের প্রকৃতি</div>
                <div class="telemetry-val" id="opticsNature">বাস্তব ও উল্টো</div>
              </div>
            </div>
          </div>
          <div class="glass-card">
            <div class="card-title" style="margin-bottom:14px;">📐 অপটিক্স ফর্মুলা</div>
            <div class="concept-box">
              <div class="box-header emerald"><span>✓</span> সার্বজনীন সমীকরণ</div>
              $$\\frac{1}{u} + \\frac{1}{v} = \\frac{1}{f}, \\quad m = -\\frac{v}{u}$$
            </div>
            <div class="concept-box trap">
              <div class="box-header rose"><span>⚠️</span> অবাস্তব বনাম বাস্তব প্রতিবিম্ব</div>
              $u < f$ হলে প্রতিবিম্ব অবাস্তব ও সোজা হবে ($v$ ঋণাত্মক এবং বিবর্ধন $m > 1$)। ম্যাগনিফাইং গ্লাস এই নীতিতেই কাজ করে।
            </div>
          </div>
        </div>
      `;

      function updateOptics() {
        const f = parseFloat(document.getElementById('sliderOpticsF').value);
        const u = parseFloat(document.getElementById('sliderOpticsU').value);
        let v = (u * f) / (u - f);
        const m = Math.abs(v / u);
        const isReal = v > 0;
        document.getElementById('valOpticsF').textContent = `${f} cm`;
        document.getElementById('valOpticsU').textContent = `${u} cm`;
        document.getElementById('opticsV').textContent = Math.abs(v) > 500 ? "অসীম" : `${v.toFixed(1)} cm`;
        document.getElementById('opticsM').textContent = `${m.toFixed(2)}x`;
        document.getElementById('opticsNature').textContent = isReal ? "বাস্তব ও উল্টো" : "অবাস্তব ও সোজা";
      }
      setTimeout(() => {
        document.getElementById('sliderOpticsF').addEventListener('input', updateOptics);
        document.getElementById('sliderOpticsU').addEventListener('input', updateOptics);
      }, 50);

    } else if (ch.number === 10 || ch.number === 11) {
      // Current & Circuit Lab
      container.innerHTML = `
        <div class="grid-2">
          <div class="glass-card">
            <div class="card-header">
              <div>
                <div class="card-title">💡 ওহমের সূত্র ও বর্তনী সিমুলেটর</div>
                <div class="card-subtitle">ভোল্টেজ ($V$) ও রোধ ($R$) পরিবর্তন করে তড়িৎ প্রবাহ ($I$) ও ব্যয়িত শক্তি হিসাব</div>
              </div>
            </div>
            <div class="controls-grid">
              <div class="control-item">
                <label>বিভব পার্থক্য (V): <span class="val-badge" id="valOhmV">220 V</span></label>
                <input type="range" class="slider" id="sliderOhmV" min="10" max="240" step="5" value="220">
              </div>
              <div class="control-item">
                <label>রোধ (R): <span class="val-badge" id="valOhmR">44 Ω</span></label>
                <input type="range" class="slider" id="sliderOhmR" min="5" max="200" step="1" value="44">
              </div>
            </div>
            <div class="telemetry-row">
              <div class="telemetry-pill">
                <div class="telemetry-label">তড়িৎ প্রবাহ (I)</div>
                <div class="telemetry-val" id="ohmI">5.0 A</div>
              </div>
              <div class="telemetry-pill">
                <div class="telemetry-label">বৈদ্যুতিক ক্ষমতা (P)</div>
                <div class="telemetry-val" id="ohmP">1100 W</div>
              </div>
              <div class="telemetry-pill">
                <div class="telemetry-label">প্রতি ঘণ্টায় খরচ (ইউনিট)</div>
                <div class="telemetry-val" id="ohmUnits">1.10 kWh</div>
              </div>
            </div>
          </div>
          <div class="glass-card">
            <div class="card-title" style="margin-bottom:14px;">⚡ বর্তনীর তুল্য রোধ</div>
            <div class="concept-box">
              <div class="box-header emerald"><span>✓</span> শ্রেণি ও সমান্তরাল সমবায়</div>
              $$R_s = R_1 + R_2, \\quad \\frac{1}{R_p} = \\frac{1}{R_1} + \\frac{1}{R_2}$$
              বাসাবাড়ির সকল যন্ত্রপাতি সমান্তরালে যুক্ত থাকে যাতে সবাই পুরো 220 V বিভব পায়।
            </div>
            <div class="concept-box trap">
              <div class="box-header rose"><span>⚠️</span> বিদ্যুৎ বিলের ইউনিট হিসাব</div>
              $$\\text{Unit (kWh)} = \\frac{P\\text{ (Watt)} \\times t\\text{ (Hour)}}{1000}$$
            </div>
          </div>
        </div>
      `;

      function updateOhm() {
        const v = parseFloat(document.getElementById('sliderOhmV').value);
        const r = parseFloat(document.getElementById('sliderOhmR').value);
        const i = v / r;
        const p = v * i;
        const kwh = p / 1000;
        document.getElementById('valOhmV').textContent = `${v} V`;
        document.getElementById('valOhmR').textContent = `${r} Ω`;
        document.getElementById('ohmI').textContent = `${i.toFixed(2)} A`;
        document.getElementById('ohmP').textContent = `${p.toFixed(0)} W`;
        document.getElementById('ohmUnits').textContent = `${kwh.toFixed(2)} kWh`;
      }
      setTimeout(() => {
        document.getElementById('sliderOhmV').addEventListener('input', updateOhm);
        document.getElementById('sliderOhmR').addEventListener('input', updateOhm);
      }, 50);

    } else if (ch.number === 12) {
      // Transformer Lab
      container.innerHTML = `
        <div class="grid-2">
          <div class="glass-card">
            <div class="card-header">
              <div>
                <div class="card-title">🧲 ট্রান্সফরমার ও তড়িৎ চুম্বক ল্যাব</div>
                <div class="card-subtitle">মুখ্য ও গৌণ কুণ্ডলীর পাকসংখ্যা এবং স্টেপ-আপ / স্টেপ-ডাউন ভোল্টেজ সিমুলেটর</div>
              </div>
            </div>
            <div class="controls-grid">
              <div class="control-item">
                <label>মুখ্য ভোল্টেজ ($V_p$): <span class="val-badge" id="valVp">220 V</span></label>
                <input type="range" class="slider" id="sliderVp" min="50" max="440" step="10" value="220">
              </div>
              <div class="control-item">
                <label>মুখ্য পাকসংখ্যা ($N_p$): <span class="val-badge" id="valNp">1000</span></label>
                <input type="range" class="slider" id="sliderNp" min="100" max="2000" step="50" value="1000">
              </div>
              <div class="control-item">
                <label>গৌণ পাকসংখ্যা ($N_s$): <span class="val-badge" id="valNs">100</span></label>
                <input type="range" class="slider" id="sliderNs" min="50" max="3000" step="50" value="100">
              </div>
            </div>
            <div class="telemetry-row">
              <div class="telemetry-pill">
                <div class="telemetry-label">গৌণ ভোল্টেজ ($V_s$)</div>
                <div class="telemetry-val" id="transVs">22.0 V</div>
              </div>
              <div class="telemetry-pill">
                <div class="telemetry-label">ট্রান্সফরমার প্রকার</div>
                <div class="telemetry-val" id="transType">স্টেপ-ডাউন</div>
              </div>
              <div class="telemetry-pill">
                <div class="telemetry-label">প্রবাহ বিবর্ধন ($I_s/I_p$)</div>
                <div class="telemetry-val" id="transCurrentRatio">10.0x</div>
              </div>
            </div>
          </div>
          <div class="glass-card">
            <div class="card-title" style="margin-bottom:14px;">📐 ট্রান্সফরমার মূলনীতি</div>
            <div class="concept-box">
              <div class="box-header emerald"><span>✓</span> ফ্যারাডের আবেশ নীতি</div>
              $$\\frac{V_p}{V_s} = \\frac{N_p}{N_s} = \\frac{I_s}{I_p}$$
              ভোল্টেজ যে অনুপাতে বাড়ে, তড়িৎ প্রবাহ ঠিক সেই অনুপাতে কমে।
            </div>
            <div class="concept-box trap">
              <div class="box-header rose"><span>⚠️</span> ডিসি কারেন্টে ট্রান্সফরমার কাজ করে না</div>
              ডিসি প্রবাহের ফ্লাক্স পরিবর্তন হয় না ($d\\Phi/dt = 0$), ফলে কুণ্ডলী পুড়ে যাওয়ার ঝুঁকি থাকে।
            </div>
          </div>
        </div>
      `;

      function updateTrans() {
        const vp = parseFloat(document.getElementById('sliderVp').value);
        const np = parseFloat(document.getElementById('sliderNp').value);
        const ns = parseFloat(document.getElementById('sliderNs').value);
        const vs = vp * (ns / np);
        const iRatio = np / ns;
        const isStepUp = vs > vp;
        document.getElementById('valVp').textContent = `${vp} V`;
        document.getElementById('valNp').textContent = `${np}`;
        document.getElementById('valNs').textContent = `${ns}`;
        document.getElementById('transVs').textContent = `${vs.toFixed(1)} V`;
        document.getElementById('transType').textContent = isStepUp ? "স্টেপ-আপ (উচ্চধাপী)" : "স্টেপ-ডাউন (নিম্নধাপী)";
        document.getElementById('transCurrentRatio').textContent = `${iRatio.toFixed(1)}x`;
      }
      setTimeout(() => {
        document.getElementById('sliderVp').addEventListener('input', updateTrans);
        document.getElementById('sliderNp').addEventListener('input', updateTrans);
        document.getElementById('sliderNs').addEventListener('input', updateTrans);
      }, 50);

    } else if (ch.number === 13) {
      // Radioactivity & Semiconductor Lab
      container.innerHTML = `
        <div class="grid-2">
          <div class="glass-card">
            <div class="card-header">
              <div>
                <div class="card-title">📡 তেজস্ক্রিয় ক্ষয় ও অর্ধায়ু ল্যাব</div>
                <div class="card-subtitle">অর্ধায়ুর সংখ্যা ($n$) পরিবর্তনের সাথে অবশিষ্ট অক্ষত পরমাণুর শতকরা হিসাব</div>
              </div>
            </div>
            <div class="controls-grid">
              <div class="control-item">
                <label>অর্ধায়ু সংখ্যা (n): <span class="val-badge" id="valHalfLifeN">2</span></label>
                <input type="range" class="slider" id="sliderHalfLifeN" min="1" max="8" step="1" value="2">
              </div>
            </div>
            <div class="telemetry-row">
              <div class="telemetry-pill">
                <div class="telemetry-label">অবশিষ্ট অক্ষত পরমাণু</div>
                <div class="telemetry-val" id="radioRemPct">25.0%</div>
              </div>
              <div class="telemetry-pill">
                <div class="telemetry-label">মোট ক্ষয়প্রাপ্ত পরমাণু</div>
                <div class="telemetry-val" id="radioDecayedPct">75.0%</div>
              </div>
              <div class="telemetry-pill">
                <div class="telemetry-label">ভগ্নাংশ ($N/N_0$)</div>
                <div class="telemetry-val" id="radioFraction">1/4</div>
              </div>
            </div>
          </div>
          <div class="glass-card">
            <div class="card-title" style="margin-bottom:14px;">💡 তেজস্ক্রিয়তার নিয়মাবলী</div>
            <div class="concept-box">
              <div class="box-header emerald"><span>✓</span> আইনস্টাইনের ভর-শক্তি সমতুল্যতা</div>
              $$E = m c^2, \\quad c = 3 \\times 10^8\\text{ m/s}$$
              সামান্য ভর বিনষ্ট হয়ে বিশাল পরিমাণ শক্তিতে রূপান্তর হতে পারে।
            </div>
            <div class="concept-box trap">
              <div class="box-header rose"><span>⚠️</span> তেজস্ক্রিয় রশ্মির ভেদন ক্ষমতা</div>
              আলফা ($\alpha$) কাগজেই আটকে যায়, বিটা ($\beta$) পাতলা অ্যালুমিনিয়ামে আটকায়, কিন্তু গামা ($\gamma$) রশ্মি প্রতিরোধে পুরু সীসার পাত প্রয়োজন।
            </div>
          </div>
        </div>
      `;

      function updateRadio() {
        const n = parseInt(document.getElementById('sliderHalfLifeN').value);
        const rem = Math.pow(0.5, n) * 100;
        const dec = 100 - rem;
        document.getElementById('valHalfLifeN').textContent = `${n}`;
        document.getElementById('radioRemPct').textContent = `${rem.toFixed(1)}%`;
        document.getElementById('radioDecayedPct').textContent = `${dec.toFixed(1)}%`;
        document.getElementById('radioFraction').textContent = `1/${Math.pow(2, n)}`;
      }
      setTimeout(() => {
        document.getElementById('sliderHalfLifeN').addEventListener('input', updateRadio);
      }, 50);
    }
  }

  function renderTrapsView(container, ch) {
    let trapsHtml = ch.topStudentTraps.map(trap => `
      <div class="concept-box trap" style="margin-bottom:18px;">
        <div class="box-header rose" style="font-size:1.1rem;"><span>⚠️</span> ${trap.trapTitle}</div>
        <div style="color:var(--text-main); margin-top:8px; font-size:1rem; line-height:1.7;">${trap.explanation}</div>
      </div>
    `).join('');

    container.innerHTML = `
      <div class="glass-card" style="max-width:900px; margin:0 auto;">
        <div class="card-title" style="font-size:1.3rem; margin-bottom:6px;">🎯 যেসব জটিল জায়গায় টপ স্টুডেন্টরাও ভুল করে</div>
        <div class="card-subtitle" style="margin-bottom:24px;">বোর্ড পরীক্ষা ও অলিম্পিয়াডের সর্বাধিক বিভ্রান্তিকর কনসেপ্ট অ্যানালাইসিস</div>
        ${trapsHtml}
      </div>
    `;
  }

  function renderOlympiadView(container, ch) {
    const problems = OLYMPIAD_PROBLEMS.filter(p => p.chapter === ch.number);

    if (problems.length === 0) {
      container.innerHTML = `<div class="glass-card"><p>এই অধ্যায়ের জন্য প্রশ্ন প্রস্তুত হচ্ছে...</p></div>`;
      return;
    }

    let problemsHtml = problems.map((prob, idx) => `
      <div class="glass-card" style="margin-bottom:24px;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
          <span style="background:rgba(168,85,247,0.15); color:var(--accent-purple); padding:4px 12px; border-radius:12px; font-size:0.8rem; font-weight:700;">
            ${prob.difficulty}
          </span>
          <span style="color:var(--text-dim); font-size:0.85rem;">সমস্যা #${idx+1}</span>
        </div>
        <h3 style="font-size:1.15rem; font-weight:700; color:var(--text-main); margin-bottom:10px;">${prob.title}</h3>
        <p style="font-size:1rem; line-height:1.7; color:var(--text-main); margin-bottom:18px;">${prob.question}</p>

        <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-bottom:16px;">
          ${prob.options.map((opt, oIdx) => `
            <button class="btn btn-glass opt-btn" data-prob-id="${prob.id}" data-correct="${opt.correct}" style="justify-content:flex-start; text-align:left; padding:12px 16px;">
              ${String.fromCharCode(65 + oIdx)}. ${opt.text}
            </button>
          `).join('')}
        </div>

        <div class="step-item">
          <button class="step-btn" onclick="this.nextElementSibling.classList.toggle('open')">
            <span>💡 শিক্ষকের হিন্ট (Hint)</span>
            <span>▼</span>
          </button>
          <div class="step-content">
            ${prob.hint}
          </div>
        </div>

        <div class="step-item">
          <button class="step-btn" onclick="this.nextElementSibling.classList.toggle('open')">
            <span>🔍 সম্পূর্ণ অ্যানালিটিক্যাল সমাধান (Detailed Solution)</span>
            <span>▼</span>
          </button>
          <div class="step-content">
            ${prob.explanation}
          </div>
        </div>
      </div>
    `).join('');

    container.innerHTML = `
      <div style="max-width:960px; margin:0 auto;">
        <div style="margin-bottom:20px;">
          <h2 style="font-size:1.35rem; font-weight:800; color:var(--accent-purple);">🏆 অলিম্পিয়াড ও টপ-টায়ার চ্যালেঞ্জার প্রবলেম ল্যাব</h2>
          <p style="color:var(--text-muted); font-size:0.9rem;">ক্যাডেট কলেজ, নটর ডেম কলেজ ও বাংলাদেশ ফিজিক্স অলিম্পিয়াড স্ট্যান্ডার্ড সমস্যামূলক অনুশীলন</p>
        </div>
        ${problemsHtml}
      </div>
    `;

    setTimeout(() => {
      document.querySelectorAll('.opt-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const isCorrect = e.currentTarget.dataset.correct === 'true';
          if (isCorrect) {
            e.currentTarget.style.background = 'rgba(16, 185, 129, 0.25)';
            e.currentTarget.style.borderColor = '#10b981';
            e.currentTarget.style.color = '#10b981';
          } else {
            e.currentTarget.style.background = 'rgba(244, 63, 94, 0.25)';
            e.currentTarget.style.borderColor = '#f43f5e';
            e.currentTarget.style.color = '#f43f5e';
          }
        });
      });
    }, 50);
  }

  function renderFormulasView(container, ch) {
    let formulasHtml = ch.coreFormulas.map(form => `
      <div class="glass-card" style="margin-bottom:16px;">
        <div style="font-weight:700; color:var(--accent-cyan); font-size:1.1rem; margin-bottom:6px;">${form.name}</div>
        <div style="font-size:1.25rem; margin:10px 0; color:#fff;">$$${form.formula}$$</div>
        <div style="font-size:0.88rem; color:var(--text-muted);">${form.desc}</div>
      </div>
    `).join('');

    container.innerHTML = `
      <div style="max-width:880px; margin:0 auto;">
        <div style="margin-bottom:20px;">
          <h2 style="font-size:1.3rem; font-weight:700;">📐 অধ্যায়ের মৌলিক সূত্র ও গাণিতিক ভিত্তি</h2>
        </div>
        ${formulasHtml}
      </div>
    `;
  }

  // Video Storage Management (LocalStorage backed)
  const DEFAULT_VIDEOS = {
    ch1: {
      title: "অধ্যায় ১: ভৌত রাশি ও পরিমাপ পরিচিতি",
      url: "https://www.youtube.com/embed/dQw4w9WgXcQ"
    },
    ch2: {
      title: "অধ্যায় ২: গতিবিদ্যা ও গ্রাফিক্যাল বিশ্লেষণ",
      url: ""
    },
    ch3: {
      title: "অধ্যায় ৩: নিউটনের গতিসূত্র ও ভরবেগ",
      url: ""
    },
    ch4: {
      title: "অধ্যায় ৪: কাজ, ক্ষমতা ও শক্তি সংরক্ষণশীলতা",
      url: ""
    }
  };

  function getSavedVideos() {
    try {
      const stored = localStorage.getItem('physics_chapter_videos');
      if (stored) return JSON.parse(stored);
    } catch (e) {
      console.warn("Storage read error:", e);
    }
    return DEFAULT_VIDEOS;
  }

  function saveVideos(videos) {
    try {
      localStorage.setItem('physics_chapter_videos', JSON.stringify(videos));
    } catch (e) {
      console.warn("Storage write error:", e);
    }
  }

  function parseYouTubeEmbedUrl(inputUrl) {
    if (!inputUrl) return "";
    let clean = inputUrl.trim();

    // If iframe tag pasted
    if (clean.includes('<iframe') && clean.includes('src=')) {
      const match = clean.match(/src=["']([^"']+)["']/);
      if (match) clean = match[1];
    }

    // Standard YouTube watch URL: youtube.com/watch?v=VIDEO_ID
    const regWatch = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
    const matchWatch = clean.match(regWatch);
    if (matchWatch && matchWatch[1]) {
      return `https://www.youtube.com/embed/${matchWatch[1]}?rel=0&modestbranding=1`;
    }

    // Already embed URL
    if (clean.includes('youtube.com/embed/')) {
      return clean;
    }

    // Google Drive video embed: drive.google.com/file/d/ID/view -> /preview
    if (clean.includes('drive.google.com')) {
      return clean.replace(/\/view(\?.*)?$/, '/preview');
    }

    return clean;
  }

  // Admin Modal Logic
  const adminOverlay = document.getElementById('adminModalOverlay');
  const btnOpenAdmin = document.getElementById('btnAdminModal');
  const btnCloseAdmin = document.getElementById('btnCloseAdminModal');
  const btnCancelAdmin = document.getElementById('btnCancelAdmin');
  const btnSaveAdmin = document.getElementById('btnSaveAdminVideo');
  const selectAdminChapter = document.getElementById('adminChapterSelect');
  const inputAdminTitle = document.getElementById('adminVideoTitle');
  const inputAdminUrl = document.getElementById('adminVideoUrl');

  function openAdminModal() {
    // Populate select
    selectAdminChapter.innerHTML = '';
    CHAPTER_DATA.forEach(c => {
      const opt = document.createElement('option');
      opt.value = c.id;
      opt.textContent = `অধ্যায় ${c.number}: ${c.titleBangla}`;
      if (c.id === CHAPTER_DATA[currentChapterIndex].id) opt.selected = true;
      selectAdminChapter.appendChild(opt);
    });

    const videos = getSavedVideos();
    const curId = selectAdminChapter.value;
    const curVideo = videos[curId] || { title: "", url: "" };
    inputAdminTitle.value = curVideo.title || "";
    inputAdminUrl.value = curVideo.url || "";

    adminOverlay.classList.add('active');
  }

  function closeAdminModal() {
    adminOverlay.classList.remove('active');
  }

  selectAdminChapter.addEventListener('change', () => {
    const videos = getSavedVideos();
    const curVideo = videos[selectAdminChapter.value] || { title: "", url: "" };
    inputAdminTitle.value = curVideo.title || "";
    inputAdminUrl.value = curVideo.url || "";
  });

  btnSaveAdmin.addEventListener('click', () => {
    const videos = getSavedVideos();
    const chId = selectAdminChapter.value;
    const embedUrl = parseYouTubeEmbedUrl(inputAdminUrl.value);

    videos[chId] = {
      title: inputAdminTitle.value.trim() || `${selectAdminChapter.options[selectAdminChapter.selectedIndex].text} লেকচার`,
      url: embedUrl
    };

    saveVideos(videos);
    closeAdminModal();
    renderMainView(); // Refresh to show newly updated video
  });

  btnOpenAdmin.addEventListener('click', openAdminModal);
  btnCloseAdmin.addEventListener('click', closeAdminModal);
  btnCancelAdmin.addEventListener('click', closeAdminModal);
  adminOverlay.addEventListener('click', (e) => {
    if (e.target === adminOverlay) closeAdminModal();
  });

  // Book Search Modal Logic
  const searchOverlay = document.getElementById('searchModalOverlay');
  const btnOpenSearch = document.getElementById('btnOpenSearchModal');
  const btnCloseSearch = document.getElementById('btnCloseSearchModal');
  const inputSearch = document.getElementById('inputBookSearch');
  const searchResultsCount = document.getElementById('searchResultsCount');
  const searchResultsList = document.getElementById('searchResultsList');

  function openSearchModal() {
    searchOverlay.classList.add('active');
    inputSearch.value = '';
    searchResultsCount.textContent = '';
    searchResultsList.innerHTML = `
      <div style="text-align:center; padding:35px 20px; color:var(--text-muted);">
        উপরে যেকোনো বিষয় লিখুন (যেমন: <strong>ভার্নিয়ার, ত্বরণ, আর্কিমিডিস, রোধ, লেন্স, তেজস্ক্রিয়তা</strong>)। সাথে সাথে বইয়ের পৃষ্ঠাগুলোর তালিকা প্রদর্শিত হবে।
      </div>
    `;
    setTimeout(() => inputSearch.focus(), 100);
  }

  function closeSearchModal() {
    searchOverlay.classList.remove('active');
  }

  function performBookSearch(query) {
    const q = query.trim().toLowerCase();
    if (!q || q.length < 2) {
      searchResultsCount.textContent = '';
      searchResultsList.innerHTML = `
        <div style="text-align:center; padding:25px; color:var(--text-muted);">
          অনুসন্ধানের জন্য কমপক্ষে ২ অক্ষর লিখুন...
        </div>
      `;
      return;
    }

    const index = window.BOOK_SEARCH_INDEX || [];
    const matched = [];

    for (let i = 0; i < index.length; i++) {
      const item = index[i];
      const lowerText = item.text.toLowerCase();
      const pos = lowerText.indexOf(q);
      if (pos !== -1) {
        // Extract snippet
        const start = Math.max(0, pos - 50);
        const end = Math.min(item.text.length, pos + q.length + 90);
        let snippet = item.text.substring(start, end);
        if (start > 0) snippet = '...' + snippet;
        if (end < item.text.length) snippet = snippet + '...';

        // Highlight matched keyword
        const reg = new RegExp(`(${q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
        const highlightedSnippet = snippet.replace(reg, '<span class="search-highlight">$1</span>');

        matched.push({
          page: item.p,
          snippet: highlightedSnippet
        });
      }
    }

    searchResultsCount.textContent = `মোট ${matched.length} টি পৃষ্ঠায় পাওয়া গেছে:`;

    if (matched.length === 0) {
      searchResultsList.innerHTML = `
        <div style="text-align:center; padding:35px 20px; color:#f43f5e;">
          😔 "${query}" সম্পর্কিত কোনো বিষয় বইয়ে পাওয়া যায়নি। অন্য কোনো শব্দ দিয়ে চেষ্টা করুন।
        </div>
      `;
      return;
    }

    let resultsHtml = matched.slice(0, 50).map(m => {
      // Find chapter for this page
      const ch = CHAPTER_DATA.find(c => m.page >= c.startPage && m.page <= c.endPage) || CHAPTER_DATA[0];
      return `
        <div class="search-result-item" data-page="${m.page}" data-ch-index="${ch.number - 1}">
          <div style="display:flex; justify-content:space-between; align-items:center;">
            <span class="search-result-page-tag">পৃষ্ঠা ${m.page + 1} (${ch.titleBangla})</span>
            <span style="font-size:0.75rem; color:var(--accent-cyan);">ক্লিক করে পাতা খুলুন ➔</span>
          </div>
          <div class="search-result-snippet">${m.snippet}</div>
        </div>
      `;
    }).join('');

    searchResultsList.innerHTML = resultsHtml;

    // Attach click event to results
    searchResultsList.querySelectorAll('.search-result-item').forEach(el => {
      el.addEventListener('click', () => {
        const page = parseInt(el.dataset.page);
        const chIdx = parseInt(el.dataset.chIndex);
        currentChapterIndex = chIdx;
        currentBookPage = page;
        closeSearchModal();
        renderSidebar();
        switchTab('book');
      });
    });
  }

  let searchDebounce = null;
  inputSearch.addEventListener('input', (e) => {
    clearTimeout(searchDebounce);
    searchDebounce = setTimeout(() => {
      performBookSearch(e.target.value);
    }, 200);
  });

  btnOpenSearch.addEventListener('click', openSearchModal);
  btnCloseSearch.addEventListener('click', closeSearchModal);
  searchOverlay.addEventListener('click', (e) => {
    if (e.target === searchOverlay) closeSearchModal();
  });

  // Theme Toggle (Dark vs Un-dark / Light)
  const btnThemeToggle = document.getElementById('btnThemeToggle');
  const sunSvg = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>`;
  const moonSvg = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>`;

  function applyAppTheme(theme) {
    if (theme === 'light') {
      document.body.classList.add('light-theme');
      if (btnThemeToggle) {
        btnThemeToggle.innerHTML = moonSvg;
        btnThemeToggle.title = 'ডার্ক মোড সক্রিয় করুন';
      }
    } else {
      document.body.classList.remove('light-theme');
      if (btnThemeToggle) {
        btnThemeToggle.innerHTML = sunSvg;
        btnThemeToggle.title = 'আনডার্ক (লাইট) মোড সক্রিয় করুন';
      }
    }
    try {
      localStorage.setItem('physics_app_theme', theme);
    } catch (e) {
      console.warn('Storage error:', e);
    }
  }

  function toggleAppTheme() {
    const isCurrentlyLight = document.body.classList.contains('light-theme');
    applyAppTheme(isCurrentlyLight ? 'dark' : 'light');
  }

  btnThemeToggle?.addEventListener('click', toggleAppTheme);

  // Load saved theme preference on start
  const savedTheme = localStorage.getItem('physics_app_theme') || 'dark';
  applyAppTheme(savedTheme);

  // Setup toolbar events
  document.getElementById('btnFullscreen')?.addEventListener('click', () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  });

  // Setup tabs
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => switchTab(btn.dataset.tab));
  });

  // Book Zoom / Lightbox Modal Logic
  let zoomLevel = 1.0;
  const zoomOverlay = document.getElementById('bookZoomModalOverlay');
  const zoomImg = document.getElementById('zoomBookPageImg');
  const zoomContainer = document.getElementById('zoomImageContainer');
  const zoomLevelDisplay = document.getElementById('zoomLevelIndicator');
  const zoomPageDisplay = document.getElementById('zoomModalPageDisplay');
  const btnCloseZoom = document.getElementById('btnCloseZoomModal');
  const btnModalPrev = document.getElementById('btnModalPrevPage');
  const btnModalNext = document.getElementById('btnModalNextPage');
  const btnZoomIn = document.getElementById('btnZoomIn');
  const btnZoomOut = document.getElementById('btnZoomOut');
  const btnZoomReset = document.getElementById('btnZoomReset');
  const btnOpenInSb = document.getElementById('btnOpenInSmartboard');

  function updateZoomTransform() {
    if (zoomContainer) {
      zoomContainer.style.transform = `scale(${zoomLevel})`;
    }
    if (zoomLevelDisplay) {
      zoomLevelDisplay.textContent = `${Math.round(zoomLevel * 100)}%`;
    }
  }

  function openBookZoomModal(pageIndex) {
    if (pageIndex !== undefined && pageIndex !== null) {
      currentBookPage = pageIndex;
    }
    zoomLevel = 1.0;
    updateZoomTransform();
    const pageNumPadded = String(currentBookPage).padStart(3, '0');
    const pageImgUrl = `ocr_cache/page_${pageNumPadded}.png`;
    if (zoomImg) zoomImg.src = pageImgUrl;
    if (zoomPageDisplay) zoomPageDisplay.textContent = `পৃষ্ঠা: ${currentBookPage + 1}`;
    if (zoomOverlay) zoomOverlay.classList.add('active');
  }

  function closeBookZoomModal() {
    if (zoomOverlay) zoomOverlay.classList.remove('active');
  }

  function initBookZoomModal() {
    function navigateModalPage(direction) {
      if (direction === 'prev' && currentBookPage > 0) {
        currentBookPage--;
      } else if (direction === 'next' && currentBookPage < 365) {
        currentBookPage++;
      } else {
        return;
      }

      playPageTurnSound();
      openBookZoomModal(currentBookPage);

      setTimeout(() => {
        if (zoomImg) {
          zoomImg.classList.remove('page-flip-anim-next', 'page-flip-anim-prev');
          void zoomImg.offsetWidth;
          zoomImg.classList.add(direction === 'next' ? 'page-flip-anim-next' : 'page-flip-anim-prev');
        }
      }, 10);

      const mainContent = document.getElementById('viewArea');
      if (mainContent && currentTab === 'book') {
        renderBookView(mainContent, CHAPTER_DATA[currentChapterIndex]);
      }
    }

    btnModalPrev?.addEventListener('click', () => navigateModalPage('prev'));
    document.getElementById('btnModalFloatPrev')?.addEventListener('click', () => navigateModalPage('prev'));

    btnModalNext?.addEventListener('click', () => navigateModalPage('next'));
    document.getElementById('btnModalFloatNext')?.addEventListener('click', () => navigateModalPage('next'));

    btnZoomIn?.addEventListener('click', () => {
      if (zoomLevel < 2.8) {
        zoomLevel = Math.min(2.8, parseFloat((zoomLevel + 0.2).toFixed(1)));
        updateZoomTransform();
      }
    });

    btnZoomOut?.addEventListener('click', () => {
      if (zoomLevel > 0.6) {
        zoomLevel = Math.max(0.6, parseFloat((zoomLevel - 0.2).toFixed(1)));
        updateZoomTransform();
      }
    });

    btnZoomReset?.addEventListener('click', () => {
      zoomLevel = 1.0;
      updateZoomTransform();
    });

    btnOpenInSb?.addEventListener('click', () => {
      const pageNumPadded = String(currentBookPage).padStart(3, '0');
      const pageImgUrl = `ocr_cache/page_${pageNumPadded}.png`;
      closeBookZoomModal();
      openSmartBoard(pageImgUrl);
    });

    btnCloseZoom?.addEventListener('click', closeBookZoomModal);
    zoomOverlay?.addEventListener('click', (e) => {
      if (e.target === zoomOverlay) closeBookZoomModal();
    });

    // Keyboard navigation when zoom modal is open
    window.addEventListener('keydown', (e) => {
      if (!zoomOverlay || !zoomOverlay.classList.contains('active')) return;
      if (e.key === 'Escape') closeBookZoomModal();
      if (e.key === 'ArrowLeft') btnModalPrev?.click();
      if (e.key === 'ArrowRight') btnModalNext?.click();
      if (e.key === '+' || e.key === '=') btnZoomIn?.click();
      if (e.key === '-' || e.key === '_') btnZoomOut?.click();
      if (e.key === '0') btnZoomReset?.click();
    });
  }

  // Initialize
  if (window.innerWidth <= 900 && appSidebar) {
    appSidebar.classList.add('collapsed');
  }
  initSmartBoard();
  initBookZoomModal();
  renderSidebar();
  renderMainView();
});
