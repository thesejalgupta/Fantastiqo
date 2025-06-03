// Helper function to fetch with auth
async function fetchWithAuth(url, options = {}) {
  const token = localStorage.getItem('token');
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
    ...options.headers
  };
  const response = await fetch(url, { ...options, headers });
  if (response.status === 401) {
    window.location.href = 'login.html';
    throw new Error('Unauthorized');
  }
  if (!response.ok) throw new Error(`API request failed: ${response.status}`);
  return response.json();
}

// Initialize Admin
async function initAdmin() {
  try {
    const user = await fetchWithAuth('http://localhost:5000/api/users/me');
    heroUserName.textContent = user.name;
    userName.textContent = user.name;
    document.querySelector('.profile-dropdown img').src = user.avatar;
  } catch (err) {
    console.error('Failed to fetch user:', err);
    window.location.href = 'login.html';
  }
}

// Render Stats
async function renderStats() {
  try {
    const stats = await fetchWithAuth('http://localhost:5000/api/dashboard/stats');
    statsGrid.innerHTML = '';
    stats.forEach(stat => {
      const statCard = document.createElement('div');
      statCard.classList.add('stat-card');
      statCard.innerHTML = `
        <i class="${stat.icon}"></i>
        <h3>${stat.value}</h3>
        <p>${stat.title} <i class="fas fa-arrow-${stat.trend} ${stat.trend === 'up' ? 'text-success' : 'text-danger'}"></i></p>
      `;
      statsGrid.appendChild(statCard);
      setTimeout(() => statCard.classList.add('visible'), 100);
    });
  } catch (err) {
    console.error('Failed to fetch stats:', err);
    statsGrid.innerHTML = '<p>Error loading stats. Please try again.</p>';
  }
}

// Render Management Items
async function renderManagement() {
  try {
    const [learners, instructors, courses] = await Promise.all([
      fetchWithAuth('http://localhost:5000/api/learners'),
      fetchWithAuth('http://localhost:5000/api/instructors'),
      fetchWithAuth('http://localhost:5000/api/courses')
    ]);
    const managementItems = [...learners, ...instructors, ...courses];
    managementGrid.innerHTML = '';
    managementItems.forEach(item => {
      const managementCard = document.createElement('div');
      managementCard.classList.add('management-card');
      managementCard.innerHTML = `
        <div class="card-image">
          <img src="${item.image}" alt="${item.title}">
          <div class="card-overlay">
            <a href="#" class="quick-action" data-action="${item.quickAction}" data-id="${item.id}">${item.quickAction}</a>
          </div>
        </div>
        <div class="card-details">
          <h3 class="card-title">${item.title}</h3>
          <div class="card-meta">
            <span>${item.description}</span>
          </div>
          <a href="#" class="action-btn">Manage Now</a>
        </div>
      `;
      managementGrid.appendChild(managementCard);
      setTimeout(() => managementCard.classList.add('visible'), 100);
    });

    document.querySelectorAll('.quick-action').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.preventDefault();
        const action = btn.dataset.action;
        const itemId = btn.dataset.id;
        modalMessage.textContent = `Perform action: ${action}?`;
        modal.classList.add('active');
        modalConfirm.onclick = async () => {
          try {
            if (action === 'Add Learner') {
              await fetchWithAuth('http://localhost:5000/api/learners', {
                method: 'POST',
                body: JSON.stringify({ email: `learner${Date.now()}@fantastiqo.com`, name: 'New Learner' })
              });
            } else if (action === 'Approve Instructor') {
              await fetchWithAuth(`http://localhost:5000/api/instructors/approve/${itemId}`, { method: 'POST' });
            } else if (action === 'Add Course') {
              await fetchWithAuth('http://localhost:5000/api/courses', {
                method: 'POST',
                body: JSON.stringify({
                  title: 'New Course',
                  description: 'A new course added via quick action',
                  type: 'recorded',
                  price: 0
                })
              });
            }
            alert('Action confirmed!');
            modal.classList.remove('active');
            renderManagement();
          } catch (err) {
            console.error('Action failed:', err);
            alert('Failed to perform action.');
          }
        };
      });
    });
  } catch (err) {
    console.error('Failed to fetch management items:', err);
    managementGrid.innerHTML = '<p>Error loading management items. Please try again.</p>';
  }
}

// Render Notifications
async function renderNotifications() {
  try {
    const notificationsData = await fetchWithAuth('http://localhost:5000/api/notifications');
    notificationContent.innerHTML = '';
    notificationsData.forEach(notification => {
      const notificationItem = document.createElement('div');
      notificationItem.classList.add('notification-item');
      notificationItem.innerHTML = `
        <i class="${notification.icon}"></i> ${notification.message}
      `;
      notificationContent.appendChild(notificationItem);
    });
    setTimeout(() => notifications.classList.add('active'), 1000);
  } catch (err) {
    console.error('Failed to fetch notifications:', err);
    notificationContent.innerHTML = '<p>Error loading notifications. Please try again.</p>';
  }
}

// Render Chart
async function renderChart() {
  try {
    const chartData = await fetchWithAuth('http://localhost:5000/api/dashboard/chart');
    const ctx = document.getElementById('analytics-chart').getContext('2d');
    new Chart(ctx, {
      type: 'line',
      data: chartData,
      options: {
        responsive: true,
        plugins: {
          legend: { display: true, labels: { color: document.body.classList.contains('dark-mode') ? '#E2E8F0' : '#005566' } },
          tooltip: { backgroundColor: '#005566', titleColor: '#FFFFFF', bodyColor: '#FFFFFF' }
        },
        scales: {
          x: { ticks: { color: document.body.classList.contains('dark-mode') ? '#E2E8F0' : '#005566' } },
          y: { ticks: { color: document.body.classList.contains('dark-mode') ? '#E2E8F0' : '#005566' } }
        }
      }
    });
  } catch (err) {
    console.error('Failed to fetch chart data:', err);
    document.getElementById('analytics-chart').parentElement.innerHTML = '<p>Error loading chart. Please try again.</p>';
  }
}

// Logout
document.getElementById('logout').addEventListener('click', () => {
  localStorage.removeItem('token');
  window.location.href = 'login.html';
});

// Initialize
initAdmin();
renderStats();
renderManagement();
renderNotifications();
renderChart();