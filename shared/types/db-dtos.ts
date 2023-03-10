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

type Chatroom = {
    chatroom_id: number,
    name: string | null,
    isgroup: boolean,
    created_by: number | null,
    created_at: Date | null
};

type ChatRoomWithParticipantsExceptSelf = {
    p_id: number,
    user_id: number,
    chatroom_id: number,
    chatrooms: Chatroom & {
        participants: {
            users: User
        }[];
    };
}

type Reaction = {
    reactions_id: number,
    msg_id: number,
    emote_id: number,
    user_id: number | null
};

type Emote = {
    emote_id: number,
    emote: string,
    name: string
};

type MessageReaction = (Reaction & {
    emote: Emote,
    users: User
});

type ChatMessage = {
    msg_id: number,
    posted_at: Date,
    msg_content: string,
    user_id: number,
    chatroom_id: number,
    isimage: boolean,
    isfile: boolean,
    file_uuid: string
};

type ChatMessageWithUser = ChatMessage & {
    users: User,
    reactions: MessageReaction[],
};

type Participant = {
    p_id: number,
    user_id: number,
    chatroom_id: number
};

type ChatroomWithMessages = Chatroom & {
    chat_messages: ChatMessageWithUser[];
    participants: Participant[];
};

type NotificationUnread = {
    notification_id: number,
    user_id: number,
    chatroom_id: number,
    type: string,
    content: string,
    originated_from: number,
    date: Date
};

type Notification = NotificationUnread & {
    users: User,
    originated_from_user: User,
    chatrooms: Chatroom
};

type Settings = {
    settings_id: number
    user_id: number
    filter: string
    font_size: string
    embed_yt_videos: boolean
};

export {
    User,
    Chatroom,
    Participant,
    ChatRoomWithParticipantsExceptSelf,
    ChatroomWithMessages,
    ChatMessageWithUser,
    UserIdDisplayName,
    MessageReaction,
    NotificationUnread,
    Notification,
    Settings,
    Emote,
    Reaction,
};
