import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Character } from '@/lib/claude';
import { AIDebateScore } from '@/lib/ai-scoring';
import { characters } from '@/lib/characters';

interface DebateState {
  // Core debate data
  character: Character | null;
  topic: string;
  messages: Array<{ role: string; content: string }>;
  debateId: string;
  
  // UI states
  isLoading: boolean;
  isLoadingDebate: boolean;
  showShareToast: boolean;
  isInitialized: boolean;
  userInput: string;
  
  // Permissions
  isOwner: boolean;
  isAuthenticated: boolean;
  
  // Scoring
  debateEnded: boolean;
  debateScore: AIDebateScore | null;
  isScoringDebate: boolean;
  showScoreModal: boolean;
  
  // Rate limiting
  rateLimitError: {
    show: boolean;
    type: 'debate' | 'message';
    current: number;
    limit: number;
    message?: string;
  } | null;
}

interface UseDebateReturn {
  state: DebateState;
  refs: {
    messagesEndRef: React.RefObject<HTMLDivElement | null>;
  };
  actions: {
    loadDebate: () => Promise<void>;
    sendMessage: () => Promise<void>;
    endDebate: () => Promise<void>;
    setUserInput: (input: string) => void;
    copyShareLink: () => void;
    setShowShareToast: (show: boolean) => void;
    setDebateEnded: (ended: boolean) => void;
    setShowScoreModal: (show: boolean) => void;
    clearRateLimitError: () => void;
  };
}

