# routes/predict_lstm_right_hand.py
from flask import Blueprint, request, jsonify
import cv2
import numpy as np
import mediapipe as mp
import tensorflow as tf
import base64
from collections import deque
import os

lstm_right_bp = Blueprint('lstm_right_bp', __name__)

# Ruta absoluta del directorio actual (donde está este archivo .py)
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# Rutas absolutas a los archivos
MODEL_PATH = os.path.join(BASE_DIR, "number_lstm_gesture_model.h5")
LABEL_MAP_PATH = os.path.join(BASE_DIR, "number_gesture_label_map.npy")

# Cargar los archivos
model = tf.keras.models.load_model(MODEL_PATH)
label_map = np.load(LABEL_MAP_PATH, allow_pickle=True).item()

mp_holistic = mp.solutions.holistic
holistic = mp_holistic.Holistic()

sequence = deque(maxlen=50)

def extract_keypoints(results):
    right_hand = []
    if results.right_hand_landmarks:
        for lm in results.right_hand_landmarks.landmark:
            right_hand.extend([lm.x, lm.y, lm.z])
    else:
        right_hand.extend([0]*63)
    return np.array(right_hand)

@lstm_right_bp.route('/', methods=['POST'])
def predict_lstm_right():
    try:
        data = request.json
        img_b64 = data['image'].split(',')[1]
        nparr = np.frombuffer(base64.b64decode(img_b64), np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        img_rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
        results = holistic.process(img_rgb)

        keypoints = extract_keypoints(results)
        sequence.append(keypoints)

        if len(sequence) < 50:
            return jsonify({
                'status': 'collecting',
                'collected': len(sequence),
                'needed': 50
            })

        input_seq = np.expand_dims(np.array(sequence), axis=0)
        prediction = model.predict(input_seq, verbose=0)
        class_id = int(np.argmax(prediction))
        label = next(k for k, v in label_map.items() if v == class_id)

        sequence.clear()  # resetear para una nueva predicción

        return jsonify({'status': 'predicted', 'label': label})
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500
