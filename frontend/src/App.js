// src/App.js
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import {
  AppBar,
  Tabs,
  Tab,
  Toolbar,
  Typography,
  Container,
  CssBaseline,
  Box
} from '@mui/material';

import PracticeVowels from './components/PracticeVowel';
import PracticeSequences from './components/PracticeSequences';
import PracticeNumbers from './components/PracticeNumbers';
import TranslateVowels from './components/TranslateVowels';
import TranslateNumbers from './components/TranslateNumbers';
import TranslateGestures from './components/TranslateGestures';

function App() {
  const navigate = useNavigate();
  const location = useLocation();

  const tabs = [
    { label: 'Traducir Vocales', path: '/translatevowels' },
    { label: 'Traducir Números', path: '/translatenumbers' },
    { label: 'Traducir Gestos', path: '/translategestures' },
    { label: 'Práctica Vocales', path: '/practicevowel' },
    { label: 'Práctica Gestos', path: '/practicegestures' },
    { label: 'Práctica Números', path: '/practicenumbers' },
  ];

  const currentTab = tabs.findIndex(tab => location.pathname.startsWith(tab.path));

  const handleChange = (event, newValue) => {
    navigate(tabs[newValue].path);
  };

  return (
    <>
      <CssBaseline />
      <AppBar
        position="static"
        sx={{
          background: 'linear-gradient(90deg, #0d47a1, #1976d2)',
          boxShadow: '0 4px 12px rgba(25, 118, 210, 0.5)',
        }}
      >
        <Toolbar sx={{ display: 'flex', justifyContent: 'flex-start', gap: 2 }}>
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
            onChange={handleChange}
            
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
    </>
  );
}

export default App;
