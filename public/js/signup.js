document.addEventListener('DOMContentLoaded', () => {
    const signupForm = document.getElementById('signup-form');
    const messageElement = document.getElementById('form-message');
    const captchaBox = document.getElementById('captcha-box');
    const captchaInput = document.getElementById('captcha-input');
    const refreshButton = document.getElementById('refresh-captcha');
    const countryCodeSelect = document.getElementById('country-code');
    const mobileInput = document.querySelector('input[name="mobile"]');
    const emailInput = document.querySelector('input[name="email"]');

    let captchaText = '';

    const generateCaptcha = () => {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let result = '';
        for (let i = 0; i < 6; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        captchaText = result;
        captchaBox.textContent = captchaText;
    };

    refreshButton.addEventListener('click', generateCaptcha);

    signupForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        messageElement.textContent = '';

        // --- Client-Side Validation ---
        // 1. Email Validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(emailInput.value)) {
            messageElement.textContent = 'Please enter a valid email address.';
            messageElement.style.color = '#ff0000';
            return;
        }

        // 2. Phone Number Validation
        if (countryCodeSelect.value === '+91' && mobileInput.value.length !== 10) {
            messageElement.textContent = 'Mobile number for India (+91) must be 10 digits.';
            messageElement.style.color = '#ff0000';
            return;
        }

        // 3. CAPTCHA Validation
        if (captchaInput.value !== captchaText) {
            messageElement.textContent = 'Incorrect CAPTCHA. Please try again.';
            messageElement.style.color = '#ff0000';
            generateCaptcha();
            return;
        }

        // --- Form Submission ---
        const formData = new FormData(signupForm);
        const data = Object.fromEntries(formData.entries());

        try {
            const response = await fetch('/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });

            const result = await response.json();

            if (result.success) {
                signupForm.reset();
                messageElement.textContent = result.message;
                messageElement.style.color = '#00ff41';
            } else {
                messageElement.textContent = result.message || 'An error occurred.';
                messageElement.style.color = '#ff0000';
            }
        } catch (error) {
            messageElement.textContent = 'Server connection error.';
            messageElement.style.color = '#ff0000';
        }

        generateCaptcha();
    });

    generateCaptcha();
});
