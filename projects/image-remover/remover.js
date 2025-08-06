
        class BackgroundRemover {
            constructor() {
                this.images = [];
                this.currentImageIndex = 0;
                this.isProcessing = false;
                this.brushSize = 20;
                this.brushMode = 'erase';
                this.currentBackground = { type: 'transparent' };
                this.canvas = null;
                this.ctx = null;
                this.isDrawing = false;
                
                this.initializeElements();
                this.bindEvents();
            }

            initializeElements() {
                this.uploadZone = document.getElementById('uploadZone');
                this.fileInput = document.getElementById('fileInput');
                this.imageGallery = document.getElementById('imageGallery');
                this.galleryGrid = document.getElementById('galleryGrid');
                this.processAllBtn = document.getElementById('processAllBtn');
                this.progressBar = document.getElementById('progressBar');
                this.progressFill = document.getElementById('progressFill');
                this.workspace = document.getElementById('workspace');
                this.processedImage = document.getElementById('processedImage');
                this.brushSizeInput = document.getElementById('brushSize');
                this.downloadSection = document.getElementById('downloadSection');
                this.brushSize = this.brushSizeInput.value;
            }

            bindEvents() {
                this.uploadZone.addEventListener('click', () => this.fileInput.click());
                this.uploadZone.addEventListener('dragover', this.handleDragOver.bind(this));
                this.uploadZone.addEventListener('drop', this.handleDrop.bind(this));
                this.uploadZone.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        this.fileInput.click();
                    }
                });
                this.fileInput.addEventListener('change', this.handleFileSelect.bind(this));
                this.processAllBtn.addEventListener('click', this.processAllImages.bind(this));
                this.brushSizeInput.addEventListener('input', () => {
                    this.brushSize = this.brushSizeInput.value;
                });

                document.querySelectorAll('.brush-mode').forEach(btn => {
                    btn.addEventListener('click', (e) => {
                        document.querySelectorAll('.brush-mode').forEach(b => b.classList.remove('active'));
                        e.target.classList.add('active');
                        this.brushMode = e.target.dataset.mode;
                    });
                });

                document.querySelectorAll('.bg-type').forEach(btn => {
                    btn.addEventListener('click', (e) => {
                        document.querySelectorAll('.bg-type').forEach(b => b.classList.remove('active'));
                        e.target.classList.add('active');
                        this.setBackgroundType(e.target.dataset.type);
                    });
                });

                document.querySelectorAll('.color-preset').forEach(preset => {
                    preset.addEventListener('click', (e) => {
                        document.querySelectorAll('.color-preset').forEach(p => p.classList.remove('active'));
                        e.target.classList.add('active');
                        this.currentBackground = { type: 'color', value: e.target.dataset.color };
                        this.applyBackground();
                    });
                });

                document.getElementById('customColor').addEventListener('change', (e) => {
                    this.currentBackground = { type: 'color', value: e.target.value };
                    this.applyBackground();
                });

                document.querySelectorAll('.gradient-preset').forEach(preset => {
                    preset.addEventListener('click', (e) => {
                        document.querySelectorAll('.gradient-preset').forEach(p => p.classList.remove('active'));
                        e.target.classList.add('active');
                        this.currentBackground = { type: 'gradient', value: e.target.dataset.gradient };
                        this.applyBackground();
                    });
                });

                document.getElementById('bgImageUpload').addEventListener('click', () => {
                    document.getElementById('bgImageFile').click();
                });

                document.getElementById('bgImageFile').addEventListener('change', this.handleBackgroundImage.bind(this));

                document.getElementById('resetBtn').addEventListener('click', this.resetCurrentImage.bind(this));
                document.getElementById('downloadPng').addEventListener('click', () => this.downloadImage('png'));
                document.getElementById('downloadJpg').addEventListener('click', () => this.downloadImage('jpg'));

            }

            handleDragOver(e) {
                e.preventDefault();
                this.uploadZone.classList.add('dragover');
            }

            handleDrop(e) {
                e.preventDefault();
                this.uploadZone.classList.remove('dragover');
                const files = Array.from(e.dataTransfer.files).filter(file => file.type.startsWith('image/'));
                this.addImages(files);
            }

            handleFileSelect(e) {
                const files = Array.from(e.target.files).filter(file => file.type.startsWith('image/'));
                this.addImages(files);
            }

            addImages(files) {
                if (this.images.length + files.length > 10) {
                    alert('Máximo 10 imágenes permitidas');
                    return;
                }

                files.forEach(file => {
                    const imageData = {
                        file,
                        id: Date.now() + Math.random(),
                        name: file.name,
                        status: 'pending',
                        originalUrl: null,
                        processedUrl: null,
                        processedImageData: null
                    };

                    const reader = new FileReader();
                    reader.onload = (e) => {
                        imageData.originalUrl = e.target.result;
                        this.updateGalleryItem(imageData);
                    };
                    reader.readAsDataURL(file);

                    this.images.push(imageData);
                });

                this.updateGallery();
            }

            updateGallery() {
                if (this.images.length > 0) {
                    this.imageGallery.style.display = 'block';
                    this.renderGallery();
                }
            }

            renderGallery() {
                this.galleryGrid.innerHTML = '';
                this.images.forEach((image, index) => {
                    const item = document.createElement('div');
                    item.className = `image-item ${index === this.currentImageIndex ? 'active' : ''}`;
                    item.tabIndex = 0;
                    item.innerHTML = `
                        <button class="remove-btn" data-index="${index}" aria-label="Eliminar imagen ${image.name}">×</button>
                        <img src="${image.originalUrl || ''}" alt="${image.name}">
                        <div class="image-name">${image.name}</div>
                        <div class="image-status status-${image.status}">${this.getStatusText(image.status)}</div>
                    `;
                    item.addEventListener('click', () => this.selectImage(index));
                    item.addEventListener('keydown', (e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                            this.selectImage(index);
                        }
                    });
                    item.querySelector('.remove-btn').addEventListener('click', () => this.removeImage(index));
                    this.galleryGrid.appendChild(item);
                });
            }

            updateGalleryItem(imageData) {
                this.renderGallery();
            }

            getStatusText(status) {
                const statusMap = {
                    pending: 'Pendiente',
                    processing: 'Procesando...',
                    completed: 'Completado',
                    error: 'Error'
                };
                return statusMap[status] || status;
            }

            removeImage(index) {
                this.images.splice(index, 1);
                if (this.currentImageIndex >= index && this.currentImageIndex > 0) {
                    this.currentImageIndex--;
                }
                if (this.images.length === 0) {
                    this.imageGallery.style.display = 'none';
                    this.workspace.style.display = 'none';
                } else {
                    this.renderGallery();
                    if (this.images[this.currentImageIndex]?.status === 'completed') {
                        this.showWorkspace();
                    }
                }
            }

            selectImage(index) {
                this.currentImageIndex = index;
                this.renderGallery();
                if (this.images[index].status === 'completed') {
                    this.showWorkspace();
                }
            }

            async processAllImages() {
                if (this.isProcessing) return;
                
                this.isProcessing = true;
                this.processAllBtn.disabled = true;
                this.progressBar.style.display = 'block';

                for (let i = 0; i < this.images.length; i++) {
                    if (this.images[i].status === 'pending') {
                        this.images[i].status = 'processing';
                        this.updateGalleryItem(this.images[i]);
                        
                        try {
                            await this.processImage(this.images[i]);
                            this.images[i].status = 'completed';
                        } catch (error) {
                            this.images[i].status = 'error';
                            console.error('Error processing image:', error);
                            alert('Error al procesar la imagen: ' + this.images[i].name);
                        }
                        
                        this.updateGalleryItem(this.images[i]);
                        this.updateProgress((i + 1) / this.images.length * 100);
                    }
                }

                this.isProcessing = false;
                this.processAllBtn.disabled = false;
                this.progressBar.style.display = 'none';
                
                if (this.images[this.currentImageIndex]?.status === 'completed') {
                    this.showWorkspace();
                }
            }

            async processImage(imageData) {
                return new Promise((resolve, reject) => {
                    const img = new Image();
                    img.onload = () => {
                        const canvas = document.createElement('canvas');
                        const ctx = canvas.getContext('2d');
                        
                        canvas.width = img.width;
                        canvas.height = img.height;
                        
                        ctx.drawImage(img, 0, 0);
                        
                        const imageDataObj = ctx.getImageData(0, 0, canvas.width, canvas.height);
                        const processedData = this.removeBackground(imageDataObj);
                        
                        ctx.putImageData(processedData, 0, 0);
                        
                        imageData.processedUrl = canvas.toDataURL('image/png');
                        imageData.processedImageData = processedData;
                        
                        setTimeout(resolve, 1000 + Math.random() * 2000);
                    };
                    img.onerror = () => reject(new Error('Error al cargar la imagen'));
                    img.src = imageData.originalUrl;
                });
            }

            removeBackground(imageData) {
                const data = imageData.data;
                const width = imageData.width;
                const height = imageData.height;
                
                for (let i = 0; i < data.length; i += 4) {
                    const r = data[i];
                    const g = data[i + 1];
                    const b = data[i + 2];
                    
                    const isBackground = this.shouldRemovePixel(r, g, b, i, data, width, height);
                    
                    if (isBackground) {
                        data[i + 3] = 0;
                    }
                }
                
                return imageData;
            }

            shouldRemovePixel(r, g, b, index, data, width, height) {
                const brightness = (r + g + b) / 3;
                const isWhiteish = r > 200 && g > 200 && b > 200;
                const isGrayish = Math.abs(r - g) < 30 && Math.abs(g - b) < 30 && Math.abs(r - b) < 30;
                
                const x = (index / 4) % width;
                const y = Math.floor((index / 4) / width);
                const isEdge = x < 5 || x > width - 5 || y < 5 || y > height - 5;
                
                return (isWhiteish || (isGrayish && brightness > 180)) && (isEdge || brightness > 220);
            }

            updateProgress(percent) {
                this.progressFill.style.width = percent + '%';
                this.progressBar.setAttribute('aria-valuenow', Math.round(percent));
            }

            showWorkspace() {
                const currentImage = this.images[this.currentImageIndex];
                if (!currentImage || currentImage.status !== 'completed') return;

                this.workspace.style.display = 'block';
                this.processedImage.src = currentImage.processedUrl;
                this.downloadSection.style.display = 'block';

                this.setupCanvas();
            }

            setupCanvas() {
                const currentImage = this.images[this.currentImageIndex];
                if (!currentImage) return;

                if (this.canvas) {
                    this.canvas.remove();
                    this.canvas = null;
                    this.ctx = null;
                }

                // Crear canvas invisible para editar la imagen procesada
                this.editCanvas = document.createElement('canvas');
                this.editCtx = this.editCanvas.getContext('2d');
                
                // Canvas visible para dibujar
                this.canvas = document.createElement('canvas');
                this.ctx = this.canvas.getContext('2d');
                this.canvas.style.position = 'absolute';
                this.canvas.style.top = '0';
                this.canvas.style.left = '0';
                this.canvas.style.cursor = 'crosshair';
                this.canvas.style.zIndex = '10';
                this.canvas.style.borderRadius = '12px';
                this.canvas.style.pointerEvents = 'auto';

                const img = new Image();
                img.onload = () => {
                    // Configurar canvas de edición con el tamaño original
                    this.editCanvas.width = img.width;
                    this.editCanvas.height = img.height;
                    this.editCtx.drawImage(img, 0, 0);
                    
                    const container = document.querySelector('.image-preview');
                    const imgElement = this.processedImage;
                    
                    setTimeout(() => {
                        const imgRect = imgElement.getBoundingClientRect();
                        
                        this.canvas.width = imgRect.width;
                        this.canvas.height = imgRect.height;
                        this.canvas.style.width = imgRect.width + 'px';
                        this.canvas.style.height = imgRect.height + 'px';
                        
                        container.style.position = 'relative';
                        container.appendChild(this.canvas);
                        this.bindCanvasEvents();
                    }, 100);
                };
                img.src = currentImage.processedUrl;
            }

            bindCanvasEvents() {
                this.canvas.addEventListener('mousedown', this.startDrawing.bind(this));
                this.canvas.addEventListener('mousemove', this.draw.bind(this));
                this.canvas.addEventListener('mouseup', this.stopDrawing.bind(this));
                this.canvas.addEventListener('mouseout', this.stopDrawing.bind(this));

                this.canvas.addEventListener('touchstart', this.handleTouch.bind(this));
                this.canvas.addEventListener('touchmove', this.handleTouch.bind(this));
                this.canvas.addEventListener('touchend', this.stopDrawing.bind(this));
            }

            startDrawing(e) {
                this.isDrawing = true;
                this.draw(e);
            }

            draw(e) {
                if (!this.isDrawing || !this.ctx || !this.editCtx) return;

                const rect = this.canvas.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;

                // Calcular coordenadas en el canvas de edición
                const scaleX = this.editCanvas.width / this.canvas.width;
                const scaleY = this.editCanvas.height / this.canvas.height;
                const editX = x * scaleX;
                const editY = y * scaleY;
                const editBrushSize = this.brushSize * scaleX;

                if (this.brushMode === 'erase') {
                    // Borrar: hacer transparente
                    this.editCtx.globalCompositeOperation = 'destination-out';
                    this.editCtx.beginPath();
                    this.editCtx.arc(editX, editY, editBrushSize / 2, 0, 2 * Math.PI);
                    this.editCtx.fill();
                } else if (this.brushMode === 'restore') {
                    // Restaurar: dibujar desde la imagen original
                    const currentImage = this.images[this.currentImageIndex];
                    const originalImg = new Image();
                    originalImg.onload = () => {
                        // Crear canvas temporal con la imagen original procesada
                        const tempCanvas = document.createElement('canvas');
                        const tempCtx = tempCanvas.getContext('2d');
                        tempCanvas.width = originalImg.width;
                        tempCanvas.height = originalImg.height;
                        tempCtx.drawImage(originalImg, 0, 0);
                        
                        // Remover el fondo de la imagen original
                        const imageData = tempCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
                        const processedData = this.removeBackground(imageData);
                        tempCtx.putImageData(processedData, 0, 0);
                        
                        // Restaurar desde esta imagen
                        this.editCtx.globalCompositeOperation = 'source-over';
                        this.editCtx.save();
                        this.editCtx.beginPath();
                        this.editCtx.arc(editX, editY, editBrushSize / 2, 0, 2 * Math.PI);
                        this.editCtx.clip();
                        this.editCtx.drawImage(tempCanvas, 0, 0);
                        this.editCtx.restore();
                    };
                    originalImg.src = currentImage.originalUrl;
                }

                this.updateProcessedImage();
            }

            stopDrawing() {
                this.isDrawing = false;
            }

            handleTouch(e) {
                e.preventDefault();
                const touch = e.touches[0];
                const mouseEvent = new MouseEvent(e.type === 'touchstart' ? 'mousedown' : 
                                                 e.type === 'touchmove' ? 'mousemove' : 'mouseup', {
                    clientX: touch.clientX,
                    clientY: touch.clientY
                });
                this.canvas.dispatchEvent(mouseEvent);
            }

            updateProcessedImage() {
                const currentImage = this.images[this.currentImageIndex];
                if (!currentImage || !this.editCanvas) return;

                // Actualizar la URL de la imagen procesada
                currentImage.processedUrl = this.editCanvas.toDataURL('image/png');
                this.processedImage.src = currentImage.processedUrl;
                
                // Aplicar el fondo si no es transparente
                if (this.currentBackground.type !== 'transparent') {
                    this.applyBackground();
                }
            }

            resetCurrentImage() {
                const currentImage = this.images[this.currentImageIndex];
                if (!currentImage) return;

                this.processImage(currentImage).then(() => {
                    currentImage.status = 'completed';
                    this.showWorkspace();
                }).catch(error => {
                    console.error('Error al resetear la imagen:', error);
                    alert('Error al resetear la imagen');
                });
            }
            
            setBackgroundType(type) {
                document.getElementById('colorOptions').style.display = type === 'color' ? 'block' : 'none';
                document.getElementById('gradientOptions').style.display = type === 'gradient' ? 'grid' : 'none';
                document.getElementById('bgImageInput').style.display = type === 'image' ? 'block' : 'none';
                
                this.currentBackground = { type };
                this.applyBackground();
            }

            handleBackgroundImage(e) {
                const file = e.target.files[0];
                if (!file) return;

                const reader = new FileReader();
                reader.onload = (e) => {
                    this.currentBackground = { type: 'image', value: e.target.result };
                    this.applyBackground();
                };
                reader.onerror = () => alert('Error al cargar la imagen de fondo');
                reader.readAsDataURL(file);
            }

            applyBackground() {
                const currentImage = this.images[this.currentImageIndex];
                if (!currentImage || !currentImage.processedUrl) return;

                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                
                const img = new Image();
                img.onload = () => {
                    canvas.width = img.width;
                    canvas.height = img.height;

                    if (this.currentBackground.type !== 'transparent') {
                        if (this.currentBackground.type === 'color') {
                            ctx.fillStyle = this.currentBackground.value;
                            ctx.fillRect(0, 0, canvas.width, canvas.height);
                        } else if (this.currentBackground.type === 'gradient') {
                            const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
                            const colors = this.currentBackground.value.match(/#[\da-fA-F]{6}/g) || ['#ff6b6b', '#feca57'];
                            gradient.addColorStop(0, colors[0]);
                            gradient.addColorStop(1, colors[1]);
                            ctx.fillStyle = gradient;
                            ctx.fillRect(0, 0, canvas.width, canvas.height);
                        } else if (this.currentBackground.type === 'image' && this.currentBackground.value) {
                            const bgImg = new Image();
                            bgImg.onload = () => {
                                ctx.drawImage(bgImg, 0, 0, canvas.width, canvas.height);
                                ctx.drawImage(img, 0, 0);
                                this.processedImage.src = canvas.toDataURL('image/png');
                            };
                            bgImg.onerror = () => console.error('Error al cargar la imagen de fondo');
                            bgImg.src = this.currentBackground.value;
                            return;
                        }
                    }

                    ctx.drawImage(img, 0, 0);
                    this.processedImage.src = canvas.toDataURL('image/png');
                };
                img.onerror = () => console.error('Error al aplicar fondo');
                img.src = currentImage.processedUrl;
            }

            downloadImage(format) {
                const currentImage = this.images[this.currentImageIndex];
                if (!currentImage) return;

                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                
                const img = new Image();
                img.onload = () => {
                    canvas.width = img.width;
                    canvas.height = img.height;

                    if (format === 'jpg') {
                        ctx.fillStyle = '#ffffff';
                        ctx.fillRect(0, 0, canvas.width, canvas.height);
                    }

                    if (this.currentBackground.type !== 'transparent' && format === 'png') {
                        if (this.currentBackground.type === 'color') {
                            ctx.fillStyle = this.currentBackground.value;
                            ctx.fillRect(0, 0, canvas.width, canvas.height);
                        }
                    }

                    ctx.drawImage(img, 0, 0);

                    const link = document.createElement('a');
                    link.download = `${currentImage.name.split('.')[0]}_sin_fondo.${format}`;
                    link.href = canvas.toDataURL(`image/${format}`, format === 'jpg' ? 0.9 : 1);
                    link.click();
                };
                img.onerror = () => alert('Error al descargar la imagen');
                img.src = this.processedImage.src;
            }
        }

        const backgroundRemover = new BackgroundRemover();