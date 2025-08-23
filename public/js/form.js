document.addEventListener('DOMContentLoaded', () => {
    const captchaBox = document.getElementById('captcha-box');
    const captchaInput = document.getElementById('captcha-input');
    const refreshButton = document.getElementById('refresh-captcha');
    const loginForm = document.getElementById('login-form');
    const messageElement = document.getElementById('form-message');
    const usernameInput = document.querySelector('input[placeholder="Username"]');
    const passwordInput = document.querySelector('input[placeholder="Password"]');

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

    refreshButton.addEventListener('click', generateCaptcha);

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        if (captchaInput.value !== captchaText) {
            messageElement.textContent = 'Incorrect CAPTCHA. Please try again.';
            messageElement.style.color = '#ff0000';
            generateCaptcha();
            return;
        }

        messageElement.textContent = 'Verifying...';
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

            if (result.success && result.redirect) {
                // If login is successful and a redirect URL is provided, go to that page.
                window.location.href = result.redirect;
            } else {
                // Otherwise, show the error message.
                messageElement.textContent = result.message;
                messageElement.style.color = '#ff0000';
                generateCaptcha();
            }
        } catch (error) {
            messageElement.textContent = 'Server connection error.';
            messageElement.style.color = '#ff0000';
        }
    });

    generateCaptcha();
});
