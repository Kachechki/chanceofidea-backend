import { NestFactory } from "@nestjs/core";
import { AppModule, ObserveInstrument } from "./app.module";
import { ValidationPipe } from "@nestjs/common";
import cookieParser from "cookie-parser";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { apiReference } from "@scalar/nestjs-api-reference";
import * as dotenv from "dotenv";

dotenv.config();

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    instrument: ObserveInstrument,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      disableErrorMessages: false,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  app.use(cookieParser());

  const config = new DocumentBuilder()
    .setTitle("Chance of Idea API")
    .setDescription(
      "API documentation for Chance of Idea — a marketplace for unfinished projects.",
    )
    .setVersion("1.0.0")
    .addBearerAuth(
      {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
      },
      "main",
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);

  app.use(
    "/docs",
    apiReference({
      content: document,
      authentication: {
        preferredSecurityScheme: "main",
      },
    }),
  );

  app.useSecurityHeaders();
  app.enableCors({
    methods: ["GET", "POST", "PATCH", "DELETE"],
  });

  if (!process.env.FRONTEND_URL)
    throw new Error("no FRONTEND_URL specified in .env");

  app.enableCsrfProtection({
    trustedOrigins: [process.env.FRONTEND_URL],
  });

  await app.listen(process.env.PORT ?? 3000);
}
void bootstrap();
