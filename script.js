// Mobile Menu Toggle
document.addEventListener('DOMContentLoaded', function () {
    const mobileMenuToggle = document.getElementById('mobileMenuToggle');
    const navMenu = document.getElementById('navMenu');

    if (mobileMenuToggle && navMenu) {
        mobileMenuToggle.setAttribute('aria-expanded', 'false');

        mobileMenuToggle.addEventListener('click', function () {
            navMenu.classList.toggle('active');
            mobileMenuToggle.setAttribute('aria-expanded', navMenu.classList.contains('active') ? 'true' : 'false');
        });

        document.addEventListener('click', function (e) {
            if (!navMenu.classList.contains('active')) return;
            if (navMenu.contains(e.target) || mobileMenuToggle.contains(e.target)) return;

            navMenu.classList.remove('active');
            mobileMenuToggle.setAttribute('aria-expanded', 'false');
        });

        window.addEventListener('resize', function () {
            if (window.innerWidth > 768 && navMenu.classList.contains('active')) {
                navMenu.classList.remove('active');
                mobileMenuToggle.setAttribute('aria-expanded', 'false');
            }
        });
    }

    // Notification Carousel
    const notifications = [
        "Paper Submission Deadline for Conference 2026 is now extended to 28 February. Please go to submission guidelines for more Information. Click Submit Paper for directly submitting your paper",
        "Springer CCIS Registration is now closed, if a paper accepted for Springer CCIS and is registered after 10 February, will be automatically transferred to AIP. Only AIP regular registration is open from 11 February",
        "Regular registrations for the conference are now open only for AIP from 11 February 2026 to the last date (to be announced)",
        "Conference 2026 papers will be published in AIP Conference Proceedings and Springer CCIS – Scopus and WoS Indexed"
    ];

    let currentNotification = 0;
    const notificationText = document.getElementById('notificationText');
    const prevBtn = document.getElementById('prevNotification');
    const nextBtn = document.getElementById('nextNotification');

    function updateNotification() {
        if (notificationText) {
            notificationText.textContent = notifications[currentNotification];
        }
    }

    if (prevBtn) {
        prevBtn.addEventListener('click', function () {
            currentNotification = (currentNotification - 1 + notifications.length) % notifications.length;
            updateNotification();
        });
    }

    if (nextBtn) {
        nextBtn.addEventListener('click', function () {
            currentNotification = (currentNotification + 1) % notifications.length;
            updateNotification();
        });
    }

    // Smooth scrolling for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
                // Close mobile menu if open
                if (navMenu && navMenu.classList.contains('active')) {
                    navMenu.classList.remove('active');
                    if (mobileMenuToggle) {
                        mobileMenuToggle.setAttribute('aria-expanded', 'false');
                    }
                }
            }
        });
    });

    // Active navigation link on scroll
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('.nav-menu a[href^="#"]');

    function updateActiveNav() {
        let current = '';
        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.clientHeight;
            if (window.pageYOffset >= sectionTop - 200) {
                current = section.getAttribute('id');
            }
        });

        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === `#${current}`) {
                link.classList.add('active');
            }
        });
    }

    window.addEventListener('scroll', updateActiveNav);
    updateActiveNav();

    // Flags Horizontal Scrolling
    const flagsContainer = document.getElementById('flagsContainer');
    const scrollLeftBtn = document.getElementById('scrollLeft');
    const scrollRightBtn = document.getElementById('scrollRight');

    if (flagsContainer && scrollLeftBtn && scrollRightBtn) {
        const scrollAmount = 300; // pixels to scroll per click

        // Arrow button scrolling
        scrollLeftBtn.addEventListener('click', function () {
            flagsContainer.scrollBy({
                left: -scrollAmount,
                behavior: 'smooth'
            });
        });

        scrollRightBtn.addEventListener('click', function () {
            flagsContainer.scrollBy({
                left: scrollAmount,
                behavior: 'smooth'
            });
        });

        // Mouse wheel horizontal scrolling
        flagsContainer.addEventListener('wheel', function (e) {
            if (e.deltaY !== 0) {
                e.preventDefault();
                flagsContainer.scrollLeft += e.deltaY;
            }
        }, { passive: false });

        // Update arrow button visibility based on scroll position
        function updateArrowButtons() {
            const { scrollLeft, scrollWidth, clientWidth } = flagsContainer;

            // Show/hide left arrow
            if (scrollLeft <= 0) {
                scrollLeftBtn.style.opacity = '0.5';
                scrollLeftBtn.style.pointerEvents = 'none';
            } else {
                scrollLeftBtn.style.opacity = '1';
                scrollLeftBtn.style.pointerEvents = 'auto';
            }

            // Show/hide right arrow
            if (scrollLeft >= scrollWidth - clientWidth - 10) {
                scrollRightBtn.style.opacity = '0.5';
                scrollRightBtn.style.pointerEvents = 'none';
            } else {
                scrollRightBtn.style.opacity = '1';
                scrollRightBtn.style.pointerEvents = 'auto';
            }
        }

        // Initial check
        updateArrowButtons();

        // Update on scroll
        flagsContainer.addEventListener('scroll', updateArrowButtons);

        // Update on resize
        window.addEventListener('resize', updateArrowButtons);
    }

    // Hero Background Image Slider
    const heroSlides = document.querySelectorAll('.hero-slide');
    let currentSlide = 0;
    const slideInterval = 3000; // 3 seconds loop for smooth viewing

    function nextSlide() {
        if (heroSlides.length === 0) return;

        // Remove exit class from all slides so they snap to the right
        heroSlides.forEach(slide => slide.classList.remove('exit'));

        // Current active becomes exit
        heroSlides[currentSlide].classList.remove('active');
        heroSlides[currentSlide].classList.add('exit');

        // Move to next slide
        currentSlide = (currentSlide + 1) % heroSlides.length;

        // Add active class to new slide
        heroSlides[currentSlide].classList.add('active');
    }

    // Start the slider if slides exist
    if (heroSlides.length > 0) {
        setInterval(nextSlide, slideInterval);
    }

    // Vertical Tracks Tabs in CFP
    const trackTabs = document.querySelectorAll('.track-v-tab');
    const trackPanels = document.querySelectorAll('.track-v-panel');

    if (trackTabs.length > 0 && trackPanels.length > 0) {
        trackTabs.forEach(tab => {
            // Click to switch tabs
            tab.addEventListener('click', function () {
                trackTabs.forEach(t => t.classList.remove('active'));
                trackPanels.forEach(p => p.classList.remove('active'));

                this.classList.add('active');

                const targetId = this.getAttribute('data-target');
                const targetPanel = document.getElementById(targetId);
                if (targetPanel) {
                    targetPanel.classList.add('active');
                }
            });
        });
    }

    // Registration Policy Tabs
    const policyTabs = document.querySelectorAll('.policy-tab');
    const policyContents = document.querySelectorAll('.policy-content');

    if (policyTabs.length > 0 && policyContents.length > 0) {
        policyTabs.forEach(tab => {
            tab.addEventListener('click', function () {
                // Remove active class from all tabs and contents
                policyTabs.forEach(t => t.classList.remove('active'));
                policyContents.forEach(c => c.classList.remove('active'));

                // Add active class to clicked tab
                this.classList.add('active');

                // Show corresponding content
                const targetId = this.getAttribute('data-target');
                const targetContent = document.getElementById(targetId);
                if (targetContent) {
                    targetContent.classList.add('active');
                }
            });
        });
    }

    // Contact Form Submission
    const contactForm = document.getElementById('contactForm');
    const contactFormResult = document.getElementById('contactFormResult');

    if (contactForm) {
        contactForm.addEventListener('submit', async function (e) {
            e.preventDefault();
            const btn = contactForm.querySelector('.btn-submit');
            const originalText = btn.textContent;
            btn.textContent = 'Sending...';
            btn.disabled = true;
            contactFormResult.className = 'form-result';
            contactFormResult.textContent = '';

            const formData = {
                name: document.getElementById('name').value,
                email: document.getElementById('email').value,
                subject: document.getElementById('subject').value,
                message: document.getElementById('message').value
            };

            try {
                const response = await fetch('/api/contact', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(formData)
                });
                const result = await response.json();

                if (response.ok && result.success) {
                    contactFormResult.textContent = result.message;
                    contactFormResult.classList.add('success');
                    contactForm.reset();
                } else {
                    throw new Error(result.message || 'Error sending message');
                }
            } catch (error) {
                contactFormResult.textContent = error.message;
                contactFormResult.classList.add('error');
            } finally {
                btn.textContent = originalText;
                btn.disabled = false;
            }
        });
    }

    // Registration Form Submission
    const registrationForm = document.getElementById('registrationForm');
    const regFormResult = document.getElementById('regFormResult');

    if (registrationForm) {
        registrationForm.addEventListener('submit', async function (e) {
            e.preventDefault();
            const btn = registrationForm.querySelector('.btn-submit');
            const originalText = btn.textContent;
            btn.textContent = 'Processing...';
            btn.disabled = true;
            regFormResult.className = 'form-result';
            regFormResult.textContent = '';

            const formData = {
                fullName: document.getElementById('regName').value,
                email: document.getElementById('regEmail').value,
                phone: document.getElementById('regPhone').value,
                country: document.getElementById('regCountry').value,
                category: document.getElementById('regCategory').value,
                type: document.getElementById('regType').value,
                amount: document.getElementById('regAmount').value,
                paymentId: document.getElementById('regTxnId').value
            };

            try {
                const response = await fetch('/api/register', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(formData)
                });
                const result = await response.json();

                if (response.ok && result.success) {
                    regFormResult.textContent = result.message;
                    regFormResult.classList.add('success');
                    registrationForm.reset();
                } else {
                    throw new Error(result.message || 'Registration failed');
                }
            } catch (error) {
                regFormResult.textContent = error.message;
                regFormResult.classList.add('error');
            } finally {
                btn.textContent = originalText;
                btn.disabled = false;
            }
        });
    }
});
