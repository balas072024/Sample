/**
 * ArivuClaw Slack Channel — Via @slack/bolt
 */
import type { Attachment, ChannelType } from "../core/types";
import { BaseChannel } from "./base";
export declare class SlackChannel extends BaseChannel {
    readonly type: ChannelType;
    readonly name = "Slack (Bolt)";
    private app;
    protected connect(): Promise<void>;
    protected disconnect(): Promise<void>;
    protected doSendMessage(channelUserId: string, content: string, attachments?: Attachment[]): Promise<void>;
}
//# sourceMappingURL=slack.d.ts.map