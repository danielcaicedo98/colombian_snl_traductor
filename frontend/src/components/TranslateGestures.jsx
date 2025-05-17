// src/components/TranslateGestures.jsx
import React, { useRef, useEffect, useState } from 'react';
import axios from 'axios';
import {
  Box,
  Typography,
  Button,
  Paper
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

const TranslateGestures = () => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const intervalRef = useRef(null);
  const streamRef = useRef(null);

  const [message, setMessage] = useState('Pulsa "Iniciar Grabación" para comenzar');
  const [label, setLabel] = useState(null);
  const [isRunning, setIsRunning] = useState(false);
  const [translation, setTranslation] = useState('');

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
    };
  }, []);

  const startPredict = async () => {
    setLabel(null);
    setMessage('Inicializando cámara…');

    if (!streamRef.current) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        streamRef.current = stream;
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      } catch (err) {
        console.error(err);
        setMessage('Error cámara: ' + err.message);
        return;
      }
    }

    setMessage('Recopilando 0/30 frames…');
    setIsRunning(true);
    intervalRef.current = setInterval(sendFrame, 200);
  };

  const stopPredict = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setIsRunning(false);
  };

  const sendFrame = async () => {
    if (!videoRef.current || !canvasRef.current || videoRef.current.videoWidth === 0) return;

    const canvas = canvasRef.current;
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    canvas.getContext('2d').drawImage(videoRef.current, 0, 0);
    const imageData = canvas.toDataURL('image/jpeg');

    try {
      const { data } = await axios.post('http://localhost:5000/predict_lstm/', { image: imageData });

      if (data.status === 'collecting') {
        setMessage(`Recopilando ${data.collected}/30…`);
      } else if (data.status === 'predicted') {
        setLabel(data.label);
        setTranslation(`¡Listo! Traducción: ${data.label}`);
        setMessage('');
        stopPredict();
      } else if (data.status === 'error') {
        setMessage('Error backend: ' + data.message);
        stopPredict();
      }
    } catch (err) {
      console.error(err);
      setMessage('Error conectando al backend');
      stopPredict();
    }
  };

  return (
    <Box display="flex" justifyContent="center" mt={4}>
      <Paper elevation={6} sx={{ p: 4, borderRadius: 3, maxWidth: 700, width: '100%', textAlign: 'center' }}>
        <Typography variant="h5" fontWeight="bold" gutterBottom>
          Traducir Gestos
        </Typography>

        {translation && (
          <Typography variant="subtitle1" color="primary" fontWeight="bold" gutterBottom>
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
            autoPlay
            muted
          />
        </StyledVideoWrapper>

        <canvas ref={canvasRef} style={{ display: 'none' }} />

        {message && (
          <Typography variant="body2" sx={{ color: 'text.secondary', mt: 1 }}>
            {message}
          </Typography>
        )}

        <Box mt={3}>
          {!isRunning && !label && (
            <Button variant="contained" onClick={startPredict}>
              Iniciar Grabación
            </Button>
          )}

          {label && (
            <Button variant="outlined" onClick={startPredict}>
              Reiniciar Traducción
            </Button>
          )}
        </Box>
      </Paper>
    </Box>
  );
};

export default TranslateGestures;
