/**
 * Arivumaiyam AI Vision Processor — Multimodal image/document analysis.
 *
 * Gap #2: Process images, screenshots, documents, PDFs via LLM vision APIs.
 */

import * as fs from "fs";
import * as path from "path";
import type { LLMProvider } from "../core/types";
import { Logger } from "../utils/logger";

const log = Logger.create("vision");

export interface VisionResult {
  description: string;
  extractedText?: string;
  objects?: string[];
  metadata?: Record<string, unknown>;
}

export class VisionProcessor {
  constructor(private provider: LLMProvider) {}

  async analyzeImage(imagePath: string, prompt?: string): Promise<VisionResult> {
    const ext = path.extname(imagePath).toLowerCase();
    const mimeType = this.getMimeType(ext);
    const imageData = fs.readFileSync(imagePath);
    const base64 = imageData.toString("base64");
    const dataUrl = `data:${mimeType};base64,${base64}`;

    const response = await this.provider.chat({
      model: "",
      systemPrompt: "You are a vision analysis assistant. Describe what you see in detail.",
      messages: [{
        role: "user",
        content: [
          { type: "text", text: prompt || "Describe this image in detail. Extract any text visible." },
          { type: "image", imageUrl: dataUrl },
        ],
      }],
    });

    return { description: response.content, extractedText: this.extractText(response.content) };
  }

  async analyzeScreenshot(imagePath: string): Promise<VisionResult> {
    return this.analyzeImage(imagePath, "Analyze this screenshot. Identify UI elements, text, errors, and any actionable items.");
  }

  async extractBusinessCard(imagePath: string): Promise<Record<string, string>> {
    const result = await this.analyzeImage(imagePath, "Extract all contact information from this business card. Return as structured data: name, title, company, email, phone, address, website.");
    const fields: Record<string, string> = {};
    const lines = result.description.split("\n");
    for (const line of lines) {
      const match = line.match(/^[\-\*]?\s*(\w[\w\s]*?):\s*(.+)$/);
      if (match) fields[match[1].trim().toLowerCase()] = match[2].trim();
    }
    return fields;
  }

  async analyzeDocument(filePath: string): Promise<VisionResult> {
    return this.analyzeImage(filePath, "Analyze this document. Extract all text, identify the document type, and summarize the key information.");
  }

  async compareImages(path1: string, path2: string): Promise<string> {
    const img1 = fs.readFileSync(path1).toString("base64");
    const img2 = fs.readFileSync(path2).toString("base64");
    const ext1 = this.getMimeType(path.extname(path1));
    const ext2 = this.getMimeType(path.extname(path2));

    const response = await this.provider.chat({
      model: "",
      systemPrompt: "Compare the two images and describe differences.",
      messages: [{
        role: "user",
        content: [
          { type: "text", text: "Compare these two images. What are the differences?" },
          { type: "image", imageUrl: `data:${ext1};base64,${img1}` },
          { type: "image", imageUrl: `data:${ext2};base64,${img2}` },
        ],
      }],
    });
    return response.content;
  }

  isImageFile(filePath: string): boolean {
    const ext = path.extname(filePath).toLowerCase();
    return [".png", ".jpg", ".jpeg", ".gif", ".webp", ".bmp", ".svg", ".tiff"].includes(ext);
  }

  private getMimeType(ext: string): string {
    const mimeTypes: Record<string, string> = {
      ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg",
      ".gif": "image/gif", ".webp": "image/webp", ".bmp": "image/bmp",
      ".svg": "image/svg+xml", ".tiff": "image/tiff", ".pdf": "application/pdf",
    };
    return mimeTypes[ext] || "application/octet-stream";
  }

  private extractText(content: string): string {
    const textSection = content.match(/text[:\s]*["']?([^"'\n]+)/i);
    return textSection?.[1] || "";
  }
}
