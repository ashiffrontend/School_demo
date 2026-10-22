/* ==========================================================================
   Bright Future Public School | script.js
   Vanilla JavaScript, no libraries. Loaded with `defer`, so the DOM is ready.

   Features
   1.  Helpers
   2.  Sticky header + scroll-to-top button
   3.  Mobile navigation toggle
   4.  Smooth scrolling for in-page links
   5.  Active navigation highlighting
   6.  Testimonial slider
   7.  Gallery lightbox
   8.  "Apply Now" pre-selects the enquiry type
   9.  Contact form validation (frontend only)
   10. Footer year
   ========================================================================== */

(function () {
  'use strict';

  /* 1. Helpers ----------------------------------------------------------- */
  const $ = (selector, scope = document) => scope.querySelector(selector);
  const $$ = (selector, scope = document) => Array.from(scope.querySelectorAll(selector));

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const header = $('#site-header');
  const nav = $('#site-nav');
  const navToggle = $('#nav-toggle');
  const scrollTopBtn = $('#scroll-top');

  /* 2. Sticky header + scroll-to-top button ------------------------------ */
  // The header is sticky in CSS. Here we only add a shadow once the page has
  // scrolled, and show the scroll-to-top button after a while.
  let scrollTicking = false;

  function onScroll() {
    const y = window.scrollY;
    header.classList.toggle('scrolled', y > 10);
    scrollTopBtn.classList.toggle('visible', y > 500);
    updateActiveNav();
    scrollTicking = false;
  }

  // requestAnimationFrame keeps the scroll handler cheap (runs once per frame)
  window.addEventListener('scroll', () => {
    if (!scrollTicking) {
      window.requestAnimationFrame(onScroll);
      scrollTicking = true;
    }
  }, { passive: true });

  scrollTopBtn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
  });

  /* 3. Mobile navigation toggle ------------------------------------------ */
  function setNavOpen(open) {
    header.classList.toggle('nav-open', open);
    navToggle.setAttribute('aria-expanded', String(open));
    navToggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  }

  navToggle.addEventListener('click', () => {
    setNavOpen(!header.classList.contains('nav-open'));
  });

  // Close the menu with the Escape key (and return focus to the button)
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && header.classList.contains('nav-open')) {
      setNavOpen(false);
      navToggle.focus();
    }
  });

  // Close the menu when tapping anywhere outside the header
  document.addEventListener('click', (event) => {
    if (header.classList.contains('nav-open') && !header.contains(event.target)) {
      setNavOpen(false);
    }
  });

  // Reset the menu when the screen grows to desktop width
  window.matchMedia('(min-width: 1024px)').addEventListener('change', (event) => {
    if (event.matches) setNavOpen(false);
  });

  /* 4. Smooth scrolling for in-page links -------------------------------- */
  // CSS handles the sticky-header offset (scroll-margin-top). JS adds smooth
  // scrolling, closes the mobile menu and moves keyboard focus to the section.
  $$('a[href^="#"]').forEach((link) => {
    link.addEventListener('click', (event) => {
      const hash = link.getAttribute('href');
      if (hash.length < 2) return;

      const target = document.getElementById(hash.slice(1));
      if (!target) return;

      event.preventDefault();
      setNavOpen(false);
      target.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });

      // Update the address bar. Wrapped in try/catch because some browsers
      // block this when the page is opened directly from disk (file://).
      try {
        history.replaceState(null, '', hash);
      } catch (error) { /* safe to ignore */ }

      // Keyboard and screen-reader users land on the section they chose
      target.setAttribute('tabindex', '-1');
      target.focus({ preventScroll: true });
    });
  });

  /* 5. Active navigation highlighting ------------------------------------ */
  const navLinks = $$('.nav-link');
  const trackedSections = $$('main > section[id]');

  function setActiveNav(key) {
    navLinks.forEach((link) => {
      const isActive = link.getAttribute('href') === '#' + key;
      link.classList.toggle('active', isActive);
      if (isActive) {
        link.setAttribute('aria-current', 'true');
      } else {
        link.removeAttribute('aria-current');
      }
    });
  }

  function updateActiveNav() {
    // Reading line sits a little below the sticky header
    const line = header.offsetHeight + 120;
    let current = trackedSections[0];

    trackedSections.forEach((section) => {
      if (section.getBoundingClientRect().top <= line) current = section;
    });

    // At the very bottom of the page, highlight the last section
    const atBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4;
    if (atBottom) current = trackedSections[trackedSections.length - 1];

    // Sections without their own menu link (e.g. "Why us") use data-nav
    setActiveNav(current.dataset.nav || current.id);
  }

  /* 6. Testimonial slider ------------------------------------------------ */
  const slider = $('#testimonial-slider');

  if (slider) {
    const track = $('#slider-track', slider);
    const slides = $$('.slide', slider);
    const dotsWrap = $('#slider-dots', slider);
    const prevBtn = $('#slider-prev', slider);
    const nextBtn = $('#slider-next', slider);
    const AUTOPLAY_MS = 7000;

    let index = 0;
    let timer = null;

    // Build one dot button per slide
    const dots = slides.map((slide, i) => {
      const dot = document.createElement('button');
      dot.type = 'button';
      dot.className = 'dot';
      dot.setAttribute('aria-label', 'Show testimonial ' + (i + 1));
      dot.addEventListener('click', () => { goTo(i); restartAutoplay(); });
      dotsWrap.appendChild(dot);
      return dot;
    });

    function goTo(i) {
      index = (i + slides.length) % slides.length;     // wraps around both ways
      track.style.transform = 'translateX(' + (-100 * index) + '%)';

      slides.forEach((slide, n) => slide.setAttribute('aria-hidden', String(n !== index)));
      dots.forEach((dot, n) => {
        if (n === index) {
          dot.setAttribute('aria-current', 'true');
        } else {
          dot.removeAttribute('aria-current');
        }
      });
    }

    function startAutoplay() {
      if (reduceMotion) return;                        // respect user settings
      stopAutoplay();
      timer = window.setInterval(() => goTo(index + 1), AUTOPLAY_MS);
    }
    function stopAutoplay() {
      if (timer) { window.clearInterval(timer); timer = null; }
    }
    function restartAutoplay() { startAutoplay(); }

    prevBtn.addEventListener('click', () => { goTo(index - 1); restartAutoplay(); });
    nextBtn.addEventListener('click', () => { goTo(index + 1); restartAutoplay(); });

    // Pause while the user is reading or interacting
    slider.addEventListener('mouseenter', stopAutoplay);
    slider.addEventListener('mouseleave', startAutoplay);
    slider.addEventListener('focusin', stopAutoplay);
    slider.addEventListener('focusout', startAutoplay);

    // Arrow keys move between slides when focus is inside the slider
    slider.addEventListener('keydown', (event) => {
      if (event.key === 'ArrowLeft') { goTo(index - 1); }
      if (event.key === 'ArrowRight') { goTo(index + 1); }
    });

    // Swipe support for touch screens
    let touchStartX = 0;
    slider.addEventListener('touchstart', (event) => {
      touchStartX = event.changedTouches[0].clientX;
      stopAutoplay();
    }, { passive: true });
    slider.addEventListener('touchend', (event) => {
      const distance = event.changedTouches[0].clientX - touchStartX;
      if (Math.abs(distance) > 50) goTo(distance < 0 ? index + 1 : index - 1);
      startAutoplay();
    }, { passive: true });

    // Pause when the browser tab is in the background
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) { stopAutoplay(); } else { startAutoplay(); }
    });

    goTo(0);
    startAutoplay();
  }

  /* 7. Gallery lightbox -------------------------------------------------- */
  const lightbox = $('#lightbox');
  const galleryItems = $$('.g-item');

  if (lightbox && galleryItems.length) {
    const lbImg = $('#lb-img');
    const lbCaption = $('#lb-caption');
    let lbIndex = 0;

    function showPhoto(i) {
      lbIndex = (i + galleryItems.length) % galleryItems.length;
      const item = galleryItems[lbIndex];
      const thumb = $('img', item);

      // If the large photo fails to load, fall back to the thumbnail
      lbImg.onerror = () => {
        lbImg.onerror = null;
        lbImg.src = thumb.currentSrc || thumb.src;
      };
      lbImg.src = item.dataset.full;
      lbImg.alt = item.dataset.caption;
      lbCaption.textContent = item.dataset.caption;
    }

    galleryItems.forEach((item, i) => {
      item.addEventListener('click', () => {
        showPhoto(i);
        if (typeof lightbox.showModal === 'function') {
          lightbox.showModal();
        } else {
          lightbox.setAttribute('open', '');           // very old browsers
        }
      });
    });

    function closeLightbox() {
      if (typeof lightbox.close === 'function') {
        lightbox.close();
      } else {
        lightbox.removeAttribute('open');
      }
    }

    $('#lb-close').addEventListener('click', closeLightbox);
    $('#lb-prev').addEventListener('click', () => showPhoto(lbIndex - 1));
    $('#lb-next').addEventListener('click', () => showPhoto(lbIndex + 1));

    // Clicking the dark backdrop closes the viewer
    lightbox.addEventListener('click', (event) => {
      if (event.target === lightbox) closeLightbox();
    });

    // Arrow keys browse photos while the viewer is open
    lightbox.addEventListener('keydown', (event) => {
      if (event.key === 'ArrowLeft') showPhoto(lbIndex - 1);
      if (event.key === 'ArrowRight') showPhoto(lbIndex + 1);
    });
  }

  /* 8. "Apply Now" pre-selects the enquiry type -------------------------- */
  $$('[data-enquiry]').forEach((button) => {
    button.addEventListener('click', () => {
      const select = $('#enquiry');
      if (select) select.value = button.dataset.enquiry;
    });
  });

  /* 9. Contact form validation (frontend only) --------------------------- */
  const form = $('#contact-form');

  if (form) {
    const status = $('#form-status');

    // Each rule returns an error message, or an empty string when the value is fine
    const rules = {
      name: (value) => (value.trim().length < 2
        ? 'Enter your full name (at least 2 characters).'
        : ''),

      email: (value) => (/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value.trim())
        ? ''
        : 'Enter a valid email address, like name@example.com.'),

      phone: (value) => {
        if (!value.trim()) return '';                  // optional field
        const digits = value.replace(/\D/g, '');
        return digits.length >= 10 && digits.length <= 13
          ? ''
          : 'Enter a phone number with 10 to 13 digits.';
      },

      enquiry: (value) => (value ? '' : 'Choose what your message is about.'),

      message: (value) => (value.trim().length < 10
        ? 'Write at least 10 characters so we can help you properly.'
        : '')
    };

    // Show or clear the error for one field. Returns true when the field is valid.
    function validateField(field) {
      const rule = rules[field.name];
      if (!rule) return true;

      const message = rule(field.value);
      const errorEl = document.getElementById(field.id + '-error');

      field.setAttribute('aria-invalid', message ? 'true' : 'false');
      if (errorEl) errorEl.textContent = message;
      return !message;
    }

    const fields = $$('input, select, textarea', form);

    // Validate when leaving a field, then re-check live while the user fixes it
    fields.forEach((field) => {
      field.addEventListener('blur', () => validateField(field));
      field.addEventListener('input', () => {
        if (field.getAttribute('aria-invalid') === 'true') validateField(field);
      });
    });

    form.addEventListener('submit', (event) => {
      event.preventDefault();
      status.textContent = '';
      status.classList.remove('success');

      // Check every field (do not stop at the first error)
      const results = fields.map((field) => ({ field, valid: validateField(field) }));
      const firstInvalid = results.find((result) => !result.valid);

      if (firstInvalid) {
        firstInvalid.field.focus();
        return;
      }

      /* This form is frontend only. To send the message to a server, replace
         the lines below with a fetch() call, for example:

         fetch('/api/contact', {
           method: 'POST',
           headers: { 'Content-Type': 'application/json' },
           body: JSON.stringify(Object.fromEntries(new FormData(form)))
         });
      */
      const firstName = $('#name').value.trim().split(' ')[0];
      form.reset();
      fields.forEach((field) => field.removeAttribute('aria-invalid'));

      status.textContent = 'Thank you, ' + firstName + '. We have received your message and will reply within one working day.';
      status.classList.add('success');
    });
  }

  /* 10. Footer year ------------------------------------------------------ */
  const yearEl = $('#year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // Set the initial state of header, scroll button and active link
  onScroll();
})();