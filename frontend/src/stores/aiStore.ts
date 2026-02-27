import { create } from 'zustand';
import { aiApi } from '@/lib/api';

export interface ChatMessage {
  role: 'user' | 'ai';
  content: string;
  timestamp?: string;
}

export interface ProjectAnalysis {
  files: number;
  lines: number;
  languages: string[];
  complexity: 'low' | 'medium' | 'high';
  issues: Array<{
    severity: 'error' | 'warning' | 'info';
    message: string;
    file?: string;
    line?: number;
  }>;
  suggestions: string[];
}

interface AIState {
  messages: ChatMessage[];
  isLoading: boolean;
  isAiAvailable: boolean;
  analysis: ProjectAnalysis | null;
  sendMessage: (projectId: string, message: string) => Promise<string>;
  analyzeProject: (projectId: string) => Promise<ProjectAnalysis | null>;
  generateCode: (projectId: string, prompt: string) => Promise<string>;
  fixErrors: (errorLogs: string) => Promise<string>;
  clearMessages: () => void;
  checkAIHealth: () => Promise<void>;
}

export const useAIStore = create<AIState>((set, get) => ({
  messages: [],
  isLoading: false,
  isAiAvailable: false,
  analysis: null,

  checkAIHealth: async () => {
    try {
      const response = await aiApi.get('/health');
      set({ isAiAvailable: response.data.status === 'ok' });
    } catch (error) {
      console.error('AI not available:', error);
      set({ isAiAvailable: false });
    }
  },

  sendMessage: async (projectId: string, message: string): Promise<string> => {
    set({ isLoading: true });
    
    try {
      const response = await aiApi.post('/api/ai/chat', {
        projectId,
        message,
        context: {
          conversationHistory: get().messages,
        },
      });

      const aiResponse = response.data.data?.response || 'AI is thinking...';
      
      set((state) => ({
        messages: [
          ...state.messages,
          { role: 'user', content: message, timestamp: new Date().toISOString() },
          { role: 'ai', content: aiResponse, timestamp: new Date().toISOString() },
        ],
        isLoading: false,
      }));

      return aiResponse;
    } catch (error: any) {
      set({ isLoading: false });
      console.error('Chat error:', error);
      
      const fallbackResponse = getFallbackResponse(message);
      
      set((state) => ({
        messages: [
          ...state.messages,
          { role: 'user', content: message, timestamp: new Date().toISOString() },
          { role: 'ai', content: fallbackResponse, timestamp: new Date().toISOString() },
        ],
      }));
      
      return fallbackResponse;
    }
  },

  analyzeProject: async (projectId: string): Promise<ProjectAnalysis | null> => {
    try {
      const response = await aiApi.post('/api/ai/analyze', { projectId });
      const analysis = response.data.data;
      set({ analysis });
      return analysis;
    } catch (error) {
      console.error('Analyze error:', error);
      return null;
    }
  },

  generateCode: async (projectId: string, prompt: string): Promise<string> => {
    set({ isLoading: true });
    
    try {
      const response = await aiApi.post('/api/ai/generate', {
        projectId,
        prompt,
      });

      set({ isLoading: false });
      return response.data.data?.code || '';
    } catch (error: any) {
      set({ isLoading: false });
      console.error('Generate error:', error);
      throw error;
    }
  },

  fixErrors: async (errorLogs: string): Promise<string> => {
    try {
      const response = await aiApi.post('/api/ai/fix', {
        errorLogs,
      });

      return response.data.data?.fixedCode || '';
    } catch (error: any) {
      console.error('Fix error:', error);
      throw error;
    }
  },

  clearMessages: () => {
    set({ messages: [], analysis: null });
  },
}));

function getFallbackResponse(message: string): string {
  const lower = message.toLowerCase();
  
  if (lower.includes('generate') || lower.includes('create') || lower.includes('build')) {
    return `I'd be happy to help you generate code! 

I'll create a complete application based on your requirements. Click the "Generate" button and I'll build it for you!`;
  }

  if (lower.includes('deploy') || lower.includes('publish')) {
    return `To deploy your application, click the "Publish" button in the editor. 

I'll build and deploy your app to production with a public URL and SSL certificate.`;
  }

  if (lower.includes('fix') || lower.includes('error')) {
    return `I'll help you fix any errors! When you encounter issues during build or deployment, I'll automatically detect and fix them.`;
  }

  if (lower.includes('help')) {
    return `I can help you with:

1. **Generate Code** - Create complete applications
2. **Fix Errors** - Auto-fix build issues
3. **Deploy** - Publish to production
4. **Explain** - Explain how code works

What would you like to do?`;
  }

  return `I'm here to help you build your application! Tell me what you'd like to create or ask me anything about development.`;
}
