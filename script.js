// ============================================
// LEMBUR LABORATORIUM - JAVASCRIPT
// GANTI URL DI BAWAH INI DENGAN URL APPS SCRIPT ANDA
// ============================================

const API_URL = 'https://script.google.com/macros/s/AKfycbz-COCy9uDph2GudVymqp87ob59umuy_uPKA0wRqgAz5VEWm0uqEeFZN5DD1qIZoQNezw/exec'; // Contoh: https://script.google.com/macros/s/xxxxxxxxxx/exec

// Global Variables
let currentUser = null;
let cutoffData = null;

// ============================================
// INITIALIZATION
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    showLoading(true);
    
    // Cek user di localStorage
    const savedUser = localStorage.getItem('lemburUser');
    if (savedUser) {
        try {
            currentUser = JSON.parse(savedUser);
            // Cek session masih valid
            checkSession();
        } catch (e) {
            localStorage.removeItem('lemburUser');
            showLoading(false);
        }
    } else {
        showLoading(false);
    }
    
    updateTime();
    setInterval(updateTime, 1000);
    
    loadCutoff();
    
    // Event listeners
    document.getElementById('btnLogin').addEventListener('click', login);
    document.getElementById('password').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') login();
    });
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
    
    const timeElements = document.querySelectorAll('#currentTime, #karyawanCurrentTime');
    timeElements.forEach(el => {
        if (el) el.textContent = `${dateString}, ${timeString}`;
    });
}

function showLoading(show) {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) overlay.style.display = show ? 'flex' : 'none';
}

function checkSession() {
    fetch(API_URL + '?action=get_cutoff', {
        method: 'GET',
        mode: 'cors'
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            loadDashboard();
        } else {
            localStorage.removeItem('lemburUser');
            currentUser = null;
            showLoading(false);
        }
    })
    .catch(error => {
        localStorage.removeItem('lemburUser');
        currentUser = null;
        showLoading(false);
    });
}

// ============================================
// LOGIN FUNCTION
// ============================================

function login() {
    const nik = document.getElementById('nik').value.trim();
    const password = document.getElementById('password').value.trim();
    
    if (!nik || !password) {
        showLoginMessage('NIK dan Password harus diisi!', 'error');
        return;
    }
    
    showLoading(true);
    
    // Gunakan POST request
    const requestData = {
        action: 'login',
        nik: nik,
        password: password
    };
    
    fetch(API_URL, {
        method: 'POST',
        mode: 'cors',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestData)
    })
    .then(response => response.json())
    .then(data => {
        handleLoginResponse(data);
    })
    .catch(error => {
        // Fallback ke GET request
        fetch(API_URL + '?action=login&nik=' + encodeURIComponent(nik) + '&password=' + encodeURIComponent(password))
        .then(response => response.json())
        .then(data => {
            handleLoginResponse(data);
        })
        .catch(err => {
            showLoading(false);
            showLoginMessage('Tidak dapat terhubung ke server: ' + err.message, 'error');
        });
    });
}

function handleLoginResponse(data) {
    showLoading(false);
    
    if (data.success) {
        currentUser = data.data;
        localStorage.setItem('lemburUser', JSON.stringify(currentUser));
        showLoginMessage('Login berhasil!', 'success');
        
        setTimeout(() => {
            loadDashboard();
        }, 500);
    } else {
        showLoginMessage(data.message || 'Login gagal', 'error');
    }
}

function showLoginMessage(message, type) {
    const msgDiv = document.getElementById('loginMessage');
    if (msgDiv) {
        msgDiv.textContent = message;
        msgDiv.className = `login-message ${type}`;
        setTimeout(() => {
            msgDiv.textContent = '';
            msgDiv.className = 'login-message';
        }, 5000);
    }
}

// ============================================
// DASHBOARD LOADING
// ============================================

function loadDashboard() {
    document.getElementById('loginPage').style.display = 'none';
    
    if (currentUser.role === 'Admin') {
        loadAdminDashboard();
    } else {
        loadKaryawanDashboard();
    }
}

