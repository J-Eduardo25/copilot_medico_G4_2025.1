import { useState, useEffect, useCallback, Key, ReactNode } from 'react'; // Importações necessárias do React
import './App.css';
import Chat from './modules/Chat/chat'; // Importa o componente Chat
import { executeScriptOnActiveTab } from './utils/utils'; // função utilitária


// Define a estrutura exata esperada para cada objeto de mensagem
type Message = {
  id: Key;
  text: ReactNode;
  sender: 'user' | 'bot'; // Sender 
  timestamp: string;
};

function App() {
  //  Estados relacionados ao Debug e Extração
  const [currentPatientId, setCurrentPatientId] = useState<string | null>(null);
  const [debugSelector, setDebugSelector] = useState('.note-editable[role="textbox"]');
  const [debugIndex, setDebugIndex] = useState(0);
  const [extractedText, setExtractedText] = useState<string | null>(null);
  const [debugMode, setDebugMode] = useState(false);
  // Fim dos Estados de Debug 

  // Estados do Chat 
  const [isLoading, setIsLoading] = useState(false); // Estado para feedback de carregamento da IA
  const [messages, setMessages] = useState<Message[]>([ // USA O TIPO Message[] explicitamente
  {
      id: 1, // ID inicial
      text: "Olá! Sou o assistente virtual Copilot. Como posso ajudar?", // Mensagem inicial
      sender: "bot", // Sender inicial é 'bot' (compatível com o tipo)
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) // Timestamp formatado
    },
  ]);



  // Carregar patientId do chrome.storage ao montar o componente
  useEffect(() => {
    chrome.storage.local.get(['copilotMedicoPatientId'], (result) => {
      if (result.copilotMedicoPatientId) {
        setCurrentPatientId(result.copilotMedicoPatientId);
        // Opcional: carregar o histórico de mensagens para este patientId do backend
        // ou deixar que o backend use o ID para contextualizar a primeira mensagem, analisar depois a implementação !!!!!!!!
      }
    });
  }, []);

  // Função para limpar o ID do paciente e iniciar uma nova sessão
  const handleNewPatientSession = () => {
    setCurrentPatientId(null);
    chrome.storage.local.remove('copilotMedicoPatientId');
    setMessages([
      {
        id: 1,
        text: "Olá! Sou o assistente virtual Copilot. Como posso ajudar?",
        sender: "bot",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      },
    ]); // Reinicia mensagens
  };
 

  // Função simples para gerar IDs 
  const generateId = (): Key => Date.now() + Math.random();

  // AS FUNÇÕES DE EXTRAIR OS DADOS DA PÁGINA NÃO FORAM TESTADAS, SÃO FEITAS PARA LEREM APENAS PRONTUÁRIOS AMPIMED HTML
  const [editableNotes] = useState(
    {
      selector: '.note-editable[role="textbox"]',
      roleAndIndex: [
        { role: 'Anamnese', index: 0 },
        { role: 'Detalhes exame físico', index: 1 },
        { role: 'Conclusão diagnóstica', index: 2 },
        { role: 'lista de problemas', index: 3 }
      ]
    }
  );

  const handleUploadPdf = async (file: File) => {
    if (!file) return;

    setIsLoading(true); //

    // Adiciona uma mensagem à UI indicando que o PDF está sendo processado.
    // O usuário vê isso imediatamente.
    const processingUserMessage: Message = {
      id: generateId(), //
      text: `Enviando e processando o arquivo: ${file.name}...`,
      sender: "user", // Pode ser "user" ou um tipo "system" se preferir
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setMessages(prevMessages => [...prevMessages, processingUserMessage]);

    const formData = new FormData(); //
    formData.append('pdf', file); //

    // Inclui o patient_id se existir, para que o backend saiba a qual sessão/paciente associar.
    if (currentPatientId) {
      formData.append('patient_id', currentPatientId);
    }

    try {
      const response = await fetch('http://localhost:3001/api/upload-pdf', { //
        method: 'POST', //
        body: formData
        // Nota: Para FormData, o browser define o Content-Type (multipart/form-data) automaticamente.
      });

      setIsLoading(false); //
      const data = await response.json();

      if (response.ok) { //
        // Se o backend gerou e retornou um novo patient_id (porque não foi enviado um),
        // atualiza o estado e o chrome.storage.
        if (data.patient_id && !currentPatientId) {
          setCurrentPatientId(data.patient_id);
          chrome.storage.local.set({ copilotMedicoPatientId: data.patient_id });
        }

        // Adiciona a resposta da IA (ou mensagem de status do processamento do PDF) ao chat.
        const botResponseText = data.ai_response || data.message || "PDF processado. Nenhuma resposta adicional da IA.";
        const botMessage: Message = { //
          id: generateId(), //
          text: botResponseText,
          sender: "bot", //
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) //
        };
        setMessages(prevMessages => [...prevMessages, botMessage]); //
      } else {
        // O backend respondeu com um erro (status 4xx ou 5xx).
        const errorText = data.message || `Erro ao processar PDF (${response.status}).`;
        const errorMessage: Message = { //
          id: generateId(), //
          text: errorText,
          sender: "bot", //
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) //
        };
        setMessages(prevMessages => [...prevMessages, errorMessage]); //
      }
    } catch (error) {
      // Erro de rede ou ao tentar fazer o fetch.
      console.error('Erro de rede ao enviar PDF:', error); //
      setIsLoading(false); //
      
      const networkErrorText = error instanceof Error ? error.message : "Verifique a conexão e o backend.";
      const errorMessage: Message = { //
        id: generateId(), //
        text: `Falha no upload do PDF: ${networkErrorText}`,
        sender: "bot", //
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) //
      };
      setMessages(prevMessages => [...prevMessages, errorMessage]); //
    }
  };
  

  const createInputs = async () => {
    const inputKeys = ["peso", "altura", "imc", "tempe", "freqres", "freqcar", "pas", "pad"]
    let inputs = []
    for (let inputKey of inputKeys) {
      inputs.push({ input: `input[f_prontuario="${inputKey}"]`, role: inputKey });
    }
    return inputs
  }

  const extractDinamicData = async () => {
    let extractedData = [];
    let inputs = await createInputs();
    for (let i = 0; i < inputs.length; i++) {
      const { input, role } = inputs[i];
      const result = await extractSingleDiv(input, 0);
      if (result) {
        extractedData.push({ role, text: result });
      }
    }
    return extractedData;
  }

  const extractEditableNotesData = async () => {
    let extractedData = [];
    for (let i = 0; i < editableNotes.roleAndIndex.length; i++) {
      const { role, index } = editableNotes.roleAndIndex[i];
      const result = await extractSingleDiv(editableNotes.selector, index);
      if (result) {
        extractedData.push({ role, text: result });
      }
    }
    return extractedData;
  }

  const extractSingleDivDebug = async (selector: any, index: any) => {
    try {
      const result = await executeScriptOnActiveTab(selector, index);
      if (result) {
        setExtractedText(result);
        console.log('Texto extraído (Debug):', result);
      } else {
        console.log('Não foi possível extrair o texto (Debug)');
      }
    } catch (error) {
      console.error('Erro ao executar o script (Debug):', error);
    }
  };

  const extractSingleDiv = async (selector: any, index: any): Promise<string | null> => {
    try {
      const result = await executeScriptOnActiveTab(selector, index);
      return result || null; // Retorna resultado ou null
    } catch (error) {
      console.error('Erro em extractSingleDiv:', error); // Log do erro
      return null;
    }
  };

  const sendExtractedDataToServer = async (extractedData: any) => {
 
    try {
      const response = await fetch('http://localhost:3001/api/extracted-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(extractedData)
      });
      if (response.ok) {
        console.log('Dados extraídos enviados com sucesso para /api/extracted-data');
        const dados = await response.json();
        return dados;
      } else {
        console.log(`Erro ${response.status} ao enviar dados extraídos para /api/extracted-data`);

        return null;
      }
    } catch (error) {
      console.error('Erro de rede ao enviar dados extraídos:', error);

      return null;
    }
  }

  const handleExtractData = async () => {

    console.log("Botão 'Extrair Dados da Página' clicado.");
    try {
      const [staticData, dinamicData] = await Promise.all([
        extractEditableNotesData(),
        extractDinamicData()
      ]);
      const combinedData = [...staticData, ...dinamicData];
      console.log("Dados combinados para enviar:", combinedData);

      // Só envia se houver dados
      if (combinedData.length > 0) {
        const dados = await sendExtractedDataToServer(combinedData);
        console.log('Resposta do servidor para dados extraídos:', dados);

        // Adiciona resposta ao chat SE existir ai_response
        if (dados && dados.ai_response) {
            const botResponse: Message = { // Usa o tipo Message
                id: generateId(),
                text: dados.ai_response,
                sender: "bot",
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            };
            // Usa callback no setMessages para segurança
            setMessages(prevMessages => [...prevMessages, botResponse]);
        } else if (dados) {
             console.warn("Servidor respondeu para /extracted-data, mas sem ai_response.");
             // Adicionar mensagem informativa
             const infoMsg: Message = { id: generateId(), text: "Dados da página enviados, mas não houve resposta da IA para exibir.", sender: 'bot', timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) };
             setMessages(prev => [...prev, infoMsg]);
        } else {
             // Se sendExtractedDataToServer der erro e retornar null ou undefined
             const errorMsg: Message = { id: generateId(), text: "Falha ao enviar ou processar os dados extraídos da página.", sender: 'bot', timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) };
             setMessages(prev => [...prev, errorMsg]);
        }
      } else {
          console.log("Nenhum dado extraído da página para enviar.");
          // Informar usuário que nada foi extraído
           const infoMsg: Message = { id: generateId(), text: "Não encontrei dados para extrair nesta página.", sender: 'bot', timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) };
           setMessages(prev => [...prev, infoMsg]);
      }

    } catch (error) {
      console.error('Erro no processo de extração de dados:', error);
       const errorMsg: Message = { id: generateId(), text: "Ocorreu um erro durante a extração de dados.", sender: 'bot', timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) };
       setMessages(prev => [...prev, errorMsg]);
    }
  };

  const handleDebugMode = () => {
    setDebugMode(!debugMode);
  }
  


  // FUNÇÃO PARA LIDAR COM AS MENSAGENS DO CHAT (NOVA FUNCIONALIDADE)
  const handleSendMessage = useCallback(async (userMessageText: string) => {
    if (!userMessageText.trim() || isLoading) return;

    // Adiciona a mensagem do usuário à UI imediatamente
    const userUIMessage: Message = {
      id: generateId(),
      text: userMessageText,
      sender: "user" as const,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setMessages(prevMessages => [...prevMessages, userUIMessage]);

    setIsLoading(true);
    try {
      const payload: { message: string; patient_id?: string | null } = { message: userMessageText };
      if (currentPatientId) {
        payload.patient_id = currentPatientId;
      }

      const response = await fetch('http://localhost:3001/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await response.json(); // Tenta parsear JSON mesmo se !response.ok para obter msg de erro do backend

      if (response.ok) {
        if (data.patient_id && !currentPatientId) { // Se um novo ID foi retornado
          setCurrentPatientId(data.patient_id);
          chrome.storage.local.set({ copilotMedicoPatientId: data.patient_id });
        }
        if (data.ai_response) {
          const botMessage: Message = {
            id: generateId(),
            text: data.ai_response,
            sender: "bot",
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          };
          setMessages(prevMessages => [...prevMessages, botMessage]);
        } else if (!data.ai_response && data.message) { // Backend pode ter enviado uma mensagem informativa sem ser um erro
          const infoMsg: Message = { id: generateId(), text: data.message, sender: 'bot', timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) };
          setMessages(prevMessages => [...prevMessages, infoMsg]);
        } else {
           console.error("Resposta do /api/chat OK, mas sem ai_response ou message:", data);
           const errMsg: Message = { id: generateId(), text: "Recebi uma resposta inesperada do servidor.", sender: 'bot', timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) };
           setMessages(prevMessages => [...prevMessages, errMsg]);
        }
      } else {
        // O backend respondeu com erro (status 4xx ou 5xx)
        const errorText = data.message || `Desculpe, ocorreu um erro no servidor (${response.status}).`;
        console.error(`Erro do backend (${response.status}) ao processar /api/chat:`, errorText);
        const errMsg: Message = { id: generateId(), text: errorText, sender: 'bot', timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) };
        setMessages(prevMessages => [...prevMessages, errMsg]);
      }
    } catch (error) {
      // Erro de rede ou ao tentar fazer o fetch
      console.error('Erro de rede ao enviar mensagem para /api/chat:', error);
      const networkErrorText = error instanceof Error ? error.message : "Verifique a conexão e o backend.";
      const errMsg: Message = { id: generateId(), text: `Erro de conexão: ${networkErrorText}`, sender: 'bot', timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) };
      setMessages(prevMessages => [...prevMessages, errMsg]);
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, currentPatientId]); // Dependências corretas para o useCallback
 


  //  Renderização do Componente
  return (
    <>
      {/* Renderiza o componente Chat, passando as props necessárias e corrigidas */}
      <Chat
        messages={messages}           // Passa o array de mensagens 
        onSendMessage={handleSendMessage} // Passa a função para o Chat chamar ao enviar
        isLoading={isLoading}         // Passa o estado de carregamento
        onUploadPdf={handleUploadPdf} 
      />

      {/*Card com os botões de Debug e Extração (Mantidos como no seu original) */}
      <div className="card">
        
        <button onClick={handleNewPatientSession}>Nova Sessão de Paciente</button>
        <button onClick={handleDebugMode}>Debug</button>
        {
          debugMode && (
            <div>
              <div>
                <label> Seletor CSS: <input type="text" value={debugSelector} onChange={(e) => setDebugSelector(e.target.value)} placeholder="Exemplo: .note-editable[role='textbox']" /> </label>
              </div>
              <div>
                <label> Índice: <input type="number" value={debugIndex} onChange={(e) => setDebugIndex(parseInt(e.target.value, 10))} min={0} /> </label>
              </div>
              <div> {extractedText && <p>Texto extraído (Debug): {extractedText}</p>} </div>
              <button onClick={() => extractSingleDivDebug(debugSelector, debugIndex)}>Extrair texto (Debug)</button>
            </div>
          )
        }
        <button onClick={handleExtractData}> Extrair Dados da Página </button>
      </div>
    </>
  );
}

export default App; // Exporta o componente