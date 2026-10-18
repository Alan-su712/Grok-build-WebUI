(() => {
  const $ = (id) => document.getElementById(id);
  const THEMES = ["grok-night", "grok-day", "ivory", "tokyo-night", "graphite", "high-contrast", "oceanic", "sage", "sunset", "violet-night"];
  const FONT_FAMILIES = ["auto", "misans", "x", "apple"];
  const WORK_STYLES = ["harness", "classic"];
  const SETTINGS_STORAGE_KEY = "grok-webui-settings";
  const ONBOARDING_STORAGE_KEY = "grok-webui-onboarding-v1";
  const HAS_LEGACY_APP_STATE = localStorage.length > 0;
  const LOCAL_DISPLAY_NAME_KEY = "grok-webui-local-display-name";
  const SETTINGS_SEARCH_TABS = {
    general: "generalTab", model: "modelTab", interaction: "interactionTab", voice: "voiceSettingsTitle", agent: "agentTab",
    tools: "toolsTab", memory: "memoryTab", git: "gitTab", mcp: "mcpTab", plugins: "pluginsTab",
    skills: "skillsTab", usage: "usage", archive: "archive", commands: "commands", privacy: "privacyTab",
    account: "accountTitle", help: "help"
  };
  const SETTINGS_SEARCH_ITEMS = [
    ["general", "thinkingBlocks", "thinkingBlocks"],
    ["general", "autoUpdateTui", "autoUpdateTui", "autoUpdateTuiHelp"],
    ["general", "closeAction", "closeAction", "closeActionHelp", "closeActionTray", "closeActionExit"],
    ["general", "language", "language", "langHelp"],
    ["general", "interfaceFont", "interfaceFont", "interfaceFontHelp", "fontOptionMiSans", "fontOptionX", "fontOptionApple"],
    ["voice", "voiceSettingsTitle", "voiceSettingsTitle", "voiceInputDevice", "voiceInputDeviceHelp", "voiceRecognitionLanguage", "voiceRecognitionLanguageHelp", "voiceOutputDevice", "voiceOutputDeviceHelp", "voiceHotkey", "voiceHotkeyHelp", "voiceDictionaryTitle", "voiceDictionaryHelp"],
    ["voice", "voiceInputDevice", "voiceInputDevice", "voiceInputDeviceHelp", "voiceRefreshDevices"],
    ["voice", "voiceRecognitionLanguage", "voiceRecognitionLanguage", "voiceRecognitionLanguageHelp"],
    ["voice", "voiceOutputDevice", "voiceOutputDevice", "voiceOutputDeviceHelp", "voiceChooseOutput", "voiceTestOutput"],
    ["voice", "voiceHotkey", "voiceHotkey", "voiceHotkeyHelp", "voiceHotkeySet", "voiceHotkeyChange"],
    ["voice", "voiceDictionaryTitle", "voiceDictionaryTitle", "voiceDictionaryHelp", "voiceDictionaryAdd", "voiceDictionaryPlaceholder"],
    ["general", "workStyle", "workStyle", "workHarness", "workClassic", "workHarnessHelp", "workClassicHelp"],
    ["general", "theme", "theme"],
    ["general", "startupBehavior", "startupBehavior", "startupHints", "startupHintsHelp", "compressionThreshold", "compressionThresholdHelp", "loadEnvrc", "loadEnvrcHelp", "remoteFetch", "remoteFetchHelp"],
    ["general", "usage", "usage"], ["general", "doctor", "doctor"], ["general", "export", "export"],
    ["model", "model", "model", "modelHelp", "currentModel"],
    ["model", "accessMode", "accessMode", "officialPlan", "officialPlanDesc", "customApi", "customApiDesc"],
    ["agent", "agentPermissionMode", "agentPermissionMode", "agentPermissionModeHelp", "permAsk", "permAuto", "permFull"],
    ["agent", "rememberApprovals", "rememberApprovals", "rememberApprovalsHelp"],
    ["agent", "defaultPermission", "defaultPermission", "defaultPermissionHelp", "defaultPermissionAlways", "defaultPermissionSession", "defaultPermissionAsk"],
    ["agent", "questionTimeout", "questionTimeout", "questionTimeoutHelp"],
    ["agent", "subAgents", "subAgents", "subAgentsHelp"],
    ["agent", "doubleCompression", "doubleCompression", "doubleCompressionHelp"],
    ["agent", "forkModel", "forkModel", "forkModelHelp"],
    ["agent", "cancelSubAgent", "cancelSubAgent", "cancelSubAgentHelp", "cancelSubAgentAsk", "cancelSubAgentStop", "cancelSubAgentContinue"],
    ["tools", "webSearch", "webSearch", "webSearchHelp"],
    ["tools", "clearPastes", "clearPastes", "clearPastesHelp"],
    ["tools", "gitignore", "gitignore", "gitignoreHelp"],
    ["tools", "shellTimeout", "shellTimeout", "shellTimeoutHelp", "secondsUnit"],
    ["tools", "shellOutputLimit", "shellOutputLimit", "shellOutputLimitHelp", "bytesUnit"],
    ["tools", "lspTools", "lspTools", "lspToolsHelp"],
    ["tools", "codeIndex", "codeIndex", "codeIndexHelp"],
    ["memory", "memoryToggle", "memoryToggle", "memoryToggleHelp"],
    ["memory", "memorySaveEnd", "memorySaveEnd", "memorySaveEndHelp"],
    ["memory", "memoryWatch", "memoryWatch", "memoryWatchHelp"],
    ["memory", "memoryMax", "memoryMax", "memoryMaxHelp"],
    ["memory", "memorySimilarity", "memorySimilarity", "memorySimilarityHelp"],
    ["memory", "memoryInject", "memoryInject", "memoryInjectHelp"],
    ["interaction", "keepSelection", "keepSelection", "keepSelectionHelp", "keepSelectionFlash", "keepSelectionPersistent", "keepSelectionNone"],
    ["interaction", "undoHints", "undoHints", "undoHintsHelp"],
    ["interaction", "planHints", "planHints", "planHintsHelp"],
    ["interaction", "imageHints", "imageHints", "imageHintsHelp"],
    ["interaction", "immediateSendHints", "immediateSendHints", "immediateSendHintsHelp"],
    ["interaction", "smallScreenHints", "smallScreenHints", "smallScreenHintsHelp"],
    ["interaction", "commandHintsSetting", "commandHintsSetting", "commandHintsSettingHelp"],
    ["git", "newSessionWorktree", "newSessionWorktree", "newSessionWorktreeHelp", "worktreeNever", "worktreeAsk", "worktreeAlways"],
    ["git", "forkWorktree", "forkWorktree", "forkWorktreeHelp", "worktreeNever", "worktreeAsk", "worktreeAlways"],
    ["git", "changeTracking", "changeTracking", "changeTrackingHelp", "trackAgent", "trackAll", "trackNone"],
    ["privacy", "telemetry", "telemetry", "telemetryHelp"], ["privacy", "feedback", "feedback", "feedbackHelp"],
    ["mcp", "mcp", "mcpTab", "mcpHelp", "mcpStateHelp", "mcpAddInline", "mcpName", "mcpCmd", "mcpArgs"],
    ["plugins", "plugins", "pluginsTab", "pluginsHelp", "plInstallHint", "plInstall", "plTargetName"],
    ["skills", "skills", "skillsTab", "skillsHelp", "skillPathHint", "skillPickFolder", "skillAdd", "skillAddHelp"],
    ["account", "account", "accountTitle", "accountLead", "accountSignedOutShort", "accountNotSignedIn", "accountLogin", "accountLoginHelp", "accountLogout", "accountLogoutHelp", "accountLocalName", "accountLocalNameHelp"],
    ["usage", "usage", "usage", "quotaTitle", "quotaBody", "usageNow", "weeklyUsage", "usageHelp", "usageTurns", "usageTools", "usageCost", "usageTokens"],
    ["archive", "archive", "archive", "archiveHelp", "purgeConfirm"],
    ["commands", "commands", "commands", "commandSearch"],
    ["help", "help", "help"]
  ];
  const SETTINGS_DEFAULTS = {
    worktreeNew: "never",
    worktreeFork: "ask",
    worktreeTrack: "agent",
    rememberApprovals: true,
    defaultPermission: "always",
    questionTimeout: true,
    subAgents: true,
    doubleCompression: false,
    forkModel: "grok-4.7",
    cancelSubAgent: "ask",
    startupHints: true,
    compressionThreshold: 85,
    loadEnvrc: true,
    remoteFetch: true,
    keepSelection: "flash",
    undoHints: true,
    planHints: true,
    imageHints: true,
    immediateSendHints: true,
    smallScreenHints: true,
    commandHints: true,
    gitignore: false,
    shellTimeout: 120,
    shellOutputLimit: 20000,
    lspTools: false,
    codeIndex: true,
    memorySaveEnd: true,
    memoryWatch: true,
    memoryMax: 6,
    memorySimilarity: 0.35,
    memoryInject: true,
    telemetry: false,
    feedback: true,
    fontFamily: "auto",
    voiceInputDeviceId: "",
    voiceOutputDeviceId: "",
    voiceRecognitionLanguage: "app",
    voiceHotkey: "",
    voiceDictionary: []
  };

  function normalizeSettings(raw) {
    const next = { ...SETTINGS_DEFAULTS, ...(raw && typeof raw === "object" ? raw : {}) };
    const enums = {
      worktreeNew: ["never", "ask", "always"],
      worktreeFork: ["never", "ask", "always"],
      worktreeTrack: ["agent", "all", "none"],
      defaultPermission: ["always", "session", "ask"],
      cancelSubAgent: ["ask", "stop", "continue"],
      keepSelection: ["flash", "persistent", "none"],
      fontFamily: FONT_FAMILIES
    };
    Object.keys(enums).forEach((key) => {
      if (!enums[key].includes(next[key])) next[key] = SETTINGS_DEFAULTS[key];
    });
    ["compressionThreshold", "shellTimeout", "shellOutputLimit", "memoryMax", "memorySimilarity"].forEach((key) => {
      const number = Number(next[key]);
      if (!Number.isFinite(number)) next[key] = SETTINGS_DEFAULTS[key];
      else next[key] = key === "memorySimilarity" ? Math.max(0, Math.min(1, number)) : Math.max(1, Math.round(number));
    });
    next.compressionThreshold = Math.max(50, Math.min(99, next.compressionThreshold));
    next.shellTimeout = Math.max(5, Math.min(3600, next.shellTimeout));
    next.shellOutputLimit = Math.max(1000, Math.min(1000000, next.shellOutputLimit));
    next.memoryMax = Math.max(1, Math.min(100, next.memoryMax));
    next.voiceHotkey = typeof next.voiceHotkey === "string" ? next.voiceHotkey.slice(0, 80) : "";
    const voiceTerms = new Set();
    next.voiceDictionary = (Array.isArray(next.voiceDictionary) ? next.voiceDictionary : [])
      .filter((term) => typeof term === "string")
      .map((term) => term.trim().slice(0, 50))
      .filter((term) => {
        const key = term.toLocaleLowerCase();
        if (!term || voiceTerms.has(key)) return false;
        voiceTerms.add(key);
        return true;
      })
      .slice(0, 100);
    Object.keys(SETTINGS_DEFAULTS).forEach((key) => {
      if (typeof SETTINGS_DEFAULTS[key] === "boolean") next[key] = next[key] !== false;
    });
    return next;
  }

  function readSettingsStorage() {
    try {
      const raw = JSON.parse(localStorage.getItem(SETTINGS_STORAGE_KEY) || "null");
      return raw && typeof raw === "object" ? raw : null;
    } catch {
      return null;
    }
  }

  function writeSettingsStorage(settings) {
    try {
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(normalizeSettings(settings)));
    } catch {}
  }
  const SLASH = [
    { cmd: "/new", run: "new", desc: "New chat" },
    { cmd: "/resume", run: "resume", desc: "Open chat list" },
    { cmd: "/compact", run: "slash", desc: "Compact context" },
    { cmd: "/context", run: "slash", desc: "Context usage" },
    { cmd: "/session-info", run: "slash", desc: "Session info" },
    { cmd: "/fork", run: "fork", desc: "Fork this chat" },
    { cmd: "/rewind", run: "rewind", desc: "Open rewind points" },
    { cmd: "/export", run: "export", desc: "Export markdown" },
    { cmd: "/rename", run: "rename", desc: "Rename chat" },
    { cmd: "/delete", run: "archive", desc: "Archive chat" },
    { cmd: "/archive", run: "archive", desc: "Archive chat" },
    { cmd: "/model", run: "focus-model", desc: "Switch model" },
    { cmd: "/effort", run: "focus-effort", desc: "Reasoning effort" },
    { cmd: "/plan", run: "plan", desc: "Plan mode" },
    { cmd: "/always-approve", run: "full", desc: "Always-approve" },
    { cmd: "/auto", run: "auto", desc: "Auto approve" },
    { cmd: "/memory", run: "slash", desc: "Memory" },
    { cmd: "/remember", run: "slash", desc: "Remember now" },
    { cmd: "/skills", run: "slash", desc: "Skills" },
    { cmd: "/plugins", run: "slash", desc: "Plugins" },
    { cmd: "/mcps", run: "slash", desc: "MCP servers" },
    { cmd: "/imagine", run: "slash", desc: "Generate image" },
    { cmd: "/imagine-video", run: "slash", desc: "Generate video" },
    { cmd: "/goal", run: "goal", desc: "Goal mode" },
    { cmd: "/deep-research", run: "slash", desc: "Deep research" },
    { cmd: "/workflow", run: "slash", desc: "Workflow" },
    { cmd: "/theme", run: "theme", desc: "Theme picker" },
    { cmd: "/settings", run: "settings", desc: "Settings" },
    { cmd: "/doctor", run: "doctor", desc: "Diagnostics" },
    { cmd: "/usage", run: "usage", desc: "Usage / cost" },
    { cmd: "/privacy", run: "slash", desc: "Privacy" },
    { cmd: "/timestamps", run: "timestamps", desc: "Toggle timestamps" }
  ];

  function normalizeLangId(value) {
    return value === "zh-TW" ? "zh-TW-TW" : value;
  }

  const storedLang = normalizeLangId(localStorage.getItem("grok-webui-lang") || "zh-CN");
  if (storedLang !== localStorage.getItem("grok-webui-lang")) localStorage.setItem("grok-webui-lang", storedLang);
  const state = {
    lang: storedLang,
    cwd: "",
    permission: "ask",
    workMode: "agent",
    workStyle: localStorage.getItem("grok-webui-style") || "harness",
    model: "",
    effort: "high",
    sessionId: "",
    sessionTitle: "",
    attached: false,
    running: false,
    turnSessionId: "",
    previewOpen: false,
    previewTab: "todos",
    settingsTab: "general",
    theme: "grok-day",
    showThinking: true,
    settings: normalizeSettings(readSettingsStorage()),
    timestamps: false,
    sidebarCollapsed: localStorage.getItem("grok-webui-rail") === "1",
    outlineOpen: false,
    todoDockOpen: false,
    sessionQuery: "",
    todos: [],
    plan: "",
    files: [],
    rewind: [],
    parentId: "",
    transcript: [],
    pending: [],
    live: { thought: "", text: "", tools: new Map() },
    user: { name: "", email: "", loggedIn: false },
    models: ["grok-4.7", "grok-4.6"],
    modelCatalog: [],
    lastUsage: null,
    contextUsage: null,
    providerFormOpen: false,
    providerSource: "unknown",
    customModels: [],
    runtimeVersion: "",
    closeAction: "tray",
    turnStartTs: 0,
    turnTimer: null,
    turnFileStats: null,
    thoughtStartTs: 0,
    thoughtTextStartTs: 0,
    thoughtDurMs: 0,
    usage: null,
    commandPanel: {
      path: "",
      titleKey: "commands",
      status: "idle",
      ok: true,
      text: "",
      error: "",
      exitCode: null,
      empty: false,
      requestId: 0
    }
  };
  const EFFORTS = [
    { id: "low", key: "effortLow" },
    { id: "medium", key: "effortMedium" },
    { id: "high", key: "effortHigh" },
    { id: "xhigh", key: "effortXhigh" }
  ];
  const PERMISSIONS = [
    { id: "ask", key: "permAsk", help: "permAskHelp", icon: "ask" },
    { id: "auto", key: "permAuto", help: "permAutoHelp", icon: "auto" },
    { id: "full", key: "permFull", help: "permFullHelp", icon: "full" }
  ];
  let contextUsageRevision = 0;

  const thread = $("thread");
  const input = $("input");
  const sendBtn = $("sendBtn");
  const statusEl = $("status");
  const palette = $("palette");
  const transcriptCache = new Map();
  const showAllGroups = new Set();
  const pinnedSessions = new Set(JSON.parse(localStorage.getItem("grok-webui-pinned-sessions") || "[]"));
  let sessionCache = [];
  let automationCache = [];
  let loadGen = 0;
  let historyAbort = null;
  let listDirty = true;
  let settingsRefreshTimer = null;
  let voicePhase = "idle";
  let voiceCapture = null;
  let voiceDevices = { inputs: [], outputs: [] };
  let voiceHotkeyCapturing = false;
  let voiceHotkeyPendingModifier = "";
  let voiceHotkeyPressActive = false;
  const appNavigation = { routes: [], index: -1, busy: false, restoring: false };

  function currentAppRoute() {
    if ($("settingsBack")?.classList.contains("show")) return { view: "settings", tab: state.settingsTab };
    if ($("marketBack")?.classList.contains("show")) return { view: "market" };
    if ($("automationBack")?.classList.contains("show")) return { view: "automation" };
    return { view: "chat", sessionId: state.sessionId || "", cwd: state.cwd || "" };
  }

  function sameAppRoute(a, b) {
    return a.view === b.view && a.sessionId === b.sessionId && a.cwd === b.cwd && a.tab === b.tab;
  }

  function updateAppNavigationButtons() {
    const back = $("navBack");
    const forward = $("navForward");
    if (back) back.disabled = appNavigation.busy || appNavigation.index <= 0;
    if (forward) forward.disabled = appNavigation.busy || appNavigation.index < 0 || appNavigation.index >= appNavigation.routes.length - 1;
  }

  function recordAppNavigation(next) {
    if (appNavigation.restoring) return;
    const current = currentAppRoute();
    if (appNavigation.index < 0) {
      appNavigation.routes = [current];
      appNavigation.index = 0;
    } else {
      appNavigation.routes[appNavigation.index] = current;
    }
    if (sameAppRoute(current, next)) {
      updateAppNavigationButtons();
      return;
    }
    appNavigation.routes = appNavigation.routes.slice(0, appNavigation.index + 1);
    appNavigation.routes.push(next);
    appNavigation.index = appNavigation.routes.length - 1;
    updateAppNavigationButtons();
  }

  async function restoreAppNavigation(route) {
    appNavigation.restoring = true;
    try {
      closeSettings();
      closeMarket();
      closeAutomations();
      if (route.view === "settings") {
        state.settingsTab = route.tab || "general";
        openSettings(route.tab || "general");
      } else if (route.view === "market") {
        openMarket();
      } else if (route.view === "automation") {
        openAutomations();
      } else if (route.sessionId) {
        await loadSession(route.sessionId, route.cwd);
      } else {
        await newChat({ historyRestore: true, cwd: route.cwd || "" });
      }
    } finally {
      appNavigation.restoring = false;
    }
  }

  function moveAppNavigation(offset) {
    if (appNavigation.busy) return false;
    if (appNavigation.index >= 0) appNavigation.routes[appNavigation.index] = currentAppRoute();
    const index = appNavigation.index + offset;
    if (index < 0 || index >= appNavigation.routes.length) return false;
    appNavigation.index = index;
    appNavigation.busy = true;
    updateAppNavigationButtons();
    restoreAppNavigation(appNavigation.routes[index]).catch((err) => {
      toast(err && err.message ? err.message : t("disconnected"));
    }).finally(() => {
      appNavigation.busy = false;
      updateAppNavigationButtons();
    });
    return true;
  }

  function leaveCurrentAppNavigation() {
    const route = currentAppRoute();
    if (route.view === "chat") return false;
    if (moveAppNavigation(-1)) return true;
    if (route.view === "settings") closeSettings();
    else if (route.view === "market") closeMarket();
    else if (route.view === "automation") closeAutomations();
    return true;
  }

  function dismissSettings() {
    closeSettings();
    const route = currentAppRoute();
    const currentIndex = appNavigation.index;
    let previousIndex = currentIndex - 1;
    while (previousIndex >= 0 && appNavigation.routes[previousIndex].view === "settings") previousIndex -= 1;
    if (previousIndex < 0) {
      appNavigation.routes = [route];
      appNavigation.index = 0;
    } else {
      appNavigation.routes.splice(previousIndex + 1, currentIndex - previousIndex);
      appNavigation.index = previousIndex;
      if (!sameAppRoute(appNavigation.routes[previousIndex], route)) {
        appNavigation.routes.splice(previousIndex + 1, 0, route);
        appNavigation.index += 1;
      }
    }
    updateAppNavigationButtons();
  }

  function t(key) {
    const pack = (window.GROK_I18N && window.GROK_I18N[state.lang]) || window.GROK_I18N.en;
    return pack[key] || window.GROK_I18N.en[key] || key;
  }

  function applyI18n() {
    document.documentElement.lang = state.lang;
    applyFont(state.settings.fontFamily);
    document.title = t("appTitle") || "Grok";
    document.querySelectorAll("[data-i18n]").forEach((el) => {
      el.textContent = t(el.getAttribute("data-i18n"));
    });
    document.querySelectorAll("[data-i18n-title]").forEach((el) => {
      el.title = t(el.getAttribute("data-i18n-title"));
    });
    document.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
      el.placeholder = t(el.getAttribute("data-i18n-placeholder"));
    });
    document.querySelectorAll("[data-i18n-aria]").forEach((el) => {
      el.setAttribute("aria-label", t(el.getAttribute("data-i18n-aria")));
    });
    updateAutomationIntervalLabel();
    if (state.user && !state.user.loggedIn) {
      const signedOut = t("accountSignedOutShort");
      if ($("userName")) $("userName").textContent = signedOut;
      if ($("umName")) $("umName").textContent = signedOut;
    }
      input.placeholder = t("composerPlaceholder");
    setHint(t("hint") + " · " + t("pasteHint"));
    renderLiveMeta();
    renderThread();
    renderPreview();
    renderTodoDock();
    if (sessionCache.length) renderSessions();
    if ($("automationBack")?.classList.contains("show")) {
      updateAutomationSource();
      renderAutomations();
    }
    renderPicks();
    renderComposerMenu();
    renderWorkModeNotice();
    if ($("settingsBack")?.classList.contains("show")) renderSettingsBody();
    const marketInstalled = $("mkInstalled");
    if (marketInstalled?.dataset.marketStatus === "loading") marketInstalled.textContent = t("marketLoading");
    if (marketInstalled?.dataset.marketStatus === "empty") marketInstalled.textContent = t("marketNoInstalled");
    if ($("marketBack")?.classList.contains("show")) marketDetail ? renderMarketDetail() : renderMarket();
    if (typeof updateLaunchBtn === "function") updateLaunchBtn();
    if (typeof renderOpenInChecks === "function") renderOpenInChecks();
    if (typeof renderTerminal === "function" && typeof terminalState !== "undefined" && terminalState.id) renderTerminal();
    if (lastConn !== null) setStatus(lastConn);
    setSendBusy(state.running);
    renderVoiceButton();
  }

  let lastConn = null;
  function setStatus(ok, text) {
    lastConn = ok;
    if (!statusEl) return;
    statusEl.classList.toggle("ok", !!ok);
    statusEl.classList.toggle("bad", ok === false);
    const base = text || (ok ? t("connected") : t("disconnected"));
    statusEl.querySelector("span").textContent = state.runtimeVersion ? `${base} · ${state.runtimeVersion}` : base;
  }

  function escapeHtml(s) {
    return String(s)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;");
  }

  function workspaceName(cwd) {
    const raw = String(cwd || "").replace(/[\\/]+$/, "");
    if (!raw) return t("noFolder");
    if (/^[a-zA-Z]:$/.test(raw)) return raw.toUpperCase() + "\\";
    const parts = raw.split(/[\\/]/).filter(Boolean);
    return parts[parts.length - 1] || raw;
  }

  function relTime(iso) {
    if (!iso) return "";
    const ts = Date.parse(iso);
    if (!Number.isFinite(ts)) return String(iso).slice(0, 16).replace("T", " ");
    const sec = Math.max(0, (Date.now() - ts) / 1000);
    if (sec < 45) return t("justNow");
    if (sec < 3600) return `${Math.max(1, Math.floor(sec / 60))}${t("minutesShort")}`;
    if (sec < 86400) return `${Math.floor(sec / 3600)}${t("hoursShort")}`;
    return `${Math.floor(sec / 86400)}${t("daysShort")}`;
  }

  function renderMarkdown(src) {
    const text = String(src || "");
    const fences = [];
    let body = text.replace(/```(\w*)\n([\s\S]*?)(?:```|$)/g, (_, lang, code) => {
      const token = `@@FENCE${fences.length}@@`;
      fences.push(`<pre><code>${escapeHtml(code).replace(/\n$/, "")}</code></pre>`);
      return "\n" + token + "\n";
    });
  body = escapeHtml(body);
  body = body.replace(/^#### (.+)$/gm, "<h5>$1</h5>");
  body = body.replace(/^### (.+)$/gm, "<h4>$1</h4>");
    body = body.replace(/^## (.+)$/gm, "<h3>$1</h3>");
    body = body.replace(/^# (.+)$/gm, "<h3>$1</h3>");
    body = body.replace(/\*\*(.+?)\*\*/g, "<b>$1</b>");
    const inlineCodes = [];
    body = body.replace(/`([^`]+)`/g, (_, code) => {
      const token = `@@INLINE${inlineCodes.length}@@`;
      inlineCodes.push(`<code>${code}</code>`);
      return token;
    });
    body = body.replace(/\[([^\]\n]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
    body = body.replace(/^\s*[-*] (.+)$/gm, "<li>$1</li>");
    body = body.replace(/(<li>.*<\/li>\n?)+/g, (m) => `<ul>${m}</ul>`);
    body = body.replace(/(^|\n)((?:\|[^\n]+\|\s*\n)+)\|?[\s:|-]+\|\s*\n((?:\|[^\n]+\|\s*\n?)*)/g, (_, lead, headRow, bodyRows) => {
    const cells = (row) => row.trim().replace(/^\|/, "").replace(/\|$/, "").split("|").map((x) => x.trim());
    const head = cells(headRow.split("\n")[0]);
    const rows = bodyRows.split("\n").map((r) => r.trim()).filter(Boolean).map(cells);
    return `${lead}<div class="md-table-wrap"><table><thead><tr>${head.map((h) => `<th>${h}</th>`).join("")}</tr></thead><tbody>${rows.map((r) => `<tr>${r.map((c) => `<td>${c}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`;
  });
  body = body.replace(/\n{2,}/g, "</p><p>");
    body = `<p>${body}</p>`;
    inlineCodes.forEach((html, i) => { body = body.replace(`@@INLINE${i}@@`, html); });
    fences.forEach((html, i) => { body = body.replace(`@@FENCE${i}@@`, html); });
    return body;
  }

  function kindLabel(kind, title) {
    const map = { read: "toolRead", edit: "toolEdit", write: "toolWrite", execute: "toolExec", search: "toolSearch", fetch: "toolFetch" };
    const key = map[String(kind || "").toLowerCase()];
    return key ? t(key) : (title || t("tool"));
  }

  function statusLabel(st) {
    const v = String(st || "").toLowerCase();
    if (["in_progress", "pending", "running"].includes(v)) return { t: t("stRun"), c: "run" };
    if (["completed", "success", "ok"].includes(v)) return { t: t("stOk"), c: "ok" };
    if (["failed", "error", "rejected"].includes(v)) return { t: t("stErr"), c: "bad" };
    return { t: st || "", c: "" };
  }

  function pretty(obj) {
    if (obj == null) return "";
    if (typeof obj === "string") return obj;
    try { return JSON.stringify(obj, null, 2); } catch { return String(obj); }
  }

  const HIDE_TOOLS = new Set(["exit_plan_mode", "todo_write", "TodoWrite", "ask_user_question"]);

  function toolCard(tool) {
    const title = String(tool.title || tool.kind || "");
    if (HIDE_TOOLS.has(title) || HIDE_TOOLS.has(tool.kind)) return "";
    const st = statusLabel(tool.status);
    const raw = (tool.output && Object.keys(tool.output).length) ? tool.output : tool.input;
    const body = pretty(raw);
    const compact = !body || body === "{}" || body === "[]";
    return `<article class="tool">
      <div class="tool-head">
        <button type="button" class="tool-toggle" data-mact="toggle-tool" aria-expanded="false">
          <span class="kind">${escapeHtml(kindLabel(tool.kind, tool.title))}</span>
          <span class="tool-title">${escapeHtml(tool.title || "")}</span>
          <span class="st ${st.c}">${escapeHtml(st.t)}</span>
          <svg class="tool-chevron" viewBox="0 0 12 12" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" d="m4 2.2 3.8 3.8L4 9.8"/></svg>
        </button>${compact ? "" : `<button type="button" class="tool-copy" data-mact="copy-tool" title="${escapeHtml(t("copyMsg"))}" aria-label="${escapeHtml(t("copyMsg"))}"><svg width="13" height="13" viewBox="0 0 14 14" aria-hidden="true"><rect x="4.5" y="4.5" width="7" height="7" rx="1.4" fill="none" stroke="currentColor" stroke-width="1.2"/><path d="M9.5 4.5V3a1.4 1.4 0 0 0-1.4-1.4H3A1.4 1.4 0 0 0 1.6 3v5.1A1.4 1.4 0 0 0 3 9.5h1.5" fill="none" stroke="currentColor" stroke-width="1.2"/></svg></button>`}
      </div>${compact ? "" : `<div class="tool-output" hidden><pre>${escapeHtml(body).slice(0, 4000)}</pre></div>`}</article>`;
  }

  function turnFilesBar(msg, idx) {
    const st = msg.turnStats;
    if (!st || !st.files) return "";
    const userCount = state.transcript.slice(0, idx).filter((m) => m.role === "user").length;
    const canUndo = userCount >= 1 && idx === state.transcript.length - 1;
    return `<div class="turn-files-bar">
      <svg width="13" height="13" viewBox="0 0 14 14"><path fill="none" stroke="currentColor" stroke-width="1.2" d="M3 1.5h5L11 4.5v8H3z"/><path fill="none" stroke="currentColor" stroke-width="1.2" d="M8 1.5v3h3"/></svg>
      <b>${st.files}</b><span>${escapeHtml(t("filesChanged"))}</span>
      <span class="add">+${st.added}</span><span class="del">-${st.removed}</span>
      ${canUndo ? `<button type="button" class="undo-btn" data-mact="undo"><svg width="12" height="12" viewBox="0 0 14 14"><path fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" d="M3 6h6a3 3 0 1 1 0 5H5"/><path fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" d="M5 3.5 2.5 6 5 8.5"/></svg>${escapeHtml(t("undo"))}</button>` : ""}
    </div>`;
  }

  function msgFoot(msg) {
    return `<div class="msg-foot"><span class="msg-btns">
      <button type="button" data-mact="copy" title="${escapeHtml(t("copyMsg"))}"><svg width="13" height="13" viewBox="0 0 14 14"><rect x="4.5" y="4.5" width="7" height="7" rx="1.4" fill="none" stroke="currentColor" stroke-width="1.2"/><path d="M9.5 4.5V3a1.4 1.4 0 0 0-1.4-1.4H3A1.4 1.4 0 0 0 1.6 3v5.1A1.4 1.4 0 0 0 3 9.5h1.5" fill="none" stroke="currentColor" stroke-width="1.2"/></svg></button>
      <button type="button" data-mact="fork" title="${escapeHtml(t("forkHere"))}"><svg width="13" height="13" viewBox="0 0 14 14"><circle cx="3.2" cy="3" r="1.6" fill="none" stroke="currentColor" stroke-width="1.2"/><circle cx="3.2" cy="11" r="1.6" fill="none" stroke="currentColor" stroke-width="1.2"/><circle cx="10.8" cy="7" r="1.6" fill="none" stroke="currentColor" stroke-width="1.2"/><path d="M4.6 3.8 9.4 6.4M4.6 10.2 9.4 7.6" stroke="currentColor" stroke-width="1.2"/></svg></button>
    </span></div>`;
  }

  function userMsgFoot(msg) {
    const time = stamp(msg.ts);
    return `<div class="user-msg-foot">${time}<span class="user-msg-btns">
      <button type="button" data-mact="copy-user" title="${escapeHtml(t("copyMsg"))}"><svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true"><rect x="4.5" y="4.5" width="7" height="7" rx="1.4" fill="none" stroke="currentColor" stroke-width="1.2"/><path d="M9.5 4.5V3a1.4 1.4 0 0 0-1.4-1.4H3A1.4 1.4 0 0 0 1.6 3v5.1A1.4 1.4 0 0 0 3 9.5h1.5" fill="none" stroke="currentColor" stroke-width="1.2"/></svg></button>
      <button type="button" data-mact="edit-user" title="${escapeHtml(t("toolEdit"))}"><svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true"><path d="m3 10.9 1.1-3.1L9.8 2a1.3 1.3 0 0 1 1.8 1.8l-5.7 5.7L3 10.9Z" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linejoin="round"/><path d="m8.8 3 2.2 2.2M2.7 12h8.6" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/></svg></button>
    </span></div>`;
  }

  function usageChip(u) {
    if (!u || (!u.totalTokens && !u.costUsd)) return "";
    const bits = [];
    if (u.inputTokens) bits.push(`↑ ${formatTokens(u.inputTokens)}`);
    if (u.outputTokens) bits.push(`↓ ${formatTokens(u.outputTokens)}`);
    if (u.reasoningTokens) bits.push(`${t("reasoningShort")} ${formatTokens(u.reasoningTokens)}`);
    if (u.costUsd) bits.push(`$${u.costUsd < 0.01 ? u.costUsd.toFixed(4) : u.costUsd.toFixed(2)}`);
    if (!bits.length) return "";
    return `<div class="usage-chip">${escapeHtml(bits.join(" · "))}</div>`;
  }

  function assistantDetailContent(msg, live, idx) {
    const tools = (msg.tools || []).map(toolCard).filter(Boolean).join("");
    const pending = live && !msg.text && !tools && (!msg.thought || !state.showThinking)
      ? `<div class="pending">${escapeHtml(t("thinking"))}</div>` : "";
    const files = Number.isInteger(idx) ? turnFilesBar(msg, idx) : "";
    const usage = usageChip(msg.usage);
    const executionContent = `${tools ? `<div class="tools">${tools}</div>` : ""}${files}${usage}`;
    const execution = executionContent
      ? `<details class="turn-subdetails"><summary><span>${escapeHtml(t("viewExecution"))}</span><svg class="turn-chevron" viewBox="0 0 12 12" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" d="m4 2.2 3.8 3.8L4 9.8"/></svg></summary><div class="turn-subdetail-body">${executionContent}</div></details>`
      : "";
    const thought = msg.thought && state.showThinking
      ? `<details class="turn-subdetails"><summary><span>${escapeHtml(t("viewThought"))}</span><svg class="turn-chevron" viewBox="0 0 12 12" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" d="m4 2.2 3.8 3.8L4 9.8"/></svg></summary><div class="turn-subdetail-body"><div class="thought-text">${escapeHtml(msg.thought)}</div></div></details>`
      : "";
    return `${pending}${execution}${thought}`;
  }

  function turnDurationMs(msg, idx) {
    const recorded = Number(msg.durationMs);
    if (Number.isFinite(recorded) && recorded > 0) return recorded;
    if (Number.isInteger(idx)) {
      for (let i = idx - 1; i >= 0; i -= 1) {
        if (state.transcript[i].role !== "user") continue;
        const start = new Date(state.transcript[i].ts).getTime();
        const end = new Date(msg.ts).getTime();
        return Number.isFinite(start) && Number.isFinite(end) ? Math.max(0, end - start) : 0;
      }
    }
    return 0;
  }

  function fmtDur(ms) {
    const sec = Math.max(1, Math.round(ms / 1000));
    const hours = Math.floor(sec / 3600);
    const minutes = Math.floor((sec % 3600) / 60);
    const seconds = sec % 60;
    if (hours) return t("durationHours").replace("{hours}", String(hours)).replace("{minutes}", String(minutes));
    if (minutes) return t("durationMinutes").replace("{minutes}", String(minutes)).replace("{seconds}", String(seconds));
    return t("durationSeconds").replace("{seconds}", String(seconds));
  }

  function turnDetailLabel(msg, idx, live) {
    if (live) return t("turnWorking").replace("{duration}", fmtDur(Date.now() - state.turnStartTs));
    const duration = turnDurationMs(msg, idx);
    return duration ? t("turnDuration").replace("{duration}", fmtDur(duration)) : t("turnDetails");
  }

  function assistantHtml(msg, live, idx, hideDetails) {
    const answer = msg.text ? `<div class="md">${renderMarkdown(msg.text)}</div>` : "";
    const detail = hideDetails ? "" : assistantDetailContent(msg, live, idx);
    if (!answer && !detail) return "";
    const disclosure = detail
      ? `<details class="turn-details"><summary><span class="turn-summary-text"${live ? " id=\"liveDetailsSummary\"" : ""}>${escapeHtml(turnDetailLabel(msg, idx, live))}</span><svg class="turn-chevron" viewBox="0 0 12 12" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" d="m4 2.2 3.8 3.8L4 9.8"/></svg></summary><div class="turn-detail-body">${detail}</div></details>`
      : "";
    return `${answer}${disclosure}`;
  }

  function mergeAssistantTurn(entries) {
    const messages = entries.map((entry) => entry.msg);
    const last = messages[messages.length - 1] || {};
    const usageSource = [...messages].reverse().find((msg) => msg.usage);
    const statsSource = [...messages].reverse().find((msg) => msg.turnStats);
    const merged = {
      role: "assistant",
      text: messages.map((msg) => String(msg.text || "").trim()).filter(Boolean).join("\n\n"),
      thought: messages.map((msg) => String(msg.thought || "").trim()).filter(Boolean).join("\n\n"),
      tools: messages.flatMap((msg) => Array.isArray(msg.tools) ? msg.tools : []),
      usage: usageSource ? usageSource.usage : null,
      durationMs: messages.reduce((total, msg) => total + (Number(msg.durationMs) || 0), 0),
      turnStats: statsSource ? statsSource.turnStats : null,
      ts: last.ts
    };
    return merged;
  }

  function assistantTurnHtml(entries) {
    const merged = mergeAssistantTurn(entries);
    const lastIdx = entries[entries.length - 1].idx;
    const inner = assistantHtml(merged, false, lastIdx, true);
    if (!inner) return "";
    return '<article class="msg assistant" data-idx="' + lastIdx + '" data-start-idx="' + entries[0].idx + '"><div class="who">' +
      escapeHtml(t("grok")) + " " + stamp(merged.ts) + "</div>" + inner + msgFoot(merged) + "</article>";
  }

  function conversationActivityLabel(totalMs) {
    if (state.running) return turnDetailLabel(null, -1, true);
    return t("turnDuration").replace("{duration}", fmtDur(totalMs));
  }

  function conversationActivityMarkup() {
    const sections = [];
    let totalMs = 0;
    let lastAssistantIdx = -1;
    conversationTurns().forEach((turn) => {
      if (!turn.assistants.length) return;
      const merged = mergeAssistantTurn(turn.assistants);
      const lastIdx = turn.assistants[turn.assistants.length - 1].idx;
      const detail = assistantDetailContent(merged, false, lastIdx);
      totalMs += turnDurationMs(merged, lastIdx);
      lastAssistantIdx = lastIdx;
      if (detail) sections.push('<section class="activity-turn"><div class="activity-turn-head">' + escapeHtml(t("grok")) + " " + stamp(merged.ts) + "</div>" + detail + "</section>");
    });
    if (state.running) {
      const live = state.live || {};
      const stats = state.turnFileStats ? {
        files: state.turnFileStats.files.size,
        added: state.turnFileStats.added,
        removed: state.turnFileStats.removed
      } : null;
      const detail = assistantDetailContent({
        text: live.text || "",
        thought: live.thought || "",
        tools: [...(live.tools || new Map()).values()],
        usage: state.lastUsage || null,
        turnStats: stats
      }, true);
      totalMs += Math.max(0, Date.now() - state.turnStartTs);
      if (detail) sections.push('<section class="activity-turn"><div class="activity-turn-head">' + escapeHtml(t("grok")) + "</div>" + detail + "</section>");
    }
    if (!sections.length) return "";
    const idxAttr = lastAssistantIdx >= 0 ? ' data-idx="' + lastAssistantIdx + '"' : "";
    const label = conversationActivityLabel(totalMs);
    return '<article class="msg assistant conversation-activity"' + idxAttr + '><details class="turn-details" id="conversationActivity"><summary><span class="turn-summary-text" id="conversationDetailsSummary">' +
      escapeHtml(label) + '</span><svg class="turn-chevron" viewBox="0 0 12 12" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" d="m4 2.2 3.8 3.8L4 9.8"/></svg></summary><div class="turn-detail-body">' +
      sections.join("") + "</div></details></article>";
  }

  function syncConversationActivity() {
    const current = $("conversationActivity");
    const open = !!(current && current.open);
    const markup = conversationActivityMarkup();
    if (!markup) {
      current && current.closest(".conversation-activity") && current.closest(".conversation-activity").remove();
      return;
    }
    const holder = document.createElement("div");
    holder.innerHTML = markup;
    const replacement = holder.firstElementChild;
    const disclosure = replacement && replacement.querySelector("#conversationActivity");
    if (disclosure) disclosure.open = open;
    const root = current && current.closest(".conversation-activity");
    if (root) root.replaceWith(replacement);
    else insertConversationActivity(replacement);
  }

  function insertConversationActivity(activity) {
    const live = $("liveMsg");
    const replies = thread.querySelectorAll(".msg.assistant:not(.conversation-activity):not(.live)");
    const lastReply = replies[replies.length - 1];
    const anchor = live || lastReply;
    if (anchor) thread.insertBefore(activity, anchor);
    else thread.prepend(activity);
  }

  function stamp(ts) {
    if (!ts) return "";
    try {
      const d = new Date(ts);
      if (isNaN(d.getTime())) return "";
      const locale = state.lang === "zh-TW-TW" ? "zh-TW" : state.lang;
      return `<span class="msg-time">${new Intl.DateTimeFormat(locale, { hour: "2-digit", minute: "2-digit" }).format(d)}</span>`;
    } catch { return ""; }
  }

  function tickLive() {
    if (!state.running || !state.turnStartTs) return;
    const summary = document.getElementById("conversationDetailsSummary");
    if (summary) summary.textContent = turnDetailLabel(null, -1, true);
    tickLive._t && tickLive._t();
  }

  function startLiveTimer() {
    state.turnStartTs = Date.now();
    if (state.turnTimer) clearInterval(state.turnTimer);
    state.turnTimer = setInterval(tickLive, 1000);
    setTimeout(tickLive, 60);
  }

  function stopLiveTimer() {
    if (state.turnTimer) { clearInterval(state.turnTimer); state.turnTimer = null; }
  }

  function conversationTurns() {
    const turns = [];
    let current = null;
    state.transcript.forEach((msg, idx) => {
      if (msg.role === "user") {
        current = { user: msg, userIdx: idx, startIdx: idx, endIdx: idx, assistants: [] };
        turns.push(current);
        return;
      }
      if (msg.role !== "assistant") return;
      if (!current) {
        current = { user: null, userIdx: null, startIdx: idx, endIdx: idx, assistants: [] };
        turns.push(current);
      }
      current.assistants.push({ msg, idx });
      current.endIdx = idx;
    });
    return turns;
  }

  function syncOutlineActive() {
    const nav = $("chatOutline");
    if (!nav || nav.hidden) return;
    const top = thread.getBoundingClientRect().top + 36;
    const first = [...thread.querySelectorAll(".msg[data-idx]")].find((node) => node.getBoundingClientRect().bottom > top);
    const index = first ? Number(first.dataset.idx) : state.transcript.length - 1;
    const groups = [...nav.querySelectorAll("[data-outline-start]")];
    let active = groups.find((row) => index >= Number(row.dataset.outlineStart) && index <= Number(row.dataset.outlineEnd));
    if (!active) active = groups.filter((row) => Number(row.dataset.outlineStart) <= index).pop() || groups[0];
    groups.forEach((row) => {
      const isActive = active && row.dataset.outlineStart === active.dataset.outlineStart && row.dataset.outlineEnd === active.dataset.outlineEnd;
      row.classList.toggle("is-current", !!isActive);
      if (row.classList.contains("outline-row")) row.setAttribute("aria-current", isActive ? "location" : "false");
    });
  }

  function renderChatOutline() {
    const nav = $("chatOutline");
    const main = $("main");
    if (!nav || !main) return;
    const turns = conversationTurns();
    if (turns.length < 2) {
      nav.hidden = true;
      nav.innerHTML = "";
      main.classList.remove("outline-visible", "outline-open");
      return;
    }
    const expanded = state.outlineOpen;
    const clip = (value, length) => {
      const text = String(value || "").replace(/\s+/g, " ").trim();
      return text.length > length ? text.slice(0, length).trimEnd() + "…" : text;
    };
    const items = turns.map((turn) => {
      const last = turn.assistants[turn.assistants.length - 1];
      const prompt = turn.user ? turn.user.text || (turn.user.images && turn.user.images.length ? t("attach") : "") : "";
      const reply = [...turn.assistants].reverse().map((entry) => entry.msg.text).find(Boolean) || "";
      const primary = clip(prompt || reply || t("turnDetails"), 94);
      const label = (turn.user ? t("chatYou") : t("grok")) + ": " + primary;
      const anchor = turn.userIdx === null ? turn.startIdx : turn.userIdx;
      const time = stamp(turn.user ? turn.user.ts : last && last.msg.ts);
      return '<button type="button" class="outline-marker' + (turn === turns[turns.length - 1] ? " is-current" : "") +
        '" data-outline-idx="' + anchor + '" data-outline-start="' + turn.startIdx + '" data-outline-end="' + turn.endIdx +
        '" title="' + escapeHtml(label) + '" aria-label="' + escapeHtml(label) + '"></button>';
    }).join("");
    const rows = turns.map((turn, index) => {
      const last = turn.assistants[turn.assistants.length - 1];
      const prompt = turn.user ? turn.user.text || (turn.user.images && turn.user.images.length ? t("attach") : "") : "";
      const reply = [...turn.assistants].reverse().map((entry) => entry.msg.text).find(Boolean) || "";
      const primary = clip(prompt || reply || t("turnDetails"), 110);
      const secondary = prompt && reply ? clip(reply, 86) : "";
      const role = turn.user ? t("chatYou") : t("grok");
      const anchor = turn.userIdx === null ? turn.startIdx : turn.userIdx;
      const time = stamp(turn.user ? turn.user.ts : last && last.msg.ts);
      return '<button type="button" class="outline-row' + (index === turns.length - 1 ? " is-current" : "") +
        '" data-outline-idx="' + anchor + '" data-outline-start="' + turn.startIdx + '" data-outline-end="' + turn.endIdx +
        '" aria-current="' + (index === turns.length - 1 ? "location" : "false") + '"><span class="outline-row-meta"><small>' +
        escapeHtml(role) + '</small>' + time + '</span><span class="outline-row-primary">' + escapeHtml(primary) + '</span>' +
        (secondary ? '<span class="outline-row-secondary">' + escapeHtml(secondary) + '</span>' : "") + '</button>';
    }).join("");
    const toggleLabel = t(expanded ? "chatOutlineCollapse" : "chatOutlineExpand");
    nav.hidden = false;
    nav.setAttribute("aria-label", t("chatOutline"));
    nav.classList.toggle("expanded", expanded);
    main.classList.add("outline-visible");
    main.classList.toggle("outline-open", expanded);
    nav.innerHTML = '<div class="outline-head"><div class="outline-heading"><strong>' + escapeHtml(t("chatOutline")) +
      '</strong><span class="outline-count">' + turns.length + '</span></div><button type="button" class="outline-toggle" aria-expanded="' +
      expanded + '" aria-label="' + escapeHtml(toggleLabel) + '" title="' + escapeHtml(toggleLabel) +
      '"><svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true"><path d="M4 3.5h9M4 7.5h9M4 11.5h9" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/><circle cx="2.2" cy="3.5" r=".7" fill="currentColor"/><circle cx="2.2" cy="7.5" r=".7" fill="currentColor"/><circle cx="2.2" cy="11.5" r=".7" fill="currentColor"/></svg></button></div>' +
      '<div class="outline-markers">' + items + '</div><div class="outline-list"' + (expanded ? "" : " hidden") + '>' + rows + '</div>';
    nav.querySelector(".outline-toggle").onclick = () => {
      const open = nav.classList.toggle("expanded");
      state.outlineOpen = open;
      const label = t(open ? "chatOutlineCollapse" : "chatOutlineExpand");
      const toggle = nav.querySelector(".outline-toggle");
      toggle.setAttribute("aria-expanded", String(open));
      toggle.setAttribute("aria-label", label);
      toggle.title = label;
      nav.querySelector(".outline-list").hidden = !open;
      main.classList.toggle("outline-open", open);
    };
    nav.querySelectorAll("[data-outline-idx]").forEach((button) => {
      button.onclick = () => {
        const target = thread.querySelector('.msg[data-idx="' + button.dataset.outlineIdx + '"]');
        target && target.scrollIntoView({ behavior: "smooth", block: "center" });
      };
    });
    if (!renderChatOutline.scrollBound) {
      thread.addEventListener("scroll", syncOutlineActive, { passive: true });
      renderChatOutline.scrollBound = true;
    }
    syncOutlineActive();
  }

  function renderThread(force) {
    const stick = nearBottom();
    const empty = !state.transcript.length && !state.running;
    $("main")?.classList.toggle("is-empty", empty);
    updateComposerPlaceholder();
    if (empty) {
      liveNode = null;
      thread.classList.remove("switching");
      const starterIcons = [ICO.folder, ICO.spark, ICO.sliders, ICO.wrench];
      const starters = [1, 2, 3, 4].map((index) => `
        <button type="button" class="home-starter" data-home-starter="${index}">
          <span class="home-starter-icon" aria-hidden="true">${starterIcons[index - 1]}</span>
          <span class="home-starter-title">${escapeHtml(t(`starter${index}t`))}</span>
          <span class="home-starter-description">${escapeHtml(t(`starter${index}s`))}</span>
        </button>`).join("");
      thread.innerHTML = `<div class="empty"><h1>${escapeHtml(t("homePromptTitle"))}</h1></div>
        <section class="home-starters" aria-labelledby="homeStartersTitle">
          <h2 id="homeStartersTitle">${escapeHtml(t("starterSectionTitle"))}</h2>
          <div class="home-starter-list">${starters}</div>
        </section>`;
      renderChatOutline();
      return;
    }
    const activity = conversationActivityMarkup();
    const parts = state.transcript.map((msg, idx) => {
      if (msg.role === "user") {
        const pics = (msg.images || []).map((img) =>
          `<img src="${escapeHtml(img.url || img)}" alt="${escapeHtml(img.name || "image")}">`
        ).join("");
        return `<article class="msg user" data-idx="${idx}">
          ${pics ? `<div class="pics">${pics}</div>` : ""}
          ${msg.text ? `<div class="bubble">${escapeHtml(msg.text)}</div>` : ""}
          ${userMsgFoot(msg)}</article>`;
      }
      if (msg.role === "assistant") {
        if (idx + 1 < state.transcript.length && state.transcript[idx + 1].role === "assistant") return "";
        const entries = [];
        for (let start = idx; start >= 0 && state.transcript[start].role === "assistant"; start -= 1) {
          entries.unshift({ msg: state.transcript[start], idx: start });
        }
        return assistantTurnHtml(entries);
      }
    });
    liveNode = null;
    if (state.running && state.turnSessionId === state.sessionId) {
      parts.push(`<article class="msg assistant live" id="liveMsg"><div class="who">${escapeHtml(t("grok"))}</div><div class="live-body"></div></article>`);
    }
    thread.classList.remove("switching");
    thread.innerHTML = parts.join("");
    if (activity) {
      const holder = document.createElement("div");
      holder.innerHTML = activity;
      if (holder.firstElementChild) insertConversationActivity(holder.firstElementChild);
    }
    renderChatOutline();
    if (liveNode === null && state.running) {
      liveNode = $("liveMsg");
      livePaint(true);
    }
    if (stick || force) scrollToEnd();
  }

  function nearBottom() {
    return thread.scrollHeight - thread.scrollTop - thread.clientHeight < 140;
  }

  function scrollToEnd(smooth) {
    try {
      thread.scrollTo({ top: thread.scrollHeight, behavior: smooth ? "smooth" : "auto" });
    } catch {
      thread.scrollTop = thread.scrollHeight;
    }
  }

  let liveNode = null;
  let livePainted = { textLen: -1, thoughtLen: -1, toolsKey: "" };

  function liveSignature() {
    const tools = [...state.live.tools.values()];
    const toolsKey = tools.map((x) => `${x.id}:${x.status || ""}`).join("|") + "#" + tools.length;
    return { textLen: (state.live.text || "").length, thoughtLen: (state.live.thought || "").length, toolsKey };
  }

  // 流式期间只重画 live 这一条消息，其余 DOM 原样保留，避免整页重建带来的抖动。
  function livePaint(force) {
    if (!liveNode) return;
    const sig = liveSignature();
    if (!force && sig.textLen === livePainted.textLen && sig.thoughtLen === livePainted.thoughtLen && sig.toolsKey === livePainted.toolsKey) return;
    const body = liveNode.querySelector(".live-body");
    if (!body) return;
    body.innerHTML = assistantHtml({
      thought: state.live.thought,
      text: state.live.text,
      tools: [...state.live.tools.values()]
    }, true, undefined, true) || "";
    livePainted = sig;
    syncConversationActivity();
    if (nearBottom()) scrollToEnd();
  }

  function showSkeleton() {
    thread.classList.add("switching");
    thread.innerHTML = `<div class="skeleton" aria-hidden="true"><i></i><i></i><i></i><i></i></div>`;
  }

  async function api(path, opts) {
    const res = await fetch(path, opts);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
    return data;
  }

  function formatTokens(n) {
    const v = Number(n) || 0;
    if (v >= 1000000) return (v / 1000000).toFixed(1) + "M";
    if (v >= 1000) return Math.round(v / 1000) + "k";
    return String(v);
  }

  function applyUser(user) {
    if (!user) return;
    const loggedIn = !!(user.loggedIn || user.email || user.userId || user.user_id);
    const accountName = loggedIn
      ? user.accountName || user.name || user.displayName || [user.firstName, user.lastName].filter(Boolean).join(" ") || user.email || t("accountProfile")
      : t("accountSignedOutShort");
    const localName = loggedIn ? (localStorage.getItem(LOCAL_DISPLAY_NAME_KEY) || "").trim() : "";
    const name = loggedIn && localName ? localName : accountName;
    state.user = { ...user, accountName, name, email: user.email || "", loggedIn };
    const userName = $("userName");
    if (userName) userName.textContent = name;
    const menuName = $("umName");
    if (menuName) menuName.textContent = name;
    const menuLogin = $("umLogin");
    if (menuLogin) menuLogin.hidden = loggedIn;
    const menuLoginDivider = $("umLoginDivider");
    if (menuLoginDivider) menuLoginDivider.hidden = loggedIn;
    const menuLogout = $("umLogout");
    if (menuLogout) menuLogout.hidden = !loggedIn;
    const menuLogoutDivider = $("umLogoutDivider");
    if (menuLogoutDivider) menuLogoutDivider.hidden = !loggedIn;
    document.title = t("appTitle") || "Grok";
  }

  async function startAccountLogin(button, output, onSuccess) {
    if (button.disabled) return;
    output.hidden = false;
    output.textContent = t("accountLoginStarting");
    button.disabled = true;
    let startComplete = false;
    let startFailed = false;
    let active = true;
    let pollTimer = 0;
    const request = (path, opts = {}, timeoutMs = 4000) => {
      const controller = new AbortController();
      const timeout = window.setTimeout(() => controller.abort(), timeoutMs);
      return api(path, { ...opts, cache: "no-store", signal: controller.signal })
        .finally(() => window.clearTimeout(timeout));
    };
    const stopPolling = () => {
      active = false;
      window.clearTimeout(pollTimer);
    };
    request("/api/account/login-start", { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" }, 10000)
      .then(() => { startComplete = true; })
      .catch(() => { startComplete = true; startFailed = true; });
    const checkLogin = async () => {
      if (!active) return;
      const [statusResult, accountResult] = await Promise.allSettled([
        request("/api/account/login-status"),
        request("/api/account")
      ]);
      if (!active) return;
      const acct = accountResult.status === "fulfilled" ? accountResult.value : null;
      if (acct?.loggedIn) {
        stopPolling();
        applyUser({ ...(acct.account || {}), loggedIn: acct.loggedIn });
        toast("✓");
        await onSuccess?.();
        return;
      }
      const status = statusResult.status === "fulfilled" ? statusResult.value : null;
      if (status) {
        output.textContent = status.text || (startComplete ? t("accountLoginWaiting") : t("accountLoginStarting"));
        if (!status.running && startComplete) {
          stopPolling();
          button.disabled = false;
          output.textContent = startFailed ? t("disconnected") : t("accountNotSignedIn");
          return;
        }
      } else {
        output.textContent = startComplete ? t("accountLoginWaiting") : t("accountLoginStarting");
      }
      pollTimer = window.setTimeout(checkLogin, 1500);
    };
    checkLogin();
  }

  let accountSyncInFlight = null;
  let accountSyncTimer = null;
  function syncAccountState() {
    if (accountSyncInFlight) return accountSyncInFlight;
    accountSyncInFlight = api("/api/account").then((data) => {
      const account = data.account || {};
      const loggedIn = !!data.loggedIn;
      const previous = state.user || {};
      const accountKey = loggedIn
        ? [account.userId || account.user_id || "", account.email || "", account.name || account.displayName || ""].join("|")
        : "";
      const previousKey = previous.loggedIn
        ? [previous.userId || previous.user_id || "", previous.email || "", previous.accountName || previous.name || ""].join("|")
        : "";
      const changed = !!previous.loggedIn !== loggedIn || previousKey !== accountKey;
      applyUser({ ...account, loggedIn });
      if (changed && state.settingsTab === "account" && $("settingsBack")?.classList.contains("show")) {
        renderAccountTab($("settingsBody"));
      }
    }).catch(() => {}).finally(() => {
      accountSyncInFlight = null;
    });
    return accountSyncInFlight;
  }

  function startAccountStateSync() {
    if (accountSyncTimer) return;
    syncAccountState();
    accountSyncTimer = window.setInterval(() => {
      if (document.visibilityState === "visible") syncAccountState();
    }, 2500);
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible") syncAccountState();
    });
    window.addEventListener("focus", syncAccountState);
  }

  function effortLabel(id) {
    const hit = EFFORTS.find((e) => e.id === id);
    return hit ? t(hit.key) : id;
  }

  function permissionIcon(kind) {
    const paths = {
      ask: '<path fill="none" stroke="currentColor" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round" d="M5.1 6.7V4.5a1 1 0 0 1 2 0v2.1m0-.8a1 1 0 0 1 2 0v1m0-.3a1 1 0 0 1 2 0v1m0-.1a1 1 0 0 1 2 0v2.2c0 2.5-1.7 4.2-4.2 4.2H7.1c-1.1 0-2.1-.5-2.8-1.4L2.9 9.3a1 1 0 0 1 1.7-1l.5.7V6.7Z"/>',
      auto: '<path fill="none" stroke="currentColor" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round" d="M8 1.8 13 3.7v3.8c0 3.1-2.1 5.8-5 6.7-2.9-.9-5-3.6-5-6.7V3.7L8 1.8Z"/><path fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" d="m5.8 8 1.5 1.5 3-3"/>',
      full: '<path fill="none" stroke="currentColor" stroke-width="1.25" stroke-linejoin="round" d="M8 1.8 13 3.7v3.8c0 3.1-2.1 5.8-5 6.7-2.9-.9-5-3.6-5-6.7V3.7L8 1.8Z"/><path fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" d="M8 5v3.2M8 10.7v.1"/>'
    };
    return `<svg viewBox="0 0 16 16" aria-hidden="true">${paths[kind] || paths.ask}</svg>`;
  }

  function composerIcon(kind) {
    const paths = {
      folder: '<path fill="none" stroke="currentColor" stroke-width="1.25" d="M1.8 4.2A1.7 1.7 0 0 1 3.5 2.5h2.2l1.4 1.6h5.4a1.7 1.7 0 0 1 1.7 1.7v5.7a1.7 1.7 0 0 1-1.7 1.7H3.5a1.7 1.7 0 0 1-1.7-1.7Z"/>',
      target: '<circle cx="8" cy="8" r="5.8" fill="none" stroke="currentColor" stroke-width="1.25"/><circle cx="8" cy="8" r="2" fill="none" stroke="currentColor" stroke-width="1.25"/><path d="m8 1.2.7 2M14.8 8l-2 .7M8 14.8l-.7-2M1.2 8l2-.7" fill="none" stroke="currentColor" stroke-width="1.1" stroke-linecap="round"/>',
      plan: '<path d="M8 1.7 9.4 6l4.1 1.5-4.1 1.4L8 13.3 6.6 8.9 2.5 7.5 6.6 6z" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linejoin="round"/>'
    };
    return `<svg viewBox="0 0 16 16" aria-hidden="true">${paths[kind] || paths.folder}</svg>`;
  }

  function effortIndex(id) {
    const index = EFFORTS.findIndex((item) => item.id === id);
    return index >= 0 ? index : 2;
  }

  function modelContextTokens(model) {
    const modelId = String(model?.modelId || "");
    const isCustom = (state.customModels || []).some((item) =>
      modelId === String(item.id || "") || modelId === String(item.model || "")
    );
    if (modelId === "grok-4.7" && !isCustom) return 500000;
    return Number(model?.contextWindow || model?._meta?.totalContextTokens || model?._meta?.contextWindowTokens || 0) || 0;
  }

  function currentModelContextTokens() {
    const model = modelOptions().find((item) => String(item.modelId || "") === String(state.model || ""));
    return model ? modelContextTokens(model) : 0;
  }

  function modelOptions() {
    const cat = Array.isArray(state.modelCatalog) ? state.modelCatalog : [];
    const ids = new Set(cat.map((m) => m.modelId));
    const extra = [...new Set(["grok-4.7", ...(state.models || [])])].filter((m) => !ids.has(m)).map((id) => ({ modelId: id, name: id }));
    const extraIds = new Set(extra.map((m) => m.modelId));
    const custom = (state.customModels || [])
      .map((item) => ({ modelId: String(item.id || item.model || "").trim(), name: item.name || item.id || item.model }))
      .filter((item) => item.modelId && !ids.has(item.modelId) && !extraIds.has(item.modelId));
    const options = [...cat, ...extra, ...custom];
    const latestIndex = options.findIndex((item) => item.modelId === "grok-4.7");
    if (latestIndex > 0) options.unshift(options.splice(latestIndex, 1)[0]);
    return options;
  }

  function currentProviderSource() {
    const model = String(state.model || "");
    if ((state.customModels || []).some((item) => model === String(item.id || "") || model === String(item.model || ""))) return "custom";
    const officialIds = new Set([
      ...(state.models || []).map((item) => String(item || "")),
      ...(state.modelCatalog || []).map((item) => String(item.modelId || "")),
    ]);
    if (officialIds.has(model)) return "official";
    return ["official", "custom", "unknown"].includes(state.providerSource) ? state.providerSource : "unknown";
  }

  function renderPermissionPick() {
    const current = PERMISSIONS.find((item) => item.id === state.permission) || PERMISSIONS[0];
    const label = $("permissionLabel");
    const trigger = $("permissionBtn");
    const triggerIcon = $("permissionTriggerIcon");
    const pop = $("permissionPop");
    if (label) label.textContent = t(current.key);
    if (triggerIcon) triggerIcon.innerHTML = permissionIcon(current.id);
    if (trigger) {
      trigger.dataset.perm = current.id;
      trigger.classList.toggle("is-full", current.id === "full");
      trigger.setAttribute("aria-label", t(current.key));
    }
    if (!pop) return;
    pop.innerHTML = `<div class="permission-pop-head"><b>${escapeHtml(t("permPromptTitle"))}</b></div>` + PERMISSIONS.map((item) => {
      const selected = item.id === current.id;
      return `<button type="button" class="permission-option permission-${item.id}" data-perm="${item.id}" aria-selected="${selected}">
        <span class="permission-option-icon">${permissionIcon(item.icon)}</span>
        <span class="permission-option-copy"><b>${escapeHtml(t(item.key))}</b><small>${escapeHtml(t(item.help))}</small></span>
      </button>`;
    }).join("");
  }

  function positionFloatingPop(pop, trigger, fallbackWidth, offsetX = 0) {
    if (!pop || !trigger || pop.hidden) return;
    const triggerRect = trigger.getBoundingClientRect();
    const viewportPadding = 12;
    const gap = 10;
    const maxWidth = Math.max(0, window.innerWidth - viewportPadding * 2);
    const width = Math.min(pop.getBoundingClientRect().width || fallbackWidth, maxWidth);
    const measuredHeight = Math.min(pop.getBoundingClientRect().height || 220, Math.max(0, window.innerHeight - viewportPadding * 2));
    const left = Math.max(
      viewportPadding,
      Math.min(window.innerWidth - width - viewportPadding, triggerRect.left + triggerRect.width / 2 - width / 2 + offsetX),
    );
    const roomAbove = triggerRect.top - gap;
    const roomBelow = window.innerHeight - triggerRect.bottom - gap;
    const placeAbove = roomAbove >= measuredHeight || roomAbove >= roomBelow;
    const top = placeAbove
      ? Math.max(viewportPadding, triggerRect.top - measuredHeight - gap)
      : Math.min(window.innerHeight - measuredHeight - viewportPadding, triggerRect.bottom + gap);
    pop.style.position = "fixed";
    pop.style.left = `${left}px`;
    pop.style.top = `${Math.max(viewportPadding, top)}px`;
    pop.style.bottom = "auto";
    pop.style.width = `${width}px`;
  }

  function positionPermissionPop() {
    positionFloatingPop($("permissionPop"), $("permissionBtn"), 320, 26);
  }

  function resetPermissionPopPosition() {
    const pop = $("permissionPop");
    if (!pop) return;
    pop.style.position = "";
    pop.style.left = "";
    pop.style.top = "";
    pop.style.bottom = "";
    pop.style.width = "";
  }

  function positionPickPop(pop, trigger) {
    positionFloatingPop(pop, trigger, pop?.id === "modelPop" ? 196 : 222);
  }

  function resetPickPopPosition(pop) {
    if (!pop) return;
    pop.style.position = "";
    pop.style.left = "";
    pop.style.top = "";
    pop.style.bottom = "";
    pop.style.width = "";
  }

  window.addEventListener("resize", () => {
    const pop = $("permissionPop");
    if (pop && !pop.hidden) positionPermissionPop();
    const modelPop = $("modelPop");
    const modelBtn = $("modelBtn");
    if (modelPop && modelBtn && !modelPop.hidden) positionPickPop(modelPop, modelBtn);
    const effortPop = $("effortPop");
    const effortBtn = $("effortBtn");
    if (effortPop && effortBtn && !effortPop.hidden) positionPickPop(effortPop, effortBtn);
  });

  function renderPicks() {
    const modelLabel = $("modelLabel");
    const effortLabelEl = $("effortLabel");
    const modelPop = $("modelPop");
    const effortPop = $("effortPop");
    if (modelLabel) modelLabel.textContent = state.model || "grok-4.7";
    if (effortLabelEl) effortLabelEl.textContent = effortLabel(state.effort);
    const combined = $("modelEffortControl");
    if (combined) {
      const ctx = currentModelContextTokens();
      combined.setAttribute("aria-label", `${t("model")} ${state.model || "grok-4.7"} · ${t("effort")} ${effortLabel(state.effort)}${ctx ? ` · ${t("ctxSize")} ${formatTokens(ctx)}` : ""}`);
      combined.title = ctx ? `${t("ctxSize")} ${formatTokens(ctx)}` : "";
    }
    if (!modelPop || !effortPop) return;
    modelPop.innerHTML = `<div class="picker-pop-title">${escapeHtml(t("model"))}</div>` + modelOptions().map((m) => {
      const sel = m.modelId === state.model;
      return `<button type="button" class="model-option" data-val="${escapeHtml(m.modelId)}" aria-selected="${sel}">
        <b>${escapeHtml(m.name || m.modelId)}</b>${sel ? '<span class="model-check" aria-hidden="true">✓</span>' : ""}
      </button>`;
    }).join("");
    const index = effortIndex(state.effort);
    const progress = EFFORTS.length > 1 ? index / (EFFORTS.length - 1) : 0;
    effortPop.innerHTML = `
      <div class="effort-pop-head">
        <div class="effort-pop-current">
          <span>${escapeHtml(t("effort"))}</span>
          <b id="effortValueLabel">${escapeHtml(effortLabel(state.effort))}</b>
        </div>
        <button type="button" class="effort-help-button" id="effortHelpButton" aria-label="${escapeHtml(t("effortHelpTitle"))}" aria-expanded="false" aria-controls="effortHelpNote">
          <svg viewBox="0 0 20 20" width="14" height="14" aria-hidden="true"><circle cx="10" cy="10" r="8" fill="none" stroke="currentColor" stroke-width="1.35"/><path d="M8.3 7.4a1.8 1.8 0 1 1 2.9 1.4c-.7.5-1.2.9-1.2 1.9m0 2.1v.1" fill="none" stroke="currentColor" stroke-width="1.35" stroke-linecap="round"/></svg>
        </button>
      </div>
      <p class="effort-help-note" id="effortHelpNote" hidden>${escapeHtml(t("effortHelp"))}</p>
      <label class="effort-slider" data-step="${index}" for="effortRange">
        <span class="effort-slider-labels" aria-hidden="true">
          <span class="effort-slider-label effort-slider-label-fast">${escapeHtml(t("effortFast"))}</span>
          <span class="effort-slider-label effort-slider-label-smart">${escapeHtml(t("effortSmart"))}</span>
        </span>
        <span class="effort-track" aria-hidden="true">
          <span class="effort-ticks">${EFFORTS.map(() => "<i></i>").join("")}</span>
          <span class="effort-thumb"></span>
        </span>
        <input id="effortRange" type="range" min="0" max="${EFFORTS.length - 1}" step="1" value="${index}" aria-label="${escapeHtml(t("effort"))}" aria-valuetext="${escapeHtml(effortLabel(state.effort))}">
      </label>`;
    const slider = effortPop.querySelector(".effort-slider");
    if (slider) {
      slider.dataset.step = String(index);
      slider.style.setProperty("--effort-progress", String(progress));
    }
    renderPermissionPick();
  }

  function updateEffortSlider() {
    const range = $("effortRange");
    const slider = range?.closest(".effort-slider");
    const index = effortIndex(state.effort);
    const progress = EFFORTS.length > 1 ? index / (EFFORTS.length - 1) : 0;
    if (range) {
      range.value = String(index);
      range.setAttribute("aria-valuetext", effortLabel(state.effort));
    }
    if (slider) {
      slider.dataset.step = String(index);
      slider.style.setProperty("--effort-progress", String(progress));
    }
    const effortPop = $("effortPop");
    const head = effortPop?.querySelector(".effort-pop-head b");
    if (head) {
      const nextLabel = effortLabel(state.effort);
      if (head.textContent !== nextLabel) {
        head.classList.remove("effort-label-transition");
        head.textContent = nextLabel;
        void head.offsetWidth;
        head.classList.add("effort-label-transition");
      } else {
        head.textContent = nextLabel;
      }
    }
    const label = $("effortLabel");
    if (label) label.textContent = effortLabel(state.effort);
  }

  function renderComposerMenu() {
    const menu = $("composerAddMenu");
    if (!menu) return;
    menu.innerHTML = `
      <div class="composer-add-title">${escapeHtml(t("composerAdd"))}</div>
      <input type="search" class="composer-add-search" data-composer-search autocomplete="off" placeholder="${escapeHtml(t("commandSearch"))}" aria-label="${escapeHtml(t("commandSearch"))}">
      <button type="button" role="menuitem" data-composer-action="plan" aria-pressed="${state.workMode === "plan"}">
        <span class="composer-add-icon">${composerIcon("plan")}</span>
        <span><b>${escapeHtml(t("workPlan"))}</b><small>${escapeHtml(t("composerPlanHelp"))}</small></span>
      </button>
      <button type="button" role="menuitem" data-composer-action="goal" aria-pressed="${state.workMode === "goal"}">
        <span class="composer-add-icon">${composerIcon("target")}</span>
        <span><b>${escapeHtml(t("workGoal"))}</b><small>${escapeHtml(t("composerGoalHelp"))}</small></span>
      </button>
      <div class="composer-add-divider" role="separator"></div>
      <button type="button" role="menuitem" data-composer-action="files">
        <span class="composer-add-icon">${composerIcon("folder")}</span>
        <span><b>${escapeHtml(t("composerFiles"))}</b><small>${escapeHtml(t("composerFilesHelp"))}</small></span>
      </button>
      <div class="composer-add-empty" data-composer-empty hidden>${escapeHtml(t("composerAddEmpty"))}</div>`;
  }

  function filterComposerMenu(query) {
    const menu = $("composerAddMenu");
    if (!menu) return;
    const normalized = String(query || "").trim().toLocaleLowerCase();
    let matches = 0;
    menu.querySelectorAll("[data-composer-action]").forEach((item) => {
      const visible = !normalized || item.textContent.toLocaleLowerCase().includes(normalized);
      item.hidden = !visible;
      if (visible) matches += 1;
    });
    const empty = menu.querySelector("[data-composer-empty]");
    if (empty) empty.hidden = matches > 0;
  }

  function renderWorkModeNotice() {
    const notice = $("workModeNotice");
    const copy = $("workModeNoticeText");
    const icon = $("workModeNoticeIcon");
    const close = $("workModeNoticeClose");
    if (!notice) return;
    const active = state.workMode === "plan" || state.workMode === "goal";
    const goal = state.workMode === "goal";
    notice.hidden = !active;
    notice.setAttribute("aria-hidden", String(!active));
    notice.dataset.workMode = active ? state.workMode : "";
    if (icon) icon.innerHTML = active ? composerIcon(goal ? "target" : "plan") : "";
    if (copy) copy.textContent = active ? t(goal ? "workGoal" : "workPlan") : "";
    if (close) {
      const label = t(goal ? "goalModeClose" : "planModeClose");
      close.title = label;
      close.setAttribute("aria-label", label);
    }
  }

  function updateComposerPlaceholder() {
    const empty = !state.transcript.length && !state.running;
    const modeKey = state.workMode === "plan" ? "composerPlanPlaceholder" : state.workMode === "goal" ? "composerGoalPlaceholder" : "";
    input.placeholder = modeKey ? t(modeKey) : t(empty ? "homeComposerPlaceholder" : "composerPlaceholder");
  }

  function closePicks() {
    const modelPop = $("modelPop");
    const effortPop = $("effortPop");
    const permissionPop = $("permissionPop");
    [modelPop, effortPop, permissionPop].forEach((pop) => {
      if (!pop) return;
      pop.hidden = true;
      pop.classList.remove("pick-pop-enter");
    });
    resetPickPopPosition(modelPop);
    resetPickPopPosition(effortPop);
    resetPermissionPopPosition();
    const addMenu = $("composerAddMenu");
    if (addMenu) addMenu.hidden = true;
    $("modelBtn")?.setAttribute("aria-expanded", "false");
    $("effortBtn")?.setAttribute("aria-expanded", "false");
    $("effortHelpButton")?.setAttribute("aria-expanded", "false");
    $("effortHelpNote")?.setAttribute("hidden", "");
    $("permissionBtn")?.setAttribute("aria-expanded", "false");
    $("attachBtn")?.setAttribute("aria-expanded", "false");
  }

  function openPick(which) {
    const pop = which === "effort" ? $("effortPop") : $("modelPop");
    const other = which === "effort" ? $("modelPop") : $("effortPop");
    const button = which === "effort" ? $("effortBtn") : $("modelBtn");
    const otherButton = which === "effort" ? $("modelBtn") : $("effortBtn");
    if (!pop || !other) return;
    closeComposerMenu();
    const permissionPop = $("permissionPop");
    if (permissionPop) permissionPop.hidden = true;
    $("permissionBtn")?.setAttribute("aria-expanded", "false");
    other.hidden = true;
    other.classList.remove("pick-pop-enter");
    otherButton?.setAttribute("aria-expanded", "false");
    const opening = pop.hidden;
    pop.hidden = !opening;
    button?.setAttribute("aria-expanded", String(opening));
    if (opening) {
      positionPickPop(pop, button);
      pop.classList.remove("pick-pop-enter");
      void pop.offsetWidth;
      pop.classList.add("pick-pop-enter");
    } else {
      resetPickPopPosition(pop);
      pop.classList.remove("pick-pop-enter");
    }
  }

  function applyPaneWidths() {
    const app = $("app");
    const sb = Number(localStorage.getItem("grok-webui-sb")) || 268;
    const pv = Number(localStorage.getItem("grok-webui-pv")) || 320;
    if (!state.sidebarCollapsed) app.style.setProperty("--sidebar-w", Math.max(200, Math.min(420, sb)) + "px");
    else app.style.setProperty("--sidebar-w", "56px");
    app.style.setProperty("--preview-w", Math.max(220, Math.min(480, pv)) + "px");
  }

  function persist(extra) {
    state.settings = normalizeSettings(state.settings);
    writeSettingsStorage(state.settings);
    return api("/api/state", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        cwd: state.cwd,
        permission: state.permission,
        workMode: state.workMode,
        workStyle: state.workStyle,
        effort: state.effort,
        model: state.model,
        theme: state.theme,
        lang: state.lang,
        showThinking: state.showThinking,
        settings: state.settings,
        previewOpen: state.previewOpen,
        closeAction: state.closeAction || "tray",
        sessionId: state.sessionId,
        ...(extra || {})
      })
    }).catch(() => {});
  }

  function currentSessionTitle() {
    if (state.sessionTitle) return state.sessionTitle;
    const hit = sessionCache.find((s) => s.id === state.sessionId);
    if (hit && hit.title) return hit.title;
    return t("newChat");
  }

  function workLabel(m) {
    return { agent: t("workAgent"), plan: t("workPlan"), goal: t("workGoal") }[m] || m;
  }

  function permLabel(p) {
    return { ask: t("permAsk"), auto: t("permAuto"), full: t("permFull") }[p] || p;
  }

  function fmtCost(usd) {
    if (!usd) return "";
    return "$" + (usd < 0.01 ? usd.toFixed(4) : usd.toFixed(2));
  }

  function renderContextUsage() {
    const indicator = $("contextUsage");
    if (!indicator) return;
    const usage = state.contextUsage;
    const used = Number(usage && usage.contextTokensUsed);
    const limit = Number(usage && usage.contextWindowTokens);
    if (!state.sessionId || !Number.isFinite(used) || used < 0 || !Number.isFinite(limit) || limit <= 0) {
      indicator.hidden = true;
      return;
    }
    const percent = Math.max(0, Math.min(100, Math.round((used / limit) * 100)));
    const remaining = 100 - percent;
    const modelSpec = state.model === "grok-4.7" && currentProviderSource() === "official" ? `\n${t("ctxModelWindow")}` : "";
    const details = `${t("ctxUsage")} · ${percent}% ${t("ctxUsed")}（${t("ctxRemaining")} ${remaining}%）\n${t("ctxRuntimeWindow")}：${formatTokens(used)} / ${formatTokens(limit)} ${t("ctxUnit")}${modelSpec}`;
    indicator.querySelector(".context-usage-percent").textContent = `${percent}%`;
    indicator.querySelector(".context-usage-progress").setAttribute("stroke-dasharray", `${percent} ${100 - percent}`);
    indicator.querySelector(".context-usage-tooltip").textContent = details;
    indicator.setAttribute("aria-label", details.replace("\n", " "));
    indicator.hidden = false;
  }

  async function refreshContextUsage(sessionId = state.sessionId) {
    const revision = ++contextUsageRevision;
    if (sessionId !== state.sessionId) return;
    state.contextUsage = null;
    renderContextUsage();
    if (!sessionId) return;
    try {
      const usage = await api(`/api/usage/session/${encodeURIComponent(sessionId)}`);
      if (revision !== contextUsageRevision || sessionId !== state.sessionId) return;
      const used = Number(usage && usage.contextTokensUsed);
      const limit = Number(usage && usage.contextWindowTokens);
      state.contextUsage = Number.isFinite(used) && used >= 0 && Number.isFinite(limit) && limit > 0
        ? { contextTokensUsed: used, contextWindowTokens: limit }
        : null;
    } catch {
      if (revision !== contextUsageRevision || sessionId !== state.sessionId) return;
      state.contextUsage = null;
    }
    renderContextUsage();
  }

  function renderLiveMeta() {
    $("sessionTitle").textContent = currentSessionTitle();
    const pill = $("folderPillName");
    if (pill) pill.textContent = workspaceName(state.cwd);
    renderContextUsage();
  }

  function renderTodoDock() {
    const dock = $("todoDock");
    const body = $("todoDockBody");
    if (!state.todos.length) {
      dock.hidden = true;
      dock.classList.remove("open");
      return;
    }
    const done = state.todos.filter((x) => x.status === "completed").length;
    const total = state.todos.length;
    const allDone = done === total;
    const todoStatus = allDone ? "completed" : (state.running ? "running" : "paused");
    const changedFiles = todoChangedFiles();
    const added = changedFiles.reduce((sum, item) => sum + item.added, 0);
    const removed = changedFiles.reduce((sum, item) => sum + item.removed, 0);
    const stepLabel = (allDone ? t("todoStepComplete") : t("todoStepProgress"))
      .replace("{done}", String(done))
      .replace("{total}", String(total));
    $("todoDockLabel").innerHTML = `
      <span class="todo-status ${todoStatus}" aria-hidden="true">
        <svg viewBox="0 0 18 18"><circle cx="9" cy="9" r="6.2" fill="none" stroke="currentColor" stroke-width="2" pathLength="100" stroke-dasharray="72 28"/><path class="todo-check" d="m5.6 9.2 2.1 2.1 4.8-4.8" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>
      </span>
      <span class="todo-step-label">${escapeHtml(stepLabel)}</span>
      ${changedFiles.length ? `<span class="todo-stat-divider" aria-hidden="true">·</span><span class="todo-file-count">${escapeHtml(t("todoFilesChanged").replace("{count}", String(changedFiles.length)))}</span>` : ""}
      ${added ? `<span class="todo-lines added">${escapeHtml(t("todoAdded").replace("{count}", String(added)))}</span>` : ""}
      ${removed ? `<span class="todo-lines removed">${escapeHtml(t("todoRemoved").replace("{count}", String(removed)))}</span>` : ""}`;
    dock.hidden = false;
    dock.classList.toggle("open", state.todoDockOpen);
    $("todoDockToggle").setAttribute("aria-expanded", state.todoDockOpen ? "true" : "false");
    body.innerHTML = `<div class="todo-task-list">${state.todos.map((item) =>
      `<div class="todo-row ${escapeHtml(item.status || "pending")}"><i class="box-mark" aria-hidden="true"></i><span>${escapeHtml(item.content)}</span></div>`
    ).join("")}</div>${changedFiles.length ? `<div class="todo-file-list">${changedFiles.map((item) => `
      <div class="todo-file-row"><span class="todo-file-name" title="${escapeHtml(item.path)}">${escapeHtml(fileName(item.path))}</span>
      <span class="todo-file-lines">${item.added ? `<b class="added">${escapeHtml(t("todoAdded").replace("{count}", String(item.added)))}</b>` : ""}${item.removed ? `<b class="removed">${escapeHtml(t("todoRemoved").replace("{count}", String(item.removed)))}</b>` : ""}</span></div>`).join("")}</div>` : ""}`;
  }

  function fileName(path) {
    return String(path || "").split(/[\\/]/).pop() || String(path || "");
  }

  function todoChangedFiles() {
    const stats = state.turnFileStats && state.turnFileStats.files;
    if (stats instanceof Map && stats.size) {
      return [...stats.entries()].map(([path, value]) => ({
        path,
        added: Number(value && value.added) || 0,
        removed: Number(value && value.removed) || 0
      }));
    }
    return state.files
      .filter((item) => item && !["read", "search"].includes(item.action))
      .map((item) => ({
        path: item.path,
        added: Number(item.added) || 0,
        removed: Number(item.removed) || 0
      }));
  }

  function renderPreview() {
    const body = $("previewBody");
    if (!body) return;
    const tab = state.previewTab;
    if (tab === "todos") {
      if (!state.todos.length) { body.innerHTML = `<div class="preview-empty">${escapeHtml(t("noPreviewTodos"))}</div>`; return; }
      body.innerHTML = state.todos.map((item) =>
        `<div class="todo ${escapeHtml(item.status || "pending")}"><span class="mark"></span><div><span>${escapeHtml(item.content)}</span></div></div>`
      ).join("");
      return;
    }
    if (tab === "plan") {
      body.innerHTML = state.plan
        ? `<div class="md">${renderMarkdown(state.plan)}</div>`
        : `<div class="preview-empty">${escapeHtml(t("noPreviewPlan"))}</div>`;
      return;
    }
    if (tab === "files") {
      body.innerHTML = state.files.length
        ? state.files.map((f) => `<div class="file-row"><b>${escapeHtml(f.path)}</b><small>${escapeHtml(f.action || "")}</small></div>`).join("")
        : `<div class="preview-empty">${escapeHtml(t("noPreviewFiles"))}</div>`;
      return;
    }
    const rewind = state.rewind || [];
    if (!rewind.length) { body.innerHTML = `<div class="preview-empty">${escapeHtml(t("noPreviewBranch"))}</div>`; return; }
    body.innerHTML = rewind.map((r) =>
      `<button type="button" class="branch-row" data-index="${r.index}"><b>#${r.index}</b><small>${escapeHtml(r.preview || "")}</small></button>`
    ).join("");
    body.querySelectorAll(".branch-row").forEach((btn) => {
      btn.onclick = () => rewindTo(Number(btn.dataset.index));
    });
  }

  function applyPreview(data) {
    if (!data) return;
    if (Array.isArray(data.todos)) state.todos = data.todos;
    if (typeof data.plan === "string") state.plan = data.plan;
    if (Array.isArray(data.files)) state.files = data.files;
    if (Array.isArray(data.rewind)) state.rewind = data.rewind;
    if (data.parentId) state.parentId = data.parentId;
    if (data.title) state.sessionTitle = data.title;
    renderPreview();
    renderTodoDock();
    renderLiveMeta();
  }

  function paintActiveSession() {
    $("sessions").querySelectorAll(".session").forEach((el) => {
      el.classList.toggle("active", el.dataset.id === state.sessionId);
    });
  }

  function groupedSessions() {
    const q = state.sessionQuery.trim().toLowerCase();
    const rows = q
      ? sessionCache.filter((s) => `${s.title || ""} ${s.cwd || ""}`.toLowerCase().includes(q))
      : sessionCache;
    const groups = new Map();
    const current = normalizePath(state.cwd);
    rows.forEach((s) => {
      const key = normalizePath(s.cwd || "") || "__none__";
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(s);
    });
    const keys = [...groups.keys()].sort((a, b) => {
      if (a === current) return -1;
      if (b === current) return 1;
      return workspaceName(a).localeCompare(workspaceName(b), state.lang);
    });
    return keys.map((key, i) => ({
      key,
      name: workspaceName(key === "__none__" ? "" : key),
      items: groups.get(key),
      current: key === current || i === 0
    }));
  }

  function normalizePath(p) {
    return String(p || "").replace(/[\\/]+$/, "").toLowerCase();
  }

  function renderSessions() {
    const box = $("sessions");
    if (!sessionCache.length) {
      box.innerHTML = `<p class="hint" style="padding:8px">${escapeHtml(t("noChats"))}</p>`;
      return;
    }
    const rows = (items) => items.map((s) => {
      const active = s.id === state.sessionId ? " active" : "";
      const pinned = pinnedSessions.has(s.id);
      const running = state.running && s.id === state.turnSessionId;
      return `<div class="session${active}${running ? " running" : ""}" data-id="${escapeHtml(s.id)}" data-cwd="${escapeHtml(s.cwd || "")}">
        <span class="t">${escapeHtml(s.title || t("newChat"))}</span>
        <span class="m">${escapeHtml(relTime(s.updated))}</span>
        <button type="button" class="pin" data-act="pin" title="${escapeHtml(t(pinned ? "unpinSession" : "pinSession"))}" aria-label="${escapeHtml(t(pinned ? "unpinSession" : "pinSession"))}"><svg viewBox="0 0 16 16" aria-hidden="true"><path d="m10.8 1.8 3.4 3.4-2.1 1.2-.7 3.5-2.5-2.5-4.1 4.1-.7-.7 4.1-4.1-2.5-2.5 3.5-.7z" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linejoin="round"/></svg></button>
        <button type="button" class="more" data-act="menu" title="${escapeHtml(t("moreActions"))}">⋯</button>
        ${running ? `<span class="session-running" role="img" aria-label="${escapeHtml(t("stRun"))}"></span>` : ""}
      </div>`;
    }).join("");
    const section = (name, content) => `<section class="session-section"><h2>${escapeHtml(name)}</h2>${content}</section>`;
    const pinned = sessionCache.filter((s) => pinnedSessions.has(s.id));
    const projects = groupedSessions().map((g) => ({ ...g, items: g.items.filter((s) => !pinnedSessions.has(s.id)) })).filter((g) => g.key !== "__none__" && g.items.length);
    const recent = sessionCache.filter((s) => !pinnedSessions.has(s.id) && !normalizePath(s.cwd));
    const projectBlocks = projects.map((g, index) => {
      const key = `project:${g.key}`;
      const hasActive = g.items.some((s) => s.id === state.sessionId);
      const open = hasActive || g.current || index === 0 || showAllGroups.has(key) || projects.length === 1;
      const limit = showAllGroups.has(key + ":all") ? g.items.length : 6;
      const visible = open ? g.items.slice(0, limit) : [];
      const rest = open ? Math.max(0, g.items.length - visible.length) : 0;
      return `<section class="ws-group project-group" data-group="${escapeHtml(key)}"><button type="button" class="ws-group-head" data-act="toggle-group"><svg viewBox="0 0 16 16" aria-hidden="true"><path d="M1.7 4.5A1.5 1.5 0 0 1 3.2 3h3l1.5 1.6h5.1a1.5 1.5 0 0 1 1.5 1.5v5.3a1.5 1.5 0 0 1-1.5 1.5H3.2a1.5 1.5 0 0 1-1.5-1.5z" fill="none" stroke="currentColor" stroke-width="1.2"/></svg><span>${escapeHtml(g.name)}</span><span class="n">${g.items.length}</span></button>${open ? rows(visible) : ""}${rest ? `<button type="button" class="expand-rest" data-act="expand-group">${escapeHtml(t("expandRest").replace("{n}", String(rest)))}</button>` : ""}</section>`;
    }).join("");
    box.innerHTML = section(t("pinnedSessions"), rows(pinned)) + section(t("projects"), projectBlocks) + section(t("recentSessions"), rows(recent));
  }

  function toggleSessionPin(id) {
    if (pinnedSessions.has(id)) pinnedSessions.delete(id);
    else pinnedSessions.add(id);
    localStorage.setItem("grok-webui-pinned-sessions", JSON.stringify([...pinnedSessions]));
    renderSessions();
  }

  function bindSessionList() {
    const box = $("sessions");
    box.addEventListener("click", (ev) => {
      const actEl = ev.target.closest("[data-act]");
      const act = actEl && actEl.dataset ? actEl.dataset.act : "";
      if (act === "toggle-group") {
        const group = ev.target.closest(".ws-group");
        if (!group) return;
        const key = group.dataset.group;
        if (showAllGroups.has(key)) showAllGroups.delete(key);
        else showAllGroups.add(key);
        renderSessions();
        return;
      }
      if (act === "expand-group") {
        const group = ev.target.closest(".ws-group");
        if (!group) return;
        showAllGroups.add(group.dataset.group);
        showAllGroups.add(group.dataset.group + ":all");
        renderSessions();
        return;
      }
      const row = ev.target.closest(".session");
      if (!row) return;
      if (act === "pin") {
        ev.stopPropagation();
        toggleSessionPin(row.dataset.id);
        return;
      }
      if (act === "menu") {
        ev.stopPropagation();
        openSessionMenu(row.dataset.id, ev.clientX, ev.clientY);
        return;
      }
      if (row.dataset.id === state.sessionId) {
        leaveCurrentAppNavigation();
        return;
      }
      loadSession(row.dataset.id, row.dataset.cwd);
    });
  }

  function openSessionMenu(id, x, y) {
    const menu = $("sessionMenu");
    menu.hidden = false;
    menu.dataset.id = id;
    const w = 160;
    const left = Math.min(x, window.innerWidth - w - 8);
    const top = Math.min(y, window.innerHeight - 120);
    menu.style.left = `${left}px`;
    menu.style.top = `${top}px`;
  }

  function hideSessionMenu() {
    $("sessionMenu").hidden = true;
  }

  async function refreshSessions(force) {
    if (!force && !listDirty && sessionCache.length) {
      paintActiveSession();
      return;
    }
    const data = await api("/api/sessions");
    sessionCache = data.sessions || [];
    listDirty = false;
    renderSessions();
    if (!state.transcript.length && !state.running) renderThread();
  }

  function setHint(text) { $("composerHint").textContent = text || (t("hint") + " · " + t("pasteHint")); }

  function setSendBusy(busy) {
    const active = !!busy;
    if (!sendBtn) return;
    sendBtn.disabled = false;
    sendBtn.classList.toggle("is-busy", active);
    sendBtn.setAttribute("aria-busy", String(active));
    const label = t(active ? "stop" : "send");
    sendBtn.title = label;
    sendBtn.setAttribute("aria-label", label);
    renderVoiceButton();
  }

  function toast(msg) {
    let el = $("toast");
    if (!el) {
      el = document.createElement("div");
      el.id = "toast";
      el.className = "toast";
      document.body.appendChild(el);
    }
    el.textContent = msg;
    el.classList.add("show");
    clearTimeout(el._timer);
    el._timer = setTimeout(() => el.classList.remove("show"), 2600);
  }

  function renderVoiceButton() {
    const button = $("voiceBtn");
    if (!button) return;
    const key = voicePhase === "recording" ? "voiceStop" : voicePhase === "processing" ? "voiceProcessing" : voicePhase === "starting" ? "voiceStarting" : "voiceStart";
    const disabled = state.running || voicePhase === "starting" || voicePhase === "processing";
    button.disabled = disabled;
    button.title = t(key);
    button.setAttribute("aria-label", t(key));
    button.setAttribute("aria-pressed", String(voicePhase === "recording"));
    button.setAttribute("aria-busy", String(voicePhase === "starting" || voicePhase === "processing"));
    button.classList.toggle("is-recording", voicePhase === "recording");
    button.classList.toggle("is-processing", voicePhase === "processing" || voicePhase === "starting");
  }

  function voiceHotkeyFromEvent(event) {
    if (event.key === "Control") return event.ctrlKey && !event.altKey && !event.shiftKey && !event.metaKey ? "Ctrl" : "";
    if (event.key === "Alt") return event.altKey && !event.ctrlKey && !event.shiftKey && !event.metaKey ? "Alt" : "";
    const modifiers = [];
    if (event.ctrlKey) modifiers.push("Ctrl");
    if (event.altKey) modifiers.push("Alt");
    if (event.shiftKey) modifiers.push("Shift");
    if (event.metaKey) modifiers.push("Meta");
    if (["Control", "Alt", "Shift", "Meta"].includes(event.key) || !modifiers.length) return "";
    const key = event.key === " " ? "Space" : event.key.length === 1 ? event.key.toUpperCase() : event.key;
    return [...modifiers, key].join("+");
  }

  function voiceHotkeyPartFromEvent(event) {
    const modifiers = { Control: "Ctrl", Alt: "Alt", Shift: "Shift", Meta: "Meta" };
    if (modifiers[event.key]) return modifiers[event.key];
    return event.key === " " ? "Space" : event.key.length === 1 ? event.key.toUpperCase() : event.key;
  }

  function saveVoiceHotkey(shortcut) {
    state.settings.voiceHotkey = shortcut;
    voiceHotkeyCapturing = false;
    voiceHotkeyPendingModifier = "";
    persist();
    renderVoiceHotkeyControls($("settingsBody"));
    toast(t("voiceHotkeySaved"));
  }

  function renderVoiceHotkeyControls(root) {
    const value = root?.querySelector("#voiceHotkeyValue");
    const button = root?.querySelector("#voiceHotkeyCapture");
    if (!value || !button) return;
    value.textContent = voiceHotkeyCapturing ? t("voiceHotkeyPress") : state.settings.voiceHotkey || t("voiceHotkeyUnset");
    button.textContent = voiceHotkeyCapturing ? t("voiceHotkeyCancel") : state.settings.voiceHotkey ? t("voiceHotkeyChange") : t("voiceHotkeySet");
    button.classList.toggle("is-capturing", voiceHotkeyCapturing);
  }

  function voiceKeytermsHeader(terms) {
    const bytes = new TextEncoder().encode(JSON.stringify(terms));
    return btoa(Array.from(bytes, (byte) => String.fromCharCode(byte)).join(""));
  }

  function renderVoiceDictionary(root) {
    const list = root?.querySelector("#voiceDictionaryList");
    if (!list) return;
    const terms = state.settings.voiceDictionary;
    list.innerHTML = terms.length ? terms.map((term, index) => `
      <div class="voice-dictionary-item">
        <input type="text" maxlength="50" data-voice-dictionary-index="${index}" value="${escapeHtml(term)}" aria-label="${escapeHtml(t("voiceDictionaryPlaceholder"))}">
        <button type="button" class="voice-dictionary-remove" data-voice-dictionary-remove="${index}" aria-label="${escapeHtml(t("voiceDictionaryRemove"))}" title="${escapeHtml(t("voiceDictionaryRemove"))}">×</button>
      </div>`).join("") : `<div class="voice-dictionary-empty">${escapeHtml(t("voiceDictionaryEmpty"))}</div>`;
    list.querySelectorAll("[data-voice-dictionary-index]").forEach((field) => {
      field.addEventListener("change", () => {
        const index = Number(field.dataset.voiceDictionaryIndex);
        const updated = [...state.settings.voiceDictionary];
        updated[index] = field.value.trim().slice(0, 50);
        state.settings.voiceDictionary = updated.filter(Boolean);
        persist();
        renderVoiceDictionary(root);
      });
    });
    list.querySelectorAll("[data-voice-dictionary-remove]").forEach((button) => {
      button.addEventListener("click", () => {
        const index = Number(button.dataset.voiceDictionaryRemove);
        state.settings.voiceDictionary = state.settings.voiceDictionary.filter((_, itemIndex) => itemIndex !== index);
        persist();
        renderVoiceDictionary(root);
      });
    });
    const input = root.querySelector("#voiceDictionaryNew");
    const add = root.querySelector("#voiceDictionaryAdd");
    if (!input || !add) return;
    add.disabled = terms.length >= 100;
    add.onclick = () => {
      const term = input.value.trim().slice(0, 50);
      if (!term) return;
      if (state.settings.voiceDictionary.some((item) => item.toLocaleLowerCase() === term.toLocaleLowerCase())) {
        toast(t("voiceDictionaryDuplicate"));
        return;
      }
      if (state.settings.voiceDictionary.length >= 100) {
        toast(t("voiceDictionaryLimit"));
        return;
      }
      state.settings.voiceDictionary = [...state.settings.voiceDictionary, term];
      persist();
      input.value = "";
      renderVoiceDictionary(root);
      input.focus();
    };
    input.onkeydown = (event) => {
      if (event.key === "Enter") { event.preventDefault(); add.click(); }
    };
  }

  function voiceDeviceOptions(devices, kind, selectedId) {
    const options = [{ value: "", label: t("voiceDeviceDefault") }];
    const seen = new Set();
    devices.forEach((device, index) => {
      if (!device.deviceId || seen.has(device.deviceId)) return;
      seen.add(device.deviceId);
      const fallback = kind === "audioinput" ? "voiceInputDeviceOption" : "voiceOutputDeviceOption";
      options.push({ value: device.deviceId, label: device.label || t(fallback).replace("{number}", String(index + 1)) });
    });
    if (selectedId && !seen.has(selectedId)) options.push({ value: selectedId, label: t("voiceDeviceSaved") });
    return options;
  }

  function renderVoiceDeviceControls(root) {
    if (!root) return;
    renderCSelect(root.querySelector("#voiceInputDeviceSelect"), {
      value: state.settings.voiceInputDeviceId,
      options: voiceDeviceOptions(voiceDevices.inputs, "audioinput", state.settings.voiceInputDeviceId),
      onChange: (value) => { state.settings.voiceInputDeviceId = value; persist(); }
    });
    renderCSelect(root.querySelector("#voiceOutputDeviceSelect"), {
      value: state.settings.voiceOutputDeviceId,
      options: voiceDeviceOptions(voiceDevices.outputs, "audiooutput", state.settings.voiceOutputDeviceId),
      onChange: (value) => { state.settings.voiceOutputDeviceId = value; persist(); }
    });
    renderCSelect(root.querySelector("#voiceRecognitionLanguageSelect"), {
      value: state.settings.voiceRecognitionLanguage,
      options: [
        { value: "app", label: t("voiceLanguageApp") },
        { value: "auto", label: t("voiceLanguageAuto") },
        { value: "zh", label: t("voiceLanguageZh") },
        { value: "en", label: t("voiceLanguageEn") },
        { value: "ja", label: t("voiceLanguageJa") },
        { value: "de", label: t("voiceLanguageDe") },
        { value: "fr", label: t("voiceLanguageFr") },
        { value: "es", label: t("voiceLanguageEs") },
        { value: "ko", label: t("voiceLanguageKo") }
      ],
      onChange: (value) => { state.settings.voiceRecognitionLanguage = value; persist(); }
    });
  }

  async function refreshVoiceDevices(requestPermission = false) {
    const mediaDevices = navigator.mediaDevices;
    if (!mediaDevices?.enumerateDevices) {
      if (requestPermission) toast(t("voiceUnsupported"));
      return;
    }
    let stream;
    try {
      if (requestPermission) {
        if (!mediaDevices.getUserMedia) throw new Error("microphone unavailable");
        stream = await mediaDevices.getUserMedia({ audio: true });
      }
      const devices = await mediaDevices.enumerateDevices();
      voiceDevices.inputs = devices.filter((device) => device.kind === "audioinput");
      voiceDevices.outputs = devices.filter((device) => device.kind === "audiooutput");
      if (requestPermission && state.settings.voiceInputDeviceId && !voiceDevices.inputs.some((device) => device.deviceId === state.settings.voiceInputDeviceId)) {
        state.settings.voiceInputDeviceId = "";
        persist();
      }
      renderVoiceDeviceControls($("settingsBody"));
    } catch (error) {
      if (requestPermission) {
        const key = error?.name === "NotAllowedError" || error?.name === "SecurityError" ? "voicePermissionDenied" : error?.name === "NotFoundError" || error?.name === "DevicesNotFoundError" ? "voiceNoMicrophone" : "voiceFailed";
        toast(t(key));
      }
    } finally {
      stream?.getTracks().forEach((track) => track.stop());
    }
  }

  async function chooseVoiceOutputDevice() {
    const choose = navigator.mediaDevices?.selectAudioOutput;
    if (typeof choose !== "function") {
      await refreshVoiceDevices(false);
      toast(t("voiceOutputSelectionUnsupported"));
      return;
    }
    try {
      const device = await choose.call(navigator.mediaDevices);
      if (!device?.deviceId) return;
      if (!voiceDevices.outputs.some((item) => item.deviceId === device.deviceId)) voiceDevices.outputs.push(device);
      state.settings.voiceOutputDeviceId = device.deviceId;
      persist();
      renderVoiceDeviceControls($("settingsBody"));
    } catch (error) {
      if (error?.name !== "AbortError") toast(t("voiceFailed"));
    }
  }

  async function testVoiceOutput() {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) { toast(t("voiceOutputTestUnsupported")); return; }
    const audio = new Audio();
    const selectedId = state.settings.voiceOutputDeviceId;
    if (selectedId && typeof audio.setSinkId !== "function") { toast(t("voiceOutputTestUnsupported")); return; }
    let context;
    let oscillator;
    try {
      context = new AudioContextClass();
      if (context.state === "suspended") await context.resume();
      const destination = context.createMediaStreamDestination();
      if (selectedId) await audio.setSinkId(selectedId);
      audio.srcObject = destination.stream;
      oscillator = context.createOscillator();
      const gain = context.createGain();
      const now = context.currentTime;
      oscillator.frequency.value = 660;
      gain.gain.setValueAtTime(0.035, now);
      gain.gain.setTargetAtTime(0.0001, now + 0.2, 0.03);
      oscillator.connect(gain).connect(destination);
      await audio.play();
      oscillator.start(now);
      oscillator.stop(now + 0.38);
      window.setTimeout(() => {
        audio.pause();
        audio.srcObject = null;
        destination.stream.getTracks().forEach((track) => track.stop());
        context?.close().catch(() => {});
      }, 500);
    } catch {
      oscillator?.disconnect();
      audio.pause();
      audio.srcObject = null;
      context?.close().catch(() => {});
      toast(t("voiceOutputTestFailed"));
    }
  }

  function closeVoiceCapture(capture) {
    if (!capture) return;
    clearTimeout(capture.timer);
    if (capture.processor) capture.processor.onaudioprocess = null;
    [capture.source, capture.processor, capture.silence].forEach((node) => {
      try { node?.disconnect(); } catch {}
    });
    capture.stream?.getTracks().forEach((track) => track.stop());
    if (capture.context && capture.context.state !== "closed") capture.context.close().catch(() => {});
  }

  function voiceChunksToPcm(chunks, sampleRate) {
    const inputLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
    const outputLength = Math.floor(inputLength * 16000 / sampleRate);
    const output = new ArrayBuffer(outputLength * 2);
    const view = new DataView(output);
    const source = new Float32Array(inputLength);
    let cursor = 0;
    chunks.forEach((chunk) => { source.set(chunk, cursor); cursor += chunk.length; });
    for (let i = 0; i < outputLength; i += 1) {
      const position = i * sampleRate / 16000;
      const left = Math.floor(position);
      const fraction = position - left;
      const sample = Math.max(-1, Math.min(1, source[left] * (1 - fraction) + (source[left + 1] || 0) * fraction));
      view.setInt16(i * 2, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true);
    }
    return output;
  }

  function insertVoiceText(text, capture) {
    const current = input.value;
    const unchanged = current === capture.selection.value;
    const start = unchanged ? capture.selection.start : current.length;
    const end = unchanged ? capture.selection.end : current.length;
    const before = current.slice(0, start);
    const after = current.slice(end);
    let insertion = text;
    if (/[A-Za-z0-9]$/.test(before) && /^[A-Za-z0-9]/.test(insertion)) insertion = ` ${insertion}`;
    if (/[A-Za-z0-9]$/.test(insertion) && /^[A-Za-z0-9]/.test(after)) insertion += " ";
    input.setRangeText(insertion, start, end, "end");
    input.dispatchEvent(new Event("input", { bubbles: true }));
    input.focus();
  }

  async function stopVoiceRecording(limitReached = false) {
    if (voicePhase !== "recording" || !voiceCapture) return;
    const capture = voiceCapture;
    voiceCapture = null;
    voicePhase = "processing";
    renderVoiceButton();
    setHint(t(limitReached ? "voiceLimitReached" : "voiceProcessing"));
    closeVoiceCapture(capture);
    try {
      const pcm = voiceChunksToPcm(capture.chunks, capture.context.sampleRate);
      if (!pcm.byteLength) throw new Error(t("voiceNoSpeech"));
      const response = await fetch("/api/voice/transcribe", {
        method: "POST",
        headers: {
          "Content-Type": "application/octet-stream",
          "X-Voice-Language": capture.language,
          ...(capture.keyterms.length ? { "X-Voice-Keyterms": voiceKeytermsHeader(capture.keyterms) } : {})
        },
        body: pcm
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || !result.ok) throw new Error(result.error || "voice recognition failed");
      const text = String(result.text || "").trim();
      if (!text) {
        toast(t("voiceNoSpeech"));
      } else {
        insertVoiceText(text, capture);
        toast(t("voiceInserted"));
      }
      setHint(t("hint") + " · " + t("pasteHint"));
    } catch (error) {
      const message = error?.message && error.message !== "voice recognition failed" && error.message !== "Failed to fetch" ? error.message : t("voiceFailed");
      setHint(message);
      toast(message);
    } finally {
      voicePhase = "idle";
      renderVoiceButton();
    }
  }

  async function startVoiceRecording(fromHotkey = false) {
    if (state.running || voicePhase !== "idle") return;
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!navigator.mediaDevices?.getUserMedia || !AudioContextClass) {
      toast(t("voiceUnsupported"));
      return;
    }
    voicePhase = "starting";
    renderVoiceButton();
    let stream;
    let context;
    try {
      const audioConstraints = { channelCount: 1, echoCancellation: true, noiseSuppression: true, autoGainControl: true };
      if (state.settings.voiceInputDeviceId) audioConstraints.deviceId = { exact: state.settings.voiceInputDeviceId };
      stream = await navigator.mediaDevices.getUserMedia({ audio: audioConstraints });
      context = new AudioContextClass();
      if (context.state === "suspended") await context.resume();
      const source = context.createMediaStreamSource(stream);
      const processor = context.createScriptProcessor(4096, 1, 1);
      const silence = context.createGain();
      silence.gain.value = 0;
      const capture = {
        stream,
        context,
        source,
        processor,
        silence,
        chunks: [],
        selection: { value: input.value, start: input.selectionStart, end: input.selectionEnd },
        language: state.settings.voiceRecognitionLanguage === "app" ? state.lang.split("-")[0].toLowerCase() : state.settings.voiceRecognitionLanguage,
        keyterms: [...state.settings.voiceDictionary],
        timer: null
      };
      processor.onaudioprocess = (event) => {
        if (voicePhase === "recording") capture.chunks.push(new Float32Array(event.inputBuffer.getChannelData(0)));
      };
      source.connect(processor);
      processor.connect(silence);
      silence.connect(context.destination);
      voiceCapture = capture;
      voicePhase = "recording";
      capture.timer = setTimeout(() => stopVoiceRecording(true), 180_000);
      renderVoiceButton();
      setHint(t("voiceRecording"));
      toast(t("voiceRecording"));
      if (fromHotkey && !voiceHotkeyPressActive) stopVoiceRecording();
    } catch (error) {
      stream?.getTracks().forEach((track) => track.stop());
      if (context && context.state !== "closed") context.close().catch(() => {});
      voicePhase = "idle";
      renderVoiceButton();
      const key = error?.name === "NotAllowedError" || error?.name === "SecurityError" ? "voicePermissionDenied" : error?.name === "NotFoundError" || error?.name === "DevicesNotFoundError" ? "voiceNoMicrophone" : "voiceFailed";
      setHint(t(key));
      toast(t(key));
    }
  }

  function clearPending() {
    state.pending.forEach((item) => { if (item.url) URL.revokeObjectURL(item.url); });
    state.pending = [];
    renderAttachStrip();
  }

  function addPending(file) {
    if (!file || !String(file.type || "").startsWith("image/")) return false;
    if (file.size > 12 * 1024 * 1024) { setHint(t("imageTooLarge")); return false; }
    if (state.pending.length >= 8) { setHint(t("imageMax")); return false; }
    const url = URL.createObjectURL(file);
    state.pending.push({
      id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      name: file.name || `paste-${state.pending.length + 1}.png`,
      mime: file.type || "image/png",
      blob: file,
      url
    });
    renderAttachStrip();
    setHint(t("pasted"));
    return true;
  }

  function renderAttachStrip() {
    const strip = $("attachStrip");
    if (!strip) return;
    if (!state.pending.length) {
      strip.hidden = true;
      strip.innerHTML = "";
      return;
    }
    strip.hidden = false;
    strip.innerHTML = state.pending.map((item) =>
      `<div class="attach-chip"><img src="${escapeHtml(item.url)}" alt=""><button type="button" data-id="${escapeHtml(item.id)}" title="${escapeHtml(t("removeImage"))}">×</button></div>`
    ).join("");
    strip.querySelectorAll("button").forEach((btn) => {
      btn.onclick = () => {
        const hit = state.pending.find((p) => p.id === btn.dataset.id);
        if (hit && hit.url) URL.revokeObjectURL(hit.url);
        state.pending = state.pending.filter((p) => p.id !== btn.dataset.id);
        renderAttachStrip();
      };
    });
  }

  function fileToBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const raw = String(reader.result || "");
        resolve(raw.includes(",") ? raw.split(",", 1)[1] : raw);
      };
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });
  }

  function ingestClipboard(dt) {
    if (!dt) return false;
    const files = [];
    for (const item of dt.items || []) {
      if (item.kind === "file" && item.type && item.type.startsWith("image/")) {
        const file = item.getAsFile();
        if (file) files.push(file);
      }
    }
    if (!files.length) {
      for (const file of dt.files || []) {
        if (file && file.type && file.type.startsWith("image/")) files.push(file);
      }
    }
    const unique = [];
    const seen = new Set();
    for (const file of files) {
      const key = `${file.type}:${file.size}:${file.lastModified || 0}:${file.name || ""}`;
      if (seen.has(key)) continue;
      seen.add(key);
      unique.push(file);
    }
    let added = false;
    unique.forEach((file) => { if (addPending(file)) added = true; });
    return added;
  }

  function snapshotCurrent() {
    if (!state.sessionId) return;
    transcriptCache.set(state.sessionId, {
      messages: state.transcript,
      preview: { todos: state.todos, plan: state.plan, files: state.files, rewind: state.rewind, title: state.sessionTitle },
      ts: Date.now()
    });
  }

  // user_query 包着用户真实输入，只剥标签不删内容（在 applyHistory 里单独 unwrap）
  const CTX_BLOCK_RE = /<(user_info|rules|user_rules|environment_context|system-reminder|runtime_meta|session_context)(?:\s[^>]*)?>[\s\S]*?<\/\1>\s*/gi;

  function applyHistory(id, data) {
    state.transcript = (data.messages || []).map((m) => ({
      role: m.role,
      text: String(m.text || "")
        .replace(/<\/?user_query>/gi, "")
        .replace(CTX_BLOCK_RE, "")
        .trim(),
      thought: m.thought || "",
      tools: m.tools || [],
      usage: m.usage || null,
      durationMs: Number(m.durationMs) || 0,
      turnStats: m.turnStats || null,
      ts: m.ts || Date.now()
    })).filter((m) => m.text || (m.tools && m.tools.length) || m.thought);
    applyPreview(data.preview || {});
    if (data.session && data.session.title) state.sessionTitle = data.session.title;
    transcriptCache.set(id, {
      messages: state.transcript,
      preview: { todos: state.todos, plan: state.plan, files: state.files, rewind: state.rewind, title: state.sessionTitle },
      ts: Date.now()
    });
    renderThread();
    renderLiveMeta();
  }

  function attachSession(id, cwd) {
    api("/api/session/load", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId: id, cwd: cwd || state.cwd })
    }).then((loaded) => {
      if (state.sessionId === id) state.attached = !!loaded.loaded;
    }).catch(() => {
      if (state.sessionId === id) state.attached = false;
    });
  }

  async function loadSession(id, cwd) {
    if (!id) return;
    recordAppNavigation({ view: "chat", sessionId: id, cwd: cwd || state.cwd || "" });
    closeAutomations();
    closeMarket();
    if (id === state.sessionId && state.transcript.length) return;
    snapshotCurrent();
    const gen = ++loadGen;
    if (historyAbort) historyAbort.abort();
    historyAbort = new AbortController();
    state.sessionId = id;
    void refreshContextUsage(id);
    state.attached = false;
    const hit = sessionCache.find((s) => s.id === id);
    state.sessionTitle = (hit && hit.title) || t("loadingChat");
    if (cwd) {
      state.cwd = cwd;
      const cw = $("cwd"); if (cw) cw.textContent = cwd;
    }
    paintActiveSession();
    const cached = transcriptCache.get(id);
    if (cached) {
      state.transcript = cached.messages;
      applyPreview(cached.preview || {});
      renderThread();
    } else {
      state.transcript = [];
      state.todos = []; state.plan = ""; state.files = []; state.rewind = [];
      showSkeleton();
      renderTodoDock();
    }
    renderLiveMeta();
    persist({ sessionId: id });
    attachSession(id, state.cwd);
    try {
      const data = await api(`/api/history/${encodeURIComponent(id)}`, { signal: historyAbort.signal });
      if (gen !== loadGen) return;
      applyHistory(id, data);
    } catch (err) {
      if (err.name === "AbortError") return;
      if (gen !== loadGen) return;
      if (!cached) {
        thread.classList.remove("switching");
        thread.innerHTML = `<div class="empty"><p>${escapeHtml(err.message || t("disconnected"))}</p></div>`;
      }
    }
  }

  async function newChat(options = {}) {
    if (!options.historyRestore) recordAppNavigation({ view: "chat", sessionId: "", cwd: state.cwd || "" });
    closeAutomations();
    closeMarket();
    snapshotCurrent();
    loadGen += 1;
    if (!options.historyRestore && state.running && state.turnSessionId === state.sessionId) {
      await api("/api/cancel", { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" }).catch(() => {});
      endTurn();
    }
    if (options.historyRestore && Object.prototype.hasOwnProperty.call(options, "cwd")) {
      state.cwd = options.cwd || "";
      const cwd = $("cwd");
      if (cwd) cwd.textContent = state.cwd;
    }
    state.sessionId = "";
    void refreshContextUsage("");
    state.sessionTitle = t("newChat");
    state.attached = false;
    state.todos = []; state.plan = ""; state.files = []; state.rewind = [];
    state.transcript = [];
    clearPending();
    state.live = { thought: "", text: "", tools: new Map() };
    state.lastUsage = null;
    renderThread();
    renderPreview();
    renderTodoDock();
    renderLiveMeta();
    paintActiveSession();
    setHint(t("hint"));
    input.focus();
  }

  async function archiveSession(id, archived) {
    try {
      await api("/api/session/archive", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: id, archived: archived !== false })
      });
      transcriptCache.delete(id);
      listDirty = true;
      if (archived !== false && state.sessionId === id) await newChat();
      await refreshSessions(true);
      if (state.settingsTab === "archive") renderSettingsBody();
      toast(archived === false ? `${t("unarchive")} ✓` : `${t("archive")} ✓`);
    } catch (err) {
      toast(err.message || t("disconnected"));
    }
  }

  async function deleteSession(id) {
    try {
      const result = await api("/api/session/delete", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ sessionId: id }) });
      if (result && result.deleted === false) throw new Error(result.error || t("deleteFailed"));
      transcriptCache.delete(id);
      listDirty = true;
      if (state.sessionId === id) await newChat();
      await refreshSessions(true);
      if (state.settingsTab === "archive") renderSettingsBody();
      toast(`${t("deleteForever")} ✓`);
    } catch (err) {
      toast(err.message || t("disconnected"));
    }
  }

  async function forkSession(id, untilPrompt) {
    const payload = { sessionId: id, cwd: state.cwd };
    if (untilPrompt) payload.untilPrompt = untilPrompt;
    const data = await api("/api/session/fork", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    listDirty = true;
    if (data.sessionId) {
      await refreshSessions(true);
      await loadSession(data.sessionId, state.cwd);
    }
  }

  function closeRenameDialog(restoreFocus) {
    const dialog = $("renameDialog");
    if (!dialog || !dialog.classList.contains("show")) return;
    dialog.classList.remove("show");
    dialog.setAttribute("aria-hidden", "true");
    const trigger = dialog._trigger;
    dialog._trigger = null;
    if (restoreFocus && trigger && document.contains(trigger)) trigger.focus();
  }

  function renameSession(id, current) {
    const dialog = $("renameDialog");
    const input = $("renameInput");
    if (!dialog || !input || !id) return;
    dialog.dataset.sessionId = id;
    dialog._trigger = document.activeElement;
    input.value = current || "";
    input.removeAttribute("aria-invalid");
    dialog.classList.add("show");
    dialog.setAttribute("aria-hidden", "false");
    requestAnimationFrame(() => { input.focus(); input.select(); });
  }

  async function submitRenameSession() {
    const dialog = $("renameDialog");
    const input = $("renameInput");
    const confirm = $("renameConfirm");
    const id = dialog && dialog.dataset.sessionId;
    const title = input && input.value.trim();
    if (!id || !input) return;
    if (!title) {
      input.setAttribute("aria-invalid", "true");
      input.focus();
      return;
    }
    confirm.disabled = true;
    try {
      await api("/api/session/rename", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ sessionId: id, title }) });
      const hit = sessionCache.find((s) => s.id === id);
      if (hit) hit.title = title;
      if (state.sessionId === id) state.sessionTitle = title;
      listDirty = true;
      renderSessions();
      renderLiveMeta();
      closeRenameDialog();
      toast(t("renameSaved"));
    } catch (err) {
      input.setAttribute("aria-invalid", "true");
      input.focus();
      toast(err && err.message ? err.message : t("renameFailed"));
    } finally {
      confirm.disabled = false;
    }
  }

  async function rewindTo(index) {
    if (!state.sessionId) return;
    confirmAction(t("forkFrom").replace("{n}", String(index)), async () => {
      const data = await api("/api/session/rewind", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: state.sessionId, promptIndex: index, cwd: state.cwd })
      });
      listDirty = true;
      if (data.sessionId) await loadSession(data.sessionId, state.cwd);
    });
  }

  async function sendPrompt(text, opts) {
    if (voicePhase !== "idle") { setHint(t("voiceFinishFirst")); return; }
    const content = (text || input.value || "").trim();
    const pending = state.pending.slice();
    if (!content && !pending.length) { setHint(t("hintEmpty")); return; }
    if (!opts || !opts.force) {
      if (content.startsWith("/") && !pending.length && handleSlash(content)) { input.value = ""; hidePalette(); return; }
    }
    if (state.running) { setHint(t("hintBusy")); return; }
    if (!state.cwd) { openPicker(); return; }
    const shotUrls = pending.map((p) => ({ url: p.url, name: p.name }));
    state.transcript.push({ role: "user", text: content, images: shotUrls, ts: Date.now() });
    input.value = "";
    hidePalette();
    state.pending = [];
    renderAttachStrip();
    state.running = true;
    startLiveTimer();
    state.turnSessionId = state.sessionId || "__new__";
    renderSessions();
    state.live = { thought: "", text: "", tools: new Map() };
    state.turnFileStats = null;
    state.thoughtStartTs = 0;
    state.thoughtTextStartTs = 0;
    state.thoughtDurMs = 0;
    livePainted = { textLen: -1, thoughtLen: -1, toolsKey: "" };
    setSendBusy(true);
    setHint(t("sending"));
    renderThread();
    try {
      const images = [];
      for (const item of pending) {
        images.push({
          name: item.name,
          mime: item.mime,
          data: await fileToBase64(item.blob)
        });
      }
      const data = await api("/api/prompt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: state.sessionId || "",
          text: content,
          images,
          cwd: state.cwd,
          permission: state.permission,
          workMode: state.workMode,
          model: state.model,
          effort: state.effort
        })
      });
      if (data.sessionId) {
        const sessionChanged = data.sessionId !== state.turnSessionId;
        state.sessionId = data.sessionId;
        state.turnSessionId = data.sessionId;
        state.attached = true;
        listDirty = true;
        if (sessionChanged) void refreshSessions(true).catch(() => {});
      }
      setHint(t("processing"));
      watchTurn();
    } catch (err) {
      state.transcript.push({ role: "assistant", text: err.message || "send failed", ts: Date.now() });
      endTurn();
      renderThread();
    }
  }

  async function watchTurn() {
    const turnId = state.turnSessionId;
    let seen = 0;
    while (state.running && state.turnSessionId === turnId) {
      try {
        const turn = await api("/api/turn");
        const events = turn.events || [];
        for (let i = seen; i < events.length; i += 1) {
          const ev = events[i];
          if (ev.type === "update") applyUpdate(ev.update);
          else if (ev.type === "error") state.live.text += `\n${ev.message || ""}`;
          else if (ev.type === "session_ready" && ev.sessionId) {
            state.turnSessionId = ev.sessionId;
            if (!state.sessionId || state.sessionId === turnId || state.sessionId === "__new__") {
              const sessionChanged = state.sessionId !== ev.sessionId;
              state.sessionId = ev.sessionId;
              state.attached = true;
              if (sessionChanged) {
                listDirty = true;
                void refreshSessions(true).catch(() => {});
              }
            }
          }
        }
        seen = events.length;
        if (state.sessionId === state.turnSessionId) {
          // 新会话首轮：会话 ID 就绪前 live 节点尚未创建，需要重建一次
          if (!liveNode || !document.getElementById("liveMsg")) renderThread();
          else livePaint();
        }
        if (turn.done) {
          const assistant = {
            role: "assistant",
            text: state.live.text || turn.error || "",
            thought: state.live.thought,
            tools: [...state.live.tools.values()],
            usage: state.lastUsage ? { ...state.lastUsage } : null,
            durationMs: state.turnStartTs ? Date.now() - state.turnStartTs : 0,
            turnStats: state.turnFileStats ? { files: state.turnFileStats.files.size, added: state.turnFileStats.added, removed: state.turnFileStats.removed } : null,
            ts: Date.now()
          };
          if (state.sessionId === state.turnSessionId) {
            state.transcript.push(assistant);
            snapshotCurrent();
          } else {
            const cached = transcriptCache.get(state.turnSessionId) || { messages: [], preview: {} };
            cached.messages = [...(cached.messages || []), assistant];
            transcriptCache.set(state.turnSessionId, cached);
          }
          endTurn();
          if (state.sessionId === state.turnSessionId) renderThread();
          return;
        }
      } catch (err) {
        setHint(t("disconnected") + " " + (err.message || ""));
      }
      await new Promise((r) => setTimeout(r, 220));
    }
  }

  function ingestTodos(raw) {
    const list = Array.isArray(raw) ? raw : (raw && (raw.todos || raw.entries)) || [];
    if (!Array.isArray(list) || !list.length) return;
    state.todos = list.map((item, i) => {
      if (typeof item === "string") return { id: `t${i}`, content: item, status: "pending" };
      const status = String(item.status || "pending").toLowerCase();
      return {
        id: item.id || `t${i}`,
        content: item.content || item.title || "",
        status: status.includes("complete") ? "completed" : status.includes("progress") ? "in_progress" : "pending"
      };
    }).filter((x) => x.content);
    renderPreview();
    renderTodoDock();
  }

  function ingestFile(update) {
    const raw = update.rawInput || update.raw_input || {};
    const path = raw.path || raw.target_file || raw.file_path || raw.filePath || raw.file;
    if (!path) return;
    const kind = String((update._meta && update._meta["x.ai/tool"] && update._meta["x.ai/tool"].kind) || update.kind || "").toLowerCase();
    let action = "edit";
    if (kind === "read" || kind === "search") action = "read";
    if (kind === "write") action = "write";
    if (kind === "delete") action = "delete";
    state.files = [...state.files.filter((f) => f.path !== path), { path, action }];
    renderPreview();
  }

  function noteFileChange(raw, kind) {
    if (!raw || typeof raw !== "object") return;
    const path = raw.path || raw.target_file || raw.file_path || raw.filePath || raw.file;
    if (!path) return;
    const nv = raw.new_str != null ? raw.new_str : (raw.new_string != null ? raw.new_string : raw.content);
    const ov = raw.old_str != null ? raw.old_str : raw.old_string;
    const writesFile = /edit|write|delete|patch|replace/.test(String(kind || "").toLowerCase());
    if (!writesFile && typeof nv !== "string" && typeof ov !== "string") return;
    if (!state.turnFileStats) state.turnFileStats = { files: new Map(), added: 0, removed: 0 };
    const st = state.turnFileStats;
    const file = st.files.get(path) || { added: 0, removed: 0 };
    const added = typeof nv === "string" && nv ? nv.split("\n").length : 0;
    const removed = typeof ov === "string" && ov ? ov.split("\n").length : 0;
    file.added += added;
    file.removed += removed;
    st.files.set(path, file);
    st.added += added;
    st.removed += removed;
  }

  function applyUpdate(update) {
    if (!update) return;
    const kind = update.sessionUpdate;
    if (kind === "user_message_chunk") return;
    if (kind === "turn_completed") {
      if (update.usage && typeof update.usage === "object") {
        state.lastUsage = {
          inputTokens: update.usage.inputTokens || 0,
          outputTokens: update.usage.outputTokens || 0,
          totalTokens: update.usage.totalTokens || 0,
          cachedReadTokens: update.usage.cachedReadTokens || 0,
          reasoningTokens: update.usage.reasoningTokens || 0,
          modelCalls: update.usage.modelCalls || 0,
          apiDurationMs: update.usage.apiDurationMs || 0,
          costUsd: update.usage.costUsd != null
            ? update.usage.costUsd
            : Math.round((update.usage.costUsdTicks || 0) / 1e5) / 1e4
        };
      }
      return;
    }
    if (kind === "agent_thought_chunk") {
      if (!state.thoughtStartTs) state.thoughtStartTs = Date.now();
      state.live.thought += (update.content && update.content.text) || "";
    } else if (kind === "agent_message_chunk") {
      if (state.live.thought && !state.thoughtTextStartTs && !state.thoughtDurMs) {
        state.thoughtTextStartTs = Date.now();
        state.thoughtDurMs = state.thoughtStartTs ? state.thoughtTextStartTs - state.thoughtStartTs : 0;
      }
      state.live.text += (update.content && update.content.text) || "";
    } else if (kind === "tool_call") {
      const id = update.toolCallId;
      const raw = update.rawInput || {};
      state.live.tools.set(id, {
        id, title: update.title,
        kind: (update._meta && update._meta["x.ai/tool"] && update._meta["x.ai/tool"].kind) || update.kind,
        status: update.status || "in_progress", input: raw, output: update.rawOutput || {}
      });
      if (raw && (raw.todos || raw.entries)) ingestTodos(raw);
      ingestFile(update);
      noteFileChange(raw, kind);
    } else if (kind === "tool_call_update") {
      const id = update.toolCallId;
      const prev = state.live.tools.get(id) || { id, title: update.title || "tool", input: {}, output: {} };
      if (update.status) prev.status = update.status;
      if (update.title) prev.title = update.title;
      if (update.rawOutput) prev.output = update.rawOutput;
      if (update.rawInput) prev.input = update.rawInput;
      state.live.tools.set(id, prev);
      ingestFile(update);
    } else if (kind === "plan") ingestTodos(update.entries || update);
  }

  function endTurn() {
    state.running = false;
    renderSessions();
    renderTodoDock();
    stopLiveTimer();
    setSendBusy(false);
    setHint(t("hint"));
    if (state.sessionId) void refreshContextUsage(state.sessionId);
    listDirty = true;
    refreshSessions(true).catch(() => {});
  }

  function showPermission(evt) {
    const box = $("perm");
    const params = evt.params || {};
    const tool = params.toolCall || {};
    document.querySelector("#perm .hint").textContent = tool.title || "tool";
    $("permBody").textContent = pretty(tool.rawInput || params);
    const actions = $("permActions");
    const options = params.options || [
      { optionId: "allow-once", kind: "allow_once" },
      { optionId: "reject-once", kind: "reject_once" }
    ];
    actions.innerHTML = "";
    options.forEach((opt) => {
      const btn = document.createElement("button");
      const reject = String(opt.kind || opt.optionId || "").includes("reject");
      btn.className = reject ? "danger" : "primary";
      btn.textContent = reject ? t("reject") : (String(opt.kind).includes("always") ? t("allowAlways") : t("allowOnce"));
      btn.onclick = async () => {
        await api("/api/permission", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: evt.id, optionId: opt.optionId }) });
        box.classList.remove("show");
      };
      actions.appendChild(btn);
    });
    box.classList.add("show");
  }

  function connectEvents() {
    const es = new EventSource("/api/events");
    es.onmessage = (e) => {
      let data;
      try { data = JSON.parse(e.data); } catch { return; }
      if (data.type === "hello" || data.type === "status") {
        if (data.ok === false || data.error) setStatus(false, data.error);
        else setStatus(true);
      } else if (data.type === "permission") showPermission(data);
    };
    es.onerror = () => setStatus(false, t("disconnected"));
  }

  function setPermission(permission, persistChange) {
    state.permission = PERMISSIONS.some((item) => item.id === permission) ? permission : "ask";
    document.querySelectorAll("[data-perm]").forEach((btn) => {
      if (btn.matches("[aria-pressed]")) btn.setAttribute("aria-pressed", String(btn.dataset.perm === state.permission));
      if (btn.matches("[aria-selected]")) btn.setAttribute("aria-selected", String(btn.dataset.perm === state.permission));
    });
    renderPermissionPick();
    renderLiveMeta();
    if (persistChange !== false) persist();
  }

  function openPermissionPick() {
    const pop = $("permissionPop");
    const trigger = $("permissionBtn");
    if (!pop || !trigger) return;
    closeComposerMenu();
    $("modelPop")?.setAttribute("hidden", "true");
    $("effortPop")?.setAttribute("hidden", "true");
    $("modelBtn")?.setAttribute("aria-expanded", "false");
    $("effortBtn")?.setAttribute("aria-expanded", "false");
    const opening = pop.hidden;
    pop.hidden = !opening;
    trigger.setAttribute("aria-expanded", String(opening));
    if (opening) {
      positionPermissionPop();
      pop.classList.remove("pick-pop-enter");
      void pop.offsetWidth;
      pop.classList.add("pick-pop-enter");
    } else {
      resetPermissionPopPosition();
      pop.classList.remove("pick-pop-enter");
    }
  }

  function setWorkMode(workMode, persistChange) {
    state.workMode = workMode;
    document.querySelectorAll("[data-work]").forEach((btn) => {
      btn.setAttribute("aria-pressed", String(btn.dataset.work === workMode));
    });
    renderComposerMenu();
    renderWorkModeNotice();
    updateComposerPlaceholder();
    renderLiveMeta();
    if (persistChange !== false) persist();
  }

  function applyTheme(theme, doPersist) {
    const mapped = { light: "grok-day", dark: "grok-night" }[theme] || theme;
    state.theme = THEMES.includes(mapped) ? mapped : "grok-night";
    document.documentElement.setAttribute("data-theme", state.theme);
    localStorage.setItem("grok-zh-theme", state.theme);
    if (doPersist) persist();
  }

  function applyFont(fontFamily) {
    document.documentElement.dataset.font = FONT_FAMILIES.includes(fontFamily) ? fontFamily : "auto";
  }

  function applyWorkStyle(style, doPersist) {
    state.workStyle = WORK_STYLES.includes(style) ? style : "harness";
    document.documentElement.setAttribute("data-work-style", state.workStyle);
    localStorage.setItem("grok-webui-style", state.workStyle);
    const cluster = $("modeCluster");
    const desktopHost = document.documentElement.dataset.host === "desktop";
    if (cluster) {
      $("chromeCluster").appendChild(cluster);
      cluster.hidden = true;
    }
    if (state.workStyle === "harness" || desktopHost) {
      if (!localStorage.getItem("grok-webui-preview-user")) setPreviewOpen(false);
    }
    $("app").classList.toggle("sidebar-collapsed", state.sidebarCollapsed);
    applyPaneWidths();
    if (doPersist) persist();
  }

  function applyThinking(show) {
    state.showThinking = !!show;
    document.documentElement.setAttribute("data-show-thinking", show ? "on" : "off");
  }

  function setSwitchState(switchEl, value, animate = true) {
    if (!switchEl) return;
    switchEl.classList.remove("switch-pop");
    switchEl.setAttribute("aria-pressed", String(!!value));
    if (animate) {
      void switchEl.offsetWidth;
      switchEl.classList.add("switch-pop");
      switchEl.addEventListener("animationend", () => switchEl.classList.remove("switch-pop"), { once: true });
    }
  }

  function setPreviewOpen(open) {
    state.previewOpen = !!open;
    $("app").classList.toggle("preview-collapsed", !open);
  }

  function slashDesc(s) {
    const pack = window.GROK_I18N[state.lang] || {};
    return (pack.slash && pack.slash[s.cmd]) || s.desc;
  }

  function hidePalette() { palette.classList.remove("show"); }
  function closeComposerMenu() {
    const menu = $("composerAddMenu");
    if (!menu) return;
    menu.hidden = true;
    $("attachBtn")?.setAttribute("aria-expanded", "false");
  }
  function toggleComposerMenu() {
    const menu = $("composerAddMenu");
    const button = $("attachBtn");
    if (!menu || !button) return;
    closePicks();
    const opening = menu.hidden;
    menu.hidden = !opening;
    button.setAttribute("aria-expanded", String(opening));
    if (opening) {
      menu.classList.remove("composer-add-menu-enter");
      void menu.offsetWidth;
      menu.classList.add("composer-add-menu-enter");
      menu.querySelector("[data-composer-search]")?.focus();
    }
  }
  function runComposerAction(action) {
    closeComposerMenu();
    if (action === "files") {
      $("filePick")?.click();
      return;
    }
    if (action === "goal" || action === "plan") {
      setWorkMode(action, true);
      setHint(`${t("workMode")} · ${workLabel(action)}`);
    }
  }
  function showPalette(filter) {
    const q = (filter || "").replace(/^\//, "").toLowerCase();
    const items = SLASH.filter((s) => s.cmd.slice(1).includes(q) || slashDesc(s).toLowerCase().includes(q));
    palette.innerHTML = items.slice(0, 18).map((s, i) =>
      `<button type="button" data-cmd="${s.cmd}" class="${i === 0 ? "active" : ""}"><b>${s.cmd}</b><span>${escapeHtml(slashDesc(s))}</span></button>`
    ).join("");
    palette.classList.toggle("show", items.length > 0);
    palette.querySelectorAll("button").forEach((btn) => {
      btn.onclick = () => { input.value = btn.dataset.cmd + " "; input.focus(); hidePalette(); };
    });
  }

  function handleSlash(raw) {
    const parts = raw.trim().split(/\s+/);
    const head = parts[0].toLowerCase();
    const arg = parts.slice(1).join(" ");
    const found = SLASH.find((s) => s.cmd === head);
    if (!found) return false;
    if (found.run === "new") { newChat(); return true; }
    if (found.run === "resume") { $("sessions").scrollIntoView(); return true; }
    if (found.run === "plan") { setWorkMode("plan", true); return true; }
    if (found.run === "goal") { setWorkMode("goal", true); return true; }
    if (found.run === "full") { setPermission("full", true); return true; }
    if (found.run === "auto") { setPermission("auto", true); return true; }
    if (found.run === "settings") { openSettings(); return true; }
    if (found.run === "theme") { openSettings("general"); return true; }
    if (found.run === "focus-model") { openPick("model"); return true; }
    if (found.run === "focus-effort") { openPick("effort"); return true; }
    if (found.run === "timestamps") { state.timestamps = !state.timestamps; renderThread(); return true; }
    if (found.run === "fork" && state.sessionId) { forkSession(state.sessionId); return true; }
    if (found.run === "rename" && state.sessionId) { renameSession(state.sessionId, state.sessionTitle); return true; }
    if (found.run === "archive" && state.sessionId) { archiveSession(state.sessionId, true); return true; }
    if (found.run === "delete" && state.sessionId) { archiveSession(state.sessionId, true); return true; }
    if (found.run === "export") { exportChat(); return true; }
    if (found.run === "usage") { openSettings("usage"); return true; }
    if (found.run === "doctor") { showToolPanel("/api/doctor", "doctor"); return true; }
    if (found.run === "slash") {
      sendPrompt(raw, { force: true });
      return true;
    }
    if (arg) sendPrompt(raw);
    return true;
  }

  async function exportChat() {
    if (!state.sessionId) {
      const md = state.transcript.map((m) => `## ${m.role}\n\n${m.text || ""}\n`).join("\n");
      download("chat.md", md);
      return;
    }
    const data = await api(`/api/export/${encodeURIComponent(state.sessionId)}`);
    download((data.title || "chat") + ".md", data.markdown || "");
  }

  function download(name, text) {
    const blob = new Blob([text], { type: "text/markdown;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = name;
    a.click();
  }

  function renderCommandPanel(body) {
    const panel = state.commandPanel || {};
    if (panel.status === "idle") {
      body.innerHTML = `<div class="sub">${escapeHtml(t("commandHint"))}</div>` +
        SLASH.map((s) => `<div class="file-row"><b>${s.cmd}</b><small>${escapeHtml(slashDesc(s))}</small></div>`).join("");
      return;
    }
    const title = t(panel.titleKey || "commands");
    if (panel.status === "loading") {
      body.innerHTML = `<section class="command-result" aria-live="polite"><h3>${escapeHtml(title)}</h3><p class="command-result-state">${escapeHtml(t("diagnosticLoading"))}</p></section>`;
      return;
    }
    if (panel.status === "error") {
      body.innerHTML = `<section class="command-result is-error" aria-live="assertive"><div class="command-result-head"><h3>${escapeHtml(title)}</h3><button type="button" class="ghost" id="commandRetry">${escapeHtml(t("diagnosticRetry"))}</button></div><p class="command-result-state">${escapeHtml(panel.error || t("diagnosticFailed"))}</p></section>`;
      const retry = body.querySelector("#commandRetry");
      if (retry) retry.onclick = () => showToolPanel(panel.path, panel.titleKey);
      return;
    }
    const text = String(panel.text || "");
    const stateText = panel.empty ? t("diagnosticEmpty") : (panel.ok ? t("diagnosticComplete") : t("diagnosticFailed"));
    const exitCode = Number.isInteger(panel.exitCode) ? `<span class="command-result-code">${escapeHtml(t("diagnosticExitCode").replace("{n}", String(panel.exitCode)))}</span>` : "";
    const warning = panel.ok ? "" : `<p class="command-result-state is-warning">${escapeHtml(panel.error || t("diagnosticFailed"))}</p>`;
    body.innerHTML = `<section class="command-result${panel.ok ? "" : " is-error"}" aria-live="polite"><div class="command-result-head"><div><h3>${escapeHtml(title)}</h3><p class="command-result-state">${escapeHtml(stateText)} ${exitCode}</p></div><button type="button" class="ghost" id="commandRetry">${escapeHtml(t("diagnosticRetry"))}</button></div>${warning}<pre class="panel-pre${panel.empty ? " is-empty" : ""}">${escapeHtml(text || t("diagnosticEmpty"))}</pre></section>`;
    const retry = body.querySelector("#commandRetry");
    if (retry) retry.onclick = () => showToolPanel(panel.path, panel.titleKey);
  }

  async function showToolPanel(path, titleKey) {
    const previous = state.commandPanel || {};
    const requestId = Number(previous.requestId || 0) + 1;
    state.commandPanel = {
      path,
      titleKey: titleKey || "commands",
      status: "loading",
      ok: true,
      text: "",
      error: "",
      exitCode: null,
      empty: false,
      requestId
    };
    openSettings("commands");
    try {
      const data = await api(path);
      if (state.commandPanel.requestId !== requestId) return;
      const text = String(data.text || data.markdown || "");
      state.commandPanel = {
        ...state.commandPanel,
        status: "result",
        ok: data.ok !== false,
        text,
        error: String(data.error || ""),
        exitCode: Number.isInteger(data.exitCode) ? data.exitCode : null,
        empty: data.empty === true || !text.trim()
      };
    } catch (err) {
      if (state.commandPanel.requestId !== requestId) return;
      state.commandPanel = {
        ...state.commandPanel,
        status: "error",
        ok: false,
        error: err && err.message ? err.message : t("diagnosticFailed")
      };
    }
    if (state.settingsTab === "commands") renderSettingsBody();
  }

  let pickerPath = "";
  function openPicker(path) { $("picker").classList.add("show"); loadPicker(path || state.cwd || ""); }
  function closePicker() { $("picker").classList.remove("show"); }
  async function usePickerPath(path) {
    const nextPath = String(path || "").trim();
    if (!nextPath) return;
    pickerPath = nextPath;
    state.cwd = nextPath;
    const cwdEl = $("cwd"); if (cwdEl) cwdEl.textContent = nextPath;
    await persist({ cwd: nextPath });
    closePicker();
    await newChat();
    listDirty = true;
    await refreshSessions(true);
  }
  async function pickFolderWithSystem() {
    const nativeApi = window.pywebview && window.pywebview.api;
    if (!nativeApi || typeof nativeApi.pick_folder !== "function") {
      toast(t("nativePickerDesktopOnly"));
      return;
    }
    const button = $("pickerNative");
    if (button) button.disabled = true;
    try {
      const selected = await nativeApi.pick_folder(state.cwd || pickerPath || "");
      if (selected) await usePickerPath(selected);
    } catch (err) {
      toast(err && err.message ? err.message : t("nativePickerFailed"));
    } finally {
      if (button) button.disabled = false;
    }
  }
  async function loadPicker(path) {
    const data = await api(`/api/browse?path=${encodeURIComponent(path || "")}`);
    pickerPath = data.path || "";
    $("pickerPath").textContent = pickerPath || "";
    const list = $("pickerList");
    list.innerHTML = (data.entries || []).map((e) =>
      `<button type="button" data-path="${escapeHtml(e.path)}">${escapeHtml(e.name)}</button>`
    ).join("");
    list.querySelectorAll("button").forEach((btn) => { btn.onclick = () => loadPicker(btn.dataset.path); });
    $("pickerUp").onclick = () => loadPicker(data.parent || "");
  }

  function confirmAction(text, onYes) {
    $("confirmText").textContent = text;
    $("confirm").classList.add("show");
    $("confirmYes").onclick = async () => { $("confirm").classList.remove("show"); await onYes(); };
    $("confirmNo").onclick = () => $("confirm").classList.remove("show");
  }

  const LANGS = [
    { id: "zh-CN", label: "简体中文", native: "简体中文（中国）", english: "Simplified Chinese (China)" },
    { id: "zh-TW-TW", label: "繁體中文（台灣）", native: "繁體中文（台灣）", english: "Traditional Chinese (Taiwan)" },
    { id: "zh-HK", label: "繁體中文（香港）", native: "繁體中文（香港）", english: "Traditional Chinese (Hong Kong)" },
    { id: "en", label: "English", native: "English (United States)", english: "English (United States)" },
    { id: "ja", label: "日本語", native: "日本語（日本）", english: "Japanese (Japan)" },
    { id: "ko", label: "한국어", native: "한국어（대한민국）", english: "Korean (South Korea)" },
    { id: "de", label: "Deutsch", native: "Deutsch（Deutschland）", english: "German (Germany)" },
    { id: "fr", label: "Français", native: "Français（France）", english: "French (France)" },
    { id: "es", label: "Español", native: "Español（España）", english: "Spanish (Spain)" }
  ];

  function placeSelectPopover(root, pop, opening) {
    if (!root || !pop) return;
    root.classList.remove("drop-up");
    if (!opening) return;
    requestAnimationFrame(() => {
      if (pop.hidden) return;
      const rect = root.getBoundingClientRect();
      const estimatedHeight = Math.min(320, 12 + pop.querySelectorAll("[role='option']").length * 40);
      const roomBelow = window.innerHeight - rect.bottom;
      const roomAbove = rect.top;
      root.classList.toggle("drop-up", roomBelow < estimatedHeight && roomAbove > roomBelow);
    });
  }

  function renderLangSelect(root) {
    if (!root) return;
    const btn = root.querySelector("#langBtn");
    const label = root.querySelector("#langLabel");
    const normalized = normalizeLangId(state.lang);
    if (normalized !== state.lang) {
      state.lang = normalized;
      localStorage.setItem("grok-webui-lang", normalized);
    }
    const cur = LANGS.find((l) => l.id === state.lang) || LANGS[0];
    label.textContent = cur.label;
    btn.onclick = (e) => { e.stopPropagation(); openLanguageDialog(); };
  }

  function selectLanguage(languageId, closeDialog) {
    state.lang = normalizeLangId(languageId);
    localStorage.setItem("grok-webui-lang", state.lang);
    persist();
    applyI18n();
    renderLanguageOptions();
    const selected = $("languageDialog").querySelector(`[data-lang="${state.lang}"]`);
    if (closeDialog) $("languageDialog").close();
    else {
      $("langBtn")?.setAttribute("aria-expanded", "true");
      selected?.focus();
    }
  }

  function renderLanguageOptions() {
    const grid = $("languageGrid");
    if (!grid) return;
    grid.innerHTML = LANGS.map((language) => `
      <button type="button" class="language-choice" role="radio" data-lang="${language.id}" aria-checked="${language.id === state.lang}" tabindex="${language.id === state.lang ? 0 : -1}">
        <span class="language-choice-copy"><strong>${escapeHtml(language.native)}</strong><small>${escapeHtml(language.english)}</small></span>
        <svg class="language-choice-check" viewBox="0 0 16 16" width="16" height="16" aria-hidden="true"><path d="m3 8.2 3.2 3.2L13 4.8" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>
      </button>`).join("");
    grid.querySelectorAll("[data-lang]").forEach((button) => {
      button.onclick = () => selectLanguage(button.dataset.lang, true);
    });
    grid.onkeydown = (event) => {
      if (!["ArrowLeft", "ArrowUp", "ArrowRight", "ArrowDown"].includes(event.key)) return;
      const current = LANGS.findIndex((language) => language.id === state.lang);
      const direction = ["ArrowLeft", "ArrowUp"].includes(event.key) ? -1 : 1;
      const next = (current + direction + LANGS.length) % LANGS.length;
      event.preventDefault();
      selectLanguage(LANGS[next].id, false);
    };
  }

  function openLanguageDialog() {
    const dialog = $("languageDialog");
    if (!dialog) return;
    $("langBtn")?.setAttribute("aria-expanded", "true");
    renderLanguageOptions();
    if (!dialog.open) dialog.showModal();
    requestAnimationFrame(() => dialog.querySelector(`[data-lang="${state.lang}"]`)?.focus());
  }

  function openAboutDialog() {
    const dialog = $("aboutDialog");
    if (dialog && !dialog.open) dialog.showModal();
  }

  function closeDialogOnBackdrop(dialog) {
    if (!dialog) return;
    dialog.addEventListener("click", (event) => {
      if (event.target === dialog) dialog.close();
    });
  }

  $("languageDialogClose").onclick = () => $("languageDialog").close();
  $("aboutDialogClose").onclick = () => $("aboutDialog").close();
  $("languageDialog").addEventListener("close", () => $("langBtn")?.setAttribute("aria-expanded", "false"));
  closeDialogOnBackdrop($("languageDialog"));
  closeDialogOnBackdrop($("aboutDialog"));

  function renderCSelect(root, opts) {
    if (!root) return;
    const cur = opts.options.find((o) => o.value === opts.value) || opts.options[0];
    let value = cur.value;
    root.classList.add("cselect");
    root.innerHTML = `
      <button type="button" class="lang-btn cselect-btn" aria-haspopup="listbox" aria-expanded="false">
        <span>${escapeHtml(cur.label)}</span>
        <svg viewBox="0 0 12 12" width="11" height="11" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" d="M2.2 4.2 6 8l3.8-3.8"/></svg>
      </button>
      <div class="lang-pop" role="listbox" hidden></div>`;
    const pop = root.querySelector(".lang-pop");
    const btn = root.querySelector(".lang-btn");
    pop.innerHTML = opts.options.map((o) =>
      `<button type="button" role="option" data-val="${escapeHtml(o.value)}" aria-selected="${o.value === value}"><span>${escapeHtml(o.label)}</span><i class="lang-check">${o.value === value ? "✓" : ""}</i></button>`
    ).join("");
    btn.onclick = (e) => {
      e.stopPropagation();
      const opening = pop.hidden;
      pop.hidden = !opening;
      btn.setAttribute("aria-expanded", String(opening));
      placeSelectPopover(root, pop, opening);
    };
    pop.querySelectorAll("[data-val]").forEach((b) => {
      b.onclick = (e) => {
        e.stopPropagation();
        const next = b.dataset.val;
        const changed = next !== value;
        value = next;
        const selected = opts.options.find((o) => o.value === value);
        if (selected) btn.querySelector("span").textContent = selected.label;
        pop.querySelectorAll('[role="option"]').forEach((option) => {
          const isSelected = option.dataset.val === value;
          option.setAttribute("aria-selected", String(isSelected));
          option.querySelector(".lang-check").textContent = isSelected ? "✓" : "";
        });
        pop.hidden = true;
        btn.setAttribute("aria-expanded", "false");
        if (changed && opts.onChange) opts.onChange(value);
      };
    });
  }

  const BACKEND_OPTIONS = [];

  function renderProviderBox(box, options = {}) {
    if (!box) return;
    api("/api/provider").then((data) => {
      const rows = data.customModels || [];
      state.customModels = rows;
      box.innerHTML = `
        ${options.showExistingModels === false ? "" : rows.map((m) => `
          <div class="custom-model-row">
            <div><b>${escapeHtml(m.name || m.id)}</b><small>${escapeHtml(m.model)} · ${escapeHtml(m.baseUrl)}${m.contextWindow ? ` · ${formatTokens(m.contextWindow)}` : ""}</small></div>
            <span class="key-state">${m.hasKey ? escapeHtml(t("hasKeySaved")) : escapeHtml(t("noKeySet"))}</span>
            <button type="button" class="danger" data-remove="${escapeHtml(m.id)}">${escapeHtml(t("removeModel"))}</button>
          </div>`).join("")}
        <form class="provider-form" id="providerForm">
          <div><label>${escapeHtml(t("modelIdField"))}</label><input name="modelId" placeholder="grok-4.6" required></div>
          <div><label>${escapeHtml(t("modelName"))}</label><input name="name" placeholder="Grok 4.6"></div>
          <div class="full"><label>${escapeHtml(t("baseUrl"))}</label><input name="baseUrl" placeholder="https://api.example.com/v1" required></div>
          <div class="full"><label>${escapeHtml(t("apiKeyField"))}</label><input name="apiKey" type="password" placeholder="${escapeHtml(t("apiKeyKeep"))}" autocomplete="off"></div>
          <div><label>${escapeHtml(t("apiBackend"))}</label><div id="backendSelect"></div><input type="hidden" name="apiBackend" value="chat_completions"></div>
          <div><label>${escapeHtml(t("ctxWindow"))}</label><input name="contextWindow" type="number" min="1000" step="1000" placeholder="128000"></div>
          <div class="pf-actions"><button type="submit" class="primary">${escapeHtml(t("saveReload"))}</button></div>
        </form>`;
      box.querySelectorAll("[data-remove]").forEach((btn) => {
        btn.onclick = () => {
          api("/api/provider", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "remove", modelId: btn.dataset.remove }) })
            .then(() => { toast(t("providerRemoved")); renderPicks(); renderSettingsBody(); })
            .catch((err) => toast(err.message || t("disconnected")));
        };
      });
      const form = box.querySelector("#providerForm");
      const backendRoot = box.querySelector("#backendSelect");
      renderCSelect(backendRoot, {
        options: [
          { value: "chat_completions", label: t("backendChat") },
          { value: "responses", label: t("backendResponses") },
          { value: "messages", label: t("backendMessages") }
        ],
        value: "chat_completions",
        onChange: (val) => {
          form.querySelector('input[name="apiBackend"]').value = val;
        }
      });
      form.onsubmit = (e) => {
        e.preventDefault();
        const fd = new FormData(form);
        const payload = {
          action: "save",
          modelId: String(fd.get("modelId") || "").trim(),
          name: String(fd.get("name") || "").trim(),
          baseUrl: String(fd.get("baseUrl") || "").trim(),
          apiKey: String(fd.get("apiKey") || "").trim(),
          apiBackend: String(fd.get("apiBackend") || "chat_completions"),
          contextWindow: Number(fd.get("contextWindow") || 0)
        };
        if (!payload.modelId || !payload.baseUrl) { toast(t("providerNeedBoth")); return; }
        api("/api/provider", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) })
          .then(async (result) => {
            if (options.onSaved) { await options.onSaved(payload, result); return; }
            toast(t("providerSaved")); setTimeout(bootModelsOnly, 2500); renderSettingsBody();
          })
          .catch((err) => options.onError ? options.onError(err) : toast(err.message || t("disconnected")));
      };
    }).catch((err) => {
      box.innerHTML = `<p class="sub">${escapeHtml(t("disconnected"))}</p>`;
      options.onError?.(err);
    });
  }

  async function bootModelsOnly() {
    try {
      const st = await api("/api/status");
      state.models = st.models || state.models;
      state.modelCatalog = Array.isArray(st.modelCatalog) ? st.modelCatalog : [];
      renderPicks();
      renderLiveMeta();
    } catch {}
  }

  function grokCliBox(box, getPath) {
    box.innerHTML = `<div class="preview-empty">${escapeHtml(t("processing"))}</div>`;
    api(getPath).then((d) => {
      box.innerHTML = `<pre class="cli-pre">${escapeHtml(d.text || "-")}</pre>`;
    }).catch((err) => { box.innerHTML = `<p class="sub">${escapeHtml(err.message || t("disconnected"))}</p>`; });
  }

  function cliAction(route, payload, box, refresh) {
    api(route, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) })
      .then((d) => {
        if (box) box.innerHTML = `<pre class="cli-pre">${escapeHtml(d.text || "OK")}</pre>`;
        toast(d.ok ? "✓" : "!");
        if (refresh) refresh();
      })
      .catch((err) => { toast(err.message || t("disconnected")); if (box) box.innerHTML = `<pre class="cli-pre">${escapeHtml(err.message || "")}</pre>`; });
  }

  function renderToolsTab(body) {
    body.innerHTML = `
      <div class="field bigcard" data-settings-search-key="webSearch">
        <div class="bigcard-head"><div><label>${escapeHtml(t("webSearch"))}</label>
          <div class="sub">${escapeHtml(t("webSearchHelp"))}</div></div>
          <button type="button" class="switch" id="webSearchToggle" aria-pressed="${state.webSearch !== false}"><i></i></button>
        </div>
      </div>
      <div class="field bigcard" data-settings-search-key="clearPastes">
        <div class="bigcard-head"><div><label>${escapeHtml(t("clearPastes"))}</label>
          <div class="sub">${escapeHtml(t("clearPastesHelp"))}</div></div>
          <button type="button" class="ghost" id="clearPastesBtn">${escapeHtml(t("clearPastes"))}</button>
        </div>
      </div>
      ${settingsPanel("localTools", [
        settingsRow("gitignore", "gitignoreHelp", settingSwitch("gitignore", "gitignore")),
        settingsRow("shellTimeout", "shellTimeoutHelp", settingNumber("shellTimeout", 5, 3600, 1, t("secondsUnit"))),
        settingsRow("shellOutputLimit", "shellOutputLimitHelp", settingNumber("shellOutputLimit", 1000, 1000000, 1000, t("bytesUnit"))),
        settingsRow("lspTools", "lspToolsHelp", settingSwitch("lspTools", "lspTools")),
        settingsRow("codeIndex", "codeIndexHelp", settingSwitch("codeIndex", "codeIndex"))
      ])}`;
    body.querySelector("#webSearchToggle").onclick = () => {
      const sw = body.querySelector("#webSearchToggle");
      const next = sw.getAttribute("aria-pressed") !== "true";
      setSwitchState(sw, next);
      state.webSearch = next;
      persist();
      toast(t("agentRestarting"));
      api("/api/agent/restart", { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" }).catch(() => {});
    };
    body.querySelector("#clearPastesBtn").onclick = () => {
      api("/api/clear-pastes", { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" }).then(() => toast("✓")).catch(() => {});
    };
    bindSettingControls(body);
  }

  function extensionHeader(count) {
    return `<div class="extension-toolbar"><div class="extension-summary"><i class="extension-dot ok"></i><span>${escapeHtml(t("extensionsInstalled").replace("{n}", String(count)))}</span></div>
      <button type="button" class="ghost" data-refresh-extensions>${escapeHtml(t("extensionRefresh"))}</button></div>`;
  }

  function extensionRow(item, kind) {
    const enabled = kind === "skills" ? !item.disabled : item.enabled !== false;
    const source = kind === "plugins" ? (item.scope || "user") : (item.source || item.transport || "user");
    const detail = kind === "skills" ? (item.description || item.invocableAs || "-")
      : kind === "plugins" ? ((item.provides || []).join(" · ") || "-")
      : `${item.transport || "MCP"}${item.toolCount ? ` · ${item.toolCount}` : ""}`;
    const action = enabled ? "disable" : "enable";
    const actionText = enabled ? (kind === "plugins" ? t("plDisable") : t("mcpDisable")) : (kind === "plugins" ? t("plEnable") : t("mcpEnable"));
    const toggleText = kind === "skills"
      ? (enabled ? t("skillDisable") : t("skillEnable"))
      : (enabled ? t("mcpDisable") : t("mcpEnable"));
    const actionControl = kind === "skills" || kind === "mcp"
      ? `<button type="button" class="switch extension-switch" data-extension-action="${action}" data-extension-name="${escapeHtml(item.name)}" aria-pressed="${enabled ? "true" : "false"}" aria-label="${escapeHtml(toggleText)}" title="${escapeHtml(toggleText)}"><i aria-hidden="true"></i></button>`
      : `<button type="button" class="ghost" data-extension-action="${action}" data-extension-name="${escapeHtml(item.name)}">${escapeHtml(actionText)}</button>`;
    const remove = kind === "plugins" ? `<button type="button" class="danger" data-extension-action="uninstall" data-extension-name="${escapeHtml(item.name)}">${escapeHtml(t("plRemove"))}</button>`
      : kind === "mcp" ? `<button type="button" class="danger" data-extension-action="remove" data-extension-name="${escapeHtml(item.name)}">${escapeHtml(t("mcpRemove"))}</button>` : "";
    return `<article class="extension-row"><div><div class="extension-name"><i class="extension-dot ${enabled ? "ok" : "off"}"></i><b>${escapeHtml(item.name)}</b></div>
      <p class="extension-meta">${escapeHtml(t("extensionSource").replace("{source}", source))}<br>${escapeHtml(detail)}</p></div>
      <div class="extension-actions">${actionControl}${remove}</div></article>`;
  }

  function bindExtensionActions(body, kind, reload) {
    body.querySelectorAll("[data-refresh-extensions]").forEach((button) => { button.onclick = reload; });
      body.querySelectorAll("[data-extension-action]").forEach((button) => {
      button.onclick = () => {
        const action = button.dataset.extensionAction;
        const name = button.dataset.extensionName;
        const route = kind === "skills" ? "/api/grok/skills" : kind === "plugins" ? "/api/grok/plugins" : "/api/grok/mcp";
        const isSwitch = button.classList.contains("switch");
        const previous = button.getAttribute("aria-pressed") === "true";
        const send = () => api(route, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action, name }) })
          .then((data) => {
            if (!data.ok && isSwitch) setSwitchState(button, previous, false);
            toast(data.ok ? "✓" : "!");
            if (data.ok && isSwitch) {
              return new Promise((resolve) => window.setTimeout(() => {
                if (button.isConnected) reload();
                resolve();
              }, 260));
            }
            if (button.isConnected) reload();
          })
          .catch((err) => {
            if (isSwitch) setSwitchState(button, previous, false);
            toast(err.message || t("disconnected"));
          });
        const submit = () => {
          if (isSwitch) setSwitchState(button, action === "enable");
          button.disabled = true;
          button.setAttribute("aria-busy", "true");
          return send().finally(() => {
            if (button.isConnected) {
              button.disabled = false;
              button.removeAttribute("aria-busy");
            }
          });
        };
        if (action === "uninstall" || action === "remove") confirmAction(`${name}？`, submit); else submit();
      };
    });
  }

  function loadExtensions(render) {
    api(`/api/grok/extensions?cwd=${encodeURIComponent(state.cwd || "")}`).then(render).catch((err) => render({ ok: false, error: err.message, skills: [], plugins: [], mcpServers: [] }));
  }

  function renderPluginsTab(body) {
    const draw = (data) => {
      const rows = data.plugins || [];
      body.innerHTML = `${extensionHeader(rows.length)}
        <div class="inline-add"><div class="inline-add-grid plugin-install-grid"><input id="pluginInstallUrl" placeholder="${escapeHtml(t("plInstallHint"))}"><button type="button" class="primary" id="pluginInstall">${escapeHtml(t("plInstall"))}</button></div></div>
        <div class="extension-list">${rows.length ? rows.map((item) => extensionRow(item, "plugins")).join("") : `<div class="extension-empty">${escapeHtml(data.error || t("extensionsNone"))}</div>`}</div>`;
      const reload = () => loadExtensions(draw);
      bindExtensionActions(body, "plugins", reload);
      body.querySelector("#pluginInstall").onclick = () => {
        const url = body.querySelector("#pluginInstallUrl").value.trim();
        if (!url) return;
        api("/api/grok/plugins", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "install", url }) })
          .then((data) => { toast(data.ok ? "✓" : "!"); reload(); }).catch((err) => toast(err.message || t("disconnected")));
      };
    };
    body.innerHTML = `<div class="settings-loading">${escapeHtml(t("processing"))}</div>`;
    loadExtensions(draw);
  }

  function renderSkillsTab(body) {
    const draw = (data) => {
      const rows = data.skills || [];
      body.innerHTML = `${extensionHeader(rows.length)}
        <div class="inline-add skill-install">
          <div class="skill-install-copy"><b>${escapeHtml(t("skillAddInline"))}</b><p class="skill-install-help">${escapeHtml(t("skillAddHelp"))}</p></div>
          <div class="inline-add-grid skill-install-grid"><input id="skillInstallPath" type="text" autocomplete="off" aria-label="${escapeHtml(t("skillPathHint"))}" placeholder="${escapeHtml(t("skillPathHint"))}"><button type="button" class="ghost" id="skillPickFolder">${escapeHtml(t("skillPickFolder"))}</button><button type="button" class="primary" id="skillInstall">${escapeHtml(t("skillAdd"))}</button></div>
        </div>
        <div class="extension-list">${rows.length ? rows.map((item) => extensionRow(item, "skills")).join("") : `<div class="extension-empty">${escapeHtml(data.error || t("extensionsNone"))}</div>`}</div>`;
      const reload = () => loadExtensions(draw);
      bindExtensionActions(body, "skills", reload);
      const pathInput = body.querySelector("#skillInstallPath");
      const pickButton = body.querySelector("#skillPickFolder");
      const installButton = body.querySelector("#skillInstall");
      pickButton.onclick = async () => {
        const nativeApi = window.pywebview && window.pywebview.api;
        if (!nativeApi || typeof nativeApi.pick_folder !== "function") {
          pathInput.focus();
          toast(t("nativePickerDesktopOnly"));
          return;
        }
        pickButton.disabled = true;
        try {
          const selected = await nativeApi.pick_folder(state.cwd || "");
          if (selected && pathInput.isConnected) pathInput.value = selected;
        } catch (err) {
          toast(err && err.message ? err.message : t("nativePickerFailed"));
        } finally {
          if (pickButton.isConnected) pickButton.disabled = false;
        }
      };
      installButton.onclick = () => {
        const path = pathInput.value.trim();
        if (!path) {
          pathInput.focus();
          toast(t("skillPathRequired"));
          return;
        }
        installButton.disabled = true;
        api("/api/grok/skills", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "install", path }) })
          .then((result) => {
            toast(`${t("skillAdded")}${result.name ? `：${result.name}` : ""} ✓`);
            pathInput.value = "";
            reload();
          })
          .catch((err) => toast(err.message || t("disconnected")))
          .finally(() => {
            if (installButton.isConnected) installButton.disabled = false;
          });
      };
    };
    body.innerHTML = `<div class="settings-loading">${escapeHtml(t("processing"))}</div>`;
    loadExtensions(draw);
  }

  function renderMcpTab(body) {
    const draw = (data) => {
      const rows = data.mcpServers || [];
      body.innerHTML = `${extensionHeader(rows.length)}
        <p class="extension-meta" style="margin:0 0 16px">${escapeHtml(t("mcpStateHelp"))}</p>
        <div class="inline-add"><div class="inline-add-grid"><input id="mcpName" placeholder="${escapeHtml(t("mcpName"))}"><input id="mcpCmd" placeholder="${escapeHtml(t("mcpCmd"))}"><button type="button" class="primary" id="mcpAdd">${escapeHtml(t("mcpAdd"))}</button></div>
          <input id="mcpArgs" placeholder="${escapeHtml(t("mcpArgs"))}" style="width:100%;margin-top:9px"></div>
        <div class="extension-list">${rows.length ? rows.map((item) => extensionRow(item, "mcp")).join("") : `<div class="extension-empty">${escapeHtml(data.error || t("extensionsNone"))}</div>`}</div>`;
      const reload = () => loadExtensions(draw);
      bindExtensionActions(body, "mcp", reload);
      body.querySelector("#mcpAdd").onclick = () => {
        const name = body.querySelector("#mcpName").value.trim();
        if (!name) return;
        api("/api/grok/mcp", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "add", name, commandOrUrl: body.querySelector("#mcpCmd").value.trim(), args: body.querySelector("#mcpArgs").value.trim() }) })
          .then((data) => { toast(data.ok ? "✓" : "!"); reload(); }).catch((err) => toast(err.message || t("disconnected")));
      };
    };
    body.innerHTML = `<div class="settings-loading">${escapeHtml(t("processing"))}</div>`;
    loadExtensions(draw);
  }

  function renderAccountTab(body) {
    body.innerHTML = `<div class="preview-empty">${escapeHtml(t("processing"))}</div>`;
    api("/api/account").then((d) => {
      const a = d.account || {};
      const loggedIn = !!d.loggedIn;
      applyUser({ ...a, loggedIn });
      const accountName = loggedIn ? a.name || a.email || t("accountProfile") : t("accountSignedOutShort");
      const localName = loggedIn ? (localStorage.getItem(LOCAL_DISPLAY_NAME_KEY) || "").trim() : "";
      const name = loggedIn && localName ? localName : accountName;
      let runtime = null;
      return api("/api/status").catch(() => null).then((status) => {
        runtime = status;
        const accountAction = loggedIn
          ? `<button type="button" class="primary" id="btnLogout">${escapeHtml(t("accountLogout"))}</button>`
          : `<button type="button" class="primary" id="btnLogin">${escapeHtml(t("accountLogin"))}</button>`;
        body.innerHTML = `
          <div class="account-page">
            <section class="account-card" data-settings-search-key="account">
              <div class="account-identity">
                <span class="account-avatar" aria-hidden="true"><span class="grok-mark"></span></span>
                <div>
                  <h2>${escapeHtml(name)}</h2>
                  <p>${escapeHtml(loggedIn ? a.email || "" : t("accountNotSignedIn"))}</p>
                </div>
              </div>
              <div class="account-action">
                ${accountAction}
                <pre class="cli-pre" id="loginOut" hidden></pre>
              </div>
            </section>
            ${loggedIn ? `
            <section class="account-local-name" data-settings-search-key="accountLocalName">
              <label for="localDisplayName">${escapeHtml(t("accountLocalName"))}</label>
              <div class="account-local-name-control">
                <input id="localDisplayName" type="text" maxlength="40" value="${escapeHtml(localName)}" autocomplete="off">
                <button type="button" class="ghost" id="btnSaveLocalName">${escapeHtml(t("memorySave"))}</button>
              </div>
              <p>${escapeHtml(t("accountLocalNameHelp"))}</p>
            </section>` : ""}
            <section class="runtime-card" id="runtimeCard">
              <div class="runtime-card-head">
                <div>
                  <h2>${escapeHtml(t("runtimeTitle"))}</h2>
                  <p class="runtime-path" data-runtime-path>${escapeHtml(runtime && runtime.grok || "-")}</p>
                </div>
                <button type="button" class="ghost runtime-refresh" id="runtimeRefresh">
                  <span class="runtime-refresh-icon" aria-hidden="true">↻</span>
                  <span data-runtime-refresh-label>${escapeHtml(t("runtimeRefresh"))}</span>
                </button>
              </div>
              <div class="runtime-grid">
                <div class="runtime-item"><span>${escapeHtml(t("runtimeStatus"))}</span><b data-runtime-state></b></div>
                <div class="runtime-item"><span>${escapeHtml(t("runtimeVersion"))}</span><code data-runtime-version></code></div>
              </div>
              <p class="runtime-hint">${escapeHtml(t("runtimeHint"))}</p>
            </section>
          </div>`;

        const runtimeCard = body.querySelector("#runtimeCard");
        const updateRuntime = (status) => {
          const ready = !!(status && status.agentReady);
          const alive = !!(status && status.agentAlive);
          const state = ready ? t("runtimeReady") : alive ? t("runtimeStarting") : t("runtimeUnavailable");
          runtimeCard.classList.toggle("is-ready", ready);
          runtimeCard.querySelector("[data-runtime-state]").textContent = state;
          runtimeCard.querySelector("[data-runtime-version]").textContent = status && status.version || "-";
          runtimeCard.querySelector("[data-runtime-path]").textContent = status && status.grok || "-";
        };
        updateRuntime(runtime);
        body.querySelector("#runtimeRefresh").onclick = async () => {
          const button = body.querySelector("#runtimeRefresh");
          const label = button.querySelector("[data-runtime-refresh-label]");
          button.disabled = true;
          label.textContent = t("runtimeRefreshing");
          try {
            updateRuntime(await api("/api/status"));
          } catch {
            updateRuntime(null);
          } finally {
            button.disabled = false;
            label.textContent = t("runtimeRefresh");
          }
        };

        const logout = body.querySelector("#btnLogout");
        if (logout) {
          logout.onclick = () => {
            confirmAction(t("accountLogoutConfirm"), async () => {
              await api("/api/account/logout", { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" });
              applyUser({});
              toast("✓");
              renderAccountTab(body);
            });
          };
        }
        const login = body.querySelector("#btnLogin");
        if (login) {
          login.onclick = () => startAccountLogin(login, body.querySelector("#loginOut"), () => {
            if (state.settingsTab === "account") renderAccountTab(body);
          });
        }
        const saveLocalName = body.querySelector("#btnSaveLocalName");
        if (saveLocalName) {
          saveLocalName.onclick = () => {
            const input = body.querySelector("#localDisplayName");
            const value = input.value.trim().slice(0, 40);
            if (value) localStorage.setItem(LOCAL_DISPLAY_NAME_KEY, value);
            else localStorage.removeItem(LOCAL_DISPLAY_NAME_KEY);
            const current = { ...a, accountName };
            applyUser(current);
            body.querySelector(".account-identity h2").textContent = value || accountName;
            input.value = value;
            toast("✓");
          };
        }
      });
    }).catch((err) => { body.innerHTML = `<p class="sub">${escapeHtml(err.message || t("disconnected"))}</p>`; });
  }

  function settingsPanel(labelKey, rows) {
    return `<section class="settings-option-panel"${labelKey ? ` data-settings-search-key="${escapeHtml(labelKey)}"` : ""}>${labelKey ? `<div class="settings-option-label">${escapeHtml(t(labelKey))}</div>` : ""}${rows.join("")}</section>`;
  }

  function settingsRow(titleKey, helpKey, control) {
    return `<div class="settings-option-row" data-settings-search-key="${escapeHtml(titleKey)}"><div class="settings-option-copy"><label>${escapeHtml(t(titleKey))}</label>${helpKey ? `<div class="sub">${escapeHtml(t(helpKey))}</div>` : ""}</div><div class="settings-option-control">${control}</div></div>`;
  }

  function settingSwitch(key, titleKey) {
    return `<button type="button" class="switch" data-setting-switch="${escapeHtml(key)}" aria-pressed="${state.settings[key] !== false}" aria-label="${escapeHtml(t(titleKey))}"><i></i></button>`;
  }

  function settingSelect(key) {
    return `<div class="settings-setting-select" id="setting-${escapeHtml(key)}" data-setting-select="${escapeHtml(key)}"></div>`;
  }

  function settingNumber(key, min, max, step, suffix) {
    const value = Number(state.settings[key]);
    return `<div class="settings-number"><input type="number" data-setting-input="${escapeHtml(key)}" min="${min}" max="${max}" step="${step}" value="${Number.isFinite(value) ? value : ""}">${suffix ? `<span>${escapeHtml(suffix)}</span>` : ""}</div>`;
  }

  function bindSettingControls(body, selects) {
    body.querySelectorAll("[data-setting-switch]").forEach((button) => {
      button.onclick = () => {
        const key = button.dataset.settingSwitch;
        const next = button.getAttribute("aria-pressed") !== "true";
        state.settings[key] = next;
        setSwitchState(button, next);
        persist();
      };
    });
    body.querySelectorAll("[data-setting-input]").forEach((inputEl) => {
      inputEl.onchange = () => {
        const key = inputEl.dataset.settingInput;
        const next = Number(inputEl.value);
        if (!Number.isFinite(next)) return;
        state.settings[key] = next;
        state.settings = normalizeSettings(state.settings);
        inputEl.value = state.settings[key];
        persist();
      };
    });
    (selects || []).forEach((item) => {
      const root = body.querySelector(`#setting-${CSS.escape(item.key)}`);
      if (!root) return;
      renderCSelect(root, {
        value: state.settings[item.key],
        options: item.options,
        onChange: (value) => {
          state.settings[item.key] = value;
          state.settings = normalizeSettings(state.settings);
          persist();
          renderSettingsBody();
        }
      });
    });
  }

  function renderAgentTab(body) {
    const forkModelOptions = [{ value: "grok-4.7", label: "grok-4.7" }, ...modelOptions().filter((item) => item.modelId !== "grok-4.7").map((item) => ({ value: item.modelId, label: item.name || item.modelId }))];
    body.innerHTML = settingsPanel("agentExecution", [
      settingsRow("agentPermissionMode", "agentPermissionModeHelp", settingSelect("agentPermissionMode")),
      settingsRow("rememberApprovals", "rememberApprovalsHelp", settingSwitch("rememberApprovals", "rememberApprovals")),
      settingsRow("defaultPermission", "defaultPermissionHelp", settingSelect("defaultPermission")),
      settingsRow("questionTimeout", "questionTimeoutHelp", settingSwitch("questionTimeout", "questionTimeout")),
      settingsRow("subAgents", "subAgentsHelp", settingSwitch("subAgents", "subAgents")),
      settingsRow("doubleCompression", "doubleCompressionHelp", settingSwitch("doubleCompression", "doubleCompression")),
      settingsRow("forkModel", "forkModelHelp", settingSelect("forkModel")),
      settingsRow("cancelSubAgent", "cancelSubAgentHelp", settingSelect("cancelSubAgent"))
    ]);
    const permissionRoot = body.querySelector("#setting-agentPermissionMode");
    if (permissionRoot) renderCSelect(permissionRoot, {
      value: state.permission,
      options: [{ value: "ask", label: t("permAsk") }, { value: "auto", label: t("permAuto") }, { value: "full", label: t("permFull") }],
      onChange: (value) => { setPermission(value, true); renderAgentTab(body); }
    });
    bindSettingControls(body, [
      { key: "defaultPermission", options: [{ value: "always", label: t("defaultPermissionAlways") }, { value: "session", label: t("defaultPermissionSession") }, { value: "ask", label: t("defaultPermissionAsk") }] },
      { key: "forkModel", options: forkModelOptions },
      { key: "cancelSubAgent", options: [{ value: "ask", label: t("cancelSubAgentAsk") }, { value: "stop", label: t("cancelSubAgentStop") }, { value: "continue", label: t("cancelSubAgentContinue") }] }
    ]);
  }

  function renderGitTab(body) {
    body.innerHTML = settingsPanel("worktreePolicy", [
      settingsRow("newSessionWorktree", "newSessionWorktreeHelp", settingSelect("worktreeNew")),
      settingsRow("forkWorktree", "forkWorktreeHelp", settingSelect("worktreeFork")),
      settingsRow("changeTracking", "changeTrackingHelp", settingSelect("worktreeTrack"))
    ]);
    bindSettingControls(body, [
      { key: "worktreeNew", options: [{ value: "never", label: t("worktreeNever") }, { value: "ask", label: t("worktreeAsk") }, { value: "always", label: t("worktreeAlways") }] },
      { key: "worktreeFork", options: [{ value: "never", label: t("worktreeNever") }, { value: "ask", label: t("worktreeAsk") }, { value: "always", label: t("worktreeAlways") }] },
      { key: "worktreeTrack", options: [{ value: "agent", label: t("trackAgent") }, { value: "all", label: t("trackAll") }, { value: "none", label: t("trackNone") }] }
    ]);
  }

  function renderInteractionTab(body) {
    body.innerHTML = settingsPanel("interactionHints", [
      settingsRow("keepSelection", "keepSelectionHelp", settingSelect("keepSelection")),
      settingsRow("undoHints", "undoHintsHelp", settingSwitch("undoHints", "undoHints")),
      settingsRow("planHints", "planHintsHelp", settingSwitch("planHints", "planHints")),
      settingsRow("imageHints", "imageHintsHelp", settingSwitch("imageHints", "imageHints")),
      settingsRow("immediateSendHints", "immediateSendHintsHelp", settingSwitch("immediateSendHints", "immediateSendHints")),
      settingsRow("smallScreenHints", "smallScreenHintsHelp", settingSwitch("smallScreenHints", "smallScreenHints")),
      settingsRow("commandHintsSetting", "commandHintsSettingHelp", settingSwitch("commandHints", "commandHintsSetting"))
    ]);
    bindSettingControls(body, [{ key: "keepSelection", options: [{ value: "flash", label: t("keepSelectionFlash") }, { value: "persistent", label: t("keepSelectionPersistent") }, { value: "none", label: t("keepSelectionNone") }] }]);
  }

  function renderPrivacyTab(body) {
    body.innerHTML = settingsPanel("privacyData", [
      settingsRow("telemetry", "telemetryHelp", settingSwitch("telemetry", "telemetry")),
      settingsRow("feedback", "feedbackHelp", settingSwitch("feedback", "feedback"))
    ]);
    bindSettingControls(body);
  }

  function renderSettingsBody() {
    const body = $("settingsBody");
    if (state.settingsTab === "appearance") state.settingsTab = "general";
    const tab = state.settingsTab;
    updateSettingsHeading();
    if (tab === "agent") { renderAgentTab(body); return; }
    if (tab === "git") { renderGitTab(body); return; }
    if (tab === "interaction") { renderInteractionTab(body); return; }
    if (tab === "privacy") { renderPrivacyTab(body); return; }
    if (tab === "voice") {
      body.innerHTML = settingsPanel("voiceGeneral", [
        settingsRow("voiceInputDevice", "voiceInputDeviceHelp", `<div class="voice-device-controls"><div class="voice-device-select" id="voiceInputDeviceSelect"></div><button type="button" class="ghost voice-device-action" id="voiceRefreshDevices">${escapeHtml(t("voiceRefreshDevices"))}</button></div>`),
        settingsRow("voiceRecognitionLanguage", "voiceRecognitionLanguageHelp", `<div class="voice-device-select" id="voiceRecognitionLanguageSelect"></div>`),
        settingsRow("voiceOutputDevice", "voiceOutputDeviceHelp", `<div class="voice-device-controls"><div class="voice-device-select" id="voiceOutputDeviceSelect"></div><div class="voice-device-buttons"><button type="button" class="ghost voice-device-action" id="voiceChooseOutput">${escapeHtml(t("voiceChooseOutput"))}</button><button type="button" class="ghost voice-device-action" id="voiceTestOutput">${escapeHtml(t("voiceTestOutput"))}</button></div></div>`)
      ]) + settingsPanel("voiceDictation", [
        settingsRow("voiceHotkey", "voiceHotkeyHelp", `<div class="voice-hotkey-controls"><kbd id="voiceHotkeyValue"></kbd><button type="button" class="ghost voice-device-action" id="voiceHotkeyCapture"></button></div>`)
      ]) + `
        <section class="settings-option-panel voice-dictionary-panel" data-settings-search-key="voiceDictionaryTitle">
          <div class="settings-option-label">${escapeHtml(t("voiceDictionaryTitle"))}</div>
          <div class="voice-dictionary-help">${escapeHtml(t("voiceDictionaryHelp"))}</div>
          <div class="voice-dictionary-list" id="voiceDictionaryList"></div>
          <div class="voice-dictionary-add-row">
            <input type="text" id="voiceDictionaryNew" maxlength="50" data-i18n-placeholder="voiceDictionaryPlaceholder" placeholder="${escapeHtml(t("voiceDictionaryPlaceholder"))}">
            <button type="button" class="ghost voice-device-action" id="voiceDictionaryAdd"><span aria-hidden="true">＋</span> ${escapeHtml(t("voiceDictionaryAdd"))}</button>
          </div>
        </section>`;
      renderVoiceDeviceControls(body);
      body.querySelector("#voiceRefreshDevices").onclick = () => { refreshVoiceDevices(true); };
      body.querySelector("#voiceChooseOutput").onclick = () => { chooseVoiceOutputDevice(); };
      body.querySelector("#voiceTestOutput").onclick = () => { testVoiceOutput(); };
      body.querySelector("#voiceHotkeyCapture").onclick = () => {
        voiceHotkeyCapturing = !voiceHotkeyCapturing;
        voiceHotkeyPendingModifier = "";
        renderVoiceHotkeyControls(body);
      };
      renderVoiceHotkeyControls(body);
      renderVoiceDictionary(body);
      refreshVoiceDevices(false);
      return;
    }
    if (tab === "general") {
      const pack = (window.GROK_I18N[state.lang] || {}).themes || {};
      body.innerHTML = `
        <div class="field field-row" data-settings-search-key="thinkingBlocks">
          <div><label>${escapeHtml(t("thinkingBlocks"))}</label></div>
          <button type="button" class="switch" id="toggleThinking" aria-pressed="${state.showThinking}" aria-label="${escapeHtml(t("thinkingBlocks"))}"><i></i></button>
        </div>
        <div class="field field-row" data-settings-search-key="autoUpdateTui">
          <div><label>${escapeHtml(t("autoUpdateTui"))}</label>
            <div class="sub">${escapeHtml(t("autoUpdateTuiHelp"))}</div></div>
          <button type="button" class="switch" id="autoUpdateTuiToggle" aria-pressed="true" disabled><i></i></button>
        </div>
        <div class="field field-row" data-settings-search-key="closeAction">
          <div><label>${escapeHtml(t("closeAction"))}</label>
            <div class="sub">${escapeHtml(t("closeActionHelp"))}</div></div>
          <div class="seg">
            <button type="button" data-close="tray" aria-pressed="${(state.closeAction || "tray") === "tray"}">${escapeHtml(t("closeActionTray"))}</button>
            <button type="button" data-close="exit" aria-pressed="${state.closeAction === "exit"}">${escapeHtml(t("closeActionExit"))}</button>
          </div>
        </div>
        <div class="field field-row" data-settings-search-key="language">
          <div>
            <label>${escapeHtml(t("language"))}</label>
            <div class="sub">${escapeHtml(t("langHelp"))}</div>
          </div>
          <div class="lang-select" id="langSelect">
            <button type="button" class="lang-btn" id="langBtn" aria-haspopup="dialog" aria-controls="languageDialog" aria-expanded="false">
              <span id="langLabel"></span>
              <svg viewBox="0 0 12 12" width="11" height="11" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" d="M2.2 4.2 6 8l3.8-3.8"/></svg>
            </button>
          </div>
        </div>
        <div class="field field-row" data-settings-search-key="interfaceFont">
          <div>
            <label>${escapeHtml(t("interfaceFont"))}</label>
            <div class="sub">${escapeHtml(t("interfaceFontHelp"))}</div>
          </div>
          <div class="lang-select" id="fontSelect"></div>
        </div>
        <div class="field field-row capability-row">
          <div>
            <label>${escapeHtml(t("browserCapability"))}</label>
            <div class="sub">${escapeHtml(t("browserCapabilityHelp"))}</div>
          </div>
          <span class="capability-badge unavailable">${escapeHtml(t("browserUnavailable"))}</span>
        </div>
        <div class="field" data-settings-search-key="workStyle">
          <label>${escapeHtml(t("workStyle"))}</label>
          <div class="style-grid">
            <button type="button" class="style-card" data-style="harness" aria-pressed="${state.workStyle === "harness"}">
              <b>${escapeHtml(t("workHarness"))}</b>
              <span>${escapeHtml(t("workHarnessHelp"))}</span>
            </button>
            <button type="button" class="style-card" data-style="classic" aria-pressed="${state.workStyle === "classic"}">
              <b>${escapeHtml(t("workClassic"))}</b>
              <span>${escapeHtml(t("workClassicHelp"))}</span>
            </button>
          </div>
        </div>
        <div class="field" data-settings-search-key="theme"><label>${escapeHtml(t("theme"))}</label>
          <div class="theme-grid">${THEMES.map((th) =>
            `<button type="button" class="theme-card" data-theme="${th}" aria-pressed="${state.theme === th}"><i class="theme-dot" data-theme-dot="${th}"></i>${escapeHtml(pack[th] || th)}</button>`
          ).join("")}</div>
        </div>
        <div class="field field-actions" data-settings-search-key="usage">
          <button type="button" class="ghost" id="btnUsage">${escapeHtml(t("usage"))}</button>
          <button type="button" class="ghost" id="btnDoctor">${escapeHtml(t("doctor"))}</button>
          <button type="button" class="ghost" id="btnExport">${escapeHtml(t("export"))}</button>
        </div>
        ${settingsPanel("startupBehavior", [
          settingsRow("startupHints", "startupHintsHelp", settingSwitch("startupHints", "startupHints")),
          settingsRow("compressionThreshold", "compressionThresholdHelp", settingNumber("compressionThreshold", 50, 99, 1, "%")),
          settingsRow("loadEnvrc", "loadEnvrcHelp", settingSwitch("loadEnvrc", "loadEnvrc")),
          settingsRow("remoteFetch", "remoteFetchHelp", settingSwitch("remoteFetch", "remoteFetch"))
        ])}`;
      body.querySelector("#toggleThinking").onclick = () => {
        const sw = body.querySelector("#toggleThinking");
        const next = sw.getAttribute("aria-pressed") !== "true";
        applyThinking(next);
        setSwitchState(sw, next);
        persist();
      };
      const autoUpdateToggle = body.querySelector("#autoUpdateTuiToggle");
      api("/api/config").then((cfg) => {
        if (!autoUpdateToggle || !autoUpdateToggle.isConnected) return;
        autoUpdateToggle.disabled = false;
        setSwitchState(autoUpdateToggle, !!cfg.autoUpdateTui, false);
        autoUpdateToggle.onclick = () => {
          const next = autoUpdateToggle.getAttribute("aria-pressed") !== "true";
          autoUpdateToggle.disabled = true;
          api("/api/config", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ autoUpdateTui: next }) })
            .then((saved) => {
              const enabled = typeof saved.autoUpdateTui === "boolean" ? saved.autoUpdateTui : next;
              setSwitchState(autoUpdateToggle, enabled);
              toast(enabled ? t("autoUpdateTuiOn") : t("autoUpdateTuiOff"));
            })
            .catch((err) => toast(err.message || t("disconnected")))
            .finally(() => { if (autoUpdateToggle.isConnected) autoUpdateToggle.disabled = false; });
        };
      }).catch(() => {});
      body.querySelectorAll("[data-close]").forEach((b) => {
        b.onclick = () => {
          state.closeAction = b.dataset.close;
          persist();
          renderSettingsBody();
        };
      });
      body.querySelector("#btnUsage").onclick = () => openSettings("usage");
      body.querySelector("#btnDoctor").onclick = () => showToolPanel("/api/doctor", "doctor");
      body.querySelector("#btnExport").onclick = () => exportChat();
      body.querySelectorAll("[data-style]").forEach((b) => {
        b.onclick = () => { applyWorkStyle(b.dataset.style, true); renderSettingsBody(); };
      });
      body.querySelectorAll("[data-theme]").forEach((b) => {
        b.onclick = () => { applyTheme(b.dataset.theme, true); renderSettingsBody(); };
      });
      const fontValue = state.settings.fontFamily === "auto"
        ? (state.lang.startsWith("zh") ? "misans" : "x")
        : state.settings.fontFamily;
      renderCSelect(body.querySelector("#fontSelect"), {
        value: fontValue,
        options: [
          { value: "misans", label: t("fontOptionMiSans") },
          { value: "x", label: t("fontOptionX") },
          { value: "apple", label: t("fontOptionApple") }
        ],
        onChange: (value) => {
          state.settings.fontFamily = value;
          state.settings = normalizeSettings(state.settings);
          applyFont(value);
          persist();
          renderSettingsBody();
        }
      });
      renderLangSelect(body.querySelector("#langSelect"));
      bindSettingControls(body);
      return;
    }
    if (tab === "tools") { renderToolsTab(body); return; }
    if (tab === "mcp") { renderMcpTab(body); return; }
    if (tab === "plugins") { renderPluginsTab(body); return; }
    if (tab === "skills") { renderSkillsTab(body); return; }
    if (tab === "account") { renderAccountTab(body); return; }
    if (tab === "model") {
      const opts = modelOptions();
      const cur = opts.find((m) => m.modelId === state.model) || {};
      const providerSource = currentProviderSource();
      const providerLabel = providerSource === "custom" ? t("providerThirdParty") : providerSource === "official" ? t("providerOfficial") : t("providerUnknown");
      body.innerHTML = `
        <div class="field" data-settings-search-key="model"><div class="model-grid">${opts.map((m) => {
            const sel = m.modelId === state.model;
            const contextTokens = modelContextTokens(m);
            const ctx = contextTokens ? formatTokens(contextTokens) : "";
            return `<button type="button" class="model-card${sel ? " on" : ""}" data-model="${escapeHtml(m.modelId)}" aria-pressed="${sel}">
              <span class="mc-head"><b>${escapeHtml(m.name || m.modelId)}</b>${sel ? `<i class="cur">${escapeHtml(t("currentModel"))}</i>` : ""}</span>
              <small>${escapeHtml(m.modelId)}${ctx ? ` · ${escapeHtml(t("ctxSize"))} ${ctx}` : ""}</small>
              ${m.description ? `<p>${escapeHtml(m.description)}</p>` : ""}
            </button>`;
          }).join("")}</div>
          <div class="sub" style="margin-top:10px">
            <button type="button" class="ghost" id="btnRestartAgent">${escapeHtml(t("agentRestart"))}</button>
          </div>
        </div>
        <div class="field" data-settings-search-key="accessMode"><label>${escapeHtml(t("accessMode"))}</label>
          <div class="provider-current" role="status">
            <span class="provider-current-label">${escapeHtml(t("providerCurrent"))}</span>
            <span class="provider-current-value provider-${escapeHtml(providerSource)}"><i aria-hidden="true"></i><b>${escapeHtml(providerLabel)}</b></span>
          </div>
          <div class="provider-grid">
            <button type="button" class="provider-card" data-access="official" aria-pressed="${providerSource === "official"}">
              <b>${escapeHtml(t("officialPlan"))}</b><span>${escapeHtml(t("officialPlanDesc"))}</span>
            </button>
            <button type="button" class="provider-card" data-access="custom" aria-pressed="${state.providerFormOpen || providerSource === "custom"}">
              <b>${escapeHtml(t("customApi"))}</b><span>${escapeHtml(t("customApiDesc"))}</span>
            </button>
          </div>
          <div id="providerBox"></div>
        </div>`;
      body.querySelectorAll("[data-model]").forEach((b) => {
        b.onclick = () => {
          const val = b.dataset.model;
          if (!val || val === state.model) return;
          state.model = val;
          api("/api/model", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ sessionId: state.sessionId, model: state.model }) })
            .then((r) => toast(r && r.applied ? t("modelApplied") + " " + state.model : t("modelApplyFail")))
            .catch(() => toast(t("modelApplyFail")));
          persist();
          renderPicks();
          renderLiveMeta();
          renderSettingsBody();
        };
      });
      const restartBtn = body.querySelector("#btnRestartAgent");
      if (restartBtn) restartBtn.onclick = () => {
        restartBtn.disabled = true;
        restartBtn.textContent = t("agentRestarting");
        api("/api/agent/restart", { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" })
          .then(() => setTimeout(() => { bootModelsOnly(); toast(t("agentRestarted")); }, 2500))
          .catch((err) => toast(err.message || t("disconnected")));
      };
      body.querySelector('[data-access="custom"]').onclick = () => {
        state.providerFormOpen = !state.providerFormOpen;
        renderSettingsBody();
      };
      if (state.providerFormOpen) renderProviderBox(body.querySelector("#providerBox"));
      return;
    }
    if (tab === "memory") {
      const memoryToggleMarkup = () => `<div class="field bigcard" data-settings-search-key="memoryToggle">
          <div class="bigcard-head"><div><label>${escapeHtml(t("memoryToggle"))}</label>
            <div class="sub">${escapeHtml(t("memoryToggleHelp"))}</div></div>
            <button type="button" class="switch" id="memToggle" aria-pressed="true" disabled><i></i></button>
          </div>
        </div>`;
      const memoryOptionsMarkup = () => settingsPanel("memoryPolicy", [
        settingsRow("memorySaveEnd", "memorySaveEndHelp", settingSwitch("memorySaveEnd", "memorySaveEnd")),
        settingsRow("memoryWatch", "memoryWatchHelp", settingSwitch("memoryWatch", "memoryWatch")),
        settingsRow("memoryMax", "memoryMaxHelp", settingNumber("memoryMax", 1, 100, 1, "")),
        settingsRow("memorySimilarity", "memorySimilarityHelp", settingNumber("memorySimilarity", 0, 1, 0.01, "")),
        settingsRow("memoryInject", "memoryInjectHelp", settingSwitch("memoryInject", "memoryInject"))
      ]);
      const memoryIntroMarkup = () => "";
      const bindMemoryToggle = () => {
        api("/api/config").then((cfg) => {
           const sw = body.querySelector("#memToggle");
           if (!sw) return;
           sw.disabled = false;
           setSwitchState(sw, !!cfg.memoryEnabled, false);
           sw.onclick = () => {
             const next = sw.getAttribute("aria-pressed") !== "true";
             sw.disabled = true;
            api("/api/config", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ memoryEnabled: next }) })
              .then((saved) => {
               const enabled = typeof saved.memoryEnabled === "boolean" ? saved.memoryEnabled : next;
                setSwitchState(sw, enabled);
                toast(enabled ? t("memoryToggleOn") : t("memoryToggleOff"));
              })
              .catch((err) => toast(err.message || t("disconnected")))
              .finally(() => { if (sw.isConnected) sw.disabled = false; });
          };
        }).catch(() => {});
      };
      body.innerHTML = memoryToggleMarkup() + memoryOptionsMarkup() + memoryIntroMarkup() + `<div class="preview-empty">${escapeHtml(t("processing"))}</div>`;
      bindMemoryToggle();
      bindSettingControls(body);
      api("/api/memory").then((data) => {
        const cards = [];
        const cardTpl = (title, path, text) => `
          <div class="field mem-card">
            <div class="field-row"><label>${escapeHtml(title)}</label>
              <button type="button" class="primary mem-save" data-path="${escapeHtml(path)}">${escapeHtml(t("memorySave"))}</button></div>
            <textarea class="mem-text" data-path="${escapeHtml(path)}" spellcheck="false">${escapeHtml(text || "")}</textarea>
          </div>`;
        if (data.global) cards.push(cardTpl(t("memoryGlobal"), data.global.path, data.global.text));
        if (data.agents) cards.push(cardTpl(t("memoryAgents"), data.agents.path, data.agents.text));
        (data.workspaces || []).forEach((w) => cards.push(cardTpl(`${t("memoryWorkspace")} · ${w.slug}`, w.path, w.text)));
        body.innerHTML = memoryToggleMarkup() + memoryOptionsMarkup() + memoryIntroMarkup() +
          (cards.join("") || `<div class="preview-empty">${escapeHtml(t("memoryEmpty"))}</div>`);
        bindMemoryToggle();
        bindSettingControls(body);
        body.querySelectorAll(".mem-save").forEach((btn) => {
          btn.onclick = () => {
            const path = btn.dataset.path;
            const area = body.querySelector(`.mem-text[data-path="${CSS.escape(path)}"]`);
            if (!area) return;
            btn.disabled = true;
            api("/api/memory", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ path, text: area.value }) })
              .then(() => toast(t("memorySaved")))
              .catch((err) => toast(t("memoryFail") + (err.message || "")))
              .finally(() => { btn.disabled = false; });
          };
        });
      }).catch((err) => {
        body.innerHTML = memoryToggleMarkup() + memoryOptionsMarkup() + memoryIntroMarkup() + `<p class="sub">${escapeHtml(err.message || t("disconnected"))}</p>`;
        bindMemoryToggle();
        bindSettingControls(body);
      });
      return;
    }
    if (tab === "usage") {
      body.innerHTML = `<div class="field"><label>${escapeHtml(t("usageNow"))}</label></div>
        <div class="preview-empty">${escapeHtml(t("processing"))}</div>`;
      const weeklyPromise = api("/api/usage/summary").catch(() => null);
      const sessionPromise = state.sessionId ? api(`/api/usage/session/${encodeURIComponent(state.sessionId)}`).catch(() => null) : Promise.resolve(null);
      Promise.all([weeklyPromise, sessionPromise]).then(([u, su]) => {
        const turns = (su && su.turns) || [];
        const costSum = turns.reduce((acc, x) => acc + (x.costUsd || 0), 0);
        const ctx = su && su.contextWindowTokens
          ? `${t("ctxRuntimeWindow")}：${formatTokens(su.contextTokensUsed)} / ${formatTokens(su.contextWindowTokens)} · ${su.contextWindowUsage || Math.round((100 * su.contextTokensUsed) / su.contextWindowTokens)}%`
          : "-";
        body.innerHTML = `
          <div class="field"><label>${escapeHtml(t("quotaTitle"))}</label>
            <div class="quota-card">
              <div class="sub">${escapeHtml(t("quotaBody"))}</div>
              <button type="button" class="ghost" id="btnQuotaOpen">${escapeHtml(t("openAccount"))}</button>
            </div>
          </div>
          <div class="field"><label>${escapeHtml(t("usageNow"))}</label>
            <div class="usage-grid">
              <div class="usage-card"><b>${ctx}</b><span>${escapeHtml(t("ctxUsage"))}</span></div>
              <div class="usage-card"><b>${(su && su.turnCount) || 0}</b><span>${escapeHtml(t("usageTurns"))}</span></div>
              <div class="usage-card"><b>${(su && su.toolCallCount) || 0}</b><span>${escapeHtml(t("usageTools"))}</span></div>
              <div class="usage-card"><b>${turns.length ? fmtCost(costSum) : "-"}</b><span>${escapeHtml(t("usageCost"))}</span></div>
            </div>
          </div>
          ${turns.length ? `<div class="field"><label>${escapeHtml(t("lastTurn"))}</label>
            <div class="turn-list">${turns.slice().reverse().map((x) => `
              <div class="file-row"><b>#${x.ts || ""} · ↑${formatTokens(x.inputTokens)} ↓${formatTokens(x.outputTokens)}${x.reasoningTokens ? ` · ${escapeHtml(t("reasoningShort"))} ${formatTokens(x.reasoningTokens)}` : ""}${x.costUsd ? ` · ${fmtCost(x.costUsd)}` : ""}</b>
              <small>${x.models ? escapeHtml(x.models.join(", ")) : ""}${x.modelCalls ? ` · ${x.modelCalls} calls` : ""}</small></div>`).join("")}</div>
          </div>` : ""}
          ${u ? `<div class="field"><label>${escapeHtml(t("weeklyUsage"))}</label>
            <div class="sub">${escapeHtml(t("usageHelp"))}</div></div>
          <div class="usage-grid">
            <div class="usage-card"><b>${u.sessions ?? 0}</b><span>${escapeHtml(t("usageSessions"))}</span></div>
            <div class="usage-card"><b>${u.turns ?? 0}</b><span>${escapeHtml(t("usageTurns"))}</span></div>
            <div class="usage-card"><b>${u.tools ?? 0}</b><span>${escapeHtml(t("usageTools"))}</span></div>
            <div class="usage-card"><b>${formatTokens(u.tokens)}</b><span>${escapeHtml(t("usageTokens"))}</span></div>
          </div>
          ${u.models && u.models.length ? `<div class="field"><label>${escapeHtml(t("model"))}</label><div class="sub">${escapeHtml(u.models.join(", "))}</div></div>` : ""}` : ""}`;
        const qBtn = body.querySelector("#btnQuotaOpen");
        if (qBtn) qBtn.onclick = () => window.open("https://grok.com", "_blank", "noopener");
      });
      return;
    }
    if (tab === "archive") {
      body.innerHTML = `<div class="settings-loading">${escapeHtml(t("processing"))}</div>`;
      api("/api/sessions?archived=1").then((data) => {
        const rows = data.sessions || [];
        const intro = `<div class="archive-toolbar">${rows.length ? `<button type="button" class="danger" id="purgeArchived">${escapeHtml(t("purgeArchived"))} (${rows.length})</button>` : ""}</div>`;
        if (!rows.length) {
          body.innerHTML = intro + `<div class="archive-list"><div class="preview-empty">${escapeHtml(t("noArchived"))}</div></div>`;
          return;
        }
        body.innerHTML = intro + `<div class="archive-list">` + rows.map((s) => `<div class="archive-row" data-id="${escapeHtml(s.id)}">
            <div><b>${escapeHtml(s.title || t("newChat"))}</b><small>${escapeHtml(workspaceName(s.cwd))} · ${escapeHtml(relTime(s.updated))}</small></div>
            <div class="perm-actions">
              <button type="button" class="ghost" data-act="unarchive">${escapeHtml(t("unarchive"))}</button>
              <button type="button" class="danger" data-act="delete">${escapeHtml(t("deleteForever"))}</button>
            </div>
          </div>`).join("") + `</div>`;
        body.querySelectorAll(".archive-row").forEach((row) => {
          const unarchive = row.querySelector("[data-act='unarchive']");
          const remove = row.querySelector("[data-act='delete']");
          const run = async (button, action) => {
            if (!button || button.disabled) return;
            button.disabled = true;
            try { await action(); } finally { if (button.isConnected) button.disabled = false; }
          };
          unarchive.onclick = () => run(unarchive, () => archiveSession(row.dataset.id, false));
          remove.onclick = () => confirmAction(t("deleteForever") + "?", () => run(remove, () => deleteSession(row.dataset.id)));
        });
        const purgeBtn = body.querySelector("#purgeArchived");
        if (purgeBtn) purgeBtn.onclick = () => {
          confirmAction(t("purgeConfirm").replace("{n}", String(rows.length)), async () => {
            purgeBtn.disabled = true;
            try {
              const result = await api("/api/sessions/purge-archived", { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" });
              toast(`${t("purgeArchived")} · ${result.removed ?? rows.length} ✓`);
            } catch (err) {
              toast(err.message || t("disconnected"));
            } finally {
              if (purgeBtn.isConnected) purgeBtn.disabled = false;
              renderSettingsBody();
            }
          });
        };
      }).catch((err) => {
        body.innerHTML = `<p class="sub">${escapeHtml(err.message || t("disconnected"))}</p>`;
      });
      return;
    }
    if (tab === "commands") {
      renderCommandPanel(body);
      return;
    }
    const guide = (window.GROK_HELP && (window.GROK_HELP[state.lang] || window.GROK_HELP["zh-CN"])) || [];
    if (guide.length) {
      body.innerHTML = guide.map((sec) => `
        <section class="help-sec">
          <h4>${escapeHtml(sec.title)}</h4>
          ${sec.html}
        </section>`).join("");
    } else {
      body.innerHTML = `<p class="sub">${escapeHtml(t("help"))}</p>`;
    }
  }

  function closeSettingsSearchResults() {
    const results = $("settingsSearchResults");
    if (results) results.hidden = true;
    $("settingsSearch")?.setAttribute("aria-expanded", "false");
  }

  function renderSettingsSearchResults(value) {
    const input = $("settingsSearch");
    const results = $("settingsSearchResults");
    if (!input || !results) return [];
    const query = String(value || "").trim().toLocaleLowerCase();
    if (!query) {
      closeSettingsSearchResults();
      document.querySelectorAll("#settingsTabs [data-stab], #settingsTabs .nav-group").forEach((item) => { item.hidden = false; });
      results.innerHTML = "";
      return [];
    }

    const english = window.GROK_I18N.en || {};
    const candidates = SETTINGS_SEARCH_ITEMS.map(([tab, target, labelKey, ...keys]) => {
      const allKeys = [labelKey, ...keys];
      const corpus = [...new Set(allKeys.flatMap((key) => [t(key), english[key], key]).filter(Boolean))].join(" ");
      const category = t(SETTINGS_SEARCH_TABS[tab]);
      return { tab, target, label: t(labelKey), detail: t(allKeys.find((key) => key.endsWith("Help")) || SETTINGS_SEARCH_TABS[tab]), corpus: `${category} ${corpus}`, category };
    });
    const models = [...(Array.isArray(state.modelCatalog) ? state.modelCatalog : []), ...(Array.isArray(state.models) ? state.models : [])];
    models.forEach((model) => {
      const id = typeof model === "string" ? model : model && (model.modelId || model.id || model.model) || "";
      const label = typeof model === "string" ? model : model && (model.name || model.label) || id;
      if (id) candidates.push({ tab: "model", target: "model", label, detail: id, category: t("modelTab"), corpus: `${label} ${id} ${t("modelTab")}` });
    });
    Object.entries(SETTINGS_SEARCH_TABS).forEach(([tab, key]) => {
      const label = t(key);
      const pack = window.GROK_I18N[state.lang] || {};
      candidates.push({ tab, target: "", label, detail: label, category: label, corpus: `${label} ${pack[key] || ""} ${english[key] || ""}` });
    });

    const matches = candidates.filter((item) => item.corpus.toLocaleLowerCase().includes(query));
    const rank = (item) => item.label.toLocaleLowerCase() === query ? 0 : item.label.toLocaleLowerCase().startsWith(query) ? 1 : 2;
    matches.sort((a, b) => rank(a) - rank(b));
    const matchingTabs = new Set(matches.map((item) => item.tab));
    document.querySelectorAll("#settingsTabs [data-stab]").forEach((button) => { button.hidden = !matchingTabs.has(button.dataset.stab); });
    document.querySelectorAll("#settingsTabs .nav-group").forEach((group) => {
      let next = group.nextElementSibling;
      let visible = false;
      while (next && !next.classList.contains("nav-group")) {
        if (!next.hidden) visible = true;
        next = next.nextElementSibling;
      }
      group.hidden = !visible;
    });

    const shown = matches.slice(0, 8);
    results.innerHTML = shown.length
      ? shown.map((item) => `<button type="button" role="option" aria-selected="false" data-settings-search-result data-tab="${escapeHtml(item.tab)}" data-target="${escapeHtml(item.target)}"><b>${escapeHtml(item.label)}</b><small>${escapeHtml(item.category)}${item.detail && item.detail !== item.category ? ` · ${escapeHtml(item.detail)}` : ""}</small></button>`).join("")
      : `<div class="settings-search-empty">${escapeHtml(t("settingsSearchEmpty"))}</div>`;
    results.hidden = false;
    input.setAttribute("aria-expanded", "true");
    return shown;
  }

  function selectSettingsSearchResult(button) {
    const tab = button.dataset.tab;
    const targetKey = button.dataset.target;
    const input = $("settingsSearch");
    if (input) input.value = "";
    renderSettingsSearchResults("");
    openSettings(tab);
    requestAnimationFrame(() => {
      const body = $("settingsBody");
      const target = targetKey
        ? [...body.querySelectorAll("[data-settings-search-key]")].find((item) => item.dataset.settingsSearchKey === targetKey)
        : null;
      const destination = target || body.firstElementChild;
      if (!destination) return;
      destination.scrollIntoView({ behavior: "smooth", block: "center" });
      destination.classList.remove("settings-search-hit");
      void destination.offsetWidth;
      destination.classList.add("settings-search-hit");
      setTimeout(() => destination.classList.remove("settings-search-hit"), 1250);
    });
  }

  function openSettings(tab) {
    if (tab === "ops" || tab === "look" || tab === "appearance") tab = "general";
    recordAppNavigation({ view: "settings", tab: tab || state.settingsTab });
    if (tab) state.settingsTab = tab;
    closeAutomations();
    closeMarket();
    $("settingsBack").classList.add("show");
    $("settingsBack").setAttribute("aria-hidden", "false");
    document.querySelectorAll("#settingsTabs [data-stab]").forEach((b) => {
      b.setAttribute("aria-selected", String(b.dataset.stab === state.settingsTab));
    });
    if (typeof renderSettingsNavIcons === "function") renderSettingsNavIcons();
    renderSettingsBody();
    startSettingsRefresh();
  }

  function updateSettingsHeading() {
    const key = {
      general: "generalTab", model: "modelTab", memory: "memoryTab", tools: "toolsTab",
      mcp: "mcpTab", plugins: "pluginsTab", skills: "skillsTab", usage: "usage",
      archive: "archive", commands: "commands", account: "accountTitle", help: "help",
      interaction: "interactionTab", voice: "voiceSettingsTitle", agent: "agentTab", git: "gitTab", privacy: "privacyTab"
    }[state.settingsTab] || "settings";
    const leadKey = {
      model: "modelHelp",
      memory: "memoryHelp",
      mcp: "extensionsMcpLead",
      plugins: "extensionsPluginsLead",
      skills: "extensionsSkillsLead",
      archive: "archiveHelp",
      account: "accountLead",
      interaction: "interactionLead",
      agent: "agentLead",
      git: "gitLead",
      privacy: "privacyLead"
    }[state.settingsTab];
    $("settingsTitle").textContent = t(key);
    $("settingsLead").textContent = leadKey ? t(leadKey) : "";
  }

  function closeSettings() {
    $("settingsBack").classList.remove("show");
    $("settingsBack").setAttribute("aria-hidden", "true");
    closeSettingsSearchResults();
    if (settingsRefreshTimer) {
      clearInterval(settingsRefreshTimer);
      settingsRefreshTimer = null;
    }
  }

  function startSettingsRefresh() {
    if (settingsRefreshTimer) clearInterval(settingsRefreshTimer);
    settingsRefreshTimer = setInterval(() => {
      if (!$("settingsBack").classList.contains("show")) return closeSettings();
      if (!["mcp", "plugins", "skills"].includes(state.settingsTab)) return;
      if (document.activeElement && /^(INPUT|TEXTAREA)$/.test(document.activeElement.tagName)) return;
      renderSettingsBody();
    }, 15000);
  }

  $("composer").onsubmit = (e) => { e.preventDefault(); sendPrompt().catch((err) => { endTurn(); alert(err.message); }); };
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendPrompt().catch((err) => { endTurn(); alert(err.message); }); }
  });
  input.addEventListener("input", () => {
    if (input.value.startsWith("/")) showPalette(input.value.trim());
    else hidePalette();
  });
  sendBtn.onclick = (e) => {
    if (!state.running) return;
    e.preventDefault();
    e.stopPropagation();
    api("/api/cancel", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ sessionId: state.sessionId }) }).finally(endTurn);
  };
  $("newChat").onclick = () => newChat();
  $("brandHome").onclick = () => newChat();
  const pc = $("pickCwd"); if (pc) pc.onclick = () => openPicker();
  $("pickerCancel").onclick = closePicker;
  $("pickerNative").onclick = pickFolderWithSystem;
  $("pickerOk").onclick = () => usePickerPath(pickerPath);
  $("attachBtn").onclick = (e) => { e.stopPropagation(); toggleComposerMenu(); };
  $("voiceBtn").onclick = () => {
    if (voicePhase === "recording") stopVoiceRecording();
    else startVoiceRecording();
  };
  window.addEventListener("pagehide", () => {
    voiceHotkeyPressActive = false;
    voiceHotkeyPendingModifier = "";
    voiceHotkeyCapturing = false;
    closeVoiceCapture(voiceCapture);
    voiceCapture = null;
    voicePhase = "idle";
  });
  $("composerAddMenu").onclick = (e) => {
    e.stopPropagation();
    const item = e.target.closest("[data-composer-action]");
    if (!item) return;
    runComposerAction(item.dataset.composerAction);
  };
  $("composerAddMenu").oninput = (e) => {
    if (e.target.matches("[data-composer-search]")) filterComposerMenu(e.target.value);
  };
  $("composerAddMenu").onkeydown = (e) => {
    if (!e.target.matches("[data-composer-search]")) return;
    if (e.key === "Enter") e.preventDefault();
    if (e.key === "Escape") {
      e.preventDefault();
      e.stopPropagation();
      closeComposerMenu();
      $("attachBtn").focus();
    }
  };
  $("filePick").onchange = () => {
    const files = [...($("filePick").files || [])];
    files.forEach((f) => addPending(f));
    $("filePick").value = "";
  };
  $("workModeNoticeClose").onclick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setWorkMode("agent", true);
    input.focus();
  };
  $("todoDockToggle").onclick = () => {
    state.todoDockOpen = !state.todoDockOpen;
    renderTodoDock();
  };
  $("toggleSidebar").onclick = () => {
    state.sidebarCollapsed = !state.sidebarCollapsed;
    localStorage.setItem("grok-webui-rail", state.sidebarCollapsed ? "1" : "0");
    $("app").classList.toggle("sidebar-collapsed", state.sidebarCollapsed);
    applyPaneWidths();
  };
  $("navBack").onclick = () => moveAppNavigation(-1);
  $("navForward").onclick = () => moveAppNavigation(1);
  updateAppNavigationButtons();
  $("modelBtn").onclick = (e) => { e.stopPropagation(); openPick("model"); };
  $("effortBtn").onclick = (e) => { e.stopPropagation(); openPick("effort"); };
  $("permissionBtn").onclick = (e) => { e.stopPropagation(); openPermissionPick(); };
  $("modelPop").onclick = (e) => {
    e.stopPropagation();
    const btn = e.target.closest("button");
    if (!btn) return;
    const val = btn.dataset.val;
    if (val && val !== state.model) {
      state.model = val;
      api("/api/model", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ sessionId: state.sessionId, model: state.model }) })
        .then((r) => setHint(r && r.applied ? t("modelApplied") + " " + state.model : t("modelApplyFail")))
        .catch(() => setHint(t("modelApplyFail")));
      persist();
      renderLiveMeta();
    }
    renderPicks(); closePicks();
  };
  $("effortPop").onclick = (e) => {
    e.stopPropagation();
    const helpButton = e.target.closest("#effortHelpButton");
    if (helpButton) {
      const note = $("effortHelpNote");
      const expanded = helpButton.getAttribute("aria-expanded") === "true";
      helpButton.setAttribute("aria-expanded", String(!expanded));
      if (note) note.hidden = expanded;
      if (!expanded) positionPickPop($("effortPop"), $("effortBtn"));
    }
  };
  $("effortPop").addEventListener("input", (e) => {
    const range = e.target.closest("#effortRange");
    if (!range) return;
    const item = EFFORTS[Number(range.value)] || EFFORTS[2];
    state.effort = item.id;
    updateEffortSlider();
    renderLiveMeta();
  });
  $("effortPop").addEventListener("change", (e) => {
    if (!e.target.closest("#effortRange")) return;
    persist();
    api("/api/effort", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ sessionId: state.sessionId, effort: state.effort }) }).catch(() => {});
  });
  $("permissionPop").onclick = (e) => {
    const btn = e.target.closest("[data-perm]");
    if (!btn) return;
    setPermission(btn.dataset.perm, true);
    closePicks();
  };
  document.addEventListener("click", (e) => {
    closePicks();
    document.querySelectorAll(".cselect").forEach((cs) => {
      if (cs.contains(e.target)) return;
      const pop = cs.querySelector(".lang-pop");
      if (pop) pop.hidden = true;
      const b = cs.querySelector(".lang-btn");
      if (b) b.setAttribute("aria-expanded", "false");
    });
    const om = document.getElementById("openInMenu");
    if (om && !om.contains(e.target) && e.target !== document.getElementById("launchChev") && !document.getElementById("launchVscode")?.contains(e.target)) om.hidden = true;
    const tm = document.getElementById("titleMenu");
    if (tm && !tm.contains(e.target) && e.target !== document.getElementById("titleMore")) tm.hidden = true;
    const cm = document.getElementById("chevMenu");
    if (cm && !cm.contains(e.target) && e.target !== document.getElementById("winChevron")) cm.hidden = true;
  });
  function bindSplitter(el, key, min, max, collapsedCheck) {
    if (!el) return;
    const app = $("app");
    el.addEventListener("pointerdown", (ev) => {
      if (collapsedCheck && collapsedCheck()) return;
      ev.preventDefault();
      app?.classList.add("is-resizing");
      el.classList.add("dragging");
      const startX = ev.clientX;
      const start = Number(getComputedStyle($("app")).getPropertyValue(key === "sb" ? "--sidebar-w" : "--preview-w").replace("px", "")) || (key === "sb" ? 268 : 320);
      const move = (e2) => {
        const dx = e2.clientX - startX;
        const next = key === "sb" ? start + dx : start - dx;
        const clamped = Math.max(min, Math.min(max, next));
        $("app").style.setProperty(key === "sb" ? "--sidebar-w" : "--preview-w", clamped + "px");
      };
      const finish = () => {
        app?.classList.remove("is-resizing");
        el.classList.remove("dragging");
        window.removeEventListener("pointermove", move);
        window.removeEventListener("pointerup", up);
        window.removeEventListener("pointercancel", cancel);
      };
      const up = () => {
        finish();
        const val = Number(getComputedStyle($("app")).getPropertyValue(key === "sb" ? "--sidebar-w" : "--preview-w").replace("px", ""));
        localStorage.setItem(key === "sb" ? "grok-webui-sb" : "grok-webui-pv", String(Math.round(val)));
      };
      const cancel = () => finish();
      window.addEventListener("pointermove", move);
      window.addEventListener("pointerup", up);
      window.addEventListener("pointercancel", cancel);
    });
  }
  bindSplitter($("splitSidebar"), "sb", 200, 420, () => state.sidebarCollapsed);
  bindSplitter($("splitPreview"), "pv", 220, 480, () => !state.previewOpen);
  $("renameForm").addEventListener("submit", (ev) => {
    ev.preventDefault();
    submitRenameSession();
  });
  $("renameInput").addEventListener("input", () => $("renameInput").removeAttribute("aria-invalid"));
  $("renameInput").addEventListener("keydown", (ev) => {
    if (ev.key !== "Enter") return;
    ev.preventDefault();
    submitRenameSession();
  });
  $("renameCancel").addEventListener("click", () => closeRenameDialog(true));
  $("renameClose").addEventListener("click", () => closeRenameDialog(true));
  $("renameDialog").addEventListener("mousedown", (ev) => {
    if (ev.target === $("renameDialog")) closeRenameDialog(true);
  });
  $("sessionMenu").addEventListener("click", (ev) => {
    const act = ev.target && ev.target.dataset ? ev.target.dataset.act : "";
    const id = $("sessionMenu").dataset.id;
    hideSessionMenu();
    if (!id || !act) return;
    const hit = sessionCache.find((s) => s.id === id);
    if (act === "archive") archiveSession(id, true);
    if (act === "fork") forkSession(id);
    if (act === "rename") renameSession(id, hit && hit.title);
  });
  document.addEventListener("click", (ev) => {
    if (!$("sessionMenu").hidden && !ev.target.closest("#sessionMenu") && !ev.target.closest("[data-act='menu']")) {
      hideSessionMenu();
    }
  });
  const pasteTarget = $("composer");
  document.addEventListener("paste", (e) => {
    const tag = ((e.target && e.target.tagName) || "").toLowerCase();
    if (tag === "input" && e.target.id !== "input") return;
    if (ingestClipboard(e.clipboardData)) e.preventDefault();
  });
  ["dragenter", "dragover"].forEach((name) => {
    pasteTarget.addEventListener(name, (e) => {
      e.preventDefault();
      pasteTarget.classList.add("dragover");
    });
  });
  pasteTarget.addEventListener("dragleave", () => pasteTarget.classList.remove("dragover"));
  pasteTarget.addEventListener("drop", (e) => {
    e.preventDefault();
    pasteTarget.classList.remove("dragover");
    ingestClipboard(e.dataTransfer);
  });
  document.querySelectorAll("[data-work]").forEach((b) => {
    if (b.closest(".cluster") || b.closest(".mode-cluster")) b.onclick = () => setWorkMode(b.dataset.work, true);
  });
  document.querySelectorAll("[data-perm]").forEach((b) => {
    if (b.closest(".cluster") || b.closest(".mode-cluster")) b.onclick = () => setPermission(b.dataset.perm, true);
  });
  $("togglePreview").onclick = () => {
    localStorage.setItem("grok-webui-preview-user", "1");
    setPreviewOpen(!state.previewOpen);
    persist();
  };
  $("collapsePreview").onclick = () => {
    localStorage.setItem("grok-webui-preview-user", "1");
    setPreviewOpen(false);
    persist();
  };
  $("extensionBack").onclick = () => showExtension("");
  document.querySelectorAll("[data-extension]").forEach((btn) => {
    btn.onclick = () => {
      const target = btn.dataset.extension;
      if (target === "terminal") { openTerminal(); return; }
      if (target === "side-chat") showExtension(target);
    };
  });
  $("sideChatForm").onsubmit = async (e) => {
    e.preventDefault();
    const text = $("sideChatInput").value.trim();
    if (!text || sideChat.running) return;
    if (!state.cwd) { openPicker(); return; }
    sideChat.messages.push({ role: "user", text });
    sideChat.running = true;
    $("sideChatInput").value = "";
    renderSideChat();
    try {
      const data = await api("/api/side-chat/prompt", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ sessionId: sideChat.sessionId, text, cwd: state.cwd, model: state.model, effort: state.effort }) });
      sideChat.sessionId = data.sessionId || sideChat.sessionId;
      watchSideChat().catch((err) => { sideChat.running = false; sideChat.messages.push({ role: "assistant", text: err.message || t("disconnected") }); renderSideChat(); });
    } catch (err) {
      sideChat.running = false;
      sideChat.messages.push({ role: "assistant", text: err.message || t("disconnected") });
      renderSideChat();
    }
  };
  $("terminalInputForm").onsubmit = async (e) => {
    e.preventDefault();
    const field = $("terminalInput");
    const value = field?.value || "";
    if (!value.trim()) return;
    try {
      await sendTerminalInput(value + "\r\n");
      field.value = "";
    } catch (err) { toast(err.message || t("terminalUnavailable")); }
  };
  $("terminalInput")?.addEventListener("keydown", (e) => {
    if (e.key !== "Enter" || e.shiftKey) return;
    e.preventDefault();
    $("terminalInputForm")?.requestSubmit();
  });
  $("terminalInterrupt")?.addEventListener("click", () => sendTerminalInput("\u0003").catch(() => {}));
  $("terminalRetry")?.addEventListener("click", () => retryTerminal().catch(() => {}));
  $("terminalClose")?.addEventListener("click", () => closeTerminal());
  if (window.ResizeObserver) {
    const terminalOutput = $("terminalOutput");
    if (terminalOutput) new ResizeObserver(() => resizeTerminal()).observe(terminalOutput);
  }
  const sideSettings = $("openSettings");
  if (sideSettings) sideSettings.onclick = () => openSettings();
  $("openSettingsChrome").onclick = () => openSettings();
  $("closeSettings").onclick = leaveCurrentAppNavigation;
  $("closeSettingsIcon").onclick = dismissSettings;
  document.querySelectorAll("#settingsTabs [data-stab]").forEach((b) => { b.onclick = () => openSettings(b.dataset.stab); });
  $("settingsSearch").addEventListener("input", (event) => {
    renderSettingsSearchResults(event.target.value);
  });
  $("settingsSearch").addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      const first = $("settingsSearchResults")?.querySelector("[data-settings-search-result]");
      if (first) { event.preventDefault(); selectSettingsSearchResult(first); }
    } else if (event.key === "Escape" && !$("settingsSearchResults")?.hidden) {
      event.preventDefault();
      event.stopPropagation();
      closeSettingsSearchResults();
    }
  });
  $("settingsSearchResults").addEventListener("click", (event) => {
    const result = event.target.closest("[data-settings-search-result]");
    if (result) selectSettingsSearchResult(result);
  });
  document.addEventListener("click", (event) => {
    if (!event.target.closest(".settings-search-wrap")) closeSettingsSearchResults();
  });
  document.addEventListener("keydown", (e) => {
    if (voiceHotkeyCapturing) {
      e.preventDefault();
      e.stopPropagation();
      if (e.key === "Escape") {
        voiceHotkeyCapturing = false;
        voiceHotkeyPendingModifier = "";
        renderVoiceHotkeyControls($("settingsBody"));
        return;
      }
      if (e.key === "Backspace" || e.key === "Delete") {
        state.settings.voiceHotkey = "";
        voiceHotkeyCapturing = false;
        voiceHotkeyPendingModifier = "";
        persist();
        renderVoiceHotkeyControls($("settingsBody"));
        return;
      }
      if (e.key === "Control" || e.key === "Alt") {
        const hasOtherModifier = e.key === "Control"
          ? e.altKey || e.shiftKey || e.metaKey
          : e.ctrlKey || e.shiftKey || e.metaKey;
        voiceHotkeyPendingModifier = hasOtherModifier ? "" : e.key === "Control" ? "Ctrl" : "Alt";
        return;
      }
      if (["Shift", "Meta"].includes(e.key)) {
        if (!e.ctrlKey && !e.altKey && !e.repeat) toast(t("voiceHotkeyNeedsModifier"));
        return;
      }
      voiceHotkeyPendingModifier = "";
      const shortcut = voiceHotkeyFromEvent(e);
      if (!shortcut) { if (!e.repeat) toast(t("voiceHotkeyNeedsModifier")); return; }
      saveVoiceHotkey(shortcut);
      return;
    }
    if (!e.repeat && !voiceHotkeyPressActive && state.settings.voiceHotkey && voiceHotkeyFromEvent(e) === state.settings.voiceHotkey) {
      e.preventDefault();
      e.stopPropagation();
      voiceHotkeyPressActive = true;
      startVoiceRecording(true);
      return;
    }
    if ((e.ctrlKey || e.metaKey) && e.key === ",") { e.preventDefault(); openSettings(); }
    if ((e.ctrlKey || e.metaKey) && (e.key === "n" || e.key === "N")) { e.preventDefault(); newChat(); }
    if ((e.ctrlKey || e.metaKey) && (e.key === "k" || e.key === "K")) { e.preventDefault(); openCmdk(); }
    if ((e.ctrlKey || e.metaKey) && e.key === "\\") { e.preventDefault(); openTerminal(); }
    if (e.key === "Escape") {
      if ($("marketSourceDialog")?.classList.contains("show")) { closeMarketSource(); return; }
      closeRenameDialog(true);
      closeCmdk();
      const um = $("userMenu");
      if (um) um.hidden = true;
      $("userCard")?.setAttribute("aria-expanded", "false");
      leaveCurrentAppNavigation();
      $("picker").classList.remove("show");
      $("confirm").classList.remove("show");
      hideSessionMenu();
      hidePalette();
      closePicks();
    }
  });
  document.addEventListener("keyup", (e) => {
    if (voiceHotkeyCapturing) {
      e.preventDefault();
      e.stopPropagation();
      const modifier = voiceHotkeyPartFromEvent(e);
      const anyModifierDown = e.ctrlKey || e.altKey || e.shiftKey || e.metaKey;
      if (voiceHotkeyPendingModifier === modifier && !anyModifierDown) saveVoiceHotkey(modifier);
      return;
    }
    const shortcut = state.settings.voiceHotkey;
    if (!voiceHotkeyPressActive || !shortcut || !shortcut.split("+").includes(voiceHotkeyPartFromEvent(e))) return;
    e.preventDefault();
    e.stopPropagation();
    voiceHotkeyPressActive = false;
    if (voicePhase === "recording") stopVoiceRecording();
  });
  window.addEventListener("blur", () => {
    if (!voiceHotkeyPressActive) return;
    voiceHotkeyPressActive = false;
    if (voicePhase === "recording") stopVoiceRecording();
  });

  bindSessionList();

  // ===== 统一线性图标（纯色 currentColor，全站统一）=====
  const ICO = {
    user: '<svg viewBox="0 0 16 16" width="16" height="16"><circle cx="8" cy="5.2" r="2.35" fill="none" stroke="currentColor" stroke-width="1.2"/><path d="M3 13.7c.3-2.7 2.1-4.2 5-4.2s4.7 1.5 5 4.2" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/></svg>',
    plus: '<svg viewBox="0 0 16 16" width="16" height="16"><circle cx="8" cy="8" r="6.6" fill="none" stroke="currentColor" stroke-width="1.2"/><path fill="currentColor" d="M8 4.6a.6.6 0 0 1 .6.6v2.2h2.2a.6.6 0 1 1 0 1.2H8.6v2.2a.6.6 0 1 1-1.2 0V8.6H5.2a.6.6 0 1 1 0-1.2h2.2V5.2A.6.6 0 0 1 8 4.6z"/></svg>',
    search: '<svg viewBox="0 0 16 16" width="16" height="16"><circle cx="7" cy="7" r="4.4" fill="none" stroke="currentColor" stroke-width="1.3"/><path stroke="currentColor" stroke-width="1.3" stroke-linecap="round" d="m10.4 10.4 3.1 3.1"/></svg>',
    market: '<svg viewBox="0 0 16 16" width="16" height="16"><rect x="2" y="6" width="4" height="4" rx="1" fill="currentColor"/><rect x="6" y="2" width="4" height="4" rx="1" fill="currentColor"/><rect x="10" y="6" width="4" height="4" rx="1" fill="currentColor"/><rect x="6" y="10" width="4" height="4" rx="1" fill="currentColor"/></svg>',
    gear: '<svg viewBox="0 0 16 16" width="16" height="16"><path fill="currentColor" d="M8 5.5A2.5 2.5 0 1 0 8 10.5 2.5 2.5 0 0 0 8 5.5zM2.8 6.2l1.1-.6.4-1.2A1 1 0 0 1 5.2 3.5h1.1l.7-1.1A1 1 0 0 1 7.9 2h.2a1 1 0 0 1 .9.4l.7 1.1h1.1a1 1 0 0 1 .9.9l.4 1.2 1.1.6a1 1 0 0 1 .4 1.3l-.6 1.1v1.1l.6 1.1a1 1 0 0 1-.4 1.3l-1.1.6-.4 1.2a1 1 0 0 1-.9.9H9.5l-.7 1.1a1 1 0 0 1-.9.4h-.2a1 1 0 0 1-.9-.4l-.7-1.1H5.2a1 1 0 0 1-.9-.9l-.4-1.2-1.1-.6a1 1 0 0 1-.4-1.3l.6-1.1V8.6l-.6-1.1a1 1 0 0 1 .4-1.3z"/></svg>',
    chart: '<svg viewBox="0 0 16 16" width="16" height="16"><path fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" d="M3 13V7M8 13V3m5 10V9"/></svg>',
    brain: '<svg viewBox="0 0 16 16" width="16" height="16"><path fill="none" stroke="currentColor" stroke-width="1.2" d="M6.5 2.5A2 2 0 0 0 4.6 4.6 2 2 0 0 0 3 6.5c0 .8.4 1.5 1 1.9-.3.9 0 2 .9 2.5.2 1 1.1 1.6 2.1 1.5V2.5zM9.5 2.5A2 2 0 0 1 11.4 4.6 2 2 0 0 1 13 6.5c0 .8-.4 1.5-1 1.9.3.9 0 2-.9 2.5-.2 1-1.1 1.6-2.1 1.5V2.5z"/></svg>',
    folder: '<svg viewBox="0 0 16 16" width="16" height="16"><path fill="currentColor" d="M2 3.75A1.75 1.75 0 0 1 3.75 2h2.88c.4 0 .78.16 1.06.44L8.81 3.56c.1.1.23.15.37.15h3.07A1.75 1.75 0 0 1 14 5.46v6.79A1.75 1.75 0 0 1 12.25 14H3.75A1.75 1.75 0 0 1 2 12.25V3.75z"/></svg>',
    chat: '<svg viewBox="0 0 16 16" width="16" height="16"><path fill="none" stroke="currentColor" stroke-width="1.2" d="M2.5 4A1.5 1.5 0 0 1 4 2.5h8A1.5 1.5 0 0 1 13.5 4v5A1.5 1.5 0 0 1 12 10.5H6L3 13.5V4z"/></svg>',
    logout: '<svg viewBox="0 0 16 16" width="16" height="16"><path fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" d="M6.5 2.5H4A1.5 1.5 0 0 0 2.5 4v8A1.5 1.5 0 0 0 4 13.5h2.5M10 5l3 3-3 3m3-3H6.5"/></svg>',
    sliders: '<svg viewBox="0 0 16 16" width="16" height="16"><path fill="none" stroke="currentColor" stroke-width="1.1" stroke-linecap="round" d="M2.5 4h11M2.5 8h11M2.5 12h11"/><circle cx="5.3" cy="4" r="1.5" fill="var(--sidebar)" stroke="currentColor" stroke-width="1.1"/><circle cx="10.7" cy="8" r="1.5" fill="var(--sidebar)" stroke="currentColor" stroke-width="1.1"/><circle cx="6.8" cy="12" r="1.5" fill="var(--sidebar)" stroke="currentColor" stroke-width="1.1"/></svg>',
    model: '<svg viewBox="0 0 16 16" width="16" height="16"><path fill="none" stroke="currentColor" stroke-width="1.15" stroke-linejoin="round" d="m8 1.8 5.2 3v6.4l-5.2 3-5.2-3V4.8zM2.8 4.8 8 7.9l5.2-3M8 7.9v6.3"/></svg>',
    wrench: '<svg viewBox="0 0 16 16" width="16" height="16"><path fill="none" stroke="currentColor" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round" d="M9.7 2.6a3.5 3.5 0 0 0 3.7 4.6l-5.9 5.9a1.5 1.5 0 1 1-2.1-2.1l5.9-5.9a3.5 3.5 0 0 0-1.6-2.5z"/></svg>',
    server: '<svg viewBox="0 0 16 16" width="16" height="16"><rect x="2.2" y="2.5" width="11.6" height="4" rx="1" fill="none" stroke="currentColor" stroke-width="1.15"/><rect x="2.2" y="9.5" width="11.6" height="4" rx="1" fill="none" stroke="currentColor" stroke-width="1.15"/><circle cx="4.6" cy="4.5" r=".7" fill="currentColor"/><circle cx="4.6" cy="11.5" r=".7" fill="currentColor"/></svg>',
    spark: '<svg viewBox="0 0 16 16" width="16" height="16"><path fill="none" stroke="currentColor" stroke-width="1.15" stroke-linecap="round" stroke-linejoin="round" d="m8 1.8.9 4.3L13.2 7l-4.3.9L8 12.2l-.9-4.3L2.8 7l4.3-.9zM12.3 10.3l.4 1.8 1.5.4-1.5.3-.4 1.8-.4-1.8-1.5-.3 1.5-.4z"/></svg>',
    archive: '<svg viewBox="0 0 16 16" width="16" height="16"><path fill="none" stroke="currentColor" stroke-width="1.15" stroke-linejoin="round" d="M2.5 4.3h11v9.2h-11zM1.8 2.5h12.4v2H1.8zM6 7.3h4M6.3 9.7h3.4"/></svg>',
    terminal: '<svg viewBox="0 0 16 16" width="16" height="16"><rect x="2" y="2.5" width="12" height="11" rx="1.5" fill="none" stroke="currentColor" stroke-width="1.15"/><path fill="none" stroke="currentColor" stroke-width="1.15" stroke-linecap="round" stroke-linejoin="round" d="m4.3 6 2 2-2 2M8.2 10h3.1"/></svg>',
    mic: '<svg viewBox="0 0 16 16" width="16" height="16"><rect x="6" y="2" width="4" height="7.5" rx="2" fill="none" stroke="currentColor" stroke-width="1.2"/><path d="M3.8 7.7a4.2 4.2 0 0 0 8.4 0M8 12v2m-2.2 0h4.4" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/></svg>',
    sun: '<svg viewBox="0 0 16 16" width="16" height="16"><circle cx="8" cy="8" r="2.7" fill="none" stroke="currentColor" stroke-width="1.15"/><path fill="none" stroke="currentColor" stroke-width="1.15" stroke-linecap="round" d="M8 1.7v1.6M8 12.7v1.6M1.7 8h1.6M12.7 8h1.6M3.5 3.5l1.1 1.1M11.4 11.4l1.1 1.1M12.5 3.5l-1.1 1.1M4.6 11.4l-1.1 1.1"/></svg>',
    shield: '<svg viewBox="0 0 16 16" width="16" height="16"><path fill="none" stroke="currentColor" stroke-width="1.15" stroke-linejoin="round" d="M8 1.8 13 3.7v3.8c0 3.1-2 5.5-5 6.7-3-1.2-5-3.6-5-6.7V3.7z"/><path fill="none" stroke="currentColor" stroke-width="1.15" stroke-linecap="round" stroke-linejoin="round" d="m5.5 8 1.6 1.6 3.4-3.4"/></svg>',
    branch: '<svg viewBox="0 0 16 16" width="16" height="16"><circle cx="4" cy="3.2" r="1.5" fill="none" stroke="currentColor" stroke-width="1.15"/><circle cx="4" cy="12.8" r="1.5" fill="none" stroke="currentColor" stroke-width="1.15"/><circle cx="12" cy="8" r="1.5" fill="none" stroke="currentColor" stroke-width="1.15"/><path fill="none" stroke="currentColor" stroke-width="1.15" stroke-linecap="round" d="M4 4.7v4.1c0 1.1.9 2 2 2h4.5M4 9.2V11.3"/></svg>',
    help: '<svg viewBox="0 0 16 16" width="16" height="16"><circle cx="8" cy="8" r="6.2" fill="none" stroke="currentColor" stroke-width="1.15"/><path fill="none" stroke="currentColor" stroke-width="1.15" stroke-linecap="round" d="M6.3 6.1a1.8 1.8 0 1 1 3.1 1.2c-.8.7-1.4 1-1.4 2M8 11.8h.1"/></svg>',
    globe: '<svg viewBox="0 0 16 16" width="16" height="16"><circle cx="8" cy="8" r="6.2" fill="none" stroke="currentColor" stroke-width="1.15"/><path fill="none" stroke="currentColor" stroke-width="1.05" d="M1.9 8h12.2M8 1.8c1.7 1.7 2.5 3.8 2.5 6.2s-.8 4.5-2.5 6.2C6.3 12.5 5.5 10.4 5.5 8S6.3 3.5 8 1.8z"/></svg>',
    info: '<svg viewBox="0 0 16 16" width="16" height="16"><circle cx="8" cy="8" r="6.2" fill="none" stroke="currentColor" stroke-width="1.15"/><path fill="none" stroke="currentColor" stroke-width="1.25" stroke-linecap="round" d="M8 7.1v3.5M8 4.9h.1"/></svg>',
  };

  function renderSettingsNavIcons() {
    document.querySelectorAll("#settingsTabs .settings-nav-icon[data-ico]").forEach((icon) => {
      icon.innerHTML = ICO[icon.dataset.ico] || "";
    });
  }
  renderSettingsNavIcons();

  // ===== 命令面板（Ctrl+K） =====
  let cmdkTab = "all";
  function cmdkActions() {
    return [
      { ico: ICO.plus, label: t("newChat"), kbd: "Ctrl+N", run: () => newChat() },
      { ico: ICO.folder, label: t("pickFolder"), kbd: "Ctrl+O", run: () => openPicker() },
      { ico: ICO.market, label: t("marketTab"), run: () => openMarket() },
      { ico: ICO.gear, label: t("settings"), run: () => openSettings() },
      { ico: ICO.chart, label: t("usage"), run: () => openSettings("usage") },
      { ico: ICO.brain, label: t("memoryTab"), run: () => openSettings("memory") }
    ];
  }
  function openCmdk() {
    const back = $("cmdkBack");
    if (!back) return;
    back.classList.add("show");
    const inp = $("cmdkInput");
    inp.value = "";
    renderCmdk("");
    setTimeout(() => inp.focus(), 60);
  }
  function closeCmdk() {
    const back = $("cmdkBack");
    if (back) back.classList.remove("show");
  }
  function renderCmdk(q) {
    const list = $("cmdkList");
    if (!list) return;
    q = (q || "").trim().toLowerCase();
    const acts = cmdkActions().filter((a) => !q || a.label.toLowerCase().includes(q));
    const sess = sessionCache.filter((x) => !q || (x.title || "").toLowerCase().includes(q)).slice(0, 12);
    let html = "";
    if (cmdkTab !== "sessions" && acts.length) {
      html += '<div class="cmdk-group">' + escapeHtml(t("suggested")) + "</div>";
      html += acts.map((a) => `<button type="button" data-kact="${escapeHtml(a.label)}"><span class="ki">${a.ico}</span><span>${escapeHtml(a.label)}</span><span class="kbd">${a.kbd || ""}</span></button>`).join("");
    }
    if (cmdkTab !== "actions" && sess.length) {
      html += '<div class="cmdk-group">' + escapeHtml(t("chats")) + "</div>";
      html += sess.map((x) => `<button type="button" data-ksess="${escapeHtml(x.id)}"><span class="ki">${ICO.chat}</span><span>${escapeHtml(x.title || t("newChat"))}</span></button>`).join("");
    }
    list.innerHTML = html || `<div class="cmdk-group">${escapeHtml(t("noChats"))}</div>`;
    list.querySelectorAll("[data-kact]").forEach((b) => {
      b.onclick = () => {
        closeCmdk();
        const a = cmdkActions().find((x) => x.label === b.dataset.kact);
        if (a) a.run();
      };
    });
    list.querySelectorAll("[data-ksess]").forEach((b) => {
      b.onclick = () => { closeCmdk(); loadSession(b.dataset.ksess); };
    });
  }
  const cmdkBack = $("cmdkBack");
  if (cmdkBack) {
    cmdkBack.addEventListener("click", (e) => { if (e.target === cmdkBack) closeCmdk(); });
    $("cmdkInput").addEventListener("input", (e) => renderCmdk(e.target.value));
    document.querySelectorAll("[data-ctab]").forEach((b) => {
      b.onclick = () => {
        cmdkTab = b.dataset.ctab;
        document.querySelectorAll("[data-ctab]").forEach((x) => x.classList.toggle("on", x === b));
        renderCmdk($("cmdkInput").value);
      };
    });
  }

  // ===== 头像扩展菜单 =====
  const userCard = $("userCard");
  const userMenu = $("userMenu");
  if (userCard && userMenu) {
    const setUserMenuOpen = (open) => {
      userMenu.hidden = !open;
      userCard.setAttribute("aria-expanded", String(open));
    };
    userCard.onclick = (e) => {
      e.stopPropagation();
      $("umName").textContent = $("userName").textContent;
      const opening = userMenu.hidden;
      if (opening) {
        const r = userCard.getBoundingClientRect();
        userMenu.style.left = "10px";
        userMenu.style.bottom = (window.innerHeight - r.top + 8) + "px";
        userMenu.style.top = "auto";
        api("/api/account").then((account) => applyUser({ ...(account.account || {}), loggedIn: account.loggedIn })).catch(() => {});
      }
      setUserMenuOpen(opening);
      userMenu.querySelectorAll(".mi[data-ico]").forEach((m) => { m.innerHTML = ICO[m.dataset.ico] || ""; });
    };
    userMenu.addEventListener("click", async (e) => {
      const btn = e.target.closest("[data-uact]");
      if (!btn) return;
      const act = btn.dataset.uact;
      if (act === "login") {
        startAccountLogin(btn, $("umLoginOut"), () => setUserMenuOpen(false));
        return;
      }
      setUserMenuOpen(false);
      if (act === "settings") openSettings();
      else if (act === "language") openLanguageDialog();
      else if (act === "inference") openSettings("model");
      else if (act === "guide") openSettings("help");
      else if (act === "about") openAboutDialog();
      else if (act === "logout") {
        confirmAction(t("accountLogoutConfirm"), async () => {
          try { await api("/api/account/logout", { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" }); applyUser({}); toast("✓"); }
          catch (err) { toast(err.message || t("disconnected")); }
        });
      }
    });
    document.addEventListener("click", (e) => {
      if (!userMenu.hidden && !userMenu.contains(e.target) && !userCard.contains(e.target)) setUserMenuOpen(false);
    });
  }

  // ===== 插件市场（与侧栏一体 / 分类切换 / 详情多语言）=====
  let marketData = [];
  let marketSources = [];
  let marketView = "claude";
  let marketDetail = null;
  let marketLoadingSource = "";
  const marketSourcePrefix = "source:";

  function marketSourceIdForView(view) {
    return String(view || "").startsWith(marketSourcePrefix) ? String(view).slice(marketSourcePrefix.length) : "";
  }

  function marketSourceById(sourceId) {
    return marketSources.find((source) => source.id === sourceId) || null;
  }

  function marketViewLabel(view) {
    if (view === "claude") return t("marketClaude");
    return marketSourceById(marketSourceIdForView(view))?.name || t("marketTab");
  }

  function openMarket() {
    recordAppNavigation({ view: "market" });
    closeAutomations();
    const back = $("marketBack");
    if (!back) return;
    back.classList.add("show");
    document.querySelector(".app")?.classList.add("market-open");
    document.querySelector(".session-title-wrap")?.setAttribute("aria-hidden", "true");
    $("sideMarket")?.classList.add("active");
    loadMarket();
  }

  function updateAutomationIntervalLabel() {
    const value = $("automationInterval");
    const label = $("automationIntervalValue");
    const menu = $("automationIntervalMenu");
    if (!value || !label || !menu) return;
    const selected = [...menu.querySelectorAll('[role="option"]')].find((option) => option.dataset.intervalValue === value.value);
    if (!selected) return;
    label.textContent = selected.textContent.trim();
    menu.querySelectorAll('[role="option"]').forEach((option) => {
      option.setAttribute("aria-selected", String(option === selected));
    });
  }

  function initAutomationIntervalSelect() {
    const root = $("automationIntervalSelect");
    const trigger = $("automationIntervalTrigger");
    const menu = $("automationIntervalMenu");
    const value = $("automationInterval");
    if (!root || !trigger || !menu || !value) return;
    const options = [...menu.querySelectorAll('[role="option"]')];
    let activeIndex = 0;

    const setActive = (index) => {
      activeIndex = (index + options.length) % options.length;
      options.forEach((option, i) => {
        if (i === activeIndex) option.dataset.active = "true";
        else delete option.dataset.active;
      });
      trigger.setAttribute("aria-activedescendant", options[activeIndex].id);
    };
    const positionMenu = () => {
      const rect = trigger.getBoundingClientRect();
      const width = Math.min(rect.width, window.innerWidth - 16);
      const left = Math.max(8, Math.min(rect.left, window.innerWidth - width - 8));
      const below = window.innerHeight - rect.bottom - 8;
      const above = rect.top - 8;
      const naturalHeight = Math.min(menu.scrollHeight, 240);
      const opensAbove = below < naturalHeight && above > below;
      const availableHeight = Math.max(80, Math.min(240, (opensAbove ? above : below) - 8));
      menu.style.left = `${left}px`;
      menu.style.width = `${width}px`;
      menu.style.maxHeight = `${availableHeight}px`;
      menu.style.top = opensAbove ? "auto" : `${rect.bottom + 6}px`;
      menu.style.bottom = opensAbove ? `${window.innerHeight - rect.top + 6}px` : "auto";
    };
    const close = (restoreFocus = false) => {
      menu.hidden = true;
      if (menu.parentElement !== root) root.append(menu);
      menu.removeAttribute("style");
      options.forEach((option) => option.removeAttribute("data-active"));
      trigger.setAttribute("aria-expanded", "false");
      trigger.removeAttribute("aria-activedescendant");
      if (restoreFocus) trigger.focus();
    };
    const open = () => {
      menu.hidden = false;
      document.body.append(menu);
      trigger.setAttribute("aria-expanded", "true");
      const selectedIndex = options.findIndex((option) => option.dataset.intervalValue === value.value);
      setActive(selectedIndex < 0 ? 0 : selectedIndex);
      positionMenu();
    };
    const choose = (option) => {
      value.value = option.dataset.intervalValue;
      updateAutomationIntervalLabel();
      close(true);
    };

    trigger.addEventListener("click", () => menu.hidden ? open() : close());
    trigger.addEventListener("keydown", (event) => {
      const isOpen = !menu.hidden;
      if (["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) {
        event.preventDefault();
        if (!isOpen) open();
        if (event.key === "Home") setActive(0);
        else if (event.key === "End") setActive(options.length - 1);
        else if (isOpen) setActive(activeIndex + (event.key === "ArrowDown" ? 1 : -1));
      } else if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        if (isOpen) choose(options[activeIndex]);
        else open();
      } else if (event.key === "Escape" && isOpen) {
        event.preventDefault();
        event.stopPropagation();
        close(true);
      } else if (event.key === "Tab" && isOpen) {
        close();
      }
    });
    options.forEach((option, index) => {
      option.addEventListener("pointerenter", () => setActive(index));
      option.addEventListener("click", () => choose(option));
    });
    document.addEventListener("click", (event) => {
      if (!root.contains(event.target) && !menu.contains(event.target)) close();
    });
    document.addEventListener("scroll", () => { if (!menu.hidden) close(); }, true);
    window.addEventListener("resize", () => { if (!menu.hidden) close(); });
    updateAutomationIntervalLabel();
  }

  function updateAutomationSource() {
    const source = $("automationSource");
    if (!source) return;
    source.textContent = state.sessionId ? t("automationCurrentSource") : t("automationNewSource");
  }

  function renderAutomations() {
    const list = $("automationList");
    if (!list) return;
    const query = $("automationSearch")?.value.trim().toLocaleLowerCase() || "";
    const filtered = query
      ? automationCache.filter((task) => `${task.prompt || ""} ${task.sessionTitle || ""}`.toLocaleLowerCase().includes(query))
      : automationCache;
    $("automationCount").textContent = automationCache.length ? String(automationCache.length) : "";
    if (!filtered.length) {
      list.innerHTML = `<p class="automation-empty">${escapeHtml(t(query ? "automationSearchEmpty" : "automationEmpty"))}</p>`;
      return;
    }
    const locale = state.lang === "zh-TW-TW" ? "zh-TW" : state.lang;
    list.innerHTML = filtered.map((task) => {
      const cancelled = !!task.cancelled;
      const time = Number(task.created) > 0
        ? new Date(Number(task.created)).toLocaleString(locale, { dateStyle: "short", timeStyle: "short" })
        : "";
      const cadence = [task.interval, task.recurring ? t("automationRepeatLabel") : t("automationOneShot")].filter(Boolean).join(" · ");
      return `<article class="automation-row${cancelled ? " is-cancelled" : ""}">
        <button type="button" class="automation-row-open" data-automation-open="${escapeHtml(task.id)}">
          <b>${escapeHtml(task.prompt || "")}</b>
          <small>${escapeHtml(task.sessionTitle || t("newChat"))}</small>
          <small>${escapeHtml(t(cancelled ? "automationCanceled" : "automationCreated"))}${cadence ? ` · ${escapeHtml(cadence)}` : ""}${time ? ` · ${escapeHtml(time)}` : ""}</small>
        </button>
        ${cancelled ? "" : `<button type="button" class="automation-cancel" data-automation-cancel="${escapeHtml(task.id)}" data-i18n-title="automationCancel" title="${escapeHtml(t("automationCancel"))}" aria-label="${escapeHtml(t("automationCancel"))}"><svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true"><path d="M3 4.5h10M6 4.5V3h4v1.5m-5 0 .5 8h5l.5-8M7 7v3.5M9 7v3.5" fill="none" stroke="currentColor" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round"/></svg></button>`}
      </article>`;
    }).join("");
  }

  async function loadAutomations() {
    const list = $("automationList");
    if (list) list.innerHTML = `<p class="automation-empty">${escapeHtml(t("automationLoading"))}</p>`;
    try {
      const data = await api("/api/automations");
      automationCache = Array.isArray(data.tasks) ? data.tasks : [];
      renderAutomations();
    } catch {
      automationCache = [];
      if (list) list.innerHTML = `<p class="automation-empty">${escapeHtml(t("automationLoadFailed"))}</p>`;
      $("automationCount").textContent = "";
    }
  }

  function openAutomations() {
    recordAppNavigation({ view: "automation" });
    closeMarket();
    const back = $("automationBack");
    if (!back) return;
    showAutomationHome();
    back.classList.add("show");
    back.setAttribute("aria-hidden", "false");
    document.querySelector(".app")?.classList.add("automation-open");
    document.querySelector(".session-title-wrap")?.setAttribute("aria-hidden", "true");
    $("sideAutomations")?.classList.add("active");
    updateAutomationSource();
    loadAutomations();
  }

  function showAutomationHome() {
    $("automationHome").hidden = false;
    $("automationCreateView").hidden = true;
    $("automationNewTask").hidden = false;
  }

  function openAutomationCreate(prompt = "") {
    $("automationHome").hidden = true;
    $("automationCreateView").hidden = false;
    $("automationNewTask").hidden = true;
    $("automationPrompt").value = prompt;
    setTimeout(() => $("automationPrompt").focus(), 0);
  }

  async function openAutomationRecord(task) {
    if (!task?.sessionId) return;
    try {
      await loadSession(task.sessionId, task.cwd || state.cwd);
    } catch (err) {
      toast(err && err.message ? err.message : t("disconnected"));
    }
  }

  function closeAutomations() {
    $("automationBack")?.classList.remove("show");
    $("automationBack")?.setAttribute("aria-hidden", "true");
    document.querySelector(".app")?.classList.remove("automation-open");
    document.querySelector(".session-title-wrap")?.removeAttribute("aria-hidden");
    $("sideAutomations")?.classList.remove("active");
  }

  async function submitAutomation(event) {
    event.preventDefault();
    const description = $("automationPrompt").value.trim();
    if (!description) return toast(t("automationPromptRequired"));
    if (!state.cwd) return toast(t("automationNeedProject"));
    if (state.running) return toast(t("automationBusy"));
    if (state.workMode !== "agent") return toast(t("automationSwitchToAgent"));
    if (voicePhase !== "idle") return toast(t("voiceFinishFirst"));

    const request = {
      interval: $("automationInterval").value,
      prompt: description,
      fire_immediately: false,
      recurring: $("automationRecurring").checked
    };
    const text = `请调用 Grok Runtime 的 scheduler_create 原生工具创建定时任务，严格使用以下参数：${JSON.stringify(request)}。不要现在执行任务内容；只创建任务，并在完成后简短回复任务编号。`;
    const draft = input.value;
    const pending = state.pending.slice();
    input.value = "";
    state.pending = [];
    $("automationPrompt").value = "";
    recordAppNavigation({ view: "chat", sessionId: state.sessionId || "", cwd: state.cwd || "" });
    closeAutomations();
    await sendPrompt(text, { force: true });
    if (!input.value) input.value = draft;
    state.pending = state.pending.length ? [...pending, ...state.pending] : pending;
    renderAttachStrip();
  }

  function requestAutomationCancel(task) {
    if (!task || task.cancelled) return;
    if (state.running) return toast(t("automationBusy"));
    if (state.workMode !== "agent") return toast(t("automationSwitchToAgent"));
    confirmAction(t("automationCancelConfirm"), async () => {
      try {
        await loadSession(task.sessionId, task.cwd || state.cwd);
        const text = `请调用 Grok Runtime 的 scheduler_delete 原生工具取消此任务。任务编号：${JSON.stringify(task.id)}。仅取消这个任务，不要执行任务内容；完成后简短确认。`;
        await sendPrompt(text, { force: true });
      } catch (err) {
        toast(err && err.message ? err.message : t("disconnected"));
      }
    });
  }

  const sideChat = { sessionId: "", messages: [], running: false };
  const terminalState = { id: "", cwd: "", shell: "", source: null, connected: false, status: "", output: "" };

  // winpty 会把 PowerShell 的 VT/ANSI 控制序列一并读出来；终端面板是纯文本输出，
  // 不能把这些控制码直接展示，否则会出现“�[?25l”之类的乱码。
  function sanitizeTerminalText(text) {
    let value = String(text || "");
    value = value.replace(/\u001b\][^\u0007]*(?:\u0007|\u001b\\)/g, "");
    value = value.replace(/(?:\u001b|\ufffd)\[[0-?]*[ -/]*[@-~]/g, "");
    value = value.replace(/\u001b[@-_]/g, "");
    value = value.replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, "");
    return value;
  }

  function terminalSetOutput(chunk, replace) {
    const raw = replace ? String(chunk || "") : terminalState.output + String(chunk || "");
    terminalState.output = sanitizeTerminalText(raw).slice(-200000);
  }

  function terminalStatusText(status) {
    const key = status || (terminalState.connected ? "terminalReady" : "terminalClosed");
    return t(key);
  }

  function renderTerminal() {
    const output = $("terminalOutput");
    const status = $("terminalStatus");
    const retry = $("terminalRetry");
    const stop = $("terminalInterrupt");
    const close = $("terminalClose");
    if (output) {
      output.textContent = terminalState.output;
      output.scrollTop = output.scrollHeight;
    }
    if (status) status.textContent = terminalStatusText(terminalState.status);
    if (retry) {
      retry.hidden = terminalState.status !== "terminalUnavailable";
      retry.disabled = terminalState.status === "terminalStarting";
    }
    if (stop) stop.disabled = !terminalState.connected;
    if (close) close.disabled = !terminalState.id;
  }

  function closeTerminalSource() {
    if (terminalState.source) {
      terminalState.source.close();
      terminalState.source = null;
    }
  }

  function watchTerminal(id) {
    closeTerminalSource();
    const source = new EventSource(`/api/terminal/events?id=${encodeURIComponent(id)}`);
    terminalState.source = source;
    source.onmessage = (event) => {
      let data;
      try { data = JSON.parse(event.data); } catch { return; }
      if (data.type === "snapshot") terminalSetOutput(data.data, true);
      if (data.type === "output") terminalSetOutput(data.data, false);
      if (data.type === "exit") {
        terminalState.connected = false;
        terminalState.status = "terminalClosed";
        closeTerminalSource();
      }
      renderTerminal();
    };
    source.onerror = () => {
      if (terminalState.connected) {
        terminalState.connected = false;
        terminalState.status = "terminalUnavailable";
        renderTerminal();
      }
    };
  }

  async function openTerminal() {
    showExtension("terminal");
    terminalState.status = "terminalStarting";
    renderTerminal();
    try {
      const data = await api("/api/terminal/open", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cwd: state.cwd, rows: 32, cols: 120 })
      });
      terminalState.id = data.id || "";
      terminalState.cwd = data.cwd || state.cwd;
      terminalState.shell = data.shell || "";
      terminalState.connected = !!terminalState.id;
      terminalState.status = terminalState.connected ? "terminalReady" : "terminalUnavailable";
      watchTerminal(terminalState.id);
      renderTerminal();
      setTimeout(() => $("terminalInput")?.focus(), 0);
    } catch (err) {
      terminalState.connected = false;
      terminalState.status = "terminalUnavailable";
      terminalSetOutput(err && err.message ? `${err.message}\n` : "", false);
      renderTerminal();
    }
  }

  async function sendTerminalInput(data) {
    if (!terminalState.id || !terminalState.connected || !data) return;
    await api("/api/terminal/input", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: terminalState.id, data })
    });
  }

  async function resizeTerminal() {
    const output = $("terminalOutput");
    if (!output || !terminalState.id || !terminalState.connected) return;
    const rect = output.getBoundingClientRect();
    const cols = Math.max(20, Math.min(240, Math.floor((rect.width - 24) / 7.2)));
    const rows = Math.max(8, Math.min(120, Math.floor((rect.height - 18) / 18)));
    try {
      await api("/api/terminal/resize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: terminalState.id, rows, cols })
      });
    } catch {}
  }

  async function closeTerminal() {
    const id = terminalState.id;
    closeTerminalSource();
    terminalState.id = "";
    terminalState.connected = false;
    terminalState.status = "terminalClosed";
    if (id) {
      try {
        await api("/api/terminal/close", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id })
        });
      } catch {}
    }
    renderTerminal();
    showExtension("");
  }

  async function retryTerminal() {
    const id = terminalState.id;
    closeTerminalSource();
    terminalState.id = "";
    terminalState.connected = false;
    terminalState.status = "terminalStarting";
    renderTerminal();
    if (id) {
      try {
        await api("/api/terminal/close", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id })
        });
      } catch {}
    }
    await openTerminal();
  }

  function showExtension(kind) {
    const launcher = document.querySelector(".extension-launcher");
    const surface = $("extensionSurface");
    const side = $("sideChatForm"), terminal = $("terminalForm");
    if (!kind) { launcher.hidden = false; surface.hidden = true; return; }
    launcher.hidden = true;
    surface.hidden = false;
    side.hidden = kind !== "side-chat";
    terminal.hidden = kind !== "terminal";
    $("extensionTitle").textContent = kind === "side-chat" ? t("extensionSideChat") : t("extensionTerminal");
    if (kind === "side-chat") { renderSideChat(); setTimeout(() => $("sideChatInput").focus(), 0); }
    if (kind === "terminal") { renderTerminal(); setTimeout(resizeTerminal, 0); }
  }
  function renderSideChat() {
    const box = $("sideChatMessages");
    box.innerHTML = sideChat.messages.map((m) => `<div class="side-chat-message ${m.role === "user" ? "user" : ""}">${escapeHtml(m.text || "")}</div>`).join("") + (sideChat.running ? `<div class="side-chat-message pending">${escapeHtml(t("processing"))}</div>` : "");
    box.scrollTop = box.scrollHeight;
    $("sideChatSend").disabled = sideChat.running;
  }
  async function refreshSideChat() {
    if (!sideChat.sessionId) return;
    const data = await api(`/api/history/${encodeURIComponent(sideChat.sessionId)}`);
    sideChat.messages = (data.messages || []).map((m) => ({ role: m.role, text: m.text || "" }));
    renderSideChat();
  }
  async function watchSideChat() {
    while (sideChat.running) {
      const turn = await api("/api/side-chat/turn");
      if (turn.done) {
        sideChat.running = false;
        await refreshSideChat();
        return;
      }
      await new Promise((resolve) => setTimeout(resolve, 250));
    }
  }
  function closeMarket() {
    $("marketBack")?.classList.remove("show");
    document.querySelector(".app")?.classList.remove("market-open");
    document.querySelector(".session-title-wrap")?.removeAttribute("aria-hidden");
    $("sideMarket")?.classList.remove("active");
  }
  function loadMarket() {
    const inst = $("mkInstalled");
    if (!inst) return;
    inst.dataset.marketStatus = "loading";
    inst.textContent = t("marketLoading");
    api("/api/grok/plugins").then((d) => {
      const raw = String(d.text || "").trim();
      if (!raw || /no plugins installed/i.test(raw)) {
        inst.dataset.marketStatus = "empty";
        inst.textContent = t("marketNoInstalled");
      } else {
        delete inst.dataset.marketStatus;
        inst.textContent = raw;
      }
    }).catch(() => {
      inst.dataset.marketStatus = "empty";
      inst.textContent = t("marketNoInstalled");
    });
    marketLoadingSource = "";
    Promise.allSettled([api("/api/market/list"), api("/api/market/sources")]).then(([marketResult, sourceResult]) => {
      if (marketResult.status === "rejected") {
        marketData = [];
        marketSources = sourceResult.status === "fulfilled" && Array.isArray(sourceResult.value.sources) ? sourceResult.value.sources : [];
        renderMarket(marketResult.reason?.message || t("disconnected"));
        return;
      }
      marketData = Array.isArray(marketResult.value.items) ? marketResult.value.items : [];
      marketSources = sourceResult.status === "fulfilled" && Array.isArray(sourceResult.value.sources) ? sourceResult.value.sources : [];
      const sourceId = marketSourceIdForView(marketView);
      if (sourceId && !marketSourceById(sourceId)) marketView = "claude";
      marketDetail = null;
      renderMarket();
      if (sourceId && marketSourceById(sourceId)) loadCustomMarket(sourceId, true);
    });
  }

  function loadCustomMarket(sourceId, initial = false) {
    const source = marketSourceById(sourceId);
    if (!source) return;
    const key = marketSourcePrefix + sourceId;
    marketLoadingSource = sourceId;
    if (!initial) marketDetail = null;
    renderMarket();
    api(`/api/market/list?source=${encodeURIComponent(sourceId)}`).then((d) => {
      const tagged = (Array.isArray(d.items) ? d.items : []).map((item) => ({
        ...item,
        market: key,
        sourceId,
        marketName: source.name
      }));
      marketData = marketData.filter((item) => item.market !== key).concat(tagged);
      marketLoadingSource = "";
      if (marketView === key) renderMarket();
    }).catch((err) => {
      marketLoadingSource = "";
      if (marketView === key) renderMarket(err.message || t("marketSourceLoadFail"));
    });
  }

  function renderMarket(errText) {
    const tabs = $("mkTabs");
    const listEl = $("mkList");
    if (!tabs || !listEl) return;
    tabs.innerHTML = `
      <button type="button" class="mk-tab${marketView === "claude" ? " on" : ""}" data-mv="claude">${escapeHtml(t("marketClaude"))}</button>
      ${marketSources.map((source) => `<button type="button" class="mk-tab mk-tab-source${marketView === marketSourcePrefix + source.id ? " on" : ""}" data-mv="${escapeHtml(marketSourcePrefix + source.id)}" title="${escapeHtml(source.url)}">${escapeHtml(source.name)}</button>`).join("")}`;
    tabs.querySelectorAll("[data-mv]").forEach((b) => {
      b.onclick = () => {
        marketView = b.dataset.mv;
        marketDetail = null;
        renderMarket();
        const sourceId = marketSourceIdForView(marketView);
        if (sourceId) loadCustomMarket(sourceId);
      };
    });
    const q = ($("mkSearch") || {}).value || "";
    const ql = q.trim().toLowerCase();
    const sourceId = marketSourceIdForView(marketView);
    const items = marketData.filter((x) => x.market === marketView && (!ql || String(x.name || "").toLowerCase().includes(ql) || String(x.description || "").toLowerCase().includes(ql)));
    if (errText) { listEl.innerHTML = `<div class="mk-err">${escapeHtml(errText)}</div>`; return; }
    if (sourceId && marketLoadingSource === sourceId) {
      listEl.innerHTML = `<div class="mk-loading">${escapeHtml(t("marketSourceLoading"))}</div>`;
      return;
    }
    if (!items.length) {
      const emptyText = sourceId ? t("marketSourceEmpty") : t("extensionsNone");
      listEl.innerHTML = `<div class="mk-empty">${escapeHtml(emptyText)}</div>`;
      return;
    }
    listEl.innerHTML = items.map((it) => `
      <button type="button" class="mk-card" data-midx="${marketData.indexOf(it)}">
        <div class="mk-ico">${escapeHtml((it.name || "?")[0].toUpperCase())}</div>
        <div class="mk-meta"><b>${escapeHtml(it.name)}</b><small>${escapeHtml(it.description || "")}</small></div>
        <span class="mk-chev">›</span>
      </button>`).join("");
    listEl.querySelectorAll(".mk-card").forEach((c) => {
      c.onclick = () => { marketDetail = marketData[Number(c.dataset.midx)]; renderMarketDetail(); };
    });
  }
  function renderMarketDetail() {
    const tabs = $("mkTabs");
    const listEl = $("mkList");
    const it = marketDetail;
    if (!tabs || !listEl || !it) { renderMarket(); return; }
    const viewLabel = marketViewLabel(marketView);
    tabs.innerHTML = `<button type="button" class="mk-back-btn" id="mkBack2">‹ ${escapeHtml(viewLabel)}</button>`;
    $("mkBack2").onclick = () => { marketDetail = null; renderMarket(); };
    listEl.innerHTML = `
      <div class="mk-detail">
        <div class="mk-detail-head">
          <div class="mk-ico big">${escapeHtml((it.name || "?")[0].toUpperCase())}</div>
          <div class="mk-detail-title"><h3>${escapeHtml(it.name)}</h3>
          <small>${escapeHtml(viewLabel)}${it.repo ? " · " + escapeHtml(it.repo) : ""}</small></div>
          <button type="button" class="primary" id="mkDetailInstall">${escapeHtml(t("marketInstall"))}</button>
        </div>
        <div class="mk-detail-sec"><b>${escapeHtml(t("marketDetails"))}</b>
          <p class="mk-desc">${escapeHtml(it.description || "-")}</p>
          <p class="mk-desc translated" id="mkTranslatedDescription" aria-live="polite" aria-busy="true">${escapeHtml(t("marketTranslateLoading"))}</p>
        </div>
        <div class="mk-detail-sec"><b>${escapeHtml(t("marketUsage"))}</b>
          <p class="mk-desc">${escapeHtml(t("marketUsageBody"))}</p>
        </div>
      </div>`;
    $("mkDetailInstall").onclick = (e) => {
      const btn = e.currentTarget;
      btn.disabled = true;
      btn.textContent = t("marketInstallLoading");
      const url = it.repo || it.name;
      api("/api/grok/plugins", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "install", url }) })
        .then((d) => { btn.textContent = d.ok ? t("marketInstallSuccess") : t("marketInstallFail"); toast(d.ok ? "✓ " + it.name : (d.text || "!").slice(0, 80)); })
        .catch((err) => { btn.textContent = t("marketInstallFail"); toast(err.message || t("disconnected")); });
    };
    const targetLanguage = state.lang;
    api("/api/market/translate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ q: it.description || it.name, language: targetLanguage }) })
      .then((d) => {
        const translated = $("mkTranslatedDescription");
        if (!translated || marketDetail !== it || state.lang !== targetLanguage) return;
        translated.setAttribute("aria-busy", "false");
        if (d.ok && d.text) translated.textContent = t("marketTranslateLabel") + d.text;
        else translated.hidden = true;
      }).catch(() => {
        const translated = $("mkTranslatedDescription");
        if (translated && marketDetail === it && state.lang === targetLanguage) {
          translated.hidden = true;
          translated.setAttribute("aria-busy", "false");
        }
      });
  }

  function renderMarketSourceList() {
    const list = $("marketSourceList");
    const count = $("marketSourceCount");
    if (!list) return;
    if (count) count.textContent = marketSources.length ? `${marketSources.length}/24` : "";
    if (!marketSources.length) {
      list.innerHTML = `<p class="market-source-empty">${escapeHtml(t("marketSourceNone"))}</p>`;
      return;
    }
    list.innerHTML = marketSources.map((source) => `
      <div class="market-source-row">
        <div><b>${escapeHtml(source.name)}</b><small title="${escapeHtml(source.url)}">${escapeHtml(source.url)}</small></div>
        <button type="button" class="market-source-remove" data-ms-remove="${escapeHtml(source.id)}">${escapeHtml(t("marketSourceRemove"))}</button>
      </div>`).join("");
    list.querySelectorAll("[data-ms-remove]").forEach((button) => {
      button.onclick = () => removeMarketSource(button.dataset.msRemove, button);
    });
  }

  function openMarketSource() {
    const dialog = $("marketSourceDialog");
    if (!dialog) return;
    dialog.classList.add("show");
    dialog.setAttribute("aria-hidden", "false");
    const status = $("marketSourceStatus");
    if (status) { status.hidden = true; status.textContent = ""; }
    renderMarketSourceList();
    setTimeout(() => $("marketSourceName")?.focus(), 50);
  }

  function closeMarketSource() {
    const dialog = $("marketSourceDialog");
    if (!dialog) return false;
    const wasOpen = dialog.classList.contains("show");
    dialog.classList.remove("show");
    dialog.setAttribute("aria-hidden", "true");
    return wasOpen;
  }

  async function removeMarketSource(sourceId, button) {
    const source = marketSourceById(sourceId);
    if (!source || !button) return;
    button.disabled = true;
    try {
      const result = await api("/api/market/sources", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "remove", id: sourceId })
      });
      marketSources = Array.isArray(result.sources) ? result.sources : marketSources.filter((item) => item.id !== sourceId);
      const key = marketSourcePrefix + sourceId;
      marketData = marketData.filter((item) => item.market !== key);
      if (marketView === key) { marketView = "claude"; marketDetail = null; }
      renderMarketSourceList();
      renderMarket();
      toast(t("marketSourceRemoved"));
    } catch (err) {
      button.disabled = false;
      toast(err.message || t("disconnected"));
    }
  }

  const mkClose = $("mkClose");
  if (mkClose) mkClose.onclick = leaveCurrentAppNavigation;
  const mkReload = $("mkReload");
  if (mkReload) mkReload.onclick = loadMarket;
  const mkAddSource = $("mkAddSource");
  if (mkAddSource) mkAddSource.onclick = openMarketSource;
  const mkSearch = $("mkSearch");
  if (mkSearch) mkSearch.addEventListener("input", () => {
    renderMarket();
  });
  const marketSourceDialog = $("marketSourceDialog");
  if (marketSourceDialog) {
    marketSourceDialog.addEventListener("click", (event) => {
      if (event.target === marketSourceDialog) closeMarketSource();
    });
  }
  $("marketSourceClose")?.addEventListener("click", closeMarketSource);
  $("marketSourceCancel")?.addEventListener("click", closeMarketSource);
  const marketSourceForm = $("marketSourceForm");
  if (marketSourceForm) {
    marketSourceForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      const nameInput = $("marketSourceName");
      const urlInput = $("marketSourceUrl");
      const submit = $("marketSourceSubmit");
      const status = $("marketSourceStatus");
      const url = String(urlInput?.value || "").trim();
      if (!url) {
        if (status) { status.hidden = false; status.textContent = t("marketSourceUrl"); }
        urlInput?.focus();
        return;
      }
      if (submit) { submit.disabled = true; submit.textContent = t("marketSourceAdding"); }
      if (status) { status.hidden = true; status.textContent = ""; }
      try {
        const result = await api("/api/market/sources", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "add", name: String(nameInput?.value || "").trim(), url })
        });
        const source = result.source;
        if (!source) throw new Error(t("marketSourceLoadFail"));
        marketSources = Array.isArray(result.sources) ? result.sources : [...marketSources.filter((item) => item.id !== source.id), source];
        const key = marketSourcePrefix + source.id;
        const tagged = (Array.isArray(result.items) ? result.items : []).map((item) => ({ ...item, market: key, sourceId: source.id, marketName: source.name }));
        marketData = marketData.filter((item) => item.market !== key).concat(tagged);
        marketView = key;
        marketDetail = null;
        closeMarketSource();
        renderMarket();
        toast(t("marketSourceAdded"));
      } catch (err) {
        if (status) { status.hidden = false; status.textContent = err.message || t("marketSourceLoadFail"); }
      } finally {
        if (submit) { submit.disabled = false; submit.textContent = t("marketSourceSave"); }
      }
    });
  }

  // ===== 标题栏：文件夹胶囊 / ⋯ 菜单 / chevron 菜单 / 侧栏行接线 =====
  const folderPill = $("folderPill");
  if (folderPill) folderPill.onclick = () => openPicker();

  const titleMenu = $("titleMenu");
  const titleMore = $("titleMore");
  if (titleMore && titleMenu) {
    titleMore.onclick = (e) => {
      e.stopPropagation();
      const r = titleMore.getBoundingClientRect();
      titleMenu.style.left = Math.min(r.left, window.innerWidth - 190) + "px";
      titleMenu.style.top = r.bottom + 6 + "px";
      titleMenu.hidden = !titleMenu.hidden;
      const chev = $("chevMenu");
      if (chev) chev.hidden = true;
    };
    titleMenu.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-tact]");
      if (!btn) return;
      titleMenu.hidden = true;
      const act = btn.dataset.tact;
      if (act === "rename" && state.sessionId) renameSession(state.sessionId, state.sessionTitle);
      else if (act === "fork" && state.sessionId) forkSession(state.sessionId);
      else if (act === "export") exportChat();
      else if (act === "archive" && state.sessionId) archiveSession(state.sessionId, true);
    });
  }

  const chevMenu = $("chevMenu");
  const chevBtn = $("winChevron");
  if (chevBtn && chevMenu) {
    chevBtn.onclick = (e) => {
      e.stopPropagation();
      const r = chevBtn.getBoundingClientRect();
      chevMenu.style.left = (r.right - 170) + "px";
      chevMenu.style.top = r.bottom + 6 + "px";
      chevMenu.hidden = !chevMenu.hidden;
      titleMenu.hidden = true;
    };
    chevMenu.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-cact]");
      if (!btn) return;
      chevMenu.hidden = true;
      const act = btn.dataset.cact;
      if (act === "settings") openSettings();
      else if (act === "guide") openSettings("help");
      else if (act === "usage") openSettings("usage");
    });
  }

  const sideSearch = $("sideSearch");
  if (sideSearch) sideSearch.onclick = () => openCmdk();
  const sideMarket = $("sideMarket");
  if (sideMarket) sideMarket.onclick = () => openMarket();
  const sideAutomations = $("sideAutomations");
  if (sideAutomations) sideAutomations.onclick = () => openAutomations();
  $("automationClose").onclick = leaveCurrentAppNavigation;
  $("automationRefresh").onclick = () => loadAutomations();
  $("automationNewTask").onclick = () => openAutomationCreate();
  $("automationBackHome").onclick = showAutomationHome;
  $("automationSearch").oninput = renderAutomations;
  initAutomationIntervalSelect();
  $("automationForm").onsubmit = (event) => submitAutomation(event).catch((err) => toast(err.message || t("disconnected")));
  $("automationList").addEventListener("click", (event) => {
    const cancelButton = event.target.closest("[data-automation-cancel]");
    if (cancelButton) {
      const task = automationCache.find((item) => item.id === cancelButton.dataset.automationCancel);
      requestAutomationCancel(task);
      return;
    }
    const openButton = event.target.closest("[data-automation-open]");
    if (openButton) openAutomationRecord(automationCache.find((item) => item.id === openButton.dataset.automationOpen));
  });
  document.querySelectorAll("[data-automation-prompt]").forEach((button) => {
    button.onclick = () => openAutomationCreate(t(button.dataset.automationPrompt));
  });

  // ===== 窗口钮拖拽条双击最大化 =====
  const dragStrips = ["dragStrip", "settingsDragStrip"].map((id) => document.getElementById(id)).filter(Boolean);
  dragStrips.forEach((dragStrip) => {
    if (document.documentElement.dataset.host === "desktop") {
      dragStrip.addEventListener("mousedown", (event) => {
        if (event.button !== 0 || !window.pywebview || !pywebview.api || !pywebview.api.win_drag) return;
        event.preventDefault();
        Promise.resolve(pywebview.api.win_drag()).catch(() => {});
      });
    }
    dragStrip.addEventListener("dblclick", () => { winToggleMax(); });
  });


  async function winToggleMax() {
    if (!window.pywebview || !pywebview.api) return;
    try { await pywebview.api.win_toggle(); } catch {}
    try {
      const st = await pywebview.api.win_state();
      const maxIcon = st === "max"
        ? '<path d="M8 3H4.2A1.2 1.2 0 0 0 3 4.2V8" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/><rect x="4.5" y="4.5" width="6" height="6" rx="1" fill="none" stroke="currentColor" stroke-width="1.2"/>'
        : '<rect x="2.5" y="2.5" width="7" height="7" rx="1" fill="none" stroke="currentColor" stroke-width="1.2"/>';
      document.querySelectorAll("#winMaxIcon, #settingsWinMaxIcon").forEach((icon) => { icon.innerHTML = maxIcon; });
    } catch {}
  }
  window.winToggleMax = winToggleMax;

  // 「在哪里打开」启动器
  const openInPrefKey = "grok-webui-openin";
  const openInPref = () => {
    const saved = localStorage.getItem(openInPrefKey) || "vscode";
    return document.documentElement.dataset.platform === "macos" && saved === "terminal" ? "vscode" : saved;
  };
  const OPENIN_ICONS = {
    vscode: '<img src="/static/vscode-logo.png?v=1" width="18" height="18" alt="">',
    cursor: '<svg width="15" height="15" viewBox="0 0 20 20"><rect x="2" y="2" width="16" height="16" rx="3.5" fill="#2c2c31"/><path fill="#4a4a52" d="M6 6.5 13.5 5v4.2L6 9.8z"/><path fill="#8f8f98" d="m6 13.5 7.5 1.5V10.6L6 10.2z"/><path fill="#d7d7dc" d="m13.5 5-3 2.6v4.8l3 2.6z"/></svg>',
    explorer: '<svg width="15" height="15" viewBox="0 0 20 20"><path fill="#e8a33d" d="M1.5 5.2c0-1 .8-1.8 1.8-1.8h4.2l1.9 2h7.3c1 0 1.8.8 1.8 1.8v1H1.5z"/><path fill="#ffc95e" d="M1.5 8.2h17v6.6c0 1-.8 1.8-1.8 1.8H3.3c-1 0-1.8-.8-1.8-1.8z"/></svg>',
    terminal: '<svg width="15" height="15" viewBox="0 0 20 20"><rect x="1.8" y="2.5" width="16.4" height="15" rx="2.5" fill="#1e1e22"/><path fill="none" stroke="#cfcfd6" stroke-width="1.4" stroke-linecap="round" d="m4.6 6.8 3 2.6-3 2.6"/><path fill="none" stroke="#cfcfd6" stroke-width="1.4" stroke-linecap="round" d="M9.4 12.6h5.4"/></svg>'
  };
  const OPENIN_NAME_KEYS = { vscode: "openInVscodeName", cursor: "openInCursorName", explorer: "openInExplorerName", terminal: "openInTerminalName" };
  function updateLaunchBtn() {
    const pref = openInPref();
    const btn = $("launchVscode");
    if (btn) {
      btn.innerHTML = OPENIN_ICONS[pref] || OPENIN_ICONS.vscode;
      const name = OPENIN_NAME_KEYS[pref] ? t(OPENIN_NAME_KEYS[pref]) : pref;
      btn.title = t("openProjectIn").replace("{target}", name);
    }
  }

  function renderOpenInChecks() {
    const menu = $("openInMenu");
    if (!menu) return;
    menu.querySelectorAll(".ocheck").forEach((i) => {
      i.textContent = i.dataset.check === openInPref() ? "✓" : "";
    });
  }

  const openIn = (target) => {
    if (target) {
      localStorage.setItem(openInPrefKey, target);
      renderOpenInChecks();
      updateLaunchBtn();
    }
    api("/api/open-in", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ target: target || openInPref(), cwd: state.cwd }) })
      .then(() => toast("✓"))
      .catch((err) => toast(err.message || t("disconnected")));
  };
  const launchVscode = $("launchVscode");
  if (launchVscode) {
    updateLaunchBtn();
    launchVscode.onclick = () => openIn();
  }
  const launchChev = $("launchChev");
  const openInMenu = $("openInMenu");
  if (launchChev && openInMenu) {
    launchChev.onclick = (e) => {
      e.stopPropagation();
      renderOpenInChecks();
      const grp = launchChev.closest(".launch-group");
      const r = (grp || launchChev).getBoundingClientRect();
      // 按钮正下方、与按钮组左缘对齐，并限制在窗口内
      const left = Math.max(8, Math.min(r.left, window.innerWidth - 200));
      openInMenu.style.left = left + "px";
      openInMenu.style.top = r.bottom + 6 + "px";
      openInMenu.hidden = !openInMenu.hidden;
      const tm2 = $("titleMenu"), cm2 = $("chevMenu");
      if (tm2) tm2.hidden = true;
      if (cm2) cm2.hidden = true;
    };
    openInMenu.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-oact]");
      if (!btn) return;
      openInMenu.hidden = true;
      openIn(btn.dataset.oact);
    });
  }

  // 窗口钮 chevron 菜单

  thread.addEventListener("click", (ev) => {
    const homeStarter = ev.target.closest("[data-home-starter]");
    if (homeStarter) {
      const index = Number(homeStarter.dataset.homeStarter);
      const mode = { 2: "agent", 3: "plan", 4: "goal" }[index];
      if (mode) setWorkMode(mode, true);
      const project = state.cwd ? workspaceName(state.cwd) : t("starterProjectDefault");
      input.value = t(`starter${index}q`).replaceAll("{project}", project);
      input.dispatchEvent(new Event("input", { bubbles: true }));
      input.focus();
      input.setSelectionRange(input.value.length, input.value.length);
      return;
    }
    const btn = ev.target.closest("[data-mact]");
    if (!btn) return;
    if (btn.dataset.mact === "toggle-tool") {
      const card = btn.closest(".tool");
      const output = card?.querySelector(".tool-output");
      if (!output) return;
      const open = btn.getAttribute("aria-expanded") !== "true";
      btn.setAttribute("aria-expanded", String(open));
      output.hidden = !open;
      return;
    }
    if (btn.dataset.mact === "copy-tool") {
      const text = btn.closest(".tool")?.querySelector("pre")?.textContent || "";
      navigator.clipboard.writeText(text).then(() => toast(t("copied"))).catch(() => {});
      return;
    }
    const art = btn.closest(".msg");
    const idx = Number(art && art.dataset.idx);
    const msg = state.transcript[idx];
    if (!msg) return;
    if (btn.dataset.mact === "copy" || btn.dataset.mact === "copy-user") {
      const startIdx = Number(art.dataset.startIdx);
      const copyText = Number.isInteger(startIdx)
        ? state.transcript.slice(startIdx, idx + 1).filter((item) => item.role === "assistant").map((item) => item.text || "").filter(Boolean).join("\n\n")
        : msg.text || "";
      navigator.clipboard.writeText(copyText).then(() => toast(t("copied"))).catch(() => {});
    } else if (btn.dataset.mact === "edit-user") {
      input.value = msg.text || "";
      input.focus();
      input.dispatchEvent(new Event("input", { bubbles: true }));
    } else if (btn.dataset.mact === "fork") {
      if (!state.sessionId) return;
      const until = state.transcript.slice(0, idx).filter((m) => m.role === "user").length;
      forkSession(state.sessionId, until);
    } else if (btn.dataset.mact === "undo") {
      if (!state.sessionId) return;
      const userCount = state.transcript.slice(0, idx).filter((m) => m.role === "user").length;
      if (userCount >= 1) rewindTo(userCount - 1);
    }
  });


  const onboardingState = { step: "language", runtime: null, access: null, mode: "", readyWith: "account", busy: false };
  const onboardingDialog = $("onboardingDialog");

  function onboardingStatus(title, detail, status) {
    return `<div class="onboarding-status" data-state="${status}"><i class="onboarding-status-dot" aria-hidden="true"></i><div class="onboarding-status-copy"><b>${escapeHtml(title)}</b><span>${escapeHtml(detail)}</span></div></div>`;
  }

  function renderOnboarding() {
    if (!onboardingDialog) return;
    const content = $("onboardingContent");
    const actions = $("onboardingActions");
    const stepIndex = onboardingState.step === "language" ? 1 : onboardingState.step === "runtime" ? 2 : 3;
    $("onboardingStepCount").textContent = t("onboardingStep").replace("{current}", String(stepIndex)).replace("{total}", "3");
    $("onboardingProgressFill").style.width = `${stepIndex / 3 * 100}%`;

    if (onboardingState.step === "language") {
      content.innerHTML = `<h3>${escapeHtml(t("onboardingLanguageTitle"))}</h3><p>${escapeHtml(t("onboardingLanguageHelp"))}</p><div class="onboarding-language-field"><label id="onboardingLanguageLabel">${escapeHtml(t("language"))}</label><div id="onboardingLanguage"></div></div>`;
      const languageRoot = content.querySelector("#onboardingLanguage");
      const languageOptions = LANGS.map((language) => ({ value: language.id, label: language.native }));
      renderCSelect(languageRoot, {
        options: languageOptions,
        value: state.lang,
        onChange: (value) => {
          selectLanguage(value, true);
          renderOnboarding();
          content.querySelector("#onboardingLanguage .lang-btn")?.focus();
        }
      });
      const languageTrigger = languageRoot.querySelector(".lang-btn");
      const languagePopover = languageRoot.querySelector(".lang-pop");
      const languageChoices = [...languagePopover.querySelectorAll('[role="option"]')];
      const selectedLanguage = languageOptions.find((language) => language.value === state.lang) || languageOptions[0];
      const supportsTopLayerPopover = typeof languagePopover.showPopover === "function";
      let languagePopoverOpen = false;
      languageTrigger.setAttribute("aria-label", `${t("language")}: ${selectedLanguage.label}`);
      languageTrigger.setAttribute("aria-controls", "onboardingLanguageOptions");
      languagePopover.id = "onboardingLanguageOptions";
      languagePopover.setAttribute("popover", "manual");
      languagePopover.setAttribute("aria-labelledby", "onboardingLanguageLabel");
      const positionLanguagePopover = () => {
        const rect = languageTrigger.getBoundingClientRect();
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        const width = Math.min(rect.width, viewportWidth - 24);
        const left = Math.max(12, Math.min(rect.left, viewportWidth - width - 12));
        const top = rect.bottom + 6;
        languagePopover.style.position = "fixed";
        languagePopover.style.inset = "auto";
        languagePopover.style.margin = "0";
        languagePopover.style.top = `${top}px`;
        languagePopover.style.left = `${left}px`;
        languagePopover.style.width = `${width}px`;
        languagePopover.style.maxWidth = `${viewportWidth - 24}px`;
        languagePopover.style.maxHeight = `${Math.max(72, viewportHeight - top - 12)}px`;
      };
      const closeLanguagePopover = (returnFocus = false) => {
        if (!languagePopoverOpen) return;
        languagePopoverOpen = false;
        if (supportsTopLayerPopover && languagePopover.matches(":popover-open")) languagePopover.hidePopover();
        languagePopover.hidden = true;
        languageTrigger.setAttribute("aria-expanded", "false");
        window.removeEventListener("resize", positionLanguagePopover);
        document.removeEventListener("scroll", positionLanguagePopover, true);
        document.removeEventListener("click", closeOnOutsideClick);
        if (returnFocus && languageTrigger.isConnected) languageTrigger.focus();
      };
      const closeOnOutsideClick = (event) => {
        if (!languageRoot.contains(event.target)) closeLanguagePopover();
      };
      languageTrigger.onclick = (event) => {
        event.stopPropagation();
        if (languagePopoverOpen) {
          closeLanguagePopover();
          return;
        }
        languagePopoverOpen = true;
        languagePopover.hidden = false;
        languageRoot.classList.remove("drop-up");
        positionLanguagePopover();
        if (supportsTopLayerPopover) languagePopover.showPopover();
        languageTrigger.setAttribute("aria-expanded", "true");
        window.addEventListener("resize", positionLanguagePopover);
        document.addEventListener("scroll", positionLanguagePopover, true);
        document.addEventListener("click", closeOnOutsideClick);
      };
      languageChoices.forEach((choice) => choice.addEventListener("click", () => {
        closeLanguagePopover();
        if (languageTrigger.isConnected) languageTrigger.focus();
      }));
      languageRoot.addEventListener("keydown", (event) => {
        const focusedIndex = languageChoices.indexOf(document.activeElement);
        if (event.key === "Escape" && languagePopoverOpen) {
          event.preventDefault();
          closeLanguagePopover(true);
          return;
        }
        if (document.activeElement === languageTrigger && ["ArrowDown", "ArrowUp"].includes(event.key)) {
          event.preventDefault();
          if (!languagePopoverOpen) languageTrigger.click();
          const selectedIndex = languageChoices.findIndex((choice) => choice.getAttribute("aria-selected") === "true");
          languageChoices[selectedIndex >= 0 ? selectedIndex : event.key === "ArrowDown" ? 0 : languageChoices.length - 1]?.focus();
          return;
        }
        if (focusedIndex < 0) return;
        let nextIndex = focusedIndex;
        if (event.key === "ArrowDown") nextIndex = (focusedIndex + 1) % languageChoices.length;
        else if (event.key === "ArrowUp") nextIndex = (focusedIndex - 1 + languageChoices.length) % languageChoices.length;
        else if (event.key === "Home") nextIndex = 0;
        else if (event.key === "End") nextIndex = languageChoices.length - 1;
        else return;
        event.preventDefault();
        languageChoices[nextIndex]?.focus();
      });
      languageRoot.addEventListener("focusout", () => requestAnimationFrame(() => {
        if (languageRoot.contains(document.activeElement) || !languagePopoverOpen) return;
        closeLanguagePopover();
      }));
      actions.innerHTML = `<div><button type="button" class="primary" id="onboardingNext">${escapeHtml(t("onboardingNext"))}</button></div>`;
      actions.querySelector("#onboardingNext").onclick = () => setOnboardingStep("runtime");
      return;
    }

    if (onboardingState.step === "runtime") {
      const result = onboardingState.runtime;
      const status = result?.status;
      const doctor = result?.doctor;
      const installed = !!status?.version;
      const healthy = installed && !!doctor?.ok && !status?.error;
      content.innerHTML = `<h3>${escapeHtml(t("onboardingRuntimeTitle"))}</h3>${onboardingState.busy
        ? onboardingStatus(t("onboardingRuntimeChecking"), "", "checking")
        : `${onboardingStatus(t("runtimeTitle"), installed ? t("onboardingRuntimeInstalled").replace("{version}", status.version) : t("onboardingRuntimeMissing"), installed ? "ok" : "bad")}${onboardingStatus(t("runtimeStatus"), healthy ? t("onboardingEnvironmentReady") : t("onboardingEnvironmentIssue"), healthy ? "ok" : "bad")}`}`;
      if (!onboardingState.busy) {
        content.insertAdjacentHTML("beforeend", `<div class="onboarding-runtime-actions"><button type="button" class="ghost" id="onboardingRetry">${escapeHtml(t("onboardingRetry"))}</button></div>`);
        content.querySelector("#onboardingRetry").onclick = checkOnboardingRuntime;
      }
      actions.innerHTML = `<button type="button" class="ghost" id="onboardingBack">${escapeHtml(t("onboardingBack"))}</button><div><button type="button" class="primary" id="onboardingNext"${onboardingState.busy ? " disabled" : ""}>${escapeHtml(t("onboardingNext"))}</button></div>`;
      actions.querySelector("#onboardingBack").onclick = () => setOnboardingStep("language");
      actions.querySelector("#onboardingNext").onclick = () => setOnboardingStep("access");
      if (!result && !onboardingState.busy) checkOnboardingRuntime();
      return;
    }

    if (onboardingState.step === "access") {
      const access = onboardingState.access;
      const runtimeMissing = !onboardingState.runtime?.status?.version;
      const account = access?.account;
      const status = access?.status;
      const customModels = Array.isArray(status?.customModels) ? status.customModels : [];
      const currentModel = status?.model || state.model;
      const currentCustom = status?.providerSource === "custom" || customModels.some((model) => model.id === currentModel || model.model === currentModel);
      const alreadyReady = !runtimeMissing && (account?.loggedIn && !currentCustom ? "account" : currentCustom ? "api" : "");
      if (alreadyReady) {
        onboardingState.step = "ready";
        onboardingState.readyWith = alreadyReady;
        renderOnboarding();
        return;
      }
      const missingRuntime = runtimeMissing
        ? onboardingStatus(t("onboardingRuntimeMissing"), t("onboardingApiNeedRuntime"), "bad")
        : "";
      const accountStatus = onboardingStatus(
        !access ? t("processing") : account?.loggedIn ? t("onboardingAccountConnected") : t("onboardingAccountMissing"),
        account?.loggedIn ? (account.email || "") : access ? t("accountLoginHelp") : "",
        account?.loggedIn ? "ok" : "checking"
      );
      let modeContent = "";
      if (!onboardingState.mode) {
        modeContent = `<div class="onboarding-choice-grid">
          <button type="button" class="onboarding-choice" data-onboarding-mode="login"${runtimeMissing || !access || onboardingState.busy ? " disabled" : ""}><b>${escapeHtml(t("accountLogin"))}</b><span>${escapeHtml(t("accountLoginHelp"))}</span></button>
          <button type="button" class="onboarding-choice" data-onboarding-mode="api"${runtimeMissing || !access || onboardingState.busy ? " disabled" : ""}><b>${escapeHtml(t("customApi"))}</b><span>${escapeHtml(t("customApiDesc"))}</span></button>
        </div>`;
      } else if (onboardingState.mode === "login") {
        modeContent = `<button type="button" class="ghost" id="onboardingModeBack">${escapeHtml(t("onboardingBack"))}</button>
          <div class="onboarding-runtime-actions"><button type="button" class="primary" id="onboardingLogin">${escapeHtml(t("accountLogin"))}</button>
          <pre class="cli-pre onboarding-login-output" id="onboardingLoginOutput" hidden></pre></div>`;
      } else {
        const savedModels = customModels.length ? `<div class="onboarding-saved-api">
          <label for="onboardingSavedApi">${escapeHtml(t("onboardingApiUseSaved"))}</label>
          <select id="onboardingSavedApi">${customModels.map((model) => `<option value="${escapeHtml(model.id)}"${model.id === currentModel || model.model === currentModel ? " selected" : ""}>${escapeHtml(model.name || model.model || model.id)}</option>`).join("")}</select>
          <button type="button" class="primary" id="onboardingUseSavedApi">${escapeHtml(t("onboardingUseSavedApi"))}</button>
        </div>` : "";
        modeContent = `<button type="button" class="ghost" id="onboardingModeBack">${escapeHtml(t("onboardingBack"))}</button>${savedModels}
          <button type="button" class="ghost" id="onboardingConfigureApi">${escapeHtml(t("onboardingApiConfigure"))}</button>
          <div class="onboarding-provider-box" id="onboardingProviderBox" hidden></div><p class="sub" id="onboardingApiError" hidden></p>`;
      }
      content.innerHTML = `<h3>${escapeHtml(t("onboardingAccessTitle"))}</h3>${missingRuntime}${accountStatus}${modeContent}`;
      content.querySelectorAll("[data-onboarding-mode]").forEach((button) => {
        button.onclick = () => { onboardingState.mode = button.dataset.onboardingMode; renderOnboarding(); };
      });
      content.querySelector("#onboardingModeBack")?.addEventListener("click", () => { onboardingState.mode = ""; renderOnboarding(); });
      const login = content.querySelector("#onboardingLogin");
      if (login) login.onclick = () => startAccountLogin(login, content.querySelector("#onboardingLoginOutput"), () => {
        onboardingState.readyWith = "account";
        setOnboardingStep("ready");
      });
      const configure = content.querySelector("#onboardingConfigureApi");
      if (configure) configure.onclick = () => {
        configure.hidden = true;
        const box = content.querySelector("#onboardingProviderBox");
        box.hidden = false;
        renderProviderBox(box, {
          showExistingModels: false,
          onSaved: async (payload, result) => {
            try {
              state.customModels = result.customModels || [];
              const savedModel = state.customModels.find((item) => item.model === payload.modelId);
              const modelId = savedModel?.id || payload.modelId;
              await api("/api/model", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ model: modelId }) });
              state.model = modelId;
              state.providerSource = "custom";
              renderPicks();
              renderLiveMeta();
              onboardingState.readyWith = "api";
              setOnboardingStep("ready");
            } catch {
              const error = content.querySelector("#onboardingApiError");
              error.hidden = false;
              error.textContent = t("onboardingApiSaveFailed");
            }
          },
          onError: () => {
            const error = content.querySelector("#onboardingApiError");
            if (error) { error.hidden = false; error.textContent = t("disconnected"); }
          }
        });
      };
      const useSavedApi = content.querySelector("#onboardingUseSavedApi");
      if (useSavedApi) useSavedApi.onclick = async () => {
        const model = content.querySelector("#onboardingSavedApi").value;
        useSavedApi.disabled = true;
        try {
          await api("/api/model", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ model }) });
          state.model = model;
          state.providerSource = "custom";
          renderPicks();
          renderLiveMeta();
          onboardingState.readyWith = "api";
          setOnboardingStep("ready");
        } catch {
          useSavedApi.disabled = false;
          const error = content.querySelector("#onboardingApiError");
          error.hidden = false;
          error.textContent = t("disconnected");
        }
      };
      actions.innerHTML = `<button type="button" class="ghost" id="onboardingBack">${escapeHtml(t("onboardingBack"))}</button><div></div>`;
      actions.querySelector("#onboardingBack").onclick = () => setOnboardingStep("runtime");
      if (!access && !onboardingState.busy) loadOnboardingAccess();
      return;
    }

    const readyText = onboardingState.readyWith === "api" ? t("onboardingReadyApi") : t("onboardingReadyAccount");
    content.innerHTML = `<div class="onboarding-ready"><h3>${escapeHtml(t("onboardingReadyTitle"))}</h3><p>${escapeHtml(readyText)}</p></div>`;
    actions.innerHTML = `<span></span><div><button type="button" class="primary" id="onboardingEnter">${escapeHtml(t("onboardingEnter"))}</button></div>`;
    actions.querySelector("#onboardingEnter").onclick = finishOnboarding;
  }

  function setOnboardingStep(step) {
    onboardingState.step = step;
    if (step === "access") onboardingState.access = null;
    renderOnboarding();
  }

  async function checkOnboardingRuntime() {
    onboardingState.busy = true;
    onboardingState.runtime = null;
    renderOnboarding();
    const [status, doctor] = await Promise.allSettled([api("/api/status"), api("/api/doctor")]);
    onboardingState.runtime = {
      status: status.status === "fulfilled" ? status.value : null,
      doctor: doctor.status === "fulfilled" ? doctor.value : null
    };
    onboardingState.busy = false;
    renderOnboarding();
  }

  async function loadOnboardingAccess() {
    onboardingState.busy = true;
    renderOnboarding();
    const [status, account] = await Promise.allSettled([api("/api/status"), api("/api/account")]);
    const accountData = account.status === "fulfilled" ? account.value : null;
    onboardingState.access = {
      status: status.status === "fulfilled" ? status.value : null,
      account: accountData ? { ...(accountData.account || {}), loggedIn: !!accountData.loggedIn } : { loggedIn: false }
    };
    if (onboardingState.access.account.loggedIn) applyUser(onboardingState.access.account);
    onboardingState.busy = false;
    renderOnboarding();
  }

  function finishOnboarding() {
    localStorage.setItem(ONBOARDING_STORAGE_KEY, "1");
    if (onboardingDialog?.open) onboardingDialog.close();
  }

  function maybeOpenFirstRunOnboarding() {
    if (!onboardingDialog || localStorage.getItem(ONBOARDING_STORAGE_KEY) === "1") return;
    if (HAS_LEGACY_APP_STATE) {
      localStorage.setItem(ONBOARDING_STORAGE_KEY, "1");
      return;
    }
    onboardingState.step = "language";
    renderOnboarding();
    onboardingDialog.addEventListener("cancel", (event) => {
      event.preventDefault();
      finishOnboarding();
    }, { once: true });
    $("onboardingSkip").onclick = finishOnboarding;
    onboardingDialog.showModal();
    onboardingDialog.querySelector("#onboardingLanguage .lang-btn")?.focus();
  }


  async function boot() {
    const savedTheme = localStorage.getItem("grok-zh-theme") || "grok-day";
    applyTheme(savedTheme, false);
    applyWorkStyle(state.workStyle, false);
    applyI18n();
    connectEvents();
    try {
      const st = await api("/api/status");
      state.cwd = st.cwd || "";
      state.permission = st.permission || "ask";
      state.workMode = st.workMode || "agent";
      state.effort = st.effort || "high";
      state.showThinking = st.showThinking !== false;
      state.settings = normalizeSettings({ ...(st.settings && typeof st.settings === "object" ? st.settings : {}), ...(readSettingsStorage() || {}) });
      writeSettingsStorage(state.settings);
      if (typeof st.previewOpen === "boolean") state.previewOpen = st.previewOpen;
      state.closeAction = st.closeAction || "tray";
      const savedLang = normalizeLangId(localStorage.getItem("grok-webui-lang"));
      const serverLang = normalizeLangId(st.lang);
      if (serverLang && LANGS.some((item) => item.id === serverLang)) state.lang = serverLang;
      else if (savedLang && LANGS.some((item) => item.id === savedLang)) state.lang = savedLang;
      state.lang = normalizeLangId(state.lang);
      localStorage.setItem("grok-webui-lang", state.lang);
      if (st.workStyle) applyWorkStyle(st.workStyle, false);
      const cwdEl2 = $("cwd"); if (cwdEl2) cwdEl2.textContent = state.cwd || t("noFolder");
      if (st.theme) applyTheme(st.theme, false);
      applyThinking(state.showThinking);
      setPreviewOpen(state.previewOpen);
      setPermission(state.permission, false);
      setWorkMode(state.workMode, false);
      state.models = st.models || ["grok-4.7", "grok-4.6"];
      state.customModels = Array.isArray(st.customModels) ? st.customModels : [];
      state.providerSource = ["official", "custom", "unknown"].includes(st.providerSource) ? st.providerSource : "unknown";
      state.runtimeVersion = st.version || "";
      state.modelCatalog = Array.isArray(st.modelCatalog) ? st.modelCatalog : [];
      state.model = st.model || state.models[0] || "grok-4.7";
      if (st.user) applyUser(st.user);
      renderPicks();
      applyWorkStyle(state.workStyle, false);
      applyI18n();
      setStatus(true);
      await refreshSessions(true);
    } catch (err) {
      setStatus(false, err.message);
    }
    maybeOpenFirstRunOnboarding();
  }

  boot().finally(startAccountStateSync);
})();
