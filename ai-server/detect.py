# ai-server/detect.py
import torch
import cv2
import json
import sys
import os

def detect_all_relevant_classes(image_path, model_weights_path="yolov8n.pt", confidence_threshold=0.01):
    detected_objects = []
    try:
        if not os.path.isabs(model_weights_path):
            script_dir = os.path.dirname(os.path.abspath(__file__))
            model_weights_path = os.path.join(script_dir, model_weights_path)

        if not os.path.exists(model_weights_path):
            return [{"error": f"Model weights '{os.path.basename(model_weights_path)}' not found at {model_weights_path}"}]
        if not os.path.exists(image_path):
            return [{"error": f"Image not found at {image_path}"}]

        from ultralytics import YOLO
        model = YOLO(model_weights_path)
        
        # Baris ini akan mencetak nama kelas yang dikenali model baru Anda ke stderr
        # Ini berguna untuk memastikan model yang benar dimuat dan Anda tahu nama kelasnya persis
        print(f"INFO MODEL: Nama kelas yang dikenali oleh '{os.path.basename(model_weights_path)}': {model.names}", file=sys.stderr)

        img = cv2.imread(image_path)
        if img is None:
            return [{"error": f"Could not read image: {image_path}"}]

        results = model(img, conf=confidence_threshold, verbose=False) 

        # Tidak ada lagi filter untuk satu kelas target spesifik di sini
        # Kita akan mengambil semua kelas yang terdeteksi oleh model

        for result in results: 
            boxes = result.boxes  
            names = result.names # Ini adalah dictionary nama kelas dari model

            for i in range(len(boxes)):
                class_index = int(boxes.cls[i].item())
                class_name = names.get(class_index, f"class_{class_index}") # Dapatkan nama kelas aktual

                # Sekarang kita tidak memfilter, jadi semua kelas akan dimasukkan
                # Anda bisa menambahkan logika filter di sini jika suatu saat hanya ingin kelas tertentu

                confidence = float(boxes.conf[i].item())
                xyxy = boxes.xyxy[i].cpu().numpy().astype(int).tolist() 

                detected_objects.append({
                    "box_xyxy": xyxy,
                    "confidence": confidence,
                    "class_name": class_name # Nama kelas dari model akan digunakan
                })
        
    except ImportError:
        return [{"error": "Ultralytics YOLO library not found. Please install it: pip install ultralytics"}]
    except Exception as e:
        import traceback
        print(f"Error in detect_all_relevant_classes: {str(e)}", file=sys.stderr)
        traceback.print_exc(file=sys.stderr)
        return [{"error": f"An error occurred during detection: {str(e)}"}]

    return detected_objects

if __name__ == "__main__":
    if len(sys.argv) > 1:
        img_path = sys.argv[1]
        # Mengganti nama fungsi untuk kejelasan
        detection_results = detect_all_relevant_classes(img_path) 
        print(json.dumps(detection_results))
    else:
        print(json.dumps([{"error": "No image path provided to detect.py."}]))
        sys.exit(1)