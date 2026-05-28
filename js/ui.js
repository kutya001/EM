// ===== UI.JS — Общие UI-компоненты и навигация =====

// --- Навигация между вкладками ---
function switchTab(tabId) {
    currentTab = tabId;
    document.querySelectorAll('.tab-content').forEach(el => el.classList.add('hidden'));
    document.getElementById(`tab-${tabId}`).classList.remove('hidden');

    // Мобильные кнопки
    document.querySelectorAll('nav button').forEach(btn => {
        btn.classList.remove('text-emerald-800');
        btn.classList.add('text-stone-400');
    });
    const activeMobileBtn = document.getElementById(`btn-tab-${tabId}`);
    if (activeMobileBtn) {
        activeMobileBtn.classList.remove('text-stone-400');
        activeMobileBtn.classList.add('text-emerald-800');
    }

    // Кнопки для ПК
    const pcTabs = ['profile', 'guests', 'tables', 'schema', 'finance'];
    pcTabs.forEach(t => {
        const btn = document.getElementById(`pc-btn-tab-${t}`);
        if (btn) {
            btn.classList.remove('bg-stone-900/70', 'text-white');
            btn.classList.add('text-stone-300');
        }
    });
    const activePcBtn = document.getElementById(`pc-btn-tab-${tabId}`);
    if (activePcBtn) {
        activePcBtn.classList.remove('text-stone-300');
        activePcBtn.classList.add('bg-stone-900/70', 'text-white');
    }

    renderAll();
    lucide.createIcons();

    if (tabId === 'profile') {
        switchMainSubTab(currentMainSubTab || 'profile');
    }

    if (tabId === 'schema') {
        setTimeout(() => {
            initCanvas();
            centerCanvasViewport();
        }, 100);
    }
}

// Виртуальный полноэкранный режим для схемы зала
function toggleCanvasFullscreen() {
    const wrap = document.getElementById('canvas-wrap');
    const icon = document.getElementById('fullscreen-icon');
    const isFull = wrap.classList.contains('fixed');
    
    if (isFull) {
        wrap.className = "relative bg-stone-100 rounded-3xl border border-stone-200/80 overflow-hidden h-[480px] md:h-[650px] shadow-inner transition-all duration-300";
        icon.setAttribute('data-lucide', 'maximize-2');
        showToast("Обычный режим схемы");
    } else {
        wrap.className = "fixed inset-0 z-50 bg-stone-100 w-screen h-screen rounded-none border-none overflow-hidden flex flex-col transition-all duration-300";
        icon.setAttribute('data-lucide', 'minimize-2');
        showToast("Полноэкранный режим планировщика");
    }
    lucide.createIcons();
    setTimeout(() => {
        centerCanvasViewport();
    }, 150);
}

// --- Универсальные модальные окна ---
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    modal.classList.remove('hidden');
    setTimeout(() => {
        modal.firstElementChild.classList.remove('scale-95', 'opacity-0');
    }, 50);
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    modal.firstElementChild.classList.add('scale-95', 'opacity-0');
    setTimeout(() => {
        modal.classList.add('hidden');
    }, 200);
}

function showToast(text) {
    const toast = document.getElementById('toast');
    if (!toast) return;
    const toastText = document.getElementById('toast-text');
    if (toastText) toastText.innerText = text;
    
    toast.classList.remove('opacity-0', 'pointer-events-none', 'scale-90');
    toast.classList.add('opacity-100', 'scale-100');
    
    if (window.toastTimer) clearTimeout(window.toastTimer);
    window.toastTimer = setTimeout(() => {
        toast.classList.add('opacity-0', 'pointer-events-none', 'scale-90');
        toast.classList.remove('opacity-100', 'scale-100');
    }, 3000);
}

