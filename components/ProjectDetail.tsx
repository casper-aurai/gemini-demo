
import React, { useState } from 'react';
import { Project, ProjectTab, ChatMessage } from '../types';
import EngineeringLab from './EngineeringLab';
import MaterialIntelligence from './MaterialIntelligence';
import OperationsManager from './OperationsManager';
import { ArrowLeft, Clock, LayoutDashboard, Table, ListTodo, PanelRightClose, PanelRightOpen, Layers, X } from 'lucide-react';

interface ProjectDetailProps {
    project: Project;
    onBack: () => void;
    onUpdateProject: (p: Project) => void;
}

const ProjectDetail: React.FC<ProjectDetailProps> = ({ project, onBack, onUpdateProject }) => {
    const [activeTab, setActiveTab] = useState<ProjectTab>(ProjectTab.OVERVIEW);
    const [isLabOpen, setIsLabOpen] = useState(false); // Default closed on mobile

    const handleUpdateMessages = (msgs: ChatMessage[]) => {
        onUpdateProject({ ...project, chatHistory: msgs });
    };

    // Calculate Completion
    const totalTasks = project.tasks?.length || 0;
    const completedTasks = project.tasks?.filter(t => t.status === 'done').length || 0;
    const progress = totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);

    return (
        <div className="flex flex-col lg:flex-row h-screen bg-zinc-100 overflow-hidden">
            
            {/* Left Sidebar Navigation (Desktop) / Top Tabs (Mobile) */}
            <aside className="w-full lg:w-64 bg-zinc-900 flex flex-col flex-shrink-0 border-b lg:border-r border-zinc-800 transition-all duration-300 z-20">
                <div className="h-14 lg:h-16 flex items-center px-4 lg:px-6 border-b border-zinc-800 bg-zinc-950">
                    <button onClick={onBack} className="text-zinc-400 hover:text-white transition-colors p-2 -ml-2">
                        <ArrowLeft size={20} />
                    </button>
                    <span className="ml-3 font-serif font-bold text-zinc-100 tracking-tight truncate flex-1">{project.title}</span>
                    <button 
                        onClick={() => setIsLabOpen(true)}
                        className="lg:hidden text-zinc-400 hover:text-white p-2"
                    >
                        <Layers size={20} />
                    </button>
                </div>

                <nav className="flex lg:flex-col overflow-x-auto lg:overflow-visible py-2 lg:py-6 px-2 lg:px-4 space-x-2 lg:space-x-0 lg:space-y-1 bg-zinc-900 no-scrollbar">
                    <button
                        onClick={() => setActiveTab(ProjectTab.OVERVIEW)}
                        className={`flex-shrink-0 lg:w-full flex items-center gap-2 lg:gap-3 px-3 py-2 lg:py-3 rounded-md transition-all text-xs lg:text-sm font-medium ${activeTab === ProjectTab.OVERVIEW ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200'}`}
                    >
                        <LayoutDashboard size={16} className="lg:w-5 lg:h-5" />
                        <span>Overview</span>
                    </button>
                    <button
                        onClick={() => setActiveTab(ProjectTab.OPERATIONS)}
                        className={`flex-shrink-0 lg:w-full flex items-center gap-2 lg:gap-3 px-3 py-2 lg:py-3 rounded-md transition-all text-xs lg:text-sm font-medium ${activeTab === ProjectTab.OPERATIONS ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200'}`}
                    >
                        <ListTodo size={16} className="lg:w-5 lg:h-5" />
                        <span>Operations</span>
                    </button>
                    <button
                        onClick={() => setActiveTab(ProjectTab.BOM)}
                        className={`flex-shrink-0 lg:w-full flex items-center gap-2 lg:gap-3 px-3 py-2 lg:py-3 rounded-md transition-all text-xs lg:text-sm font-medium ${activeTab === ProjectTab.BOM ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200'}`}
                    >
                        <Table size={16} className="lg:w-5 lg:h-5" />
                        <span>Material Intel</span>
                    </button>
                </nav>

                <div className="p-4 border-t border-zinc-800 hidden lg:block mt-auto">
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
            <main className="flex-1 flex flex-col min-w-0 bg-zinc-100 h-full relative overflow-hidden">
                <header className="hidden lg:flex h-16 bg-white border-b border-zinc-200 px-8 items-center justify-between flex-shrink-0 z-10">
                    <div className="flex flex-col">
                        <span className="text-[10px] text-zinc-400 uppercase tracking-widest font-bold">Current Phase</span>
                        <div className="text-sm font-bold text-zinc-800">{project.status.toUpperCase()}</div>
                    </div>
                    <button 
                        onClick={() => setIsLabOpen(!isLabOpen)}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-md border text-sm font-medium transition-colors ${isLabOpen ? 'bg-zinc-100 border-zinc-300 text-zinc-900' : 'bg-white border-zinc-200 text-zinc-500 hover:border-zinc-300'}`}
                    >
                        {isLabOpen ? <PanelRightClose size={16} /> : <PanelRightOpen size={16} />}
                        <span>Engineering Lab</span>
                    </button>
                </header>

                <div className="flex-1 overflow-auto p-4 lg:p-8">
                     {activeTab === ProjectTab.OVERVIEW && (
                        <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in duration-300 pb-20">
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                {/* Left Col */}
                                <div className="lg:col-span-2 space-y-6">
                                     <div className="bg-white rounded-xl border border-zinc-200 p-4 lg:p-6 shadow-sm">
                                        <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">Project Definition</h3>
                                        <textarea 
                                            className="w-full bg-transparent border-none focus:ring-0 text-zinc-800 leading-relaxed resize-none h-32 font-serif text-lg p-0"
                                            value={project.description}
                                            onChange={(e) => onUpdateProject({...project, description: e.target.value})}
                                        />
                                    </div>
                                    <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden shadow-sm h-64 lg:h-80 relative">
                                        {project.imageUrl ? (
                                            <img src={project.imageUrl} className="w-full h-full object-cover" alt="Reference" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center bg-zinc-50 text-zinc-400 italic">
                                                No visual reference
                                            </div>
                                        )}
                                        <div className="absolute bottom-4 right-4 bg-black/50 text-white text-xs px-2 py-1 rounded backdrop-blur-sm">
                                            Schematic View
                                        </div>
                                    </div>
                                </div>

                                {/* Right Col */}
                                <div className="space-y-6">
                                    <div className="bg-white rounded-xl border border-zinc-200 p-4 lg:p-6 shadow-sm">
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

                                    <div className="bg-zinc-900 rounded-xl p-4 lg:p-6 shadow-sm text-zinc-100">
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
                        <div className="h-full animate-in slide-in-from-bottom-2 duration-300 pb-20">
                            <OperationsManager 
                                project={project}
                                onUpdateProject={onUpdateProject}
                            />
                        </div>
                    )}

                    {activeTab === ProjectTab.BOM && (
                        <div className="h-full animate-in slide-in-from-bottom-2 duration-300 pb-20">
                            <MaterialIntelligence 
                                project={project}
                                onUpdateProject={onUpdateProject}
                            />
                        </div>
                    )}
                </div>
            </main>

            {/* Right Sidebar - Engineering Lab (Desktop: Sidebar, Mobile: Full Screen Modal) */}
            <>
                {/* Mobile Backdrop */}
                {isLabOpen && (
                    <div 
                        className="fixed inset-0 bg-black/60 z-30 lg:hidden backdrop-blur-sm animate-in fade-in duration-200"
                        onClick={() => setIsLabOpen(false)}
                    />
                )}
                
                <aside className={`
                    fixed lg:static inset-y-0 right-0 z-40 bg-white border-l border-zinc-200 transition-transform duration-300
                    w-full sm:w-[500px] lg:w-96 flex flex-col shadow-2xl lg:shadow-none
                    ${isLabOpen ? 'translate-x-0' : 'translate-x-full lg:w-0 lg:overflow-hidden lg:opacity-0'}
                `}>
                    <div className="h-16 flex items-center justify-between px-6 border-b border-zinc-200 bg-zinc-50/50 flex-shrink-0">
                        <h3 className="font-serif font-bold text-zinc-800 flex items-center gap-2">
                            <Layers size={18} />
                            Engineering Lab
                        </h3>
                        <button onClick={() => setIsLabOpen(false)} className="lg:hidden p-2 text-zinc-500">
                            <X size={24} />
                        </button>
                    </div>
                    <div className="flex-1 overflow-hidden">
                        <EngineeringLab 
                            project={project}
                            messages={project.chatHistory || []}
                            onUpdateMessages={handleUpdateMessages}
                        />
                    </div>
                </aside>
            </>
        </div>
    );
};

export default ProjectDetail;
