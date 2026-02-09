function disablePinchZoom() {
  document.addEventListener(
    "touchmove",
    (event) => {
      if (event.touches.length > 1) {
        event.preventDefault();
      }
    },
    { passive: false }
  );

  document.addEventListener(
    "gesturestart",
    (event) => {
      event.preventDefault();
    },
    { passive: false }
  );
}
function showMapFallback(message) {
  const mapContainer = document.getElementById("map");
  if (!mapContainer) return;
  mapContainer.innerHTML = `<p style="margin:0;padding:16px;color:#676a63;font-size:0.86rem;line-height:1.6;">${message}</p>`;
}

const VENUE_NAME = "우리은행 본점";
const VENUE_ADDRESS = "서울특별시 중구 소공로 51";
const WEDDING_DATE = new Date("2026-04-25T11:00:00+09:00");

function initKakaoMap() {
  const mapContainer = document.getElementById("map");
  if (!mapContainer || !window.kakao || !window.kakao.maps) {
    showMapFallback("지도를 불러오지 못했습니다. 카카오 지도 키를 확인해주세요.");
    return;
  }

  const defaultCenter = new kakao.maps.LatLng(37.5665, 126.978);
  const map = new kakao.maps.Map(mapContainer, {
    center: defaultCenter,
    level: 5
  });

  const geocoder = new kakao.maps.services.Geocoder();
  geocoder.addressSearch(VENUE_ADDRESS, (result, status) => {
    if (status !== kakao.maps.services.Status.OK || !result[0]) {
      showMapFallback("주소를 찾지 못했습니다. 주소 또는 지도 키 설정을 확인해주세요.");
      return;
    }

    const lat = Number(result[0].y);
    const lng = Number(result[0].x);
    const position = new kakao.maps.LatLng(lat, lng);

    const marker = new kakao.maps.Marker({ position });
    marker.setMap(map);

    map.setCenter(position);
    map.setLevel(3);
  });
}

function updateCountdown() {
  const label = document.getElementById("dday-label");
  const timer = document.getElementById("dday-timer");
  if (!label || !timer) return;

  const now = new Date();
  const diff = WEDDING_DATE.getTime() - now.getTime();

  if (diff <= 0) {
    label.textContent = "D-DAY";
    timer.textContent = "오늘, 저희 결혼식이 시작됩니다.";
    return;
  }

  const totalSeconds = Math.floor(diff / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  label.textContent = `D-${days}`;
  timer.textContent = `${days}일 ${hours}시간 ${minutes}분 ${seconds}초 남았습니다.`;
}

function bindSectionFadeIn() {
  const sections = document.querySelectorAll(".section");
  if (!sections.length) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    {
      threshold: 0.12,
      rootMargin: "0px 0px -8% 0px"
    }
  );

  sections.forEach((section) => observer.observe(section));
}

