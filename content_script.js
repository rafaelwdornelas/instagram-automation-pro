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

  // Botões
  followButton:
    'button:has(div:contains("Follow")), button:has(div:contains("Seguir"))',
  followingButton:
    'button:has(div:contains("Following")), button:has(div:contains("Seguindo"))',

  // Modais
  unfollowModal: 'div[role="dialog"]',
  actionBlockedModal: 'div[role="dialog"]',

  // Navegação
  backButton: 'svg[aria-label="Back"]',
  homeButton: 'svg[aria-label="Home"]',

  // Posts e interações
  postGrid: "article",
  likeButton: 'svg[aria-label*="Like"], svg[aria-label*="Curtir"]',
  commentButton: 'svg[aria-label*="Comment"], svg[aria-label*="Comentar"]',
  shareButton: 'svg[aria-label*="Share"], svg[aria-label*="Compartilhar"]',
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
 * Verifica se o perfil existe (não é 404)
 */
function checkProfileExists() {
  // Verifica se está na página de erro 404
  const pageTitle = document.title.toLowerCase();
  const bodyText = document.body.innerText.toLowerCase();

  if (
    pageTitle.includes("page not found") ||
    pageTitle.includes("página não encontrada") ||
    bodyText.includes("sorry, this page isn't available") ||
    bodyText.includes("esta página não está disponível") ||
    bodyText.includes("a página que você está procurando não existe") ||
    document
      .querySelector("h2")
      ?.textContent?.includes("Sorry, this page isn't available")
  ) {
    console.log("Perfil não encontrado (404)");
    return false;
  }

  return true;
}

/**
 * Detecta se a conta é privada com mais precisão
 */
function isPrivateAccount() {
  // Procura por vários indicadores de conta privada
  const indicators = [
    // Textos em inglês
    "this account is private",
    "follow to see their photos and videos",
    "follow this account to see their photos and videos",

    // Textos em português
    "esta conta é privada",
    "conta privada",
    "siga para ver as fotos e vídeos",
    "siga esta conta para ver suas fotos e vídeos",

    // Procura pelo ícone de cadeado
    'svg[aria-label="Private"]',
    'svg[aria-label="Privada"]',
  ];

  // Verifica textos
  const bodyText = document.body.innerText.toLowerCase();
  for (const indicator of indicators) {
    if (
      typeof indicator === "string" &&
      bodyText.includes(indicator.toLowerCase())
    ) {
      console.log(`Conta privada detectada: "${indicator}"`);
      return true;
    }
  }

  // Verifica elementos específicos
  const privateIcon = document.querySelector(
    'svg[aria-label="Private"], svg[aria-label="Privada"]'
  );
  if (privateIcon) {
    console.log("Conta privada detectada pelo ícone");
    return true;
  }

  // Verifica se há o texto "This account is private" em h2
  const h2Elements = document.querySelectorAll("h2");
  for (const h2 of h2Elements) {
    const text = h2.textContent.toLowerCase();
    if (text.includes("private") || text.includes("privada")) {
      console.log("Conta privada detectada em h2");
      return true;
    }
  }

  return false;
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
    exists: true,
  };

  // Primeiro verifica se o perfil existe
  if (!checkProfileExists()) {
    info.exists = false;
    return info;
  }

  // Username
  const usernameElement = document.querySelector(SELECTORS.username);
  if (usernameElement) {
    info.username = usernameElement.textContent.trim();
  }

  // Conta privada - usa a nova função
  info.isPrivate = isPrivateAccount();

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
 * Gera delay aleatório
 */
