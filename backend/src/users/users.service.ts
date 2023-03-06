import { Injectable } from '@nestjs/common';
import { settings, users } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
import { User } from '../../../shared/types/db-dtos.js';

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
                password: passw,
                settings: {
                    create: { // no explicit declarations, simply use default values
                    }
                }
            },
            select: {
                user_id: true,
                display_name: true,
                creation_date: true,
                password: false
            }
        })
    }

    async getUserSettings(userId: number): Promise<settings> {
        return await this.prismaService.settings.findFirst({
            where: {
                user_id: userId
            }
        })
    }

    async updateUserSettings(body: settings) {
        await this.prismaService.settings.update({
            where: {
                settings_id: body.settings_id
            },
            data: {
                filter: body.filter,
                font_size: body.font_size
            }
        })
    }
}
