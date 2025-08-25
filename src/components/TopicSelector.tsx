import React from 'react';

export const DEBATE_TOPICS = [
  "Is cereal a soup?",
  "Should pineapple be on pizza?",
  "Are hot dogs sandwiches?",
  "Is water wet?",
  "Should toilet paper hang over or under?",
  "Is a taco a sandwich?",
  "Should you pour milk or cereal first?",
  "Are birds real?",
  "Is math related to science?",
  "Should you shower in the morning or at night?"
];

interface TopicSelectorProps {
  selectedTopic: string;
  customTopic: string;
  onTopicSelect: (topic: string) => void;
  onCustomTopicChange: (topic: string) => void;
}

const TopicSelector: React.FC<TopicSelectorProps> = ({
  selectedTopic,
  customTopic,
  onTopicSelect,
  onCustomTopicChange
}) => {
  return (
    <div className="relative max-w-5xl mx-auto mb-12">
      <div className="bg-gradient-to-br from-amber-900/40 to-red-900/40 p-8 rounded-3xl border-4 border-yellow-400 debate-glow">
        {/* Sponsors */}
        <div className="absolute top-2 right-4 bg-yellow-400 text-black px-3 py-1 rounded transform rotate-2 border-2 border-black text-sm font-bold z-20">
          TOPIC SPONSOR: CASA BONITA
        </div>
        <div className="absolute bottom-4 left-8 bg-green-500 text-white px-2 py-1 rounded transform -rotate-1 border-2 border-black text-xs font-bold">
          APPROVED BY MOM
        </div>

        <div className="relative z-10">
          <h2 className="text-4xl font-black text-yellow-300 mb-6 transform -rotate-1">
            CARTMAN&apos;S APPROVED TOPICS
          </h2>
          <p className="text-lg text-gray-200 mb-6">
            Pick a topic I&apos;ve already mastered, or dare to challenge me with your own!
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6 mt-8">
            {DEBATE_TOPICS.map((topic, idx) => (
              <button
                key={topic}
                onClick={() => {
                  onTopicSelect(topic);
                  onCustomTopicChange('');
                }}
                className={`p-4 rounded-lg border-4 transition-all transform hover:rotate-1 ${
                  selectedTopic === topic && !customTopic
                    ? 'border-yellow-400 bg-yellow-400/30 scale-105 rotate-2'
                    : 'border-white bg-black/30 hover:border-yellow-400/70'
                }`}
                style={{ '--rotation': `${(idx % 5 - 2) * 0.5}deg` } as React.CSSProperties}
              >
                <div className="font-bold text-white">{topic}</div>
              </button>
            ))}
          </div>

          <div className="bg-black/50 p-4 rounded-xl border-2 border-yellow-400 transform rotate-1">
            <h3 className="text-xl font-bold text-yellow-400 mb-3 text-center">
              💀 CUSTOM DEATH TOPIC 💀
            </h3>
            <input
              type="text"
              placeholder="Type your own topic if you think you're brave enough..."
              value={customTopic}
              onChange={(e) => {
                onCustomTopicChange(e.target.value);
                onTopicSelect('');
              }}
              className="w-full p-4 rounded-lg bg-black/70 border-2 border-gray-600 focus:border-yellow-400 focus:outline-none text-white font-bold transform hover:rotate-1 transition-all"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default TopicSelector;