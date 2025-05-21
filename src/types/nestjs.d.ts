import { Server } from 'http';

declare module 'express' {
  interface Request {
    requestId: string;
  }
}
