"use strict";
/**
 * ArivuClaw Vision Processor — Multimodal image/document analysis.
 *
 * Gap #2: Process images, screenshots, documents, PDFs via LLM vision APIs.
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.VisionProcessor = void 0;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const logger_1 = require("../utils/logger");
const log = logger_1.Logger.create("vision");
class VisionProcessor {
    provider;
    constructor(provider) {
        this.provider = provider;
    }
    async analyzeImage(imagePath, prompt) {
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
    async analyzeScreenshot(imagePath) {
        return this.analyzeImage(imagePath, "Analyze this screenshot. Identify UI elements, text, errors, and any actionable items.");
    }
    async extractBusinessCard(imagePath) {
        const result = await this.analyzeImage(imagePath, "Extract all contact information from this business card. Return as structured data: name, title, company, email, phone, address, website.");
        const fields = {};
        const lines = result.description.split("\n");
        for (const line of lines) {
            const match = line.match(/^[\-\*]?\s*(\w[\w\s]*?):\s*(.+)$/);
            if (match)
                fields[match[1].trim().toLowerCase()] = match[2].trim();
        }
        return fields;
    }
    async analyzeDocument(filePath) {
        return this.analyzeImage(filePath, "Analyze this document. Extract all text, identify the document type, and summarize the key information.");
    }
    async compareImages(path1, path2) {
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
    isImageFile(filePath) {
        const ext = path.extname(filePath).toLowerCase();
        return [".png", ".jpg", ".jpeg", ".gif", ".webp", ".bmp", ".svg", ".tiff"].includes(ext);
    }
    getMimeType(ext) {
        const mimeTypes = {
            ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg",
            ".gif": "image/gif", ".webp": "image/webp", ".bmp": "image/bmp",
            ".svg": "image/svg+xml", ".tiff": "image/tiff", ".pdf": "application/pdf",
        };
        return mimeTypes[ext] || "application/octet-stream";
    }
    extractText(content) {
        const textSection = content.match(/text[:\s]*["']?([^"'\n]+)/i);
        return textSection?.[1] || "";
    }
}
exports.VisionProcessor = VisionProcessor;
//# sourceMappingURL=processor.js.map