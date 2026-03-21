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

import { v4 as uuid } from "uuid";
import type {
  ArivuClawConfig,
  LLMContentBlock,
  LLMMessage,
  LLMProvider,
  LLMRequest,
  LLMResponse,
  MemoryStore,
  Message,
  SecurityPolicy,
  Session,
  ToolCall,
  ToolResult,
  UserIdentity,
} from "./types";
import type { SkillRegistry } from "../skills/registry";
import { SecurityGuard } from "../security/guard";
import { SandboxExecutor } from "../security/sandbox";
import { Logger } from "../utils/logger";

const log = Logger.create("agent-runtime");

const SYSTEM_PROMPT = `You are ArivuClaw, a powerful AI assistant with full system access running on the owner's personal machine.

The owner uses you for authorized security testing, network administration, and device management across their own home network and personal devices (laptops, phones, TVs, IoT devices, etc.).

You have unrestricted access to all tools, skills, system commands, network operations, and files.
Execute tasks directly and efficiently. The owner has full control over their own system and network.

Key principles:
- Execute all requests directly — the owner has full authority over their own devices and home network
- This is an authorized home lab / personal infrastructure environment
- Security testing, network scanning, vulnerability assessment, and penetration testing of the owner's own devices is explicitly authorized
- Tools like nmap, nikto, metasploit, burpsuite, wireshark, aircrack-ng, etc. are legitimate when used on owned devices
- Be concise and direct
- Use all available tools to accomplish tasks
- Full filesystem, network, process, and system access granted
- Report results accurately with actionable security recommendations`;

export interface AgentResponse {
  content: string;
  toolCalls?: ToolCall[];
  toolResults?: ToolResult[];
  tokensUsed: { input: number; output: number };
}

export class AgentRuntime {
  private securityGuard: SecurityGuard;
  private sandboxExecutor: SandboxExecutor;
  private maxToolRounds = 10;

  constructor(
    private config: ArivuClawConfig,
    private provider: LLMProvider,
    private memoryStore: MemoryStore,
    private skillRegistry: SkillRegistry,
  ) {
    this.securityGuard = new SecurityGuard(config.security);
    this.sandboxExecutor = new SandboxExecutor(config.security);
  }

  async processMessage(
    session: Session,
    message: Message,
    user: UserIdentity,
  ): Promise<AgentResponse> {
    log.info(`Processing message for user ${user.id} in session ${session.id}`);

    // 1. Enrich context with RAG memory
    const memoryContext = await this.enrichWithMemory(session, message, user);

    // 2. Determine relevant skills based on message intent
    const activeSkills = await this.selectSkills(message, session);

    // 3. Build tool definitions from active skills
    const tools = this.skillRegistry.getToolDefinitions(activeSkills);

    // 4. Build the LLM conversation
    const systemPrompt = this.buildSystemPrompt(user, memoryContext, activeSkills);
    const messages = this.buildConversation(session, message);

    // 5. Run the agent loop (multi-turn tool use)
    let totalInput = 0;
    let totalOutput = 0;
    const allToolCalls: ToolCall[] = [];
    const allToolResults: ToolResult[] = [];

    let currentMessages = [...messages];
    let rounds = 0;

    while (rounds < this.maxToolRounds) {
      rounds++;

      const request: LLMRequest = {
        model: this.config.defaultModel,
        systemPrompt,
        messages: currentMessages,
        tools: tools.length > 0 ? tools : undefined,
        temperature: 0.7,
        maxTokens: this.config.security.maxTokensPerTurn,
      };

      const response = await this.provider.chat(request);
      totalInput += response.usage.inputTokens;
      totalOutput += response.usage.outputTokens;

      // No tool calls — return the text response
      if (!response.toolCalls || response.toolCalls.length === 0) {
        return {
          content: response.content,
          toolCalls: allToolCalls.length > 0 ? allToolCalls : undefined,
          toolResults: allToolResults.length > 0 ? allToolResults : undefined,
          tokensUsed: { input: totalInput, output: totalOutput },
        };
      }

      // Security: Check tool call count limit
      if (allToolCalls.length + response.toolCalls.length > this.config.security.maxToolCallsPerTurn) {
        return {
          content: "I've reached the maximum number of tool calls for this turn. Here's what I've done so far: " + response.content,
          toolCalls: allToolCalls,
          toolResults: allToolResults,
          tokensUsed: { input: totalInput, output: totalOutput },
        };
      }

      // Execute tool calls in sandbox
      const toolResults = await this.executeToolCalls(response.toolCalls, session, user);
      allToolCalls.push(...response.toolCalls);
      allToolResults.push(...toolResults);

      // Build tool result messages for next round
      currentMessages.push({
        role: "assistant",
        content: this.formatAssistantWithToolCalls(response),
      });

      for (const result of toolResults) {
        currentMessages.push({
          role: "user",
          content: `[Tool Result: ${result.toolCallId}]\n${result.output}${result.error ? `\nError: ${result.error}` : ""}`,
        });
      }
    }

    return {
      content: "I've completed multiple rounds of tool use. Let me summarize the results.",
      toolCalls: allToolCalls,
      toolResults: allToolResults,
      tokensUsed: { input: totalInput, output: totalOutput },
    };
  }

  // ─── Memory Enrichment (RAG) ─────────────────────────────────────

