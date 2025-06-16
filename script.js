document.addEventListener('DOMContentLoaded', function() {
    // Функция для проверки, является ли устройство мобильным
    function isMobile() {
        return window.innerWidth <= 768;
    }

    // Инициализация слайдеров
    function initSliders() {
        if (isMobile()) {
            initSlider('.block2__cards', '.block2__card');
            initSlider('.block3__cards', '.block3__card');
        } else {
            // На десктопе возвращаем обычное отображение
            const containers = document.querySelectorAll('.block2__cards, .block3__cards');
            containers.forEach(container => {
                container.style.transform = 'none';
                container.style.display = 'grid';
                // Удаляем кнопки навигации, если они есть
                const navButtons = container.parentElement.querySelectorAll('.slider-nav');
                navButtons.forEach(button => button.remove());
            });
        }
    }

    // Инициализация при загрузке
    initSliders();

    // Обновление при изменении размера окна
    let resizeTimer;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(initSliders, 250);
    });
});

function initSlider(containerSelector, cardSelector) {
    const container = document.querySelector(containerSelector);
    const cards = container.querySelectorAll(cardSelector);
    if (!container || cards.length === 0) return;

    // Для мобильной версии всегда показываем одну карточку
    const cardWidth = window.innerWidth * 0.75;
    const cardGap = window.innerWidth * 0.08;
    let currentPosition = 0;
    const maxPosition = cards.length - 1;

    // Сброс transform и удаление старых кнопок
    container.style.transform = 'none';
    const oldButtons = container.parentElement.querySelectorAll('.slider-nav');
    oldButtons.forEach(btn => btn.remove());

    // Добавляем кнопки навигации
    const prevButton = document.createElement('button');
    prevButton.className = 'slider-nav prev';
    prevButton.innerHTML = '<i class="fas fa-chevron-left"></i>';
    
    const nextButton = document.createElement('button');
    nextButton.className = 'slider-nav next';
    nextButton.innerHTML = '<i class="fas fa-chevron-right"></i>';

    container.parentElement.style.position = 'relative';
    container.parentElement.appendChild(prevButton);
    container.parentElement.appendChild(nextButton);

    prevButton.addEventListener('click', () => {
        if (currentPosition > 0) {
            currentPosition--;
            updateSlider();
        }
    });
    nextButton.addEventListener('click', () => {
        if (currentPosition < maxPosition) {
            currentPosition++;
            updateSlider();
        }
    });

    function updateSlider() {
        const offset = -currentPosition * (cardWidth + cardGap);
        container.style.transform = `translateX(${offset}px)`;
        prevButton.style.opacity = currentPosition === 0 ? '0.5' : '1';
        nextButton.style.opacity = currentPosition === maxPosition ? '0.5' : '1';
    }

    container.style.transition = 'transform 0.3s ease-in-out';
    updateSlider();

    // Свайпы
    let touchStartX = 0;
    let touchEndX = 0;
    container.addEventListener('touchstart', e => {
        touchStartX = e.changedTouches[0].screenX;
    });
    container.addEventListener('touchend', e => {
        touchEndX = e.changedTouches[0].screenX;
        handleSwipe();
    });
    function handleSwipe() {
        const swipeThreshold = 50;
        const diff = touchStartX - touchEndX;
        if (Math.abs(diff) > swipeThreshold) {
            if (diff > 0 && currentPosition < maxPosition) {
                currentPosition++;
            } else if (diff < 0 && currentPosition > 0) {
                currentPosition--;
            }
            updateSlider();
        }
    }
}
