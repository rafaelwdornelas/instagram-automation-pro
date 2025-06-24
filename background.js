// background.js - Sistema avançado com suporte a listas personalizadas e Explorer
// Controle total de performance e navegação automática

// --- Estado Global ---
let automationState = {
  isActive: false,
  isPaused: false,
  pauseReason: "", // Motivo da pausa
  pauseEndTime: null, // Timestamp de quando a pausa termina
  actionType: null, // 'follow' ou 'unfollow'
  mode: null, // 'list' ou 'explorer'
  currentTabId: null,
  currentList: [], // Lista de usernames para processar
  currentIndex: 0,
  processedUsers: [], // Usuários já processados
  failedUsers: [], // Usuários que falharam
  sessionStats: {
    started: null,
    totalProcessed: 0,
    successful: 0,
    failed: 0,
    skipped: 0,
  },
  // Novos contadores para limites
  dailyStats: {
    date: new Date().toDateString(),
    count: 0,
  },
  hourlyStats: {
    hour: new Date().getHours(),
    count: 0,
  },
  // Estado do Explorer
  explorerState: {
    lastExtractTime: 0,
    extractedUsers: [],
    currentPage: 0,
  },
};

// --- Configurações Avançadas (MODO SEGURO) ---
let settings = {
  // Performance (delays aumentados para parecer mais humano)
  navigationDelay: { min: 8000, max: 15000 }, // 8-15 segundos entre navegações
  actionDelay: { min: 5000, max: 10000 }, // 5-10 segundos antes de clicar
  scrollDelay: { min: 2000, max: 4000 }, // 2-4 segundos após scroll

  // Controle de Lote (lotes menores, pausas maiores)
  actionsPerBatch: 5, // Apenas 5 ações antes de pausar
  batchPause: { min: 900000, max: 1800000 }, // 15-30 minutos de pausa

  // Limites (bem conservadores)
  dailyLimit: 50, // Máximo 50 por dia
  hourlyLimit: 8, // Máximo 8 por hora

  // Comportamento (mais seletivo)
  skipPrivateProfiles: true, // Pula contas privadas para evitar suspeitas
  skipVerifiedProfiles: true, // Pula verificados (geralmente mais monitorados)
  retryFailedUsers: false, // Não insiste em falhas
  maxRetries: 1,

  // Anti-Detecção (tudo ativado)
  randomizeOrder: true,
  simulateHumanBehavior: true,
  randomClicks: true,
  randomScrolls: true,

  // Stories durante pausa
  watchStoriesDuringPause: true, // Assiste stories durante pausas

  // Persistência
  saveProgress: true,
  resumeOnRestart: true,

  // Explorer Settings
  explorerFilters: {
    keywords: ["desbrava", "dbv", "club", "avt", "aventureiro", "mda"], // Palavras-chave para filtrar
    ignoreUsers: ["lojadesbravaria"], // Usuários a ignorar
    filterEnabled: true, // Se o filtro está ativado
  },
};

// --- Storage Keys ---
const STORAGE_KEYS = {
  SETTINGS: "advancedSettings",
  STATE: "automationState",
  LISTS: "userLists",
  PROGRESS: "automationProgress",
  STATS: "automationStats",
  DAILY_STATS: "dailyStats",
  HOURLY_STATS: "hourlyStats",
  PROCESSED_USERS: "processedUsersHistory", // Histórico geral de usuários já processados
};

// --- Helper Functions ---

/**
 * Gera delay aleatório entre min e max
 */
