import { useState } from "react";

import Sidebar from "../components/Sidebar";
import ChatWindow from "../components/ChatWindow";
import ChatInput from "../components/ChatInput";
import api from "../services/api";

type Message = {
  role: "user" | "assistant";
  content: string;
  citations?: { label: string; source: string }[];
  lastUpdated?: string;
};

export default function DashboardPage() {
  const [messages, setMessages] =
    useState<Message[]>([
      {
        role: "user",
        content:
          "What was our revenue last year?",
      },
      {
        role: "assistant",
        content:
          "Ask Atlas about company revenue, such as “What was our revenue last year?” or “Show revenue by quarter.”",
      },
    ]);

  const handleSend = async (
  userMessage: string
) => {
  setMessages((prev) => [
    ...prev,
    {
      role: "user",
      content: userMessage,
    },
  ]);

  try {
    const response = await api.post("/api/chat/", {
      message: userMessage,
    });

    setMessages((prev) => [
      ...prev,
      {
        role: "assistant",
        content:
          response.data.response,
        citations: response.data.citations,
        lastUpdated: response.data.last_updated,
      },
    ]);
  } catch {
    setMessages((prev) => [
      ...prev,
      {
        role: "assistant",
        content:
          "Atlas could not reach the Revenue Analyst service. Check that the backend is running on port 8000.",
      },
    ]);
  }
};

  return <div className="app-shell"><Sidebar /><div className="main-panel"><header className="app-header"><div className="crumb">Company intelligence <span>/ Revenue Analyst</span></div><div className="header-controls"><span className="source-pill"><b>●</b> Revenue data connected</span><button className="icon-button">↗</button><button className="icon-button">•••</button></div></header><ChatWindow messages={messages} /><ChatInput onSend={handleSend} /></div></div>;
}
