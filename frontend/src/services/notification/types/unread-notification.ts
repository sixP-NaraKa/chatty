export type UnreadNotification = {
    user: {
        userId?: number,
        username: string,
    },
    chatroom: {
        chatroomId: number,
        chatroomName: string,
    },
    type: "message" | "reaction" | "call",
    content: string,
    date: Date
};