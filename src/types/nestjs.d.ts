import { Server } from 'http';

declare module '@nestjs/common' {
  interface INestApplication {
    getHttpServer(): Server;
  }
}

declare module 'express' {
  interface Request {
    requestId: string;
  }
}