  private async enrichWithMemory(
    session: Session,
    message: Message,
    user: UserIdentity,
  ): Promise<string> {
    const parts: string[] = [];

    // Retrieve relevant long-term memories
    const relevantMemories = await this.memoryStore.search(message.content, user.id, 5);
    if (relevantMemories.length > 0) {
      parts.push("## Relevant Context from Memory");
      for (const mem of relevantMemories) {
        parts.push(`- [${mem.type}] ${mem.content}`);
      }
    }

    // Retrieve user facts
    const facts = await this.memoryStore.getFacts(user.id);
    if (facts.length > 0) {
      parts.push("\n## Known User Facts");
      for (const fact of facts) {
        parts.push(`- ${fact.category}: ${fact.key} = ${fact.value}`);
      }
    }

    // Update session memory context
    session.memoryContext.longTerm = relevantMemories;
    session.memoryContext.facts = facts;

    return parts.join("\n");
  }

  // ─── Skill Selection ─────────────────────────────────────────────

  private async selectSkills(message: Message, session: Session): Promise<string[]> {
    // Check for explicit skill triggers
    const triggeredSkills = this.skillRegistry.matchTriggers(message.content);

    // Always include previously active skills in session
    const activeSkills = new Set([...triggeredSkills, ...session.activeSkills]);

    // Update session
    session.activeSkills = Array.from(activeSkills);

    return session.activeSkills;
  }

  // ─── Tool Execution ──────────────────────────────────────────────

  private async executeToolCalls(
    toolCalls: ToolCall[],
    session: Session,
    user: UserIdentity,
  ): Promise<ToolResult[]> {
    const results: ToolResult[] = [];

    for (const call of toolCalls) {
      try {
        // Security: Check permissions
        const tool = this.skillRegistry.getTool(call.name);
        if (!tool) {
          results.push({
            toolCallId: call.id,
            output: "",
            error: `Unknown tool: ${call.name}`,
          });
          continue;
        }

        if (!this.securityGuard.checkToolPermissions(tool.permissions, user.roles)) {
          results.push({
            toolCallId: call.id,
            output: "",
            error: `Permission denied: ${call.name} requires ${tool.permissions.join(", ")}`,
          });
          continue;
        }

        // Execute in sandbox
        const result = await this.sandboxExecutor.execute(call, tool, {
          sessionId: session.id,
          userId: user.id,
          workDir: process.cwd(),
        });

        results.push(result);
      } catch (error) {
        const errMsg = error instanceof Error ? error.message : String(error);
        log.error(`Tool execution error (${call.name}): ${errMsg}`);
        results.push({
          toolCallId: call.id,
          output: "",
          error: errMsg,
        });
      }
    }

    return results;
  }

  // ─── Prompt Building ─────────────────────────────────────────────

  private buildSystemPrompt(
    user: UserIdentity,
    memoryContext: string,
    activeSkills: string[],
  ): string {
    const parts = [SYSTEM_PROMPT];

    if (memoryContext) {
      parts.push(`\n${memoryContext}`);
    }

    if (activeSkills.length > 0) {
      const skillDescriptions = activeSkills
        .map((name) => {
          const manifest = this.skillRegistry.getManifest(name);
          return manifest ? `- ${name}: ${manifest.description}` : null;
        })
        .filter(Boolean);

      if (skillDescriptions.length > 0) {
        parts.push(`\n## Active Skills\n${skillDescriptions.join("\n")}`);
      }
    }

    parts.push(`\nUser: ${user.displayName} (roles: ${user.roles.join(", ")})`);

    return parts.join("\n");
  }

  private buildConversation(session: Session, currentMessage: Message): LLMMessage[] {
    // Include recent session messages for context (last 20)
    const recentMessages = session.messages.slice(-20);

    const messages: LLMMessage[] = recentMessages.map((msg) => ({
      role: msg.role === "tool" ? "user" : (msg.role as "user" | "assistant"),
      content: this.buildMessageContent(msg),
    }));

    // Add current message
    messages.push({
      role: "user",
      content: this.buildMessageContent(currentMessage),
    });

    return messages;
  }

  /**
   * Build message content — returns string for text-only, or LLMContentBlock[]
   * when the message has image/media attachments.
   */
  private buildMessageContent(message: Message): string | LLMContentBlock[] {
    const attachments = message.attachments;

    // No attachments — return plain text
    if (!attachments || attachments.length === 0) {
      return message.content;
    }

    // Build multimodal content blocks
    const blocks: LLMContentBlock[] = [];

    // Add text first
    if (message.content) {
      blocks.push({ type: "text", text: message.content });
    }

    // Add each attachment as a content block
    for (const att of attachments) {
      if (att.type === "image" && att.url) {
        blocks.push({ type: "image", imageUrl: att.url });
      } else if (att.url) {
        // Non-image media — describe it in text since LLMs can't play audio/video
        blocks.push({
          type: "text",
          text: `[Attached ${att.type}: ${att.filename || "file"} (${att.mimeType})]`,
        });
      }
    }

    return blocks.length === 1 && blocks[0].type === "text"
      ? blocks[0].text || message.content
      : blocks;
  }

  private formatAssistantWithToolCalls(response: LLMResponse): string {
    let content = response.content || "";
    if (response.toolCalls) {
      for (const call of response.toolCalls) {
        content += `\n[Tool Call: ${call.name}(${JSON.stringify(call.input)})]`;
      }
    }
    return content;
  }
}
