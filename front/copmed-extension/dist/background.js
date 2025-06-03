// background.js
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'SEND_HTML') {
    const pageHTML = request.html;
    
    // Envia o HTML para o servidor Python
    fetch('http://localhost:5000/process-html', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        html: pageHTML
      })
    })
    .then(response => response.json())
    .then(data => {
      console.log('Resposta do servidor Python:', data);
      sendResponse({ 
        status: 'HTML enviado com sucesso para o Python',
        pythonResponse: data
      });
    })
    .catch(error => {
      console.error('Erro ao enviar para o Python:', error);
      sendResponse({ 
        status: 'erro',
        error: error.message
      });
    });

    return true; // Mantém a conexão aberta para a resposta assíncrona
  }
});