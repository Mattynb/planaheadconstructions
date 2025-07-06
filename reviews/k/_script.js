const data = {
    0 : {
        "name": "Marilyn",
        "comment": "\"Marcos did a very nice job building a cabinet in a small alcove under my stairs. My house is old and was renovated many years ago by someone who apparently did not own a ruler or level and had no sense of design. Marcos managed to install the cabinet and moldings in this crooked, lopsided space and it looks great. He is a very nice man and I am glad I hired him.\"",
        "stars": "5",
        "date": "Apr 2025",
        "content": ["/public/marilyn_review.jpg", "/public/marilyn_review.jpg", "/public/marilyn_review.jpg"] // Added more images for demonstration
    },
    1 : {
        "name": "John Doe",
        "comment": "\"Exceptional craftsmanship! Marcos transformed our kitchen with custom cabinets that are both beautiful and functional. Highly recommend his services for anyone looking for quality work.\"",
        "stars": "4",
        "date": "May 2025",
        "content": ["/public/marilyn_review.jpg", "/public/marilyn_review.jpg", "/public/marilyn_review.jpg"]
    },
    2 : {
        "name": "Jane Smith",
        "comment": "\"Marcos built a custom bookshelf for my home office, and it's perfect! He paid attention to every detail and delivered exactly what I envisioned. A true professional!\"",
        "stars": "5",
        "date": "June 2025",
        "content":["/public/marilyn_review.jpg", "/public/marilyn_review.jpg", "/public/marilyn_review.jpg"]
    },
    3 : {
        "name": "Jane Smith",
        "comment": "\"Marcos built a custom bookshelf for my home office, and it's perfect! He paid attention to every detail and delivered exactly what I envisioned. A true professional!\"",
        "stars": "5",
        "date": "June 2025",
        "content":["/public/marilyn_review.jpg", "/public/marilyn_review.jpg", "/public/marilyn_review.jpg"]
    },
    4 : {
        "name": "Jane Smith",
        "comment": "\"Marcos built a custom bookshelf for my home office, and it's perfect! He paid attention to every detail and delivered exactly what I envisioned. A true professional!\"",
        "stars": "5",
        "date": "June 2025",
        "content":["/public/marilyn_review.jpg", "/public/marilyn_review.jpg", "/public/marilyn_review.jpg"]
    },
    5 : {
        "name": "Jane Smith",
        "comment": "\"Marcos built a custom bookshelf for my home office, and it's perfect! He paid attention to every detail and delivered exactly what I envisioned. A true professional!\"",
        "stars": "5",
        "date": "June 2025",
        "content":["/public/marilyn_review.jpg", "/public/marilyn_review.jpg", "/public/marilyn_review.jpg"]
    }
    // Add more review data as needed
};

// Global variables for main review slider
let currentReviewIndex = 0;
let reviewSlides = []; // To store references to all review slides
let reviewsPerView = 1; // Default, will be updated by getReviewsPerView()

function getReviewsPerView() {
    // Determine how many reviews to show based on screen width
    if (window.innerWidth >= 1024) {
        return 3; // Desktop
    } else if (window.innerWidth >= 768) {
        return 2; // Tablet
    } else {
        return 1; // Mobile
    }
}

function updateReviewSlider() {
    reviewsPerView = getReviewsPerView(); // Recalculate on update
    const slider = document.querySelector('.slider');
    // Ensure the slider and slides exist before trying to get offsetWidth
    if (!slider || !slider.querySelector('.slide')) {
        return;
    }

    // When showing multiple slides, we need to calculate the width of a single "chunk" to slide
    // This accounts for the slide width PLUS the gap between slides.
    const slide = slider.querySelector('.slide');
    const slideComputedStyle = window.getComputedStyle(slide);
    const slideMarginRight = parseFloat(slideComputedStyle.marginRight); // If you were using margin
    const slideWidth = slide.offsetWidth; // This includes padding and border
    const gap = parseFloat(window.getComputedStyle(slider).getPropertyValue('gap')) || 0; // Get flex gap

    // The actual "step" width to slide by when moving one logical unit (one review showing at the start)
    // For 1 review per view, it's one slide's width + gap
    // For 2 reviews per view, it's one slide's width + gap (because the transform moves the first visible slide)
    const stepWidth = slideWidth + gap;

    // The offset needs to shift the slider to bring the `currentReviewIndex` into view.
    // We display `reviewsPerView` slides starting from `currentReviewIndex`.
    // The transformation should be based on `currentReviewIndex` and the stepWidth.
    const offset = -currentReviewIndex * stepWidth;

    slider.style.transform = `translateX(${offset}px)`;

    // Adjust the flex-basis of slides to ensure they fit correctly given the `gap`
    // This is more robust than relying solely on flex: 0 0 100%;
    // We want each slide to take up `100% / reviewsPerView` of the visible area minus the gap.
    const newFlexBasis = `calc(${100 / reviewsPerView}% - ${gap * (reviewsPerView - 1) / reviewsPerView}px)`;
    reviewSlides.forEach(s => {
        s.style.flexBasis = newFlexBasis;
        s.style.maxWidth = `calc(100% / ${reviewsPerView} - ${gap * (reviewsPerView - 1) / reviewsPerView}px)`; // Also update max-width dynamically
    });


    updateReviewDots();
}

