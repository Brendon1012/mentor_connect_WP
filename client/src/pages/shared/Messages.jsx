import { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ArrowLeft, MessageSquare, Send } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext.jsx';
import useDocumentTitle from '../../hooks/useDocumentTitle.js';
import { messageService } from '../../services/resources.js';
import { getErrorMessage } from '../../services/api.js';
import Avatar from '../../components/ui/Avatar.jsx';
import Button from '../../components/ui/Button.jsx';
import { EmptyState, ErrorState, PageLoader } from '../../components/ui/States.jsx';
import { formatDate, formatTime, timeAgo } from '../../utils/formatters.js';
import './Messages.css';

const POLL_MS = 10000;
const MAX = 1000;

// Runs `fn` every `ms` while the browser tab is visible (no wasted requests in background tabs).
function usePolling(fn, ms, enabled = true) {
  const fnRef = useRef(fn);
  fnRef.current = fn;
  useEffect(() => {
    if (!enabled) return undefined;
    const id = setInterval(() => {
      if (document.visibilityState === 'visible') fnRef.current();
    }, ms);
    return () => clearInterval(id);
  }, [ms, enabled]);
}

function Thread({ otherId, onSent, onBack }) {
  const { user } = useAuth();
  const [thread, setThread] = useState(null);
  const [error, setError] = useState('');
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);
  const lastCount = useRef(0);

  const load = useCallback(
    async (initial) => {
      try {
        const data = await messageService.thread(otherId);
        setThread(data);
        setError('');
      } catch (err) {
        // A failed background refresh should not wipe a conversation that is already shown.
        if (initial) setError(getErrorMessage(err));
      }
    },
    [otherId]
  );

  useEffect(() => {
    setThread(null);
    setError('');
    lastCount.current = 0;
    load(true);
  }, [load]);
  usePolling(() => load(false), POLL_MS, !error);

  // Scroll to the newest message only when the number of messages grows.
  useEffect(() => {
    const count = thread?.messages.length || 0;
    if (count > lastCount.current) bottomRef.current?.scrollIntoView({ block: 'end' });
    lastCount.current = count;
  }, [thread]);

  async function send(e) {
    e?.preventDefault();
    const clean = text.trim();
    if (!clean || sending || clean.length > MAX) return;
    setSending(true);
    try {
      const { message } = await messageService.send(otherId, clean);
      setThread((t) => ({ ...t, messages: [...t.messages, message] }));
      setText('');
      onSent();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Message not sent'));
    } finally {
      setSending(false);
    }
  }

  if (error) return <div className="thread-empty"><ErrorState message={error} onRetry={() => load(true)} compact /></div>;
  if (!thread) return <PageLoader label="Loading conversation..." />;

  let lastDay = '';
  return (
    <div className="thread">
      <header className="thread-head">
        <button type="button" className="btn btn-ghost btn-icon thread-back" onClick={onBack} aria-label="Back to conversations">
          <ArrowLeft aria-hidden="true" />
        </button>
        <Avatar name={thread.user?.name || '?'} src={thread.user?.avatarUrl} size={40} />
        <div>
          <strong>{thread.user?.name}</strong>
          <div className="small muted">{thread.user?.role === 'mentor' ? thread.user?.mentorProfile?.title || 'Mentor' : `Student · ${thread.user?.department || ''}`}</div>
        </div>
      </header>

      <div className="thread-body" aria-live="polite" aria-label={`Conversation with ${thread.user?.name}`}>
        {thread.messages.length === 0 && (
          <p className="muted text-center small" style={{ marginTop: 40 }}>No messages yet. Say hello!</p>
        )}
        {thread.messages.map((m) => {
          const day = formatDate(m.createdAt);
          const showDay = day !== lastDay;
          lastDay = day;
          const mine = m.sender === user._id;
          return (
            <div key={m._id}>
              {showDay && <div className="day-divider"><span>{day}</span></div>}
              <div className={`bubble ${mine ? 'mine' : 'theirs'}`}>
                <p>{m.text}</p>
                <span className="bubble-time">
                  {formatTime(m.createdAt)}
                  {mine && <span className="sr-only">{m.read ? ', read' : ', sent'}</span>}
                  {mine && <span aria-hidden="true"> · {m.read ? 'Read' : 'Sent'}</span>}
                </span>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <form className="composer" onSubmit={send}>
        <label htmlFor="message-input" className="sr-only">Type a message</label>
        <textarea
          id="message-input"
          className="textarea"
          rows={2}
          value={text}
          maxLength={MAX}
          placeholder="Write a message. Enter to send, Shift+Enter for a new line."
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              send();
            }
          }}
        />
        <div className="composer-side">
          <span className={`char-count ${text.length > MAX - 50 ? 'over' : ''}`}>{text.length}/{MAX}</span>
          <Button type="submit" variant="primary" loading={sending} disabled={!text.trim()} aria-label="Send message">
            <Send aria-hidden="true" />
          </Button>
        </div>
      </form>
    </div>
  );
}

