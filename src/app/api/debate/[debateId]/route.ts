import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { d1 } from '@/lib/d1';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ debateId: string }> }
) {
  try {
    const { debateId } = await params;
    const { userId } = await auth();
    
    if (!debateId) {
      return NextResponse.json({ error: 'Debate ID required' }, { status: 400 });
    }

    console.log('Fetching debate:', debateId, 'for user:', userId);
    const result = await d1.getDebate(debateId);
    
    if (result.success && result.debate) {
      // Check if current user owns this debate
      const isOwner = userId && result.debate.user_id === userId;
      
      const messages = result.debate.messages as unknown[] | undefined;
      console.log('Debate found:', {
        id: debateId,
        owner: result.debate.user_id,
        currentUser: userId,
        isOwner,
        messageCount: messages?.length || 0
      });
      
      return NextResponse.json({ 
        debate: result.debate,
        isOwner 
      });
    } else {
      console.log('Debate not found:', debateId);
      return NextResponse.json({ error: 'Debate not found' }, { status: 404 });
    }
  } catch (error) {
    console.error('Get debate error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve debate' },
      { status: 500 }
    );
  }
}