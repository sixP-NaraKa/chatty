import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { PrismaService } from './prisma/prisma.service.js';
import { AuthModule } from './auth/auth.module.js';
import { UsersModule } from './users/users.module.js';
import { WebsocketModule } from './websocket/websocket.module.js';
import { VerifyUserMiddleware } from './verify-user.middleware.js';

@Module({
    imports: [
        ConfigModule.forRoot(),
        AuthModule,
        UsersModule,
        WebsocketModule,
    ],
    controllers: [AppController],
    providers: [AppService, PrismaService],
})
export class AppModule implements NestModule {

    configure(consumer: MiddlewareConsumer) {
        consumer.apply(VerifyUserMiddleware).forRoutes("/api");
    }
}
