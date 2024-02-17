import {
    Body,
    Controller,
    Delete,
    Get,
    ParseArrayPipe,
    ParseBoolPipe,
    ParseIntPipe,
    Post,
    Query,
    StreamableFile,
    UploadedFile,
    UseGuards,
    UseInterceptors,
} from '@nestjs/common';
import { AppService } from './app.service.js';
import {
    ChatRoomWithParticipantsExceptSelf,
    ChatMessageWithUser,
    MessageReaction,
    Notification,
    Settings,
    Emote,
} from '../../shared/types/db-dtos.js';
import { AuthGuard } from '@nestjs/passport';
import { UsersService } from './users/users.service.js';
import * as fs from 'fs';
import { randomUUID } from 'crypto';
import { FileInterceptor } from '@nestjs/platform-express';
import * as fileType from 'file-type';
import { FileTypeResult } from 'file-type/core';
import { Res } from '@nestjs/common';
import { Response } from 'express';
import { ChatroomGuard } from './guards/chatroom.guard.js';

@Controller()
@UseGuards(AuthGuard())
export class AppController {
    imageFilesFolder: string = 'files/images';
    filesUploadFolder: string = 'files/upload';

    constructor(private readonly appService: AppService, private userService: UsersService) {}

    @Get('/api/user/users')
    async getAllUsers() {
        return await this.appService.getAllUsers();
    }

    /* USER SETTINGS */

    @Get('/api/user/settings')
    async getUserSettings(@Query('userId', ParseIntPipe) userId: number) {
        return await this.userService.getUserSettings(userId);
    }

    @Post('/api/user/update/settings')
    async updateUserSettings(@Body() body: Settings) {
        return await this.userService.updateUserSettings(body);
    }

    /* CHATROOMS */

    @Get('/api/user/chatrooms')
    async getChatroomsForUserWithParticipantsExceptSelf(
        @Query('userId', ParseIntPipe) userId: number
    ): Promise<ChatRoomWithParticipantsExceptSelf[]> {
        return await this.appService.getChatroomsForUserWithParticipantsExceptSelf(userId);
    }

    @Get('/api/user/chatroom')
    async getSingleChatroomForUserWithParticipantsExceptSelf(
        @Query('userId', ParseIntPipe) userId: number,
        @Query('chatroomId', ParseIntPipe) chatroomId: number
    ) {
        return await this.appService.getSingleChatroomForUserWithParticipantsExceptSelf(userId, chatroomId);
    }

    @Get('/api/user/chatroom/1on1')
    async getSingleChatroomforUserByUserAndParticipantUserId(
        @Query('userId', ParseIntPipe) userId: number,
        @Query('participant_user_id', ParseIntPipe) participantUserId: number
    ) {
        return await this.appService.getSingleChatroomForUserWithParticipantUserId(userId, participantUserId);
    }

    @Get('/api/user/chatrooms/create')
    async createChatroomWithParticipants(
        @Query('userId', ParseIntPipe) userId: number,
        @Query('participant_user_id', new ParseArrayPipe({ items: Number, separator: ',' }))
        participantUserIds: number[],
        @Query('is_group', ParseBoolPipe) isGroup: boolean,
        @Query('group_name') groupName?: string | null
    ): Promise<ChatRoomWithParticipantsExceptSelf> {
        return await this.appService.createChatroomWithParticipants(userId, participantUserIds, isGroup, groupName);
    }

    @Post('/api/user/chatrooms/groups/remove')
    async removeUserFromGroupChat(@Body() body: { userId: number; chatroomId: number }): Promise<number> {
        return await this.appService.removeUserFromGroupChat(body.userId, body.chatroomId);
    }

    @Get('/api/user/chatrooms/groups/add')
    async addUsersToGroupChat(
        @Query('userIdsToAdd', new ParseArrayPipe({ items: Number, separator: ',' }))
        userIds: number[],
        @Query('chatroomId', ParseIntPipe) chatroomId: number
    ) {
        await this.appService.addUsersToGroupChat(userIds, chatroomId);
    }

    /* CHAT MESSAGES */

    @Get('/api/chat/chatmessages')
    async getMessagesForChatroom(
        @Query('chatroomId', ParseIntPipe) chatroomId: number,
        @Query('oldCursor', ParseIntPipe) oldCursor: number
    ): Promise<[ChatMessageWithUser[], number]> {
        return await this.appService.getAllChatMessagesByChatroomId(chatroomId, oldCursor);
    }

    @UseGuards(ChatroomGuard)
    @Post('/api/chat/create/chatmessage')
    async insertMessage(
        @Body() body: { message: string; userId: number; chatroomId: number }
    ): Promise<ChatMessageWithUser> {
        return await this.appService.insertMessage(body.message, body.userId, body.chatroomId);
    }

    @UseGuards(ChatroomGuard)
    @Delete('/api/chat/delete/chatmessage')
    async deleteMessage(@Body() body: { messageId: number; userId: number; chatroomId: number }): Promise<boolean> {
        const message = await this.appService.getMessageById(body.messageId);
        if (!message || message.user_id !== body.userId) {
            return false;
        }
        return await this.appService.deleteMessage(body.messageId);
    }

