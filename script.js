// GANTI DENGAN WEB APP URL ANDA SETELAH DEPLOY
// Dapatkan URL dari: Deploy > Deploy as web app > Copy URL
const API_URL = 'GANTI_DENGAN_URL_APPS_SCRIPT_ANDA'; // Harus disesuaikan

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
        try {
            currentUser = JSON.parse(savedUser);
            // Verifikasi user masih valid
            fetch(API_URL + '?action=get_cutoff', {
                method: 'GET',
                mode: 'no-cors'
            })
            .then(() => {
                loadDashboard();
            })
            .catch(() => {
                localStorage.removeItem('lemburUser');
                currentUser = null;
                showLoading(false);
            });
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
});

// ============================================
// LOGIN FUNCTION - PERBAIKAN UTAMA
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
    const password = document.getElementById('password').value.trim();
    
    if (!nik || !password) {
        showLoginMessage('NIK dan Password harus diisi!', 'error');
        return;
    }
    
    showLoading(true);
    
    // Menggunakan POST request untuk login (lebih aman)
    const requestData = {
        action: 'login',
        nik: nik,
        password: password
    };
    
    fetch(API_URL, {
        method: 'POST',
        mode: 'no-cors', // Ubah menjadi 'no-cors' untuk menghindari CORS issues
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestData)
    })
    .then(response => {
        // Dengan 'no-cors', kita tidak bisa membaca response body
        // Jadi kita perlu pendekatan alternatif
        return response.text();
    })
    .then(text => {
        try {
            const data = JSON.parse(text);
            handleLoginResponse(data);
        } catch (e) {
            // Jika gagal parse, coba GET request sebagai fallback
            fallbackLogin(nik, password);
        }
    })
    .catch(error => {
        console.error('Login POST error:', error);
        fallbackLogin(nik, password);
    });
}

function fallbackLogin(nik, password) {
    // Fallback menggunakan GET request
    fetch(API_URL + '?action=login&nik=' + encodeURIComponent(nik) + '&password=' + encodeURIComponent(password), {
        method: 'GET',
        mode: 'no-cors'
    })
    .then(response => response.text())
    .then(text => {
        try {
            const data = JSON.parse(text);
            handleLoginResponse(data);
        } catch (e) {
            showLoading(false);
            showLoginMessage('Terjadi kesalahan dalam komunikasi dengan server', 'error');
        }
    })
    .catch(error => {
        showLoading(false);
        showLoginMessage('Tidak dapat terhubung ke server: ' + error.message, 'error');
    });
}

function handleLoginResponse(data) {
    showLoading(false);
    
    if (data.success) {
        currentUser = data.data;
        localStorage.setItem('lemburUser', JSON.stringify(currentUser));
        showLoginMessage('Login berhasil!', 'success');
        
        // Tunggu sebentar sebelum redirect
        setTimeout(() => {
            loadDashboard();
        }, 500);
    } else {
        showLoginMessage(data.message || 'Login gagal', 'error');
    }
}

function showLoginMessage(message, type) {
    const msgDiv = document.getElementById('loginMessage');
    msgDiv.textContent = message;
    msgDiv.className = `login-message ${type}`;
}

// ============================================
// PERBAIKAN FUNGSI LAINNYA
// ============================================

function loadCutoff() {
    fetch(API_URL + '?action=get_cutoff', {
        method: 'GET',
        mode: 'no-cors'
    })
    .then(response => response.text())
    .then(text => {
        try {
            const data = JSON.parse(text);
            if (data.success) {
                cutoffData = data.data;
                updateCutoffDisplay();
            }
        } catch (e) {
            console.error('Error parsing cutoff data:', e);
        }
    })
    .catch(error => {
        console.error('Error loading cutoff:', error);
    });
}

function updateCutoffDisplay() {
    if (cutoffData) {
        // Update untuk admin dashboard
        if (document.getElementById('cutoffPeriod')) {
            document.getElementById('cutoffPeriod').textContent = 
                `Periode: ${cutoffData.cutoff_awal} - ${cutoffData.cutoff_akhir}`;
        }
        
        // Update untuk karyawan dashboard
        if (document.getElementById('karyawanCutoffPeriod')) {
            document.getElementById('karyawanCutoffPeriod').textContent = 
                `Periode: ${cutoffData.cutoff_awal} - ${cutoffData.cutoff_akhir}`;
        }
    }
}

// ============================================
// PERBAIKAN FUNGSI KARYAWAN
// ============================================

