/**
 * ArivuClaw Telegram Channel — Via grammY bot framework.
 *
 * Full feature parity with OpenClaw:
 * - All media types: photos, voice, video, video notes, audio, stickers,
 *   animations/GIFs, documents, contacts, locations
 * - Reply threading (reply_to_message_id)
 * - Inline buttons and callback query handling
 * - Sticker vision cache (avoids repeated LLM calls for same sticker)
 * - Markdown → HTML conversion for Telegram output
 * - Group and forum topic support (message_thread_id)
 * - Link preview control
 */

import { v4 as uuid } from "uuid";
import type { Attachment, ChannelType, IncomingMessage } from "../core/types";
import { BaseChannel } from "./base";

// ─── MIME type mapping ───────────────────────────────────────────────

const EXT_MIME: Record<string, string> = {
  ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png",
  ".gif": "image/gif", ".webp": "image/webp", ".bmp": "image/bmp",
  ".svg": "image/svg+xml", ".mp4": "video/mp4", ".avi": "video/x-msvideo",
  ".mov": "video/quicktime", ".mkv": "video/x-matroska", ".webm": "video/webm",
  ".mp3": "audio/mpeg", ".ogg": "audio/ogg", ".oga": "audio/ogg",
  ".wav": "audio/wav", ".flac": "audio/flac", ".m4a": "audio/mp4",
  ".pdf": "application/pdf", ".doc": "application/msword",
  ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ".xls": "application/vnd.ms-excel",
  ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ".zip": "application/zip", ".rar": "application/vnd.rar",
  ".txt": "text/plain", ".csv": "text/csv", ".json": "application/json",
  ".xml": "application/xml", ".tgs": "application/x-tgsticker",
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

// ─── Markdown → Telegram HTML converter ──────────────────────────────

function markdownToTelegramHtml(md: string): string {
  let html = md;

  // Code blocks (```lang\n...\n```)
  html = html.replace(/```(\w*)\n([\s\S]*?)```/g, (_m, _lang, code) =>
    `<pre>${escapeHtml(code.trimEnd())}</pre>`);

  // Inline code
  html = html.replace(/`([^`]+)`/g, (_m, code) => `<code>${escapeHtml(code)}</code>`);

  // Bold (**text** or __text__)
  html = html.replace(/\*\*(.+?)\*\*/g, "<b>$1</b>");
  html = html.replace(/__(.+?)__/g, "<b>$1</b>");

  // Italic (*text* or _text_)
  html = html.replace(/(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)/g, "<i>$1</i>");
  html = html.replace(/(?<!_)_(?!_)(.+?)(?<!_)_(?!_)/g, "<i>$1</i>");

  // Strikethrough (~~text~~)
  html = html.replace(/~~(.+?)~~/g, "<s>$1</s>");

  // Links [text](url)
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');

  return html;
}

function escapeHtml(text: string): string {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// ─── Channel Implementation ──────────────────────────────────────────

export class TelegramChannel extends BaseChannel {
  readonly type: ChannelType = "telegram";
  readonly name = "Telegram (grammY)";

  private bot: any = null;
  private botToken: string = "";

  /** Sticker vision cache: file_unique_id → description (avoids repeat LLM calls) */
  private stickerCache = new Map<string, string>();
  private static readonly STICKER_CACHE_MAX = 500;

  /** Track last sent message ID per chat for reply threading */
  private lastBotMessageId = new Map<string, number>();

  // ─── File Download ─────────────────────────────────────────────

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

  // ─── Emit Helpers ──────────────────────────────────────────────

  private async emitMediaMessage(
    ctx: any,
    content: string,
    attachments: Attachment[],
  ): Promise<void> {
    const threadId = ctx.message?.message_thread_id;
    const replyTo = ctx.message?.reply_to_message?.message_id;

    await this.emitMessage({
      channelType: "telegram",
      channelUserId: String(ctx.from.id),
      channelMessageId: String(ctx.message.message_id),
      content,
      attachments,
      timestamp: new Date(ctx.message.date * 1000),
      raw: {
        ...ctx.message,
        // Propagate thread/reply metadata for downstream use
        _threadId: threadId,
        _replyToMessageId: replyTo,
        _chatId: ctx.message.chat.id,
        _chatType: ctx.message.chat.type,
      },
    });
  }

  private async emitTextMessage(ctx: any, content: string): Promise<void> {
    const threadId = ctx.message?.message_thread_id;
    const replyTo = ctx.message?.reply_to_message?.message_id;

    await this.emitMessage({
      channelType: "telegram",
      channelUserId: String(ctx.from.id),
      channelMessageId: String(ctx.message.message_id),
      content,
      timestamp: new Date(ctx.message.date * 1000),
      raw: {
        ...ctx.message,
        _threadId: threadId,
        _replyToMessageId: replyTo,
        _chatId: ctx.message.chat.id,
        _chatType: ctx.message.chat.type,
      },
    });
  }

  // ─── Connect ───────────────────────────────────────────────────

  protected async connect(): Promise<void> {
    const token = this.config.credentials.botToken;
    if (!token) throw new Error("Telegram bot token required");
    this.botToken = token;

    this.log.info("Starting Telegram bot...");

    const { Bot } = await import("grammy");
    this.bot = new Bot(token);

    // ── Text messages ────────────────────────────────────────────
    this.bot.on("message:text", async (ctx: any) => {
      await this.emitTextMessage(ctx, ctx.message.text);
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
        await this.bot.api.sendMessage(ctx.message.chat.id, "Sorry, I couldn't process that photo. Please try again.");
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
        await this.bot.api.sendMessage(ctx.message.chat.id, "Sorry, I couldn't process that voice message.");
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

    // ── Stickers (with cache) ────────────────────────────────────
    this.bot.on("message:sticker", async (ctx: any) => {
      try {
        const sticker = ctx.message.sticker;
        const uniqueId = sticker.file_unique_id;
        this.log.info(`Sticker from ${ctx.from.id} (${sticker.emoji || "sticker"}, set: ${sticker.set_name || "none"})`);

        // Check sticker cache first
        const cached = this.stickerCache.get(uniqueId);
        if (cached) {
          this.log.info(`Sticker cache hit: ${uniqueId}`);
          await this.emitMediaMessage(ctx, cached, []);
          return;
        }

        // Animated (.tgs) and video (.webm) stickers — describe only
        if (sticker.is_animated || sticker.is_video) {
          const desc = `[Sticker: ${sticker.emoji || ""} from set "${sticker.set_name || "unknown"}"]`;
          this.cacheStickerDescription(uniqueId, desc);
          await this.emitMediaMessage(ctx, desc, []);
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
      const info = [c.first_name, c.last_name, c.phone_number ? `Phone: ${c.phone_number}` : null]
        .filter(Boolean).join(", ");
      await this.emitTextMessage(ctx, `[Contact shared: ${info}]`);
    });

    // ── Location ─────────────────────────────────────────────────
    this.bot.on("message:location", async (ctx: any) => {
      const loc = ctx.message.location;
      await this.emitMediaMessage(ctx, `[Location: ${loc.latitude}, ${loc.longitude}]`, [
        { type: "location", mimeType: "application/geo+json", url: `geo:${loc.latitude},${loc.longitude}` },
      ]);
    });

    // ── Callback queries (inline button presses) ─────────────────
    this.bot.on("callback_query:data", async (ctx: any) => {
      try {
        const data = ctx.callbackQuery.data;
        this.log.info(`Callback query from ${ctx.from.id}: ${data}`);

        // Acknowledge the button press
        await ctx.answerCallbackQuery();

        // Emit as a text message so the agent can process the button click
        await this.emitMessage({
          channelType: "telegram",
          channelUserId: String(ctx.from.id),
          channelMessageId: String(ctx.callbackQuery.id),
          content: data,
          timestamp: new Date(),
          raw: {
            ...ctx.callbackQuery,
            _chatId: ctx.callbackQuery.message?.chat?.id,
            _chatType: ctx.callbackQuery.message?.chat?.type,
            _isCallback: true,
          },
        });
      } catch (error) {
        this.log.error(`Callback query failed: ${error instanceof Error ? error.message : error}`);
      }
    });

    // Global error handler — prevents silent polling failures
    this.bot.catch((err: any) => {
      this.log.error(`Telegram bot error: ${err.message || err}`);
    });

    // Delete any existing webhook so long polling works
    // (Telegram blocks getUpdates while a webhook is active)
    try {
      await this.bot.api.deleteWebhook({ drop_pending_updates: false });
      this.log.info("Cleared existing webhook (if any) — switching to long polling");
    } catch (err: any) {
      this.log.warn(`Could not delete webhook: ${err.message || err}`);
    }

    // Verify bot token is valid before starting
    try {
      const me = await this.bot.api.getMe();
      this.log.info(`Telegram bot authenticated as @${me.username} (${me.first_name})`);
    } catch (err: any) {
      throw new Error(`Invalid Telegram bot token: ${err.message || err}`);
    }

    // Start long polling (runs in background, errors caught above)
    this.bot.start({
      onStart: () => {
        this.log.info("Telegram long polling active — listening for messages");
      },
    });

    this.log.info("Telegram bot started — listening for all message types, callbacks, and groups");
  }

  // ─── Sticker Cache ─────────────────────────────────────────────

  cacheStickerDescription(uniqueId: string, description: string): void {
    if (this.stickerCache.size >= TelegramChannel.STICKER_CACHE_MAX) {
      // Evict oldest entry
      const firstKey = this.stickerCache.keys().next().value;
      if (firstKey) this.stickerCache.delete(firstKey);
    }
    this.stickerCache.set(uniqueId, description);
  }

  // ─── Disconnect ────────────────────────────────────────────────

  protected async disconnect(): Promise<void> {
    if (this.bot) {
      await this.bot.stop();
    }
    this.bot = null;
    this.stickerCache.clear();
    this.lastBotMessageId.clear();
  }

  // ─── Send Message ──────────────────────────────────────────────

  /** Telegram's max message length */
  private static readonly MAX_MSG_LENGTH = 4096;

  /**
   * Split text into chunks that fit within Telegram's limit.
   * Tries to split at paragraph breaks, then line breaks, then hard-cuts.
   */
  private splitMessage(text: string, limit: number = TelegramChannel.MAX_MSG_LENGTH): string[] {
    if (text.length <= limit) return [text];

    const chunks: string[] = [];
    let remaining = text;

    while (remaining.length > 0) {
      if (remaining.length <= limit) {
        chunks.push(remaining);
        break;
      }

      // Try to split at a double newline (paragraph)
      let splitAt = remaining.lastIndexOf("\n\n", limit);
      // Fallback: single newline
      if (splitAt <= 0) splitAt = remaining.lastIndexOf("\n", limit);
      // Fallback: space
      if (splitAt <= 0) splitAt = remaining.lastIndexOf(" ", limit);
      // Hard cut if no good split point
      if (splitAt <= 0) splitAt = limit;

      chunks.push(remaining.slice(0, splitAt));
      remaining = remaining.slice(splitAt).trimStart();
    }

    return chunks;
  }

  protected async doSendMessage(
    channelUserId: string,
    content: string,
    attachments?: Attachment[],
    metadata?: Record<string, unknown>,
  ): Promise<void> {
    if (!this.bot) throw new Error("Telegram bot not connected");

    const chatId = Number(channelUserId);
    const raw = metadata?.raw as Record<string, unknown> | undefined;
    const threadId = raw?._threadId as number | undefined;
    const replyToId = raw?._replyToMessageId as number | undefined;
    const incomingMsgId = raw?.message_id as number | undefined;

    const baseOpts: Record<string, unknown> = {};

    // Reply to the user's message in groups for threading
    if (incomingMsgId) {
      baseOpts.reply_to_message_id = incomingMsgId;
      baseOpts.allow_sending_without_reply = true;
    }

    // Forum topic support
    if (threadId) {
      baseOpts.message_thread_id = threadId;
    }

    // Link preview control (disable for long messages to avoid clutter)
    if (content.length > 1000) {
      baseOpts.disable_web_page_preview = true;
    }

    // Split into chunks that fit Telegram's 4096 char limit
    const chunks = this.splitMessage(content);

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      const html = markdownToTelegramHtml(chunk);
      const opts: Record<string, unknown> = {
        ...baseOpts,
        parse_mode: "HTML",
      };

      // Only reply-thread the first chunk
      if (i > 0) {
        delete opts.reply_to_message_id;
      }

      try {
        const sent = await this.bot.api.sendMessage(chatId, html, opts);
        this.lastBotMessageId.set(String(chatId), sent.message_id);
      } catch (error) {
        // If HTML parse fails, retry as plain text
        const errMsg = error instanceof Error ? error.message : String(error);
        if (errMsg.includes("can't parse entities")) {
          this.log.warn("HTML parse failed, retrying as plain text");
          delete opts.parse_mode;
          const sent = await this.bot.api.sendMessage(chatId, chunk, opts);
          this.lastBotMessageId.set(String(chatId), sent.message_id);
        } else {
          throw error;
        }
      }
    }

    this.log.info(`Sent message to Telegram chat ${chatId} (${chunks.length} chunk${chunks.length > 1 ? "s" : ""})`);
  }
}
