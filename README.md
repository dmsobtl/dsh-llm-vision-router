# dsh-llm-vision-router

DSH 插件：消息含图片时自动路由到多模态模型，无图片时继续用便宜的 DeepSeek。

## 为什么需要

DeepSeek 没有视觉能力，但 `app_screenshot`、`app_screenshot_diff` 等工具会返回图片。如果图片直接发给 DeepSeek，它看不懂。本插件自动检测上下文中的图片，仅在那个请求切换到视觉模型。

**成本对比**：
- 不用本插件：全程用贵的视觉模型（或者 DeepSeek 看不懂图片）
- 用本插件：99% 请求走 DeepSeek，只有含图片的那几次走视觉模型

## 安装

```bash
dsh plugin add dsh-llm-vision-router
```

## 配置

```yaml
- id: vision-router
  plugin: dsh-llm-vision-router
  config:
    visionProvider: openai       # 视觉模型的 provider route
    visionModel: gpt-4o-mini     # 视觉模型 ID
    toolResultsOnly: true        # 只在工具返回图片时触发（忽略用户上传的图片）
    verbose: false               # 路由切换时是否打日志
```

### 支持的视觉模型

| Provider | Model | 价格参考 |
|----------|-------|---------|
| openai | gpt-4o-mini | ~$0.15/1M input |
| openai | gpt-4o | ~$2.5/1M input |
| qwen | qwen-vl-plus | ~¥0.008/千 tokens |
| anthropic | claude-sonnet-4-6 | $3/1M input |
| openrouter | 各种 | 按模型计价 |

## 工作原理

```
请求流：
  agent/request waterfall
    ↓
  [vision-router] 检查 messages 中是否有 image content block
    ├── 有图片 → 修改 request.provider + request.model → 走视觉模型
    └── 无图片 → 不修改 → 继续走 DeepSeek
    ↓
  next() → llm/stream → 实际调用
```

## 与其他插件配合

```yaml
# 完整配置示例：DeepSeek 主力 + 视觉路由 + UI 验证
- id: llm-deepseek
  name: '@deepseek-ai/dsh-llm-deepseek'
  config:
    apiKey: ${DEEPSEEK_API_KEY}

- id: llm-openai            # 注册 OpenAI 作为可用 adapter
  name: '@deepseek-ai/dsh-llm-pi-ai'
  config:
    routes:
      - provider: openai
        apiKey: ${OPENAI_API_KEY}

- id: vision-router          # 自动路由
  plugin: dsh-llm-vision-router
  config:
    visionProvider: openai
    visionModel: gpt-4o-mini
    toolResultsOnly: true

- id: app-verify             # UI 测试工具（会返回截图）
  plugin: dsh-tool-app-verify
  config:
    mode: browser
    headless: true
```

Agent 大部分时间用 DeepSeek。当 `app_screenshot` 或 `app_screenshot_diff` 返回图片后，下一次模型调用自动走 gpt-4o-mini 来理解图片内容。理解完成后（该 turn 的 tool result 处理完），后续无图片的请求又回到 DeepSeek。

## 开发

```bash
npm install
npm test
```

## License

MIT
