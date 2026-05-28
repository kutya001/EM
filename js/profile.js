// ===== PROFILE.JS — Логика вкладки Главная (Профиль, Аналитика, Данные) =====

var currentMainSubTab = 'profile';
var profileEditMode = false;

function switchMainSubTab(subTabId) {
    currentMainSubTab = subTabId;
    
    // Скрываем все суб-вкладки
    document.querySelectorAll('.main-subtab-content').forEach(el => el.classList.add('hidden'));
    // Показываем нужную
    const activeSubTab = document.getElementById(`main-subtab-${subTabId}`);
    if (activeSubTab) activeSubTab.classList.remove('hidden');

    // Сбрасываем стили кнопок переключателя
    const btnIds = ['profile', 'stats', 'database'];
    btnIds.forEach(id => {
        const btn = document.getElementById(`subtab-btn-${id}`);
        if (btn) {
            btn.className = "flex-1 text-center py-2 px-3 rounded-xl text-xs font-bold transition-all duration-200 text-stone-500 hover:text-stone-850 hover:bg-stone-200/50";
        }
    });

    // Подсвечиваем активную
    const activeBtn = document.getElementById(`subtab-btn-${subTabId}`);
    if (activeBtn) {
        activeBtn.className = "flex-1 text-center py-2 px-3 rounded-xl text-xs font-bold transition-all duration-200 bg-white text-emerald-850 shadow-xs border border-stone-200/40";
    }

    if (subTabId === 'stats') {
        updateDashboardStats();
        renderAnalyticsTab();
    } else if (subTabId === 'database') {
        renderMiniCategories();
        renderMiniExpenseCategories();
    } else if (subTabId === 'profile') {
        renderProfileView();
    }
    
    lucide.createIcons();
}

function setProfileEditMode(isEdit) {
    profileEditMode = isEdit;
    const viewModeEl = document.getElementById('profile-view-mode');
    const editModeEl = document.getElementById('profile-edit-mode');
    
    if (isEdit) {
        viewModeEl.classList.add('hidden');
        editModeEl.classList.remove('hidden');
        
        // Заполняем поля ввода из текущего состояния
        const p = state.profile;
        document.getElementById('profile-event-name').value = p.eventName || "";
        document.getElementById('profile-date').value = p.date || "";
        document.getElementById('profile-time-start').value = p.timeStart || "";
        document.getElementById('profile-time-end').value = p.timeEnd || "";
        document.getElementById('profile-venue-name').value = p.venueName || "";
        document.getElementById('profile-venue-link').value = p.venueLink || "";
        document.getElementById('profile-budget').value = p.budget || 0;
        document.getElementById('profile-planned-guests').value = p.plannedGuests || 0;
        document.getElementById('profile-currency').value = p.currency || "KGS";
        document.getElementById('profile-avg-gift').value = p.avgGift || 0;
        
        updateProfileDropdowns();
        document.getElementById('profile-event-type').value = p.eventType || "Свадьба";
    } else {
        viewModeEl.classList.remove('hidden');
        editModeEl.classList.add('hidden');
        renderProfileView();
    }
}

function formatDate(dateStr) {
    if (!dateStr) return "Дата не определена";
    try {
        const date = new Date(dateStr);
        return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });
    } catch (e) {
        return dateStr;
    }
}

