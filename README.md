# Co-pilot Médico

**Co-pilot Médico**

Desenvolvido com base no prontuário da Amplimed (sistema de gestão de clínicas)

## Requisitos

### Backend
- **Linguagens e Frameworks**:
  - Python (3.11.2)
  - Flask (3.0.3)
  - API OpenAi (Version: 1.56.1)

### Frontend
- **Tecnologias**:
  - JavaScript (v18.12.1)
  - Extensão Chrome ("manifest_version" : 3)
  - Node

#### Backend

1. Instale o Flask e a biblioteca OpenAI executando:
   ```bash
   pip install openai flask
   ```

2. Abra o servidor na pasta `API` executando o arquivo `server.py`:
   ```bash
   cd API
   python server.py
   ```

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

4. Teste a extensão:
   - A extensão deve aparecer na sua barra de ferramentas. Clique nela para começar a usar!

---

Grupo:
Gabriel Cortez