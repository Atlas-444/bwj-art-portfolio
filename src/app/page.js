"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@supabase/supabase-js";

const IDENTITY = "BWJ - ART";

export default function Home() {
  const [artworks, setArtworks] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [fullscreen, setFullscreen] = useState(false);
  const touchStartX = useRef(null);

  const [sizeFilter, setSizeFilter] = useState("");
  const [materialFilter, setMaterialFilter] = useState("");
  const [colorFilter, setColorFilter] = useState("");

  const fetchArtworks = async () => {
    if (typeof window === "undefined") return;

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );

    const { data, error } = await supabase.from("artworks").select("*");

    if (error) {
      console.error("Supabase error:", error);
      return;
    }

    setArtworks(data || []);
  };

  useEffect(() => {
    fetchArtworks();
  }, []);

  const filteredArtworks = artworks.filter((art) => {
    return (
      (!sizeFilter || art.size === sizeFilter) &&
      (!materialFilter || art.material === materialFilter) &&
      (!colorFilter || art.color === colorFilter)
    );
  });

  const selected =
    selectedIndex !== null ? filteredArtworks[selectedIndex] : null;

  const ProtectedImage = ({ children }) => (
    <div
      onContextMenu={(e) => e.preventDefault()}
      onDragStart={(e) => e.preventDefault()}
      style={{ userSelect: "none" }}
    >
      {children}
    </div>
  );

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

    return (
      <canvas
        ref={canvasRef}
        className="w-full h-auto opacity-0 animate-[fadeIn_0.8s_ease_forwards]"
      />
    );
  };

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

  // FULLSCREEN
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

  // DETAIL VIEW
  if (selected) {
    return (
      <div
        className="bg-black text-white min-h-screen px-6 md:px-16 py-12 animate-[fadeIn_0.6s_ease]"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <button
          onClick={() => setSelectedIndex(null)}
          className="mb-10 text-sm opacity-50 hover:opacity-100 transition"
        >
          ← Back
        </button>

        <div className="grid md:grid-cols-2 gap-16 items-start">

          <div onClick={() => setFullscreen(true)} className="cursor-zoom-in">
            <ProtectedImage>
              <WatermarkedImage src={selected.image_url} />
            </ProtectedImage>
          </div>

          <div className="space-y-8 max-w-lg">

            <div>
              <h1 className="text-3xl md:text-4xl font-semibold tracking-tight">
                {selected.title}
              </h1>

              <p className="text-xs mt-3 opacity-40 tracking-widest">
                ORIGINAL WORK
              </p>
            </div>

            {selected.sold && (
              <p className="text-sm opacity-50">Sold</p>
            )}

            <p className="text-[15px] leading-relaxed opacity-80">
              {selected.description}
            </p>

            <p className="text-xs opacity-40">
              {selected.size} • {selected.material} • {selected.color}
            </p>

            {!selected.sold && (
              <button
                className="mt-6 border border-white px-5 py-2 text-xs tracking-widest hover:bg-white hover:text-black transition"
                onClick={() =>
                  window.location.href = `mailto:bwj.4rt@gmail.com?subject=Inquiry about ${selected.title}`
                }
              >
                INQUIRE
              </button>
            )}
          </div>
        </div>

        <div className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-8">
          {getRelated().map((art) => (
            <div
              key={art.id}
              className="cursor-pointer"
              onClick={() =>
                setSelectedIndex(
                  filteredArtworks.findIndex((a) => a.id === art.id)
                )
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

  // GALLERY
  return (
    <div className="bg-black text-white min-h-screen pb-20">

      <div className="p-8 md:p-16 border-b border-white/10">
        <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
          {IDENTITY}
        </h1>
        <p className="mt-4 opacity-60 max-w-xl text-sm md:text-base leading-relaxed">
          A curated collection of original works exploring form, material, and quiet tension.
        </p>
      </div>

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

      <div className="grid grid-cols-2 md:grid-cols-4 gap-8 px-6 md:px-12 py-10 animate-[fadeIn_0.8s_ease]">
        {filteredArtworks.map((art, i) => (
          <div
            key={art.id}
            className="group cursor-pointer"
            onClick={() => setSelectedIndex(i)}
          >
            <div className="overflow-hidden bg-neutral-900">
              <ProtectedImage>
                <div className="aspect-square flex items-center justify-center">
                  <WatermarkedImage src={art.image_url} />
                </div>
              </ProtectedImage>
            </div>

            <div className="mt-4 text-xs tracking-wide opacity-60 group-hover:opacity-100 transition">
              {art.title}
            </div>
          </div>
        ))}
      </div>

    </div>
  );
}