import { users, chat_messages, chatrooms, participants, settings, emote, reactions, notifications } from '../../backend/node_modules/@prisma/client';

type User = {
    user_id: number,
    display_name: string,
    creation_date: Date
}

type UserIdDisplayName = {
    users: {
        user_id: number,
        display_name: string
    }
}

type ChatRoomWithParticipantsExceptSelf = { //participants & { // doesn't work for some reason..., but manually does?
    p_id: number,
    user_id: number,
    chatroom_id: number,
    chatrooms: chatrooms & {
        participants: {
            users: {
                user_id: number,
                display_name: string,
                creation_date: Date
            };
        }[];
    };
}

type MessageReaction = (reactions & {
    emote: emote,
    users: users
});

type ChatMessageWithUser = chat_messages & {
    users: User,
    reactions: MessageReaction[],
};

type ChatroomWithMessages = chatrooms & {
    chat_messages: ChatMessageWithUser[];
    participants: participants[];
}

type Notification = notifications & {
    users: users,
    originated_from_user: users,
    chatrooms: chatrooms,
}

export { users, chat_messages, participants, chatrooms, settings, emote, reactions, notifications, User, ChatRoomWithParticipantsExceptSelf, ChatroomWithMessages, ChatMessageWithUser, UserIdDisplayName, MessageReaction, Notification };
