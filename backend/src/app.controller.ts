import { Body, Controller, Delete, Get, ParseArrayPipe, ParseBoolPipe, ParseIntPipe, Post, Query, Request, StreamableFile, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { emote, notifications, settings, users } from '@prisma/client';
import { AppService } from './app.service.js';
import { ChatRoomWithParticipantsExceptSelf, ChatroomWithMessages, ChatMessageWithUser, MessageReaction, Notification } from '../../shared/types/db-dtos.js';
import { LocalAuthGuard } from './auth/local-auth.guard.js';
import { AuthService } from './auth/auth.service.js';
import { AuthGuard } from '@nestjs/passport';
import { UsersService } from './users/users.service.js';
import * as fs from 'fs';
import { randomUUID } from 'crypto';
import { FileInterceptor } from '@nestjs/platform-express';
import * as fileType from "file-type";
import { FileTypeResult } from 'file-type/core';
import { BadRequestException, Res } from '@nestjs/common';
import { Response } from 'express';

@Controller()
export class AppController {

    imageFilesFolder: string = "files/images";
    filesUploadFolder: string = "files/upload";

    constructor(private readonly appService: AppService, private authService: AuthService, private userService: UsersService) { }

    @UseGuards(LocalAuthGuard)
    @Post("/auth/login")
    async login(@Request() req) {
        return this.authService.login(req.user as users);
    }

    @Post("/auth/create")
    async createUser(@Body() body: { username: string, password: string }) {
        return this.authService.createUser(body)
    }

    @UseGuards(AuthGuard())
    @Get("/api/user/users")
    async getAllUsers() {
        return await this.appService.getAllUsers();
    }

    /* USER SETTINGS */

    @UseGuards(AuthGuard())
    @Get("/api/user/settings")
    async getUserSettings(@Query("user_id", ParseIntPipe) userId: number) {
        return await this.userService.getUserSettings(userId);
    }

    @UseGuards(AuthGuard())
    @Post("/api/user/update/settings")
    async updateUserSettings(@Body() body: settings) {
        return await this.userService.updateUserSettings(body);
    }

    /* CHATROOMS */

    @UseGuards(AuthGuard())
    @Get("/api/user/chatrooms")
    async getChatroomsForUserWithParticipantsExceptSelf(@Query("user_id", ParseIntPipe) userId: number): Promise<ChatRoomWithParticipantsExceptSelf[]> {
        return await this.appService.getChatroomsForUserWithParticipantsExceptSelf(userId);
    }

    @UseGuards(AuthGuard())
    @Get("/api/user/chatroom")
    async getSingleChatroomForUserWithParticipantsExceptSelf(@Query("user_id", ParseIntPipe) userId: number,
        @Query("chatroom_id", ParseIntPipe) chatroomId: number) {
        return await this.appService.getSingleChatroomForUserWithParticipantsExceptSelf(userId, chatroomId);
    }

    @UseGuards(AuthGuard())
    @Get("/api/user/chatroom/1on1")
    async getSingleChatroomforUserByUserAndParticipantUserId(@Query("user_id", ParseIntPipe) userId: number,
        @Query("participant_user_id", ParseIntPipe) participantUserId: number) {
        return await this.appService.getSingleChatroomForUserWithParticipantUserId(userId, participantUserId);
    }

    @UseGuards(AuthGuard())
    @Get("/api/user/chatrooms/create")
    async createChatroomWithParticipants(@Query("user_id", ParseIntPipe) userId: number,
        @Query("participant_user_id", new ParseArrayPipe({ items: Number, separator: "," })) participantUserIds: number[],
        @Query("is_group", ParseBoolPipe) isGroup: boolean, @Query("group_name") groupName?: string | null): Promise<ChatRoomWithParticipantsExceptSelf> {
        return await this.appService.createChatroomWithParticipants(userId, participantUserIds, isGroup, groupName);
    }

    @UseGuards(AuthGuard())
    @Post("/api/user/chatrooms/groups/remove")
    async removeUserFromGroupChat(@Body() body: { userId: number, chatroomId: number }): Promise<number> {
        return await this.appService.removeUserFromGroupChat(body.userId, body.chatroomId);
    }

    @UseGuards(AuthGuard())
    @Get("/api/user/chatrooms/groups/add")
    async addUsersToGroupChat(@Query("userIdsToAdd", new ParseArrayPipe({ items: Number, separator: "," })) userIds: number[],
        @Query("chatroomId", ParseIntPipe) chatroomId: number) {
        await this.appService.addUsersToGroupChat(userIds, chatroomId);
    }

    /* CHAT MESSAGES */

    @UseGuards(AuthGuard())
    @Get("/api/chat/chatmessages")
    async getMessagesForChatroom(@Query("chatroom_id", ParseIntPipe) chatroomId: number, @Query("oldCursor", ParseIntPipe) oldCursor: number): Promise<[ChatMessageWithUser[], number]> {
        return await this.appService.getAllChatMessagesByChatroomId(chatroomId, oldCursor);
    }

    @UseGuards(AuthGuard())
    @Post("/api/chat/create/chatmessage")
    async insertMessage(@Body() body: { message: string, userId: number, chatroomId: number }): Promise<ChatMessageWithUser> {
        return await this.appService.insertMessage(body.message, body.userId, body.chatroomId);
    }

    @UseGuards(AuthGuard())
    @Delete("/api/chat/delete/chatmessage")
    async deleteMessage(@Body() body: { messageId: number, userId: number }): Promise<boolean> {
        const message = await this.appService.getMessageById(body.messageId);
        if (!message || message.user_id !== body.userId) {
            return false;
        }
        return await this.appService.deleteMessage(body.messageId);
    }

    /* IMAGE MESSAGES */

    @UseGuards(AuthGuard())
    @UseInterceptors(FileInterceptor("image"))
    @Post("/api/chat/create/chatimagemessage")
    async insertImageMessage(@Query("chatroom_id", ParseIntPipe) chatroomId: number, @Query("user_id", ParseIntPipe) userId: number, @UploadedFile() image: Express.Multer.File): Promise<ChatMessageWithUser> {
        var uuid: string = randomUUID();
        fs.writeFileSync(`${this.imageFilesFolder}/${uuid}.png`, image.buffer, { encoding: "binary" });
        return await this.appService.insertMessage(uuid, userId, chatroomId, true);
    }

    @UseGuards(AuthGuard())
    @Get("/api/chat/chatimage")
    async getImageMessage(@Query("imageId") imageId: string): Promise<StreamableFile> {
        const file = fs.createReadStream(`${this.imageFilesFolder}/${imageId}.png`, { autoClose: true });
        file.on("error", () => console.log("could not read image file", imageId, "as it does not exist"));
        return new StreamableFile(file);
    }

    /* FILE UPLOAD */

    @UseGuards(AuthGuard())
    @UseInterceptors(FileInterceptor("file"))
    @Post("/api/file/validate")
    async validateFileType(@UploadedFile() file: Express.Multer.File): Promise<[isValid: boolean, fileType: FileTypeResult]> {
        const ft: FileTypeResult = await fileType.fileTypeFromBuffer(file.buffer);
        if (ft === undefined) return [false, undefined];
        if (ft.ext === "exe" || ft.ext === "elf") return [false, ft];
        return [true, ft];
    }

    // TODO: add backend validation of the files, e.g. file size, extension/mimetype
    @UseGuards(AuthGuard())
    @UseInterceptors(FileInterceptor("file"))
    @Post("/api/chat/create/chatfilemessage")
    async insertFileMessage(@Res() res: Response, @Query("chatroom_id", ParseIntPipe) chatroomId: number, @Query("user_id", ParseIntPipe) userId: number, @UploadedFile() file: Express.Multer.File): Promise<ChatMessageWithUser> {
        const [isValid, ft] = await this.validateFileType(file);
        if (!isValid) {
            // check if the result is null and the file.name has extension ".txt"
            // if that is the case, we will treat the file as valid
            // Note: a similar valdiation is done in the frontend as well
            if (ft === null || ft === undefined) {
                if (file.originalname.split(".").pop()?.toLowerCase() !== "txt") {
                    res.status(400).send(`File Type is unknown.`);
                    return;
                }
            }
            else {
                res.status(400).send(`File Type '${ft.ext}' is invalid.`);
                return;
            }
        }
        var uuid: string = randomUUID();
        console.log("file before writing", file, uuid);
        fs.writeFileSync(`${this.filesUploadFolder}/${uuid}`, file.buffer, { encoding: "binary" });
        const m = await this.appService.insertFileMessage(file.originalname, uuid, userId, chatroomId);
        res.status(201).send(m);
    }

    @UseGuards(AuthGuard())
    @Get("/api/chat/chatfile")
    async getFileMessage(@Query("fileId") fileId: string): Promise<StreamableFile> {
        const file = fs.createReadStream(`${this.filesUploadFolder}/${fileId}`, { autoClose: true });
        file.on("error", () => console.log("could not read file", fileId, "as it does not exist"));
        return new StreamableFile(file);
    }

    /* EMOTES */

    @UseGuards(AuthGuard())
    @Get("/api/emotes")
    async getAvailableEmotes(): Promise<emote[]> {
        return await this.appService.getAllAvailableEmotes();
    }

    @UseGuards(AuthGuard())
    @Post("/api/chat/create/chatmessage/reaction")
    async insertEmoteReaction(@Body() body: { messageId: number, userId: number, emoteId: number }): Promise<MessageReaction> {
        return await this.appService.insertEmoteReaction(body.messageId, body.userId, body.emoteId);
    }

    @UseGuards(AuthGuard())
    @Get("/api/chat/chatmessages/count")
    async getChatroomMessageCount(@Query("chatroom_id", ParseIntPipe) chatroomId: number): Promise<number> {
        return await this.appService.getChatroomMessagesCount(chatroomId);
    }

    /* NOTIFICATIONS */

    @UseGuards(AuthGuard())
    @Get("/api/user/notifications")
    async getAllNotificationsForUser(@Query("user_id", ParseIntPipe) userId: number): Promise<Notification[]> {
        return await this.appService.getAllNotificationsForUser(userId);
    }

    @UseGuards(AuthGuard())
    @Post("/api/user/notifications/new")
    async insertNewNotification(@Body() body: { userId: number, originatedFrom: number, chatroomId: number, type: string, content: string }): Promise<Notification> {
        return await this.appService.insertNewNotification(body.userId, body.originatedFrom, body.chatroomId, body.type, body.content);
    }

    @UseGuards(AuthGuard())
    @Post("/api/user/notifications/delete")
    async deleteNotification(@Body() body: { notificationId: number }) {
        return await this.appService.deleteNotification(body.notificationId);
    }

}
