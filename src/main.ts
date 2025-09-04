import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  app.useGlobalPipes(new ValidationPipe({
    transform: true,
    whitelist: true,
    forbidNonWhitelisted: true,
  }));
  
  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`🚀 Customer Identity Service running on: http://localhost:${port}`);
  console.log(`📊 Neo4j Browser available at: http://localhost:7474`);
}
bootstrap();
