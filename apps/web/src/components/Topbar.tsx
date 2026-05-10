import { AppBar, Avatar, Box, IconButton, Menu, MenuItem, Toolbar, Tooltip, Typography } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUiStore } from 'src/store/ui.store';
import { useAuthStore } from 'src/store/auth.store';

export function TopBar({ height, sidebarWidth }: { height: number; sidebarWidth: number }) {
    const { toggleSidebar, sidebarOpen } = useUiStore();
    const { user, clearAuth } = useAuthStore();
    const navigate = useNavigate();
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

    const handleLogout = () => {
        clearAuth();
        navigate('/login');
    };

    return (
        <AppBar
            position="fixed"
            elevation={0}
            sx={{
                width: sidebarOpen ? `calc(100% - ${sidebarWidth}px)` : '100%',
                ml: sidebarOpen ? `${sidebarWidth}px` : 0,
                transition: 'width 0.2s ease, margin 0.2s ease',
                bgcolor: 'background.paper',
                borderBottom: '1px solid',
                borderColor: 'divider',
                color: 'text.primary',
                height,
            }}
        >
            <Toolbar sx={{ height, minHeight: `${height}px !important` }}>
                <IconButton edge="start" onClick={toggleSidebar} sx={{ mr: 2 }}>
                    <MenuIcon />
                </IconButton>

                <Box flexGrow={1} />

                <Tooltip title={`${user?.fullName ?? ''} · ${user?.role ?? ''}`}>
                    <IconButton onClick={(e) => setAnchorEl(e.currentTarget)} size="small">
                        <Avatar sx={{ width: 34, height: 34, bgcolor: 'primary.main', fontSize: 14 }}>
                            {user?.fullName?.[0] ?? 'U'}
                        </Avatar>
                    </IconButton>
                </Tooltip>

                <Menu
                    anchorEl={anchorEl}
                    open={Boolean(anchorEl)}
                    onClose={() => setAnchorEl(null)}
                    transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                    anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
                >
                    <MenuItem disabled>
                        <Box>
                            <Typography variant="body2" fontWeight={600}>{user?.fullName}</Typography>
                            <Typography variant="caption" color="text.secondary">{user?.role}</Typography>
                        </Box>
                    </MenuItem>
                    <MenuItem onClick={handleLogout}>Log out</MenuItem>
                </Menu>
            </Toolbar>
        </AppBar>
    )
}