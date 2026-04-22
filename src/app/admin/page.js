"use client";

import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";

export default function AdminPage() {
  const [authenticated, setAuthenticated] = useState(false);
  const [password, setPassword] = useState("");

  const [artworks, setArtworks] = useState([]);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [size, setSize] = useState("");
  const [material, setMaterial] = useState("");
  const [color, setColor] = useState("");
  const [file, setFile] = useState(null);

  // ✅ Create client safely (only in browser)
  const getSupabase = () => {
    if (typeof window === "undefined") return null;

    return createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );
  };

  // 🔐 Login
  const handleLogin = () => {
    if (password === "bwj-admin-7421") {
      setAuthenticated(true);
    } else {
      alert("Wrong password");
    }
  };

  // 📥 Fetch artworks
  const fetchArtworks = async () => {
    const supabase = getSupabase();
    if (!supabase) return;

    const { data, error } = await supabase
      .from("artworks")
      .select("*")
      .order("id", { ascending: false });

    if (error) {
      console.error(error);
      return;
    }

    setArtworks(data || []);
  };

  useEffect(() => {
    if (authenticated) fetchArtworks();
  }, [authenticated]);

  // 📤 Upload
  const handleUpload = async () => {
    const supabase = getSupabase();
    if (!supabase) return;

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
        sold: false,
      },
    ]);

    if (dbError) {
      console.error(dbError);
      return alert("Database insert failed");
    }

    // reset
    setTitle("");
    setDescription("");
    setSize("");
    setMaterial("");
    setColor("");
    setFile(null);

    fetchArtworks();
  };

  // 🔁 Toggle sold
  const toggleSold = async (art) => {
    const supabase = getSupabase();
    if (!supabase) return;

    const { error } = await supabase
      .from("artworks")
      .update({ sold: !art.sold })
      .eq("id", art.id);

    if (error) {
      console.error(error);
      alert("Update failed");
      return;
    }

    fetchArtworks();
  };

  // 🗑 Delete
  const deleteArtwork = async (id) => {
    const supabase = getSupabase();
    if (!supabase) return;

    const { error } = await supabase
      .from("artworks")
      .delete()
      .eq("id", id);

    if (error) {
      console.error(error);
      alert("Delete failed");
      return;
    }

    fetchArtworks();
  };

  // 🔐 LOGIN SCREEN
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

  // 🧑‍💻 ADMIN PANEL
  return (
    <div className="min-h-screen bg-black text-white p-6 space-y-6">
      <h1 className="text-2xl font-bold">ADMIN</h1>

      {/* Upload Form */}
      <div className="space-y-2">
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
        />

        <button
          onClick={handleUpload}
          className="bg-white text-black px-4 py-2"
        >
          Upload Artwork
        </button>
      </div>

      {/* Artworks List */}
      <div className="space-y-4">
        {artworks.map((art) => (
          <div key={art.id} className="border border-white p-3">
            <p className="font-bold">{art.title}</p>

            <p className="text-xs opacity-50">
              Status: {art.sold ? "SOLD" : "AVAILABLE"}
            </p>

            <div className="flex gap-2 mt-2">
              <button
                onClick={() => toggleSold(art)}
                className="bg-yellow-500 px-2 py-1"
              >
                {art.sold ? "Mark Unsold" : "Mark Sold"}
              </button>

              <button
                onClick={() => deleteArtwork(art.id)}
                className="bg-red-500 px-2 py-1"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}