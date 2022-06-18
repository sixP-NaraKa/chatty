import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { PrismaService } from './prisma/prisma.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: true,
    methods: "GET,POST"
  });
  // app.useGlobalPipes(new ValidationPipe({
  //   transform: true
  // }));
  const prismaService = app.get(PrismaService);
  await prismaService.enableShutDownHooks(app);
  await app.listen(3100);
}
bootstrap();
