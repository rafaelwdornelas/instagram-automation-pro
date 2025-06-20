// popup.js - Controlador da interface avançada

// Elementos DOM
const elements = {
  // Tabs
  tabs: document.querySelectorAll(".tab"),
  tabContents: document.querySelectorAll(".tab-content"),

  // Status
  statusText: document.getElementById("statusText"),
  statusBadge: document.querySelector(".status-badge"),
  currentIndex: document.getElementById("currentIndex"),
  totalCount: document.getElementById("totalCount"),
  successCount: document.getElementById("successCount"),
  failedCount: document.getElementById("failedCount"),
  progressBar: document.getElementById("progressBar"),

  // Timer de pausa
  pauseTimer: document.getElementById("pauseTimer"),
  pauseReason: document.getElementById("pauseReason"),
  pauseCountdown: document.getElementById("pauseCountdown"),
  pauseProgress: document.getElementById("pauseProgress"),

  // Automation
  quickList: document.getElementById("quickList"),
  savedListSelect: document.getElementById("savedListSelect"),
  startBtn: document.getElementById("startBtn"),
  stopBtn: document.getElementById("stopBtn"),
  resumeBtn: document.getElementById("resumeBtn"),

  // Lists
  listName: document.getElementById("listName"),
  listUsernames: document.getElementById("listUsernames"),
  saveListBtn: document.getElementById("saveListBtn"),
  listsContainer: document.getElementById("listsContainer"),

  // Performance
  navDelayMin: document.getElementById("navDelayMin"),
  navDelayMax: document.getElementById("navDelayMax"),
  actionDelayMin: document.getElementById("actionDelayMin"),
  actionDelayMax: document.getElementById("actionDelayMax"),
  actionsPerBatch: document.getElementById("actionsPerBatch"),
  dailyLimit: document.getElementById("dailyLimit"),
  batchPauseMin: document.getElementById("batchPauseMin"),
  batchPauseMax: document.getElementById("batchPauseMax"),
  skipPrivate: document.getElementById("skipPrivate"),
  skipVerified: document.getElementById("skipVerified"),
  randomizeOrder: document.getElementById("randomizeOrder"),
  simulateHuman: document.getElementById("simulateHuman"),
  saveSettingsBtn: document.getElementById("saveSettingsBtn"),

  // Reports
  reportContent: document.getElementById("reportContent"),
};

// Estado
let savedLists = {};
let currentStatus = {};
let automationInterval = null;
let pauseInterval = null;

// --- Inicialização ---
document.addEventListener("DOMContentLoaded", async () => {
  setupEventListeners();
  await loadSavedLists();
  await loadSettings();
  await updateStatus();
  await checkForSavedProgress();

  // Atualiza status periodicamente
  automationInterval = setInterval(updateStatus, 1000);
});

// --- Event Listeners ---
function setupEventListeners() {
  // Tabs
  elements.tabs.forEach((tab) => {
    tab.addEventListener("click", () => switchTab(tab.dataset.tab));
  });

  // Automation
  elements.startBtn.addEventListener("click", startAutomation);
  elements.stopBtn.addEventListener("click", stopAutomation);
  elements.resumeBtn.addEventListener("click", resumeAutomation);

  // Lists
  elements.saveListBtn.addEventListener("click", saveList);

  // Performance
  elements.saveSettingsBtn.addEventListener("click", saveSettings);

  // Validação de ranges
  elements.navDelayMin.addEventListener("change", () => {
    if (
      parseInt(elements.navDelayMin.value) >=
      parseInt(elements.navDelayMax.value)
    ) {
      elements.navDelayMax.value = parseInt(elements.navDelayMin.value) + 1;
    }
  });

  elements.navDelayMax.addEventListener("change", () => {
    if (
      parseInt(elements.navDelayMax.value) <=
      parseInt(elements.navDelayMin.value)
    ) {
      elements.navDelayMin.value = parseInt(elements.navDelayMax.value) - 1;
    }
  });
}

