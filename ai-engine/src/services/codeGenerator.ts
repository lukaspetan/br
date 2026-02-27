import OpenAI from 'openai';

interface CodeGenerationContext {
  projectType: string;
  projectName: string;
  projectDescription: string;
  existingCode?: string;
}

interface CodeGenerationOptions {
  framework?: string;
  database?: string;
  styling?: string;
  features?: string[];
}

export class CodeGenerator {
  private openai: OpenAI | null = null;

  constructor() {
    const apiKey = process.env.OPENAI_API_KEY || process.env.ANTHROPIC_API_KEY;
    
    if (apiKey && apiKey.startsWith('sk-')) {
      this.openai = new OpenAI({ apiKey });
    } else {
      console.log('🤖 AI Engine running in demo mode (no OpenAI key)');
    }
  }

  async generate(
    prompt: string,
    context: CodeGenerationContext,
    options: CodeGenerationOptions = {}
  ): Promise<string> {
    const framework = options.framework || 'react-vite';
    const database = options.database || 'postgresql';
    const styling = options.styling || 'tailwindcss';

    const systemPrompt = `You are Vortex44, an expert full-stack developer AI. Your task is to generate complete, production-ready code for web applications based on natural language descriptions.

Generate a complete ${framework} application with the following:
- Frontend: React with ${styling}
- Backend: Node.js/Express or API routes
- Database: ${database} schema
- Authentication: User auth system
- All necessary components, pages, and API endpoints

The code should be complete and functional. Include:
1. Project structure with package.json
2. Frontend components (App.tsx, pages, components)
3. Backend API routes
4. Database schema/models
5. Environment configuration
6. Docker configuration for deployment

Return ONLY a JSON object with this exact structure:
{
  "files": [
    {
      "path": "relative/path/to/file.tsx",
      "content": "file content here"
    }
  ],
  "description": "Brief description of what was generated",
  "features": ["feature1", "feature2"]
}

Generate code for: ${context.projectName} - ${context.projectDescription}`;

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
          return this.filesToJsonString(parsed.files || [], context.projectName, context.projectDescription);
        } catch {
          return this.generateFallbackCode(prompt, context, options);
        }
      } catch (error: any) {
        console.error('OpenAI API error:', error.message);
        return this.generateFallbackCode(prompt, context, options);
      }
    }

    return this.generateFallbackCode(prompt, context, options);
  }

  private generateFallbackCode(
    prompt: string,
    context: CodeGenerationContext,
    options: CodeGenerationOptions
  ): string {
    const projectName = context.projectName.toLowerCase().replace(/\s+/g, '-');
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
  theme: {
    extend: {},
  },
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
              <h1 className="text-xl font-bold text-gray-900">${context.projectName}</h1>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">{user.email}</span>
            </div>
          </div>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <h3 className="text-lg font-medium text-gray-900">Welcome</h3>
                <p className="mt-2 text-sm text-gray-500">
                  ${context.projectDescription}
                </p>
              </div>
            </div>
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
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${context.projectName}</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>`
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
      path: 'server/package.json',
      content: JSON.stringify({
        name: `${projectName}-server`,
        version: '1.0.0',
        type: 'module',
        main: 'index.js',
        scripts: {
          start: 'node index.js',
          dev: 'node --watch index.js'
        },
        dependencies: {
          express: '^4.18.2',
          cors: '^2.8.5'
        }
      }, null, 2)
    });

    files.push({
      path: 'Dockerfile',
      content: `FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

EXPOSE 5173

CMD ["npm", "run", "dev"]`
    });

    files.push({
      path: '.env.example',
      content: `VITE_API_URL=http://localhost:3000
VITE_WS_URL=ws://localhost:3000`
    });

    files.push({
      path: 'README.md',
      content: `# ${context.projectName}

${context.projectDescription}

## Getting Started

1. Install dependencies:
   \`\`\`bash
   npm install
   \`\`\`

2. Start the development server:
   \`\`\`bash
   npm run dev
   \`\`\`

3. Open http://localhost:5173

## Features

- React 18 with Vite
- TailwindCSS for styling
- React Router for navigation
- TypeScript support
- Production-ready structure

## Deployment

Build for production:
\`\`\`bash
npm run build
\`\`\`
`
    });

    return this.filesToJsonString(files, context.projectName, context.projectDescription);
  }

  private filesToJsonString(files: Array<{ path: string; content: string }>, projectName?: string, projectDescription?: string): string {
    return JSON.stringify({
      files,
      description: `Generated ${projectName || 'Application'} - ${projectDescription || 'AI generated'}`,
      features: ['Authentication', 'Dashboard', 'Responsive UI', 'REST API Ready']
    }, null, 2);
  }

  async improve(code: string, prompt: string, language?: string): Promise<string> {
    return code;
  }

  async chat(message: string, history: Array<{ role: string; content: string }>): Promise<string> {
    if (this.openai) {
      try {
        const messages = [
          { role: 'system', content: 'You are Vortex44 AI, a helpful assistant for software development.' },
          ...history,
          { role: 'user', content: message }
        ];

        const completion = await this.openai.chat.completions.create({
          model: 'gpt-4-turbo-preview',
          messages: messages as any,
        });

        return completion.choices[0]?.message?.content || 'I can help you build your application!';
      } catch (error: any) {
        console.error('Chat error:', error.message);
      }
    }

    return `I understand you want: "${message}". 

I can help you build this! Here's what I'll do:

1. **Generate Code** - Create a complete application structure based on your requirements
2. **Auto-Fix Errors** - If there are any issues, I'll detect and fix them automatically
3. **Deploy** - Publish your app with one click

What specific features would you like in your application?`;
  }

  async explain(code: string): Promise<string> {
    if (this.openai) {
      try {
        const completion = await this.openai.chat.completions.create({
          model: 'gpt-4-turbo-preview',
          messages: [
            { role: 'system', content: 'Explain the following code in a clear, concise way.' },
            { role: 'user', content: code }
          ],
        });

        return completion.choices[0]?.message?.content || 'Code explanation';
      } catch (error: any) {
        console.error('Explain error:', error.message);
      }
    }

    return 'Code analysis would be available with an OpenAI API key.';
  }
}
