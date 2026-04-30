import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';

const seedConversations = [
  {
    id: 'admin-support',
    name: 'Election Support',
    preview: 'How can we help with your voting process?',
    messages: [
      { id: 1, from: 'admin', body: 'Welcome to Voice of Citizens support. Share your question and an administrator will reply.' },
      { id: 2, from: 'me', body: 'I want to confirm my registration status.' },
    ],
  },
  {
    id: 'registration-help',
    name: 'Registration Review',
    preview: 'Document and approval questions',
    messages: [
      { id: 1, from: 'admin', body: 'Please upload a clear NID document if your profile is incomplete.' },
    ],
  },
];

export default function Chats() {
  const { isAdmin } = useAuth();
  const [activeId, setActiveId] = useState(seedConversations[0].id);
  const [message, setMessage] = useState('');
  const active = seedConversations.find((conversation) => conversation.id === activeId);

  return (
    <section className="page">
      <header className="page-header">
        <p className="page-eyebrow">{isAdmin ? 'Admin inbox' : 'Support chat'}</p>
        <h1>Chats</h1>
        <p>{isAdmin ? 'View active citizen conversations and respond to requests.' : 'Start a chat with an admin and view previous messages.'}</p>
      </header>

      <div className="card chat-layout">
        <aside className="chat-list">
          {seedConversations.map((conversation) => (
            <button
              type="button"
              key={conversation.id}
              className={`conversation ${conversation.id === activeId ? 'active' : ''}`}
              onClick={() => setActiveId(conversation.id)}
            >
              <span>{conversation.name}</span>
              <small>{conversation.preview}</small>
            </button>
          ))}
        </aside>
        <main className="chat-thread">
          <h2>{active.name}</h2>
          <div className="message-list">
            {active.messages.map((item) => (
              <div key={item.id} className={`message ${item.from === 'me' ? 'mine' : ''}`}>{item.body}</div>
            ))}
          </div>
          <form className="chat-input" onSubmit={(e) => e.preventDefault()}>
            <input className="form-input" value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Type a message..." />
            <button className="btn" type="submit">Send</button>
          </form>
        </main>
      </div>
    </section>
  );
}
