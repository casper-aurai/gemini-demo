import React from 'react';
import {
  Avatar,
  Divider,
  IconButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Stack,
  Switch,
  Tooltip,
  Typography,
} from '@mui/material';
import { Brightness4, BrightnessHigh, Compress, Expand, Settings } from '@mui/icons-material';
import { useColorModeToggle, useDensity } from '../designSystem';

const SettingsMenu: React.FC = () => {
  const { toggleColorMode, mode } = useColorModeToggle();
  const { density, toggleDensity } = useDensity();
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => setAnchorEl(null);

  return (
    <>
      <Tooltip title="Display settings">
        <IconButton color="default" onClick={handleOpen} aria-haspopup="true" aria-expanded={open}>
          <Settings />
        </IconButton>
      </Tooltip>
      <Menu anchorEl={anchorEl} open={open} onClose={handleClose} keepMounted>
        <Stack direction="row" alignItems="center" spacing={1.5} px={2} py={1}>
          <Avatar sx={{ bgcolor: 'primary.main', color: 'primary.contrastText', width: 36, height: 36 }}>JS</Avatar>
          <div>
            <Typography variant="subtitle2">Display Controls</Typography>
            <Typography variant="caption" color="text.secondary">
              Theme and density
            </Typography>
          </div>
        </Stack>
        <Divider />
        <MenuItem onClick={toggleColorMode}>
          <ListItemIcon>{mode === 'dark' ? <BrightnessHigh fontSize="small" /> : <Brightness4 fontSize="small" />}</ListItemIcon>
          <ListItemText primary={`${mode === 'dark' ? 'Light' : 'Dark'} mode`} secondary="Toggle global palette" />
          <Switch edge="end" checked={mode === 'dark'} onChange={toggleColorMode} />
        </MenuItem>
        <MenuItem onClick={toggleDensity}>
          <ListItemIcon>{density === 'compact' ? <Expand fontSize="small" /> : <Compress fontSize="small" />}</ListItemIcon>
          <ListItemText primary={`${density === 'compact' ? 'Comfortable' : 'Compact'} spacing`} secondary="Adjust control density" />
          <Switch edge="end" checked={density === 'compact'} onChange={toggleDensity} />
        </MenuItem>
      </Menu>
    </>
  );
};

export default SettingsMenu;
