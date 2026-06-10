/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: [
      'i1.sndcdn.com', 'i2.sndcdn.com', 'i3.sndcdn.com', // SoundCloud
      'thumbnailer.mixcloud.com',                           // Mixcloud
      'i.ytimg.com',                                        // YouTube
      'iaqprkjgphbzmgttpohy.supabase.co',                  // Supabase storage
    ],
  },
};

module.exports = nextConfig;
