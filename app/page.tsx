"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { SignInButton, SignUpButton, useAuth } from "@clerk/nextjs";

const techStack = [
  { name: "Next.js", role: "Frontend Framework" },
  { name: "FastAPI", role: "Backend Services" },
  { name: "OpenAI", role: "LLM Engine" },
  { name: "LangChain", role: "AI Orchestration" },
  { name: "Pinecone", role: "Vector Database" },
  { name: "Clerk", role: "Authentication" },
  { name: "Redis", role: "Caching Layer" },
  { name: "Vercel", role: "Deployment" },
];

const companies = [
  "Next.js", "FastAPI", "OpenAI", "LangChain",
  "Pinecone", "Clerk", "Redis", "Vercel",
  "Next.js", "FastAPI", "OpenAI", "LangChain",
  "Pinecone", "Clerk", "Redis", "Vercel",
];

const architecture = [
  {
    layer: "01",
    title: "Frontend",
    subtitle: "Next.js + TailwindCSS",
    desc: "A streaming chat interface with real-time token output, document upload, and session history — built on the App Router with server components.",
  },
  {
    layer: "02",
    title: "Backend",
    subtitle: "FastAPI Microservices",
    desc: "Python microservices handle document ingestion, chunking, embedding generation, and query orchestration — all behind authenticated REST endpoints.",
  },
  {
    layer: "03",
    title: "AI Layer",
    subtitle: "LangChain + OpenAI",
    desc: "LangChain pipelines manage retrieval chains, context window injection, and streaming output. GPT-4o powers reasoning and synthesis over retrieved chunks.",
  },
  {
    layer: "04",
    title: "Data Layer",
    subtitle: "Pinecone + Redis",
    desc: "Dense vector embeddings stored in Pinecone enable semantic similarity search. Redis caches embeddings and session state for sub-100ms repeat queries.",
  },
];

const roadmap = [
  { num: "01", title: "Live Market Data Integration", tag: "Q3 2025" },
  { num: "02", title: "Multi-Document Financial Comparison", tag: "Q3 2025" },
  { num: "03", title: "AI-Powered Portfolio Analysis", tag: "Q4 2025" },
  { num: "04", title: "Bloomberg-Style Dashboards", tag: "Q4 2025" },
  { num: "05", title: "PDF Intelligence Extraction", tag: "Q1 2026" },
  { num: "06", title: "Realtime Stock Sentiment Tracking", tag: "Q1 2026" },
];

function useInView(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) setInView(true); },
      { threshold }
    );
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);
  return [ref, inView] as const;
}

