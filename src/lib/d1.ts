// Cloudflare D1 REST API client for Next.js/Vercel
interface D1Response {
  success: boolean;
  result?: Record<string, unknown>[];
  error?: string;
  messages?: string[];
  meta?: Record<string, unknown>;
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

  async query(sql: string, params?: unknown[]): Promise<D1Response> {
    if (!this.databaseId || this.databaseId === 'your_d1_database_id') {
      console.log('D1 not configured, skipping query:', sql);
      return { success: false, error: 'Database not configured' };
    }

    try {
      console.log('D1 Query:', sql.substring(0, 50) + '...', params?.slice(0, 3));
      
      const response = await fetch(
        `https://api.cloudflare.com/client/v4/accounts/${this.accountId}/d1/database/${this.databaseId}/query`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.apiToken}`,
          },
          body: JSON.stringify({ sql, params }),
        }
      );

      const data = await response.json();
      
      // Debug logging to understand D1 response structure
      console.log('Full D1 API response:', JSON.stringify(data, null, 2));
      
      if (!data.success) {
        console.error('D1 query failed:', data.errors || data.error);
        return { success: false, error: data.errors || data.error };
      }
      
      // D1 API returns results in data.result[0].results
      if (data.result && data.result[0]) {
        console.log('D1 results found:', data.result[0].results?.length || 0, 'rows');
        return {
          success: true,
          result: data.result[0].results || [],
          meta: data.result[0].meta
        };
      }
      
      console.log('No D1 results in expected structure');
      return { success: false, result: [] };
    } catch (error) {
      console.error('D1 query error:', error);
      return { success: false, error: 'Query failed' };
    }
  }

  // Helper methods for common operations
  async createTables() {
    const schema = `
      CREATE TABLE IF NOT EXISTS debates (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        character TEXT NOT NULL,
        topic TEXT NOT NULL,
        messages TEXT NOT NULL,
        user_score INTEGER DEFAULT 0,
        ai_score INTEGER DEFAULT 0,
        score_data TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS leaderboard (
        user_id TEXT PRIMARY KEY,
        username TEXT NOT NULL,
        display_name TEXT,
        avatar_url TEXT,
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
    messages: Array<{ role: string; content: string }>;
    userScore?: number;
    aiScore?: number;
    scoreData?: any;
    debateId?: string;
  }) {
    // Use provided ID or generate a new one
    const debateId = data.debateId || crypto.randomUUID();
    
    console.log('Saving debate to D1:', {
      debateId,
      userId: data.userId,
      character: data.character,
      topic: data.topic,
      messageCount: data.messages.length,
      hasScore: !!data.scoreData
    });
    
    const result = await this.query(
      `INSERT OR REPLACE INTO debates (id, user_id, character, topic, messages, user_score, ai_score, score_data) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        debateId,
        data.userId,
        data.character,
        data.topic,
        JSON.stringify(data.messages),
        data.userScore || 0,
        data.aiScore || 0,
        data.scoreData ? JSON.stringify(data.scoreData) : null
      ]
    );
    
    console.log('D1 save result:', result);
    
    // Return the debate ID along with the result
    return { ...result, debateId };
  }
  
  async getDebate(debateId: string) {
    console.log('Fetching debate from D1:', debateId);
    
    const result = await this.query(
      `SELECT * FROM debates WHERE id = ?`,
      [debateId]
    );
    
    console.log('D1 fetch result:', JSON.stringify(result, null, 2));
    
    if (result.success && result.result && result.result.length > 0) {
      const debate = result.result[0] as Record<string, unknown>;
      // Parse the JSON messages field
      if (debate.messages && typeof debate.messages === 'string') {
        debate.messages = JSON.parse(debate.messages);
      }
      // Parse the JSON score_data field if it exists
      if (debate.score_data && typeof debate.score_data === 'string') {
        debate.score_data = JSON.parse(debate.score_data);
      }
      console.log('Debate found:', {
        id: debate.id,
        userId: debate.user_id,
        messageCount: Array.isArray(debate.messages) ? debate.messages.length : 0,
        hasScore: !!debate.score_data
      });
      return { success: true, debate };
    }
    
    console.log('Debate not found in D1:', debateId);
    return { success: false, error: 'Debate not found' };
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