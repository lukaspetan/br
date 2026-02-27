import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { Project } from '../projects/entities/project.entity';

interface CodeGenerationContext {
  projectType: string;
  projectName: string;
  projectDescription: string;
  existingCode?: string;
}

@Injectable()
export class AiService {
  private readonly coreAiUrl: string;
  private readonly aiApiKey: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
  ) {
    this.coreAiUrl = this.configService.get('CORE_AI_URL') || 'http://localhost:3003';
    this.aiApiKey = this.configService.get('AI_API_KEY') || '';
  }

  async generateCode(prompt: string, project: Project): Promise<string> {
    const context: CodeGenerationContext = {
      projectType: project.type || 'saas',
      projectName: project.name,
      projectDescription: project.description,
      existingCode: project.generatedCode || undefined,
    };

    try {
      const response = await this.httpService.axiosRef.post(
        `${this.coreAiUrl}/api/ai/generate`,
        {
          projectId: project.id,
          prompt,
          context,
          options: {
            framework: 'react-vite',
            database: 'postgresql',
            styling: 'tailwindcss',
          },
        },
        {
          headers: {
            'Content-Type': 'application/json',
            ...(this.aiApiKey && { 'Authorization': `Bearer ${this.aiApiKey}` }),
          },
          timeout: 300000,
        },
      );

      return response.data.data?.code || '';
    } catch (error: any) {
      console.error('AI Code Generation Error:', error.message);
      throw new Error(`Failed to generate code: ${error.message}`);
    }
  }

  async improveCode(prompt: string, code: string, language: string = 'typescript'): Promise<string> {
    try {
      const response = await this.httpService.axiosRef.post(
        `${this.coreAiUrl}/api/ai/refactor`,
        {
          prompt,
          code,
          language,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            ...(this.aiApiKey && { 'Authorization': `Bearer ${this.aiApiKey}` }),
          },
          timeout: 120000,
        },
      );

      return response.data.data?.refactoredCode || code;
    } catch (error: any) {
      console.error('AI Code Improvement Error:', error.message);
      throw new Error(`Failed to improve code: ${error.message}`);
    }
  }

  async fixErrors(code: string, errorLogs: string, language: string = 'typescript'): Promise<string> {
    try {
      const response = await this.httpService.axiosRef.post(
        `${this.coreAiUrl}/api/ai/fix`,
        {
          errorLogs,
          language,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            ...(this.aiApiKey && { 'Authorization': `Bearer ${this.aiApiKey}` }),
          },
          timeout: 120000,
        },
      );

      return response.data.data?.fixedCode || '';
    } catch (error: any) {
      console.error('AI Code Fix Error:', error.message);
      throw new Error(`Failed to fix code: ${error.message}`);
    }
  }

  async chat(projectId: string, message: string, conversationHistory: Array<{ role: string; content: string }> = []): Promise<{ response: string; action?: string }> {
    try {
      const response = await this.httpService.axiosRef.post(
        `${this.coreAiUrl}/api/ai/chat`,
        {
          projectId,
          message,
          context: { conversationHistory },
        },
        {
          headers: {
            'Content-Type': 'application/json',
            ...(this.aiApiKey && { 'Authorization': `Bearer ${this.aiApiKey}` }),
          },
          timeout: 60000,
        },
      );

      return response.data.data || { response: response.data.data?.response || 'AI is thinking...' };
    } catch (error: any) {
      console.error('AI Chat Error:', error.message);
      throw new Error(`Failed to chat with AI: ${error.message}`);
    }
  }

  async explainCode(code: string): Promise<string> {
    try {
      const response = await this.httpService.axiosRef.post(
        `${this.coreAiUrl}/api/ai/explain`,
        { code },
        {
          headers: {
            'Content-Type': 'application/json',
          },
          timeout: 30000,
        },
      );

      return response.data.data?.explanation || 'Unable to explain code';
    } catch (error: any) {
      console.error('AI Explain Error:', error.message);
      throw new Error(`Failed to explain code: ${error.message}`);
    }
  }

  async analyzeProject(projectId: string): Promise<any> {
    try {
      const response = await this.httpService.axiosRef.post(
        `${this.coreAiUrl}/api/ai/analyze`,
        { projectId },
        {
          headers: {
            'Content-Type': 'application/json',
          },
          timeout: 30000,
        },
      );

      return response.data.data;
    } catch (error: any) {
      console.error('AI Analyze Error:', error.message);
      throw new Error(`Failed to analyze project: ${error.message}`);
    }
  }
}
