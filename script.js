const toggleButton = document.querySelector('.theme-toggle');
const themeIcon = document.querySelector('.theme-toggle-icon');

const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
document.body.classList.toggle('dark-theme', prefersDark);
if (themeIcon) {
  themeIcon.textContent = prefersDark ? '☀' : '☾';
}

if (toggleButton) {
  toggleButton.addEventListener('click', () => {
    const isDark = document.body.classList.toggle('dark-theme');
    if (themeIcon) {
      themeIcon.textContent = isDark ? '☀' : '☾';
    }
  });
}

const counters = document.querySelectorAll('.stat-number');

const animateCounter = (element) => {
  const target = Number(element.dataset.target || 0);
  const suffix = target >= 12 && target <= 24 ? 'h' : '';
  const duration = 1200;
  let start = null;

  const step = (timestamp) => {
    if (!start) start = timestamp;
    const progress = Math.min((timestamp - start) / duration, 1);
    const current = Math.floor(progress * target);
    element.textContent = suffix ? `${current}${suffix}` : `${current}${target >= 500 ? '+' : ''}`;

    if (progress < 1) {
      requestAnimationFrame(step);
    } else {
      element.textContent = suffix ? `${target}${suffix}` : `${target}${target >= 500 ? '+' : ''}`;
    }
  };

  requestAnimationFrame(step);
};

const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      animateCounter(entry.target);
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.5 });

counters.forEach((counter) => observer.observe(counter));

const hostels = [
  {
    id: 1,
    name: 'Nile Hall',
    icon: '🏠',
    type: 'Single',
    gender: 'Mixed',
    price: 8500,
    rating: 4.8,
    availability: 12,
    image: 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=900&q=80',
    description: 'Modern single rooms with shared study lounges and secure access.'
  },
  {
    id: 2,
    name: 'Lakeview Residence',
    icon: '🌊',
    type: 'Double',
    gender: 'Female',
    price: 14000,
    rating: 4.7,
    availability: 8,
    image: 'https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=900&q=80',
    description: 'Comfortable double rooms with quiet study corners and laundry access.'
  },
  {
    id: 3,
    name: 'Oakville hostel',
    icon: '🏞️',
    type: 'Suite',
    gender: 'Male',
    price: 18000,
    rating: 4.9,
    availability: 5,
    image: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=900&q=80',
    description: 'Premium suites for students seeking privacy and extra space.'
  },
  {
    id: 4,
    name: 'Campus View Lodge',
    icon: '🧭',
    type: 'Double',
    gender: 'Mixed',
    price: 9000,
    rating: 4.6,
    availability: 15,
    image: 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=900&q=80',
    description: 'Affordable and conveniently located near classrooms and libraries.'
  },
  {
    id: 5,
    name: 'Sunrise Annex',
    icon: '🌤️',
    type: 'Single',
    gender: 'Female',
    price: 10000,
    rating: 4.8,
    availability: 9,
    image: 'https://images.unsplash.com/photo-1484154218962-a197022b5858?auto=format&fit=crop&w=900&q=80',
    description: 'Bright and airy rooms with strong Wi-Fi and 24-hour support.'
  },
  {
    id: 6,
    name: 'Meridian House',
    icon: '🏛️',
    type: 'Suite',
    gender: 'Mixed',
    price: 15000,
    rating: 5.0,
    availability: 4,
    image: 'https://images.unsplash.com/photo-1448630360428-65456885c650?auto=format&fit=crop&w=900&q=80',
    description: 'Executive housing for students wanting a premium living experience.'
  }
];

const hostelGrid = document.getElementById('hostelGrid');
const genderFilter = document.getElementById('genderFilter');
const typeFilter = document.getElementById('typeFilter');
const priceFilter = document.getElementById('priceFilter');
const selectedHostel = document.getElementById('selectedHostel');
const cardTitle = document.getElementById('cardTitle');
const cardType = document.getElementById('cardType');
const cardPrice = document.getElementById('cardPrice');
const cardAvailability = document.getElementById('cardAvailability');
const bookingForm = document.getElementById('bookingForm');

