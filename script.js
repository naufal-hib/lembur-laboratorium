// ============================================
// LEMBUR LABORATORIUM - JAVASCRIPT
// ============================================

// GANTI DENGAN WEB APP URL ANDA SETELAH DEPLOY
const API_URL = 'https://script.google.com/macros/s/AKfycbxkkqeQ4rM9-YrBYkqte5PZ5IHEQD2ZKixt40zphx_3hNIBQND4JySWkqXlvfH3hrSghg/exec';

// Global Variables
let currentUser = null;
let cutoffData = null;
let lemburData = [];

// ============================================
// INITIALIZATION
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    showLoading(true);
    
    const savedUser = localStorage.getItem('lemburUser');
    if (savedUser) {
        currentUser = JSON.parse(savedUser);
        loadDashboard();
    } else {
        showLoading(false);
    }
    
    updateTime();
    setInterval(updateTime, 1000);
    
    loadCutoff();
});

function updateTime() {
    const now = new Date();
    const timeString = now.toLocaleTimeString('id-ID');
    const dateString = now.toLocaleDateString('id-ID', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    
    document.getElementById('currentTime').textContent = `${dateString}, ${timeString}`;
    document.getElementById('karyawanCurrentTime').textContent = `${dateString}, ${timeString}`;
}

function showLoading(show) {
    document.getElementById('loadingOverlay').style.display = show ? 'flex' : 'none';
}

// ============================================
// LOGIN FUNCTION
// ============================================

document.getElementById('btnLogin').addEventListener('click', function() {
    login();
});

document.getElementById('password').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        login();
    }
});

function login() {
    const nik = document.getElementById('nik').value.trim();
    const password = document.getElementById('password').value;
    
    if (!nik || !password) {
        showLoginMessage('NIK dan Password harus diisi!', 'error');
        return;
    }
    
    showLoading(true);
    
    fetch(API_URL + '?action=login&nik=' + encodeURIComponent(nik) + '&password=' + encodeURIComponent(password), {
        method: 'GET',
        mode: 'cors'
    })
    .then(response => response.json())
    .then(data => {
        showLoading(false);
        
        if (data.success) {
            currentUser = data.data;
            localStorage.setItem('lemburUser', JSON.stringify(currentUser));
            showLoginMessage('Login berhasil! Redirecting...', 'success');
            
            setTimeout(() => {
                loadDashboard();
            }, 1000);
        } else {
            showLoginMessage(data.message, 'error');
        }
    })
    .catch(error => {
        showLoading(false);
        console.error('Login error:', error);
        showLoginMessage('Terjadi kesalahan: ' + error.message, 'error');
    });
}

function showLoginMessage(message, type) {
    const msgDiv = document.getElementById('loginMessage');
    msgDiv.textContent = message;
    msgDiv.className = `login-message ${type}`;
}

// ============================================
// DASHBOARD LOADING
// ============================================

function loadDashboard() {
    if (currentUser.role === 'Admin') {
        loadAdminDashboard();
    } else {
        loadKaryawanDashboard();
    }
    
    document.getElementById('loginPage').style.display = 'none';
}

function loadAdminDashboard() {
    document.getElementById('adminDashboard').style.display = 'flex';
    document.getElementById('adminName').textContent = currentUser.nama;
    
    if (cutoffData) {
        document.getElementById('cutoffPeriod').textContent = 
            `Periode: ${cutoffData.cutoff_awal} - ${cutoffData.cutoff_akhir}`;
    }
}

function loadKaryawanDashboard() {
    document.getElementById('karyawanDashboard').style.display = 'flex';
    document.getElementById('karyawanName').textContent = currentUser.nama;
    document.getElementById('karyawanNama').textContent = currentUser.nama;
    document.getElementById('karyawanNIK').textContent = currentUser.nik;
    
    loadKaryawanData();
    
    if (cutoffData) {
        document.getElementById('karyawanCutoffPeriod').textContent = 
            `Periode: ${cutoffData.cutoff_awal} - ${cutoffData.cutoff_akhir}`;
    }
}

