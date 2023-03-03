import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service';
import { User, ChatRoomWithParticipantsExceptSelf, ChatroomWithMessages, ChatMessageWithUser, MessageReaction, Notification } from '../../shared/types/db-dtos';
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

    /**
     * Get the given chatroom and all its chat messages.
     * 
     * @param chatroomId chatroomId to fetch messages for
     * @returns a @see ChatroomWithMessages
     */
    async getAllMessagesForChatroom(chatroomId: number): Promise<ChatroomWithMessages> {
        // add pagination to only fetch, e.g., 25 messages at a time
        // in the UI add a button (e.g. on top of the latest 25 messages always) with which more can be loaded
        // or add infnite scrolling (maybe, idk)
        // endpoint needs to be adapted to take in a page object in which the current page and page size are given
        // then use this here in "skip" and "take" - "skip" will be something like "(pageNumber - 1) * take" if pageNumber is not 0-based
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
