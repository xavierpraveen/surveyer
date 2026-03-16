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
 * Default summarizer instance.
 * Import this at call sites: `import { summarizer } from '@/lib/ai/summarizer'`
 * To swap provider in v2: change this line only.
 */
export const summarizer: SummarizationProvider = new NullSummarizationProvider()