function showConfirm(title, text, onYes) {
    const modal = document.getElementById('modal-confirm');
    if (!modal) return;
    const titleEl = document.getElementById('confirm-title');
    const textEl = document.getElementById('confirm-text');
    if (titleEl) titleEl.innerText = title;
    if (textEl) textEl.innerText = text;
    
    openModal('modal-confirm');

    const btnYes = document.getElementById('confirm-btn-yes');
    const btnCancel = document.getElementById('confirm-btn-cancel');
    if (!btnYes || !btnCancel) return;

    const newYes = btnYes.cloneNode(true);
    const newCancel = btnCancel.cloneNode(true);
    btnYes.parentNode.replaceChild(newYes, btnYes);
    btnCancel.parentNode.replaceChild(newCancel, btnCancel);

    newYes.addEventListener('click', () => {
        onYes();
        closeModal('modal-confirm');
    });
    newCancel.addEventListener('click', () => {
        closeModal('modal-confirm');
    });
}

// --- Обновление выпадающих селектов ---
function updateDropdowns() {
    const gCat = document.getElementById('guest-category');
    const gTbl = document.getElementById('guest-table');
    const tCat = document.getElementById('table-category');
    
    const fCat = document.getElementById('filter-category');
    const fTbl = document.getElementById('filter-table');

    let catHTML = '<option value="none">Без категории</option>';
    state.categories.forEach(c => {
        catHTML += `<option value="${c.id}">${c.name}</option>`;  
    });
    gCat.innerHTML = catHTML;
    tCat.innerHTML = catHTML;

    let tblHTML = '<option value="none">Без стола (Не рассажен)</option>';
    state.tables.forEach(t => {
        tblHTML += `<option value="${t.id}">${getTableName(t)} (До ${t.capacity} чел.)</option>`;
    });
    gTbl.innerHTML = tblHTML;

    let filterCatHTML = '<option value="all">Все категории гостей</option>';
    state.categories.forEach(c => {
        filterCatHTML += `<option value="${c.id}">${c.name}</option>`;  
    });
    fCat.innerHTML = filterCatHTML;

    let filterTblHTML = '<option value="all">Все столы</option><option value="none">Без стола</option>';
    state.tables.forEach(t => {
        filterTblHTML += `<option value="${t.id}">${getTableName(t)}</option>`;  
    });
    fTbl.innerHTML = filterTblHTML;
}

// --- Отрисовка активных данных ---
function renderAll() {
    updateDashboardStats();
    if (currentTab === 'profile') {
        if (currentMainSubTab === 'stats') {
            renderAnalyticsTab();
        } else if (currentMainSubTab === 'database') {
            renderMiniCategories();
            renderMiniExpenseCategories();
        } else {
            renderProfileView();
        }
    }
    if (currentTab === 'guests') renderGuests();
    if (currentTab === 'tables') renderTables();
    if (currentTab === 'schema') drawCanvas();
    if (currentTab === 'finance') {
        renderExpenses();
        renderFinanceGuests();
        renderFinanceAnalysis();
    }
}

// --- Статистика в шапке ---
function updateDashboardStats() {
    const total = state.guests.length;
    const seated = state.guests.filter(g => g.tableId && g.tableId !== 'none').length;
    const unseated = total - seated;
    const percent = total > 0 ? Math.round((seated / total) * 100) : 0;

    // Мобильная шапка
    document.getElementById('header-seated-count').innerText = `${seated}/${total}`;
    // ПК шапка
    const pcSeated = document.getElementById('pc-header-seated-count');
    if (pcSeated) pcSeated.innerText = `${seated}/${total}`;

    document.getElementById('stats-seated').innerText = seated;
    document.getElementById('stats-unseated').innerText = unseated;
    document.getElementById('stats-percent').innerText = `${percent}%`;
    document.getElementById('stats-progress-bar').style.width = `${percent}%`;
}

// --- Canvas-утилита скруглённый прямоугольник ---
function drawRoundedRect(x, y, width, height, radius, fill, stroke) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
    if (fill) ctx.fill();
    if (stroke) ctx.stroke();
}
