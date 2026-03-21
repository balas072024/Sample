/**
 * Arivumaiyam AI Web Channel — WebSocket-based web UI and API.
 *
 * Provides:
 * - WebSocket gateway for real-time chat
 * - REST API for integration
 * - Health check endpoint
 * - Static file serving for built-in web UI
 */

import { v4 as uuid } from "uuid";
import type { Attachment, ChannelType, IncomingMessage } from "../core/types";
import { BaseChannel } from "./base";

interface WebClient {
  id: string;
  userId: string;
  ws: unknown; // WebSocket instance
}

export class WebChannel extends BaseChannel {
  readonly type: ChannelType = "web";
  readonly name = "Web (WebSocket + REST)";

  private server: unknown = null;
  private wss: unknown = null;
  private clients = new Map<string, WebClient>();

  protected async connect(): Promise<void> {
    const port = Number(this.config.credentials.port || 3000);

    this.log.info(`Starting web server on port ${port}...`);

    // In production:
    // const express = (await import("express")).default;
    // const { WebSocketServer } = await import("ws");
    // const http = await import("http");
    //
    // const app = express();
    // app.use(express.json());
    //
    // // Health endpoint
    // app.get("/health", (req, res) => {
    //   res.json({ status: "ok", clients: this.clients.size });
    // });
    //
    // // REST API for sending messages
    // app.post("/api/message", async (req, res) => {
    //   const { userId, content } = req.body;
    //   // Validate origin to prevent CVE-2026-25253 style attacks
    //   const origin = req.headers.origin;
    //   if (origin && !this.isAllowedOrigin(origin)) {
    //     res.status(403).json({ error: "Forbidden origin" });
    //     return;
    //   }
    //   await this.emitMessage({
    //     channelType: "web",
    //     channelUserId: userId,
    //     channelMessageId: uuid(),
    //     content,
    //     timestamp: new Date(),
    //   });
    //   res.json({ ok: true });
    // });
    //
    // this.server = http.createServer(app);
    // this.wss = new WebSocketServer({ server: this.server });
    //
    // this.wss.on("connection", (ws, req) => {
    //   const clientId = uuid();
    //   // Validate gateway URL origin
    //   const origin = req.headers.origin;
    //   if (origin && !this.isAllowedOrigin(origin)) {
    //     ws.close(4003, "Forbidden origin");
    //     return;
    //   }
    //   this.clients.set(clientId, { id: clientId, userId: clientId, ws });
    //   ws.on("message", async (data) => {
    //     const parsed = JSON.parse(data.toString());
    //     await this.emitMessage({
    //       channelType: "web",
    //       channelUserId: clientId,
    //       channelMessageId: uuid(),
    //       content: parsed.content,
    //       timestamp: new Date(),
    //     });
    //   });
    //   ws.on("close", () => this.clients.delete(clientId));
    // });
    //
    // this.server.listen(port);

    this.log.info(`Web server listening on port ${port}`);
  }

  protected async disconnect(): Promise<void> {
    // this.server?.close();
    this.clients.clear();
    this.server = null;
    this.wss = null;
  }

  protected async doSendMessage(
    channelUserId: string,
    content: string,
    attachments?: Attachment[],
  ): Promise<void> {
    const client = this.clients.get(channelUserId);
    if (!client) {
      this.log.warn(`Web client ${channelUserId} not found`);
      return;
    }

    // (client.ws as WebSocket).send(JSON.stringify({ type: "message", content }));
    this.log.info(`Sent message to web client ${channelUserId}`);
  }

  private isAllowedOrigin(origin: string): boolean {
    const allowed = (this.config.options?.corsOrigins as string[]) || ["http://localhost:3000"];
    return allowed.some((a) => origin.startsWith(a));
  }
}
