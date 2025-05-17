from flask import Blueprint, request, jsonify
from flask_cors import CORS
import cv2
import numpy as np
import tensorflow as tf
import mediapipe as mp
import base64
import os

# Blueprint
predict_bp = Blueprint('predict_bp', __name__)

# Ruta absoluta del directorio actual (donde está este archivo .py)
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# Rutas absolutas a los archivos
MODEL_PATH = os.path.join(BASE_DIR, "keypoints_model.h5")
LABEL_MAP_PATH = os.path.join(BASE_DIR, "label_map.npy")

# Cargar los archivos
model = tf.keras.models.load_model(MODEL_PATH)
label_map = np.load(LABEL_MAP_PATH, allow_pickle=True).item()

mp_hands = mp.solutions.hands
hands = mp_hands.Hands(
    static_image_mode=False,
    max_num_hands=1,
    min_detection_confidence=0.5,
    min_tracking_confidence=0.5
)

@predict_bp.route('/', methods=['POST'])
def predict():
    try:
        data = request.json
        image_data = data['image'].split(',')[1]
        nparr = np.frombuffer(base64.b64decode(image_data), np.uint8)
        image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

        image_rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
        results = hands.process(image_rgb)

        if results.multi_hand_landmarks:
            for hand_landmarks in results.multi_hand_landmarks:
                keypoints = []
                for lm in hand_landmarks.landmark:
                    keypoints.extend([lm.x, lm.y, lm.z])
                keypoints = np.array(keypoints).reshape(1, -1)

                prediction = model.predict(keypoints)
                class_id = np.argmax(prediction)
                label = list(label_map.keys())[list(label_map.values()).index(class_id)]

                return jsonify({'prediction': label})

        return jsonify({'prediction': 'No hand detected'})
    except Exception as e:
        return jsonify({'error': str(e)})