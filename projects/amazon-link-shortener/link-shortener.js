 // Configuración y constantes
        const CONFIG = {
            MAX_HISTORY: 10,
            FADE_DURATION: 3000,
            AMAZON_DOMAINS: {
                'amazon.com': 'US',
                'amazon.es': 'ES',
                'amazon.co.uk': 'UK',
                'amazon.de': 'DE',
                'amazon.fr': 'FR',
                'amazon.it': 'IT',
                'amazon.ca': 'CA',
                'amazon.com.mx': 'MX',
                'amazon.com.br': 'BR',
                'amazon.in': 'IN',
                'amazon.co.jp': 'JP'
            },
            ASIN_PATTERNS: [
                /\/dp\/([A-Z0-9]{10})/,
                /\/gp\/product\/([A-Z0-9]{10})/,
                /\/product\/([A-Z0-9]{10})/,
                /\/ASIN\/([A-Z0-9]{10})/,
                /\/asin\/([A-Z0-9]{10})/
            ]
        };

        // Clase principal
        class AmazonLinkShortener {
            static extractDomain(url) {
                for (const domain in CONFIG.AMAZON_DOMAINS) {
                    if (url.includes(domain)) {
                        return domain;
                    }
                }
                return null;
            }

            static extractAsin(url) {
                for (const pattern of CONFIG.ASIN_PATTERNS) {
                    const match = url.match(pattern);
                    if (match) {
                        return match[1];
                    }
                }
                return null;
            }

            static shortenUrl(url) {
                if (!url || !url.trim()) {
                    return {
                        status: 'error',
                        message: 'Por favor, introduce una URL'
                    };
                }

                const domain = this.extractDomain(url);
                if (!domain) {
                    return {
                        status: 'error',
                        message: 'URL no reconocida como Amazon'
                    };
                }

                const asin = this.extractAsin(url);
                if (!asin) {
                    return {
                        status: 'error',
                        message: 'No se pudo extraer el ASIN del producto'
                    };
                }

                const shortenedUrl = `https://www.${domain}/dp/${asin}`;

                return {
                    status: 'success',
                    url: shortenedUrl,
                    domain: CONFIG.AMAZON_DOMAINS[domain],
                    message: 'Enlace acortado correctamente'
                };
            }
        }

        class AmazonLinkShortenerApp {
            constructor() {
                this.history = this.loadHistory();
                this.currentUrl = null;
                this.messageTimeout = null;
                this.stats = this.loadStats();
                this.initElements();
                this.bindEvents();
                this.refreshHistoryUI();
                this.updateStats();
            }

            initElements() {
                this.urlInput = document.getElementById('urlInput');
                this.shortenBtn = document.getElementById('shortenBtn');
                this.clearBtn = document.getElementById('clearBtn');
                this.resultText = document.getElementById('resultText');
                this.resultActions = document.getElementById('resultActions');
                this.resultContainer = document.getElementById('resultContainer');
                this.copyBtn = document.getElementById('copyBtn');
                this.openBtn = document.getElementById('openBtn');
                this.shareBtn = document.getElementById('shareBtn');
                this.historyContainer = document.getElementById('historyContainer');
                this.historyEmpty = document.getElementById('historyEmpty');
                this.message = document.getElementById('message');
                this.statusIndicator = document.getElementById('statusIndicator');
                this.notification = document.getElementById('notification');
                this.loadingSpinner = document.getElementById('loadingSpinner');
                this.clearHistoryBtn = document.getElementById('clearHistoryBtn');
                this.exportHistoryBtn = document.getElementById('exportHistoryBtn');
                
                this.totalLinks = document.getElementById('totalLinks');
                this.todayLinks = document.getElementById('todayLinks');
                this.favoriteRegion = document.getElementById('favoriteRegion');
            }

            bindEvents() {
                this.shortenBtn.addEventListener('click', () => this.processUrl());
                this.clearBtn.addEventListener('click', () => this.clearInput());
                this.copyBtn.addEventListener('click', () => this.copyToClipboard());
                this.openBtn.addEventListener('click', () => this.openInBrowser());
                this.shareBtn.addEventListener('click', () => this.shareUrl());
                this.clearHistoryBtn.addEventListener('click', () => this.clearHistory());
                this.exportHistoryBtn.addEventListener('click', () => this.exportHistory());
                
                this.urlInput.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter') {
                        this.processUrl();
                    }
                });

                this.urlInput.addEventListener('input', (e) => {
                    this.validateInput(e.target.value);
                });

                document.addEventListener('keydown', (e) => {
                    if (e.ctrlKey && e.key === 'v') {
                        e.preventDefault();
                        this.pasteAndProcess();
                    } else if (e.key === 'Escape') {
                        this.clearInput();
                    }
                });

                this.urlInput.focus();
            }

            validateInput(url) {
                if (!url) return;
                
                const domain = AmazonLinkShortener.extractDomain(url);
                if (domain) {
                    this.urlInput.style.borderColor = 'rgba(76, 175, 80, 0.5)';
                } else if (url.length > 10) {
                    this.urlInput.style.borderColor = 'rgba(244, 67, 54, 0.5)';
                } else {
                    this.urlInput.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                }
            }

            async processUrl() {
                const url = this.urlInput.value.trim();
                if (!url) {
                    this.showMessage('Por favor, introduce una URL', 'error');
                    return;
                }

                this.setLoading(true);
                this.updateStatus('Procesando...', 'processing');

                await new Promise(resolve => setTimeout(resolve, 800));

                const result = AmazonLinkShortener.shortenUrl(url);

                if (result.status === 'success') {
                    this.displayResult(result.url, result.domain);
                    this.addToHistory(url, result.url, result.domain);
                    this.showNotification(result.message, 'success');
                    this.updateStatus(`Listo - ${result.domain}`, 'success');
                    this.updateStats();
                } else {
                    this.showNotification(result.message, 'error');
                    this.updateStatus('Error', 'error');
                }

                this.setLoading(false);
            }

            setLoading(isLoading) {
                this.shortenBtn.disabled = isLoading;
                this.loadingSpinner.style.display = isLoading ? 'block' : 'none';
                
                if (isLoading) {
                    this.shortenBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Procesando...';
                } else {
                    this.shortenBtn.innerHTML = '<i class="fas fa-compress-alt"></i> Acortar';
                }
            }

            displayResult(shortenedUrl, domain) {
                this.currentUrl = shortenedUrl;
                this.resultText.innerHTML = `<a href="${shortenedUrl}" class="result-url" target="_blank">${shortenedUrl}</a>`;
                this.resultActions.style.display = 'flex';
                this.resultContainer.classList.add('has-result');
                
                this.resultText.classList.add('animate-in');
                setTimeout(() => this.resultText.classList.remove('animate-in'), 500);
            }

            addToHistory(original, shortened, domain) {
                const entry = {
                    original_url: original,
                    shortened_url: shortened,
                    timestamp: new Date(),
                    domain: domain
                };

                this.history.unshift(entry);
                if (this.history.length > CONFIG.MAX_HISTORY) {
                    this.history.pop();
                }

                this.saveHistory();
                this.refreshHistoryUI();
                this.updateStats();
            }

            refreshHistoryUI() {
                this.historyContainer.innerHTML = '';

                if (this.history.length === 0) {
                    this.historyContainer.appendChild(this.historyEmpty);
                    return;
                }

                this.history.forEach((entry, index) => {
                    const item = this.createHistoryItem(entry, index);
                    this.historyContainer.appendChild(item);
                });
            }

            createHistoryItem(entry, index) {
                const item = document.createElement('div');
                item.className = 'history-item';
                item.style.animationDelay = `${index * 0.1}s`;

                const header = document.createElement('div');
                header.className = 'history-item-header';

                const domain = document.createElement('span');
                domain.className = 'history-domain';
                domain.innerHTML = `<i class="fas fa-globe"></i> ${entry.domain}`;

                const time = document.createElement('span');
                time.className = 'history-time';
                time.textContent = entry.timestamp.toLocaleTimeString();

                header.appendChild(domain);
                header.appendChild(time);

                const url = document.createElement('div');
                url.className = 'history-url';
                url.textContent = entry.shortened_url;

                item.appendChild(header);
                item.appendChild(url);

                item.addEventListener('click', () => {
                    this.useHistoryItem(entry);
                });

                return item;
            }

            useHistoryItem(entry) {
                this.urlInput.value = entry.original_url;
                this.displayResult(entry.shortened_url, entry.domain);
                this.showNotification('Enlace cargado del historial', 'success');
                this.updateStatus(`Listo - ${entry.domain}`, 'success');
            }

            async copyToClipboard() {
                if (!this.currentUrl) return;

                try {
                    await navigator.clipboard.writeText(this.currentUrl);
                    this.showNotification('¡Copiado al portapapeles!', 'success');
                    this.copyBtn.classList.add('pulse');
                    setTimeout(() => this.copyBtn.classList.remove('pulse'), 300);
                } catch (err) {
                    // Fallback para navegadores que no soportan Clipboard API
                    const textArea = document.createElement('textarea');
                    textArea.value = this.currentUrl;
                    document.body.appendChild(textArea);
                    textArea.select();
                    document.execCommand('copy');
                    document.body.removeChild(textArea);
                    this.showNotification('¡Copiado al portapapeles!', 'success');
                }
            }

            openInBrowser() {
                if (!this.currentUrl) return;
                window.open(this.currentUrl, '_blank');
                this.showNotification('Abriendo en navegador...', 'success');
            }

            shareUrl() {
                if (!this.currentUrl) return;
                
                if (navigator.share) {
                    navigator.share({
                        title: 'Amazon Link Shortener',
                        text: 'Enlace acortado de Amazon:',
                        url: this.currentUrl
                    });
                } else {
                    this.copyToClipboard();
                }
            }

            clearInput() {
                this.urlInput.value = '';
                this.urlInput.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                this.urlInput.focus();
                this.showNotification('Campo limpiado', 'success');
                this.updateStatus('Listo', 'success');
            }

            clearHistory() {
                if (confirm('¿Estás seguro de que quieres limpiar todo el historial?')) {
                    this.history = [];
                    this.saveHistory();
                    this.refreshHistoryUI();
                    this.updateStats();
                    this.showNotification('Historial limpiado', 'success');
                }
            }

            exportHistory() {
                if (this.history.length === 0) {
                    this.showNotification('No hay historial para exportar', 'error');
                    return;
                }

                const dataStr = JSON.stringify(this.history, null, 2);
                const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
                
                const exportFileDefaultName = `amazon-links-${new Date().toISOString().split('T')[0]}.json`;
                
                const linkElement = document.createElement('a');
                linkElement.setAttribute('href', dataUri);
                linkElement.setAttribute('download', exportFileDefaultName);
                linkElement.click();
                
                this.showNotification('Historial exportado', 'success');
            }

            toggleTheme() {
                this.showNotification('Función de tema próximamente', 'success');
            }

            async pasteAndProcess() {
                try {
                    const clipboardText = await navigator.clipboard.readText();
                    if (clipboardText && clipboardText.toLowerCase().includes('amazon')) {
                        this.urlInput.value = clipboardText;
                        this.processUrl();
                    }
                } catch (err) {
                }
            }

            showNotification(message, type = 'success') {
                this.notification.textContent = message;
                this.notification.className = `notification ${type}`;
                this.notification.classList.add('show');
                
                setTimeout(() => {
                    this.notification.classList.remove('show');
                }, 3000);
            }

            showMessage(message, type = 'success') {
                this.message.textContent = message;
                this.message.className = `message ${type}`;
                
                if (this.messageTimeout) {
                    clearTimeout(this.messageTimeout);
                }
                
                this.messageTimeout = setTimeout(() => {
                    this.message.textContent = '';
                    this.message.className = 'message';
                }, CONFIG.FADE_DURATION);
            }

            updateStatus(status, type = 'success') {
                this.statusIndicator.textContent = status;
                this.statusIndicator.className = `status-indicator ${type}`;
            }

            updateStats() {
                this.totalLinks.textContent = this.history.length;
                
                const today = new Date().toDateString();
                const todayCount = this.history.filter(entry => 
                    new Date(entry.timestamp).toDateString() === today
                ).length;
                this.todayLinks.textContent = todayCount;
                
                if (this.history.length > 0) {
                    const domainCounts = {};
                    this.history.forEach(entry => {
                        domainCounts[entry.domain] = (domainCounts[entry.domain] || 0) + 1;
                    });
                    
                    const favoriteRegion = Object.keys(domainCounts).reduce((a, b) => 
                        domainCounts[a] > domainCounts[b] ? a : b
                    );
                    this.favoriteRegion.textContent = favoriteRegion;
                } else {
                    this.favoriteRegion.textContent = '—';
                }
            }

            loadHistory() {
                try {
                    const saved = localStorage.getItem('amazon-shortener-history');
                    const history = saved ? JSON.parse(saved) : [];
                    return history.map(entry => ({
                        ...entry,
                        timestamp: new Date(entry.timestamp)
                    }));
                } catch (err) {
                    return [];
                }
            }

            saveHistory() {
                try {
                    localStorage.setItem('amazon-shortener-history', JSON.stringify(this.history));
                } catch (err) {
                    console.warn('No se pudo guardar el historial:', err);
                }
            }

            loadStats() {
                try {
                    const saved = localStorage.getItem('amazon-shortener-stats');
                    return saved ? JSON.parse(saved) : {};
                } catch (err) {
                    return {};
                }
            }

            saveStats() {
                try {
                    localStorage.setItem('amazon-shortener-stats', JSON.stringify(this.stats));
                } catch (err) {
                    console.warn('No se pudieron guardar las estadísticas:', err);
                }
            }
        }

        document.addEventListener('DOMContentLoaded', () => {
            new AmazonLinkShortenerApp();
        });