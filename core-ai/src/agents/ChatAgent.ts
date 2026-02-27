import OpenAI from 'openai';
import { AgentContext } from '../types';

export class ChatAgent {
  private openai: OpenAI | null;

  constructor(openai: OpenAI | null) {
    this.openai = openai;
  }

  async chat(message: string, history: Array<{ role: string; content: string }>, context?: Partial<AgentContext>): Promise<string> {
    if (this.openai) {
      try {
        const messages = [
          {
            role: 'system',
            content: this.buildSystemPrompt(context)
          },
          ...history,
          {
            role: 'user',
            content: message
          }
        ];

        const completion = await this.openai.chat.completions.create({
          model: 'gpt-4-turbo-preview',
          messages: messages as any,
          temperature: 0.7,
          max_tokens: 1000,
        });

        return completion.choices[0]?.message?.content || this.generateDemoResponse(message, context);
      } catch (error: any) {
        console.error('Chat error:', error.message);
        return this.generateDemoResponse(message, context);
      }
    }

    return this.generateDemoResponse(message, context);
  }

  generateDemoResponse(message: string, context?: Partial<AgentContext>): string {
    const lowerMessage = message.toLowerCase();

    if (lowerMessage.includes('help') || lowerMessage.includes('what can you do')) {
      return `I can help you with:

1. **Generate Code** - Create complete applications from description
2. **Fix Errors** - Automatically fix code errors
3. **Deploy** - Publish your app to production
4. **Refactor** - Improve and optimize code
5. **Explain** - Explain how code works
6. **Analyze** - Check code quality

Just tell me what you need!`;
    }

    if (lowerMessage.includes('generate') || lowerMessage.includes('create') || lowerMessage.includes('build')) {
      return `I'd be happy to help you generate code! 

To create a new application, you can:

1. Go to your Dashboard
2. Click "New Project"
3. Describe what you want to build
4. I'll generate the complete code

What type of application would you like to create?`;
    }

    if (lowerMessage.includes('deploy') || lowerMessage.includes('publish')) {
      return `To deploy your application:

1. Generate code for your project first
2. Click "Publish" in the editor
3. Your app will be deployed with SSL

Would you like me to help you deploy an existing project?`;
    }

    if (lowerMessage.includes('error') || lowerMessage.includes('bug') || lowerMessage.includes('fix')) {
      return `I can help fix code errors! 

When you encounter errors:
1. Check the error logs in the editor
2. I can analyze and fix the issues automatically
3. The system will retry after deployment fixes

Would you like me to fix errors in your current project?`;
    }

    if (lowerMessage.includes('project') && context?.projectName) {
      return `Your current project is **${context.projectName}**${context.projectDescription ? `: ${context.projectDescription}` : ''}.

You can:
- Ask me to generate code
- Request edits or improvements
- Ask me to deploy it
- Get analysis of the code

What would you like to do?`;
    }

    if (lowerMessage.includes('project')) {
      return `I can help you create and manage projects!

To start:
1. Create a new project on the Dashboard
2. Describe what you want to build
3. I'll generate the code automatically

What would you like to build?`;
    }

    const responses = [
      `I'm here to help you build with AI! 

Tell me what you'd like to create - whether it's a SaaS app, website, API, or anything else.`,

      `I understand you want to work on: "${message.slice(0, 50)}${message.length > 50 ? '...' : ''}"

How can I help you today?`,

      `Great question! I can help you with:
- Generating code from descriptions
- Fixing errors automatically  
- Deploying to production
- Refactoring and improving code

What would you like to do?`
    ];

    return responses[Math.floor(Math.random() * responses.length)];
  }

  private buildSystemPrompt(context?: Partial<AgentContext>): string {
    return `You are VortexAI, an expert AI assistant for the Vortex44 platform.

Vortex44 helps users create web applications using AI.

Your role:
- Help users generate complete applications
- Fix code errors automatically
- Deploy applications to production
- Answer programming questions
- Provide technical guidance

Guidelines:
- Be helpful, clear, and concise
- Provide code examples when relevant
- Explain technical concepts simply
- Suggest best practices

Current context:
${context?.projectName ? `- Project: ${context.projectName}` : '- No active project'}
${context?.projectDescription ? `- Description: ${context.projectDescription}` : ''}
${context?.projectType ? `- Type: ${context.projectType}` : ''}`;
  }
}
