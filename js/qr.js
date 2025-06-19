// Supabase bağlantı bilgileri
const SUPABASE_URL = 'https://dhtttamiovdlazacegem.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRodHR0YW1pb3ZkbGF6YWNlZ2VtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAzMzg4MTMsImV4cCI6MjA2NTkxNDgxM30.ILp4uQ8un0WBMMH0KmNAQPQ2_Z2swYLOvObYmMInsMA';

// Supabase istemcisini oluştur
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// DOM elementleri
const elements = {
    // Masa bilgisi
    tableDisplay: document.getElementById('tableDisplay'),
    
    // Menü kategorileri
    categoryContainer: document.getElementById('categoryContainer'),
    menuList: document.getElementById('menuList'),
    
    // Sipariş sepeti
    cartItems: document.getElementById('cartItems'),
    cartTotalSection: document.getElementById('cartTotalSection'),
    cartTotal: document.getElementById('cartTotal'),
    orderNote: document.getElementById('orderNote'),
    submitOrderBtn: document.getElementById('submitOrderBtn'),
    
    // Garson çağırma
    callWaiterBtn: document.getElementById('callWaiterBtn'),
    
    // Modaller
    orderSuccessModal: null, // Bootstrap ile başlatılacak
    waiterCallModal: null, // Bootstrap ile başlatılacak
    
    // Yükleniyor overlay
    loadingOverlay: document.getElementById('loadingOverlay')
};

// Uygulama durumu
const appState = {
    tableNumber: null,
    tableId: null,
    menuItems: [],
    categories: [],
    cart: [],
    activeCategory: 'all'
};

// Uygulama başlatma
document.addEventListener('DOMContentLoaded', () => {
    // Bootstrap modalları başlat
    elements.orderSuccessModal = new bootstrap.Modal(document.getElementById('orderSuccessModal'));
    elements.waiterCallModal = new bootstrap.Modal(document.getElementById('waiterCallModal'));
    
    initApp();
});

// Uygulama başlatma
async function initApp() {
    // URL'den masa numarasını al
    const urlParams = new URLSearchParams(window.location.search);
    const tableNumber = parseInt(urlParams.get('table'));
    
    if (isNaN(tableNumber) || tableNumber <= 0 || tableNumber > 100) {
        showError('Geçersiz masa numarası. Lütfen QR kodu tekrar tarayın.');
        return;
    }
    
    // Masa numarasını sakla ve göster
    appState.tableNumber = tableNumber;
    elements.tableDisplay.textContent = `Masa ${tableNumber}`;
    
    try {
        // Masa bilgisini kontrol et
        await checkTableStatus();
        
        // Önce kategorileri yükle
        await loadCategories();
        
        // Sonra menü öğelerini yükle
        await loadMenuItems();
        
        // Olay dinleyicilerini ayarla
        setupEventListeners();
        
        // Yükleniyor göstergesini kapat
        elements.loadingOverlay.style.display = 'none';
    } catch (error) {
        console.error('Uygulama başlatılırken hata:', error);
        showError('Uygulama başlatılırken bir hata oluştu: ' + error.message);
    }
}

// Masa durumunu kontrol et
async function checkTableStatus() {
    try {
        // Önce masalar tablosunda dene
        const { data: masaData, error: masaError } = await supabase
            .from('masalar')
            .select('id, durum')
            .eq('masa_no', appState.tableNumber)
            .single();
            
        if (!masaError && masaData) {
            appState.tableId = masaData.id;
            return;
        }
        
        // Eğer masalar tablosunda bulunamazsa tables tablosunda dene
        const { data: tableData, error: tableError } = await supabase
            .from('tables')
            .select('id, status')
            .eq('number', appState.tableNumber)
            .single();
            
        if (!tableError && tableData) {
            appState.tableId = tableData.id;
            return;
        }
        
        // Masa bulunamadıysa hata fırlat
        throw new Error(`Masa ${appState.tableNumber} bulunamadı. Lütfen QR kodu tekrar tarayın.`);
        
    } catch (error) {
        console.error('Masa durumu kontrol edilirken hata:', error);
        throw new Error('Masa durumu kontrol edilirken bir hata oluştu.');
    }
}

