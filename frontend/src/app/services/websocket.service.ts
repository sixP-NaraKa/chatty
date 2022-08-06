import { Injectable } from "@angular/core";
import { Socket } from "ngx-socket-io";
import { ChatMessageWithUser, ChatRoomWithParticipantsExceptSelf, MessageReaction } from "../../../../shared/types/db-dtos";
import { ApplicationUser } from "../auth/auth.service";

type VoiceChatMessage = {
    type: "offer" | "answer" | "hangup" | "icecandidate",
    chatroomId: number,
    userId: number,
    data: RTCSessionDescription | RTCSessionDescriptionInit | RTCIceCandidate | any,
}

type VoiceChatRequest = {
    type: "request" | "accept" | "decline" | "hangup",
    chatroomId: number,
    userId: number,
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

    sendEmoteReaction(chatroomId: number, messageId: number, userId: number, reaction: MessageReaction) {
        this.socket.emit("send:message-reaction", chatroomId, messageId, userId, reaction);
    }

    getNewEmoteReaction() {
        return this.socket.fromEvent<[chatroomId: number, messageId: number, userId: number, reaction: MessageReaction]>("get:message-reaction");        
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

    /* WebRTC WebSocket events (once call request accepted) */

    sendVoiceChatMessage(message: VoiceChatMessage) {
        this.socket.emit("new:voice-chat-message", message);
    }

    getVoiceChatMessage() {
        return this.socket.fromEvent<VoiceChatMessage>("new:voice-chat-message-received");
    }

    /** Voice Chat request creation */

    sendVoiceChatRequest(message: VoiceChatRequest) {
        this.socket.emit("new:voice-chat-request", message);
    }

    getVoiceChatRequest() {
        return this.socket.fromEvent<VoiceChatRequest>("new:voice-chat-request-received");
    }

    /** User Availability Status */

    getChangedAvailabilities() {
        return this.socket.fromEvent<number[]>("changed-availabilities");
    }


}