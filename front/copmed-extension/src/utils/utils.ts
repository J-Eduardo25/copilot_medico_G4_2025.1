// Função para extrair o conteúdo de um elemento com base no seletor CSS e índice
export const extractTextFromElement = (selector: string, index: number = 0): string | null => {
    const elements = document.querySelectorAll(selector);

  if (elements && elements.length > index) {
    const element = elements[index];
    
    
    // Se for um input ou um elemento com 'value', retorna o value
    if (element instanceof HTMLInputElement) {
      return element.value || null; // Retorna o valor do input ou null
    }


    // Se for um elemento com texto, retorna o conteúdo textual
    if (element instanceof HTMLElement) {
      return element.textContent?.trim() ?? null; // Retorna o texto ou null
    }
  }
  
  return null; // Caso nenhum elemento seja encontrado ou o valor esteja ausente
};
  
  // Função assíncrona para executar um script na aba ativa e retornar o resultado
  export const executeScriptOnActiveTab = async (selector: string, index: number): Promise<string | null> => {
    return new Promise((resolve, reject) => {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const tabId = tabs[0].id;
  
        if (tabId !== undefined) {
          chrome.scripting.executeScript(
            {
              target: { tabId: tabId },
              func: extractTextFromElement,
              args: [selector, index],
            },
            (injectionResults) => {
              if (injectionResults && injectionResults[0] && injectionResults[0].result !== undefined) {
                resolve(injectionResults[0].result);
              } else {
                reject('Não foi possível extrair o texto');
              }
            }
          );
        } else {
          reject('Nenhuma aba ativa encontrada');
        }
      });
    });
  };
  