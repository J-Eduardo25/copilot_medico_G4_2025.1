
// Esta função é o coração da extração, busca um elemento e pega seu texto/valor.
function extractTextFromElement(selector, index) {
  const elements = document.querySelectorAll(selector);
  if (elements && elements.length > index) {
    const element = elements[index];
    // Se for um campo de input ou textarea, pega value.
    if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) {
      return element.value;
    }
    // Para outros elementos (como divs), pega innerText.
    return element.innerText;
  }
  return null;
}

// Replica a extração dos dados dinâmicos (peso, altura, etc.)
function extractDinamicData() {
  const inputs = [
    { input: `input[f_prontuario="peso"]`, role: 'peso' },
    { input: `input[f_prontuario="altura"]`, role: 'altura' },
    { input: `input[f_prontuario="imc"]`, role: 'imc' },
    { input: `input[f_prontuario="tempe"]`, role: 'tempe' },
    { input: `input[f_prontuario="freqres"]`, role: 'freqres' },
    { input: `input[f_prontuario="freqcar"]`, role: 'freqcar' },
    { input: `input[f_prontuario="pas"]`, role: 'pas' },
    { input: `input[f_prontuario="pad"]`, role: 'pad' },
  ];

  let extractedData = [];
  for (const item of inputs) {
    const result = extractTextFromElement(item.input, 0);
    if (result) {
      extractedData.push({ role: item.role, text: result });
    }
  }
  return extractedData;
}

// Replica a extração das notas editáveis (anamnese, etc)
function extractEditableNotesData() {
  const editableNotes = {
    selector: '.note-editable[role="textbox"]',
    roleAndIndex: [
      { role: 'Anamnese', index: 0 },
      { role: 'Detalhes exame físico', index: 1 },
      { role: 'Conclusão diagnóstica', index: 2 },
      { role: 'lista de problemas', index: 3 }
    ]
  };

  let extractedData = [];
  for (const item of editableNotes.roleAndIndex) {
    const result = extractTextFromElement(editableNotes.selector, item.index);
    if (result) {
      extractedData.push({ role: item.role, text: result });
    }
  }
  return extractedData;
}



// botao

const floatingButton = document.createElement('button');
floatingButton.innerText = 'Extrair Dados';
floatingButton.style.position = 'fixed';
floatingButton.style.top = '20px';
floatingButton.style.right = '20px';
floatingButton.style.zIndex = '99999';
floatingButton.style.padding = '10px 15px';
floatingButton.style.backgroundColor = '#007bff';
floatingButton.style.color = 'white';
floatingButton.style.border = 'none';
floatingButton.style.borderRadius = '5px';
floatingButton.style.cursor = 'pointer';

document.body.appendChild(floatingButton);

// clique pra extracao
floatingButton.addEventListener('click', () => {
  console.log('Botão flutuante clicado. Executando extração limpa...');
  floatingButton.innerText = 'Extraindo...';
  floatingButton.disabled = true;

  // 1. Executa mesmas funções de extração do App.tsx
  const staticData = extractEditableNotesData();
  const dinamicData = extractDinamicData();
  const combinedData = [...staticData, ...dinamicData];

  console.log("Dados combinados para enviar:", combinedData);

  if (combinedData.length > 0) {
    // 2. Envia os dados combinados para o background script
    chrome.runtime.sendMessage(
      {
        type: 'SEND_COMBINED_DATA',
        extracted_content: combinedData
      },
      (response) => {
        if (response?.status === 'success') {
          floatingButton.innerText = 'Enviado!';
        } else {
          floatingButton.innerText = 'Erro!';
          console.error('Falha no background/servidor:', response?.error);
        }
        setTimeout(() => {
          floatingButton.innerText = 'Extrair Dados';
          floatingButton.disabled = false;
        }, 3000);
      }
    );
  } else {
    floatingButton.innerText = 'Nada a extrair';
     setTimeout(() => {
        floatingButton.innerText = 'Extrair Dados';
        floatingButton.disabled = false;
    }, 3000);
  }
});