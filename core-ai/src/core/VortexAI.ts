import OpenAI from 'openai';
import { AgentContext, ToolResult, ChatMessage, GenerationOptions, CodeAnalysis } from './types';
import { CodeAgent } from './agents/CodeAgent';
import { FixAgent } from './agents/FixAgent';
import { DeployAgent } from './agents/DeployAgent';
import { AnalyzeAgent } from './agents/AnalyzeAgent';
import { ChatAgent } from './agents/ChatAgent';
import axios from 'axios';

export class VortexAI {
  private openai: OpenAI | null = null;
  private codeAgent: CodeAgent;
  private fixAgent: FixAgent;
  private deployAgent: DeployAgent;
  private analyzeAgent: AnalyzeAgent;
  private chatAgent: ChatAgent;
  private conversationHistory: Map<string, ChatMessage[]> = new Map();

  constructor() {
    const apiKey = process.env.OPENAI_API_KEY;
    
    if (apiKey && apiKey.startsWith('sk-')) {
      this.openai = new OpenAI({ apiKey });
      console.log('🤖 VortexAI initialized with OpenAI');
    } else {
      console.log('🤖 VortexAI initialized in DEMO mode');
    }

    this.codeAgent = new CodeAgent(this.openai);
    this.fixAgent = new FixAgent(this.openai);
    this.deployAgent = new DeployAgent();
    this.analyzeAgent = new AnalyzeAgent(this.openai);
    this.chatAgent = new ChatAgent(this.openai);
  }

