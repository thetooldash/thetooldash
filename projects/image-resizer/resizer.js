class ImageResizer {
    constructor() {
        this.originalImage = null;
        this.processedCanvas = null;
        this.currentFormat = 'jpeg';
        this.quality = 0.9;
        
        this.initializeElements();
        this.bindEvents();
    }

    initializeElements() {
        this.uploadZone = document.getElementById('uploadZone');
        this.fileInput = document.getElementById('fileInput');
        this.imageStats = document.getElementById('imageStats');
        this.controlsSection = document.getElementById('controlsSection');
        this.previewSection = document.getElementById('previewSection');
        this.downloadSection = document.getElementById('downloadSection');
        
        this.originalWidth = document.getElementById('originalWidth');
        this.originalHeight = document.getElementById('originalHeight');
        this.fileSize = document.getElementById('fileSize');
        this.fileFormat = document.getElementById('fileFormat');
        
        this.newWidthInput = document.getElementById('newWidth');
        this.newHeightInput = document.getElementById('newHeight');
        this.maintainAspectCheckbox = document.getElementById('maintainAspect');
        this.fillOptions = document.getElementById('fillOptions');
        this.fillColorInput = document.getElementById('fillColor');
        this.colorPreview = document.getElementById('colorPreview');
        this.colorValue = document.getElementById('colorValue');
        
        this.formatOptions = document.querySelectorAll('.format-option');
        this.qualitySection = document.getElementById('qualitySection');
        this.qualitySlider = document.getElementById('qualitySlider');
        this.qualityValue = document.getElementById('qualityValue');
        
        this.originalPreview = document.getElementById('originalPreview');
        this.processedPreview = document.getElementById('processedPreview');
        this.originalInfo = document.getElementById('originalInfo');
        this.processedInfo = document.getElementById('processedInfo');
        
        this.processBtn = document.getElementById('processBtn');
        this.downloadBtn = document.getElementById('downloadBtn');
    }

    bindEvents() {
        this.uploadZone.addEventListener('click', () => this.fileInput.click());
        this.uploadZone.addEventListener('dragover', this.handleDragOver.bind(this));
        this.uploadZone.addEventListener('dragleave', this.handleDragLeave.bind(this));
        this.uploadZone.addEventListener('drop', this.handleDrop.bind(this));
        this.fileInput.addEventListener('change', this.handleFileSelect.bind(this));

        this.newWidthInput.addEventListener('input', this.handleDimensionChange.bind(this));
        this.newHeightInput.addEventListener('input', this.handleDimensionChange.bind(this));
        this.maintainAspectCheckbox.addEventListener('change', this.handleAspectRatioChange.bind(this));

        this.fillColorInput.addEventListener('input', this.handleColorChange.bind(this));

        this.formatOptions.forEach(option => {
            option.addEventListener('click', this.handleFormatChange.bind(this));
        });

        this.qualitySlider.addEventListener('input', this.handleQualityChange.bind(this));

        this.processBtn.addEventListener('click', this.processImage.bind(this));
        this.downloadBtn.addEventListener('click', this.downloadImage.bind(this));
    }

    handleDragOver(e) {
        e.preventDefault();
        this.uploadZone.classList.add('dragover');
    }

    handleDragLeave(e) {
        e.preventDefault();
        this.uploadZone.classList.remove('dragover');
    }

    handleDrop(e) {
        e.preventDefault();
        this.uploadZone.classList.remove('dragover');
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            this.loadImage(files[0]);
        }
    }

    handleFileSelect(e) {
        const file = e.target.files[0];
        if (file) {
            this.loadImage(file);
        }
    }

    loadImage(file) {
        if (!file.type.startsWith('image/')) {
            alert('Por favor selecciona un archivo de imagen válido.');
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                this.originalImage = img;
                this.displayImageInfo(file, img);
                this.showControls();
                this.setDefaultDimensions(img);
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }

    displayImageInfo(file, img) {
        this.originalWidth.textContent = img.width + 'px';
        this.originalHeight.textContent = img.height + 'px';
        this.fileSize.textContent = this.formatFileSize(file.size);
        this.fileFormat.textContent = file.type.split('/')[1].toUpperCase();
        
        this.originalPreview.src = img.src;
        this.originalInfo.textContent = `${img.width} × ${img.height}`;
        
        this.imageStats.style.display = 'grid';
        this.previewSection.style.display = 'block';
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    }

    showControls() {
        this.controlsSection.style.display = 'block';
    }

    setDefaultDimensions(img) {
        this.newWidthInput.value = img.width;
        this.newHeightInput.value = img.height;
        this.aspectRatio = img.width / img.height;
    }

    handleDimensionChange(e) {
        if (this.maintainAspectCheckbox.checked) {
            if (e.target === this.newWidthInput) {
                const newHeight = Math.round(parseInt(this.newWidthInput.value) / this.aspectRatio);
                this.newHeightInput.value = newHeight;
            } else {
                const newWidth = Math.round(parseInt(this.newHeightInput.value) * this.aspectRatio);
                this.newWidthInput.value = newWidth;
            }
            this.fillOptions.style.display = 'none';
        } else {
            this.checkIfFillNeeded();
        }
    }

    handleAspectRatioChange() {
        if (this.maintainAspectCheckbox.checked) {
            this.handleDimensionChange({ target: this.newWidthInput });
            this.fillOptions.style.display = 'none';
        } else {
            this.checkIfFillNeeded();
        }
    }

    checkIfFillNeeded() {
        const newWidth = parseInt(this.newWidthInput.value);
        const newHeight = parseInt(this.newHeightInput.value);
        const newAspectRatio = newWidth / newHeight;
        
        if (Math.abs(newAspectRatio - this.aspectRatio) > 0.01) {
            this.fillOptions.style.display = 'block';
        } else {
            this.fillOptions.style.display = 'none';
        }
    }

    handleColorChange() {
        const color = this.fillColorInput.value;
        this.colorPreview.style.background = color;
        this.colorValue.textContent = color;
    }

    handleFormatChange(e) {
        this.formatOptions.forEach(opt => opt.classList.remove('active'));
        e.target.classList.add('active');
        this.currentFormat = e.target.dataset.format;
        
        if (this.currentFormat === 'jpeg') {
            this.qualitySection.style.display = 'block';
        } else {
            this.qualitySection.style.display = 'none';
        }
    }

    handleQualityChange() {
        const value = this.qualitySlider.value;
        this.qualityValue.textContent = value + '%';
        this.quality = value / 100;
    }

    processImage() {
        if (!this.originalImage) return;

        const newWidth = parseInt(this.newWidthInput.value);
        const newHeight = parseInt(this.newHeightInput.value);
        const maintainAspect = this.maintainAspectCheckbox.checked;
        const fillColor = this.fillColorInput.value;

        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        canvas.width = newWidth;
        canvas.height = newHeight;

        // Rellenar con color de fondo si es necesario
        if (!maintainAspect) {
            ctx.fillStyle = fillColor;
            ctx.fillRect(0, 0, newWidth, newHeight);
        }

        let drawWidth, drawHeight, offsetX = 0, offsetY = 0;

        if (maintainAspect) {
            drawWidth = newWidth;
            drawHeight = newHeight;
        } else {
            const scaleX = newWidth / this.originalImage.width;
            const scaleY = newHeight / this.originalImage.height;
            const scale = Math.min(scaleX, scaleY);

            drawWidth = this.originalImage.width * scale;
            drawHeight = this.originalImage.height * scale;

            offsetX = (newWidth - drawWidth) / 2;
            offsetY = (newHeight - drawHeight) / 2;
        }

        ctx.drawImage(this.originalImage, offsetX, offsetY, drawWidth, drawHeight);

        this.processedCanvas = canvas;

        // Mostrar vista previa con la calidad y formato correctos
        const mimeType = this.currentFormat === 'jpeg' ? 'image/jpeg' : 'image/png';
        const previewDataURL = this.currentFormat === 'jpeg' 
            ? canvas.toDataURL(mimeType, this.quality)
            : canvas.toDataURL(mimeType);

        this.processedPreview.src = previewDataURL;
        this.processedInfo.textContent = `${newWidth} × ${newHeight}`;

        this.downloadSection.style.display = 'block';
    }

    downloadImage() {
        if (!this.processedCanvas) return;

        const mimeType = this.currentFormat === 'jpeg' ? 'image/jpeg' : 'image/png';
        const dataURL = this.currentFormat === 'jpeg'
            ? this.processedCanvas.toDataURL(mimeType, this.quality)
            : this.processedCanvas.toDataURL(mimeType);

        const link = document.createElement('a');
        link.download = `imagen_redimensionada.${this.currentFormat === 'jpeg' ? 'jpg' : 'png'}`;
        link.href = dataURL;
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new ImageResizer();
});