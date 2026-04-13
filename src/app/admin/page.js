"use client";

import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function AdminPage() {
  // 🔐 Auth
  const [authenticated, setAuthenticated] = useState(false);
  const [password, setPassword] = useState("");

  // 📦 Form
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [size, setSize] = useState("");
  const [material, setMaterial] = useState("");
  const [color, setColor] = useState("");
  const [file, setFile] = useState(null);

  // 📊 Data
  const [artworks, setArtworks] = useState([]);

  useEffect(() => {
    fetchArtworks();
  }, []);

  const fetchArtworks = async () => {
    const { data } = await supabase.from("artworks").select("*");
    setArtworks(data || []);
  };

  const handleLogin = () => {
    if (password === "bwj-admin-7421") {
      setAuthenticated(true);
    } else {
      alert("Wrong password");
    }
  };

  const handleUpload = async () => {
    if (!file) return alert("No file selected");

    const fileName = `${Date.now()}-${file.name.replace(/\s+/g, "-")}`;

    const { error: uploadError } = await supabase.storage
      .from("Artworks")
      .upload(fileName, file);

    if (uploadError) {
      console.error(uploadError);
      return alert("Upload failed");
    }

    const imageUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/Artworks/${fileName}`;

    const { error: dbError } = await supabase.from("artworks").insert([
      {
        title,
        description,
        size,
        material,
        color,
        image_url: imageUrl,
      },
    ]);

    if (dbError) {
      console.error(dbError);
      return alert("Database insert failed");
    }

    alert("Artwork uploaded!");
    fetchArtworks();

    setTitle("");
    setDescription("");
    setSize("");
    setMaterial("");
    setColor("");
    setFile(null);
  };

  // 🔐 Login gate
  if (!authenticated) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center gap-4">
        <h1>Admin Login</h1>

        <input
          type="password"
          placeholder="Enter password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="p-2 bg-gray-900"
        />

        <button
          onClick={handleLogin}
          className="bg-white text-black px-4 py-2"
        >
          Enter
        </button>
      </div>
    );
  }

  // 🧩 Main UI
  return (
    <div className="min-h-screen bg-black text-white p-6 space-y-4">
      <h1 className="text-2xl font-bold">ADMIN</h1>

      {/* FORM */}
      <input
        placeholder="Title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="block w-full p-2 bg-gray-900"
      />

      <textarea
        placeholder="Description"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        className="block w-full p-2 bg-gray-900"
      />

      <input
        placeholder="Size"
        value={size}
        onChange={(e) => setSize(e.target.value)}
        className="block w-full p-2 bg-gray-900"
      />

      <input
        placeholder="Material"
        value={material}
        onChange={(e) => setMaterial(e.target.value)}
        className="block w-full p-2 bg-gray-900"
      />

      <input
        placeholder="Color"
        value={color}
        onChange={(e) => setColor(e.target.value)}
        className="block w-full p-2 bg-gray-900"
      />

      <input
        type="file"
        onChange={(e) => setFile(e.target.files[0])}
        className="block"
      />

      <button
        onClick={handleUpload}
        className="bg-white text-black px-4 py-2"
      >
        Upload Artwork
      </button>

      {/* LIST */}
      <div className="mt-8 space-y-4">
        {artworks.map((art) => (
          <div key={art.id} className="border border-white p-2">
            <p>{art.title}</p>

            <button
              onClick={async () => {
                await supabase.from("artworks").delete().eq("id", art.id);
                fetchArtworks();
              }}
              className="bg-red-500 px-2 py-1 mr-2"
            >
              Delete
            </button>

            <button
              onClick={async () => {
                await supabase
                  .from("artworks")
                  .update({ sold: !art.sold })
                  .eq("id", art.id);
                fetchArtworks();
              }}
              className="bg-yellow-500 px-2 py-1"
            >
              {art.sold ? "Mark Unsold" : "Mark Sold"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}