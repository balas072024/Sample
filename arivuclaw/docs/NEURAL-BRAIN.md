# Neural Brain — Bio-Inspired AI Processing

## Overview

Neural Brain is Arivumaiyam AI's experimental bio-inspired processing layer, inspired by [Cortical Labs' DishBrain](https://robohorizon.com/en-gb/magazine/2026/03/cortical-labs-brain-llm/) project that wired living human neurons into an LLM.

## How It Works

Neural Brain adds three capabilities on top of any LLM backbone:

### 1. Associative Memory
Like human memory, Neural Brain builds associations between inputs and outputs. When you ask something similar to a previous query, it recalls the context and injects it into the prompt — improving relevance and continuity.

```
Turn 1: "How do I deploy to AWS ECS?" → Detailed ECS instructions
Turn 50: "Deploy my app" → Neural Brain recalls ECS context, knows your preference
```

### 2. Neural Plasticity
The system learns at a configurable rate (`plasticityRate: 0-1`). Frequently accessed memories strengthen, rarely used ones weaken. This mimics biological long-term potentiation.

### 3. Memory Decay
Old, unreferenced memories naturally fade — just like human forgetting. This prevents context bloat and keeps responses relevant.

## Modes

| Mode | Description | Requires API? |
|------|-------------|---------------|
| `simulate` | Pure simulation, no backbone LLM needed. For testing. | No |
| `hybrid` | Uses any backbone LLM + neural enhancement layer | Backbone API |
| `cortical-api` | Connects to Cortical Labs API (when available) | Cortical API |

## Configuration

```bash
# Use Neural Brain with Claude as backbone
ARIVUCLAW_PROVIDER=custom
```

```json
{
  "providers": {
    "neural-brain": {
      "defaultModel": "neural-brain-hybrid",
      "options": {
        "neuralMode": "hybrid",
        "backboneProvider": "anthropic",
        "plasticityRate": 0.1,
        "associativeMemorySize": 100
      }
    }
  }
}
```

## Parameters

| Parameter | Default | Description |
|-----------|---------|-------------|
| `neuralMode` | `hybrid` | Processing mode |
| `backboneProvider` | `anthropic` | LLM to use as backbone |
| `plasticityRate` | `0.1` | Learning rate (0=no learning, 1=instant) |
| `associativeMemorySize` | `100` | Max associative memory entries |

## Stats

```typescript
const provider = new NeuralBrainProvider(config, backbone);
// After some interactions...
const stats = provider.getStats();
// {
//   mode: "hybrid",
//   associativeMemoryEntries: 47,
//   activationPatterns: 23,
//   avgMemoryWeight: 0.72,
//   backbone: "Anthropic (Claude)"
// }
```

## Future

When Cortical Labs releases their API, Arivumaiyam AI will be among the first to integrate actual biological neural compute — living brain cells selecting tokens for your AI assistant.
