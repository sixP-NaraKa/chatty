import { Body, Controller, Get, ParseIntPipe, Post, Query, Request, UseGuards } from '@nestjs/common';
import { users, chats, messages, user_messages, chat_messages } from '@prisma/client';
import { AppService } from './app.service';
import { UserChats, ChatMessage, User } from '../../shared/types/db-dtos';
import { LocalAuthGuard } from './auth/local-auth.guard';
import { AuthService } from './auth/auth.service';
import { JwtAuthGuard } from './auth/jwt-auth.guard';
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

    // @UseGuards(LocalAuthGuard)
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
    @Get("/api/user/chats")
    async getChatsForUser(@Query("user_id", ParseIntPipe) userId: number): Promise<UserChats[]> {
        const chats = await this.appService.getAllAvailableChatsForUser(userId);
        console.log("chats => controller", chats);
        return chats;
    }

    @UseGuards(AuthGuard())
    @Get("api/chat/messages")
    async getChatMessages(@Query("chat_id", ParseIntPipe) chatId: number): Promise<ChatMessage[]> {
        const messages = await this.appService.getChatMessages(chatId);
        console.log("messages for chat with id: ", chatId, messages);
        return messages;
    }
}
