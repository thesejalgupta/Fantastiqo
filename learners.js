const apiUrl = 'http://localhost:3000/api';
let token = localStorage.getItem('token') || null;

// Check Authentication
if (!token) window.location.href = 'login.html';

// Fetch with Auth
async function fetchWithAuth(url, options = {}) {
  options.headers = {
    ...options.headers,
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
  const response = await fetch(url, options);
  if (response.status === 401) {
    localStorage.removeItem('token');
    window.location.href = 'login.html';
  }
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Request failed.');
  }
  return response.json();
}

// DOM Elements
const learnerList = document.querySelector('tbody');
const modal = document.querySelector('.modal');
const modalClose = document.querySelector('.modal-close');
const modalConfirm = document.querySelector('.modal-confirm');
const modalCancel = document.querySelector('.modal-cancel');
const addLearnerBtn = document.querySelector('.add-learner-btn');
const statusFilter = document.querySelector('#status-filter');
const progressSelect = document.querySelector('#progress-select');

async function renderLearners() {
  try {
    const status = statusFilter?.value || '';
    const learners = await fetchWithAuth(`${apiUrl}/learners${status ? `?status=${status}` : ''}`);
    learnerList.innerHTML = '';
    learners.forEach(learner => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${learner.name}</td>
        <td>${learner.email}</td>
        <td>${learner.status}</td>
        <td>${learner.coursesEnrolled}</td>
        <td>${learner.lastActive}</td>
        <td>
          <button class="edit-btn" data-id="${learner.id}">Edit</button>
          <button class="delete-btn" data-id="${learner.id}">Delete</button>
        </td>
      `;
      learnerList.appendChild(row);
    });
    document.querySelectorAll('.edit-btn').forEach(btn => {
      btn.addEventListener('click', () => editLearner(btn.dataset.id));
    });
    document.querySelectorAll('.delete-btn').forEach(btn => {
      btn.addEventListener('click', () => deleteLearner(btn.dataset.id));
    });
    // Update progress dropdown
    if (progressSelect) {
      progressSelect.innerHTML = '<option value="">Select Learner</option>';
      learners.forEach(learner => {
        const option = document.createElement('option');
        option.value = learner.id;
        option.textContent = learner.name;
        progressSelect.appendChild(option);
      });
    }
  } catch (error) {
    console.error('Error fetching learners:', error);
    alert(`Failed to load learners: ${error.message}`);
  }
}

async function addLearner() {
  const name = document.getElementById('learner-name').value;
  const email = document.getElementById('learner-email').value;
  const status = document.getElementById('learner-status').value;
  const notes = document.getElementById('learner-notes').value;
  try {
    const newLearner = await fetchWithAuth(`${apiUrl}/learners`, {
      method: 'POST',
      body: JSON.stringify({ name, email, status, notes }),
    });
    modal.classList.remove('active');
    renderLearners();
    alert('Learner added successfully.');
  } catch (error) {
    console.error('Error adding learner:', error);
    alert(`Failed to add learner: ${error.message}`);
  }
}

async function editLearner(id) {
  try {
    const learner = await fetchWithAuth(`${apiUrl}/learners/${id}`);
    document.getElementById('learner-name').value = learner.name;
    document.getElementById('learner-email').value = learner.email;
    document.getElementById('learner-status').value = learner.status;
    document.getElementById('learner-notes').value = learner.notes;
    modal.classList.add('active');
    modalConfirm.dataset.id = id;
    modalConfirm.removeEventListener('click', addLearner);
    modalConfirm.addEventListener('click', async () => {
      try {
        const updatedLearner = await fetchWithAuth(`${apiUrl}/learners/${id}`, {
          method: 'PUT',
          body: JSON.stringify({
            name: document.getElementById('learner-name').value,
            email: document.getElementById('learner-email').value,
            status: document.getElementById('learner-status').value,
            notes: document.getElementById('learner-notes').value,
          }),
        });
        modal.classList.remove('active');
        renderLearners();
        alert('Learner updated successfully.');
      } catch (error) {
        console.error('Error updating learner:', error);
        alert(`Failed to update learner: ${error.message