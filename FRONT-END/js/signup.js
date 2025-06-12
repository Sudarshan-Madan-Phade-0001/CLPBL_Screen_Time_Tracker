// Signup functionality for Screen Time Tracker

document.addEventListener('DOMContentLoaded', function() {
  const signupForm = document.getElementById('signup-form');
  const errorMessage = document.getElementById('error-message');
  
  // Add event listener to the signup form
  signupForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const name = document.getElementById('name-input').value.trim();
    const email = document.getElementById('email-input').value.trim();
    const password = document.getElementById('password-input').value.trim();
    const confirmPassword = document.getElementById('confirm-password-input').value.trim();
    
    // Clear previous error message
    errorMessage.textContent = '';
    
    // Validate passwords match
    if (password !== confirmPassword) {
      errorMessage.textContent = 'Passwords do not match.';
      return;
    }
    
    try {
      // Send registration request to the server
      const response = await fetch('http://localhost:5000/api/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          username: name,
          email: email,
          password: password
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        // Registration successful
        // Also store in localStorage for backward compatibility
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        users.push({
          name,
          email,
          password: '********', // Don't store actual password in localStorage
          createdAt: new Date().toISOString()
        });
        localStorage.setItem('users', JSON.stringify(users));
        
        // Send welcome email if the function exists
        if (typeof emailService !== 'undefined' && emailService.sendWelcomeEmail) {
          emailService.sendWelcomeEmail(name, email);
        }
        
        // Redirect to login page
        window.location.href = 'login.html?registered=true';
      } else {
        // Registration failed
        errorMessage.textContent = data.message || 'Registration failed. Please try again.';
      }
    } catch (error) {
      console.error('Error during registration:', error);
      errorMessage.textContent = 'Network error. Please check your connection and try again.';
    }
  });
});