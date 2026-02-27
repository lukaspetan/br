import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Editor from '@monaco-editor/react';
import {
  Zap,
  Send,
  Loader2,
  Rocket,
  Download,
  X,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Eye,
  Code2,
  MessageSquare,
  Bot
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useProjectStore } from '@/stores/projectStore';
import { useAIStore } from '@/stores/aiStore';

type Tab = 'chat' | 'code' | 'preview';

export default function EditorPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const {
    currentProject,
    code,
    isLoading: isProjectLoading,
    isGenerating,
    isDeploying,
    fetchProject,
    generateCode,
    updateCode,
    publishProject,
  } = useProjectStore();

  const {
    messages,
    isLoading: isAiLoading,
    isAiAvailable,
    sendMessage,
    checkAIHealth,
    clearMessages,
  } = useAIStore();

  const [activeTab, setActiveTab] = useState<Tab>('chat');
  const [chatInput, setChatInput] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (projectId) {
      fetchProject(projectId);
      checkAIHealth();
    }
  }, [projectId, fetchProject, checkAIHealth]);

  const handleGenerateCode = useCallback(async () => {
    if (!projectId) return;
    
    const lastUserMessage = messages.filter(m => m.role === 'user').pop()?.content;
    const prompt = lastUserMessage || `Create a ${currentProject?.type || 'saas'} application: ${currentProject?.description}`;

    try {
      await generateCode(projectId, prompt);
      toast.success('Code generated successfully!');
      setActiveTab('code');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to generate code');
    }
  }, [projectId, currentProject, messages, generateCode]);

  const handleChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || isAiLoading) return;

    const userMessage = chatInput.trim();
    setChatInput('');

    try {
      await sendMessage(projectId!, userMessage);
      
      if (userMessage.toLowerCase().includes('generate') || 
          userMessage.toLowerCase().includes('create') ||
          userMessage.toLowerCase().includes('build')) {
        await handleGenerateCode();
      }
    } catch (error) {
      console.error('Chat error:', error);
    }
  };

  const handleSaveCode = async () => {
    if (!projectId || !code) return;
    setIsSaving(true);
    try {
      await updateCode(projectId, code);
      toast.success('Code saved!');
    } catch (error) {
      toast.error('Failed to save code');
    } finally {
      setIsSaving(false);
    }
  };

  const handlePublish = async () => {
    if (!projectId) return;
    try {
      await publishProject(projectId);
      toast.success('App published successfully!');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to publish');
    }
  };

  if (isProjectLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-vortex-500 animate-spin" />
      </div>
    );
  }

  if (!currentProject) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Project not found</h2>
          <button onClick={() => navigate('/dashboard')} className="btn btn-primary">
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-64px)] flex flex-col bg-slate-900">
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700 bg-slate-800/50">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/dashboard')}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          <div>
            <h2 className="font-semibold">{currentProject.name}</h2>
            <p className="text-xs text-slate-400">
              {currentProject.status === 'deployed' && currentProject.publishedUrl ? (
                <a
                  href={currentProject.publishedUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-vortex-400 hover:underline flex items-center gap-1"
                >
                  {currentProject.publishedUrl}
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              ) : (
                <span className="flex items-center gap-1">
                  <span className={`w-2 h-2 rounded-full ${
                    currentProject.status === 'deployed' ? 'bg-green-500' :
                    currentProject.status === 'building' ? 'bg-yellow-500' :
                    currentProject.status === 'error' ? 'bg-red-500' :
                    'bg-slate-500'
                  }`} />
                  {currentProject.status}
                </span>
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs ${
            isAiAvailable ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'
          }`}>
            <Bot className="w-3 h-3" />
            {isAiAvailable ? 'AI Online' : 'AI Offline'}
          </div>
          
          <button
            onClick={handleSaveCode}
            disabled={isSaving || !code}
            className="btn btn-ghost text-sm"
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            Save
          </button>
          <button
            onClick={handleGenerateCode}
            disabled={isGenerating}
            className="btn btn-secondary text-sm"
          >
            {isGenerating ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Zap className="w-4 h-4" />
            )}
            Generate
          </button>
          <button
            onClick={handlePublish}
            disabled={isDeploying || !code || currentProject.status === 'deployed'}
            className="btn btn-primary text-sm"
          >
            {isDeploying ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : currentProject.status === 'deployed' ? (
              <CheckCircle className="w-4 h-4" />
            ) : (
              <Rocket className="w-4 h-4" />
            )}
            {currentProject.status === 'deployed' ? 'Published' : 'Publish'}
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        <div className="w-80 border-r border-slate-700 bg-slate-800/30 flex flex-col">
          <div className="flex border-b border-slate-700">
            <button
              onClick={() => setActiveTab('chat')}
              className={`flex-1 px-4 py-3 text-sm font-medium flex items-center justify-center gap-2 ${
                activeTab === 'chat'
                  ? 'text-vortex-400 border-b-2 border-vortex-500'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <MessageSquare className="w-4 h-4" />
              AI Chat
            </button>
            <button
              onClick={() => setActiveTab('code')}
              className={`flex-1 px-4 py-3 text-sm font-medium flex items-center justify-center gap-2 ${
                activeTab === 'code'
                  ? 'text-vortex-400 border-b-2 border-vortex-500'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Code2 className="w-4 h-4" />
              Code
            </button>
          </div>

          <div className="flex-1 overflow-hidden">
            <AnimatePresence mode="wait">
              {activeTab === 'chat' && (
                <motion.div
                  key="chat"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="h-full flex flex-col"
                >
                  <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {messages.length === 0 ? (
                      <div className="text-center py-8">
                        <Bot className="w-12 h-12 text-vortex-500 mx-auto mb-4" />
                        <p className="text-slate-400 text-sm mb-2">
                          Hi! I'm your AI assistant
                        </p>
                        <p className="text-slate-500 text-xs">
                          Tell me what you want to build
                        </p>
                      </div>
                    ) : (
                      messages.map((msg, i) => (
                        <div
                          key={i}
                          className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-[85%] p-3 rounded-lg text-sm ${
                              msg.role === 'user'
                                ? 'bg-vortex-600 text-white'
                                : 'bg-slate-700 text-slate-200'
                            }`}
                          >
                            {msg.content}
                          </div>
                        </div>
                      ))
                    )}
                    {isAiLoading && (
                      <div className="flex justify-start">
                        <div className="bg-slate-700 p-3 rounded-lg">
                          <Loader2 className="w-4 h-4 text-vortex-400 animate-spin" />
                        </div>
                      </div>
                    )}
                  </div>

                  <form onSubmit={handleChat} className="p-4 border-t border-slate-700">
                    <div className="relative">
                      <input
                        type="text"
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        placeholder="Describe your app..."
                        className="input pr-11"
                      />
                      <button
                        type="submit"
                        disabled={!chatInput.trim() || isAiLoading}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-vortex-400 hover:text-vortex-300 disabled:opacity-50"
                      >
                        <Send className="w-4 h-4" />
                      </button>
                    </div>
                  </form>
                </motion.div>
              )}

              {activeTab === 'code' && (
                <motion.div
                  key="code"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="h-full"
                >
                  <Editor
                    height="100%"
                    defaultLanguage="json"
                    theme="vs-dark"
                    value={code}
                    onChange={(value) => {
                      if (value !== undefined) {
                        useProjectStore.setState({ code: value });
                      }
                    }}
                    options={{
                      minimap: { enabled: false },
                      fontSize: 13,
                      lineNumbers: 'on',
                      scrollBeyondLastLine: false,
                      automaticLayout: true,
                      tabSize: 2,
                      wordWrap: 'on',
                    }}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <div className="flex-1 flex flex-col bg-slate-900">
          <div className="flex-1 flex items-center justify-center">
            {code ? (
              <div className="w-full h-full flex flex-col">
                <div className="px-4 py-2 border-b border-slate-700 bg-slate-800/50 flex items-center justify-between">
                  <span className="text-sm text-slate-400">Preview</span>
                  <button className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded transition-colors">
                    <RefreshCw className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex-1 bg-white">
                  <iframe
                    srcDoc={`<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body>
  <div class="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
    <div class="text-center p-8">
      <div class="w-20 h-20 bg-gradient-to-br from-vortex-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
        <svg class="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>
        </svg>
      </div>
      <h1 class="text-4xl font-bold text-gray-900 mb-4">${currentProject.name}</h1>
      <p class="text-gray-600 mb-8 max-w-md">${currentProject.description}</p>
      <button class="px-6 py-3 bg-gradient-to-r from-vortex-500 to-purple-600 text-white rounded-lg hover:opacity-90 transition-opacity">
        Get Started
      </button>
    </div>
  </div>
</body>
</html>`}
                    className="w-full h-full border-0"
                    title="Preview"
                  />
                </div>
              </div>
            ) : (
              <div className="text-center">
                <Eye className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No preview available</h3>
                <p className="text-slate-400 mb-4">
                  Generate code first to see a preview
                </p>
                <button
                  onClick={handleGenerateCode}
                  disabled={isGenerating}
                  className="btn btn-primary"
                >
                  {isGenerating ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Zap className="w-5 h-5" />
                  )}
                  Generate Code
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
