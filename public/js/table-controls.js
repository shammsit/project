document.addEventListener('DOMContentLoaded', () => {
    const addRowBtn = document.getElementById('add-row-btn');
    const gridBody = document.getElementById('data-grid-body');

    // Function to create a new, empty grid row
    const createNewRow = () => {
        const newRow = document.createElement('div');
        newRow.classList.add('data-grid-row');

        // Define the structure of the new row using divs
        newRow.innerHTML = `
            <div data-label="Name" contenteditable="true"></div>
            <div data-label="Username" contenteditable="true"></div>
            <div data-label="Password" contenteditable="true"></div>
            <div data-label="Mobile Number" contenteditable="true"></div>
            <div data-label="Email ID" contenteditable="true"></div>
            <div data-label="Project Name" contenteditable="true"></div>
            <div data-label="Role" contenteditable="true"></div>
            <div class="actions-cell">
                <button class="btn approve-btn">Approve</button>
                <button class="btn reject-btn">Reject</button>
                <button class="btn contact-btn">Contact</button>
            </div>
        `;

        return newRow;
    };

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
