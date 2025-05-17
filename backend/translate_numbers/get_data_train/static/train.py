from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import Dense
from tensorflow.keras.utils import to_categorical
import numpy as np
import os

# Cargar los datos
X = []
y = []

labels = os.listdir("hand_keypoints_data")
label_map = {label: i for i, label in enumerate(labels)}

for label in labels:
    folder = os.path.join("hand_keypoints_data", label)
    for file in os.listdir(folder):
        keypoints = np.load(os.path.join(folder, file))
        X.append(keypoints)
        y.append(label_map[label])

X = np.array(X)
y = to_categorical(y)

# Crear y entrenar el modelo
model = Sequential([
    Dense(128, activation='relu', input_shape=(X.shape[1],)),
    Dense(64, activation='relu'),
    Dense(len(label_map), activation='softmax')
])

model.compile(optimizer='adam', loss='categorical_crossentropy', metrics=['accuracy'])
model.fit(X, y, epochs=50, validation_split=0.3)
model.save("keypoints_model.h5")
np.save("label_map.npy", label_map)
