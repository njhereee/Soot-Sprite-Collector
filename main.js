// main.js (File Electron Process Utama)

const { app, BrowserWindow } = require('electron');
const path = require('path');

function createWindow() {
  // Buat jendela browser.
  const mainWindow = new BrowserWindow({
    width: 360, // Lebar yang sama dengan container CSS Anda
    height: 480, // Sesuaikan tinggi sesuai keinginan, harus lebih besar dari container untuk header/footer
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'), // Preload script opsional, bisa dihapus jika tidak digunakan
      nodeIntegration: true, // Izinkan Node.js API di renderer process (berhati-hatilah dengan ini untuk keamanan)
      contextIsolation: false, // Nonaktifkan isolasi konteks (berhati-hatilah dengan ini)
    },
    frame: true, // Tampilkan frame jendela native (tombol minimize/maximize/close)
    resizable: true, // Izinkan ukuran jendela diubah
    fullscreenable: false, // Nonaktifkan mode fullscreen
    autoHideMenuBar: true // Sembunyikan menu bar browser
  });

  // Muat file index.html dari aplikasi Anda.
  // path.join(__dirname, 'index.html') akan memastikan jalur yang benar di lingkungan Electron
  mainWindow.loadFile(path.join(__dirname, 'index.html'));

  // Buka DevTools secara otomatis (untuk debugging saat pengembangan)
  // mainWindow.webContents.openDevTools(); 
}

// Event ini akan dipanggil ketika Electron siap untuk membuat jendela browser.
app.whenReady().then(() => {
  createWindow();

  // Aktifkan jendela baru jika tidak ada jendela yang terbuka (khusus macOS)
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// Event ini akan dipanggil ketika semua jendela ditutup.
app.on('window-all-closed', () => {
  // Pada macOS, aplikasi dan menu bar tetap aktif sampai pengguna menutupnya secara eksplisit dengan Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Anda bisa membuat file preload.js kosong jika webPreferences.preload diaktifkan
// Buat file bernama preload.js di root proyek Anda
/*
// preload.js (opsional)
// Semua API Node.js yang perlu Anda ekspos ke renderer process dapat diekspos di sini.
// Contoh:
// const { contextBridge } = require('electron');
// contextBridge.exposeInMainWorld('electronAPI', {
//   closeWindow: () => ipcRenderer.send('close-window')
// });
*/
