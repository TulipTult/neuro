import React, { useState } from 'react';

interface ChatMessage {
  id: number;
  text: string;
  role: 'user' | 'system';
}

export const ChatBar: React.FC = function ChatBar() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: 1, text: 'Welcome to the chat!', role: 'system' },
  ]);
  const [input, setInput] = useState('');

  const sendMessage = () => {
    if (!input.trim()) return;
    setMessages((m) => [
      ...m,
      { id: Date.now(), text: input.trim(), role: 'user' },
    ]);
    setInput('');
  };

  const onKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      sendMessage();
    }
  };

  return (
    <aside className="chat-bar">
      <div className="chat-messages">
        {messages.map((msg) => (
          <div key={msg.id} className={`chat-msg chat-msg-${msg.role}`}>
            {msg.text}
          </div>
        ))}
      </div>
      <div className="chat-input-row">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={onKey}
          placeholder="Type a message..."
        />
        <button type="button" onClick={sendMessage}>
          Send
        </button>
      </div>
    </aside>
  );
};

export default ChatBar;
