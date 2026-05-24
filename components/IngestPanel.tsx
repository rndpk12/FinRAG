'use client';

import { useState } from 'react';

export default function IngestPanel({ onClose }: { onClose: () => void }) {
  const [url, setUrl] = useState('');
  const [label, setLabel] = useState('');
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function ingestUrl() {
    if (!url.trim()) return;
    setLoading(true);
    setStatus(null);
    setError(null);

    try {
      const res = await fetch('http://localhost:8000/ingest/url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim(), label: label.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.detail || 'Ingestion failed');
      } else {
        setStatus(`✓ ${data.message} — ${data.inserted} chunks added (${data.total_chunks} total)`);
        setUrl('');
        setLabel('');
      }
    } catch (e) {
      setError('Could not connect to backend');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="panel">
      <div className="panel-header">
        <h3>Add Documents</h3>
        <p>Index a URL — news articles, Wikipedia pages, or any public financial content.</p>
      </div>

      <div className="form">
        <div className="field">
          <label>URL</label>
          <input
            type="text"
            value={url}
            onChange={e => setUrl(e.target.value)}
            placeholder="https://en.wikipedia.org/wiki/Stock_market"
            disabled={loading}
          />
        </div>
        <div className="field">
          <label>Label (optional)</label>
          <input
            type="text"
            value={label}
            onChange={e => setLabel(e.target.value)}
            placeholder="Stock Market Overview"
            disabled={loading}
          />
        </div>
        <button className="ingest-submit" onClick={ingestUrl} disabled={loading || !url.trim()}>
          {loading ? 'Indexing...' : 'Index Document'}
        </button>
      </div>

      {status && <div className="status-ok">{status}</div>}
      {error && <div className="status-err">✕ {error}</div>}

      <div className="examples">
        <p className="examples-label">Try these:</p>
        {[
          'https://en.wikipedia.org/wiki/Stock_market',
          'https://en.wikipedia.org/wiki/Inflation',
          'https://en.wikipedia.org/wiki/Federal_Reserve',
        ].map(u => (
          <button key={u} className="example-url" onClick={() => setUrl(u)}>{u}</button>
        ))}
      </div>

      <style jsx>{`
        .panel { max-width: 600px; }
        .panel-header { margin-bottom: 20px; }
        .panel-header h3 {
          font-family: 'Fraunces', serif; font-size: 18px;
          font-weight: 300; color: #e8e4d9; margin-bottom: 4px;
        }
        .panel-header p { font-size: 12px; color: #5a5a50; line-height: 1.6; }

        .form { display: flex; flex-direction: column; gap: 12px; }
        .field { display: flex; flex-direction: column; gap: 6px; }
        label { font-size: 11px; color: #5a5a50; letter-spacing: 0.06em; text-transform: uppercase; }
        input {
          background: #141410; border: 1px solid #2a2a24;
          color: #e8e4d9; font-family: 'DM Mono', monospace;
          font-size: 13px; padding: 10px 12px; outline: none;
          transition: border-color 0.15s;
        }
        input:focus { border-color: #c8b560; }
        input::placeholder { color: #3a3a30; }
        input:disabled { opacity: 0.5; }

        .ingest-submit {
          background: #c8b560; border: none; color: #0a0a08;
          font-family: 'DM Mono', monospace; font-size: 13px;
          padding: 11px 20px; cursor: pointer; font-weight: 500;
          transition: background 0.15s; align-self: flex-start;
        }
        .ingest-submit:hover:not(:disabled) { background: #e8d570; }
        .ingest-submit:disabled { opacity: 0.4; cursor: not-allowed; }

        .status-ok {
          margin-top: 12px; font-size: 12px; color: #6a9a60;
          border-left: 2px solid #6a9a60; padding-left: 10px;
        }
        .status-err {
          margin-top: 12px; font-size: 12px; color: #9a4a40;
          border-left: 2px solid #9a4a40; padding-left: 10px;
        }

        .examples { margin-top: 20px; display: flex; flex-direction: column; gap: 6px; }
        .examples-label { font-size: 11px; color: #3a3a30; margin-bottom: 4px; text-transform: uppercase; letter-spacing: 0.06em; }
        .example-url {
          background: transparent; border: none;
          color: #3a3a30; font-family: 'DM Mono', monospace;
          font-size: 11px; cursor: pointer; text-align: left; padding: 0;
          transition: color 0.15s;
        }
        .example-url:hover { color: #c8b560; }
      `}</style>
    </div>
  );
}
