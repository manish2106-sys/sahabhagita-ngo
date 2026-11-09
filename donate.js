/* ===================================================
   DONATE ACTIVE INTERACTION CONTROLLER
   - Real-time dynamic UPI QR generator (NPCI spec)
   - One-touch mobile UPI app launching
   - Clipboard copying with feedback
   - Tier switching and custom amount handling
   - Instant 80G Tax Exemption Certificate Generator
   =================================================== */

(function () {
    'use strict';

    // State
    const state = {
        amount: 7000,
        frequency: 'one-time',
        upiVpa: 'Sahbhagita_ngo@rediffmail.com',
        orgName: 'Sahabhagita Shahri Gramin Vikas Samiti',
        note: 'Donation Pratham Pratibha'
    };

    let qrcodeInstance = null;

    // Helper: Number to Words in Indian numbering
    function numberToWordsINR(num) {
        const a = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
            'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
        const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

        function convert(n) {
            if (n < 20) return a[n];
            if (n < 100) return b[Math.floor(n / 10)] + (n % 10 !== 0 ? ' ' + a[n % 10] : '');
            if (n < 1000) return a[Math.floor(n / 100)] + ' Hundred' + (n % 100 !== 0 ? ' ' + convert(n % 100) : '');
            if (n < 100000) return convert(Math.floor(n / 1000)) + ' Thousand' + (n % 1000 !== 0 ? ' ' + convert(n % 1000) : '');
            if (n < 10000000) return convert(Math.floor(n / 100000)) + ' Lakh' + (n % 100000 !== 0 ? ' ' + convert(n % 100000) : '');
            return convert(Math.floor(n / 10000000)) + ' Crore' + (n % 10000000 !== 0 ? ' ' + convert(n % 10000000) : '');
        }

        const parsed = parseInt(num, 10);
        if (isNaN(parsed) || parsed <= 0) return 'Zero Rupees Only';
        return convert(parsed) + ' Rupees Only';
    }

    // Generate UPI URL
    function getUpiUrl(amount) {
        const amtStr = encodeURIComponent(amount.toString());
        const pnStr = encodeURIComponent(state.orgName);
        const tnStr = encodeURIComponent(state.note);
        return `upi://pay?pa=${state.upiVpa}&pn=${pnStr}&am=${amtStr}&cu=INR&tn=${tnStr}`;
    }

    // Update QR Code and Mobile UPI Link
    function updatePaymentElements() {
        const upiUrl = getUpiUrl(state.amount);

        // Update displayed amount text
        const qrAmountDisplay = document.getElementById('qrAmountDisplay');
        if (qrAmountDisplay) {
            qrAmountDisplay.textContent = '₹' + parseInt(state.amount, 10).toLocaleString('en-IN');
        }

        // Update mobile deep link
        const directUpiAppBtn = document.getElementById('directUpiAppBtn');
        if (directUpiAppBtn) {
            directUpiAppBtn.setAttribute('href', upiUrl);
        }

        // Update QR Code
        const qrContainer = document.getElementById('qrcode');
        if (qrContainer && typeof QRCode !== 'undefined') {
            qrContainer.innerHTML = '';
            qrcodeInstance = new QRCode(qrContainer, {
                text: upiUrl,
                width: 180,
                height: 180,
                colorDark: '#0F2640',
                colorLight: '#FFFFFF',
                correctLevel: QRCode.CorrectLevel.M
            });
        }
    }

    // Copy to clipboard helper
    function copyText(text, btnElement) {
        if (!navigator.clipboard) {
            const textarea = document.createElement('textarea');
            textarea.value = text;
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand('copy');
            document.body.removeChild(textarea);
        } else {
            navigator.clipboard.writeText(text);
        }

        const originalText = btnElement.innerHTML;
        btnElement.innerHTML = '<i class="fas fa-check"></i> Copied!';
        btnElement.style.background = '#059669';
        btnElement.style.color = '#fff';
        setTimeout(() => {
            btnElement.innerHTML = originalText;
            btnElement.style.background = '';
            btnElement.style.color = '';
        }, 2000);
    }

    document.addEventListener('DOMContentLoaded', function () {

        // Check for URL parameters (?amount=)
        try {
            const urlParams = new URLSearchParams(window.location.search);
            const amtParam = parseInt(urlParams.get('amount'), 10);
            if (!isNaN(amtParam) && amtParam >= 100) {
                state.amount = amtParam;
                // Highlight matching tier or set custom amount
                const matchingTier = document.querySelector(`.tier-card[data-amount="${amtParam}"]`);
                const allTiers = document.querySelectorAll('.tier-card');
                if (matchingTier) {
                    allTiers.forEach(t => {
                        t.classList.remove('active');
                        t.setAttribute('aria-checked', 'false');
                    });
                    matchingTier.classList.add('active');
                    matchingTier.setAttribute('aria-checked', 'true');
                } else {
                    allTiers.forEach(t => {
                        t.classList.remove('active');
                        t.setAttribute('aria-checked', 'false');
                    });
                    const customInp = document.getElementById('activeCustomAmount');
                    if (customInp) customInp.value = amtParam;
                }
            }
        } catch (e) {
            console.error('URL parse error', e);
        }

        // Initialize QR
        updatePaymentElements();

        // 1. Frequency Buttons
        const freqButtons = document.querySelectorAll('.freq-btn');
        freqButtons.forEach(btn => {
            btn.addEventListener('click', function () {
                freqButtons.forEach(b => {
                    b.classList.remove('active');
                    b.setAttribute('aria-pressed', 'false');
                });
                btn.classList.add('active');
                btn.setAttribute('aria-pressed', 'true');
                state.frequency = btn.dataset.freq;
                
                if (state.frequency === 'csr') {
                    // Automatically switch to CSR tab
                    const csrTabBtn = document.querySelector('[data-tab="tab-csr"]');
                    if (csrTabBtn) csrTabBtn.click();
                }
            });
        });

        // 2. Donation Tiers
        const tierCards = document.querySelectorAll('.tier-card');
        const customInput = document.getElementById('activeCustomAmount');

        tierCards.forEach(card => {
            card.addEventListener('click', function () {
                tierCards.forEach(c => {
                    c.classList.remove('active');
                    c.setAttribute('aria-checked', 'false');
                });
                card.classList.add('active');
                card.setAttribute('aria-checked', 'true');
                if (customInput) customInput.value = '';
                state.amount = parseInt(card.dataset.amount, 10);
                updatePaymentElements();
            });

            // Keyboard navigation
            card.addEventListener('keydown', function (e) {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    card.click();
                }
            });
        });

        // Custom amount input
        if (customInput) {
            customInput.addEventListener('input', function () {
                const val = parseInt(customInput.value, 10);
                if (!isNaN(val) && val >= 100) {
                    tierCards.forEach(c => {
                        c.classList.remove('active');
                        c.setAttribute('aria-checked', 'false');
                    });
                    state.amount = val;
                    updatePaymentElements();
                }
            });
        }

        // 3. Payment Method Tabs
        const tabBtns = document.querySelectorAll('.tab-btn');
        const tabContents = document.querySelectorAll('.tab-content');

        tabBtns.forEach(btn => {
            btn.addEventListener('click', function () {
                tabBtns.forEach(b => {
                    b.classList.remove('active');
                    b.setAttribute('aria-selected', 'false');
                });
                tabContents.forEach(c => c.classList.remove('active'));

                btn.classList.add('active');
                btn.setAttribute('aria-selected', 'true');

                const targetTab = document.getElementById(btn.dataset.tab);
                if (targetTab) {
                    targetTab.classList.add('active');
                }
            });
        });

        // 4. Copy UPI ID
        const copyUpiBtn = document.getElementById('copyUpiBtn');
        if (copyUpiBtn) {
            copyUpiBtn.addEventListener('click', function () {
                copyText(state.upiVpa, copyUpiBtn);
            });
        }

        // Copy Bank Details buttons
        const copySmallBtns = document.querySelectorAll('.btn-copy-small');
        copySmallBtns.forEach(btn => {
            btn.addEventListener('click', function () {
                const text = btn.getAttribute('data-copy');
                copyText(text, btn);
            });
        });

        // 5. Official 80G Receipt Generator
        const receiptForm = document.getElementById('receiptGeneratorForm');
        const receiptModal = document.getElementById('receiptModal');
        const closeReceiptBtn = document.getElementById('closeReceiptBtn');
        const printReceiptBtn = document.getElementById('printReceiptBtn');

        if (receiptForm) {
            receiptForm.addEventListener('submit', function (e) {
                e.preventDefault();

                // Honeypot check
                const trap = document.getElementById('check_trap');
                if (trap && trap.value.trim() !== '') return;

                const name = document.getElementById('donorFullName').value.trim();
                const pan = document.getElementById('donorPanNumber').value.trim().toUpperCase();
                const email = document.getElementById('donorEmailAddr').value.trim();
                const phone = document.getElementById('donorPhoneNum').value.trim();
                const utr = document.getElementById('donorTransactionRef').value.trim();
                const address = document.getElementById('donorPostalAddress').value.trim();

                // Validation
                if (!name || name.length < 2) {
                    alert('Please enter your full legal name.');
                    return;
                }
                if (!/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(pan)) {
                    alert('Please enter a valid 10-digit PAN card number (e.g., ABCDE1234F).');
                    return;
                }
                if (!email || !email.includes('@')) {
                    alert('Please enter a valid email address.');
                    return;
                }
                if (!utr) {
                    alert('Please enter the transaction reference / UTR number.');
                    return;
                }
                if (!address) {
                    alert('Please enter your full postal address for tax documentation.');
                    return;
                }

                // Populate Receipt Document
                document.getElementById('r_donorName').textContent = name;
                document.getElementById('r_donorPan').textContent = pan;
                document.getElementById('r_donorAddress').textContent = address;
                document.getElementById('r_donorEmail').textContent = email;
                document.getElementById('r_donorPhone').textContent = phone;
                document.getElementById('r_donorUtr').textContent = utr;

                const amtFormatted = parseInt(state.amount, 10).toLocaleString('en-IN');
                document.getElementById('r_donorAmount').textContent = amtFormatted;
                document.getElementById('r_donorAmountWords').textContent = numberToWordsINR(state.amount);

                // Date & Receipt number
                const today = new Date();
                const dateStr = today.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
                const receiptNum = 'SHB-' + today.getFullYear() + '-' + Math.floor(1000 + Math.random() * 9000);

                document.getElementById('r_receiptDate').textContent = dateStr;
                document.getElementById('r_receiptNumber').textContent = receiptNum;

                // Open Modal
                receiptModal.classList.add('active');
                receiptModal.setAttribute('aria-hidden', 'false');
            });
        }

        // Close Receipt Modal
        if (closeReceiptBtn) {
            closeReceiptBtn.addEventListener('click', function () {
                receiptModal.classList.remove('active');
                receiptModal.setAttribute('aria-hidden', 'true');
            });
        }

        // Print Receipt
        if (printReceiptBtn) {
            printReceiptBtn.addEventListener('click', function () {
                window.print();
            });
        }

        // Close on overlay click
        if (receiptModal) {
            receiptModal.addEventListener('click', function (e) {
                if (e.target === receiptModal) {
                    receiptModal.classList.remove('active');
                    receiptModal.setAttribute('aria-hidden', 'true');
                }
            });
        }

        // Close on Escape key
        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape' && receiptModal && receiptModal.classList.contains('active')) {
                receiptModal.classList.remove('active');
                receiptModal.setAttribute('aria-hidden', 'true');
            }
        });

        // Mobile Nav Toggle
        const navToggle = document.getElementById('navToggle');
        const navLinks = document.getElementById('navLinks');
        if (navToggle && navLinks) {
            navToggle.addEventListener('click', function () {
                const isOpen = navLinks.classList.toggle('active');
                navToggle.setAttribute('aria-expanded', isOpen);
            });
        }

    });

})();
