import { Body, Controller, Post, UseGuards, Request } from '@nestjs/common';
import { AuthService } from '../auth/auth.service.js';
import { LocalAuthGuard } from '../auth/local-auth.guard.js';
import { User } from '../../../shared/types/db-dtos.js';

@Controller()
export class AuthController {
    constructor(private authService: AuthService) {}

    @UseGuards(LocalAuthGuard)
    @Post('/auth/login')
    async login(@Request() req: any) {
        return this.authService.login(req.user as User);
    }

    @Post('/auth/create')
    async createUser(@Body() body: { username: string; password: string }) {
        return this.authService.createUser(body);
    }
}
