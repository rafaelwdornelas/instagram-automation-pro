# Instagram Automation Pro - Chrome Extension

Uma extensão avançada para Chrome que automatiza ações de seguir e deixar de seguir no Instagram com recursos profissionais de gerenciamento de listas, modo Explorer para descoberta automática, controle de performance e sistema anti-detecção.

![Version](https://img.shields.io/badge/version-2.1.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![Chrome](https://img.shields.io/badge/chrome-extension-yellow.svg)

## 🚀 Funcionalidades Principais

### 🔍 Modo Explorer (NOVO!)
- **Descoberta Automática**: Extrai e segue usuários das sugestões do Instagram
- **Filtros Inteligentes**: Filtre por palavras-chave, seguidores e mais
- **Extração Contínua**: Busca novos usuários automaticamente quando a lista acaba
- **Histórico Global**: Evita processar o mesmo usuário múltiplas vezes

### 📋 Gerenciamento de Listas Personalizadas
- **Listas Rápidas**: Cole usernames diretamente para processamento imediato
- **Listas Salvas**: Crie, edite e gerencie múltiplas listas de usuários
- **Importação em Massa**: Suporte para listas com centenas de usernames
- **Retomada Inteligente**: Continue de onde parou após interrupções

### ⚡ Controle Avançado de Performance
- **Delays Customizáveis**: Configure tempos entre navegação e ações
- **Sistema de Lotes**: Processe usuários em grupos com pausas automáticas
- **Limites Diários**: Defina máximo de ações por dia para maior segurança
- **Modo Seguro**: Configurações conservadoras pré-definidas

### 🛡️ Sistema Anti-Detecção
- **Comportamento Humano**: Simula movimentos de mouse e scrolls aleatórios
- **Delays Variáveis**: Tempos aleatórios entre ações para parecer natural
- **Pausas Inteligentes**: Sistema de pausas entre lotes de ações
- **Ordem Aleatória**: Processa listas em ordem randomizada
- **Visualização de Stories**: Assiste stories automaticamente durante pausas

### 📊 Relatórios e Estatísticas
- **Estatísticas em Tempo Real**: Acompanhe progresso ao vivo
- **Histórico Detalhado**: Veja todas as ações realizadas
- **Exportação CSV**: Baixe relatórios completos das sessões
- **Análise de Falhas**: Identifique e corrija problemas rapidamente

## 📥 Instalação

1. **Baixe ou clone este repositório**
   ```bash
   git clone https://github.com/rafaelwdornelas/instagram-automation-pro.git
   ```

2. **Abra o Chrome e acesse**
   ```
   chrome://extensions/
   ```

3. **Ative o "Modo do desenvolvedor"** no canto superior direito

4. **Clique em "Carregar sem compactação"** e selecione a pasta da extensão

## 🎯 Como Usar

### Modo Lista Personalizada

1. **Abra o Instagram** em uma aba do Chrome
2. **Clique no ícone da extensão** na barra de ferramentas
3. **Selecione "Lista Personalizada"**
4. **Configure sua automação**:
   - Escolha entre Seguir ou Deixar de Seguir
   - Cole uma lista de usernames ou selecione uma lista salva
   - Clique em "Iniciar Automação"

### Modo Explorer (Descoberta Automática)

1. **Abra o Instagram** em uma aba do Chrome
2. **Clique no ícone da extensão**
3. **Selecione "Explorer"**
4. **Configure os filtros** (opcional):
   - **Palavras-chave**: Adicione termos para filtrar usernames (ex: desbrava, club, etc)
   - **Usuários a ignorar**: Liste usuários que não devem ser processados
   - **Limites de seguidores**: Configure mínimo/máximo de seguidores
5. **Clique em "Iniciar Automação"**

A extensão irá automaticamente:
- Navegar para a página de sugestões do Instagram
- Extrair usuários que atendam aos critérios
- Seguir um por um respeitando os limites configurados
- Buscar mais usuários quando necessário

### Criando Listas Personalizadas

1. Vá para a aba **"Listas"**
2. Digite um nome para sua lista
3. Adicione usernames (um por linha, sem @)
4. Clique em **"Salvar Lista"**

### Configurações Recomendadas

#### Modo Seguro (Recomendado)
- **Delay entre navegações**: 8-15 segundos
- **Delay antes da ação**: 5-10 segundos  
- **Ações por lote**: 5
- **Pausa entre lotes**: 15-30 minutos
- **Limite diário**: 50 ações

#### Modo Moderado
- **Delay entre navegações**: 5-8 segundos
- **Delay antes da ação**: 3-5 segundos
- **Ações por lote**: 10
- **Pausa entre lotes**: 10-15 minutos
- **Limite diário**: 100 ações

## 🔧 Recursos Avançados

### Filtros do Explorer
- **Palavras-chave**: Filtra usuários cujos nomes contenham termos específicos
- **Lista de ignorados**: Usuários que nunca serão processados
- **Filtro de seguidores**: Define range de seguidores (0 = sem limite)
- **Toggle de filtros**: Ative/desative filtros conforme necessário

### Histórico de Processados
- Mantém registro de todos os usuários já processados
- Evita duplicações mesmo entre sessões diferentes
- Botão para limpar histórico quando necessário

### Retomada de Sessão
Se a automação for interrompida (fechou o navegador, atualizou a página, etc):
1. Abra novamente a extensão
2. Clique em **"Retomar Sessão Anterior"**
3. A automação continuará de onde parou

### Widget de Status
Um widget flutuante aparece no Instagram mostrando:
- Status atual (Ativo/Pausado/Inativo)
- Modo de operação (Lista/Explorer)
- Contador de tempo de pausa
- Estatísticas da sessão atual
- Progresso em tempo real
- Limites diários e horários

### Sistema de Pausas
A extensão pausa automaticamente entre lotes para evitar detecção:
- Timer visual mostra quanto tempo falta
- Pausas aleatórias entre o tempo mínimo e máximo configurado
- Visualização automática de stories durante pausas
- Retomada automática quando o tempo expira

## 📋 Requisitos

- Google Chrome versão 88 ou superior
- Conta do Instagram com login ativo
- Conexão estável com a internet

## ⚠️ Avisos Importantes

### Segurança da Conta
- **Use com moderação**: Ações excessivas podem resultar em restrições
- **Respeite os limites**: O Instagram monitora atividades automatizadas
- **Varie os horários**: Não use sempre no mesmo horário
- **Pausas longas**: Faça pausas de horas ou dias entre sessões intensas

### Limitações Conhecidas
- Funciona apenas na versão web do Instagram
- Não processa contas com autenticação de dois fatores pendente
- Pode não funcionar durante manutenções do Instagram
- Requer que a aba do Instagram permaneça aberta
- Modo Explorer funciona apenas para seguir (não para deixar de seguir)

## 🛠️ Solução de Problemas

### A extensão não está funcionando
1. Verifique se está logado no Instagram
2. Recarregue a página do Instagram (F5)
3. Desative e reative a extensão

### Ações estão falhando
1. Aumente os delays nas configurações
2. Reduza o número de ações por lote
3. Verifique se não há captcha ou verificações pendentes

### Explorer não está extraindo usuários
1. Certifique-se de estar logado no Instagram
2. Verifique se a página de sugestões está acessível
3. Tente desativar os filtros temporariamente
4. Limpe o histórico de processados se necessário

### Botão não encontrado
1. O Instagram pode ter atualizado sua interface
2. Tente em um perfil diferente
3. Reporte o problema com capturas de tela

## 🤝 Contribuindo

Contribuições são bem-vindas! Por favor:

1. Faça um Fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📝 Changelog

### v2.1.0 (2025)
- **NOVO**: Modo Explorer para descoberta automática de usuários
- Sistema de filtros inteligentes (palavras-chave, seguidores, etc)
- Histórico global de usuários processados
- Melhorias na interface com cards de seleção de modo
- Sistema de tags para gerenciar filtros
- Indicador visual do modo de operação
- Botão para limpar histórico de processados

### v2.0.0 (2025)
- Sistema completo de listas personalizadas
- Retomada de sessão após interrupções
- Widget de status flutuante
- Sistema de pausas com timer visual
- Melhorias no sistema anti-detecção
- Relatórios exportáveis em CSV
- Visualização automática de stories durante pausas

### v1.0.0
- Versão inicial
- Funcionalidade básica de follow/unfollow
- Configurações simples

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## ⚖️ Aviso Legal

**IMPORTANTE**: Esta extensão é fornecida apenas para fins educacionais e de automação pessoal. 

- O uso desta ferramenta pode violar os Termos de Serviço do Instagram
- Os desenvolvedores não se responsabilizam por suspensões ou banimentos de contas
- Use por sua própria conta e risco
- Recomendamos usar em contas de teste primeiro
- Sempre respeite os limites e diretrizes da plataforma

## 🙏 Agradecimentos

- Comunidade open source
- Testadores beta que ajudaram a melhorar a extensão
- Todos os contribuidores do projeto

---

<p align="center">
  Feito com ❤️ para a comunidade
  <br>
  ⭐ Dê uma estrela se este projeto ajudou você!
</p>
