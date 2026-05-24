from collections import defaultdict

# user_email -> chats
chat_sessions = defaultdict(list)


def save_message(user_id, role, content):

    chat_sessions[user_id].append({
        "role": role,
        "content": content
    })


def get_chat(user_id):

    return chat_sessions[user_id]


def clear_chat(user_id):

    chat_sessions[user_id] = []