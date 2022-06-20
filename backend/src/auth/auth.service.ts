import { Injectable } from '@nestjs/common';
import { UsersService } from 'src/users/users.service';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { users } from '@prisma/client';
import { User } from '../../../shared/types/db-dtos';
import { UserAlreadyExistsError } from '../errors';

@Injectable()
export class AuthService {

    constructor(private usersService: UsersService, private jwtService: JwtService) { }

    async validateUser(username: string, passw: string): Promise<User | undefined> {
        console.log("provided username and password", username, passw);
        const user = await this.usersService.findOne(username);
        if (user && await bcrypt.compare(passw, user.password)) {
            const { password, ...result } = user;
            return result;
        }
        return null;
    }

    async createUser(user: { username: string, password: string }): Promise<User | undefined> {
        console.log("creating new user", user);
        const foundUser = await this.usersService.findOne(user.username);
        if (!foundUser) {
            const pwHash = await bcrypt.hash(user.password, 10);
            return await this.usersService.create(user.username, pwHash);
        }
        // throw error to be catched on the frontend side
        throw new UserAlreadyExistsError("A user with this username already exists.");
    }

    async login(user: users) {
        const payload = { username: user.display_name, sub: user.user_id };
        return {
            access_token: this.jwtService.sign(payload),
            username: user.display_name,
            userId: user.user_id
        };
    }
}