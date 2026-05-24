"use client";

import {
  useState,
  useRef,
  useEffect,
  useCallback
} from "react";

import { useRouter } from "next/navigation";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface HistoryItem {
  id: string;
  title: string;
  preview: string;
}

const QUICK_PROMPTS = [
  {
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/>
      </svg>
    ),
    color: "#f5a623",
    bg: "#fff8ee",
    label: "Analyze NVIDIA's latest earnings and future growth potential.",
  },
  {
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>
      </svg>
    ),
    color: "#7c6ef5",
    bg: "#f3f1ff",
    label: "What are the top AI stocks to watch this quarter?",
  },
  {
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>
      </svg>
    ),
    color: "#3dbf7e",
    bg: "#edfbf3",
    label: "Explain today's market movement in simple terms.",
  },
  {
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
      </svg>
    ),
    color: "#e05c7a",
    bg: "#fff0f3",
    label: "Compare Tesla vs Apple as long-term investments.",
  },
];

const MOCK_HISTORY: HistoryItem[] = [
  { id: "h1", title: "NVIDIA Q1 2025 earnings", preview: "Revenue beat by 12%, data center..." },
  { id: "h2", title: "AI semiconductor outlook", preview: "Demand for H100 chips remains..." },
  { id: "h3", title: "Fed rate impact on bonds", preview: "Duration risk increases as yield..." },
  { id: "h4", title: "Tesla vs BYD analysis", preview: "Market share in China continues..." },
  { id: "h5", title: "S&P 500 sector rotation", preview: "Energy and financials leading..." },
  { id: "h6", title: "Inflation data breakdown", preview: "Core CPI came in at 3.2% YoY..." },
];

