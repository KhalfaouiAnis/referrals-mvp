import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Box, Button, Paper, Typography } from '@mui/material';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
}

interface State {
    error: Error | null;
}

/**
 * Catches any unhandled render error in its subtree and shows a readable message instead of a blank/black screen.
 */
export class ErrorBoundary extends Component<Props, State> {
    state: State = { error: null };

    static getDerivedStateFromError(error: Error): State {
        return { error };
    }

    componentDidCatch(error: Error, info: ErrorInfo) {
        console.error('[ErrorBoundary] Uncaught error:', error, info.componentStack);
    }

    render() {
        if (this.state.error) {
            if (this.props.fallback) return this.props.fallback;

            return (
                <Box
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    minHeight="100vh"
                    bgcolor="#F5F7FA"
                    p={3}
                >
                    <Paper
                        variant="outlined"
                        sx={{ p: 4, maxWidth: 560, width: '100%' }}
                    >
                        <Box display="flex" alignItems="center" gap={1.5} mb={2}>
                            <ErrorOutlineIcon color="error" fontSize="large" />
                            <Typography variant="h6" color="error.main">
                                Something went wrong
                            </Typography>
                        </Box>
                        <Typography
                            variant="body2"
                            component="pre"
                            sx={{
                                bgcolor: 'grey.100',
                                p: 2,
                                borderRadius: 1,
                                overflow: 'auto',
                                fontSize: 12,
                                whiteSpace: 'pre-wrap',
                                wordBreak: 'break-word',
                                mb: 3,
                            }}
                        >
                            {this.state.error.message}
                            {'\n\n'}
                            {this.state.error.stack}
                        </Typography>
                        <Button
                            variant="contained"
                            onClick={() => {
                                this.setState({ error: null });
                                window.location.href = '/';
                            }}
                        >
                            Reload app
                        </Button>
                    </Paper>
                </Box>
            );
        }

        return this.props.children;
    }
}