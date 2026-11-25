/**
 * app.js
 * Vanilla interactive layer for "Soniaa S. — a living tree".
 * No frameworks or build dependencies; every UI string and coordinate comes from content.js.
 */

(function () {
  "use strict";

  const CONTENT = window.TREE_CONTENT;
  if (!CONTENT) return;

  const STORAGE_KEY = "soniaa_living_tree_visit_v1";
  const POLLEN_COUNT = 24;
  const TRAIL_POOL_SIZE = 7;

  /* In-memory fallback ensures state works even if sessionStorage is blocked. */
  let memoryState = { explored: [], leaves: {} };

  function loadState() {
    try {
      const raw = window.sessionStorage.getItem(STORAGE_KEY);
      if (!raw) return { explored: [], leaves: {} };
      const parsed = JSON.parse(raw);
      return {
        explored: Array.isArray(parsed.explored) ? parsed.explored : [],
        leaves:
          parsed.leaves && typeof parsed.leaves === "object"
            ? parsed.leaves
            : {},
      };
    } catch {
      return {
        explored: [...memoryState.explored],
        leaves: { ...memoryState.leaves },
      };
    }
  }

  function saveState(nextState) {
    memoryState = nextState;
    try {
      window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(nextState));
    } catch {
      /* Storage unavailable (e.g., strict private mode); memoryState remains active. */
    }
  }

  let state = loadState();

  /* DOM references */
  const stageScroller = document.getElementById("stage-scroller");
  const treeStage = document.getElementById("tree-stage");
  const treeImage = document.getElementById("tree-image");
  const hotspotsLayer = document.getElementById("tree-hotspots");
  const pollenLayer = document.getElementById("pollen-layer");
  const budTooltip = document.getElementById("bud-tooltip");
  const butterflyEl = document.getElementById("butterfly");
  const trailLayer = document.getElementById("butterfly-trail");
  const mobileSwipeHint = document.getElementById("mobile-swipe-hint");
  const progressText = document.getElementById("progress-text");
  const progressDots = document.getElementById("progress-dots");
  const finishVisitBtn = document.getElementById("finish-visit-btn");

  const noteBackdrop = document.getElementById("note-backdrop");
  const notePanel = document.getElementById("note-panel");
  const noteTitle = document.getElementById("note-title");
  const noteBackBtn = document.getElementById("note-back-btn");
  const noteBody = document.getElementById("note-body");
  const leafSection = document.getElementById("leaf-section");
  const leafList = document.getElementById("leaf-list");
  const leafForm = document.getElementById("leaf-form");
  const leafInput = document.getElementById("leaf-input");
  const leafSubmitBtn = document.getElementById("leaf-submit-btn");

  const debugToolbar = document.getElementById("debug-toolbar");
  const debugCopyBtn = document.getElementById("debug-copy-btn");
  const debugStatus = document.getElementById("debug-status");

  /* Reduced-motion preference check (reactive if visitor toggles OS setting). */
  const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  let prefersReducedMotion = motionQuery.matches;

  /* Debug mode (?debug=1) enables outline boxes, coordinate badges, and tip dragging. */
  const isDebugMode =
    new URLSearchParams(window.location.search).get("debug") === "1";

  let activeDialogMode = null; /* branchId | "ending" | null */
  let lastTriggerEl = null;
  let budTooltipTimer = null;

  /* Mutable copy of hotspot coordinates so ?debug=1 dragging stays live. */
  const hotspotsData = CONTENT.hotspots.map((spot) => ({ ...spot }));
  const hotspotButtons = new Map();

  /* ========================================================================
     1. Image fallback handling (multiply blend if original JPEG loads)
     ======================================================================== */
  function checkImageSource() {
    if (!treeImage) return;
    const src = treeImage.currentSrc || treeImage.src || "";
    if (src && !src.toLowerCase().includes(".webp")) {
      treeImage.classList.add("is-jpeg-fallback");
    } else {
      treeImage.classList.remove("is-jpeg-fallback");
    }
  }

  if (treeImage) {
    if (treeImage.complete) {
      checkImageSource();
    } else {
      treeImage.addEventListener("load", checkImageSource);
    }
  }

  /* ========================================================================
     2. Botanical SVG generators (open blossoms, closed buds, saved leaf)
     ======================================================================== */
  const SVG_NS = "http://www.w3.org/2000/svg";

  function createSvgElement(tag, attrs) {
    const el = document.createElementNS(SVG_NS, tag);
    for (const [key, value] of Object.entries(attrs)) {
      el.setAttribute(key, String(value));
    }
    return el;
  }

  function buildBlossomSvg(colorName) {
    const palette = {
      amber: { petal: "#E9A23B", inner: "#F7D08A", center: "#3B2F2A" },
      sage: { petal: "#8FA98A", inner: "#BFD1BB", center: "#3B2F2A" },
      rose: { petal: "#D98B84", inner: "#EEB7B2", center: "#3B2F2A" },
    }[colorName] || { petal: "#E9A23B", inner: "#F7D08A", center: "#3B2F2A" };

    const svg = createSvgElement("svg", {
      viewBox: "0 0 36 36",
      class: "hotspot-blossom",
      "aria-hidden": "true",
      focusable: "false",
    });

    /* Five overlapping watercolor petals rotated cleanly around the center */
    for (let i = 0; i < 5; i++) {
      const angle = i * 72 - 18;
      const petal = createSvgElement("ellipse", {
        cx: "18",
        cy: "10",
        rx: "5.2",
        ry: "7.8",
        fill: palette.petal,
        "fill-opacity": "0.68",
        stroke: "#3B2F2A",
        "stroke-width": "0.75",
        "stroke-opacity": "0.42",
        transform: `rotate(${angle} 18 18)`,
      });
      svg.appendChild(petal);
    }

    const coreHalo = createSvgElement("circle", {
      cx: "18",
      cy: "18",
      r: "4.4",
      fill: palette.inner,
      "fill-opacity": "0.9",
    });
    const coreDot = createSvgElement("circle", {
      cx: "18",
      cy: "18",
      r: "2",
      fill: palette.center,
      "fill-opacity": "0.85",
    });

    svg.appendChild(coreHalo);
    svg.appendChild(coreDot);
    return svg;
  }

  function buildBudSvg(colorName) {
    const tint =
      {
        amber: "#E9A23B",
        sage: "#8FA98A",
        rose: "#D98B84",
      }[colorName] || "#8FA98A";

    const svg = createSvgElement("svg", {
      viewBox: "0 0 28 28",
      class: "hotspot-blossom hotspot-blossom--bud",
      "aria-hidden": "true",
      focusable: "false",
    });

    /* Closed botanical bud sitting over the pencil tip */
    const outerBud = createSvgElement("path", {
      d: "M14 5 C19 10, 19.5 18, 14 22 C8.5 18, 9 10, 14 5 Z",
      fill: tint,
      "fill-opacity": "0.52",
      stroke: "#3B2F2A",
      "stroke-width": "1.1",
      "stroke-opacity": "0.78",
    });
    const sepal = createSvgElement("path", {
      d: "M10.5 18.5 Q14 22.5 17.5 18.5",
      fill: "none",
      stroke: "#3B2F2A",
      "stroke-width": "1.1",
      "stroke-linecap": "round",
    });

    svg.appendChild(outerBud);
    svg.appendChild(sepal);
    return svg;
  }

  function buildLeafBadgeSvg() {
    const svg = createSvgElement("svg", {
      viewBox: "0 0 20 20",
      class: "hotspot-leaf-badge",
      "aria-hidden": "true",
      focusable: "false",
    });
    const leaf = createSvgElement("path", {
      d: "M3 16 C4 8, 10 3, 17 3 C17 10, 12 16, 3 16 Z",
      fill: "#8FA98A",
      "fill-opacity": "0.9",
      stroke: "#3B2F2A",
      "stroke-width": "1",
    });
    const vein = createSvgElement("path", {
      d: "M3.5 15.5 Q10 10 16 4",
      fill: "none",
      stroke: "#3B2F2A",
      "stroke-width": "0.85",
      "stroke-linecap": "round",
    });
    svg.appendChild(leaf);
    svg.appendChild(vein);
    return svg;
  }

  /* ========================================================================
     3. Render hotspots & sync explored / leaf / roots-earth states
     ======================================================================== */
  function renderHotspots() {
    hotspotsLayer.textContent = "";
    hotspotButtons.clear();

    hotspotsData.forEach((spot, index) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = `hotspot hotspot--${spot.status} hotspot--${spot.bloomColor}`;
      btn.dataset.id = spot.id;
      btn.style.left = `${spot.x}%`;
      btn.style.top = `${spot.y}%`;
      btn.style.setProperty("--sway-delay", `${(index * -0.9).toFixed(2)}s`);
      btn.setAttribute("aria-label", spot.ariaLabel);

      const wash = document.createElement("span");
      wash.className = "hotspot-wash";
      wash.setAttribute("aria-hidden", "true");

      const sway = document.createElement("span");
      sway.className = "hotspot-sway";
      sway.setAttribute("aria-hidden", "true");
      sway.appendChild(
        spot.status === "open"
          ? buildBlossomSvg(spot.bloomColor)
          : buildBudSvg(spot.bloomColor)
      );

      if (spot.status === "open") {
        sway.appendChild(buildLeafBadgeSvg());
      }

      const label = document.createElement("span");
      label.className = "hotspot-label";
      label.textContent = spot.title;

      btn.appendChild(wash);
      btn.appendChild(sway);
      btn.appendChild(label);

      if (isDebugMode) {
        const coordsBadge = document.createElement("span");
        coordsBadge.className = "debug-coords";
        coordsBadge.textContent = `${spot.id}: ${spot.x.toFixed(1)}, ${spot.y.toFixed(1)}`;
        btn.appendChild(coordsBadge);
        setupDebugDrag(btn, spot, coordsBadge);
      }

      btn.addEventListener("click", (event) => {
        /* Suppress click when finishing a debug drag gesture */
        if (btn.dataset.justDragged === "1") {
          btn.dataset.justDragged = "0";
          return;
        }
        event.stopPropagation();
        handleHotspotActivate(spot, btn);
      });

      /* Keyboard Tab focus guides the butterfly directly to the focused tip */
      btn.addEventListener("focus", () => {
        flyButterflyToHotspot(spot);
      });

      hotspotsLayer.appendChild(btn);
      hotspotButtons.set(spot.id, btn);
    });

    syncProgressUI();
  }

  function syncProgressUI() {
    const exploredSet = new Set(state.explored);

    hotspotsData.forEach((spot) => {
      const btn = hotspotButtons.get(spot.id);
      if (!btn) return;
      btn.classList.toggle("is-explored", exploredSet.has(spot.id));
      const branchLeaves = state.leaves[spot.id] || [];
      btn.classList.toggle("has-leaf", branchLeaves.length > 0);
    });

    /* Nice-to-have: opening The Roots warms the below-ground area in earth tone */
    treeStage.classList.toggle("is-roots-warmed", exploredSet.has("rootLeft"));

    const count = state.explored.length;
    progressText.textContent = `${count} of ${CONTENT.meta.totalOpenBranches} explored`;

    if (progressDots) {
      progressDots.querySelectorAll(".progress-dot").forEach((dot) => {
        const branchId = dot.getAttribute("data-branch");
        dot.classList.toggle("is-explored", exploredSet.has(branchId));
      });
    }

    finishVisitBtn.hidden = count < 1;
  }

  /* ========================================================================
     4. Debug Mode (?debug=1): drag hotspots & copy JSON coordinates
     ======================================================================== */
  function setupDebugDrag(btn, spot, coordsBadge) {
    let dragging = false;
    let moved = false;
    let startX = 0;
    let startY = 0;

    btn.addEventListener("pointerdown", (e) => {
      if (!isDebugMode) return;
      dragging = true;
      moved = false;
      startX = e.clientX;
      startY = e.clientY;
      btn.setPointerCapture(e.pointerId);
      e.stopPropagation();
    });

    btn.addEventListener("pointermove", (e) => {
      if (!dragging) return;
      const dist = Math.hypot(e.clientX - startX, e.clientY - startY);
      if (dist > 3) moved = true;

      const rect = treeStage.getBoundingClientRect();
      if (!rect.width || !rect.height) return;

      const nextX = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
      const nextY = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100));
      spot.x = Math.round(nextX * 10) / 10;
      spot.y = Math.round(nextY * 10) / 10;

      btn.style.left = `${spot.x}%`;
      btn.style.top = `${spot.y}%`;
      coordsBadge.textContent = `${spot.id}: ${spot.x.toFixed(1)}, ${spot.y.toFixed(1)}`;
    });

    btn.addEventListener("pointerup", (e) => {
      if (!dragging) return;
      dragging = false;
      if (btn.hasPointerCapture(e.pointerId)) {
        btn.releasePointerCapture(e.pointerId);
      }
      if (moved) {
        btn.dataset.justDragged = "1";
      }
    });
  }

  if (isDebugMode) {
    document.body.classList.add("is-debug");
    debugToolbar.hidden = false;

    debugCopyBtn.addEventListener("click", async () => {
      const payload = JSON.stringify(
        hotspotsData.map(({ id, x, y, title, status }) => ({
          id,
          x,
          y,
          title,
          status,
        })),
        null,
        2
      );
      await copyTextToClipboard(payload);
      debugStatus.textContent = "Copied";
      window.setTimeout(() => {
        debugStatus.textContent = "";
      }, 1800);
    });
  }

  /* ========================================================================
     5. Drifting Pollen Motes (capped at 24, disabled under reduced motion)
     ======================================================================== */
  function buildPollenMotes() {
    pollenLayer.textContent = "";
    if (prefersReducedMotion) return;

    for (let i = 0; i < POLLEN_COUNT; i++) {
      const mote = document.createElement("span");
      mote.className = "pollen-mote";
      const size = 2.5 + ((i * 1.7) % 4.2);
      const left = (i * 41.3 + 7) % 94 + 3;
      const top = (i * 29.7 + 11) % 88 + 6;
      const dx = ((i % 2 === 0 ? 1 : -1) * (12 + ((i * 7) % 24))).toFixed(0);
      const dy = (-16 - ((i * 9) % 28)).toFixed(0);
      const dur = (13 + ((i * 2.3) % 14)).toFixed(1);
      const delay = (-1 * ((i * 1.9) % 15)).toFixed(1);

      mote.style.width = `${size}px`;
      mote.style.height = `${size}px`;
      mote.style.left = `${left}%`;
      mote.style.top = `${top}%`;
      mote.style.setProperty("--dx", `${dx}px`);
      mote.style.setProperty("--dy", `${dy}px`);
      mote.style.setProperty("--dur", `${dur}s`);
      mote.style.setProperty("--delay", `${delay}s`);
      mote.style.setProperty("--op-min", "0.14");
      mote.style.setProperty("--op-max", "0.52");
      pollenLayer.appendChild(mote);
    }
  }

  /* ========================================================================
     6. Butterfly Visitor Physics, Trail & Proximity Glow
     ======================================================================== */
  const butterflyState = {
    xPct: 48,
    yPct: 49,
    targetXPct: 48,
    targetYPct: 49,
    angleDeg: -8,
    hasUserInteracted: false,
    lastPointerTime: 0,
    rafId: null,
    lastTrailTime: 0,
    trailIndex: 0,
  };

  const trailDots = [];

  function initTrailPool() {
    trailLayer.textContent = "";
    trailDots.length = 0;
    for (let i = 0; i < TRAIL_POOL_SIZE; i++) {
      const dot = document.createElement("span");
      dot.className = "trail-dot";
      trailLayer.appendChild(dot);
      trailDots.push({ el: dot, life: 0, xPct: 48, yPct: 49 });
    }
  }

  function applyButterflyTransform() {
    const rect = treeStage.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    const px = (butterflyState.xPct / 100) * rect.width;
    const py = (butterflyState.yPct / 100) * rect.height;
    butterflyEl.style.transform = `translate3d(${px.toFixed(1)}px, ${py.toFixed(
      1
    )}px, 0) rotate(${butterflyState.angleDeg.toFixed(1)}deg)`;
  }

  function updateHotspotProximity() {
    const rect = treeStage.getBoundingClientRect();
    if (!rect.width || !rect.height) return;

    const bx = (butterflyState.xPct / 100) * rect.width;
    const by = (butterflyState.yPct / 100) * rect.height;
    const threshold = Math.max(58, Math.min(96, rect.width * 0.082));

    hotspotsData.forEach((spot) => {
      const btn = hotspotButtons.get(spot.id);
      if (!btn) return;
      const sx = (spot.x / 100) * rect.width;
      const sy = (spot.y / 100) * rect.height;
      const dist = Math.hypot(bx - sx, by - sy);
      btn.classList.toggle("is-near", dist <= threshold);
    });
  }

  function spawnTrailDot(xPct, yPct) {
    if (prefersReducedMotion || trailDots.length === 0) return;
    const slot = trailDots[butterflyState.trailIndex];
    butterflyState.trailIndex = (butterflyState.trailIndex + 1) % trailDots.length;
    slot.xPct = xPct;
    slot.yPct = yPct;
    slot.life = 1;
    slot.el.style.left = `${xPct}%`;
    slot.el.style.top = `${yPct}%`;
  }

  function stepButterfly(now) {
    if (document.hidden || prefersReducedMotion) {
      butterflyState.rafId = null;
      return;
    }

    /* When idle (no interaction yet, or touch idle > 4s), hover gently near the trunk */
    if (
      !butterflyState.hasUserInteracted ||
      (butterflyState.lastPointerTime > 0 &&
        now - butterflyState.lastPointerTime > 6500 &&
        activeDialogMode === null)
    ) {
      butterflyState.targetXPct = 48 + Math.sin(now * 0.0011) * 2.4;
      butterflyState.targetYPct = 48 + Math.cos(now * 0.0015) * 1.8;
    }

    const dx = butterflyState.targetXPct - butterflyState.xPct;
    const dy = butterflyState.targetYPct - butterflyState.yPct;

    butterflyState.xPct += dx * 0.11;
    butterflyState.yPct += dy * 0.11;

    const speed = Math.hypot(dx, dy);
    if (speed > 0.12) {
      const targetAngle = Math.max(-28, Math.min(28, dx * 2.4));
      butterflyState.angleDeg += (targetAngle - butterflyState.angleDeg) * 0.16;

      if (now - butterflyState.lastTrailTime > 55 && speed > 0.35) {
        spawnTrailDot(butterflyState.xPct, butterflyState.yPct);
        butterflyState.lastTrailTime = now;
      }
    } else {
      butterflyState.angleDeg += (-6 - butterflyState.angleDeg) * 0.06;
    }

    /* Decay trail dots using opacity & transform only */
    for (let i = 0; i < trailDots.length; i++) {
      const dot = trailDots[i];
      if (dot.life > 0) {
        dot.life = Math.max(0, dot.life - 0.032);
        dot.el.style.opacity = (dot.life * 0.55).toFixed(2);
        dot.el.style.transform = `scale(${(0.5 + dot.life * 0.7).toFixed(2)})`;
      }
    }

    applyButterflyTransform();
    updateHotspotProximity();

    butterflyState.rafId = window.requestAnimationFrame(stepButterfly);
  }

  function startButterflyLoop() {
    if (prefersReducedMotion || document.hidden) return;
    if (butterflyState.rafId === null) {
      butterflyState.rafId = window.requestAnimationFrame(stepButterfly);
    }
  }

  function stopButterflyLoop() {
    if (butterflyState.rafId !== null) {
      window.cancelAnimationFrame(butterflyState.rafId);
      butterflyState.rafId = null;
    }
  }

  function setButterflyTargetFromClient(clientX, clientY) {
    const rect = treeStage.getBoundingClientRect();
    if (!rect.width || !rect.height) return;

    const xPct = Math.max(2, Math.min(98, ((clientX - rect.left) / rect.width) * 100));
    const yPct = Math.max(2, Math.min(98, ((clientY - rect.top) / rect.height) * 100));

    butterflyState.hasUserInteracted = true;
    butterflyState.lastPointerTime = performance.now();
    butterflyState.targetXPct = xPct;
    butterflyState.targetYPct = yPct;

    if (prefersReducedMotion) {
      butterflyState.xPct = xPct;
      butterflyState.yPct = yPct;
      butterflyState.angleDeg = -6;
      applyButterflyTransform();
      updateHotspotProximity();
    }
  }

  function flyButterflyToHotspot(spot) {
    butterflyState.hasUserInteracted = true;
    butterflyState.lastPointerTime = performance.now();
    butterflyState.targetXPct = spot.x;
    butterflyState.targetYPct = spot.y;

    if (prefersReducedMotion) {
      butterflyState.xPct = spot.x;
      butterflyState.yPct = spot.y;
      butterflyState.angleDeg = -6;
      applyButterflyTransform();
      updateHotspotProximity();
    }
  }

  /* Desktop pointer tracking */
  window.addEventListener("pointermove", (e) => {
    if (e.pointerType !== "mouse" || activeDialogMode !== null) return;
    setButterflyTargetFromClient(e.clientX, e.clientY);
  });

  /* Touch / tap flight on stage */
  treeStage.addEventListener("pointerdown", (e) => {
    if (e.pointerType === "mouse") return;
    setButterflyTargetFromClient(e.clientX, e.clientY);
  });

  /* ========================================================================
     7. Hotspot activation: open branches vs. bud wiggle + tooltip
     ======================================================================== */
  function hideBudTooltip() {
    if (budTooltipTimer) {
      window.clearTimeout(budTooltipTimer);
      budTooltipTimer = null;
    }
    budTooltip.hidden = true;
  }

  function showBudTooltip(spot, btn) {
    hideBudTooltip();
    btn.classList.remove("is-wiggling");
    /* Force reflow so repeated taps replay the wiggle animation */
    void btn.offsetWidth;
    btn.classList.add("is-wiggling");

    budTooltip.textContent = CONTENT.meta.budTooltip;
    budTooltip.style.left = `${Math.max(20, Math.min(80, spot.x))}%`;
    budTooltip.style.top = `${Math.max(12, spot.y - 4.5)}%`;
    budTooltip.hidden = false;

    budTooltipTimer = window.setTimeout(() => {
      budTooltip.hidden = true;
    }, 2800);
  }

  function markBranchExplored(branchId) {
    if (!state.explored.includes(branchId)) {
      state = {
        ...state,
        explored: [...state.explored, branchId],
      };
      saveState(state);
      syncProgressUI();
    }
  }

  function handleHotspotActivate(spot, triggerBtn) {
    flyButterflyToHotspot(spot);

    if (spot.status === "bud") {
      showBudTooltip(spot, triggerBtn);
      return;
    }

    hideBudTooltip();
    lastTriggerEl = triggerBtn;
    markBranchExplored(spot.id);
    openBranchDialog(spot.id);
  }

  /* ========================================================================
     8. Section Dialogs (The Whole Picture, The Noticing, The Roots, Your visit)
     ======================================================================== */
  function getFocusableInsidePanel() {
    return Array.from(
      notePanel.querySelectorAll(
        'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])'
      )
    ).filter((el) => !el.hasAttribute("hidden") && el.offsetParent !== null);
  }

  function showDialog() {
    noteBackdrop.hidden = false;
    noteBackdrop.setAttribute("aria-hidden", "false");
    /* Allow display:flex to take effect before transitioning opacity */
    window.requestAnimationFrame(() => {
      noteBackdrop.classList.add("is-open");
      noteBackBtn.focus();
    });
  }

  function closeDialog() {
    if (activeDialogMode === null) return;
    activeDialogMode = null;
    noteBackdrop.classList.remove("is-open");
    noteBackdrop.setAttribute("aria-hidden", "true");

    const finishHide = () => {
      if (activeDialogMode === null) {
        noteBackdrop.hidden = true;
      }
    };

    if (prefersReducedMotion) {
      finishHide();
    } else {
      window.setTimeout(finishHide, 240);
    }

    if (lastTriggerEl && typeof lastTriggerEl.focus === "function") {
      lastTriggerEl.focus();
    }
  }

  noteBackBtn.addEventListener("click", closeDialog);

  noteBackdrop.addEventListener("click", (e) => {
    if (e.target === noteBackdrop) {
      closeDialog();
    }
  });

  document.addEventListener("keydown", (e) => {
    if (activeDialogMode === null) return;

    if (e.key === "Escape") {
      e.preventDefault();
      closeDialog();
      return;
    }

    if (e.key === "Tab") {
      const focusables = getFocusableInsidePanel();
      if (focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  });

  /* --- Render Branch 1: The Whole Picture --- */
  function renderCrownBody(container) {
    const data = CONTENT.sections.crown;

    const headline = document.createElement("h2");
    headline.className = "panel-headline";
    headline.textContent = data.headline;
    container.appendChild(headline);

    const wrap = document.createElement("div");
    wrap.className = "network-wrap";

    const svg = createSvgElement("svg", {
      viewBox: "0 0 100 100",
      preserveAspectRatio: "none",
      class: "network-lines",
      "aria-hidden": "true",
      focusable: "false",
    });

    const nodeMap = new Map(data.nodes.map((n) => [n.id, n]));
    const edgeElements = [];

    data.edges.forEach(([fromId, toId]) => {
      const a = nodeMap.get(fromId);
      const b = nodeMap.get(toId);
      if (!a || !b) return;
      const line = createSvgElement("line", {
        x1: a.x,
        y1: a.y,
        x2: b.x,
        y2: b.y,
        class: "network-edge",
      });
      svg.appendChild(line);
      edgeElements.push({ fromId, toId, el: line });
    });

    wrap.appendChild(svg);

    const detail = document.createElement("p");
    detail.className = "network-detail network-detail--empty";
    detail.setAttribute("aria-live", "polite");
    detail.textContent = "";

    const nodeButtons = new Map();

    function activateNode(activeNode) {
      detail.className = "network-detail";
      detail.textContent = activeNode.detail;

      nodeButtons.forEach((btn, id) => {
        const isSelf = id === activeNode.id;
        const isConnected =
          activeNode.connectsAll ||
          data.edges.some(
            ([a, b]) =>
              (a === activeNode.id && b === id) ||
              (b === activeNode.id && a === id)
          );
        btn.classList.toggle("is-active", isSelf);
        btn.classList.toggle("is-connected", !isSelf && isConnected);
      });

      edgeElements.forEach(({ fromId, toId, el }) => {
        const lit =
          activeNode.connectsAll ||
          fromId === activeNode.id ||
          toId === activeNode.id;
        el.classList.toggle("is-lit", lit);
      });
    }

    data.nodes.forEach((node) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "network-node";
      btn.style.left = `${node.x}%`;
      btn.style.top = `${node.y}%`;
      btn.textContent = node.label;

      btn.addEventListener("mouseenter", () => activateNode(node));
      btn.addEventListener("focus", () => activateNode(node));
      btn.addEventListener("click", () => activateNode(node));

      wrap.appendChild(btn);
      nodeButtons.set(node.id, btn);
    });

    container.appendChild(wrap);
    container.appendChild(detail);
  }

  /* --- Render Branch 2: The Noticing --- */
  function renderUpperLeftBody(container) {
    const data = CONTENT.sections.upperLeft;

    const blockquote = document.createElement("blockquote");
    blockquote.className = "noticing-quote";

    data.quoteParts.forEach((part) => {
      if (!part.focusable) {
        blockquote.appendChild(document.createTextNode(part.text));
      } else {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "noticing-phrase";
        btn.textContent = part.text;
        btn.setAttribute("aria-pressed", prefersReducedMotion ? "true" : "false");

        const reveal = () => {
          btn.classList.add("is-focused");
          btn.setAttribute("aria-pressed", "true");
        };

        btn.addEventListener("mouseenter", reveal);
        btn.addEventListener("focus", reveal);
        btn.addEventListener("click", reveal);

        blockquote.appendChild(btn);
      }
    });

    const attribution = document.createElement("p");
    attribution.className = "noticing-attribution";
    attribution.textContent = data.attribution;

    container.appendChild(blockquote);
    container.appendChild(attribution);
  }

  /* --- Render Branch 3: The Roots --- */
  function renderRootsBody(container) {
    const data = CONTENT.sections.rootLeft;

    const headline = document.createElement("h2");
    headline.className = "panel-headline";
    headline.textContent = data.headline;

    const list = document.createElement("ul");
    list.className = "roots-list";

    data.items.forEach((itemText) => {
      const li = document.createElement("li");
      li.className = "roots-item";
      li.textContent = itemText;
      list.appendChild(li);
    });

    const note = document.createElement("p");
    note.className = "roots-note";
    note.textContent = data.note;

    container.appendChild(headline);
    container.appendChild(list);
    container.appendChild(note);
  }

  /* --- Per-branch Leaf Notes Rendering (strictly via textContent) --- */
  function renderBranchLeaves(branchId) {
    leafList.textContent = "";
    const notes = state.leaves[branchId] || [];
    notes.forEach((noteText) => {
      const li = document.createElement("li");
      li.className = "leaf-item";

      const icon = createSvgElement("svg", {
        viewBox: "0 0 16 16",
        width: "14",
        height: "14",
        class: "leaf-item-icon",
        "aria-hidden": "true",
        focusable: "false",
      });
      icon.appendChild(
        createSvgElement("path", {
          d: "M2 14 C3 7, 8 2, 14 2 C14 8, 9 14, 2 14 Z",
          fill: "currentColor",
        })
      );

      const span = document.createElement("span");
      span.textContent = noteText;

      li.appendChild(icon);
      li.appendChild(span);
      leafList.appendChild(li);
    });
  }

  function openBranchDialog(branchId) {
    const section = CONTENT.sections[branchId];
    if (!section) return;

    activeDialogMode = branchId;
    noteTitle.textContent = section.title;
    noteBody.textContent = "";

    if (branchId === "crown") {
      renderCrownBody(noteBody);
    } else if (branchId === "upperLeft") {
      renderUpperLeftBody(noteBody);
    } else if (branchId === "rootLeft") {
      renderRootsBody(noteBody);
    }

    leafSection.hidden = false;
    leafInput.placeholder = CONTENT.meta.leafPlaceholder;
    leafInput.maxLength = CONTENT.meta.leafMaxLength;
    leafSubmitBtn.textContent = CONTENT.meta.leafButton;
    leafInput.value = "";
    renderBranchLeaves(branchId);

    showDialog();
  }

  leafForm.addEventListener("submit", (e) => {
    e.preventDefault();
    if (!activeDialogMode || activeDialogMode === "ending") return;

    const text = leafInput.value.trim().slice(0, CONTENT.meta.leafMaxLength);
    if (!text) return;

    const existing = state.leaves[activeDialogMode] || [];
    state = {
      ...state,
      leaves: {
        ...state.leaves,
        [activeDialogMode]: [...existing, text],
      },
    };
    saveState(state);
    renderBranchLeaves(activeDialogMode);
    syncProgressUI();
    leafInput.value = "";
    leafInput.focus();
  });

  /* ========================================================================
     9. Ending Screen ("Your visit")
     ======================================================================== */
  async function copyTextToClipboard(text) {
    if (navigator.clipboard && typeof navigator.clipboard.writeText === "function") {
      try {
        await navigator.clipboard.writeText(text);
        return true;
      } catch {
        /* Fall back to textarea copy below if clipboard permission is restricted */
      }
    }
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.setAttribute("readonly", "");
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    let ok = false;
    try {
      ok = document.execCommand("copy");
    } catch {
      ok = false;
    }
    document.body.removeChild(ta);
    return ok;
  }

  function buildNotesSummaryText() {
    const lines = [
      `Soniaa S. — ${state.explored.length} of ${CONTENT.meta.totalOpenBranches} open branches explored`,
      "",
    ];

    hotspotsData
      .filter((spot) => spot.status === "open")
      .forEach((spot) => {
        const notes = state.leaves[spot.id] || [];
        if (notes.length > 0) {
          lines.push(`${spot.title}:`);
          notes.forEach((n) => lines.push(`- ${n}`));
          lines.push("");
        }
      });

    return lines.join("\n").trim();
  }

  function openEndingDialog() {
    hideBudTooltip();
    activeDialogMode = "ending";
    lastTriggerEl = finishVisitBtn;

    const endCopy = CONTENT.ending;
    noteTitle.textContent = endCopy.headline;
    noteBody.textContent = "";
    leafSection.hidden = true;

    const headline = document.createElement("h2");
    headline.className = "panel-headline";
    headline.textContent = endCopy.headline;

    const summary = document.createElement("p");
    summary.className = "ending-summary";
    summary.textContent = endCopy.summaryTemplate.replace(
      "{n}",
      String(state.explored.length)
    );

    noteBody.appendChild(headline);
    noteBody.appendChild(summary);

    const branchesWithNotes = hotspotsData.filter(
      (spot) =>
        spot.status === "open" &&
        Array.isArray(state.leaves[spot.id]) &&
        state.leaves[spot.id].length > 0
    );

    if (branchesWithNotes.length > 0) {
      const listWrap = document.createElement("div");
      listWrap.className = "ending-branches";

      branchesWithNotes.forEach((spot) => {
        const group = document.createElement("div");
        group.className = "ending-branch-group";

        const title = document.createElement("h3");
        title.className = "ending-branch-name";
        title.textContent = spot.title;

        const ul = document.createElement("ul");
        ul.className = "ending-branch-notes";

        state.leaves[spot.id].forEach((noteText) => {
          const li = document.createElement("li");
          li.textContent = noteText;
          ul.appendChild(li);
        });

        group.appendChild(title);
        group.appendChild(ul);
        listWrap.appendChild(group);
      });

      noteBody.appendChild(listWrap);
    } else {
      const emptyMsg = document.createElement("p");
      emptyMsg.className = "ending-empty";
      emptyMsg.textContent = endCopy.emptyNotesText;
      noteBody.appendChild(emptyMsg);
    }

    const actions = document.createElement("div");
    actions.className = "ending-actions";

    if (CONTENT.contactEmail) {
      const mailLink = document.createElement("a");
      mailLink.className = "ending-primary-btn";
      const bodyText = buildNotesSummaryText();
      mailLink.href = `mailto:${encodeURIComponent(
        CONTENT.contactEmail
      )}?subject=${encodeURIComponent(
        "What stood out on your living tree"
      )}&body=${encodeURIComponent(bodyText)}`;
      mailLink.textContent = endCopy.sendButtonLabel;
      actions.appendChild(mailLink);
    } else {
      const copyBtn = document.createElement("button");
      copyBtn.type = "button";
      copyBtn.className = "ending-primary-btn";
      copyBtn.textContent = endCopy.copyButtonLabel;
      copyBtn.addEventListener("click", async () => {
        await copyTextToClipboard(buildNotesSummaryText());
        copyBtn.textContent = endCopy.copiedLabel;
        window.setTimeout(() => {
          copyBtn.textContent = endCopy.copyButtonLabel;
        }, 2000);
      });
      actions.appendChild(copyBtn);
    }

    const linkedinLink = document.createElement("a");
    linkedinLink.className = "ending-secondary-link";
    linkedinLink.href = CONTENT.meta.linkedinUrl;
    linkedinLink.target = "_blank";
    linkedinLink.rel = "noopener noreferrer";
    linkedinLink.textContent = endCopy.linkedinLabel;
    actions.appendChild(linkedinLink);

    const clearBtn = document.createElement("button");
    clearBtn.type = "button";
    clearBtn.className = "ending-clear-btn";
    clearBtn.textContent = endCopy.clearLabel;
    clearBtn.addEventListener("click", () => {
      state = {
        ...state,
        leaves: {},
      };
      saveState(state);
      syncProgressUI();
      openEndingDialog();
    });
    actions.appendChild(clearBtn);

    const footerNote = document.createElement("p");
    footerNote.className = "ending-footer-note";
    footerNote.textContent = endCopy.footerNote;

    noteBody.appendChild(actions);
    noteBody.appendChild(footerNote);

    showDialog();
  }

  finishVisitBtn.addEventListener("click", openEndingDialog);

  /* ========================================================================
     10. Mobile Scroll Centering, Visibility Pause & Initialization
     ======================================================================== */
  function centerMobileStage() {
    if (!stageScroller) return;
    if (stageScroller.scrollWidth > stageScroller.clientWidth) {
      stageScroller.scrollLeft =
        (stageScroller.scrollWidth - stageScroller.clientWidth) / 2;
    }
  }

  function attachMobileSwipeHintListener() {
    if (!stageScroller || !mobileSwipeHint) return;
    const dismissMobileHint = () => {
      mobileSwipeHint.classList.add("is-dismissed");
    };
    window.setTimeout(() => {
      stageScroller.addEventListener("scroll", dismissMobileHint, {
        once: true,
        passive: true,
      });
      stageScroller.addEventListener("touchstart", dismissMobileHint, {
        once: true,
        passive: true,
      });
    }, 120);
  }

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      document.body.classList.add("is-paused");
      stopButterflyLoop();
    } else {
      document.body.classList.remove("is-paused");
      startButterflyLoop();
    }
  });

  if (typeof motionQuery.addEventListener === "function") {
    motionQuery.addEventListener("change", (e) => {
      prefersReducedMotion = e.matches;
      buildPollenMotes();
      if (prefersReducedMotion) {
        stopButterflyLoop();
        applyButterflyTransform();
      } else {
        startButterflyLoop();
      }
    });
  }

  window.addEventListener("resize", () => {
    applyButterflyTransform();
    updateHotspotProximity();
  });

  /* Boot sequence */
  renderHotspots();
  buildPollenMotes();
  initTrailPool();
  centerMobileStage();
  attachMobileSwipeHintListener();
  applyButterflyTransform();
  updateHotspotProximity();
  startButterflyLoop();
})();
