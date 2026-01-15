/**
 * Search functionality for the configuration library
 */

import type { Configuration, SearchCriteria } from "../config/types.js";

/**
 * Search result with relevance score
 */
export interface SearchResult {
  configuration: Configuration;
  score: number;
  matchedFields: string[];
}

/**
 * Search configurations with scoring
 */
export function searchConfigurations(
  configs: Configuration[],
  criteria: SearchCriteria
): SearchResult[] {
  const results: SearchResult[] = [];

  for (const config of configs) {
    const result = scoreConfiguration(config, criteria);
    if (result.score > 0) {
      results.push(result);
    }
  }

  // Sort by score (highest first)
  results.sort((a, b) => b.score - a.score);

  return results;
}

/**
 * Score a configuration against search criteria
 */
function scoreConfiguration(config: Configuration, criteria: SearchCriteria): SearchResult {
  let score = 0;
  const matchedFields: string[] = [];

  // Check bundled/user filters
  if (criteria.bundledOnly && !config.bundled) {
    return { configuration: config, score: 0, matchedFields };
  }

  if (criteria.userOnly && config.bundled) {
    return { configuration: config, score: 0, matchedFields };
  }

  // Project type filter (required match)
  if (criteria.projectTypes && criteria.projectTypes.length > 0) {
    const hasMatch = criteria.projectTypes.some((t) => config.projectTypes.includes(t));
    if (!hasMatch) {
      return { configuration: config, score: 0, matchedFields };
    }
    score += 10;
    matchedFields.push("projectType");
  }

  // Language filter (required match)
  if (criteria.languages && criteria.languages.length > 0) {
    const configLangs = config.languages.map((l) => l.toLowerCase());
    const hasMatch = criteria.languages.some((l) => configLangs.includes(l.toLowerCase()));
    if (!hasMatch) {
      return { configuration: config, score: 0, matchedFields };
    }
    score += 10;
    matchedFields.push("language");
  }

  // Tag filter (required match)
  if (criteria.tags && criteria.tags.length > 0) {
    const configTags = config.tags.map((t) => t.toLowerCase());
    const hasMatch = criteria.tags.some((t) => configTags.includes(t.toLowerCase()));
    if (!hasMatch) {
      return { configuration: config, score: 0, matchedFields };
    }
    score += 5;
    matchedFields.push("tag");
  }

  // Query scoring (fuzzy match)
  if (criteria.query) {
    const queryScore = scoreQuery(config, criteria.query);
    if (queryScore.score === 0) {
      return { configuration: config, score: 0, matchedFields };
    }
    score += queryScore.score;
    matchedFields.push(...queryScore.matchedFields);
  } else {
    // No query - include all configs that pass filters
    score += 1;
  }

  return { configuration: config, score, matchedFields };
}

/**
 * Score a configuration against a free-text query
 */
function scoreQuery(
  config: Configuration,
  query: string
): { score: number; matchedFields: string[] } {
  const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
  let totalScore = 0;
  const matchedFields: string[] = [];

  for (const term of terms) {
    let termScore = 0;

    // Name match (highest weight)
    if (config.name.toLowerCase().includes(term)) {
      termScore += 20;
      if (!matchedFields.includes("name")) {
        matchedFields.push("name");
      }
    }

    // ID match
    if (config.id.toLowerCase().includes(term)) {
      termScore += 15;
      if (!matchedFields.includes("id")) {
        matchedFields.push("id");
      }
    }

    // Description match
    if (config.description.toLowerCase().includes(term)) {
      termScore += 10;
      if (!matchedFields.includes("description")) {
        matchedFields.push("description");
      }
    }

    // Tags match
    if (config.tags.some((t) => t.toLowerCase().includes(term))) {
      termScore += 8;
      if (!matchedFields.includes("tags")) {
        matchedFields.push("tags");
      }
    }

    // Languages match
    if (config.languages.some((l) => l.toLowerCase().includes(term))) {
      termScore += 5;
      if (!matchedFields.includes("languages")) {
        matchedFields.push("languages");
      }
    }

    totalScore += termScore;
  }

  return { score: totalScore, matchedFields };
}

/**
 * Get suggestions for search refinement
 */
export function getSearchSuggestions(
  configs: Configuration[],
  query: string
): string[] {
  const suggestions = new Set<string>();
  const lowerQuery = query.toLowerCase();

  for (const config of configs) {
    // Suggest matching tags
    for (const tag of config.tags) {
      if (tag.toLowerCase().includes(lowerQuery) && tag.toLowerCase() !== lowerQuery) {
        suggestions.add(tag);
      }
    }

    // Suggest matching languages
    for (const lang of config.languages) {
      if (lang.toLowerCase().includes(lowerQuery) && lang.toLowerCase() !== lowerQuery) {
        suggestions.add(lang);
      }
    }
  }

  return Array.from(suggestions).slice(0, 5);
}
