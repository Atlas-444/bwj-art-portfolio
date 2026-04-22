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

    return <canvas ref={canvasRef} className="w-full h-auto" />;
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

        <div className="max-w-2xl space-y-5">
          <h1 className="text-4xl font-bold">{selected.title}</h1>

          <p className="text-xs opacity-40 tracking-widest">
            ORIGINAL WORK
          </p>

          {selected.sold ? (
            <p className="text-red-400 text-sm">● Sold</p>
          ) : (
            <p className="text-green-400 text-sm">
              ● Available — inquiries open
            </p>
          )}

          <p className="opacity-80 leading-relaxed">
            {selected.description}
          </p>

          <p className="opacity-50 text-sm">
            {selected.size} • {selected.material} • {selected.color}
          </p>

          <p className="text-sm opacity-40">
            Price available on request
          </p>

          <div className="pt-4">
            <button
              className="bg-white text-black px-6 py-3 text-sm tracking-widest font-semibold hover:scale-105 transition-transform duration-200"
              onClick={() =>
                window.location.href = `mailto:bwj.4rt@gmail.com?subject=Inquiry about ${selected.title}&body=Hi, I'm interested in "${selected.title}". Could you provide more details?`
              }
            >
              INQUIRE ABOUT THIS WORK
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {getRelated().map((art) => (
            <div
              key={art.id}
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
      {/* HERO */}
      <div className="p-8 md:p-16 border-b border-white/10">
        <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
          {IDENTITY}
        </h1>
        <p className="mt-4 opacity-60 max-w-xl text-sm md:text-base leading-relaxed">
          A curated collection of original works exploring form, material, and quiet tension.
        </p>
      </div>

      {/* FILTERS */}
      <div className="p-4 flex flex-wrap gap-2">
        <select
          onChange={(e) => setSizeFilter(e.target.value)}
          className="bg-black border p-2"
        >
          <option value="">All Sizes</option>
          <option value="small">Small</option>
          <option value="medium">Medium</option>
          <option value="large">Large</option>
        </select>

        <select
          onChange={(e) => setMaterialFilter(e.target.value)}
          className="bg-black border p-2"
        >
          <option value="">All Materials</option>
          <option value="canvas">Canvas</option>
          <option value="paper">Paper</option>
        </select>

        <select
          onChange={(e) => setColorFilter(e.target.value)}
          className="bg-black border p-2"
        >
          <option value="">All Colors</option>
          <option value="black">Black</option>
          <option value="colorful">Colorful</option>
        </select>
      </div>

      {/* GRID */}
      <div className="grid grid-cols-2 md:grid-cols-6 auto-rows-[150px] md:auto-rows-[220px] gap-2 p-2 group">
        {filteredArtworks.map((art, i) => {
          const span =
            i % 7 === 0
              ? "md:col-span-3 md:row-span-2"
              : i % 5 === 0
              ? "md:col-span-2 md:row-span-2"
              : "";

          return (
            <div
              key={art.id}
              className={`relative cursor-pointer overflow-hidden ${span} group-hover:opacity-40 hover:!opacity-100 transition-opacity duration-300`}
              onClick={() => setSelectedIndex(i)}
            >
              {art.sold && (
                <div className="absolute top-2 left-2 text-xs bg-white text-black px-2 py-1 z-10">
                  SOLD
                </div>
              )}

              <div className="absolute bottom-0 left-0 w-full bg-black/60 text-white text-xs p-2 opacity-0 hover:opacity-100 transition z-10">
                {art.title}
              </div>

              <div className="h-full w-full hover:scale-[1.05] transition-transform duration-500 flex items-center justify-center">
                <ProtectedImage>
                  <div className="opacity-90 hover:opacity-100 transition h-full flex items-center justify-center">
                    <WatermarkedImage src={art.image_url} />
                  </div>
                </ProtectedImage>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}