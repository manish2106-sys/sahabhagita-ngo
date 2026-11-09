/* ============================================
   SAHABHAGITA — Secured Website Scripts
   Security: XSS protection, input sanitization,
   rate limiting, honeypot anti-spam, CSP-safe
   ============================================ */

(function () {
    'use strict';

    // ---- Security Utilities ----
    const Security = {
        /**
         * Sanitize a string to prevent XSS. Escapes HTML entities.
         */
        sanitize(str) {
            if (typeof str !== 'string') return '';
            const div = document.createElement('div');
            div.appendChild(document.createTextNode(str));
            return div.innerHTML;
        },

        /**
         * Validate email format (RFC 5322 simplified).
         */
        isValidEmail(email) {
            if (typeof email !== 'string' || email.length > 254) return false;
            return /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/.test(email);
        },

        /**
         * Validate phone (digits, spaces, dashes, + prefix).
         */
        isValidPhone(phone) {
            if (!phone) return true; // optional
            return /^[\+]?[0-9\s\-]{7,15}$/.test(phone);
        },

        /**
         * Validate PAN format (Indian PAN card).
         */
        isValidPAN(pan) {
            if (!pan) return true; // optional
            return /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(pan.toUpperCase());
        },

        /**
         * Validate name: letters, spaces, dots, hyphens only.
         */
        isValidName(name) {
            if (typeof name !== 'string') return false;
            return /^[A-Za-z\s.\-]{2,100}$/.test(name);
        },

        /**
         * Check honeypot field — should always be empty.
         */
        isHoneypotFilled(form) {
            const honeypots = form.querySelectorAll('input[tabindex="-1"]');
            for (const hp of honeypots) {
                if (hp.value.trim() !== '') return true;
            }
            return false;
        },

        /**
         * Rate limiter: max N submissions within a time window.
         */
        _submitTimestamps: {},
        isRateLimited(formId, maxAttempts, windowMs) {
            const now = Date.now();
            if (!this._submitTimestamps[formId]) {
                this._submitTimestamps[formId] = [];
            }
            // Prune old timestamps
            this._submitTimestamps[formId] = this._submitTimestamps[formId].filter(
                t => now - t < windowMs
            );
            if (this._submitTimestamps[formId].length >= maxAttempts) {
                return true;
            }
            this._submitTimestamps[formId].push(now);
            return false;
        }
    };

    // ---- Form Error Display ----
    function showFieldError(input, message) {
        clearFieldError(input);
        input.classList.add('input-error');
        const errorEl = document.createElement('span');
        errorEl.className = 'field-error';
        errorEl.textContent = message;
        errorEl.setAttribute('role', 'alert');
        input.parentNode.appendChild(errorEl);
    }

    function clearFieldError(input) {
        input.classList.remove('input-error');
        const existing = input.parentNode.querySelector('.field-error');
        if (existing) existing.remove();
    }

    function clearAllErrors(form) {
        form.querySelectorAll('.input-error').forEach(el => el.classList.remove('input-error'));
        form.querySelectorAll('.field-error').forEach(el => el.remove());
    }

    // ---- DOM Ready ----
    document.addEventListener('DOMContentLoaded', function () {

        // ---- Navbar Scroll Effect ----
        const navbar = document.getElementById('navbar');
        const scrollTopBtn = document.getElementById('scrollTop');

        function onScroll() {
            const scrollY = window.scrollY;
            if (scrollY > 60) {
                navbar.classList.add('scrolled');
            } else {
                navbar.classList.remove('scrolled');
            }
            if (scrollY > 500) {
                scrollTopBtn.classList.add('visible');
            } else {
                scrollTopBtn.classList.remove('visible');
            }
        }
        window.addEventListener('scroll', onScroll, { passive: true });

        scrollTopBtn.addEventListener('click', function () {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });

        // ---- Mobile Navigation ----
        const navToggle = document.getElementById('navToggle');
        const navLinks = document.getElementById('navLinks');

        navToggle.addEventListener('click', function () {
            const isOpen = navLinks.classList.toggle('active');
            navToggle.setAttribute('aria-expanded', isOpen);
            const spans = navToggle.querySelectorAll('span');
            if (isOpen) {
                spans[0].style.transform = 'rotate(45deg) translate(5px, 5px)';
                spans[1].style.opacity = '0';
                spans[2].style.transform = 'rotate(-45deg) translate(5px, -5px)';
            } else {
                spans[0].style.transform = 'none';
                spans[1].style.opacity = '1';
                spans[2].style.transform = 'none';
            }
        });

        // Close mobile nav on link click
        navLinks.querySelectorAll('a').forEach(function (link) {
            link.addEventListener('click', function () {
                navLinks.classList.remove('active');
                navToggle.setAttribute('aria-expanded', 'false');
                var spans = navToggle.querySelectorAll('span');
                spans[0].style.transform = 'none';
                spans[1].style.opacity = '1';
                spans[2].style.transform = 'none';
            });
        });

        // ---- Counter Animation ----
        var counters = document.querySelectorAll('.stat-number');
        var countersAnimated = false;

        function animateCounters() {
            counters.forEach(function (counter) {
                var target = parseInt(counter.getAttribute('data-target'), 10);
                if (isNaN(target) || target < 0) return;
                var duration = 2000;
                var startTime = performance.now();

                function updateCounter(currentTime) {
                    var elapsed = currentTime - startTime;
                    var progress = Math.min(elapsed / duration, 1);
                    var eased = 1 - Math.pow(1 - progress, 3);
                    var current = Math.round(eased * target);
                    counter.textContent = current.toLocaleString('en-IN');
                    if (progress < 1) {
                        requestAnimationFrame(updateCounter);
                    }
                }
                requestAnimationFrame(updateCounter);
            });
        }

        var heroStats = document.querySelector('.hero-stats');
        if (heroStats) {
            var statsObserver = new IntersectionObserver(function (entries) {
                entries.forEach(function (entry) {
                    if (entry.isIntersecting && !countersAnimated) {
                        countersAnimated = true;
                        animateCounters();
                    }
                });
            }, { threshold: 0.5 });
            statsObserver.observe(heroStats);
        }

        // ---- Fade In Animation ----
        var fadeElements = document.querySelectorAll(
            '.mission-card, .about-grid, .flagship-program, .curriculum-path, .program-card, ' +
            '.impact-card, .partner-item, .donate-wrapper, .contact-grid'
        );
        fadeElements.forEach(function (el) { el.classList.add('fade-in'); });

        var fadeObserver = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                    fadeObserver.unobserve(entry.target);
                }
            });
        }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });
        fadeElements.forEach(function (el) { fadeObserver.observe(el); });

        // ---- Donation Amount Buttons ----
        var amountBtns = document.querySelectorAll('.amount-btn');
        var customAmountInput = document.getElementById('customAmount');

        amountBtns.forEach(function (btn) {
            btn.addEventListener('click', function () {
                amountBtns.forEach(function (b) {
                    b.classList.remove('active');
                    b.setAttribute('aria-pressed', 'false');
                });
                btn.classList.add('active');
                btn.setAttribute('aria-pressed', 'true');
                if (customAmountInput) customAmountInput.value = '';
            });
        });

        if (customAmountInput) {
            customAmountInput.addEventListener('input', function () {
                if (customAmountInput.value) {
                    amountBtns.forEach(function (b) {
                        b.classList.remove('active');
                        b.setAttribute('aria-pressed', 'false');
                    });
                }
            });
        }

        // ---- Donate Form (with full validation) ----
        var donateForm = document.getElementById('donateForm');
        if (donateForm) {
            donateForm.addEventListener('submit', function (e) {
                e.preventDefault();
                clearAllErrors(donateForm);

                // Rate limit: max 3 submissions per 60 seconds
                if (Security.isRateLimited('donate', 3, 60000)) {
                    showModal('Please wait a moment before trying again. Too many submissions.');
                    return;
                }

                // Honeypot check
                if (Security.isHoneypotFilled(donateForm)) {
                    // Silently fail for bots
                    showModal('Thank you for your generous contribution!');
                    donateForm.reset();
                    return;
                }

                // Validate amount
                var activeBtn = document.querySelector('.amount-btn.active');
                var amountVal = customAmountInput ? customAmountInput.value.trim() : '';
                var amount = amountVal || (activeBtn ? activeBtn.dataset.amount : '');

                if (!amount || isNaN(parseInt(amount, 10)) || parseInt(amount, 10) < 100) {
                    if (customAmountInput) showFieldError(customAmountInput, 'Please select or enter an amount (minimum ₹100).');
                    return;
                }
                if (parseInt(amount, 10) > 10000000) {
                    if (customAmountInput) showFieldError(customAmountInput, 'Amount exceeds maximum limit.');
                    return;
                }

                // Validate name
                var nameInput = document.getElementById('donorName');
                var nameVal = nameInput.value.trim();
                if (!Security.isValidName(nameVal)) {
                    showFieldError(nameInput, 'Please enter a valid name (letters, spaces, dots only).');
                    nameInput.focus();
                    return;
                }

                // Validate email
                var emailInput = document.getElementById('donorEmail');
                var emailVal = emailInput.value.trim();
                if (!Security.isValidEmail(emailVal)) {
                    showFieldError(emailInput, 'Please enter a valid email address.');
                    emailInput.focus();
                    return;
                }

                // Validate phone (optional)
                var phoneInput = document.getElementById('donorPhone');
                var phoneVal = phoneInput.value.trim();
                if (!Security.isValidPhone(phoneVal)) {
                    showFieldError(phoneInput, 'Please enter a valid phone number.');
                    phoneInput.focus();
                    return;
                }

                // Validate PAN (optional)
                var panInput = document.getElementById('donorPan');
                var panVal = panInput.value.trim();
                if (!Security.isValidPAN(panVal)) {
                    showFieldError(panInput, 'Please enter a valid PAN (e.g., ABCDE1234F).');
                    panInput.focus();
                    return;
                }

                // All valid — show confirmation with sanitized data
                var sanitizedAmount = Security.sanitize(parseInt(amount, 10).toLocaleString('en-IN'));
                showModal('Thank you for your generous donation of \u20B9' + sanitizedAmount + '! We will send your 80G tax receipt to your email address shortly.');
                donateForm.reset();
                // Re-set default active button
                amountBtns.forEach(function (b) { b.classList.remove('active'); b.setAttribute('aria-pressed', 'false'); });
                amountBtns[2].classList.add('active');
                amountBtns[2].setAttribute('aria-pressed', 'true');
            });
        }

        // ---- Contact Form (with full validation) ----
        var contactForm = document.getElementById('contactForm');
        if (contactForm) {
            contactForm.addEventListener('submit', function (e) {
                e.preventDefault();
                clearAllErrors(contactForm);

                // Rate limit: max 3 submissions per 60 seconds
                if (Security.isRateLimited('contact', 3, 60000)) {
                    showModal('Please wait a moment before trying again. Too many submissions.');
                    return;
                }

                // Honeypot check
                if (Security.isHoneypotFilled(contactForm)) {
                    showModal('Your message has been received!');
                    contactForm.reset();
                    return;
                }

                // Validate name
                var cNameInput = document.getElementById('contactName');
                var cNameVal = cNameInput.value.trim();
                if (!Security.isValidName(cNameVal)) {
                    showFieldError(cNameInput, 'Please enter a valid name.');
                    cNameInput.focus();
                    return;
                }

                // Validate email
                var cEmailInput = document.getElementById('contactEmail');
                var cEmailVal = cEmailInput.value.trim();
                if (!Security.isValidEmail(cEmailVal)) {
                    showFieldError(cEmailInput, 'Please enter a valid email address.');
                    cEmailInput.focus();
                    return;
                }

                // Validate message
                var cMsgInput = document.getElementById('contactMessage');
                var cMsgVal = cMsgInput.value.trim();
                if (cMsgVal.length < 10) {
                    showFieldError(cMsgInput, 'Please enter at least 10 characters.');
                    cMsgInput.focus();
                    return;
                }
                if (cMsgVal.length > 2000) {
                    showFieldError(cMsgInput, 'Message is too long (max 2000 characters).');
                    cMsgInput.focus();
                    return;
                }

                // Check for suspicious patterns (script injection attempts)
                var suspiciousPatterns = /<script|javascript:|on\w+\s*=|<iframe|<object|<embed/i;
                if (suspiciousPatterns.test(cMsgVal) || suspiciousPatterns.test(cNameVal)) {
                    showModal('Invalid input detected. Please remove special characters and try again.');
                    return;
                }

                showModal('Your message has been received. Our team will get back to you within 24\u201348 hours. Thank you for reaching out!');
                contactForm.reset();
            });
        }

        // ---- Real-time field validation on blur ----
        document.querySelectorAll('input[required], textarea[required]').forEach(function (input) {
            input.addEventListener('blur', function () {
                if (!input.value.trim()) {
                    showFieldError(input, 'This field is required.');
                } else {
                    clearFieldError(input);
                }
            });
            input.addEventListener('input', function () {
                clearFieldError(input);
            });
        });

        // ---- Active Nav Link Highlight ----
        var sections = document.querySelectorAll('section[id]');
        window.addEventListener('scroll', function () {
            var scrollY = window.scrollY + 120;
            sections.forEach(function (section) {
                var top = section.offsetTop;
                var height = section.offsetHeight;
                var id = section.getAttribute('id');
                var link = document.querySelector('.nav-links a[href="#' + id + '"]');
                if (link) {
                    if (scrollY >= top && scrollY < top + height) {
                        link.style.color = '#fff';
                        link.style.fontWeight = '600';
                    } else {
                        link.style.color = '';
                        link.style.fontWeight = '';
                    }
                }
            });
        }, { passive: true });

    }); // end DOMContentLoaded

    // ---- Modal Functions (CSP-safe: no inline handlers) ----
    function showModal(message) {
        var modal = document.getElementById('successModal');
        var modalMessage = document.getElementById('modalMessage');
        // Use textContent to prevent XSS — never innerHTML with user data
        modalMessage.textContent = message;
        modal.classList.add('active');
        modal.setAttribute('aria-hidden', 'false');
        document.getElementById('modalCloseBtn').focus();
    }

    function closeModal() {
        var modal = document.getElementById('successModal');
        modal.classList.remove('active');
        modal.setAttribute('aria-hidden', 'true');
    }

    // Expose for DOM (CSP-safe event listeners)
    document.addEventListener('DOMContentLoaded', function () {
        var closeBtn = document.getElementById('modalCloseBtn');
        if (closeBtn) {
            closeBtn.addEventListener('click', closeModal);
        }
    });

    // Close modal on overlay click
    document.addEventListener('click', function (e) {
        if (e.target.classList.contains('modal-overlay')) {
            closeModal();
        }
    });

    // Close modal on Escape key
    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') closeModal();
    });

    // Make showModal available globally for internal use only
    window._showModal = showModal;

})();