// Kategorileri yükle
async function loadCategories() {
    try {
        // Önce kategoriler tablosunu dene
        let { data: categories, error } = await supabase
            .from('kategoriler')
            .select('*')
            .order('sira', { ascending: true });
            
        // Eğer kategoriler tablosunda veri yoksa categories tablosunu dene
        if (error || !categories || categories.length === 0) {
            const { data: categoriesData, error: categoriesError } = await supabase
                .from('categories')
                .select('*')
                .order('name', { ascending: true });
                
            if (categoriesError) throw categoriesError;
            
            if (categoriesData && categoriesData.length > 0) {
                // Kategori verilerini normalize et
                categories = categoriesData.map(c => ({
                    id: c.id,
                    ad: c.name || c.ad
                }));
            }
        }
        
        if (categories && categories.length > 0) {
            appState.categories = categories;
            
            // Kategori butonlarını dinamik olarak oluştur
            elements.categoryContainer.innerHTML = '';
            
            // Önce "Tümü" kategorisini ekle
            const allCategoryBtn = document.createElement('div');
            allCategoryBtn.className = 'menu-category active';
            allCategoryBtn.dataset.category = 'all';
            allCategoryBtn.textContent = 'Tümü';
            elements.categoryContainer.appendChild(allCategoryBtn);
            
            // Diğer kategorileri ekle
            categories.forEach(category => {
                const categoryBtn = document.createElement('div');
                categoryBtn.className = 'menu-category';
                categoryBtn.dataset.category = category.id.toString();
                categoryBtn.textContent = category.ad || category.name;
                elements.categoryContainer.appendChild(categoryBtn);
            });
        }
    } catch (error) {
        console.error('Kategoriler yüklenirken hata:', error);
        throw new Error('Kategoriler yüklenirken bir hata oluştu.');
    }
}

// Menü öğelerini yükle
async function loadMenuItems() {
    try {
        // Önce urunler tablosunu dene
        let { data: products, error } = await supabase
            .from('urunler')
            .select('*')
            .eq('stok_durumu', true)
            .order('ad', { ascending: true });
            
        // Eğer urunler tablosunda veri yoksa products tablosunu dene
        if (error || !products || products.length === 0) {
            const { data: productsData, error: productsError } = await supabase
                .from('products')
                .select('*')
                .eq('active', true)
                .order('name', { ascending: true });
                
            if (productsError) throw productsError;
            
            if (productsData && productsData.length > 0) {
                // Ürün verilerini normalize et
                products = productsData.map(p => ({
                    id: p.id,
                    ad: p.name || p.ad,
                    fiyat: p.price || p.fiyat,
                    kategori_id: p.category_id || p.kategori_id,
                    image_url: p.image || p.image_url || 'https://via.placeholder.com/80'
                }));
            }
        }
        
        if (products && products.length > 0) {
            // Ürün verilerini normalize et
            appState.menuItems = products.map(p => ({
                id: p.id,
                name: p.ad || p.name,
                price: p.fiyat || p.price,
                category_id: p.kategori_id || p.category_id,
                image: p.image_url || p.image || 'https://via.placeholder.com/80'
            }));
            
            renderMenuItems('all');
        } else {
            elements.menuList.innerHTML = `
                <div class="col-12 text-center py-5">
                    <p class="text-muted">Henüz ürün eklenmemiş.</p>
                </div>
            `;
        }
    } catch (error) {
        console.error('Menü öğeleri yüklenirken hata:', error);
        throw new Error('Menü öğeleri yüklenirken bir hata oluştu.');
    }
}

// Olay dinleyicilerini ayarla
function setupEventListeners() {
    // Kategori seçimi
    document.querySelectorAll('.menu-category').forEach(category => {
        category.addEventListener('click', () => {
            // Aktif kategoriyi güncelle
            document.querySelectorAll('.menu-category').forEach(c => c.classList.remove('active'));
            category.classList.add('active');
            
            // Seçilen kategoriye göre menü öğelerini göster
            const categoryId = category.dataset.category;
            appState.activeCategory = categoryId;
            renderMenuItems(categoryId);
        });
    });
    
    // Sipariş gönderme
    elements.submitOrderBtn.addEventListener('click', submitOrder);
    
    // Garson çağırma butonu
    elements.callWaiterBtn.addEventListener('click', callWaiter);
}

