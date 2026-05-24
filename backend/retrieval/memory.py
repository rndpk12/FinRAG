from collections import defaultdict
from typing import List, Dict


class ConversationMemory:

    def __init__(self):

        self.sessions = defaultdict(list)

    def add_message(
        self,
        session_id: str,
        role: str,
        content: str
    ):

        self.sessions[session_id].append({
            "role": role,
            "content": content
        })

        # Keep only recent history
        self.sessions[session_id] = self.sessions[session_id][-10:]

    def get_history(
        self,
        session_id: str
    ) -> List[Dict]:

        return self.sessions.get(session_id, [])

    def build_context(
        self,
        session_id: str
    ) -> str:

        history = self.get_history(session_id)

        if not history:
            return ""

        lines = []

        for msg in history:

            role = msg["role"].upper()

            lines.append(
                f"{role}: {msg['content']}"
            )

        return "\n".join(lines)


memory = ConversationMemory()