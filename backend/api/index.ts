// Entry point for Vercel serverless
import { buildApp } from '../src/app.js';

const app = buildApp();

// @fastify/aws-lambda adapter
export default async function handler(req: any, reply: any) {
  await app.ready();
  app.server.emit('request', req, reply);
}
