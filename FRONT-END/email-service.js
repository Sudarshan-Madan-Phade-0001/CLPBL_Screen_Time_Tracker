class EmailService {
  constructor() {
    this.emailLogs = [];
    this.loadEmailLogs();
  }
  
  loadEmailLogs() {
    try {
      const logs = localStorage.getItem('emailLogs');
      this.emailLogs = logs ? JSON.parse(logs) : [];
    } catch (e) {
      console.error('Error loading email logs:', e);
      this.emailLogs = [];
    }
  }
  
  saveEmailLogs() {
    try {
      localStorage.setItem('emailLogs', JSON.stringify(this.emailLogs));
    } catch (e) {
      console.error('Error saving email logs:', e);
    }
  }
  
  sendWelcomeEmail(name, email) {
    const emailData = {
      to: email,
      subject: 'Welcome to Screen Time Tracker!',
      body: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #077b32;">Welcome to Screen Time Tracker, ${name}!</h2>
          <p>Thank you for signing up. We're excited to help you take control of your digital habits.</p>
          <p>With Screen Time Tracker, you can:</p>
          <ul>
            <li>Set time limits for distracting websites</li>
            <li>Track your usage patterns</li>
            <li>Build healthier digital habits</li>
          </ul>
          <p>Get started by adding websites to track in your dashboard.</p>
          <p>Best regards,<br>The Screen Time Tracker Team</p>
        </div>
      `,
      sentAt: new Date().toISOString()
    };
    
    this.emailLogs.push(emailData);
    this.saveEmailLogs();
    
    console.log(`Welcome email sent to ${email}`);
    
    return true;
  }
  
  sendLoginNotificationEmail(email) {
    const now = new Date();
    const formattedDate = now.toLocaleString();
    
    const emailData = {
      to: email,
      subject: 'New Login Detected - Screen Time Tracker',
      body: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #077b32;">New Login Detected</h2>
          <p>We detected a new login to your Screen Time Tracker account.</p>
          <p><strong>Time:</strong> ${formattedDate}</p>
          <p>If this was you, you can ignore this email. If you didn't log in recently, please secure your account by changing your password.</p>
          <p>Best regards,<br>The Screen Time Tracker Team</p>
        </div>
      `,
      sentAt: now.toISOString()
    };
    
    this.emailLogs.push(emailData);
    this.saveEmailLogs();
    
    console.log(`Login notification email sent to ${email}`);
    
    return true;
  }
  
  getEmailLogs() {
    return this.emailLogs;
  }
}

const emailService = new EmailService();