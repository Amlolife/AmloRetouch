# check_model_classes.py
from ultralytics import YOLO
import sys
import os

def get_model_classes(model_path):
    try:
        if not os.path.exists(model_path):
            print(f"ERROR: File model tidak ditemukan di: {model_path}")
            return

        print(f"Mencoba memuat model dari: {model_path}")
        model = YOLO(model_path)
        print(f"Nama kelas untuk model '{os.path.basename(model_path)}':")
        print(model.names) # Ini akan mencetak dictionary nama kelas, misal {0: 'cat', 1: 'dog'}
    except ImportError:
        print("ERROR: Library ultralytics tidak ditemukan. Harap install: pip install ultralytics")
    except Exception as e:
        print(f"ERROR saat memuat model atau mendapatkan nama kelas: {e}")

if __name__ == "__main__":
    if len(sys.argv) > 1:
        pt_file_path = sys.argv[1]
        get_model_classes(pt_file_path)
    else:
        print("Penggunaan: python check_model_classes.py \"<path_ke_file_pt_anda.pt>\"")
        # Contoh penggunaan jika Anda ingin hardcode path untuk tes cepat (ganti dengan path sebenarnya):
        # default_model_path = "C:/Program Files (x86)/Common Files/Adobe/CEP/extensions/amlopanel/ai-server/yolov8n.pt" 
        # if os.path.exists(default_model_path):
        #     print(f"Tidak ada argumen path, mencoba path default: {default_model_path}")
        #     get_model_classes(default_model_path)
        # else:
        #     print(f"File model default tidak ditemukan di: {default_model_path}. Harap berikan path sebagai argumen.")