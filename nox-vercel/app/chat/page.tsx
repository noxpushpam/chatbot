'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface User {
  id: string;
  username: string;
  full_name: string;
  profile_pic: string;
  is_online: boolean;
  last_seen?: string;
  unread: number;
}

interface Message {
  id: string;
  sender_id: string;
  message: string | null;
  image: string | null;
  view_once?: boolean;
  already_viewed?: boolean;
  is_mine: boolean;
  created_at: string;
}

export default function ChatPage() {
  const router = useRouter();
  const [me, setMe] = useState<any>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [otherUser, setOtherUser] = useState<any>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState('');
  const [image, setImage] = useState<File | null>(null);
  const [viewOnce, setViewOnce] = useState(false);
  const [preview, setPreview] = useState('');
  const [search, setSearch] = useState('');
  const [notifs, setNotifs] = useState<any[]>([]);
  const [unreadNotif, setUnreadNotif] = useState(0);
  const [showNotif, setShowNotif] = useState(false);
  const [showAI, setShowAI] = useState(false);
  const [aiQ, setAiQ] = useState('');
  const [aiA, setAiA] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const pollRef = useRef<any>(null);

  useEffect(() => {
    fetch('/api/auth/me')
      .then((r) => {
        if (!r.ok) throw new Error();
        return r.json();
      })
      .then(setMe)
      .catch(() => router.push('/login'));
  }, []);

  useEffect(() => {
    if (!me) return;
    loadUsers();
    loadNotifs();
    const i = setInterval(loadNotifs, 8000);
    return () => clearInterval(i);
  }, [me]);

  useEffect(() => {
    if (!selected) return;
    loadMessages(selected);
    pollRef.current = setInterval(() => loadMessages(selected, true), 2500);
    return () => clearInterval(pollRef.current);
  }, [selected]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function loadUsers(q = search) {
    const res = await fetch(`/api/users?q=${encodeURIComponent(q)}`);
    const data = await res.json();
    setUsers(data.users || []);
  }

  async function loadMessages(userId: string, isPoll = false) {
    const res = await fetch(`/api/messages?user_id=${userId}`);
    const data = await res.json();
    if (data.other_user) setOtherUser(data.other_user);
    if (!isPoll) {
      setMessages(data.messages || []);
    } else {
      setMessages((prev) => {
        const ids = new Set(prev.map((m) => m.id));
        const newOnes = (data.messages || []).filter((m: Message) => !ids.has(m.id));
        return newOnes.length ? [...prev, ...newOnes] : prev;
      });
    }
  }

  async function loadNotifs() {
    const res = await fetch('/api/notifications');
    const data = await res.json();
    setNotifs(data.notifications || []);
    setUnreadNotif(data.unread_count || 0);
  }

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!selected || (!text.trim() && !image)) return;

    const fd = new FormData();
    fd.append('receiver_id', selected);
    if (text.trim()) fd.append('message', text.trim());
    if (image) fd.append('image', image);
    if (viewOnce) fd.append('view_once', '1');

    const res = await fetch('/api/send', { method: 'POST', body: fd });
    const data = await res.json();
    if (data.success) {
      setMessages((prev) => [...prev, data.message]);
      setText('');
      setImage(null);
      setPreview('');
      setViewOnce(false);
      loadUsers();
    } else {
      alert(data.error || 'Failed');
    }
  }

  async function openViewOnce(msgId: string) {
    await fetch('/api/view-once', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message_id: msgId }),
    });
    // Refresh messages after a delay
    setTimeout(() => selected && loadMessages(selected), 3500);
  }

  async function askAI() {
    if (!aiQ.trim()) return;
    setAiLoading(true);
    setAiA('');
    const res = await fetch('/api/ai', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question: aiQ }),
    });
    const data = await res.json();
    setAiA(data.answer || data.error || 'Error');
    setAiLoading(false);
  }

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  }

  function onImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (f) {
      setImage(f);
      setPreview(URL.createObjectURL(f));
    }
  }

  if (!me) {
    return <div style={{ padding: 40, textAlign: 'center' }}>Loading...</div>;
  }

  return (
    <div style={{ display: 'flex', height: '100vh' }}>
      {/* Sidebar */}
      <aside style={{ width: 320, background: 'var(--bg-card)', borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: 16, borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {me.profile_pic ? (
              <img src={me.profile_pic} alt="" style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover' }} />
            ) : (
              <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {me.username[0].toUpperCase()}
              </div>
            )}
            <div>
              <div style={{ fontWeight: 600 }}>{me.full_name || me.username}</div>
              <div style={{ fontSize: 12, color: 'var(--online)' }}>Online</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <button onClick={() => setShowNotif(!showNotif)} style={iconBtn}>
              🔔 {unreadNotif > 0 && <span style={badge}>{unreadNotif}</span>}
            </button>
            <Link href="/profile" style={iconBtn}>⚙️</Link>
            <button onClick={logout} style={iconBtn}>🚪</button>
          </div>
        </div>

        <div style={{ padding: 12 }}>
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); loadUsers(e.target.value); }}
            placeholder="Search users..."
            style={{ width: '100%', padding: '10px 12px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 10, color: 'var(--text)' }}
          />
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: 8 }}>
          {users.map((u) => (
            <div
              key={u.id}
              onClick={() => setSelected(u.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: 12, padding: 12, borderRadius: 12, cursor: 'pointer',
                background: selected === u.id ? 'var(--bg-hover)' : 'transparent',
              }}
            >
              {u.profile_pic ? (
                <img src={u.profile_pic} alt="" style={{ width: 44, height: 44, borderRadius: '50%', objectFit: 'cover' }} />
              ) : (
                <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {u.username[0].toUpperCase()}
                </div>
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600 }}>{u.full_name}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{u.is_online ? 'Online' : 'Offline'}</div>
              </div>
              {u.unread > 0 && <span style={badge}>{u.unread}</span>}
            </div>
          ))}
        </div>
      </aside>

      {/* Chat */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {!selected ? (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>💬</div>
              <h2>Welcome to Nox</h2>
              <p>Select a user to start chatting</p>
            </div>
          </div>
        ) : (
          <>
            <div style={{ padding: '12px 20px', background: 'var(--bg-card)', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 12 }}>
              {otherUser?.profile_pic ? (
                <img src={otherUser.profile_pic} alt="" style={{ width: 40, height: 40, borderRadius: '50%' }} />
              ) : (
                <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {otherUser?.username?.[0]?.toUpperCase()}
                </div>
              )}
              <div>
                <div style={{ fontWeight: 600 }}>{otherUser?.full_name || '...'}</div>
                <div style={{ fontSize: 13, color: otherUser?.is_online ? 'var(--online)' : 'var(--text-muted)' }}>
                  {otherUser?.is_online ? 'Online' : 'Offline'}
                </div>
              </div>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: 20, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {messages.map((m) => (
                <div key={m.id} style={{ alignSelf: m.is_mine ? 'flex-end' : 'flex-start', maxWidth: '70%' }}>
                  {m.view_once && m.image && !m.is_mine && !m.already_viewed ? (
                    <div
                      onClick={() => openViewOnce(m.id)}
                      style={{ position: 'relative', cursor: 'pointer', maxWidth: 260 }}
                    >
                      <img src={m.image} alt="" style={{ width: '100%', borderRadius: 12, filter: 'blur(14px)' }} />
                      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.45)', borderRadius: 12, fontWeight: 600 }}>
                        🔥 View Once
                      </div>
                    </div>
                  ) : m.view_once && m.already_viewed && !m.is_mine ? (
                    <div style={{ color: 'var(--text-muted)', fontStyle: 'italic', fontSize: 13 }}>📷 Photo opened (View Once)</div>
                  ) : m.image ? (
                    <div>
                      {m.view_once && <div style={{ color: '#fbbf24', fontSize: 12, marginBottom: 4 }}>🔥 View Once</div>}
                      <img src={m.image} alt="" style={{ maxWidth: 260, borderRadius: 12 }} />
                    </div>
                  ) : null}
                  {m.message && (
                    <div style={{
                      padding: '10px 14px',
                      borderRadius: 16,
                      background: m.is_mine ? 'var(--primary)' : 'var(--bg-hover)',
                      marginTop: m.image ? 4 : 0,
                    }}>
                      {m.message}
                    </div>
                  )}
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4, textAlign: m.is_mine ? 'right' : 'left' }}>
                    {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              ))}
              <div ref={bottomRef} />
            </div>

            <div style={{ padding: 12, background: 'var(--bg-card)', borderTop: '1px solid var(--border)' }}>
              {preview && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                  <img src={preview} alt="" style={{ height: 60, borderRadius: 8 }} />
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#fbbf24', fontSize: 13 }}>
                    <input type="checkbox" checked={viewOnce} onChange={(e) => setViewOnce(e.target.checked)} />
                    View Once 🔥
                  </label>
                  <button onClick={() => { setImage(null); setPreview(''); setViewOnce(false); }} style={{ background: 'var(--danger)', border: 'none', color: 'white', borderRadius: '50%', width: 24, height: 24, cursor: 'pointer' }}>×</button>
                </div>
              )}
              <form onSubmit={sendMessage} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <label style={iconBtn}>
                  📷
                  <input type="file" accept="image/*" hidden onChange={onImageChange} />
                </label>
                <button type="button" onClick={() => setShowAI(true)} style={iconBtn}>🤖</button>
                <input
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Type a message..."
                  style={{ flex: 1, padding: '12px 16px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 24, color: 'var(--text)' }}
                />
                <button type="submit" style={{ ...iconBtn, background: 'var(--primary)', color: 'white' }}>➤</button>
              </form>
            </div>
          </>
        )}
      </main>

      {/* Notif panel */}
      {showNotif && (
        <div style={{ position: 'absolute', top: 60, left: 20, width: 300, maxHeight: 360, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden', zIndex: 50 }}>
          <div style={{ padding: 12, borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between' }}>
            <strong>Notifications</strong>
            <button onClick={() => setShowNotif(false)}>×</button>
          </div>
          <div style={{ maxHeight: 300, overflowY: 'auto' }}>
            {notifs.length === 0 && <div style={{ padding: 20, color: 'var(--text-muted)' }}>No notifications</div>}
            {notifs.map((n) => (
              <div key={n.id} onClick={() => { setSelected(n.from_user_id); setShowNotif(false); }} style={{ padding: 12, borderBottom: '1px solid var(--border)', cursor: 'pointer', background: n.is_read ? 'transparent' : 'rgba(99,102,241,0.1)' }}>
                <div style={{ fontSize: 13 }}><strong>{n.from_name}</strong>: {n.content}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* AI Modal */}
      {showAI && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ background: 'var(--bg-card)', borderRadius: 16, width: '90%', maxWidth: 420, padding: 20, border: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
              <h3>🤖 Nox AI Help</h3>
              <button onClick={() => setShowAI(false)}>×</button>
            </div>
            <textarea
              value={aiQ}
              onChange={(e) => setAiQ(e.target.value)}
              placeholder="Kya help chahiye?"
              rows={3}
              style={{ width: '100%', padding: 12, background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 10, color: 'var(--text)', marginBottom: 12 }}
            />
            <button className="btn" onClick={askAI} disabled={aiLoading}>
              {aiLoading ? 'Thinking...' : 'Ask AI'}
            </button>
            {aiA && (
              <div style={{ marginTop: 14, padding: 12, background: 'var(--bg)', borderRadius: 10, whiteSpace: 'pre-wrap', fontSize: 14, maxHeight: 220, overflowY: 'auto' }}>
                <strong>Nox AI:</strong><br />{aiA}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

const iconBtn: React.CSSProperties = {
  width: 36,
  height: 36,
  borderRadius: '50%',
  border: 'none',
  background: 'transparent',
  color: 'var(--text-muted)',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  position: 'relative',
  fontSize: 16,
};

const badge: React.CSSProperties = {
  position: 'absolute',
  top: -4,
  right: -4,
  background: 'var(--danger)',
  color: 'white',
  fontSize: 10,
  minWidth: 16,
  height: 16,
  borderRadius: 8,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '0 4px',
};
