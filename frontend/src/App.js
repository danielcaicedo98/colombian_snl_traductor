// src/App.js
import { useState } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import {
  AppBar,
  Tabs,
  Tab,
  Toolbar,
  Typography,
  Container,
  CssBaseline,
  Box,
  Snackbar,
  Alert,
  IconButton,
  Badge
} from '@mui/material';
import { Gesture } from '@mui/icons-material';
import { Close as GestureOff } from '@mui/icons-material';

import PracticeVowels from './components/PracticeVowel';
import PracticeSequences from './components/PracticeSequences';
import PracticeNumbers from './components/PracticeNumbers';
import TranslateVowels from './components/TranslateVowels';
import TranslateNumbers from './components/TranslateNumbers';
import TranslateGestures from './components/TranslateGestures';
import GestureNav from './components/GestureNav';

function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [gestureNavEnabled, setGestureNavEnabled] = useState(false);
  const [activeGesture, setActiveGesture] = useState(null);

  const tabs = [
    { label: 'Traducir Vocales', path: '/translatevowels' },
    { label: 'Traducir Números', path: '/translatenumbers' },
    { label: 'Traducir Gestos', path: '/translategestures' },
    { label: 'Práctica Vocales', path: '/practicevowel' },
    { label: 'Práctica Gestos', path: '/practicegestures' },
    { label: 'Práctica Números', path: '/practicenumbers' },
  ];

  const currentTab = tabs.findIndex(tab => location.pathname.startsWith(tab.path));

  // Manejar navegación por gestos
  const handleGestureNavigation = (action) => {
    if (!gestureNavEnabled) return;

    switch(action) {
      case 'next':
        const nextTab = (currentTab + 1) % tabs.length;
        navigate(tabs[nextTab].path);
        showFeedback(`Navegando a: ${tabs[nextTab].label}`);
        break;
      case 'prev':
        const prevTab = (currentTab - 1 + tabs.length) % tabs.length;
        navigate(tabs[prevTab].path);
        showFeedback(`Navegando a: ${tabs[prevTab].label}`);
        break;
      case 'select':
        showFeedback(`Seleccionado: ${tabs[currentTab].label}`);
        break;
      default:
        break;
    }
  };

  // Mostrar feedback al usuario
  const showFeedback = (message) => {
    setSnackbarMessage(message);
    setSnackbarOpen(true);
  };

  const handleCloseSnackbar = () => {
    setSnackbarOpen(false);
  };

  // Navegación normal por clicks
  const handleTabChange = (event, newValue) => {
    navigate(tabs[newValue].path);
  };

  // Alternar navegación por gestos
  const toggleGestureNav = () => {
    setGestureNavEnabled(!gestureNavEnabled);
    showFeedback(`Navegación por gestos ${!gestureNavEnabled ? 'activada' : 'desactivada'}`);
  };

  // Manejar gestos detectados
  const handleGestureDetected = (gesture) => {
    setActiveGesture(gesture);
    setTimeout(() => setActiveGesture(null), 1000); // Limpiar después de 1 segundo
  };

  return (
    <>
      <CssBaseline />
      
      {/* Componente de navegación por gestos (siempre renderizado pero controlado internamente) */}
      <GestureNav 
        onNavigate={handleGestureNavigation}
        onGestureDetected={handleGestureDetected}
        enabled={gestureNavEnabled}
      />
      
      <AppBar
        position="static"
        sx={{
          background: 'linear-gradient(90deg, #0d47a1, #1976d2)',
          boxShadow: '0 4px 12px rgba(25, 118, 210, 0.5)',
        }}
      >
        <Toolbar sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography
              variant="h6"
              sx={{
                fontWeight: 'bold',
                letterSpacing: 1.2,
                color: '#fff',
                userSelect: 'none',
                whiteSpace: 'nowrap',
              }}
            >
              LSC - Traductor
            </Typography>

            <Tabs
              value={currentTab === -1 ? false : currentTab}
              onChange={handleTabChange}
              indicatorColor="secondary"
              variant="scrollable"
              scrollButtons="auto"
              sx={{
                '.MuiTab-root': {
                  color: 'rgba(246, 239, 239, 0.8)',
                  textTransform: 'none',
                  fontWeight: 600,
                  paddingX: 2,
                  borderRadius: '12px',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    color: '#fff',
                    backgroundColor: 'rgba(255, 255, 255, 0.15)',
                    boxShadow: '0 2px 8px rgba(255,255,255,0.3)',
                  },
                },
                '.Mui-selected': {
                  color: '#fff !important',
                  fontWeight: 'bold',
                  backgroundColor: 'rgba(255, 255, 255, 0.25)',
                  boxShadow: '0 4px 12px rgba(255, 255, 255, 0.4)',
                },
                '.MuiTabs-indicator': {
                  height: '4px',
                  borderRadius: '4px',
                  backgroundColor: '#ffeb3b',
                },
              }}
            >
              {tabs.map((tab, idx) => (
                <Tab key={idx} label={tab.label} />
              ))}
            </Tabs>
          </Box>

          {/* Botón para activar/desactivar navegación por gestos */}
          <IconButton 
  color="inherit" 
  onClick={toggleGestureNav}
  sx={{
    backgroundColor: gestureNavEnabled ? 'rgba(255, 255, 255, 0.2)' : 'transparent',
    '&:hover': {
      backgroundColor: 'rgba(255, 255, 255, 0.3)',
    },
  }}
>
  <Badge
    color="secondary"
    badgeContent={activeGesture ? '🎯' : null}
    invisible={!gestureNavEnabled}
  >
    {gestureNavEnabled ? <GestureOff /> : <Gesture />}
  </Badge>
</IconButton>
        </Toolbar>
      </AppBar>

      <Container sx={{ mt: 4 }}>
        <Box>
          <Routes>
            <Route path="/translatevowels" element={<TranslateVowels />} />
            <Route path="/translatenumbers" element={<TranslateNumbers />} />
            <Route path="/translategestures" element={<TranslateGestures />} />
            <Route path="/practicevowel" element={<PracticeVowels />} />
            <Route path="/practicegestures" element={<PracticeSequences />} />
            <Route path="/practicenumbers" element={<PracticeNumbers />} />
            <Route path="*" element={<Typography align="center">Selecciona una opción en el menú</Typography>} />
          </Routes>
        </Box>
      </Container>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={2000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity="info" sx={{ width: '100%' }}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </>
  );
}

export default App;