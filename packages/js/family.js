document.addEventListener('DOMContentLoaded', () => {
    console.log('Family Package Page Loaded');

    // Плавное появление элементов при скролле (простая версия)
    const observerOptions = {
        threshold: 0.1
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);

    // Добавляем анимацию ко всем группам "Что входит" и карточкам
    const animatedElements = document.querySelectorAll('.includes-group, .package-audience__ideal, .timeline__item');
    
    animatedElements.forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(20px)';
        el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(el);
    });
});