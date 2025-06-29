document.addEventListener('DOMContentLoaded', (event) => {
    // Get elements from the HTML file
    const addDebtBtn = document.getElementById('add-debt-btn');
    const modal = document.getElementById('modal');
    const closeModalBtn = document.querySelector('.close-btn');
    const debtForm = document.getElementById('debt-form');
    const debtsToMeList = document.getElementById('debts-to-me-list');
    const debtsOnMeList = document.getElementById('debts-on-me-list');
    const totalOwedToMeEl = document.getElementById('total-owed-to-me');
    const totalOnMeEl = document.getElementById('total-on-me');

    let isEditMode = false;
    let currentDebtId = null;

    // --- 1. Modal Functions ---
    // Function to open the modal
    function openModal() {
        modal.style.display = 'flex'; // Show the modal
    }

    // Function to close the modal
    function closeModal() {
        modal.style.display = 'none'; // Hide the modal
        // Reset the form and mode
        debtForm.reset();
        isEditMode = false;
        currentDebtId = null;
        document.getElementById('save-debt-btn').textContent = 'حفظ';
    }

    // Event listeners for modal
    addDebtBtn.addEventListener('click', () => {
        openModal();
    });

    closeModalBtn.addEventListener('click', closeModal);

    // Close modal if user clicks outside of it
    window.addEventListener('click', (event) => {
        if (event.target === modal) {
            closeModal();
        }
    });

    // --- 2. Data Storage and Retrieval ---
    // Function to get debts from local storage
    function getDebts() {
        // Retrieve data and parse it from JSON. If no data, return an empty array.
        const debts = JSON.parse(localStorage.getItem('debts')) || [];
        return debts;
    }

    // Function to save debts to local storage
    function saveDebts(debts) {
        // Convert the array to a JSON string and save it
        localStorage.setItem('debts', JSON.stringify(debts));
    }

    // --- 3. Rendering and Displaying Debts ---
    // Function to render debts on the screen
    function renderDebts() {
        // Clear the lists first to avoid duplicates
        debtsToMeList.innerHTML = '';
        debtsOnMeList.innerHTML = '';

        const debts = getDebts();
        let totalOwedToMe = 0;
        let totalOnMe = 0;

        debts.forEach(debt => {
            // Create a list item for each debt
            const listItem = document.createElement('li');
            listItem.classList.add('debt-item');
            
            // Add a class based on the debt type for styling
            if (debt.type === 'to-me') {
                listItem.classList.add('to-me');
                // Only add to total if the debt is not paid
                if (!debt.isPaid) {
                    totalOwedToMe += parseFloat(debt.amount);
                }
            } else {
                listItem.classList.add('on-me');
                if (!debt.isPaid) {
                    totalOnMe += parseFloat(debt.amount);
                }
            }
            
            // Add a class to dim paid debts
            if (debt.isPaid) {
                listItem.classList.add('paid');
            }
            
            // Generate unique ID for each list item
            listItem.dataset.id = debt.id;

            // HTML for the debt item with dynamic buttons
            // This is the updated section!
            listItem.innerHTML = `
                <div class="debt-info">
                    <span class="person-name">${debt.person}</span>
                    <span class="amount">${debt.amount}</span>
                    <div class="description">${debt.description || ''}</div>
                    <div class="date">تاريخ الاستحقاق: ${debt.dueDate || 'لا يوجد'}</div>
                </div>
                <div class="debt-actions">
                    ${!debt.isPaid ? `<button class="pay-btn" data-id="${debt.id}" title="سداد الدين">&#10003;</button>` : ''}
                    <button class="edit-btn" data-id="${debt.id}" title="تعديل">&#9998;</button>
                    <button class="delete-btn" data-id="${debt.id}" title="حذف">&times;</button>
                </div>
            `;
            
            // Append the item to the correct list
            if (debt.type === 'to-me') {
                debtsToMeList.appendChild(listItem);
            } else {
                debtsOnMeList.appendChild(listItem);
            }
        });

        // Update the summary totals
        totalOwedToMeEl.textContent = totalOwedToMe.toFixed(2);
        totalOnMeEl.textContent = totalOnMe.toFixed(2);
    }

    // --- 4. Form Submission and CRUD (Create, Read, Update, Delete) ---
    // Function to handle form submission (Add or Edit)
    debtForm.addEventListener('submit', (e) => {
        e.preventDefault(); // Prevent the form from submitting and reloading the page

        // Get values from the form inputs
        const person = document.getElementById('person-name').value;
        const amount = parseFloat(document.getElementById('amount').value).toFixed(2);
        const debtType = document.getElementById('debt-type').value;
        const dueDate = document.getElementById('due-date').value;
        const description = document.getElementById('description').value;

        let debts = getDebts();

        if (isEditMode) {
            // Update an existing debt
            debts = debts.map(debt => {
                if (debt.id === currentDebtId) {
                    return {
                        ...debt, // Keep existing properties
                        person,
                        amount,
                        type: debtType,
                        dueDate,
                        description
                    };
                }
                return debt;
            });
            alert('تم تعديل الدين بنجاح!');
        } else {
            // Create a new debt object
            const newDebt = {
                id: Date.now(), // Use a timestamp as a unique ID
                person,
                amount,
                type: debtType,
                dueDate,
                description,
                isPaid: false // New property: default to not paid
            };
            // Add the new debt to the array
            debts.push(newDebt);
            alert('تم إضافة الدين بنجاح!');
        }

        saveDebts(debts); // Save the updated list to local storage
        renderDebts();    // Re-render the lists
        closeModal();     // Close the modal
    });
    
    // --- 5. Edit, Delete, and Pay Actions ---
    // Add event listener to the debt lists for all buttons
    document.addEventListener('click', (e) => {
        // Check if the clicked element is a delete button
        if (e.target.classList.contains('delete-btn')) {
            const debtIdToDelete = parseInt(e.target.dataset.id);
            if (confirm('هل أنت متأكد من أنك تريد حذف هذا الدين؟')) {
                let debts = getDebts();
                // Filter out the debt with the matching ID
                debts = debts.filter(debt => debt.id !== debtIdToDelete);
                saveDebts(debts);
                renderDebts();
            }
        }
        
        // Check if the clicked element is an edit button
        if (e.target.classList.contains('edit-btn')) {
            currentDebtId = parseInt(e.target.dataset.id);
            isEditMode = true;
            
            // Find the debt data to pre-fill the form
            const debts = getDebts();
            const debtToEdit = debts.find(debt => debt.id === currentDebtId);
            
            if (debtToEdit) {
                // Pre-fill the form with the debt's data
                document.getElementById('person-name').value = debtToEdit.person;
                document.getElementById('amount').value = debtToEdit.amount;
                document.getElementById('debt-type').value = debtToEdit.type;
                document.getElementById('due-date').value = debtToEdit.dueDate;
                document.getElementById('description').value = debtToEdit.description;
                
                // Change button text to indicate editing mode
                document.getElementById('save-debt-btn').textContent = 'حفظ التعديلات';
                
                openModal(); // Open the modal with the pre-filled data
            }
        }
        
        // Check if the clicked element is a pay button
        if (e.target.classList.contains('pay-btn')) {
            const debtIdToPay = parseInt(e.target.dataset.id);
            if (confirm('هل أنت متأكد من أن هذا الدين تم سداده بالكامل؟')) {
                let debts = getDebts();
                // Find the debt and mark it as paid
                debts = debts.map(debt => {
                    if (debt.id === debtIdToPay) {
                        return { ...debt, isPaid: true };
                    }
                    return debt;
                });
                saveDebts(debts);
                renderDebts();
                alert('تم تحديث حالة الدين إلى "تم السداد".');
            }
        }
    });
    
    // --- 6. Initial Load ---
    // Load and display debts when the page loads for the first time
    renderDebts();
});