function updateReviewDots() {
    const reviewDotsContainer = document.querySelector('.review-dots');
    if (!reviewDotsContainer) return; // Ensure container exists
    reviewDotsContainer.innerHTML = ''; // Clear existing dots

    const totalReviews = Object.keys(data).length;
    // Calculate total pages for the review slider
    // We need to calculate pages based on how many reviews are *visible* at once.
    // Example: 5 reviews, 2 per view -> 3 pages (0-1, 2-3, 4)
    const totalReviewPages = Math.ceil(totalReviews / reviewsPerView);

    for (let i = 0; i < totalReviewPages; i++) {
        const dot = document.createElement('span');
        dot.classList.add('review-dot');
        // Determine which dot is active: it's the page containing the currentReviewIndex
        if (i === Math.floor(currentReviewIndex / reviewsPerView)) {
            dot.classList.add('active');
        }
        dot.addEventListener('click', () => {
            currentReviewIndex = i * reviewsPerView; // Jump to the start of that page
            updateReviewSlider();
        });
        reviewDotsContainer.appendChild(dot);
    }
}


function nextReview() {
    const totalReviews = Object.keys(data).length;
    // Calculate max starting index that allows 'reviewsPerView' slides to be shown
    const maxStartIndex = totalReviews - reviewsPerView;

    // If we're already at or beyond the max startIndex, loop back to 0
    if (currentReviewIndex >= maxStartIndex) {
        currentReviewIndex = 0;
    } else {
        // Otherwise, advance by one logical review unit
        currentReviewIndex++;
    }
    updateReviewSlider();
}

function prevReview() {
    const totalReviews = Object.keys(data).length;
    const maxStartIndex = totalReviews - reviewsPerView;

    if (currentReviewIndex <= 0) {
        // If we're at the start, loop to the last possible starting index
        currentReviewIndex = maxStartIndex;
    } else {
        // Otherwise, go back by one logical review unit
        currentReviewIndex--;
    }
    updateReviewSlider();
}

// Function to handle image sliding within a single review
function setupImageSlider(slideElement, images) {
    const imageSliderInner = slideElement.querySelector('.image-slider-inner');
    const prevBtn = slideElement.querySelector('.prev-img');
    const nextBtn = slideElement.querySelector('.next-img');
    const dotsContainer = slideElement.querySelector('.image-dots');

    let currentImageIndex = 0;

    // Clear any existing images before adding new ones (important if you re-render slides)
    imageSliderInner.innerHTML = '';

    images.forEach(src => {
        const img = document.createElement('img');
        img.src = src;
        img.alt = 'Review Image';
        imageSliderInner.appendChild(img);
    });

    function updateImageSlider() {
        // Adjust transform for images
        imageSliderInner.style.transform = `translateX(${-currentImageIndex * 100}%)`;

        // Update dots
        if (dotsContainer) {
            dotsContainer.innerHTML = ''; // Clear existing dots
            images.forEach((_, i) => {
                const dot = document.createElement('span');
                dot.classList.add('image-dot');
                if (i === currentImageIndex) {
                    dot.classList.add('active');
                }
                dot.addEventListener('click', () => {
                    currentImageIndex = i;
                    updateImageSlider();
                });
                dotsContainer.appendChild(dot);
            });
        }
    }

    // Only add navigation if there's more than one image
    if (images.length > 1) {
        // Ensure buttons are visible
        if (prevBtn) prevBtn.style.display = 'block';
        if (nextBtn) nextBtn.style.display = 'block';
        if (dotsContainer) dotsContainer.style.display = 'flex'; // Use flex for dots

        prevBtn.addEventListener('click', () => {
            currentImageIndex = (currentImageIndex === 0) ? images.length - 1 : currentImageIndex - 1;
            updateImageSlider();
        });

        nextBtn.addEventListener('click', () => {
            currentImageIndex = (currentImageIndex === images.length - 1) ? 0 : currentImageIndex + 1;
            updateImageSlider();
        });
    } else {
        // Hide buttons and dots if only one image
        if (prevBtn) prevBtn.style.display = 'none';
        if (nextBtn) nextBtn.style.display = 'none';
        if (dotsContainer) dotsContainer.style.display = 'none';
    }

    updateImageSlider(); // Initial display for this image slider
}

