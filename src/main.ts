import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: 'http://localhost:3001', // permite seu frontend local
    credentials: true, // se usar cookies/autenticação
  });

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
