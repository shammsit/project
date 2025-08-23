document.addEventListener('DOMContentLoaded', () => {
    const captchaBox = document.getElementById('captcha-box');
    const captchaInput = document.getElementById('captcha-input');
    const refreshButton = document.getElementById('refresh-captcha');
    const loginForm = document.getElementById('login-form');
    const messageElement = document.getElementById('form-message');
    
    const usernameInput = document.querySelector('input[name="username"]');
    const passwordInput = document.querySelector('input[name="password"]');

    let captchaText = '';

    const generateCaptcha = () => {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let result = '';
        for (let i = 0; i < 6; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        captchaText = result;
        captchaBox.textContent = captchaText;
        messageElement.textContent = '';
    };

    if (refreshButton) {
        refreshButton.addEventListener('click', generateCaptcha);
    }

    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            if (captchaInput.value !== captchaText) {
                messageElement.textContent = 'Incorrect CAPTCHA.'; // More specific error for CAPTCHA
                messageElement.style.color = '#ff0000';
                captchaInput.value = '';
                generateCaptcha();
                return;
            }
            
            messageElement.textContent = 'Verifying credentials...';
            messageElement.style.color = '#00ff41';

            try {
                const response = await fetch('/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        username: usernameInput.value,
                        password: passwordInput.value,
                    }),
                });

                const result = await response.json();

                if (result.success) {
                    window.location.href = result.redirect;
                } else {
                    // More professional, generic error message
                    messageElement.textContent = result.message || 'Login failed. Please try again.';
                    messageElement.style.color = '#ff0000';
                    generateCaptcha();
                }

            } catch (error) {
                console.error('Error submitting form:', error);
                messageElement.textContent = 'Could not connect to the server.';
                messageElement.style.color = '#ff0000';
            }
        });
    }

    // Generate the first CAPTCHA if the elements exist on the page
    if (captchaBox) {
        generateCaptcha();
    }
});
