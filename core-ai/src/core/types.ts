export interface AgentContext {
  projectId?: string;
  projectName?: string;
  projectDescription?: string;
  projectType?: string;
  generatedCode?: string;
  files?: Array<{ path: string; content: string }>;
  errorLogs?: string;
  conversationHistory?: Array<{ role: string; content: string }>;
  metadata?: Record<string, any>;
}

export interface ToolResult {
  success: boolean;
  data?: any;
  error?: string;
  logs?: string;
}

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp?: string;
}

export interface GenerationOptions {
  framework?: string;
  database?: string;
  styling?: string;
  features?: string[];
  deployment?: boolean;
}

export interface CodeAnalysis {
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
