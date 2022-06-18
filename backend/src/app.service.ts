import { Injectable } from '@nestjs/common';
import { chats, messages } from '@prisma/client';
import { PrismaService } from './prisma/prisma.service';

@Injectable()
export class AppService {
  
  constructor(private prismaService: PrismaService) { }

  async getAllAvailableChatsForUser(): Promise<chats[]> {
    return await this.prismaService.chats.findMany();
  }

  async getChatMessages(chatId: number): Promise<{messages: messages}[]> {
    return await this.prismaService.user_messages.findMany({
      select: {
        messages: true
      },
      where: {
        chat_id: chatId
      }
    });
  }
}