// ============================================
// CUTOFF FUNCTIONS
// ============================================

function loadCutoff() {
    fetch(API_URL + '?action=get_cutoff', {
        method: 'GET',
        mode: 'cors'
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            cutoffData = data.data;
        }
    })
    .catch(error => {
        console.error('Error loading cutoff:', error);
    });
}

function saveCutoff() {
    alert('Fitur ini akan diimplementasikan');
}

// ============================================
// ADMIN FUNCTIONS
// ============================================

function showPage(pageId) {
    document.querySelectorAll('.page-content').forEach(page => {
        page.classList.remove('active');
    });
    
    document.querySelectorAll('.sidebar-menu li').forEach(item => {
        item.classList.remove('active');
    });
    
    document.getElementById(pageId).classList.add('active');
    event.currentTarget.classList.add('active');
    
    const pageTitle = {
        'admin-summary': 'Dashboard Admin',
        'admin-cutoff': 'Pengaturan Cutoff',
        'admin-import': 'Import Data Excel',
        'admin-rekap': 'Rekap Per Karyawan',
        'admin-kalender': 'Kalender Lembur',
        'admin-user': 'Manajemen User',
        'admin-whatsapp': 'WhatsApp Notifikasi'
    };
    
    document.getElementById('pageTitle').textContent = pageTitle[pageId];
    
    if (pageId === 'admin-rekap') {
        loadRekapKaryawan();
    } else if (pageId === 'admin-kalender') {
        loadKalender();
    } else if (pageId === 'admin-user') {
        loadUserTable();
    }
}

function loadAdminSummary() {
    document.getElementById('totalKaryawan').textContent = '45';
    document.getElementById('totalJam').textContent = '547 jam';
    document.getElementById('totalInsentif').textContent = 'Rp 8.205.000';
    document.getElementById('perluDicek').textContent = '5 data';
}

