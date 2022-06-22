import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service';
import { User, ChatRoomWithParticipantsExceptSelf, ChatroomWithMessages } from '../../shared/types/db-dtos';

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

    async getChatroomsForUserWithParticipantsExceptSelf(userId: number): Promise<ChatRoomWithParticipantsExceptSelf[]> {
        return await this.prismaService.participants.findMany({
            where: {
                user_id: userId
            },
            include: {
                users: false,
                chatrooms: {
                    include: {
                        participants: {
                            select: {
                                users: {
                                    select: {
                                        user_id: true,
                                        display_name: true,
                                    },
                                }
                            },
                            where: {
                                NOT: {
                                    user_id: userId
                                }
                            }
                        }
                    }
                }
            }
        });
    }

    async getAllMessagesForChatroom(chatroomId: number): Promise<ChatroomWithMessages> {
        return await this.prismaService.chatrooms.findUnique({
            where: {
                chatroom_id: chatroomId
            },
            include: {
                participants: true,
                chat_messages: {
                    include: {
                        users: {
                            select: {
                                user_id: true,
                                display_name: true,
                                creation_date: true
                            }
                        }
                    }
                }
            },
        });
    }

}
