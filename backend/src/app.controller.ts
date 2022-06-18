import { Controller, Get, Param } from '@nestjs/common';
import { users, chats, messages, user_messages } from '@prisma/client';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get("/api/user/chats")
  async getChatsForUser(): Promise<chats[]> {
    // TODO: provide user details (e.g. user ID) to this endpoint to fetch only for currently logged in user
    const chats = await this.appService.getAllAvailableChatsForUser();
    console.log(chats);
    return chats;
  }

  @Get("/api/chat/messages/:chat_id")
  async getChatMessages(@Param("chat_id") chatId: number): Promise<{messages: messages}[]> {
    const messages = await this.appService.getChatMessages(chatId);
    console.log("messages for chat with id: ", chatId, messages);
    return messages;
  }
}
