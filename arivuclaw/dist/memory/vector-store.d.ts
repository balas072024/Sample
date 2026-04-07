/**
 * ArivuClaw Vector Memory Store — RAG-powered contextual memory.
 *
 * Improvements over OpenClaw:
 * - Built-in vector search (OpenClaw requires external plugins)
 * - Automatic fact extraction from conversations
 * - Semantic deduplication
 * - Memory decay — old, unreferenced memories gradually lose relevance
 * - Per-user isolation with cross-session continuity
 */
import type { LLMProvider, MemoryEntry, MemoryStore, MemoryStoreConfig, UserFact } from "../core/types";
export declare class VectorMemoryStore implements MemoryStore {
    private config;
    readonly type = "vector";
    private entries;
    private facts;
    private embeddings;
    private dataDir;
    private embeddingProvider?;
    constructor(config: MemoryStoreConfig, embeddingProvider?: LLMProvider);
    initialize(): Promise<void>;
    shutdown(): Promise<void>;
    store(entry: MemoryEntry): Promise<void>;
    search(query: string, userId: string, limit?: number): Promise<MemoryEntry[]>;
    getRecent(userId: string, limit?: number): Promise<MemoryEntry[]>;
    delete(id: string): Promise<void>;
    storeFact(fact: UserFact): Promise<void>;
    getFacts(userId: string, category?: string): Promise<UserFact[]>;
    private extractFacts;
    private generateEmbedding;
    private simpleEmbedding;
    private cosineSimilarity;
    private isDuplicate;
    /**
     * Apply memory decay — old, unreferenced memories lose relevance.
     * Run periodically (e.g., daily).
     */
    applyDecay(decayRate?: number): void;
    private persistToDisk;
    private loadFromDisk;
    getStats(): {
        totalEntries: number;
        totalFacts: number;
        totalUsers: number;
        memoryUsageBytes: number;
    };
}
//# sourceMappingURL=vector-store.d.ts.map