'use client';

import { useState, useEffect, useRef } from 'react';
import { useUser } from '@/lib/useTestUser';
import { useAvatar } from '@/lib/useAvatar';
import { SignedIn, UserButton, SignInButton } from '@clerk/nextjs';
import { Character } from '@/lib/claude';
import Link from 'next/link';
import { characters, getCharacterAvatar } from '@/lib/characters';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { RoastCard } from '@/components/RoastCard';
import { calculateAIDebateScore, getHumiliatingTitle, AIDebateScore } from '@/lib/ai-scoring';

export default function DebatePage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const debateId = params.debateId as string;
  const { user } = useUser();
  const { avatarUrl: userAvatar, displayName: userDisplayName } = useAvatar();
  
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null);
  const [selectedTopic, setSelectedTopic] = useState<string>('');
  const [debateMessages, setDebateMessages] = useState<Array<{ role: string; content: string }>>([]);
  const [userInput, setUserInput] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingDebate, setIsLoadingDebate] = useState(true);
  const [showShareToast, setShowShareToast] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isOwner, setIsOwner] = useState(false); // Default to false until we verify
  const [isAuthenticated, setIsAuthenticated] = useState(false); // Track auth status
  const [debateEnded, setDebateEnded] = useState(false);
  const [debateScore, setDebateScore] = useState<AIDebateScore | null>(null);
  const [isScoringDebate, setIsScoringDebate] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [debateMessages]);

  // Load debate from database
  useEffect(() => {
    // Don't re-initialize if already done
    if (isInitialized) return;
    
    // Don't wait for authentication - load debate immediately for public sharing
    const initializeDebate = async () => {
      // First, always try to load from database
      try {
        console.log('Loading debate from database:', debateId);
        const response = await fetch(`/api/debate/${debateId}`);
        
        if (response.ok) {
          const data = await response.json();
          console.log('Debate data received:', data);
          
          if (data.debate) {
            // Debate exists in database, load it
            setSelectedCharacter(data.debate.character);
            setSelectedTopic(data.debate.topic);
            setDebateMessages(data.debate.messages || []);
            setIsOwner(data.isOwner || false);
            setIsAuthenticated(data.isAuthenticated || false);
            setIsInitialized(true);
            setIsLoadingDebate(false);
            
            // Log permission status
            if (!data.isAuthenticated) {
              console.log('Viewing debate as unauthenticated user (read-only)');
            } else if (!data.isOwner) {
              console.log('Viewing debate as authenticated non-owner (read-only)');
            } else {
              console.log('Viewing debate as owner (full access)');
            }
            return;
          }
        } else if (response.status === 404) {
          // Debate not found in database, redirect to debate setup
          console.log('Debate not found, redirecting to setup');
          router.push('/debate');
        } else {
          console.error('Failed to load debate, status:', response.status);
          router.push('/debate');
        }
      } catch (error) {
        console.error('Error loading debate:', error);
        
        // On error, try to use query params if available
        const isNew = searchParams.get('new') === 'true';
        const character = searchParams.get('character') as Character;
        const topic = searchParams.get('topic');
        
        if (isNew && character && topic) {
          console.log('Error loading debate, falling back to query params');
          setIsNewDebate(true);
          setSelectedCharacter(character);
          setSelectedTopic(topic);
          setDebateMessages([
            { 
              role: 'system', 
              content: `Welcome to the debate arena! Today's topic: "${topic}". ${character.toUpperCase()} will argue against you. Let the master debating begin!` 
            }
          ]);
          setIsInitialized(true);
        } else {
          router.push('/debate');
        }
      } finally {
        setIsLoadingDebate(false);
      }
    };

    if (debateId) {
      initializeDebate();
    }
  }, [debateId, router, searchParams, isInitialized]);

  const copyShareLink = () => {
    // Always use clean URL without query parameters for sharing
    const cleanUrl = `${window.location.origin}/debate/${debateId}`;
    navigator.clipboard.writeText(cleanUrl);
    setShowShareToast(true);
    setTimeout(() => setShowShareToast(false), 3000);
  };
  
  // Save user avatar to localStorage for roast card
  useEffect(() => {
    if (userAvatar) {
      localStorage.setItem('userAvatar', userAvatar);
    }
  }, [userAvatar]);

  const endDebate = async () => {
    if (debateMessages.length > 0 && selectedCharacter) {
      setIsScoringDebate(true);
      try {
        // Get character name for scoring
        const characterName = characters.find(c => c.id === selectedCharacter)?.name || 'AI';
        
        // Calculate AI-based score
        const score = await calculateAIDebateScore(debateMessages, characterName);
        setDebateScore(score);
        setDebateEnded(true);
      } catch (error) {
        console.error('Failed to calculate debate score:', error);
        // Could still show an error message or use fallback scoring
      } finally {
        setIsScoringDebate(false);
      }
    }
  };

  const sendMessage = async () => {
    if (!userInput.trim() || isLoading) return;

    const newUserMessage = { role: 'user', content: userInput };
    const currentInput = userInput;
    setDebateMessages(prev => [...prev, newUserMessage]);
    setUserInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/debate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          debateId: debateId,  // Always pass the debateId since debate is created upfront
          character: selectedCharacter,
          topic: selectedTopic,
          userArgument: currentInput,
          previousMessages: debateMessages,
          stream: true
        })
      });

      if (!response.body) {
        throw new Error('No response body');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      
      // Add placeholder AI message for streaming
      const aiMessageIndex = debateMessages.length + 1;
      setDebateMessages(prev => [...prev, { role: 'ai', content: '' }]);

      let accumulatedContent = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.substring(6));
              
              if (data.type === 'chunk') {
                accumulatedContent += data.content;
                setDebateMessages(prev => {
                  const newMessages = [...prev];
                  newMessages[aiMessageIndex] = { role: 'ai', content: accumulatedContent };
                  return newMessages;
                });
              } else if (data.type === 'complete') {
                setDebateMessages(prev => {
                  const newMessages = [...prev];
                  newMessages[aiMessageIndex] = { role: 'ai', content: data.content };
                  return newMessages;
                });
                
                // Debate is already saved, no need to do anything special
              } else if (data.type === 'error') {
                throw new Error(data.error || 'Streaming error');
              }
            } catch {
              // Skip invalid JSON lines
            }
          }
        }
      }
    } catch (error) {
      console.error('Error:', error);
      setDebateMessages(prev => [...prev, { role: 'ai', content: 'Error: Could not generate response. Try again!' }]);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoadingDebate) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-900 to-red-900">
        <div className="text-center">
          <div className="text-4xl font-black text-yellow-400 animate-pulse mb-4">
            Loading Debate...
          </div>
          <div className="text-white">Preparing the arena for battle!</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative chaos-scatter bedroom-mess cartman-room-bg">
      {/* Roast Card Modal */}
      {debateEnded && debateScore && selectedCharacter && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="my-8">
            <RoastCard
              score={debateScore}
              characterId={selectedCharacter}
              userName={userDisplayName}
              topic={selectedTopic}
              debateId={debateId}
              onShare={() => {
                setShowShareToast(true);
                setTimeout(() => setShowShareToast(false), 3000);
              }}
            />
            
            {/* Close button */}
            <div className="text-center mt-6">
              <button
                onClick={() => setDebateEnded(false)}
                className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 px-8 rounded-xl transition-all border-2 border-black transform hover:rotate-2 cursor-pointer"
              >
                ← BACK TO DEBATE
              </button>
              
              <Link href="/debate" className="inline-block ml-4">
                <button className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold py-3 px-8 rounded-xl transition-all border-2 border-black transform hover:-rotate-2 cursor-pointer">
                  🆕 NEW DEBATE
                </button>
              </Link>
            </div>
          </div>
        </div>
      )}
      
      {/* Live Debate Banner */}
      <div className="messy-banner p-2 text-center relative">
        <span className="font-black text-white text-sm tracking-wider">
          🔴 LIVE DEBATE IN PROGRESS 🔴 CARTMAN&apos;S MASTER DEBATE STUDIO 🔴 DEBATE ID: {debateId.slice(0, 8)} 🔴
        </span>
      </div>

      {/* User Avatar in Top Right */}
      <nav className="absolute top-12 sm:top-16 right-2 sm:right-6 z-20">
        <SignedIn>
          <UserButton afterSignOutUrl="/" />
        </SignedIn>
      </nav>

      {/* Share Toast */}
      {showShareToast && (
        <div className="fixed top-20 left-1/2 transform -translate-x-1/2 bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-bounce">
          <span className="font-bold">Link copied to clipboard! 📋</span>
        </div>
      )}
      
      {/* Read-Only Notification */}
      {!isOwner && (
        <div className="fixed top-20 left-1/2 transform -translate-x-1/2 bg-purple-600 text-white px-6 py-3 rounded-lg shadow-lg z-50">
          <span className="font-bold">👀 You&apos;re viewing someone else&apos;s debate (Read-Only)</span>
        </div>
      )}

      {/* Scattered Studio Items - Hidden on mobile */}
      <div className="absolute top-20 left-8 text-3xl opacity-10 transform rotate-12 z-0 hidden sm:block">🎙️</div>
      <div className="absolute top-32 right-12 text-2xl opacity-15 transform -rotate-15 z-0 hidden sm:block">📻</div>
      <div className="absolute top-1/3 left-16 text-xl opacity-20 transform rotate-45 z-0 hidden lg:block">🎧</div>

      <div className="p-2 sm:p-4 lg:p-8 relative z-10">
        <div className="max-w-6xl mx-auto">
          {/* Studio Header with Share Button */}
          <div className="relative bg-gradient-to-br from-amber-900/60 to-red-900/60 p-3 sm:p-4 lg:p-6 rounded-2xl sm:rounded-3xl border-2 sm:border-4 border-yellow-400 debate-glow mb-4 sm:mb-6 sm:transform sm:-rotate-1">
            <div className="absolute top-4 left-8">
              <div className="podcast-mic text-4xl">🎙️</div>
            </div>
            
            <div className="absolute top-4 right-8 bg-green-600 text-white px-3 py-1 rounded transform rotate-2 border-2 border-black text-sm font-bold animate-pulse">
              🔴 LIVE ON KFC RADIO
            </div>
            
            <div className="ml-0 sm:ml-32 mr-0 sm:mr-20 relative z-10">
              <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                <div>
                  <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-yellow-300 mb-2 sm:transform sm:rotate-1">
                    🔥 LIVE MASTER DEBATE 🔥
                  </h1>
                  <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-white mb-1 flex items-center gap-2 sm:gap-3">
                    <div className="flex items-center gap-2">
                      <img 
                        src={userAvatar} 
                        alt={userDisplayName}
                        className="w-10 h-10 rounded-full border-2 border-yellow-400 object-cover"
                      />
                      <span>{userDisplayName}</span>
                    </div>
                    
                    {/* VS Indicator */}
                    <div className="relative">
                      <div className="absolute -top-2 -left-2 text-xl animate-pulse">⚡</div>
                      <div className="bg-gradient-to-r from-red-600 to-yellow-500 px-3 py-1 rounded-lg border-2 border-black transform rotate-2">
                        <span className="font-black text-xl text-white shadow-lg">VS</span>
                      </div>
                      <div className="absolute -bottom-2 -right-2 text-xl animate-pulse" style={{ animationDelay: '0.5s' }}>⚡</div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <span>{characters.find(c => c.id === selectedCharacter)?.name}</span>
                      {selectedCharacter && getCharacterAvatar(characters.find(c => c.id === selectedCharacter)!, 'sm')}
                    </div>
                  </h2>
                  <p className="text-gray-200 text-sm sm:text-base lg:text-lg">Topic: &quot;{selectedTopic}&quot;</p>
                </div>
                <div className="flex flex-wrap gap-2 sm:gap-4">
                  <button
                    onClick={copyShareLink}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-3 sm:py-3 sm:px-6 rounded-lg sm:rounded-xl transition-all transform hover:rotate-2 border-2 sm:border-3 border-black shadow-lg hover:scale-105 text-sm sm:text-base cursor-pointer"
                  >
                    📤 SHARE DEBATE
                  </button>
                  <Link href="/debate" className="inline-block">
                    <button className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold py-2 px-3 sm:py-3 sm:px-6 rounded-lg sm:rounded-xl transition-all transform hover:rotate-2 border-2 sm:border-3 border-black shadow-lg hover:scale-105 text-sm sm:text-base cursor-pointer">
                      🆕 NEW DEBATE
                    </button>
                  </Link>
                  <button
                    onClick={() => router.push('/')}
                    className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-3 sm:py-3 sm:px-6 rounded-lg sm:rounded-xl transition-all transform hover:rotate-2 border-2 sm:border-3 border-black shadow-lg hover:scale-105 text-sm sm:text-base cursor-pointer"
                  >
                    🏃 ESCAPE STUDIO
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 sm:gap-6">
            {/* Chat Area */}
            <div className="lg:col-span-3">
              {/* Messages Studio */}
              <div className="relative bg-gradient-to-br from-black/70 to-gray-900/70 p-3 sm:p-6 rounded-2xl sm:rounded-3xl border-2 sm:border-4 border-yellow-400 debate-glow">
                <div className="h-[400px] sm:h-[500px] overflow-y-auto overflow-x-hidden sm:overflow-x-visible relative z-10 space-y-4 px-2 sm:px-8">
                  {debateMessages.map((msg, idx) => (
                    <div key={idx} className={`mb-4 ${msg.role === 'user' ? 'text-right' : 'text-left'}`}>
                      {msg.role === 'system' ? (
                        <div className="text-center">
                          <div className="comic-bubble inline-block p-4 text-black font-bold transform rotate-1">
                            {msg.content}
                          </div>
                        </div>
                      ) : (
                        <div className={`inline-block max-w-[80%] ${
                          msg.role === 'user' ? 'ml-auto' : 'mr-auto'
                        }`}>
                          <div className={`p-4 rounded-2xl border-4 border-black relative transform ${
                            msg.role === 'user' 
                              ? 'bg-blue-600 text-white rotate-1' 
                              : 'bg-red-600 text-white -rotate-1'
                          }`}>
                            {msg.role === 'ai' && (
                              <div className="absolute -top-6 -left-4 z-20">
                                {selectedCharacter && getCharacterAvatar(characters.find(c => c.id === selectedCharacter)!, 'md')}
                              </div>
                            )}
                            {msg.role === 'user' && (
                              <div className="absolute -top-6 -right-4 z-20">
                                <img 
                                  src={userAvatar} 
                                  alt={userDisplayName}
                                  className="w-12 h-12 rounded-full border-3 border-yellow-400 shadow-lg bg-white object-cover"
                                />
                              </div>
                            )}
                            
                            <div className="font-black mb-2 text-lg">
                              {msg.role === 'user' 
                                ? `${userDisplayName} 💪` 
                                : `${characters.find(c => c.id === selectedCharacter)?.name} 👑`
                              }
                            </div>
                            <div className="font-bold">{msg.content}</div>
                            
                            
                            {/* Speech bubble tail */}
                            <div className={`absolute bottom-0 ${
                              msg.role === 'user' ? 'right-6' : 'left-6'
                            } transform translate-y-full`}>
                              <div className="w-0 h-0 border-l-8 border-r-8 border-t-8 border-transparent border-t-black"></div>
                              <div className={`w-0 h-0 border-l-6 border-r-6 border-t-6 border-transparent absolute top-0 left-1/2 transform -translate-x-1/2 ${
                                msg.role === 'user' ? 'border-t-blue-600' : 'border-t-red-600'
                              }`}></div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                  {isLoading && (
                    <div className="text-center">
                      <div className="comic-bubble inline-block p-4 text-black font-bold animate-bounce">
                        {characters.find(c => c.id === selectedCharacter)?.name} is preparing the DESTRUCTION... 💭
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
              </div>

              {/* Input Studio */}
              <div className="mt-4 relative bg-gradient-to-br from-amber-900/40 to-red-900/40 p-2 sm:p-4 rounded-xl sm:rounded-2xl border-2 sm:border-4 border-yellow-400 sm:transform sm:rotate-1">
                {isOwner ? (
                  <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
                    <input
                      type="text"
                      value={userInput}
                      onChange={(e) => setUserInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                      placeholder="Type your argument (if you dare)..."
                      className="flex-1 p-3 sm:p-4 rounded-lg sm:rounded-xl bg-black/70 border-2 sm:border-4 border-black focus:border-yellow-400 focus:outline-none text-white font-bold sm:transform sm:hover:rotate-1 transition-all text-base sm:text-lg"
                      disabled={isLoading}
                    />
                    <button
                      onClick={sendMessage}
                      disabled={isLoading || !userInput.trim()}
                      className={`px-6 py-3 sm:px-8 sm:py-4 rounded-lg sm:rounded-xl font-black text-lg sm:text-xl transition-all border-2 sm:border-4 border-black sm:transform sm:hover:rotate-2 ${
                        isLoading || !userInput.trim()
                          ? 'bg-gray-700 text-gray-400 cursor-not-allowed opacity-50'
                          : 'cartman-gradient text-white hover:scale-105 shadow-xl'
                      }`}
                    >
                      🎯 FIRE!
                    </button>
                    
                    {/* End Debate button - only show after at least 3 exchanges */}
                    {debateMessages.length >= 6 && !debateEnded && (
                      <button
                        onClick={endDebate}
                        disabled={isScoringDebate}
                        className={`font-black px-4 py-3 sm:px-6 sm:py-4 rounded-lg sm:rounded-xl transition-all border-2 sm:border-4 border-black sm:transform sm:hover:-rotate-2 hover:scale-105 shadow-xl cursor-pointer ${
                          isScoringDebate 
                            ? 'bg-gray-600 text-gray-300 cursor-not-allowed' 
                            : 'bg-purple-600 hover:bg-purple-700 text-white'
                        }`}
                      >
                        {isScoringDebate ? '⏳ CALCULATING...' : '🏁 END DEBATE'}
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-4">
                    {!isAuthenticated ? (
                      <>
                        <p className="text-yellow-300 font-bold text-lg mb-3">
                          🔒 Sign in to start your own debate!
                        </p>
                        <div className="flex gap-4 justify-center">
                          <SignInButton mode="modal">
                            <button className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold py-2 px-6 rounded-xl transition-all transform hover:rotate-2 border-2 border-black shadow-lg cursor-pointer">
                              🔑 Sign In
                            </button>
                          </SignInButton>
                          <Link href="/debate" className="inline-block bg-purple-500 hover:bg-purple-600 text-white font-bold py-2 px-6 rounded-xl transition-all transform hover:rotate-2 border-2 border-black shadow-lg">
                            🆕 Start New Debate
                          </Link>
                        </div>
                      </>
                    ) : (
                      <>
                        <p className="text-yellow-300 font-bold text-lg mb-3">
                          👀 You&apos;re viewing {characters.find(c => c.id === selectedCharacter)?.name}&apos;s debate (read-only)
                        </p>
                        <Link href="/debate" className="inline-block bg-yellow-500 hover:bg-yellow-600 text-black font-bold py-2 px-6 rounded-xl transition-all transform hover:rotate-2 border-2 border-black shadow-lg">
                          🆕 Start Your Own Debate
                        </Link>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Studio Sidebar - Hidden on mobile, shown on desktop */}
            <div className="space-y-6 hidden lg:block">
              {/* Current Opponent Card */}
              <div className="relative">
                {selectedCharacter && characters.filter(c => c.id === selectedCharacter).map(char => (
                  <div key={char.id} className={`${char.color} p-6 rounded-2xl text-center relative transform rotate-2 border-4 border-black shadow-lg`}>
                    <div className="absolute -top-3 -right-2 text-2xl animate-bounce">⚔️</div>
                    <div className="mb-3 flex justify-center">
                      {getCharacterAvatar(char, 'lg')}
                    </div>
                    <div className="font-black text-xl mb-2">{char.name}</div>
                    <div className="text-sm opacity-90 mb-2">{char.specialty}</div>
                    <div className="text-xs font-bold bg-black/30 rounded px-2 py-1">
                      W-L: {char.wins}
                    </div>
                  </div>
                ))}
              </div>

              {/* Live Studio Stats */}
              <div className="bg-black/50 border-4 border-red-600 rounded-2xl p-4 transform -rotate-1">
                <h3 className="text-lg font-black text-red-400 mb-3 text-center">
                  🔥 LIVE STATS 🔥
                </h3>
                <div className="space-y-2 text-center">
                  <div className="bg-yellow-400 text-black p-2 rounded font-bold text-sm">
                    Messages: {debateMessages.filter(m => m.role !== 'system').length}
                  </div>
                  <div className="bg-green-600 text-white p-2 rounded font-bold text-sm">
                    Debate ID: {debateId.slice(0, 8)}...
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}