function renderProfileView() {
    const p = state.profile;
    const totalGuests = state.guests.length;
    const seatedGuests = state.guests.filter(g => g.tableId && g.tableId !== 'none').length;
    
    document.getElementById('profile-view-title').innerText = p.eventName && p.eventName.trim() ? p.eventName : "Мое мероприятие";
    document.getElementById('profile-view-badge').innerText = `✨ ${p.eventType || 'Торжество'}`;
    
    const dateText = p.date ? formatDate(p.date) : "Дата не установлена";
    const timeText = (p.timeStart || p.timeEnd) ? ` | ⏱️ ${p.timeStart || '--:--'} - ${p.timeEnd || '--:--'}` : "";
    document.getElementById('profile-view-date-time').innerHTML = `<i data-lucide="calendar" class="w-3.5 h-3.5 text-amber-400 shrink-0"></i> <span>${dateText}${timeText}</span>`;
    
    document.getElementById('profile-view-venue').innerText = p.venueName && p.venueName.trim() ? p.venueName : "Место проведения не указано";
    
    const mapWrap = document.getElementById('profile-view-map-wrap');
    mapWrap.innerHTML = "";
    if (p.venueLink && p.venueLink.trim()) {
        const mapBtn = document.createElement('a');
        mapBtn.href = p.venueLink;
        mapBtn.target = "_blank";
        mapBtn.className = "w-full bg-stone-900 hover:bg-stone-850 text-white text-[10px] font-bold py-2 px-3 rounded-xl flex items-center justify-center gap-1 transition shadow-sm mt-2";
        mapBtn.innerHTML = `<i data-lucide="navigation" class="w-3.5 h-3.5 text-amber-400"></i> Открыть карту (2ГИС / Карты)`;
        mapWrap.appendChild(mapBtn);
    } else {
        mapWrap.innerHTML = `<span class="text-[9px] text-stone-400 font-semibold block mt-1">📍 Адресная ссылка на карту не привязана</span>`;
    }
    
    document.getElementById('profile-view-budget').innerText = `${(p.budget || 0).toLocaleString()} ${p.currency}`;
    document.getElementById('profile-view-avg-gift').innerText = `Средний подарок: ${(p.avgGift || 0).toLocaleString()} ${p.currency}`;
    
    const plannedGuests = p.plannedGuests || 0;
    document.getElementById('profile-view-guests-count').innerText = totalGuests;
    document.getElementById('profile-view-planned-guests').innerText = plannedGuests;
    document.getElementById('profile-view-seated-stats').innerText = `Рассажено: ${seatedGuests} из ${totalGuests} гостей (${totalGuests > 0 ? Math.round((seatedGuests/totalGuests)*100) : 0}%)`;
    
    lucide.createIcons();
}

function initProfileUI() {
    setProfileEditMode(false);
    switchMainSubTab('profile');
    
    const p = state.profile;
    const subtitle = document.getElementById('header-subtitle');
    if (subtitle) {
        if (p.eventName && p.eventName.trim()) {
            subtitle.innerText = p.eventName;
        } else {
            subtitle.innerText = "Система планирования мероприятий";
        }
    }

    // Синхронизируем символы валют
    document.querySelectorAll('.fin-curr-label').forEach(el => {
        el.innerText = p.currency;
    });
}

function updateProfileDropdowns() {
    const select = document.getElementById('profile-event-type');
    select.innerHTML = "";
    state.profile.eventTypes.forEach(type => {
        const opt = document.createElement('option');
        opt.value = type;
        opt.innerText = type;
        select.appendChild(opt);
    });
}

function handleSaveProfile(event) {
    event.preventDefault();
    
    const eventName = document.getElementById('profile-event-name').value.trim();
    const date = document.getElementById('profile-date').value;
    const timeStart = document.getElementById('profile-time-start').value;
    const timeEnd = document.getElementById('profile-time-end').value;
    const eventType = document.getElementById('profile-event-type').value;
    const venueName = document.getElementById('profile-venue-name').value.trim();
    const venueLink = document.getElementById('profile-venue-link').value.trim();
    const budget = parseFloat(document.getElementById('profile-budget').value) || 0;
    const plannedGuests = parseInt(document.getElementById('profile-planned-guests').value) || 0;
    const currency = document.getElementById('profile-currency').value;
    const avgGift = parseFloat(document.getElementById('profile-avg-gift').value) || 0;

    state.profile = {
        ...state.profile,
        eventName, date, timeStart, timeEnd, eventType,
        venueName, venueLink, budget, plannedGuests, currency, avgGift
    };

    saveState();
    
    const subtitle = document.getElementById('header-subtitle');
    if (subtitle) {
        subtitle.innerText = eventName ? eventName : "Система планирования мероприятий";
    }

    document.querySelectorAll('.fin-curr-label').forEach(el => {
        el.innerText = currency;
    });

    showToast('Профиль торжества успешно сохранен');
    setProfileEditMode(false);
    renderAll();
}

