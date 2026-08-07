import { useState } from "react";

export default function ImageSlider({ images = [], alt = "" }) {
  const [index, setIndex] = useState(0);

  if (!images || images.length === 0) return "No photo";

  function prev(e) {
    e.stopPropagation();
    setIndex((i) => (i - 1 + images.length) % images.length);
  }

  function next(e) {
    e.stopPropagation();
    setIndex((i) => (i + 1) % images.length);
  }

  return (
    <>
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
    </>
  );
}
