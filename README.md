# Co-pilot Médico

**Co-pilot Médico**

## Requisitos

### Backend
- **Tecnologias**:
  - Python (3.11.2)
  - Flask (3.0.3)
  - API Gemini
  - PyPDF2

### Frontend
- **Tecnologias**:
  - JavaScript (v18.12.1)
  - Extensão Chrome ("manifest_version" : 3)
  - Node

#### Backend

1. Instale o Flask executando, no terminal do backend:
  
  ```bash
  pip install google-generativeai Flask PyPDF2
  ```

  ou 

   ```bash
  npm install google-generativeai Flask 
   ```

2. instale, também no diretório do backend, a biblioteca do google generative ai para usar o gemini

3. Gere uma chave API do gemini no site deles e coloque-a nas variáveis de ambiente do seu sistema em PATH
   
#### Frontend

1. Navegue para o diretório `front/copmed-extension`:
   ```bash
   cd front/copmed-extension
   ```

2. Instale as dependências do Node.js:
   ```bash
   npm install
   ```

3. Compile o código para gerar a extensão:
   ```bash
   npm run build
   ```

4. Após a compilação, utilize a pasta `dist` como a extensão para o Chrome.

---

## Usando a Extensão no Chrome

### Passo a Passo para Carregar a Extensão no Modo Desenvolvedor

1. Abra o Chrome e acesse a página de extensões:
   - No navegador, clique em **Menu (três pontos no canto superior direito) > Mais ferramentas > Extensões**, ou simplesmente acesse `chrome://extensions` na barra de endereço.

2. Ative o **Modo Desenvolvedor**:
   - Na parte superior direita da página de extensões, ative o botão de **Modo desenvolvedor**.

3. Carregue a extensão:
   - Clique no botão **Carregar sem compactação** (ou **Load unpacked**).
   - Navegue até o diretório `dist` gerado no passo anterior e selecione-o.
  
4. Inicie o servidor:
   ```bash
   python server.py
   ```

5. Teste a extensão:
   - A extensão deve aparecer na sua barra de ferramentas. Clique nela para começar a usar!

---
