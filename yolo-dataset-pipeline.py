import os
import cv2
import numpy as np
from pathlib import Path
import albumentations as A
from tqdm import tqdm
import argparse
import yaml
import gc
import shutil
from roboflow import Roboflow
from ultralytics import YOLO

class DatasetAugmentor:
    def __init__(self, input_path, output_path, num_augmentations=2):
        self.input_path = Path(input_path)
        self.output_path = Path(output_path)
        self.num_augmentations = num_augmentations
        
        # Создаем структуру директорий
        for split in ['train', 'val', 'test']:
            (self.output_path / split / 'images').mkdir(parents=True, exist_ok=True)
            (self.output_path / split / 'labels').mkdir(parents=True, exist_ok=True)
        
        # Настраиваем аугментации
        self.transform = A.Compose([
            # Изменения яркости и контраста
            A.OneOf([
                A.RandomBrightnessContrast(
                    brightness_limit=0.3,
                    contrast_limit=0.3,
                    p=0.8
                ),
                A.HueSaturationValue(
                    hue_shift_limit=5,
                    sat_shift_limit=30,
                    val_shift_limit=20,
                    p=0.8
                ),
            ], p=0.5),
            
            # Шум
            A.OneOf([
                A.GaussNoise(var_limit=(10.0, 50.0), p=0.5),
                A.ISONoise(intensity=(0.1, 0.5), p=0.5),
            ], p=0.3),
            
            # Размытие
            A.OneOf([
                A.MotionBlur(blur_limit=3, p=0.5),
                A.GaussianBlur(blur_limit=3, p=0.5),
            ], p=0.2),
            
            # Геометрические преобразования
            A.OneOf([
                A.Rotate(limit=15, p=0.5),
                A.ShiftScaleRotate(
                    shift_limit=0.0625,
                    scale_limit=0.1,
                    rotate_limit=15,
                    p=0.5
                ),
            ], p=0.3),
            
            # Масштабирование
            A.RandomScale(scale_limit=0.2, p=0.3),
            
        ], bbox_params=A.BboxParams(
            format='yolo',
            label_fields=['class_labels'],
            min_visibility=0.3
        ))

    def read_annotations(self, label_path):
        """Читает аннотации в формате YOLO"""
        boxes = []
        classes = []
        try:
            with open(label_path, 'r') as f:
                for line in f:
                    data = line.strip().split()
                    if len(data) == 5:
                        class_id = int(data[0])
                        x, y, w, h = map(float, data[1:])
                        boxes.append([x, y, w, h])
                        classes.append(class_id)
        except Exception as e:
            print(f"Ошибка чтения {label_path}: {e}")
        return np.array(boxes), np.array(classes)

    def write_annotations(self, boxes, classes, output_path):
        """Записывает аннотации в формате YOLO"""
        with open(output_path, 'w') as f:
            for box, cls in zip(boxes, classes):
                f.write(f"{cls} {' '.join(map(str, box))}\n")

    def apply_augmentation(self, image, boxes, classes):
        """Применяет аугментации к изображению и боксам"""
        if len(boxes) == 0:
            return image, boxes, classes
        
        transformed = self.transform(
            image=image,
            bboxes=boxes.tolist(),
            class_labels=classes.tolist()
        )
        return (transformed['image'], 
                np.array(transformed['bboxes']), 
                np.array(transformed['class_labels']))

    def process_split(self, split):
        """Обрабатывает один split датасета"""
        images_dir = self.input_path / split / 'images'
        labels_dir = self.input_path / split / 'labels'
        
        # Получаем список изображений
        image_files = [f for f in images_dir.glob('*.*') 
                      if f.suffix.lower() in ['.jpg', '.png']]
        
        print(f"\nОбработка {split}")
        print(f"Найдено изображений: {len(image_files)}")
        
        stats = {'original': 0, 'augmented': 0}
        
        for img_path in tqdm(image_files, desc=f"Обработка {split}"):
            label_path = labels_dir / f"{img_path.stem}.txt"
            
            # Пропускаем изображения без аннотаций
            if not label_path.exists():
                continue
            
            # Читаем изображение и аннотации
            image = cv2.imread(str(img_path))
            if image is None:
                print(f"\nПропуск поврежденного изображения: {img_path}")
                continue
                
            boxes, classes = self.read_annotations(label_path)
            
            # Сохраняем оригинальное изображение
            new_name = f"aug_{split}_{stats['original']:06d}"
            new_img_path = self.output_path / split / 'images' / f"{new_name}.jpg"
            new_label_path = self.output_path / split / 'labels' / f"{new_name}.txt"
            
            cv2.imwrite(str(new_img_path), image)
            self.write_annotations(boxes, classes, new_label_path)
            stats['original'] += 1
            
            # Применяем аугментации
            if len(boxes) > 0:
                for aug_idx in range(self.num_augmentations):
                    aug_image, aug_boxes, aug_classes = self.apply_augmentation(
                        image, boxes, classes)
                    
                    aug_name = f"aug_{split}_{stats['augmented']:06d}"
                    aug_img_path = self.output_path / split / 'images' / f"{aug_name}.jpg"
                    aug_label_path = self.output_path / split / 'labels' / f"{aug_name}.txt"
                    
                    cv2.imwrite(str(aug_img_path), aug_image)
                    self.write_annotations(aug_boxes, aug_classes, aug_label_path)
                    stats['augmented'] += 1
            
            # Очищаем память
            if (stats['original'] + stats['augmented']) % 100 == 0:
                gc.collect()
        
        return stats

    def augment_dataset(self, class_names=None):
        """Аугментирует весь датасет"""
        print("\n=== Начало аугментации датасета ===")
        
        total_stats = {}
        for split in ['train', 'val', 'test']:
            stats = self.process_split(split)
            total_stats[split] = stats
            
            print(f"\nСтатистика для {split}:")
            print(f"Оригинальных изображений: {stats['original']}")
            print(f"Аугментированных изображений: {stats['augmented']}")
            print(f"Всего: {stats['original'] + stats['augmented']}")
        
        # Создаем data.yaml
        print("\nСоздание конфигурационного файла data.yaml...")
        
        if class_names is None:
            class_names = ['knife', 'weapon']
            
        yaml_content = {
            'path': str(self.output_path),
            'train': str(self.output_path / 'train' / 'images'),
            'val': str(self.output_path / 'val' / 'images'),
            'test': str(self.output_path / 'test' / 'images'),
            'nc': len(class_names),
            'names': class_names
        }
        
        with open(self.output_path / 'data.yaml', 'w') as f:
            yaml.dump(yaml_content, f, default_flow_style=False)
        
        print("\n=== Аугментация завершена ===")
        print(f"Результаты сохранены в: {self.output_path}")
        
        return str(self.output_path / 'data.yaml')


