import { users, chats, messages, user_messages, chat_messages } from '../../backend/node_modules/@prisma/client';

type UserChats = {
    users_chats_with_userTousers: {
        user_id: number,
        display_name: string,
    },
    chat_id: number
}

type ChatMessage = chat_messages & {
    users: users;
}

export { users, chats, messages, user_messages, chat_messages, UserChats, ChatMessage };
