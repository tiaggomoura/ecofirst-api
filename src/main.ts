import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: '*', // permite seu frontend local
    credentials: true, // se usar cookies/autenticação
  });

  const port = process.env.PORT ? Number(process.env.PORT) : 3000;
  await app.listen(port, '0.0.0.0'); // <-- escuta todas interfaces

  //await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
