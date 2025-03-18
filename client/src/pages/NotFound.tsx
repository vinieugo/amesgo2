import React from 'react';
import { Link } from 'react-router-dom';
import { Box, Button, Container, Typography, Paper } from '@mui/material';
import { Home as HomeIcon } from '@mui/icons-material';

const NotFound: React.FC = () => {
  return (
    <Container maxWidth="md">
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '80vh',
        }}
      >
        <Paper elevation={3} sx={{ p: 5, textAlign: 'center', width: '100%' }}>
          <Typography variant="h1" component="h1" gutterBottom>
            404
          </Typography>
          <Typography variant="h4" component="h2" gutterBottom>
            Página não encontrada
          </Typography>
          <Typography variant="body1" color="text.secondary" paragraph>
            A página que você está procurando não existe ou foi removida.
          </Typography>
          <Button
            variant="contained"
            color="primary"
            size="large"
            startIcon={<HomeIcon />}
            component={Link}
            to="/"
            sx={{ mt: 3 }}
          >
            Voltar para a Página Inicial
          </Button>
        </Paper>
      </Box>
    </Container>
  );
};

export default NotFound; 