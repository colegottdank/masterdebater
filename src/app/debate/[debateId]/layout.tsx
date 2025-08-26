import type { Metadata } from 'next';
import { d1 } from '@/lib/d1';
import { characters } from '@/lib/characters';

// Generate dynamic metadata for social sharing
export async function generateMetadata({ params }: { params: Promise<{ debateId: string }> }): Promise<Metadata> {
  try {
    const { debateId } = await params;
    const result = await d1.getDebate(debateId);
    
    if (result.success && result.debate?.score_data) {
      const score = result.debate.score_data as any;
      const character = characters.find(c => c.id === result.debate?.character);
      const characterName = character?.name || result.debate?.character;
      
      const title = score.roastLevel === 'dominated' 
        ? `I just BEAT ${characterName} in a debate!`
        : `I got ${score.verdict} by ${characterName}!`;
      
      const description = `Topic: "${result.debate.topic}". Score: ${score.userScore} vs ${score.aiScore}. Can you do better?`;
      
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://masterdebater.ai';
      
      return {
        title: `${title} | MasterDebater.ai`,
        description,
        openGraph: {
          title,
          description,
          images: [`${baseUrl}/api/og?debateId=${debateId}`],
          type: 'website',
          url: `${baseUrl}/debate/${debateId}`,
        },
        twitter: {
          card: 'summary_large_image',
          title,
          description,
          images: [`${baseUrl}/api/og?debateId=${debateId}`],
        },
      };
    }
  } catch (error) {
    console.error('Error generating metadata:', error);
  }
  
  // Fallback metadata
  return {
    title: 'MasterDebater.ai - The Ultimate Debate Arena',
    description: "Challenge AI master debaters inspired by South Park's greatest minds. Can you out-debate Cartman?",
  };
}

export default function DebateLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}