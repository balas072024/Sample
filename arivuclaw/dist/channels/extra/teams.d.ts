/**
 * ArivuClaw Microsoft Teams Channel — Bot Framework adapter.
 *
 * Integrates with Microsoft Teams using the Bot Framework SDK.
 * Supports text messages, adaptive cards, and file attachments.
 */
import { BaseChannel } from "../base";
import type { Attachment, ChannelConfig, ChannelType } from "../../core/types";
export interface TeamsConfig {
    /** Microsoft App ID */
    appId: string;
    /** Microsoft App Password */
    appPassword: string;
    /** Tenant ID (optional, for single-tenant bots) */
    tenantId?: string;
    /** Bot endpoint port */
    port?: number;
}
export interface AdaptiveCard {
    type: "AdaptiveCard";
    version: string;
    body: AdaptiveCardElement[];
    actions?: AdaptiveCardAction[];
}
export interface AdaptiveCardElement {
    type: string;
    text?: string;
    size?: string;
    weight?: string;
    wrap?: boolean;
    url?: string;
    columns?: AdaptiveCardElement[];
    items?: AdaptiveCardElement[];
    [key: string]: unknown;
}
export interface AdaptiveCardAction {
    type: string;
    title: string;
    url?: string;
    data?: Record<string, unknown>;
    [key: string]: unknown;
}
export declare class TeamsChannel extends BaseChannel {
    readonly type: ChannelType;
    readonly name = "Microsoft Teams";
    private teamsConfig;
    private adapter;
    private conversationRefs;
    private server;
    initialize(config: ChannelConfig): Promise<void>;
    protected connect(): Promise<void>;
    protected disconnect(): Promise<void>;
    protected doSendMessage(channelUserId: string, content: string, attachments?: Attachment[]): Promise<void>;
    /**
     * Send an adaptive card to a Teams user.
     */
    sendAdaptiveCard(channelUserId: string, card: AdaptiveCard): Promise<void>;
    /**
     * Build a simple text adaptive card.
     */
    buildTextCard(title: string, body: string): AdaptiveCard;
    /**
     * Build a confirmation card with Yes/No actions.
     */
    buildConfirmationCard(question: string, yesData: Record<string, unknown>, noData: Record<string, unknown>): AdaptiveCard;
    private handleIncomingActivity;
    private convertToTeamsAttachment;
    private convertFromTeamsAttachments;
    private getAttachmentType;
}
//# sourceMappingURL=teams.d.ts.map