/**
 * ArivuClaw Vision Processor — Multimodal image/document analysis.
 *
 * Gap #2: Process images, screenshots, documents, PDFs via LLM vision APIs.
 */
import type { LLMProvider } from "../core/types";
export interface VisionResult {
    description: string;
    extractedText?: string;
    objects?: string[];
    metadata?: Record<string, unknown>;
}
export declare class VisionProcessor {
    private provider;
    constructor(provider: LLMProvider);
    analyzeImage(imagePath: string, prompt?: string): Promise<VisionResult>;
    analyzeScreenshot(imagePath: string): Promise<VisionResult>;
    extractBusinessCard(imagePath: string): Promise<Record<string, string>>;
    analyzeDocument(filePath: string): Promise<VisionResult>;
    compareImages(path1: string, path2: string): Promise<string>;
    isImageFile(filePath: string): boolean;
    private getMimeType;
    private extractText;
}
//# sourceMappingURL=processor.d.ts.map