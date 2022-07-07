import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service';
import { User, ChatRoomWithParticipantsExceptSelf, ChatroomWithMessages, ChatMessageWithUser } from '../../shared/types/db-dtos';


const includeChatroomWithParticipantsExceptSelf = (userId: number) => {
    return {
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
                                    creation_date: true
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
    }
}


@Injectable()
export class AppService {

    constructor(private prismaService: PrismaService) { }

    /**
     * Get all registered Users.
     * Used for the user-search component.
     * 
     * @returns @see Promise<User[]>: a User[] of all registered users
     */
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

    /**
     * Get all chatrooms for a given user.
     * 
     * @param userId userId of the requester
     * @returns a @see ChatRoomWithParticipantsExceptSelf[] Array
     */
    async getChatroomsForUserWithParticipantsExceptSelf(userId: number): Promise<ChatRoomWithParticipantsExceptSelf[]> {
        return await this.prismaService.participants.findMany({
            where: {
                user_id: userId
            },
            // include: includeChatroomWithParticipantsExceptSelf(userId).include
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
                                        creation_date: true
                                    },
                                }
                            },
                            where: {
                                NOT: {
                                    user_id: userId
                                }
                            }
                        },
                    }
                }
            }
        });
    }

    /**
     * 
     * @param userId userId of the requester
     * @param chatroomId chatroomId of the chat to fetch
     * @returns a @see ChatRoomWithParticipantsExceptSelf chat
     */
    async getSingleChatroomForUserWithParticipantsExceptSelf(userId: number, chatroomId: number): Promise<ChatRoomWithParticipantsExceptSelf> {
        return await this.prismaService.participants.findFirst({
            where: {
                user_id: userId,
                AND: {
                    chatrooms: {
                        chatroom_id: chatroomId
                    }
                }
            },
            include: includeChatroomWithParticipantsExceptSelf(userId).include
        });
    }

    /**
     * Get a single (or none) chatroom for the given userId and its participant.
     * This is used to lookup if a chatroom already exists between users.
     * 
     * @param userId userId of the requester
     * @param participantUserId userId of the participant of the 1on1 chat
     * @returns a @see ChatRoomWithParticipantsExceptSelf chat
     */
     async getSingleChatroomForUserWithParticipantUserId(userId: number, participantUserId: number): Promise<ChatRoomWithParticipantsExceptSelf> {
        return await this.prismaService.participants.findFirst({
            where: {
                user_id: userId,
                AND: {
                    chatrooms: {
                        participants: {
                            some: { // "none: ..." = all chats (if "findMany") where the participant has NOT the given participantUserId
                                users: {
                                    user_id: participantUserId
                                }
                            }
                        }
                    }
                },
            },
            include: includeChatroomWithParticipantsExceptSelf(userId).include
        });
    }

    /**
     * Get the given chatroom and all its chat messages.
     * 
     * @param chatroomId chatroomId to fetch messages for
     * @returns a @see ChatroomWithMessages
     */
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

    /**
     * Returns the number of chat messages for a given chat.
     * 
     * @param chatroomId the chatroom to count messages for
     * @returns how many chat messages there are
     */
    async getChatroomMessagesCount(chatroomId: number): Promise<number> {
        return await this.prismaService.chat_messages.count({
            where: {
                chatroom_id: chatroomId
            }
        });
    }

    /**
     * Create a new chatroom (1on1 or group chat) with its participants.
     * 
     * @param userId userId of the requester
     * @param participantUserIds userIds of the participants
     * @returns 
     */
    async createChatroomWithParticipants(userId: number, participantUserIds: number[], isgroup: boolean = false, groupChatName?: string | null) {
        const data = [{ user_id: userId }]; // add user which created this chatroom
        for (let num of participantUserIds) {
            data.push({ user_id: num })
        }
        const { chatroom_id } = await this.prismaService.chatrooms.create({
            data: {
                isgroup: isgroup,
                name: groupChatName,
                created_by: userId,
                participants: {
                    createMany: {
                        data: data                      
                    }
                }
            },
            select: {
                chatroom_id: true
            }
        });
        return await this.prismaService.participants.findFirst({
            where: {
                user_id: userId,
                AND: {
                    chatrooms: {
                        chatroom_id: chatroom_id
                    }
                }
            },
            include: includeChatroomWithParticipantsExceptSelf(userId).include
        });
    }

    async removeUserFromGroupChat(userId: number, chatroomId: number): Promise<number> {
        return await this.prismaService.$executeRaw`DELETE FROM participants WHERE user_id=${userId} AND chatroom_id=${chatroomId};`
    }

    async addUsersToGroupChat(userIds: number[], chatroomId: number) {
        const data = [];
        for (let num of userIds) {
            data.push({ user_id: num, chatroom_id: chatroomId })
        }
        await this.prismaService.participants.createMany({
            data: data
        });
    }

    /**
     * Insert a new chat message record.
     * 
     * @param message message content
     * @param userId userId of the user who wrote the message
     * @param chatroomId the chatroomId in which the message was written
     * @returns a @see ChatMessageWithUser
     */
    async insertMessage(message: string, userId: number, chatroomId: number): Promise<ChatMessageWithUser> {
        return this.prismaService.chat_messages.create({
            data: {
                msg_content: message,
                user_id: userId,
                chatroom_id: chatroomId
            },
            include: {
                users: {
                    select: {
                        user_id: true,
                        display_name: true,
                        creation_date: true
                    }
                }
            }
        });
    }

}
