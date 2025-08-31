import { SignInButton, SignedIn, SignedOut, UserButton } from '@clerk/nextjs';
import Link from 'next/link';
import { characters } from '@/lib/characters';
import ScatteredDecorations from '@/components/ScatteredDecorations';
import CharacterCard from '@/components/CharacterCard';
import LiveBanner from '@/components/LiveBanner';
import ComicBubble from '@/components/ComicBubble';

export default function Home() {
  return (
    <div className="min-h-screen relative chaos-scatter bedroom-mess cartman-room-bg">
      {/* Messy Header Banner */}
      <LiveBanner 
        text="🔴 LIVE NOW 🔴 CARTMAN'S MASTER DEBATE PODCAST 🔴 EPISODE #420 🔴"
        showOnAir={true}
      />
      
      {/* Scattered Bedroom Items */}
      <ScatteredDecorations type="bedroom" />

      {/* Navigation */}
      <SignedIn>
        <nav className="absolute top-12 sm:top-16 right-1 sm:right-6 z-20 flex items-center gap-2 sm:gap-4">
          <Link href="/history" className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-bold py-1 px-2 sm:py-3 sm:px-6 rounded-lg sm:rounded-xl transition-all transform hover:-rotate-1 border-2 sm:border-4 border-black shadow-lg text-xs sm:text-base">
            📚 <span className="hidden sm:inline">My Debates</span><span className="sm:hidden">Debates</span>
          </Link>
          <UserButton afterSignOutUrl="/" />
        </nav>
      </SignedIn>
      {/* Sign In button for signed out users */}
      <SignedOut>
        <nav className="absolute top-12 sm:top-16 right-1 sm:right-6 z-20">
          <SignInButton mode="modal">
            <button className="bg-red-600 hover:bg-red-700 text-white font-bold py-1 px-2 sm:py-2 sm:px-6 rounded-lg transition-all transform hover:rotate-1 border-2 border-black text-xs sm:text-sm">
              Sign In
            </button>
          </SignInButton>
        </nav>
      </SignedOut>

      <div className="container mx-auto px-4 py-8">
        {/* Chaotic Title Section */}
        <div className="text-center relative mb-8">
          <h1 className="text-4xl sm:text-5xl md:text-7xl font-black south-park-title mb-4">
            <span className="text-red-500">MASTER</span>
            <span className="text-yellow-400">DEBATER</span>
            <span className="text-white">.AI</span>
          </h1>
          
          <ComicBubble>
            &quot;I&apos;m not just the BEST debater... I&apos;m the MASTER debater! 
            My mom bought me this microphone and everything!&quot;
          </ComicBubble>
        </div>

        {/* Podcast Studio Section */}
        <div className="max-w-6xl mx-auto mb-12 relative podcast-equipment">
          <div className="relative bg-gradient-to-br from-amber-900/40 to-red-900/40 p-8 rounded-3xl border-4 border-yellow-400 debate-glow">
            {/* Microphone */}
            <div className="absolute top-4 left-8">
              <div className="podcast-mic">🎙️</div>
            </div>
            
            {/* Multiple Sponsor Banners */}
            <div className="absolute top-4 right-8 bg-yellow-400 text-black px-3 py-1 rounded transform rotate-2 border-2 border-black text-sm font-bold">
              CHANNEL OF TRUTH™
            </div>
            <div className="absolute top-16 right-12 bg-blue-500 text-white px-2 py-1 rounded transform -rotate-3 border-2 border-black text-xs font-bold">
              EDITED FOR VICTORY
            </div>
            <div className="absolute bottom-4 left-24 bg-green-500 text-white px-2 py-1 rounded transform rotate-1 border-2 border-black text-xs font-bold">
              MOM-APPROVED*
            </div>

            {/* Bedroom Clutter */}
            <div className="absolute top-2 left-2 text-lg opacity-30 transform rotate-45">🍟</div>
            <div className="absolute bottom-2 right-2 text-sm opacity-20 transform -rotate-12">🥤</div>
            <div className="absolute top-1/2 left-2 text-md opacity-25 transform rotate-30">🎪</div>

            <div className="ml-20 mr-20 relative z-10">
              <h2 className="text-4xl font-black text-yellow-300 mb-4 transform -rotate-1">
                WELCOME TO THE STUDIO!
              </h2>
              <p className="text-lg text-gray-200 mb-4 leading-relaxed">
                You think you can challenge ME? I&apos;ve destroyed college girls in debates, 
                made Kyle cry, and I&apos;ve been masterdebating since I was 8 years old! 
                (Mom keeps interrupting but she doesn&apos;t understand podcasting!)
              </p>
              <div className="bg-red-600 text-white p-3 rounded-lg border-2 border-black transform rotate-1 inline-block shadow-lg">
                <span className="font-bold">CARTMAN&apos;S DEBATE RULES:</span> No crying, no fact-checking, respect my authoritah!
              </div>
              
              {/* Additional chaos */}
              <div className="mt-4 flex gap-2 flex-wrap justify-center">
                <span className="bg-purple-600 text-white px-2 py-1 rounded text-xs border border-black transform -rotate-2">
                  UNDEFEATED
                </span>
                <span className="bg-orange-500 text-white px-2 py-1 rounded text-xs border border-black transform rotate-1">
                  #1 DEBATER
                </span>
                <span className="bg-pink-500 text-white px-2 py-1 rounded text-xs border border-black transform -rotate-1">
                  MOM APPROVED
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Choose Your Opponent */}
        <div className="text-center mb-12">
          <h3 className="text-4xl font-black text-yellow-400 mb-2 transform -rotate-1">
            CHOOSE YOUR CHALLENGER
          </h3>
          <p className="text-gray-300 text-lg">Pick who gets DESTROYED in today&apos;s masterdebate! (Spoiler: It&apos;s you)</p>
        </div>

        {/* Character Selection - More Chaotic */}
        <div className="max-w-6xl mx-auto mb-12">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 sm:gap-6 py-6 sm:py-12">
            {characters.map((character) => (
              <CharacterCard 
                key={character.id}
                character={character}
                showCrown={true}
              />
            ))}
          </div>
        </div>

        {/* Battle Section */}
        <div className="relative max-w-4xl mx-auto mb-16">
          <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center items-center">
            <SignedOut>
              <SignInButton mode="modal">
                <button className="cartman-gradient text-white font-black text-lg sm:text-2xl py-4 px-6 sm:py-6 sm:px-10 rounded-2xl hover:scale-110 transition-all transform hover:rotate-1 shadow-2xl border-4 border-black relative overflow-hidden group">
                  <span className="relative z-10">START MASTER DEBATING!</span>
                  <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-20 transition-opacity"></div>
                </button>
              </SignInButton>
            </SignedOut>
            <SignedIn>
              <Link href="/debate" className="inline-block cursor-pointer">
                <button className="cartman-gradient text-white font-black text-2xl py-6 px-10 rounded-2xl hover:scale-110 transition-all transform hover:rotate-1 shadow-2xl border-4 border-black relative overflow-hidden group cursor-pointer">
                  <span className="relative z-10">ENTER THE ARENA!</span>
                  <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-20 transition-opacity"></div>
                </button>
              </Link>
            </SignedIn>
            
            <div className="text-gray-300 text-center">
              <div className="text-lg font-bold">OR</div>
              <Link 
                href="https://southpark.cc.com/episodes/9756cz/south-park-got-a-nut-season-27-ep-2" 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-block"
              >
                <button className="bg-gray-700 hover:bg-gray-600 text-white font-bold text-lg py-3 px-6 rounded-xl transition-all border-2 border-black transform hover:-rotate-1 cursor-pointer w-full">
                  👀 Watch Carnage
                </button>
              </Link>
            </div>
          </div>
        </div>

        {/* Recent Mayhem Ticker */}
        <div className="bg-black/50 border-4 border-red-600 rounded-2xl p-6 max-w-4xl mx-auto transform rotate-1 mb-16">
          <h3 className="text-2xl font-black text-red-400 mb-4 text-center">
            🔥 RECENT PODCAST DRAMA 🔥
          </h3>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="bg-orange-900/50 p-4 rounded-lg border-2 border-orange-400 transform -rotate-1">
              <div className="font-bold text-orange-300">Clyde&apos;s Hostile Takeover</div>
              <div className="text-sm text-gray-300">&quot;#RespectClydesAuthority&quot;</div>
              <div className="text-xs text-orange-400">Cartman: &quot;He stole my shtick!&quot;</div>
            </div>
            <div className="bg-purple-900/50 p-4 rounded-lg border-2 border-purple-400 transform rotate-1">
              <div className="font-bold text-purple-300">Mom&apos;s Confused</div>
              <div className="text-sm text-gray-300">&quot;Stop that masterdebating!&quot;</div>
              <div className="text-xs text-purple-400">It&apos;s just debates, Mom!</div>
            </div>
            <div className="bg-green-900/50 p-4 rounded-lg border-2 border-green-400">
              <div className="font-bold text-green-300">College Girls DESTROYED</div>
              <div className="text-sm text-gray-300">47 smart replies edited out</div>
              <div className="text-xs text-green-400">(In debates, obviously)</div>
            </div>
          </div>
        </div>

        {/* Cartman's Stats */}
        <div className="max-w-3xl mx-auto text-center">
          <div className="bg-gradient-to-r from-yellow-400 to-red-500 text-black p-6 rounded-2xl border-4 border-black transform -rotate-1 shadow-xl">
            <h4 className="text-3xl font-black mb-4">CARTMAN&apos;S MASTERDEBATING STATS</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-2xl font-black">1</div>
                <div className="text-xs font-bold">Podcasts Stolen</div>
              </div>
              <div>
                <div className="text-2xl font-black">999+</div>
                <div className="text-xs font-bold">Debates Won*</div>
              </div>
              <div>
                <div className="text-2xl font-black">47</div>
                <div className="text-xs font-bold">Smart Replies Edited</div>
              </div>
              <div>
                <div className="text-2xl font-black">∞</div>
                <div className="text-xs font-bold">Mom Interruptions</div>
              </div>
            </div>
            <div className="text-xs mt-3 italic">*After editing</div>
          </div>
        </div>

        {/* Footer Chaos */}
        <div className="mt-16 text-center">
          <div className="transform rotate-2 inline-block bg-black/70 p-4 rounded-xl border-2 border-gray-600">
            <p className="text-gray-400 text-sm">
              &quot;Respect my authoritah!&quot; - Eric Theodore Cartman, Master Debater
            </p>
            <p className="text-gray-500 text-xs mt-1">
              Inspired by South Park S27E02 &quot;Got a Nut&quot; • Powered by Claude Sonnet 4
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
