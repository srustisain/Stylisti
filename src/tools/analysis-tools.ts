/**
 * Pattern analysis and insight tools for Style MCP
 */

export function setupAnalysisTools() {
  return [
    {
      name: 'analyze_style_patterns',
      description: 'Analyze your style patterns and trends over time',
      inputSchema: {
        type: 'object',
        properties: {
          time_period: {
            type: 'string',
            enum: ['week', 'month', 'season', 'year'],
            default: 'month',
            description: 'Time period to analyze'
          },
          analysis_type: {
            type: 'string',
            enum: ['confidence_trends', 'comfort_patterns', 'style_evolution', 'wardrobe_gaps', 'color_preferences', 'occasion_analysis'],
            description: 'Type of analysis to perform'
          },
          focus_category: {
            type: 'string',
            enum: ['work', 'casual', 'formal', 'seasonal', 'all'],
            default: 'all',
            description: 'Focus the analysis on specific outfit categories'
          }
        }
      }
    },
    {
      name: 'get_style_insights',
      description: 'Get personalized style insights and recommendations',
      inputSchema: {
        type: 'object',
        properties: {
          insight_type: {
            type: 'string',
            enum: ['confidence_boosters', 'wardrobe_efficiency', 'style_consistency', 'comfort_optimization'],
            description: 'Type of insights to generate'
          },
          time_frame: {
            type: 'string',
            enum: ['recent', 'seasonal', 'yearly'],
            default: 'recent',
            description: 'Time frame for the insights'
          }
        }
      }
    },
    {
      name: 'generate_style_report',
      description: 'Generate a comprehensive style report for a given period',
      inputSchema: {
        type: 'object',
        properties: {
          report_type: {
            type: 'string',
            enum: ['weekly', 'monthly', 'seasonal', 'yearly'],
            default: 'monthly',
            description: 'Type of report to generate'
          },
          include_photos: {
            type: 'boolean',
            default: false,
            description: 'Include outfit photos in the report'
          },
          include_recommendations: {
            type: 'boolean',
            default: true,
            description: 'Include style recommendations'
          },
          export_format: {
            type: 'string',
            enum: ['json', 'markdown', 'pdf'],
            default: 'json',
            description: 'Format for the exported report'
          }
        }
      }
    },
    {
      name: 'analyze_color_palette',
      description: 'Analyze your color preferences and suggest palette improvements',
      inputSchema: {
        type: 'object',
        properties: {
          time_period: {
            type: 'string',
            enum: ['month', 'season', 'year'],
            default: 'season',
            description: 'Time period to analyze color usage'
          },
          suggest_additions: {
            type: 'boolean',
            default: true,
            description: 'Include suggestions for new colors to try'
          }
        }
      }
    },
    {
      name: 'track_confidence_trends',
      description: 'Track how your confidence levels change over time and identify patterns',
      inputSchema: {
        type: 'object',
        properties: {
          time_granularity: {
            type: 'string',
            enum: ['daily', 'weekly', 'monthly'],
            default: 'weekly',
            description: 'Granularity for confidence tracking'
          },
          correlation_factors: {
            type: 'array',
            items: {
              type: 'string',
              enum: ['weather', 'occasion', 'colors', 'style', 'comfort']
            },
            description: 'Factors to correlate with confidence levels'
          }
        }
      }
    },
    {
      name: 'identify_go_to_outfits',
      description: 'Identify your most successful outfit formulas and go-to combinations',
      inputSchema: {
        type: 'object',
        properties: {
          success_metric: {
            type: 'string',
            enum: ['confidence', 'comfort', 'success', 'overall'],
            default: 'overall',
            description: 'Metric to use for identifying successful outfits'
          },
          min_rating: {
            type: 'number',
            minimum: 1,
            maximum: 10,
            default: 7,
            description: 'Minimum rating for outfits to be considered'
          },
          occasion_filter: {
            type: 'string',
            description: 'Filter by specific occasion (optional)'
          }
        }
      }
    },
    {
      name: 'analyze_outfit_performance',
      description: 'Analyze how specific outfits or outfit elements perform across different contexts',
      inputSchema: {
        type: 'object',
        properties: {
          analysis_focus: {
            type: 'string',
            enum: ['garment_types', 'color_combinations', 'style_themes', 'seasonal_performance'],
            description: 'What aspect to analyze performance for'
          },
          context_variables: {
            type: 'array',
            items: {
              type: 'string',
              enum: ['weather', 'occasion', 'mood', 'time_of_day', 'season']
            },
            description: 'Context variables to consider in performance analysis'
          }
        }
      }
    },
    {
      name: 'predict_outfit_success',
      description: 'Predict how well a potential outfit combination might perform',
      inputSchema: {
        type: 'object',
        properties: {
          garments: {
            type: 'array',
            items: { type: 'string' },
            description: 'List of garments in the potential outfit'
          },
          colors: {
            type: 'array',
            items: { type: 'string' },
            description: 'Colors in the potential outfit'
          },
          occasion: {
            type: 'string',
            description: 'Intended occasion for the outfit'
          },
          weather_context: {
            type: 'object',
            properties: {
              temperature: { type: 'number' },
              condition: { type: 'string' },
              precipitation: { type: 'boolean' }
            },
            description: 'Expected weather conditions'
          }
        },
        required: ['garments', 'occasion']
      }
    },
    {
      name: 'compare_outfit_periods',
      description: 'Compare style metrics between different time periods',
      inputSchema: {
        type: 'object',
        properties: {
          period1: {
            type: 'object',
            properties: {
              start: { type: 'string', format: 'date' },
              end: { type: 'string', format: 'date' },
              label: { type: 'string' }
            },
            description: 'First time period to compare'
          },
          period2: {
            type: 'object',
            properties: {
              start: { type: 'string', format: 'date' },
              end: { type: 'string', format: 'date' },
              label: { type: 'string' }
            },
            description: 'Second time period to compare'
          },
          metrics: {
            type: 'array',
            items: {
              type: 'string',
              enum: ['confidence', 'comfort', 'success', 'style_variety', 'color_diversity']
            },
            default: ['confidence', 'comfort', 'success'],
            description: 'Metrics to compare between periods'
          }
        },
        required: ['period1', 'period2']
      }
    }
  ];
}