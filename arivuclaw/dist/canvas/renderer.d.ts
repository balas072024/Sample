/**
 * ArivuClaw Canvas Renderer — Rich output: charts, tables, diagrams, code blocks.
 * Gap #18: Render Mermaid diagrams, tables, charts in chat.
 */
export declare class CanvasRenderer {
    renderMermaid(code: string): string;
    renderTable(data: Record<string, unknown>[], headers?: string[]): string;
    renderChart(type: "bar" | "line" | "pie", data: {
        labels: string[];
        values: number[];
    }): string;
    renderCodeBlock(code: string, language?: string): string;
    renderMarkdown(md: string): string;
}
//# sourceMappingURL=renderer.d.ts.map