function getRandomDelay(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Carrega histórico de usuários já processados
 */
async function loadProcessedHistory() {
  try {
    const data = await chrome.storage.local.get(STORAGE_KEYS.PROCESSED_USERS);
    return data[STORAGE_KEYS.PROCESSED_USERS] || [];
  } catch (error) {
    console.error("Erro ao carregar histórico:", error);
    return [];
  }
}

/**
 * Salva usuário no histórico geral
 */
async function saveToProcessedHistory(username) {
  try {
    const history = await loadProcessedHistory();
    if (!history.includes(username.toLowerCase())) {
      history.push(username.toLowerCase());
      await chrome.storage.local.set({
        [STORAGE_KEYS.PROCESSED_USERS]: history,
      });
    }
  } catch (error) {
    console.error("Erro ao salvar no histórico:", error);
  }
}

/**
 * Carrega estatísticas diárias e horárias
 */
async function loadStats() {
  try {
    const data = await chrome.storage.local.get([
      STORAGE_KEYS.DAILY_STATS,
      STORAGE_KEYS.HOURLY_STATS,
    ]);

    const today = new Date().toDateString();
    const currentHour = new Date().getHours();

    // Verifica estatísticas diárias
    if (data[STORAGE_KEYS.DAILY_STATS]) {
      if (data[STORAGE_KEYS.DAILY_STATS].date === today) {
        automationState.dailyStats = data[STORAGE_KEYS.DAILY_STATS];
      } else {
        // Reset para novo dia
        automationState.dailyStats = { date: today, count: 0 };
      }
    }

    // Verifica estatísticas horárias
    if (data[STORAGE_KEYS.HOURLY_STATS]) {
      if (data[STORAGE_KEYS.HOURLY_STATS].hour === currentHour) {
        automationState.hourlyStats = data[STORAGE_KEYS.HOURLY_STATS];
      } else {
        // Reset para nova hora
        automationState.hourlyStats = { hour: currentHour, count: 0 };
      }
    }

    console.log("Stats carregados:", {
      daily: automationState.dailyStats,
      hourly: automationState.hourlyStats,
    });
  } catch (error) {
    console.error("Erro ao carregar stats:", error);
  }
}

/**
 * Salva estatísticas diárias e horárias
 */
async function saveStats() {
  try {
    await chrome.storage.local.set({
      [STORAGE_KEYS.DAILY_STATS]: automationState.dailyStats,
      [STORAGE_KEYS.HOURLY_STATS]: automationState.hourlyStats,
    });
  } catch (error) {
    console.error("Erro ao salvar stats:", error);
  }
}

/**
 * Verifica se pode executar ação baseado nos limites
 */
function checkLimits() {
  // Atualiza hora/dia se mudou
  const today = new Date().toDateString();
  const currentHour = new Date().getHours();

  if (automationState.dailyStats.date !== today) {
    automationState.dailyStats = { date: today, count: 0 };
  }

  if (automationState.hourlyStats.hour !== currentHour) {
    automationState.hourlyStats = { hour: currentHour, count: 0 };
  }

  // Verifica limite diário
  if (automationState.dailyStats.count >= settings.dailyLimit) {
    console.log(
      `Limite diário atingido: ${automationState.dailyStats.count}/${settings.dailyLimit}`
    );
    return {
      canProceed: false,
      reason: `Limite diário atingido (${settings.dailyLimit} ações)`,
      type: "daily",
    };
  }

  // Verifica limite horário
  if (automationState.hourlyStats.count >= settings.hourlyLimit) {
    console.log(
      `Limite horário atingido: ${automationState.hourlyStats.count}/${settings.hourlyLimit}`
    );
    return {
      canProceed: false,
      reason: `Limite horário atingido (${settings.hourlyLimit} ações por hora)`,
      type: "hourly",
    };
  }

  return { canProceed: true };
}

/**
 * Incrementa contadores de limite
 */
async function incrementLimitCounters() {
  automationState.dailyStats.count++;
  automationState.hourlyStats.count++;
  await saveStats();

  console.log("Limites atualizados:", {
    daily: `${automationState.dailyStats.count}/${settings.dailyLimit}`,
    hourly: `${automationState.hourlyStats.count}/${settings.hourlyLimit}`,
  });
}

/**
 * Salva o estado atual
 */
async function saveState() {
  try {
    const progressData = {
      currentList: automationState.currentList,
      currentIndex: automationState.currentIndex,
      processedUsers: automationState.processedUsers,
      failedUsers: automationState.failedUsers,
      mode: automationState.mode,
      timestamp: Date.now(),
    };

    await chrome.storage.local.set({
      [STORAGE_KEYS.STATE]: automationState,
      [STORAGE_KEYS.PROGRESS]: progressData,
    });

    console.log("Estado salvo:", {
      processedCount: automationState.processedUsers.length,
      currentIndex: automationState.currentIndex,
      totalList: automationState.currentList.length,
      mode: automationState.mode,
      progressKey: STORAGE_KEYS.PROGRESS,
    });
  } catch (error) {
    console.error("Erro ao salvar estado:", error);
  }
}

/**
 * Carrega configurações e estado
 */
async function loadSettingsAndState() {
  try {
    const data = await chrome.storage.local.get([
      STORAGE_KEYS.SETTINGS,
      STORAGE_KEYS.STATE,
      STORAGE_KEYS.PROGRESS,
      "lastReport",
    ]);

    if (data[STORAGE_KEYS.SETTINGS]) {
      settings = { ...settings, ...data[STORAGE_KEYS.SETTINGS] };
    }

    // Carrega estado anterior se existir
    if (data[STORAGE_KEYS.STATE]) {
      const savedState = data[STORAGE_KEYS.STATE];
      // Preserva stats da sessão se existirem
      if (
        savedState.sessionStats &&
        savedState.sessionStats.totalProcessed > 0
      ) {
        automationState.sessionStats = savedState.sessionStats;
      }
    }

    if (data[STORAGE_KEYS.PROGRESS] && settings.resumeOnRestart) {
      const progress = data[STORAGE_KEYS.PROGRESS];
      // Verifica se o progresso é recente (menos de 24h)
      if (Date.now() - progress.timestamp < 24 * 60 * 60 * 1000) {
        automationState.currentList = progress.currentList || [];
        automationState.currentIndex = progress.currentIndex || 0;
        automationState.processedUsers = progress.processedUsers || [];
        automationState.failedUsers = progress.failedUsers || [];
        automationState.mode = progress.mode || "list";

        console.log("Progresso restaurado:", {
          lista: automationState.currentList.length,
          index: automationState.currentIndex,
          processados: automationState.processedUsers.length,
          mode: automationState.mode,
        });
      }
    }

    // Carrega estatísticas de limites
    await loadStats();

    console.log("Estado carregado:", automationState);
  } catch (error) {
    console.error("Erro ao carregar configurações:", error);
  }
}

/**
 * Navega para o perfil de um usuário
 */
async function navigateToProfile(tabId, username) {
  const url = `https://www.instagram.com/${username}/`;

  return new Promise((resolve) => {
    chrome.tabs.update(tabId, { url }, () => {
      // Aguarda a página carregar
      chrome.tabs.onUpdated.addListener(function listener(
        updatedTabId,
        changeInfo
      ) {
        if (updatedTabId === tabId && changeInfo.status === "complete") {
          chrome.tabs.onUpdated.removeListener(listener);
          // Delay adicional para garantir que a página carregou completamente
          setTimeout(resolve, getRandomDelay(1000, 2000));
        }
      });
    });
  });
}

/**
 * Navega para o Explorer e extrai usuários
 */
async function extractUsersFromExplorer() {
  console.log("Navegando para o Explorer...");

  return new Promise((resolve) => {
    chrome.tabs.update(
      automationState.currentTabId,
      {
        url: "https://www.instagram.com/explore/people/suggested/",
      },
      () => {
        // Aguarda a página carregar
        chrome.tabs.onUpdated.addListener(function listener(
          updatedTabId,
          changeInfo
        ) {
          if (
            updatedTabId === automationState.currentTabId &&
            changeInfo.status === "complete"
          ) {
            chrome.tabs.onUpdated.removeListener(listener);

            // Aguarda um pouco mais para garantir que o conteúdo dinâmico carregou
            setTimeout(async () => {
              try {
                // Primeiro tenta extrair usuários
                let response = await chrome.tabs.sendMessage(
                  automationState.currentTabId,
                  {
                    command: "extractExplorerUsers",
                    filters: settings.explorerFilters,
                  }
                );

                // Se não encontrou usuários, tenta fazer scroll para carregar mais
                if (
                  !response ||
                  !response.users ||
                  response.users.length === 0
                ) {
                  console.log(
                    "Nenhum usuário encontrado, tentando scroll para carregar mais..."
                  );

                  // Envia comando para fazer scroll
                  await chrome.tabs.sendMessage(automationState.currentTabId, {
                    command: "scrollExplorer",
                  });

                  // Aguarda um pouco para o conteúdo carregar
                  await new Promise((res) => setTimeout(res, 3000));

                  // Tenta extrair novamente
                  response = await chrome.tabs.sendMessage(
                    automationState.currentTabId,
                    {
                      command: "extractExplorerUsers",
                      filters: settings.explorerFilters,
                    }
                  );
                }

                if (response && response.users) {
                  console.log(
                    `Extraídos ${response.users.length} usuários do Explorer`
                  );
                  resolve(response.users);
                } else {
                  console.error("Nenhum usuário extraído após tentativas");
                  resolve([]);
                }
              } catch (error) {
                console.error("Erro ao extrair usuários:", error);
                resolve([]);
              }
            }, getRandomDelay(3000, 5000));
          }
        });
      }
    );
  });
}

/**
 * Processa o próximo usuário da lista
 */
async function processNextUser() {
  if (!automationState.isActive || automationState.isPaused) {
    console.log("Automação pausada ou inativa");
    return;
  }

  // Verifica limites antes de processar
  const limitCheck = checkLimits();
  if (!limitCheck.canProceed) {
    console.log("Limite atingido:", limitCheck.reason);

    if (limitCheck.type === "hourly") {
      // Pausa até a próxima hora
      const now = new Date();
      const nextHour = new Date(now);
      nextHour.setHours(now.getHours() + 1, 0, 0, 0);
      const pauseUntil = nextHour.getTime();

      automationState.isPaused = true;
      automationState.pauseReason = limitCheck.reason;
      automationState.pauseEndTime = pauseUntil;

      sendStatusUpdate();

      // Agenda retomada na próxima hora
      const pauseDuration = pauseUntil - now.getTime();
      chrome.alarms.create("resumeFromPause", {
        delayInMinutes: pauseDuration / 60000,
      });
    } else {
      // Limite diário - para completamente
      automationState.pauseReason = limitCheck.reason;
      await completeAutomation();
    }

    return;
  }

  // Se modo Explorer e lista vazia, extrai novos usuários
  if (
    automationState.mode === "explorer" &&
    (automationState.currentList.length === 0 ||
      automationState.currentIndex >= automationState.currentList.length)
  ) {
    console.log("Extraindo novos usuários do Explorer...");
    const newUsers = await extractUsersFromExplorer();

    if (newUsers.length === 0) {
      console.log("Nenhum novo usuário encontrado no Explorer");
      console.log(
        "🎬 Iniciando visualização de stories para aguardar atualização da lista..."
      );

      // Define uma pausa temporária para assistir stories
      automationState.isPaused = true;
      const storiesDuration = getRandomDelay(120000, 180000); // 2-3 minutos assistindo stories

      automationState.pauseReason =
        "Aguardando novos usuários no Explorer (assistindo stories)";
      automationState.pauseEndTime = Date.now() + storiesDuration;

      sendStatusUpdate();

      // Inicia visualização de stories
      await startStoriesViewing();

      // Agenda nova tentativa após os stories
      chrome.alarms.create("resumeFromPause", {
        delayInMinutes: storiesDuration / 60000,
      });

      return;
    }

    // Filtra usuários já processados
    const processedHistory = await loadProcessedHistory();
    const uniqueUsers = newUsers.filter(
      (username) =>
        !processedHistory.includes(username.toLowerCase()) &&
        !automationState.processedUsers.some(
          (u) => u.username.toLowerCase() === username.toLowerCase()
        )
    );

    console.log(`${uniqueUsers.length} novos usuários únicos encontrados`);

    if (uniqueUsers.length === 0) {
      console.log(
        "Todos os usuários já foram processados, aguardando atualização..."
      );
      console.log("🎬 Iniciando visualização de stories...");

      // Mesma lógica de pausar e assistir stories
      automationState.isPaused = true;
      const storiesDuration = getRandomDelay(120000, 180000); // 2-3 minutos

      automationState.pauseReason =
        "Todos os usuários já processados (assistindo stories)";
      automationState.pauseEndTime = Date.now() + storiesDuration;

      sendStatusUpdate();

      await startStoriesViewing();

      chrome.alarms.create("resumeFromPause", {
        delayInMinutes: storiesDuration / 60000,
      });

      return;
    }

    // Adiciona à lista
    automationState.currentList = uniqueUsers;
    automationState.currentIndex = 0;

    // Randomiza se configurado
    if (settings.randomizeOrder) {
      automationState.currentList.sort(() => Math.random() - 0.5);
    }
  }

  if (automationState.currentIndex >= automationState.currentList.length) {
    console.log("Lista completa!");

    // Se modo Explorer, tenta extrair mais usuários
    if (automationState.mode === "explorer") {
      console.log("Tentando extrair mais usuários do Explorer...");

      // Pausa temporária para assistir stories antes de buscar mais
      automationState.isPaused = true;
      const storiesDuration = getRandomDelay(120000, 180000); // 2-3 minutos

      automationState.pauseReason =
        "Lista processada, buscando mais usuários (assistindo stories)";
      automationState.pauseEndTime = Date.now() + storiesDuration;

      sendStatusUpdate();

      // Inicia visualização de stories
      await startStoriesViewing();

      // Agenda retomada para buscar mais usuários
      chrome.alarms.create("resumeFromPause", {
        delayInMinutes: storiesDuration / 60000,
      });

      return;
    }

    await completeAutomation();
    return;
  }

  const username = automationState.currentList[automationState.currentIndex];
  console.log(
    `Processando usuário ${automationState.currentIndex + 1}/${
      automationState.currentList.length
    }: @${username}`
  );

  try {
    // Navega para o perfil
    await navigateToProfile(automationState.currentTabId, username);

    // Aguarda um delay aleatório antes de executar a ação
    await new Promise((resolve) =>
      setTimeout(
        resolve,
        getRandomDelay(settings.actionDelay.min, settings.actionDelay.max)
      )
    );

    // Envia comando para o content script executar a ação
    const response = await chrome.tabs.sendMessage(
      automationState.currentTabId,
      {
        command: "performAction",
        actionType: automationState.actionType,
        username: username,
        settings: {
          skipPrivate: settings.skipPrivateProfiles,
          skipVerified: settings.skipVerifiedProfiles,
          simulateHuman: settings.simulateHumanBehavior,
          randomClicks: settings.randomClicks,
          randomScrolls: settings.randomScrolls,
          scrollDelay: settings.scrollDelay,
          filters: settings.explorerFilters, // Passa os filtros para captura de sugestões
        },
      }
    );

    // Processa a resposta
    handleActionResponse(username, response);
  } catch (error) {
    console.error(`Erro ao processar @${username}:`, error);
    handleActionError(username, error);
  }
}

/**
 * Lida com a resposta de uma ação
 */
async function handleActionResponse(username, response) {
  if (!response) {
    handleActionError(username, new Error("Sem resposta do content script"));
    return;
  }

  console.log(`Resposta da ação para @${username}:`, response.status);

  switch (response.status) {
    case "success":
      automationState.processedUsers.push({
        username,
        action: automationState.actionType,
        timestamp: Date.now(),
        status: "success",
      });
      automationState.sessionStats.successful++;

      // Salva no histórico geral
      await saveToProcessedHistory(username);

      // Se há sugestões capturadas e estamos no modo Explorer
      if (
        response.suggestions &&
        response.suggestions.length > 0 &&
        automationState.mode === "explorer"
      ) {
        console.log(
          `📱 Processando ${response.suggestions.length} sugestões capturadas do perfil...`
        );

        // Filtra usuários já processados
        const processedHistory = await loadProcessedHistory();
        const newSuggestions = response.suggestions.filter(
          (user) =>
            !processedHistory.includes(user.toLowerCase()) &&
            !automationState.processedUsers.some(
              (u) => u.username.toLowerCase() === user.toLowerCase()
            ) &&
            !automationState.currentList.includes(user)
        );

        if (newSuggestions.length > 0) {
          console.log(
            `✅ Adicionando ${newSuggestions.length} novas sugestões à lista`
          );
          // Adiciona as sugestões ao final da lista atual
          automationState.currentList.push(...newSuggestions);

          // Se configurado para randomizar, mistura apenas as novas adições
          if (settings.randomizeOrder) {
            const currentProcessing = automationState.currentList.slice(
              0,
              automationState.currentIndex + 1
            );
            const remaining = automationState.currentList.slice(
              automationState.currentIndex + 1
            );
            remaining.sort(() => Math.random() - 0.5);
            automationState.currentList = [...currentProcessing, ...remaining];
          }
        }
      }

      // Incrementa contadores de limite
      await incrementLimitCounters();
      break;

    case "skipped":
      automationState.processedUsers.push({
        username,
        action: automationState.actionType,
        timestamp: Date.now(),
        status: "skipped",
        reason: response.reason,
      });
      automationState.sessionStats.skipped++;

      // Também salva no histórico para não tentar novamente
      if (response.reason === "already_following") {
        await saveToProcessedHistory(username);
      }
      break;

    case "blocked":
      console.error("AÇÃO BLOQUEADA PELO INSTAGRAM!");
      automationState.failedUsers.push({
        username,
        reason: "blocked",
        timestamp: Date.now(),
      });
      stopAutomation();
      return;

    case "error":
      handleActionError(username, new Error(response.message));
      return;

    case "profile_not_found":
      automationState.failedUsers.push({
        username,
        reason: "perfil_nao_encontrado",
        timestamp: Date.now(),
      });
      automationState.sessionStats.failed++;
      automationState.sessionStats.totalProcessed++;
      automationState.currentIndex++;
      saveState();
      scheduleNextAction();
      sendStatusUpdate();
      return;
  }

  automationState.sessionStats.totalProcessed++;
  automationState.currentIndex++;

  console.log("Stats atualizados:", {
    total: automationState.sessionStats.totalProcessed,
    sucesso: automationState.sessionStats.successful,
    index: automationState.currentIndex,
    listaTotal: automationState.currentList.length,
  });

  // Salva progresso
  if (settings.saveProgress) {
    saveState();
  }

  // Verifica se precisa pausar para batch
  if (
    automationState.sessionStats.totalProcessed > 0 &&
    automationState.sessionStats.totalProcessed % settings.actionsPerBatch === 0
  ) {
    console.log("Limite de batch atingido, iniciando pausa...");
    scheduleBatchPause();
  } else {
    // Agenda próxima ação
    scheduleNextAction();
  }

  // Atualiza UI
  sendStatusUpdate();
}

/**
 * Lida com erros de ação
 */
function handleActionError(username, error) {
  console.error(`Erro com @${username}:`, error);

  const failedUser = {
    username,
    reason: error.message,
    timestamp: Date.now(),
    retries: 0,
  };

  // Verifica se deve tentar novamente
  const existingFailed = automationState.failedUsers.find(
    (u) => u.username === username
  );
  if (existingFailed) {
    failedUser.retries = existingFailed.retries + 1;
  }

  if (settings.retryFailedUsers && failedUser.retries < settings.maxRetries) {
    // Adiciona de volta à lista para tentar novamente mais tarde
    automationState.currentList.push(username);
  } else {
    // Só adiciona aos failedUsers se ainda não estiver lá
    const alreadyFailed = automationState.failedUsers.find(
      (u) => u.username === username
    );
    if (!alreadyFailed) {
      automationState.failedUsers.push(failedUser);
      automationState.sessionStats.failed++;
    }
  }

  automationState.sessionStats.totalProcessed++;
  automationState.currentIndex++;
  scheduleNextAction();
}

/**
 * Agenda a próxima ação
 */
function scheduleNextAction() {
  const delay = getRandomDelay(
    settings.navigationDelay.min,
    settings.navigationDelay.max
  );
  console.log(`Próxima ação em ${delay}ms`);

  chrome.alarms.create("nextAction", { delayInMinutes: delay / 60000 });
}

/**
 * Agenda pausa entre lotes
 */
function scheduleBatchPause() {
  automationState.isPaused = true;
  const pauseDuration = getRandomDelay(
    settings.batchPause.min,
    settings.batchPause.max
  );

  // Define o motivo e tempo de fim da pausa
  automationState.pauseReason = `Pausa entre lotes (${settings.actionsPerBatch} ações completadas)`;
  automationState.pauseEndTime = Date.now() + pauseDuration;

  console.log(`Pausa de lote por ${pauseDuration / 60000} minutos`);
  console.log("Pause end time:", automationState.pauseEndTime);
  console.log(
    "Criando alarme resumeFromPause para:",
    new Date(automationState.pauseEndTime)
  );

  sendStatusUpdate();

  // Cancela alarmes anteriores se existirem
  chrome.alarms.clear("nextAction");
  chrome.alarms.clear("resumeFromPause");

  // Se habilitado, inicia visualização de stories durante a pausa
  if (settings.watchStoriesDuringPause && automationState.currentTabId) {
    console.log("Iniciando visualização de stories durante a pausa...");
    startStoriesViewing();
  }

  chrome.alarms.create("resumeFromPause", {
    delayInMinutes: pauseDuration / 60000,
  });

  // Verifica se o alarme foi criado
  chrome.alarms.get("resumeFromPause", (alarm) => {
    if (alarm) {
      console.log("Alarme criado com sucesso:", alarm);
    } else {
      console.error("Falha ao criar alarme!");
    }
  });
}

/**
 * Inicia visualização de stories durante pausa
 */
async function startStoriesViewing() {
  console.log("🎬 Iniciando processo de visualização de stories...");

  const maxNavigationAttempts = 5;
  let navigationSuccess = false;

  // Tenta navegar para o feed múltiplas vezes
  for (let attempt = 1; attempt <= maxNavigationAttempts; attempt++) {
    try {
      console.log(`📍 Tentativa ${attempt} de navegar para o feed...`);

      // Navega para o feed
      await chrome.tabs.update(automationState.currentTabId, {
        url: "https://www.instagram.com/",
      });

      // Aguarda mais tempo para garantir carregamento completo
      await new Promise((resolve) => setTimeout(resolve, 4000));

      // Verifica se a navegação foi bem sucedida
      const tab = await chrome.tabs.get(automationState.currentTabId);

      if (tab.status === "complete" && tab.url.includes("instagram.com")) {
        console.log("   ✅ Navegação para o feed bem sucedida!");
        navigationSuccess = true;
        break;
      } else {
        console.log("   ⚠️ Página ainda carregando ou URL incorreta");

        // Se não for a última tentativa, recarrega a página
        if (attempt < maxNavigationAttempts) {
          console.log("   🔄 Recarregando página...");
          await chrome.tabs.reload(automationState.currentTabId);
          await new Promise((resolve) => setTimeout(resolve, 3000));
        }
      }
    } catch (error) {
      console.error(`   ❌ Erro na tentativa ${attempt}:`, error);

      // Aguarda antes da próxima tentativa
      if (attempt < maxNavigationAttempts) {
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }
    }
  }

  if (!navigationSuccess) {
    console.error("❌ Falha ao navegar para o feed após todas as tentativas");
    return;
  }

  // Tenta enviar comando para assistir stories
  const maxStoriesAttempts = 3;
  let storiesStarted = false;

  for (let attempt = 1; attempt <= maxStoriesAttempts; attempt++) {
    try {
      console.log(`📱 Tentativa ${attempt} de abrir stories...`);

      // Calcula duração até 15 segundos antes do fim da pausa
      const duration = automationState.pauseEndTime - Date.now() - 15000;

      if (duration <= 0) {
        console.log("⏰ Tempo de pausa quase acabando, cancelando stories");
        break;
      }

      // Envia comando para o content script
      const response = await chrome.tabs.sendMessage(
        automationState.currentTabId,
        {
          command: "watchStories",
          duration: duration,
        }
      );

      if (response && response.success) {
        console.log("   ✅ Stories iniciados com sucesso!");
        storiesStarted = true;
        break;
      } else {
        console.log("   ⚠️ Falha ao iniciar stories:", response?.error);
      }
    } catch (error) {
      console.error(`   ❌ Erro ao enviar comando de stories:`, error);

      // Se for erro de conexão, tenta recarregar a página
      if (
        error.message &&
        error.message.includes("connection") &&
        attempt < maxStoriesAttempts
      ) {
        console.log("   🔄 Recarregando página e tentando novamente...");
        await chrome.tabs.reload(automationState.currentTabId);
        await new Promise((resolve) => setTimeout(resolve, 5000));
      }
    }

    // Aguarda antes da próxima tentativa
    if (attempt < maxStoriesAttempts && !storiesStarted) {
      await new Promise((resolve) => setTimeout(resolve, 3000));
    }
  }

  if (!storiesStarted) {
    console.error(
      "❌ Falha ao iniciar visualização de stories após todas as tentativas"
    );
    // Continua a pausa normalmente mesmo sem stories
  }
}

/**
 * Completa a automação
 */
async function completeAutomation() {
  automationState.isActive = false;

  // Gera relatório final
  const report = {
    startTime: automationState.sessionStats.started,
    endTime: Date.now(),
    mode: automationState.mode,
    totalProcessed: automationState.sessionStats.totalProcessed,
    successful: automationState.sessionStats.successful,
    failed: automationState.sessionStats.failed,
    skipped: automationState.sessionStats.skipped,
    processedUsers: automationState.processedUsers,
    failedUsers: automationState.failedUsers,
    dailyUsed: automationState.dailyStats.count,
    dailyLimit: settings.dailyLimit,
    pauseReason: automationState.pauseReason,
  };

  // Salva relatório
  await chrome.storage.local.set({
    lastReport: report,
    lastReportDate: Date.now(),
  });

  // Limpa estado
  if (!settings.saveProgress || automationState.mode === "explorer") {
    automationState.currentList = [];
    automationState.currentIndex = 0;
    automationState.processedUsers = [];
    automationState.failedUsers = [];
  }

  sendStatusUpdate();

  // Notifica usuário
  chrome.runtime.sendMessage({
    type: "automationComplete",
    report,
  });
}

/**
 * Inicia automação com lista personalizada ou Explorer
 */
async function startAutomation(data) {
  if (automationState.isActive) {
    console.warn("Automação já está ativa");
    return;
  }

  // Carrega estatísticas atualizadas
  await loadStats();

  // Configura estado base
  automationState.isActive = true;
  automationState.actionType = data.actionType;
  automationState.mode = data.mode || "list";
  automationState.currentList = [];
  automationState.currentIndex = 0;
  automationState.sessionStats = {
    started: Date.now(),
    totalProcessed: 0,
    successful: 0,
    failed: 0,
    skipped: 0,
  };

  // Se modo lista, usa os usernames fornecidos
  if (data.mode === "list") {
    // Valida dados
    if (!data.usernames || data.usernames.length === 0) {
      console.error("Lista de usuários vazia");
      return;
    }

    automationState.currentList = data.usernames;

    // Randomiza ordem se configurado
    if (settings.randomizeOrder) {
      automationState.currentList.sort(() => Math.random() - 0.5);
    }
  }
  // Se modo explorer, a lista será preenchida dinamicamente

  // Atualiza configurações do Explorer se fornecidas
  if (data.explorerSettings) {
    settings.explorerFilters = {
      ...settings.explorerFilters,
      ...data.explorerSettings,
    };
  }

  // Encontra aba do Instagram
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  const instagramTab = tabs.find(
    (tab) => tab.url && tab.url.includes("instagram.com")
  );

  if (!instagramTab) {
    // Cria nova aba do Instagram
    const newTab = await chrome.tabs.create({
      url: "https://www.instagram.com/",
    });
    automationState.currentTabId = newTab.id;

    // Aguarda carregar
    await new Promise((resolve) => setTimeout(resolve, 3000));
  } else {
    automationState.currentTabId = instagramTab.id;
  }

  console.log(
    `Automação iniciada no modo ${automationState.mode}`,
    automationState.mode === "list"
      ? `com ${automationState.currentList.length} usuários`
      : ""
  );
  sendStatusUpdate();

  // Inicia processamento
  scheduleNextAction();
}

/**
 * Para a automação
 */
function stopAutomation() {
  automationState.isActive = false;
  automationState.isPaused = false;
  automationState.pauseReason = "";
  automationState.pauseEndTime = null;

  // Cancela alarmes
  chrome.alarms.clear("nextAction");
  chrome.alarms.clear("resumeFromPause");

  console.log("Automação parada");
  sendStatusUpdate();
}

/**
 * Envia atualização de status
 */
function sendStatusUpdate() {
  const status = {
    isActive: automationState.isActive,
    isPaused: automationState.isPaused,
    pauseReason: automationState.pauseReason,
    pauseEndTime: automationState.pauseEndTime,
    actionType: automationState.actionType,
    mode: automationState.mode,
    currentList: automationState.currentList.length,
    currentIndex: automationState.currentIndex,
    sessionStats: automationState.sessionStats,
    processedUsers: automationState.processedUsers.length,
    failedUsers: automationState.failedUsers.length,
    stats: {
      successful: automationState.sessionStats.successful,
      failed: automationState.sessionStats.failed,
      totalProcessed: automationState.sessionStats.totalProcessed,
    },
    limits: {
      daily: {
        used: automationState.dailyStats.count,
        limit: settings.dailyLimit,
        remaining: settings.dailyLimit - automationState.dailyStats.count,
      },
      hourly: {
        used: automationState.hourlyStats.count,
        limit: settings.hourlyLimit,
        remaining: settings.hourlyLimit - automationState.hourlyStats.count,
      },
    },
  };

  // Envia para o popup
  chrome.runtime
    .sendMessage({
      type: "statusUpdate",
      status,
    })
    .catch(() => {
      // Ignora erros se popup não estiver aberto
    });

  // Envia também para o content script se houver tab ativa
  if (automationState.currentTabId) {
    chrome.tabs
      .sendMessage(automationState.currentTabId, {
        command: "updateStatus",
        status: status,
      })
      .catch(() => {
        // Ignora se o content script não estiver disponível
      });
  }
}

// --- Event Listeners ---

// Mensagens
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log("Background recebeu:", request);

  switch (request.command) {
    case "startAutomation":
      startAutomation(request.data);
      sendResponse({ success: true });
      break;

    case "stopAutomation":
      stopAutomation();
      sendResponse({ success: true });
      break;

    case "checkProgress":
      chrome.storage.local.get([STORAGE_KEYS.PROGRESS], (data) => {
        console.log("Dados do storage:", data);
        console.log("Chave procurada:", STORAGE_KEYS.PROGRESS);
        if (data[STORAGE_KEYS.PROGRESS]) {
          const progress = data[STORAGE_KEYS.PROGRESS];
          const remaining = progress.currentList.length - progress.currentIndex;
          console.log("Progresso encontrado:", {
            total: progress.currentList.length,
            index: progress.currentIndex,
            remaining: remaining,
          });
          sendResponse({
            hasProgress: remaining > 0,
            remaining: remaining,
            total: progress.currentList.length,
            currentIndex: progress.currentIndex,
            mode: progress.mode || "list",
          });
        } else {
          console.log("Nenhum progresso salvo no storage");
          sendResponse({ hasProgress: false });
        }
      });
      return true; // Async response

    case "resumeAutomation":
      console.log("Comando de retomar recebido");

      // Carrega o progresso salvo
      chrome.storage.local.get([STORAGE_KEYS.PROGRESS], async (data) => {
        if (data[STORAGE_KEYS.PROGRESS]) {
          const progress = data[STORAGE_KEYS.PROGRESS];

          // Restaura o estado
          automationState.currentList = progress.currentList || [];
          automationState.currentIndex = progress.currentIndex || 0;
          automationState.processedUsers = progress.processedUsers || [];
          automationState.failedUsers = progress.failedUsers || [];
          automationState.mode = progress.mode || "list";

          // Verifica se há algo para retomar
          if (
            automationState.currentIndex < automationState.currentList.length ||
            automationState.mode === "explorer"
          ) {
            // Encontra aba do Instagram
            const tabs = await chrome.tabs.query({
              url: "*://*.instagram.com/*",
            });
            if (tabs.length > 0) {
              automationState.currentTabId = tabs[0].id;
              automationState.isActive = true;
              automationState.actionType = request.actionType || "follow";

              // Carrega estatísticas
              await loadStats();

              console.log(
                `Retomando do usuário ${automationState.currentIndex + 1} de ${
                  automationState.currentList.length
                } no modo ${automationState.mode}`
              );

              sendStatusUpdate();
              scheduleNextAction();

              sendResponse({ success: true });
            } else {
              sendResponse({
                success: false,
                error: "Nenhuma aba do Instagram encontrada",
              });
            }
          } else {
            sendResponse({ success: false, error: "Nenhum usuário restante" });
          }
        } else {
          sendResponse({ success: false, error: "Nenhum progresso salvo" });
        }
      });
      return true; // Indica resposta assíncrona

    case "getStatus":
      sendResponse({
        isActive: automationState.isActive,
        isPaused: automationState.isPaused,
        pauseReason: automationState.pauseReason,
        pauseEndTime: automationState.pauseEndTime,
        actionType: automationState.actionType,
        mode: automationState.mode,
        currentList: automationState.currentList.length,
        currentIndex: automationState.currentIndex,
        sessionStats: automationState.sessionStats,
        processedUsers: automationState.processedUsers.length,
        failedUsers: automationState.failedUsers.length,
        settings: settings,
        limits: {
          daily: {
            used: automationState.dailyStats.count,
            limit: settings.dailyLimit,
            remaining: settings.dailyLimit - automationState.dailyStats.count,
          },
          hourly: {
            used: automationState.hourlyStats.count,
            limit: settings.hourlyLimit,
            remaining: settings.hourlyLimit - automationState.hourlyStats.count,
          },
        },
      });
      break;

    case "updateSettings":
      settings = { ...settings, ...request.settings };
      chrome.storage.local.set({ [STORAGE_KEYS.SETTINGS]: settings });
      sendResponse({ success: true });
      break;

    case "getLists":
      chrome.storage.local.get(STORAGE_KEYS.LISTS, (data) => {
        sendResponse(data[STORAGE_KEYS.LISTS] || {});
      });
      return true; // Async response

    case "saveLists":
      chrome.storage.local.set({ [STORAGE_KEYS.LISTS]: request.lists });
      sendResponse({ success: true });
      break;

    case "getReport":
      chrome.storage.local.get(["lastReport", "lastReportDate"], (data) => {
        sendResponse(data);
      });
      return true; // Async response

    case "clearProcessedHistory":
      chrome.storage.local.remove(STORAGE_KEYS.PROCESSED_USERS, () => {
        console.log("Histórico de usuários processados limpo");
        sendResponse({ success: true });
      });
      return true;
  }
});

