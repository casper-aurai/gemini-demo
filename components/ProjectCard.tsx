import React from 'react';
import { Project, ProjectStatus } from '../types';
import { Clock, DollarSign } from 'lucide-react';
import {
  Box,
  Card,
  CardActionArea,
  CardContent,
  CardMedia,
  Chip,
  LinearProgress,
  Stack,
  Typography,
  IconButton,
} from '@mui/material';
import { useDensity } from '../designSystem';

interface ProjectCardProps {
  project: Project;
  onStatusChange: (id: string, newStatus: ProjectStatus) => void;
  onDelete: (id: string) => void;
}

const statusColors: Record<ProjectStatus, { label: string; color: 'default' | 'primary' | 'success' | 'warning' | 'info'; }> = {
  concept: { label: 'Concept', color: 'default' },
  planning: { label: 'Planning', color: 'info' },
  prototyping: { label: 'Prototyping', color: 'primary' },
  fabrication: { label: 'Fabrication', color: 'warning' },
  wiring: { label: 'Wiring', color: 'warning' },
  assembly: { label: 'Assembly', color: 'warning' },
  calibration: { label: 'Calibration', color: 'info' },
  finished: { label: 'Finished', color: 'success' },
};

const ProjectCard: React.FC<ProjectCardProps> = ({ project, onStatusChange, onDelete }) => {
  const { density } = useDensity();
  const totalBudget = (project.bom || []).reduce((acc, item) => acc + item.quantity * (item.unitCost || 0), 0);
  const totalTasks = project.tasks?.length || 0;
  const completedTasks = project.tasks?.filter(t => t.status === 'done').length || 0;
  const progress = totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);

  const handleCycleStatus = () => {
    const states: ProjectStatus[] = ['concept', 'planning', 'prototyping', 'fabrication', 'wiring', 'assembly', 'calibration', 'finished'];
    const idx = states.indexOf(project.status);
    const next = states[(idx + 1) % states.length];
    onStatusChange(project.id, next);
  };

  return (
    <Card elevation={2} sx={{ height: '100%', bgcolor: 'background.paper' }}>
      <CardActionArea sx={{ height: '100%' }}>
        {project.imageUrl && (
          <CardMedia component="img" height={160} image={project.imageUrl} alt={project.title} sx={{ opacity: 0.9 }} />
        )}
        <CardContent>
          <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={1} mb={1}>
            <Chip
              label={statusColors[project.status].label}
              color={statusColors[project.status].color}
              size={density === 'compact' ? 'small' : 'medium'}
              variant="outlined"
              onClick={(e) => {
                e.stopPropagation();
                handleCycleStatus();
              }}
            />
            <IconButton size="small" aria-label="delete project" onClick={(e) => { e.stopPropagation(); onDelete(project.id); }}>
              <Typography variant="caption" color="error.main" fontWeight={700}>
                DEL
              </Typography>
            </IconButton>
          </Stack>
          <Typography variant="h6" mb={0.5} color="text.primary">
            {project.title}
          </Typography>
          <Typography variant="body2" color="text.secondary" mb={2} noWrap>
            {project.description}
          </Typography>

          <Stack spacing={0.5} mb={2}>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Typography variant="caption" color="text.secondary" fontWeight={700} letterSpacing={0.6}>
                Completion
              </Typography>
              <Typography variant="caption" color="text.secondary">{progress}%</Typography>
            </Stack>
            <LinearProgress value={progress} variant="determinate" color="primary" />
          </Stack>

          <Stack direction="row" spacing={2} alignItems="center" justifyContent="space-between">
            <Stack direction="row" spacing={1} alignItems="center" color="text.secondary">
              <Clock size={14} />
              <Typography variant="caption">{new Date(project.createdAt).toLocaleDateString()}</Typography>
            </Stack>
            {totalBudget > 0 && (
              <Stack direction="row" spacing={0.5} alignItems="center" color="success.main">
                <DollarSign size={14} />
                <Typography variant="caption" fontWeight={700}>
                  {totalBudget.toFixed(0)}
                </Typography>
              </Stack>
            )}
          </Stack>
        </CardContent>
      </CardActionArea>
    </Card>
  );
};

export default ProjectCard;
