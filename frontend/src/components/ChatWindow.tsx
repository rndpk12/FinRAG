type Message = {
  role: "user" | "assistant";
  content: string;
  citations?: { label: string; source: string }[];
  lastUpdated?: string;
};

type ChatWindowProps = {
  messages: Message[];
};

export default function ChatWindow({
  messages,
}: ChatWindowProps) {
  return <div className="conversation"><div className="chat-stack"><div className="greeting"><small>COMPANY INTELLIGENCE</small><h1>Good morning, Alex.<br /><span>What would you like to know?</span></h1></div>{messages.map((message,index)=><div className={`message ${message.role}`} key={index}><span className="avatar">{message.role === "user" ? "AB" : "A"}</span><div className="message-content"><div className="message-label">{message.role === "user" ? "YOU" : "ATLAS"}</div><div className="message-text">{message.content}</div>{message.role === "assistant" && message.citations && message.citations.length > 0 && <div className="answer-card"><p><strong>Source-backed answer</strong>{message.lastUpdated ? ` · Updated ${message.lastUpdated}` : ""}</p><div className="sources">{message.citations.map((citation) => <span className="source-chip" key={`${citation.label}-${citation.source}`}>↗ {citation.label}</span>)}</div></div>}</div></div>)}</div></div>;
}
