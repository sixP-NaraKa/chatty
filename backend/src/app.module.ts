import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ServeStaticModule } from '@nestjs/serve-static';
import { ConfigModule } from '@nestjs/config';
import { join } from 'path';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaService } from './prisma/prisma.service';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { WebsocketModule } from './websocket/websocket.module';
import { VerifyUserMiddleware } from './verify-user.middleware';

@Module({
    imports: [
        ServeStaticModule.forRoot({
            rootPath: join(__dirname, "/../../../../frontend/dist/chatty")
        }),
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
