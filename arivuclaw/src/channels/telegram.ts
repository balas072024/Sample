/**
 * ArivuClaw Telegram Channel — Via grammY bot framework.
 * Full media support: text, photos, voice, video, video notes,
 * audio, documents, stickers, animations, and contact/location.
 */

import { v4 as uuid } from "uuid";
import type { Attachment, ChannelType, IncomingMessage } from "../core/types";
import { BaseChannel } from "./base";

// Map file extensions to MIME types
const EXT_MIME: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".bmp": "image/bmp",
  ".svg": "image/svg+xml",
  ".mp4": "video/mp4",
  ".avi": "video/x-msvideo",
  ".mov": "video/quicktime",
  ".mkv": "video/x-matroska",
  ".webm": "video/webm",
  ".mp3": "audio/mpeg",
  ".ogg": "audio/ogg",
  ".oga": "audio/ogg",
  ".wav": "audio/wav",
  ".flac": "audio/flac",
  ".m4a": "audio/mp4",
  ".pdf": "application/pdf",
  ".doc": "application/msword",
  ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ".xls": "application/vnd.ms-excel",
  ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ".zip": "application/zip",
  ".rar": "application/vnd.rar",
  ".txt": "text/plain",
  ".csv": "text/csv",
  ".json": "application/json",
  ".xml": "application/xml",
  ".tgs": "application/x-tgsticker",
};

function guessMime(filePath: string, fallback: string): string {
  const ext = filePath.substring(filePath.lastIndexOf(".")).toLowerCase();
  return EXT_MIME[ext] || fallback;
}

function attachmentType(mimeType: string): Attachment["type"] {
  if (mimeType.startsWith("image/")) return "image";
  if (mimeType.startsWith("video/")) return "video";
  if (mimeType.startsWith("audio/")) return "audio";
  return "file";
}

export class TelegramChannel extends BaseChannel {
  readonly type: ChannelType = "telegram";
  readonly name = "Telegram (grammY)";

  private bot: any = null;
  private botToken: string = "";

  /**
   * Download a file from Telegram servers and return as base64 data URL + Buffer.
   */
  private async downloadTelegramFile(
    fileId: string,
    mimeHint?: string,
  ): Promise<{ url: string; data: Buffer; mimeType: string }> {
    const fileInfo = await this.bot.api.getFile(fileId);
    const filePath: string = fileInfo.file_path;
    const downloadUrl = `https://api.telegram.org/file/bot${this.botToken}/${filePath}`;

    const response = await fetch(downloadUrl);
    if (!response.ok) {
      throw new Error(`Failed to download Telegram file: ${response.status}`);
    }

    const buffer = Buffer.from(await response.arrayBuffer());
    const mimeType = mimeHint || guessMime(filePath, "application/octet-stream");
    const base64 = buffer.toString("base64");
    const url = `data:${mimeType};base64,${base64}`;

    return { url, data: buffer, mimeType };
  }

  /**
   * Helper to build a common IncomingMessage and emit it.
   */
  private async emitMediaMessage(
    ctx: any,
    content: string,
    attachments: Attachment[],
  ): Promise<void> {
    await this.emitMessage({
      channelType: "telegram",
      channelUserId: String(ctx.from.id),
      channelMessageId: String(ctx.message.message_id),
      content,
      attachments,
      timestamp: new Date(ctx.message.date * 1000),
      raw: ctx.message,
    });
  }