// Menü öğelerini göster
function renderMenuItems(categoryId) {
    let items = [];
    
    if (categoryId === 'all') {
        items = appState.menuItems;
    } else {
        items = appState.menuItems.filter(item => item.category_id && item.category_id.toString() === categoryId);
    }
    
    if (items.length === 0) {
        elements.menuList.innerHTML = `
            <div class="col-12 text-center py-5">
                <p class="text-muted">Bu kategoride ürün bulunamadı.</p>
            </div>
        `;
        return;
    }
    
    elements.menuList.innerHTML = items.map(item => `
        <div class="col-12 col-md-6 mb-3">
            <div class="menu-item d-flex align-items-center">
                <img src="${item.image}" alt="${item.name}" class="menu-item-image me-3">
                <div class="flex-grow-1">
                    <h5 class="mb-1">${item.name}</h5>
                    <div class="menu-item-price">₺${parseFloat(item.price).toFixed(2)}</div>
                </div>
                <button class="btn btn-outline-primary btn-sm add-to-cart-btn" data-id="${item.id}">
                    <i class="bi bi-plus-lg"></i> Ekle
                </button>
            </div>
        </div>
    `).join('');
    
    // Sepete ekle butonlarına olay dinleyicisi ekle
    document.querySelectorAll('.add-to-cart-btn').forEach(button => {
        button.addEventListener('click', () => {
            const itemId = button.dataset.id;
            addToCart(itemId);
        });
    });
}

// Sepete ürün ekle
function addToCart(itemId) {
    const item = appState.menuItems.find(item => item.id === itemId);
    if (!item) return;
    
    // Sepette bu ürün var mı kontrol et
    const existingItem = appState.cart.find(cartItem => cartItem.id === itemId);
    
    if (existingItem) {
        // Varsa miktarını artır
        existingItem.quantity += 1;
    } else {
        // Yoksa sepete ekle
        appState.cart.push({
            id: item.id,
            name: item.name,
            price: item.price,
            quantity: 1
        });
    }
    
    // Sepeti güncelle
    renderCart();
    
    // Görsel geri bildirim
    const button = document.querySelector(`.add-to-cart-btn[data-id="${itemId}"]`);
    if (button) {
        button.classList.add('active');
        button.innerHTML = '<i class="bi bi-check-lg"></i> Eklendi';
        
        setTimeout(() => {
            button.classList.remove('active');
            button.innerHTML = '<i class="bi bi-plus-lg"></i> Ekle';
        }, 500);
    }
}

// Sepetten ürün çıkar
function removeFromCart(itemId) {
    const index = appState.cart.findIndex(item => item.id === itemId);
    if (index !== -1) {
        appState.cart.splice(index, 1);
        renderCart();
    }
}

// Ürün miktarını azalt
function decreaseQuantity(itemId) {
    const item = appState.cart.find(item => item.id === itemId);
    if (item) {
        if (item.quantity > 1) {
            item.quantity -= 1;
        } else {
            removeFromCart(itemId);
        }
        renderCart();
    }
}

// Ürün miktarını artır
function increaseQuantity(itemId) {
    const item = appState.cart.find(item => item.id === itemId);
    if (item) {
        item.quantity += 1;
        renderCart();
    }
}

