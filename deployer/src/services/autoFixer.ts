export class AutoFixer {
  async fix(code: string, errorLogs: string, language: string = 'typescript'): Promise<string> {
    const commonFixes = this.detectCommonErrors(errorLogs);
    
    if (commonFixes.length === 0) {
      return code;
    }

    return this.applyFixes(code, commonFixes);
  }

  private detectCommonErrors(logs: string): string[] {
    const issues: string[] = [];

    if (logs.includes("SyntaxError") || logs.includes('Unexpected token')) {
      issues.push('syntax');
    }

    if (logs.includes("Cannot find module") || logs.includes("Module not found")) {
      issues.push('missing_dependency');
    }

    if (logs.includes("TypeError") || logs.includes("is not a function")) {
      issues.push('type');
    }

    if (logs.includes("ReferenceError")) {
      issues.push('reference');
    }

    if (logs.includes("ENOENT")) {
      issues.push('file_not_found');
    }

    return issues;
  }

  private applyFixes(code: string, issues: string[]): string {
    let fixedCode = code;

    for (const issue of issues) {
      switch (issue) {
        case 'syntax':
          fixedCode = this.fixSyntaxErrors(fixedCode);
          break;
        case 'missing_dependency':
          fixedCode = this.addDefaultDependencies(fixedCode);
          break;
        case 'type':
          fixedCode = this.fixTypeErrors(fixedCode);
          break;
        default:
          break;
      }
    }

    return fixedCode;
  }

  private fixSyntaxErrors(code: string): string {
    let fixed = code;

    fixed = fixed.replace(/,\s*]/g, ']');
    fixed = fixed.replace(/,\s*}/g, '}');
    fixed = fixed.replace(/\}\s*\}[\s\n]*\}[\s\n]*\}/g, '}}');

    return fixed;
  }

  private addDefaultDependencies(code: string): string {
    const requiredDeps = ['react', 'react-dom', 'react-router-dom'];
    
    try {
      const pkgMatch = code.match(/\{[\s\S]*"dependencies"[\s\S]*\}/);
      if (pkgMatch) {
        return code;
      }
    } catch {
      return code;
    }

    return code;
  }

  private fixTypeErrors(code: string): string {
    let fixed = code;

    fixed = fixed.replace(/\.map\(([^,]+)\s*=>/g, '.map(($1: any) =>');
    fixed = fixed.replace(/\.filter\(([^,]+)\s*=>/g, '.filter(($1: any) =>');
    fixed = fixed.replace(/\.forEach\(([^,]+)\s*=>/g, '.forEach(($1: any) =>');

    return fixed;
  }

  async detectAndFix(
    buildOutput: string,
    code: string
  ): Promise<{ fixedCode: string; wasFixed: boolean }> {
    const errorPatterns = [
      /error\s+\d+:/gi,
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
