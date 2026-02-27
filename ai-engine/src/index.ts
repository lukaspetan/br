import express, { Request, Response } from 'express';
import { CodeGenerator } from './services/codeGenerator';
import { AutoFixer } from './services/autoFixer';

const app = express();
const codeGenerator = new CodeGenerator();
const autoFixer = new AutoFixer();

app.use(express.json({ limit: '10mb' }));

app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.post('/generate', async (req: Request, res: Response) => {
  try {
    const { prompt, context, options } = req.body;
    
    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    const code = await codeGenerator.generate(prompt, context, options);
    
    res.json({ code, success: true });
  } catch (error: any) {
    console.error('Generation error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

app.post('/improve', async (req: Request, res: Response) => {
  try {
    const { prompt, code, language } = req.body;
    
    if (!prompt || !code) {
      return res.status(400).json({ error: 'Prompt and code are required' });
    }

    const improvedCode = await codeGenerator.improve(code, prompt, language);
    
    res.json({ improvedCode, success: true });
  } catch (error: any) {
    console.error('Improvement error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

app.post('/fix', async (req: Request, res: Response) => {
  try {
    const { code, errorLogs, language } = req.body;
    
    if (!code || !errorLogs) {
      return res.status(400).json({ error: 'Code and error logs are required' });
    }

    const fixedCode = await autoFixer.fix(code, errorLogs, language);
    
    res.json({ fixedCode, success: true });
  } catch (error: any) {
    console.error('Fix error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

app.post('/chat', async (req: Request, res: Response) => {
  try {
    const { projectId, message, conversationHistory } = req.body;
    
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const response = await codeGenerator.chat(message, conversationHistory || []);
    
    res.json({ response, success: true });
  } catch (error: any) {
    console.error('Chat error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

app.post('/explain', async (req: Request, res: Response) => {
  try {
    const { code } = req.body;
    
    if (!code) {
      return res.status(400).json({ error: 'Code is required' });
    }

    const explanation = await codeGenerator.explain(code);
    
    res.json({ explanation, success: true });
  } catch (error: any) {
    console.error('Explain error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`🤖 Vortex44 AI Engine running on port ${PORT}`);
});
