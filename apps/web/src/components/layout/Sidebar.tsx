import {
    Box, Drawer, List, ListItemButton, ListItemIcon,
    ListItemText, Typography, Divider, Chip,
} from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import AssignmentIcon from '@mui/icons-material/Assignment';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import { useLocation, useNavigate } from 'react-router-dom';
import { useUiStore } from '../../store/ui.store';

interface NavItem {
    label: string;
    icon: React.ReactNode;
    path: string;
    badge?: string;
}

const NAV_ITEMS: NavItem[] = [
    { label: 'Dashboard', icon: <DashboardIcon />, path: '/' },
    { label: 'Referrals', icon: <AssignmentIcon />, path: '/referrals' },
    { label: 'New referral', icon: <AddCircleOutlineIcon />, path: '/referrals/new' },
];

export function Sidebar({ width }: { width: number }) {
    const sidebarOpen = useUiStore(s => s.sidebarOpen)
    const navigate = useNavigate();
    const { pathname } = useLocation();

    return (
        <Drawer
            variant="persistent"
            open={sidebarOpen}
            sx={{
                width,
                flexShrink: 0,
                '& .MuiDrawer-paper': {
                    width,
                    boxSizing: 'border-box',
                    borderRight: '1px solid',
                    borderColor: 'divider',
                    bgcolor: 'background.paper',
                },
            }}
        >
            {/* Logo */}
            <Box sx={{ px: 2.5, py: 2.5, display: 'flex', alignItems: 'center', gap: 1, height: 63 }}>
                <Box
                    sx={{
                        width: 32, height: 32, borderRadius: 1,
                        bgcolor: 'primary.main', display: 'flex',
                        alignItems: 'center', justifyContent: 'center',
                    }}
                >
                    <Typography variant="caption" sx={{ color: 'white', fontWeight: 700 }}>R</Typography>
                </Box>
                <Typography variant="subtitle1" fontWeight={700}>
                    Referrals
                </Typography>
            </Box>

            <Divider />

            <List sx={{ px: 1, pt: 1 }}>
                {NAV_ITEMS.map((item) => {
                    console.log({ pathname });
                    console.log("item.path: ", item.path);


                    const active =
                        item.path === '/'
                            ? pathname === '/'
                            : pathname === item.path;

                    return (
                        <ListItemButton
                            key={item.path}
                            selected={active}
                            onClick={() => navigate(item.path)}
                            sx={{
                                borderRadius: 1.5,
                                mb: 0.5,
                                '&.Mui-selected': {
                                    bgcolor: 'primary.main',
                                    color: 'white',
                                    '& .MuiListItemIcon-root': { color: 'white' },
                                    '&:hover': { bgcolor: 'primary.dark' },
                                },
                            }}
                        >
                            <ListItemIcon sx={{ minWidth: 36 }}>{item.icon}</ListItemIcon>
                            <ListItemText
                                primary={item.label}
                                slotProps={{ primary: { variant: 'body2', fontWeight: active ? 600 : 400 } }}
                            />
                            {item.badge && (
                                <Chip label={item.badge} size="small" color="error" sx={{ height: 18 }} />
                            )}
                        </ListItemButton>
                    );
                })}
            </List>
        </Drawer>
    );
}
