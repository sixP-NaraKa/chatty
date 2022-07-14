import { Module } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AppService } from 'src/app.service';
import { AuthService } from 'src/auth/auth.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { UsersService } from 'src/users/users.service';
import { SocketGateway } from './websocket.gateway';

@Module({
    providers: [SocketGateway, AuthService, UsersService, JwtService, PrismaService]
})
export class WebsocketModule {}
