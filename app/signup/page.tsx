"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function SignupPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const signup = async () => {
    try {
      const res = await fetch("http://127.0.0.1:8000/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          email,
          password,
        }),
      });

      const data = await res.json();

      console.log(data);

      if (!res.ok) {
        alert(data.detail || "Signup failed");
        return;
      }

      localStorage.setItem("token", data.token);

      localStorage.setItem(
        "user",
        JSON.stringify(data.user)
      );

      router.push("/chat");

    } catch (error) {
      console.error(error);
      alert("Cannot connect to backend server");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f7f7f5]">
      <div className="bg-white p-8 rounded-2xl border w-[400px]">
        <h1 className="text-3xl font-semibold mb-6">
          Create Account
        </h1>

        <input
          className="w-full border p-3 rounded-lg mb-4"
          placeholder="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <input
          className="w-full border p-3 rounded-lg mb-4"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          type="password"
          className="w-full border p-3 rounded-lg mb-4"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button
          onClick={signup}
          className="w-full bg-black text-white p-3 rounded-lg"
        >
          Sign Up
        </button>

        <p className="mt-4 text-sm text-gray-500">
          Already have an account?{" "}
          <span
            className="underline cursor-pointer"
            onClick={() => router.push("/login")}
          >
            Login
          </span>
        </p>
      </div>
    </div>
  );
}