// --- Tab Management ---
function switchTab(tabName) {
  elements.tabs.forEach((tab) => {
    tab.classList.toggle("active", tab.dataset.tab === tabName);
  });

  elements.tabContents.forEach((content) => {
    content.classList.toggle("active", content.id === tabName);
  });

  // Carrega dados específicos da aba
  if (tabName === "reports") {
    loadReport();
  }
}

// --- Status Updates ---
async function updateStatus() {
  try {
    const response = await chrome.runtime.sendMessage({ command: "getStatus" });
    currentStatus = response;

    console.log("Status recebido:", response); // Debug

    // Atualiza badge de status
    const isPaused = response.isPaused || false;
    const isActive = response.isActive || isPaused;

    elements.statusBadge.className =
      "status-badge " +
      (isActive ? (isPaused ? "paused" : "active") : "inactive");

    elements.statusText.textContent = isActive
      ? isPaused
        ? "Pausado"
        : "Ativo"
      : "Inativo";

    // Atualiza estatísticas
    elements.currentIndex.textContent = response.currentIndex || 0;
    elements.totalCount.textContent = response.currentList || 0;
    elements.successCount.textContent = response.sessionStats?.successful || 0;
    elements.failedCount.textContent =
      response.sessionStats?.failed || response.failedUsers || 0;

    // Atualiza barra de progresso
    const progress =
      response.currentList > 0
        ? (response.currentIndex / response.currentList) * 100
        : 0;
    elements.progressBar.style.width = `${progress}%`;

    // Atualiza indicadores de limites
    updateLimitIndicators(response.limits);

    // Atualiza timer de pausa
    if (isPaused && response.pauseEndTime && response.pauseReason) {
      console.log(
        "Mostrando timer de pausa:",
        response.pauseReason,
        response.pauseEndTime
      );
      showPauseTimer(response.pauseReason, response.pauseEndTime);
    } else {
      hidePauseTimer();
    }

    // Atualiza botões
    elements.startBtn.style.display = isActive ? "none" : "block";
    elements.stopBtn.style.display = isActive ? "block" : "none";

    // Verifica se deve mostrar botão de retomar
    if (!isActive) {
      await checkForSavedProgress();
    } else {
      elements.resumeBtn.style.display = "none";
    }
  } catch (error) {
    console.error("Erro ao atualizar status:", error);
  }
}

/**
 * Atualiza indicadores de limites
 */
