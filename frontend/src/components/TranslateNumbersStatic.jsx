// src/components/TranslateNumbersStatic.js
import { useRef, useEffect, useState } from 'react';
import axios from 'axios';
import {
  Box,
  Typography,
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

const TranslateNumbersStatic = () => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [prediction, setPrediction] = useState('Esperando...');

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
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0);

    const imageData = canvas.toDataURL('image/jpeg');
    try {
      const { data } = await axios.post('http://localhost:5000/predict_static/', { image: imageData });
      setPrediction(data.prediction);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <Box display="flex" justifyContent="center" mt={4}>
      <Paper elevation={6} sx={{ p: 4, borderRadius: 3, maxWidth: 700, width: '100%', textAlign: 'center' }}>
        <Typography variant="h5" fontWeight="bold" gutterBottom>
          Traducir Números del 0 al 4
        </Typography>

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

        <Typography
          variant="subtitle1"
          sx={{ fontWeight: 600, color: 'text.secondary' }}
        >
          <strong>Traducción:</strong> {prediction}
        </Typography>
      </Paper>
    </Box>
  );
};

export default TranslateNumbersStatic;
