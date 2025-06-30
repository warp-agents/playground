import { Neg } from "@tensorflow/tfjs";
import type { NextConfig } from "next";

/** @type {import('next').NextConfig} **/
const nextConfig = {
  env: {
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
    SENTINEL_HUB_ID: process.env.SENTINEL_HUB_ID,
    GOOGLE_ANALYTICS_CODE: process.env.GOOGLE_ANALYTICS_CODE,
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
    GOOGLE_GEMINI_API_KEY: process.env.GOOGLE_GEMINI_API_KEY,
    ELEVENLABS_API_KEY: process.env.ELEVENLABS_API_KEY,
    GOOGLE_COLAB_API_URL: process.env.GOOGLE_COLAB_API_URL,
    FIREBASE_API_KEY: process.env.FIREBASE_API_KEY,
    FIREBASE_AUTH_DOMAIN: process.env.FIREBASE_AUTH_DOMAIN,
    FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID,
    FIREBASE_STORAGE_BUCKET: process.env.FIREBASE_STORAGE_BUCKET,
    FIREBASE_MESSAGING_SENDER_ID: process.env.FIREBASE_MESSAGING_SENDER_ID,
    FIREBASE_APP_ID: process.env.FIREBASE_APP_ID,
    FIREBASE_MEASUREMENT_ID: process.env.FIREBASE_MEASUREMENT_ID,
    HF_API_KEY: process.env.HF_API_KEY,
    QDRANT_URL: process.env.QDRANT_URL,
    QDRANT_API_KEY: process.env.QDRANT_API_KEY,
    SUPABASE_URL: process.env.SUPABASE_URL,
    SUPABASE_API_KEY: process.env.SUPABASE_API_KEY,
    NGROK_URL: process.env.NGROK_URL,
    LLM7_IO_API_KEY: process.env.LLM7_IO_API_KEY,
  },
  // domains: [
  //   'i.imghippo.com',
  //   'upload.wikimedia.org',
  //   't1.gstatic.com',
  //   'flagcdn.com',
  //   'lh3.googleusercontent.com'
  // ],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'i.imghippo.com',
      },
      {
        protocol: 'https',
        hostname: 'upload.wikimedia.org',
      },
      {
        protocol: 'https',
        hostname: 't1.gstatic.com',
      },
      {
        protocol: 'https',
        hostname: 'flagcdn.com',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
    ],
  },
  output: 'standalone', // Feel free to modify/remove this option
  serverExternalPackages: ['sharp', 'onnxruntime-node'],
}

module.exports = nextConfig