function parseMarkdown(text: string): string {
  return text
    .replace(/```(\w+)?\n?([\s\S]*?)```/g, (_: string, lang: string, code: string) =>
      `<pre class="code-block" data-lang="${lang || ""}"><code>${code.replace(/</g, "&lt;").replace(/>/g, "&gt;").trim()}</code></pre>`
    )
    .replace(/`([^`]+)`/g, '<code class="inline-code">$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/\*([^*]+)\*/g, "<em>$1</em>")
    .replace(/^### (.+)$/gm, '<h3 class="md-h3">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 class="md-h2">$1</h2>')
    .replace(/^# (.+)$/gm, '<h1 class="md-h1">$1</h1>')
    .replace(/^\d+\. (.+)$/gm, (_: string, item: string, offset: number, str: string) => {
      const match = str.slice(0, offset).match(/^\d+\. /gm);
      const num = match ? match.length + 1 : 1;
      return `<div class="numbered-item"><span class="num-badge">${num}</span><span>${item}</span></div>`;
    })
    .replace(/^[-•] (.+)$/gm, '<li class="md-li">$1</li>')
    .replace(/(<li[^>]*>.*?<\/li>\n?)+/g, (m: string) => `<ul class="md-ul">${m}</ul>`)
    .replace(/\n\n/g, '</p><p class="md-p">')
    .replace(/\n/g, "<br/>");
}

function TypingDots() {
  return (
    <div className="typing-dots">
      <span /><span /><span />
    </div>
  );
}

// SVG Icons
const IconChat = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>;
const IconFolder = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>;
const IconList = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>;
const IconFileText = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>;
const IconGlobe = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>;
const IconClock = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>;
const IconSettings = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2"/></svg>;
const IconHelp = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>;
const IconMenu = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>;
const IconSearch = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>;
const IconSend = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>;
const IconPaperclip = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>;
const IconMic = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>;
const IconBook = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>;
const IconCopy = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>;
const IconShare = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg>;
const IconThumbUp = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3H14z"/><path d="M7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/></svg>;
const IconThumbDown = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3H10z"/><path d="M17 2h2.67A2.31 2.31 0 0 1 22 4v7a2.31 2.31 0 0 1-2.33 2H17"/></svg>;
const IconRefresh = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>;
const IconQuestion = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>;
const IconGift = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 12 20 22 4 22 4 12"/><rect x="2" y="7" width="20" height="5"/><line x1="12" y1="22" x2="12" y2="7"/><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/></svg>;
const IconGrid = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>;
const IconSun = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>;
const IconMoon = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>;

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [charCount, setCharCount] = useState(0);
  const [historyItems] = useState<HistoryItem[]>(MOCK_HISTORY);
  const [user, setUser] = useState<any>(null);
  const [activeHistory, setActiveHistory] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [historyOpen, setHistoryOpen] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const MAX_CHARS = 3000;
  const router = useRouter();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  useEffect(() => {
  const token = localStorage.getItem("token");

  if (!token) {
    router.push("/login");
    return;
  }

  const storedUser = localStorage.getItem("user");

  if (storedUser) {
    setUser(JSON.parse(storedUser));
  }
}, [router]);

  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = Math.min(ta.scrollHeight, 140) + "px";
  }, [query]);

  const sendMessage = useCallback(
    async (text?: string) => {
      const content = (text ?? query).trim();
      if (!content || loading) return;
      const userMsg: Message = { id: crypto.randomUUID(), role: "user", content, timestamp: new Date() };
      setMessages((p) => [...p, userMsg]);
      setQuery("");
      setCharCount(0);
      setLoading(true);
      if (textareaRef.current) textareaRef.current.style.height = "auto";
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/chat`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query: content, session_id: user?.email || "default"}),
        });
        const data = await res.json();
        setMessages((p) => [
          ...p,
          { id: crypto.randomUUID(), role: "assistant", content: data.answer || "No response received.", timestamp: new Date() },
        ]);
      } catch {
        setMessages((p) => [
          ...p,
          { id: crypto.randomUUID(), role: "assistant", content: "⚠️ Cannot reach FinRAG server at `http://127.0.0.1:8000`. Please check the backend is running.", timestamp: new Date() },
        ]);
      } finally {
        setLoading(false);
        setTimeout(() => textareaRef.current?.focus(), 50);
      }
    },
    [query, loading]
  );

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  const isEmpty = messages.length === 0;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        :root {
          --bg: #f7f7f5;
          --surface: #ffffff;
          --border: #e8e6e1;
          --border2: #d4d1ca;
          --text: #1a1917;
          --text2: #6b6860;
          --text3: #a8a49e;
          --accent: #1a1917;
          --accent2: #2d2b28;
          --nav-w: 220px;
          --hist-w: 240px;
          --radius: 10px;
          --radius-sm: 7px;
          --radius-lg: 14px;
          --font: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
          --font-mono: 'SF Mono', 'Fira Code', monospace;
          --shadow-sm: 0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04);
          --shadow-md: 0 4px 12px rgba(0,0,0,0.08), 0 2px 4px rgba(0,0,0,0.04);
        }
        html, body, #__next { height: 100%; }
        body { font-family: var(--font); background: var(--bg); color: var(--text); font-size: 14px; -webkit-font-smoothing: antialiased; }

        .shell { display: flex; height: 100dvh; overflow: hidden; }

        /* ── LEFT SIDEBAR ── */
        .sidebar {
          width: var(--nav-w);
          background: var(--surface);
          border-right: 1px solid var(--border);
          display: flex; flex-direction: column;
          flex-shrink: 0;
          transition: width 0.22s cubic-bezier(0.4,0,0.2,1);
          overflow: hidden;
        }
        .sidebar.collapsed { width: 0; border: none; }

        .sidebar-logo {
          display: flex; align-items: center; gap: 9px;
          padding: 17px 16px 15px;
          border-bottom: 1px solid var(--border);
          flex-shrink: 0;
        }
        .logo-mark {
          width: 28px; height: 28px;
          background: var(--accent);
          border-radius: 7px;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
        }
        .logo-mark svg { display: block; }
        .logo-text {
          font-size: 15px; font-weight: 600;
          letter-spacing: -0.02em; white-space: nowrap;
          color: var(--text);
        }

        .sidebar-search {
          margin: 10px 10px 4px;
          display: flex; align-items: center; gap: 7px;
          background: var(--bg);
          border: 1px solid var(--border);
          border-radius: var(--radius-sm);
          padding: 6px 10px;
          transition: border-color 0.15s;
        }
        .sidebar-search:focus-within { border-color: var(--border2); }
        .sidebar-search input {
          border: none; background: transparent; outline: none;
          font-family: var(--font); font-size: 12.5px; color: var(--text);
          flex: 1; min-width: 0;
        }
        .sidebar-search input::placeholder { color: var(--text3); }
        .search-kbd {
          font-size: 10px; color: var(--text3);
          background: var(--border); padding: 1px 5px;
          border-radius: 4px; font-family: var(--font-mono); white-space: nowrap;
        }

        .nav-section { padding: 6px 8px 0; flex: 1; overflow-y: auto; }
        .nav-item {
          display: flex; align-items: center; gap: 8px;
          padding: 7px 10px;
          border-radius: var(--radius-sm);
          cursor: pointer; color: var(--text2);
          font-size: 13px; font-weight: 400;
          transition: all 0.12s;
          white-space: nowrap; user-select: none; position: relative;
        }
        .nav-item:hover { background: var(--bg); color: var(--text); }
        .nav-item.active { background: var(--bg); color: var(--text); font-weight: 500; }
        .nav-item.active::before {
          content: '';
          position: absolute; left: 0; top: 50%;
          transform: translateY(-50%);
          width: 2.5px; height: 14px;
          background: var(--accent);
          border-radius: 0 2px 2px 0;
        }
        .nav-icon { display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .new-badge {
          margin-left: auto;
          font-size: 9px; font-weight: 600;
          background: var(--accent); color: #fff;
          padding: 2px 6px; border-radius: 20px;
          letter-spacing: 0.04em; text-transform: uppercase;
        }
        .nav-divider {
          font-size: 10.5px; color: var(--text3); font-weight: 500;
          padding: 12px 10px 3px; text-transform: uppercase; letter-spacing: 0.06em;
        }

        .theme-row {
          display: flex; gap: 6px; padding: 8px 10px;
          border-top: 1px solid var(--border);
        }
        .theme-btn {
          flex: 1; padding: 6px 0; border-radius: 7px;
          border: 1px solid var(--border); background: transparent;
          font-family: var(--font); font-size: 12px; cursor: pointer;
          color: var(--text2); display: flex; align-items: center;
          justify-content: center; gap: 5px; transition: all 0.15s;
          font-weight: 400;
        }
        .theme-btn:hover { background: var(--bg); color: var(--text); }
        .theme-btn.active { border-color: var(--border2); background: var(--bg); color: var(--text); font-weight: 500; }

        .sidebar-user {
          padding: 11px 14px;
          border-top: 1px solid var(--border);
          display: flex; align-items: center; gap: 9px;
        }
        .user-avatar {
          width: 28px; height: 28px; border-radius: 50%;
          background: #d4f0e3;
          display: flex; align-items: center; justify-content: center;
          font-size: 11px; font-weight: 600; color: #1a6644; flex-shrink: 0;
          letter-spacing: 0.02em;
        }
        .user-info { flex: 1; min-width: 0; }
        .user-name { font-size: 12.5px; font-weight: 500; color: var(--text); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .user-email { font-size: 11px; color: var(--text3); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

        /* ── MAIN ── */
        .main { flex: 1; display: flex; flex-direction: column; min-width: 0; background: var(--bg); }

        .topbar {
          height: 50px;
          background: var(--surface);
          border-bottom: 1px solid var(--border);
          display: flex; align-items: center;
          padding: 0 18px; gap: 10px; flex-shrink: 0;
        }
        .topbar-toggle {
          width: 28px; height: 28px;
          border: 1px solid var(--border); border-radius: 7px;
          background: transparent;
          display: flex; align-items: center; justify-content: center;
          cursor: pointer; color: var(--text2);
          transition: all 0.12s; flex-shrink: 0;
        }
        .topbar-toggle:hover { background: var(--bg); color: var(--text); }
        .topbar-title { font-size: 14px; font-weight: 500; color: var(--text); flex: 1; }
        .topbar-actions { display: flex; gap: 6px; align-items: center; }
        .icon-btn {
          width: 28px; height: 28px;
          border: 1px solid var(--border); border-radius: 7px;
          background: transparent;
          display: flex; align-items: center; justify-content: center;
          cursor: pointer; color: var(--text2);
          transition: all 0.12s;
        }
        .icon-btn:hover { background: var(--bg); color: var(--text); }

        /* ── Chat body ── */
        .chat-body { flex: 1; overflow-y: auto; padding: 0 20px; scroll-behavior: smooth; }
        .chat-body::-webkit-scrollbar { width: 4px; }
        .chat-body::-webkit-scrollbar-track { background: transparent; }
        .chat-body::-webkit-scrollbar-thumb { background: var(--border2); border-radius: 4px; }
        .chat-inner {
          max-width: 680px; margin: 0 auto;
          padding: 24px 0 12px;
          display: flex; flex-direction: column; gap: 0;
          min-height: 100%;
        }

        /* ── Welcome ── */
        .welcome {
          flex: 1; display: flex; flex-direction: column;
          align-items: center; justify-content: center;
          text-align: center; padding: 0 0 40px;
          animation: fadeUp 0.4s ease both;
        }
        @keyframes fadeUp { from { opacity:0; transform:translateY(14px); } to { opacity:1; transform:translateY(0); } }
        .welcome-title {
          font-size: clamp(26px, 3.5vw, 36px);
          font-weight: 600; letter-spacing: -0.03em;
          color: var(--text); margin-bottom: 10px; line-height: 1.15;
        }
        .welcome-sub {
          font-size: 13.5px; color: var(--text2); line-height: 1.65;
          max-width: 360px; margin-bottom: 32px; font-weight: 400;
        }

        .prompts-grid {
          display: grid; grid-template-columns: repeat(2, 1fr);
          gap: 9px; width: 100%; max-width: 560px;
        }
        .prompt-card {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: var(--radius);
          padding: 13px 15px;
          cursor: pointer;
          transition: border-color 0.18s, box-shadow 0.18s, transform 0.18s;
          text-align: left; display: flex; align-items: flex-start; gap: 11px;
        }
        .prompt-card:hover {
          border-color: var(--border2);
          box-shadow: var(--shadow-md);
          transform: translateY(-2px);
        }
        .prompt-card:active { transform: translateY(0); box-shadow: var(--shadow-sm); }
        .prompt-icon-wrap {
          width: 32px; height: 32px; border-radius: 8px;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
        }
        .prompt-text-wrap { flex: 1; min-width: 0; }
        .prompt-label {
          font-size: 12.5px; font-weight: 500; color: var(--text);
          line-height: 1.45;
          display: -webkit-box; -webkit-line-clamp: 2;
          -webkit-box-orient: vertical; overflow: hidden;
        }
        .prompt-plus {
          width: 18px; height: 18px;
          border: 1px solid var(--border2); border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          font-size: 14px; color: var(--text3);
          flex-shrink: 0; margin-top: 1px; line-height: 1;
        }

        /* ── Messages ── */
        .msg-group { display: flex; flex-direction: column; gap: 18px; animation: fadeUp 0.3s ease both; }
        .msg-row { display: flex; gap: 11px; align-items: flex-start; }
        .msg-avatar {
          width: 26px; height: 26px; border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          font-size: 11px; font-weight: 600; flex-shrink: 0; margin-top: 2px;
          letter-spacing: 0.02em;
        }
        .msg-avatar.user { background: #e3e0f8; color: #4b3fc0; }
        .msg-avatar.asst { background: var(--accent); color: #fff; font-size: 11px; }
        .msg-content { flex: 1; min-width: 0; }
        .msg-name { font-size: 11.5px; font-weight: 600; color: var(--text); margin-bottom: 4px; }
        .msg-text { font-size: 13.5px; line-height: 1.7; color: var(--text); }

        /* numbered items */
        .numbered-item {
          display: flex; gap: 10px; align-items: baseline;
          margin: 5px 0; font-size: 13.5px; line-height: 1.65;
        }
        .num-badge {
          font-size: 11px; font-weight: 600; color: var(--text2);
          min-width: 16px; flex-shrink: 0;
        }

        /* actions row */
        .msg-actions {
          display: flex; align-items: center; gap: 4px;
          margin-top: 10px; padding-top: 10px;
          border-top: 1px solid var(--border);
        }
        .action-btn {
          display: flex; align-items: center; gap: 4px;
          padding: 4px 9px; border-radius: 6px;
          border: 1px solid var(--border); background: transparent;
          font-family: var(--font); font-size: 11.5px; color: var(--text2);
          cursor: pointer; transition: all 0.12s;
        }
        .action-btn:hover { background: var(--bg); color: var(--text); }
        .action-spacer { flex: 1; }
        .action-model { display: flex; align-items: center; gap: 5px; font-size: 11px; color: var(--text3); }
        .model-dot { width: 6px; height: 6px; border-radius: 50%; background: #3dbf7e; }

        .regenerate-row { display: flex; justify-content: center; margin: 8px 0 4px; }
        .regen-btn {
          display: flex; align-items: center; gap: 6px;
          padding: 6px 16px; border-radius: 20px;
          border: 1px solid var(--border2); background: var(--surface);
          font-family: var(--font); font-size: 12.5px; color: var(--text2);
          cursor: pointer; transition: all 0.12s; font-weight: 500;
        }
        .regen-btn:hover { background: var(--bg); color: var(--text); }

        /* md styles */
        .md-p { margin-bottom: 7px; }
        .md-p:last-child { margin-bottom: 0; }
        .md-h1 { font-size: 18px; font-weight: 600; margin: 10px 0 5px; letter-spacing: -0.02em; }
        .md-h2 { font-size: 15px; font-weight: 600; margin: 9px 0 4px; }
        .md-h3 { font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.07em; color: var(--text2); margin: 9px 0 3px; }
        .md-ul { list-style: none; padding-left: 0; margin: 5px 0; }
        .md-li { padding: 2px 0 2px 14px; position: relative; font-size: 13.5px; }
        .md-li::before { content: '—'; position: absolute; left: 0; color: var(--text3); }
        .inline-code { font-family: var(--font-mono); font-size: 11.5px; background: var(--bg); border: 1px solid var(--border); padding: 1px 5px; border-radius: 4px; color: var(--text); }
        .code-block { background: #1a1917; border: 1px solid #2d2b28; border-radius: 9px; padding: 13px 16px; overflow-x: auto; margin: 7px 0; position: relative; }
        .code-block::before { content: attr(data-lang); position: absolute; top: 7px; right: 12px; font-size: 10px; font-family: var(--font-mono); color: #6b6860; text-transform: uppercase; letter-spacing: 0.06em; }
        .code-block code { font-family: var(--font-mono); font-size: 12px; line-height: 1.6; color: #c9d1d9; }

        /* typing */
        .typing-dots { display: flex; gap: 5px; align-items: center; padding: 4px 0; }
        .typing-dots span { width: 6px; height: 6px; border-radius: 50%; background: var(--border2); animation: blink 1.2s ease infinite; }
        .typing-dots span:nth-child(2) { animation-delay: 0.2s; }
        .typing-dots span:nth-child(3) { animation-delay: 0.4s; }
        @keyframes blink { 0%,100%{opacity:0.3;transform:scale(0.8)} 50%{opacity:1;transform:scale(1.1)} }

        /* ── INPUT ── */
        .input-zone { padding: 10px 20px 14px; background: var(--bg); flex-shrink: 0; }
        .input-box {
          max-width: 680px; margin: 0 auto;
          background: var(--surface);
          border: 1px solid var(--border2);
          border-radius: var(--radius-lg);
          overflow: hidden;
          transition: border-color 0.18s, box-shadow 0.18s;
        }
        .input-box:focus-within {
          border-color: #b5b1aa;
          box-shadow: 0 0 0 3px rgba(0,0,0,0.04);
        }
        .input-row {
          display: flex; align-items: flex-end; gap: 10px;
          padding: 11px 12px 9px 14px;
        }
        .chat-textarea {
          flex: 1; border: none; outline: none; resize: none;
          font-family: var(--font); font-size: 13.5px; color: var(--text);
          background: transparent; line-height: 1.6;
          min-height: 22px; max-height: 140px;
          caret-color: var(--accent);
        }
        .chat-textarea::placeholder { color: var(--text3); }
        .send-btn {
          width: 30px; height: 30px; border-radius: 7px;
          border: none; cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0; transition: all 0.12s;
        }
        .send-btn:not(:disabled) { background: var(--accent); color: #fff; }
        .send-btn:not(:disabled):hover { background: var(--accent2); transform: scale(1.05); }
        .send-btn:not(:disabled):active { transform: scale(0.95); }
        .send-btn:disabled { background: var(--border); color: var(--text3); cursor: not-allowed; }

        .input-footer-bar {
          display: flex; align-items: center;
          padding: 7px 14px 9px;
          border-top: 1px solid var(--border);
        }
        .footer-action {
          display: flex; align-items: center; gap: 5px;
          padding: 3px 10px 3px 0; margin-right: 2px;
          font-size: 12px; color: var(--text2);
          cursor: pointer; background: none; border: none;
          font-family: var(--font); transition: color 0.12s;
        }
        .footer-action:hover { color: var(--text); }
        .footer-sep { width: 1px; height: 13px; background: var(--border); margin: 0 4px; }
        .char-count { margin-left: auto; font-size: 11px; color: var(--text3); font-family: var(--font-mono); }

        .disclaimer {
          max-width: 680px; margin: 7px auto 0;
          text-align: center; font-size: 11px; color: var(--text3); line-height: 1.5;
        }

        /* ── RIGHT HISTORY PANEL ── */
        .history-panel {
          width: var(--hist-w); background: var(--surface);
          border-left: 1px solid var(--border);
          display: flex; flex-direction: column; flex-shrink: 0;
          transition: width 0.22s cubic-bezier(0.4,0,0.2,1); overflow: hidden;
        }
        .history-panel.collapsed { width: 0; border: none; }
        .history-header {
          display: flex; align-items: center; justify-content: space-between;
          padding: 13px 13px 11px;
          border-bottom: 1px solid var(--border); flex-shrink: 0;
        }
        .history-title { font-size: 12.5px; font-weight: 600; color: var(--text); display: flex; align-items: center; gap: 6px; }
        .history-count {
          font-size: 10.5px; color: var(--text3);
          background: var(--bg); border: 1px solid var(--border);
          padding: 1px 6px; border-radius: 20px;
        }
        .hist-add-btn {
          width: 22px; height: 22px; border-radius: 5px;
          border: 1px solid var(--border); background: transparent;
          display: flex; align-items: center; justify-content: center;
          cursor: pointer; color: var(--text2); font-size: 16px;
          transition: all 0.12s; line-height: 1;
        }
        .hist-add-btn:hover { background: var(--bg); color: var(--text); }
        .history-list { flex: 1; overflow-y: auto; padding: 7px; }
        .history-list::-webkit-scrollbar { width: 3px; }
        .history-list::-webkit-scrollbar-thumb { background: var(--border); border-radius: 3px; }
        .history-new {
          display: flex; align-items: center; gap: 6px;
          padding: 8px 9px; border-radius: var(--radius-sm);
          cursor: pointer; border: 1px dashed var(--border2);
          margin-bottom: 7px; transition: all 0.12s;
        }
        .history-new:hover { background: var(--bg); border-color: var(--text3); }
        .history-new-label { font-size: 12.5px; color: var(--text2); font-weight: 500; }
        .history-new-sub { font-size: 11px; color: var(--text3); }
        .hist-item {
          padding: 8px 9px; border-radius: var(--radius-sm);
          cursor: pointer; transition: all 0.12s; margin-bottom: 1px;
        }
        .hist-item:hover { background: var(--bg); }
        .hist-item.active { background: var(--bg); }
        .hist-item-title { font-size: 12.5px; font-weight: 500; color: var(--text); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-bottom: 2px; }
        .hist-item-preview { font-size: 11px; color: var(--text3); line-height: 1.4; display: -webkit-box; -webkit-line-clamp: 1; -webkit-box-orient: vertical; overflow: hidden; }

        @media (max-width: 900px) { .history-panel { display: none; } }
        @media (max-width: 640px) {
          .sidebar { display: none; }
          .input-zone { padding: 9px 12px 12px; }
          .prompts-grid { grid-template-columns: 1fr; }
        }
      `}</style>

      <div className="shell">
        {/* LEFT SIDEBAR */}
        <aside className={`sidebar ${sidebarOpen ? "" : "collapsed"}`}>
          <div className="sidebar-logo">
            <div className="logo-mark">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/>
                <polyline points="16 7 22 7 22 13"/>
              </svg>
            </div>
            <span className="logo-text">FinRAG</span>
          </div>

          <div className="sidebar-search">
            <IconSearch />
            <input type="text" placeholder="Search" />
            <span className="search-kbd">⌘K</span>
          </div>

          <nav className="nav-section">
            <div className="nav-item active">
              <span className="nav-icon"><IconChat /></span>
              AI Chat
            </div>
            <div className="nav-item">
              <span className="nav-icon"><IconFolder /></span>
              Projects
            </div>
            <div className="nav-item">
              <span className="nav-icon"><IconList /></span>
              Watchlists
            </div>
            <div className="nav-item">
              <span className="nav-icon"><IconFileText /></span>
              Reports
              <span className="new-badge">New</span>
            </div>
            <div className="nav-item">
              <span className="nav-icon"><IconGlobe /></span>
              Markets
            </div>
            <div className="nav-item">
              <span className="nav-icon"><IconClock /></span>
              History
            </div>
            <div className="nav-divider">Settings &amp; Help</div>
            <div className="nav-item">
              <span className="nav-icon"><IconSettings /></span>
              Settings
            </div>
            <div
  className="nav-item"
  onClick={() => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    router.push("/login");
  }}
>
  <span className="nav-icon">↩</span>
  Logout
</div>
          </nav>

          <div className="theme-row">
            <button className="theme-btn">
              <IconSun /> Light
            </button>
            <button className="theme-btn active">
              <IconMoon /> Dark
            </button>
          </div>

          <div className="sidebar-user">
            <div className="user-avatar">
              {user?.name?.charAt(0)?.toUpperCase() || "F"}
           </div>
            <div className="user-info">
              <div className="user-name">
  {user?.name || "FinRAG User"}
</div>

<div className="user-email">
  {user?.email || "user@finrag.ai"}
</div>
            </div>
          </div>
        </aside>

        {/* MAIN */}
        <div className="main">
          <div className="topbar">
            <button className="topbar-toggle" onClick={() => setSidebarOpen((s) => !s)} title="Toggle sidebar">
              <IconMenu />
            </button>
            <span className="topbar-title">AI Chat</span>
            <div className="topbar-actions">
              <button className="icon-btn" title="Help"><IconQuestion /></button>
              <button className="icon-btn" title="Share"><IconGift /></button>
              <button className="icon-btn" onClick={() => setHistoryOpen((h) => !h)} title="Toggle history">
                <IconGrid />
              </button>
            </div>
          </div>

          <div className="chat-body">
            <div className="chat-inner">
              {isEmpty ? (
                <div className="welcome">
                  <h1 className="welcome-title">Welcome to FinRAG</h1>
                  <p className="welcome-sub">
                    Get started by asking a question — your AI research analyst is ready. Not sure where to start?
                  </p>
                  <div className="prompts-grid">
                    {QUICK_PROMPTS.map((p) => (
                      <button key={p.label} className="prompt-card" onClick={() => sendMessage(p.label)}>
                        <div className="prompt-icon-wrap" style={{ background: p.bg, color: p.color }}>
                          {p.icon}
                        </div>
                        <div className="prompt-text-wrap">
                          <span className="prompt-label">{p.label}</span>
                        </div>
                        <div className="prompt-plus">+</div>
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="msg-group">
                  {messages.map((msg, i) => {
                    const isUser = msg.role === "user";
                    const isLast = i === messages.length - 1;
                    const html = isUser ? msg.content : `<p class="md-p">${parseMarkdown(msg.content)}</p>`;
                    return (
                      <div key={msg.id}>
                        <div className="msg-row">
                          <div className={`msg-avatar ${isUser ? "user" : "asst"}`}>
                            {isUser ? "U" : "F"}
                          </div>
                          <div className="msg-content">
                            <div className="msg-name">{isUser ? "You" : "FinRAG"}</div>
                            <div className="msg-text" dangerouslySetInnerHTML={{ __html: html }} />
                            {!isUser && (
                              <div className="msg-actions">
                                <div className="action-model">
                                  <div className="model-dot" />
                                  FinRAG v1.0
                                </div>
                                <button className="action-btn" onClick={() => navigator.clipboard?.writeText(msg.content)}>
                                  <IconCopy /> Copy
                                </button>
                                <button className="action-btn">
                                  <IconShare /> Share
                                </button>
                                <button className="action-btn"><IconThumbUp /></button>
                                <button className="action-btn"><IconThumbDown /></button>
                              </div>
                            )}
                          </div>
                        </div>
                        {!isUser && isLast && !loading && (
                          <div className="regenerate-row">
                            <button className="regen-btn" onClick={() => {
                              const lastUser = [...messages].reverse().find(m => m.role === "user");
                              if (lastUser) sendMessage(lastUser.content);
                            }}>
                              <IconRefresh /> Regenerate
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                  {loading && (
                    <div className="msg-row">
                      <div className="msg-avatar asst">F</div>
                      <div className="msg-content">
                        <div className="msg-name">FinRAG</div>
                        <TypingDots />
                      </div>
                    </div>
                  )}
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </div>

          <div className="input-zone">
            <div className="input-box">
              <div className="input-row">
                <textarea
                  ref={textareaRef}
                  className="chat-textarea"
                  value={query}
                  rows={1}
                  placeholder="Send a message"
                  onChange={(e) => {
                    if (e.target.value.length <= MAX_CHARS) {
                      setQuery(e.target.value);
                      setCharCount(e.target.value.length);
                    }
                  }}
                  onKeyDown={handleKeyDown}
                />
                <button
                  className="send-btn"
                  onClick={() => sendMessage()}
                  disabled={loading || !query.trim()}
                  title="Send (Enter)"
                >
                  <IconSend />
                </button>
              </div>
              <div className="input-footer-bar">
                <button className="footer-action"><IconPaperclip /> Attach</button>
                <div className="footer-sep" />
                <button className="footer-action"><IconMic /> Voice Message</button>
                <div className="footer-sep" />
                <button className="footer-action"><IconBook /> Browse Prompts</button>
                <span className="char-count">{charCount} / {MAX_CHARS.toLocaleString()}</span>
              </div>
            </div>
            <p className="disclaimer">
              FinRAG may generate inaccurate information about markets or financials. Model: FinRAG v1.0
            </p>
          </div>
        </div>

        {/* RIGHT HISTORY PANEL */}
        <aside className={`history-panel ${historyOpen ? "" : "collapsed"}`}>
          <div className="history-header">
            <div className="history-title">
              History
              <span className="history-count">{historyItems.length}</span>
            </div>
            <button className="hist-add-btn" title="New chat" onClick={() => setMessages([])}>···</button>
          </div>
          <div className="history-list">
            <div className="history-new" onClick={() => setMessages([])}>
              <div>
                <div className="history-new-label">+ New Chat</div>
                <div className="history-new-sub">Start a fresh session</div>
              </div>
            </div>
            {historyItems.map((item) => (
              <div
                key={item.id}
                className={`hist-item ${activeHistory === item.id ? "active" : ""}`}
                onClick={() => setActiveHistory(item.id)}
              >
                <div className="hist-item-title">{item.title}</div>
                <div className="hist-item-preview">{item.preview}</div>
              </div>
            ))}
          </div>
        </aside>
      </div>
    </>
  );
}