// Create the slider to display the reviews
function createReviewsBanner() { // Renamed for clarity: it creates the whole banner
    const body = document.body; // Get the body element

    // 1. Create the main container div
    const reviewsContainer = document.getElementById('reviews');

    // 2. Create the main slider div
    const mainSlider = document.createElement('div');
    mainSlider.className = 'slider';

    // 3. Create main review navigation buttons
    const reviewNavPrev = document.createElement('button');
    reviewNavPrev.className = 'review-nav prev-review';
    reviewNavPrev.textContent = '«';
    reviewNavPrev.addEventListener('click', prevReview);

    const reviewNavNext = document.createElement('button');
    reviewNavNext.className = 'review-nav next-review';
    reviewNavNext.textContent = '»';
    reviewNavNext.addEventListener('click', nextReview);

    // 4. Create main review dots container
    const reviewDotsContainer = document.createElement('div');
    reviewDotsContainer.className = 'review-dots';

    // Loop through data to create each review slide
    for (const key in data) {
        const review = data[key];
        const slide = document.createElement('div');
        slide.className = 'slide';

        // --- Image Slider Structure within each slide ---
        const imageSlider = document.createElement('div');
        imageSlider.className = 'image-slider';
        const imageSliderInner = document.createElement('div');
        imageSliderInner.className = 'image-slider-inner';
        imageSlider.appendChild(imageSliderInner);

        const imgPrevBtn = document.createElement('button');
        imgPrevBtn.className = 'image-nav prev-img';
        imgPrevBtn.textContent = '❮';
        imageSlider.appendChild(imgPrevBtn);

        const imgNextBtn = document.createElement('button');
        imgNextBtn.className = 'image-nav next-img';
        imgNextBtn.textContent = '❯';
        imageSlider.appendChild(imgNextBtn);

        const imgDots = document.createElement('div');
        imgDots.className = 'image-dots';
        imageSlider.appendChild(imgDots);

        slide.appendChild(imageSlider);

        // --- Review Details ---
        const titleContainer = document.createElement('div');
        titleContainer.className = 'title_container';

        const subtitle = document.createElement('div');
        subtitle.className = 'subtitle';
        const name = document.createElement('h3');
        name.textContent = review.name;
        const date = document.createElement('p');
        date.textContent = review.date;
        subtitle.appendChild(name);
        subtitle.appendChild(date);

        const stars = document.createElement('p');
        stars.className = 'stars';
        stars.textContent = '⭐'.repeat(parseInt(review.stars));

        titleContainer.appendChild(subtitle);
        titleContainer.appendChild(stars);
        slide.appendChild(titleContainer);

        const comment = document.createElement('p');
        comment.className = 'review-text';
        comment.textContent = review.comment;
        slide.appendChild(comment);

        mainSlider.appendChild(slide);
        reviewSlides.push(slide); // Store reference to the slide
    }

    // Append all created elements to the reviewsContainer
    reviewsContainer.appendChild(reviewNavPrev);
    reviewsContainer.appendChild(mainSlider);
    reviewsContainer.appendChild(reviewNavNext);
    reviewsContainer.appendChild(reviewDotsContainer);



    // After all elements are in the DOM, set up image sliders for each review
    reviewSlides.forEach((slide, index) => {
        // Ensure data[index] and data[index].content exist
        if (data[index] && data[index].content) {
            setupImageSlider(slide, data[index].content);
        }
    });

    // Initial update for the review slider position and dots
    updateReviewSlider();
    console.log("Reviews banner created and initialized.");
}

// Auto-rotation (optional)
let autoSlideInterval;
const AUTO_SLIDE_DELAY = 5000; // 5 seconds

function startAutoSlide() {
    stopAutoSlide(); // Clear any existing interval first
    autoSlideInterval = setInterval(nextReview, AUTO_SLIDE_DELAY);
}

function stopAutoSlide() {
    clearInterval(autoSlideInterval);
}

// Event listeners for user interaction to pause/resume auto-slide
document.addEventListener('DOMContentLoaded', () => {
    createReviewsBanner(); // Initialize the entire banner

    // Pause auto-slide on hover
    const reviewsContainer = document.getElementById('reviews-container');
    if (reviewsContainer) { // Ensure it exists before attaching events
        reviewsContainer.addEventListener('mouseenter', stopAutoSlide);
        reviewsContainer.addEventListener('mouseleave', startAutoSlide);
    }

    // Start auto-rotation
    startAutoSlide();

    // Recalculate reviews per view on window resize
    window.addEventListener('resize', () => {
        reviewsPerView = getReviewsPerView();
        // Reset currentReviewIndex to ensure we don't end up on a non-existent "page"
        const totalReviews = Object.keys(data).length;
        const maxStartIndex = totalReviews - reviewsPerView;
        currentReviewIndex = Math.min(currentReviewIndex, maxStartIndex);
        if (currentReviewIndex < 0) currentReviewIndex = 0; // Handle case where total reviews < reviewsPerView

        updateReviewSlider(); // Re-render to ensure correct positioning and dot count
    });
});


createReviewsBanner(); // Call this function to create the reviews banner when the script loads