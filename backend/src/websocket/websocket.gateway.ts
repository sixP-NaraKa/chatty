import {
    WebSocketGateway,
    WebSocketServer,
    SubscribeMessage,
    OnGatewayConnection,
    OnGatewayDisconnect,
    MessageBody,
    ConnectedSocket,
} from '@nestjs/websockets';
import { UsersService } from '../users/users.service.js';
import { AuthService } from '../auth/auth.service.js';
import {
    ChatMessageWithUser,
    ChatRoomWithParticipantsExceptSelf,
    MessageReaction,
} from '../../../shared/types/db-dtos.js';

const options = {
    cors: {
        origin: true,
        methods: ['GET', 'POST'],
        credentials: true,
    },
};

@WebSocketGateway(options)
export class SocketGateway implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer()
    server;

    numConnections = 0;

    userIdsConnected = new Array<number>();
    connectedClients = new Map<number, any>();

    constructor(private authService: AuthService, private userService: UsersService) {}

    async handleConnection(client: any, ...args: any[]) {
        // verify user before connecting them - similar to verfiy-user.middleware
        let jwtUser;
        try {
            jwtUser = await this.authService.verifyToken(client.handshake.auth.token);
        } catch (e) {
            console.log('=> Websocket: Token is invalid. <=');
            client.disconnect(); // disconnecting just for good measure
            return;
        }

        // fetch user from db to completely verify
        const dbUser = await this.userService.findOneById(jwtUser.sub);

        if (!dbUser || !jwtUser) {
            console.log('=> Websocket: No user found. <=');
            client.disconnect(); // disconnecting just for good measure
            return;
        }

        this.numConnections++;
        console.log('connected, num conn => ', this.numConnections);

        // notify users of login, to display corresponding statuses
        this.userIdsConnected.push(dbUser.user_id);
        this.connectedClients.set(dbUser.user_id, client);
        client.broadcast.emit('changed-availabilities', this.userIdsConnected);
        // send also response to sender, so they get the initial statuses
        // this could be done before adding to the local list, but it does not matter too much
        client.emit('changed-availabilities', this.userIdsConnected);
    }
    async handleDisconnect(client: any) {
        this.numConnections--;
        console.log('disconnected, num conn => ', this.numConnections);

        // notify users of logout, to display corresponding statuses
        const jwtUser = await this.authService.verifyToken(client.handshake.auth.token);
        const idxOf = this.userIdsConnected.indexOf(jwtUser.sub);
        this.userIdsConnected.splice(idxOf, 1);
        this.connectedClients.delete(jwtUser.sub);
        console.log(this.userIdsConnected);
        client.broadcast.emit('changed-availabilities', this.userIdsConnected);
    }

    @SubscribeMessage('send:message')
    async pushMessage(client: any, data: ChatMessageWithUser) {
        client.broadcast.to(data.chatroom_id).emit('get:message', data);
    }

    @SubscribeMessage('delete:message')
    async pushDeleteMessage(client: any, messageIdAndChatroomId: number[]) {
        const [messageId, chatroomId] = messageIdAndChatroomId;
        client.broadcast.to(chatroomId).emit('get:delete-message', messageIdAndChatroomId);
    }

    @SubscribeMessage('send:message-reaction')
    async pushEmoteReaction(
        client: any,
        chatroomId: number,
        messageId: number,
        userId: number,
        reaction: MessageReaction
    ) {
        client.broadcast.to(chatroomId).emit('get:message-reaction', chatroomId, messageId, userId, reaction);
    }

    @SubscribeMessage('join:chatroom')
    async onChatroomJoin(client: any, chatroomId: number) {
        client.join(chatroomId);
    }

    @SubscribeMessage('leave:chatroom')
    async onChatroomLeave(client: any, chatroomId: number) {
        client.leave(chatroomId);
    }

    @SubscribeMessage('remove-user:chatroom')
    async onRemoveUserFromChatroom(client: any, userIdAndChatroomId: number[]) {
        const [userId, chatroomId] = userIdAndChatroomId;
        const participantClient = this.connectedClients.has(userId) ? this.connectedClients.get(userId) : undefined;
        if (participantClient !== undefined) {
            this.onChatroomLeave(participantClient, chatroomId);
            client.to(participantClient.id).emit('removed-from:chatroom', chatroomId);
        }
    }

    /**
     * Let the connected users, which subscribe to the event, know, that a chat has been created.
     * This chat, together with the userId of the participant,
     * will be broadcasted and only the responsible people will further process the event.
     *
     * @param client the client which send the event
     * @param chatroom the chatroom
     * @param participantUserIds the user IDs of the participants
     */
    @SubscribeMessage('create:chatroom')
    async onCreateChatroom(
        @ConnectedSocket() client: any,
        @MessageBody('chatroom') chatroom: ChatRoomWithParticipantsExceptSelf,
        @MessageBody('userIds') participantUserIds: number[]
    ) {
        for (const userId of participantUserIds) {
            if (this.connectedClients.has(userId)) {
                const clientId = this.connectedClients.get(userId).id;
                client.to(clientId).emit('new:chatroom', chatroom);
            }
        }
    }

    /* WebRTC */

    @SubscribeMessage('new:voice-chat-message')
    async onVoiceChatMessage(
        client: any,
        message: { type: 'offer' | 'answer' | 'hangup' | 'icecandidate'; chatroomId: number; userId: number; data: any }
    ) {
        client.broadcast.to(message.chatroomId).emit('new:voice-chat-message-received', message);
    }

    @SubscribeMessage('new:voice-chat-request')
    async onVoiceChatRequestMessage(
        client: any,
        message: { type: 'request' | 'accept' | 'decline' | 'hangup'; chatroomId: number; userId: number }
    ) {
        client.broadcast.to(message.chatroomId).emit('new:voice-chat-request-received', message);

        // TODO: do this differently, to cover all cases accruately, maybe?

        // if no one else is in this room after 10sec after we send the request,
        // we send ourselves a "ignored" message with the original chatroom Id to compare against later on
        // Note: there is actually no need to compare anything, as the button will be disabled anyway for the duration (until acceptance of the request, etc.),
        // its only important that after the duration the user gets notified

        // yes, there will be the edge case in which someone calls someone, they call, they hangup and then they will call someone else,
        // and then the notification message will be hidden sooner then it should, but that is ok for now
        if (message.type === 'request') {
            setTimeout(() => {
                // since we are always joining the rooms on startup, they would never be of size one if the other person is online but simply ignoring them
                // that is why, we will simply for now send back the "ignored" message anway
                // if (client.adapter.rooms.get(message.chatroomId).size === 1) {
                client.emit('new:voice-chat-request-received', {
                    type: 'ignored',
                    chatroomId: message.chatroomId,
                    userId: message.userId,
                });
                // }
            }, 10000);
            // console.log(client.adapter.rooms.get(message.chatroomId).size);
        }
    }
}