// Sepeti göster
function renderCart() {
    if (appState.cart.length === 0) {
        elements.cartItems.innerHTML = `
            <div class="text-center py-3 text-muted">
                Sepetiniz boş. Lütfen menüden ürün seçin.
            </div>
        `;
        elements.cartTotalSection.style.display = 'none';
        return;
    }
    
    let total = 0;
    
    elements.cartItems.innerHTML = appState.cart.map(item => {
        const itemTotal = item.price * item.quantity;
        total += itemTotal;
        
        return `
            <div class="cart-item">
                <div class="d-flex justify-content-between align-items-center mb-2">
                    <h6 class="mb-0">${item.name}</h6>
                    <div class="text-primary">₺${parseFloat(itemTotal).toFixed(2)}</div>
                </div>
                <div class="d-flex justify-content-between align-items-center">
                    <div class="d-flex align-items-center">
                        <button class="btn btn-sm btn-outline-secondary decrease-btn" data-id="${item.id}">
                            <i class="bi bi-dash"></i>
                        </button>
                        <span class="quantity">${item.quantity}</span>
                        <button class="btn btn-sm btn-outline-secondary increase-btn" data-id="${item.id}">
                            <i class="bi bi-plus"></i>
                        </button>
                    </div>
                    <button class="btn btn-sm btn-outline-danger remove-btn" data-id="${item.id}">
                        <i class="bi bi-trash"></i>
                    </button>
                </div>
            </div>
        `;
    }).join('');
    
    // Toplam tutarı göster
    elements.cartTotal.textContent = `₺${parseFloat(total).toFixed(2)}`;
    elements.cartTotalSection.style.display = 'block';
    
    // Sepet butonlarına olay dinleyicileri ekle
    document.querySelectorAll('.decrease-btn').forEach(button => {
        button.addEventListener('click', () => {
            const itemId = button.dataset.id;
            decreaseQuantity(itemId);
        });
    });
    
    document.querySelectorAll('.increase-btn').forEach(button => {
        button.addEventListener('click', () => {
            const itemId = button.dataset.id;
            increaseQuantity(itemId);
        });
    });
    
    document.querySelectorAll('.remove-btn').forEach(button => {
        button.addEventListener('click', () => {
            const itemId = button.dataset.id;
            removeFromCart(itemId);
        });
    });
}

// Sipariş gönder
async function submitOrder() {
    if (appState.cart.length === 0) {
        showError('Sepetiniz boş. Lütfen önce ürün ekleyin.');
        return;
    }
    
    try {
        elements.loadingOverlay.style.display = 'flex';
        elements.submitOrderBtn.disabled = true;
        
        // Toplam tutarı hesapla
        const totalAmount = appState.cart.reduce((sum, item) => sum + (parseFloat(item.price) * item.quantity), 0);
        
        // Masa durumunu güncelle
        await updateTableStatus('qr_siparis');
        
        // Sipariş oluştur
        let orderCreated = false;
        let orderId = null;
        
        // Önce siparisler tablosunda dene
        try {
            const { data, error } = await supabase
                .from('siparisler')
                .insert({
                    masa_no: appState.tableNumber,
                    masa_id: appState.tableId,
                    durum: 'qr_siparis',
                    siparis_notu: elements.orderNote.value.trim() || null,
                    toplam_fiyat: totalAmount,
                    musteri_siparis: true,
                    urunler: JSON.stringify(appState.cart)
                })
                .select()
                .single();
                
            if (!error && data) {
                orderCreated = true;
                orderId = data.id;
                console.log('Sipariş başarıyla oluşturuldu (siparisler tablosu):', data);
                
                // Sipariş öğelerini ekle
                const orderItems = appState.cart.map(item => ({
                    siparis_id: orderId,
                    urun_id: item.id,
                    urun_adi: item.name,
                    miktar: item.quantity,
                    birim_fiyat: parseFloat(item.price),
                    toplam_fiyat: parseFloat(item.price) * item.quantity
                }));
                
                await supabase
                    .from('siparis_kalemleri')
                    .insert(orderItems);
                
                console.log('Sipariş kalemleri eklendi');
            }
        } catch (error) {
            console.log('Siparisler tablosunda sipariş oluşturulamadı:', error);
        }
        
        // Eğer siparisler tablosunda başarısız olursa orders tablosunda dene
        if (!orderCreated) {
            try {
                const { data, error } = await supabase
                    .from('orders')
                    .insert({
                        table_number: appState.tableNumber,
                        table_id: appState.tableId,
                        status: 'qr_order',
                        note: elements.orderNote.value.trim() || null,
                        total_amount: totalAmount,
                        is_customer_order: true,
                        items: JSON.stringify(appState.cart)
                    })
                    .select()
                    .single();
                    
                if (!error && data) {
                    orderCreated = true;
                    orderId = data.id;
                    console.log('Sipariş başarıyla oluşturuldu (orders tablosu):', data);
                    
                    // Sipariş öğelerini ekle
                    const orderItems = appState.cart.map(item => ({
                        order_id: orderId,
                        product_id: item.id,
                        product_name: item.name,
                        quantity: item.quantity,
                        unit_price: parseFloat(item.price),
                        total_price: parseFloat(item.price) * item.quantity
                    }));
                    
                    await supabase
                        .from('order_items')
                        .insert(orderItems);
                    
                    console.log('Sipariş kalemleri eklendi (order_items tablosu)');
                }
            } catch (error) {
                console.log('Orders tablosunda sipariş oluşturulamadı:', error);
            }
        }
        
        if (!orderCreated) {
            throw new Error('Sipariş oluşturulamadı. Lütfen tekrar deneyin.');
        }
        
        // Başarılı modalını göster
        elements.orderSuccessModal.show();
        
        // Sepeti temizle
        appState.cart = [];
        renderCart();
        
        // Sipariş notunu temizle
        elements.orderNote.value = '';
        
    } catch (error) {
        console.error('Sipariş gönderilirken hata:', error);
        showError('Sipariş gönderilirken bir hata oluştu: ' + error.message);
    } finally {
        elements.loadingOverlay.style.display = 'none';
        elements.submitOrderBtn.disabled = false;
    }
}

