interface AnalyticsData {
  totalSearches: number;
  responseTimes: number[];  // store recent N times for avg calculation
  keywordCounts: Map<string, number>;
}

const analytics: AnalyticsData = {
  totalSearches: 0,
  responseTimes: [],
  keywordCounts: new Map(),
};

export function recordSearch(query: string, responseTimeMs: number): void {
  analytics.totalSearches++;

  // Keep last 100 response times for averaging
  analytics.responseTimes.push(responseTimeMs);
  if (analytics.responseTimes.length > 100) {
    analytics.responseTimes.shift();
  }

  // Extract and count keywords from query
  const keywords = query.toLowerCase().split(/\s+/).filter(k => k.length > 0);
  for (const keyword of keywords) {
    analytics.keywordCounts.set(keyword, (analytics.keywordCounts.get(keyword) || 0) + 1);
  }
}

export function getAnalytics() {
  const times = analytics.responseTimes;
  const avgResponseTime = times.length > 0
    ? times.reduce((a, b) => a + b, 0) / times.length
    : 0;

  // Get top 10 keywords
  const topKeywords = [...analytics.keywordCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([keyword, count]) => ({ keyword, count }));

  return {
    totalSearches: analytics.totalSearches,
    avgResponseTimeMs: Math.round(avgResponseTime * 100) / 100,
    topKeywords,
  };
}
