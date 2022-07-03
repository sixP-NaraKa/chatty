import { Body, Controller, Get, ParseArrayPipe, ParseBoolPipe, ParseIntPipe, Post, Query, Request, UseGuards } from '@nestjs/common';
import { settings, users } from '@prisma/client';
import { AppService } from './app.service';
import { ChatRoomWithParticipantsExceptSelf, ChatroomWithMessages } from '../../shared/types/db-dtos';
import { LocalAuthGuard } from './auth/local-auth.guard';
import { AuthService } from './auth/auth.service';
import { AuthGuard } from '@nestjs/passport';
import { UsersService } from './users/users.service';

@Controller()
export class AppController {
    constructor(private readonly appService: AppService, private authService: AuthService, private userService: UsersService) { }

    @UseGuards(LocalAuthGuard)
    @Post("/auth/login")
    async login(@Request() req) {
        return this.authService.login(req.user as users);
    }

    @Post("/auth/create")
    async createUser(@Body() body: { username: string, password: string }) {
        return this.authService.createUser(body)
    }

    @UseGuards(AuthGuard())
    @Get("/api/user/users")
    async getAllUsers() {
        const users = await this.appService.getAllUsers();
        return users;
    }

    @UseGuards(AuthGuard())
    @Get("/api/user/settings")
    async getUserSettings(@Query("user_id", ParseIntPipe) userId: number) {
        return await this.userService.getUserSettings(userId);
    }

    @UseGuards(AuthGuard())
    @Post("/api/user/update/settings")
    async updateUserSettings(@Body() body: settings) {
        return await this.userService.updateUserSettings(body);
    }

    @UseGuards(AuthGuard())
    @Get("/api/user/chatrooms")
    async getChatroomsForUserWithParticipantsExceptSelf(@Query("user_id", ParseIntPipe) userId: number): Promise<ChatRoomWithParticipantsExceptSelf[]> {
        const chatrooms = await this.appService.getChatroomsForUserWithParticipantsExceptSelf(userId);
        return chatrooms;
    }

    @UseGuards(AuthGuard())
    @Get("/api/user/chatroom")
    async getSingleChatroomForUserWithParticipantsExceptSelf(@Query("user_id", ParseIntPipe) userId: number,
        @Query("chatroom_id", ParseIntPipe) chatroomId: number) {
        return await this.appService.getSingleChatroomForUserWithParticipantsExceptSelf(userId, chatroomId);
    }

    @UseGuards(AuthGuard())
    @Get("/api/user/chatroom/1on1")
    async getSingleChatroomforUserByUserAndParticipantUserId(@Query("user_id", ParseIntPipe) userId: number,
        @Query("participant_user_id", ParseIntPipe) participantUserId: number) {
        return await this.appService.getSingleChatroomForUserWithParticipantUserId(userId, participantUserId);
    }

    @UseGuards(AuthGuard())
    @Get("/api/user/chatrooms/create")
    async createChatroomWithParticipants(@Query("user_id", ParseIntPipe) userId: number,
        @Query("participant_user_id", new ParseArrayPipe({ items: Number, separator: "," })) participantUserIds: number[],
        @Query("is_group", ParseBoolPipe) isGroup: boolean): Promise<ChatRoomWithParticipantsExceptSelf> {
        const chatroom = await this.appService.createChatroomWithParticipants(userId, participantUserIds, isGroup);
        return chatroom;
    }

    @UseGuards(AuthGuard())
    @Get("/api/chat/chatmessages")
    async getMessagesForChatroom(@Query("chatroom_id", ParseIntPipe) chatroomId: number): Promise<ChatroomWithMessages> {
        const messages = await this.appService.getAllMessagesForChatroom(chatroomId);
        return messages;
    }

    @UseGuards(AuthGuard())
    @Post("/api/chat/create/chatmessage")
    async insertMessage(@Body() body: { message: string, userId: number, chatroomId: number }) {
        const newMessage = await this.appService.insertMessage(body.message, body.userId, body.chatroomId);
        return newMessage;
    }

    @UseGuards(AuthGuard())
    @Get("/api/chat/chatmessages/count")
    async getChatroomMessageCount(@Query("chatroom_id", ParseIntPipe) chatroomId: number) {
        return await this.appService.getChatroomMessagesCount(chatroomId);
    }

}
