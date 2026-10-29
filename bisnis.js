// Pengaturan mode BISNIS (pesan & bayar). Biarkan aktif:false jika undangan dipakai pribadi.
// Saat aktif: pratinjau diberi watermark; undangan baru bersih setelah pesanan berstatus "lunas" di Google Sheet.
window.BISNIS = {
  aktif: false,
  nama: 'Digital & Kreatif',
  wa: '6281234567890',               // nomor WhatsApp Anda (format 62...) untuk konfirmasi pembayaran
  api: '',                           // URL Google Apps Script (.../exec), lihat apps-script.gs dan README
  paket: [                           // CONTOH harga dan isi paket: ganti sesuai bisnis Anda
    {id: 'basic',   nama: 'Basic',   harga: 49000, fitur: 'Template, countdown, RSVP WhatsApp, galeri', tanpa: ['musik', 'media', 'sheet']},
    {id: 'premium', nama: 'Premium', harga: 99000, fitur: 'Semua fitur Basic + musik, video, dinding ucapan bersama', tanpa: []}
  ],
  bayar: {
    rekening: 'Scan QRIS di bawah (GoPay Merchant: DIGITAL & KREATIF)',   // boleh ditambah rekening bank
    qris: 'foto/qris.jpg',                          // gambar QRIS Anda di folder foto/
    catatan: 'Masukkan nominal sesuai total pesanan, lalu kirim bukti pembayaran lewat tombol WhatsApp di bawah dengan menyebut kode pesanan.'
  }
};
