/**
 * Wardrobe management tools for Style MCP
 */

export function setupWardrobeTools() {
  return [
    {
      name: 'add_wardrobe_item',
      description: 'Add a new clothing item to your wardrobe inventory',
      inputSchema: {
        type: 'object',
        properties: {
          item_name: {
            type: 'string',
            description: 'Name or description of the clothing item'
          },
          category: {
            type: 'string',
            enum: ['tops', 'bottoms', 'shoes', 'outerwear', 'accessories', 'dresses', 'suits'],
            description: 'Category of the clothing item'
          },
          colors: {
            type: 'array',
            items: { type: 'string' },
            description: 'Colors of the item'
          },
          style_tags: {
            type: 'array',
            items: { type: 'string' },
            description: 'Style tags (casual, formal, trendy, classic, etc.)'
          },
          purchase_date: {
            type: 'string',
            format: 'date',
            description: 'Date when the item was purchased'
          },
          cost: {
            type: 'number',
            minimum: 0,
            description: 'Cost of the item in dollars'
          },
          brand: {
            type: 'string',
            description: 'Brand name of the item'
          },
          care_instructions: {
            type: 'string',
            description: 'Special care instructions for the item'
          },
          size: {
            type: 'string',
            description: 'Size of the item'
          },
          material: {
            type: 'string',
            description: 'Material composition of the item'
          },
          versatility_score: {
            type: 'number',
            minimum: 1,
            maximum: 10,
            description: 'How versatile is this item? (1-10)'
          }
        },
        required: ['item_name', 'category']
      }
    },
    {
      name: 'update_wardrobe_item',
      description: 'Update information about an existing wardrobe item',
      inputSchema: {
        type: 'object',
        properties: {
          item_id: {
            type: 'string',
            description: 'ID of the item to update'
          },
          item_name: { type: 'string' },
          colors: { type: 'array', items: { type: 'string' } },
          style_tags: { type: 'array', items: { type: 'string' } },
          care_instructions: { type: 'string' },
          notes: { type: 'string' },
          condition: {
            type: 'string',
            enum: ['excellent', 'good', 'fair', 'poor'],
            description: 'Current condition of the item'
          }
        },
        required: ['item_id']
      }
    },
    {
      name: 'remove_wardrobe_item',
      description: 'Remove an item from your wardrobe inventory',
      inputSchema: {
        type: 'object',
        properties: {
          item_id: {
            type: 'string',
            description: 'ID of the item to remove'
          },
          reason: {
            type: 'string',
            enum: ['donated', 'sold', 'worn_out', 'no_longer_fits', 'style_change'],
            description: 'Reason for removing the item'
          },
          confirm: {
            type: 'boolean',
            description: 'Confirmation that you want to remove this item'
          }
        },
        required: ['item_id', 'confirm']
      }
    },
    {
      name: 'get_wardrobe_inventory',
      description: 'Get your complete wardrobe inventory or filter by criteria',
      inputSchema: {
        type: 'object',
        properties: {
          category: {
            type: 'string',
            enum: ['tops', 'bottoms', 'shoes', 'outerwear', 'accessories', 'dresses', 'suits'],
            description: 'Filter by category'
          },
          colors: {
            type: 'array',
            items: { type: 'string' },
            description: 'Filter by colors'
          },
          style_tags: {
            type: 'array',
            items: { type: 'string' },
            description: 'Filter by style tags'
          },
          brand: {
            type: 'string',
            description: 'Filter by brand'
          },
          min_versatility: {
            type: 'number',
            minimum: 1,
            maximum: 10,
            description: 'Minimum versatility score'
          },
          sort_by: {
            type: 'string',
            enum: ['name', 'category', 'purchase_date', 'cost', 'worn_count', 'last_worn'],
            default: 'category',
            description: 'How to sort the results'
          }
        }
      }
    },
    {
      name: 'wardrobe_gap_analysis',
      description: 'Identify gaps in your wardrobe and get purchase recommendations',
      inputSchema: {
        type: 'object',
        properties: {
          focus_area: {
            type: 'string',
            enum: ['work', 'casual', 'formal', 'seasonal', 'color_palette', 'basics', 'statement_pieces'],
            description: 'Area to focus the gap analysis on'
          },
          budget_range: {
            type: 'string',
            enum: ['under_50', '50_150', '150_300', '300_plus', 'no_limit'],
            description: 'Budget range for new purchases'
          },
          priority_level: {
            type: 'string',
            enum: ['urgent', 'medium', 'low'],
            default: 'medium',
            description: 'Priority level for filling gaps'
          },
          season: {
            type: 'string',
            enum: ['spring', 'summer', 'fall', 'winter', 'current'],
            default: 'current',
            description: 'Season to focus on for gap analysis'
          }
        }
      }
    },
    {
      name: 'analyze_wardrobe_usage',
      description: 'Analyze how often your wardrobe items are used',
      inputSchema: {
        type: 'object',
        properties: {
          time_period: {
            type: 'string',
            enum: ['month', 'season', 'year'],
            default: 'season',
            description: 'Time period to analyze usage over'
          },
          category: {
            type: 'string',
            enum: ['tops', 'bottoms', 'shoes', 'outerwear', 'accessories', 'all'],
            default: 'all',
            description: 'Category to focus analysis on'
          },
          identify_unused: {
            type: 'boolean',
            default: true,
            description: 'Identify items that haven\'t been worn recently'
          }
        }
      }
    },
    {
      name: 'calculate_cost_per_wear',
      description: 'Calculate cost per wear for wardrobe items',
      inputSchema: {
        type: 'object',
        properties: {
          item_id: {
            type: 'string',
            description: 'Specific item to calculate for (optional)'
          },
          category: {
            type: 'string',
            enum: ['tops', 'bottoms', 'shoes', 'outerwear', 'accessories'],
            description: 'Category to calculate for (if no specific item)'
          },
          sort_by_efficiency: {
            type: 'boolean',
            default: true,
            description: 'Sort results by cost efficiency (lower cost per wear first)'
          }
        }
      }
    },
    {
      name: 'suggest_outfit_combinations',
      description: 'Suggest new outfit combinations using existing wardrobe items',
      inputSchema: {
        type: 'object',
        properties: {
          occasion: {
            type: 'string',
            description: 'Occasion to create combinations for'
          },
          unused_items_focus: {
            type: 'boolean',
            default: false,
            description: 'Focus on incorporating rarely worn items'
          },
          color_theme: {
            type: 'string',
            description: 'Specific color theme for the combinations'
          },
          style_direction: {
            type: 'string',
            description: 'Style direction (minimalist, bohemian, edgy, etc.)'
          },
          number_of_suggestions: {
            type: 'number',
            minimum: 1,
            maximum: 10,
            default: 5,
            description: 'Number of combinations to suggest'
          }
        }
      }
    },
    {
      name: 'plan_wardrobe_refresh',
      description: 'Create a plan for refreshing your wardrobe',
      inputSchema: {
        type: 'object',
        properties: {
          budget: {
            type: 'number',
            minimum: 0,
            description: 'Total budget for wardrobe refresh'
          },
          timeline: {
            type: 'string',
            enum: ['1_month', '3_months', '6_months', '1_year'],
            description: 'Timeline for the wardrobe refresh'
          },
          focus_areas: {
            type: 'array',
            items: {
              type: 'string',
              enum: ['basics', 'work_clothes', 'casual_wear', 'formal_wear', 'accessories', 'shoes']
            },
            description: 'Areas to focus the refresh on'
          },
          style_goals: {
            type: 'array',
            items: { type: 'string' },
            description: 'Style goals for the refresh'
          }
        },
        required: ['budget', 'timeline']
      }
    },
    {
      name: 'export_wardrobe_data',
      description: 'Export wardrobe data in various formats',
      inputSchema: {
        type: 'object',
        properties: {
          format: {
            type: 'string',
            enum: ['json', 'csv', 'pdf_inventory', 'shopping_list'],
            default: 'json',
            description: 'Export format'
          },
          include_photos: {
            type: 'boolean',
            default: false,
            description: 'Include item photos in export'
          },
          include_usage_stats: {
            type: 'boolean',
            default: true,
            description: 'Include usage statistics'
          },
          filter_by_category: {
            type: 'string',
            enum: ['tops', 'bottoms', 'shoes', 'outerwear', 'accessories'],
            description: 'Export only specific category'
          }
        }
      }
    }
  ];
}