import React from 'react';
import { Machine, MachineStatus } from '../types';
import { Wrench, Settings as SettingsIcon, AlertCircle, CheckCircle2, Plus, Calendar, XCircle, PauseCircle, Archive, Trash2 } from 'lucide-react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Grid,
  IconButton,
  LinearProgress,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { useDensity } from '../designSystem';

interface MachineParkProps {
  machines: Machine[];
  onUpdate: (machines: Machine[]) => void;
}

const statusConfig: Record<MachineStatus, { color: 'success' | 'warning' | 'info' | 'error' | 'default'; icon: any; label: string }> = {
  operational: { color: 'success', icon: CheckCircle2, label: 'Operational' },
  degraded: { color: 'warning', icon: AlertCircle, label: 'Degraded' },
  maintenance: { color: 'info', icon: Wrench, label: 'Maintenance' },
  down: { color: 'error', icon: XCircle, label: 'Down' },
  retired: { color: 'default', icon: Archive, label: 'Retired' },
};

const MachinePark: React.FC<MachineParkProps> = ({ machines, onUpdate }) => {
  const { density } = useDensity();
  const controlSize = density === 'compact' ? 'small' : 'medium';

  const addMachine = () => {
    const newMachine: Machine = {
      id: Date.now().toString(),
      name: 'New Machine',
      type: 'General',
      status: 'operational',
      lastService: Date.now(),
      nextService: Date.now() + 1000 * 60 * 60 * 24 * 30,
      notes: '',
    };
    onUpdate([...machines, newMachine]);
  };

  const cycleStatus = (id: string, current: MachineStatus) => {
    const states: MachineStatus[] = ['operational', 'degraded', 'maintenance', 'down', 'retired'];
    const idx = states.indexOf(current);
    const next = states[(idx + 1) % states.length];
    updateMachine(id, { status: next });
  };

  const updateMachine = (id: string, updates: Partial<Machine>) => {
    onUpdate(machines.map(m => (m.id === id ? { ...m, ...updates } : m)));
  };

  const deleteMachine = (id: string) => {
    if (confirm('Decommission machine completely?')) {
      onUpdate(machines.filter(m => m.id !== id));
    }
  };

  return (
    <Box p={4} sx={{ bgcolor: 'background.default', height: '100%', overflow: 'auto' }}>
      <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems={{ md: 'center' }} spacing={3} mb={4}>
        <div>
          <Typography variant="h4" fontWeight={700} display="flex" alignItems="center" gap={1} color="text.primary">
            <SettingsIcon /> Machine Park
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Equipment health, maintenance schedules, and utilization.
          </Typography>
        </div>
        <Button variant="contained" onClick={addMachine} size={controlSize} startIcon={<Plus size={16} />}>
          Add Equipment
        </Button>
      </Stack>

      <Grid container spacing={3}>
        {machines.map(machine => {
          const StatusIcon = statusConfig[machine.status].icon;
          const isServiceDue = Date.now() > machine.nextService;

          return (
            <Grid item xs={12} md={6} lg={4} key={machine.id}>
              <Card variant="outlined" sx={{ height: '100%' }}>
                <CardContent sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                  <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={2} mb={2}>
                    <Stack spacing={0.5} flex={1}>
                      <TextField
                        variant="standard"
                        value={machine.name}
                        onChange={e => updateMachine(machine.id, { name: e.target.value })}
                        size={controlSize}
                        fullWidth
                      />
                      <TextField
                        variant="standard"
                        value={machine.type}
                        onChange={e => updateMachine(machine.id, { type: e.target.value })}
                        size={controlSize}
                        fullWidth
                        label="Type"
                      />
                    </Stack>
                    <Chip
                      label={statusConfig[machine.status].label}
                      color={statusConfig[machine.status].color}
                      icon={<StatusIcon size={14} />}
                      onClick={() => cycleStatus(machine.id, machine.status)}
                      variant="outlined"
                      size={controlSize}
                    />
                  </Stack>

                  <LinearProgress
                    variant="determinate"
                    value={machine.status === 'operational' ? 100 : machine.status === 'degraded' ? 55 : 25}
                    color={statusConfig[machine.status].color}
                    sx={{ mb: 2, borderRadius: 2, height: 6 }}
                  />

                  <Card variant="outlined" sx={{ bgcolor: 'action.hover', mb: 2 }}>
                    <CardContent>
                      <Stack spacing={1}>
                        <Stack direction="row" spacing={1} alignItems="center">
                          <CheckCircle2 size={16} />
                          <Typography variant="caption" color="text.secondary">
                            Last Service
                          </Typography>
                          <Typography variant="caption" fontWeight={600}>
                            {new Date(machine.lastService).toLocaleDateString()}
                          </Typography>
                        </Stack>
                        <Stack direction="row" spacing={1} alignItems="center">
                          <Calendar size={16} color={isServiceDue ? '#ef4444' : undefined} />
                          <Typography variant="caption" color="text.secondary">
                            Next Due
                          </Typography>
                          <Typography variant="caption" fontWeight={600} color={isServiceDue ? 'error.main' : 'text.primary'}>
                            {new Date(machine.nextService).toLocaleDateString()}
                          </Typography>
                        </Stack>
                      </Stack>
                    </CardContent>
                  </Card>

                  <TextField
                    multiline
                    minRows={3}
                    maxRows={4}
                    size={controlSize}
                    placeholder="Operating notes..."
                    value={machine.notes || ''}
                    onChange={e => updateMachine(machine.id, { notes: e.target.value })}
                  />

                  <Stack direction="row" justifyContent="space-between" alignItems="center" mt={3}>
                    <Button
                      variant="outlined"
                      size={controlSize}
                      startIcon={<PauseCircle size={16} />}
                      onClick={() => updateMachine(machine.id, { lastService: Date.now() })}
                    >
                      Log Service
                    </Button>
                    <IconButton color="error" onClick={() => deleteMachine(machine.id)} size="small">
                      <Trash2 size={16} />
                    </IconButton>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>
    </Box>
  );
};

export default MachinePark;