function loadAdminDashboard() {
    document.getElementById('adminDashboard').style.display = 'flex';
    document.getElementById('karyawanDashboard').style.display = 'none';
    
    document.getElementById('adminName').textContent = currentUser.nama;
    
    loadAdminSummary();
}

function loadKaryawanDashboard() {
    document.getElementById('karyawanDashboard').style.display = 'flex';
    document.getElementById('adminDashboard').style.display = 'none';
    
    document.getElementById('karyawanName').textContent = currentUser.nama;
    document.getElementById('karyawanNama').textContent = currentUser.nama;
    document.getElementById('karyawanNIK').textContent = currentUser.nik;
    
    loadKaryawanData();
}

// ============================================
// CUTOFF FUNCTIONS
// ============================================

function loadCutoff() {
    fetch(API_URL + '?action=get_cutoff')
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            cutoffData = data.data;
            updateCutoffDisplay();
        }
    })
    .catch(error => {
        console.error('Error loading cutoff:', error);
    });
}

function updateCutoffDisplay() {
    if (cutoffData) {
        const adminPeriod = document.getElementById('cutoffPeriod');
        const karyawanPeriod = document.getElementById('karyawanCutoffPeriod');
        
        if (adminPeriod) {
            adminPeriod.textContent = `Periode: ${cutoffData.cutoff_awal} - ${cutoffData.cutoff_akhir}`;
        }
        if (karyawanPeriod) {
            karyawanPeriod.textContent = `Periode: ${cutoffData.cutoff_awal} - ${cutoffData.cutoff_akhir}`;
        }
    }
}

// ============================================
// ADMIN FUNCTIONS
// ============================================

function showPage(pageId) {
    // Hide all pages
    document.querySelectorAll('.page-content').forEach(page => {
        page.classList.remove('active');
    });
    
    // Remove active from all menu items
    document.querySelectorAll('.sidebar-menu li').forEach(item => {
        item.classList.remove('active');
    });
    
    // Show selected page
    const pageElement = document.getElementById(pageId);
    if (pageElement) {
        pageElement.classList.add('active');
    }
    
    // Set active menu item
    const clickedElement = event.currentTarget;
    if (clickedElement) {
        clickedElement.classList.add('active');
    }
    
    // Update page title
    const pageTitles = {
        'admin-summary': 'Dashboard Admin',
        'admin-cutoff': 'Pengaturan Cutoff',
        'admin-import': 'Import Data Excel',
        'admin-rekap': 'Rekap Per Karyawan',
        'admin-kalender': 'Kalender Lembur',
        'admin-user': 'Manajemen User',
        'admin-whatsapp': 'WhatsApp Notifikasi'
    };
    
    const pageTitleElement = document.getElementById('pageTitle');
    if (pageTitleElement) {
        pageTitleElement.textContent = pageTitles[pageId] || 'Dashboard';
    }
    
    // Load data for specific pages
    if (pageId === 'admin-summary') {
        loadAdminSummary();
    } else if (pageId === 'admin-rekap') {
        loadRekapKaryawan();
    } else if (pageId === 'admin-user') {
        loadUserTable();
    }
}

function loadAdminSummary() {
    // Load summary data
    fetch(API_URL + '?action=get_rekap_karyawan')
    .then(response => response.json())
    .then(data => {
        if (data.success && data.data) {
            const totalKaryawan = data.data.length;
            const totalJam = data.data.reduce((sum, k) => sum + (k.total_jam || 0), 0);
            const totalInsentif = data.data.reduce((sum, k) => sum + (k.total_insentif || 0), 0);
            const perluDicek = data.data.filter(k => k.status_konfirmasi !== 'Sudah Dicek').length;
            
            document.getElementById('totalKaryawan').textContent = totalKaryawan;
            document.getElementById('totalJam').textContent = totalJam + ' jam';
            document.getElementById('totalInsentif').textContent = 'Rp ' + totalInsentif.toLocaleString('id-ID');
            document.getElementById('perluDicek').textContent = perluDicek + ' data';
        }
    })
    .catch(error => {
        console.error('Error loading admin summary:', error);
    });
}

