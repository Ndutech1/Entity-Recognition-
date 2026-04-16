//ner-frontend/src/components/Navbar.jsx
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  Container,
} from '@mui/material';
import { Link } from 'react-router-dom';
import { useLocation } from 'react-router-dom';

export default function Navbar() {
  const location = useLocation();

  const navItems = [
    { label: 'Dashboard', to: '/' },
    { label: 'Process', to: '/process' },
    { label: 'History', to: '/history' },
  ];

  return (
    <AppBar
      position="sticky"
      elevation={0}
      sx={{
        bgcolor: 'rgba(10, 28, 48, 0.88)',
        backdropFilter: 'blur(10px)',
        borderBottom: '1px solid rgba(255,255,255,0.1)',
      }}
    >
      <Container maxWidth="xl">
        <Toolbar sx={{ py: 1.1, px: { xs: 0, sm: 0 } }}>
          <Box sx={{ flexGrow: 1 }}>
            <Typography
              component={Link}
              to="/"
              variant="h6"
              sx={{
                color: 'common.white',
                textDecoration: 'none',
                fontWeight: 700,
                letterSpacing: 0.35,
              }}
            >
              Nigerian Entity Recognition
            </Typography>
            <Typography
              variant="caption"
              sx={{
                display: 'block',
                color: 'rgba(255,255,255,0.72)',
                letterSpacing: 0.28,
              }}
            >
              Intelligence Workspace
            </Typography>
          </Box>

          <Box
            sx={{
              display: 'flex',
              gap: 1,
              flexWrap: 'wrap',
              justifyContent: 'flex-end',
            }}
          >
            {navItems.map((item) => {
              const isActive = location.pathname === item.to;
              return (
                <Button
                  key={item.to}
                  color="inherit"
                  component={Link}
                  to={item.to}
                  sx={{
                    px: 2,
                    borderRadius: 2.5,
                    textTransform: 'none',
                    fontWeight: 600,
                    bgcolor: isActive ? 'rgba(255,255,255,0.16)' : 'transparent',
                    color: 'rgba(255,255,255,0.95)',
                    border: isActive
                      ? '1px solid rgba(255,255,255,0.35)'
                      : '1px solid transparent',
                    '&:hover': {
                      bgcolor: 'rgba(255,255,255,0.12)',
                    },
                  }}
                >
                  {item.label}
                </Button>
              );
            })}
          </Box>
        </Toolbar>
      </Container>
    </AppBar>
  );
}
