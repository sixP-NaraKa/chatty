import { Injectable } from '@nestjs/common';
import { chats, chat_messages, messages, users } from '@prisma/client';
import { PrismaService } from './prisma/prisma.service';
import { UserChats, ChatMessage, User } from '../../shared/types/db-dtos';

@Injectable()
export class AppService {
  
  constructor(private prismaService: PrismaService) { }

  async getAllUsers(): Promise<User[]> {
    return await this.prismaService.users.findMany({
      select: {
        user_id: true,
        display_name: true,
        creation_date: true,
        password: false
      }
    });
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
        users: { // or simply "users: true"
          select: {
            user_id: true,
            display_name: true
          }
        }
      }
    });
  }

}
