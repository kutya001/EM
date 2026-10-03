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

    // Сбросить стили кнопок переключателя
    const btnIds = ['profile', 'stats', 'database'];
    btnIds.forEach(id => {
        const btn = document.getElementById(`subtab-btn-${id}`);
        if (btn) {
            btn.className = "flex-1 text-center py-1.5 px-1 rounded-md text-[10px] md:text-xs font-bold transition-all duration-200 text-stone-600 hover:text-stone-900 hover:bg-stone-200/50 flex items-center justify-center gap-1";
        }
    });

    // Подсвечиваем активную
    const activeBtn = document.getElementById(`subtab-btn-${subTabId}`);
    if (activeBtn) {
        activeBtn.className = "flex-1 text-center py-1.5 px-1 rounded-md text-[10px] md:text-xs font-bold transition-all duration-200 bg-emerald-800 text-white shadow-2xs flex items-center justify-center gap-1";
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

function openEventSettings() {
    if (typeof switchTab === 'function') switchTab('profile');
    switchMainSubTab('profile');
    setProfileEditMode(true);
    const editModeEl = document.getElementById('profile-edit-mode');
    if (editModeEl) {
        editModeEl.scrollIntoView({ behavior: 'smooth' });
    }
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
        
        const useFin = p.useFinance !== false;
        const toggleEl = document.getElementById('profile-use-finance');
        if (toggleEl) {
            toggleEl.checked = useFin;
            toggleProfileFinanceFields(useFin);
        }

        const phoneEl = document.getElementById('profile-track-phones');
        if (phoneEl) phoneEl.checked = p.trackPhones !== false;
        const catEl = document.getElementById('profile-track-categories');
        if (catEl) catEl.checked = p.trackCategories !== false;
        
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
    
    // Обновляем визуальное состояние быстрых тумблеров учета
    const catBtn = document.getElementById('profile-view-toggle-cat');
    const catDot = document.getElementById('profile-view-cat-dot');
    if (catBtn && catDot) {
        const on = p.trackCategories !== false;
        catDot.className = `w-2 h-2 rounded-full ${on ? 'bg-emerald-500' : 'bg-stone-300'}`;
        catBtn.className = `px-2.5 py-1.5 rounded-xl border text-[11px] font-bold transition flex items-center gap-1.5 shadow-2xs active:scale-95 ${on ? 'bg-emerald-50 border-emerald-300 text-emerald-900' : 'bg-stone-100 border-stone-250 text-stone-400'}`;
    }

    const phoneBtn = document.getElementById('profile-view-toggle-phone');
    const phoneDot = document.getElementById('profile-view-phone-dot');
    if (phoneBtn && phoneDot) {
        const on = p.trackPhones !== false;
        phoneDot.className = `w-2 h-2 rounded-full ${on ? 'bg-emerald-500' : 'bg-stone-300'}`;
        phoneBtn.className = `px-2.5 py-1.5 rounded-xl border text-[11px] font-bold transition flex items-center gap-1.5 shadow-2xs active:scale-95 ${on ? 'bg-emerald-50 border-emerald-300 text-emerald-900' : 'bg-stone-100 border-stone-250 text-stone-400'}`;
    }

    const finBtn = document.getElementById('profile-view-toggle-fin');
    const finDot = document.getElementById('profile-view-fin-dot');
    if (finBtn && finDot) {
        const on = p.useFinance !== false;
        finDot.className = `w-2 h-2 rounded-full ${on ? 'bg-emerald-500' : 'bg-stone-300'}`;
        finBtn.className = `px-2.5 py-1.5 rounded-xl border text-[11px] font-bold transition flex items-center gap-1.5 shadow-2xs active:scale-95 ${on ? 'bg-emerald-50 border-emerald-300 text-emerald-900' : 'bg-stone-100 border-stone-250 text-stone-400'}`;
    }

    renderProfileCategoriesCard();
    renderMainInvitationCard();
    lucide.createIcons();
}

function renderProfileCategoriesCard() {
    const container = document.getElementById('profile-categories-chips-container');
    const statusText = document.getElementById('profile-categories-status-text');
    if (!container) return;

    const p = state.profile || {};
    const isCatsActive = p.trackCategories !== false;
    container.innerHTML = '';

    if (!isCatsActive) {
        if (statusText) statusText.innerText = "Учет категорий отключен в настройках";
        container.innerHTML = `
            <div class="w-full bg-stone-100 border border-stone-250 rounded-xl p-3 flex flex-wrap items-center justify-between gap-2 text-xs">
                <span class="text-stone-500 font-medium">⚠️ Категории гостей отключены. В списке гостей и рассадке группы не отображаются.</span>
                <button type="button" onclick="quickToggleTrackCategories()" class="bg-emerald-800 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg text-[11px] font-bold shadow-2xs transition">
                    Включить категории
                </button>
            </div>
        `;
        return;
    }

    if (statusText) statusText.innerText = `Активных категорий: ${state.categories.length}`;
    if (!state.categories || state.categories.length === 0) {
        container.innerHTML = `
            <div class="text-stone-400 text-xs italic py-1">
                Категории еще не созданы. Нажмите «Управление категориями», чтобы добавить группы.
            </div>
        `;
        return;
    }

    state.categories.forEach(cat => {
        const count = state.guests.filter(g => g.categoryId === cat.id).length;
        const chip = document.createElement('div');
        chip.className = "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-stone-100 hover:bg-stone-200/80 border border-stone-200/80 text-xs font-semibold text-stone-800 transition cursor-pointer select-none";
        chip.onclick = () => openModal('modal-view-categories');
        chip.title = "Нажмите для редактирования категории";
        chip.innerHTML = `
            <span class="w-2 h-2 rounded-full" style="background-color: ${cat.color || '#059669'}"></span>
            <span>${escapeHtml(cat.name)}</span>
            <span class="text-[10px] font-bold bg-white text-stone-600 px-1.5 py-0.2 rounded-md border border-stone-200">${count}</span>
        `;
        container.appendChild(chip);
    });
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

    updateFinanceVisibility();
}

function updateProfileDropdowns() {
    const select = document.getElementById('profile-event-type');
    if (!select) return;
    select.innerHTML = "";
    if (!state.profile.eventTypes) {
        state.profile.eventTypes = ["Свадьба", "Кыз узатуу", "Бешик той", "День рождения", "Юбилей", "Прочее"];
    } else if (!state.profile.eventTypes.includes("Прочее")) {
        state.profile.eventTypes.push("Прочее");
    }
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

    const useFinanceEl = document.getElementById('profile-use-finance');
    const useFinance = useFinanceEl ? useFinanceEl.checked : true;
    const phoneEl = document.getElementById('profile-track-phones');
    const trackPhones = phoneEl ? phoneEl.checked : true;
    const catEl = document.getElementById('profile-track-categories');
    const trackCategories = catEl ? catEl.checked : true;

    state.profile = {
        ...state.profile,
        eventName, date, timeStart, timeEnd, eventType,
        venueName, venueLink, budget, plannedGuests, currency, avgGift, useFinance,
        trackPhones, trackCategories
    };

    saveState();
    
    const subtitle = document.getElementById('header-subtitle');
    if (subtitle) {
        subtitle.innerText = eventName ? eventName : "Система планирования мероприятий";
    }

    document.querySelectorAll('.fin-curr-label').forEach(el => {
        el.innerText = currency;
    });

    updateFinanceVisibility();
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

function toggleProfileFinanceFields(checked) {
    const container = document.getElementById('profile-edit-budget-container');
    if (container) {
        if (checked) container.classList.remove('hidden');
        else container.classList.add('hidden');
    }
}

// --- Главная: Праздничный пригласительный билет торжества ---
function renderMainInvitationCard() {
    const container = document.getElementById('main-invitation-card-container');
    if (!container) return;

    const p = state.profile || {};
    const tKey = (typeof getDefaultInvitationTemplateKey === 'function') ? getDefaultInvitationTemplateKey() : 'general';
    const defaultText = (typeof invitationTemplates !== 'undefined' && invitationTemplates[tKey]) ? invitationTemplates[tKey] : (invitationTemplates?.general || '');
    
    if (!p.invitationText || !p.invitationText.trim()) {
        p.invitationText = defaultText;
    }

    if (typeof printCustomInvitationText !== 'undefined' && !printCustomInvitationText) {
        printCustomInvitationText = p.invitationText;
    }

    const textarea = document.getElementById('main-invitation-text-input');
    if (textarea && document.activeElement !== textarea) {
        textarea.value = p.invitationText;
    }

    const eventTitle = p.eventName && p.eventName.trim() ? p.eventName.trim() : 'Торжественное мероприятие';
    const eventType = p.eventType || 'Торжество';
    const dateText = p.date ? formatDate(p.date) : 'Дата уточняется';
    
    let timeText = '18:00';
    if (p.timeStart) {
        timeText = p.timeStart + (p.timeEnd ? ` – ${p.timeEnd}` : '');
    }
    
    const venueText = p.venueName && p.venueName.trim() ? p.venueName.trim() : 'Место проведения уточняется';
    
    let venueLink = p.venueLink ? p.venueLink.trim() : '';
    if (!venueLink && venueText && venueText !== 'Место проведения уточняется') {
        venueLink = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(venueText)}`;
    }

    container.innerHTML = `
        <div class="invitation-border-luxury rounded-2xl md:rounded-3xl shadow-md text-center relative overflow-hidden bg-[#fffdfa] p-4 md:p-6 transition-all duration-300 hover:shadow-lg">
            <!-- Угловые золоченые элементы -->
            <div class="invitation-corner invitation-corner-tl"></div>
            <div class="invitation-corner invitation-corner-tr"></div>
            <div class="invitation-corner invitation-corner-bl"></div>
            <div class="invitation-corner invitation-corner-br"></div>

            <div class="invitation-border-inner rounded-xl md:rounded-2xl p-3 md:p-5 space-y-3 md:space-y-4">
                <!-- Заголовок и эмблема -->
                <div class="space-y-1">
                    <span class="text-[9px] md:text-[10px] uppercase tracking-[0.25em] text-amber-800 font-extrabold inline-block bg-amber-100/70 border border-amber-300/80 px-2.5 py-0.5 rounded-full">
                        ❖ ПРИГЛАСИТЕЛЬНЫЙ БИЛЕТ ❖
                    </span>
                    <h3 class="serif-title font-bold text-amber-950 text-lg md:text-2xl leading-tight pt-1">
                        ${escapeHtml(eventTitle)}
                    </h3>
                    <div class="flex items-center justify-center gap-2 pt-0.5">
                        <span class="h-px w-8 bg-amber-500/50"></span>
                        <span class="text-xs text-amber-700">✦</span>
                        <span class="text-[11px] font-bold text-emerald-900">${escapeHtml(eventType)}</span>
                        <span class="text-xs text-amber-700">✦</span>
                        <span class="h-px w-8 bg-amber-500/50"></span>
                    </div>
                </div>

                <!-- Обращение -->
                <div class="serif-title font-bold text-amber-950 text-sm md:text-base">
                    Дорогие друзья, родные и близкие!
                </div>

                <!-- Текст приглашения -->
                <p class="text-stone-700 leading-relaxed italic px-2 md:px-4 font-serif text-xs md:text-sm whitespace-pre-line text-center">
                    ${escapeHtml(p.invitationText)}
                </p>

                <!-- Информационный блок события -->
                <div class="bg-amber-50/80 border border-amber-200/90 rounded-2xl p-3 md:p-4 text-stone-850 space-y-2 text-left text-xs md:text-sm font-medium shadow-2xs">
                    <div class="flex items-center gap-2.5">
                        <span class="text-base w-5 text-center shrink-0">📅</span>
                        <div>
                            <span class="text-[10px] uppercase font-bold text-stone-400 block leading-tight">Дата торжества</span>
                            <span class="font-bold text-stone-900">${escapeHtml(dateText)}</span>
                        </div>
                    </div>
                    <div class="flex items-center gap-2.5">
                        <span class="text-base w-5 text-center shrink-0">🕒</span>
                        <div>
                            <span class="text-[10px] uppercase font-bold text-stone-400 block leading-tight">Время сбора</span>
                            <span class="font-bold text-stone-900">${escapeHtml(timeText)}</span>
                        </div>
                    </div>
                    <div class="flex items-start gap-2.5 pt-1 border-t border-amber-200/70">
                        <span class="text-base w-5 text-center shrink-0 mt-0.5">📍</span>
                        <div class="min-w-0 flex-1">
                            <span class="text-[10px] uppercase font-bold text-stone-400 block leading-tight">Место проведения</span>
                            ${venueLink ? `
                            <a href="${escapeHtml(venueLink)}" target="_blank" rel="noopener noreferrer" class="venue-pdf-link font-extrabold text-stone-900 hover:text-emerald-800 underline decoration-amber-500 decoration-2 underline-offset-2 block text-xs md:text-sm transition leading-snug" title="Нажмите, чтобы открыть место на карте">
                                ${escapeHtml(venueText)} ↗
                            </a>
                            <div class="mt-1">
                                <a href="${escapeHtml(venueLink)}" target="_blank" rel="noopener noreferrer" class="venue-pdf-link inline-flex items-center gap-1.5 bg-emerald-800 hover:bg-emerald-700 text-white font-bold py-1 px-2.5 rounded-lg shadow-2xs text-[11px] transition active:scale-95 no-underline">
                                    <span>🗺️ Открыть на карте (2ГИС / Maps)</span>
                                    <svg class="w-3 h-3 inline-block text-emerald-200" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path></svg>
                                </a>
                            </div>
                            ` : `
                            <span class="font-bold text-stone-900 block">${escapeHtml(venueText)}</span>
                            `}
                        </div>
                    </div>
                </div>

                <!-- Подпись и пожелание -->
                <div class="pt-1 text-center space-y-0.5">
                    <p class="italic serif-title text-xs md:text-sm text-stone-700">Будем искренне рады видеть вас на нашем празднике!</p>
                    <span class="text-[9px] uppercase tracking-wider text-amber-800 font-bold block">С любовью и уважением</span>
                </div>
            </div>
        </div>
    `;
    lucide.createIcons();
}

async function downloadMainInvitationPhoto() {
    const card = document.querySelector('#main-invitation-card-container .invitation-border-luxury');
    if (!card) {
        showToast('Карточка пригласительного не найдена');
        return;
    }
    showToast('📸 Подготовка фото открытки...');
    try {
        const canvas = await html2canvas(card, {
            scale: 2,
            useCORS: true,
            allowTaint: true,
            backgroundColor: '#ffffff',
            logging: false
        });
        const img = canvas.toDataURL('image/png', 1.0);
        const a = document.createElement('a');
        const p = state.profile || {};
        const title = (p.eventName || 'Пригласительное').replace(/[\\/:*?"<>|]/g, '_');
        a.download = `Пригласительное_${title}.png`;
        a.href = img;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        showToast('✅ Фото открытки успешно скачано!');
    } catch (err) {
        console.error('Ошибка сохранения фото:', err);
        showToast('Не удалось сохранить фото');
    }
}

function toggleMainInvitationSettings() {
    const drawer = document.getElementById('main-invitation-settings-drawer');
    if (!drawer) return;
    const isHidden = drawer.classList.contains('hidden');
    if (isHidden) {
        drawer.classList.remove('hidden');
        const textarea = document.getElementById('main-invitation-text-input');
        if (textarea) {
            textarea.focus();
        }
    } else {
        drawer.classList.add('hidden');
    }
}

function setMainInvitationPreset(templateKey) {
    if (typeof invitationTemplates !== 'undefined' && invitationTemplates[templateKey]) {
        const text = invitationTemplates[templateKey];
        if (state.profile) {
            state.profile.invitationText = text;
            saveState();
        }
        if (typeof printCustomInvitationText !== 'undefined') {
            printCustomInvitationText = text;
        }
        const textarea = document.getElementById('main-invitation-text-input');
        if (textarea) textarea.value = text;
        const printTextarea = document.getElementById('print-invitation-text');
        if (printTextarea) printTextarea.value = text;
        const printTemplateSelect = document.getElementById('print-invitation-template-select');
        if (printTemplateSelect) printTemplateSelect.value = templateKey;

        renderMainInvitationCard();
        if (typeof updatePrintPreview === 'function') {
            updatePrintPreview();
        }
        showToast('Текст шаблона успешно применен!');
    }
}

function handleMainInvitationTextChange(event) {
    const text = event.target.value;
    if (state.profile) {
        state.profile.invitationText = text;
        saveState();
    }
    if (typeof printCustomInvitationText !== 'undefined') {
        printCustomInvitationText = text;
    }
    const printTextarea = document.getElementById('print-invitation-text');
    if (printTextarea) printTextarea.value = text;

    renderMainInvitationCard();
    if (typeof updatePrintPreview === 'function') {
        updatePrintPreview();
    }
}

function copyMainInvitationText() {
    const p = state.profile || {};
    const eventTitle = p.eventName && p.eventName.trim() ? p.eventName.trim() : 'Торжественное мероприятие';
    const dateText = p.date ? formatDate(p.date) : '';
    const timeText = p.timeStart ? `${p.timeStart}${p.timeEnd ? ` – ${p.timeEnd}` : ''}` : '';
    const venueText = p.venueName && p.venueName.trim() ? p.venueName.trim() : '';
    const text = p.invitationText || (typeof invitationTemplates !== 'undefined' ? invitationTemplates.general : '');

    let message = `✨ *${eventTitle}* ✨\n\n`;
    message += `${text}\n\n`;
    if (dateText) message += `📅 *Дата:* ${dateText}\n`;
    if (timeText) message += `🕒 *Время сбора:* ${timeText}\n`;
    if (venueText) message += `📍 *Место проведения:* ${venueText}\n`;
    if (p.venueLink && p.venueLink.trim()) message += `🗺️ *Карта / 2ГИС:* ${p.venueLink.trim()}\n`;
    message += `\nЖдём вас с радостью и теплом! ✨`;

    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(message).then(() => {
            showToast('Текст приглашения скопирован в буфер обмена!');
        }).catch(() => {
            fallbackCopyText(message);
        });
    } else {
        fallbackCopyText(message);
    }
}

function fallbackCopyText(text) {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.focus();
    ta.select();
    try {
        document.execCommand('copy');
        showToast('Текст приглашения скопирован!');
    } catch (e) {
        showToast('Не удалось скопировать текст');
    }
    document.body.removeChild(ta);
}

function quickToggleTrackCategories() {
    if (!state.profile) state.profile = {};
    state.profile.trackCategories = !(state.profile.trackCategories !== false);
    saveState();
    if (state.profile.trackCategories === false && typeof guestsViewMode !== 'undefined' && guestsViewMode === 'categories') {
        if (typeof switchGuestsViewMode === 'function') switchGuestsViewMode('list');
    }
    renderAll();
    showToast(state.profile.trackCategories ? 'Учет категорий гостей включен' : 'Учет категорий гостей отключен');
}

function quickToggleTrackPhones() {
    if (!state.profile) state.profile = {};
    state.profile.trackPhones = !(state.profile.trackPhones !== false);
    saveState();
    renderAll();
    showToast(state.profile.trackPhones ? 'Учет телефонов гостей включен' : 'Учет телефонов гостей отключен');
}

function quickToggleUseFinance() {
    if (!state.profile) state.profile = {};
    state.profile.useFinance = !(state.profile.useFinance !== false);
    saveState();
    renderAll();
    showToast(state.profile.useFinance ? 'Раздел финансов включен' : 'Раздел финансов скрыт');
}

function sendWhatsAppGeneralInvitation() {
    const p = state.profile || {};
    const eventTitle = p.eventName && p.eventName.trim() ? p.eventName.trim() : 'Торжественное мероприятие';
    const dateText = p.date ? formatDate(p.date) : '';
    const timeText = p.timeStart ? `${p.timeStart}${p.timeEnd ? ` – ${p.timeEnd}` : ''}` : '';
    const venueText = p.venueName && p.venueName.trim() ? p.venueName.trim() : '';
    const text = p.invitationText || (typeof invitationTemplates !== 'undefined' ? invitationTemplates.general : '');

    let msg = `✨ *${eventTitle}* ✨\n\n`;
    msg += `Дорогие друзья, родные и близкие!\n\n`;
    msg += `${text}\n\n`;
    if (dateText) msg += `📅 *Дата:* ${dateText}\n`;
    if (timeText) msg += `🕒 *Время сбора:* ${timeText}\n`;
    if (venueText) msg += `📍 *Место проведения:* ${venueText}\n`;
    if (p.venueLink && p.venueLink.trim()) msg += `🗺️ *Карта / 2ГИС:* ${p.venueLink.trim()}\n`;
    msg += `\nБудем счастливы видеть Вас на нашем празднике! ✨`;

    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank');
}

async function sendWhatsAppGeneralInvitationPDF() {
    if (typeof openPrintModal === 'function') {
        openPrintModal('invitation_general');
    }

    showToast('📄 Формируем PDF «Пригласительное.pdf» с активной ссылкой на карту...');

    setTimeout(async () => {
        if (typeof downloadCurrentInvitationPDF === 'function') {
            await downloadCurrentInvitationPDF(null, 'Пригласительное.pdf');
        }

        const p = state.profile || {};
        const eventTitle = p.eventName && p.eventName.trim() ? p.eventName.trim() : 'Торжественное мероприятие';
        const dateText = p.date ? formatDate(p.date) : '';
        const timeText = p.timeStart ? `${p.timeStart}${p.timeEnd ? ` – ${p.timeEnd}` : ''}` : '';
        const venueText = p.venueName && p.venueName.trim() ? p.venueName.trim() : '';
        const text = p.invitationText || (typeof invitationTemplates !== 'undefined' ? invitationTemplates.general : '');

        let msg = `✨ *ПРИГЛАШЕНИЕ НА ТОРЖЕСТВО: ${eventTitle}* ✨\n\n`;
        msg += `Дорогие друзья, родные и близкие!\n\n`;
        msg += `${text}\n\n`;
        if (dateText) msg += `📅 *Дата:* ${dateText}\n`;
        if (timeText) msg += `🕒 *Время:* ${timeText}\n`;
        if (venueText) msg += `📍 *Место:* ${venueText}\n`;
        if (p.venueLink && p.venueLink.trim()) msg += `🗺️ *Карта / 2ГИС:* ${p.venueLink.trim()}\n`;
        msg += `\n📄 _(Файл «Пригласительное.pdf» сохранен — прикрепляю к сообщению)_ ✨`;

        setTimeout(() => {
            const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(msg)}`;
            window.open(url, '_blank');
        }, 500);
    }, 300);
}


