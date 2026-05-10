import { Box } from '@mui/material';
import { Outlet, Navigate } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { TopBar } from './Topbar';
import { useAuthStore } from 'src/store/auth.store';
import { useUiStore } from 'src/store/ui.store';

const SIDEBAR_WIDTH = 240;
const TOPBAR_HEIGHT = 64;

export function AppShel() {
    const isAuthenticated = useAuthStore(s => s.isAuthenticated)
    const sidebarOpen = useUiStore(s => s.sidebarOpen)

    if (!isAuthenticated) return <Navigate to="/login" replace />

    return (
        <Box sx={{ display: "flex", minHeight: '100vh', bgcolor: 'background.default' }}>
            <Sidebar width={SIDEBAR_WIDTH} />
            <Box
                component="main"
                sx={{
                    width: "80vw",
                    minHeight: "100vh",
                    flexGrow: 1,
                    display: "flex",
                    flexDirection: "column",
                    transition: 'margin 0.2s ease',
                    ml: sidebarOpen ? 0 : `-${SIDEBAR_WIDTH}px`,
                }}
            >
                <TopBar height={TOPBAR_HEIGHT} sidebarWidth={SIDEBAR_WIDTH} />
                <Box sx={{ p: 3, pt: `${TOPBAR_HEIGHT + 24}px`, flexGrow: 1, width: "100%" }}>
                    <Outlet />
                </Box>
            </Box>
        </Box>
    )
}