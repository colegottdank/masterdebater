import { NextResponse } from 'next/server';
import { generateDebateResponseStream, Character } from '@/lib/claude';
import { auth, currentUser } from '@clerk/nextjs/server';
import { d1 } from '@/lib/d1';

export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { character, topic, userArgument, previousMessages, stream, debateId } = await request.json();

    if (!character || !topic || !userArgument) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // If streaming is requested
    if (stream) {
      const anthropicStream = await generateDebateResponseStream(
        character as Character,
        topic,
        userArgument,
        previousMessages || []
      );

      const encoder = new TextEncoder();
      let fullResponse = '';

      const readable = new ReadableStream({
        async start(controller) {
          try {
            for await (const chunk of anthropicStream) {
              if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
                const text = chunk.delta.text;
                fullResponse += text;
                
                const data = JSON.stringify({ content: text, type: 'chunk' });
                controller.enqueue(encoder.encode(`data: ${data}\n\n`));
              }
            }
            
            // Send final message with debate ID if new debate
            let savedDebateId = debateId;
            
            // Save or update debate
            const allMessages = [...(previousMessages || []), 
              { role: 'user', content: userArgument }, 
              { role: 'ai', content: fullResponse }
            ];
            
            if (!debateId) {
              // This is a new debate, save it and get the ID
              const user = await currentUser();
              const username = user?.firstName || user?.username || 'Anonymous';
              
              // Get the debate ID from the referrer URL if this is a new debate
              const referrer = request.headers.get('referer');
              let extractedDebateId: string | undefined;
              if (referrer) {
                const match = referrer.match(/\/debate\/([a-f0-9-]+)/);
                if (match) {
                  extractedDebateId = match[1];
                }
              }
              
              const saveResult = await d1.saveDebate({
                userId,
                character,
                topic,
                messages: allMessages,
                debateId: extractedDebateId  // Use the ID from the URL
              });
              
              if (saveResult.debateId) {
                savedDebateId = saveResult.debateId;
              }
              
              const userMessages = allMessages.filter((m: { role: string; content: string }) => m.role === 'user').length;
              await d1.updateLeaderboard(userId, username, userMessages >= 3);
            } else {
              // Update existing debate with new messages
              console.log('Updating existing debate:', debateId, 'with', allMessages.length, 'messages');
              const saveResult = await d1.saveDebate({
                userId,
                character,
                topic,
                messages: allMessages,
                debateId: debateId  // Update the existing debate
              });
              
              if (!saveResult.success) {
                console.error('Failed to update debate:', saveResult.error);
              }
            }
            
            const finalData = JSON.stringify({ 
              content: fullResponse, 
              type: 'complete',
              debateId: savedDebateId 
            });
            controller.enqueue(encoder.encode(`data: ${finalData}\n\n`));
            controller.close();
          } catch (error) {
            console.error('Streaming error:', error);
            const errorData = JSON.stringify({ error: 'Streaming failed', type: 'error' });
            controller.enqueue(encoder.encode(`data: ${errorData}\n\n`));
            controller.close();
          }
        }
      });

      return new Response(readable, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      });
    }

    // Fallback to non-streaming response
    const { generateDebateResponse } = await import('@/lib/claude');
    const response = await generateDebateResponse(
      character as Character,
      topic,
      userArgument,
      previousMessages || []
    );

    return NextResponse.json({ response });
  } catch (error) {
    console.error('Debate API error:', error);
    return NextResponse.json(
      { error: 'Failed to generate response' },
      { status: 500 }
    );
  }
}