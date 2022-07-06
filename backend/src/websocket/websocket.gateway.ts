import {
    WebSocketGateway,
    WebSocketServer,
    SubscribeMessage,
    OnGatewayConnection,
    OnGatewayDisconnect,
} from '@nestjs/websockets';
import { ChatMessageWithUser, ChatRoomWithParticipantsExceptSelf } from '../../../shared/types/db-dtos';

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

    async handleConnection(client: any, ...args: any[]) {
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

}