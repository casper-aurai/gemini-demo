
import React, { useEffect, useMemo, useState } from 'react';
import { InventoryItem } from '../types';
import { Package, Plus, Trash2, AlertTriangle, Search, Filter, ArrowUpDown, Clock3 } from 'lucide-react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  Grid,
  IconButton,
  MenuItem,
  Paper,
  Select,
  Slider,
  Stack,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import { useDensity } from '../designSystem';

interface StockroomProps {
    items: InventoryItem[];
    onUpdate: (items: InventoryItem[]) => void;
    presetSearch?: string;
    onClearPresetSearch?: () => void;
}

const Stockroom: React.FC<StockroomProps> = ({ items, onUpdate, presetSearch, onClearPresetSearch }) => {
    const [search, setSearch] = useState('');
    const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
    const [selectedLocations, setSelectedLocations] = useState<string[]>([]);
    const [selectedUnits, setSelectedUnits] = useState<string[]>([]);
    const [stockStatusFilter, setStockStatusFilter] = useState<'all' | 'healthy' | 'caution' | 'critical'>('all');
    const [minStockLevel, setMinStockLevel] = useState(0);
    const [quickFilters, setQuickFilters] = useState({ lowStock: false, recent: false });
    const [selectedItemId, setSelectedItemId] = useState<string | null>(null);

    useEffect(() => {
        if (typeof presetSearch === 'string') {
            setSearch(presetSearch);
            onClearPresetSearch?.();
        }
    }, [presetSearch, onClearPresetSearch]);

    const addItem = () => {
        const newItem: InventoryItem = {
            id: Date.now().toString(),
            name: 'New Item',
            category: 'General',
            quantity: 0,
            unit: 'pcs',
            location: 'Unassigned',
            minLevel: 5,
            cost: 0,
            lastUpdated: Date.now()
        };
        onUpdate([newItem, ...items]);
    };

    const updateItem = (id: string, field: keyof InventoryItem, value: any) => {
        onUpdate(items.map(i => i.id === id ? { ...i, [field]: value, lastUpdated: Date.now() } : i));
    };

  const addItem = () => {
    const newItem: InventoryItem = {
      id: Date.now().toString(),
      name: 'New Item',
      category: 'General',
      quantity: 0,
      unit: 'pcs',
      location: 'Unassigned',
      minLevel: 5,
      cost: 0,
      lastUpdated: Date.now(),
    };
    onUpdate([newItem, ...items]);
  };

  const updateItem = (id: string, field: keyof InventoryItem, value: any) => {
    onUpdate(items.map(i => (i.id === id ? { ...i, [field]: value, lastUpdated: Date.now() } : i)));
  };

  const deleteItem = (id: string) => {
    if (confirm('Remove from inventory?')) {
      onUpdate(items.filter(i => i.id !== id));
    }
  };

  const uniqueCategories = useMemo(() => Array.from(new Set(items.map(i => i.category))), [items]);
  const uniqueLocations = useMemo(() => Array.from(new Set(items.map(i => i.location))), [items]);
  const uniqueUnits = useMemo(() => Array.from(new Set(items.map(i => i.unit))), [items]);

  const maxQuantity = useMemo(() => Math.max(100, ...items.map(i => i.quantity)), [items]);

  const stockStatus = (item: InventoryItem) => {
    if (item.quantity <= item.minLevel) return 'critical' as const;
    if (item.quantity <= item.minLevel * 1.5) return 'caution' as const;
    return 'healthy' as const;
  };

  const filtered = items.filter(i => {
    const matchesSearch =
      i.name.toLowerCase().includes(search.toLowerCase()) ||
      i.category.toLowerCase().includes(search.toLowerCase()) ||
      i.location.toLowerCase().includes(search.toLowerCase());

    const matchesCategory = selectedCategories.length === 0 || selectedCategories.includes(i.category);
    const matchesLocation = selectedLocations.length === 0 || selectedLocations.includes(i.location);
    const matchesUnit = selectedUnits.length === 0 || selectedUnits.includes(i.unit);

    const status = stockStatus(i);
    const matchesStatusFilter = stockStatusFilter === 'all' || status === stockStatusFilter;
    const matchesMinStock = i.quantity >= minStockLevel;

    const isLowStock = status === 'critical';
    const isRecent = i.lastUpdated ? Date.now() - i.lastUpdated < 1000 * 60 * 60 * 24 * 7 : false;

    const matchesQuickLow = quickFilters.lowStock ? isLowStock : true;
    const matchesQuickRecent = quickFilters.recent ? isRecent : true;

    return (
      matchesSearch &&
      matchesCategory &&
      matchesLocation &&
      matchesUnit &&
      matchesStatusFilter &&
      matchesMinStock &&
      matchesQuickLow &&
      matchesQuickRecent
    );
  });

  const categoryColor = (cat: string) => {
    const c = cat.toLowerCase();
    if (c.includes('raw')) return 'info';
    if (c.includes('hard')) return 'default';
    if (c.includes('elec')) return 'warning';
    return 'default';
  };

  const stockTone = {
    healthy: { label: 'Healthy', color: 'success' as const },
    caution: { label: 'Caution', color: 'warning' as const },
    critical: { label: 'Critical', color: 'error' as const },
  };

  return (
    <Box p={4} sx={{ bgcolor: 'background.default', height: '100%', overflow: 'auto' }}>
      <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" spacing={3} alignItems={{ md: 'flex-end' }} mb={4}>
        <div>
          <Typography variant="h4" fontWeight={700} display="flex" alignItems="center" gap={1} color="text.primary">
            <Package size={24} /> Stockroom
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Global inventory tracking and material logistics.
          </Typography>
        </div>
        <Stack direction="row" spacing={2} alignItems="center">
          <TextField
            size={controlSize}
            placeholder="Filter SKU, Category, or Location..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            InputProps={{ startAdornment: <Search size={16} style={{ marginRight: 8 }} /> }}
          />
          <Button variant="contained" onClick={addItem} size={controlSize} startIcon={<Plus size={16} />}>
            Add Stock
          </Button>
        </Stack>
      </Stack>

      <Grid container spacing={2} mb={3}>
        <Grid item xs={12} md={3}>
          <Card variant="outlined">
            <CardContent>
              <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
                <Typography variant="caption" color="text.secondary" fontWeight={700} textTransform="uppercase">
                  <Filter size={14} /> Category
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Multi-select
                </Typography>
              </Stack>
              <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                {uniqueCategories.map(cat => (
                  <Chip
                    key={cat}
                    label={cat}
                    color={selectedCategories.includes(cat) ? 'primary' : categoryColor(cat)}
                    variant={selectedCategories.includes(cat) ? 'filled' : 'outlined'}
                    size={controlSize}
                    onClick={() =>
                      setSelectedCategories(prev =>
                        prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
                      )
                    }
                  />
                ))}
                {uniqueCategories.length === 0 && (
                  <Typography variant="caption" color="text.secondary">
                    No categories
                  </Typography>
                )}
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card variant="outlined">
            <CardContent>
              <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
                <Typography variant="caption" color="text.secondary" fontWeight={700} textTransform="uppercase">
                  <Filter size={14} /> Location
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Multi-select
                </Typography>
              </Stack>
              <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                {uniqueLocations.map(loc => (
                  <Chip
                    key={loc}
                    label={loc}
                    color={selectedLocations.includes(loc) ? 'primary' : 'default'}
                    variant={selectedLocations.includes(loc) ? 'filled' : 'outlined'}
                    size={controlSize}
                    onClick={() =>
                      setSelectedLocations(prev =>
                        prev.includes(loc) ? prev.filter(l => l !== loc) : [...prev, loc]
                      )
                    }
                  />
                ))}
                {uniqueLocations.length === 0 && (
                  <Typography variant="caption" color="text.secondary">
                    No locations
                  </Typography>
                )}
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card variant="outlined">
            <CardContent>
              <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
                <Typography variant="caption" color="text.secondary" fontWeight={700} textTransform="uppercase">
                  <ArrowUpDown size={14} /> Stock Level
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Min {minStockLevel}
                </Typography>
              </Stack>
              <Stack direction="row" spacing={1} alignItems="center" mb={2}>
                <Select
                  size={controlSize}
                  value={stockStatusFilter}
                  onChange={e => setStockStatusFilter(e.target.value as any)}
                >
                  <MenuItem value="all">All States</MenuItem>
                  <MenuItem value="healthy">Healthy</MenuItem>
                  <MenuItem value="caution">Caution</MenuItem>
                  <MenuItem value="critical">Critical</MenuItem>
                </Select>
                <AlertTriangle size={16} color="#eab308" />
              </Stack>
              <Slider
                value={minStockLevel}
                onChange={(_, val) => setMinStockLevel(val as number)}
                step={1}
                min={0}
                max={maxQuantity}
              />
              <Stack direction="row" justifyContent="space-between" mt={0.5}>
                <Typography variant="caption" color="text.secondary">
                  0
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {maxQuantity}
                </Typography>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card variant="outlined">
            <CardContent>
              <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
                <Typography variant="caption" color="text.secondary" fontWeight={700} textTransform="uppercase">
                  <Filter size={14} /> Unit Type
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Multi-select
                </Typography>
              </Stack>
              <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                {uniqueUnits.map(unit => (
                  <Chip
                    key={unit}
                    label={unit}
                    color={selectedUnits.includes(unit) ? 'primary' : 'default'}
                    variant={selectedUnits.includes(unit) ? 'filled' : 'outlined'}
                    size={controlSize}
                    onClick={() =>
                      setSelectedUnits(prev => (prev.includes(unit) ? prev.filter(u => u !== unit) : [...prev, unit]))
                    }
                  />
                ))}
                {uniqueUnits.length === 0 && (
                  <Typography variant="caption" color="text.secondary">
                    No units
                  </Typography>
                )}
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
        <Stack direction="row" spacing={3} alignItems="center" flexWrap="wrap" useFlexGap>
          <Stack direction="row" spacing={1} alignItems="center">
            <Switch
              checked={quickFilters.lowStock}
              onChange={(_, checked) => setQuickFilters(prev => ({ ...prev, lowStock: checked }))}
              size={controlSize === 'small' ? 'small' : 'medium'}
            />
            <Typography variant="body2">Show only critical stock</Typography>
          </Stack>
          <Stack direction="row" spacing={1} alignItems="center">
            <Switch
              checked={quickFilters.recent}
              onChange={(_, checked) => setQuickFilters(prev => ({ ...prev, recent: checked }))}
              size={controlSize === 'small' ? 'small' : 'medium'}
            />
            <Typography variant="body2">Updated in last 7 days</Typography>
            <Clock3 size={16} />
          </Stack>
          <Divider orientation="vertical" flexItem sx={{ display: { xs: 'none', md: 'block' } }} />
          <Typography variant="body2" color="text.secondary">
            {filtered.length} of {items.length} items visible
          </Typography>
        </Stack>
      </Paper>

      <TableContainer component={Paper} variant="outlined">
        <Table size={controlSize === 'small' ? 'small' : 'medium'}>
          <TableHead>
            <TableRow>
              <TableCell>Item</TableCell>
              <TableCell>Category</TableCell>
              <TableCell>Location</TableCell>
              <TableCell>Quantity</TableCell>
              <TableCell>Unit</TableCell>
              <TableCell>Min Level</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filtered.map(item => (
              <TableRow key={item.id} hover>
                <TableCell>
                  <TextField
                    size={controlSize}
                    value={item.name}
                    variant="standard"
                    onChange={e => updateItem(item.id, 'name', e.target.value)}
                    fullWidth
                  />
                </TableCell>
                <TableCell>
                  <TextField
                    size={controlSize}
                    value={item.category}
                    variant="standard"
                    onChange={e => updateItem(item.id, 'category', e.target.value)}
                    fullWidth
                  />
                </TableCell>
                <TableCell>
                  <TextField
                    size={controlSize}
                    value={item.location}
                    variant="standard"
                    onChange={e => updateItem(item.id, 'location', e.target.value)}
                    fullWidth
                  />
                </TableCell>
                <TableCell>
                  <TextField
                    size={controlSize}
                    type="number"
                    value={item.quantity}
                    variant="standard"
                    onChange={e => updateItem(item.id, 'quantity', Number(e.target.value))}
                    fullWidth
                  />
                </TableCell>
                <TableCell>
                  <TextField
                    size={controlSize}
                    value={item.unit}
                    variant="standard"
                    onChange={e => updateItem(item.id, 'unit', e.target.value)}
                    fullWidth
                  />
                </TableCell>
                <TableCell>
                  <TextField
                    size={controlSize}
                    type="number"
                    value={item.minLevel}
                    variant="standard"
                    onChange={e => updateItem(item.id, 'minLevel', Number(e.target.value))}
                    fullWidth
                  />
                </TableCell>
                <TableCell>
                  <Chip
                    label={stockTone[stockStatus(item)].label}
                    color={stockTone[stockStatus(item)].color}
                    size={controlSize}
                    variant="outlined"
                  />
                </TableCell>
                <TableCell align="right">
                  <IconButton color="error" size="small" onClick={() => deleteItem(item.id)}>
                    <Trash2 size={16} />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} align="center">
                  <Typography variant="body2" color="text.secondary">
                    No items match your filters.
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default Stockroom;
