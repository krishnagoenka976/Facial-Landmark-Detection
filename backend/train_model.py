import os
import math
import numpy as np
import tensorflow as tf
from tensorflow.keras.preprocessing.image import ImageDataGenerator
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import Conv2D, MaxPooling2D, Dropout, Flatten, Dense
from tensorflow.keras.optimizers import Adam
from sklearn.metrics import confusion_matrix, precision_score, recall_score, f1_score
import matplotlib.pyplot as plt
import seaborn as sns

def main():
    # Configuration
    BATCH_SIZE = 128
    EPOCHS = 48
    LEARNING_RATE = 0.0001
    TRAIN_DIR = 'images/train'
    VAL_DIR = 'images/validation'
    IMG_HEIGHT = 48  # Adjust if your dataset has a different image size
    IMG_WIDTH = 48   # Adjust if your dataset has a different image size
    COLOR_MODE = "grayscale" # Change to "rgb" if images are colored

    # 1. Data Preprocessing
    print("--------------------------------------------------")
    print("1. Data Preprocessing")
    train_datagen = ImageDataGenerator(rescale=1./255)
    val_datagen = ImageDataGenerator(rescale=1./255)

    train_generator = train_datagen.flow_from_directory(
        TRAIN_DIR,
        target_size=(IMG_HEIGHT, IMG_WIDTH),
        color_mode=COLOR_MODE,
        batch_size=BATCH_SIZE,
        class_mode='categorical',
        shuffle=True
    )

    validation_generator = val_datagen.flow_from_directory(
        VAL_DIR,
        target_size=(IMG_HEIGHT, IMG_WIDTH),
        color_mode=COLOR_MODE,
        batch_size=BATCH_SIZE,
        class_mode='categorical',
        shuffle=False
    )

    # 2. Build CNN Model
    print("\n--------------------------------------------------")
    print("2. Building CNN Model")
    model = Sequential()

    # Node 1
    model.add(Conv2D(64, (5, 5), padding='same', activation='relu', input_shape=(IMG_HEIGHT, IMG_WIDTH, 1 if COLOR_MODE=="grayscale" else 3)))
    model.add(MaxPooling2D(pool_size=(2, 2)))
    model.add(Dropout(0.25))

    # Node 2
    model.add(Conv2D(128, (5, 5), padding='same', activation='relu'))
    model.add(MaxPooling2D(pool_size=(2, 2)))
    model.add(Dropout(0.25))

    # Node 3
    model.add(Conv2D(256, (5, 5), padding='same', activation='relu'))
    model.add(MaxPooling2D(pool_size=(2, 2)))
    model.add(Dropout(0.25))

    # Node 4
    model.add(Conv2D(512, (5, 5), padding='same', activation='relu'))
    model.add(MaxPooling2D(pool_size=(2, 2)))
    model.add(Dropout(0.25))

    model.add(Flatten())
    model.add(Dense(256, activation='relu'))
    model.add(Dropout(0.25))
    model.add(Dense(train_generator.num_classes, activation='softmax'))

    model.summary()

    # 3. Compile
    print("\n--------------------------------------------------")
    print("3. Compiling Model")
    optimizer = Adam(learning_rate=LEARNING_RATE)
    model.compile(optimizer=optimizer, loss='categorical_crossentropy', metrics=['accuracy'])

    # 4. Training
    print("\n--------------------------------------------------")
    print("4. Training")
    steps_per_epoch = math.ceil(train_generator.samples / BATCH_SIZE)
    validation_steps = math.ceil(validation_generator.samples / BATCH_SIZE)

    print(f"Steps per epoch: {steps_per_epoch}")
    print(f"Validation steps: {validation_steps}")

    history = model.fit(
        train_generator,
        steps_per_epoch=steps_per_epoch,
        epochs=EPOCHS,
        validation_data=validation_generator,
        validation_steps=validation_steps
    )

    # 5. Evaluation
    print("\n--------------------------------------------------")
    print("5. Evaluation & Saving")
    
    # Save the model
    model_name = 'landmark_model.h5'
    model.save(model_name)
    print(f"Model saved successfully to {model_name}")

    print("Generating predictions for evaluation metrics...")
    
    # Reset generator before prediction
    validation_generator.reset()
    
    # Predict on the validation dataset
    steps_for_pred = math.ceil(validation_generator.samples / BATCH_SIZE)
    predictions = model.predict(validation_generator, steps=steps_for_pred)
    y_pred = np.argmax(predictions, axis=1)
    
    # True labels
    y_true = validation_generator.classes

    # Confusion Matrix
    cm = confusion_matrix(y_true, y_pred)
    print("\nConfusion Matrix:")
    print(cm)

    # Precision, Recall, F-measure
    # Use 'weighted' average handles potential class imbalances gracefully.
    precision = precision_score(y_true, y_pred, average='weighted', zero_division=0)
    recall = recall_score(y_true, y_pred, average='weighted', zero_division=0)
    fmeasure = f1_score(y_true, y_pred, average='weighted', zero_division=0)

    print(f"\nEvaluation Metrics:")
    print(f"Precision: {precision:.4f}")
    print(f"Recall: {recall:.4f}")
    print(f"F-measure: {fmeasure:.4f}")

    # Plot confusion matrix and save it
    try:
        class_names = list(validation_generator.class_indices.keys())
        plt.figure(figsize=(10, 8))
        sns.heatmap(cm, annot=True, fmt='d', cmap='Blues', 
                    xticklabels=class_names, yticklabels=class_names)
        plt.ylabel('True Class')
        plt.xlabel('Predicted Class')
        plt.title('Confusion Matrix')
        plt.tight_layout()
        plt.savefig('confusion_matrix.png')
        print("Confusion matrix heatmap saved as 'confusion_matrix.png'")
    except Exception as e:
        print(f"Could not plot confusion matrix heatmap: {e}")

if __name__ == '__main__':
    main()
