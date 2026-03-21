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

import * as fs from "fs";
import * as path from "path";
import { v4 as uuid } from "uuid";
import type {
  LLMProvider,
  MemoryEntry,
  MemoryStore,
  MemoryStoreConfig,
  UserFact,
} from "../core/types.js";
import { Logger } from "../utils/logger.js";

const log = Logger.create("memory");

interface StoredEntry extends MemoryEntry {
  accessCount: number;
  lastAccessedAt: Date;
  decayScore: number;
}

export class VectorMemoryStore implements MemoryStore {
  readonly type = "vector";

  private entries = new Map<string, StoredEntry>();
  private facts = new Map<string, UserFact[]>();
  private embeddings = new Map<string, number[]>();
  private dataDir: string;
  private embeddingProvider?: LLMProvider;

  constructor(
    private config: MemoryStoreConfig,
    embeddingProvider?: LLMProvider,
  ) {
    this.dataDir = (config.options?.dataDir as string) || ".arivuclaw/memory";
    this.embeddingProvider = embeddingProvider;
  }

  async initialize(): Promise<void> {
    // Ensure data directory exists
    fs.mkdirSync(this.dataDir, { recursive: true });

    // Load persisted data
    await this.loadFromDisk();
    log.info(`Memory store initialized: ${this.entries.size} entries, ${this.facts.size} users with facts`);
  }

  async shutdown(): Promise<void> {
    await this.persistToDisk();
    log.info("Memory store persisted and shut down");
  }

  // ─── Core Operations ─────────────────────────────────────────────

  async store(entry: MemoryEntry): Promise<void> {
    // Generate embedding for semantic search
    const embedding = await this.generateEmbedding(entry.content);

    // Check for semantic duplicates
    if (embedding && (await this.isDuplicate(entry.content, entry.userId, embedding))) {
      log.info(`Skipping duplicate memory entry for user ${entry.userId}`);
      return;
    }

    const stored: StoredEntry = {
      ...entry,
      id: entry.id || uuid(),
      embedding,
      accessCount: 0,
      lastAccessedAt: new Date(),
      decayScore: 1.0,
    };

    this.entries.set(stored.id, stored);

    if (embedding) {
      this.embeddings.set(stored.id, embedding);
    }

    // Auto-extract facts from conversation entries
    if (entry.type === "conversation") {
      await this.extractFacts(entry);
    }
  }

  async search(query: string, userId: string, limit: number = 5): Promise<MemoryEntry[]> {
    const queryEmbedding = await this.generateEmbedding(query);

    // Get user's entries
    const userEntries = Array.from(this.entries.values()).filter(
      (e) => e.userId === userId,
    );

    if (queryEmbedding) {
      // Semantic search using cosine similarity
      const scored = userEntries
        .map((entry) => {
          const entryEmbedding = this.embeddings.get(entry.id);
          if (!entryEmbedding) return { entry, score: 0 };

          const similarity = this.cosineSimilarity(queryEmbedding, entryEmbedding);
          // Factor in decay
          const adjustedScore = similarity * entry.decayScore;
          return { entry, score: adjustedScore };
        })
        .filter((s) => s.score > 0.3) // Minimum relevance threshold
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);

      // Update access counts
      for (const { entry } of scored) {
        entry.accessCount++;
        entry.lastAccessedAt = new Date();
      }

      return scored.map((s) => s.entry);
    }