  async chat(projectId: string, message: string, context?: Partial<AgentContext>): Promise<ToolResult> {
    try {
      const history = this.conversationHistory.get(projectId) || [];
      
      const systemMessage: ChatMessage = {
        role: 'system',
        content: this.buildSystemPrompt(context)
      };
      
      const userMessage: ChatMessage = {
        role: 'user',
        content: message,
        timestamp: new Date().toISOString()
      };

      const allMessages = [systemMessage, ...history, userMessage];
      
      let response: string;
      let shouldExecute = false;
      let action: string | null = null;

      if (this.openai) {
        const completion = await this.openai.chat.completions.create({
          model: 'gpt-4-turbo-preview',
          messages: allMessages as any,
          temperature: 0.7,
          max_tokens: 2000,
        });

        response = completion.choices[0]?.message?.content || '';

        const actionResult = await this.detectAndExecuteAction(projectId, message, context);
        if (actionResult.success && actionResult.data?.action) {
          shouldExecute = true;
          action = actionResult.data.action;
        }
      } else {
        response = this.chatAgent.generateDemoResponse(message, context);
      }

      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: response,
        timestamp: new Date().toISOString()
      };

      history.push(userMessage, assistantMessage);
      
      if (history.length > 20) {
        history.splice(0, history.length - 20);
      }
      
      this.conversationHistory.set(projectId, history);

      return {
        success: true,
        data: {
          response,
          action: action,
          shouldExecute,
          context: {
            projectId,
            conversationLength: history.length
          }
        }
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  async generateProject(projectId: string, prompt: string, options?: GenerationOptions): Promise<ToolResult> {
    try {
      const context: AgentContext = {
        projectId,
        projectName: options?.framework || 'Generated Project',
        projectDescription: prompt,
        projectType: options?.framework || 'saas',
        ...options
      };

      const code = await this.codeAgent.generate(prompt, context, options);

      return {
        success: true,
        data: {
          code,
          projectId,
          message: 'Project generated successfully'
        }
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  async fixErrors(projectId: string, errorLogs: string, language?: string): Promise<ToolResult> {
    try {
      const result = await this.fixAgent.fix(errorLogs, language);

      return {
        success: true,
        data: {
          fixedCode: result.fixedCode,
          explanation: result.explanation,
          appliedFixes: result.appliedFixes
        }
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  async deployProject(projectId: string): Promise<ToolResult> {
    try {
      const result = await this.deployAgent.deploy(projectId);

      return result;
    } catch (error: any) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  async explainCode(code: string, language?: string): Promise<ToolResult> {
    try {
      let explanation: string;

      if (this.openai) {
        const completion = await this.openai.chat.completions.create({
          model: 'gpt-4-turbo-preview',
          messages: [
            {
              role: 'system',
              content: 'You are an expert software developer. Explain code clearly and concisely.'
            },
            {
              role: 'user',
              content: `Explain this ${language || 'code'}:\n\n${code}`
            }
          ],
          temperature: 0.5,
          max_tokens: 1000
        });

        explanation = completion.choices[0]?.message?.content || 'Unable to generate explanation';
      } else {
        explanation = this.analyzeAgent.generateDemoExplanation(code);
      }

      return {
        success: true,
        data: { explanation }
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  async refactorCode(projectId: string, prompt: string, code: string): Promise<ToolResult> {
    try {
      let refactoredCode: string;

      if (this.openai) {
        const completion = await this.openai.chat.completions.create({
          model: 'gpt-4-turbo-preview',
          messages: [
            {
              role: 'system',
              content: 'You are an expert developer. Refactor code to improve quality, readability and performance.'
            },
            {
              role: 'user',
              content: `Refactor this code according to: ${prompt}\n\nCode:\n${code}`
            }
          ],
          temperature: 0.5,
          max_tokens: 4000
        });

        refactoredCode = completion.choices[0]?.message?.content || code;
      } else {
        refactoredCode = this.codeAgent.generateDemoRefactor(code, prompt);
      }

      return {
        success: true,
        data: {
          refactoredCode,
          message: 'Code refactored successfully'
        }
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  async analyzeProject(projectId: string): Promise<ToolResult> {
    try {
      const analysis = await this.analyzeAgent.analyze(projectId);

      return {
        success: true,
        data: analysis
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  async executeCommand(projectId: string, command: string): Promise<ToolResult> {
    try {
      const action = this.parseCommand(command);
      
      switch (action.type) {
        case 'generate':
          return await this.generateProject(projectId, action.payload.prompt, action.payload.options);
        case 'fix':
          return await this.fixErrors(projectId, action.payload.errorLogs, action.payload.language);
        case 'deploy':
          return await this.deployProject(projectId);
        case 'explain':
          return await this.explainCode(action.payload.code, action.payload.language);
        case 'refactor':
          return await this.refactorCode(projectId, action.payload.prompt, action.payload.code);
        case 'analyze':
          return await this.analyzeProject(projectId);
        default:
          return await this.chat(projectId, command);
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  private buildSystemPrompt(context?: Partial<AgentContext>): string {
    return `You are VortexAI, an expert AI software engineer assistant for the Vortex44 platform.

You help users:
1. Generate complete web applications from natural language descriptions
2. Fix code errors automatically
3. Deploy applications to production
4. Refactor and improve code
5. Explain code and provide suggestions
6. Answer programming questions

When a user asks you to do something that requires executing a tool (like generating code, fixing errors, deploying, etc.), you should respond that you're executing the action and then the system will handle it.

Always be helpful, clear, and concise. Provide code examples when relevant.

${context?.projectName ? `Current project: ${context.projectName}` : ''}
${context?.projectDescription ? `Description: ${context.projectDescription}` : ''}`;
  }

  private async detectAndExecuteAction(projectId: string, message: string, context?: Partial<AgentContext>): Promise<ToolResult> {
    const lowerMessage = message.toLowerCase();
    
    const actionPatterns = [
      { pattern: /generate|create|build|make/i, type: 'generate' },
      { pattern: /fix|error|bug|issue/i, type: 'fix' },
      { pattern: /deploy|publish|release/i, type: 'deploy' },
      { pattern: /explain|what does|how work/i, type: 'explain' },
      { pattern: /refactor|improve|optimize/i, type: 'refactor' },
      { pattern: /analyze|audit|check/i, type: 'analyze' },
    ];

    for (const { pattern, type } of actionPatterns) {
      if (pattern.test(message)) {
        return {
          success: true,
          data: { action: type }
        };
      }
    }

    return { success: false };
  }

  private parseCommand(command: string): { type: string; payload: any } {
    const lowerCommand = command.toLowerCase();
    
    if (lowerCommand.startsWith('generate ')) {
      return {
        type: 'generate',
        payload: { prompt: command.substring(9) }
      };
    }
    
    if (lowerCommand.startsWith('fix ')) {
      return {
        type: 'fix',
        payload: { errorLogs: command.substring(4) }
      };
    }
    
    if (lowerCommand.startsWith('deploy')) {
      return { type: 'deploy', payload: {} };
    }
    
    return { type: 'chat', payload: { message: command } };
  }
}
