// Login functionality for Screen Time Tracker

document.addEventListener('DOMContentLoaded', function() {
  const loginForm = document.getElementById('login-form');
  const errorMessage = document.getElementById('error-message');
  const successMessage = document.getElementById('success-message');
  
  // Add event listener to the login form
  loginForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const email = document.getElementById('email-input').value.trim();
    const password = document.getElementById('password-input').value.trim();
    
    // Clear previous messages
    errorMessage.textContent = '';
    successMessage.textContent = '';
    
    try {
      // Send login request to the server
      const response = await fetch('http://localhost:5000/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: email,
          password: password
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        // Login successful
        successMessage.textContent = 'Login successful! Redirecting...';
        
        // Store user data in localStorage
        localStorage.setItem('currentUser', JSON.stringify({
          id: data.user.id,
          email: data.user.email,
          username: data.user.username,
          loginTime: new Date().toISOString()
        }));
        
        // Send welcome email if the function exists
        if (typeof emailService !== 'undefined') {
          if (emailService.sendWelcomeEmail) {
            emailService.sendWelcomeEmail(data.user.username, email);
          }
          
          if (emailService.sendLoginNotificationEmail) {
            emailService.sendLoginNotificationEmail(email);
          }
        }
        
        // Redirect to home page after a short delay
        setTimeout(() => {
          window.location.href = 'home.html';
        }, 1500);
      } else {
        // Login failed
        errorMessage.textContent = data.message || 'Invalid email or password.';
      }
    } catch (error) {
      console.error('Error during login:', error);
      errorMessage.textContent = 'Network error. Please check your connection and try again.';
    }
  });
  
  // Check if redirected from signup
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('registered') === 'true') {
    successMessage.textContent = 'Registration successful! Please login.';
  }
});