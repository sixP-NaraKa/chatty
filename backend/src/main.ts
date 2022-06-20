import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { PrismaService } from './prisma/prisma.service';

async function bootstrap() {
    const app = await NestFactory.create(AppModule);
    app.enableCors({
        origin: "http://localhost:4300", // true,
        methods: "GET,POST",
        credentials: true
    });
    // app.useGlobalPipes(new ValidationPipe({
    //   transform: true
    // }));
    const prismaService = app.get(PrismaService);
    await prismaService.enableShutDownHooks(app);
    await app.listen(3100);
}
bootstrap();
