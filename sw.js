self.addEventListener('install', (e) => {
    console.log('Service Worker Katalog Siap!');
  });
  
  self.addEventListener('fetch', (e) => {
    // Syarat formal Chrome agar bisa di-install
  });