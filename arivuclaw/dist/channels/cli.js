"use strict";
/**
 * ArivuClaw CLI Channel — Terminal-based interactive chat.
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.CLIChannel = void 0;
const readline = __importStar(require("readline"));
const uuid_1 = require("uuid");
const base_1 = require("./base");
class CLIChannel extends base_1.BaseChannel {
    type = "cli";
    name = "CLI (Terminal)";
    rl;
    userId = "cli-user";
    async connect() {
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
                channelMessageId: (0, uuid_1.v4)(),
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
    async disconnect() {
        this.rl?.close();
    }
    async doSendMessage(channelUserId, content, attachments) {
        console.log(`\n🤖 ArivuClaw: ${content}`);
        this.rl?.prompt();
    }
    printHelp() {
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
exports.CLIChannel = CLIChannel;
//# sourceMappingURL=cli.js.map