'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [fullName, setFullName] = useState('');
  const [bio, setBio] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState('');
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch('/api/auth/me')
      .then((r) => {
        if (!r.ok) throw new Error();
        return r.json();
      })
      .then((u) => {
        setUser(u);
        setFullName(u.full_name || '');
        setBio(u.bio || '');
        setPreview(u.profile_pic || '');
      })
      .catch(() => router.push('/login'));
  }, []);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMsg('');

    const fd = new FormData();
    fd.append('full_name', fullName);
    fd.append('bio', bio);
    if (file) fd.append('profile_pic', file);

    const res = await fetch('/api/upload', { method: 'POST', body: fd });
    const data = await res.json();
    setLoading(false);

    if (data.success) {
      setMsg('Profile updated!');
      if (data.profile_pic) setPreview(data.profile_pic);
    } else {
      setMsg(data.error || 'Failed');
    }
  }

  if (!user) return <div style={{ padding: 40 }}>Loading...</div>;

  return (
    <div className="auth-page">
      <div className="auth-card" style={{ maxWidth: 440 }}>
        <Link href="/chat" style={{ fontSize: 14, color: 'var(--text-muted)' }}>← Back to Chat</Link>
        <h1 style={{ marginTop: 12 }}>Edit Profile</h1>

        {msg && <div className={`alert ${msg.includes('updated') ? 'alert-success' : 'alert-error'}`}>{msg}</div>}

        <form onSubmit={save}>
          <div style={{ textAlign: 'center', marginBottom: 20 }}>
            {preview ? (
              <img src={preview} alt="" style={{ width: 100, height: 100, borderRadius: '50%', objectFit: 'cover', border: '3px solid var(--primary)' }} />
            ) : (
              <div style={{ width: 100, height: 100, borderRadius: '50%', background: 'var(--primary)', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36 }}>
                {user.username[0].toUpperCase()}
              </div>
            )}
            <label style={{ display: 'inline-block', marginTop: 10, padding: '6px 14px', background: 'var(--bg)', borderRadius: 20, cursor: 'pointer', fontSize: 13 }}>
              Change Photo
              <input type="file" accept="image/*" hidden onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) { setFile(f); setPreview(URL.createObjectURL(f)); }
              }} />
            </label>
          </div>

          <div className="form-group">
            <label>Username</label>
            <input value={user.username} disabled />
          </div>
          <div className="form-group">
            <label>Email</label>
            <input value={user.email} disabled />
          </div>
          <div className="form-group">
            <label>Full Name</label>
            <input value={fullName} onChange={(e) => setFullName(e.target.value)} />
          </div>
          <div className="form-group">
            <label>Bio</label>
            <textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={3} />
          </div>

          <button className="btn" disabled={loading}>
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      </div>
    </div>
  );
}
