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
const instructorList = document.querySelector('tbody'); // Adjust if not using table
const modal = document.querySelector('.modal');
const modalClose = document.querySelector('.modal-close');
const modalConfirm = document.querySelector('.modal-confirm');
const modalCancel = document.querySelector('.modal-cancel');
const addInstructorBtn = document.querySelector('.add-instructor-btn');
const specialtyFilter = document.querySelector('#specialty-filter');

async function renderInstructors() {
  try {
    const specialty = specialtyFilter?.value || '';
    const instructors = await fetchWithAuth(`${apiUrl}/instructors${specialty ? `?specialty=${specialty}` : ''}`);
    instructorList.innerHTML = '';
    instructors.forEach(instructor => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${instructor.name}</td>
        <td>${instructor.email}</td>
        <td>${instructor.specialty}</td>
        <td>${instructor.courses}</td>
        <td>${instructor.rating}</td>
        <td>
          <button class="edit-btn" data-id="${instructor.id}">Edit</button>
          <button class="delete-btn" data-id="${instructor.id}">Delete</button>
        </td>
      `;
      instructorList.appendChild(row);
    });
    document.querySelectorAll('.edit-btn').forEach(btn => {
      btn.addEventListener('click', () => editInstructor(btn.dataset.id));
    });
    document.querySelectorAll('.delete-btn').forEach(btn => {
      btn.addEventListener('click', () => deleteInstructor(btn.dataset.id));
    });
  } catch (error) {
    console.error('Error fetching instructors:', error);
    alert(`Failed to load instructors: ${error.message}`);
  }
}

async function addInstructor() {
  const name = document.getElementById('instructor-name').value;
  const email = document.getElementById('instructor-email').value;
  const specialty = document.getElementById('instructor-specialty').value;
  const bio = document.getElementById('instructor-bio').value;
  const schedule = document.getElementById('instructor-schedule').value;
  try {
    const newInstructor = await fetchWithAuth(`${apiUrl}/instructors`, {
      method: 'POST',
      body: JSON.stringify({ name, email, specialty, bio, schedule }),
    });
    modal.classList.remove('active');
    renderInstructors();
    alert('Instructor added successfully.');
  } catch (error) {
    console.error('Error adding instructor:', error);
    alert(`Failed to add instructor: ${error.message}`);
  }
}

async function editInstructor(id) {
  try {
    const instructor = await fetchWithAuth(`${apiUrl}/instructors/${id}`);
    document.getElementById('instructor-name').value = instructor.name;
    document.getElementById('instructor-email').value = instructor.email;
    document.getElementById('instructor-specialty').value = instructor.specialty;
    document.getElementById('instructor-bio').value = instructor.bio;
    document.getElementById('instructor-schedule').value = instructor.schedule;
    modal.classList.add('active');
    modalConfirm.dataset.id = id; // Store ID for update
    modalConfirm.removeEventListener('click', addInstructor);
    modalConfirm.addEventListener('click', async () => {
      try {
        const updatedInstructor = await fetchWithAuth(`${apiUrl}/instructors/${id}`, {
          method: 'PUT',
          body: JSON.stringify({
            name: document.getElementById('instructor-name').value,
            email: document.getElementById('instructor-email').value,
            specialty: document.getElementById('instructor-specialty').value,
            bio: document.getElementById('instructor-bio').value,
            schedule: document.getElementById('instructor-schedule').value,
          }),
        });
        modal.classList.remove('active');
        renderInstructors();
        alert('Instructor updated successfully.');
      } catch (error) {
        console.error('Error updating instructor:', error);
        alert(`Failed to update instructor: ${error.message}`);
      }
    }, { once: true });
  } catch (error) {
    console.error('Error fetching instructor:', error);
    alert(`Failed to load instructor: ${error.message}`);
  }
}

async function deleteInstructor(id) {
  if (!confirm('Are you sure you want to delete this instructor?')) return;
  try {
    await fetchWithAuth(`${apiUrl}/instructors/${id}`, { method: 'DELETE' });
    renderInstructors();
    alert('Instructor deleted successfully.');
  } catch (error) {
    console.error('Error deleting instructor:', error);
    alert(`Failed to delete instructor: ${error.message}`);
  }
}

addInstructorBtn?.addEventListener('click', () => {
  modal.classList.add('active');
  modalConfirm.dataset.id = ''; // Clear ID for new instructor
  modalConfirm.removeEventListener('click', addInstructor);
  modalConfirm.addEventListener('click', addInstructor, { once: true });
});

modalClose?.addEventListener('click', () => {
  modal.classList.remove('active');
});

modalCancel?.addEventListener('click', () => {
  modal.classList.remove('active');
});

specialtyFilter?.addEventListener('change', renderInstructors);

// Initialize
renderInstructors();