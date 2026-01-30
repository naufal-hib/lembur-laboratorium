// ============================================
// LEMBUR LABORATORIUM - JAVASCRIPT
// GANTI URL DI BAWAH INI DENGAN URL APPS SCRIPT ANDA
// ============================================

const API_URL = 'https://script.google.com/macros/s/AKfycbzxk8J57o-VXjc1LYooWZrAXShad5xY3A0QErSd0PjwIYI4arOOX667MJYG7n6bYSmhRg/exec'; // GANTI DENGAN URL APPS SCRIPT ANDA

// Global Variables
let currentUser = null;
let cutoffData = null;

// ============================================
// UTILITY FUNCTIONS
// ============================================

function showLoading(show) {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) {
        overlay.style.display = show ? 'flex' : 'none';
    }
}

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
    const btnLogin = document.getElementById('btnLogin');
    const passwordInput = document.getElementById('password');
    
    if (btnLogin) {
        btnLogin.addEventListener('click', login);
    }
    
    if (passwordInput) {
        passwordInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') login();
        });
    }
});

function checkSession() {
    fetch(API_URL + '?action=get_cutoff', {
        method: 'GET',
        mode: 'cors'
    })
    .then(response => response.json())
    .then(data => {
        if (data && data.success) {
            loadDashboard();
        } else {
            localStorage.removeItem('lemburUser');
            currentUser = null;
            showLoading(false);
        }
    })
    .catch(error => {
        console.log('Session check error:', error);
        localStorage.removeItem('lemburUser');
        currentUser = null;
        showLoading(false);
    });
}

// ============================================
// LOGIN FUNCTION
// ============================================

function login() {
    const nikInput = document.getElementById('nik');
    const passwordInput = document.getElementById('password');
    
    if (!nikInput || !passwordInput) return;
    
    const nik = nikInput.value.trim();
    const password = passwordInput.value.trim();
    
    if (!nik || !password) {
        showLoginMessage('NIK dan Password harus diisi!', 'error');
        return;
    }
    
    showLoading(true);
    
    // Coba GET request dulu
    fetch(API_URL + '?action=login&nik=' + encodeURIComponent(nik) + '&password=' + encodeURIComponent(password))
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return response.json();
    })
    .then(data => {
        handleLoginResponse(data);
    })
    .catch(error => {
        console.log('GET login failed, trying POST:', error);
        // Fallback ke POST request
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
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            handleLoginResponse(data);
        })
        .catch(err => {
            showLoading(false);
            showLoginMessage('Tidak dapat terhubung ke server. Cek koneksi internet Anda.', 'error');
            console.error('Login error:', err);
        });
    });
}

function handleLoginResponse(data) {
    showLoading(false);
    
    if (data && data.success) {
        currentUser = data.data;
        localStorage.setItem('lemburUser', JSON.stringify(currentUser));
        showLoginMessage('Login berhasil!', 'success');
        
        setTimeout(() => {
            loadDashboard();
        }, 500);
    } else {
        showLoginMessage(data?.message || 'Login gagal. Periksa NIK dan password.', 'error');
    }
}

// ============================================
// DASHBOARD LOADING
// ============================================

function loadDashboard() {
    const loginPage = document.getElementById('loginPage');
    if (loginPage) loginPage.style.display = 'none';
    
    if (currentUser && currentUser.role === 'Admin') {
        loadAdminDashboard();
    } else {
        loadKaryawanDashboard();
    }
}

function loadAdminDashboard() {
    const adminDashboard = document.getElementById('adminDashboard');
    const karyawanDashboard = document.getElementById('karyawanDashboard');
    
    if (adminDashboard) adminDashboard.style.display = 'flex';
    if (karyawanDashboard) karyawanDashboard.style.display = 'none';
    
    const adminName = document.getElementById('adminName');
    if (adminName && currentUser) {
        adminName.textContent = currentUser.nama;
    }
    
    loadAdminSummary();
}

