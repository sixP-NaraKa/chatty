import {
    WebSocketGateway,
    WebSocketServer,
    SubscribeMessage,
    OnGatewayConnection,
    OnGatewayDisconnect,
} from '@nestjs/websockets';
import { ChatMessageWithUser } from '../../../shared/types/db-dtos';

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

}