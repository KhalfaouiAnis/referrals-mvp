import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Box, Button, Paper, Stack, Typography, Alert } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { UserRole } from '@referrals/shared';
import { useAuthStore } from '../../store/auth.store';
import { apiClient } from '../../api/client';
import { FormField } from '../../components/ui/FormField';

const loginSchema = z.object({
    email: z.string().email('Enter a valid email address.'),
    password: z.string().min(6, 'Password must be at least 6 characters.'),
});
type LoginValues = z.infer<typeof loginSchema>;

interface LoginResponseData {
    accessToken: string;
    user: { id: string; email: string; fullName: string; role: string };
}

export function LoginPage() {
    const navigate = useNavigate();
    const setAuth = useAuthStore(s => s.setAuth);
    const [error, setError] = useState<string | null>(null);

    const { control, handleSubmit, formState: { isSubmitting } } = useForm<LoginValues>({
        resolver: zodResolver(loginSchema),
        defaultValues: { email: '', password: '' },
    });

    const onSubmit = handleSubmit(async (values) => {
        setError(null);
        try {
            const res = await apiClient.post<{ data: LoginResponseData }>(
                '/api/v1/auth/login',
                values,
            );

            const payload = res.data?.data ?? (res.data as unknown as LoginResponseData);

            setAuth(
                {
                    id: payload.user.id,
                    email: payload.user.email,
                    fullName: payload.user.fullName,
                    role: payload.user.role as UserRole,
                },
                payload.accessToken,
            );
            navigate('/');
        } catch {
            setError('Invalid email or password. Please try again.');
        }
    });

    return (
        <Box
            sx={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: 'background.default',
            }}
        >
            <Paper variant="outlined" sx={{ p: 5, width: '100%', maxWidth: 420 }}>
                <Stack spacing={3}>
                    <Box>
                        <Typography variant="h5" fontWeight={700}>
                            Sign in
                        </Typography>
                        <Typography variant="body2" color="text.secondary" mt={0.5}>
                            Referrals — Healthcare Referral Management
                        </Typography>
                    </Box>

                    {error && <Alert severity="error">{error}</Alert>}

                    <Stack spacing={2} component="form" onSubmit={onSubmit}>
                        <FormField
                            control={control}
                            name="email"
                            label="Email address"
                            type="email"
                            autoComplete="email"
                            autoFocus
                        />
                        <FormField
                            control={control}
                            name="password"
                            label="Password"
                            type="password"
                            autoComplete="current-password"
                        />

                        <Button
                            type="submit"
                            variant="contained"
                            size="large"
                            fullWidth
                            loading={isSubmitting}
                            loadingPosition="center"
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? 'Signing in…' : 'Sign in'}
                        </Button>
                    </Stack>

                    <Typography
                        variant="caption"
                        color="text.disabled"
                        textAlign="center"
                        display="block"
                    >
                        Demo: sarah.chen@clinic.com / password123
                    </Typography>
                </Stack>
            </Paper>
        </Box>
    );
}
