import {
    WebSocketGateway,
    WebSocketServer,
    SubscribeMessage,
    OnGatewayConnection,
    OnGatewayDisconnect,
} from '@nestjs/websockets';
import { UsersService } from 'src/users/users.service';
import { AuthService } from '../auth/auth.service';
import { ChatMessageWithUser, ChatRoomWithParticipantsExceptSelf, MessageReaction } from '../../../shared/types/db-dtos';

const options = {
    cors: {
        origin: true,
        methods: ["GET", "POST"],
        credentials: true
    }
}

@WebSocketGateway(options)
export class SocketGateway implements OnGatewayConnection, OnGatewayDisconnect {

    @WebSocketServer()
    server;

    numConnections = 0;

    constructor(private authService: AuthService, private userService: UsersService) { }

    async handleConnection(client: any, ...args: any[]) {
        // verify user before connecting them - similar to verfiy-user.middleware
        let jwtUser;
        try {
            jwtUser = await this.authService.verifyToken(client.handshake.auth.token);
        }
        catch(e) {
            console.log("=> Websocket: Token is invalid. <=");
            client.disconnect(); // disconnecting just for good measure
            return;
        }
        
        // fetch user from db to completely verify
        const dbUser = await this.userService.findOneById(jwtUser.sub);

        if (!dbUser || !jwtUser) {
            console.log("=> Websocket: No user found. <=");
            client.disconnect(); // disconnecting just for good measure
            return;
        }
        
        this.numConnections++;
        console.log("connected, num conn => ", this.numConnections);
    }
    async handleDisconnect(client: any) {
        this.numConnections--;
        console.log("disconnected, num conn => ", this.numConnections);
    }

    @SubscribeMessage("send:message")
    async pushMessage(client: any, data: ChatMessageWithUser) {
        client.broadcast.to(data.chatroom_id).emit("get:message", data);
    }

    @SubscribeMessage("send:message-reaction")
    async pushEmoteReaction(client: any, chatroomId: number, messageId: number, userId: number, reaction: MessageReaction) {
        client.broadcast.to(chatroomId).emit("get:message-reaction", chatroomId, messageId, userId, reaction);
    }

    @SubscribeMessage("join:chatroom")
    async onChatroomJoin(client: any, chatroomId: number) {
        client.join(chatroomId);
    }

    @SubscribeMessage("leave:chatroom")
    async onChatroomLeave(client: any, chatroomId: number) {
        client.leave(chatroomId);
    }

    @SubscribeMessage("remove-user:chatroom")
    async onRemoveUserFromChatroom(client: any, userIdAndChatroomId: number[]) {
        const [ userId, chatroomId ] = userIdAndChatroomId;
        client.broadcast.to(chatroomId).emit("removed-from:chatroom", [userId, chatroomId]);
    }

    /**
    * Let the connected users, which subscribe to the event, know, that a chat has been created.
    * This chat, together with the userId of the participant,
    * will be broadcasted and only the responsible people will further process the event.
    * 
    * @param client the client which send the event
    * @param chatroom the chatroom to broadcast
    * @param participantUserIds the userId to broadcast (only responsible people will process this further)
    */
    @SubscribeMessage("create:chatroom")
    async onCreateChatroom(client: any, chatroom: ChatRoomWithParticipantsExceptSelf, participantUserIds: number[]) {
        client.broadcast.emit("new:chatroom", chatroom, participantUserIds);
    }

    /* WebRTC */

    // @SubscribeMessage("new:voice-chat-offer-sent")
    // async onVoiceChatOffer(client: any, offer: any) {
    //     client.broadcast.to(offer.chatroomId).emit("new:voice-chat-offer-received", ["offer", offer]);
    // }

    // @SubscribeMessage("new:voice-chat-answer-sent")
    // async onVoiceChatAnswer(client: any, answer: any) {
    //     client.broadcast.to(answer.chatroomId).emit("new:voice-chat-answer-received", ["answer", answer]);
    // }

    // @SubscribeMessage("new:voice-chat-ice-candidate-sent")
    // async onVoiceChatIceCandidate(client: any, candidateInfo: any) {
    //     console.log("ws backend: ice candidate received", candidateInfo);
    //     client.broadcast.to(candidateInfo.chatroomId).emit("new:voice-chat-ice-candidate-received", candidateInfo.candidate);
    // }

    @SubscribeMessage("new:voice-chat-message")
    async onVoiceChatMessage(client: any, message: { type: "offer" | "answer" | "hangup" | "icecandidate", chatroomId: number, userId: number, data: any }) {
        client.broadcast.to(message.chatroomId).emit("new:voice-chat-message-received", message);
    }

    @SubscribeMessage("new:voice-chat-request")
    async onVoiceChatRequestMessage(client: any, message: { type: "request" | "accept" | "decline" | "hangup", chatroomId: number, userId: number }) {
        client.broadcast.to(message.chatroomId).emit("new:voice-chat-request-received", message);

        // TODO: do this differently, to cover all cases accruately, maybe?
        
        // if no one else is in this room after 10sec after we send the request,
        // we send ourselves a "ignored" message with the original chatroom Id to compare against later on
        // Note: there is actually no need to compare anything, as the button will be disabled anyway for the duration (until acceptance of the request, etc.),
        // its only important that after the duration the user gets notified

        // yes, there will be the edge case in which someone calls someone, they call, they hangup and then they will call someone else,
        // and then the notification message will be hidden sooner then it should, but that is ok for now
        if (message.type === "request") {
            setTimeout(() => {
                // since we are always joining the rooms on startup, they would never be of size one if the other person is online but simply ignoring them
                // that is why, we will simply for now send back the "ignored" message anway
                // if (client.adapter.rooms.get(message.chatroomId).size === 1) {
                    client.emit("new:voice-chat-request-received", { type: "ignored", chatroomId: message.chatroomId, userId: message.userId });
                // }
            }, 10000);
            // console.log(client.adapter.rooms.get(message.chatroomId).size);
        }
    }

}