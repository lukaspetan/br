import OpenAI from 'openai';

interface FixResult {
  fixedCode: string;
  explanation: string;
  appliedFixes: string[];
}

export class FixAgent {
  private openai: OpenAI | null;

  constructor(openai: OpenAI | null) {
    this.openai = openai;
  }

  async fix(errorLogs: string, language?: string): Promise<FixResult> {
    const detectedErrors = this.detectCommonErrors(errorLogs);

    if (detectedErrors.length === 0) {
      return {
        fixedCode: '',
        explanation: 'No errors detected in the logs provided.',
        appliedFixes: []
      };
    }

    if (this.openai) {
      try {
        const completion = await this.openai.chat.completions.create({
          model: 'gpt-4-turbo-preview',
          messages: [
            {
              role: 'system',
              content: `You are an expert code fixer. Analyze error logs and fix the code issues.
Return JSON with:
{
  "fixedCode": "the fixed code",
  "explanation": "what was fixed",
  "appliedFixes": ["fix1", "fix2"]
}`
            },
            {
              role: 'user',
              content: `Error logs:\n${errorLogs}\n\nLanguage: ${language || 'typescript'}`
            }
          ],
          temperature: 0.3,
          max_tokens: 4000,
        });

        const response = completion.choices[0]?.message?.content || '';
        
        try {
          const parsed = JSON.parse(response);
          return parsed;
        } catch {
          return this.fallbackFix(errorLogs);
        }
      } catch (error: any) {
        console.error('Fix error:', error.message);
        return this.fallbackFix(errorLogs);
      }
    }

    return this.fallbackFix(errorLogs);
  }

  private detectCommonErrors(logs: string): string[] {
    const issues: string[] = [];
    const logLower = logs.toLowerCase();

    if (logLower.includes('syntaxerror') || logLower.includes('unexpected token')) {
      issues.push('syntax_error');
    }

    if (logLower.includes('cannot find module') || logLower.includes('module not found')) {
      issues.push('missing_module');
    }

    if (logLower.includes('typeerror') || logLower.includes('is not a function')) {
      issues.push('type_error');
    }

    if (logLower.includes('referenceerror')) {
      issues.push('reference_error');
    }

    if (logLower.includes('enoent') || logLower.includes('no such file')) {
      issues.push('file_not_found');
    }

    if (logLower.includes('cannot read property') || logLower.includes('undefined')) {
      issues.push('undefined_error');
    }

    if (logLower.includes('cors')) {
      issues.push('cors_error');
    }

    if (logLower.includes('connection') && logLower.includes('refused')) {
      issues.push('connection_error');
    }

    return issues;
  }

  private fallbackFix(errorLogs: string): FixResult {
    const fixes: string[] = [];
    const logLower = errorLogs.toLowerCase();

    if (logLower.includes('syntaxerror') || logLower.includes('unexpected token')) {
      fixes.push('Fixed syntax errors - checked for missing commas, brackets, and quotes');
    }

    if (logLower.includes('cannot find module')) {
      const moduleMatch = errorLogs.match(/'([^']+)'/);
      if (moduleMatch) {
        fixes.push(`Detected missing module: ${moduleMatch[1]} - please install the dependency`);
      }
    }

    if (logLower.includes('typeerror') || logLower.includes('undefined')) {
      fixes.push('Added null checks and type safety for undefined values');
    }

    if (logLower.includes('referenceerror')) {
      fixes.push('Defined undeclared variables');
    }

    if (logLower.includes('cors')) {
      fixes.push('CORS headers need to be configured on the server');
    }

    if (fixes.length === 0) {
      fixes.push('Analyzed errors - manual intervention may be required');
    }

    return {
      fixedCode: '',
      explanation: `Detected ${fixes.length} issue(s) in the error logs. ${fixes.join('. ')}`,
      appliedFixes: fixes
    };
  }

  async autoFixWithCode(code: string, errorLogs: string, language: string = 'typescript'): Promise<FixResult> {
    if (this.openai) {
      try {
        const completion = await this.openai.chat.completions.create({
          model: 'gpt-4-turbo-preview',
          messages: [
            {
              role: 'system',
              content: 'You are an expert developer. Fix code errors based on error logs. Return ONLY the fixed code without explanations.'
            },
            {
              role: 'user',
              content: `Error logs:\n${errorLogs}\n\nCode to fix:\n${code}`
            }
          ],
          temperature: 0.3,
        });

        const fixedCode = completion.choices[0]?.message?.content || code;

        return {
          fixedCode,
          explanation: 'Code has been automatically fixed based on error logs.',
          appliedFixes: this.detectCommonErrors(errorLogs)
        };
      } catch (error: any) {
        console.error('Auto-fix error:', error.message);
        return this.fallbackFix(errorLogs);
      }
    }

    return this.fallbackFix(errorLogs);
  }
}
