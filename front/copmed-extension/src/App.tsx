import { useState, useEffect, useCallback, Key, ReactNode } from 'react';
import './App.css';
import Chat from './modules/Chat/chat';
import { executeScriptOnActiveTab } from './utils/utils';


// Define a estrutura exata esperada para cada objeto de mensagem
type Message = {
  id: Key;
  text: ReactNode;
  sender: 'user' | 'bot';
  timestamp: string;
};

function App() {
  // Estados relacionados ao Debug e Extração
  const [currentPatientId, setCurrentPatientId] = useState<string | null>(null);
  const [debugSelector, setDebugSelector] = useState('.note-editable[role="textbox"]');
  const [debugIndex, setDebugIndex] = useState(0);
  const [extractedText, setExtractedText] = useState<string | null>(null);
  const [debugMode, setDebugMode] = useState(false);
  
  // Estados do Chat 
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      text: "Olá! Sou o assistente virtual Copilot. Como posso ajudar?",
      sender: "bot",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    },
  ]);

  // Carrega dados da sessão, como o ID do paciente e o histórico de mensagens,
  // do storage do navegador sempre que a extensão é aberta.
  useEffect(() => {
    chrome.storage.local.get(['copilotMedicoPatientId', 'chatMessages'], (result) => {
      if (result.copilotMedicoPatientId) {
        setCurrentPatientId(result.copilotMedicoPatientId);
      }
      if (result.chatMessages && result.chatMessages.length > 0) {
        setMessages(result.chatMessages);
      }
    });
  }, []);

  // Salva o histórico de mensagens no storage do navegador automaticamente
  // sempre que uma nova mensagem é adicionada ao chat.
  useEffect(() => {
    chrome.storage.local.set({ chatMessages: messages });
  }, [messages]);

  // Limpa os dados da sessão atual e reinicia o chat para um novo paciente.
  const handleNewPatientSession = () => {
    setCurrentPatientId(null);
    chrome.storage.local.remove('copilotMedicoPatientId');
    const initialMessage: Message = {
      id: 1,
      text: "Nova sessão iniciada. Como posso ajudar?",
      sender: "bot",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setMessages([initialMessage]);
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

    setIsLoading(true);

    const processingUserMessage: Message = {
      id: generateId(),
      text: `Enviando e processando o arquivo: ${file.name}...`,
      sender: "user",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setMessages(prevMessages => [...prevMessages, processingUserMessage]);

    const formData = new FormData();
    formData.append('pdf', file);

    if (currentPatientId) {
      formData.append('patient_id', currentPatientId);
    }

    try {
      const response = await fetch('http://localhost:3001/api/upload-pdf', {
        method: 'POST',
        body: formData
      });

      setIsLoading(false);
      const data = await response.json();

      if (response.ok) {
        if (data.patient_id && !currentPatientId) {
          setCurrentPatientId(data.patient_id);
          chrome.storage.local.set({ copilotMedicoPatientId: data.patient_id });
        }

        const botResponseText = data.ai_response || data.message || "PDF processado. Nenhuma resposta adicional da IA.";
        const botMessage: Message = {
          id: generateId(),
          text: botResponseText,
          sender: "bot",
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setMessages(prevMessages => [...prevMessages, botMessage]);
      } else {
        const errorText = data.message || `Erro ao processar PDF (${response.status}).`;
        const errorMessage: Message = {
          id: generateId(),
          text: errorText,
          sender: "bot",
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setMessages(prevMessages => [...prevMessages, errorMessage]);
      }
    } catch (error) {
      console.error('Erro de rede ao enviar PDF:', error);
      setIsLoading(false);
      
      const networkErrorText = error instanceof Error ? error.message : "Verifique a conexão e o backend.";
      const errorMessage: Message = {
        id: generateId(),
        text: `Falha no upload do PDF: ${networkErrorText}`,
        sender: "bot",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prevMessages => [...prevMessages, errorMessage]);
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
      return result || null;
    } catch (error) {
      console.error('Erro em extractSingleDiv:', error);
      return null;
    }
  };

  const sendExtractedDataToServer = async (extractedData: any) => {
    try {
      const payload = {
        extracted_content: extractedData,
        patient_id: currentPatientId
      };

      const response = await fetch('http://localhost:3001/api/extracted-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
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

      if (combinedData.length > 0) {
        const dados = await sendExtractedDataToServer(combinedData);
        console.log('Resposta do servidor para dados extraídos:', dados);

        if (dados && dados.ai_response) {
            const botResponse: Message = {
                id: generateId(),
                text: dados.ai_response,
                sender: "bot",
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            };
            setMessages(prevMessages => [...prevMessages, botResponse]);
        } else if (dados) {
            console.warn("Servidor respondeu para /extracted-data, mas sem ai_response.");
            const infoMsg: Message = { id: generateId(), text: "Dados da página enviados, mas não houve resposta da IA para exibir.", sender: 'bot', timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) };
            setMessages(prev => [...prev, infoMsg]);
        } else {
            const errorMsg: Message = { id: generateId(), text: "Falha ao enviar ou processar os dados extraídos da página.", sender: 'bot', timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) };
            setMessages(prev => [...prev, errorMsg]);
        }
      } else {
          console.log("Nenhum dado extraído da página para enviar.");
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
  
  const handleSendMessage = useCallback(async (userMessageText: string) => {
    if (!userMessageText.trim() || isLoading) return;

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

      const data = await response.json();

      if (response.ok) {
        if (data.patient_id && !currentPatientId) {
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
        } else if (!data.ai_response && data.message) {
          const infoMsg: Message = { id: generateId(), text: data.message, sender: 'bot', timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) };
          setMessages(prevMessages => [...prevMessages, infoMsg]);
        } else {
          console.error("Resposta do /api/chat OK, mas sem ai_response ou message:", data);
          const errMsg: Message = { id: generateId(), text: "Recebi uma resposta inesperada do servidor.", sender: 'bot', timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) };
          setMessages(prevMessages => [...prevMessages, errMsg]);
        }
      } else {
        const errorText = data.message || `Desculpe, ocorreu um erro no servidor (${response.status}).`;
        console.error(`Erro do backend (${response.status}) ao processar /api/chat:`, errorText);
        const errMsg: Message = { id: generateId(), text: errorText, sender: 'bot', timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) };
        setMessages(prevMessages => [...prevMessages, errMsg]);
      }
    } catch (error) {
      console.error('Erro de rede ao enviar mensagem para /api/chat:', error);
      const networkErrorText = error instanceof Error ? error.message : "Verifique a conexão e o backend.";
      const errMsg: Message = { id: generateId(), text: `Erro de conexão: ${networkErrorText}`, sender: 'bot', timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) };
      setMessages(prevMessages => [...prevMessages, errMsg]);
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, currentPatientId]);
  
  return (
    <>
      <Chat
        messages={messages}
        onSendMessage={handleSendMessage}
        isLoading={isLoading}
        onUploadPdf={handleUploadPdf}
      />
      
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

export default App;