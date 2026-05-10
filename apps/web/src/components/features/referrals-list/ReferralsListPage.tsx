import { useState } from 'react';
import {
  Box,
  Button,
  Chip,
  Divider,
  MenuItem,
  Paper,
  Select,
  Stack,
  TextField,
  Toolbar,
  Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DownloadIcon from '@mui/icons-material/Download';
import { useNavigate } from 'react-router-dom';
import { ReferralStatus, ReferralPriority, SpecialtyType } from '@referrals/shared';
import { ReferralsDataGrid } from './components/ReferralsDataGrid';
import { GridRowSelectionModel } from '@mui/x-data-grid';
import { useUiStore } from 'src/store/ui.store';
import { useBulkAction, useExportReferrals, useReferrals } from 'src/api/hooks/useReferrals';

export function ReferralsListPage() {
  const navigate = useNavigate();
  const { referralFilters, setReferralFilters, resetReferralFilters } = useUiStore();
  const [selectedIds, setSelectedIds] = useState<GridRowSelectionModel>({ ids: new Set([]), type: "include" });
  const [search, setSearch] = useState('');

  const { data, isFetching } = useReferrals({ ...referralFilters, search: search || undefined });
  const { mutate: bulkAction, isPending: bulkPending } = useBulkAction();
  const { mutate: exportReferrals, isPending: exportPending } = useExportReferrals();

  const rows = data?.data ?? [];
  const total = data?.meta.total ?? 0;

  const handleSearch = (value: string) => {
    setSearch(value);
    setReferralFilters({ page: 1 });
  };

  return (
    <Box>
      {/* Page header */}
      <Stack direction="row" alignItems="center" justifyContent="space-between" mb={3}>
        <Box>
          <Typography variant="h5" fontWeight={600}>
            Referrals
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {total.toLocaleString()} total referrals
          </Typography>
        </Box>
        <Stack direction="row" spacing={1}>
          <Button
            variant="outlined"
            startIcon={<DownloadIcon />}
            loading={exportPending}
            loadingPosition="start"
            onClick={() => exportReferrals(referralFilters)}
            disabled={exportPending}
          >
            {exportPending ? 'Exporting…' : 'Export'}
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => navigate('/referrals/new')}
          >
            New referral
          </Button>
        </Stack>
      </Stack>

      <Paper variant="outlined">
        {/* Filters toolbar */}
        <Toolbar sx={{ gap: 2, flexWrap: 'wrap', py: 1, minHeight: 'auto' }}>
          <TextField
            size="small"
            placeholder="Search patients, diagnoses…"
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            sx={{ minWidth: 240 }}
          />

          <Select
            size="small"
            displayEmpty
            value={referralFilters.status?.[0] ?? ''}
            onChange={(e) =>
              setReferralFilters({
                status: e.target.value ? [e.target.value as ReferralStatus] : undefined,
              })
            }
            sx={{ minWidth: 140 }}
          >
            <MenuItem value="">All statuses</MenuItem>
            {Object.values(ReferralStatus).map((s) => (
              <MenuItem key={s} value={s}>
                {s.replace(/_/g, ' ')}
              </MenuItem>
            ))}
          </Select>

          <Select
            size="small"
            displayEmpty
            value={referralFilters.priority?.[0] ?? ''}
            onChange={(e) =>
              setReferralFilters({
                priority: e.target.value ? [e.target.value as ReferralPriority] : undefined,
              })
            }
            sx={{ minWidth: 120 }}
          >
            <MenuItem value="">All priorities</MenuItem>
            {Object.values(ReferralPriority).map((p) => (
              <MenuItem key={p} value={p}>
                {p}
              </MenuItem>
            ))}
          </Select>

          <Select
            size="small"
            displayEmpty
            value={referralFilters.specialtyType?.[0] ?? ''}
            onChange={(e) =>
              setReferralFilters({
                specialtyType: e.target.value ? [e.target.value as SpecialtyType] : undefined,
              })
            }
            sx={{ minWidth: 140 }}
          >
            <MenuItem value="">All specialties</MenuItem>
            {Object.values(SpecialtyType).map((s) => (
              <MenuItem key={s} value={s}>
                {s.replace(/_/g, ' ')}
              </MenuItem>
            ))}
          </Select>

          <Button size="small" onClick={resetReferralFilters}>
            Clear filters
          </Button>
        </Toolbar>

        {/* Bulk actions bar */}
        {selectedIds.ids.size > 0 && (
          <>
            <Divider />
            <Toolbar sx={{ gap: 2, bgcolor: 'action.selected', minHeight: 'auto', py: 1 }}>
              <Chip label={`${selectedIds.ids.size} selected`} size="small" />
              <Button
                size="small"
                disabled={bulkPending}
                onClick={() =>
                  bulkAction({
                    referralIds: selectedIds.ids,
                    action: 'SET_PRIORITY',
                    payload: { priority: ReferralPriority.URGENT },
                  })
                }
              >
                Mark urgent
              </Button>
              <Button
                size="small"
                disabled={bulkPending}
                onClick={() =>
                  bulkAction({
                    referralIds: selectedIds.ids,
                    action: 'SET_PRIORITY',
                    payload: { priority: ReferralPriority.ROUTINE },
                  })
                }
              >
                Mark routine
              </Button>
              <Button size="small" color="inherit" onClick={() => setSelectedIds(prev => ({ ids: new Set([]), type: "include" as any }))}>
                Deselect all
              </Button>
            </Toolbar>
          </>
        )}

        <Divider />

        <ReferralsDataGrid
          rows={rows}
          total={total}
          loading={isFetching}
          filters={referralFilters}
          selectedIds={selectedIds}
          onSelectionChange={setSelectedIds}
          onFiltersChange={setReferralFilters}
        />
      </Paper>
    </Box>
  );
}
