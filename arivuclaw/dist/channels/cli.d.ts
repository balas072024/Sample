/**
 * ArivuClaw CLI Channel — Terminal-based interactive chat.
 */
import type { Attachment, ChannelType } from "../core/types";
import { BaseChannel } from "./base";
export declare class CLIChannel extends BaseChannel {
    readonly type: ChannelType;
    readonly name = "CLI (Terminal)";
    private rl?;
    private userId;
    protected connect(): Promise<void>;
    protected disconnect(): Promise<void>;
    protected doSendMessage(channelUserId: string, content: string, attachments?: Attachment[]): Promise<void>;
    private printHelp;
}
//# sourceMappingURL=cli.d.ts.map