let selectedId = 1;
let currentFilter = {
  gender: 'all',
  type: 'all',
  price: 'all'
};

function formatPrice(value) {
  return `KSh ${value.toLocaleString()}`;
}

function getFilteredHostels() {
  return hostels.filter((hostel) => {
    const matchesGender = currentFilter.gender === 'all' || hostel.gender === currentFilter.gender;
    const matchesType = currentFilter.type === 'all' || hostel.type === currentFilter.type;
    const matchesPrice = currentFilter.price === 'all' || hostel.price <= Number(currentFilter.price);
    return matchesGender && matchesType && matchesPrice;
  });
}

function renderHostels() {
  const visibleHostels = getFilteredHostels();

  if (!visibleHostels.length) {
    hostelGrid.innerHTML = `
      <div class="hostel-card" style="grid-column: 1 / -1; padding: 30px; text-align: center;">
        <h3>No hostels match your filters</h3>
        <p>Try a different room type or price range.</p>
      </div>
    `;
    return;
  }

  const selectedExists = visibleHostels.some((hostel) => hostel.id === selectedId);
  if (!selectedExists) {
    selectedId = visibleHostels[0].id;
  }

  hostelGrid.innerHTML = visibleHostels
    .map((hostel) => {
      const activeClass = hostel.id === selectedId ? 'active' : '';
      return `
        <article class="hostel-card ${activeClass}" data-id="${hostel.id}">
          <img class="hostel-image" src="${hostel.image}" alt="${hostel.name} hostel" />
          <div class="hostel-body">
            <div class="hostel-head">
              <h3>${hostel.name}</h3>
              <span class="pill">${hostel.gender}</span>
            </div>

            <div class="hostel-meta">
              <span>${hostel.type}</span>
              <span>⭐ ${hostel.rating}</span>
              <span>${hostel.availability} rooms left</span>
            </div>

            <p>${hostel.description}</p>

            <div class="card-row">
              <span>Monthly rent</span>
              <span class="price">${formatPrice(hostel.price)}</span>
            </div>

            <div class="room-row">
              <span>Secure & Wi-Fi ready</span>
              <button class="select-btn" type="button">Select</button>
            </div>
          </div>
        </article>
      `;
    })
    .join('');

  hostelGrid.querySelectorAll('.hostel-card').forEach((card) => {
    card.addEventListener('click', (event) => {
      if (event.target.closest('button')) {
        const id = Number(card.dataset.id);
        selectHostel(id);
      }
    });
  });

  updateBookingSummary();
}

function updateBookingSummary() {
  const hostel = hostels.find((item) => item.id === selectedId);
  if (!hostel) return;

  selectedHostel.value = hostel.name;
  cardTitle.textContent = hostel.name;
  cardType.textContent = `${hostel.type} room`;
  cardPrice.textContent = formatPrice(hostel.price);
  cardAvailability.textContent = `${hostel.availability} rooms`;
}

function selectHostel(id) {
  selectedId = id;
  renderHostels();
}

function applyFilters() {
  currentFilter.gender = genderFilter.value;
  currentFilter.type = typeFilter.value;
  currentFilter.price = priceFilter.value;
  renderHostels();
}

[genderFilter, typeFilter, priceFilter].forEach((filterEl) => {
  filterEl.addEventListener('change', applyFilters);
});

bookingForm.addEventListener('submit', (event) => {
  event.preventDefault();

  const studentName = document.getElementById('studentName').value.trim();
  const hostelName = selectedHostel.value;
  const checkIn = document.getElementById('checkin').value;

  if (!studentName || !checkIn) {
    alert('Please complete all booking details before submitting your request.');
    return;
  }

  alert(`Reservation request received for ${studentName} in ${hostelName}. Check-in date: ${checkIn}. Our hostel office will contact you shortly.`);
  bookingForm.reset();
  selectedId = hostels[0].id;
  renderHostels();
});

renderHostels();
