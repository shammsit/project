document.addEventListener('DOMContentLoaded', () => {
    const captchaBox = document.getElementById('captcha-box');
    const captchaInput = document.getElementById('captcha-input');
    const refreshButton = document.getElementById('refresh-captcha');
    const loginForm = document.getElementById('login-form');
    const messageElement = document.getElementById('form-message');

    let captchaText = '';

    // Function to generate a random alphanumeric string for the CAPTCHA
    const generateCaptcha = () => {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let result = '';
        for (let i = 0; i < 6; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        captchaText = result;
        captchaBox.textContent = captchaText;
        messageElement.textContent = ''; // Clear any previous messages
    };

    // Event listener for the refresh button
    refreshButton.addEventListener('click', generateCaptcha);

    // Event listener for the form submission
    loginForm.addEventListener('submit', (e) => {
        e.preventDefault(); // Prevent the form from submitting

        // Validate the CAPTCHA
        if (captchaInput.value === captchaText) {
            messageElement.textContent = 'CAPTCHA Verified!';
            messageElement.style.color = '#00ff41';
            // In a real app, you would now send the form data to the server
        } else {
            messageElement.textContent = 'Incorrect CAPTCHA. Please try again.';
            messageElement.style.color = '#ff0000'; // Red for error
            captchaInput.value = ''; // Clear the input
            generateCaptcha(); // Generate a new CAPTCHA
        }
    });

    // Generate the first CAPTCHA when the page loads
    generateCaptcha();
});
