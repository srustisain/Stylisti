/**
 * Outfit management tools for Style MCP
 */

export function setupOutfitTools() {
  return [
    {
      name: 'log_outfit',
      description: 'Log a new outfit with photo, tags, and context information',
      inputSchema: {
        type: 'object',
        properties: {
          photo_path: {
            type: 'string',
            description: 'Path to the outfit photo'
          },
          photo_paths: {
            type: 'array',
            items: { type: 'string' },
            description: 'Multiple photo paths for the outfit'
          },
          occasion: {
            type: 'array',
            items: { type: 'string' },
            description: 'Occasion tags (work, casual, formal, date, travel, exercise, social)'
          },
          style_tags: {
            type: 'array',
            items: { type: 'string' },
            description: 'Style tags (minimalist, bohemian, classic, trendy, edgy, romantic)'
          },
          mood: {
            type: 'string',
            description: 'Your mood when choosing this outfit (confident, comfortable, playful, professional, relaxed)'
          },
          season: {
            type: 'string',
            enum: ['spring', 'summer', 'fall', 'winter'],
            description: 'Season for this outfit'
          },
          colors: {
            type: 'array',
            items: { type: 'string' },
            description: 'Primary colors in the outfit'
          },
          garments: {
            type: 'array',
            items: { type: 'string' },
            description: 'Specific clothing items worn'
          },
          weather_context: {
            type: 'object',
            properties: {
              temperature: { type: 'number', description: 'Temperature in Fahrenheit' },
              condition: { type: 'string', description: 'Weather condition (sunny, cloudy, rainy, etc.)' },
              precipitation: { type: 'boolean', description: 'Is it raining/snowing?' }
            },
            description: 'Weather information for the day'
          },
          location: {
            type: 'string',
            description: 'Where you wore this outfit'
          },
          duration: {
            type: 'string',
            description: 'How long you wore this outfit (e.g., "8 hours", "all day")'
          },
          notes: {
            type: 'string',
            description: 'Additional notes about the outfit'
          }
        },
        required: []
      }
    },
    {
      name: 'rate_outfit',
      description: 'Rate an existing outfit on confidence, comfort, and success',
      inputSchema: {
        type: 'object',
        properties: {
          outfit_id: {
            type: 'string',
            description: 'ID of the outfit to rate'
          },
          confidence: {
            type: 'number',
            minimum: 1,
            maximum: 10,
            description: 'How confident did you feel? (1-10)'
          },
          comfort: {
            type: 'number',
            minimum: 1,
            maximum: 10,
            description: 'How comfortable was the outfit? (1-10)'
          },
          success: {
            type: 'number',
            minimum: 1,
            maximum: 10,
            description: 'How successful was the outfit for its purpose? (1-10)'
          },
          repeat_likelihood: {
            type: 'number',
            minimum: 1,
            maximum: 10,
            description: 'How likely are you to wear this exact combination again? (1-10)'
          },
          received_compliments: {
            type: 'boolean',
            description: 'Did you receive compliments on this outfit?'
          },
          felt_appropriate: {
            type: 'boolean',
            description: 'Did the outfit feel appropriate for the occasion?'
          },
          feedback_notes: {
            type: 'string',
            description: 'Additional feedback about how the outfit performed'
          }
        },
        required: ['outfit_id']
      }
    },
    {
      name: 'get_outfit_recommendations',
      description: 'Get AI-powered outfit recommendations based on context and preferences',
      inputSchema: {
        type: 'object',
        properties: {
          occasion: {
            type: 'string',
            description: 'The occasion you\'re dressing for'
          },
          weather: {
            type: 'object',
            properties: {
              temperature: { type: 'number' },
              condition: { type: 'string' },
              precipitation: { type: 'boolean' }
            },
            description: 'Current or expected weather conditions'
          },
          mood_preference: {
            type: 'string',
            description: 'How you want to feel in this outfit'
          },
          style_preference: {
            type: 'array',
            items: { type: 'string' },
            description: 'Preferred style directions for this outfit'
          },
          time_of_day: {
            type: 'string',
            enum: ['morning', 'afternoon', 'evening', 'night'],
            description: 'When you\'ll be wearing the outfit'
          },
          duration: {
            type: 'string',
            description: 'How long you\'ll be wearing it'
          },
          limit: {
            type: 'number',
            default: 5,
            description: 'Number of recommendations to return'
          }
        }
      }
    },
    {
      name: 'search_outfits',
      description: 'Search through your outfit history with various filters',
      inputSchema: {
        type: 'object',
        properties: {
          tags: {
            type: 'array',
            items: { type: 'string' },
            description: 'Filter by occasion, style, or other tags'
          },
          date_range: {
            type: 'object',
            properties: {
              start: { type: 'string', format: 'date' },
              end: { type: 'string', format: 'date' }
            },
            description: 'Date range to search within'
          },
          min_confidence: {
            type: 'number',
            minimum: 1,
            maximum: 10,
            description: 'Minimum confidence rating'
          },
          min_comfort: {
            type: 'number',
            minimum: 1,
            maximum: 10,
            description: 'Minimum comfort rating'
          },
          min_success: {
            type: 'number',
            minimum: 1,
            maximum: 10,
            description: 'Minimum success rating'
          },
          occasion: {
            type: 'string',
            description: 'Filter by specific occasion'
          },
          season: {
            type: 'string',
            enum: ['spring', 'summer', 'fall', 'winter'],
            description: 'Filter by season'
          },
          mood: {
            type: 'string',
            description: 'Filter by mood'
          },
          colors: {
            type: 'array',
            items: { type: 'string' },
            description: 'Filter by colors included'
          },
          limit: {
            type: 'number',
            default: 20,
            description: 'Maximum number of results to return'
          }
        }
      }
    },
    {
      name: 'get_outfit_details',
      description: 'Get detailed information about a specific outfit',
      inputSchema: {
        type: 'object',
        properties: {
          outfit_id: {
            type: 'string',
            description: 'ID of the outfit to retrieve'
          }
        },
        required: ['outfit_id']
      }
    },
    {
      name: 'delete_outfit',
      description: 'Delete an outfit entry from your history',
      inputSchema: {
        type: 'object',
        properties: {
          outfit_id: {
            type: 'string',
            description: 'ID of the outfit to delete'
          },
          confirm: {
            type: 'boolean',
            description: 'Confirmation that you want to delete this outfit'
          }
        },
        required: ['outfit_id', 'confirm']
      }
    }
  ];
}