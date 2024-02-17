import { Module } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AppService } from '../app.service.js';
import { AuthService } from '../auth/auth.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { UsersService } from '../users/users.service.js';
import { SocketGateway } from './websocket.gateway.js';

@Module({
    providers: [SocketGateway, AuthService, UsersService, JwtService, PrismaService],
})
export class WebsocketModule {}
