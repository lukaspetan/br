import { create } from 'zustand';
import api from '@/lib/api';

export interface Project {
  id: string;
  name: string;
  description: string;
  type: 'saas' | 'website' | 'api' | 'dashboard';
  status: 'draft' | 'building' | 'deployed' | 'error';
  subdomain?: string;
  customDomain?: string;
  publishedUrl?: string;
  createdAt: string;
  updatedAt: string;
}

interface ProjectState {
  projects: Project[];
  currentProject: Project | null;
  code: string;
  isLoading: boolean;
  isGenerating: boolean;
  isDeploying: boolean;
  fetchProjects: () => Promise<void>;
  fetchProject: (id: string) => Promise<void>;
  createProject: (name: string, description: string, type?: string) => Promise<Project>;
  generateCode: (projectId: string, prompt: string) => Promise<void>;
  updateCode: (projectId: string, code: string) => Promise<void>;
  publishProject: (projectId: string) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
}

export const useProjectStore = create<ProjectState>((set, get) => ({
  projects: [],
  currentProject: null,
  code: '',
  isLoading: false,
  isGenerating: false,
  isDeploying: false,

  fetchProjects: async () => {
    set({ isLoading: true });
    try {
      const response = await api.get('/projects');
      set({ projects: response.data, isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  fetchProject: async (id: string) => {
    set({ isLoading: true });
    try {
      const [projectResponse, codeResponse] = await Promise.all([
        api.get(`/projects/${id}`),
        api.get(`/projects/${id}/code`).catch(() => ({ data: { code: '' } })),
      ]);
      
      set({ 
        currentProject: projectResponse.data, 
        code: codeResponse.data.code || '',
        isLoading: false 
      });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  createProject: async (name: string, description: string, type?: string) => {
    const response = await api.post('/projects', { 
      name, 
      description, 
      type: type || 'saas' 
    });
    const project = response.data;
    set((state) => ({ projects: [project, ...state.projects] }));
    return project;
  },

  generateCode: async (projectId: string, prompt: string) => {
    set({ isGenerating: true });
    try {
      await api.post(`/projects/${projectId}/generate`, { prompt });
      await get().fetchProject(projectId);
    } finally {
      set({ isGenerating: false });
    }
  },

  updateCode: async (projectId: string, code: string) => {
    await api.put(`/projects/${projectId}/code`, { code });
    set({ code });
  },

  publishProject: async (projectId: string) => {
    set({ isDeploying: true });
    try {
      await api.post(`/projects/${projectId}/publish`);
      await get().fetchProject(projectId);
    } finally {
      set({ isDeploying: false });
    }
  },

  deleteProject: async (id: string) => {
    await api.delete(`/projects/${id}`);
    set((state) => ({ 
      projects: state.projects.filter((p) => p.id !== id),
      currentProject: state.currentProject?.id === id ? null : state.currentProject,
    }));
  },
}));
