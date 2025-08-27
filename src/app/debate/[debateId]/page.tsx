'use client';

import { useUser } from '@/lib/useTestUser';
import { useAvatar } from '@/lib/useAvatar';
import { SignInButton } from '@clerk/nextjs';
import Link from 'next/link';
import { characters, getCharacterAvatar } from '@/lib/characters';
import { useParams, useRouter } from 'next/navigation';
import { RoastCard } from '@/components/RoastCard';
import UpgradeModal from '@/components/UpgradeModal';
import { useDebate } from '@/lib/useDebate';

export default function DebatePage() {
  const params = useParams();
  const router = useRouter();
  const debateId = params.debateId as string;
  useUser();
  const { displayName: userDisplayName } = useAvatar();
  
  // Use the custom hook - SO MUCH CLEANER!
  const { state, refs, actions } = useDebate(debateId);

  // Destructure what we need from state for easier access
  const {
    character: selectedCharacter,
    topic: selectedTopic,
    messages: debateMessages,
    userInput,
    isLoading,
    isLoadingDebate,
    showShareToast,
    isOwner,
    isAuthenticated,
    debateEnded,
    debateScore,
    isScoringDebate,
    showScoreModal,
    rateLimitError,
  } = state;

  // Loading state
  if (isLoadingDebate) {
    return (
      <div className="min-h-screen flex items-center justify-center cartman-room-bg">
        <div className="comic-bubble p-6 animate-bounce">
          <p className="text-2xl font-black text-black">
            Loading Master Debate... 💭
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative chaos-scatter bedroom-mess cartman-room-bg">
      {/* Upgrade Modal */}
      {rateLimitError && (
        <UpgradeModal
          isOpen={rateLimitError.show}
          onClose={actions.clearRateLimitError}
          trigger={rateLimitError.type === 'debate' ? 'rate-limit-debate' : 'rate-limit-message'}
          limitData={{
            current: rateLimitError.current,
            limit: rateLimitError.limit
          }}
        />
      )}
      
      {/* Roast Card Modal */}
      {showScoreModal && debateScore && selectedCharacter && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="my-8">
            <RoastCard
              score={debateScore}
              characterId={selectedCharacter}
              userName={userDisplayName}
              topic={selectedTopic}
              debateId={debateId}
              onShare={() => {
                actions.setShowShareToast(true);
                setTimeout(() => actions.setShowShareToast(false), 3000);
              }}
            />
            
            {/* Close button */}
            <div className="text-center mt-6">
              <button
                onClick={() => actions.setShowScoreModal(false)}
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
        <span className="font-black text-white text-xs sm:text-sm tracking-wider">
          🔴 LIVE DEBATE IN PROGRESS 🔴 CARTMAN&apos;S MASTER DEBATE STUDIO 🔴 DEBATE ID: {debateId.slice(0, 8).toUpperCase()} 🔴
        </span>
      </div>

      {/* Toast notification for share link */}
      {showShareToast && (
        <div className="fixed top-20 left-1/2 transform -translate-x-1/2 bg-green-600 text-white px-6 py-3 rounded-xl border-2 border-black z-50 animate-bounce">
          <p className="font-bold">📋 Link Copied to Clipboard!</p>
        </div>
      )}

      <div className="p-2 sm:p-8 relative z-10">
        <div className="max-w-6xl mx-auto">
          {/* Studio Header */}
          <div className="relative bg-gradient-to-br from-amber-900/60 to-red-900/60 p-3 sm:p-6 rounded-xl sm:rounded-3xl border-2 sm:border-4 border-yellow-400 debate-glow mb-3 sm:mb-6 sm:transform sm:-rotate-1">
            {/* Microphone Icon - Hidden on mobile */}
            <div className="absolute top-4 left-8 hidden sm:block">
              <div className="podcast-mic text-2xl sm:text-4xl">🎙️</div>
            </div>
            
            {/* Sponsor Banner - Hidden on mobile */}
            <div className="absolute top-4 right-8 bg-green-600 text-white px-3 py-1 rounded transform rotate-2 border-2 border-black text-sm font-bold animate-pulse hidden sm:block">
              🔴 LIVE ON KFC RADIO
            </div>
            
            <div className="sm:ml-32 sm:mr-20 relative z-10">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-0">
                <div>
                  <h1 className="text-2xl sm:text-4xl font-black text-yellow-300 mb-1 sm:mb-2 sm:transform sm:rotate-1">
                    🔥 LIVE MASTER DEBATE 🔥
                  </h1>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-base sm:text-2xl font-bold text-white">
                      {userDisplayName} ⚡ VS ⚡ {characters.find(c => c.id === selectedCharacter)?.name}
                    </span>
                    {selectedCharacter && (
                      <div className="hidden sm:block">
                        {getCharacterAvatar(characters.find(c => c.id === selectedCharacter)!, 'sm')}
                      </div>
                    )}
                  </div>
                  <p className="text-gray-200 text-sm sm:text-lg">Topic: &quot;{selectedTopic}&quot;</p>
                </div>
                
                {/* Action buttons - Stacked on mobile */}
                <div className="flex flex-row sm:flex-col gap-2 w-full sm:w-auto">
                  <button
                    onClick={actions.copyShareLink}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-3 sm:py-3 sm:px-6 rounded-lg sm:rounded-xl transition-all transform hover:rotate-2 border-2 sm:border-3 border-black shadow-lg hover:scale-105 text-xs sm:text-base cursor-pointer flex-1 sm:flex-initial"
                  >
                    📤 SHARE
                  </button>
                  
                  <Link href="/debate" className="flex-1 sm:flex-initial">
                    <button className="bg-yellow-600 hover:bg-yellow-700 text-white font-bold py-2 px-3 sm:py-3 sm:px-6 rounded-lg sm:rounded-xl transition-all transform hover:rotate-2 border-2 sm:border-3 border-black shadow-lg hover:scale-105 text-xs sm:text-base cursor-pointer w-full">
                      🆕 NEW DEBATE
                    </button>
                  </Link>
                  <button
                    onClick={() => router.push('/')}
                    className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-3 sm:py-3 sm:px-6 rounded-lg sm:rounded-xl transition-all transform hover:rotate-2 border-2 sm:border-3 border-black shadow-lg hover:scale-105 text-xs sm:text-base cursor-pointer flex-1 sm:flex-initial"
                  >
                    🏃 ESCAPE
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="grid lg:grid-cols-4 gap-3 sm:gap-6">
            {/* Chat Area */}
            <div className="lg:col-span-3">
              {/* Messages Studio */}
              <div className="relative bg-gradient-to-br from-black/70 to-gray-900/70 p-3 sm:p-6 rounded-xl sm:rounded-3xl border-2 sm:border-4 border-yellow-400 debate-glow">
                <div className="h-[400px] sm:h-[500px] overflow-y-auto overflow-x-visible relative z-10 space-y-3 sm:space-y-4 px-2 sm:px-8">
                  {debateMessages.map((msg, idx) => (
                    <div key={idx} className={`mb-3 sm:mb-4 ${msg.role === 'user' ? 'text-right' : 'text-left'}`}>
                      {msg.role === 'system' ? (
                        <div className="text-center">
                          <div className="comic-bubble inline-block p-3 sm:p-4 text-black font-bold transform rotate-1 text-sm sm:text-base">
                            {msg.content}
                          </div>
                        </div>
                      ) : (
                        <div className={`inline-block max-w-[85%] sm:max-w-[80%] ${
                          msg.role === 'user' ? 'ml-auto' : 'mr-auto'
                        }`}>
                          <div className={`p-3 sm:p-4 rounded-lg sm:rounded-2xl border-2 sm:border-4 border-black relative transform ${
                            msg.role === 'user' 
                              ? 'bg-blue-600 text-white rotate-1' 
                              : 'bg-red-600 text-white -rotate-1'
                          }`}>
                            {/* Character avatar for AI messages - Hidden on mobile */}
                            {msg.role === 'ai' && (
                              <div className="absolute -top-6 -left-4 z-20 hidden sm:block">
                                {selectedCharacter && getCharacterAvatar(characters.find(c => c.id === selectedCharacter)!, 'md')}
                              </div>
                            )}
                            
                            <div className="font-black mb-1 sm:mb-2 text-sm sm:text-lg">
                              {msg.role === 'user' 
                                ? `${userDisplayName} 💪` 
                                : `${characters.find(c => c.id === selectedCharacter)?.name} 👑`
                              }
                            </div>
                            <div className="font-bold text-sm sm:text-base">{msg.content}</div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                  {isLoading && (
                    <div className="text-center">
                      <div className="comic-bubble inline-block p-3 sm:p-4 text-black font-bold animate-bounce text-sm sm:text-base">
                        {characters.find(c => c.id === selectedCharacter)?.name} is preparing the DESTRUCTION... 💭
                      </div>
                    </div>
                  )}
                  {/* Invisible element to scroll to */}
                  <div ref={refs.messagesEndRef} />
                </div>
              </div>

              {/* Input Studio */}
              <div className="mt-4 relative bg-gradient-to-br from-amber-900/40 to-red-900/40 p-2 sm:p-4 rounded-xl sm:rounded-2xl border-2 sm:border-4 border-yellow-400 sm:transform sm:rotate-1">
                {isOwner ? (
                  <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
                    <input
                      type="text"
                      value={userInput}
                      onChange={(e) => actions.setUserInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && actions.sendMessage()}
                      placeholder="Type your argument (if you dare)..."
                      className="flex-1 p-3 sm:p-4 rounded-lg sm:rounded-xl bg-black/70 border-2 sm:border-4 border-black focus:border-yellow-400 focus:outline-none text-white font-bold sm:transform sm:hover:rotate-1 transition-all text-base sm:text-lg"
                      disabled={isLoading}
                    />
                    <button
                      onClick={actions.sendMessage}
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
                        onClick={actions.endDebate}
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
                
                {/* View Results button - accessible to all users for completed debates */}
                {debateEnded && debateScore && !showScoreModal && (
                  <div className="text-center mt-4">
                    <button
                      onClick={() => actions.setShowScoreModal(true)}
                      className="font-black px-6 py-4 rounded-xl transition-all border-4 border-black transform hover:rotate-2 hover:scale-105 shadow-xl bg-green-600 hover:bg-green-700 text-white cursor-pointer"
                    >
                      📊 VIEW RESULTS
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Studio Sidebar - Hidden on mobile, shown on desktop */}
            <div className="space-y-6 hidden lg:block">
              {/* Current Opponent Card */}
              <div className="relative">
                {selectedCharacter && characters.filter(c => c.id === selectedCharacter).map(char => (
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
                  <div className="bg-orange-600 text-white p-2 rounded font-bold text-sm">
                    Debate ID: {debateId.slice(0, 8).toUpperCase()}
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