function getRandomDelay(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Simula movimento natural do mouse
 */
async function simulateMouseMovement() {
  const targetX = Math.random() * window.innerWidth;
  const targetY = Math.random() * window.innerHeight;

  // Simula movimento suave
  const steps = 5;
  const currentX = window.innerWidth / 2;
  const currentY = window.innerHeight / 2;

  for (let i = 0; i <= steps; i++) {
    const progress = i / steps;
    const x = currentX + (targetX - currentX) * progress;
    const y = currentY + (targetY - currentY) * progress;

    const event = new MouseEvent("mousemove", {
      view: window,
      bubbles: true,
      cancelable: true,
      clientX: x,
      clientY: y,
    });
    document.dispatchEvent(event);

    await new Promise((resolve) => setTimeout(resolve, 50));
  }
}

/**
 * Simula cliques aleatórios em elementos não interativos
 */
async function performRandomClicks(count = 2) {
  const safeElements = ['div[role="main"]', "header", "section", "article"];

  for (let i = 0; i < count; i++) {
    const elements = document.querySelectorAll(safeElements.join(", "));
    if (elements.length > 0) {
      const randomElement =
        elements[Math.floor(Math.random() * elements.length)];
      const rect = randomElement.getBoundingClientRect();

      if (rect.width > 0 && rect.height > 0) {
        const x = rect.left + Math.random() * rect.width;
        const y = rect.top + Math.random() * rect.height;

        const clickEvent = new MouseEvent("click", {
          view: window,
          bubbles: true,
          cancelable: true,
          clientX: x,
          clientY: y,
        });

        randomElement.dispatchEvent(clickEvent);
        console.log("Clique aleatório realizado");

        await new Promise((resolve) =>
          setTimeout(resolve, getRandomDelay(500, 1500))
        );
      }
    }
  }
}

/**
 * Simula scrolls aleatórios
 */
async function performRandomScrolls(settings) {
  const scrollCount = Math.floor(Math.random() * 3) + 1; // 1-3 scrolls

  for (let i = 0; i < scrollCount; i++) {
    const direction = Math.random() > 0.5 ? 1 : -1;
    const distance = Math.random() * 200 + 50; // 50-250 pixels

    window.scrollBy({
      top: direction * distance,
      behavior: "smooth",
    });

    console.log(`Scroll ${direction > 0 ? "down" : "up"} ${distance}px`);

    // Aguarda usando o scrollDelay configurado
    if (settings && settings.scrollDelay) {
      await new Promise((resolve) =>
        setTimeout(
          resolve,
          getRandomDelay(settings.scrollDelay.min, settings.scrollDelay.max)
        )
      );
    } else {
      await new Promise((resolve) =>
        setTimeout(resolve, getRandomDelay(1000, 2000))
      );
    }
  }

  // Às vezes volta ao topo
  if (Math.random() > 0.7) {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
    console.log("Voltou ao topo da página");
  }
}

/**
 * Simula comportamento humano completo
 */
async function simulateHumanBehavior(settings) {
  console.log("Simulando comportamento humano...");

  // Movimento do mouse
  await simulateMouseMovement();

  // Cliques aleatórios se habilitado
  if (settings && settings.randomClicks && Math.random() > 0.5) {
    await performRandomClicks(1);
  }

  // Scrolls aleatórios se habilitado
  if (settings && settings.randomScrolls && Math.random() > 0.3) {
    await performRandomScrolls(settings);
  }

  // Às vezes pausa como se estivesse lendo
  if (Math.random() > 0.6) {
    const readingTime = getRandomDelay(2000, 4000);
    console.log(`Pausando ${readingTime}ms como se estivesse lendo...`);
    await new Promise((resolve) => setTimeout(resolve, readingTime));
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
    // Aguarda um momento para a página carregar completamente
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Obtém informações do perfil
    const profileInfo = getProfileInfo();

    // Verifica se o perfil existe
    if (!profileInfo.exists) {
      console.log("Perfil não encontrado (404)");
      return { status: "profile_not_found", message: "Perfil não encontrado" };
    }

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
      await simulateHumanBehavior(settings);
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

    // Hover no botão antes de clicar (comportamento humano)
    const hoverEvent = new MouseEvent("mouseenter", {
      view: window,
      bubbles: true,
      cancelable: true,
    });
    actionButton.dispatchEvent(hoverEvent);
    await new Promise((resolve) =>
      setTimeout(resolve, getRandomDelay(200, 500))
    );

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
            <div class="igaf-limits" style="margin-top: 15px; padding-top: 15px; border-top: 1px solid rgba(255, 255, 255, 0.1); display: none;">
                <div style="font-size: 12px; margin-bottom: 8px;">
                    <span style="opacity: 0.7;">Limite Diário:</span>
                    <span id="igaf-daily-limit" style="float: right;">0/50</span>
                </div>
                <div style="font-size: 12px;">
                    <span style="opacity: 0.7;">Limite Horário:</span>
                    <span id="igaf-hourly-limit" style="float: right;">0/8</span>
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

  // Atualiza limites se disponíveis
  if (status.limits) {
    const limitsDiv = widget.querySelector(".igaf-limits");
    limitsDiv.style.display = "block";

    if (status.limits.daily) {
      document.getElementById(
        "igaf-daily-limit"
      ).textContent = `${status.limits.daily.used}/${status.limits.daily.limit}`;
    }

    if (status.limits.hourly) {
      document.getElementById(
        "igaf-hourly-limit"
      ).textContent = `${status.limits.hourly.used}/${status.limits.hourly.limit}`;
    }
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
        limits: response.limits,
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
            limits: response.limits,
          });

          updateStatusWidget({
            isActive: response.isActive,
            isPaused: response.isPaused,
            pauseReason: response.pauseReason,
            pauseEndTime: response.pauseEndTime,
            stats: response.sessionStats,
            limits: response.limits,
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
