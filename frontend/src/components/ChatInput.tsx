import { useState } from "react";

type ChatInputProps = {
  onSend: (message: string) => void;
};

export default function ChatInput({
  onSend,
}: ChatInputProps) {
  const [input, setInput] = useState("");

  const handleSend = () => {
    if (!input.trim()) return;

    onSend(input);
    setInput("");
  };
  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); handleSend(); } };

  return <div className="composer-area"><div className="composer"><textarea
          value={input}
          onChange={(e) =>
            setInput(e.target.value)
          }
          onKeyDown={handleKeyDown}
          placeholder="Ask anything about your workspace..." /><div className="composer-bottom"><div className="composer-tools"><button className="tool">+ Add source</button><button className="tool">⌘ Deep research</button></div><button onClick={handleSend} disabled={!input.trim()} className="send">↑</button></div></div><p className="composer-note">Atlas can make mistakes. Check important information against the linked sources.</p></div>;
}