function loadRekapKaryawan() {
    const tbody = document.querySelector('#rekapTable tbody');
    if (!tbody) return;
    
    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;">Loading...</td></tr>';
    
    fetch(API_URL + '?action=get_rekap_karyawan')
    .then(response => response.json())
    .then(data => {
        if (data.success && data.data) {
            tbody.innerHTML = '';
            
            if (data.data.length === 0) {
                tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;">Tidak ada data</td></tr>';
                return;
            }
            
            data.data.forEach(karyawan => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${karyawan.nik || '-'}</td>
                    <td>${karyawan.nama || '-'}</td>
                    <td>${karyawan.total_jam || 0} jam</td>
                    <td>Rp ${(karyawan.total_insentif || 0).toLocaleString('id-ID')}</td>
                    <td><span style="color:${karyawan.status_konfirmasi === 'Sudah Dicek' ? 'green' : 'orange'};">${karyawan.status_konfirmasi === 'Sudah Dicek' ? '✅ Sudah Dicek' : '⚠️ Belum Dicek'}</span></td>
                    <td><button class="btn-secondary" onclick="viewKaryawanDetail('${karyawan.nik || ''}')">Lihat</button></td>
                `;
                tbody.appendChild(row);
            });
        } else {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;color:red;">' + (data.message || 'Error loading data') + '</td></tr>';
        }
    })
    .catch(error => {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;color:red;">Connection error</td></tr>';
        console.error('Error loading rekap:', error);
    });
}

function loadUserTable() {
    const tbody = document.querySelector('#userTable tbody');
    if (!tbody) return;
    
    tbody.innerHTML = `
        <tr>
            <td colspan="6" style="text-align:center;">Loading...</td>
        </tr>
    `;
    
    // Simulasi data user (akan diintegrasikan dengan backend nanti)
    setTimeout(() => {
        tbody.innerHTML = `
            <tr>
                <td>admin</td>
                <td>Admin HR</td>
                <td>Admin</td>
                <td>0895397978257</td>
                <td><span style="color:green;">✅ Aktif</span></td>
                <td><button class="btn-secondary" onclick="resetUserPassword('admin')">Reset Password</button></td>
            </tr>
            <tr>
                <td>08003</td>
                <td>Aris Sulistyo</td>
                <td>Karyawan</td>
                <td>0895397978257</td>
                <td><span style="color:green;">✅ Aktif</span></td>
                <td><button class="btn-secondary" onclick="resetUserPassword('08003')">Reset Password</button></td>
            </tr>
        `;
    }, 500);
}

function showAddUserModal() {
    alert('Fitur tambah user akan diimplementasikan');
}

function resetUserPassword(nik) {
    const newPassword = prompt('Masukkan password baru untuk NIK ' + nik + ':');
    if (newPassword && newPassword.length >= 3) {
        const requestData = {
            action: 'reset_password',
            target_nik: nik,
            new_password: newPassword
        };
        
        fetch(API_URL, {
            method: 'POST',
            mode: 'cors',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestData)
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                alert('Password berhasil direset untuk ' + nik);
            } else {
                alert('Gagal reset password: ' + data.message);
            }
        })
        .catch(error => {
            alert('Error: ' + error.message);
        });
    }
}

// ============================================
// IMPORT FUNCTIONS
// ============================================

function previewImport() {
    const data = document.getElementById('importData').value;
    if (!data.trim()) {
        alert('Data tidak boleh kosong!');
        return;
    }
    
    // Parse data (format: tab separated)
    const rows = data.split('\n').filter(row => row.trim());
    const previewRows = rows.slice(0, 5);
    
    alert('Preview (5 baris pertama):\n\n' + previewRows.join('\n'));
}

function processImport() {
    const dataText = document.getElementById('importData').value;
    if (!dataText.trim()) {
        alert('Data tidak boleh kosong!');
        return;
    }
    
    // Parse data ke array
    const rows = dataText.split('\n').filter(row => row.trim());
    const data = rows.map(row => row.split('\t'));
    
    if (data.length === 0) {
        alert('Format data tidak valid!');
        return;
    }
    
    if (confirm(`Akan mengimport ${data.length} baris data. Lanjutkan?`)) {
        showLoading(true);
        
        const requestData = {
            action: 'import_data',
            data: data
        };
        
        fetch(API_URL, {
            method: 'POST',
            mode: 'cors',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestData)
        })
        .then(response => response.json())
        .then(data => {
            showLoading(false);
            if (data.success) {
                alert(`Import berhasil!\nInserted: ${data.data.inserted}\nUpdated: ${data.data.updated}`);
                document.getElementById('importData').value = '';
            } else {
                alert('Import gagal: ' + data.message);
            }
        })
        .catch(error => {
            showLoading(false);
            alert('Error: ' + error.message);
        });
    }
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
    
    const pageElement = document.getElementById(pageId);
    if (pageElement) {
        pageElement.classList.add('active');
    }
    
    const clickedElement = event.currentTarget;
    if (clickedElement) {
        clickedElement.classList.add('active');
    }
    
    const pageTitles = {
        'karyawan-rekap': 'Rekap Lembur',
        'karyawan-detail': 'Detail Lembur',
        'karyawan-kalender': 'Kalender Lembur',
        'karyawan-password': 'Ganti Password'
    };
    
    const pageTitleElement = document.getElementById('karyawanPageTitle');
    if (pageTitleElement) {
        pageTitleElement.textContent = pageTitles[pageId] || 'Rekap Lembur';
    }
    
    if (pageId === 'karyawan-detail') {
        loadKaryawanDetail();
    }
}

function loadKaryawanData() {
    if (!currentUser) return;
    
    const requestData = {
        action: 'get_lembur_by_nik',
        nik: currentUser.nik
    };
    
    fetch(API_URL, {
        method: 'POST',
        mode: 'cors',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestData)
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            document.getElementById('karyawanTotalJam').textContent = data.summary.total_jam + ' jam';
            document.getElementById('karyawanTotalInsentif').textContent = 
                'Rp ' + data.summary.total_insentif.toLocaleString('id-ID');
        }
    })
    .catch(error => {
        console.error('Error loading karyawan data:', error);
    });
}

function loadKaryawanDetail() {
    if (!currentUser) return;
    
    const tbody = document.querySelector('#karyawanDetailTable tbody');
    if (!tbody) return;
    
    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;">Loading...</td></tr>';
    
    const requestData = {
        action: 'get_lembur_by_nik',
        nik: currentUser.nik
    };
    
    fetch(API_URL, {
        method: 'POST',
        mode: 'cors',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestData)
    })
    .then(response => response.json())
    .then(data => {
        if (data.success && data.data) {
            tbody.innerHTML = '';
            
            if (data.data.length === 0) {
                tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;">Tidak ada data lembur</td></tr>';
                return;
            }
            
            data.data.forEach(lembur => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${lembur.tanggal || '-'}</td>
                    <td>${lembur.jenis_lembur || '-'}</td>
                    <td>${lembur.jam_angka || 0} jam</td>
                    <td>Rp ${(lembur.insentif || 0).toLocaleString('id-ID')}</td>
                    <td><span style="color:${lembur.status_konfirmasi === 'Sesuai' ? 'green' : 'orange'};">${lembur.status_konfirmasi === 'Sesuai' ? '✅ Sesuai' : '⚠️ Belum Dicek'}</span></td>
                `;
                tbody.appendChild(row);
            });
        } else {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;color:red;">' + (data.message || 'Error loading data') + '</td></tr>';
        }
    })
    .catch(error => {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;color:red;">Connection error</td></tr>';
        console.error('Error loading detail:', error);
    });
}

