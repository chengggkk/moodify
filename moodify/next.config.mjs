/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    images: {
      domains: [
        'i.scdn.co',       // Spotify album covers
        'mosaic.scdn.co',  // Spotify mosaic images
        'platform-lookaside.fbsbx.com', // Facebook profile pictures (sometimes used by Spotify)
        'profile-images.scdn.co',       // Spotify profile images
        'image-cdn-fa.spotifycdn.com',  // Another Spotify CDN
        'seeded-session-images.scdn.co' // Spotify session images
      ],
    },
    // If you're using the Spotify Web API, you might need these headers
    async headers() {
      return [
        {
          source: '/api/:path*',
          headers: [
            { key: 'Access-Control-Allow-Credentials', value: 'true' },
            { key: 'Access-Control-Allow-Origin', value: '*' },
            { key: 'Access-Control-Allow-Methods', value: 'GET,OPTIONS,PATCH,DELETE,POST,PUT' },
            { key: 'Access-Control-Allow-Headers', value: 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version' },
          ],
        },
      ];
    }
  };
  
  // Use ES module export syntax
  export default nextConfig;