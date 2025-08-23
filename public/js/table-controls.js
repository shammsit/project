document.addEventListener('DOMContentLoaded', () => {
    const addRowBtn = document.getElementById('add-row-btn');
    const gridBody = document.getElementById('data-grid-body');

    // Function to create a new, empty grid row
    const createNewRow = () => {
        const newRow = document.createElement('div');
        newRow.classList.add('data-grid-row');

        // Define the structure of the new row. Cells are not editable by default.
        newRow.innerHTML = `
            <div data-label="Name" contenteditable="false">New Name</div>
            <div data-label="Username" contenteditable="false">new_user</div>
            <div data-label="Password" contenteditable="false">********</div>
            <div data-label="Mobile Number" contenteditable="false"></div>
            <div data-label="Email ID" contenteditable="false"></div>
            <div data-label="Project Name" contenteditable="false"></div>
            <div data-label="Role" contenteditable="false"></div>
            <div class="actions-cell">
                <button class="btn edit-btn">Edit</button>
                <button class="btn approve-btn">Approve</button>
                <button class="btn reject-btn">Delete</button>
                <button class="btn contact-btn">Contact</button>
            </div>
        `;
        return newRow;
    };

    // --- Event Delegation for Action Buttons ---
    // We listen for clicks on the body of the grid, then check what was clicked.
    if (gridBody) {
        gridBody.addEventListener('click', (e) => {
            const target = e.target;
            const row = target.closest('.data-grid-row');

            if (!row) return;

            // Handle EDIT button click
            if (target.classList.contains('edit-btn')) {
                const cells = row.querySelectorAll('[contenteditable]');
                cells.forEach(cell => cell.setAttribute('contenteditable', 'true'));
                target.textContent = 'Save';
                target.classList.remove('edit-btn');
                target.classList.add('save-btn');
                row.classList.add('editing');
            }
            // Handle SAVE button click
            else if (target.classList.contains('save-btn')) {
                const cells = row.querySelectorAll('[contenteditable]');
                cells.forEach(cell => cell.setAttribute('contenteditable', 'false'));
                target.textContent = 'Edit';
                target.classList.remove('save-btn');
                target.classList.add('edit-btn');
                row.classList.remove('editing');
            }
            // Handle DELETE button click
            else if (target.classList.contains('reject-btn')) {
                if (confirm('Are you sure you want to delete this row?')) {
                    row.remove();
                }
            }
        });
    }

    // Event listener for the "Add New Row" button
    if (addRowBtn) {
        addRowBtn.addEventListener('click', () => {
            const newRow = createNewRow();
            if (gridBody) {
                gridBody.appendChild(newRow);
            }
        });
    }
});
