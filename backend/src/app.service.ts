import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service.js';
import { User, ChatRoomWithParticipantsExceptSelf, ChatroomWithMessages, ChatMessageWithUser, MessageReaction, Notification } from '../../shared/types/db-dtos.js';
import { emote, notifications } from '@prisma/client';


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
                        },
                        isgroup: false
                    }
                },
            },
            include: includeChatroomWithParticipantsExceptSelf(userId).include
        });
    }

    /** @deprecated
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
                        },
                        reactions: {
                            select: {
                                reactions_id: true,
                                msg_id: true,
                                emote_id: true,
                                user_id: true,
                                emote: true,
                                users: true
                            } // or as seen below, simply "include: { emote: true }" also works
                        }
                    },
                    orderBy: {
                        posted_at: "asc" // or msg_id, or leave out
                    }
                }
            },
        });
    }

    /**
     * Get all chat messages by a chatroom ID as a cursor-based pagination.
     * 
     * @param chatroomId chatroom to fetch messages for
     * @param oldCursor cursor (ID of )
     * @returns up to 10 items of @see ChatMessageWithUser and the ID of the oldest message to be used as the next "oldCursor" 
     */
    async getAllChatMessagesByChatroomId(chatroomId: number, oldCursor: number): Promise<[ChatMessageWithUser[], number]> {
        let cursorPagination: any;
        if (oldCursor === -1) {
            cursorPagination = {
                take: -10,
            };
        }
        else {
            cursorPagination = {
                take: -10,
                skip: 1,
                cursor: {
                    msg_id: oldCursor
                }
            };
        }

        const queryResults = await this.prismaService.chat_messages.findMany({
            ...cursorPagination,
            where: {
                chatroom_id: chatroomId
            },
            orderBy: {
                posted_at: "asc"
            },
            include: {
                users: {
                    select: {
                        user_id: true,
                        display_name: true,
                        creation_date: true
                    }
                },
                reactions: {
                    include: {
                        emote: true,
                        users: true
                    }
                }
            }
        });

        if (queryResults.length == 0) {
            return [[], 0];
        }
        // its literally the same, but ok
        return [queryResults as ChatMessageWithUser[], queryResults[0].msg_id];
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
     * Insert a new image chat message record.
     * 
     * @param message message content
     * @param userId userId of the user who wrote the message
     * @param chatroomId the chatroomId in which the message was written
     * @param isimage if the message is an image, defaults to false
     * @returns a @see ChatMessageWithUser
     */
    async insertMessage(message: string, userId: number, chatroomId: number, isimage: boolean = false): Promise<ChatMessageWithUser> {
        return this.prismaService.chat_messages.create({
            data: {
                msg_content: message,
                user_id: userId,
                chatroom_id: chatroomId,
                isimage: isimage
            },
            include: {
                users: {
                    select: {
                        user_id: true,
                        display_name: true,
                        creation_date: true
                    }
                },
                reactions: {
                    include: {
                        emote: true,
                        users: true
                    }
                }
            }
        });
    }

    /**
     * Insert a new file chat message record.
     * 
     * @param fileName file name (as the message content)
     * @param fileId file ID
     * @param userId userId of the user who wrote the message
     * @param chatroomId the chatroomId in which the message was written
     * @returns a @see ChatMessageWithUser
     */
    async insertFileMessage(fileName: string, fileId: string, userId: number, chatroomId: number): Promise<ChatMessageWithUser> {
        return this.prismaService.chat_messages.create({
            data: {
                msg_content: fileName,
                user_id: userId,
                chatroom_id: chatroomId,
                isfile: true,
                file_uuid: fileId
            },
            include: {
                users: {
                    select: {
                        user_id: true,
                        display_name: true,
                        creation_date: true
                    }
                },
                reactions: {
                    include: {
                        emote: true,
                        users: true
                    }
                }
            }
        });
    }

    /**
     * Get the message by its ID.
     * 
     * @param messageId the message to get
     * @returns @see ChatMessageWithUser
     */
    async getMessageById(messageId: number): Promise<ChatMessageWithUser | undefined> {
        return this.prismaService.chat_messages.findUnique({
            where: {
                msg_id: messageId
            },
            include: {
                users: {
                    select: {
                        user_id: true,
                        display_name: true,
                        creation_date: true
                    }
                },
                reactions: {
                    include: {
                        emote: true,
                        users: true
                    }
                }
            }
        })
    }

    /**
     * Delete a chat message and its related reactions.
     * 
     * @param messageId the message to delete
     * @returns if the message has been deleted
     */
    async deleteMessage(messageId: number): Promise<boolean> {
        const message = await this.prismaService.chat_messages.delete({
            where: {
                msg_id: messageId
            }
        });
        return message !== null || message !== undefined ? true : false;
    }

    /**
     * Insert a new chat message reaction.
     * 
     * @param messageId the message ID on which the reaction was made on
     * @param emoteId the ID of the emote used
     * @returns a MessageReaction
     */
    async insertEmoteReaction(messageId: number, userId: number, emoteId: number): Promise<MessageReaction> {
        return this.prismaService.reactions.create({
            data: {
                msg_id: messageId,
                emote_id: emoteId,
                user_id: userId
            },
            include: {
                emote: true,
                users: true
            }
        });
    }

    /* EMOTE fetching */
    async getAllAvailableEmotes(): Promise<emote[]> {
        return this.prismaService.emote.findMany();
    }

    /* NOTIFICATION */

    /**
     * Fetch all notifications which belong to the given user.
     * 
     * @param userId user for which to fetch notifications
     * @returns a Notification[]
     */
    async getAllNotificationsForUser(userId: number): Promise<Notification[]> {
        return this.prismaService.notifications.findMany({
            where: {
                user_id: userId
            },
            include: {
                users: true,
                originated_from_user: true,
                chatrooms: true
            },
            orderBy: {
                date: "asc"
            }
        });
    }

    /**
     * 
     * @param userId user ID (current logged in user)
     * @param originatedFrom user ID of who triggered the notification
     * @param chatroomId chatroom ID in which the notification happened
     * @param type the type of the notification, one of "message", "reaction" or "call"
     * @param content the content of the notification
     * @returns a Notification
     */
    async insertNewNotification(userId: number, originatedFrom: number, chatroomId: number, type: string, content: string): Promise<Notification> {
        return this.prismaService.notifications.create({
            data: {
                user_id: userId,
                originated_from: originatedFrom,
                chatroom_id: chatroomId,
                type: type,
                content: content
            },
            include: {
                users: true,
                originated_from_user: true,
                chatrooms: true
            }
        });
    }

    /**
     * Deletes a notification.
     * 
     * @param notificationId the notification to delete
     */
    async deleteNotification(notificationId: number) {
        return this.prismaService.notifications.delete({
            where: {
                notification_id: notificationId
            }
        });
    }

}
