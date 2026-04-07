"use strict";
/**
 * ArivuClaw Canvas Renderer — Rich output: charts, tables, diagrams, code blocks.
 * Gap #18: Render Mermaid diagrams, tables, charts in chat.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.CanvasRenderer = void 0;
const logger_1 = require("../utils/logger");
const log = logger_1.Logger.create("canvas");
class CanvasRenderer {
    renderMermaid(code) {
        return `<div class="mermaid">\n${code}\n</div>\n<script src="https://cdn.jsdelivr.net/npm/mermaid/dist/mermaid.min.js"></script>\n<script>mermaid.initialize({startOnLoad:true});</script>`;
    }
    renderTable(data, headers) {
        if (data.length === 0)
            return "(empty table)";
        const cols = headers || Object.keys(data[0]);
        const sep = cols.map(() => "---");
        const rows = data.map((row) => cols.map((c) => String(row[c] ?? "")).join(" | "));
        return `| ${cols.join(" | ")} |\n| ${sep.join(" | ")} |\n${rows.map((r) => `| ${r} |`).join("\n")}`;
    }
    renderChart(type, data) {
        const max = Math.max(...data.values, 1);
        if (type === "bar") {
            return data.labels.map((l, i) => {
                const bar = "█".repeat(Math.round((data.values[i] / max) * 30));
                return `${l.padEnd(15)} ${bar} ${data.values[i]}`;
            }).join("\n");
        }
        if (type === "pie") {
            const total = data.values.reduce((s, v) => s + v, 0);
            return data.labels.map((l, i) => {
                const pct = ((data.values[i] / total) * 100).toFixed(1);
                return `${l}: ${pct}% (${"●".repeat(Math.round(Number(pct) / 5))})`;
            }).join("\n");
        }
        return data.labels.map((l, i) => `${l}: ${data.values[i]}`).join(" → ");
    }
    renderCodeBlock(code, language = "") {
        return `\`\`\`${language}\n${code}\n\`\`\``;
    }
    renderMarkdown(md) {
        return md
            .replace(/^### (.+)/gm, "<h3>$1</h3>")
            .replace(/^## (.+)/gm, "<h2>$1</h2>")
            .replace(/^# (.+)/gm, "<h1>$1</h1>")
            .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
            .replace(/\*(.+?)\*/g, "<em>$1</em>")
            .replace(/`(.+?)`/g, "<code>$1</code>");
    }
}
exports.CanvasRenderer = CanvasRenderer;
//# sourceMappingURL=renderer.js.map