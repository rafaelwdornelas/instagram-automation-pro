// Adiciona detector de mudanças de URL para SPA
let lastUrl = location.href;
new MutationObserver(() => {
  const url = location.href;
  if (url !== lastUrl) {
    lastUrl = url;
    console.log("URL mudou:", url);
    // Reseta estado quando muda de página
    isProcessing = false;
  }
}).observe(document, { subtree: true, childList: true });

// Detecta quando a extensão é descarregada
window.addEventListener("beforeunload", () => {
  scriptActive = false;
  if (pauseTimerInterval) {
    clearInterval(pauseTimerInterval);
  }
  if (statusInterval) {
    clearInterval(statusInterval);
  }
}); // content_script.js - Sistema inteligente para executar ações no Instagram
console.log("Instagram Automation Content Script v2.0 carregado");

// --- Seletores Atualizados (Instagram 2024/2025) ---
const SELECTORS = {
  // Perfil
  privateAccount: "h2", // Vamos verificar o texto depois
  verifiedBadge: 'svg[aria-label="Verified"]',
  username: "h2, header section h1",
  postsCount: "ul > li:first-child span",
  followersCount: "ul > li:nth-child(2) span",
  followingCount: "ul > li:nth-child(3) span",

  // Modais
  unfollowModal: 'div[role="dialog"]',
  actionBlockedModal: 'div[role="dialog"]',

  // Navegação
  backButton: 'svg[aria-label="Back"]',
  homeButton: 'svg[aria-label="Home"]',
};

// --- Estado ---
let isProcessing = false;
let lastActionTime = 0;
let actionHistory = [];
let pauseTimerInterval = null;

// --- Funções Auxiliares ---

/**
 * Aguarda elemento aparecer com timeout
 */
