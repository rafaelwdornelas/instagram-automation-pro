# Instagram Automation Pro - Chrome Extension

Uma extensão profissional para Chrome que automatiza ações no Instagram com recursos avançados de descoberta automática, gerenciamento inteligente de listas, sistema anti-detecção e controle total de performance.

![Version](https://img.shields.io/badge/version-2.1.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![Chrome](https://img.shields.io/badge/chrome-extension-yellow.svg)

## 📋 Índice

- [Recursos Principais](#-recursos-principais)
- [Instalação](#-instalação)
- [Como Usar](#-como-usar)
- [Configurações Avançadas](#-configurações-avançadas)
- [Arquitetura do Sistema](#-arquitetura-do-sistema)
- [Solução de Problemas](#-solução-de-problemas)
- [Segurança e Boas Práticas](#-segurança-e-boas-práticas)
- [Contribuindo](#-contribuindo)
- [Changelog](#-changelog)
- [Licença](#-licença)

## 🚀 Recursos Principais

### 🔍 Modo Explorer - Descoberta Automática
- **Extração Inteligente**: Captura usuários das sugestões do Instagram (`/explore/people/suggested/`)
- **Filtros Avançados**:
  - Palavras-chave personalizáveis (busca em usernames e nomes)
  - Lista de usuários a ignorar
  - Filtro por quantidade de seguidores (mín/máx)
  - Toggle para ativar/desativar filtros
- **Processamento Contínuo**: Busca novos usuários automaticamente quando a lista atual termina
- **Deduplicação Global**: Mantém histórico permanente para evitar reprocessamento

### 📋 Modo Lista Personalizada
- **Importação Flexível**: Cole listas diretas ou carregue listas salvas
- **Gerenciador de Listas**: 
  - Criar, editar e excluir listas nomeadas
  - Visualização do total de usuários por lista
  - Interface intuitiva com ações rápidas
- **Processamento em Lote**: Suporta centenas de usuários
- **Ordem Aleatória**: Opção para randomizar processamento

### ⚡ Sistema de Performance Inteligente
- **Controle Granular de Delays**:
  - Delay entre navegações: 1-60 segundos (configurável)
  - Delay antes da ação: 1-30 segundos (configurável)
  - Delay após scroll: 2-4 segundos
- **Sistema de Lotes**:
  - Ações por lote: 1-50 (configurável)
  - Pausas entre lotes: 1-60 minutos (configurável)
- **Limites de Segurança**:
  - Limite diário: até 500 ações
  - Limite horário: calculado automaticamente
  - Indicadores visuais de progresso

### 🛡️ Sistema Anti-Detecção Avançado
- **Simulação de Comportamento Humano**:
  - Movimentos naturais do mouse
  - Cliques aleatórios em áreas seguras
  - Scrolls variados e orgânicos
  - Pausas de "leitura" simuladas
- **Randomização Inteligente**:
  - Delays variáveis entre ações
  - Ordem aleatória de processamento
  - Horários de execução variados
- **Detecção de Bloqueios**: Identifica e para automaticamente se detectar limitações

### 📱 Visualização Automática de Stories
- **Durante Pausas**: Assiste stories automaticamente nos intervalos
- **Comportamento Natural**: 
  - Tempo de visualização variável (3-8 segundos)
  - Curtidas ocasionais (30% de chance)
  - Navegação automática entre stories
- **Limite de Tempo**: Máximo 5 minutos ou até 1 minuto antes do fim da pausa

### 📊 Sistema de Relatórios Completo
- **Estatísticas em Tempo Real**:
  - Contador de sucessos, falhas e pulados
  - Barra de progresso visual
  - Limites diários e horários com indicadores coloridos
- **Histórico Detalhado**:
  - Lista completa de ações realizadas
  - Razões de falhas e pulos
  - Timestamps de todas as operações
- **Exportação de Dados**: Download em formato CSV para análise externa

### 🔄 Sistema de Retomada Inteligente
- **Salvamento Automático**: Progresso salvo a cada ação
- **Retomada Sem Perdas**: Continue exatamente de onde parou
- **Validade de 24h**: Progresso mantido por até 24 horas
- **Indicador Visual**: Mostra quantos usuários restam ao retomar

### 🎨 Interface Moderna e Intuitiva
- **Design Dark Mode**: Interface escura confortável para os olhos
- **Tabs Organizadas**: 
  - Automação: Controle principal
  - Listas: Gerenciamento de listas salvas
  - Performance: Configurações detalhadas
  - Relatórios: Análise de resultados
- **Widget Flutuante**: Status em tempo real diretamente no Instagram
- **Animações Suaves**: Feedback visual para todas as ações

## 📥 Instalação

### Pré-requisitos
- Google Chrome versão 88 ou superior
- Conta ativa no Instagram
- Conexão estável com a internet

### Passos de Instalação

1. **Clone ou baixe o repositório**
   ```bash
   git clone https://github.com/rafaelwdornelas/instagram-automation-pro.git
   cd instagram-automation-pro
   ```

2. **Abra o Chrome e acesse as extensões**
   ```
   chrome://extensions/
   ```
   Ou menu → Mais ferramentas → Extensões

3. **Ative o Modo do Desenvolvedor**
   - Toggle no canto superior direito da página

4. **Carregue a extensão**
   - Clique em "Carregar sem compactação"
   - Selecione a pasta do projeto
   - A extensão aparecerá na barra de ferramentas

## 🎯 Como Usar

### Início Rápido

1. **Abra o Instagram** em uma aba do Chrome
2. **Clique no ícone da extensão** (📸) na barra de ferramentas
3. **Escolha o modo de operação**:
   - 📋 **Lista Personalizada**: Para listas específicas de usuários
   - 🔍 **Explorer**: Para descoberta automática

### Usando o Modo Lista

1. **Selecione "Lista Personalizada"**
2. **Escolha a ação**:
   - ✅ Seguir
   - ❌ Deixar de Seguir
3. **Adicione usuários**:
   - **Opção 1**: Cole usernames na área de texto (um por linha)
   - **Opção 2**: Selecione uma lista salva no dropdown
4. **Clique em "Iniciar Automação"**

#### Exemplo de Lista:
```
usuario1
usuario2
@usuario3
usuario4
```

### Usando o Modo Explorer

1. **Selecione "Explorer"**
2. **Configure os filtros** (opcional):
   
   **Palavras-chave**:
   - Digite palavras e pressione Enter
   - Exemplos: desbrava, club, aventureiro
   - Remove clicando no X de cada tag
   
   **Usuários a Ignorar**:
   - Digite usernames para nunca processar
   - Útil para contas comerciais ou bots conhecidos
   
   **Filtros de Seguidores**:
   - Mínimo: 0 = sem limite inferior
   - Máximo: 0 = sem limite superior
   - Exemplo: Min 100, Max 5000 = apenas contas médias

3. **Clique em "Iniciar Automação"**

### Gerenciando Listas Salvas

1. **Vá para a aba "Listas"**
2. **Criar Nova Lista**:
   - Digite um nome descritivo
   - Adicione usernames (um por linha, sem @)
   - Clique em "Salvar Lista"
3. **Editar Lista**: Clique no ícone ✏️
4. **Excluir Lista**: Clique no ícone 🗑️

### Durante a Execução

A extensão mostra um **widget flutuante** no Instagram com:
- 🟢 **Status**: Ativo/Pausado/Inativo
- 📊 **Estatísticas**: Sucessos, falhas, total processado
- ⏱️ **Timer de Pausa**: Contagem regressiva visual
- 📈 **Limites**: Uso diário e horário com barras de progresso

## ⚙️ Configurações Avançadas

### Aba Performance

#### Delays (Tempos de Espera)
- **Entre Navegações**: Tempo após navegar para um perfil
- **Antes da Ação**: Tempo antes de clicar em seguir/deixar de seguir
- **Configuração**: Use ranges (mín-máx) para parecer mais humano

#### Sistema de Lotes
- **Ações por Lote**: Quantas ações antes de pausar
- **Pausa entre Lotes**: Tempo de descanso (em minutos)
- **Recomendado**: Lotes pequenos com pausas longas

#### Limites de Segurança
- **Limite Diário**: Máximo de ações em 24h
- **Limite Horário**: Calculado automaticamente (diário ÷ 8)
- **Comportamento**: Para automaticamente ao atingir limites

#### Opções de Comportamento
- ✅ **Pular contas privadas**: Ignora perfis privados
- ✅ **Pular contas verificadas**: Ignora perfis com selo azul
- ✅ **Ordem aleatória**: Processa lista em ordem randômica
- ✅ **Simular comportamento humano**: Ativa todas as simulações
- ✅ **Assistir stories durante pausas**: Mantém atividade natural

### Configurações Recomendadas

#### 🛡️ Modo Ultra Seguro
```
Delay entre navegações: 15-25 segundos
Delay antes da ação: 8-15 segundos
Ações por lote: 3
Pausa entre lotes: 30-45 minutos
Limite diário: 30
```

#### ⚖️ Modo Balanceado
```
Delay entre navegações: 8-15 segundos
Delay antes da ação: 5-10 segundos
Ações por lote: 5
Pausa entre lotes: 15-30 minutos
Limite diário: 50
```

#### ⚡ Modo Rápido (Risco Maior)
```
Delay entre navegações: 3-5 segundos
Delay antes da ação: 2-4 segundos
Ações por lote: 20
Pausa entre lotes: 5-10 minutos
Limite diário: 200
```

## 🏗️ Arquitetura do Sistema

### Estrutura de Arquivos
```
instagram-automation-pro/
├── manifest.json          # Configuração da extensão
├── background.js          # Script principal (Service Worker)
├── content_script.js      # Interage com a página do Instagram
├── injected.js           # Script injetado para ações específicas
├── popup.html            # Interface do popup
├── popup.js              # Lógica do popup
├── styles.css            # Estilos visuais e animações
└── README.md             # Documentação
```

### Componentes Principais

#### Background Script (`background.js`)
- Gerencia estado global da automação
- Controla navegação entre perfis
- Implementa lógica de limites e pausas
- Salva progresso e configurações
- Coordena comunicação entre componentes

#### Content Script (`content_script.js`)
- Detecta elementos na página do Instagram
- Executa ações de follow/unfollow
- Extrai usuários do Explorer
- Simula comportamento humano
- Gerencia widget de status

#### Injected Script (`injected.js`)
- Acessa contexto React do Instagram
- Executa ações que requerem acesso direto
- Interage com stories

#### Popup (`popup.html` + `popup.js`)
- Interface principal do usuário
- Gerenciamento de configurações
- Visualização de relatórios
- Controle da automação

### Fluxo de Dados

1. **Usuário configura no Popup** → 
2. **Background recebe comando** → 
3. **Navega para perfil/explorer** → 
4. **Content Script executa ação** → 
5. **Resultado volta para Background** → 
6. **Atualiza interface e estatísticas**

### Armazenamento de Dados

- **Chrome Storage Local**:
  - Configurações do usuário
  - Listas salvas
  - Progresso da sessão
  - Histórico de processados
  - Estatísticas e limites

- **Dados Salvos**:
  ```javascript
  {
    settings: {},           // Todas as configurações
    userLists: {},         // Listas nomeadas
    automationProgress: {}, // Progresso atual
    dailyStats: {},        // Estatísticas diárias
    hourlyStats: {},       // Estatísticas horárias
    processedUsersHistory: [] // Histórico global
  }
  ```

## 🛠️ Solução de Problemas

### Problemas Comuns

#### "A extensão não funciona"
1. Verifique se está logado no Instagram
2. Recarregue a página (F5)
3. Desative/reative a extensão
4. Limpe cache e cookies do Instagram

#### "Ações estão falhando constantemente"
1. Aumente todos os delays em 50%
2. Reduza ações por lote para 3-5
3. Verifique se há captcha pendente
4. Tente em horário diferente

#### "Explorer não encontra usuários"
1. Certifique-se de estar na conta correta
2. Desative filtros temporariamente
3. Limpe histórico de processados
4. Verifique se a página de sugestões carrega manualmente

#### "Widget não aparece"
1. Recarregue a página do Instagram
2. Verifique se a extensão tem permissões
3. Desative outras extensões que possam interferir

#### "Limites atingidos muito rápido"
1. Verifique configuração de limite diário
2. Limpe estatísticas do dia anterior
3. Use modo mais conservador

### Códigos de Status

- ✅ **success**: Ação realizada com sucesso
- ⏭️ **skipped**: Usuário pulado (já seguindo, privado, etc)
- ❌ **failed**: Falha na execução
- 🚫 **blocked**: Ação bloqueada pelo Instagram
- 🔍 **profile_not_found**: Perfil não existe

### Logs e Debug

1. **Console do Background**:
   - Chrome → Extensões → Instagram Automation → Service Worker → Inspecionar

2. **Console da Página**:
   - F12 na página do Instagram → Console

3. **Informações Úteis nos Logs**:
   - Estados da automação
   - Erros de execução
   - Limites e estatísticas
   - Ações realizadas

## 🔒 Segurança e Boas Práticas

### Recomendações Essenciais

1. **Use em Conta de Teste Primeiro**
   - Teste todos os recursos antes de usar na conta principal
   - Entenda os limites da sua conta

2. **Comece Devagar**
   - Primeiras sessões: máximo 20-30 ações
   - Aumente gradualmente ao longo de semanas
   - Observe reações do Instagram

3. **Varie Seus Padrões**
   - Use em horários diferentes
   - Alterne entre modos
   - Faça pausas de dias

4. **Monitore Sinais de Alerta**
   - Captchas frequentes
   - Ações bloqueadas
   - Avisos do Instagram

5. **Mantenha Atividade Manual**
   - Continue usando o Instagram normalmente
   - Poste conteúdo regularmente
   - Interaja manualmente também

### Limites Seguros por Tipo de Conta

#### Conta Nova (< 1 mês)
- 10-20 ações/dia
- Pausas de 1-2 horas
- Evite ações em massa

#### Conta Estabelecida (> 6 meses)
- 50-100 ações/dia
- Pausas de 30-60 minutos
- Pode usar modo Explorer

#### Conta Antiga (> 1 ano)
- 100-200 ações/dia
- Pausas de 15-30 minutos
- Todos os recursos liberados

### Sinais de Problemas

⚠️ **Atenção Requerida**:
- Captcha aparecendo
- Ações demorando mais
- Seguidores não aumentando

🚨 **Pare Imediatamente**:
- Mensagem de "Ação Bloqueada"
- Aviso de atividade suspeita
- Solicitação de verificação

## 🤝 Contribuindo

### Como Contribuir

1. **Fork** o projeto
2. **Clone** seu fork:
   ```bash
   git clone https://github.com/rafaelwdornelas/instagram-automation-pro.git
   ```
3. **Crie uma branch** para sua feature:
   ```bash
   git checkout -b feature/MinhaFeature
   ```
4. **Commit** suas mudanças:
   ```bash
   git commit -m 'feat: Adiciona nova funcionalidade X'
   ```
5. **Push** para a branch:
   ```bash
   git push origin feature/MinhaFeature
   ```
6. **Abra um Pull Request**

### Padrões de Código

- Use nomes descritivos para variáveis e funções
- Comente código complexo
- Mantenha funções pequenas e focadas
- Teste suas mudanças extensivamente

### Áreas para Contribuição

- 🐛 Correção de bugs
- ✨ Novas funcionalidades
- 📝 Melhorias na documentação
- 🎨 Melhorias na interface
- ⚡ Otimizações de performance
- 🌐 Traduções

## 📝 Changelog

### [2.1.0] - 2025-01-22
#### Adicionado
- 🔍 Modo Explorer para descoberta automática de usuários
- 🏷️ Sistema de filtros com tags visuais
- 📊 Histórico global de usuários processados
- 🗑️ Botão para limpar histórico
- 🎯 Filtros por quantidade de seguidores
- 📱 Indicador de modo no widget flutuante
- ⚡ Extração contínua no modo Explorer

#### Melhorado
- Interface com cards de seleção de modo
- Sistema de deduplicação mais eficiente
- Feedback visual aprimorado
- Documentação expandida

### [2.0.0] - 2025-01-20
#### Adicionado
- 📋 Sistema completo de listas personalizadas
- 🔄 Retomada de sessão após interrupções
- 📊 Widget de status flutuante
- ⏱️ Timer visual de pausas
- 📱 Visualização automática de stories
- 📈 Relatórios exportáveis em CSV
- 🎯 Limites diários e horários

#### Melhorado
- Sistema anti-detecção aprimorado
- Performance otimizada
- Interface completamente redesenhada

### [1.0.0] - 2024-12-15
- Versão inicial
- Funcionalidades básicas de follow/unfollow
- Configurações simples

## 📄 Licença

Este projeto está licenciado sob a Licença MIT - veja o arquivo [LICENSE](LICENSE) para detalhes.

```
MIT License

Copyright (c) 2025 Instagram Automation Pro

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

## ⚖️ Aviso Legal

**IMPORTANTE**: Esta extensão é fornecida apenas para fins educacionais e de pesquisa.

### Isenção de Responsabilidade

- ⚠️ O uso desta ferramenta pode violar os Termos de Serviço do Instagram
- ⚠️ Os desenvolvedores não se responsabilizam por:
  - Suspensões ou banimentos de contas
  - Perda de seguidores ou engajamento
  - Qualquer dano direto ou indireto
- ⚠️ Use por sua própria conta e risco
- ⚠️ Sempre respeite os limites e diretrizes da plataforma
- ⚠️ Considere as implicações éticas do uso de automação

### Conformidade Legal

Ao usar esta extensão, você concorda que:
1. Está ciente dos riscos envolvidos
2. Assume total responsabilidade pelo uso
3. Não usará para fins maliciosos ou spam
4. Respeitará a privacidade de outros usuários
5. Cumprirá todas as leis aplicáveis em sua jurisdição

## 🙏 Agradecimentos

- 💜 Comunidade open source por ferramentas e inspiração
- 🧪 Beta testers que ajudaram a identificar e corrigir problemas
- 📚 Contribuidores de documentação e traduções
- ⭐ Todos que deram estrela e apoiaram o projeto
- 🐛 Usuários que reportaram bugs e sugeriram melhorias

---

<p align="center">
  <strong>Desenvolvido com ❤️ para a comunidade</strong>
  <br><br>
  <a href="https://github.com/rafaelwdornelas/instagram-automation-pro/stargazers">
    ⭐ Dê uma estrela se este projeto foi útil!
  </a>
  <br><br>
  <img src="https://img.shields.io/badge/Made%20with-JavaScript-yellow?style=for-the-badge&logo=javascript" />
  <img src="https://img.shields.io/badge/For-Chrome-blue?style=for-the-badge&logo=google-chrome" />
  <img src="https://img.shields.io/badge/Status-Active-success?style=for-the-badge" />
</p>
