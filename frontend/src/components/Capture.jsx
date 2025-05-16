// src/components/Capture.js
import React, { useRef, useEffect, useState } from 'react';
import axios from 'axios';

const TARGET_COUNT = 150;

const Capture = () => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const [label, setLabel] = useState('E');
  const [status, setStatus] = useState('Listo para capturar');
  const [count, setCount] = useState(0);
  const [capturing, setCapturing] = useState(false);
  
  // Arranca la cámara al montar
  useEffect(() => {
    navigator.mediaDevices.getUserMedia({ video: true })
      .then(stream => {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      });
    return () => {
      // Para la cámara al desmontar
      videoRef.current?.srcObject?.getTracks().forEach(t => t.stop());
    };
  }, []);
  
  // Efecto que, si capturing=true, lanza el intervalo de guardado
  useEffect(() => {
    let intervalId;
    if (capturing) {
      setStatus(`Capturando 0 de ${TARGET_COUNT}…`);
      intervalId = setInterval(() => {
        if (count < TARGET_COUNT) {
          captureKeypoints();
        } else {
          clearInterval(intervalId);
          setCapturing(false);
          setStatus(`✅ Captura completada (${TARGET_COUNT} keypoints)`);
        }
      }, 200); // cada 200ms (5 fps)
    }
    return () => clearInterval(intervalId);
  }, [capturing, count]);
  
  const captureKeypoints = async () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0);
    const imageData = canvas.toDataURL('image/jpeg');
    
    try {
      const { data } = await axios.post('http://localhost:5000/capture', {
        image: imageData,
        label
      });
      if (data.status === 'saved') {
        setCount(c => c + 1);
        setStatus(`Capturando ${count + 1} de ${TARGET_COUNT}…`);
      } else {
        // sin mano detectada: no contamos este frame
        setStatus(`(${count}/${TARGET_COUNT}) sin mano — reintentando…`);
      }
    } catch (err) {
      console.error(err);
      setStatus('Error al capturar');
      setCapturing(false);
    }
  };
  
  const startCapture = () => {
    setCount(0);
    setCapturing(true);
  };
  
  return (
    <div style={{ textAlign: 'center' }}>
      <h2>Modo Captura de Datos</h2>
      <video ref={videoRef} style={{ width: '480px' }} />
      <canvas ref={canvasRef} style={{ display: 'none' }} />

      <div style={{ margin: '1rem 0' }}>
        <label>
          Etiqueta:
          <input
            type="text"
            value={label}
            onChange={e => setLabel(e.target.value.toUpperCase())}
            maxLength={1}
            style={{ marginLeft: '0.5rem', width: '2rem' }}
            disabled={capturing}
          />
        </label>
      </div>

      <button
        onClick={startCapture}
        disabled={capturing}
      >
        {capturing ? 'Capturando…' : `Iniciar Captura (${TARGET_COUNT})`}
      </button>
      <p>{status}</p>
    </div>
  );
};

export default Capture;
