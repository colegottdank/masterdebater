import { NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import { d1 } from '@/lib/d1';
import { Character } from '@/lib/claude';

export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
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