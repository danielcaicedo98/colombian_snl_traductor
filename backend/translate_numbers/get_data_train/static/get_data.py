import cv2
import mediapipe as mp
import numpy as np
import os

mp_hands = mp.solutions.hands
hands = mp_hands.Hands(static_image_mode=False, max_num_hands=1)
mp_drawing = mp.solutions.drawing_utils

SAVE_DIR = "hand_keypoints_data/5"  # Por ejemplo, gesto "E"
os.makedirs(SAVE_DIR, exist_ok=True)

cap = cv2.VideoCapture(0)
frame_count = 0
MAX_FRAMES = 170  # Número máximo de frames a guardar

while frame_count < MAX_FRAMES:
    ret, frame = cap.read()
    if not ret:
        break

    image_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
    results = hands.process(image_rgb)

    if results.multi_hand_landmarks:
        for hand_landmarks in results.multi_hand_landmarks:
            mp_drawing.draw_landmarks(frame, hand_landmarks, mp_hands.HAND_CONNECTIONS)
            
            keypoints = []
            for lm in hand_landmarks.landmark:
                keypoints.extend([lm.x, lm.y, lm.z])

            # Guardar los puntos
            np.save(os.path.join(SAVE_DIR, f"frame_{frame_count}.npy"), np.array(keypoints))
            frame_count += 1

    cv2.imshow("Hand Tracker", frame)
    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

cap.release()
cv2.destroyAllWindows()
