// Мобильный слайдер
class MobileSlider {
  constructor(container) {
    this.container = container;
    this.track = container.querySelector('.mobile-slider__track');
    this.slides = container.querySelectorAll('.mobile-slider__slide');
    this.indicatorsContainer = container.querySelector('.mobile-slider__indicators');

    this.currentIndex = 0;
    this.slideWidth = 80;
    this.touchStartX = 0;
    this.touchEndX = 0;
    this.autoPlayInterval = null;
    this.autoPlayDelay = 3000;
    this.isDragging = false;
    this.dragOffset = 0;

    this.init();
  }

  init() {
    this.createIndicators();
    this.addEventListeners();
    this.updateSliderPosition();
    this.startAutoPlay();

    this.track.style.padding = '0 10%';
  }


  prepareSlidesForLoop(){
    const firstClone = this.slides[0].cloneNode(true);
    const lastClone = this.slides[this.slides.length - 1].cloneNode(true);

    this.track.appendChild(firstClone);
    this.track.insertBefore(lastClone, this.slides[0]);

    this.slides = this.track.getElementsByClassName('mobile-slider__slide');
    this.currentIndex = 1;
  }


  startAutoPlay() {
    this.stopAutoPlay();
    this.autoPlayInterval = setInterval(() => {
      this.nextSlide();
    }, this.autoPlayDelay);
  }

  stopAutoPlay() {
    if (this.autoPlayInterval) {
      clearInterval(this.autoPlayInterval);
      this.autoPlayInterval = null;
    }
  }

  createIndicators() {
    this.slides.forEach((_, index) => {
      const indicator = document.createElement('button');
      indicator.classList.add('mobile-slider__indicator');
      indicator.setAttribute('aria-label', `Перейти к слайду ${index + 1}`);
      indicator.addEventListener('click', () => this.goToSlide(index));
      this.indicatorsContainer.appendChild(indicator);
    });
  }

  addEventListeners() {
    this.container.addEventListener('touchstart', (e) => this.touchStart(e));
    this.container.addEventListener('touchmove', (e) => this.touchMove(e));
    this.container.addEventListener('touchend', () => this.touchEnd());
  }

  touchStart(e) {
    this.touchStartX = e.touches[0].clientX;
  }

  touchMove(e) {
    this.touchEndX = e.touches[0].clientX;
  }

  touchEnd() {
    const swipeDistance = this.touchEndX - this.touchStartX;
    const minSwipeDistance = 50;

    if (Math.abs(swipeDistance) > minSwipeDistance) {
      if (swipeDistance > 0) {
        this.prevSlide();
      } else {
        this.nextSlide();
      }
    }
  }

  updateSliderPosition() {
    const translateX = -this.currentIndex * this.slideWidth;
    this.track.style.transform = `translateX(${translateX}%)`;
    this.updateIndicators();
  }

  updateIndicators() {
    const indicators = this.indicatorsContainer.querySelectorAll('.mobile-slider__indicator');
    indicators.forEach((indicator, index) => {
      indicator.classList.toggle('active', index === this.currentIndex);
    });
  }

  goToSlide(index) {
    if (index >= 0 && index < this.slides.length) {
      this.currentIndex = index;
      this.updateSliderPosition();
    }
  }

  prevSlide() {
    if (this.currentIndex > 0) {
      this.currentIndex--;
      this.updateSliderPosition();
    }
  }

  nextSlide() {
    this.currentIndex++;
    if (this.currentIndex >= this.slides.length) {
      this.currentIndex = 0;
    }
    this.updateSliderPosition();
  }
}

// Инициализация слайдеров при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
  const sliders = document.querySelectorAll('.mobile-slider');
  sliders.forEach(slider => new MobileSlider(slider));
});