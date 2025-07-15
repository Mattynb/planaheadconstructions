
const images = [
    ['/public/finish_carpentry.png', 'Finish Carpentry', 'Our finish carpentry services include crown molding, baseboards, wainscoting, and more.'],
    ['/public/cabinetry.jpg', 'Cabinetry', 'We sell and install prefab cabinets for kitchens, bathrooms, and offices.'],
    ['/public/home_improvement.jpg', 'Home Improvement', 'We offer a wide range of home improvement services'],
    ['/public/custom_furniture.png', 'Custom Furniture', 'We design and build custom furniture to fit your unique style and needs. Such as this unique Ox Cart Table.'],
    ['/public/built_in.png', 'Built-Ins', 'We design and build custom built-ins for your home such as bookcases and more.'],
    ['/public/cleaning.png', 'Cleaning Services', 'Our team provides professional cleaning services after construction and renovation projects for both commercial and residential clients. The PAC Cleaning Team is made up of insured, trained, and highly experienced professionals who have a proven track record of servicing residential and commercial properties throughout Massachusetts.'],
    //['/public/construction.jpg', 'Residential', 'We offer residential construction services, including new home construction, additions, and more.']
  ];
  let currentIndex = 0;

  function openModal(index) {
    const modal = document.getElementById('modal');
    const modalImg = document.getElementById('modal-img');
    const modalTitle = document.getElementById('modal-title');
    const modalDescription = document.getElementById('modal-description');

    currentIndex = index;
    modal.style.display = 'flex';
    modal.style.flexDirection = 'column';

    modalImg.src = images[currentIndex][0];
    modalTitle.textContent = images[currentIndex][1];
    modalDescription.textContent = images[currentIndex][2];

    if (currentIndex == 1) {
      // append a button to the modal that says "View Cabinets" and links to the cabinets page
      if (!document.querySelector('.modal-button')) {
        modalDescription.insertAdjacentHTML('afterend', '<a href="https://www.pac-kb.com" class="modal-button">View Cabinets</a>');
      }

    } else {
      const modalButton = document.querySelector('.modal-button');
      if (modalButton) {
        modalButton.remove();
      }
    }

  }

  function closeModal() {
    const modal = document.getElementById('modal');
    modal.style.display = 'none';
  }

  function changeImage(direction) {
    currentIndex = (currentIndex + direction + images.length) % images.length;
    const modalImg = document.getElementById('modal-img');
    const modalTitle = document.getElementById('modal-title');
    const modalDescription = document.getElementById('modal-description');

    modalImg.src = images[currentIndex][0];
    modalTitle.textContent = images[currentIndex][1];
    modalDescription.textContent = images[currentIndex][2];

    if (currentIndex == 1) {
      // append a button to the modal that says "View Cabinets" and links to the cabinets page
      modalDescription.insertAdjacentHTML('afterend', '<a href="https://www.pac-kb.com" class="modal-button">View Cabinets</a>');
    } else {
      const modalButton = document.querySelector('.modal-button');
      if (modalButton) {
        modalButton.remove();
      }
    }
  }