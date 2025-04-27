// Chat.jsx
import { JSXElementConstructor, Key, ReactElement, ReactNode, ReactPortal, useState } from 'react';
import { Send } from 'lucide-react';
import './chat.css'; // Vamos criar este arquivo em seguida



interface ChatProps {
  messages: any;
  setMessages: any;
}

const Chat: React.FC<ChatProps> = ({ messages, setMessages }) => {

  const [newMessage, setNewMessage] = useState("");
  
  

  const sendMessage = (e : any) => {
    e.preventDefault();
    if (newMessage.trim() === "") return;

    const message = {
      id: messages.length + 1,
      text: newMessage,
      sender: "user",
      timestamp: new Date().toLocaleTimeString()
    };

    setMessages([...messages, message]);
    setNewMessage("");

    setTimeout(() => {
      const botResponse = {
        id: messages.length + 2,
        text: "Obrigado pela sua mensagem! Esta é uma resposta automática.",
        sender: "bot",
        timestamp: new Date().toLocaleTimeString()
      };
      setMessages((prev: any) => [...prev, botResponse]);
    }, 1000);
  };

  

  return (
    <div className="chat-container">
      <div className="chat-header">
        <h2 className="chat-title">Copilot Médico</h2>
      </div>

      <div className="chat-messages">
        {messages.map((message: { id: Key | null | undefined; sender: string; text: string | number | boolean | ReactElement<any, string | JSXElementConstructor<any>> | Iterable<ReactNode> | ReactPortal | null | undefined; timestamp: string | number | boolean | ReactElement<any, string | JSXElementConstructor<any>> | Iterable<ReactNode> | ReactPortal | null | undefined; }) => (
          <div
            key={message.id}
            className={`chat-message-wrapper ${
              message.sender === 'user' ? 'chat-message-user' : 'chat-message-bot'
            }`}
          >
            <div className="chat-message">
              <p className="chat-message-text">{message.text}</p>
              <span className="chat-message-timestamp">{message.timestamp}</span>
            </div>
          </div>
        ))}
      </div>

      <form onSubmit={sendMessage} className="chat-form">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Digite sua mensagem..."
          className="chat-input"
        />
        <button type="submit" className="chat-send-button">
          <Send size={20} />
        </button>
      </form>
    </div>
  );
};

export default Chat;