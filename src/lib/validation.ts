/**
 * Input validation and sanitization utilities
 * Prevents XSS, SQL injection, and other malicious inputs
 */

/**
 * Sanitize user input to prevent XSS attacks
 */
export function sanitizeInput(input: string): string {
  if (!input) return '';
  
  // Remove any HTML tags
  let sanitized = input.replace(/<[^>]*>/g, '');
  
  // Escape special HTML characters
  sanitized = sanitized
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
  
  // Trim whitespace
  sanitized = sanitized.trim();
  
  return sanitized;
}

/**
 * Validate and sanitize debate topic
 */
export function validateTopic(topic: string): { valid: boolean; sanitized: string; error?: string } {
  if (!topic || typeof topic !== 'string') {
    return { valid: false, sanitized: '', error: 'Topic is required' };
  }
  
  const sanitized = sanitizeInput(topic);
  
  if (sanitized.length < 3) {
    return { valid: false, sanitized, error: 'Topic must be at least 3 characters' };
  }
  
  if (sanitized.length > 200) {
    return { valid: false, sanitized, error: 'Topic must be less than 200 characters' };
  }
  
  // Check for spam patterns
  const spamPatterns = [
    /(.)\1{10,}/,  // Same character repeated 10+ times
    /https?:\/\//i, // URLs (we don't want links in topics)
    /\b(viagra|cialis|casino|crypto|bitcoin)\b/i, // Common spam words
  ];
  
  for (const pattern of spamPatterns) {
    if (pattern.test(sanitized)) {
      return { valid: false, sanitized, error: 'Invalid topic content' };
    }
  }
  
  return { valid: true, sanitized };
}

/**
 * Validate and sanitize user argument
 */
export function validateArgument(argument: string): { valid: boolean; sanitized: string; error?: string } {
  if (!argument || typeof argument !== 'string') {
    return { valid: false, sanitized: '', error: 'Argument is required' };
  }
  
  const sanitized = sanitizeInput(argument);
  
  if (sanitized.length < 2) {
    return { valid: false, sanitized, error: 'Argument must be at least 2 characters' };
  }
  
  if (sanitized.length > 1000) {
    return { valid: false, sanitized, error: 'Argument must be less than 1000 characters' };
  }
  
  // Check for repeated characters (spam)
  if (/(.)\1{20,}/.test(sanitized)) {
    return { valid: false, sanitized, error: 'Invalid argument content' };
  }
  
  return { valid: true, sanitized };
}

/**
 * Validate character selection
 */
export function validateCharacter(character: string): boolean {
  const validCharacters = ['cartman', 'kyle', 'stan', 'butters', 'clyde'];
  return validCharacters.includes(character?.toLowerCase());
}

/**
 * Validate display name for profile
 */
export function validateDisplayName(name: string): { valid: boolean; sanitized: string; error?: string } {
  if (!name || typeof name !== 'string') {
    return { valid: false, sanitized: '', error: 'Display name is required' };
  }
  
  const sanitized = sanitizeInput(name);
  
  if (sanitized.length < 1) {
    return { valid: false, sanitized, error: 'Display name is required' };
  }
  
  if (sanitized.length > 50) {
    return { valid: false, sanitized, error: 'Display name must be less than 50 characters' };
  }
  
  // Only allow alphanumeric, spaces, and some special characters
  if (!/^[a-zA-Z0-9\s\-._]+$/.test(sanitized)) {
    return { valid: false, sanitized, error: 'Display name contains invalid characters' };
  }
  
  return { valid: true, sanitized };
}

/**
 * Validate debate ID format
 */
export function validateDebateId(id: string): boolean {
  if (!id || typeof id !== 'string') return false;
  
  // UUID format validation
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id);
}

/**
 * Rate limit key sanitization (for KV storage)
 */
export function sanitizeRateLimitKey(key: string): string {
  if (!key) return 'unknown';
  
  // Only allow alphanumeric, dots, colons, and hyphens
  return key.replace(/[^a-zA-Z0-9.:_-]/g, '');
}