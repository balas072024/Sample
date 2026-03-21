/**
 * ArivuClaw File Upload Handler — Process uploaded files from channels.
 * Gap #19: Images → vision, PDFs → extraction, code → analysis.
 */
import type { Attachment, Session } from "./types";
export interface UploadResult {
    id: string;
    filename: string;
    path: string;
    type: string;
    size: number;
    analysis?: string;
}
export declare class FileUploadHandler {
    private uploadDir;
    constructor(uploadDir?: string);
    handleUpload(attachment: Attachment, session: Session): Promise<UploadResult>;
    private detectType;
    listUploads(): UploadResult[];
    deleteUpload(id: string): boolean;
}
//# sourceMappingURL=file-upload.d.ts.map