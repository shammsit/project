document.addEventListener('DOMContentLoaded', () => {
    const gridBody = document.getElementById('data-grid-body');

    if (!gridBody) return;

    gridBody.addEventListener('click', async (e) => {
        const target = e.target;
        const row = target.closest('.data-grid-row');
        if (!row) return;

        const rowIndex = row.dataset.rowIndex;

        // --- Handle EDIT button click ---
        if (target.classList.contains('edit-btn')) {
            const cells = row.querySelectorAll('[data-label]');
            cells.forEach(cell => cell.setAttribute('contenteditable', 'true'));
            target.textContent = 'Save';
            target.classList.remove('edit-btn');
            target.classList.add('save-btn');
            row.classList.add('editing');
        }
        // --- Handle SAVE button click ---
        else if (target.classList.contains('save-btn')) {
            const cells = row.querySelectorAll('[data-label]');
            const rowData = Array.from(cells).map(cell => cell.textContent);

            try {
                const response = await fetch('/update-row', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ rowIndex, rowData }),
                });
                if (!response.ok) throw new Error('Server responded with an error.');

                cells.forEach(cell => cell.setAttribute('contenteditable', 'false'));
                target.textContent = 'Edit';
                target.classList.remove('save-btn');
                target.classList.add('edit-btn');
                row.classList.remove('editing');
                alert('Row updated successfully!');
            } catch (error) {
                console.error('Failed to save row:', error);
                alert('Error: Could not save changes.');
            }
        }
        // --- Handle DELETE button click ---
        else if (target.classList.contains('reject-btn')) {
            if (confirm('Are you sure you want to delete this row? This action cannot be undone.')) {
                try {
                    const response = await fetch('/delete-row', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ rowIndex }),
                    });
                    if (!response.ok) throw new Error('Server responded with an error.');
                    
                    row.remove();
                    alert('Row deleted successfully!');
                } catch (error) {
                    console.error('Failed to delete row:', error);
                    alert('Error: Could not delete row.');
                }
            }
        }
        // --- Handle APPROVE button click ---
        else if (target.classList.contains('approve-btn')) {
            if (confirm('Are you sure you want to approve this user and move their data?')) {
                const cells = row.querySelectorAll('[data-label]');
                const rowData = Array.from(cells).map(cell => cell.textContent);
                
                try {
                    const response = await fetch('/approve-user', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ rowIndex, rowData }),
                    });

                    const result = await response.json();

                    if (response.ok && result.success) {
                        row.remove();
                        alert('User approved and data moved successfully!');
                    } else {
                        throw new Error(result.message || 'Failed to approve user.');
                    }
                } catch (error) {
                    console.error('Failed to approve user:', error);
                    alert(`Error: ${error.message}`);
                }
            }
        }
        // --- Handle CONTACT button click ---
        else if (target.classList.contains('contact-btn')) {
            const mobile = row.querySelector('[data-label="Mobile Number"]').textContent;
            const email = row.querySelector('[data-label="Email ID"]').textContent;

            const contactMethod = prompt(`How would you like to contact this person?\nType "mobile" or "email"`);

            if (contactMethod?.toLowerCase() === 'mobile') {
                if (mobile) {
                    window.location.href = `tel:${mobile}`;
                } else {
                    alert('No mobile number available for this user.');
                }
            } else if (contactMethod?.toLowerCase() === 'email') {
                if (email) {
                    window.location.href = `mailto:${email}`;
                } else {
                    alert('No email address available for this user.');
                }
            }
        }
    });
});
