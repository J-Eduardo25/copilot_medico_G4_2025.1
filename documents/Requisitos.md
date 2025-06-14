# Documento de Requisitos - Copilot Médico

**Histórico de Versões**

- 14/06/2025 - Documento correspondente à versão 2.0 do CoPilot - Fábio, Nielso Júnior, João Júnior

---

# 1. Visão Geral do Produto

O CoPilot Médico é uma solução de suporte à decisão clínica que visa auxiliar médicos na formulação de diagnósticos e prescrições. Ele agrega dados de múltiplas fontes (exames em PDF, dados digitados, áudios de consulta, prontuários eletrônicos Amplimed), processa-os e interage com o Google Gemini para fornecer insights e sugestões em um formato de chat. A solução garante a privacidade e segurança dos dados, anonimizando informações sensíveis antes de qualquer envio a modelos de linguagem externos.\

# 2. Estórias de Usuário e Critérios de Aceite

## US001 - Como Médico, desejo interagir com o Copilot Médico através de uma interface de chat no Navegador, para receber auxílio em diagnósticos e prescrições atráves dos dados fornecidos.

### Critérios de Aceite

- CA001 - O CoPilot deve ter uma janela de chat intuitiva para interação com o usuário.
- CA002 - As perguntas formatadas pelo CoPilot (a partir dos dados coletados) devem ser enviadas ao LLM via API.
- CA003 - As respostas do LLM devem ser processadas e exibidas de forma clara e legível na janela de chat.
- CA004 - O sistema deve gerenciar a autenticação e autorização das chamadas à API do LLM.

###

## US002 - Como Médico, desejo poder escrever perguntas diretamente na janela do chat, para obter respostas específicas do Gemini além das análises automáticas.

### Critérios de Aceite

- CA001 - A janela de chat deve permitir que o médico digite livremente suas próprias perguntas.
- CA002 - As perguntas digitadas diretamente devem ser enviadas ao Google Gemini após o processo de anonimização de dados sensíveis.
- CA003 - as respostas do Gemini para essas perguntas devem ser exibidas claramente na janela de chat.

###

## US003 - Como Médico, desejo digitar informações adicionais diretamente no CoPilot, para complementar os dados de entrada para o LLM.

### Critérios de Aceite

- CA001 - O sistema deve fornecer uma área de texto na interface de chat para digitação livre.

- CA002 - As informações digitadas devem ser consideradas na composição das perguntas enviadas ao LLM.

- CA003 - O sistema deve aplicar o processo de anonimização de dados sensíveis para o texto digitado.

###

## US004 - Como Médico, desejo carregar resultados de exames em PDF para análise, para que o CoPilot utilize essas informações na geração de insights.

### Critérios de Aceite

- CA001 - O sistema deve permitir que o médico faça upload de arquivos PDF.

- CA002 - O sistema deve ser capaz de extrair texto e dados relevantes do PDF para processamento.

- CA003 - O sistema deve exibir uma confirmação visual de que o PDF foi carregado com sucesso.

- CA004 - Dados sensíveis identificados no PDF devem ser anonimizados antes do envio ao LLM.

###

## US005 - Como Médico, desejo que o CoPilot capture dados do prontuário eletrônico Amplimed, para ter uma visão completa do histórico do paciente.

### Critérios de Aceite

- CA001 - Quando em uso do Amplimed, um botão flutuante deve ser exibido na tela.

- CA002 - Ao clicar no botão flutuante, o CoPilot deve ser capaz de extrair dados relevantes do prontuário eletrônico Amplimed (ex: histórico de doenças, medicamentos, alergias).

- CA003 - Os dados capturados do Amplimed devem ser submetidos ao processo de anonimização de dados sensíveis.

- CA004 - O médico deve receber uma confirmação visual de que os dados foram capturados.

###

## US006 - CComo Médico, desejo que minhas informações sensíveis sejam protegidas, para garantir a conformidade com a Lei Geral de Proteção de Dados (LGPD).

### Critérios de Aceite

- CA001 - O sistema deve identificar automaticamente dados sensíveis (ex: nome do paciente, CPF, endereço, número de telefone) em todas as fontes de entrada (PDF, texto digitado, transcrição de áudio, dados do Amplimed).

- CA002 - Todos os dados sensíveis identificados devem ser anonimizados ou pseudonimizados antes de serem enviados a qualquer serviço externo.

- CA003 - O processo de anonimização não deve comprometer a capacidade do LLM de fornecer insights relevantes para o caso clínico.

###

## US007 - Como Médico, desejo que o CoPilot mantenha um histórico de consultas feitas ao LLM para cada paciente.

### Critérios de Aceite

- CA001 - O sistema deve gerar um ID que permita identificar unicamente cada paciente.

- CA002 - O sistema atualiza o histórico do paciente a cada nova consulta realizada ao LLM.

- CA003 - O sistema não persiste dados sensíveis do paciente, garantindo a privacidade dos mesmos.

###

# 3. Requisitos identificados mas ainda não implementados

## US008 - Como Médico, desejo que o CoPilot capture e processe o áudio da conversa com o paciente, para incluir essas informações na análise e sugestões.

### Critérios de Aceite

- CA001 - O sistema deve ter a capacidade de gravar áudio da consulta (assumindo consentimento prévio do paciente, que será tratado fora do escopo do software).

- CA002 - O áudio gravado deve ser transcrito para texto para ser utilizado pelo CoPilot.

- CA003 - O texto transcrito deve passar pelo processo de anonimização de dados sensíveis antes de ser utilizado em qualquer interação com o LLM.

###

# 4. Sugestões de requisitos a serem apresentados ao cliente

## US009 - Como Médico, desejo visualizar o histórico das minhas interações com o CoPilot (perguntas e respostas), para revisar insights anteriores e acompanhar a evolução dos casos.

### Critérios de Aceite

- CA001 - O sistema deve armazenar um registro de todas as perguntas enviadas ao Gemini e as respostas recebidas.

- CA002 - O sistema deve permitir ao médico pesquisar e filtrar o histórico por paciente, data ou palavras-chave.

- CA003 - O histórico deve apresentar as interações de forma clara e legível, com indicação de data e hora.

###

## US009 - Como Médico, desejo que o CoPilot Médico se integre a outros sistemas de prontuário eletrônico (além do Amplimed), para expandir a abrangência da coleta de dados e a utilidade da ferramenta.

### Critérios de Aceite

- CA001 - O sistema deve ser projetado com uma arquitetura flexível que permita a integração com diferentes APIs de prontuários eletrônicos.

- CA002 - Deve haver um processo para configurar e mapear os campos de dados de novos prontuários eletrônicos.

- CA003 - A captura de dados desses novos prontuários deve passar pelo mesmo processo de anonimização de dados sensíveis.

- CA004 -

###

## US010 - Como Médico, desejo exportar um resumo das análises e recomendações do CoPilot para um caso específico, para incluir no prontuário do paciente ou para fins de discussão com colegas.

### Critérios de Aceite

- CA001 - O sistema deve permitir a seleção de uma interação ou conjunto de interações para exportação.

- CA002 - O relatório exportado deve conter as principais informações do caso, perguntas e respostas relevantes, de forma organizada.

- CA003 - O formato de exportação pode ser PDF ou TXT.

- CA004 - Nenhum dados sensível é exportado pelo sistema.

**Modelo para inserção de novas estórias**

## US011 - Como <papel> desejo <necessidade> para <objetivo>.

### Critérios de Aceite

- CA001 - A definir.

- CA002 - A definir.

- CA003 - A definir.

- CA004 - A definir.
