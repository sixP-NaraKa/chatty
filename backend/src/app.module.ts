import { Module } from '@nestjs/common';
import { ServeStaticModule } from '@nestjs/serve-static';
import { ConfigModule } from '@nestjs/config';
import { join } from 'path';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaService } from './prisma/prisma.service';

@Module({
  imports: [
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, "../../frontend", "dist/chatty")
  }),
    ConfigModule.forRoot(),
],
  controllers: [AppController],
  providers: [AppService, PrismaService],
})
export class AppModule {}
