// Chat.tsx
import React, { useState, useEffect, useRef, Key, ReactNode, } from 'react'; 
import { Send } from 'lucide-react';
import './chat.css';
import ReactMarkdown from 'react-markdown'; 

// 1. Atualizar a Interface de Props
interface ChatProps {
  messages: Array<{
    id: Key; // Usar Key como tipo genérico para IDs
    text: ReactNode; // Permitir nós React além de string
    sender: 'user' | 'bot';
    timestamp: string;
  }>;
  // A prop setMessages foi removida.
  // setMessages: React.Dispatch<React.SetStateAction<any>>; 
  onSendMessage: (messageText: string) => void; // Função para notificar App.js
  isLoading: boolean; // Para mostrar feedback de carregamento/desabilitar input
  onUploadPdf?: (file: File) => void; // Novo prop opcional
}

const Chat: React.FC<ChatProps> = ({ messages, onSendMessage, isLoading, onUploadPdf }) => {
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef<null | HTMLDivElement>(null); // Ref para scroll automático
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUploadClick = () => {
    fileInputRef.current?.click(); // Simula clique no input escondido
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onUploadPdf) {
      onUploadPdf(file);
    }
  };

  // Função para scrollar para a última mensagem
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Scrolla para baixo sempre que as mensagens mudarem
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Função chamada ao enviar o formulário
  const handleFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
  e.preventDefault();
  if (newMessage.trim() === "" || isLoading) return;

  // chama a função onSendMessage passada pelo App.tsx
  // App.tsx será responsável por adicionar a mensagem do usuário à UI e enviá-la ao backend.
  onSendMessage(newMessage); 

  setNewMessage(""); // Limpa o campo de input
  };

  return (
    <div className="chat-container">
      <div className="chat-header">
        <h2 className="chat-title">Copilot Médico</h2>
      </div>
  
      {/* Área das Mensagens */}
      <div className="chat-messages">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`chat-message-wrapper ${
              message.sender === 'user' ? 'chat-message-user' : 'chat-message-bot'
            }`}
          >
            <div className="chat-message">
              {/*
                MODIFICAÇÃO PARA RENDERIZAR MARKDOWN:
                - <p> trocado por um <div> com a mesma className "chat-message-text".
                  O Markdown pode gerar elementos de bloco (como listas,
                  múltiplos parágrafos) que não são válidos dentro de um <p>.
                - componente <ReactMarkdown> para renderizar o message.text.
                  String(message.text) garante que estamos passando uma string para o ReactMarkdown,
                  conforme esperado pela biblioteca.
              */}
              <div className="chat-message-text">
                <ReactMarkdown>{String(message.text)}</ReactMarkdown>
              </div>
              <span className="chat-message-timestamp">{message.timestamp}</span>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="chat-message-wrapper chat-message-bot">
            <div className="chat-message">
              <p className="chat-message-text chat-loading-indicator"><i>Digitando...</i></p>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
  
      {/* Formulário de Input + Upload */}
      <form onSubmit={handleFormSubmit} className="chat-form">
        {/* Botão de Upload PDF */}
        <input
          type="file"
          accept="application/pdf"
          style={{ display: 'none' }}
          ref={fileInputRef}
          onChange={handleFileChange}
        />
        <button
          type="button"
          className="chat-send-button"
          onClick={handleUploadClick}
          disabled={isLoading}
          title="Enviar PDF"
         style={{ fontSize: "1.3rem" }} 
        >
           📤
        </button>
  
        {/* Campo de texto */}
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder={isLoading ? "Aguardando resposta..." : "Digite sua mensagem..."}
          className="chat-input"
          disabled={isLoading}
        />
  
        {/* Botão de Enviar */}
        <button
          type="submit"
          className="chat-send-button"
          disabled={isLoading || newMessage.trim() === ""}
        >
          <Send size={24} />
        </button>
      </form>
    </div>
  );
  
};

export default Chat;