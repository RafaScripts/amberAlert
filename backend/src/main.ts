import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  // Listening on 3000, Traefik will proxy 80 -> 3000
  await app.listen(3000);
  console.log('Application is listening on port 3000');
}
bootstrap();
