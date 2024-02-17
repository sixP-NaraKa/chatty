import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import * as fs from 'fs';
import { AppModule } from './app.module.js';
import { PrismaService } from './prisma/prisma.service.js';

async function bootstrap() {
    const httpsOptions = {
        key: fs.readFileSync('chatty-server-key.pem'),
        cert: fs.readFileSync('chatty-server-cert.pem'),
    };
    const app = await NestFactory.create(AppModule, { httpsOptions });
    app.enableCors({
        origin: [
            /.*:\/\/localhost:4300/, // /.+?(?=localhost:4300)/,
            process.env['HOST'],
        ], // true,
        methods: 'GET,POST,PUT,DELETE',
        credentials: true,
    });
    // app.useGlobalPipes(new ValidationPipe({
    //   transform: true
    // }));
    const prismaService = app.get(PrismaService);
    await prismaService.enableShutDownHooks(app);
    await app.listen(3100);
}
bootstrap();
