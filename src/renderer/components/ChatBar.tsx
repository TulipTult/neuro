import React, { useState } from 'react';

interface ChatMessage {
  id: number;
  text: string;
  role: 'user' | 'system';
  full?: string; // full content sent to model (may include hidden prefix)
}

export const ChatBar: React.FC = function ChatBar() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [modelOptions, setModelOptions] = useState(['gemini-2.5-pro', 'gemini-1.5-flash', 'gemini-1.5-pro']);
  const [model, setModel] = useState('gemini-2.5-pro');
  const [temperature, setTemperature] = useState(0.7);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    const scanned: { name: string; count: number | null }[] =
      (window as any).scannedComponents || [];
    const prefix = scanned.length
      ? 'Scanned components:\n' +
        scanned
          .map(c => `- ${c.name}${c.count == null ? '' : ` x ${c.count}`}`)
          .join('\n') +
        '\n\n'
      : '';
    const hiddenInstruction =
      'Answer briefly (under ~120 words). Include pinouts for any component with pins as compact bullets (Pin: Function). No extra commentary.';
    const userVisible = input.trim();
    const combinedText = prefix + hiddenInstruction + '\n\n' + userVisible;

    const userMsg: ChatMessage = {
      id: Date.now(),
      text: userVisible, // show only user input
      full: combinedText, // send prefix + input
      role: 'user'
    };
    const convo = [...messages, userMsg];
    setMessages(convo);
    setInput('');
    setLoading(true);
    setError(null);
    try {
      const payload = {
        messages: convo.map(m => ({
          role: m.role === 'user' ? 'user' : 'model',
          content: m.full ?? m.text
        })),
        model,
        temperature,
      };
      const res = await window.electron?.ipcRenderer.invoke('chat-send', payload);
      const replyText = res?.text ?? '(error)';
      const aiMsg: ChatMessage = {
        id: Date.now() + 1,
        text: replyText,
        role: 'system',
      };
      setMessages(m => [...m, aiMsg]);
      if (res?.fallback) {
        setModel(res.usedModel || 'gemini-2.5-pro');
        setError(res.note || 'Fallback applied');
      } else if (res?.error) {
        setError(replyText);
      }
    } catch (e: any) {
      setError(e.message || 'Failed');
    } finally {
      setLoading(false);
    }
  };

  const onKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') sendMessage();
  };

  return (
    <aside className="chat-bar">
      <div className="chat-settings">
        <select
          className="chat-setting-input"
          title="Model"
          value={model}
          onChange={(e) => setModel(e.target.value)}
        >
          {modelOptions.map(m => <option key={m} value={m}>{m}</option>)}
        </select>
        <input
          className="chat-setting-input"
          type="number"
          step="0.1"
          min="0"
          max="1"
          title="Temperature"
          value={temperature}
          onChange={(e) => setTemperature(Number(e.target.value))}
        />
      </div>
      <div className="chat-messages">
        {messages.map((msg) => (
          <div key={msg.id} className={`chat-msg chat-msg-${msg.role}`}>
            {msg.text}
          </div>
        ))}
        {loading && <div className="chat-msg chat-msg-system">...</div>}
        {error && <div className="chat-error">{error}</div>}
      </div>
      <div className="chat-input-row">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={onKey}
          placeholder="Message"
          disabled={loading}
        />
        <button type="button" onClick={sendMessage} disabled={loading}>
          {loading ? 'Sending' : 'Send'}
        </button>
      </div>
    </aside>
  );
};

export default ChatBar;
