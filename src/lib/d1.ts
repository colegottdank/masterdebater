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
    scoreData?: Record<string, unknown>;
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

  // User subscription functions
  async getUser(clerkUserId: string) {
    try {
      console.log('Getting user from D1 for clerkUserId:', clerkUserId);
      const result = await this.query(
        `SELECT * FROM users WHERE clerk_user_id = ? LIMIT 1`,
        [clerkUserId]
      );

      console.log('D1 getUser raw result:', JSON.stringify(result));

      if (!result.success || !result.result || result.result.length === 0) {
        console.log('No user found in database for:', clerkUserId);
        return null;
      }

      const user = result.result[0];
      console.log('Found user in database:', user);
      return user;
    } catch (error) {
      console.error('D1 get user error:', error);
      return null;
    }
  }
  
  async hasActiveSubscription(clerkUserId: string): Promise<boolean> {
    const user = await this.getUser(clerkUserId);
    return user?.subscription_status === 'active' && user?.stripe_plan === 'premium';
  }

  async upsertUser(userData: {
    clerkUserId: string;
    stripeCustomerId?: string;
    stripeSubscriptionId?: string;
    stripePlan?: string;
    subscriptionStatus?: string;
    currentPeriodEnd?: string;
    cancelAtPeriodEnd?: boolean;
  }) {
    try {
      // Use INSERT OR REPLACE to handle both cases atomically
      const result = await this.query(
        `INSERT INTO users (
          clerk_user_id, 
          stripe_customer_id, 
          stripe_subscription_id, 
          stripe_plan, 
          subscription_status, 
          current_period_end,
          cancel_at_period_end,
          created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        ON CONFLICT(clerk_user_id) DO UPDATE SET
          stripe_customer_id = CASE WHEN excluded.stripe_customer_id IS NOT NULL THEN excluded.stripe_customer_id ELSE stripe_customer_id END,
          stripe_subscription_id = CASE WHEN excluded.stripe_subscription_id IS NOT NULL THEN excluded.stripe_subscription_id ELSE stripe_subscription_id END,
          stripe_plan = CASE WHEN excluded.stripe_plan IS NOT NULL THEN excluded.stripe_plan ELSE stripe_plan END,
          subscription_status = CASE WHEN excluded.subscription_status IS NOT NULL THEN excluded.subscription_status ELSE subscription_status END,
          current_period_end = CASE WHEN excluded.current_period_end IS NOT NULL THEN excluded.current_period_end ELSE current_period_end END,
          cancel_at_period_end = excluded.cancel_at_period_end,
          updated_at = CURRENT_TIMESTAMP`,
        [
          userData.clerkUserId,
          userData.stripeCustomerId || null,
          userData.stripeSubscriptionId || null,
          userData.stripePlan || null,
          userData.subscriptionStatus || null,
          userData.currentPeriodEnd || null,
          userData.cancelAtPeriodEnd ? 1 : 0
        ]
      );
      
      return { success: result.success, operation: 'upsert' };
    } catch (error) {
      console.error('D1 upsert user error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  // Rate limiting functions
  async checkUserDebateLimit(userId: string) {
    // First check if user is premium
    const user = await this.getUser(userId);
    if (user && user.subscription_status === 'active' && user.stripe_plan === 'premium') {
      return {
        success: true,
        count: 0,
        limit: -1, // Unlimited
        allowed: true,
        remaining: -1,
        isPremium: true
      };
    }

    const result = await this.query(
      `SELECT COUNT(*) as debate_count FROM debates WHERE user_id = ?`,
      [userId]
    );
    
    if (result.success && result.result && result.result.length > 0) {
      const count = (result.result[0] as Record<string, unknown>).debate_count as number;
      const limit = 3; // Free tier limit
      return {
        success: true,
        count,
        limit,
        allowed: count < limit,
        remaining: Math.max(0, limit - count),
        isPremium: false
      };
    }
    
    return { success: false, count: 0, limit: 3, allowed: true, remaining: 3, isPremium: false };
  }

  async checkDebateMessageLimit(debateId: string) {
    const result = await this.getDebate(debateId);
    
    if (result.success && result.debate) {
      // Check if user is premium
      const user = await this.getUser(result.debate.user_id as string);
      if (user && user.subscription_status === 'active' && user.stripe_plan === 'premium') {
        return {
          success: true,
          count: 0,
          limit: -1, // Unlimited
          allowed: true,
          remaining: -1,
          isPremium: true
        };
      }

      const messages = result.debate.messages as Array<{ role: string; content: string }> || [];
      // Count only user messages (not system or AI messages)
      const userMessageCount = messages.filter(m => m.role === 'user').length;
      const limit = 3; // Free tier limit per debate
      
      return {
        success: true,
        count: userMessageCount,
        limit,
        allowed: userMessageCount < limit,
        remaining: Math.max(0, limit - userMessageCount),
        isPremium: false
      };
    }
    
    return { success: false, count: 0, limit: 3, allowed: true, remaining: 3, isPremium: false };
  }
}

// Export singleton instance
export const d1 = new D1Client();