function updateLimitIndicators(limits) {
  if (!limits) return;

  // Adiciona ou atualiza seção de limites se não existir
  let limitsSection = document.getElementById("limitsSection");
  if (!limitsSection) {
    // Cria seção de limites após a barra de progresso
    const progressBar = elements.progressBar.parentElement;
    limitsSection = document.createElement("div");
    limitsSection.id = "limitsSection";
    limitsSection.style.cssText = `
      margin-top: 15px;
      padding: 12px;
      background: rgba(255, 255, 255, 0.05);
      border-radius: 8px;
      font-size: 12px;
    `;
    limitsSection.innerHTML = `
      <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
        <span style="color: #888;">Limite Diário:</span>
        <span id="dailyLimitText" style="font-weight: 600;"></span>
      </div>
      <div id="dailyLimitBar" style="background: #0a0a0a; height: 6px; border-radius: 3px; overflow: hidden; margin-bottom: 12px;">
        <div id="dailyLimitFill" style="height: 100%; background: linear-gradient(90deg, #10b981, #fbbf24); transition: width 0.5s ease;"></div>
      </div>
      <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
        <span style="color: #888;">Limite Horário:</span>
        <span id="hourlyLimitText" style="font-weight: 600;"></span>
      </div>
      <div id="hourlyLimitBar" style="background: #0a0a0a; height: 6px; border-radius: 3px; overflow: hidden;">
        <div id="hourlyLimitFill" style="height: 100%; background: linear-gradient(90deg, #10b981, #ef4444); transition: width 0.5s ease;"></div>
      </div>
    `;
    progressBar.parentElement.appendChild(limitsSection);
  }

  // Atualiza valores diários
  if (limits.daily) {
    const dailyText = document.getElementById("dailyLimitText");
    const dailyFill = document.getElementById("dailyLimitFill");
    const dailyPercent = (limits.daily.used / limits.daily.limit) * 100;

    dailyText.textContent = `${limits.daily.used}/${limits.daily.limit}`;
    dailyFill.style.width = `${Math.min(dailyPercent, 100)}%`;

    // Muda cor se estiver próximo do limite
    if (dailyPercent >= 90) {
      dailyText.style.color = "#ef4444";
      dailyFill.style.background = "#ef4444";
    } else if (dailyPercent >= 70) {
      dailyText.style.color = "#fbbf24";
      dailyFill.style.background = "linear-gradient(90deg, #fbbf24, #ef4444)";
    } else {
      dailyText.style.color = "#10b981";
      dailyFill.style.background = "linear-gradient(90deg, #10b981, #fbbf24)";
    }
  }

  // Atualiza valores horários
  if (limits.hourly) {
    const hourlyText = document.getElementById("hourlyLimitText");
    const hourlyFill = document.getElementById("hourlyLimitFill");
    const hourlyPercent = (limits.hourly.used / limits.hourly.limit) * 100;

    hourlyText.textContent = `${limits.hourly.used}/${limits.hourly.limit}`;
    hourlyFill.style.width = `${Math.min(hourlyPercent, 100)}%`;

    // Muda cor se estiver próximo do limite
    if (hourlyPercent >= 90) {
      hourlyText.style.color = "#ef4444";
      hourlyFill.style.background = "#ef4444";
    } else if (hourlyPercent >= 70) {
      hourlyText.style.color = "#fbbf24";
      hourlyFill.style.background = "linear-gradient(90deg, #fbbf24, #ef4444)";
    } else {
      hourlyText.style.color = "#10b981";
      hourlyFill.style.background = "linear-gradient(90deg, #10b981, #fbbf24)";
    }
  }
}

/**
 * Mostra o timer de pausa
 */
