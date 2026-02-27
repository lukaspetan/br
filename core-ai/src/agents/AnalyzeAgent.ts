import OpenAI from 'openai';
import axios from 'axios';
import { CodeAnalysis } from '../types';

export class AnalyzeAgent {
  private openai: OpenAI | null;
  private backendUrl: string;

  constructor(openai: OpenAI | null) {
    this.openai = openai;
    this.backendUrl = process.env.BACKEND_URL || 'http://localhost:3000';
  }

  async analyze(projectId: string): Promise<CodeAnalysis> {
    try {
      const codeResponse = await axios.get(`${this.backendUrl}/api/v1/projects/${projectId}/code`, {
        headers: { 'Content-Type': 'application/json' }
      });

      const code = codeResponse.data?.code || '';

      if (!code) {
        return {
          files: 0,
          lines: 0,
          languages: [],
          complexity: 'low',
          issues: [{
            severity: 'info',
            message: 'No code generated yet'
          }],
          suggestions: ['Generate code to see analysis']
        };
      }

      return this.analyzeCode(code);
    } catch (error: any) {
      console.error('Analyze error:', error.message);
      return this.getEmptyAnalysis();
    }
  }

  private analyzeCode(codeJson: string): CodeAnalysis {
    try {
      const parsed = JSON.parse(codeJson);
      const files = parsed.files || [];
      
      let totalLines = 0;
      const languages = new Set<string>();

      for (const file of files) {
        if (file.path) {
          const ext = file.path.split('.').pop()?.toLowerCase();
          const lang = this.getLanguageFromExt(ext || '');
          languages.add(lang);
        }
        
        if (file.content) {
          totalLines += file.content.split('\n').length;
        }
      }

      const complexity = this.calculateComplexity(files, totalLines);
      const issues = this.detectIssues(files);
      const suggestions = this.generateSuggestions(issues, complexity);

      return {
        files: files.length,
        lines: totalLines,
        languages: Array.from(languages),
        complexity,
        issues,
        suggestions
      };
    } catch (error: any) {
      return this.getEmptyAnalysis();
    }
  }

  private getLanguageFromExt(ext: string): string {
    const map: Record<string, string> = {
      ts: 'TypeScript',
      tsx: 'TypeScript/React',
      js: 'JavaScript',
      jsx: 'JavaScript/React',
      json: 'JSON',
      html: 'HTML',
      css: 'CSS',
      md: 'Markdown',
      yml: 'YAML',
      yaml: 'YAML'
    };
    return map[ext] || 'Unknown';
  }

  private calculateComplexity(files: Array<{ path: string; content: string }>, totalLines: number): 'low' | 'medium' | 'high' {
    const avgLinesPerFile = files.length > 0 ? totalLines / files.length : 0;
    
    const hasComplexFeatures = files.some(f => 
      f.path?.includes('api') || 
      f.path?.includes('database') ||
      f.path?.includes('auth')
    );

    if (avgLinesPerFile > 200 || hasComplexFeatures) {
      return 'high';
    } else if (avgLinesPerFile > 100) {
      return 'medium';
    }
    return 'low';
  }

  private detectIssues(files: Array<{ path: string; content: string }>): CodeAnalysis['issues'] {
    const issues: CodeAnalysis['issues'] = [];

    for (const file of files) {
      if (!file.content) continue;

      if (file.content.includes('console.log') && !file.content.includes('// DEBUG')) {
        issues.push({
          severity: 'warning',
          message: 'Console.log statement found',
          file: file.path
        });
      }

      if (file.content.includes('TODO') || file.content.includes('FIXME')) {
        issues.push({
          severity: 'info',
          message: 'TODO/FIXME comment found',
          file: file.path
        });
      }

      if (file.content.includes('any') && file.path?.endsWith('.ts')) {
        issues.push({
          severity: 'warning',
          message: 'Using "any" type - consider adding proper types',
          file: file.path
        });
      }

      if (file.content.length > 500 && !file.path?.includes('node_modules')) {
        issues.push({
          severity: 'info',
          message: 'Large file - consider splitting',
          file: file.path
        });
      }
    }

    return issues;
  }

  private generateSuggestions(issues: CodeAnalysis['issues'], complexity: string): string[] {
    const suggestions: string[] = [];

    if (complexity === 'high') {
      suggestions.push('Consider breaking down complex components');
      suggestions.push('Add more documentation for complex logic');
    }

    if (issues.some(i => i.severity === 'warning')) {
      suggestions.push('Fix warning issues to improve code quality');
    }

    if (!issues.some(i => i.message.includes('test'))) {
      suggestions.push('Consider adding tests for better coverage');
    }

    suggestions.push('Review and optimize bundle size');
    suggestions.push('Add error boundaries for React components');

    return suggestions;
  }

  private getEmptyAnalysis(): CodeAnalysis {
    return {
      files: 0,
      lines: 0,
      languages: [],
      complexity: 'low',
      issues: [],
      suggestions: ['Generate code to see analysis']
    };
  }

  generateDemoExplanation(code: string): string {
    const lines = code.split('\n').length;
    
    return `# Code Analysis

This code contains approximately ${lines} lines of code.

## Summary
- **Type**: Generated application
- **Status**: Ready for analysis
- **Complexity**: ${lines > 200 ? 'High' : lines > 100 ? 'Medium' : 'Low'}

## Recommendations
1. Review generated code for any specific requirements
2. Add environment variables for production
3. Set up proper authentication before deploying

*Note: Full analysis requires OpenAI API key*`;
  }
}