function bindGalleryLightbox() {
  const lightbox = document.getElementById("lightbox");
  const lightboxImage = document.getElementById("lightbox-image");
  const closeButton = document.getElementById("lightbox-close");
  const prevButton = document.getElementById("lightbox-prev");
  const nextButton = document.getElementById("lightbox-next");
  const previewImage = document.getElementById("gallery-preview");
  const thumbButtons = Array.from(document.querySelectorAll(".gallery-thumb"));

  if (!lightbox || !lightboxImage || !closeButton || !prevButton || !nextButton || !previewImage || !thumbButtons.length) return;

  let currentIndex = 0;
  let startX = 0;
  let endX = 0;
  const photos = thumbButtons
    .map((button) => {
      const thumbImage = button.querySelector("img");
      if (!thumbImage) return null;
      return {
        thumbSrc: thumbImage.src,
        fullSrc: thumbImage.src.replace("/300/300", "/900/1200"),
        alt: thumbImage.alt
      };
    })
    .filter(Boolean);

  if (!photos.length) return;

  function renderImage(index) {
    const photo = photos[index];
    if (!photo) return;
    lightboxImage.src = photo.fullSrc;
    lightboxImage.alt = photo.alt;
  }

  function renderPreview(index, animate = true) {
    const photo = photos[index];
    if (!photo) return;

    thumbButtons.forEach((button) => button.classList.remove("is-active"));
    if (thumbButtons[index]) thumbButtons[index].classList.add("is-active");

    if (animate) {
      previewImage.classList.add("is-changing");
      setTimeout(() => {
        previewImage.src = photo.fullSrc;
        previewImage.alt = photo.alt;
        previewImage.classList.remove("is-changing");
      }, 120);
      return;
    }

    previewImage.src = photo.fullSrc;
    previewImage.alt = photo.alt;
  }

  function openLightbox(index) {
    currentIndex = index;
    renderImage(currentIndex);
    lightbox.classList.add("is-open");
    lightbox.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
  }

  function closeLightbox() {
    lightbox.classList.remove("is-open");
    lightbox.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
  }

  function showPrev() {
    currentIndex = (currentIndex - 1 + photos.length) % photos.length;
    renderImage(currentIndex);
    renderPreview(currentIndex, false);
  }

  function showNext() {
    currentIndex = (currentIndex + 1) % photos.length;
    renderImage(currentIndex);
    renderPreview(currentIndex, false);
  }

  thumbButtons.forEach((button, index) => {
    button.addEventListener("click", () => {
      currentIndex = index;
      renderPreview(currentIndex, true);
    });
  });
  previewImage.addEventListener("click", () => openLightbox(currentIndex));

  prevButton.addEventListener("click", showPrev);
  nextButton.addEventListener("click", showNext);
  closeButton.addEventListener("click", closeLightbox);

  lightbox.addEventListener("click", (event) => {
    if (event.target === lightbox) closeLightbox();
  });

  lightboxImage.addEventListener("touchstart", (event) => {
    startX = event.changedTouches[0].clientX;
  });

  lightboxImage.addEventListener("touchend", (event) => {
    endX = event.changedTouches[0].clientX;
    const deltaX = endX - startX;
    if (Math.abs(deltaX) < 40) return;
    if (deltaX > 0) {
      showPrev();
      return;
    }
    showNext();
  });

  document.addEventListener("keydown", (event) => {
    if (!lightbox.classList.contains("is-open")) return;
    if (event.key === "Escape") closeLightbox();
    if (event.key === "ArrowLeft") showPrev();
    if (event.key === "ArrowRight") showNext();
  });

  renderPreview(currentIndex, false);
}

async function copyAccount(text, button) {
  try {
    await navigator.clipboard.writeText(text);
    const original = button.textContent;
    button.textContent = "복사 완료";
    setTimeout(() => {
      button.textContent = original;
    }, 1200);
  } catch (err) {
    alert("복사에 실패했습니다. 길게 눌러 직접 복사해주세요.");
  }
}

function bindCopyButtons() {
  const buttons = document.querySelectorAll(".copy-btn");
  buttons.forEach((button) => {
    button.addEventListener("click", () => {
      const text = button.dataset.copyTarget;
      if (!text) return;
      copyAccount(text, button);
    });
  });
}

document.addEventListener("DOMContentLoaded", () => {
  bindCopyButtons();
  bindSectionFadeIn();
  bindGalleryLightbox();
  disablePinchZoom();
  updateCountdown();
  setInterval(updateCountdown, 1000);

  const sdkScript = document.getElementById("kakao-map-sdk");
  const hasPlaceholderKey = sdkScript && sdkScript.src.includes("YOUR_KAKAO_JAVASCRIPT_KEY");

  if (hasPlaceholderKey) {
    showMapFallback("카카오 지도 미리보기를 위해 JavaScript 키를 입력해주세요.");
    return;
  }

  const startMap = () => {
    if (window.kakao && window.kakao.maps) {
      kakao.maps.load(initKakaoMap);
      return;
    }
    showMapFallback("지도를 불러오지 못했습니다. 카카오 지도 키 또는 도메인 설정을 확인해주세요.");
  };

  if (window.kakao && window.kakao.maps) {
    startMap();
    return;
  }

  if (sdkScript) {
    sdkScript.addEventListener("load", startMap, { once: true });
    sdkScript.addEventListener(
      "error",
      () => showMapFallback("카카오 지도 SDK 로드에 실패했습니다. 네트워크 또는 키 설정을 확인해주세요."),
      { once: true }
    );
    return;
  }

  showMapFallback("지도를 불러오지 못했습니다. 카카오 지도 키 또는 도메인 설정을 확인해주세요.");
});