class YOLOPipeline:
    def __init__(self):
        self.args = None
        self.dataset_path = None
        self.data_yaml_path = None
        self.augmented_data_yaml_path = None
    
    def parse_arguments(self):
        parser = argparse.ArgumentParser(description="Загрузка, аугментация и обучение YOLO модели")
        
        # Основные режимы работы
        parser.add_argument("--mode", type=str, choices=['download', 'augment', 'train', 'full'], 
                           default='full', help="Режим работы: скачивание, аугментация, обучение или полный цикл")
        
        # Параметры Roboflow
        parser.add_argument("--api-key", type=str, default="KlH0hZKkTbaLG5h5xbrk", help="Roboflow API ключ")
        parser.add_argument("--workspace", type=str, default="beket", help="Roboflow имя рабочего пространства")
        parser.add_argument("--project", type=str, default="school_dataset_1", help="Roboflow имя проекта")
        parser.add_argument("--version", type=int, default=1, help="Версия датасета в Roboflow")
        parser.add_argument("--model-version", type=str, default="yolov8", help="Формат модели для скачивания")
        parser.add_argument("--dataset-dir", type=str, default="dataset", help="Директория для хранения датасета")
        
        # Параметры аугментации
        parser.add_argument("--augmented-dir", type=str, default="augmented_dataset", 
                           help="Директория для сохранения аугментированного датасета")
        parser.add_argument("--num-aug", type=int, default=2, 
                           help="Количество аугментаций для каждого изображения")
        parser.add_argument("--class-names", type=str, nargs='+', 
                           help="Имена классов в датасете (если не указано, будет взято из data.yaml)")
        
        # Параметры обучения
        parser.add_argument("--epochs", type=int, default=50, help="Количество эпох обучения")
        parser.add_argument("--batch-size", type=int, default=4, help="Размер батча для обучения")
        parser.add_argument("--model-path", type=str, required=False,
                          help="Путь к предварительно обученной модели для fine-tuning")
        parser.add_argument("--results-dir", type=str, default="results", 
                           help="Директория для сохранения результатов обучения")
        
        return parser.parse_args()
    
    def download_from_roboflow(self):
        """Проверяет, существует ли датасет локально. Если нет, загружает его."""
        dataset_path = os.path.join(self.args.dataset_dir, self.args.project)
        
        if os.path.exists(dataset_path):
            print(f"Датасет уже существует: {dataset_path}")
            self.dataset_path = dataset_path
            self.data_yaml_path = os.path.join(dataset_path, "data.yaml")
            return True
        
        try:
            rf = Roboflow(api_key=self.args.api_key)
            project = rf.workspace(self.args.workspace).project(self.args.project)
            version = project.version(self.args.version)
            dataset = version.download(model_format=self.args.model_version)
            
            if dataset:
                print(f"Датасет загружен в: {dataset.location}")
                downloaded_folder = dataset.location
                target_folder = os.path.join(self.args.dataset_dir, os.path.basename(downloaded_folder))
                
                # Перемещаем загруженный датасет в dataset_dir
                if os.path.exists(target_folder):
                    shutil.rmtree(target_folder)
                shutil.move(downloaded_folder, target_folder)
                print(f"Датасет перемещен в: {target_folder}")
                self.dataset_path = target_folder
                self.data_yaml_path = os.path.join(target_folder, "data.yaml")
                return True
            else:
                print("Ошибка загрузки датасета!")
                return False
        except Exception as e:
            print(f"Ошибка при загрузке датасета: {e}")
            return False
    
    def augment_dataset(self):
        """Применяет аугментацию к загруженному датасету."""
        if not self.dataset_path:
            print("Ошибка: путь к датасету не определен. Сначала загрузите датасет.")
            return False
        
        # Читаем имена классов из data.yaml, если они не указаны в аргументах
        class_names = self.args.class_names
        if not class_names and os.path.exists(self.data_yaml_path):
            try:
                with open(self.data_yaml_path, 'r') as f:
                    data_yaml = yaml.safe_load(f)
                    if 'names' in data_yaml:
                        class_names = data_yaml['names']
                        print(f"Использую имена классов из data.yaml: {class_names}")
            except Exception as e:
                print(f"Ошибка чтения data.yaml: {e}")
        
        try:
            augmentor = DatasetAugmentor(
                input_path=self.dataset_path,
                output_path=self.args.augmented_dir,
                num_augmentations=self.args.num_aug
            )
            
            self.augmented_data_yaml_path = augmentor.augment_dataset(class_names=class_names)
            return True
        except Exception as e:
            print(f"Ошибка при аугментации датасета: {e}")
            return False
    
    def train_model(self):
        """Функция для обучения YOLO модели."""
        # Определяем, какой data.yaml использовать
        data_yaml_path = self.augmented_data_yaml_path if self.augmented_data_yaml_path else self.data_yaml_path
        
        if not data_yaml_path or not os.path.exists(data_yaml_path):
            print(f"Ошибка: data.yaml не найден по пути {data_yaml_path}")
            return False
        
        if not self.args.model_path:
            print("Ошибка: не указан путь к модели для обучения (--model-path)")
            return False
        
        try:
            model = YOLO(self.args.model_path)
            
            # Фиксированные гиперпараметры
            results = model.train(
                data=data_yaml_path,
                epochs=self.args.epochs,
                batch=self.args.batch_size,
                imgsz=640,
                resume=True,
                patience=5,
                save=True,
                optimizer="AdamW",
                lr0=0.0001,
                lrf=0.01,
                weight_decay=0.0005,
                project=self.args.results_dir
            )
            print("Обучение успешно завершено!")
            return True
        except Exception as e:
            print(f"Ошибка во время обучения: {e}")
            return False
    
    def run(self):
        """Запускает основной цикл работы."""
        self.args = self.parse_arguments()
        
        # Создаем необходимые директории
        os.makedirs(self.args.dataset_dir, exist_ok=True)
        os.makedirs(self.args.augmented_dir, exist_ok=True)
        os.makedirs(self.args.results_dir, exist_ok=True)
        
        success = True
        
        # Выполняем шаги в зависимости от выбранного режима
        if self.args.mode in ['download', 'full']:
            print("\n=== Шаг 1: Загрузка датасета ===")
            success = self.download_from_roboflow()
            if not success:
                print("Ошибка загрузки датасета. Дальнейшая обработка прекращена.")
                return
        
        if self.args.mode in ['augment', 'full'] and success:
            print("\n=== Шаг 2: Аугментация датасета ===")
            success = self.augment_dataset()
            if not success:
                print("Ошибка аугментации датасета. Дальнейшая обработка прекращена.")
                return
        
        if self.args.mode in ['train', 'full'] and success:
            print("\n=== Шаг 3: Обучение модели ===")
            success = self.train_model()
            if not success:
                print("Ошибка обучения модели.")
                return
        
        print("\n=== Обработка завершена! ===")

def main():
    pipeline = YOLOPipeline()
    pipeline.run()

if __name__ == "__main__":
    main()
