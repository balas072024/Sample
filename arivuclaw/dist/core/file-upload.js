"use strict";
/**
 * ArivuClaw File Upload Handler — Process uploaded files from channels.
 * Gap #19: Images → vision, PDFs → extraction, code → analysis.
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
exports.FileUploadHandler = void 0;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const uuid_1 = require("uuid");
const logger_1 = require("../utils/logger");
const log = logger_1.Logger.create("file-upload");
class FileUploadHandler {
    uploadDir;
    constructor(uploadDir = ".arivuclaw/uploads") {
        this.uploadDir = uploadDir;
        fs.mkdirSync(this.uploadDir, { recursive: true });
    }
    async handleUpload(attachment, session) {
        const id = (0, uuid_1.v4)();
        const filename = attachment.filename || `upload-${id}`;
        const filePath = path.join(this.uploadDir, `${id}-${filename}`);
        if (attachment.data) {
            fs.writeFileSync(filePath, attachment.data);
        }
        else if (attachment.url) {
            const resp = await fetch(attachment.url);
            const buf = Buffer.from(await resp.arrayBuffer());
            fs.writeFileSync(filePath, buf);
        }
        const stats = fs.statSync(filePath);
        const fileType = this.detectType(attachment.mimeType, filename);
        log.info(`Upload: ${filename} (${fileType}, ${stats.size} bytes) session=${session.id}`);
        return { id, filename, path: filePath, type: fileType, size: stats.size };
    }
    detectType(mimeType, filename) {
        if (mimeType.startsWith("image/"))
            return "image";
        if (mimeType === "application/pdf")
            return "pdf";
        if (mimeType.startsWith("audio/"))
            return "audio";
        if (mimeType.startsWith("video/"))
            return "video";
        const ext = path.extname(filename).toLowerCase();
        const codeExts = [".ts", ".js", ".py", ".go", ".rs", ".java", ".cpp", ".c", ".rb", ".php"];
        if (codeExts.includes(ext))
            return "code";
        return "document";
    }
    listUploads() {
        if (!fs.existsSync(this.uploadDir))
            return [];
        return fs.readdirSync(this.uploadDir).map((f) => {
            const p = path.join(this.uploadDir, f);
            const stats = fs.statSync(p);
            return { id: f.split("-")[0], filename: f, path: p, type: "unknown", size: stats.size };
        });
    }
    deleteUpload(id) {
        const files = fs.readdirSync(this.uploadDir).filter((f) => f.startsWith(id));
        for (const f of files)
            fs.unlinkSync(path.join(this.uploadDir, f));
        return files.length > 0;
    }
}
exports.FileUploadHandler = FileUploadHandler;
//# sourceMappingURL=file-upload.js.map