    // Fallback: keyword search
    const queryLower = query.toLowerCase();
    return userEntries
      .filter((e) => e.content.toLowerCase().includes(queryLower))
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  async getRecent(userId: string, limit: number = 10): Promise<MemoryEntry[]> {
    return Array.from(this.entries.values())
      .filter((e) => e.userId === userId)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  async delete(id: string): Promise<void> {
    this.entries.delete(id);
    this.embeddings.delete(id);
  }

  // ─── Facts ───────────────────────────────────────────────────────

  async storeFact(fact: UserFact): Promise<void> {
    const userFacts = this.facts.get(fact.userId) || [];

    // Update existing fact if key matches
    const existing = userFacts.findIndex(
      (f) => f.category === fact.category && f.key === fact.key,
    );

    if (existing >= 0) {
      // Only update if new confidence is higher
      if (fact.confidence >= userFacts[existing].confidence) {
        userFacts[existing] = fact;
      }
    } else {
      userFacts.push(fact);
    }

    this.facts.set(fact.userId, userFacts);
  }

  async getFacts(userId: string, category?: string): Promise<UserFact[]> {
    const userFacts = this.facts.get(userId) || [];
    if (category) {
      return userFacts.filter((f) => f.category === category);
    }
    return userFacts;
  }

  // ─── Fact Extraction ─────────────────────────────────────────────

  private async extractFacts(entry: MemoryEntry): Promise<void> {
    // Simple pattern-based fact extraction
    // In production, use an LLM for more sophisticated extraction
    const patterns: { regex: RegExp; category: string; keyExtractor: (m: RegExpMatchArray) => string; valueExtractor: (m: RegExpMatchArray) => string }[] = [
      {
        regex: /my name is (\w+)/i,
        category: "personal",
        keyExtractor: () => "name",
        valueExtractor: (m) => m[1],
      },
      {
        regex: /I (?:live|am) in (.+?)(?:\.|$)/i,
        category: "personal",
        keyExtractor: () => "location",
        valueExtractor: (m) => m[1].trim(),
      },
      {
        regex: /I (?:work|am working) (?:at|for) (.+?)(?:\.|$)/i,
        category: "work",
        keyExtractor: () => "company",
        valueExtractor: (m) => m[1].trim(),
      },
      {
        regex: /I (?:prefer|like|love) (.+?)(?:\.|$)/i,
        category: "preference",
        keyExtractor: () => "likes",
        valueExtractor: (m) => m[1].trim(),
      },
      {
        regex: /my (?:email|mail) is ([^\s]+@[^\s]+)/i,
        category: "contact",
        keyExtractor: () => "email",
        valueExtractor: (m) => m[1],
      },
      {
        regex: /I speak (\w+)/i,
        category: "personal",
        keyExtractor: () => "language",
        valueExtractor: (m) => m[1],
      },
      {
        regex: /my timezone is (.+?)(?:\.|$)/i,
        category: "personal",
        keyExtractor: () => "timezone",
        valueExtractor: (m) => m[1].trim(),
      },
    ];

    for (const { regex, category, keyExtractor, valueExtractor } of patterns) {
      const match = entry.content.match(regex);
      if (match) {
        await this.storeFact({
          id: uuid(),
          userId: entry.userId,
          category,
          key: keyExtractor(match),
          value: valueExtractor(match),
          confidence: 0.8,
          source: entry.source,
          extractedAt: new Date(),
        });
      }
    }
  }

  // ─── Embedding & Similarity ──────────────────────────────────────

  private async generateEmbedding(text: string): Promise<number[] | undefined> {
    if (!this.embeddingProvider) return undefined;

    try {
      // In production, call the embedding model
      // const response = await this.embeddingProvider.embed(text);
      // return response.embedding;

      // Fallback: simple hash-based pseudo-embedding for local testing
      return this.simpleEmbedding(text);
    } catch (error) {
      log.warn(`Failed to generate embedding: ${error}`);
      return undefined;
    }
  }

  private simpleEmbedding(text: string, dims: number = 128): number[] {
    // Simple bag-of-characters embedding for testing
    // Replace with actual embedding model in production
    const embedding = new Array(dims).fill(0);
    const words = text.toLowerCase().split(/\s+/);

    for (let i = 0; i < words.length; i++) {
      const word = words[i];
      for (let j = 0; j < word.length; j++) {
        const idx = (word.charCodeAt(j) * (i + 1)) % dims;
        embedding[idx] += 1;
      }
    }

    // Normalize
    const magnitude = Math.sqrt(embedding.reduce((sum, v) => sum + v * v, 0));
    if (magnitude > 0) {
      for (let i = 0; i < dims; i++) {
        embedding[i] /= magnitude;
      }
    }

    return embedding;
  }

  private cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) return 0;

