import { users, chat_messages, chatrooms, participants } from '../../backend/node_modules/@prisma/client';

type User = {
    user_id: number,
    display_name: string,
    creation_date: Date
}


type ChatRoomWithParticipantsExceptSelf = { //participants & { // doesn't work for some reason..., but manually does?
    p_id: number,
    user_id: number,
    chatroom_id: number,
    chatrooms: chatrooms & {
        participants: {
            users: {
                user_id: number;
                display_name: string;
            };
        }[];
    };
}

type ChatroomWithMessages = chatrooms & {
    chat_messages: (chat_messages & {
        users: User
    })[];
    participants: participants[];
}

export { users, chat_messages, participants, chatrooms, User, ChatRoomWithParticipantsExceptSelf, ChatroomWithMessages };
