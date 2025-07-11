// src/components/GestureNav.jsx
import { useState, useEffect, useRef } from 'react';
import { IconButton, CircularProgress, Snackbar, Alert } from '@mui/material';
import { PanTool as GestureIcon, PanToolOutlined as GestureOffIcon } from '@mui/icons-material';

const GestureNav = ({ onNavigate, onStatusChange, enabled }) => {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const videoRef = useRef(null);
  const processingRef = useRef(false);
  const lastGestureTimeRef = useRef(0); // Para evitar detecciones rápidas

  useEffect(() => {
    if (enabled) {
      enableGestureNav();
    } else {
      disableGestureNav();
    }
  }, [enabled]);

  const enableGestureNav = async () => {
    setLoading(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          width: 640, 
          height: 480,
          facingMode: 'user' 
        } 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        showFeedback('Navegación por gestos activada');
      }
    } catch (error) {
      showFeedback(`Error al acceder a la cámara: ${error.message}`);
      onStatusChange?.(false);
    } finally {
      setLoading(false);
    }
  };

  const disableGestureNav = () => {
    if (videoRef.current?.srcObject) {
      videoRef.current.srcObject.getTracks().forEach(track => track.stop());
    }
    showFeedback('Navegación por gestos desactivada');
  };

  const processFrame = async () => {
    if (!enabled || processingRef.current || !videoRef.current) return;
    
    // Evitar procesamiento rápido (mínimo 500ms entre gestos)
    const now = Date.now();
    if (now - lastGestureTimeRef.current < 500) return;

    processingRef.current = true;
    
    try {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      const imageData = canvas.toDataURL('image/jpeg');

      const response = await fetch('http://localhost:5000/translate_gestures', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: imageData })
      });

      const data = await response.json();

      if (data.status === 'predicted') {
        lastGestureTimeRef.current = now;
        handleGesture(data.label);
      }
    } catch (error) {
      console.error('Error procesando gesto:', error);
    } finally {
      processingRef.current = false;
    }
  };

  const handleGesture = (gesture) => {
    switch(gesture.toLowerCase()) {
      case 'izquierda':
      case 'left':
        onNavigate?.('next');
        break;
      case 'derecha':
      case 'right':
        onNavigate?.('prev');
        break;
      default:
        break;
    }
  };

  const showFeedback = (msg) => {
    setMessage(msg);
    setOpenSnackbar(true);
  };

  useEffect(() => {
    let intervalId;
    if (enabled) {
      intervalId = setInterval(processFrame, 200);
    }
    return () => clearInterval(intervalId);
  }, [enabled]);

  return (
    <>
      <IconButton 
        color="inherit"
        onClick={() => onStatusChange?.(!enabled)}
        disabled={loading}
        sx={{
          backgroundColor: enabled ? 'rgba(255, 255, 255, 0.2)' : 'transparent',
          '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.3)' },
        }}
      >
        {loading ? (
          <CircularProgress size={24} color="inherit" />
        ) : enabled ? (
          <GestureOffIcon />
        ) : (
          <GestureIcon />
        )}
      </IconButton>

      <video
        ref={videoRef}
        autoPlay
        muted
        playsInline
        style={{ display: 'none' }}
      />

      <Snackbar
        open={openSnackbar}
        autoHideDuration={1500}
        onClose={() => setOpenSnackbar(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity="info" sx={{ width: '100%' }}>
          {message}
        </Alert>
      </Snackbar>
    </>
  );
};

export default GestureNav;