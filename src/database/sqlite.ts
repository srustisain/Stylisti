/**
 * SQLite database implementation for Style MCP
 */

import sqlite3 from 'sqlite3';
import { Outfit, WardrobeItem, OutfitRatings, AIAnalysis } from '../types/outfit.js';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';

export class OutfitDatabase {
  private db!: sqlite3.Database;
  private dbPath: string;

  constructor(dbPath?: string) {
    this.dbPath = dbPath || path.join(process.cwd(), 'data', 'style.db');
  }

  async initialize(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db = new sqlite3.Database(this.dbPath, (err) => {
        if (err) {
          reject(err);
          return;
        }
        
        this.createTables()
          .then(() => resolve())
          .catch(reject);
      });
    });
  }

  private async createTables(): Promise<void> {
    const sql = `
      CREATE TABLE IF NOT EXISTS outfits (
        id TEXT PRIMARY KEY,
        timestamp DATETIME,
        photo_paths TEXT,
        occasion_tags TEXT,
        style_tags TEXT,
        mood TEXT,
        season TEXT,
        colors TEXT,
        garments TEXT,
        weather_data TEXT,
        context_data TEXT,
        confidence_rating INTEGER,
        comfort_rating INTEGER,
        success_rating INTEGER,
        repeat_likelihood INTEGER,
        ratings_feedback TEXT,
        notes TEXT,
        ai_analysis TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS wardrobe_items (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        category TEXT NOT NULL,
        colors TEXT,
        style_tags TEXT,
        purchase_date DATE,
        cost DECIMAL(10,2),
        brand TEXT,
        care_instructions TEXT,
        worn_count INTEGER DEFAULT 0,
        last_worn DATE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS user_preferences (
        key TEXT PRIMARY KEY,
        value TEXT,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_outfits_timestamp ON outfits(timestamp);
      CREATE INDEX IF NOT EXISTS idx_outfits_occasion ON outfits(occasion_tags);
      CREATE INDEX IF NOT EXISTS idx_wardrobe_category ON wardrobe_items(category);
    `;

    return new Promise((resolve, reject) => {
      this.db.exec(sql, (err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }

  async createOutfit(data: any): Promise<Outfit> {
    const id = uuidv4();
    const timestamp = new Date();
    
    const outfit: Outfit = {
      id,
      timestamp,
      photoPaths: data.photo_paths || [data.photo_path].filter(Boolean),
      tags: {
        occasion: Array.isArray(data.occasion) ? data.occasion : [data.occasion].filter(Boolean),
        season: Array.isArray(data.season) ? data.season : (data.season ? [data.season] : [this.getCurrentSeason()]),
        style: data.style_tags || [],
        mood: data.mood || '',
        colors: data.colors || [],
        garments: data.garments || [],
        formalityLevel: data.formality_level,
        effortLevel: data.effort_level,
      },
      context: {
        weather: data.weather_context || await this.getCurrentWeather(),
        location: data.location,
        duration: data.duration,
        eventType: data.event_type,
      },
      notes: data.notes,
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    const sql = `
      INSERT INTO outfits (
        id, timestamp, photo_paths, occasion_tags, style_tags, mood, season,
        colors, garments, weather_data, context_data, notes, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    return new Promise((resolve, reject) => {
      this.db.run(sql, [
        outfit.id,
        outfit.timestamp.toISOString(),
        JSON.stringify(outfit.photoPaths),
        JSON.stringify(outfit.tags.occasion),
        JSON.stringify(outfit.tags.style),
        outfit.tags.mood,
        JSON.stringify(outfit.tags.season),
        JSON.stringify(outfit.tags.colors),
        JSON.stringify(outfit.tags.garments),
        JSON.stringify(outfit.context.weather),
        JSON.stringify(outfit.context),
        outfit.notes,
        outfit.createdAt.toISOString(),
        outfit.updatedAt.toISOString(),
      ], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve(outfit);
        }
      });
    });
  }

  async getOutfit(id: string): Promise<Outfit | null> {
    const sql = 'SELECT * FROM outfits WHERE id = ?';
    
    return new Promise((resolve, reject) => {
      this.db.get(sql, [id], (err, row: any) => {
        if (err) {
          reject(err);
        } else if (!row) {
          resolve(null);
        } else {
          resolve(this.rowToOutfit(row));
        }
      });
    });
  }

  async updateOutfitRatings(id: string, ratings: Partial<OutfitRatings>): Promise<void> {
    const sql = `
      UPDATE outfits SET 
        confidence_rating = ?, 
        comfort_rating = ?, 
        success_rating = ?, 
        repeat_likelihood = ?,
        ratings_feedback = ?,
        updated_at = ?
      WHERE id = ?
    `;

    return new Promise((resolve, reject) => {
      this.db.run(sql, [
        ratings.confidence,
        ratings.comfort,
        ratings.success,
        ratings.repeatLikelihood,
        JSON.stringify({
          receivedCompliments: ratings.receivedCompliments,
          feltAppropriate: ratings.feltAppropriate,
        }),
        new Date().toISOString(),
        id,
      ], (err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }

  async updateOutfitAnalysis(id: string, analysis: AIAnalysis): Promise<void> {
    const sql = 'UPDATE outfits SET ai_analysis = ?, updated_at = ? WHERE id = ?';
    
    return new Promise((resolve, reject) => {
      this.db.run(sql, [
        JSON.stringify(analysis),
        new Date().toISOString(),
        id,
      ], (err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }

  async searchOutfits(criteria: any): Promise<Outfit[]> {
    let sql = 'SELECT * FROM outfits WHERE 1=1';
    const params: any[] = [];

    if (criteria.tags && criteria.tags.length > 0) {
      sql += ' AND (occasion_tags LIKE ? OR style_tags LIKE ?)';
      const tagPattern = `%${criteria.tags[0]}%`;
      params.push(tagPattern, tagPattern);
    }

    if (criteria.min_confidence) {
      sql += ' AND confidence_rating >= ?';
      params.push(criteria.min_confidence);
    }

    if (criteria.min_comfort) {
      sql += ' AND comfort_rating >= ?';
      params.push(criteria.min_comfort);
    }

    if (criteria.occasion) {
      sql += ' AND occasion_tags LIKE ?';
      params.push(`%${criteria.occasion}%`);
    }

    if (criteria.season) {
      sql += ' AND season = ?';
      params.push(criteria.season);
    }

    sql += ' ORDER BY timestamp DESC';
    
    if (criteria.limit) {
      sql += ' LIMIT ?';
      params.push(criteria.limit);
    }

    return new Promise((resolve, reject) => {
      this.db.all(sql, params, (err, rows: any[]) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows.map(row => this.rowToOutfit(row)));
        }
      });
    });
  }

  async getRecentOutfits(days: number = 30): Promise<Outfit[]> {
    const sql = `
      SELECT * FROM outfits 
      WHERE timestamp >= date('now', '-${days} days')
      ORDER BY timestamp DESC
    `;

    return new Promise((resolve, reject) => {
      this.db.all(sql, [], (err, rows: any[]) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows.map(row => this.rowToOutfit(row)));
        }
      });
    });
  }

  async addWardrobeItem(data: any): Promise<WardrobeItem> {
    const id = uuidv4();
    const createdAt = new Date();
    
    const item: WardrobeItem = {
      id,
      name: data.item_name,
      category: data.category,
      colors: data.colors || [],
      styleTags: data.style_tags || [],
      purchaseDate: data.purchase_date ? new Date(data.purchase_date) : undefined,
      cost: data.cost,
      brand: data.brand,
      careInstructions: data.care_instructions,
      wornCount: 0,
      createdAt,
    };

    const sql = `
      INSERT INTO wardrobe_items (
        id, name, category, colors, style_tags, purchase_date, cost, brand, care_instructions, worn_count, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    return new Promise((resolve, reject) => {
      this.db.run(sql, [
        item.id,
        item.name,
        item.category,
        JSON.stringify(item.colors),
        JSON.stringify(item.styleTags),
        item.purchaseDate?.toISOString(),
        item.cost,
        item.brand,
        item.careInstructions,
        item.wornCount,
        item.createdAt.toISOString(),
      ], (err) => {
        if (err) {
          reject(err);
        } else {
          resolve(item);
        }
      });
    });
  }

  async getWardrobeInventory(): Promise<WardrobeItem[]> {
    const sql = 'SELECT * FROM wardrobe_items ORDER BY category, name';
    
    return new Promise((resolve, reject) => {
      this.db.all(sql, [], (err, rows: any[]) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows.map(row => this.rowToWardrobeItem(row)));
        }
      });
    });
  }

  async getWardrobeCount(): Promise<number> {
    const sql = 'SELECT COUNT(*) as count FROM wardrobe_items';
    
    return new Promise((resolve, reject) => {
      this.db.get(sql, [], (err, row: any) => {
        if (err) {
          reject(err);
        } else {
          resolve(row.count);
        }
      });
    });
  }

  private rowToOutfit(row: any): Outfit {
    return {
      id: row.id,
      timestamp: new Date(row.timestamp),
      photoPaths: JSON.parse(row.photo_paths || '[]'),
      tags: {
        occasion: JSON.parse(row.occasion_tags || '[]'),
        season: JSON.parse(row.season || '[]'),
        style: JSON.parse(row.style_tags || '[]'),
        mood: row.mood,
        colors: JSON.parse(row.colors || '[]'),
        garments: JSON.parse(row.garments || '[]'),
      },
      context: JSON.parse(row.context_data || '{}'),
      ratings: row.confidence_rating ? {
        confidence: row.confidence_rating,
        comfort: row.comfort_rating,
        success: row.success_rating,
        repeatLikelihood: row.repeat_likelihood,
        ...JSON.parse(row.ratings_feedback || '{}'),
      } : undefined,
      notes: row.notes,
      aiAnalysis: row.ai_analysis ? JSON.parse(row.ai_analysis) : undefined,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    };
  }

  private rowToWardrobeItem(row: any): WardrobeItem {
    return {
      id: row.id,
      name: row.name,
      category: row.category,
      colors: JSON.parse(row.colors || '[]'),
      styleTags: JSON.parse(row.style_tags || '[]'),
      purchaseDate: row.purchase_date ? new Date(row.purchase_date) : undefined,
      cost: row.cost,
      brand: row.brand,
      careInstructions: row.care_instructions,
      wornCount: row.worn_count,
      lastWorn: row.last_worn ? new Date(row.last_worn) : undefined,
      createdAt: new Date(row.created_at),
    };
  }

  private getCurrentSeason(): string {
    const month = new Date().getMonth();
    if (month >= 2 && month <= 4) return 'spring';
    if (month >= 5 && month <= 7) return 'summer';
    if (month >= 8 && month <= 10) return 'fall';
    return 'winter';
  }

  private async getCurrentWeather(): Promise<any> {
    // Placeholder - in real implementation, would call weather API
    return {
      temperature: 70,
      condition: 'clear',
      precipitation: false,
    };
  }

  async close(): Promise<void> {
    return new Promise((resolve) => {
      this.db.close((err) => {
        if (err) {
          console.error('Error closing database:', err);
        }
        resolve();
      });
    });
  }
}