// src/components/TranslateNumbersDinamic.js
import React, { useRef, useEffect, useState } from 'react';
import axios from 'axios';
import {
  Box,
  Typography,
  Button,
  Paper,
  Stack
} from '@mui/material';
import { styled } from '@mui/system';

const StyledVideoWrapper = styled(Box)(({ theme }) => ({
  border: `4px solid rgba(29, 99, 227, 0.96)`,
  borderRadius: '16px',
  overflow: 'hidden',
  boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
  display: 'inline-block',
  backgroundColor: '#000',
  marginBottom: theme.spacing(2),
}));

const TranslateNumbersDinamic = () => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const intervalRef = useRef(null);

  const [message, setMessage] = useState('Pulsa "Iniciar Traducción"');
  const [label, setLabel] = useState(null);
  const [isRunning, setIsRunning] = useState(false);
  const [translation, setTranslation] = useState('');

  const stopSession = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsRunning(false);
  };

  const sendFrame = async () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || video.videoWidth === 0 || label) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const imageData = canvas.toDataURL('image/jpeg');

    try {
      const res = await axios.post('http://localhost:5000/predict_lstm_right/', {
        image: imageData
      });

      const data = res.data;

      if (data.status === 'collecting') {
        setMessage(`📷 Recopilando ${data.collected}/50…`);
      } else if (data.status === 'predicted') {
        setLabel(data.label);
        setMessage(`✅ Traducción: ${data.label}`);
        setTranslation(`¡Listo! Traducción: ${data.label}`);
        stopSession();
      } else if (data.status === 'error') {
        setMessage('❌ Error: ' + data.message);
        stopSession();
      }
    } catch (err) {
      console.error(err);
      setMessage('❌ Error al conectar al backend');
      stopSession();
    }
  };

  const startSession = async () => {
    stopSession();
    setLabel(null);
    setTranslation('');
    setMessage('Inicializando cámara…');

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setIsRunning(true);
        setMessage('📷 Recopilando 0/50…');
        intervalRef.current = setInterval(sendFrame, 200);
      } else {
        setMessage('Error: cámara no inicializada.');
      }
    } catch (err) {
      console.error(err);
      setMessage('Error al acceder a la cámara: ' + err.message);
    }
  };

  useEffect(() => {
    return () => stopSession();
  }, []);

  return (
    <Box display="flex" justifyContent="center" mt={4}>
      <Paper elevation={6} sx={{ p: 4, borderRadius: 3, maxWidth: 700, width: '100%', textAlign: 'center' }}>
        <Typography variant="h5" fontWeight="bold" gutterBottom>
          Traducir del 6 al 9
        </Typography>

        {translation && (
          <Typography
            variant="subtitle1"
            sx={{
              mb: 2,
              fontWeight: 600,
              color: 'success.main'
            }}
          >
            {translation}
          </Typography>
        )}

        <StyledVideoWrapper>
          <video
            ref={videoRef}
            style={{
              width: '480px',
              transform: 'scaleX(-1)',
              display: 'block'
            }}
          />
        </StyledVideoWrapper>

        <canvas ref={canvasRef} style={{ display: 'none' }} />

        <Typography variant="body1" sx={{ mb: 2, color: 'text.secondary' }}>
          {message}
        </Typography>

        <Stack direction="row" justifyContent="center">
          <Button
            variant="contained"
            color="primary"
            onClick={startSession}
          >
            {isRunning ? '🔄 Reiniciar' : '🎬 Iniciar Traducción'}
          </Button>
        </Stack>
      </Paper>
    </Box>
  );
};

export default TranslateNumbersDinamic;
