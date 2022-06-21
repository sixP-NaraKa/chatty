import { HttpException } from '@nestjs/common';

export class UserAlreadyExistsError extends HttpException {
    constructor(public message: string) {
        super(message, 400);
    }
}