function konfirmasiLembur() {
    if (!currentUser || !cutoffData) {
        alert('Data user atau cutoff tidak tersedia');
        return;
    }
    
    if (confirm('Apakah Anda yakin data lembur Anda sudah sesuai?')) {
        const requestData = {
            action: 'update_konfirmasi',
            nik: currentUser.nik,
            tanggal: cutoffData.cutoff_awal
        };
        
        fetch(API_URL, {
            method: 'POST',
            mode: 'cors',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestData)
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                alert('Konfirmasi berhasil! Data lembur Anda telah dicentang sebagai "Sesuai".');
            } else {
                alert('Gagal mengkonfirmasi: ' + data.message);
            }
        })
        .catch(error => {
            alert('Tidak dapat terhubung ke server');
        });
    }
}

function changePassword() {
    const oldPass = document.getElementById('oldPassword').value.trim();
    const newPass = document.getElementById('newPassword').value.trim();
    const confirmPass = document.getElementById('confirmPassword').value.trim();
    
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
    
    const requestData = {
        action: 'change_password',
        nik: currentUser.nik,
        old_password: oldPass,
        new_password: newPass
    };
    
    fetch(API_URL, {
        method: 'POST',
        mode: 'cors',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestData)
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            alert('Password berhasil diubah!');
            document.getElementById('oldPassword').value = '';
            document.getElementById('newPassword').value = '';
            document.getElementById('confirmPassword').value = '';
        } else {
            alert('Gagal mengubah password: ' + data.message);
        }
    })
    .catch(error => {
        alert('Tidak dapat terhubung ke server');
    });
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