function showPauseTimer(reason, endTime) {
  elements.pauseTimer.style.display = "block";
  elements.pauseReason.textContent = reason || "Pausado";

  // Limpa intervalo anterior se existir
  if (pauseInterval) {
    clearInterval(pauseInterval);
  }

  // Atualiza countdown a cada segundo
  const updateCountdown = () => {
    const now = Date.now();
    const remaining = Math.max(0, endTime - now);

    if (remaining === 0) {
      hidePauseTimer();
      return;
    }

    // Calcula minutos e segundos
    const minutes = Math.floor(remaining / 60000);
    const seconds = Math.floor((remaining % 60000) / 1000);

    // Atualiza display
    elements.pauseCountdown.textContent = `${minutes
      .toString()
      .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;

    // Atualiza progresso circular
    const totalPause = endTime - (now - remaining);
    const progress = ((totalPause - remaining) / totalPause) * 100;
    elements.pauseProgress.style.strokeDashoffset = 100 - progress;
  };

  // Atualiza imediatamente e depois a cada segundo
  updateCountdown();
  pauseInterval = setInterval(updateCountdown, 1000);
}

/**
 * Esconde o timer de pausa
 */
function hidePauseTimer() {
  elements.pauseTimer.style.display = "none";
  if (pauseInterval) {
    clearInterval(pauseInterval);
    pauseInterval = null;
  }
}

// --- Automation Control ---
async function startAutomation() {
  // Obtém lista de usernames
  let usernames = [];

  if (elements.quickList.value.trim()) {
    // Usa lista rápida
    usernames = elements.quickList.value
      .split("\n")
      .map((u) => u.trim().replace("@", ""))
      .filter((u) => u.length > 0);
  } else if (elements.savedListSelect.value) {
    // Usa lista salva
    const listName = elements.savedListSelect.value;
    if (savedLists[listName]) {
      usernames = savedLists[listName].usernames;
    }
  }

  if (usernames.length === 0) {
    alert("Por favor, adicione usernames ou selecione uma lista salva.");
    return;
  }

  // Obtém tipo de ação
  const actionType = document.querySelector(
    'input[name="actionType"]:checked'
  ).value;

  // Envia comando para background
  try {
    await chrome.runtime.sendMessage({
      command: "startAutomation",
      data: {
        actionType,
        usernames,
      },
    });

    // Limpa campos
    elements.quickList.value = "";
    elements.savedListSelect.value = "";
  } catch (error) {
    console.error("Erro ao iniciar automação:", error);
    alert("Erro ao iniciar automação. Verifique o console.");
  }
}

async function stopAutomation() {
  try {
    await chrome.runtime.sendMessage({ command: "stopAutomation" });
  } catch (error) {
    console.error("Erro ao parar automação:", error);
  }
}

// --- Progress Management ---
async function checkForSavedProgress() {
  try {
    console.log("Verificando progresso salvo...");
    const response = await chrome.runtime.sendMessage({
      command: "checkProgress",
    });
    console.log("Resposta checkProgress:", response);
    console.log("Status atual:", currentStatus);

    if (response && response.hasProgress) {
      const remaining = response.remaining;
      const total = response.total;

      console.log(`Progresso encontrado: ${remaining} de ${total} restantes`);

      // Mostra botão de retomar se não estiver ativo
      if (!currentStatus.isActive) {
        elements.resumeBtn.style.display = "block";
        elements.resumeBtn.innerHTML = `<span>⏮</span> Retomar (${remaining} de ${total} restantes)`;
        console.log("Botão de retomar exibido");
      } else {
        console.log("Automação já está ativa, não mostrando botão");
      }
    } else {
      console.log("Nenhum progresso salvo encontrado");
    }
  } catch (error) {
    console.error("Erro ao verificar progresso:", error);
  }
}

async function resumeAutomation() {
  try {
    // Obtém tipo de ação selecionado
    const actionType = document.querySelector(
      'input[name="actionType"]:checked'
    ).value;

    const response = await chrome.runtime.sendMessage({
      command: "resumeAutomation",
      actionType: actionType,
    });

    if (response.success) {
      // Limpa campos
      elements.quickList.value = "";
      elements.savedListSelect.value = "";
      elements.resumeBtn.style.display = "none";
    } else {
      alert(response.error || "Erro ao retomar automação");
    }
  } catch (error) {
    console.error("Erro ao retomar automação:", error);
    alert("Erro ao retomar automação. Verifique o console.");
  }
}

// --- Lists Management ---
async function loadSavedLists() {
  try {
    const response = await chrome.runtime.sendMessage({ command: "getLists" });
    savedLists = response || {};

    // Atualiza select
    elements.savedListSelect.innerHTML =
      '<option value="">-- Selecione uma lista --</option>';

    // Atualiza container
    elements.listsContainer.innerHTML = "";

    Object.entries(savedLists).forEach(([name, data]) => {
      // Adiciona ao select
      const option = document.createElement("option");
      option.value = name;
      option.textContent = `${name} (${data.usernames.length} usuários)`;
      elements.savedListSelect.appendChild(option);

      // Adiciona ao container
      const listItem = createListItem(name, data);
      elements.listsContainer.appendChild(listItem);
    });
  } catch (error) {
    console.error("Erro ao carregar listas:", error);
  }
}

function createListItem(name, data) {
  const div = document.createElement("div");
  div.className = "list-item";
  div.innerHTML = `
        <div class="list-info">
            <div class="list-name">${name}</div>
            <div class="list-count">${data.usernames.length} usuários</div>
        </div>
        <div class="list-actions">
            <button class="icon-btn" onclick="editList('${name}')" title="Editar">✏️</button>
            <button class="icon-btn" onclick="deleteList('${name}')" title="Excluir">🗑️</button>
        </div>
    `;
  return div;
}

async function saveList() {
  const name = elements.listName.value.trim();
  const usernamesText = elements.listUsernames.value.trim();

  if (!name || !usernamesText) {
    alert("Por favor, preencha o nome e os usernames.");
    return;
  }

  const usernames = usernamesText
    .split("\n")
    .map((u) => u.trim().replace("@", ""))
    .filter((u) => u.length > 0);

  if (usernames.length === 0) {
    alert("Por favor, adicione pelo menos um username válido.");
    return;
  }

  savedLists[name] = {
    usernames,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  try {
    await chrome.runtime.sendMessage({
      command: "saveLists",
      lists: savedLists,
    });

    // Limpa campos
    elements.listName.value = "";
    elements.listUsernames.value = "";

    // Recarrega listas
    await loadSavedLists();

    alert(`Lista "${name}" salva com ${usernames.length} usuários!`);
  } catch (error) {
    console.error("Erro ao salvar lista:", error);
    alert("Erro ao salvar lista. Verifique o console.");
  }
}

window.editList = async function (name) {
  const list = savedLists[name];
  if (!list) return;

  // Preenche campos
  elements.listName.value = name;
  elements.listUsernames.value = list.usernames.join("\n");

  // Muda para aba de listas
  switchTab("lists");

  // Scroll para o topo
  document.querySelector(".content").scrollTop = 0;
};

window.deleteList = async function (name) {
  if (!confirm(`Tem certeza que deseja excluir a lista "${name}"?`)) {
    return;
  }

  delete savedLists[name];

  try {
    await chrome.runtime.sendMessage({
      command: "saveLists",
      lists: savedLists,
    });

    await loadSavedLists();
  } catch (error) {
    console.error("Erro ao excluir lista:", error);
  }
};

// --- Settings Management ---
async function loadSettings() {
  try {
    const response = await chrome.runtime.sendMessage({ command: "getStatus" });
    const settings = response.settings;

    if (settings) {
      // Delays
      elements.navDelayMin.value = Math.floor(
        settings.navigationDelay.min / 1000
      );
      elements.navDelayMax.value = Math.floor(
        settings.navigationDelay.max / 1000
      );
      elements.actionDelayMin.value = Math.floor(
        settings.actionDelay.min / 1000
      );
      elements.actionDelayMax.value = Math.floor(
        settings.actionDelay.max / 1000
      );

      // Batch
      elements.actionsPerBatch.value = settings.actionsPerBatch;
      elements.dailyLimit.value = settings.dailyLimit;
      elements.batchPauseMin.value = Math.floor(
        settings.batchPause.min / 60000
      );
      elements.batchPauseMax.value = Math.floor(
        settings.batchPause.max / 60000
      );

      // Behavior
      elements.skipPrivate.checked = settings.skipPrivateProfiles;
      elements.skipVerified.checked = settings.skipVerifiedProfiles;
      elements.randomizeOrder.checked = settings.randomizeOrder;
      elements.simulateHuman.checked = settings.simulateHumanBehavior;
    }
  } catch (error) {
    console.error("Erro ao carregar configurações:", error);
  }
}

async function saveSettings() {
  const settings = {
    navigationDelay: {
      min: parseInt(elements.navDelayMin.value) * 1000,
      max: parseInt(elements.navDelayMax.value) * 1000,
    },
    actionDelay: {
      min: parseInt(elements.actionDelayMin.value) * 1000,
      max: parseInt(elements.actionDelayMax.value) * 1000,
    },
    scrollDelay: { min: 2000, max: 4000 },
    actionsPerBatch: parseInt(elements.actionsPerBatch.value),
    batchPause: {
      min: parseInt(elements.batchPauseMin.value) * 60000,
      max: parseInt(elements.batchPauseMax.value) * 60000,
    },
    dailyLimit: parseInt(elements.dailyLimit.value),
    hourlyLimit: Math.floor(parseInt(elements.dailyLimit.value) / 8),
    skipPrivateProfiles: elements.skipPrivate.checked,
    skipVerifiedProfiles: elements.skipVerified.checked,
    retryFailedUsers: false,
    maxRetries: 1,
    randomizeOrder: elements.randomizeOrder.checked,
    simulateHumanBehavior: elements.simulateHuman.checked,
    randomClicks: elements.simulateHuman.checked,
    randomScrolls: elements.simulateHuman.checked,
    saveProgress: true,
    resumeOnRestart: true,
  };

  try {
    await chrome.runtime.sendMessage({
      command: "updateSettings",
      settings,
    });

    alert("Configurações salvas com sucesso!");
  } catch (error) {
    console.error("Erro ao salvar configurações:", error);
    alert("Erro ao salvar configurações. Verifique o console.");
  }
}

// --- Reports ---
async function loadReport() {
  try {
    const response = await chrome.runtime.sendMessage({ command: "getReport" });

    console.log("Relatório recebido:", response); // Debug

    if (response && response.lastReport) {
      const report = response.lastReport;
      const duration = Math.floor(
        (report.endTime - report.startTime) / 1000 / 60
      );

      elements.reportContent.innerHTML = `
                <div class="status-card">
                    <h4>Resumo da Última Sessão</h4>
                    <div class="stats-grid" style="margin-top: 15px;">
                        <div class="stat-item">
                            <div class="stat-value">${
                              report.totalProcessed
                            }</div>
                            <div class="stat-label">Total Processado</div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-value">${report.successful}</div>
                            <div class="stat-label">Sucesso</div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-value">${report.failed}</div>
                            <div class="stat-label">Falhas</div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-value">${duration}min</div>
                            <div class="stat-label">Duração</div>
                        </div>
                    </div>
                    ${
                      report.pauseReason
                        ? `
                    <div style="margin-top: 15px; padding: 10px; background: rgba(251, 191, 36, 0.1); border: 1px solid rgba(251, 191, 36, 0.3); border-radius: 8px;">
                        <span style="color: #fbbf24; font-size: 13px;">⚠️ ${report.pauseReason}</span>
                    </div>
                    `
                        : ""
                    }
                </div>
                
                <h4 style="margin-top: 20px;">Detalhes</h4>
                <div style="max-height: 300px; overflow-y: auto;">
                    ${generateReportDetails(report)}
                </div>
                
                <button class="btn btn-secondary" onclick="exportReport()" style="width: 100%; margin-top: 20px;">
                    📥 Exportar Relatório
                </button>
            `;
    } else {
      // Se não há relatório salvo, tenta mostrar a sessão atual
      const status = await chrome.runtime.sendMessage({ command: "getStatus" });
      if (
        status &&
        status.sessionStats &&
        status.sessionStats.totalProcessed > 0
      ) {
        elements.reportContent.innerHTML = `
                    <div class="status-card">
                        <h4>Sessão Atual em Andamento</h4>
                        <div class="stats-grid" style="margin-top: 15px;">
                            <div class="stat-item">
                                <div class="stat-value">${status.sessionStats.totalProcessed}</div>
                                <div class="stat-label">Total Processado</div>
                            </div>
                            <div class="stat-item">
                                <div class="stat-value">${status.sessionStats.successful}</div>
                                <div class="stat-label">Sucesso</div>
                            </div>
                            <div class="stat-item">
                                <div class="stat-value">${status.sessionStats.failed}</div>
                                <div class="stat-label">Falhas</div>
                            </div>
                            <div class="stat-item">
                                <div class="stat-value">${status.sessionStats.skipped}</div>
                                <div class="stat-label">Pulados</div>
                            </div>
                        </div>
                    </div>
                    <p style="text-align: center; color: #666; padding: 20px;">
                        A sessão ainda está em andamento. O relatório completo estará disponível quando finalizar.
                    </p>
                `;
      }
    }
  } catch (error) {
    console.error("Erro ao carregar relatório:", error);
    elements.reportContent.innerHTML = `
            <p style="text-align: center; color: #666; padding: 40px;">
                Erro ao carregar relatório. Verifique o console.
            </p>
        `;
  }
}

function generateReportDetails(report) {
  let html = '<div style="font-size: 13px;">';

  // Usuários processados com sucesso
  if (report.processedUsers.length > 0) {
    html += '<h5 style="margin: 15px 0 10px;">✅ Processados com Sucesso</h5>';
    html +=
      '<div style="background: #1a1a1a; padding: 10px; border-radius: 8px;">';
    report.processedUsers.forEach((user) => {
      if (user.status === "success") {
        html += `<div style="margin: 5px 0;">@${user.username} - ${user.action}</div>`;
      }
    });
    html += "</div>";
  }

  // Usuários pulados
  const skippedUsers = report.processedUsers.filter(
    (u) => u.status === "skipped"
  );
  if (skippedUsers.length > 0) {
    html += '<h5 style="margin: 15px 0 10px;">⏭️ Pulados</h5>';
    html +=
      '<div style="background: #1a1a1a; padding: 10px; border-radius: 8px;">';
    skippedUsers.forEach((user) => {
      html += `<div style="margin: 5px 0;">@${user.username} - ${
        user.reason || "N/A"
      }</div>`;
    });
    html += "</div>";
  }

  // Usuários que falharam
  if (report.failedUsers.length > 0) {
    html += '<h5 style="margin: 15px 0 10px;">❌ Falhas</h5>';
    html +=
      '<div style="background: #1a1a1a; padding: 10px; border-radius: 8px;">';
    report.failedUsers.forEach((user) => {
      html += `<div style="margin: 5px 0;">@${user.username} - ${user.reason}</div>`;
    });
    html += "</div>";
  }

  html += "</div>";
  return html;
}

window.exportReport = async function () {
  try {
    const response = await chrome.runtime.sendMessage({ command: "getReport" });

    if (response.lastReport) {
      const report = response.lastReport;
      const csv = generateCSV(report);

      // Cria blob e download
      const blob = new Blob([csv], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `instagram-report-${
        new Date().toISOString().split("T")[0]
      }.csv`;
      a.click();
      URL.revokeObjectURL(url);
    }
  } catch (error) {
    console.error("Erro ao exportar relatório:", error);
  }
};

function generateCSV(report) {
  let csv = "Username,Action,Status,Timestamp,Reason\n";

  report.processedUsers.forEach((user) => {
    const timestamp = new Date(user.timestamp).toLocaleString();
    csv += `${user.username},${user.action},${user.status},${timestamp},${
      user.reason || ""
    }\n`;
  });

  report.failedUsers.forEach((user) => {
    const timestamp = new Date(user.timestamp).toLocaleString();
    csv += `${user.username},-,failed,${timestamp},${user.reason}\n`;
  });

  return csv;
}

// --- Cleanup ---
window.addEventListener("unload", () => {
  if (automationInterval) {
    clearInterval(automationInterval);
  }
  if (pauseInterval) {
    clearInterval(pauseInterval);
  }
});

// --- Message Listener ---
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "statusUpdate") {
    updateStatus();
  } else if (message.type === "automationComplete") {
    if (
      message.report &&
      message.report.pauseReason &&
      message.report.pauseReason.includes("Limite")
    ) {
      alert(
        `Automação pausada: ${message.report.pauseReason}. Verifique o relatório para mais detalhes.`
      );
    } else {
      alert("Automação concluída! Verifique o relatório para mais detalhes.");
    }
    switchTab("reports");
    loadReport();
  }
});
