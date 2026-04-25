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
                borderColor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.5)',
                bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(30, 41, 59, 0.4)' : 'rgba(255, 255, 255, 0.7)',
                backdropFilter: 'blur(12px)',
                transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                cursor: onClick ? 'pointer' : 'default',
                '&:hover': {
                    transform: 'translateY(-6px)',
                    boxShadow: (theme) => theme.palette.mode === 'dark'
                        ? `0 20px 40px -10px rgba(0,0,0,0.6), 0 0 20px ${alpha(theme.palette[color].main, 0.3)}`
                        : `0 20px 40px -10px ${alpha(theme.palette[color].main, 0.2)}`,
                    borderColor: (theme) => alpha(theme.palette[color].main, 0.4),
                }
            }}
        >
            <CardContent sx={{ p: 3, position: 'relative', zIndex: 1 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Box
                        sx={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: 56,
                            height: 56,
                            borderRadius: '16px',
                            background: (theme) => `linear-gradient(135deg, ${alpha(theme.palette[color].main, 0.2)} 0%, ${alpha(theme.palette[color].main, 0.05)} 100%)`,
                            color: `${color}.main`,
                            boxShadow: (theme) => `0 8px 16px -4px ${alpha(theme.palette[color].main, 0.2)}`,
                            border: (theme) => `1px solid ${alpha(theme.palette[color].main, 0.2)}`,
                        }}
                    >
                        {React.cloneElement(icon, { sx: { fontSize: 28 } })}
                    </Box>
                    {trendValue && (
                        <Box
                            sx={{
                                display: 'flex',
                                alignItems: 'center',
                                px: 1.5,
                                py: 0.5,
                                borderRadius: 10,
                                bgcolor: trend === 'up' ? alpha('#10b981', 0.1) : alpha('#ef4444', 0.1),
                                color: trend === 'up' ? '#10b981' : '#ef4444',
                                border: (theme) => `1px solid ${trend === 'up' ? alpha('#10b981', 0.2) : alpha('#ef4444', 0.2)}`,
                            }}
                        >
                            <Typography variant="caption" sx={{ fontWeight: 800 }}>
                                {trend === 'up' ? '+' : ''}{trendValue}
                            </Typography>
                        </Box>
                    )}
                </Box>

                <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 700, mb: 0.5, textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.75rem' }}>
                    {title}
                </Typography>

                <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1 }}>
                    <Typography variant="h3" sx={{ fontWeight: 900, letterSpacing: '-0.03em', background: (theme) => `linear-gradient(135deg, ${theme.palette.text.primary} 0%, ${alpha(theme.palette.text.primary, 0.7)} 100%)`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                        {value}
                    </Typography>
                    {secondaryValue && (
                        <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600, opacity: 0.8 }}>
                            {secondaryValue}
                        </Typography>
                    )}
                </Box>
            </CardContent>

            {/* Radiant Ambient Glow */}
            <Box
                sx={{
                    position: 'absolute',
                    bottom: -40,
                    right: -40,
                    width: 140,
                    height: 140,
                    borderRadius: '50%',
                    background: (theme) => `radial-gradient(circle, ${alpha(theme.palette[color].main, 0.15)} 0%, transparent 70%)`,
                    filter: 'blur(20px)',
                    zIndex: 0
                }}
            />
        </Card>
    );
};

export default StatCard;
