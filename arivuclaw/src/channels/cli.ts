/**
 * ArivuClaw CLI Channel — Terminal-based interactive chat.
 */

import * as readline from "readline";
import { v4 as uuid } from "uuid";
import type { Attachment, ChannelType, IncomingMessage } from "../core/types";
import { BaseChannel } from "./base";

export class CLIChannel extends BaseChannel {
  readonly type: ChannelType = "cli";
  readonly name = "CLI (Terminal)";

  private rl?: readline.Interface;
  private userId = "cli-user";

  protected async connect(): Promise<void> {
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      prompt: "\n🦀 You: ",
    });

    this.rl.on("line", async (line) => {
      const trimmed = line.trim();
      if (!trimmed) {
        this.rl?.prompt();
        return;
      }

      if (trimmed === "/quit" || trimmed === "/exit") {
        console.log("\nGoodbye! 👋");
        process.exit(0);
      }

      if (trimmed === "/help") {
        this.printHelp();
        this.rl?.prompt();
        return;
      }

      await this.emitMessage({
        channelType: "cli",
        channelUserId: this.userId,
        channelMessageId: uuid(),
        content: trimmed,
        timestamp: new Date(),
      });
    });

    this.rl.on("close", () => {
      process.exit(0);
    });

    console.log("\n╔════════════════════════════════════════╗");
    console.log("║     🦀 ArivuClaw — Terminal Chat      ║");
    console.log("║  Type /help for commands, /quit to exit ║");
    console.log("╚════════════════════════════════════════╝\n");

    this.rl.prompt();
  }

  protected async disconnect(): Promise<void> {
    this.rl?.close();
  }

  protected async doSendMessage(
    channelUserId: string,
    content: string,
    attachments?: Attachment[],
  ): Promise<void> {
    console.log(`\n🤖 ArivuClaw: ${content}`);
    this.rl?.prompt();
  }

  private printHelp(): void {
    console.log(`
╔═══════════════════════════════════╗
║       ArivuClaw CLI Commands      ║
╠═══════════════════════════════════╣
║ /help    — Show this help         ║
║ /skills  — List active skills     ║
║ /memory  — Show memory stats      ║
║ /status  — Show system status     ║
║ /clear   — Clear conversation     ║
║ /quit    — Exit ArivuClaw         ║
╚═══════════════════════════════════╝
`);
  }
}
