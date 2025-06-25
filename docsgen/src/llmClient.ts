import OpenAI from "openai"
import type { ChatCompletionChunk } from "openai/resources/chat"

export class LlmClient {
  private openai: OpenAI
  private model: string
  private maxOut: number

  constructor(apiKey: string, model = "gpt-4.1", maxOut = 32768) {
    this.openai = new OpenAI({ apiKey })
    this.model = model
    this.maxOut = maxOut
  }

  async chat(system: string, user: string): Promise<string> {
    const basePayload: Record<string, unknown> = {
      model: this.model,
      temperature: 0.2,
      stream: true,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    }

    const MODEL_COMPLETION_LIMIT = 200_000;
    const limit = Math.min(this.maxOut, MODEL_COMPLETION_LIMIT);

    basePayload["max_tokens"] = limit;

    const stream: any = await this.openai.chat.completions.create(basePayload as any)

    let result = ""
    for await (const chunk of stream as AsyncIterable<ChatCompletionChunk>) {
      result += chunk.choices[0].delta?.content ?? ""
    }
    return result
  }
} 