"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.ModelTierManager = void 0;
const logger_1 = require("../utils/logger");
// ─── Complexity Indicators ───────────────────────────────────────────
/** Patterns that indicate higher complexity. */
const COMPLEXITY_INDICATORS = {
    /** Keywords indicating complex reasoning. */
    highComplexity: [
        /\b(explain|analyze|compare|contrast|evaluate|synthesize|debate)\b/i,
        /\b(code|implement|refactor|debug|architect|design pattern)\b/i,
        /\b(mathematical|proof|theorem|algorithm|complexity)\b/i,
        /\b(legal|medical|financial|regulatory)\b/i,
        /\b(multi-step|step.by.step|chain.of.thought)\b/i,
    ],
    /** Keywords indicating medium complexity. */
    mediumComplexity: [
        /\b(summarize|describe|list|outline|translate)\b/i,
        /\b(write|draft|compose|create)\b/i,
        /\b(how to|what is|why does|when should)\b/i,
    ],
    /** Keywords indicating low complexity (routing/classification). */
    lowComplexity: [
        /\b(yes|no|ok|thanks|hello|hi|bye|good)\b/i,
        /\b(remind|timer|alarm|note|bookmark)\b/i,
    ],
    /** Critical indicators requiring the best model. */
    critical: [
        /\b(security|vulnerability|exploit|injection)\b/i,
        /\b(production|deploy|rollback|incident)\b/i,
        /\b(confidential|sensitive|private|secret)\b/i,
    ],
};
// ─── Model Tier Manager ──────────────────────────────────────────────
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
class ModelTierManager {
    log = logger_1.Logger.create("ModelTierManager");
    tiers = new Map();
    history = [];
    constructor() {
        this.registerDefaultTiers();
    }
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
    registerTier(name, provider, model, costPerToken, maxTokens, complexityLevels) {
        const tier = {
            name,
            provider,
            model,
            costPerToken,
            maxTokens,
            complexityLevels: complexityLevels ?? this.defaultComplexityForTier(name),
        };
        this.tiers.set(name, tier);
        this.log.info(`Registered tier "${name}": ${provider}/${model} ($${costPerToken}/token, max ${maxTokens})`);
    }
    /**
     * Assign the optimal model tier for a given task message.
     *
     * @param message - The user message or task description.
     * @returns The selected tier and complexity evaluation.
     */
    assignModel(message) {
        const evaluation = this.evaluateComplexity(message);
        const tier = this.selectTier(evaluation.level);
        // Record selection for cost tracking
        const estimatedTokens = Math.ceil(message.length / 4); // rough estimate
        this.history.push({
            taskSummary: message.slice(0, 100),
            complexity: evaluation.level,
            tierName: tier.name,
            estimatedCost: estimatedTokens * tier.costPerToken,
            timestamp: new Date(),
        });
        this.log.debug(`Assigned tier "${tier.name}" (${tier.model}) for ${evaluation.level} complexity task`);
        return { tier, evaluation };
    }
    /**
     * Evaluate the complexity of a message.
     *
     * @param message - The message to evaluate.
     * @returns Complexity evaluation with level, score, and contributing factors.
     */
    evaluateComplexity(message) {
        const factors = [];
        let score = 0;
        // Message length factor
        const wordCount = message.trim().split(/\s+/).length;
        if (wordCount > 200) {
            score += 0.2;
            factors.push("long_message");
        }
        else if (wordCount > 50) {
            score += 0.1;
            factors.push("medium_message");
        }
        // Check for critical indicators
        for (const pattern of COMPLEXITY_INDICATORS.critical) {
            if (pattern.test(message)) {
                score += 0.4;
                factors.push("critical_keyword");
                break;
            }
        }
        // Check for high complexity indicators
        let highMatches = 0;
        for (const pattern of COMPLEXITY_INDICATORS.highComplexity) {
            if (pattern.test(message)) {
                highMatches++;
            }
        }
        if (highMatches > 0) {
            score += Math.min(0.3, highMatches * 0.1);
            factors.push(`high_keywords(${highMatches})`);
        }
        // Check for medium complexity indicators
        let mediumMatches = 0;
        for (const pattern of COMPLEXITY_INDICATORS.mediumComplexity) {
            if (pattern.test(message)) {
                mediumMatches++;
            }
        }
        if (mediumMatches > 0) {
            score += Math.min(0.2, mediumMatches * 0.05);
            factors.push(`medium_keywords(${mediumMatches})`);
        }
        // Code blocks or technical content
        if (/```[\s\S]*```/.test(message) || /\b(function|class|const|let|var|import)\b/.test(message)) {
            score += 0.15;
            factors.push("code_content");
        }
        // Multiple questions
        const questionCount = (message.match(/\?/g) ?? []).length;
        if (questionCount > 2) {
            score += 0.1;
            factors.push(`multiple_questions(${questionCount})`);
        }
        // Clamp score
        score = Math.min(1, Math.max(0, score));
        // Determine level from score
        let level;
        if (score >= 0.7) {
            level = "critical";
        }
        else if (score >= 0.45) {
            level = "high";
        }
        else if (score >= 0.2) {
            level = "medium";
        }
        else {
            level = "low";
        }
        return { level, score: Math.round(score * 100) / 100, factors };
    }
    /**
     * Get cost and usage statistics.
     *
     * @returns Aggregated tier statistics with cost savings data.
     */
    getStats() {
        const requestsByTier = {};
        let totalEstimatedCost = 0;
        let premiumOnlyCost = 0;
        const premiumTier = this.tiers.get("premium");
        const premiumCostPerToken = premiumTier?.costPerToken ?? 0.00006;
        for (const record of this.history) {
            requestsByTier[record.tierName] = (requestsByTier[record.tierName] ?? 0) + 1;
            totalEstimatedCost += record.estimatedCost;
            // Estimate what it would have cost with the premium tier
            const estimatedTokens = record.estimatedCost / (this.tiers.get(record.tierName)?.costPerToken ?? premiumCostPerToken);
            premiumOnlyCost += estimatedTokens * premiumCostPerToken;
        }
        const costSavings = premiumOnlyCost - totalEstimatedCost;
        const savingsPercent = premiumOnlyCost > 0 ? (costSavings / premiumOnlyCost) * 100 : 0;
        return {
            totalRequests: this.history.length,
            requestsByTier,
            totalEstimatedCost: Math.round(totalEstimatedCost * 1_000_000) / 1_000_000,
            premiumOnlyCost: Math.round(premiumOnlyCost * 1_000_000) / 1_000_000,
            costSavings: Math.round(costSavings * 1_000_000) / 1_000_000,
            savingsPercent: Math.round(savingsPercent * 10) / 10,
        };
    }
    /**
     * Get all registered tiers.
     */
    listTiers() {
        return Array.from(this.tiers.values());
    }
    /** Select the best tier for a given complexity level. */
    selectTier(level) {
        // Find the cheapest tier that handles this complexity level
        let bestTier = null;
        for (const tier of this.tiers.values()) {
            if (tier.complexityLevels.includes(level)) {
                if (!bestTier || tier.costPerToken < bestTier.costPerToken) {
                    bestTier = tier;
                }
            }
        }
        if (!bestTier) {
            // Fallback to the standard tier, or the first available tier
            bestTier = this.tiers.get("standard") ?? this.tiers.values().next().value;
            this.log.warn(`No tier found for complexity "${level}", falling back to "${bestTier.name}"`);
        }
        return bestTier;
    }
    /** Register the three default tiers. */
    registerDefaultTiers() {
        this.registerTier("router", "anthropic", "claude-3-5-haiku-latest", 0.000001, // $1 / 1M tokens
        8192, ["low"]);
        this.registerTier("standard", "anthropic", "claude-sonnet-4-20250514", 0.000003, // $3 / 1M tokens
        16384, ["medium", "high"]);
        this.registerTier("premium", "anthropic", "claude-opus-4-20250514", 0.000015, // $15 / 1M tokens
        32768, ["high", "critical"]);
        this.log.info("Default model tiers registered: router, standard, premium");
    }
    /** Get default complexity levels for well-known tier names. */
    defaultComplexityForTier(name) {
        switch (name) {
            case "router":
                return ["low"];
            case "standard":
                return ["medium", "high"];
            case "premium":
                return ["high", "critical"];
            default:
                return ["medium"];
        }
    }
}
exports.ModelTierManager = ModelTierManager;
//# sourceMappingURL=model-tiering.js.map