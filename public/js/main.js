document.addEventListener('DOMContentLoaded', () => {
    // Hide loading screen
    const loader = document.getElementById('siteLoading');
    if (loader) {
        setTimeout(() => {
            loader.classList.add('loaded');
            setTimeout(() => loader.remove(), 600);
        }, 300);
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

    // Reveal on scroll (Intersection Observer)
    const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
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
});
