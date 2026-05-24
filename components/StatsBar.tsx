'use client';

import { useState, useEffect } from 'react';
const API = process.env.NEXT_PUBLIC_API_URL;

export default function StatsBar() {
  const [chunks, setChunks] = useState<number | null>(null);

  useEffect(() => {
    fetch('${API}/stats')
      .then(r => r.json())
      .then(d => setChunks(d.total_chunks))
      .catch(() => {});

    const interval = setInterval(() => {
      fetch('${API}/stats')
        .then(r => r.json())
        .then(d => setChunks(d.total_chunks))
        .catch(() => {});
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  if (chunks === null) return null;

  return (
    <div className="stats">
      <span className="dot" />
      <span>{chunks} chunks indexed</span>
      <style jsx>{`
        .stats {
          display: flex; align-items: center; gap: 6px;
          font-size: 11px; color: #3a3a30;
        }
        .dot {
          width: 6px; height: 6px; border-radius: 50%;
          background: #6a9a60;
        }
      `}</style>
    </div>
  );
}
