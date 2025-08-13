class ColorExtractor {
            constructor() {
                this.initElements();
                this.bindEvents();
                this.currentImage = null;
            }

            initElements() {
                this.uploadArea = document.getElementById('uploadArea');
                this.fileInput = document.getElementById('fileInput');
                this.imagePreview = document.getElementById('imagePreview');
                this.previewImage = document.getElementById('previewImage');
                this.imageInfo = document.getElementById('imageInfo');
                this.extractBtn = document.getElementById('extractBtn');
                this.clearBtn = document.getElementById('clearBtn');
                this.colorCount = document.getElementById('colorCount');
                this.loadingSection = document.getElementById('loadingSection');
                this.paletteSection = document.getElementById('paletteSection');
                this.paletteGrid = document.getElementById('paletteGrid');
                this.statusIndicator = document.getElementById('statusIndicator');
                this.message = document.getElementById('message');
                this.notification = document.getElementById('notification');
            }

            bindEvents() {
                // Upload events
                this.uploadArea.addEventListener('click', () => this.fileInput.click());
                this.fileInput.addEventListener('change', (e) => this.handleFileSelect(e));
                
                // Drag and drop
                this.uploadArea.addEventListener('dragover', (e) => this.handleDragOver(e));
                this.uploadArea.addEventListener('dragleave', (e) => this.handleDragLeave(e));
                this.uploadArea.addEventListener('drop', (e) => this.handleDrop(e));
                
                // Buttons
                this.extractBtn.addEventListener('click', () => this.extractColors());
                this.clearBtn.addEventListener('click', () => this.clearAll());
                
                // Keyboard shortcuts
                document.addEventListener('keydown', (e) => {
                    if (e.key === 'Escape') this.clearAll();
                    if (e.key === 'Enter' && this.currentImage) this.extractColors();
                });
            }

            handleDragOver(e) {
                e.preventDefault();
                this.uploadArea.classList.add('dragover');
            }

            handleDragLeave(e) {
                e.preventDefault();
                this.uploadArea.classList.remove('dragover');
            }

            handleDrop(e) {
                e.preventDefault();
                this.uploadArea.classList.remove('dragover');
                const files = e.dataTransfer.files;
                if (files.length > 0) this.processFile(files[0]);
            }

            handleFileSelect(e) {
                const file = e.target.files[0];
                if (file) this.processFile(file);
            }

            processFile(file) {
                // Validaciones
                if (!file.type.startsWith('image/')) {
                    this.showMessage('Por favor, selecciona un archivo de imagen válido', 'error');
                    this.showNotification('Formato no válido', 'error');
                    return;
                }

                if (file.size > 10 * 1024 * 1024) {
                    this.showMessage('La imagen es demasiado grande. Máximo 10MB', 'error');
                    this.showNotification('Archivo muy grande', 'error');
                    return;
                }

                const reader = new FileReader();
                reader.onload = (e) => {
                    this.previewImage.src = e.target.result;
                    this.showImagePreview(file);
                    this.currentImage = file;
                };
                reader.readAsDataURL(file);
            }

            showImagePreview(file) {
                this.imagePreview.style.display = 'block';
                this.paletteSection.style.display = 'none';
                
                const fileSize = (file.size / 1024).toFixed(1);
                this.imageInfo.textContent = `${file.name} • ${fileSize} KB`;
                
                this.updateStatus('Imagen cargada');
                this.showMessage('Imagen cargada. Haz clic en "Extraer Colores" para continuar', 'success');
            }

            showMessage(text, type) {
                this.message.textContent = text;
                this.message.className = `message ${type}`;
            }

            showNotification(text, type) {
                this.notification.textContent = text;
                this.notification.className = `notification ${type} show`;
                setTimeout(() => {
                    this.notification.className = 'notification';
                }, 3000);
            }

            updateStatus(text, type = '') {
                this.statusIndicator.textContent = text;
                this.statusIndicator.className = `status-indicator ${type}`;
            }

            clearAll() {
                this.imagePreview.style.display = 'none';
                this.paletteSection.style.display = 'none';
                this.fileInput.value = '';
                this.previewImage.src = '';
                this.currentImage = null;
                this.paletteGrid.innerHTML = '';
                this.updateStatus('Listo');
                this.showMessage('Sube una imagen para generar la paleta de colores', '');
            }

            async extractColors() {
                if (!this.currentImage) {
                    this.showMessage('Por favor, selecciona una imagen primero', 'error');
                    this.showNotification('No hay imagen seleccionada', 'error');
                    return;
                }

                this.loadingSection.style.display = 'block';
                this.extractBtn.disabled = true;
                this.updateStatus('Procesando...', 'processing');

                try {
                    // Pequeña espera antes de iniciar
                    await new Promise(resolve => setTimeout(resolve, 500));

                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');

                    // Esperar a que la imagen se cargue completamente
                    await new Promise((resolve) => {
                        if (this.previewImage.complete) {
                            resolve();
                        } else {
                            this.previewImage.onload = resolve;
                        }
                    });

                    // Redimensionar para optimizar el procesamiento
                    const maxSize = 200;
                    const ratio = Math.min(
                        maxSize / this.previewImage.naturalWidth,
                        maxSize / this.previewImage.naturalHeight
                    );
                    canvas.width = this.previewImage.naturalWidth * ratio;
                    canvas.height = this.previewImage.naturalHeight * ratio;

                    ctx.drawImage(this.previewImage, 0, 0, canvas.width, canvas.height);

                    // Extraer píxeles
                    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                    const pixels = this.extractPixels(imageData.data);

                    // Aplicar k-means clustering
                    const numColors = parseInt(this.colorCount.value);
                    const colors = this.kmeansClustering(pixels, numColors);

                    // Mostrar paleta
                    this.displayPalette(colors);

                    this.updateStatus('Análisis completado');
                    this.showMessage(`Se extrajeron ${colors.length} colores dominantes`, 'success');
                    this.loadingSection.style.display = 'none';
                } catch (error) {
                    console.error('Error al extraer colores:', error);
                    this.updateStatus('Error en el análisis', 'error');
                    this.showMessage('Error al procesar la imagen. Inténtalo de nuevo.', 'error');
                    this.showNotification('Error al procesar', 'error');
                } finally {
                    this.loadingSection.style.display = 'none';
                    this.extractBtn.disabled = false;
                }
            }

            extractPixels(data) {
                const pixels = [];
                // Muestrear cada N píxeles para optimizar el rendimiento
                const step = 4;

                for (let i = 0; i < data.length; i += 4 * step) {
                    const r = data[i];
                    const g = data[i + 1];
                    const b = data[i + 2];
                    const alpha = data[i + 3];

                    // Filtrar píxeles transparentes y muy oscuros/claros
                    if (alpha > 128 && (r + g + b) > 30 && (r + g + b) < 720) {
                        pixels.push([r, g, b]);
                    }
                }

                return pixels;
            }

            kmeansClustering(pixels, k, maxIterations = 20) {
                if (pixels.length === 0) return [];

                // Inicializar centroides aleatoriamente
                let centroids = [];
                for (let i = 0; i < k; i++) {
                    const randomPixel = pixels[Math.floor(Math.random() * pixels.length)];
                    centroids.push([...randomPixel]);
                }

                let assignments = new Array(pixels.length);

                for (let iteration = 0; iteration < maxIterations; iteration++) {
                    let changed = false;

                    // Asignar cada píxel al centroide más cercano
                    for (let i = 0; i < pixels.length; i++) {
                        let minDistance = Infinity;
                        let closestCentroid = 0;

                        for (let j = 0; j < centroids.length; j++) {
                            const distance = this.colorDistance(pixels[i], centroids[j]);
                            if (distance < minDistance) {
                                minDistance = distance;
                                closestCentroid = j;
                            }
                        }

                        if (assignments[i] !== closestCentroid) {
                            assignments[i] = closestCentroid;
                            changed = true;
                        }
                    }

                    // Si no hay cambios, parar
                    if (!changed) break;

                    // Recalcular centroides
                    const sums = Array.from({ length: k }, () => [0, 0, 0, 0]);
                    for (let i = 0; i < pixels.length; i++) {
                        const cluster = assignments[i];
                        sums[cluster][0] += pixels[i][0];
                        sums[cluster][1] += pixels[i][1];
                        sums[cluster][2] += pixels[i][2];
                        sums[cluster][3] += 1;
                    }

                    for (let j = 0; j < k; j++) {
                        if (sums[j][3] > 0) {
                            centroids[j] = [
                                Math.round(sums[j][0] / sums[j][3]),
                                Math.round(sums[j][1] / sums[j][3]),
                                Math.round(sums[j][2] / sums[j][3])
                            ];
                        }
                    }
                }

                return centroids;
            }

            colorDistance(c1, c2) {
                return Math.sqrt(
                    Math.pow(c1[0] - c2[0], 2) +
                    Math.pow(c1[1] - c2[1], 2) +
                    Math.pow(c1[2] - c2[2], 2)
                );
            }

            displayPalette(colors) {
                this.paletteGrid.innerHTML = '';
                this.paletteSection.style.display = 'block';

                colors.forEach((color, index) => {
                    const hex = this.rgbToHex(color[0], color[1], color[2]);
                    const rgb = `RGB(${color[0]}, ${color[1]}, ${color[2]})`;
                    
                    const colorCard = document.createElement('div');
                    colorCard.className = 'color-card';
                    colorCard.innerHTML = `
                        <div class="color-swatch" style="background-color: ${hex};"></div>
                        <div class="color-hex">${hex}</div>
                        <div class="color-details">RGB: ${rgb}</div>
                        <button class="copy-btn" data-color="${hex}">
                            <i class="fas fa-copy"></i> Copiar
                        </button>
                    `;

                    this.paletteGrid.appendChild(colorCard);

                    // Animación de entrada
                    setTimeout(() => {
                        colorCard.classList.add('animate');
                    }, index * 100);

                    // Evento para expandir detalles
                    const swatch = colorCard.querySelector('.color-swatch');
                    swatch.addEventListener('click', () => {
                        colorCard.classList.toggle('expanded');
                    });

                    // Evento para copiar color
                    const copyBtn = colorCard.querySelector('.copy-btn');
                    copyBtn.addEventListener('click', () => this.copyToClipboard(hex, copyBtn));
                });
            }

            rgbToHex(r, g, b) {
                return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase()}`;
            }

            copyToClipboard(color, button) {
                navigator.clipboard.writeText(color).then(() => {
                    button.classList.add('copied');
                    button.innerHTML = '<i class="fas fa-check"></i> Copiado';
                    this.showNotification('Color copiado al portapapeles', 'success');
                    setTimeout(() => {
                        button.classList.remove('copied');
                        button.innerHTML = '<i class="fas fa-copy"></i> Copiar';
                    }, 2000);
                }).catch(() => {
                    this.showNotification('Error al copiar el color', 'error');
                });
            }
        }

        // Inicializar la aplicación
        const app = new ColorExtractor();