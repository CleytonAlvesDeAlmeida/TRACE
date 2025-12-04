// js/common.js

document.addEventListener('DOMContentLoaded', function() {
    // Menu circular
    const centralCircle = document.getElementById('centralCircle');
    const menuWrapper = document.getElementById('menuWrapper');
    const shareButton = document.getElementById('shareButton');
    const installButton = document.getElementById('installButton');
    let deferredPrompt = null; // Para instalação PWA

    if (centralCircle && menuWrapper) {
        centralCircle.addEventListener('click', function() {
            menuWrapper.classList.toggle('menu-active');
            
            // Adiciona uma pequena animação de clique no círculo central
            this.style.transform = 'scale(0.9)';
            setTimeout(() => {
                if (!menuWrapper.classList.contains('menu-active')) {
                    this.style.transform = 'scale(1)';
                }
            }, 150);
        });
        
        // Fechar o menu ao clicar fora dele
        document.addEventListener('click', function(event) {
            if (!menuWrapper.contains(event.target) && menuWrapper.classList.contains('menu-active')) {
                menuWrapper.classList.remove('menu-active');
                centralCircle.style.transform = 'scale(1)';
            }
        });
    }
    
    // Botão "Compartilhar" - funcionalidade de compartilhamento nativo
    if (shareButton) {
        shareButton.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Verifica se a API de compartilhamento está disponível
            if (navigator.share) {
                navigator.share({
                    title: document.title,
                    text: 'Conheça o projeto T.R.A.C.E. - Tecnologia e Reciclagem Ambiental Consciente Eletrônica',
                    url: window.location.href
                })
                .then(() => console.log('Compartilhado com sucesso!'))
                .catch((error) => {
                    console.log('Erro ao compartilhar:', error);
                    // Fallback para copiar link
                    copyToClipboard();
                });
            } else {
                // Fallback para copiar link
                copyToClipboard();
            }
        });
        
        // Função para copiar link para área de transferência
        function copyToClipboard() {
            navigator.clipboard.writeText(window.location.href)
                .then(() => {
                    // Feedback visual
                    const originalText = shareButton.querySelector('span').textContent;
                    shareButton.querySelector('span').textContent = 'Copiado!';
                    setTimeout(() => {
                        shareButton.querySelector('span').textContent = originalText;
                    }, 2000);
                })
                .catch(() => {
                    // Fallback mais básico
                    const tempInput = document.createElement('input');
                    tempInput.value = window.location.href;
                    document.body.appendChild(tempInput);
                    tempInput.select();
                    document.execCommand('copy');
                    document.body.removeChild(tempInput);
                    
                    // Feedback visual
                    const originalText = shareButton.querySelector('span').textContent;
                    shareButton.querySelector('span').textContent = 'Copiado!';
                    setTimeout(() => {
                        shareButton.querySelector('span').textContent = originalText;
                    }, 2000);
                });
        }
    }
    
    // Configurar funcionalidade de instalação PWA
    function setupPWAInstallation() {
        if (!installButton) return;
        
        // Verifica se o navegador suporta a instalação de PWA
        if (!window.matchMedia('(display-mode: standalone)').matches) {
            // Evento disparado quando o navegador pode solicitar instalação
            window.addEventListener('beforeinstallprompt', (e) => {
                // Impede que o prompt padrão apareça
                e.preventDefault();
                deferredPrompt = e;
                
                // Mostra o botão de instalação
                installButton.style.display = 'flex';
                
                // Atualiza o texto do botão
                installButton.querySelector('span').textContent = 'Instalar';
            });
            
            // Evento de clique no botão de instalação
            installButton.addEventListener('click', async (e) => {
                e.preventDefault();
                
                if (deferredPrompt) {
                    // Mostra o prompt de instalação
                    deferredPrompt.prompt();
                    
                    // Aguarda a resposta do usuário
                    const { outcome } = await deferredPrompt.userChoice;
                    
                    if (outcome === 'accepted') {
                        // Feedback visual
                        installButton.querySelector('span').textContent = 'Instalado!';
                        setTimeout(() => {
                            installButton.querySelector('span').textContent = 'Instalar';
                        }, 2000);
                    } else {
                        // Feedback visual
                        installButton.querySelector('span').textContent = 'Cancelado';
                        setTimeout(() => {
                            installButton.querySelector('span').textContent = 'Instalar';
                        }, 2000);
                    }
                    
                    deferredPrompt = null;
                } else {
                    // Se não houver prompt disponível, mostra mensagem
                    installButton.querySelector('span').textContent = 'Indisponível';
                    setTimeout(() => {
                        installButton.querySelector('span').textContent = 'Instalar';
                    }, 2000);
                }
            });
            
            // Oculta o botão se já estiver instalado
            window.addEventListener('appinstalled', () => {
                installButton.style.display = 'none';
                deferredPrompt = null;
            });
        } else {
            // Se já estiver instalado, oculta o botão
            installButton.style.display = 'none';
        }
    }
    
    // Inicializar funcionalidade PWA
    setupPWAInstallation();
});