export function useDebate(debateId: string): UseDebateReturn {
  const router = useRouter();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Consolidated state
  const [state, setState] = useState<DebateState>({
    // Core debate data
    character: null,
    topic: '',
    messages: [],
    debateId: debateId,
    
    // UI states
    isLoading: false,
    isLoadingDebate: true,
    showShareToast: false,
    isInitialized: false,
    userInput: '',
    
    // Permissions
    isOwner: false,
    isAuthenticated: false,
    
    // Scoring
    debateEnded: false,
    debateScore: null,
    isScoringDebate: false,
    showScoreModal: false,
    
    // Rate limiting
    rateLimitError: null,
  });

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [state.messages]);

  // Load debate from database
  const loadDebate = useCallback(async () => {
    if (state.isInitialized) return;
    
    try {
      console.log('Loading debate from database:', debateId);
      const response = await fetch(`/api/debate/${debateId}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Debate data received:', data);
        
        if (data.debate) {
          // Check if debate already has a score
          const hasScore = !!data.debate.score_data;
          
          setState(prev => ({
            ...prev,
            character: data.debate.character,
            topic: data.debate.topic,
            messages: data.debate.messages || [],
            isOwner: data.isOwner || false,
            isAuthenticated: data.isAuthenticated || false,
            isInitialized: true,
            isLoadingDebate: false,
            // If debate is already scored, set the score but don't auto-show modal
            debateEnded: hasScore,
            debateScore: hasScore ? data.debate.score_data : null,
            showScoreModal: false, // Don't auto-show modal on page load
          }));
          
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
        console.log('Debate not found, redirecting to setup');
        router.push('/debate');
      } else {
        console.error('Failed to load debate, status:', response.status);
        router.push('/debate');
      }
    } catch (error) {
      console.error('Error loading debate:', error);
      router.push('/debate');
    } finally {
      setState(prev => ({ ...prev, isLoadingDebate: false }));
    }
  }, [debateId, state.isInitialized, router]);

  // Initialize debate on mount
  useEffect(() => {
    if (debateId && !state.isInitialized) {
      loadDebate();
    }
  }, [debateId, state.isInitialized, loadDebate]);

  // Send message
  const sendMessage = useCallback(async () => {
    if (!state.userInput.trim() || state.isLoading) return;

    const newUserMessage = { role: 'user', content: state.userInput };
    const currentInput = state.userInput;
    
    setState(prev => ({
      ...prev,
      messages: [...prev.messages, newUserMessage],
      userInput: '',
      isLoading: true,
    }));

    try {
      const response = await fetch('/api/debate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          debateId: debateId,
          character: state.character,
          topic: state.topic,
          userArgument: currentInput,
          previousMessages: state.messages,
          stream: true
        })
      });

      // Check for rate limit error
      if (!response.ok) {
        const error = await response.json();
        if (response.status === 429 && error.error === 'message_limit_exceeded') {
          setState(prev => ({
            ...prev,
            messages: [...prev.messages.slice(0, -1)], // Remove the user message we just added
            userInput: currentInput, // Restore the input
            rateLimitError: {
              show: true,
              type: 'message',
              current: error.current,
              limit: error.limit,
              message: error.message
            }
          }));
          return;
        }
        throw new Error(error.error || 'Failed to send message');
      }

      if (!response.body) {
        throw new Error('No response body');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      
      // Add placeholder AI message for streaming
      setState(prev => ({
        ...prev,
        messages: [...prev.messages, { role: 'ai', content: '' }]
      }));

      let accumulatedContent = '';
      const aiMessageIndex = state.messages.length + 1;

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
                setState(prev => {
                  const newMessages = [...prev.messages];
                  newMessages[aiMessageIndex] = { role: 'ai', content: accumulatedContent };
                  return { ...prev, messages: newMessages };
                });
              } else if (data.type === 'complete') {
                setState(prev => {
                  const newMessages = [...prev.messages];
                  newMessages[aiMessageIndex] = { role: 'ai', content: data.content };
                  return { ...prev, messages: newMessages };
                });
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
      setState(prev => ({
        ...prev,
        messages: [...prev.messages, { role: 'ai', content: 'Error: Could not generate response. Try again!' }]
      }));
    } finally {
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, [state.userInput, state.isLoading, state.character, state.topic, state.messages, debateId]);

  // End debate and calculate score
  const endDebate = useCallback(async () => {
    // If already scoring, do nothing
    if (state.isScoringDebate) return;
    
    // If we already have a score, just show it without recalculating
    if (state.debateScore) {
      setState(prev => ({ ...prev, debateEnded: true, showScoreModal: true }));
      return;
    }
    
    setState(prev => ({ ...prev, isScoringDebate: true }));
    
    try {
      const characterName = characters.find(c => c.id === state.character)?.name || state.character;
      const response = await fetch('/api/score-debate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          debateId: debateId,
          characterName: characterName,
          topic: state.topic,
          messages: state.messages
        })
      });
      
      if (response.ok) {
        const score = await response.json();
        setState(prev => ({
          ...prev,
          debateScore: score,
          debateEnded: true,
          isScoringDebate: false,
          showScoreModal: true
        }));
      }
    } catch (error) {
      console.error('Error scoring debate:', error);
      setState(prev => ({ ...prev, isScoringDebate: false }));
    }
  }, [state.isScoringDebate, state.debateEnded, debateId, state.character, state.topic, state.messages]);

  // Set user input
  const setUserInput = useCallback((input: string) => {
    setState(prev => ({ ...prev, userInput: input }));
  }, []);

  // Copy share link
  const copyShareLink = useCallback(() => {
    const cleanUrl = `${window.location.origin}/debate/${debateId}`;
    navigator.clipboard.writeText(cleanUrl);
    setState(prev => ({ ...prev, showShareToast: true }));
    setTimeout(() => {
      setState(prev => ({ ...prev, showShareToast: false }));
    }, 3000);
  }, [debateId]);

  // Set show share toast
  const setShowShareToast = useCallback((show: boolean) => {
    setState(prev => ({ ...prev, showShareToast: show }));
  }, []);

  // Set debate ended state
  const setDebateEnded = useCallback((ended: boolean) => {
    setState(prev => ({ ...prev, debateEnded: ended }));
  }, []);

  // Set show score modal state
  const setShowScoreModal = useCallback((show: boolean) => {
    setState(prev => ({ ...prev, showScoreModal: show }));
  }, []);

  // Clear rate limit error
  const clearRateLimitError = useCallback(() => {
    setState(prev => ({ ...prev, rateLimitError: null }));
  }, []);

  return {
    state,
    refs: {
      messagesEndRef,
    },
    actions: {
      loadDebate,
      sendMessage,
      endDebate,
      setUserInput,
      copyShareLink,
      setShowShareToast,
      setDebateEnded,
      setShowScoreModal,
      clearRateLimitError,
    },
  };
}