import { useCallback } from 'react';
import {
  DataGrid,
  GridColDef,
  GridSortModel,
  GridRowSelectionModel,
  GridActionsCellItem,
  GridPaginationModel,
} from '@mui/x-data-grid';
import { Box, Skeleton } from '@mui/material';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import { useNavigate } from 'react-router-dom';
import { ReferralFilterParams } from '@referrals/shared';
import { ReferralStatus, ReferralPriority } from '@referrals/shared';
import { format } from 'date-fns';
import { ReferralListItem } from '../../../api/services/referrals.service';
import { StatusBadge } from '../../../components/ui/StatusBadge';
import { PriorityChip } from '../../../components/ui/PriorityChip';

interface ReferralsDataGridProps {
  rows: ReferralListItem[];
  total: number;
  loading: boolean;
  filters: ReferralFilterParams;
  onFiltersChange: (patch: Partial<ReferralFilterParams>) => void;
  selectedIds: GridRowSelectionModel;
  onSelectionChange: (ids: GridRowSelectionModel) => void;
}

const COLUMNS: GridColDef<ReferralListItem>[] = [
  {
    field: 'patientName',
    headerName: 'Patient',
    getOptionLabel(value: any) {
      return value.fullName
    },
    flex: 1.5,
    minWidth: 160,
  },
  {
    field: 'specialtyType',
    headerName: 'Referral type',
    flex: 1,
    minWidth: 130,
    valueFormatter: (value: string) =>
      value.charAt(0) + value.slice(1).toLowerCase().replace(/_/g, ' '),
  },
  {
    field: 'status',
    headerName: 'Status',
    flex: 1,
    minWidth: 150,
    renderCell: ({ value }) => <StatusBadge status={value as ReferralStatus} />,
    sortable: true,
  },
  {
    field: 'priority',
    headerName: 'Priority',
    width: 110,
    renderCell: ({ value }) => (
      <PriorityChip priority={value as ReferralPriority} />
    ),
    sortable: true,
  },
  {
    field: 'specialistName',
    headerName: 'Specialist',
    flex: 1,
    minWidth: 140,
    valueFormatter: (value: string | null) => value ?? '—',
  },
  {
    field: 'referringProviderName',
    headerName: 'Referring provider',
    flex: 1,
    minWidth: 160,
  },
  {
    field: 'createdAt',
    headerName: 'Created',
    width: 110,
    valueFormatter: (value: string) =>
      format(new Date(value), 'MMM d, yyyy'),
    sortable: true,
  },
  {
    field: 'actions',
    type: 'actions',
    headerName: '',
    width: 60,
    getActions: ({ row }) => [
      <GridActionsCellItem
        key="open"
        icon={<OpenInNewIcon fontSize="small" />}
        label="View referral"
        onClick={() => window.open(`/referrals/${row.id}`, '_blank')}
      />,
    ],
  },
];

export function ReferralsDataGrid({
  rows,
  total,
  loading,
  filters,
  selectedIds,
  onFiltersChange,
  onSelectionChange,
}: ReferralsDataGridProps) {
  const navigate = useNavigate();

  const handleSortChange = useCallback(
    (model: GridSortModel) => {
      if (model.length > 0) {
        onFiltersChange({
          sortBy: model[0].field,
          sortOrder: model[0].sort === 'asc' ? 'ASC' : 'DESC',
        });
      }
    },
    [onFiltersChange],
  );

  const handlePaginationChange = useCallback(
    (model: GridPaginationModel) => {
      onFiltersChange({ page: model.page + 1, limit: model.pageSize });
    },
    [onFiltersChange],
  );

  // MUI X v9: GridRowSelectionModel is string[] | number[] — cast accordingly
  const handleSelectionChange = useCallback(
    (model: GridRowSelectionModel) => {
      onSelectionChange(model);
    },
    [onSelectionChange],
  );

  if (loading && rows.length === 0) {
    return (
      <Box>
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} height={52} sx={{ mb: 0.5 }} />
        ))}
      </Box>
    );
  }

  return (
    <DataGrid
      rows={rows}
      columns={COLUMNS}
      rowCount={total}
      loading={loading}
      paginationMode="server"
      sortingMode="server"
      checkboxSelection
      disableRowSelectionOnClick={false}
      paginationModel={{
        page: (filters.page ?? 1) - 1,
        pageSize: filters.limit ?? 25,
      }}
      pageSizeOptions={[10, 25, 50, 100]}
      rowSelectionModel={selectedIds}
      onRowSelectionModelChange={handleSelectionChange}
      onSortModelChange={handleSortChange}
      onPaginationModelChange={handlePaginationChange}
      onRowClick={({ row }) => navigate(`/referrals/${row.id}`)}
      // Styles are now in theme.ts MuiDataGrid override
      style={{
        border: 'none',
      }}
      autoHeight
    />
  );
}
