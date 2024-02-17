import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { AuthService } from './auth/auth.service.js';
import { UsersService } from './users/users.service.js';

@Injectable()
export class VerifyUserMiddleware implements NestMiddleware {
    constructor(private authService: AuthService, private userService: UsersService) {}

    async use(req: Request, res: Response, next: NextFunction) {
        const queryUserId = Number(req.query.userId);
        const bearerToken = req.headers.authorization?.split(' ')[1];
        let jwtUser;
        try {
            jwtUser = await this.authService.verifyToken(bearerToken);
        } catch (e) {
            console.log('=> Middlware: Token is invalid. <=');
            res.status(401).send();
            return;
        }

        const dbUser = await this.userService.findOneById(jwtUser.sub);

        if (!dbUser || !jwtUser) {
            console.log('=> Middlware: No user found. <=');
            res.status(401).send();
            return;
        }

        if (queryUserId !== dbUser.user_id) {
            console.log("=> Middleware: User IDs don't match. <=");
            res.status(401).send();
            return;
        }

        next();
    }
}
