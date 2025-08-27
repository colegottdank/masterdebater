'use client';

import { useState, useEffect, useRef } from 'react';
import { useUser } from '@/lib/useTestUser';
import { SignedIn, UserButton } from '@clerk/nextjs';
import { Character } from '@/lib/claude';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { characters, getCharacterAvatar } from '@/lib/characters';
import AvatarUpload from '@/components/AvatarUpload';
import ScatteredDecorations from '@/components/ScatteredDecorations';
import CharacterCard from '@/components/CharacterCard';
import LiveBanner from '@/components/LiveBanner';
import TopicSelector from '@/components/TopicSelector';
import ComicBubble from '@/components/ComicBubble';
import UpgradeModal from '@/components/UpgradeModal';

export default function DebatePage() {
  const { user } = useUser();
  const router = useRouter();
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null);
  const [selectedTopic, setSelectedTopic] = useState<string>('');
  const [customTopic, setCustomTopic] = useState<string>('');
  const [debateMessages, setDebateMessages] = useState<Array<{ role: string; content: string }>>([]);
  const [userInput, setUserInput] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [debateStarted, setDebateStarted] = useState(false);
  const [currentDebateId, setCurrentDebateId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Upgrade modal state
  const [upgradeModal, setUpgradeModal] = useState<{
    isOpen: boolean;
    trigger: 'rate-limit-debate' | 'rate-limit-message' | 'button';
    limitData?: {
      current: number;
      limit: number;
    };
  }>({
    isOpen: false,
    trigger: 'button'
  });

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [debateMessages]);


  const startDebate = async () => {
    const topic = customTopic || selectedTopic;
    if (!selectedCharacter || !topic) {
      alert('Please select a character and topic!');
      return;
    }
    
    // Generate a unique debate ID
    const debateId = crypto.randomUUID();
    
    try {
      // Create debate in database first
      const response = await fetch('/api/debate/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          character: selectedCharacter,
          topic,
          debateId
        })
      });
      
      if (response.ok) {
        // Navigate directly without query params!
        router.push(`/debate/${debateId}`);
      } else {
        const error = await response.json();
        console.error('Failed to create debate:', error);
        
        // Handle rate limit error
        if (response.status === 429 && error.error === 'debate_limit_exceeded') {
          setUpgradeModal({
            isOpen: true,
            trigger: 'rate-limit-debate',
            limitData: {
              current: error.current,
              limit: error.limit
            }
          });
        } else {
          alert('Failed to create debate. Please try again.');
        }
      }
    } catch (error) {
      console.error('Error creating debate:', error);
      alert('Failed to create debate. Please try again.');
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
          debateId: currentDebateId,
          character: selectedCharacter,
          topic: customTopic || selectedTopic,
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
      const aiMessageIndex = debateMessages.length + 1; // +1 for user message just added
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
                // Final update with complete response
                setDebateMessages(prev => {
                  const newMessages = [...prev];
                  newMessages[aiMessageIndex] = { role: 'ai', content: data.content };
                  return newMessages;
                });
              } else if (data.type === 'error') {
                throw new Error(data.error || 'Streaming error');
              }
            } catch (e) {
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

  if (!debateStarted) {
    return (
      <div className="min-h-screen relative chaos-scatter bedroom-mess cartman-room-bg">
        {/* Upgrade Modal */}
        <UpgradeModal
          isOpen={upgradeModal.isOpen}
          onClose={() => setUpgradeModal(prev => ({ ...prev, isOpen: false }))}
          trigger={upgradeModal.trigger}
          limitData={upgradeModal.limitData}
        />
        {/* Messy Header Banner */}
        <LiveBanner 
          text="🎯 DEBATE PREP ROOM 🎯 CARTMAN'S TRAINING FACILITY 🎯 GET READY TO BE DESTROYED 🎯"
          onAirText="PREP MODE"
        />

        {/* Scattered Bedroom Items */}
        <ScatteredDecorations type="bedroom" hideOnMobile={false} />

        <div className="p-8 relative z-10">
          <div className="flex justify-between items-start mb-8">
            <Link href="/" className="inline-block bg-yellow-400 hover:bg-yellow-300 text-black font-bold py-3 px-6 rounded-xl transition-all transform hover:rotate-1 border-4 border-black shadow-lg">
              ← Escape Back to Studio
            </Link>
            <div className="flex items-center gap-4">
              <Link href="/history" className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-xl transition-all transform hover:-rotate-1 border-4 border-black shadow-lg">
                📚 My Debates
              </Link>
              <SignedIn>
                <UserButton afterSignOutUrl="/" />
              </SignedIn>
            </div>
          </div>
          
          <div className="max-w-6xl mx-auto">
            {/* Chaotic Title */}
            <div className="text-center relative mb-8">
              <div className="absolute top-4 left-4 text-2xl opacity-30 transform -rotate-12">🥊</div>
              <div className="absolute top-8 right-8 text-xl opacity-40 transform rotate-12">⚔️</div>
              
              <h1 className="text-5xl md:text-6xl font-black south-park-title mb-4">
                <span className="text-red-500">CHOOSE</span>
                <span className="text-yellow-400"> YOUR </span>
                <span className="text-white">VICTIM</span>
              </h1>
              
              <ComicBubble className="transform rotate-1" size="small">
                &quot;Pick who you want me to absolutely DESTROY in this debate!&quot;
              </ComicBubble>
            </div>

            {/* Your Fighter Section with Avatar Upload */}
            <div className="mb-8">
              <AvatarUpload />
            </div>

            {/* VS Indicator */}
            <div className="relative mb-8">
              <div className="flex items-center justify-center">
                <div className="relative">
                  {/* Lightning effects */}
                  <div className="absolute -top-4 -left-8 text-4xl animate-pulse">⚡</div>
                  <div className="absolute -top-4 -right-8 text-4xl animate-pulse" style={{ animationDelay: '0.3s' }}>⚡</div>
                  <div className="absolute -bottom-4 -left-6 text-3xl animate-pulse" style={{ animationDelay: '0.6s' }}>💥</div>
                  <div className="absolute -bottom-4 -right-6 text-3xl animate-pulse" style={{ animationDelay: '0.9s' }}>💥</div>
                  
                  {/* Main VS */}
                  <div className="bg-gradient-to-br from-red-600 via-orange-500 to-yellow-500 p-6 rounded-3xl border-4 border-black shadow-2xl transform rotate-2 animate-pulse">
                    <div className="bg-black p-4 rounded-2xl transform -rotate-2">
                      <h2 className="text-5xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-red-600">
                        VS
                      </h2>
                    </div>
                  </div>
                  
                  {/* Fire effects */}
                  <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 text-2xl">🔥</div>
                  <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 text-2xl">🔥</div>
                </div>
              </div>
              
              {/* Choose opponent text */}
              <div className="text-center mt-4">
                <div className="inline-block bg-yellow-400 text-black font-black px-4 py-2 rounded-xl border-2 border-black transform -rotate-1">
                  CHOOSE YOUR OPPONENT!
                </div>
              </div>
            </div>

            {/* Character Selection - Chaotic Cards */}
            <div className="max-w-6xl mx-auto mb-12">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-6 py-12">
                {characters.map((char) => (
                  <CharacterCard
                    key={char.id}
                    character={char}
                    isSelected={selectedCharacter === char.id}
                    onSelect={setSelectedCharacter}
                    showCrown={true}
                  />
                ))}
              </div>
            </div>

            {/* Topic Selection - Cartman's Style */}
            <TopicSelector
              selectedTopic={selectedTopic}
              customTopic={customTopic}
              onTopicSelect={setSelectedTopic}
              onCustomTopicChange={setCustomTopic}
            />

            {/* Start Button - Epic Style */}
            <div className="text-center relative">
              <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 text-2xl opacity-60">⚡</div>
              <div className="absolute -top-8 right-1/3 text-xl opacity-40 transform rotate-12">💥</div>
              
              <button
                onClick={startDebate}
                disabled={!selectedCharacter || (!selectedTopic && !customTopic)}
                className={`text-3xl font-black py-8 px-16 rounded-2xl transition-all border-4 border-black relative overflow-hidden ${
                  selectedCharacter && (selectedTopic || customTopic)
                    ? 'cartman-gradient text-white hover:scale-110 hover:rotate-2 shadow-2xl animate-pulse cursor-pointer'
                    : 'bg-gray-700 text-gray-400 cursor-not-allowed opacity-50'
                }`}
              >
                <span className="relative z-10">
                  {selectedCharacter && (selectedTopic || customTopic) 
                    ? '🔥 DESTROY THEM NOW! 🔥' 
                    : 'SELECT OPPONENT & TOPIC'}
                </span>
                {selectedCharacter && (selectedTopic || customTopic) && (
                  <div className="absolute inset-0 bg-white opacity-0 hover:opacity-20 transition-opacity"></div>
                )}
              </button>
              
              {selectedCharacter && (selectedTopic || customTopic) && (
                <div className="mt-4 text-yellow-400 font-bold animate-bounce">
                  Ready to witness the MASTER at work! 👑
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative chaos-scatter bedroom-mess cartman-room-bg">
      {/* Live Debate Banner */}
      <LiveBanner 
        text="🔴 LIVE DEBATE IN PROGRESS 🔴 CARTMAN'S MASTER DEBATE STUDIO 🔴 DESTRUCTION IMMINENT 🔴"
        showOnAir={false}
      />

      {/* Scattered Studio Items */}
      <ScatteredDecorations type="studio" hideOnMobile={false} />

      <div className="p-8 relative z-10">
        <div className="max-w-6xl mx-auto">
          {/* Studio Header */}
          <div className="relative bg-gradient-to-br from-amber-900/60 to-red-900/60 p-6 rounded-3xl border-4 border-yellow-400 debate-glow mb-6 transform -rotate-1">
            {/* Microphone Icon */}
            <div className="absolute top-4 left-8">
              <div className="podcast-mic text-4xl">🎙️</div>
            </div>
            
            {/* Sponsor Banners */}
            <div className="absolute top-4 right-8 bg-green-600 text-white px-3 py-1 rounded transform rotate-2 border-2 border-black text-sm font-bold animate-pulse">
              🔴 LIVE ON KFC RADIO
            </div>
            
            <div className="ml-32 mr-20 relative z-10">
              <div className="flex justify-between items-center">
                <div>
                  <h1 className="text-4xl font-black text-yellow-300 mb-2 transform rotate-1">
                    🔥 LIVE MASTER DEBATE 🔥
                  </h1>
                  <h2 className="text-2xl font-bold text-white mb-1 flex items-center gap-3">
                    VS: {characters.find(c => c.id === selectedCharacter)?.name}
                    {getCharacterAvatar(characters.find(c => c.id === selectedCharacter)!, 'sm')}
                  </h2>
                  <p className="text-gray-200 text-lg">Topic: &quot;{customTopic || selectedTopic}&quot;</p>
                </div>
                <button
                  onClick={() => window.location.reload()}
                  className="bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-6 rounded-xl transition-all transform hover:rotate-2 border-3 border-black shadow-lg hover:scale-105 cursor-pointer"
                >
                  🏃 ESCAPE STUDIO
                </button>
              </div>
            </div>
          </div>

          <div className="grid lg:grid-cols-4 gap-6">
            {/* Chat Area */}
            <div className="lg:col-span-3">
              {/* Messages Studio */}
              <div className="relative bg-gradient-to-br from-black/70 to-gray-900/70 p-6 rounded-3xl border-4 border-yellow-400 debate-glow">
                {/* Studio Equipment Decorations */}
                <div className="absolute top-2 left-2 text-lg opacity-30 transform rotate-45">🎧</div>
                <div className="absolute bottom-2 right-2 text-sm opacity-20 transform -rotate-12">📻</div>
                <div className="absolute top-1/2 left-2 text-md opacity-25 transform rotate-30">🎙️</div>
                
                <div className="h-[500px] overflow-y-auto overflow-x-visible relative z-10 space-y-4 px-8">
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
                            {/* Character avatar for AI messages */}
                            {msg.role === 'ai' && (
                              <div className="absolute -top-6 -left-4 z-20">
                                {getCharacterAvatar(characters.find(c => c.id === selectedCharacter)!, 'md')}
                              </div>
                            )}
                            
                            <div className="font-black mb-2 text-lg">
                              {msg.role === 'user' 
                                ? `${user?.firstName || 'You'} 💪` 
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
                  {/* Invisible element to scroll to */}
                  <div ref={messagesEndRef} />
                </div>
              </div>

              {/* Input Studio */}
              <div className="mt-4 relative bg-gradient-to-br from-amber-900/40 to-red-900/40 p-4 rounded-2xl border-4 border-yellow-400 transform rotate-1">
                <div className="flex gap-4">
                  <input
                    type="text"
                    value={userInput}
                    onChange={(e) => setUserInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                    placeholder="Type your argument (if you dare)..."
                    className="flex-1 p-4 rounded-xl bg-black/70 border-4 border-black focus:border-yellow-400 focus:outline-none text-white font-bold transform hover:rotate-1 transition-all text-lg"
                    disabled={isLoading}
                  />
                  <button
                    onClick={sendMessage}
                    disabled={isLoading || !userInput.trim()}
                    className={`px-8 py-4 rounded-xl font-black text-xl transition-all border-4 border-black transform hover:rotate-2 ${
                      isLoading || !userInput.trim()
                        ? 'bg-gray-700 text-gray-400 cursor-not-allowed opacity-50'
                        : 'cartman-gradient text-white hover:scale-105 shadow-xl'
                    }`}
                  >
                    🎯 FIRE!
                  </button>
                </div>
              </div>
            </div>

            {/* Studio Sidebar */}
            <div className="space-y-6">
              {/* Current Opponent Card */}
              <div className="relative">
                {characters.filter(c => c.id === selectedCharacter).map(char => (
                  <div key={char.id} className={`${char.color} p-6 rounded-2xl text-center relative transform rotate-2 border-4 border-black shadow-lg`} style={{ boxShadow: '6px 6px 0px #000, 0 0 20px rgba(0, 0, 0, 0.5)' }}>
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
                  <div className="bg-red-600 text-white p-2 rounded font-bold text-sm">
                    Cartman Wins: Still Counting...
                  </div>
                  <div className="bg-blue-600 text-white p-2 rounded font-bold text-sm">
                    Your Defeats: Loading...
                  </div>
                </div>
              </div>

              {/* Random Studio Clutter */}
              <div className="bg-purple-900/50 border-2 border-purple-400 rounded-xl p-3 transform rotate-1">
                <div className="text-xs text-purple-300 text-center space-y-1">
                  <div>🎧 Studio Equipment</div>
                  <div>📻 Broadcasting Live</div>
                  <div>🍟 Emergency Snacks</div>
                  <div>👑 Cartman&apos;s Throne</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}