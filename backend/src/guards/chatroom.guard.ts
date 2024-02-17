import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';
import { AppService } from '../app.service.js';

@Injectable()
export class ChatroomGuard implements CanActivate {
    constructor(private readonly appService: AppService) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest();
        return this.canPostInChatroom(request);
    }

    async canPostInChatroom(request: Request): Promise<boolean> {
        const params: { userId: number; chatroomId: number } =
            Object.keys(request.body).length > 0
                ? request.body
                : Object.keys(request.query).length > 0
                ? request.query
                : {};
        if (params === undefined || Object.keys(params).length === 0) {
            return false;
        }
        const userId = Number(params.userId);
        const chatroomId = Number(params.chatroomId);
        return (await this.appService.isUserPartOfChatroom(userId, chatroomId)) ? true : false;
    }
}
