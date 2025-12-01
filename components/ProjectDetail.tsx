
import React, { useState } from 'react';
import { Project, ProjectTab, ChatMessage } from '../types';
import EngineeringLab from './EngineeringLab';
import MaterialIntelligence from './MaterialIntelligence';
import OperationsManager from './OperationsManager';
import { ArrowLeft, Clock, LayoutDashboard, Table, ListTodo, PanelRightClose, PanelRightOpen, Layers } from 'lucide-react';

interface ProjectDetailProps {
    project: Project;
    onBack: () => void;
    onUpdateProject: (p: Project) => void;
}

const ProjectDetail: React.FC<ProjectDetailProps> = ({ project, onBack, onUpdateProject }) => {
    const [activeTab, setActiveTab] = useState<ProjectTab>(ProjectTab.OVERVIEW);
    const [isLabOpen, setIsLabOpen] = useState(true);

    const handleUpdateMessages = (msgs: ChatMessage[]) => {
        onUpdateProject({ ...project, chatHistory: msgs });
    };

    // Calculate Completion
    const totalTasks = project.tasks?.length || 0;
    const completedTasks = project.tasks?.filter(t => t.status === 'done').length || 0;
    const progress = totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);

    return (
        <div className="flex h-screen bg-zinc-100 overflow-hidden">
            
            {/* Left Sidebar Navigation */}
            <aside className="w-16 lg:w-64 bg-zinc-900 flex flex-col flex-shrink-0 border-r border-zinc-800 transition-all duration-300">
                <div className="h-16 flex items-center justify-center lg:justify-start lg:px-6 border-b border-zinc-800">
                    <button onClick={onBack} className="text-zinc-400 hover:text-white transition-colors">
                        <ArrowLeft size={20} />
                    </button>
                    <span className="hidden lg:block ml-3 font-serif font-bold text-zinc-100 tracking-tight">Workspace</span>
                </div>

                <nav className="flex-1 py-6 px-2 lg:px-4 space-y-1">
                    <button
                        onClick={() => setActiveTab(ProjectTab.OVERVIEW)}
                        className={`w-full flex items-center gap-3 px-3 py-3 rounded-md transition-all ${activeTab === ProjectTab.OVERVIEW ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200'}`}
                        title="Overview"
                    >
                        <LayoutDashboard size={20} />
                        <span className="hidden lg:block font-medium text-sm">Overview</span>
                    </button>
                    <button
                        onClick={() => setActiveTab(ProjectTab.OPERATIONS)}
                        className={`w-full flex items-center gap-3 px-3 py-3 rounded-md transition-all ${activeTab === ProjectTab.OPERATIONS ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200'}`}
                        title="Operations"
                    >
                        <ListTodo size={20} />
                        <span className="hidden lg:block font-medium text-sm">Operations</span>
                    </button>
                    <button
                        onClick={() => setActiveTab(ProjectTab.BOM)}
                        className={`w-full flex items-center gap-3 px-3 py-3 rounded-md transition-all ${activeTab === ProjectTab.BOM ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200'}`}
                        title="Material Intel"
                    >
                        <Table size={20} />
                        <span className="hidden lg:block font-medium text-sm">Material Intel</span>
                    </button>
                </nav>

                <div className="p-4 border-t border-zinc-800 hidden lg:block">
                     <div className="bg-zinc-800/50 rounded p-3">
                        <div className="flex justify-between text-xs text-zinc-400 mb-1">
                            <span>Progress</span>
                            <span>{progress}%</span>
                        </div>
                        <div className="w-full bg-zinc-700 h-1.5 rounded-full overflow-hidden">
                            <div className="bg-green-500 h-full transition-all duration-500" style={{ width: `${progress}%` }}></div>
                        </div>
                     </div>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 flex flex-col min-w-0 bg-zinc-100 h-full relative">
                <header className="h-16 bg-white border-b border-zinc-200 px-8 flex items-center justify-between flex-shrink-0 z-10">
                    <div className="flex flex-col">
                        <h1 className="font-serif text-xl font-bold text-zinc-900 leading-none">{project.title}</h1>
                        <span className="text-[10px] text-zinc-400 uppercase tracking-widest mt-1 font-bold">{project.status} Phase</span>
                    </div>
                    <button 
                        onClick={() => setIsLabOpen(!isLabOpen)}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-md border text-sm font-medium transition-colors ${isLabOpen ? 'bg-zinc-100 border-zinc-300 text-zinc-900' : 'bg-white border-zinc-200 text-zinc-500 hover:border-zinc-300'}`}
                    >
                        {isLabOpen ? <PanelRightClose size={16} /> : <PanelRightOpen size={16} />}
                        <span className="hidden sm:inline">Engineering Lab</span>
                    </button>
                </header>

                <div className="flex-1 overflow-auto p-6 lg:p-8">
                     {activeTab === ProjectTab.OVERVIEW && (
                        <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in duration-300 pb-10">
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                {/* Left Col */}
                                <div className="lg:col-span-2 space-y-6">
                                     <div className="bg-white rounded-xl border border-zinc-200 p-6 shadow-sm">
                                        <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">Project Definition</h3>
                                        <textarea 
                                            className="w-full bg-transparent border-none focus:ring-0 text-zinc-800 leading-relaxed resize-none h-32 font-serif text-lg p-0"
                                            value={project.description}
                                            onChange={(e) => onUpdateProject({...project, description: e.target.value})}
                                        />
                                    </div>
                                    <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden shadow-sm h-80">
                                        {project.imageUrl ? (
                                            <img src={project.imageUrl} className="w-full h-full object-cover" alt="Reference" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center bg-zinc-50 text-zinc-400 italic">
                                                No visual reference
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Right Col */}
                                <div className="space-y-6">
                                    <div className="bg-white rounded-xl border border-zinc-200 p-6 shadow-sm">
                                        <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-4">Meta Data</h3>
                                        <div className="space-y-4">
                                            <div>
                                                <div className="text-xs text-zinc-500">Initialized</div>
                                                <div className="font-mono text-sm">{new Date(project.createdAt).toLocaleDateString()}</div>
                                            </div>
                                            <div>
                                                <div className="text-xs text-zinc-500">Total Components</div>
                                                <div className="font-mono text-sm">{project.bom?.length || 0} Units</div>
                                            </div>
                                            <div>
                                                <div className="text-xs text-zinc-500">Pending Tasks</div>
                                                <div className="font-mono text-sm">{project.tasks?.filter(t => t.status === 'pending').length || 0} Ops</div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-zinc-900 rounded-xl p-6 shadow-sm text-zinc-100">
                                        <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-4">System Status</h3>
                                        <div className="flex items-center gap-2 mb-1">
                                            <div className={`w-2 h-2 rounded-full ${project.status === 'finished' ? 'bg-green-500' : 'bg-amber-500 animate-pulse'}`}></div>
                                            <span className="font-mono uppercase text-sm">{project.status}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === ProjectTab.OPERATIONS && (
                        <div className="h-full animate-in slide-in-from-bottom-2 duration-300">
                            <OperationsManager 
                                project={project}
                                onUpdateProject={onUpdateProject}
                            />
                        </div>
                    )}

                    {activeTab === ProjectTab.BOM && (
                        <div className="h-full animate-in slide-in-from-bottom-2 duration-300">
                            <MaterialIntelligence 
                                project={project}
                                onUpdateProject={onUpdateProject}
                            />
                        </div>
                    )}
                </div>
            </main>

            {/* Right Sidebar - Engineering Lab */}
            <aside className={`bg-white border-l border-zinc-200 transition-all duration-300 flex flex-col ${isLabOpen ? 'w-96 translate-x-0' : 'w-0 translate-x-full opacity-0 overflow-hidden'}`}>
                <div className="h-16 flex items-center px-6 border-b border-zinc-200 bg-zinc-50/50 flex-shrink-0">
                    <h3 className="font-serif font-bold text-zinc-800 flex items-center gap-2">
                        <Layers size={18} />
                        Engineering Lab
                    </h3>
                </div>
                <div className="flex-1 overflow-hidden">
                    <EngineeringLab 
                        project={project}
                        messages={project.chatHistory || []}
                        onUpdateMessages={handleUpdateMessages}
                    />
                </div>
            </aside>
        </div>
    );
};

export default ProjectDetail;
