/**
 * ArivuClaw Agent Runtime — The AI loop that processes messages.
 *
 * Improvements over OpenClaw:
 * - Tool calls execute in a sandboxed context
 * - Automatic skill selection based on intent + triggers
 * - RAG-powered memory injection for context enrichment
 * - Multi-turn tool orchestration with dependency tracking
 * - Configurable approval workflows for sensitive operations
 */
import type { ArivuClawConfig, LLMProvider, MemoryStore, Message, Session, ToolCall, ToolResult, UserIdentity } from "./types";
import type { SkillRegistry } from "../skills/registry";
export interface AgentResponse {
    content: string;
    toolCalls?: ToolCall[];
    toolResults?: ToolResult[];
    tokensUsed: {
        input: number;
        output: number;
    };
}
export declare class AgentRuntime {
    private config;
    private provider;
    private memoryStore;
    private skillRegistry;
    private securityGuard;
    private sandboxExecutor;
    private maxToolRounds;
    constructor(config: ArivuClawConfig, provider: LLMProvider, memoryStore: MemoryStore, skillRegistry: SkillRegistry);
    processMessage(session: Session, message: Message, user: UserIdentity): Promise<AgentResponse>;
    private enrichWithMemory;
    private selectSkills;
    private executeToolCalls;
    private buildSystemPrompt;
    private buildConversation;
    /**
     * Build message content — returns string for text-only, or LLMContentBlock[]
     * when the message has image/media attachments.
     */
    private buildMessageContent;
    private formatAssistantWithToolCalls;
}
//# sourceMappingURL=agent-runtime.d.ts.map