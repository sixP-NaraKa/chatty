import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ServeStaticModule } from '@nestjs/serve-static';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { PrismaService } from './prisma/prisma.service.js';
import { AuthModule } from './auth/auth.module.js';
import { UsersModule } from './users/users.module.js';
import { WebsocketModule } from './websocket/websocket.module.js';
import { VerifyUserMiddleware } from './verify-user.middleware.js';
import { AuthController } from './controllers/auth.controller.js';

@Module({
    imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        ...(process.env.NODE_ENV === 'production'
            ? [
                  ServeStaticModule.forRootAsync({
                      imports: [ConfigModule],
                      inject: [ConfigService],
                      useFactory: (config: ConfigService) => [
                          {
                              rootPath: config.get<string>('FRONTEND_DIST'),
                              renderPath: '*',
                              exclude: ['/api*', '/auth*'],
                          },
                      ],
                  }),
              ]
            : []),
        AuthModule,
        UsersModule,
        WebsocketModule,
    ],
    controllers: [AppController, AuthController],
    providers: [AppService, PrismaService],
})
export class AppModule implements NestModule {
    configure(consumer: MiddlewareConsumer) {
        consumer.apply(VerifyUserMiddleware).forRoutes('/api');
    }
}
