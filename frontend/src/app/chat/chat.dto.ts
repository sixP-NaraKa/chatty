import { chatrooms, participants, ChatRoomWithParticipantsExceptSelf, ChatroomWithMessages, ChatMessageWithUser } from "../../../../shared/types/db-dtos";

export class ChatData {
    chat!: ChatRoomWithParticipantsExceptSelf;
    chatroomData!: ChatroomWithMessages;
    chatroomOnly!: chatrooms;
    participantsList!: participants[];
    chatroomMessages!: ChatMessageWithUser[];

    constructor() { }
}