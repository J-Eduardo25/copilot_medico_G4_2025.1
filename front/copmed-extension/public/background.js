chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'SEND_COMBINED_DATA') {
    
    // 1. lê o id do paciente do armazenamento antes de fazer a requisição.
    chrome.storage.local.get(['copilotMedicoPatientId'], (storageResult) => {
      const currentPatientId = storageResult.copilotMedicoPatientId; // Pode ser undefined se for a primeira vez.
      console.log(`ID de Paciente recuperado do armazenamento: ${currentPatientId}`);

      const payload = {
        // 2. inclui id na requisição, se ele existir.
        patient_id: currentPatientId, 
        extracted_content: request.extracted_content
      };

      console.log('Enviando dados para o servidor Python:', payload);

      fetch('http://localhost:3001/api/extracted-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      .then(response => response.json())
      .then(data => {
        console.log('Resposta do servidor Python:', data);

        // 3. salva o novo ID se o servidor tiver criado
        if (data.patient_id && data.patient_id !== currentPatientId) {
          console.log(`Novo ID de paciente recebido do servidor: ${data.patient_id}. Salvando...`);
          chrome.storage.local.set({ copilotMedicoPatientId: data.patient_id });
        }
        
        // Retorna a resposta completa para o content.js
        sendResponse(data); 
      })
      .catch(error => {
        console.error('Erro no fetch para o Python:', error);
        sendResponse({ status: 'erro', error: error.message });
      });
    });

    return true; // manter a comunicação aberta para a resposta assíncrona.
  }
});