function loadKaryawanDashboard() {
    const adminDashboard = document.getElementById('adminDashboard');
    const karyawanDashboard = document.getElementById('karyawanDashboard');
    
    if (adminDashboard) adminDashboard.style.display = 'none';
    if (karyawanDashboard) karyawanDashboard.style.display = 'flex';
    
    const karyawanName = document.getElementById('karyawanName');
    const karyawanNama = document.getElementById('karyawanNama');
    const karyawanNIK = document.getElementById('karyawanNIK');
    
    if (currentUser) {
        if (karyawanName) karyawanName.textContent = currentUser.nama;
        if (karyawanNama) karyawanNama.textContent = currentUser.nama;
        if (karyawanNIK) karyawanNIK.textContent = currentUser.nik;
    }
    
    loadKaryawanData();
}

// ============================================
// CUTOFF FUNCTIONS
// ============================================

function loadCutoff() {
    fetch(API_URL + '?action=get_cutoff')
    .then(response => response.json())
    .then(data => {
        if (data && data.success) {
            cutoffData = data.data;
            updateCutoffDisplay();
        }
    })
    .catch(error => {
        console.error('Error loading cutoff:', error);
    });
}

function updateCutoffDisplay() {
    if (!cutoffData) return;
    
    const adminPeriod = document.getElementById('cutoffPeriod');
    const karyawanPeriod = document.getElementById('karyawanCutoffPeriod');
    
    if (adminPeriod) {
        adminPeriod.textContent = `Periode: ${cutoffData.cutoff_awal || '-'} - ${cutoffData.cutoff_akhir || '-'}`;
    }
    if (karyawanPeriod) {
        karyawanPeriod.textContent = `Periode: ${cutoffData.cutoff_awal || '-'} - ${cutoffData.cutoff_akhir || '-'}`;
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
        if (data && data.success && data.data) {
            const totalKaryawan = data.data.length;
            const totalJam = data.data.reduce((sum, k) => sum + (k.total_jam || 0), 0);
            const totalInsentif = data.data.reduce((sum, k) => sum + (k.total_insentif || 0), 0);
            const perluDicek = data.data.filter(k => k.status_konfirmasi !== 'Sudah Dicek').length;
            
            const totalKaryawanEl = document.getElementById('totalKaryawan');
            const totalJamEl = document.getElementById('totalJam');
            const totalInsentifEl = document.getElementById('totalInsentif');
            const perluDicekEl = document.getElementById('perluDicek');
            
            if (totalKaryawanEl) totalKaryawanEl.textContent = totalKaryawan;
            if (totalJamEl) totalJamEl.textContent = totalJam + ' jam';
            if (totalInsentifEl) totalInsentifEl.textContent = 'Rp ' + totalInsentif.toLocaleString('id-ID');
            if (perluDicekEl) perluDicekEl.textContent = perluDicek + ' data';
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
        if (data && data.success && data.data) {
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
            tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;color:red;">' + (data?.message || 'Error loading data') + '</td></tr>';
        }
    })
    .catch(error => {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;color:red;">Gagal memuat data</td></tr>';
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
    
    // Simulasi data user
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
            if (data && data.success) {
                alert('Password berhasil direset untuk ' + nik);
            } else {
                alert('Gagal reset password: ' + (data?.message || 'Unknown error'));
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
    const importData = document.getElementById('importData');
    if (!importData) return;
    
    const data = importData.value;
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
    const importData = document.getElementById('importData');
    if (!importData) return;
    
    const dataText = importData.value;
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
            if (data && data.success) {
                alert(`Import berhasil!\nInserted: ${data.data?.inserted || 0}\nUpdated: ${data.data?.updated || 0}`);
                importData.value = '';
            } else {
                alert('Import gagal: ' + (data?.message || 'Unknown error'));
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
    if (!currentUser || !currentUser.nik) return;
    
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
        if (data && data.success) {
            const totalJamEl = document.getElementById('karyawanTotalJam');
            const totalInsentifEl = document.getElementById('karyawanTotalInsentif');
            
            if (totalJamEl) totalJamEl.textContent = (data.summary?.total_jam || 0) + ' jam';
            if (totalInsentifEl) totalInsentifEl.textContent = 'Rp ' + (data.summary?.total_insentif || 0).toLocaleString('id-ID');
        }
    })
    .catch(error => {
        console.error('Error loading karyawan data:', error);
    });
}

function loadKaryawanDetail() {
    if (!currentUser || !currentUser.nik) return;
    
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
        if (data && data.success && data.data) {
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
            tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;color:red;">' + (data?.message || 'Error loading data') + '</td></tr>';
        }
    })
    .catch(error => {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;color:red;">Gagal memuat data</td></tr>';
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
            if (data && data.success) {
                alert('Konfirmasi berhasil! Data lembur Anda telah dicentang sebagai "Sesuai".');
            } else {
                alert('Gagal mengkonfirmasi: ' + (data?.message || 'Unknown error'));
            }
        })
        .catch(error => {
            alert('Tidak dapat terhubung ke server');
        });
    }
}

