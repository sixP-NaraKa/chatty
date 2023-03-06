import { Module } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { UsersService } from './users.service.js';

@Module({
    providers: [UsersService, PrismaService],
    exports: [UsersService]
})
export class UsersModule { }
