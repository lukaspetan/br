import OpenAI from 'openai';

export class AutoFixer {
  private openai: OpenAI | null = null;

  constructor() {
    const apiKey = process.env.OPENAI_API_KEY;
    
    if (apiKey && apiKey.startsWith('sk-')) {
      this.openai = new OpenAI({ apiKey });
    }
  }

  async fix(code: string, errorLogs: string, language: string = 'typescript'): Promise<string> {
    if (this.openai) {
      try {
        const completion = await this.openai.chat.completions.create({
          model: 'gpt-4-turbo-preview',
          messages: [
            {
              role: 'system',
              content: `You are an expert programmer. Fix the code errors based on the error logs provided. 
Return ONLY the fixed code without explanations.`
            },
            {
              role: 'user',
              content: `Error logs:\n${errorLogs}\n\nCode to fix:\n${code}`
            }
          ],
          temperature: 0.3,
        });

        const fixedCode = completion.choices[0]?.message?.content;
        
        if (fixedCode) {
          return fixedCode;
        }
      } catch (error: any) {
        console.error('Auto-fix error:', error.message);
      }
    }

    return this.fallbackFix(code, errorLogs);
  }

  private fallbackFix(code: string, errorLogs: string): string {
    const commonFixes: Array<{ pattern: RegExp; replacement: string }> = [
      { pattern: /SyntaxError: Unexpected token '}'/g, replacement: 'Check for missing commas or extra braces' },
      { pattern: /ReferenceError: (\w+) is not defined/g, replacement: 'Define $1 before using it' },
      { pattern: /TypeError: Cannot read property '(\w+)' of undefined/g, replacement: 'Add null check for the property' },
      { pattern: /Module not found: Can't resolve '(\w+)'/g, replacement: 'Install missing dependency: npm install $1' },
      { pattern: /Error: ENOENT: no such file or directory/g, replacement: 'Create missing file or directory' },
    ];

    let fixedCode = code;
    const issues: string[] = [];

    for (const error of commonFixes) {
      if (error.pattern.test(errorLogs)) {
        issues.push(error.replacement);
      }
    }

    if (issues.length > 0) {
      console.log('Detected issues:', issues);
    }

    const jsonMatch = code.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        JSON.parse(jsonMatch[0]);
      } catch (e: any) {
        const position = e.message.match(/position (\d+)/);
        if (position) {
          const idx = parseInt(position[1]);
          const before = code.substring(0, idx);
          const after = code.substring(idx);
          
          const lastComma = before.lastIndexOf(',');
          const nextComma = after.indexOf(',');
          
          if (lastComma > 0 && nextComma > 0) {
            console.log('Attempting to fix JSON syntax error');
          }
        }
      }
    }

    return fixedCode;
  }

  async detectAndFix(buildOutput: string, code: string): Promise<{ fixedCode: string; wasFixed: boolean }> {
    const errorPatterns = [
      /error (\w+):/gi,
      /Error:/gi,
      /failed/gi,
      /cannot/gi,
    ];

    const hasErrors = errorPatterns.some(pattern => pattern.test(buildOutput));

    if (!hasErrors) {
      return { fixedCode: code, wasFixed: false };
    }

    const fixedCode = await this.fix(code, buildOutput);
    
    return {
      fixedCode,
      wasFixed: fixedCode !== code
    };
  }
}
