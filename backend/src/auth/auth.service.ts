import { Injectable } from '@nestjs/common';
import { UsersService } from '../users/users.service.js';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { User } from '../../../shared/types/db-dtos.js';
import { UserAlreadyExistsError } from '../errors.js';
import { jwtConstants } from './constants.js';

@Injectable()
export class AuthService {
    constructor(private usersService: UsersService, private jwtService: JwtService) {}

    async validateUser(username: string, passw: string): Promise<User | undefined> {
        const user = await this.usersService.findOne(username);
        if (user && (await bcrypt.compare(passw, user.password))) {
            const { password, ...result } = user;
            return result;
        }
        return null;
    }

    async createUser(user: { username: string; password: string }): Promise<User | undefined> {
        const foundUser = await this.usersService.findOne(user.username);
        if (!foundUser) {
            const pwHash = await bcrypt.hash(user.password, 10);
            return await this.usersService.create(user.username, pwHash);
        }
        // throw error to be catched on the frontend side
        throw new UserAlreadyExistsError('A user with this username already exists.');
    }

    async login(user: User) {
        const payload = { username: user.display_name, sub: user.user_id };
        return {
            access_token: this.jwtService.sign(payload, {
                secret: jwtConstants.secret ?? process.env.JWT_SECRET,
            }),
            username: user.display_name,
            userId: user.user_id,
        };
    }

    async verifyToken(token: string): Promise<{ username: string; sub: number; iat: number; exp: number }> {
        return this.jwtService.verify(token, {
            secret: jwtConstants.secret ?? process.env.JWT_SECRET,
        });
    }
}
