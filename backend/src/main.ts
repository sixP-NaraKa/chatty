import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import { PrismaService } from './prisma/prisma.service.js';

async function bootstrap() {
    // const httpsOptions = {
    //     key: fs.readFileSync('chatty-server-key.pem'),
    //     cert: fs.readFileSync('chatty-server-cert.pem'),
    // };
    // const app = await NestFactory.create(AppModule, { httpsOptions });
    const app = await NestFactory.create(AppModule);

    if (process.env.NODE_ENV !== 'production') {
        app.enableCors({
            origin: ['http://localhost:4300'],
            methods: 'GET,POST,PUT,DELETE',
            credentials: true,
        });
    }

    // app.useGlobalPipes(new ValidationPipe({
    //   transform: true
    // }));
    const prismaService = app.get(PrismaService);
    await prismaService.enableShutDownHooks(app);
    await app.listen(3100);
}
bootstrap();
