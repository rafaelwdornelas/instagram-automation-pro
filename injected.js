// injected.js - Script que executa no contexto da página para interagir com React

(function () {
  ("use strict");

  window.IGAFLikeStory = function () {
    function tentarCurtir() {
      const svg = document.querySelector(
        'svg[aria-label="Curtir"], svg[aria-label="Like"]'
      );
      if (!svg) {
        console.log("✅ Nenhum botão de curtir encontrado. Encerrando loop.");
        return;
      }

      // Encontra o elemento clicável
      let target = svg;
      let parent = svg.parentElement;
      while (parent && parent !== document.body) {
        if (
          parent.tagName === "BUTTON" ||
          parent.getAttribute("role") === "button" ||
          parent.onclick !== null
        ) {
          target = parent;
          break;
        }
        parent = parent.parentElement;
      }

      console.log("⌛ Aguardando 1 segundos para curtir...");

      setTimeout(() => {
        const rect = target.getBoundingClientRect();
        const options = {
          view: window,
          bubbles: true,
          cancelable: true,
          clientX: rect.left + rect.width / 2,
          clientY: rect.top + rect.height / 2,
          buttons: 1,
        };

        target.dispatchEvent(new PointerEvent("pointerdown", options));
        setTimeout(() => {
          target.dispatchEvent(new PointerEvent("pointerup", options));
          target.dispatchEvent(new MouseEvent("click", options));
          console.log("❤️ Story curtido!");
          // Chama novamente após clicar
          setTimeout(tentarCurtir, 2000);
        }, 50);
      }, 1000);
    }

    tentarCurtir(); // inicia o loop
    return true;
  };

  // Função para clicar em elementos do stories
  window.IGAFClickStory = function (selector) {
    const element = document.querySelector(selector);
    if (!element) return false;

    const button = element.closest('div[role="button"]');
    if (!button) return false;

    const rect = button.getBoundingClientRect();
    const options = {
      view: window,
      bubbles: true,
      cancelable: true,
      clientX: rect.left + rect.width / 2,
      clientY: rect.top + rect.height / 2,
    };

    button.dispatchEvent(new MouseEvent("mousedown", options));
    setTimeout(() => {
      button.dispatchEvent(new MouseEvent("mouseup", options));
      button.dispatchEvent(new MouseEvent("click", options));
    }, 50);

    return true;
  };

  // Listener para comandos do content script
  window.addEventListener("IGAFCommand", function (event) {
    const { action, data } = event.detail;
    let result = false;

    switch (action) {
      case "likeStory":
        result = window.IGAFLikeStory();
        break;
      case "clickStory":
        result = window.IGAFClickStory(data.selector);
        break;
    }

    // Envia resposta de volta
    window.dispatchEvent(
      new CustomEvent("IGAFResponse", {
        detail: { action, result },
      })
    );
  });

  console.log("IGAF Injected script loaded");
})();