function changePassword() {
    const oldPass = document.getElementById('oldPassword');
    const newPass = document.getElementById('newPassword');
    const confirmPass = document.getElementById('confirmPassword');
    
    if (!oldPass || !newPass || !confirmPass) return;
    
    const oldPassword = oldPass.value.trim();
    const newPassword = newPass.value.trim();
    const confirmPassword = confirmPass.value.trim();
    
    if (!oldPassword || !newPassword || !confirmPassword) {
        alert('Semua field harus diisi!');
        return;
    }
    
    if (newPassword !== confirmPassword) {
        alert('Password baru dan konfirmasi tidak sama!');
        return;
    }
    
    if (newPassword.length < 3) {
        alert('Password minimal 3 karakter!');
        return;
    }
    
    const requestData = {
        action: 'change_password',
        nik: currentUser.nik,
        old_password: oldPassword,
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
        if (data && data.success) {
            alert('Password berhasil diubah!');
            oldPass.value = '';
            newPass.value = '';
            confirmPass.value = '';
        } else {
            alert('Gagal mengubah password: ' + (data?.message || 'Unknown error'));
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
    const messageInput = document.getElementById('whatsappMessageAll');
    if (!messageInput) return;
    
    const message = messageInput.value.trim();
    if (!message) {
        alert('Pesan tidak boleh kosong!');
        return;
    }
    
    alert('Fitur WhatsApp ke semua karyawan akan diimplementasikan\n\nPesan: ' + message);
}

function sendWhatsApp() {
    const targetSelect = document.getElementById('whatsappTarget');
    const messageInput = document.getElementById('whatsappMessage');
    
    if (!targetSelect || !messageInput) return;
    
    const target = targetSelect.value;
    const message = messageInput.value.trim();
    
    if (!target || !message) {
        alert('Pilih karyawan dan isi pesan!');
        return;
    }
    
    alert(`Fitur WhatsApp akan diimplementasikan\n\nKepada: ${target}\n\nPesan: ${message}`);
}

function saveCutoff() {
    const bulanGaji = document.getElementById('bulanGaji');
    const cutoffAwal = document.getElementById('cutoffAwal');
    const cutoffAkhir = document.getElementById('cutoffAkhir');
    
    if (!bulanGaji || !cutoffAwal || !cutoffAkhir) return;
    
    const bulanGajiValue = bulanGaji.value;
    const cutoffAwalValue = cutoffAwal.value;
    const cutoffAkhirValue = cutoffAkhir.value;
    
    if (!bulanGajiValue || !cutoffAwalValue || !cutoffAkhirValue) {
        alert('Semua field harus diisi!');
        return;
    }
    
    alert(`Cutoff disimpan:\nBulan: ${bulanGajiValue}\nAwal: ${cutoffAwalValue}\nAkhir: ${cutoffAkhirValue}`);
}

// ============================================
// LOGOUT
// ============================================

function logout() {
    if (confirm('Apakah Anda yakin ingin logout?')) {
        localStorage.removeItem('lemburUser');
        currentUser = null;
        cutoffData = null;
        
        const loginPage = document.getElementById('loginPage');
        const adminDashboard = document.getElementById('adminDashboard');
        const karyawanDashboard = document.getElementById('karyawanDashboard');
        
        if (loginPage) loginPage.style.display = 'flex';
        if (adminDashboard) adminDashboard.style.display = 'none';
        if (karyawanDashboard) karyawanDashboard.style.display = 'none';
        
        const nikInput = document.getElementById('nik');
        const passwordInput = document.getElementById('password');
        
        if (nikInput) nikInput.value = '';
        if (passwordInput) passwordInput.value = '';
        
        showLoginMessage('Anda telah logout', 'success');
    }
}
