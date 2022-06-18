import { Controller, Get, ParseIntPipe, Query } from '@nestjs/common';
import { users, chats, messages, user_messages, chat_messages } from '@prisma/client';
import { AppService } from './app.service';
import { UserChats, ChatMessage } from '../../shared/types/db-dtos';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get("/api/user/users")
  async getAllUsers() {
    const users = await this.appService.getAllUsers();
    console.log("users", users);
    return users;
  }

  @Get("/api/user/chats")
  async getChatsForUser(@Query("user_id", ParseIntPipe) userId: number): Promise<UserChats[]> {
    const chats = await this.appService.getAllAvailableChatsForUser(userId);
    console.log("chats => controller", chats);
    return chats;
  }

  @Get("/api/chat/messages")
  async getChatMessages(@Query("chat_id", ParseIntPipe) chatId: number): Promise<ChatMessage[]> {
    const messages = await this.appService.getChatMessages(chatId);
    console.log("messages for chat with id: ", chatId, messages);
    return messages;
  }
}
