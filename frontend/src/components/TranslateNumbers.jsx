// src/components/TranslateNumbers.js
import React, { useState } from 'react';
import TranslateNumbersStatic from './TranslateNumbersStatic';
import TranslateNumbersDinamic from './TranslateNumbersDinamic';
import {
  Box,
  Paper,
  Typography,
  Button,
  Stack
} from '@mui/material';

const TranslateNumbers = () => {
  const [mode, setMode] = useState(null); // null, '0-4', or '6-9'

  return (
    <Box display="flex" justifyContent="center" mt={4}>
      <Paper elevation={4} sx={{ p: 4, borderRadius: 3, width: '100%', maxWidth: 600, textAlign: 'center' }}>
        <Typography variant="h5" fontWeight="bold" gutterBottom>
          Selecciona Intervalo de Traducción
        </Typography>

        <Stack direction="row" spacing={2} justifyContent="center" mb={3}>
          <Button
            variant={mode === '0-4' ? 'contained' : 'outlined'}
            color="primary"
            onClick={() => setMode('0-4')}
          >
            0 - 4
          </Button>
          <Button
            variant={mode === '6-9' ? 'contained' : 'outlined'}
            color="primary"
            onClick={() => setMode('6-9')}
          >
            6 - 9
          </Button>
        </Stack>

        {mode === '0-4' && <TranslateNumbersStatic />}
        {mode === '6-9' && <TranslateNumbersDinamic />}
        {!mode && (
          <Typography variant="body1" color="text.secondary">
            Por favor selecciona un modo para comenzar.
          </Typography>
        )}
      </Paper>
    </Box>
  );
};

export default TranslateNumbers;