function handleAddCustomEventType(e) {
    e.preventDefault();
    const name = document.getElementById('new-event-type').value.trim();
    if (!name) return;
    
    if (!state.profile.eventTypes.includes(name)) {
        state.profile.eventTypes.push(name);
    }
    state.profile.eventType = name;
    saveState();
    
    updateProfileDropdowns();
    document.getElementById('profile-event-type').value = name;
    
    document.getElementById('new-event-type').value = "";
    closeModal('modal-custom-event-type');
    showToast(`Вид мероприятия "${name}" добавлен в справочник!`);
}

// --- Аналитика ---
function renderAnalyticsTab() {
    const list = document.getElementById('stats-categories-distribution');
    list.innerHTML = '';

    state.categories.forEach(cat => {
        const count = state.guests.filter(g => g.categoryId === cat.id).length;
        const total = state.guests.length;
        const percent = total > 0 ? Math.round((count / total) * 100) : 0;

        const row = document.createElement('div');
        row.className = 'space-y-1';
        row.innerHTML = `
            <div class="flex justify-between text-xs font-semibold text-stone-600">
                <span>${cat.name}</span>
                <span>${count} чел. (${percent}%)</span>
            </div>
            <div class="w-full bg-stone-100 h-1.5 rounded-full overflow-hidden">
                <div class="bg-amber-500 h-full transition-all duration-300" style="width: ${percent}%"></div>
            </div>
        `;
        list.appendChild(row);
    });
}

// --- Мини-справочники на вкладке Данные ---
function renderMiniCategories() {
    const list = document.getElementById('mini-categories-list');
    list.innerHTML = '';
    
    if (state.categories.length === 0) {
        list.innerHTML = `<p class="text-[11px] text-stone-400 italic">Справочник категорий пуст</p>`;
        return;
    }
    
    state.categories.forEach(cat => {
        const item = document.createElement('div');
        item.className = 'bg-stone-50 border border-stone-200/50 rounded-xl p-2.5 flex justify-between items-center text-xs';
        item.innerHTML = `
            <span class="font-bold text-stone-850 truncate mr-2">${cat.name}</span>
            <div class="flex gap-1 shrink-0">
                <button onclick="openCategoryModal('${cat.id}')" class="text-stone-300 hover:text-emerald-800 p-1 transition"><i data-lucide="edit-3" class="w-3.5 h-3.5"></i></button>
                <button onclick="deleteCategory('${cat.id}')" class="text-stone-300 hover:text-red-600 p-1 transition"><i data-lucide="trash-2" class="w-3.5 h-3.5"></i></button>
            </div>
        `;
        list.appendChild(item);
    });
    lucide.createIcons();
}

function renderMiniExpenseCategories() {
    const list = document.getElementById('mini-expense-categories-list');
    list.innerHTML = '';
    
    const categories = state.finance.expenseCategories || [];
    
    if (categories.length === 0) {
        list.innerHTML = `<p class="text-[11px] text-stone-400 italic">Справочник пуст</p>`;
        return;
    }
    
    categories.forEach(cat => {
        const item = document.createElement('div');
        item.className = 'bg-stone-50 border border-stone-200/50 rounded-xl p-2.5 flex justify-between items-center text-xs';
        item.innerHTML = `
            <span class="font-bold text-stone-850 truncate mr-2">${cat}</span>
            <div class="flex gap-1 shrink-0">
                <button onclick="openExpenseCategoryModal('${cat}')" class="text-stone-300 hover:text-emerald-800 p-1 transition"><i data-lucide="edit-3" class="w-3.5 h-3.5"></i></button>
                <button onclick="deleteExpenseCategory('${cat}')" class="text-stone-300 hover:text-red-600 p-1 transition"><i data-lucide="trash-2" class="w-3.5 h-3.5"></i></button>
            </div>
        `;
        list.appendChild(item);
    });
    lucide.createIcons();
}