function loadKaryawanData() {
    if (!currentUser) return;
    
    const requestData = {
        action: 'get_lembur_by_nik',
        nik: currentUser.nik
    };
    
    fetch(API_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestData)
    })
    .then(response => response.text())
    .then(text => {
        try {
            const data = JSON.parse(text);
            if (data.success) {
                document.getElementById('karyawanTotalJam').textContent = data.summary.total_jam + ' jam';
                document.getElementById('karyawanTotalInsentif').textContent = 
                    'Rp ' + data.summary.total_insentif.toLocaleString('id-ID');
            }
        } catch (e) {
            console.error('Error parsing karyawan data:', e);
        }
    })
    .catch(error => {
        console.error('Error loading karyawan data:', error);
    });
}

// ============================================
// FUNGSI KONFIRMASI LEMBUR
// ============================================

function konfirmasiLembur() {
    if (!currentUser || !cutoffData) {
        alert('Data user atau cutoff tidak tersedia');
        return;
    }
    
    if (confirm('Apakah Anda yakin sudah mengecek semua data lembur Anda?')) {
        const requestData = {
            action: 'update_konfirmasi',
            nik: currentUser.nik,
            tanggal: cutoffData.cutoff_awal // Menggunakan tanggal cutoff awal
        };
        
        fetch(API_URL, {
            method: 'POST',
            mode: 'no-cors',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestData)
        })
        .then(response => response.text())
        .then(text => {
            try {
                const data = JSON.parse(text);
                if (data.success) {
                    alert('Konfirmasi berhasil! Data lembur Anda telah dicentang sebagai "Sesuai".');
                } else {
                    alert('Gagal mengkonfirmasi: ' + data.message);
                }
            } catch (e) {
                alert('Terjadi kesalahan saat memproses konfirmasi');
            }
        })
        .catch(error => {
            alert('Tidak dapat terhubung ke server');
        });
    }
}

// ============================================
// FUNGSI GANTI PASSWORD
// ============================================

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
        mode: 'no-cors',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestData)
    })
    .then(response => response.text())
    .then(text => {
        try {
            const data = JSON.parse(text);
            if (data.success) {
                alert('Password berhasil diubah!');
                document.getElementById('oldPassword').value = '';
                document.getElementById('newPassword').value = '';
                document.getElementById('confirmPassword').value = '';
            } else {
                alert('Gagal mengubah password: ' + data.message);
            }
        } catch (e) {
            alert('Terjadi kesalahan saat mengubah password');
        }
    })
    .catch(error => {
        alert('Tidak dapat terhubung ke server');
    });
}

// ============================================
// FUNGSI REKAP KARYAWAN (ADMIN)
// ============================================

function loadRekapKaryawan() {
    fetch(API_URL + '?action=get_rekap_karyawan', {
        method: 'GET',
        mode: 'no-cors'
    })
    .then(response => response.text())
    .then(text => {
        try {
            const data = JSON.parse(text);
            if (data.success) {
                const tbody = document.querySelector('#rekapTable tbody');
                tbody.innerHTML = '';
                
                if (data.data && data.data.length > 0) {
                    data.data.forEach(karyawan => {
                        const row = document.createElement('tr');
                        row.innerHTML = `
                            <td>${karyawan.nik || ''}</td>
                            <td>${karyawan.nama || ''}</td>
                            <td>${karyawan.total_jam || 0} jam</td>
                            <td>Rp ${(karyawan.total_insentif || 0).toLocaleString('id-ID')}</td>
                            <td><span style="color:${karyawan.status_konfirmasi === 'Sudah Dicek' ? 'green' : 'orange'};">${karyawan.status_konfirmasi === 'Sudah Dicek' ? '✅ Sudah Dicek' : '⚠️ Belum Dicek'}</span></td>
                            <td><button class="btn-secondary" onclick="viewKaryawanDetail('${karyawan.nik || ''}')">Lihat</button></td>
                        `;
                        tbody.appendChild(row);
                    });
                } else {
                    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;">Tidak ada data</td></tr>';
                }
            }
        } catch (e) {
            console.error('Error parsing rekap data:', e);
            const tbody = document.querySelector('#rekapTable tbody');
            tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;color:red;">Error loading data</td></tr>';
        }
    })
    .catch(error => {
        console.error('Error loading rekap:', error);
        const tbody = document.querySelector('#rekapTable tbody');
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;color:red;">Connection error</td></tr>';
    });
}
