/**
 * ArivuClaw Discord Channel — Via discord.js
 */
import type { Attachment, ChannelType } from "../core/types";
import { BaseChannel } from "./base";
export declare class DiscordChannel extends BaseChannel {
    readonly type: ChannelType;
    readonly name = "Discord (discord.js)";
    private client;
    protected connect(): Promise<void>;
    protected disconnect(): Promise<void>;
    protected doSendMessage(channelUserId: string, content: string, attachments?: Attachment[]): Promise<void>;
}
//# sourceMappingURL=discord.d.ts.map