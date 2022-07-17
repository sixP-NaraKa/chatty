import { Injectable } from "@angular/core";
import { Socket } from "ngx-socket-io";
import { ChatMessageWithUser, ChatRoomWithParticipantsExceptSelf } from "../../../../shared/types/db-dtos";
import { ApplicationUser } from "../auth/auth.service";

type SignallingDescription = {
    desc: RTCSessionDescriptionInit,
    chatroomId: number,
}

type VoiceChatMessage = {
    type: "offer" | "answer" | "hangup" | "icecandidate",
    chatroomId: number,
    userId: number,
    data: RTCSessionDescription | RTCSessionDescriptionInit | RTCIceCandidate | any,
}

@Injectable({
    providedIn: "root"
})
export class WebsocketService {

    constructor(private socket: Socket) { }

    connect(currentUser: ApplicationUser) {
        this.socket.ioSocket["auth"] = { token: currentUser.access_token };
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
        this.createChatroom(chatroom, [participantUserId]);
    }

    listenForRemoveChatroom() {
        return this.socket.fromEvent<[userId: number, chatroomId: number]>("removed-from:chatroom")
    }

    getNewChatroom() {
        return this.socket.fromEvent<[chatroom: ChatRoomWithParticipantsExceptSelf, participantUserIds: number[]]>("new:chatroom");
    }

    /* WebRTC but correctly (maybe :D) */

    sendVoiceChatMessage(message: VoiceChatMessage) {
        this.socket.emit("new:voice-chat-message", message);
    }

    getVoiceChatMessage() {
        return this.socket.fromEvent<VoiceChatMessage>("new:voice-chat-message-received");
    }

}