function loadRekapKaryawan() {
    fetch(API_URL + '?action=get_rekap_karyawan', {
        method: 'GET',
        mode: 'cors'
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            const tbody = document.querySelector('#rekapTable tbody');
            tbody.innerHTML = '';
            
            data.data.forEach(karyawan => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${karyawan.nik}</td>
                    <td>${karyawan.nama}</td>
                    <td>${karyawan.total_jam} jam</td>
                    <td>Rp ${karyawan.total_insentif.toLocaleString('id-ID')}</td>
                    <td><span style="color:${karyawan.status_konfirmasi === 'Sudah Dicek' ? 'green' : 'orange'};">${karyawan.status_konfirmasi === 'Sudah Dicek' ? '✅ Sudah Dicek' : '⚠️ Belum Dicek'}</span></td>
                    <td><button class="btn-secondary" onclick="viewKaryawanDetail('${karyawan.nik}')">Lihat</button></td>
                `;
                tbody.appendChild(row);
            });
        }
    })
    .catch(error => {
        console.error('Error loading rekap:', error);
    });
}

function loadKalender() {
    const container = document.getElementById('kalenderContainer');
    container.innerHTML = '<p>Loading...</p>';
    
    container.innerHTML = `
        <div class="kalender-month">
            <h3>Anton Susilo (00002)</h3>
            <div class="kalender-grid">
                <div class="kalender-header">Min</div>
                <div class="kalender-header">Sen</div>
                <div class="kalender-header">Sel</div>
                <div class="kalender-header">Rab</div>
                <div class="kalender-header">Kam</div>
                <div class="kalender-header">Jum</div>
                <div class="kalender-header">Sab</div>
                
                <div class="kalender-day empty"></div>
                <div class="kalender-day empty"></div>
                <div class="kalender-day empty"></div>
                <div class="kalender-day">1</div>
                <div class="kalender-day">2</div>
                <div class="kalender-day">3</div>
                <div class="kalender-day hari-libur has-lembur" data-jam="3">4</div>
                
                <div class="kalender-day hari-libur has-lembur" data-jam="3">5</div>
                <div class="kalender-day">6</div>
                <div class="kalender-day">7</div>
                <div class="kalender-day">8</div>
                <div class="kalender-day">9</div>
                <div class="kalender-day">10</div>
                <div class="kalender-day hari-libur has-lembur" data-jam="7">11</div>
                
                <div class="kalender-day">12</div>
                <div class="kalender-day">13</div>
                <div class="kalender-day">14</div>
                <div class="kalender-day">15</div>
                <div class="kalender-day">16</div>
                <div class="kalender-day">17</div>
                <div class="kalender-day hari-libur has-lembur" data-jam="7">18</div>
            </div>
        </div>
    `;
}

function loadUserTable() {
    const tbody = document.querySelector('#userTable tbody');
    tbody.innerHTML = `
        <tr>
            <td>admin</td>
            <td>Admin HR</td>
            <td>Admin</td>
            <td>081234567890</td>
            <td><span style="color:green;">✅ Aktif</span></td>
            <td><button class="btn-secondary">Reset Password</button></td>
        </tr>
        <tr>
            <td>00002</td>
            <td>Anton Susilo</td>
            <td>Karyawan</td>
            <td>081234567891</td>
            <td><span style="color:green;">✅ Aktif</span></td>
            <td><button class="btn-secondary">Reset Password</button></td>
        </tr>
    `;
}

function showAddUserModal() {
    alert('Fitur tambah user akan diimplementasikan');
}

function previewImport() {
    const data = document.getElementById('importData').value;
    alert('Preview:\n\n' + data.substring(0, 200) + '...');
}

function processImport() {
    alert('Fitur import akan diimplementasikan');
}

function sendWhatsAppAll() {
    const message = document.getElementById('whatsappMessageAll').value;
    if (!message) {
        alert('Pesan tidak boleh kosong!');
        return;
    }
    alert('Mengirim WhatsApp ke semua karyawan...\n\n' + message);
}

function sendWhatsApp() {
    const target = document.getElementById('whatsappTarget').value;
    const message = document.getElementById('whatsappMessage').value;
    
    if (!target || !message) {
        alert('Pilih karyawan dan isi pesan!');
        return;
    }
    
    alert(`Mengirim WhatsApp ke ${target}...\n\n${message}`);
}

// ============================================
// KARYAWAN FUNCTIONS
// ============================================

function showKaryawanPage(pageId) {
    document.querySelectorAll('.page-content').forEach(page => {
        page.classList.remove('active');
    });
    
    document.querySelectorAll('.sidebar-menu li').forEach(item => {
        item.classList.remove('active');
    });
    
    document.getElementById(pageId).classList.add('active');
    event.currentTarget.classList.add('active');
    
    const pageTitle = {
        'karyawan-rekap': 'Rekap Lembur',
        'karyawan-detail': 'Detail Lembur',
        'karyawan-kalender': 'Kalender Lembur',
        'karyawan-password': 'Ganti Password'
    };
    
    document.getElementById('karyawanPageTitle').textContent = pageTitle[pageId];
    
    if (pageId === 'karyawan-detail') {
        loadKaryawanDetail();
    } else if (pageId === 'karyawan-kalender') {
        loadKaryawanKalender();
    }
}

function loadKaryawanData() {
    fetch(API_URL + '?action=get_lembur_by_nik&nik=' + encodeURIComponent(currentUser.nik), {
        method: 'GET',
        mode: 'cors'
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            document.getElementById('karyawanTotalJam').textContent = data.summary.total_jam + ' jam';
            document.getElementById('karyawanTotalInsentif').textContent = 'Rp ' + data.summary.total_insentif.toLocaleString('id-ID');
        }
    })
    .catch(error => {
        console.error('Error loading karyawan data:', error);
    });
}

function loadKaryawanDetail() {
    fetch(API_URL + '?action=get_lembur_by_nik&nik=' + encodeURIComponent(currentUser.nik), {
        method: 'GET',
        mode: 'cors'
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            const tbody = document.querySelector('#karyawanDetailTable tbody');
            tbody.innerHTML = '';
            
            data.data.forEach(lembur => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${lembur.tanggal}</td>
                    <td>${lembur.jenis_lembur}</td>
                    <td>${lembur.jam_angka} jam</td>
                    <td>Rp ${lembur.insentif.toLocaleString('id-ID')}</td>
                    <td><span style="color:${lembur.status_konfirmasi === 'Sesuai' ? 'green' : 'orange'};">${lembur.status_konfirmasi === 'Sesuai' ? '✅ Sesuai' : '⚠️ Belum Dicek'}</span></td>
                `;
                tbody.appendChild(row);
            });
        }
    })
    .catch(error => {
        console.error('Error loading detail:', error);
    });
}

