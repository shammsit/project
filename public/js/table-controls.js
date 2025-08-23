document.addEventListener('DOMContentLoaded', () => {
    const addRowBtn = document.getElementById('add-row-btn');
    const tableBody = document.getElementById('data-table-body');

    // Function to create a new, empty row
    const createNewRow = () => {
        const newRow = document.createElement('tr');

        // Define the structure of the new row
        newRow.innerHTML = `
            <td contenteditable="true"></td>
            <td contenteditable="true"></td>
            <td contenteditable="true"></td>
            <td contenteditable="true"></td>
            <td contenteditable="true"></td>
            <td contenteditable="true"></td>
            <td contenteditable="true"></td>
            <td><button class="btn approve-btn">Approve</button></td>
            <td><button class="btn reject-btn">Reject</button></td>
            <td><button class="btn contact-btn">Contact</button></td>
        `;

        return newRow;
    };

    // Event listener for the "Add New Row" button
    addRowBtn.addEventListener('click', () => {
        const newRow = createNewRow();
        tableBody.appendChild(newRow);
    });
});
