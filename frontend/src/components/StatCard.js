import React from 'react';
import { Card, CardContent, Box, Typography, alpha } from '@mui/material';

const StatCard = ({ title, value, icon, color = 'primary', trend, trendValue, secondaryValue, onClick }) => {
    return (
        <Card
            elevation={0}
            onClick={onClick}
            sx={{
                height: '100%',
                position: 'relative',
                overflow: 'hidden',
                borderRadius: 4,
                border: '1px solid',
                borderColor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                cursor: onClick ? 'pointer' : 'default',
                '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: (theme) => theme.palette.mode === 'dark'
                        ? '0 12px 24px -10px rgba(0,0,0,0.5)'
                        : `0 12px 24px -10px ${alpha('#000000', 0.1)}`,
                }
            }}
        >
            <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Box
                        sx={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: 48,
                            height: 48,
                            borderRadius: 3,
                            bgcolor: (theme) => alpha(theme.palette[color].main, 0.1),
                            color: `${color}.main`,
                        }}
                    >
                        {React.cloneElement(icon, { fontSize: 'medium' })}
                    </Box>
                    {trendValue && (
                        <Box
                            sx={{
                                display: 'flex',
                                alignItems: 'center',
                                px: 1,
                                py: 0.5,
                                borderRadius: 2,
                                bgcolor: trend === 'up' ? alpha('#2e7d32', 0.1) : alpha('#d32f2f', 0.1),
                                color: trend === 'up' ? '#2e7d32' : '#d32f2f',
                            }}
                        >
                            <Typography variant="caption" sx={{ fontWeight: 700 }}>
                                {trend === 'up' ? '+' : ''}{trendValue}
                            </Typography>
                        </Box>
                    )}
                </Box>

                <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 600, mb: 0.5 }}>
                    {title}
                </Typography>

                <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1 }}>
                    <Typography variant="h4" sx={{ fontWeight: 800, letterSpacing: '-0.02em' }}>
                        {value}
                    </Typography>
                    {secondaryValue && (
                        <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                            {secondaryValue}
                        </Typography>
                    )}
                </Box>
            </CardContent>

            {/* Subtle background decoration */}
            <Box
                sx={{
                    position: 'absolute',
                    top: -20,
                    right: -20,
                    width: 100,
                    height: 100,
                    borderRadius: '50%',
                    background: (theme) => `radial-gradient(circle, ${alpha(theme.palette[color].main, 0.05)} 0%, transparent 70%)`,
                    zIndex: 0
                }}
            />
        </Card>
    );
};

export default StatCard;
