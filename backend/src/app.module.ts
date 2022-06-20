import { Module } from '@nestjs/common';
import { ServeStaticModule } from '@nestjs/serve-static';
import { ConfigModule } from '@nestjs/config';
import { join } from 'path';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaService } from './prisma/prisma.service';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';

@Module({
    imports: [
        ServeStaticModule.forRoot({
            rootPath: join(__dirname, "../../frontend", "dist/chatty")
        }),
        ConfigModule.forRoot(),
        AuthModule,
        UsersModule,
    ],
    controllers: [AppController],
    providers: [AppService, PrismaService],
})
export class AppModule { }
