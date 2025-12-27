import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  // Listening on 3001 to avoid conflict with AdGuard (3000)
  await app.listen(3001);
  console.log('Application is listening on port 3001');
}
bootstrap();
