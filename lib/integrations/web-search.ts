// Web Search Integration Service
export interface SearchResult {
  title: string
  url: string
  snippet: string
  displayUrl: string
  datePublished?: string
  image?: string
  source: string
}

export interface SearchResponse {
  query: string
  results: SearchResult[]
  totalResults: number
  searchTime: number
  relatedQueries: string[]
}

export class WebSearchService {
  private apiKey: string
  private baseUrl = "https://serpapi.com/search"

  constructor(apiKey: string) {
    this.apiKey = apiKey
  }

  async search(query: string, options: SearchOptions = {}): Promise<SearchResponse> {
    const startTime = Date.now()

    try {
      const params = new URLSearchParams({
        q: query,
        api_key: this.apiKey,
        engine: options.engine || "google",
        num: (options.limit || 10).toString(),
        gl: options.country || "us",
        hl: options.language || "en",
        safe: options.safeSearch || "active",
        tbm: options.searchType || "web",
      })

      const response = await fetch(`${this.baseUrl}?${params}`)

      if (!response.ok) {
        throw new Error(`Search API error: ${response.statusText}`)
      }

      const data = await response.json()
      const searchTime = Date.now() - startTime

      return {
        query,
        results: this.parseResults(data),
        totalResults: data.search_information?.total_results || 0,
        searchTime,
        relatedQueries: data.related_searches?.map((r: any) => r.query) || [],
      }
    } catch (error) {
      console.error("Web search failed:", error)
      throw error
    }
  }

  async searchImages(query: string, options: ImageSearchOptions = {}): Promise<SearchResponse> {
    return this.search(query, {
      ...options,
      searchType: "isch",
      limit: options.limit || 20,
    })
  }

  async searchNews(query: string, options: NewsSearchOptions = {}): Promise<SearchResponse> {
    return this.search(query, {
      ...options,
      searchType: "nws",
      limit: options.limit || 10,
    })
  }

  private parseResults(data: any): SearchResult[] {
    const results: SearchResult[] = []

    // Parse organic results
    if (data.organic_results) {
      for (const result of data.organic_results) {
        results.push({
          title: result.title,
          url: result.link,
          snippet: result.snippet || "",
          displayUrl: result.displayed_link || result.link,
          datePublished: result.date,
          source: "organic",
        })
      }
    }

    // Parse image results
    if (data.images_results) {
      for (const result of data.images_results) {
        results.push({
          title: result.title,
          url: result.original,
          snippet: result.title,
          displayUrl: result.source,
          image: result.thumbnail,
          source: "image",
        })
      }
    }

    // Parse news results
    if (data.news_results) {
      for (const result of data.news_results) {
        results.push({
          title: result.title,
          url: result.link,
          snippet: result.snippet || "",
          displayUrl: result.source,
          datePublished: result.date,
          image: result.thumbnail,
          source: "news",
        })
      }
    }

    return results
  }

  async summarizeResults(results: SearchResult[], query: string): Promise<string> {
    const topResults = results.slice(0, 5)
    const summary = `Based on search results for "${query}":\n\n`

    const summaryPoints = topResults.map((result, index) => {
      return `${index + 1}. **${result.title}** (${result.displayUrl})\n   ${result.snippet}`
    })

    return summary + summaryPoints.join("\n\n") + "\n\nSources: " + topResults.map((r) => r.url).join(", ")
  }
}

export interface SearchOptions {
  engine?: "google" | "bing" | "duckduckgo"
  limit?: number
  country?: string
  language?: string
  safeSearch?: "active" | "off"
  searchType?: "web" | "isch" | "nws"
}

export interface ImageSearchOptions extends SearchOptions {
  imageSize?: "small" | "medium" | "large"
  imageType?: "photo" | "clipart" | "lineart"
  imageColor?: string
}

export interface NewsSearchOptions extends SearchOptions {
  timeRange?: "hour" | "day" | "week" | "month" | "year"
  sortBy?: "relevance" | "date"
}

// Global search service instance
export const webSearchService = new WebSearchService(process.env.SERPAPI_API_KEY || "")
