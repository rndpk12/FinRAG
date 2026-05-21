'use client';

import { useState } from 'react';
import { Message } from '@/app/page';

export default function ChatMessage({ message }: { message: Message }) {
  const [showSources, setShowSources] = useState(false);
  const isUser = message.role === 'user';

  return (
    <div className={`msg ${isUser ? 'msg-user' : 'msg-assistant'}`}>
      <div className="msg-label">{isUser ? 'YOU' : 'FINRAG'}</div>
      <div className="msg-content">{message.content}</div>

      {!isUser && message.sources && message.sources.length > 0 && (
        <div className="sources-section">
          <button className="sources-toggle" onClick={() => setShowSources(!showSources)}>
            {showSources ? '▾' : '▸'} {message.sources.length} sources
          </button>
          {showSources && (
            <div className="sources-list">
              {message.sources.map((src, i) => (
                <div key={i} className="source-item">
                  <span className="source-num">[{i + 1}]</span>
                  <span className="source-name">{src}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <style jsx>{`
        .msg { display: flex; flex-direction: column; gap: 6px; }
        .msg-user { align-items: flex-end; }
        .msg-assistant { align-items: flex-start; }

        .msg-label {
          font-size: 10px; letter-spacing: 0.12em;
          color: #3a3a30; font-weight: 500;
        }
        .msg-user .msg-label { color: #c8b560; }

        .msg-content {
          max-width: 680px; font-size: 14px; line-height: 1.8;
          color: #e8e4d9; white-space: pre-wrap;
        }
        .msg-user .msg-content {
          background: #141410; border: 1px solid #2a2a24;
          padding: 12px 16px; color: #c8c4b4;
        }

        .sources-section { margin-top: 8px; }
        .sources-toggle {
          background: transparent; border: none;
          color: #5a5a50; font-family: 'DM Mono', monospace;
          font-size: 11px; cursor: pointer; padding: 0;
          transition: color 0.15s;
        }
        .sources-toggle:hover { color: #c8b560; }

        .sources-list {
          margin-top: 8px; display: flex; flex-direction: column; gap: 4px;
          border-left: 2px solid #1e1e1a; padding-left: 12px;
        }
        .source-item { display: flex; gap: 8px; align-items: baseline; }
        .source-num { color: #c8b560; font-size: 11px; flex-shrink: 0; }
        .source-name { color: #5a5a50; font-size: 12px; }
      `}</style>
    </div>
  );
}