// Masa durumunu güncelle
async function updateTableStatus(status) {
    try {
        // Önce masalar tablosunda dene
        let tableUpdated = false;
        
        try {
            console.log(`Masalar tablosunda masa ${appState.tableNumber} durumu güncelleniyor: ${status}`);
            const { error } = await supabase
                .from('masalar')
                .update({ durum: status })
                .eq('masa_no', appState.tableNumber);
                
            if (!error) {
                tableUpdated = true;
                console.log(`Masa ${appState.tableNumber} durumu güncellendi: ${status}`);
            } else {
                console.error('Masalar tablosunda güncelleme hatası:', error);
            }
        } catch (error) {
            console.log('Masalar tablosunda masa güncellenemedi:', error);
        }
        
        // Tables tablosunda da güncelleme yapalım (her iki tabloda da güncellemek için)
        try {
            const statusMap = {
                'qr_siparis': 'qr_order',
                'çağrı': 'call',
                'dolu': 'occupied',
                'boş': 'empty',
                'hazır': 'ready'
            };
            
            const englishStatus = statusMap[status] || status;
            
            console.log(`Tables tablosunda masa ${appState.tableNumber} durumu güncelleniyor: ${englishStatus}`);
            const { error } = await supabase
                .from('tables')
                .update({ status: englishStatus })
                .eq('number', appState.tableNumber);
                
            if (!error) {
                tableUpdated = true;
                console.log(`Table ${appState.tableNumber} status updated: ${englishStatus}`);
            } else {
                console.error('Tables tablosunda güncelleme hatası:', error);
            }
        } catch (error) {
            console.log('Tables tablosunda masa güncellenemedi:', error);
        }
        
        if (!tableUpdated) {
            throw new Error('Masa durumu güncellenemedi.');
        }
    } catch (error) {
        console.error('Masa durumu güncellenirken hata:', error);
        throw error;
    }
}

// Garson çağır
async function callWaiter() {
    try {
        elements.loadingOverlay.style.display = 'flex';
        elements.callWaiterBtn.disabled = true;
        
        // Masa durumunu güncelle
        await updateTableStatus('çağrı');
        
        // Garson çağrısı oluştur
        let callCreated = false;
        
        try {
            const { error } = await supabase
                .from('waiter_calls')
                .insert({
                    table_id: appState.tableId,
                    table_number: appState.tableNumber,
                    status: 'waiting'
                });
                
            if (!error) {
                callCreated = true;
                console.log('Garson çağrısı oluşturuldu');
            }
        } catch (error) {
            console.log('Waiter_calls tablosunda çağrı oluşturulamadı:', error);
        }
        
        if (!callCreated) {
            throw new Error('Garson çağrısı oluşturulamadı. Lütfen tekrar deneyin.');
        }
        
        // Başarılı modalını göster
        elements.waiterCallModal.show();
        
    } catch (error) {
        console.error('Garson çağrılırken hata:', error);
        showError('Garson çağrılırken bir hata oluştu: ' + error.message);
    } finally {
        elements.loadingOverlay.style.display = 'none';
        elements.callWaiterBtn.disabled = false;
    }
}

// Hata mesajı göster
function showError(message) {
    alert(message);
}