from ultralytics import YOLO
import cv2
import psycopg2
from datetime import datetime
import time
import uuid
import os

# Загрузка модели YOLO
model = YOLO('epoch38.pt')

# Параметры подключения к базе данных
DB_PARAMS = {
    'dbname': 'tirek',
    'user': 'postgres',
    'password': 'arnur', 
    'host': 'localhost',
    'port': '5432'
}

# Создаем директорию для сохранения изображений, если она не существует
os.makedirs('cv/detected_weapons', exist_ok=True)

def insert_detection(event_type, timestamp, student_id=3, organization_id=1):
    try:
        conn = psycopg2.connect(**DB_PARAMS)
        cur = conn.cursor()
        
        new_id = str(uuid.uuid4())

        insert_query = """
        INSERT INTO event (id, event_type, camera_id, timestamp, student_id, organization_id)
        VALUES (%s, %s, %s, %s, %s, %s)
        """
        
        cur.execute(insert_query, (new_id, event_type, None, timestamp, student_id, organization_id))
        print("Выполнение успешно завершено")
        conn.commit()
        
        cur.close()
        conn.close()
        
    except Exception as e:
        print(f"Ошибка базы данных: {e}")

try:
    cap = cv2.VideoCapture(0)
        
    if not cap.isOpened():
        print("Ошибка: Не удалось открыть камеру")
        exit()

    cap.set(cv2.CAP_PROP_FRAME_WIDTH, 1280)
    cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 720)

    weapon_cooldown = False
    last_detection_time = 0

    while True:
        ret, frame = cap.read()
        
        if not ret:
            print("Не удалось захватить кадр")
            break
        
        current_time = time.time()
        
        # Обрабатываем кадр только если не в режиме ожидания
        if not weapon_cooldown:
            results = model(frame, stream=True)
            
            # Создаем копию кадра для отображения
            display_frame = frame.copy()
            
            for r in results:
                # Проходим по всем обнаруженным объектам
                for box in r.boxes:
                    cls = int(box.cls[0])
                    cls_name = model.names[cls]
                    conf = float(box.conf[0])
                    
                    # Отображаем все объекты
                    print(f"Обнаружено {cls_name} с уверенностью {conf:.2f}")
                    
                    # Получаем координаты рамки
                    x1, y1, x2, y2 = box.xyxy[0].cpu().numpy().astype(int)
                    
                    # Выбираем цвет в зависимости от класса
                    color = (0, 0, 255) if cls_name in ['knife', 'weapon'] else (0, 255, 0)
                    
                    # Рисуем рамку для всех объектов
                    cv2.rectangle(display_frame, (x1, y1), (x2, y2), color, 2)
                    cv2.putText(display_frame, f"{cls_name} {conf:.2f}", (x1, y1 - 10), 
                                cv2.FONT_HERSHEY_SIMPLEX, 0.5, color, 2)
                    
                    # Для оружия выполняем дополнительные действия
                    if cls_name in ['knife', 'weapon'] and conf > 0.5:
                        # Сохраняем изображение с обнаруженным оружием
                        timestamp = datetime.now()
                        timestamp_str = timestamp.strftime("%Y%m%d_%H%M%S")
                        image_filename = f"cv/detected_weapons/weapon_{timestamp_str}.jpg"
                        cv2.imwrite(image_filename, display_frame)
                        print(f"Изображение сохранено: {image_filename}")
                        
                        # Добавляем в базу данных
                        insert_detection('WEAPON', timestamp, 3, 1)
                        
                        # Устанавливаем режим ожидания
                        weapon_cooldown = True
                        last_detection_time = current_time
                        break
        
        else:
            # Проверяем, прошел ли период ожидания (5 секунд)
            if current_time - last_detection_time >= 5:
                weapon_cooldown = False
                
            display_frame = frame  # Во время ожидания показываем оригинальный кадр
        
        cv2.imshow('Обнаружение оружия YOLO', display_frame)
        
        if cv2.waitKey(1) & 0xFF == ord('q'):
            break

except Exception as e:
    print(f"Произошла ошибка: {e}")
finally:
    if 'cap' in locals() and cap is not None:
        cap.release()
    cv2.destroyAllWindows()
