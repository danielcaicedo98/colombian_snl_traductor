// src/components/TranslateVowels.js
import React, { useRef, useEffect, useState } from 'react';
import axios from 'axios';
import {
  Box,
  Typography,
  Paper,
  CircularProgress,
  Stack,
  styled
} from '@mui/material';

// 📦 Si quieres usar una fuente elegante, agrégala en index.html o con ThemeProvider

const StyledVideoWrapper = styled(Box)(({ theme }) => ({
  border: `4px solid ${theme.palette.primary.main}`,
  borderRadius: '16px',
  overflow: 'hidden',
  boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
  display: 'inline-block',
  backgroundColor: '#000', // fondo detrás del video
  marginBottom: theme.spacing(2),
}));

const StyledTitle = styled(Typography)(({ theme }) => ({
  fontFamily: `'Poppins', sans-serif`,
  fontSize: '2rem',
  fontWeight: 700,
  color: theme.palette.primary.main,
  textShadow: '1px 1px 2px rgba(0,0,0,0.2)',
  marginBottom: theme.spacing(3),
}));

const TranslateVowels = () => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [prediction, setPrediction] = useState('Esperando...');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    navigator.mediaDevices.getUserMedia({ video: true }).then(stream => {
      videoRef.current.srcObject = stream;
      videoRef.current.play();
    });

    const interval = setInterval(() => {
      captureAndPredict();
    }, 1000);

    return () => {
      clearInterval(interval);
      videoRef.current?.srcObject?.getTracks().forEach(t => t.stop());
    };
  }, []);

  const captureAndPredict = async () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0);

    const imageData = canvas.toDataURL('image/jpeg');
    try {
      const { data } = await axios.post('http://localhost:5000/predict/', { image: imageData });
      setPrediction(data.prediction);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setPrediction('Error al predecir');
      setLoading(false);
    }
  };

  return (
    <Box display="flex" justifyContent="center" mt={4}>
      <Paper elevation={6} sx={{ p: 4, borderRadius: 4, width: 'auto', maxWidth: 700, textAlign: 'center' }}>
        <StyledTitle>
          Traductor de Vocales
        </StyledTitle>

        <StyledVideoWrapper>
          <video
            ref={videoRef}
            style={{
              width: '480px',
              transform: 'scaleX(-1)',
              border: 'none',
              display: 'block',
            }}
          />
        </StyledVideoWrapper>

        <canvas ref={canvasRef} style={{ display: 'none' }} />

        <Stack direction="row" justifyContent="center" alignItems="center" spacing={1}>
          <Typography variant="subtitle1" fontWeight="bold">
            Traducción:
          </Typography>
          {loading ? (
            <CircularProgress size={20} color="secondary" />
          ) : (
            <Typography variant="subtitle1">{prediction}</Typography>
          )}
        </Stack>
      </Paper>
    </Box>
  );
};

export default TranslateVowels;
