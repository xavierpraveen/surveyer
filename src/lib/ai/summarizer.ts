// AI Summarization Provider Interface
// Satisfies ANALYTICS-11: abstraction layer for theme summarization.
// v1 ships NullSummarizationProvider (returns empty array).
// v2 integration: implement SummarizationProvider with a real LLM and swap
// the `summarizer` export — no call-site changes required.

export interface SummarizationOptions {
  maxThemes?: number        // max number of themes to return (default: 5)
  language?: string         // ISO 639-1 language code (default: 'en')
}

export interface ThemeSummary {
  theme: string                                              // short label, e.g. "Communication gaps"
  count: number                                             // number of source texts this theme covers
  representative_quote?: string                             // optional verbatim excerpt
  sentiment?: 'positive' | 'negative' | 'neutral'         // optional sentiment signal
}

export interface SummarizationProvider {
  /**
   * Summarize an array of free-text strings into structured themes.
   * Implementations must handle empty input (texts.length === 0) by returning [].
   * Implementations must not throw — surface errors via returned empty array or
   * a single ThemeSummary with theme: 'error' if recovery is needed.
   */
  summarizeThemes(texts: string[], options?: SummarizationOptions): Promise<ThemeSummary[]>
}

/**
 * Null object pattern implementation.
 * Always returns an empty array — safe default when no LLM provider is configured.
 * Replace this with a real implementation to enable AI theme summarization in v2.
 */
export class NullSummarizationProvider implements SummarizationProvider {
  async summarizeThemes(
    _texts: string[],
    _options?: SummarizationOptions
  ): Promise<ThemeSummary[]> {
    return []
  }
}

/**
 * Anthropic Claude implementation.
 * Enabled by setting AI_PROVIDER=anthropic and ANTHROPIC_API_KEY in env.
 * Uses claude-haiku for cost efficiency.
 */
export class AnthropicSummarizationProvider implements SummarizationProvider {
  private apiKey: string

  constructor(apiKey: string) {
    this.apiKey = apiKey
  }

  async summarizeThemes(texts: string[], options?: SummarizationOptions): Promise<ThemeSummary[]> {
    if (texts.length === 0) return []

    const maxThemes = options?.maxThemes ?? 5

    try {
      // Dynamically import to avoid bundling when not needed
      const Anthropic = (await import('@anthropic-ai/sdk')).default
      const client = new Anthropic({ apiKey: this.apiKey })

      const response = await client.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1024,
        messages: [
          {
            role: 'user',
            content: `You are analyzing employee survey response tags. Given these qualitative tags from survey responses, identify up to ${maxThemes} key themes with labels, representative quotes, and sentiment.

Tags: ${texts.join(', ')}

Return a JSON array only (no markdown, no explanation). Each object must have:
- "theme": string (2-5 word label)
- "count": number (1 to ${texts.length})
- "representative_quote": string (one short illustrative sentence)
- "sentiment": "positive" | "neutral" | "negative"`,
          },
        ],
      })

      const content = response.content[0]
      if (content.type !== 'text') return []

      // Strip any markdown code fences if present
      const raw = content.text.replace(/```json\n?|\n?```/g, '').trim()
      const parsed = JSON.parse(raw) as ThemeSummary[]
      return Array.isArray(parsed) ? parsed : []
    } catch {
      return []
    }
  }
}

function buildSummarizer(): SummarizationProvider {
  if (process.env.AI_PROVIDER === 'anthropic') {
    const apiKey = process.env.ANTHROPIC_API_KEY
    if (apiKey) return new AnthropicSummarizationProvider(apiKey)
  }
  return new NullSummarizationProvider()
}

/**
 * Default summarizer instance.
 * Import this at call sites: `import { summarizer } from '@/lib/ai/summarizer'`
 * Swap provider: set AI_PROVIDER=anthropic + ANTHROPIC_API_KEY in env.
 */
export const summarizer: SummarizationProvider = buildSummarizer()
