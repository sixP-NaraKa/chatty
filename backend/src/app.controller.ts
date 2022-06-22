import { Body, Controller, Get, ParseIntPipe, Post, Query, Request, UseGuards } from '@nestjs/common';
import { users } from '@prisma/client';
import { AppService } from './app.service';
import { ChatRoomWithParticipantsExceptSelf, ChatroomWithMessages } from '../../shared/types/db-dtos';
import { LocalAuthGuard } from './auth/local-auth.guard';
import { AuthService } from './auth/auth.service';
import { AuthGuard } from '@nestjs/passport';

@Controller()
export class AppController {
    constructor(private readonly appService: AppService, private authService: AuthService) { }

    @UseGuards(LocalAuthGuard)
    @Post("/auth/login")
    async login(@Request() req) {
        console.log("login => req", req.user);
        return this.authService.login(req.user as users);
    }

    @Post("/auth/create")
    async createUser(@Body() body: { username: string, password: string }) {
        console.log("createUser with data", body);
        return this.authService.createUser(body)
    }

    @UseGuards(AuthGuard())
    @Get("/api/user/users")
    async getAllUsers() {
        const users = await this.appService.getAllUsers();
        console.log("users", users);
        return users;
    }

    @UseGuards(AuthGuard())
    @Get("/api/user/chatrooms")
    async getChatroomsForUserWithParticipantsExceptSelf(@Query("user_id", ParseIntPipe) userId: number): Promise<ChatRoomWithParticipantsExceptSelf[]> {
        const chatrooms = await this.appService.getChatroomsForUserWithParticipantsExceptSelf(userId);
        console.log("chatrooms => ", chatrooms);
        return chatrooms;
    }

    @UseGuards(AuthGuard())
    @Get("/api/chat/chatmessages")
    async getMessagesForChatroom(@Query("chatroom_id", ParseIntPipe) chatroomId: number): Promise<ChatroomWithMessages> {
        const messages = await this.appService.getAllMessagesForChatroom(chatroomId);
        console.log("chatroom messages => ", messages);
        return messages;
    }

}
