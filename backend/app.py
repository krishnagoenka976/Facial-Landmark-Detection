import os
import numpy as np
import tensorflow as tf
from flask import Flask, request, jsonify
from flask_cors import CORS
import cv2

app = Flask(__name__)

# --- Production Security ---
# Get the allowed frontend domain from production environment variables (e.g. Heroku, Render config)
# Defaults to '*' (allow all) for easy local testing if the variable isn't set yet.
ALLOWED_ORIGIN = os.environ.get('FRONTEND_URL', '*')
CORS(app, resources={r"/*": {"origins": ALLOWED_ORIGIN}})

@app.route('/', methods=['GET'])
def home():
    return jsonify({'status': 'running', 'message': 'Facial Emotion Recognition API is active.'})

# Load the trained model
MODEL_PATH = 'landmark_model.h5'

try:
    model = tf.keras.models.load_model(MODEL_PATH)
    print("Model loaded successfully.")
except Exception as e:
    print(f"Error loading model: {e}")
    model = None

# Initialize OpenCV Face Detector and Facemark
try:
    face_cascade = cv2.CascadeClassifier('haarcascade_frontalface_default.xml')
    facemark = cv2.face.createFacemarkLBF()
    facemark.loadModel('lbfmodel.yaml')
    print("OpenCV Facemark loaded successfully.")
except Exception as e:
    print(f"Error loading OpenCV models: {e}")
    face_cascade = None
    facemark = None

# Define the emotion classes based on alphabetical order of your dataset folders
EMOTION_CLASSES = ['angry', 'disgust', 'fear', 'happy', 'neutral', 'sad', 'surprise']

@app.route('/predict', methods=['POST'])
def predict():
    try:
        # 1. Get image from the request robustly
        file_bytes = None
        
        if 'image' in request.files:
            file_bytes = request.files['image'].read()
        elif 'file' in request.files:
            file_bytes = request.files['file'].read()
        elif request.is_json:
            data = request.get_json()
            if data and 'image' in data:
                import base64
                img_str = data['image']
                if img_str.startswith('data:image'):
                    img_str = img_str.split(',')[1]
                file_bytes = base64.b64decode(img_str)

        if not file_bytes:
            return jsonify({"error": "No image found in request"}), 400
        
        # 2. Convert raw bytes to a format OpenCV understands
        npimg = np.frombuffer(file_bytes, np.uint8)
        img = cv2.imdecode(npimg, cv2.IMREAD_COLOR)

        if img is None:
            return jsonify({"error": "Failed to decode image"}), 400

        # 3. Detect Face and Apply Preprocessing Fixes
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        
        landmarks_list = []
        face_roi_gray = gray # Fallback to whole image if no face is found
        
        if face_cascade is not None:
            # 1. Detect the face using a standard Haar Cascade
            faces = list(face_cascade.detectMultiScale(gray, 1.1, 4))
            
            # Fallback: If no face bounding box is found (very common on extremely close-cropped 48x48 images),
            # assume the whole image frame is the face.
            if len(faces) == 0:
                img_h, img_w = gray.shape
                faces = [(0, 0, img_w, img_h)]
            
            for (x, y, w, h) in faces:
                # 2. IMPORTANT: Create a SQUARE region of interest (ROI)
                # LBF models work best when the face is in a perfect square
                center_x, center_y = x + w // 2, y + h // 2
                size = max(w, h)
                new_x, new_y = center_x - size // 2, center_y - size // 2
                
                # Ensure coordinates are within image bounds
                new_x, new_y = max(0, new_x), max(0, new_y)
                
                # IMPORTANT: clip size to image bounds to prevent out-of-bounds slice
                img_h, img_w = gray.shape
                roi_w = min(size, img_w - new_x)
                roi_h = min(size, img_h - new_y)
                
                face_roi_gray = gray[new_y:new_y+roi_h, new_x:new_x+roi_w]
                face_roi_color = img[new_y:new_y+roi_h, new_x:new_x+roi_w]
                
                # Check for invalid region
                if face_roi_gray.size == 0 or face_roi_gray.shape[0] == 0 or face_roi_gray.shape[1] == 0:
                    face_roi_gray = gray
                    continue

                # 3. Detect landmarks on the CLEAN square ROI
                if facemark is not None:
                    ok, landmarks = facemark.fit(gray, np.array([[new_x, new_y, roi_w, roi_h]], dtype=np.int32))
                    if ok:
                        face_pts = landmarks[0][0]
                        for (lx, ly) in face_pts:
                            landmarks_list.append({'x': float(lx), 'y': float(ly)})
                break # Process only the primary face for prediction

        gray = cv2.equalizeHist(face_roi_gray) # Fixes the glasses glare!
        resized = cv2.resize(gray, (48, 48))
        normalized = resized.astype("float32") / 255.0
        reshaped = np.reshape(normalized, (1, 48, 48, 1))

        # 4. Predict
        preds = model.predict(reshaped, verbose=0)[0]
        
        # 5. Send back fresh numbers mapped correctly to the EMOTION_CLASSES indices
        # EMOTION_CLASSES = ['angry', 'disgust', 'fear', 'happy', 'neutral', 'sad', 'surprise']
        return jsonify({
            "angry": float(preds[0]),
            "disgust": float(preds[1]),
            "fear": float(preds[2]),
            "happy": float(preds[3]),
            "neutral": float(preds[4]),
            "sad": float(preds[5]),
            "surprise": float(preds[6]),
            "landmarks": landmarks_list
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({'status': 'API is running', 'model_loaded': model is not None})

if __name__ == '__main__':
    # Start the Flask server on port 5000.
    # Note: debug=True is disabled for production safety.
    # When deployed online via Procfile, Gunicorn will skip this block and run the app directly.
    app.run(host='0.0.0.0', port=5000)
