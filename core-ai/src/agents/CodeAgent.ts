import OpenAI from 'openai';
import { AgentContext, GenerationOptions } from '../types';

export class CodeAgent {
  private openai: OpenAI | null;

  constructor(openai: OpenAI | null) {
    this.openai = openai;
  }

  async generate(prompt: string, context: AgentContext, options?: GenerationOptions): Promise<string> {
    const framework = options?.framework || 'react-vite';
    const database = options?.database || 'postgresql';
    const styling = options?.styling || 'tailwindcss';

    const systemPrompt = this.buildSystemPrompt(context, options);

    if (this.openai) {
      try {
        const completion = await this.openai.chat.completions.create({
          model: 'gpt-4-turbo-preview',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: prompt }
          ],
          temperature: 0.7,
          max_tokens: 8000,
        });

        const response = completion.choices[0]?.message?.content || '';
        
        try {
          const parsed = JSON.parse(response);
          return this.formatCodeResponse(parsed.files || [], context);
        } catch {
          return this.generateFallbackCode(prompt, context, options);
        }
      } catch (error: any) {
        console.error('OpenAI error:', error.message);
        return this.generateFallbackCode(prompt, context, options);
      }
    }

    return this.generateFallbackCode(prompt, context, options);
  }

  private buildSystemPrompt(context: AgentContext, options?: GenerationOptions): string {
    return `You are Vortex44 Code Generator, an expert full-stack developer AI.

Generate COMPLETE, PRODUCTION-READY code for web applications.

Requirements:
- Frontend: ${options?.framework || 'React + Vite'}
- Backend: Node.js/Express
- Database: ${options?.database || 'PostgreSQL'}
- Styling: ${options?.styling || 'TailwindCSS'}
- Authentication: JWT
- All code must be functional and complete

Return JSON with this exact structure:
{
  "files": [
    {
      "path": "relative/path/to/file.tsx",
      "content": "complete file content"
    }
  ],
  "description": "Brief description",
  "features": ["feature1", "feature2"]
}

Project: ${context.projectName || 'Generated Project'}
Description: ${context.projectDescription || 'AI generated application'}`;
  }

  private generateFallbackCode(prompt: string, context: AgentContext, options?: GenerationOptions): string {
    const projectName = (context.projectName || 'app').toLowerCase().replace(/\s+/g, '-');
    const files = [];

    files.push({
      path: 'package.json',
      content: JSON.stringify({
        name: projectName,
        version: '1.0.0',
        type: 'module',
        scripts: {
          dev: 'vite',
          build: 'tsc && vite build',
          preview: 'vite preview'
        },
        dependencies: {
          react: '^18.2.0',
          'react-dom': '^18.2.0',
          'react-router-dom': '^6.21.0',
          '@tanstack/react-query': '^5.17.0',
          axios: '^1.6.0',
          'lucide-react': '^0.303.0',
          'framer-motion': '^10.18.0'
        },
        devDependencies: {
          '@types/react': '^18.2.0',
          '@types/react-dom': '^18.2.0',
          '@vitejs/plugin-react': '^4.2.0',
          autoprefixer: '^10.4.16',
          postcss: '^8.4.33',
          tailwindcss: '^3.4.1',
          typescript: '^5.3.0',
          vite: '^5.0.0'
        }
      }, null, 2)
    });

    files.push({
      path: 'vite.config.ts',
      content: `import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
});`
    });

    files.push({
      path: 'tailwind.config.js',
      content: `/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: { extend: {} },
  plugins: [],
};`
    });

    files.push({
      path: 'src/App.tsx',
      content: `import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Register from './pages/Register';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <div className="min-h-screen bg-gray-50">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
          </Routes>
        </div>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;`
    });

    files.push({
      path: 'src/main.tsx',
      content: `import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);`
    });

    files.push({
      path: 'src/index.css',
      content: `@tailwind base;
@tailwind components;
@tailwind utilities;

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}`
    });

    files.push({
      path: 'src/pages/Dashboard.tsx',
      content: `import { useState } from 'react';

export default function Dashboard() {
  const [user] = useState({ name: 'User', email: 'user@example.com' });

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-gray-900">${context.projectName || 'My App'}</h1>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">{user.email}</span>
            </div>
          </div>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-medium mb-4">Welcome to ${context.projectName || 'Your App'}</h2>
            <p className="text-gray-600">${context.projectDescription || 'Your application is ready!'}</p>
          </div>
        </div>
      </main>
    </div>
  );
}`
    });

    files.push({
      path: 'src/pages/Login.tsx',
      content: `import { useState } from 'react';
import { Link } from 'react-router-dom';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Login:', { email, password });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Sign in to your account
          </h2>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <input
                type="email"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <input
                type="password"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>
          <button
            type="submit"
            className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Sign in
          </button>
        </form>
        <div className="text-center">
          <Link to="/register" className="text-indigo-600 hover:text-indigo-500">
            Don't have an account? Sign up
          </Link>
        </div>
      </div>
    </div>
  );
}`
    });

    files.push({
      path: 'src/pages/Register.tsx',
      content: `import { useState } from 'react';
import { Link } from 'react-router-dom';

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Register:', { name, email, password });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Create your account
          </h2>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <input
                type="text"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="Full name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div>
              <input
                type="email"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <input
                type="password"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>
          <button
            type="submit"
            className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Register
          </button>
        </form>
        <div className="text-center">
          <Link to="/login" className="text-indigo-600 hover:text-indigo-500">
            Already have an account? Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}`
    });

    files.push({
      path: 'index.html',
      content: `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${context.projectName || 'My App'}</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>`
    });

    files.push({
      path: 'server/package.json',
      content: JSON.stringify({
        name: `${projectName}-server`,
        version: '1.0.0',
        type: 'module',
        scripts: {
          start: 'node index.js',
          dev: 'node --watch index.js'
        },
        dependencies: {
          express: '^4.18.2',
          cors: '^2.8.5',
          jsonwebtoken: '^9.0.2',
          bcrypt: '^5.1.1'
        }
      }, null, 2)
    });

    files.push({
      path: 'server/index.js',
      content: `import express from 'express';
import cors from 'cors';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(\`Server running on port \${PORT}\`);
});`
    });

    files.push({
      path: '.env.example',
      content: `VITE_API_URL=http://localhost:3000
VITE_WS_URL=ws://localhost:3000`
    });

    files.push({
      path: 'README.md',
      content: `# ${context.projectName || 'Generated Project'}

${context.projectDescription || 'Generated by Vortex44 AI'}

## Getting Started

1. Install dependencies:
\`\`\`bash
npm install
\`\`\`

2. Start development server:
\`\`\`bash
npm run dev
\`\`\`

3. Open http://localhost:5173

## Features

- React 18 with Vite
- TailwindCSS
- React Router
- TypeScript

## Deployment

Build for production:
\`\`\`bash
npm run build
\`\`\``
    });

    return this.formatCodeResponse(files, context);
  }

  private formatCodeResponse(files: Array<{ path: string; content: string }>, context: AgentContext): string {
    return JSON.stringify({
      files,
      description: `Generated ${context.projectName || 'Application'} - ${context.projectDescription || 'AI generated'}`,
      features: ['Authentication', 'Dashboard', 'Responsive UI', 'REST API']
    }, null, 2);
  }

  generateDemoRefactor(code: string, prompt: string): string {
    return code;
  }
}
