document.addEventListener('DOMContentLoaded', () => {
    // Check if running in Standalone mode (iOS Home Screen)
    const isStandalone = window.navigator.standalone || window.matchMedia('(display-mode: standalone)').matches;
    if (isStandalone) {
        document.body.classList.add('standalone');
    }

    // Hide loading screen using 3s overlap schedule
    const loader = document.getElementById('siteLoading');
    if (loader) {
        const splashVideo = document.getElementById('splashVideo');
        
        const hideLoader = () => {
            loader.classList.add('loaded');
            // Remove from DOM after the transition (1.0s) completes with some buffer
            setTimeout(() => loader.remove(), 1500);
        };

        if (splashVideo) {
            // Force JS level muted attributes to bypass strict iOS policies
            splashVideo.muted = true;
            splashVideo.defaultMuted = true;
            splashVideo.setAttribute('playsinline', '');

            // Force playback immediately to break through iOS autoplay blocks
            const forcePlay = () => {
                const playPromise = splashVideo.play();
                if (playPromise !== undefined) {
                    playPromise.catch(e => {
                        console.warn("[Autoplay prevented. Immediate fallback triggered...]", e);
                        // If rejected, immediately show the site. Don't leave a black screen.
                        hideLoader();
                    });
                }
            };
            
            // Wait until enough video is buffered to play without stalling
            splashVideo.addEventListener('canplaythrough', forcePlay);
            
            // Fallback if 'canplaythrough' doesn't fire fast enough
            setTimeout(forcePlay, 1000); 

            // Trigger hide sequence exactly at 3.0s into playback
            let transitionStarted = false;
            
            const startTransitionTimer = () => {
                if (transitionStarted) return;
                transitionStarted = true;
                setTimeout(hideLoader, 3000); 
            };

            // Start timer ONLY when the video successfully begins playing
            splashVideo.addEventListener('playing', startTransitionTimer);
            
            // Fallback in case 'playing' event is blocked indefinitely
            setTimeout(startTransitionTimer, 4500); 
            
            // Backup in case of errors
            splashVideo.addEventListener('error', hideLoader);
        } else {
            // Fallback if no video found
            setTimeout(hideLoader, 2000);
        }
    }

    const header = document.getElementById('header');
    const revealElements = document.querySelectorAll('.reveal');

    // Header scroll effect
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    });

    // Reveal on scroll (Intersection Observer with Premium Stagger)
    const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry, index) => {
            if (entry.isIntersecting) {
                // Check for grid items to apply stagger
                const isGridItem = entry.target.closest('.shop-grid');
                if (isGridItem) {
                    const siblings = Array.from(isGridItem.querySelectorAll('.reveal'));
                    const itemIndex = siblings.indexOf(entry.target);
                    entry.target.style.transitionDelay = `${itemIndex * 0.2}s`;
                }
                
                entry.target.classList.add('active');
                revealObserver.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.1
    });

    revealElements.forEach(el => {
        revealObserver.observe(el);
    });

    // Mobile menu toggle
    const menuBtn = document.querySelector('.mobile-menu-btn');
    const nav = document.querySelector('nav');
    if (menuBtn && nav) {
        // --- Web Share API Implementation ---
        const navUl = nav.querySelector('ul');
        if (navUl && navigator.share) {
            const shareLi = document.createElement('li');
            shareLi.className = 'mobile-share-item';
            shareLi.innerHTML = `
                <a href="javascript:void(0)" class="share-btn-nav">
                    <i class="fas fa-share-nodes"></i> Share
                </a>
            `;
            navUl.appendChild(shareLi);

            const shareBtn = shareLi.querySelector('.share-btn-nav');
            shareBtn.addEventListener('click', async (e) => {
                e.preventDefault();
                try {
                    await navigator.share({
                        title: document.title,
                        text: 'まるて株式会社 公式サイト',
                        url: window.location.href
                    });
                } catch (err) {
                    console.log('Share failed or cancelled:', err);
                }
            });
        }
        // ------------------------------------

        menuBtn.addEventListener('click', () => {
            menuBtn.classList.toggle('open');
            nav.classList.toggle('active');
            document.body.classList.toggle('no-scroll');
        });

        // Close menu when clicking a link
        nav.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                menuBtn.classList.remove('open');
                nav.classList.remove('active');
                document.body.classList.remove('no-scroll');
            });
        });
    }

    // Smooth Scroll
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                window.scrollTo({
                    top: target.offsetTop - 80,
                    behavior: 'smooth'
                });
            }
        });
    });

    // --- Global Standalone Fix (Stay in App) ---
    if (isStandalone) {
        document.addEventListener('click', (e) => {
            let target = e.target;
            while (target && target.tagName !== 'A') {
                target = target.parentNode;
            }
            if (target && target.href && !target.hasAttribute('data-no-pjax') && target.target !== '_blank') {
                const url = new URL(target.href);
                if (url.origin === window.location.origin) {
                    e.preventDefault();
                    window.location.href = target.href;
                }
            }
        }, false);
    }

    // --- Global Pull to Refresh Implementation ---
    const refreshIndicator = document.createElement('div');
    refreshIndicator.id = 'global-pull-refresh';
    refreshIndicator.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 更新中...';
    document.body.appendChild(refreshIndicator);

    let startY = 0;
    let isPulling = false;

    window.addEventListener('touchstart', (e) => {
        if (window.scrollY <= 0) {
            startY = e.touches[0].pageY;
            isPulling = true;
        }
    }, { passive: true });

    window.addEventListener('touchmove', (e) => {
        if (!isPulling) return;
        const moveY = e.touches[0].pageY;
        const pullDistance = moveY - startY;

        if (pullDistance > 0 && window.scrollY <= 0) {
            refreshIndicator.classList.add('pulling');
            const opacity = Math.min(pullDistance / 80, 1);
            const translateY = Math.min(pullDistance / 2, 60);
            refreshIndicator.style.opacity = opacity;
            refreshIndicator.style.transform = `translateY(${translateY}px)`;
            
            if (pullDistance > 100) {
                refreshIndicator.classList.add('active');
            } else {
                refreshIndicator.classList.remove('active');
            }
        }
    }, { passive: true });

    window.addEventListener('touchend', async () => {
        if (isPulling && refreshIndicator.classList.contains('active')) {
            // Success Pull
            refreshIndicator.style.transform = 'translateY(60px)';
            
            // Check if page has a specific refresh function
            if (typeof window.refreshPageContent === 'function') {
                await window.refreshPageContent();
            } else {
                window.location.reload();
                return; // reload will handle clearing the indicator
            }

            setTimeout(() => {
                refreshIndicator.classList.remove('active');
                refreshIndicator.classList.remove('pulling');
                refreshIndicator.style.transform = 'translateY(0)';
                refreshIndicator.style.opacity = '0';
            }, 800);
        } else {
            // Cancel Pull
            refreshIndicator.classList.remove('active');
            refreshIndicator.classList.remove('pulling');
            refreshIndicator.style.transform = 'translateY(0)';
            refreshIndicator.style.opacity = '0';
        }
        isPulling = false;
    });
});