    /* IMAGE MESSAGES */

    @UseGuards(ChatroomGuard)
    @UseInterceptors(FileInterceptor('image'))
    @Post('/api/chat/create/chatimagemessage')
    async insertImageMessage(
        @Query('chatroomId', ParseIntPipe) chatroomId: number,
        @Query('userId', ParseIntPipe) userId: number,
        @UploadedFile() image: Express.Multer.File
    ): Promise<ChatMessageWithUser> {
        var uuid: string = randomUUID();
        fs.writeFileSync(`${this.imageFilesFolder}/${uuid}.png`, image.buffer, {
            encoding: 'binary',
        });
        return await this.appService.insertMessage(uuid, userId, chatroomId, true);
    }

    @Get('/api/chat/chatimage')
    async getImageMessage(@Query('imageId') imageId: string): Promise<StreamableFile> {
        const file = fs.createReadStream(`${this.imageFilesFolder}/${imageId}.png`, { autoClose: true });
        file.on('error', () => console.log('could not read image file', imageId, 'as it does not exist'));
        return new StreamableFile(file);
    }

    /* FILE UPLOAD */

    @UseInterceptors(FileInterceptor('file'))
    @Post('/api/file/validate')
    async validateFileType(
        @UploadedFile() file: Express.Multer.File
    ): Promise<[isValid: boolean, fileType: FileTypeResult]> {
        const ft: FileTypeResult = await fileType.fileTypeFromBuffer(file.buffer);
        if (ft === undefined) return [false, undefined];
        if (ft.ext === 'exe' || ft.ext === 'elf') return [false, ft];
        return [true, ft];
    }

    // TODO: add backend validation of file size
    @UseGuards(ChatroomGuard)
    @UseInterceptors(FileInterceptor('file'))
    @Post('/api/chat/create/chatfilemessage')
    async insertFileMessage(
        @Res() res: Response,
        @Query('chatroomId', ParseIntPipe) chatroomId: number,
        @Query('userId', ParseIntPipe) userId: number,
        @UploadedFile() file: Express.Multer.File
    ): Promise<ChatMessageWithUser> {
        const [isValid, ft] = await this.validateFileType(file);
        if (!isValid) {
            // check if the result is null and the file.name has extension ".txt"
            // if that is the case, we will treat the file as valid
            // Note: a similar valdiation is done in the frontend as well
            if (ft === null || ft === undefined) {
                if (file.originalname.split('.').pop()?.toLowerCase() !== 'txt') {
                    res.status(400).send(`File Type is unknown.`);
                    return;
                }
            } else {
                res.status(400).send(`File Type '${ft.ext}' is invalid.`);
                return;
            }
        }
        var uuid: string = randomUUID();
        fs.writeFileSync(`${this.filesUploadFolder}/${uuid}`, file.buffer, {
            encoding: 'binary',
        });
        const m = await this.appService.insertFileMessage(file.originalname, uuid, userId, chatroomId);
        res.status(201).send(m);
    }

    @Get('/api/chat/chatfile')
    async getFileMessage(@Query('fileId') fileId: string): Promise<StreamableFile> {
        const file = fs.createReadStream(`${this.filesUploadFolder}/${fileId}`, {
            autoClose: true,
        });
        file.on('error', () => console.log('could not read file', fileId, 'as it does not exist'));
        return new StreamableFile(file);
    }

    /* EMOTES */

    @Get('/api/emotes')
    async getAvailableEmotes(): Promise<Emote[]> {
        return await this.appService.getAllAvailableEmotes();
    }

    @Post('/api/chat/create/chatmessage/reaction')
    async insertEmoteReaction(
        @Body() body: { messageId: number; userId: number; emoteId: number }
    ): Promise<MessageReaction> {
        return await this.appService.insertEmoteReaction(body.messageId, body.userId, body.emoteId);
    }

    @Get('/api/chat/chatmessages/count')
    async getChatroomMessageCount(@Query('chatroomId', ParseIntPipe) chatroomId: number): Promise<number> {
        return await this.appService.getChatroomMessagesCount(chatroomId);
    }

    /* NOTIFICATIONS */

    @Get('/api/user/notifications')
    async getAllNotificationsForUser(@Query('userId', ParseIntPipe) userId: number): Promise<Notification[]> {
        return await this.appService.getAllNotificationsForUser(userId);
    }

    @Post('/api/user/notifications/new')
    async insertNewNotification(
        @Body()
        body: {
            userId: number;
            originatedFrom: number;
            chatroomId: number;
            type: string;
            content: string;
        }
    ): Promise<Notification> {
        return await this.appService.insertNewNotification(
            body.userId,
            body.originatedFrom,
            body.chatroomId,
            body.type,
            body.content
        );
    }

    @Post('/api/user/notifications/delete')
    async deleteNotification(@Body() body: { notificationId: number }) {
        return await this.appService.deleteNotification(body.notificationId);
    }
}
