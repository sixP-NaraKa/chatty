import { Injectable } from '@nestjs/common';
import { chats, chat_messages, messages, users } from '@prisma/client';
import { PrismaService } from './prisma/prisma.service';
import { UserChats, ChatMessage } from '../../shared/types/db-dtos';

@Injectable()
export class AppService {
  
  constructor(private prismaService: PrismaService) { }

  async getAllUsers(): Promise<users[]> {
    return await this.prismaService.users.findMany();
  }

  async getAllAvailableChatsForUser(userId: number): Promise<UserChats[]> {
    return await this.prismaService.chats.findMany({
      select: {
        users_chats_with_userTousers: {
          select: {
            user_id: true,
            display_name: true
          }
        },
        chat_id: true,
      },
      where: {
        user_id: userId
      },
    });
  }

  async getChatMessages(chatId: number): Promise<ChatMessage[]> {
    return await this.prismaService.chat_messages.findMany({
      where: {
        chat_id: chatId
      },
      include: {
        users: true
      }
    });
  }

}
