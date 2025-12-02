
import React from 'react';
import { Project, ProjectStatus } from '../types';
import { Clock, DollarSign } from 'lucide-react';

interface ProjectCardProps {
  project: Project;
  onStatusChange: (id: string, newStatus: ProjectStatus) => void;
  onDelete: (id: string) => void;
}

const statusColors: Record<ProjectStatus, string> = {
  concept: 'bg-zinc-800 text-zinc-400 border-zinc-700',
  planning: 'bg-zinc-800 text-zinc-300 border-zinc-700',
  prototyping: 'bg-blue-900/30 text-blue-400 border-blue-900/50',
  fabrication: 'bg-amber-900/30 text-amber-400 border-amber-900/50',
  wiring: 'bg-yellow-900/30 text-yellow-400 border-yellow-900/50',
  assembly: 'bg-orange-900/30 text-orange-400 border-orange-900/50',
  calibration: 'bg-purple-900/30 text-purple-400 border-purple-900/50',
  finished: 'bg-green-900/30 text-green-400 border-green-900/50',
};

const ProjectCard: React.FC<ProjectCardProps> = ({ project, onStatusChange, onDelete }) => {
  const totalBudget = (project.bom || []).reduce((acc, item) => acc + (item.quantity * (item.unitCost || 0)), 0);
  
  // Progress
  const totalTasks = project.tasks?.length || 0;
  const completedTasks = project.tasks?.filter(t => t.status === 'done').length || 0;
  const progress = totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);

  return (
    <div className="bg-zinc-900 rounded-lg shadow-lg border border-zinc-800 overflow-hidden flex flex-col group hover:border-zinc-600 transition-all h-full relative">
      <div className="h-40 overflow-hidden bg-zinc-950 relative border-b border-zinc-800">
         {project.imageUrl ? (
            <>
              <img 
                src={project.imageUrl} 
                alt={project.title} 
                className="w-full h-full object-cover group-hover:scale-105 transition-all duration-700 opacity-80 group-hover:opacity-100" 
              />
              <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-transparent to-transparent opacity-60"></div>
            </>
          ) : (
              <div className="h-40 flex items-center justify-center">
                  <span className="text-zinc-700 font-mono text-xs uppercase tracking-widest">No Schematic</span>
              </div>
          )}
          
          <div className="absolute bottom-2 right-2">
             <span className={`text-[10px] px-2 py-0.5 rounded border uppercase font-bold tracking-widest ${statusColors[project.status]}`}>
                {project.status}
             </span>
          </div>
      </div>

      <div className="p-4 flex-1 flex flex-col">
        <h3 className="font-serif font-bold text-lg text-zinc-100 leading-tight mb-2 group-hover:text-white transition-colors">{project.title}</h3>
        
        <p className="text-xs text-zinc-400 line-clamp-2 mb-4 flex-1 font-sans leading-relaxed">{project.description}</p>
        
        {/* Progress Bar */}
        <div className="mb-4">
            <div className="flex justify-between text-[10px] text-zinc-500 mb-1 uppercase tracking-wider font-bold">
                <span>Completion</span>
                <span>{progress}%</span>
            </div>
            <div className="w-full bg-zinc-800 h-1 rounded-full overflow-hidden">
                <div className="bg-zinc-400 h-full" style={{ width: `${progress}%` }}></div>
            </div>
        </div>

        <div className="flex items-center justify-between text-xs text-zinc-500 mt-auto pt-3 border-t border-zinc-800" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-2 font-mono text-zinc-400">
                <Clock size={12} />
                <span>{new Date(project.createdAt).toLocaleDateString()}</span>
            </div>

            {totalBudget > 0 && (
                <div className="flex items-center gap-1 font-mono text-green-500">
                    <DollarSign size={12} />
                    <span>{totalBudget.toFixed(0)}</span>
                </div>
            )}
            
            <div className="flex gap-2 ml-auto">
                 <button 
                    onClick={() => onDelete(project.id)}
                    className="text-zinc-600 hover:text-red-500 transition-colors px-1"
                >
                    DEL
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectCard;
