// src/components/GestureNav.jsx
import { useState, useEffect, useRef } from 'react';
import { IconButton, CircularProgress, Snackbar, Alert } from '@mui/material';
import { PanTool as GestureIcon, PanToolOutlined as GestureOffIcon } from '@mui/icons-material';

const GestureNav = ({ onNavigate, onStatusChange }) => {
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const videoRef = useRef(null);
  const processingRef = useRef(false);

  const toggleGestureNav = async () => {
    if (enabled) {
      disableGestureNav();
      return;
    }

    setLoading(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setEnabled(true);
        onStatusChange?.(true);
        showFeedback('Navegación por gestos activada');
      }
    } catch (error) {
      showFeedback(`Error al acceder a la cámara: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const disableGestureNav = () => {
    if (videoRef.current?.srcObject) {
      videoRef.current.srcObject.getTracks().forEach(track => track.stop());
    }
    setEnabled(false);
    onStatusChange?.(false);
    showFeedback('Navegación por gestos desactivada');
  };

  const processFrame = async () => {
    if (!enabled || processingRef.current || !videoRef.current) return;

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
        handleGesture(data.label);
      } else if (data.status === 'collecting') {
        showFeedback(`Preparando gesto... ${data.collected}/${data.needed} frames`);
      }
    } catch (error) {
      console.error('Error processing frame:', error);
    } finally {
      processingRef.current = false;
    }
  };

  const handleGesture = (gesture) => {
    switch(gesture) {
      case 'swipe_left':
        onNavigate?.('next');
        break;
      case 'swipe_right':
        onNavigate?.('prev');
        break;
      case 'ok_sign':
        onNavigate?.('select');
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
      intervalId = setInterval(processFrame, 200); // Procesar 5 FPS
    }
    return () => clearInterval(intervalId);
  }, [enabled]);

  return (
    <>
      <IconButton 
        color="inherit" 
        onClick={toggleGestureNav}
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
        autoHideDuration={3000}
        onClose={() => setOpenSnackbar(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity={enabled ? 'info' : 'warning'}>
          {message}
        </Alert>
      </Snackbar>
    </>
  );
};

export default GestureNav;