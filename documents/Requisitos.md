# Documento de Requisitos - Copilot Médico

**Histórico de Versões**

- 14/06/2025 - Documento correspondente à versão 2.0 do CoPilot - Fábio, Nielso Júnior, João Júnior

---

# Visão Geral do Produto

O CoPilot Médico é uma solução de suporte à decisão clínica que visa auxiliar médicos na formulação de diagnósticos e prescrições. Ele agrega dados de múltiplas fontes (exames em PDF, dados digitados, áudios de consulta, prontuários eletrônicos Amplimed), processa-os e interage com o Google Gemini para fornecer insights e sugestões em um formato de chat. A solução garante a privacidade e segurança dos dados, anonimizando informações sensíveis antes de qualquer envio a modelos de linguagem externos.

# Estórias de Usuário e Critérios de Aceite

## US001 - Como Médico, desejo interagir com o Copilot Médico através de uma interface de chat no Navegador, para receber auxílio em diagnósticos e prescrições atráves dos dados fornecidos.

## Critérios de Aceite

### CA001 - O CoPilot deve ter uma janela de chat intuitiva para interação com o usuário.

### CA002 - As perguntas formatadas pelo CoPilot (a partir dos dados coletados) devem ser enviadas ao LLM via API.

### CA003 - As respostas do LLM devem ser processadas e exibidas de forma clara e legível na janela de chat.

### CA004 - O sistema deve gerenciar a autenticação e autorização das chamadas à API do LLM.

## US002 - Como Médico, desejo digitar informações diretamente na janeja de chat do CoPilot, para interagir com o LLM

## Critérios de Aceite

### CA001 - O sistema deve fornecer uma área de texto na interface de chat para digitação livre.

### CA002 - As informações digitadas devem ser consideradas na composição das perguntas enviadas ao LLM.

### CA003 - O sistema deve aplicar o processo de anonimização de dados sensíveis para o texto digitado.

## US003 - Como Médico, desejo carregar resultados de exames em PDF para análise, para que o CoPilot utilize essas informações na geração de insights

## Critérios de Aceite

### CA001 - O sistema deve permitir que o médico faça upload de arquivos PDF.

### CA002 - O sistema deve ser capaz de extrair texto e dados relevantes do PDF para processamento.

### CA003 - O sistema deve exibir uma confirmação visual de que o PDF foi carregado com sucesso.

### CA004 - Dados sensíveis identificados no PDF devem ser anonimizados antes do envio ao LLM.