  protected async connect(): Promise<void> {
    const token = this.config.credentials.botToken;
    if (!token) throw new Error("Telegram bot token required");
    this.botToken = token;

    this.log.info("Starting Telegram bot...");

    const { Bot } = await import("grammy");
    this.bot = new Bot(token);

    // ── Text messages ────────────────────────────────────────────
    this.bot.on("message:text", async (ctx: any) => {
      await this.emitMessage({
        channelType: "telegram",
        channelUserId: String(ctx.from.id),
        channelMessageId: String(ctx.message.message_id),
        content: ctx.message.text,
        timestamp: new Date(ctx.message.date * 1000),
        raw: ctx.message,
      });
    });

    // ── Photos ───────────────────────────────────────────────────
    this.bot.on("message:photo", async (ctx: any) => {
      try {
        const photos = ctx.message.photo;
        const largest = photos[photos.length - 1];
        this.log.info(`Photo from ${ctx.from.id} (${largest.width}x${largest.height})`);

        const { url, data, mimeType } = await this.downloadTelegramFile(largest.file_id, "image/jpeg");

        await this.emitMediaMessage(ctx, ctx.message.caption || "Please analyze this image.", [
          { type: "image", url, data, mimeType, filename: `photo_${ctx.message.message_id}.jpg` },
        ]);
      } catch (error) {
        this.log.error(`Photo processing failed: ${error instanceof Error ? error.message : error}`);
        await this.bot.api.sendMessage(ctx.from.id, "Sorry, I couldn't process that photo. Please try again.");
      }
    });

    // ── Voice messages ───────────────────────────────────────────
    this.bot.on("message:voice", async (ctx: any) => {
      try {
        const voice = ctx.message.voice;
        this.log.info(`Voice from ${ctx.from.id} (${voice.duration}s)`);

        const mime = voice.mime_type || "audio/ogg";
        const { url, data, mimeType } = await this.downloadTelegramFile(voice.file_id, mime);

        await this.emitMediaMessage(ctx, ctx.message.caption || `[Voice message: ${voice.duration}s]`, [
          { type: "audio", url, data, mimeType, filename: `voice_${ctx.message.message_id}.ogg` },
        ]);
      } catch (error) {
        this.log.error(`Voice processing failed: ${error instanceof Error ? error.message : error}`);
        await this.bot.api.sendMessage(ctx.from.id, "Sorry, I couldn't process that voice message.");
      }
    });

    // ── Audio files (music, etc.) ────────────────────────────────
    this.bot.on("message:audio", async (ctx: any) => {
      try {
        const audio = ctx.message.audio;
        this.log.info(`Audio from ${ctx.from.id} (${audio.file_name || "unknown"})`);

        const mime = audio.mime_type || "audio/mpeg";
        const { url, data, mimeType } = await this.downloadTelegramFile(audio.file_id, mime);

        await this.emitMediaMessage(ctx, ctx.message.caption || `[Audio: ${audio.file_name || "audio"} — ${audio.duration}s]`, [
          { type: "audio", url, data, mimeType, filename: audio.file_name || `audio_${ctx.message.message_id}.mp3` },
        ]);
      } catch (error) {
        this.log.error(`Audio processing failed: ${error instanceof Error ? error.message : error}`);
      }
    });

    // ── Video ────────────────────────────────────────────────────
    this.bot.on("message:video", async (ctx: any) => {
      try {
        const video = ctx.message.video;
        this.log.info(`Video from ${ctx.from.id} (${video.duration}s, ${video.file_name || "video"})`);

        const mime = video.mime_type || "video/mp4";
        const { url, data, mimeType } = await this.downloadTelegramFile(video.file_id, mime);

        await this.emitMediaMessage(ctx, ctx.message.caption || `[Video: ${video.duration}s]`, [
          { type: "video", url, data, mimeType, filename: video.file_name || `video_${ctx.message.message_id}.mp4` },
        ]);
      } catch (error) {
        this.log.error(`Video processing failed: ${error instanceof Error ? error.message : error}`);
      }
    });

    // ── Video notes (round video messages) ───────────────────────
    this.bot.on("message:video_note", async (ctx: any) => {
      try {
        const vn = ctx.message.video_note;
        this.log.info(`Video note from ${ctx.from.id} (${vn.duration}s)`);

        const { url, data, mimeType } = await this.downloadTelegramFile(vn.file_id, "video/mp4");

        await this.emitMediaMessage(ctx, `[Video note: ${vn.duration}s]`, [
          { type: "video", url, data, mimeType, filename: `videonote_${ctx.message.message_id}.mp4` },
        ]);
      } catch (error) {
        this.log.error(`Video note processing failed: ${error instanceof Error ? error.message : error}`);
      }
    });

    // ── Stickers ─────────────────────────────────────────────────
    this.bot.on("message:sticker", async (ctx: any) => {
      try {
        const sticker = ctx.message.sticker;
        this.log.info(`Sticker from ${ctx.from.id} (${sticker.emoji || "sticker"}, set: ${sticker.set_name || "none"})`);

        // Animated (.tgs) and video (.webm) stickers — describe only
        if (sticker.is_animated || sticker.is_video) {
          await this.emitMediaMessage(ctx, `[Sticker: ${sticker.emoji || ""} from set "${sticker.set_name || "unknown"}"]`, []);
          return;
        }

        // Static sticker — download as webp image
        const { url, data, mimeType } = await this.downloadTelegramFile(sticker.file_id, "image/webp");

        await this.emitMediaMessage(ctx, `[Sticker: ${sticker.emoji || ""}]`, [
          { type: "image", url, data, mimeType, filename: `sticker_${ctx.message.message_id}.webp` },
        ]);
      } catch (error) {
        this.log.error(`Sticker processing failed: ${error instanceof Error ? error.message : error}`);
      }
    });

    // ── Animations (GIFs) ────────────────────────────────────────
    this.bot.on("message:animation", async (ctx: any) => {
      try {
        const anim = ctx.message.animation;
        this.log.info(`Animation/GIF from ${ctx.from.id} (${anim.file_name || "gif"})`);

        const mime = anim.mime_type || "video/mp4";
        const { url, data, mimeType } = await this.downloadTelegramFile(anim.file_id, mime);

        await this.emitMediaMessage(ctx, ctx.message.caption || `[GIF: ${anim.file_name || "animation"}]`, [
          { type: "video", url, data, mimeType, filename: anim.file_name || `gif_${ctx.message.message_id}.mp4` },
        ]);
      } catch (error) {
        this.log.error(`Animation processing failed: ${error instanceof Error ? error.message : error}`);
      }
    });

    // ── Documents (any file type) ────────────────────────────────
    this.bot.on("message:document", async (ctx: any) => {
      try {
        const doc = ctx.message.document;
        const mime = doc.mime_type || "application/octet-stream";
        this.log.info(`Document from ${ctx.from.id}: ${doc.file_name} (${mime})`);

        const { url, data, mimeType } = await this.downloadTelegramFile(doc.file_id, mime);
        const aType = attachmentType(mimeType);

        const caption = ctx.message.caption || `[File: ${doc.file_name} (${mime})]`;

        await this.emitMediaMessage(ctx, caption, [
          { type: aType, url, data, mimeType, filename: doc.file_name || `file_${ctx.message.message_id}` },
        ]);
      } catch (error) {
        this.log.error(`Document processing failed: ${error instanceof Error ? error.message : error}`);
      }
    });

    // ── Contact ──────────────────────────────────────────────────
    this.bot.on("message:contact", async (ctx: any) => {
      const c = ctx.message.contact;
      const info = [
        c.first_name,
        c.last_name,
        c.phone_number ? `Phone: ${c.phone_number}` : null,
      ].filter(Boolean).join(", ");

      await this.emitMessage({
        channelType: "telegram",
        channelUserId: String(ctx.from.id),
        channelMessageId: String(ctx.message.message_id),
        content: `[Contact shared: ${info}]`,
        timestamp: new Date(ctx.message.date * 1000),
        raw: ctx.message,
      });
    });

    // ── Location ─────────────────────────────────────────────────
    this.bot.on("message:location", async (ctx: any) => {
      const loc = ctx.message.location;
      await this.emitMediaMessage(ctx, `[Location: ${loc.latitude}, ${loc.longitude}]`, [
        { type: "location", mimeType: "application/geo+json", url: `geo:${loc.latitude},${loc.longitude}` },
      ]);
    });

    this.bot.start();

    this.log.info("Telegram bot started — listening for all message types");
  }

  protected async disconnect(): Promise<void> {
    if (this.bot) {
      await this.bot.stop();
    }
    this.bot = null;
  }

  protected async doSendMessage(
    channelUserId: string,
    content: string,
    attachments?: Attachment[],
  ): Promise<void> {
    if (!this.bot) throw new Error("Telegram bot not connected");

    await this.bot.api.sendMessage(Number(channelUserId), content, {
      parse_mode: "Markdown",
    });

    this.log.info(`Sent message to Telegram user ${channelUserId}`);
  }
}
