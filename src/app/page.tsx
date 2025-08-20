import { SignInButton, SignedIn, SignedOut, UserButton } from '@clerk/nextjs';
import Link from 'next/link';
import { characters, getCharacterAvatar } from '@/lib/characters';

export default function Home() {
  return (
    <div className="min-h-screen relative chaos-scatter bedroom-mess cartman-room-bg">
      {/* Messy Header Banner */}
      <div className="messy-banner p-2 text-center relative">
        <span className="font-black text-white text-sm tracking-wider">
          🔴 LIVE NOW 🔴 CARTMAN&apos;S MASTER DEBATE PODCAST 🔴 EPISODE #420 🔴
        </span>
        <div className="absolute top-2 right-6 z-10">
          <div className="on-air-sign text-sm">ON AIR</div>
        </div>
      </div>
      
      {/* Scattered Bedroom Items */}
      <div className="absolute top-20 left-8 text-3xl opacity-10 transform rotate-12 z-0">🧸</div>
      <div className="absolute top-32 right-12 text-2xl opacity-15 transform -rotate-15 z-0">⚡</div>
      <div className="absolute top-1/3 left-16 text-xl opacity-20 transform rotate-45 z-0">🌮</div>
      <div className="absolute bottom-32 left-20 text-2xl opacity-10 transform -rotate-30 z-0">🎲</div>
      <div className="absolute bottom-40 right-24 text-xl opacity-15 transform rotate-25 z-0">🍔</div>
      <div className="absolute top-1/2 right-8 text-lg opacity-25 transform -rotate-8 z-0">📺</div>

      {/* Navigation */}
      <nav className="absolute top-16 right-6 z-20">
        <SignedOut>
          <SignInButton mode="modal">
            <button className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-6 rounded-lg transition-all transform hover:rotate-1 border-2 border-black">
              Sign In
            </button>
          </SignInButton>
        </SignedOut>
        <SignedIn>
          <UserButton afterSignOutUrl="/" />
        </SignedIn>
      </nav>

      <div className="container mx-auto px-4 py-8">
        {/* Chaotic Title Section */}
        <div className="text-center relative mb-8">
          <div className="absolute top-4 left-4 text-2xl opacity-30 transform -rotate-12">📻</div>
          <div className="absolute top-8 right-8 text-xl opacity-40 transform rotate-12">🎧</div>
          
          <h1 className="text-5xl md:text-7xl font-black south-park-title mb-4">
            <span className="text-red-500">MASTER</span>
            <span className="text-yellow-400">DEBATER</span>
            <span className="text-white">.AI</span>
          </h1>
          
          <div className="comic-bubble max-w-2xl mx-auto p-6 mb-6">
            <p className="text-xl font-bold text-black">
              &quot;I&apos;m not just the BEST debater... I&apos;m the MASTER debater! 
              My mom bought me this microphone and everything!&quot;
            </p>
          </div>
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
              SPONSORED BY: KFC
            </div>
            <div className="absolute top-16 right-12 bg-blue-500 text-white px-2 py-1 rounded transform -rotate-3 border-2 border-black text-xs font-bold">
              CITY WOK
            </div>
            <div className="absolute bottom-4 left-24 bg-green-500 text-white px-2 py-1 rounded transform rotate-1 border-2 border-black text-xs font-bold">
              CASA BONITA
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
                You think you can challenge ME? I&apos;ve debated college professors, destroyed liberals, 
                and made Kyle cry! I&apos;ve been master debating since I was 8 years old!
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
          <p className="text-gray-300 text-lg">Who&apos;s gonna help you get that $60 nut? (Spoiler: Nobody, you&apos;ll lose)</p>
        </div>

        {/* Character Selection - More Chaotic */}
        <div className="max-w-6xl mx-auto mb-12">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-6 py-12">
            {characters.map((character, idx) => (
              <div key={character.name} className="relative">
                <div className={`character-card ${character.color} p-6 rounded-2xl text-center group relative z-10`}>
                  {/* Crown for Cartman */}
                  {character.name === 'Cartman' && (
                    <div className="absolute -top-6 -right-4 text-4xl animate-bounce z-20">👑</div>
                  )}
                  
                  <div className="mb-3 group-hover:scale-110 transition-transform flex justify-center">
                    {getCharacterAvatar(character, 'xl')}
                  </div>
                  <div className="font-black text-xl mb-2">{character.name}</div>
                  <div className="text-sm opacity-90 mb-2">{character.specialty}</div>
                  <div className="text-xs font-bold bg-black/30 rounded px-2 py-1">
                    W-L: {character.wins}
                  </div>
                  
                  {/* Speech Bubble on Hover - positioned to not interfere */}
                  <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-50 pointer-events-none">
                    <div className="bg-white text-black text-sm font-bold p-3 rounded-lg border-2 border-black whitespace-nowrap">
                      {character.quote}
                      <div className="absolute top-full left-1/2 transform -translate-x-1/2">
                        <div className="w-0 h-0 border-l-8 border-r-8 border-t-8 border-transparent border-t-black"></div>
                        <div className="w-0 h-0 border-l-6 border-r-6 border-t-6 border-transparent border-t-white absolute -top-[2px] left-1/2 transform -translate-x-1/2"></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Battle Section */}
        <div className="relative max-w-4xl mx-auto mb-16">
          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
            <SignedOut>
              <SignInButton mode="modal">
                <button className="cartman-gradient text-white font-black text-2xl py-6 px-10 rounded-2xl hover:scale-110 transition-all transform hover:rotate-1 shadow-2xl border-4 border-black relative overflow-hidden group">
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
                className="inline-block bg-gray-700 hover:bg-gray-600 text-white font-bold text-lg py-3 px-6 rounded-xl transition-all border-2 border-black transform hover:-rotate-1 cursor-pointer"
              >
                👀 Watch Carnage
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
              <div className="font-bold text-orange-300">Clyde&apos;s Show STOLEN</div>
              <div className="text-sm text-gray-300">&quot;I was here first!&quot;</div>
              <div className="text-xs text-orange-400">Cartman hostile takeover</div>
            </div>
            <div className="bg-purple-900/50 p-4 rounded-lg border-2 border-purple-400 transform rotate-1">
              <div className="font-bold text-purple-300">Charlie Kirk Award</div>
              <div className="text-sm text-gray-300">Young Master Debaters competition</div>
              <div className="text-xs text-purple-400">Cartman wants it BAD</div>
            </div>
            <div className="bg-green-900/50 p-4 rounded-lg border-2 border-green-400">
              <div className="font-bold text-green-300">Getting That Nut</div>
              <div className="text-sm text-gray-300">$60/week podcast goal</div>
              <div className="text-xs text-green-400">Money talks, morals walk</div>
            </div>
          </div>
        </div>

        {/* Cartman's Stats */}
        <div className="max-w-2xl mx-auto text-center">
          <div className="bg-gradient-to-r from-yellow-400 to-red-500 text-black p-6 rounded-2xl border-4 border-black transform -rotate-1 shadow-xl">
            <h4 className="text-3xl font-black mb-2">CARTMAN&apos;S STOLEN STATS</h4>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-black">1</div>
                <div className="text-sm font-bold">Podcasts Stolen</div>
              </div>
              <div>
                <div className="text-2xl font-black">$60</div>
                <div className="text-sm font-bold">Weekly Nut Goal</div>
              </div>
              <div>
                <div className="text-2xl font-black">0</div>
                <div className="text-sm font-bold">Charlie Kirk Awards</div>
              </div>
            </div>
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
          
          {/* Random Scattered Elements */}
          <div className="absolute bottom-10 left-10 text-4xl opacity-20 transform rotate-45">🍗</div>
          <div className="absolute bottom-20 right-16 text-2xl opacity-25 transform -rotate-12">📱</div>
          <div className="absolute top-1/2 left-4 text-3xl opacity-15 transform rotate-12">🎮</div>
        </div>
      </div>
    </div>
  );
}
