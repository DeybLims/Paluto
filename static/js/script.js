document.addEventListener('DOMContentLoaded', function() {
    // Get all campaign cards
    const campaignCards = document.querySelectorAll('.campaign__card');
    const mainReserveBtn = document.getElementById('mainReserveBtn');
    const reservationModal = document.getElementById('reservationModal');
    const summaryModal = document.getElementById('summaryModal');
    const confirmationModal = document.getElementById('confirmationModal');
    const campaignSelect = document.getElementById('campaignSelect');
    const dateInput = document.getElementById('reserveDate');
    const dateAlertModal = document.getElementById('dateAlertModal');
    const reservationForm = document.getElementById('reservationForm');
    const loadingOverlay = document.getElementById('loadingOverlay');
    const visitorModal = document.getElementById('visitorModal');
    const menuBtn = document.getElementById("menu-btn");
    const navLinks = document.getElementById("nav-links");
    const menuBtnIcon = menuBtn?.querySelector("i");
    let isLocked = false;
    let lastReservationData = null;

    // Mobile menu toggle
    if (menuBtn && navLinks) {
        menuBtn.addEventListener("click", () => {
            navLinks.classList.toggle("active");
            const isOpen = navLinks.classList.contains("active");
            menuBtnIcon.classList = isOpen ? "fas fa-times" : "fas fa-bars";
        });
    }

    // Character counter for message field
    const messageField = document.getElementById('reserveMessage');
    const charCount = document.getElementById('charCount');
    if (messageField && charCount) {
        messageField.addEventListener('input', function() {
            const remaining = 500 - this.value.length;
            charCount.textContent = `${remaining} characters remaining`;
            charCount.style.color = remaining < 50 ? 'red' : '#888';
        });
    }

    // Phone number validation
    function validatePhoneNumber(phoneNumber) {
        const regex = /^[0-9+()-\s]*$/;
        return regex.test(phoneNumber);
    }

    // Prevent non-numeric input for phone
    function preventNonNumericInput(event) {
        if (!/[0-9+()-\s]/.test(event.key) && event.key !== 'Backspace' && event.key !== 'Delete' && event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') {
            event.preventDefault();
        }
    }

    // Add event listeners to phone inputs
    document.querySelectorAll('input[type="tel"]').forEach(input => {
        input.addEventListener('keydown', preventNonNumericInput);
    });

    // Prevent non-numeric input for number of people
    document.getElementById('reservePeople')?.addEventListener('keydown', function(event) {
        if (!/[0-9]/.test(event.key) && event.key !== 'Backspace' && event.key !== 'Delete' && event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') {
            event.preventDefault();
        }
    });

    // Function to hide all modals and reset page content
    function hideAllModalsAndContent() {
        // First, hide all modals
        const allModals = [visitorModal, reservationModal, summaryModal, confirmationModal, dateAlertModal];
        allModals.forEach(modal => {
            if (modal) {
                modal.style.display = 'none';
                modal.style.opacity = '0';
                modal.style.visibility = 'hidden';
                modal.classList.remove('show');
            }
        });
        
        // Reset page content visibility
        const mainContent = document.querySelectorAll('body > *:not(#visitorModal):not(script):not(style)');
        mainContent.forEach(element => {
            element.style.opacity = '1';
            element.style.pointerEvents = 'auto';
        });
        
        document.body.classList.remove('modal-open');
    }

    // Function to show visitor modal only
    function showVisitorModalOnly() {
        hideAllModalsAndContent();
        
        // Hide all content except visitor modal
        const mainContent = document.querySelectorAll('body > *:not(#visitorModal):not(script):not(style)');
        mainContent.forEach(element => {
            if (element !== visitorModal) {
                element.style.opacity = '0.1';
                element.style.pointerEvents = 'none';
            }
        });
        
        // Show visitor modal
        if (visitorModal) {
            visitorModal.style.display = 'block';
            visitorModal.style.opacity = '1';
            visitorModal.style.visibility = 'visible';
            visitorModal.classList.add('show');
            visitorModal.style.zIndex = '10000';
            
            // Prevent closing the visitor modal
            const closeButtons = visitorModal.querySelectorAll('.close-btn, .close');
            closeButtons.forEach(button => {
                button.style.display = 'none';
            });
        }
        
        document.body.classList.add('modal-open');
    }

    // Function to show a specific modal
    function showModal(modal) {
        if (!modal) return;
        hideAllModalsAndContent();
        modal.style.display = 'block';
        modal.style.opacity = '1';
        modal.style.visibility = 'visible';
        modal.classList.add('show');
        document.body.classList.add('modal-open');
    }

    // Toast notification function
    function showToast(message) {
        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.textContent = message;
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.classList.add('show');
        }, 100);
        
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => {
                document.body.removeChild(toast);
            }, 500);
        }, 3000);
    }

    // Function to show date alert message
    function showDateAlert(message) {
        const alertDiv = document.createElement('div');
        alertDiv.className = 'date-alert';
        alertDiv.style.cssText = `
            position: absolute;
            top: -60px;
            left: 0;
            right: 0;
            background-color: #fff3cd;
            color: #856404;
            padding: 10px;
            border-radius: 5px;
            text-align: center;
            box-shadow: 0 2px 5px rgba(0,0,0,0.1);
            z-index: 1000;
        `;
        alertDiv.textContent = message;
        
        const dateInputContainer = dateInput.parentElement;
        dateInputContainer.style.position = 'relative';
        dateInputContainer.appendChild(alertDiv);
        
        setTimeout(() => {
            alertDiv.remove();
        }, 3000);
    }

    // Initialize page state
    const storedVisitorInfo = sessionStorage.getItem('visitorInfo');
    
    // First, ensure all modals are hidden
    hideAllModalsAndContent();
    
    // Then check for visitor info and show appropriate content
    if (!storedVisitorInfo) {
        showVisitorModalOnly();
    }

    // Handle visitor form submission
    const visitorForm = document.getElementById('visitorForm');
    if (visitorForm) {
        visitorForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            const submitButton = this.querySelector('button[type="submit"]');
            showLoading(submitButton);
            
            const formData = new FormData(this);
            const visitorData = {
                fullName: formData.get('fullName'),
                phoneNumber: formData.get('phoneNumber')
            };
            
            try {
                const response = await submitVisitorData(visitorData);
                if (response.status === 'success') {
                    sessionStorage.setItem('visitorInfo', JSON.stringify(visitorData));
                    hideAllModalsAndContent();
                    showToast('Welcome to PALUTO!');
                } else {
                    throw new Error(response.message || 'Failed to submit visitor information');
                }
            } catch (error) {
                console.error('Error submitting visitor data:', error);
                showToast('Error: ' + error.message);
            } finally {
                hideLoading(submitButton);
            }
        });
    }

    // Main reserve button click handler
    if (mainReserveBtn) {
        mainReserveBtn.addEventListener('click', function() {
            if (!sessionStorage.getItem('visitorInfo')) {
                showVisitorModalOnly();
                return;
            }

            // Reset campaign selection
            if (campaignSelect) {
                campaignSelect.disabled = false;
                campaignSelect.classList.remove('locked-field');
                campaignSelect.value = 'Basic';
            }

            // Show reservation modal
            if (reservationForm) {
                reservationForm.reset();
            }

            showModal(reservationModal);

            // Set default date to tomorrow
            if (dateInput) {
                const tomorrow = getTomorrowDate();
                dateInput.value = tomorrow;
                dateInput.min = tomorrow;
            }

            // Auto-fill visitor info
            const storedInfo = sessionStorage.getItem('visitorInfo');
            if (storedInfo) {
                const visitorInfo = JSON.parse(storedInfo);
                const reserveName = document.getElementById('reserveName');
                const reservePhone = document.getElementById('reservePhone');
                if (reserveName && reservePhone) {
                    reserveName.value = visitorInfo.fullName;
                    reservePhone.value = visitorInfo.phoneNumber;
                }
            }
        });
    }

    // Function to save reservation form data
    function saveReservationData() {
        if (reservationForm) {
            const formData = new FormData(reservationForm);
            lastReservationData = {
                fullName: formData.get('fullName'),
                phoneNumber: formData.get('phoneNumber'),
                inquiryType: formData.get('inquiryType'),
                numberOfPeople: formData.get('numberOfPeople'),
                message: formData.get('message')
            };
            sessionStorage.setItem('lastReservationData', JSON.stringify(lastReservationData));
        }
    }

    // Function to load reservation data
    function loadReservationData() {
        const storedReservationData = sessionStorage.getItem('lastReservationData');
        if (storedReservationData && reservationForm) {
            const data = JSON.parse(storedReservationData);
            const reserveName = document.getElementById('reserveName');
            const reservePhone = document.getElementById('reservePhone');
            const inquiryType = document.getElementById('inquiryType');
            const reservePeople = document.getElementById('reservePeople');
            const reserveMessage = document.getElementById('reserveMessage');

            if (reserveName) reserveName.value = data.fullName || '';
            if (reservePhone) reservePhone.value = data.phoneNumber || '';
            if (inquiryType) inquiryType.value = data.inquiryType || '';
            if (reservePeople) reservePeople.value = data.numberOfPeople || '';
            if (reserveMessage) reserveMessage.value = data.message || '';
        }
    }

    // Add event listener to reservation form for saving data
    if (reservationForm) {
        reservationForm.addEventListener('input', saveReservationData);
    }

    // Date handling functions
    function getTomorrowDate() {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        return tomorrow.toISOString().split('T')[0];
    }

    function getNextFriday() {
        const today = new Date();
        const friday = new Date();
        friday.setDate(today.getDate() + ((5 + 7 - today.getDay()) % 7));
        if (friday <= today) {
            friday.setDate(friday.getDate() + 7);
        }
        return friday;
    }

    // Function to format date for display
    function formatDate(dateString) {
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        return new Date(dateString).toLocaleDateString('en-US', options);
    }

    // Function to submit visitor data to Google Sheets
    async function submitVisitorData(visitorData) {
        try {
            const response = await fetch('/submit_visitor', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(visitorData)
            });
            const result = await response.json();
            return result;
        } catch (error) {
            console.error('Error submitting visitor data:', error);
            return { status: 'error', message: error.message };
        }
    }

    // Function to submit reservation data to Google Sheets
    async function submitReservation(reservationData) {
        showLoading();
        try {
            const response = await fetch('/submit_reservation', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(reservationData)
            });
            const result = await response.json();
            hideLoading();
            return result;
        } catch (error) {
            hideLoading();
            console.error('Error submitting reservation:', error);
            return { status: 'error', message: error.message };
        }
    }

    // Update reservation form submission
    if (reservationForm) {
        reservationForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            const submitButton = this.querySelector('button[type="submit"]');
            showLoading(submitButton);
            
            try {
                const formData = new FormData(this);
                const reservationData = {
                    fullName: formData.get('fullName'),
                    phoneNumber: formData.get('phoneNumber'),
                    inquiryType: formData.get('inquiryType'),
                    date: formData.get('date'),
                    time: formData.get('time'),
                    numberOfPeople: formData.get('numberOfPeople'),
                    message: formData.get('message'),
                    campaign: formData.get('campaign')
                };

                // Validate that the selected date is a Friday
                const selectedDate = new Date(reservationData.date);
                if (selectedDate.getDay() !== 5) {
                    const nextFriday = getNextFriday();
                    reservationData.date = nextFriday.toISOString().split('T')[0];
                    dateInput.value = reservationData.date;
                    showDateAlert('Reservations are only available on Fridays. We\'ve automatically selected the next available Friday for you.');
                }

                saveReservationData();

                if (summaryModal) {
                    const summaryContent = document.getElementById('summaryContent');
                    if (summaryContent) {
                        summaryContent.innerHTML = `
                            <p><strong>Campaign:</strong> ${reservationData.campaign}</p>
                            <p><strong>Full Name:</strong> ${reservationData.fullName}</p>
                            <p><strong>Contact Number:</strong> ${reservationData.phoneNumber}</p>
                            <p><strong>Type of Inquiry:</strong> ${reservationData.inquiryType}</p>
                            <p><strong>Date:</strong> ${formatDate(reservationData.date)}</p>
                            <p><strong>Time:</strong> ${reservationData.time}</p>
                            <p><strong>Number of People:</strong> ${reservationData.numberOfPeople}</p>
                            ${reservationData.message ? `<p><strong>Special Requests:</strong> ${reservationData.message}</p>` : ''}
                        `;
                    }

                    // Store the reservation data for later use
                    const confirmButton = document.getElementById('confirmReservation');
                    if (confirmButton) {
                        confirmButton.dataset.reservationData = JSON.stringify(reservationData);
                    }

                    showModal(summaryModal);
                }

                // Handle confirm reservation button
                const confirmButton = document.getElementById('confirmReservation');
                if (confirmButton) {
                    confirmButton.onclick = async function() {
                        showLoading(confirmButton);
                        try {
                            const savedData = JSON.parse(this.dataset.reservationData);
                            const result = await submitReservation(savedData);
                            
                            if (result.status === 'error') {
                                showToast('Error submitting reservation: ' + result.message);
                                return;
                            }

                            hideAllModalsAndContent();
                            
                            const confirmationCode = document.getElementById('reservationCode');
                            if (confirmationCode) {
                                confirmationCode.innerHTML = `
                                    <div class="code-display">
                                        <span class="code">${result.reservationCode || 'PALUTO-' + Math.random().toString(36).substr(2, 6).toUpperCase()}</span>
                                    </div>
                                `;
                            }

                            if (confirmationModal) {
                                showModal(confirmationModal);
                            }
                        } catch (error) {
                            console.error('Reservation error:', error);
                            showToast('Failed to submit reservation. Please try again.');
                        } finally {
                            hideLoading(confirmButton);
                        }
                    };
                }
            } finally {
                hideLoading(submitButton);
            }
        });
    }

    // Handle done button in confirmation modal
    const doneButton = document.getElementById('doneButton');
    if (doneButton) {
        doneButton.addEventListener('click', function() {
            confirmationModal.style.display = 'none';
            document.body.classList.remove('modal-open');
            // Clear the reservation form
            if (reservationForm) {
                reservationForm.reset();
            }
            // Reload the page to start fresh
            window.location.href = '/';
        });
    }

    // Close modal when clicking the close button or outside the modal
    const closeButtons = document.querySelectorAll('.close-btn, .close');
    closeButtons.forEach(button => {
        button.addEventListener('click', function() {
            const modal = this.closest('.modal');
            if (modal && modal !== visitorModal) {
                hideAllModalsAndContent();
            }
        });
    });

    // Close modal when clicking outside
    window.addEventListener('click', function(event) {
        if (event.target.classList.contains('modal') && event.target !== visitorModal) {
            hideAllModalsAndContent();
        }
    });

    // Function to lock campaign selection
    function lockCampaign() {
        campaignSelect.classList.add('locked');
        campaignSelect.parentElement.classList.add('locked-campaign');
        campaignSelect.disabled = true;
        isLocked = true;
    }

    // Function to unlock campaign selection
    function unlockCampaign() {
        campaignSelect.classList.remove('locked');
        campaignSelect.parentElement.classList.remove('locked-campaign');
        campaignSelect.disabled = false;
        isLocked = false;
    }

    // Modify the part where reservation modal is shown to load saved data
    campaignCards.forEach(card => {
        card.addEventListener('click', function() {
            const campaign = this.dataset.campaign;
            
            if (campaignSelect) {
                campaignSelect.value = campaign;
                campaignSelect.dispatchEvent(new Event('change'));
                lockCampaign();
            }
            
            if (reservationModal) {
                reservationModal.style.display = 'block';
                document.body.classList.add('modal-open');

                // Auto-fill visitor info and saved reservation data
                const storedInfo = sessionStorage.getItem('visitorInfo');
                if (storedInfo) {
                    const visitorInfo = JSON.parse(storedInfo);
                    const reserveName = document.getElementById('reserveName');
                    const reservePhone = document.getElementById('reservePhone');
                    if (reserveName && reservePhone) {
                        reserveName.value = visitorInfo.fullName;
                        reservePhone.value = visitorInfo.phoneNumber;
                    }
                }
                loadReservationData();
            }

            // Set next Friday's date if Campaign 1 is selected
            if (campaign === 'Campaign 1') {
                dateInput.value = getNextFriday().toISOString().split('T')[0];
            } else if (!dateInput.value) {
                dateInput.value = getTomorrowDate();
            }
        });
    });

    // Update campaign select change handler
    if (campaignSelect) {
        campaignSelect.addEventListener('change', function() {
            if (this.value === 'Campaign 1') {
                const nextFriday = getNextFriday();
                dateInput.value = nextFriday.toISOString().split('T')[0];
                dateInput.min = nextFriday.toISOString().split('T')[0];
                showDateAlert('Reservations are only available on Fridays. We\'ve automatically selected the next available Friday for you.');
            } else {
                const tomorrow = getTomorrowDate();
                dateInput.value = tomorrow;
                dateInput.min = tomorrow;
            }
        });
    }

    // Date input change handler
    if (dateInput) {
        dateInput.addEventListener('change', function() {
            const selectedDate = new Date(this.value);
            const campaign = campaignSelect ? campaignSelect.value : null;
            
            if (campaign === 'Campaign 1' && selectedDate.getDay() !== 5) {
                const nextFriday = getNextFriday();
                this.value = nextFriday.toISOString().split('T')[0];
                showDateAlert('Reservations are only available on Fridays. We\'ve automatically selected the next available Friday for you.');
            }
        });
    }

    // Enhanced loading functions
    function showLoading(button = null) {
        if (loadingOverlay) {
            loadingOverlay.style.display = 'flex';
            loadingOverlay.style.zIndex = '10000';
            document.body.classList.add('loading');
        }
        if (button) {
            button.classList.add('loading');
            button.disabled = true;
            button.dataset.originalText = button.textContent;
            button.textContent = 'Processing...';
        }
    }

    function hideLoading(button = null) {
        if (loadingOverlay) {
            loadingOverlay.style.display = 'none';
            document.body.classList.remove('loading');
        }
        if (button) {
            button.classList.remove('loading');
            button.disabled = false;
            if (button.dataset.originalText) {
                button.textContent = button.dataset.originalText;
            }
        }
    }
}); 