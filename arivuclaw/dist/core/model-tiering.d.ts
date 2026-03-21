/**
 * ArivuClaw Model Tiering — Cost-optimised model selection.
 *
 * Evaluates task complexity and routes requests to the most cost-effective
 * model tier. Default tiers:
 *
 * | Tier     | Example Models          | Use Case                        |
 * |----------|-------------------------|---------------------------------|
 * | router   | haiku / small           | Simple routing, classification  |
 * | standard | sonnet / medium         | General conversation, summaries |
 * | premium  | opus / large            | Complex reasoning, coding       |
 *
 * @module core/model-tiering
 */
import type { ProviderType } from "../core/types";
/** Complexity level assigned to a task or message. */
export type ComplexityLevel = "low" | "medium" | "high" | "critical";
/** Configuration for a single model tier. */
export interface ModelTier {
    /** Tier name (e.g. "router", "standard", "premium"). */
    name: string;
    /** LLM provider for this tier. */
    provider: ProviderType;
    /** Model identifier within the provider. */
    model: string;
    /** Cost per token in USD (approximate). */
    costPerToken: number;
    /** Maximum token limit for this tier. */
    maxTokens: number;
    /** Complexity levels this tier handles. */
    complexityLevels: ComplexityLevel[];
}
/** A record of a model tier selection for cost tracking. */
export interface TierSelectionRecord {
    /** The task or message that was evaluated. */
    taskSummary: string;
    /** Complexity level determined. */
    complexity: ComplexityLevel;
    /** Tier selected. */
    tierName: string;
    /** Estimated cost for this selection. */
    estimatedCost: number;
    /** Timestamp of the selection. */
    timestamp: Date;
}
/** Cost statistics across all tier selections. */
export interface TierStats {
    /** Total number of requests routed. */
    totalRequests: number;
    /** Breakdown of requests per tier. */
    requestsByTier: Record<string, number>;
    /** Total estimated cost in USD. */
    totalEstimatedCost: number;
    /** Estimated cost if all requests had used the premium tier. */
    premiumOnlyCost: number;
    /** Cost savings from tiering (premiumOnlyCost - totalEstimatedCost). */
    costSavings: number;
    /** Savings percentage. */
    savingsPercent: number;
}
/** Result of evaluating a message's complexity. */
export interface ComplexityEvaluation {
    /** Determined complexity level. */
    level: ComplexityLevel;
    /** Score from 0 to 1 (higher = more complex). */
    score: number;
    /** Factors that contributed to the complexity assessment. */
    factors: string[];
}
/** Result of assigning a model tier to a task. */
export interface TierAssignment {
    /** The selected tier. */
    tier: ModelTier;
    /** The complexity evaluation that led to this selection. */
    evaluation: ComplexityEvaluation;
}
/**
 * Manages model tiers and routes tasks to the optimal model based on
 * evaluated complexity, minimising cost while maintaining quality.
 *
 * @example
 * ```ts
 * const manager = new ModelTierManager();
 * const { tier, evaluation } = manager.assignModel("Explain the CAP theorem in distributed systems");
 * console.log(`Using ${tier.model} (${evaluation.level} complexity)`);
 * ```
 */
export declare class ModelTierManager {
    private readonly log;
    private readonly tiers;
    private readonly history;
    constructor();
    /**
     * Register a new model tier.
     *
     * @param name - Tier name.
     * @param provider - LLM provider type.
     * @param model - Model identifier.
     * @param costPerToken - Cost per token in USD.
     * @param maxTokens - Maximum token limit.
     * @param complexityLevels - Complexity levels this tier handles.
     */
    registerTier(name: string, provider: ProviderType, model: string, costPerToken: number, maxTokens: number, complexityLevels?: ComplexityLevel[]): void;
    /**
     * Assign the optimal model tier for a given task message.
     *
     * @param message - The user message or task description.
     * @returns The selected tier and complexity evaluation.
     */
    assignModel(message: string): TierAssignment;
    /**
     * Evaluate the complexity of a message.
     *
     * @param message - The message to evaluate.
     * @returns Complexity evaluation with level, score, and contributing factors.
     */
    evaluateComplexity(message: string): ComplexityEvaluation;
    /**
     * Get cost and usage statistics.
     *
     * @returns Aggregated tier statistics with cost savings data.
     */
    getStats(): TierStats;
    /**
     * Get all registered tiers.
     */
    listTiers(): ModelTier[];
    /** Select the best tier for a given complexity level. */
    private selectTier;
    /** Register the three default tiers. */
    private registerDefaultTiers;
    /** Get default complexity levels for well-known tier names. */
    private defaultComplexityForTier;
}
//# sourceMappingURL=model-tiering.d.ts.map