export default function Messages() {
  useDocumentTitle('Messages');
  const { user } = useAuth();
  const [params, setParams] = useSearchParams();
  const activeId = params.get('with');
  const [convos, setConvos] = useState(null);
  const [error, setError] = useState('');

  const loadConvos = useCallback(async (initial) => {
    try {
      const data = await messageService.conversations();
      setConvos(data.conversations);
      setError('');
    } catch (err) {
      if (initial) setError(getErrorMessage(err));
    }
  }, []);

  useEffect(() => {
    loadConvos(true);
  }, [loadConvos, activeId]); // re-fetch when switching threads so unread counts clear
  usePolling(() => loadConvos(false), POLL_MS);

  if (error && !convos) return <ErrorState message={error} onRetry={() => loadConvos(true)} />;
  if (!convos) return <PageLoader />;

  if (convos.length === 0 && !activeId) {
    return (
      <EmptyState
        icon={MessageSquare}
        title="No conversations yet"
        message={user.role === 'student' ? 'You can message a mentor once they accept your request.' : 'You can message students once you accept their requests.'}
        action={<Button to={user.role === 'student' ? '/mentors' : '/mentor/requests'} variant="primary" size="sm">{user.role === 'student' ? 'Find a mentor' : 'Review requests'}</Button>}
      />
    );
  }

  return (
    <div className={`messages ${activeId ? 'has-active' : ''}`}>
      <aside className="convo-list" aria-label="Conversations">
        <h1 className="convo-title">Messages</h1>
        <ul>
          {convos.map(({ user: u, lastMessage, unread }) => (
            <li key={u._id}>
              <button
                type="button"
                className={`convo ${activeId === u._id ? 'active' : ''}`}
                onClick={() => setParams({ with: u._id })}
                aria-current={activeId === u._id ? 'true' : undefined}
              >
                <Avatar name={u.name} src={u.avatarUrl} size={40} />
                <span className="convo-main">
                  <span className="convo-name">{u.name}</span>
                  <span className="convo-preview">
                    {lastMessage ? `${lastMessage.sender === user._id ? 'You: ' : ''}${lastMessage.text}` : 'No messages yet'}
                  </span>
                </span>
                <span className="convo-side">
                  {lastMessage && <span className="convo-time">{timeAgo(lastMessage.createdAt)}</span>}
                  {unread > 0 && <span className="dash-count" aria-label={`${unread} unread`}>{unread}</span>}
                </span>
              </button>
            </li>
          ))}
        </ul>
        <p className="small muted convo-note">Messages refresh every 10 seconds.</p>
      </aside>
      <section className="thread-pane">
        {activeId ? (
          <Thread otherId={activeId} onSent={() => loadConvos(false)} onBack={() => setParams({})} />
        ) : (
          <div className="thread-empty">
            <EmptyState compact icon={MessageSquare} title="Select a conversation" message="Choose someone on the left to read and send messages." />
          </div>
        )}
      </section>
    </div>
  );
}
