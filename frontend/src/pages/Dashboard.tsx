import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  Search, 
  Zap, 
  Rocket, 
  AlertCircle,
  ExternalLink,
  Trash2,
  MoreVertical,
  Clock,
  CheckCircle,
  Loader2
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useProjectStore, Project } from '@/stores/projectStore';

const statusConfig = {
  draft: { color: 'text-slate-400', bg: 'bg-slate-700', icon: Clock },
  building: { color: 'text-yellow-400', bg: 'bg-yellow-500/20', icon: Loader2 },
  deployed: { color: 'text-green-400', bg: 'bg-green-500/20', icon: CheckCircle },
  error: { color: 'text-red-400', bg: 'bg-red-500/20', icon: AlertCircle },
};

export default function Dashboard() {
  const navigate = useNavigate();
  const { projects, isLoading, fetchProjects, createProject, deleteProject } = useProjectStore();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [newProject, setNewProject] = useState({ name: '', description: '', type: 'saas' });
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);
    
    try {
      const project = await createProject(newProject.name, newProject.description, newProject.type);
      toast.success('Project created!');
      setShowCreateModal(false);
      setNewProject({ name: '', description: '', type: 'saas' });
      navigate(`/editor/${project.id}`);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to create project');
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteProject = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this project?')) {
      try {
        await deleteProject(id);
        toast.success('Project deleted');
      } catch (error) {
        toast.error('Failed to delete project');
      }
    }
  };

  const filteredProjects = projects.filter(
    (p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Your Projects</h1>
            <p className="text-slate-400 mt-1">Create and manage your AI-generated applications</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn btn-primary"
          >
            <Plus className="w-5 h-5" />
            New Project
          </button>
        </div>

        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search projects..."
              className="input pl-11"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-vortex-500 animate-spin" />
          </div>
        ) : filteredProjects.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20"
          >
            <div className="w-20 h-20 rounded-2xl bg-slate-800 flex items-center justify-center mx-auto mb-6">
              <Zap className="w-10 h-10 text-slate-600" />
            </div>
            <h2 className="text-xl font-semibold mb-2">No projects yet</h2>
            <p className="text-slate-400 mb-6">Create your first AI-powered application</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="btn btn-primary"
            >
              <Plus className="w-5 h-5" />
              Create Project
            </button>
          </motion.div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProjects.map((project, index) => (
              <motion.div
                key={project.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => navigate(`/editor/${project.id}`)}
                className="card p-6 cursor-pointer hover:border-vortex-500/50 transition-all group"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-vortex-500/20 to-purple-500/20 flex items-center justify-center">
                    <Zap className="w-6 h-6 text-vortex-400" />
                  </div>
                  <div className="flex items-center gap-2">
                    {project.status === 'building' && (
                      <Loader2 className="w-4 h-4 text-yellow-400 animate-spin" />
                    )}
                    <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${statusConfig[project.status].bg} ${statusConfig[project.status].color}`}>
                      <statusConfig[project.status].icon className="w-3 h-3" />
                      {project.status}
                    </span>
                  </div>
                </div>

                <h3 className="text-lg font-semibold mb-1 group-hover:text-vortex-400 transition-colors">
                  {project.name}
                </h3>
                <p className="text-slate-400 text-sm mb-4 line-clamp-2">
                  {project.description}
                </p>

                <div className="flex items-center justify-between pt-4 border-t border-slate-700/50">
                  <span className="text-xs text-slate-500">
                    {new Date(project.createdAt).toLocaleDateString()}
                  </span>
                  <div className="flex items-center gap-2">
                    {project.publishedUrl && (
                      <a
                        href={project.publishedUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="p-2 text-slate-400 hover:text-vortex-400 transition-colors"
                        title="Open live app"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    )}
                    <button
                      onClick={(e) => handleDeleteProject(project.id, e)}
                      className="p-2 text-slate-400 hover:text-red-400 transition-colors"
                      title="Delete project"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      <AnimatePresence>
        {showCreateModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
            onClick={() => setShowCreateModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="card p-6 w-full max-w-lg"
            >
              <h2 className="text-xl font-bold mb-6">Create New Project</h2>
              <form onSubmit={handleCreateProject} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Project Name
                  </label>
                  <input
                    type="text"
                    value={newProject.name}
                    onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                    className="input"
                    placeholder="My SaaS App"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Description
                  </label>
                  <textarea
                    value={newProject.description}
                    onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                    className="input min-h-[100px]"
                    placeholder="A platform for..."
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Project Type
                  </label>
                  <select
                    value={newProject.type}
                    onChange={(e) => setNewProject({ ...newProject, type: e.target.value })}
                    className="input"
                  >
                    <option value="saas">SaaS Platform</option>
                    <option value="website">Website</option>
                    <option value="api">API Backend</option>
                    <option value="dashboard">Dashboard</option>
                  </select>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="btn btn-secondary flex-1"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isCreating}
                    className="btn btn-primary flex-1"
                  >
                    {isCreating ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <Zap className="w-4 h-4" />
                        Create with AI
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