function FadeIn({
  children,
  delay = 0,
  className = "",
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  const [ref, inView] = useInView();
  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: inView ? 1 : 0,
        transform: inView ? "translateY(0)" : "translateY(32px)",
        transition: `opacity 0.7s ease ${delay}ms, transform 0.7s ease ${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}

export default function FinRAGPage() {
  const router = useRouter();
  const { isSignedIn, isLoaded } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [showSignUp, setShowSignUp] = useState(false);
  const [signUpForm, setSignUpForm] = useState({ name: "", email: "", password: "", confirmPassword: "" });
  const [signUpError, setSignUpError] = useState("");

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    const onMouse = (e: MouseEvent) => setMousePos({ x: e.clientX, y: e.clientY });
    window.addEventListener("scroll", onScroll);
    window.addEventListener("mousemove", onMouse);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("mousemove", onMouse);
    };
  }, []);

  return (
    <div style={{ fontFamily: "'DM Sans', 'Helvetica Neue', sans-serif", background: "#fff", color: "#000", overflowX: "hidden" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700;800;900&family=DM+Mono:wght@400;500&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        html { scroll-behavior: smooth; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: #fff; }
        ::-webkit-scrollbar-thumb { background: #000; border-radius: 3px; }

        .marquee-track {
          display: flex;
          animation: marquee 28s linear infinite;
          width: max-content;
        }
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .nav-link {
          font-size: 14px;
          font-weight: 500;
          color: #555;
          text-decoration: none;
          transition: color 0.2s;
        }
        .nav-link:hover { color: #000; }
        .btn-primary {
          background: #000;
          color: #fff;
          border: none;
          padding: 14px 32px;
          border-radius: 100px;
          font-size: 15px;
          font-weight: 600;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          transition: background 0.2s, transform 0.2s;
          font-family: inherit;
        }
        .btn-primary:hover { background: #222; transform: scale(1.03); }
        .btn-outline {
          background: transparent;
          color: #000;
          border: 1.5px solid #000;
          padding: 14px 32px;
          border-radius: 100px;
          font-size: 15px;
          font-weight: 500;
          cursor: pointer;
          transition: background 0.2s, color 0.2s;
          font-family: inherit;
        }
        .btn-outline:hover { background: #000; color: #fff; }
        .arch-card {
          border: 1px solid #e5e5e5;
          border-radius: 20px;
          padding: 40px;
          transition: border-color 0.3s, transform 0.3s;
          cursor: default;
        }
        .arch-card:hover { border-color: #000; transform: translateY(-4px); }
        .roadmap-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 28px 36px;
          border: 1px solid #e8e8e8;
          border-radius: 16px;
          transition: border-color 0.3s, background 0.3s;
          cursor: default;
        }
        .roadmap-row:hover { border-color: #000; background: #fafafa; }
        .tag-pill {
          font-size: 12px;
          font-weight: 600;
          color: #888;
          border: 1px solid #ddd;
          border-radius: 100px;
          padding: 4px 12px;
          font-family: 'DM Mono', monospace;
        }
        .cursor-glow {
          position: fixed;
          width: 300px;
          height: 300px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(0,0,0,0.04) 0%, transparent 70%);
          pointer-events: none;
          z-index: 0;
          transition: transform 0.1s;
        }
        .feature-icon {
          width: 48px;
          height: 48px;
          background: #000;
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 20px;
        }
        .section-label {
          font-family: 'DM Mono', monospace;
          font-size: 12px;
          font-weight: 500;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: #888;
          margin-bottom: 16px;
        }
      `}</style>

      {/* Cursor glow */}
      <div
        className="cursor-glow"
        style={{ transform: `translate(${mousePos.x - 150}px, ${mousePos.y - 150}px)` }}
      />

      {/* ── NAVBAR ── */}
      <header
        style={{
          position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
          borderBottom: scrolled ? "1px solid #e8e8e8" : "1px solid transparent",
          backdropFilter: "blur(16px)",
          background: scrolled ? "rgba(255,255,255,0.92)" : "rgba(255,255,255,0)",
          transition: "all 0.3s",
        }}
      >
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 32px", height: 72, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          {/* Logo */}
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 36, height: 36, background: "#000", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ color: "#fff", fontWeight: 800, fontSize: 16 }}>F</span>
            </div>
            <span style={{ fontWeight: 800, fontSize: 18, letterSpacing: "-0.02em" }}>FinRAG</span>
          </div>

          {/* Nav links */}
          <nav style={{ display: "flex", gap: 36 }}>
            {["Features", "Architecture", "Roadmap", "Tech Stack"].map((n) => (
              <a key={n} href={`#${n.toLowerCase().replace(" ", "-")}`} className="nav-link">{n}</a>
            ))}
          </nav>

          {/* Auth buttons */}
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            {!isLoaded ? (
              // Still loading — render nothing to avoid flash
              <div style={{ width: 160 }} />
            ) : isSignedIn ? (
              <button
                className="btn-primary"
                style={{ padding: "10px 22px", fontSize: 14 }}
                onClick={() => router.push("/chat")}
              >
                Go to Chat
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </button>
            ) : (
              <>
                <SignInButton mode="modal">
                  <button
                    style={{
                      background: "none", border: "1.5px solid #e0e0e0", cursor: "pointer",
                      fontSize: 14, fontWeight: 600, color: "#333", fontFamily: "inherit",
                      padding: "9px 20px", borderRadius: 100, transition: "all 0.2s",
                    }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = "#000"; (e.currentTarget as HTMLButtonElement).style.color = "#000"; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = "#e0e0e0"; (e.currentTarget as HTMLButtonElement).style.color = "#333"; }}
                  >
                    Sign In
                  </button>
                </SignInButton>

                <button
                  className="btn-primary"
                  style={{ padding: "10px 22px", fontSize: 14 }}
                  onClick={() => { setSignUpError(""); setSignUpForm({ name: "", email: "", password: "", confirmPassword: "" }); setShowSignUp(true); }}
                >
                  Create Account
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* ── HERO ── */}
      <section style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "120px 32px 80px", position: "relative" }}>
        <div style={{ maxWidth: 900, margin: "0 auto", textAlign: "center" }}>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            background: "#f5f5f5", border: "1px solid #e8e8e8",
            borderRadius: 100, padding: "8px 18px", marginBottom: 48,
            fontSize: 13, fontWeight: 500, color: "#555",
          }}>
            <span style={{ width: 7, height: 7, background: "#22c55e", borderRadius: "50%", display: "inline-block" }} />
            AI-Powered Financial Research — Now in Beta
          </div>

          <h1 style={{ fontSize: "clamp(56px, 9vw, 96px)", fontWeight: 900, lineHeight: 1.0, letterSpacing: "-0.04em", marginBottom: 28 }}>
            Research smarter.<br />Invest with clarity.
          </h1>

          <p style={{ fontSize: 20, color: "#666", lineHeight: 1.7, maxWidth: 600, margin: "0 auto 48px" }}>
            FinRAG combines Retrieval-Augmented Generation, semantic vector search, and GPT-4o to give you instant intelligence over SEC filings, earnings calls, and market reports.
          </p>

          <div style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap" }}>
            <button
              className="btn-primary"
              style={{ fontSize: 16, padding: "16px 36px" }}
              onClick={() => router.push("/chat")}
            >
              Try FinRAG Free
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </button>

            <button
              className="btn-outline"
              style={{ fontSize: 16, padding: "16px 36px" }}
              onClick={() => document.getElementById("architecture")?.scrollIntoView({ behavior: "smooth" })}
            >
              View Architecture
            </button>
          </div>

          <p style={{ marginTop: 28, fontSize: 13, color: "#aaa" }}>No credit card required · Free during beta</p>
        </div>

        {/* Grid background */}
        <div style={{
          position: "absolute", inset: 0, zIndex: -1,
          backgroundImage: "linear-gradient(#e8e8e8 1px, transparent 1px), linear-gradient(90deg, #e8e8e8 1px, transparent 1px)",
          backgroundSize: "64px 64px",
          maskImage: "radial-gradient(ellipse 80% 80% at 50% 50%, black 20%, transparent 100%)",
          WebkitMaskImage: "radial-gradient(ellipse 80% 80% at 50% 50%, black 20%, transparent 100%)",
          opacity: 0.4,
        }} />
      </section>

      {/* ── MARQUEE ── */}
      <section style={{ borderTop: "1px solid #e8e8e8", borderBottom: "1px solid #e8e8e8", padding: "20px 0", overflow: "hidden", background: "#fafafa" }}>
        <p style={{ textAlign: "center", fontSize: 11, fontFamily: "'DM Mono', monospace", letterSpacing: "0.14em", color: "#bbb", textTransform: "uppercase", marginBottom: 18 }}>
          Built on modern AI infrastructure
        </p>
        <div style={{ overflow: "hidden" }}>
          <div className="marquee-track">
            {companies.map((name, i) => (
              <div
                key={i}
                style={{ padding: "10px 40px", fontSize: 22, fontWeight: 800, color: "#ccc", whiteSpace: "nowrap", letterSpacing: "-0.02em", transition: "color 0.3s", cursor: "default" }}
                onMouseEnter={(e) => ((e.target as HTMLDivElement).style.color = "#000")}
                onMouseLeave={(e) => ((e.target as HTMLDivElement).style.color = "#ccc")}
              >
                {name}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section id="features" style={{ padding: "120px 32px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <FadeIn>
            <p className="section-label">Platform Features</p>
            <h2 style={{ fontSize: "clamp(36px, 5vw, 60px)", fontWeight: 900, letterSpacing: "-0.03em", lineHeight: 1.1, marginBottom: 64, maxWidth: 600 }}>
              AI architecture<br />built for finance.
            </h2>
          </FadeIn>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 20 }}>
            {[
              { icon: "🧠", title: "Financial RAG Engine", desc: "Retrieval-augmented generation tuned for SEC filings, earnings calls, and analyst reports. Get cited, grounded answers — not hallucinations." },
              { icon: "🔍", title: "Semantic Vector Search", desc: "Dense embeddings over your financial corpus. Find the relevant paragraph across thousands of documents in milliseconds." },
              { icon: "🔐", title: "Enterprise Security", desc: "Clerk-powered auth, encrypted Pinecone namespaces per user, and zero persistent logging of query content." },
              { icon: "⚡", title: "Streaming Responses", desc: "Token-by-token streaming with FastAPI + Server-Sent Events. Feels instant, even on long synthesis tasks." },
            ].map((f, i) => (
              <FadeIn key={i} delay={i * 80}>
                <div className="arch-card" style={{ height: "100%" }}>
                  <h3 style={{ fontSize: 22, fontWeight: 700, marginBottom: 12, letterSpacing: "-0.02em" }}>{f.title}</h3>
                  <p style={{ fontSize: 15, color: "#666", lineHeight: 1.7 }}>{f.desc}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ── ARCHITECTURE ── */}
      <section id="architecture" style={{ padding: "120px 32px", background: "#000", color: "#fff" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <FadeIn>
            <p style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, letterSpacing: "0.14em", textTransform: "uppercase", color: "#555", marginBottom: 16 }}>
              System Architecture
            </p>
            <h2 style={{ fontSize: "clamp(36px, 5vw, 60px)", fontWeight: 900, letterSpacing: "-0.03em", lineHeight: 1.1, marginBottom: 72, maxWidth: 700 }}>
              Modern full-stack<br />AI infrastructure.
            </h2>
          </FadeIn>

          {/* Flow diagram */}
          <div style={{ display: "flex", alignItems: "center", gap: 0, marginBottom: 64, overflowX: "auto", paddingBottom: 8 }}>
            {["User Query", "Next.js UI", "FastAPI", "LangChain", "Pinecone", "GPT-4o", "Streamed Response"].map((node, i, arr) => (
              <div key={i} style={{ display: "flex", alignItems: "center", flexShrink: 0 }}>
                <div style={{
                  background: i === 0 || i === arr.length - 1 ? "#fff" : "#1a1a1a",
                  color: i === 0 || i === arr.length - 1 ? "#000" : "#fff",
                  border: "1px solid #333",
                  borderRadius: 10, padding: "10px 18px",
                  fontSize: 13, fontWeight: 600,
                  fontFamily: "'DM Mono', monospace",
                  whiteSpace: "nowrap",
                }}>
                  {node}
                </div>
                {i < arr.length - 1 && (
                  <div style={{ width: 32, height: 1, background: "#333", flexShrink: 0, position: "relative" }}>
                    <div style={{ position: "absolute", right: -5, top: -4, fontSize: 10, color: "#555" }}>▶</div>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 16 }}>
            {architecture.map((a, i) => (
              <FadeIn key={i} delay={i * 80}>
                <div
                  style={{ border: "1px solid #222", borderRadius: 20, padding: 36, transition: "border-color 0.3s", cursor: "default" }}
                  onMouseEnter={(e) => ((e.currentTarget as HTMLDivElement).style.borderColor = "#555")}
                  onMouseLeave={(e) => ((e.currentTarget as HTMLDivElement).style.borderColor = "#222")}
                >
                  <p style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, color: "#444", marginBottom: 20 }}>{a.layer}</p>
                  <h3 style={{ fontSize: 24, fontWeight: 800, letterSpacing: "-0.02em", marginBottom: 6 }}>{a.title}</h3>
                  <p style={{ fontSize: 13, color: "#666", fontFamily: "'DM Mono', monospace", marginBottom: 16 }}>{a.subtitle}</p>
                  <p style={{ fontSize: 14, color: "#888", lineHeight: 1.7 }}>{a.desc}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ── TECH STACK ── */}
      <section id="tech-stack" style={{ padding: "120px 32px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <FadeIn>
            <p className="section-label">Technology Stack</p>
            <h2 style={{ fontSize: "clamp(36px, 5vw, 60px)", fontWeight: 900, letterSpacing: "-0.03em", lineHeight: 1.1, marginBottom: 64 }}>
              Every tool chosen<br />with intent.
            </h2>
          </FadeIn>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12 }}>
            {techStack.map((t, i) => (
              <FadeIn key={i} delay={i * 60}>
                <div
                  style={{ border: "1px solid #e8e8e8", borderRadius: 16, padding: "28px 24px", transition: "border-color 0.3s, background 0.3s", cursor: "default" }}
                  onMouseEnter={(e) => {
                    const el = e.currentTarget as HTMLDivElement;
                    el.style.borderColor = "#000";
                    el.style.background = "#000";
                    (el.querySelector(".tname") as HTMLElement).style.color = "#fff";
                    (el.querySelector(".trole") as HTMLElement).style.color = "#666";
                  }}
                  onMouseLeave={(e) => {
                    const el = e.currentTarget as HTMLDivElement;
                    el.style.borderColor = "#e8e8e8";
                    el.style.background = "#fff";
                    (el.querySelector(".tname") as HTMLElement).style.color = "#000";
                    (el.querySelector(".trole") as HTMLElement).style.color = "#aaa";
                  }}
                >
                  <p className="tname" style={{ fontSize: 22, fontWeight: 800, letterSpacing: "-0.02em", marginBottom: 6, transition: "color 0.3s" }}>{t.name}</p>
                  <p className="trole" style={{ fontSize: 12, fontFamily: "'DM Mono', monospace", color: "#aaa", transition: "color 0.3s" }}>{t.role}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ── ROADMAP ── */}
      <section id="roadmap" style={{ padding: "120px 32px", background: "#fafafa" }}>
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          <FadeIn>
            <p className="section-label">Future Roadmap</p>
            <h2 style={{ fontSize: "clamp(36px, 5vw, 60px)", fontWeight: 900, letterSpacing: "-0.03em", lineHeight: 1.1, marginBottom: 56 }}>
              What&apos;s coming<br />next for FinRAG.
            </h2>
          </FadeIn>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {roadmap.map((r, i) => (
              <FadeIn key={i} delay={i * 60}>
                <div className="roadmap-row">
                  <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
                    <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, color: "#bbb", minWidth: 28 }}>{r.num}</span>
                    <span style={{ fontSize: 18, fontWeight: 600, letterSpacing: "-0.01em" }}>{r.title}</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                    <span className="tag-pill">{r.tag}</span>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#bbb" strokeWidth="2">
                      <path d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section style={{ padding: "140px 32px", textAlign: "center", position: "relative", overflow: "hidden" }}>
        <div style={{
          position: "absolute", top: "50%", left: "50%",
          transform: "translate(-50%, -50%)",
          width: 600, height: 600,
          background: "radial-gradient(circle, rgba(0,0,0,0.04) 0%, transparent 70%)",
          borderRadius: "50%", zIndex: 0,
        }} />
        <FadeIn>
          <div style={{ position: "relative", zIndex: 1 }}>
            <h2 style={{ fontSize: "clamp(48px, 8vw, 88px)", fontWeight: 900, letterSpacing: "-0.04em", lineHeight: 1.0, marginBottom: 24 }}>
              Ready to explore<br />financial AI?
            </h2>
            <p style={{ fontSize: 20, color: "#888", marginBottom: 48 }}>
              Join the beta. No credit card required.
            </p>
            <button
              className="btn-primary"
              style={{ fontSize: 17, padding: "18px 44px" }}
              onClick={() => router.push("/chat")}
            >
              Launch FinRAG
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </FadeIn>
      </section>

      {/* ── CREATE ACCOUNT MODAL ── */}
      {showSignUp && (
        <div
          style={{
            position: "fixed", inset: 0, zIndex: 1000,
            background: "rgba(0,0,0,0.45)", backdropFilter: "blur(4px)",
            display: "flex", alignItems: "center", justifyContent: "center",
            padding: "20px",
          }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowSignUp(false); }}
        >
          <div style={{
            background: "#fff", borderRadius: 24, padding: "48px 44px",
            width: "100%", maxWidth: 460,
            boxShadow: "0 32px 80px rgba(0,0,0,0.18)",
            position: "relative",
          }}>
            {/* Close */}
            <button
              onClick={() => setShowSignUp(false)}
              style={{
                position: "absolute", top: 20, right: 20,
                background: "#f5f5f5", border: "none", borderRadius: "50%",
                width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center",
                cursor: "pointer", fontSize: 18, color: "#888", fontFamily: "inherit",
              }}
            >×</button>

            {/* Header */}
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
              <div style={{ width: 32, height: 32, background: "#000", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span style={{ color: "#fff", fontWeight: 800, fontSize: 14 }}>F</span>
              </div>
              <span style={{ fontWeight: 800, fontSize: 16, letterSpacing: "-0.02em" }}>FinRAG</span>
            </div>
            <h2 style={{ fontSize: 26, fontWeight: 900, letterSpacing: "-0.03em", marginBottom: 6 }}>Welcome to FinRAG</h2>
            <p style={{ fontSize: 14, color: "#888", marginBottom: 32 }}>Create your account to get started</p>

            {/* Form */}
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {[
                { label: "Full Name", key: "name", type: "text", placeholder: "John Doe" },
                { label: "Email Address", key: "email", type: "email", placeholder: "you@example.com" },
                { label: "Password", key: "password", type: "password", placeholder: "Min. 8 characters" },
                { label: "Confirm Password", key: "confirmPassword", type: "password", placeholder: "Repeat your password" },
              ].map(({ label, key, type, placeholder }) => (
                <div key={key}>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 6, color: "#333" }}>{label}</label>
                  <input
                    type={type}
                    placeholder={placeholder}
                    value={signUpForm[key as keyof typeof signUpForm]}
                    onChange={(e) => setSignUpForm((prev) => ({ ...prev, [key]: e.target.value }))}
                    style={{
                      width: "100%", padding: "12px 16px",
                      border: "1.5px solid #e5e5e5", borderRadius: 12,
                      fontSize: 14, fontFamily: "inherit", outline: "none",
                      transition: "border-color 0.2s", color: "#000", background: "#fafafa",
                    }}
                    onFocus={(e) => (e.currentTarget.style.borderColor = "#000")}
                    onBlur={(e) => (e.currentTarget.style.borderColor = "#e5e5e5")}
                  />
                </div>
              ))}

              {signUpError && (
                <p style={{ fontSize: 13, color: "#e53e3e", background: "#fff5f5", border: "1px solid #fed7d7", borderRadius: 8, padding: "10px 14px" }}>
                  {signUpError}
                </p>
              )}

              <button
                className="btn-primary"
                style={{ width: "100%", justifyContent: "center", marginTop: 8, fontSize: 15, padding: "14px" }}
                onClick={() => {
                  const { name, email, password, confirmPassword } = signUpForm;
                  if (!name.trim()) return setSignUpError("Please enter your full name.");
                  if (!email.includes("@")) return setSignUpError("Please enter a valid email address.");
                  if (password.length < 8) return setSignUpError("Password must be at least 8 characters.");
                  if (password !== confirmPassword) return setSignUpError("Passwords do not match.");
                  setShowSignUp(false);
                  router.push("/chat");
                }}
              >
                Create Account
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </button>

              <p style={{ textAlign: "center", fontSize: 13, color: "#aaa" }}>
                Already have an account?{" "}
                <SignInButton mode="modal">
                  <span
                    style={{ color: "#000", fontWeight: 600, cursor: "pointer", textDecoration: "underline" }}
                    onClick={() => setShowSignUp(false)}
                  >
                    Sign In
                  </span>
                </SignInButton>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── FOOTER ── */}
      <footer style={{ borderTop: "1px solid #e8e8e8", padding: "60px 32px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", display: "flex", justifyContent: "space-between", gap: 40, flexWrap: "wrap" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
              <div style={{ width: 32, height: 32, background: "#000", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span style={{ color: "#fff", fontWeight: 800, fontSize: 14 }}>F</span>
              </div>
              <span style={{ fontWeight: 800, fontSize: 18, letterSpacing: "-0.02em" }}>FinRAG</span>
            </div>
            <p style={{ fontSize: 14, color: "#aaa", maxWidth: 280, lineHeight: 1.7 }}>
              AI-powered financial intelligence using RAG, vector search, and GPT-4o.
            </p>
          </div>
          <div style={{ display: "flex", gap: 64 }}>
            {[
              { label: "Platform", links: ["Features", "Architecture", "Security", "Pricing"] },
              { label: "Technology", links: ["Next.js", "FastAPI", "OpenAI", "Pinecone"] },
              { label: "Company", links: ["About", "Blog", "Careers", "Contact"] },
            ].map((col) => (
              <div key={col.label}>
                <p style={{ fontSize: 13, fontWeight: 700, marginBottom: 16, letterSpacing: "-0.01em" }}>{col.label}</p>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {col.links.map((l) => (
                    <a
                      key={l}
                      href="#"
                      style={{ fontSize: 14, color: "#aaa", textDecoration: "none", transition: "color 0.2s" }}
                      onMouseEnter={(e) => ((e.target as HTMLAnchorElement).style.color = "#000")}
                      onMouseLeave={(e) => ((e.target as HTMLAnchorElement).style.color = "#aaa")}
                    >
                      {l}
                    </a>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
        <div style={{ maxWidth: 1200, margin: "40px auto 0", paddingTop: 24, borderTop: "1px solid #e8e8e8", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <p style={{ fontSize: 13, color: "#ccc" }}>© 2026 FinRAG. All rights reserved.</p>
          <p style={{ fontSize: 13, color: "#ccc", fontFamily: "'DM Mono', monospace" }}>v0.1.0-beta</p>
        </div>
      </footer>
    </div>
  );
}