function waitForElement(selector, timeout = 5000) {
  return new Promise((resolve) => {
    const element = document.querySelector(selector);
    if (element) {
      resolve(element);
      return;
    }

    const observer = new MutationObserver((mutations, obs) => {
      const element = document.querySelector(selector);
      if (element) {
        obs.disconnect();
        resolve(element);
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    setTimeout(() => {
      observer.disconnect();
      resolve(null);
    }, timeout);
  });
}

/**
 * Encontra botão de ação usando múltiplos seletores
 */
function findActionButton(actionType) {
  // Lista de textos possíveis para cada ação
  const followTexts = ["follow", "seguir", "follow back", "seguir de volta"];
  const unfollowTexts = ["following", "seguindo", "requested", "solicitado"];

  // Procura todos os botões
  const buttons = document.querySelectorAll('button[type="button"]');

  for (const button of buttons) {
    const buttonText = button.textContent.trim().toLowerCase();

    if (actionType === "follow") {
      // Verifica se é um botão de follow
      if (followTexts.includes(buttonText)) {
        console.log(
          `Botão de follow encontrado: "${button.textContent.trim()}"`
        );
        return button;
      }
    } else if (actionType === "unfollow") {
      // Verifica se é um botão de unfollow
      if (unfollowTexts.includes(buttonText)) {
        console.log(
          `Botão de unfollow encontrado: "${button.textContent.trim()}"`
        );
        return button;
      }
    }
  }

  // Se não encontrou, tenta método alternativo
  console.log("Tentando método alternativo para encontrar botão...");

  // Procura por botões que contenham divs com o texto
  for (const button of buttons) {
    const divs = button.querySelectorAll("div");
    for (const div of divs) {
      const text = div.textContent.trim().toLowerCase();

      if (actionType === "follow" && followTexts.includes(text)) {
        console.log(`Botão encontrado via div: "${text}"`);
        return button;
      } else if (actionType === "unfollow" && unfollowTexts.includes(text)) {
        console.log(`Botão encontrado via div: "${text}"`);
        return button;
      }
    }
  }

  return null;
}

/**
 * Extrai informações do perfil
 */
function getProfileInfo() {
  const info = {
    username: null,
    isPrivate: false,
    isVerified: false,
    posts: 0,
    followers: 0,
    following: 0,
  };

  // Username
  const usernameElement = document.querySelector(SELECTORS.username);
  if (usernameElement) {
    info.username = usernameElement.textContent.trim();
  }

  // Conta privada - procura texto em toda a página
  const allText = document.body.innerText;
  info.isPrivate =
    allText.includes("This account is private") ||
    allText.includes("Esta conta é privada") ||
    allText.includes("Conta privada");

  // Verificado
  info.isVerified = !!document.querySelector(SELECTORS.verifiedBadge);

  // Estatísticas
  try {
    const posts = document.querySelector(SELECTORS.postsCount);
    if (posts) info.posts = parseInt(posts.textContent.replace(/[^0-9]/g, ""));

    const followers = document.querySelector(SELECTORS.followersCount);
    if (followers)
      info.followers = parseInt(followers.textContent.replace(/[^0-9]/g, ""));

    const following = document.querySelector(SELECTORS.followingCount);
    if (following)
      info.following = parseInt(following.textContent.replace(/[^0-9]/g, ""));
  } catch (e) {
    console.warn("Erro ao extrair estatísticas:", e);
  }

  return info;
}

/**
 * Simula comportamento humano
 */
async function simulateHumanBehavior() {
  // Movimento aleatório do mouse
  const event = new MouseEvent("mousemove", {
    view: window,
    bubbles: true,
    cancelable: true,
    clientX: Math.random() * window.innerWidth,
    clientY: Math.random() * window.innerHeight,
  });
  document.dispatchEvent(event);

  // Scroll aleatório pequeno
  if (Math.random() > 0.7) {
    window.scrollBy({
      top: Math.random() * 100 - 50,
      behavior: "smooth",
    });
    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  // Delay adicional aleatório
  await new Promise((resolve) =>
    setTimeout(resolve, Math.random() * 1000 + 500)
  );
}

/**
 * Verifica se ação foi bloqueada
 */
async function checkActionBlocked() {
  await new Promise((resolve) => setTimeout(resolve, 500));

  // Procura por modais de erro
  const modals = document.querySelectorAll(SELECTORS.actionBlockedModal);

  for (const modal of modals) {
    const modalText = modal.innerText.toLowerCase();
    if (
      modalText.includes("try again later") ||
      modalText.includes("tente novamente mais tarde") ||
      modalText.includes("bloqueou temporariamente") ||
      modalText.includes("limit")
    ) {
      return true;
    }
  }

  return false;
}

/**
 * Executa ação de follow/unfollow
 */
async function performAction(actionType, username, settings) {
  console.log(`Executando ${actionType} em @${username}`);

  if (isProcessing) {
    return { status: "error", message: "Já processando outra ação" };
  }

  isProcessing = true;

  try {
    // Obtém informações do perfil
    const profileInfo = getProfileInfo();

    // Validações
    if (settings.skipPrivate && profileInfo.isPrivate) {
      console.log("Pulando conta privada");
      return { status: "skipped", reason: "private_account" };
    }

    if (settings.skipVerified && profileInfo.isVerified) {
      console.log("Pulando conta verificada");
      return { status: "skipped", reason: "verified_account" };
    }

    // Simula comportamento humano se configurado
    if (settings.simulateHuman) {
      await simulateHumanBehavior();
    }

    // Encontra botão de ação
    const actionButton = findActionButton(actionType);

    if (!actionButton) {
      // Verifica se já está no estado desejado
      if (
        actionType === "follow" &&
        document.querySelector(SELECTORS.followingButton)
      ) {
        return { status: "skipped", reason: "already_following" };
      } else if (
        actionType === "unfollow" &&
        document.querySelector(SELECTORS.followButton)
      ) {
        return { status: "skipped", reason: "not_following" };
      }

      return { status: "error", message: "Botão de ação não encontrado" };
    }

    // Clica no botão
    actionButton.click();
    console.log("Botão clicado");

    // Para unfollow, aguarda e confirma no modal
    if (actionType === "unfollow") {
      const unfollowModal = await waitForElement(SELECTORS.unfollowModal, 2000);
      if (unfollowModal) {
        // Procura botão de confirmação no modal
        const buttons = unfollowModal.querySelectorAll("button");
        for (const btn of buttons) {
          const text = btn.textContent.toLowerCase();
          if (text === "unfollow" || text === "deixar de seguir") {
            await new Promise((resolve) => setTimeout(resolve, 500));
            btn.click();
            console.log("Unfollow confirmado");
            break;
          }
        }
      }
    }

    // Verifica se foi bloqueado
    const isBlocked = await checkActionBlocked();
    if (isBlocked) {
      return { status: "blocked", message: "Ação bloqueada pelo Instagram" };
    }

    // Registra ação bem-sucedida
    actionHistory.push({
      username,
      action: actionType,
      timestamp: Date.now(),
      profileInfo,
    });

    lastActionTime = Date.now();

    return {
      status: "success",
      message: `${actionType} realizado com sucesso`,
      profileInfo,
    };
  } catch (error) {
    console.error("Erro ao executar ação:", error);
    return { status: "error", message: error.message };
  } finally {
    isProcessing = false;
  }
}

/**
 * Adiciona indicadores visuais
 */
function addVisualFeedback(status) {
  // Remove classes anteriores
  document.body.classList.remove(
    "igaf-success",
    "igaf-error",
    "igaf-processing"
  );

  // Adiciona classe apropriada
  switch (status) {
    case "processing":
      document.body.classList.add("igaf-processing");
      break;
    case "success":
      document.body.classList.add("igaf-success");
      setTimeout(() => document.body.classList.remove("igaf-success"), 2000);
      break;
    case "error":
      document.body.classList.add("igaf-error");
      setTimeout(() => document.body.classList.remove("igaf-error"), 2000);
      break;
  }
}

// --- Funções de UI do Widget ---

/**
 * Cria o widget de status na página
 */
function createStatusWidget() {
  // Remove widget anterior se existir
  const existingWidget = document.getElementById("igaf-status-widget");
  if (existingWidget) {
    existingWidget.remove();
  }

  // Cria novo widget
  const widget = document.createElement("div");
  widget.id = "igaf-status-widget";

  // Aplica estilos inline diretamente (mais confiável que CSS)
  widget.style.cssText = `
        position: fixed !important;
        bottom: 20px !important;
        right: 20px !important;
        width: 320px !important;
        background: rgba(0, 0, 0, 0.95) !important;
        color: white !important;
        border-radius: 12px !important;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5) !important;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif !important;
        z-index: 2147483647 !important;
        display: block !important;
        visibility: visible !important;
        opacity: 1 !important;
        animation: slideIn 0.3s ease-out !important;
    `;

  widget.innerHTML = `
        <div class="igaf-widget-header" style="padding: 15px; border-bottom: 1px solid rgba(255, 255, 255, 0.1); display: flex; justify-content: space-between; align-items: center;">
            <span class="igaf-widget-title" style="font-weight: 600; font-size: 14px;">Instagram Automation</span>
            <span class="igaf-widget-close" style="cursor: pointer; font-size: 20px; opacity: 0.6;" onclick="this.parentElement.parentElement.remove()">×</span>
        </div>
        <div class="igaf-widget-content" style="padding: 20px;">
            <div class="igaf-status-text" style="display: flex; align-items: center; gap: 10px; margin-bottom: 20px; font-size: 14px;">
                <span class="igaf-status-dot" style="width: 8px; height: 8px; border-radius: 50%; background: #10b981;"></span>
                <span class="igaf-status-label">Aguardando...</span>
            </div>
            <div class="igaf-pause-info" style="display: none; background: rgba(251, 191, 36, 0.1); border: 1px solid rgba(251, 191, 36, 0.3); border-radius: 8px; padding: 15px; margin-bottom: 20px;">
                <div class="igaf-pause-reason" style="font-size: 13px; color: #fbbf24; margin-bottom: 12px; font-weight: 600;"></div>
                <div class="igaf-pause-timer" style="display: flex; align-items: center; justify-content: space-between;">
                    <span class="igaf-pause-countdown" style="font-size: 28px; font-weight: bold; color: #fbbf24;">00:00</span>
                    <svg class="igaf-pause-progress" viewBox="0 0 36 36" style="width: 60px; height: 60px; transform: rotate(-90deg);">
                        <path class="igaf-pause-bg" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" 
                              style="fill: none; stroke: rgba(251, 191, 36, 0.2); stroke-width: 3;"/>
                        <path class="igaf-pause-fill" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                              style="fill: none; stroke: #fbbf24; stroke-width: 3; stroke-dasharray: 100; stroke-dashoffset: 100; transition: stroke-dashoffset 1s linear;"/>
                    </svg>
                </div>
            </div>
            <div class="igaf-stats" style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; text-align: center;">
                <div class="igaf-stat" style="background: rgba(255, 255, 255, 0.05); padding: 10px; border-radius: 8px;">
                    <span class="igaf-stat-value" id="igaf-success" style="display: block; font-size: 20px; font-weight: bold; margin-bottom: 4px;">0</span>
                    <span class="igaf-stat-label" style="font-size: 11px; opacity: 0.7;">Sucesso</span>
                </div>
                <div class="igaf-stat" style="background: rgba(255, 255, 255, 0.05); padding: 10px; border-radius: 8px;">
                    <span class="igaf-stat-value" id="igaf-failed" style="display: block; font-size: 20px; font-weight: bold; margin-bottom: 4px;">0</span>
                    <span class="igaf-stat-label" style="font-size: 11px; opacity: 0.7;">Falhas</span>
                </div>
                <div class="igaf-stat" style="background: rgba(255, 255, 255, 0.05); padding: 10px; border-radius: 8px;">
                    <span class="igaf-stat-value" id="igaf-total" style="display: block; font-size: 20px; font-weight: bold; margin-bottom: 4px;">0</span>
                    <span class="igaf-stat-label" style="font-size: 11px; opacity: 0.7;">Total</span>
                </div>
            </div>
        </div>
    `;

  // Adiciona estilos de animação apenas uma vez
  if (!document.getElementById("igaf-widget-animations")) {
    const styleElement = document.createElement("style");
    styleElement.id = "igaf-widget-animations";
    styleElement.innerHTML = `
            @keyframes slideIn {
                from {
                    transform: translateY(100px);
                    opacity: 0;
                }
                to {
                    transform: translateY(0);
                    opacity: 1;
                }
            }
            @keyframes pulse {
                0%, 100% { opacity: 1; }
                50% { opacity: 0.5; }
            }
        `;
    document.head.appendChild(styleElement);
  }

  // Adiciona ao final do body para garantir que fique por cima
  document.body.appendChild(widget);

  return widget;
}

/**
 * Atualiza o widget de status
 */
function updateStatusWidget(status) {
  let widget = document.getElementById("igaf-status-widget");
  if (!widget) {
    widget = createStatusWidget();
  }

  // Atualiza status
  const statusDot = widget.querySelector(".igaf-status-dot");
  const statusLabel = widget.querySelector(".igaf-status-label");

  if (status.isPaused) {
    statusDot.style.background = "#fbbf24";
    statusDot.style.animation = "pulse 2s infinite";
    statusLabel.textContent = "Pausado";

    // Mostra informações de pausa
    const pauseInfo = widget.querySelector(".igaf-pause-info");
    const pauseReason = widget.querySelector(".igaf-pause-reason");

    pauseInfo.style.display = "block";
    pauseReason.textContent = status.pauseReason || "Pausado temporariamente";

    // Inicia timer se houver tempo de fim
    if (status.pauseEndTime) {
      startPauseTimer(status.pauseEndTime);
    }
  } else if (status.isActive) {
    statusDot.style.background = "#10b981";
    statusDot.style.animation = "pulse 2s infinite";
    statusLabel.textContent = "Ativo - Processando...";
    widget.querySelector(".igaf-pause-info").style.display = "none";
    stopPauseTimer();
  } else {
    statusDot.style.background = "#6b7280";
    statusDot.style.animation = "none";
    statusLabel.textContent = "Inativo";
    widget.querySelector(".igaf-pause-info").style.display = "none";
    stopPauseTimer();
  }

  // Atualiza estatísticas
  if (status.stats) {
    document.getElementById("igaf-success").textContent =
      status.stats.successful || 0;
    document.getElementById("igaf-failed").textContent =
      status.stats.failed || 0;
    document.getElementById("igaf-total").textContent =
      status.stats.totalProcessed || 0;
  }
}

/**
 * Inicia o timer de pausa
 */
function startPauseTimer(endTime) {
  console.log("startPauseTimer chamado com endTime:", endTime);
  console.log("Tempo atual:", Date.now());
  console.log("Diferença:", endTime - Date.now(), "ms");

  stopPauseTimer(); // Para timer anterior se existir

  const updateTimer = () => {
    const now = Date.now();
    const remaining = Math.max(0, endTime - now);

    if (remaining === 0) {
      console.log("Timer chegou a zero");
      stopPauseTimer();
      return;
    }

    // Atualiza countdown
    const minutes = Math.floor(remaining / 60000);
    const seconds = Math.floor((remaining % 60000) / 1000);
    const countdown = document.querySelector(".igaf-pause-countdown");
    if (countdown) {
      countdown.textContent = `${minutes.toString().padStart(2, "0")}:${seconds
        .toString()
        .padStart(2, "0")}`;
    }

    // Atualiza progresso
    const totalTime = endTime - (Date.now() - remaining);
    const progress = ((totalTime - remaining) / totalTime) * 100;
    const progressPath = document.querySelector(".igaf-pause-fill");
    if (progressPath) {
      progressPath.style.strokeDashoffset = 100 - progress;
    }
  };

  updateTimer(); // Atualiza imediatamente
  pauseTimerInterval = setInterval(updateTimer, 1000);
  console.log("Timer iniciado com interval ID:", pauseTimerInterval);
}

/**
 * Para o timer de pausa
 */
function stopPauseTimer() {
  if (pauseTimerInterval) {
    clearInterval(pauseTimerInterval);
    pauseTimerInterval = null;
  }
}

// --- Message Listener ---
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log("Content script recebeu:", request);

  switch (request.command) {
    case "performAction":
      addVisualFeedback("processing");
      performAction(
        request.actionType,
        request.username,
        request.settings
      ).then((result) => {
        addVisualFeedback(result.status === "success" ? "success" : "error");
        sendResponse(result);
      });
      return true; // Async response

    case "getProfileInfo":
      sendResponse(getProfileInfo());
      break;

    case "checkStatus":
      sendResponse({
        isReady: true,
        isProcessing,
        lastActionTime,
        actionHistory: actionHistory.length,
      });
      break;

    case "updateStatus":
      // Atualiza o widget com o status recebido
      updateStatusWidget(request.status);
      sendResponse({ received: true });
      break;

    case "ping":
      sendResponse({ pong: true });
      break;
  }
});

// Notifica que está pronto
console.log("Content script pronto para receber comandos");

// Cria o widget quando a página carrega
setTimeout(() => {
  createStatusWidget();
  console.log("Widget de status criado");

  // Solicita status inicial
  chrome.runtime.sendMessage({ command: "getStatus" }, (response) => {
    if (response) {
      updateStatusWidget({
        isActive: response.isActive,
        isPaused: response.isPaused,
        pauseReason: response.pauseReason,
        pauseEndTime: response.pauseEndTime,
        stats: response.sessionStats,
      });
    }
  });
}, 2000);

// Variável para controlar se o script ainda está ativo
let scriptActive = true;

// Solicita atualizações de status periodicamente
const statusInterval = setInterval(() => {
  // Verifica se o script ainda está ativo
  if (!scriptActive) {
    clearInterval(statusInterval);
    return;
  }

  if (
    typeof chrome !== "undefined" &&
    chrome.runtime &&
    chrome.runtime.sendMessage
  ) {
    try {
      chrome.runtime.sendMessage({ command: "getStatus" }, (response) => {
        // Verifica se houve erro de contexto inválido
        if (chrome.runtime.lastError) {
          if (
            chrome.runtime.lastError.message.includes("context invalidated")
          ) {
            // Para o intervalo se o contexto foi invalidado
            scriptActive = false;
            clearInterval(statusInterval);
            console.log(
              "Extensão recarregada. Recarregue a página para continuar."
            );

            // Remove o widget
            const widget = document.getElementById("igaf-status-widget");
            if (widget) widget.remove();
          }
          return;
        }

        if (response && (response.isActive || response.isPaused)) {
          console.log("Status recebido:", {
            isPaused: response.isPaused,
            pauseEndTime: response.pauseEndTime,
            pauseReason: response.pauseReason,
          });

          updateStatusWidget({
            isActive: response.isActive,
            isPaused: response.isPaused,
            pauseReason: response.pauseReason,
            pauseEndTime: response.pauseEndTime,
            stats: response.sessionStats,
          });
        }
      });
    } catch (error) {
      // Ignora erros silenciosamente
      if (error.message && error.message.includes("context invalidated")) {
        scriptActive = false;
        clearInterval(statusInterval);
      }
    }
  }
}, 1000); // Atualiza a cada segundo
