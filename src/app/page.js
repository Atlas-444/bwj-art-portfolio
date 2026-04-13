"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const IDENTITY = "BWJ - ART";

export default function Home() {
  const [artworks, setArtworks] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [fullscreen, setFullscreen] = useState(false);
  const touchStartX = useRef(null);

  // Filters
  const [sizeFilter, setSizeFilter] = useState("");
  const [materialFilter, setMaterialFilter] = useState("");
  const [colorFilter, setColorFilter] = useState("");

  useEffect(() => {
    fetchArtworks();
  }, []);

  const fetchArtworks = async () => {
    const { data } = await supabase.from("artworks").select("*");
    setArtworks(data || []);
  };

  const filteredArtworks = artworks.filter((art) => {
    return (
      (!sizeFilter || art.size === sizeFilter) &&
      (!materialFilter || art.material === materialFilter) &&
      (!colorFilter || art.color === colorFilter)
    );
  });

  const selected =
    selectedIndex !== null ? filteredArtworks[selectedIndex] : null;

  // 🔒 Protected Wrapper
  const ProtectedImage = ({ children }) => (
    <div
      onContextMenu={(e) => e.preventDefault()}
      onDragStart={(e) => e.preventDefault()}
      style={{ userSelect: "none" }}
    >
      {children}
    </div>
  );

  // 🔒 Watermark
  const WatermarkedImage = ({ src }) => {
    const canvasRef = (el) => {
      if (!el || !src) return;
      const ctx = el.getContext("2d");
      const img = new Image();
      img.src = src;

      img.onload = () => {
        const scale = 0.5;
        el.width = img.width * scale;
        el.height = img.height * scale;

        ctx.drawImage(img, 0, 0, el.width, el.height);

        ctx.font = "bold 18px monospace";
        ctx.fillStyle = "rgba(255,255,255,0.15)";

        for (let i = 0; i < el.width; i += 160) {
          for (let j = 0; j < el.height; j += 120) {
            ctx.save();
            ctx.translate(i, j);
            ctx.rotate(-0.3);
            ctx.fillText(IDENTITY, 0, 0);
            ctx.restore();
          }
        }
      };
    };

    return <canvas ref={canvasRef} className="w-full h-auto" />;
  };

  // Swipe
  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e) => {
    if (touchStartX.current === null) return;
    const diff = e.changedTouches[0].clientX - touchStartX.current;

    if (diff > 50 && selectedIndex > 0)
      setSelectedIndex(selectedIndex - 1);

    if (diff < -50 && selectedIndex < filteredArtworks.length - 1)
      setSelectedIndex(selectedIndex + 1);

    touchStartX.current = null;
  };

  // Related
  const getRelated = () => {
    if (!selected) return [];

    return filteredArtworks
      .filter(
        (a, i) =>
          i !== selectedIndex &&
          (a.material === selected.material ||
            a.color === selected.color)
      )
      .slice(0, 4);
  };

  // Fullscreen
  if (fullscreen && selected) {
    return (
      <div
        className="fixed inset-0 bg-black z-50 flex items-center justify-center"
        onClick={() => setFullscreen(false)}
      >
        <ProtectedImage>
          <WatermarkedImage src={selected.image_url} />
        </ProtectedImage>
      </div>
    );
  }

  // Detail
  if (selected) {
    return (
      <div
        className="bg-black text-white min-h-screen p-4 md:p-12 space-y-16"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <button onClick={() => setSelectedIndex(null)}>← BACK</button>

        <div onClick={() => setFullscreen(true)}>
          <ProtectedImage>
            <WatermarkedImage src={selected.image_url} />
          </ProtectedImage>
        </div>

        <h1 className="text-4xl">{selected.title}</h1>
        <p>{selected.description}</p>

        <p className="opacity-50">
          {selected.size} • {selected.material} • {selected.color}
        </p>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {getRelated().map((art) => (
            <div
              key={art.id}
              onClick={() =>
                setSelectedIndex(filteredArtworks.indexOf(art))
              }
            >
              <ProtectedImage>
                <WatermarkedImage src={art.image_url} />
              </ProtectedImage>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Gallery
  return (
    <div className="bg-black text-white min-h-screen">
      <div className="p-4 text-lg tracking-widest">{IDENTITY}</div>

      {/* Filters */}
      <div className="p-4 flex flex-wrap gap-2">
        <select onChange={(e) => setSizeFilter(e.target.value)} className="bg-black border p-2">
          <option value="">All Sizes</option>
          <option value="small">Small</option>
          <option value="medium">Medium</option>
          <option value="large">Large</option>
        </select>

        <select onChange={(e) => setMaterialFilter(e.target.value)} className="bg-black border p-2">
          <option value="">All Materials</option>
          <option value="canvas">Canvas</option>
          <option value="paper">Paper</option>
        </select>

        <select onChange={(e) => setColorFilter(e.target.value)} className="bg-black border p-2">
          <option value="">All Colors</option>
          <option value="black">Black</option>
          <option value="colorful">Colorful</option>
        </select>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-2">
        {filteredArtworks.map((art, i) => (
          <div
            key={art.id}
            className="cursor-pointer"
            onClick={() => setSelectedIndex(i)}
          >
            <ProtectedImage>
              <WatermarkedImage src={art.image_url} />
            </ProtectedImage>
          </div>
        ))}
      </div>
    </div>
  );
}