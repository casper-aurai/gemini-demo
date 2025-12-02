import React, { useState } from 'react';
import { Project, ProjectTask, TaskStatus } from '../types';
import { generateOperations } from '../services/geminiService';
import { CheckCircle2, Circle, Clock, Loader2, Sparkles, Plus, X } from 'lucide-react';

interface OperationsManagerProps {
    project: Project;
    onUpdateProject: (p: Project) => void;
}

interface TaskItemProps {
    task: ProjectTask;
    onStatusChange: (id: string, newStatus: TaskStatus) => void;
    onDelete: (id: string) => void;
}

const TaskItem: React.FC<TaskItemProps> = ({ task, onStatusChange, onDelete }) => (
    <div className="bg-white border border-zinc-200 rounded-lg p-3 mb-2 shadow-sm group flex items-start gap-3 hover:border-zinc-300 transition-colors">
        <button 
            onClick={() => {
                const next = task.status === 'pending' ? 'in_progress' : task.status === 'in_progress' ? 'done' : 'pending';
                onStatusChange(task.id, next);
            }}
            className={`mt-0.5 flex-shrink-0 ${
                task.status === 'done' ? 'text-green-600' : 
                task.status === 'in_progress' ? 'text-blue-600' : 'text-zinc-300'
            }`}
        >
            {task.status === 'done' ? <CheckCircle2 size={18} /> : 
             task.status === 'in_progress' ? <Clock size={18} /> : <Circle size={18} />}
        </button>
        <span className={`text-sm flex-1 ${task.status === 'done' ? 'text-zinc-400 line-through' : 'text-zinc-800'}`}>
            {task.text}
        </span>
        <button 
            onClick={() => onDelete(task.id)}
            className="text-zinc-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
        >
            <X size={14} />
        </button>
    </div>
);

const OperationsManager: React.FC<OperationsManagerProps> = ({ project, onUpdateProject }) => {
    const [loading, setLoading] = useState(false);
    const [newTaskText, setNewTaskText] = useState('');

    const handleGenerate = async () => {
        setLoading(true);
        try {
            const newTasks = await generateOperations(project.description);
            // Append or replace? Let's append to preserve manual tasks, but maybe clear logic is needed later.
            // For now, append.
            const currentTasks = project.tasks || [];
            onUpdateProject({ ...project, tasks: [...currentTasks, ...newTasks] });
        } catch (e) {
            alert("Failed to generate protocol.");
        } finally {
            setLoading(false);
        }
    };

    const updateTaskStatus = (taskId: string, newStatus: TaskStatus) => {
        const updatedTasks = (project.tasks || []).map(t => 
            t.id === taskId ? { ...t, status: newStatus } : t
        );
        onUpdateProject({ ...project, tasks: updatedTasks });
    };

    const addTask = () => {
        if (!newTaskText.trim()) return;
        const newTask: ProjectTask = {
            id: Date.now().toString(),
            text: newTaskText,
            status: 'pending'
        };
        onUpdateProject({ ...project, tasks: [...(project.tasks || []), newTask] });
        setNewTaskText('');
    };

    const removeTask = (taskId: string) => {
        onUpdateProject({ ...project, tasks: (project.tasks || []).filter(t => t.id !== taskId) });
    };

    const tasks = project.tasks || [];
    const pending = tasks.filter(t => t.status === 'pending');
    const inProgress = tasks.filter(t => t.status === 'in_progress');
    const done = tasks.filter(t => t.status === 'done');

    return (
        <div className="h-full flex flex-col">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-xl font-serif font-bold text-zinc-900">Fabrication Protocol</h2>
                    <p className="text-xs text-zinc-500">Operational workflow and tasks.</p>
                </div>
                <button
                    onClick={handleGenerate}
                    disabled={loading}
                    className="bg-zinc-900 text-white px-4 py-2 rounded-md text-xs font-bold uppercase tracking-wider flex items-center gap-2 hover:bg-zinc-800 disabled:opacity-50"
                >
                    {loading ? <Loader2 className="animate-spin" size={14} /> : <Sparkles size={14} />}
                    AI Generate Protocol
                </button>
            </div>

            <div className="flex-1 overflow-x-auto">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 min-w-[800px] h-full">
                    {/* Pending Column */}
                    <div className="bg-zinc-50 rounded-xl p-4 flex flex-col h-full border border-zinc-200">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500 flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-zinc-300"/> Pending
                            </h3>
                            <span className="text-xs font-mono bg-zinc-200 px-2 py-0.5 rounded-full text-zinc-600">{pending.length}</span>
                        </div>
                        
                        <div className="mb-4 relative">
                            <input 
                                type="text"
                                placeholder="Add task..."
                                value={newTaskText}
                                onChange={(e) => setNewTaskText(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && addTask()}
                                className="w-full bg-white border border-zinc-200 rounded-md py-2 pl-3 pr-8 text-sm focus:outline-none focus:ring-1 focus:ring-zinc-400"
                            />
                            <button onClick={addTask} className="absolute right-2 top-2 text-zinc-400 hover:text-zinc-600">
                                <Plus size={16} />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto">
                            {pending.map(t => (
                                <TaskItem 
                                    key={t.id} 
                                    task={t} 
                                    onStatusChange={updateTaskStatus} 
                                    onDelete={removeTask} 
                                />
                            ))}
                        </div>
                    </div>

                    {/* In Progress Column */}
                    <div className="bg-blue-50/30 rounded-xl p-4 flex flex-col h-full border border-blue-100">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-xs font-bold uppercase tracking-wider text-blue-600 flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-blue-500"/> In Progress
                            </h3>
                            <span className="text-xs font-mono bg-blue-100 px-2 py-0.5 rounded-full text-blue-700">{inProgress.length}</span>
                        </div>
                        <div className="flex-1 overflow-y-auto">
                             {inProgress.map(t => (
                                <TaskItem 
                                    key={t.id} 
                                    task={t} 
                                    onStatusChange={updateTaskStatus} 
                                    onDelete={removeTask} 
                                />
                            ))}
                        </div>
                    </div>

                    {/* Done Column */}
                    <div className="bg-green-50/30 rounded-xl p-4 flex flex-col h-full border border-green-100">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-xs font-bold uppercase tracking-wider text-green-600 flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-green-500"/> Completed
                            </h3>
                            <span className="text-xs font-mono bg-green-100 px-2 py-0.5 rounded-full text-green-700">{done.length}</span>
                        </div>
                        <div className="flex-1 overflow-y-auto">
                             {done.map(t => (
                                <TaskItem 
                                    key={t.id} 
                                    task={t} 
                                    onStatusChange={updateTaskStatus} 
                                    onDelete={removeTask} 
                                />
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OperationsManager;