// Alarmes
chrome.alarms.onAlarm.addListener((alarm) => {
  console.log("Alarme disparado:", alarm.name);

  switch (alarm.name) {
    case "nextAction":
      if (automationState.isActive && !automationState.isPaused) {
        processNextUser();
      }
      break;

    case "resumeFromPause":
      automationState.isPaused = false;
      automationState.pauseReason = "";
      automationState.pauseEndTime = null;
      console.log("Retomando após pausa de lote");
      sendStatusUpdate();

      // Processa o próximo usuário imediatamente
      if (automationState.isActive) {
        processNextUser();
      }
      break;
  }
});

// Inicialização
loadSettingsAndState();

// Verificação periódica do estado de pausa (backup para alarmes)
setInterval(() => {
  if (automationState.isPaused && automationState.pauseEndTime) {
    const now = Date.now();
    if (now >= automationState.pauseEndTime) {
      console.log("Pausa expirada detectada pelo intervalo de backup");
      automationState.isPaused = false;
      automationState.pauseReason = "";
      automationState.pauseEndTime = null;
      sendStatusUpdate();

      if (automationState.isActive) {
        processNextUser();
      }
    }
  }
}, 5000); // Verifica a cada 5 segundos

console.log("Background script carregado - Versão 2.0 Enhanced with Explorer");
