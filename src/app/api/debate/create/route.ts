import { NextResponse, NextRequest } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import { d1 } from '@/lib/d1';
import { Character } from '@/lib/claude';
import { getClientIp, checkRateLimit, isIpBlocked } from '@/lib/rate-limit';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if IP is blocked
    const clientIp = getClientIp(request);
    if (await isIpBlocked(clientIp)) {
      return NextResponse.json({ 
        error: 'blocked',
        message: 'Your IP has been temporarily blocked due to suspicious activity'
      }, { status: 403 });
    }

    // Check IP-based rate limit
    const user = await d1.getUser(userId);
    const isPremium = user?.subscription_status === 'active';
    const ipRateLimit = await checkRateLimit(clientIp, 'createDebate', isPremium);
    
    if (!ipRateLimit.allowed) {
      const resetTime = new Date(ipRateLimit.resetAt).toLocaleTimeString();
      return NextResponse.json({ 
        error: 'ip_rate_limit_exceeded',
        message: `Too many debates from your IP address. Try again after ${resetTime}`,
        resetAt: ipRateLimit.resetAt
      }, { status: 429 });
    }

    // Check user-based rate limit (now checks database for premium status)
    const debateLimit = await d1.checkUserDebateLimit(userId);
    if (!debateLimit.allowed) {
      return NextResponse.json({ 
        error: 'debate_limit_exceeded',
        message: `You've reached your limit of ${debateLimit.limit} debates. Upgrade to premium for unlimited debates!`,
        current: debateLimit.count,
        limit: debateLimit.limit,
        upgrade_required: true
      }, { status: 429 });
    }

    const { character, topic, debateId } = await request.json();

    if (!character || !topic || !debateId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Get user info for the debate
    const user = await currentUser();
    const username = user?.firstName || user?.username || 'Anonymous';

    // Create initial debate with welcome message
    const initialMessages = [{
      role: 'system',
      content: `Welcome to the debate arena! Today's topic: "${topic}". ${(character as string).toUpperCase()} will argue against you. Let the master debating begin!`
    }];
    
    // Save the debate to the database
    const saveResult = await d1.saveDebate({
      userId,
      character: character as Character,
      topic,
      messages: initialMessages,
      debateId
    });
    
    if (!saveResult.success) {
      throw new Error(saveResult.error || 'Failed to create debate');
    }
    
    return NextResponse.json({ 
      success: true, 
      debateId: saveResult.debateId || debateId 
    });
  } catch (error) {
    console.error('Create debate error:', error);
    return NextResponse.json(
      { error: 'Failed to create debate' },
      { status: 500 }
    );
  }
}