function viewKaryawanDetail(nik) {
    alert(`Menampilkan detail lembur untuk NIK: ${nik}`);
}

function loadKalender() {
    const container = document.getElementById('kalenderContainer');
    if (!container) return;
    
    container.innerHTML = '<p>Loading kalender...</p>';
    
    // Simulasi kalender
    setTimeout(() => {
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
                </div>
            </div>
        `;
    }, 500);
}

function loadKaryawanKalender() {
    const container = document.getElementById('karyawanKalenderContainer');
    if (!container) return;
    
    container.innerHTML = '<p>Loading kalender...</p>';
    
    // Simulasi kalender
    setTimeout(() => {
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
                </div>
            </div>
        `;
    }, 500);
}

function sendWhatsAppAll() {
    const message = document.getElementById('whatsappMessageAll').value.trim();
    if (!message) {
        alert('Pesan tidak boleh kosong!');
        return;
    }
    
    alert('Fitur WhatsApp ke semua karyawan akan diimplementasikan\n\nPesan: ' + message);
}

function sendWhatsApp() {
    const target = document.getElementById('whatsappTarget').value;
    const message = document.getElementById('whatsappMessage').value.trim();
    
    if (!target || !message) {
        alert('Pilih karyawan dan isi pesan!');
        return;
    }
    
    alert(`Fitur WhatsApp akan diimplementasikan\n\nKepada: ${target}\n\nPesan: ${message}`);
}

function saveCutoff() {
    const bulanGaji = document.getElementById('bulanGaji').value;
    const cutoffAwal = document.getElementById('cutoffAwal').value;
    const cutoffAkhir = document.getElementById('cutoffAkhir').value;
    
    if (!bulanGaji || !cutoffAwal || !cutoffAkhir) {
        alert('Semua field harus diisi!');
        return;
    }
    
    alert(`Cutoff disimpan:\nBulan: ${bulanGaji}\nAwal: ${cutoffAwal}\nAkhir: ${cutoffAkhir}`);
}

// ============================================
// LOGOUT
// ============================================

function logout() {
    if (confirm('Apakah Anda yakin ingin logout?')) {
        localStorage.removeItem('lemburUser');
        currentUser = null;
        cutoffData = null;
        
        document.getElementById('loginPage').style.display = 'flex';
        document.getElementById('adminDashboard').style.display = 'none';
        document.getElementById('karyawanDashboard').style.display = 'none';
        
        document.getElementById('nik').value = '';
        document.getElementById('password').value = '';
        
        showLoginMessage('Anda telah logout', 'success');
    }
}
