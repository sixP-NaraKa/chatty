import { Injectable } from "@angular/core";
import { Socket } from "ngx-socket-io";
import { ChatMessageWithUser, ChatRoomWithParticipantsExceptSelf } from "../../../../shared/types/db-dtos";

@Injectable({
    providedIn: "root"
})
export class WebsocketService {

    constructor(private socket: Socket) { }

    connect() {
        this.socket.connect();
    }

    disconnect() {
        this.socket.disconnect();
    }

    sendChatMessage(message: ChatMessageWithUser) {
        this.socket.emit("send:message", message);
    }

    getChatMessage() {
        return this.socket.fromEvent<ChatMessageWithUser>("get:message");
    }

    joinChatroom(chatroomId: number) {
        this.socket.emit("join:chatroom", chatroomId);
    }

    leaveChatroom(chatroomId: number) {
        this.socket.emit("leave:chatroom", chatroomId);
    }

    createChatroom(chatroom: ChatRoomWithParticipantsExceptSelf, participantUserIds: number[]) {
        this.socket.emit("create:chatroom", chatroom, participantUserIds);
    }

    removeUserFromChatroom(userIdToRemove: number, chatroomId: number) {
        this.socket.emit("remove-user:chatroom", userIdToRemove, chatroomId);
    }

    addUserToChatroom(chatroom: ChatRoomWithParticipantsExceptSelf, participantUserId: number) {
        this.createChatroom(chatroom, [ participantUserId ]);
    }

    listenForRemoveChatroom() {
        return this.socket.fromEvent<[userId: number, chatroomId: number]>("removed-from:chatroom")
    }

    getNewChatroom() {
        return this.socket.fromEvent<[chatroom: ChatRoomWithParticipantsExceptSelf, participantUserIds: number[]]>("new:chatroom");
    }
    
}