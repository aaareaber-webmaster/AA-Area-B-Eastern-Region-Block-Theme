(function () {
  "use strict";

  function initCarousel(carousel) {
    if (carousel.dataset.carouselInitialised === "true") {
      return;
    }

    const slides = Array.from(carousel.children).filter(function (child) {
      return child.classList.contains("wp-block-cover");
    });

    slides.forEach(function (slide) {
      slide.style.minHeight = "0";
      slide.style.height = "100%";
      slide.style.aspectRatio = "auto";

      const image = slide.querySelector(".wp-block-cover__image-background");

      if (image) {
        image.style.objectFit = "contain";
        image.style.width = "100%";
        image.style.height = "100%";
      }
    });

    if (slides.length < 2) {
      return;
    }

    carousel.dataset.carouselInitialised = "true";

    const autoplay = carousel.dataset.autoplay !== "false";
    const loop = carousel.dataset.loop !== "false";
    const pauseOnHover = carousel.dataset.pauseHover !== "false";
    const showArrows = carousel.dataset.showArrows !== "false";
    const showDots = carousel.dataset.showDots !== "false";

    const interval = Math.max(
      2000,
      parseInt(carousel.dataset.interval, 10) || 7500,
    );

    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    let current = 0;
    let trackPosition = loop ? 1 : 0;
    let resetPosition = null;

    let timer = null;
    let hoverPaused = false;
    let focusPaused = false;
    let pointerStartX = null;

    const track = document.createElement("div");
    track.className = "area-b-carousel__track";

    /*
     * For looping:
     *
     * [clone of last] [real slide 1] [real slide 2] ... [clone of first]
     *
     * This lets us always animate in the same direction and then
     * silently jump back to the equivalent real slide.
     */
    if (loop) {
      const lastClone = slides[slides.length - 1].cloneNode(true);

      lastClone.setAttribute("aria-hidden", "true");
      lastClone.setAttribute("inert", "");
      lastClone.dataset.carouselClone = "true";

      track.appendChild(lastClone);
    }

    slides.forEach(function (slide, index) {
      slide.setAttribute("role", "group");
      slide.setAttribute("aria-roledescription", "slide");
      slide.setAttribute(
        "aria-label",
        String(index + 1) + " of " + String(slides.length),
      );

      track.appendChild(slide);
    });

    if (loop) {
      const firstClone = slides[0].cloneNode(true);

      firstClone.setAttribute("aria-hidden", "true");
      firstClone.setAttribute("inert", "");
      firstClone.dataset.carouselClone = "true";

      track.appendChild(firstClone);
    }

    carousel.insertBefore(track, carousel.firstChild);

    let previousButton = null;
    let nextButton = null;
    let dots = [];

    function moveTrack(position, animate) {
      if (!animate) {
        track.style.transition = "none";
      }

      track.style.transform = "translate3d(-" + position * 100 + "%, 0, 0)";

      if (!animate) {
        /*
         * Force layout so the browser applies the position
         * before restoring the normal CSS transition.
         */
        void track.offsetHeight;

        track.style.transition = "";
      }
    }

    function updateSlides() {
      slides.forEach(function (slide, index) {
        const active = index === current;

        slide.setAttribute("aria-hidden", active ? "false" : "true");

        if (active) {
          slide.removeAttribute("inert");
        } else {
          slide.setAttribute("inert", "");
        }
      });

      dots.forEach(function (dot, index) {
        if (index === current) {
          dot.setAttribute("aria-current", "true");
        } else {
          dot.removeAttribute("aria-current");
        }
      });

      if (!loop) {
        if (previousButton) {
          previousButton.disabled = current === 0;
        }

        if (nextButton) {
          nextButton.disabled = current === slides.length - 1;
        }
      }
    }

    function goTo(index) {
      if (!loop) {
        current = Math.max(0, Math.min(index, slides.length - 1));

        trackPosition = current;

        moveTrack(trackPosition, true);
        updateSlides();

        return;
      }

      /*
       * Moving forwards beyond the final real slide.
       *
       * Animate onto the cloned first slide, then after the
       * animation silently reset to the real first slide.
       */
      if (index >= slides.length) {
        current = 0;
        trackPosition = slides.length + 1;
        resetPosition = 1;

        moveTrack(trackPosition, true);
        updateSlides();

        return;
      }

      /*
       * Moving backwards beyond the first real slide.
       *
       * Animate onto the cloned final slide, then silently
       * reset to the real final slide.
       */
      if (index < 0) {
        current = slides.length - 1;
        trackPosition = 0;
        resetPosition = slides.length;

        moveTrack(trackPosition, true);
        updateSlides();

        return;
      }

      current = index;
      trackPosition = current + 1;

      moveTrack(trackPosition, true);
      updateSlides();
    }

    track.addEventListener("transitionend", function (event) {
      if (event.propertyName !== "transform" || resetPosition === null) {
        return;
      }

      trackPosition = resetPosition;
      resetPosition = null;

      moveTrack(trackPosition, false);
    });

    function stopAutoplay() {
      if (timer) {
        window.clearInterval(timer);
        timer = null;
      }
    }

    function startAutoplay() {
      stopAutoplay();

      if (
        !autoplay ||
        reducedMotion ||
        hoverPaused ||
        focusPaused ||
        document.hidden
      ) {
        return;
      }

      if (!loop && current === slides.length - 1) {
        return;
      }

      timer = window.setInterval(function () {
        if (!loop && current === slides.length - 1) {
          stopAutoplay();
          return;
        }

        goTo(current + 1);
      }, interval);
    }

    function resetAutoplay() {
      stopAutoplay();
      startAutoplay();
    }

    if (showArrows) {
      previousButton = document.createElement("button");
      previousButton.type = "button";
      previousButton.className =
        "area-b-carousel__arrow area-b-carousel__arrow--previous";
      previousButton.setAttribute("aria-label", "Previous slide");
      previousButton.textContent = "‹";

      nextButton = document.createElement("button");
      nextButton.type = "button";
      nextButton.className =
        "area-b-carousel__arrow area-b-carousel__arrow--next";
      nextButton.setAttribute("aria-label", "Next slide");
      nextButton.textContent = "›";

      previousButton.addEventListener("click", function () {
        goTo(current - 1);
        resetAutoplay();
      });

      nextButton.addEventListener("click", function () {
        goTo(current + 1);
        resetAutoplay();
      });

      carousel.appendChild(previousButton);
      carousel.appendChild(nextButton);
    }

    if (showDots) {
      const pagination = document.createElement("div");
      pagination.className = "area-b-carousel__pagination";

      dots = slides.map(function (_, index) {
        const dot = document.createElement("button");

        dot.type = "button";
        dot.className = "area-b-carousel__dot";

        dot.setAttribute("aria-label", "Go to slide " + String(index + 1));

        dot.addEventListener("click", function () {
          goTo(index);
          resetAutoplay();
        });

        pagination.appendChild(dot);

        return dot;
      });

      carousel.appendChild(pagination);
    }

    if (pauseOnHover) {
      carousel.addEventListener("mouseenter", function () {
        hoverPaused = true;
        stopAutoplay();
      });

      carousel.addEventListener("mouseleave", function () {
        hoverPaused = false;
        startAutoplay();
      });
    }

    carousel.addEventListener("focusin", function () {
      focusPaused = true;
      stopAutoplay();
    });

    carousel.addEventListener("focusout", function () {
      window.setTimeout(function () {
        if (!carousel.contains(document.activeElement)) {
          focusPaused = false;
          startAutoplay();
        }
      }, 0);
    });

    /*
     * Touch / pen swipe.
     */
    track.addEventListener("pointerdown", function (event) {
      if (event.pointerType !== "touch" && event.pointerType !== "pen") {
        return;
      }

      pointerStartX = event.clientX;
      stopAutoplay();
    });

    track.addEventListener("pointerup", function (event) {
      if (pointerStartX === null) {
        return;
      }

      const difference = event.clientX - pointerStartX;

      if (Math.abs(difference) >= 50) {
        if (difference < 0) {
          goTo(current + 1);
        } else {
          goTo(current - 1);
        }
      }

      pointerStartX = null;
      startAutoplay();
    });

    track.addEventListener("pointercancel", function () {
      pointerStartX = null;
      startAutoplay();
    });

    document.addEventListener("visibilitychange", function () {
      if (document.hidden) {
        stopAutoplay();
      } else {
        startAutoplay();
      }
    });

    /*
     * Begin on the first real slide.
     *
     * When looping, physical position 0 is the cloned final slide,
     * so the real first slide lives at position 1.
     */
    moveTrack(trackPosition, false);
    updateSlides();

    carousel.classList.add("is-carousel-ready");

    startAutoplay();
  }

  function initAllCarousels() {
    document
      .querySelectorAll(".wp-block-area-b-hero-carousel")
      .forEach(initCarousel);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initAllCarousels);
  } else {
    initAllCarousels();
  }
})();
