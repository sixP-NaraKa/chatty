import { Injectable } from '@nestjs/common';
import { users } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { User } from '../../../shared/types/db-dtos';

@Injectable()
export class UsersService {

    constructor(private prismaService: PrismaService) { }

    async findOne(username: string): Promise<users | undefined> {
        return await this.prismaService.users.findFirst({
            where: {
                display_name: username
            }
        })
    }

    async findOneById(userId: number): Promise<User | undefined> {
        return await this.prismaService.users.findUnique({
            select: {
                user_id: true,
                display_name: true,
                creation_date: true
            },
            where: {
                user_id: userId
            }
        })
    }

    async create(username: string, passw: string): Promise<User> {
        return await this.prismaService.users.create({
            data: {
                display_name: username,
                password: passw
            },
            select: {
                user_id: true,
                display_name: true,
                creation_date: true,
                password: false
            }
        })
    }
}
