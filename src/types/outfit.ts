/**
 * Core type definitions for the Style MCP
 */

export interface Outfit {
  id: string;
  timestamp: Date;
  photoPaths: string[];
  tags: OutfitTags;
  context: OutfitContext;
  ratings?: OutfitRatings;
  notes?: string;
  aiAnalysis?: AIAnalysis;
  createdAt: Date;
  updatedAt: Date;
}

export interface OutfitTags {
  occasion: string[];
  season: string[];
  style: string[];
  mood: string;
  colors: string[];
  garments: string[];
  formalityLevel?: number; // 1-10
  effortLevel?: 'low' | 'medium' | 'high';
}

export interface OutfitContext {
  weather: WeatherData;
  location?: string;
  duration?: string; // e.g., "8 hours", "all day"
  eventType?: string;
}

export interface WeatherData {
  temperature: number; // Fahrenheit
  condition: string; // "sunny", "cloudy", "rainy", etc.
  precipitation: boolean;
  humidity?: number;
  windSpeed?: number;
}

export interface OutfitRatings {
  confidence: number; // 1-10
  comfort: number; // 1-10
  success: number; // 1-10
  repeatLikelihood: number; // 1-10
  receivedCompliments?: boolean;
  feltAppropriate?: boolean;
}

export interface AIAnalysis {
  styleCoherence: number; // 0-1
  colorHarmony: number; // 0-1
  occasionAppropriateness: number; // 0-1
  summary: string;
  suggestedImprovements?: string[];
  confidenceFactors?: string[];
}

export interface WardrobeItem {
  id: string;
  name: string;
  category: 'tops' | 'bottoms' | 'shoes' | 'outerwear' | 'accessories';
  colors: string[];
  styleTags: string[];
  purchaseDate?: Date;
  cost?: number;
  brand?: string;
  careInstructions?: string;
  wornCount: number;
  lastWorn?: Date;
  createdAt: Date;
}

export interface UserPreferences {
  styleGoals: string[];
  comfortPriorities: string[];
  colorPreferences: string[];
  avoidedStyles: string[];
  bodyTypeConsiderations?: string;
  sizePreferences: SizePreferences;
}

export interface SizePreferences {
  fitPreferences: string; // "tailored", "relaxed", "oversized"
  sizes: Record<string, string>; // {"tops": "M", "bottoms": "32x30"}
}

export interface StylePattern {
  patternType: 'confidence' | 'comfort' | 'success' | 'style_evolution';
  timeFrame: 'week' | 'month' | 'season' | 'year';
  insights: PatternInsight[];
  recommendations: string[];
}

export interface PatternInsight {
  category: string;
  trend: 'increasing' | 'decreasing' | 'stable';
  value: number;
  description: string;
  significance: 'high' | 'medium' | 'low';
}

export interface OutfitRecommendation {
  id: string;
  outfitId?: string; // Reference to existing outfit
  suggestedCombination?: OutfitCombination;
  score: number; // 0-1
  reasoning: string[];
  weatherScore: number;
  occasionScore: number;
  personalScore: number;
  confidenceScore: number;
}

export interface OutfitCombination {
  items: WardrobeItem[];
  estimatedRatings: Partial<OutfitRatings>;
  styleDescription: string;
}

export interface WardrobeGap {
  category: string;
  priority: 'high' | 'medium' | 'low';
  description: string;
  suggestedItems: string[];
  occasionsCovered: string[];
  estimatedBudget?: string;
}

export interface StyleReport {
  id: string;
  period: string;
  dateRange: {
    start: Date;
    end: Date;
  };
  metrics: {
    totalOutfits: number;
    avgConfidence: number;
    avgComfort: number;
    avgSuccess: number;
    mostWornItems: WardrobeItem[];
    topStyles: string[];
    colorPreferences: Record<string, number>;
  };
  insights: PatternInsight[];
  recommendations: string[];
  generatedAt: Date;
}