function loadKaryawanKalender() {
    const container = document.getElementById('karyawanKalenderContainer');
    container.innerHTML = '<p>Loading...</p>';
    
    container.innerHTML = `
        <div class="kalender-month">
            <h3>Januari 2026</h3>
            <div class="kalender-grid">
                <div class="kalender-header">Min</div>
                <div class="kalender-header">Sen</div>
                <div class="kalender-header">Sel</div>
                <div class="kalender-header">Rab</div>
                <div class="kalender-header">Kam</div>
                <div class="kalender-header">Jum</div>
                <div class="kalender-header">Sab</div>
                
                <div class="kalender-day empty"></div>
                <div class="kalender-day empty"></div>
                <div class="kalender-day empty"></div>
                <div class="kalender-day">1</div>
                <div class="kalender-day">2</div>
                <div class="kalender-day">3</div>
                <div class="kalender-day hari-libur has-lembur" data-jam="3">4</div>
                
                <div class="kalender-day hari-libur has-lembur" data-jam="3">5</div>
                <div class="kalender-day">6</div>
                <div class="kalender-day">7</div>
                <div class="kalender-day">8</div>
                <div class="kalender-day">9</div>
                <div class="kalender-day">10</div>
                <div class="kalender-day hari-libur has-lembur" data-jam="7">11</div>
                
                <div class="kalender-day">12</div>
                <div class="kalender-day">13</div>
                <div class="kalender-day">14</div>
                <div class="kalender-day">15</div>
                <div class="kalender-day">16</div>
                <div class="kalender-day">17</div>
                <div class="kalender-day hari-libur has-lembur" data-jam="7">18</div>
            </div>
        </div>
    `;
}

function konfirmasiLembur() {
    if (confirm('Apakah Anda yakin sudah mengecek semua data lembur Anda?')) {
        alert('Konfirmasi berhasil! Data lembur Anda telah dicentang sebagai "Sudah Dicek".');
    }
}

function changePassword() {
    const oldPass = document.getElementById('oldPassword').value;
    const newPass = document.getElementById('newPassword').value;
    const confirmPass = document.getElementById('confirmPassword').value;
    
    if (!oldPass || !newPass || !confirmPass) {
        alert('Semua field harus diisi!');
        return;
    }
    
    if (newPass !== confirmPass) {
        alert('Password baru dan konfirmasi tidak sama!');
        return;
    }
    
    if (newPass.length < 3) {
        alert('Password minimal 3 karakter!');
        return;
    }
    
    alert('Password berhasil diubah!');
    document.getElementById('oldPassword').value = '';
    document.getElementById('newPassword').value = '';
    document.getElementById('confirmPassword').value = '';
}

// ============================================
// LOGOUT
// ============================================

function logout() {
    if (confirm('Apakah Anda yakin ingin logout?')) {
        localStorage.removeItem('lemburUser');
        currentUser = null;
        
        document.getElementById('loginPage').style.display = 'flex';
        document.getElementById('adminDashboard').style.display = 'none';
        document.getElementById('karyawanDashboard').style.display = 'none';
        
        document.getElementById('nik').value = '';
        document.getElementById('password').value = '';
    }
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

function viewKaryawanDetail(nik) {
    alert(`Menampilkan detail lembur untuk NIK: ${nik}`);
}
