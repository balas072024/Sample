/**
 * ArivuClaw File Upload Handler — Process uploaded files from channels.
 * Gap #19: Images → vision, PDFs → extraction, code → analysis.
 */

import * as fs from "fs";
import * as path from "path";
import { v4 as uuid } from "uuid";
import type { Attachment, Session } from "./types.js";
import { Logger } from "../utils/logger.js";

const log = Logger.create("file-upload");

export interface UploadResult {
  id: string;
  filename: string;
  path: string;
  type: string;
  size: number;
  analysis?: string;
}

export class FileUploadHandler {
  private uploadDir: string;

  constructor(uploadDir: string = ".arivuclaw/uploads") {
    this.uploadDir = uploadDir;
    fs.mkdirSync(this.uploadDir, { recursive: true });
  }

  async handleUpload(attachment: Attachment, session: Session): Promise<UploadResult> {
    const id = uuid();
    const filename = attachment.filename || `upload-${id}`;
    const filePath = path.join(this.uploadDir, `${id}-${filename}`);

    if (attachment.data) {
      fs.writeFileSync(filePath, attachment.data);
    } else if (attachment.url) {
      const resp = await fetch(attachment.url);
      const buf = Buffer.from(await resp.arrayBuffer());
      fs.writeFileSync(filePath, buf);
    }

    const stats = fs.statSync(filePath);
    const fileType = this.detectType(attachment.mimeType, filename);

    log.info(`Upload: ${filename} (${fileType}, ${stats.size} bytes) session=${session.id}`);

    return { id, filename, path: filePath, type: fileType, size: stats.size };
  }

  private detectType(mimeType: string, filename: string): string {
    if (mimeType.startsWith("image/")) return "image";
    if (mimeType === "application/pdf") return "pdf";
    if (mimeType.startsWith("audio/")) return "audio";
    if (mimeType.startsWith("video/")) return "video";
    const ext = path.extname(filename).toLowerCase();
    const codeExts = [".ts", ".js", ".py", ".go", ".rs", ".java", ".cpp", ".c", ".rb", ".php"];
    if (codeExts.includes(ext)) return "code";
    return "document";
  }

  listUploads(): UploadResult[] {
    if (!fs.existsSync(this.uploadDir)) return [];
    return fs.readdirSync(this.uploadDir).map((f) => {
      const p = path.join(this.uploadDir, f);
      const stats = fs.statSync(p);
      return { id: f.split("-")[0], filename: f, path: p, type: "unknown", size: stats.size };
    });
  }

  deleteUpload(id: string): boolean {
    const files = fs.readdirSync(this.uploadDir).filter((f) => f.startsWith(id));
    for (const f of files) fs.unlinkSync(path.join(this.uploadDir, f));
    return files.length > 0;
  }
}
