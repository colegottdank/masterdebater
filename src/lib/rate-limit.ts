/**
 * IP-based rate limiting using Cloudflare KV
 * Prevents bots from creating multiple accounts to bypass limits
 */

import { NextRequest } from 'next/server';

// Rate limit configuration
const RATE_LIMITS = {
  // Debate creation limits
  createDebate: {
    free: { limit: 10, window: 86400 }, // 10 debates per day per IP for free users
    premium: { limit: 100, window: 86400 }, // 100 debates per day for premium (generous)
  },
  // Message sending limits  
  sendMessage: {
    free: { limit: 30, window: 3600 }, // 30 messages per hour per IP for free users
    premium: { limit: 500, window: 3600 }, // 500 messages per hour for premium
  },
};

// Cloudflare KV configuration
const KV_NAMESPACE_ID = process.env.CLOUDFLARE_KV_NAMESPACE_ID || '7f763151fd2647798a7cacb8521de5f5';
const CLOUDFLARE_ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID;
const CLOUDFLARE_API_TOKEN = process.env.CLOUDFLARE_API_TOKEN;

/**
 * Get client IP address from request headers
 */
export function getClientIp(request: NextRequest): string {
  // Check various headers in order of preference
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    // Take the first IP if there are multiple
    return forwardedFor.split(',')[0].trim();
  }
  
  // Cloudflare specific header
  const cfConnectingIp = request.headers.get('cf-connecting-ip');
  if (cfConnectingIp) {
    return cfConnectingIp;
  }
  
  // Standard headers
  const realIp = request.headers.get('x-real-ip');
  if (realIp) {
    return realIp;
  }
  
  // Fallback to a default (shouldn't happen in production)
  return 'unknown';
}

/**
 * Check if an IP has exceeded rate limits
 */
export async function checkRateLimit(
  ip: string,
  action: 'createDebate' | 'sendMessage',
  isPremium: boolean = false
): Promise<{ allowed: boolean; remaining: number; resetAt: number }> {
  // Skip rate limiting if KV is not configured
  if (!CLOUDFLARE_ACCOUNT_ID || !CLOUDFLARE_API_TOKEN) {
    console.warn('Cloudflare KV not configured, skipping rate limiting');
    return { allowed: true, remaining: 999, resetAt: 0 };
  }

  const limits = RATE_LIMITS[action][isPremium ? 'premium' : 'free'];
  const key = `ratelimit:${action}:${ip}`;
  
  try {
    // Get current count from KV
    const response = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/storage/kv/namespaces/${KV_NAMESPACE_ID}/values/${key}`,
      {
        headers: {
          'Authorization': `Bearer ${CLOUDFLARE_API_TOKEN}`,
        },
      }
    );
    
    let data = { count: 0, resetAt: 0 };
    if (response.ok) {
      const text = await response.text();
      if (text) {
        try {
          data = JSON.parse(text);
        } catch {
          // Invalid data, reset
          data = { count: 0, resetAt: 0 };
        }
      }
    }
    
    const now = Date.now();
    
    // Check if window has expired
    if (data.resetAt && data.resetAt < now) {
      data = { count: 0, resetAt: 0 };
    }
    
    // Set reset time if not set
    if (!data.resetAt) {
      data.resetAt = now + (limits.window * 1000);
    }
    
    // Check if limit exceeded
    if (data.count >= limits.limit) {
      return {
        allowed: false,
        remaining: 0,
        resetAt: data.resetAt,
      };
    }
    
    // Increment counter
    data.count++;
    
    // Save back to KV with TTL
    await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/storage/kv/namespaces/${KV_NAMESPACE_ID}/values/${key}`,
      {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${CLOUDFLARE_API_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          value: JSON.stringify(data),
          expiration_ttl: limits.window,
        }),
      }
    );
    
    return {
      allowed: true,
      remaining: limits.limit - data.count,
      resetAt: data.resetAt,
    };
  } catch (error) {
    console.error('Rate limit check failed:', error);
    // Fail open (allow request) if rate limiting fails
    // But log for monitoring
    return { allowed: true, remaining: 999, resetAt: 0 };
  }
}

/**
 * Block an IP address for suspicious activity
 */
export async function blockIp(ip: string, reason: string, duration: number = 86400) {
  if (!CLOUDFLARE_ACCOUNT_ID || !CLOUDFLARE_API_TOKEN) {
    console.warn('Cannot block IP - Cloudflare KV not configured');
    return;
  }

  const key = `blocked:${ip}`;
  const data = {
    reason,
    blockedAt: Date.now(),
    expiresAt: Date.now() + (duration * 1000),
  };
  
  try {
    await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/storage/kv/namespaces/${KV_NAMESPACE_ID}/values/${key}`,
      {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${CLOUDFLARE_API_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          value: JSON.stringify(data),
          expiration_ttl: duration,
        }),
      }
    );
    
    console.log(`Blocked IP ${ip} for ${reason}`);
  } catch (error) {
    console.error('Failed to block IP:', error);
  }
}

/**
 * Check if an IP is blocked
 */
export async function isIpBlocked(ip: string): Promise<boolean> {
  if (!CLOUDFLARE_ACCOUNT_ID || !CLOUDFLARE_API_TOKEN) {
    return false;
  }

  const key = `blocked:${ip}`;
  
  try {
    const response = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/storage/kv/namespaces/${KV_NAMESPACE_ID}/values/${key}`,
      {
        headers: {
          'Authorization': `Bearer ${CLOUDFLARE_API_TOKEN}`,
        },
      }
    );
    
    if (response.ok) {
      const text = await response.text();
      if (text) {
        const data = JSON.parse(text);
        return data.expiresAt > Date.now();
      }
    }
    
    return false;
  } catch (error) {
    console.error('Failed to check IP block status:', error);
    return false;
  }
}