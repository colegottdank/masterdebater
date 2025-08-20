// Cloudflare D1 REST API client for Next.js/Vercel
interface D1Response {
  success: boolean;
  result?: any[];
  error?: string;
  messages?: string[];
}

class D1Client {
  private accountId: string;
  private databaseId: string;
  private apiToken: string;
  private email: string;

  constructor() {
    this.accountId = process.env.CLOUDFLARE_ACCOUNT_ID!;
    this.databaseId = process.env.CLOUDFLARE_D1_DATABASE_ID!;
    this.apiToken = process.env.CLOUDFLARE_API_TOKEN!;
    this.email = process.env.CLOUDFLARE_EMAIL!;

    if (!this.accountId || !this.databaseId || !this.apiToken || !this.email) {
      console.warn('D1 credentials not fully configured. Database features will be disabled.');
    }
  }

  async query(sql: string, params?: any[]): Promise<D1Response> {
    if (!this.databaseId || this.databaseId === 'your_d1_database_id') {
      console.log('D1 not configured, skipping query:', sql);
      return { success: false, error: 'Database not configured' };
    }

    try {
      const response = await fetch(
        `https://api.cloudflare.com/client/v4/accounts/${this.accountId}/d1/database/${this.databaseId}/query`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Auth-Email': this.email,
            'X-Auth-Key': this.apiToken,
          },
          body: JSON.stringify({ sql, params }),
        }
      );

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('D1 query error:', error);
      return { success: false, error: 'Query failed' };
    }
  }

  // Helper methods for common operations
  async createTables() {
    const schema = `
      CREATE TABLE IF NOT EXISTS debates (
        id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
        user_id TEXT NOT NULL,
        character TEXT NOT NULL,
        topic TEXT NOT NULL,
        messages TEXT NOT NULL,
        user_score INTEGER DEFAULT 0,
        ai_score INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS leaderboard (
        user_id TEXT PRIMARY KEY,
        username TEXT NOT NULL,
        total_score INTEGER DEFAULT 0,
        debates_won INTEGER DEFAULT 0,
        debates_total INTEGER DEFAULT 0,
        favorite_character TEXT,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_debates_user ON debates(user_id);
      CREATE INDEX IF NOT EXISTS idx_leaderboard_score ON leaderboard(total_score DESC);
    `;

    const queries = schema.split(';').filter(q => q.trim());
    for (const query of queries) {
      if (query.trim()) {
        await this.query(query.trim());
      }
    }
  }

  async saveDebate(data: {
    userId: string;
    character: string;
    topic: string;
    messages: any[];
    userScore?: number;
    aiScore?: number;
  }) {
    return this.query(
      `INSERT INTO debates (user_id, character, topic, messages, user_score, ai_score) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        data.userId,
        data.character,
        data.topic,
        JSON.stringify(data.messages),
        data.userScore || 0,
        data.aiScore || 0
      ]
    );
  }

  async getRecentDebates(userId: string, limit = 10) {
    return this.query(
      `SELECT * FROM debates WHERE user_id = ? ORDER BY created_at DESC LIMIT ?`,
      [userId, limit]
    );
  }

  async updateLeaderboard(userId: string, username: string, wonDebate: boolean) {
    // Check if user exists
    const existing = await this.query(
      `SELECT * FROM leaderboard WHERE user_id = ?`,
      [userId]
    );

    if (existing.result && existing.result.length > 0) {
      // Update existing
      return this.query(
        `UPDATE leaderboard 
         SET total_score = total_score + ?, 
             debates_won = debates_won + ?,
             debates_total = debates_total + 1,
             updated_at = CURRENT_TIMESTAMP
         WHERE user_id = ?`,
        [wonDebate ? 10 : 1, wonDebate ? 1 : 0, userId]
      );
    } else {
      // Insert new
      return this.query(
        `INSERT INTO leaderboard (user_id, username, total_score, debates_won, debates_total) 
         VALUES (?, ?, ?, ?, 1)`,
        [userId, username, wonDebate ? 10 : 1, wonDebate ? 1 : 0]
      );
    }
  }

  async getLeaderboard(limit = 10) {
    return this.query(
      `SELECT * FROM leaderboard ORDER BY total_score DESC LIMIT ?`,
      [limit]
    );
  }
}

// Export singleton instance
export const d1 = new D1Client();