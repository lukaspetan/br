import express, { Request, Response } from 'express';
import { VortexAI } from './core/VortexAI';

const app = express();
const vortexAI = new VortexAI();

app.use(express.json({ limit: '50mb' }));

app.get('/health', (req: Request, res: Response) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    capabilities: [
      'code-generation',
      'code-editing',
      'error-fixing',
      'auto-deployment',
      'project-management',
      'natural-language-chat'
    ]
  });
});

app.post('/api/ai/chat', async (req: Request, res: Response) => {
  try {
    const { projectId, message, context } = req.body;
    
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const result = await vortexAI.chat(projectId, message, context);
    
    res.json(result);
  } catch (error: any) {
    console.error('Chat error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/ai/generate', async (req: Request, res: Response) => {
  try {
    const { projectId, prompt, options } = req.body;
    
    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    const result = await vortexAI.generateProject(projectId, prompt, options);
    
    res.json(result);
  } catch (error: any) {
    console.error('Generation error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/ai/fix', async (req: Request, res: Response) => {
  try {
    const { projectId, errorLogs, language } = req.body;
    
    if (!errorLogs) {
      return res.status(400).json({ error: 'Error logs are required' });
    }

    const result = await vortexAI.fixErrors(projectId, errorLogs, language);
    
    res.json(result);
  } catch (error: any) {
    console.error('Fix error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/ai/deploy', async (req: Request, res: Response) => {
  try {
    const { projectId } = req.body;
    
    if (!projectId) {
      return res.status(400).json({ error: 'Project ID is required' });
    }

    const result = await vortexAI.deployProject(projectId);
    
    res.json(result);
  } catch (error: any) {
    console.error('Deploy error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/ai/explain', async (req: Request, res: Response) => {
  try {
    const { code, language } = req.body;
    
    if (!code) {
      return res.status(400).json({ error: 'Code is required' });
    }

    const result = await vortexAI.explainCode(code, language);
    
    res.json(result);
  } catch (error: any) {
    console.error('Explain error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/ai/refactor', async (req: Request, res: Response) => {
  try {
    const { projectId, prompt, code } = req.body;
    
    if (!prompt || !code) {
      return res.status(400).json({ error: 'Prompt and code are required' });
    }

    const result = await vortexAI.refactorCode(projectId, prompt, code);
    
    res.json(result);
  } catch (error: any) {
    console.error('Refactor error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/ai/analyze', async (req: Request, res: Response) => {
  try {
    const { projectId } = req.body;
    
    if (!projectId) {
      return res.status(400).json({ error: 'Project ID is required' });
    }

    const result = await vortexAI.analyzeProject(projectId);
    
    res.json(result);
  } catch (error: any) {
    console.error('Analyze error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/ai/execute', async (req: Request, res: Response) => {
  try {
    const { projectId, command } = req.body;
    
    if (!command) {
      return res.status(400).json({ error: 'Command is required' });
    }

    const result = await vortexAI.executeCommand(projectId, command);
    
    res.json(result);
  } catch (error: any) {
    console.error('Execute error:', error);
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`🧠 Vortex44 Core AI running on port ${PORT}`);
  console.log(`✨ Capabilities: code-generation, code-editing, error-fixing, auto-deployment`);
});