    let dot = 0;
    let magA = 0;
    let magB = 0;

    for (let i = 0; i < a.length; i++) {
      dot += a[i] * b[i];
      magA += a[i] * a[i];
      magB += b[i] * b[i];
    }

    const magnitude = Math.sqrt(magA) * Math.sqrt(magB);
    return magnitude === 0 ? 0 : dot / magnitude;
  }

  private async isDuplicate(
    content: string,
    userId: string,
    embedding: number[],
  ): Promise<boolean> {
    const userEntries = Array.from(this.entries.values()).filter(
      (e) => e.userId === userId,
    );

    for (const entry of userEntries) {
      const entryEmbedding = this.embeddings.get(entry.id);
      if (entryEmbedding) {
        const similarity = this.cosineSimilarity(embedding, entryEmbedding);
        if (similarity > 0.95) return true;
      }
    }

    return false;
  }

  // ─── Memory Decay ────────────────────────────────────────────────

  /**
   * Apply memory decay — old, unreferenced memories lose relevance.
   * Run periodically (e.g., daily).
   */
  applyDecay(decayRate: number = 0.01): void {
    const now = Date.now();

    for (const entry of this.entries.values()) {
      const ageHours = (now - entry.lastAccessedAt.getTime()) / (1000 * 60 * 60);
      const accessBoost = Math.min(entry.accessCount * 0.1, 0.5);
      entry.decayScore = Math.max(0.1, 1.0 - decayRate * ageHours + accessBoost);
    }

    // Remove entries with very low decay scores
    for (const [id, entry] of this.entries) {
      if (entry.decayScore < 0.15 && entry.type !== "fact") {
        this.entries.delete(id);
        this.embeddings.delete(id);
      }
    }
  }

  // ─── Persistence ─────────────────────────────────────────────────

  private async persistToDisk(): Promise<void> {
    const data = {
      entries: Array.from(this.entries.entries()),
      facts: Array.from(this.facts.entries()),
      embeddings: Array.from(this.embeddings.entries()),
    };

    const filePath = path.join(this.dataDir, "memory.json");
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  }

  private async loadFromDisk(): Promise<void> {
    const filePath = path.join(this.dataDir, "memory.json");

    if (!fs.existsSync(filePath)) return;

    try {
      const raw = fs.readFileSync(filePath, "utf-8");
      const data = JSON.parse(raw);

      if (data.entries) {
        for (const [id, entry] of data.entries) {
          this.entries.set(id, {
            ...entry,
            timestamp: new Date(entry.timestamp),
            lastAccessedAt: new Date(entry.lastAccessedAt),
          });
        }
      }

      if (data.facts) {
        for (const [userId, facts] of data.facts) {
          this.facts.set(userId, facts.map((f: UserFact) => ({
            ...f,
            extractedAt: new Date(f.extractedAt),
          })));
        }
      }

      if (data.embeddings) {
        for (const [id, embedding] of data.embeddings) {
          this.embeddings.set(id, embedding);
        }
      }
    } catch (error) {
      log.error(`Failed to load memory from disk: ${error}`);
    }
  }

  // ─── Stats ───────────────────────────────────────────────────────

  getStats(): {
    totalEntries: number;
    totalFacts: number;
    totalUsers: number;
    memoryUsageBytes: number;
  } {
    const userIds = new Set<string>();
    for (const entry of this.entries.values()) {
      userIds.add(entry.userId);
    }

    return {
      totalEntries: this.entries.size,
      totalFacts: Array.from(this.facts.values()).reduce((sum, f) => sum + f.length, 0),
      totalUsers: userIds.size,
      memoryUsageBytes: JSON.stringify(Array.from(this.entries.values())).length,
    };
  }
}
