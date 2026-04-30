import { useEffect, useMemo, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import apiClient from '../../api/apiClient';
import { useAuth } from '../../context/AuthContext';

function getSocketUrl() {
  const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
  return apiBase.replace(/\/api\/?$/, '');
}

function getConversationName(conversation, isAdmin) {
  if (!conversation) return 'Conversation';
  if (isAdmin) return conversation.user?.name || conversation.user?.email || 'Citizen';
  return conversation.admin?.name || 'Election Support';
}

function formatTime(value) {
  if (!value) return '';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '' : date.toLocaleString();
}

export default function Chats() {
  const { user, token, isAdmin } = useAuth();
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const [conversations, setConversations] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState('');
  const [newChat, setNewChat] = useState({ subject: '', message: '' });
  const [creatingChat, setCreatingChat] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const activeIdRef = useRef(null);

  const active = useMemo(
    () => conversations.find((conversation) => conversation._id === activeId) || null,
    [activeId, conversations],
  );

  useEffect(() => {
    activeIdRef.current = activeId;
  }, [activeId]);

  useEffect(() => {
    if (!token) return undefined;

    const nextSocket = io(getSocketUrl(), {
      auth: { token },
      transports: ['websocket', 'polling'],
    });

    nextSocket.on('connect', () => setConnected(true));
    nextSocket.on('disconnect', () => setConnected(false));
    nextSocket.on('connect_error', (err) => setError(err.message || 'Unable to connect to chat server.'));
    nextSocket.on('conversation:updated', (conversation) => {
      setConversations((prev) => {
        const exists = prev.some((item) => item._id === conversation._id);
        const next = exists
          ? prev.map((item) => (item._id === conversation._id ? conversation : item))
          : [conversation, ...prev];
        return next.sort((a, b) => new Date(b.lastMessageAt || b.updatedAt) - new Date(a.lastMessageAt || a.updatedAt));
      });
      setActiveId((current) => current || conversation._id);
    });
    nextSocket.on('conversation:created', (conversation) => {
      setConversations((prev) => {
        if (prev.some((item) => item._id === conversation._id)) return prev;
        return [conversation, ...prev];
      });
      setActiveId((current) => current || conversation._id);
    });
    nextSocket.on('message:new', (incoming) => {
      setMessages((prev) => {
        if (prev.some((item) => item._id === incoming._id)) return prev;
        const conversationId = incoming.conversation?._id || incoming.conversation;
        if (conversationId !== activeIdRef.current) return prev;
        return [...prev, incoming];
      });
    });

    setSocket(nextSocket);
    return () => nextSocket.disconnect();
  }, [token]);

  useEffect(() => {
    async function loadConversations() {
      setLoading(true);
      setError('');
      try {
        if (isAdmin) {
          const { data } = await apiClient.get('/chats');
          setConversations(data);
          setActiveId((current) => current || data[0]?._id || null);
        } else {
          const { data } = await apiClient.get('/chats');
          setConversations(data);
          setActiveId((current) => current || data[0]?._id || null);
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Unable to load chats.');
      } finally {
        setLoading(false);
      }
    }

    loadConversations();
  }, [isAdmin]);

  useEffect(() => {
    if (!activeId) {
      setMessages([]);
      return;
    }

    async function loadMessages() {
      try {
        const { data } = await apiClient.get(`/chats/${activeId}/messages`);
        setMessages(data);
        socket?.emit('conversation:join', { conversationId: activeId });
      } catch (err) {
        setError(err.response?.data?.message || 'Unable to load messages.');
      }
    }

    loadMessages();
  }, [activeId, socket]);

  function handleSend(event) {
    event.preventDefault();
    const trimmed = message.trim();
    if (!trimmed || !socket) return;

    socket.emit('message:send', { conversationId: activeId, body: trimmed }, (response) => {
      if (!response?.ok) {
        setError(response?.message || 'Unable to send message.');
        return;
      }
      setError('');
    });
    setMessage('');
  }

  async function handleCreateChat(event) {
    event.preventDefault();
    const subject = newChat.subject.trim();
    const firstMessage = newChat.message.trim();
    if (!subject) {
      setError('Please add a subject for the chat.');
      return;
    }

    setCreatingChat(true);
    setError('');
    try {
      const { data } = await apiClient.post('/chats', {
        subject,
        message: firstMessage,
      });
      setConversations((prev) => [data.conversation, ...prev.filter((item) => item._id !== data.conversation._id)]);
      setActiveId(data.conversation._id);
      setMessages(data.message ? [data.message] : []);
      setNewChat({ subject: '', message: '' });
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to create chat.');
    } finally {
      setCreatingChat(false);
    }
  }

  async function handleCloseConversation() {
    if (!activeId) return;
    try {
      const { data } = await apiClient.patch(`/chats/${activeId}/close`);
      setConversations((prev) => prev.map((item) => (item._id === data._id ? data : item)));
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to close conversation.');
    }
  }

  return (
    <section className="page">
      <header className="page-header">
        <p className="page-eyebrow">{isAdmin ? 'Admin inbox' : 'Support chat'}</p>
        <h1>Chats</h1>
        <p>{isAdmin ? 'View active citizen conversations and reply in real time.' : 'Start a real-time chat with an election administrator.'}</p>
      </header>

      {error && <p className="form-error">{error}</p>}
      {loading && <p className="empty-state">Loading chats...</p>}

      <div className="card chat-layout">
        <aside className="chat-list">
          <div className="chat-status">
            <span className={`badge ${connected ? 'badge-active' : 'badge-pending'}`}>
              {connected ? 'Live' : 'Connecting'}
            </span>
          </div>

          {!isAdmin && (
            <form className="new-chat-form" onSubmit={handleCreateChat}>
              <label className="form-field">
                <span className="form-label">Start a new chat</span>
                <input
                  className="form-input"
                  value={newChat.subject}
                  onChange={(e) => setNewChat((prev) => ({ ...prev, subject: e.target.value }))}
                  placeholder="Subject, e.g. Registration help"
                />
              </label>
              <textarea
                className="form-input"
                rows={3}
                value={newChat.message}
                onChange={(e) => setNewChat((prev) => ({ ...prev, message: e.target.value }))}
                placeholder="Optional first message"
              />
              <button type="submit" className="btn" disabled={creatingChat}>
                {creatingChat ? 'Creating...' : 'New chat'}
              </button>
            </form>
          )}

          {conversations.length === 0 ? (
            <p className="empty-state">No active chats yet.</p>
          ) : (
            conversations.map((conversation) => (
              <button
                type="button"
                key={conversation._id}
                className={`conversation ${conversation._id === activeId ? 'active' : ''}`}
                onClick={() => setActiveId(conversation._id)}
              >
                <span>{isAdmin ? getConversationName(conversation, isAdmin) : conversation.subject}</span>
                {isAdmin && <small>{conversation.subject}</small>}
                <small>{conversation.lastMessage || conversation.subject || 'No messages yet'}</small>
                <small>{formatTime(conversation.lastMessageAt || conversation.updatedAt)}</small>
              </button>
            ))
          )}
        </aside>

        <main className="chat-thread">
          {active ? (
            <>
              <div className="chat-thread-header">
                <div>
                  <h2>{getConversationName(active, isAdmin)}</h2>
                  <p>{active.subject}</p>
                  <p>
                    <span className={`badge ${active.status === 'closed' ? 'badge-finished' : 'badge-active'}`}>
                      {active.status}
                    </span>
                  </p>
                </div>
                {isAdmin && active.status !== 'closed' && (
                  <button type="button" className="btn btn-secondary" onClick={handleCloseConversation}>
                    Close chat
                  </button>
                )}
              </div>

              <div className="message-list">
                {messages.length === 0 ? (
                  <p className="empty-state">No messages yet. Send the first message to begin.</p>
                ) : (
                  messages.map((item) => {
                    const mine = item.sender?._id === user?._id || item.sender === user?._id;
                    return (
                      <div key={item._id} className={`message ${mine ? 'mine' : ''}`}>
                        <strong>{mine ? 'You' : item.sender?.name || 'User'}</strong>
                        <span>{item.body}</span>
                        <small>{formatTime(item.createdAt)}</small>
                      </div>
                    );
                  })
                )}
              </div>

              <form className="chat-input" onSubmit={handleSend}>
                <input
                  className="form-input"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder={active.status === 'closed' ? 'This chat is closed.' : 'Type a message...'}
                  disabled={active.status === 'closed'}
                />
                <button className="btn" type="submit" disabled={!connected || active.status === 'closed'}>
                  Send
                </button>
              </form>
            </>
          ) : (
            <p className="empty-state">Select a conversation to view messages.</p>
          )}
        </main>
      </div>
    </section>
  );
}
