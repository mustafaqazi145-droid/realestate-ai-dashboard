import { useState, useRef } from "react";

export default function ImageSlider({ images = [], alt = "" }) {
  const [index, setIndex] = useState(0);
  const timerRef = useRef(null);

  if (!images || images.length === 0) return "No photo";

  function prev(e) {
    e.stopPropagation();
    setIndex((i) => (i - 1 + images.length) % images.length);
  }

  function next(e) {
    e.stopPropagation();
    setIndex((i) => (i + 1) % images.length);
  }

  function startAutoplay() {
    if (images.length <= 1 || timerRef.current) return;
    timerRef.current = setInterval(() => {
      setIndex((i) => (i + 1) % images.length);
    }, 1100);
  }

  function stopAutoplay() {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }

  return (
    <div
      onMouseEnter={startAutoplay}
      onMouseLeave={stopAutoplay}
      style={{ position: "absolute", inset: 0 }}
    >
      <img src={images[index]} alt={alt} />
      {images.length > 1 && (
        <>
          <button type="button" className="slide-arrow prev" onClick={prev}>‹</button>
          <button type="button" className="slide-arrow next" onClick={next}>›</button>
          <div className="slide-nav">
            {images.map((_, i) => (
              <span
                key={i}
                className={"slide-dot" + (i === index ? " active" : "")}
                onClick={(e) => { e.stopPropagation(); setIndex(i); }}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
