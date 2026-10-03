// ===== GUESTS.JS — Логика вкладки Гости =====

// --- Переключатель подвкладок списка гостей ---
function switchGuestsViewMode(mode) {
    if (state.profile?.trackCategories === false && mode === 'categories') {
        mode = 'list';
    }
    guestsViewMode = mode;
    saveState();
    
    const modes = ['list', 'spreadsheet', 'tables', 'categories'];
    modes.forEach(m => {
        const btn = document.getElementById(`subtab-btn-${m}`);
        if (btn) {
            if (m === mode) {
                btn.className = "guest-subtab-island flex-1 justify-center text-center py-2 px-1 md:py-1.5 md:px-3 rounded-xl text-xs font-bold transition-all duration-200 flex items-center justify-center gap-1.5 bg-gradient-to-b from-emerald-800 to-emerald-950 text-white shadow-md border-b-2 border-emerald-950 active:scale-95";
            } else {
                btn.className = "guest-subtab-island flex-1 justify-center text-center py-2 px-1 md:py-1.5 md:px-3 rounded-xl text-xs font-bold transition-all duration-200 flex items-center justify-center gap-1.5 text-stone-600 bg-white/90 hover:text-stone-900 hover:bg-stone-50 shadow-xs border border-stone-200/80 border-b-2 border-b-stone-300 active:scale-95";
            }
        }
    });

    // Если категории отключены, скрываем субвкладку категорий
    const catBtn = document.getElementById('subtab-btn-categories');
    if (catBtn) {
        if (state.profile?.trackCategories === false) {
            catBtn.classList.add('hidden');
        } else {
            catBtn.classList.remove('hidden');
        }
    }
    
    if (typeof updateAppHeaderTitle === 'function') {
        updateAppHeaderTitle();
    }
    renderGuests();
    lucide.createIcons();
}

function toggleGroupCollapse(groupKey) {
    if (collapsedGroups.has(groupKey)) {
        collapsedGroups.delete(groupKey);
    } else {
        collapsedGroups.add(groupKey);
    }
    renderGuests();
}

// --- Генератор карточки гостя ---
function createGuestCard(guest) {
    const isSelected = selectedGuests.has(guest.id);
    const cat = state.categories.find(c => c.id === guest.categoryId);
    const tbl = state.tables.find(t => t.id === guest.tableId);

    const showPhone = state.profile?.trackPhones !== false;
    const showCat = state.profile?.trackCategories !== false;

    const card = document.createElement('div');
    card.className = `p-3 rounded-2xl border transition-all duration-200 flex items-center justify-between ${
        isSelected ? 'bg-emerald-50/70 border-emerald-300 shadow-xs' : 'bg-white border-stone-200/60 shadow-xs hover:border-stone-300 transition-all'
    }`;

    const phoneHTML = (showPhone && guest.phone) ? `
        <div class="flex items-center gap-1.5 mt-1.5 flex-wrap select-all">
            <a href="tel:${guest.phone}" class="bg-stone-100 hover:bg-stone-200 text-stone-700 px-2 py-0.5 rounded-md text-[9px] font-bold inline-flex items-center gap-1 transition" title="Позвонить">
                <i data-lucide="phone" class="w-2.5 h-2.5 text-emerald-800"></i> ${guest.phone}
            </a>
            <button type="button" onclick="sendWhatsAppPersonalInvitation('${guest.id}')" class="bg-emerald-50 hover:bg-emerald-100 text-emerald-950 px-2 py-0.5 rounded-md text-[9px] font-bold inline-flex items-center gap-1 transition" title="Отправить персональное приглашение в WhatsApp">
                <i data-lucide="message-square" class="w-2.5 h-2.5 text-emerald-600"></i> Пригласить в WA
            </button>
            <button type="button" onclick="sendWhatsAppPersonalInvitationPDF('${guest.id}')" class="bg-amber-50 hover:bg-amber-100 text-amber-950 px-2 py-0.5 rounded-md text-[9px] font-bold inline-flex items-center gap-1 transition" title="Отправить персональный PDF-билет в WhatsApp">
                <i data-lucide="file-text" class="w-2.5 h-2.5 text-amber-700"></i> WA (PDF)
            </button>
        </div>
    ` : '';

    const catBadgeHTML = showCat ? `
        <span class="text-[9px] font-bold px-2 py-0.5 rounded-md bg-stone-100 text-stone-600 truncate max-w-[150px]">
            <i data-lucide="tag" class="w-2.5 h-2.5 inline mr-0.5 text-stone-400"></i> ${cat ? cat.name : 'Без категории'}
        </span>
    ` : '';

    card.innerHTML = `
        <div class="flex items-center gap-3 flex-1 min-w-0">
            <input type="checkbox" ${isSelected ? 'checked' : ''} onchange="toggleGuestSelection('${guest.id}')"
                   class="w-5 h-5 text-emerald-800 bg-stone-50 border-stone-300 rounded-md focus:ring-emerald-700 shrink-0">
            
            <div class="flex-1 min-w-0">
                <h4 class="text-xs font-extrabold text-stone-900 truncate">${escapeHtml(guest.name)}</h4>
                <div class="flex flex-wrap gap-1 mt-1">
                    ${catBadgeHTML}
                    <span class="text-[9px] font-bold px-2 py-0.5 rounded-md ${tbl ? 'bg-amber-100 text-amber-900' : 'bg-rose-50 text-rose-800'}">
                        <i data-lucide="armchair" class="w-2.5 h-2.5 inline mr-0.5 text-stone-400"></i> ${tbl ? getTableName(tbl) : 'Без стола'}
                    </span>
                </div>
                ${phoneHTML}
            </div>
        </div>

        <div class="flex items-center gap-1 ml-2 shrink-0">
            <button onclick="openPrintModal('invitation_personal', '${guest.id}')" class="text-stone-300 hover:text-amber-600 p-2 rounded-lg active:scale-90 transition" title="Открыть пригласительный билет гостя (А4)">
                <i data-lucide="mail" class="w-4 h-4"></i>
            </button>
            <button onclick="openGuestModal('${guest.id}')" class="text-stone-300 hover:text-emerald-800 p-2 rounded-lg active:scale-90 transition" title="Редактировать гостя">
                <i data-lucide="edit-3" class="w-4 h-4"></i>
            </button>
            <button onclick="deleteGuest('${guest.id}')" class="text-stone-300 hover:text-red-600 p-2 rounded-lg active:scale-90 transition" title="Удалить">
                <i data-lucide="trash-2" class="w-4 h-4"></i>
            </button>
        </div>
    `;
    return card;
}

// --- Рендер журнала гостей ---
function renderGuests() {
    const list = document.getElementById('guests-list');
    const empty = document.getElementById('guests-empty-state');
    const spreadsheetContainer = document.getElementById('guests-spreadsheet-container');
    list.innerHTML = '';

    const showCat = state.profile?.trackCategories !== false;

    // Скрываем или показываем категорию в фильтрах в зависимости от настроек
    const filterCatEl = document.getElementById('filter-category');
    if (filterCatEl && filterCatEl.parentElement) {
        if (!showCat) {
            filterCatEl.classList.add('hidden');
            filterCatEl.parentElement.classList.remove('grid-cols-2');
            filterCatEl.parentElement.classList.add('grid-cols-1');
        } else {
            filterCatEl.classList.remove('hidden');
            filterCatEl.parentElement.classList.add('grid-cols-2');
            filterCatEl.parentElement.classList.remove('grid-cols-1');
        }
    }

    // Если категории выключены, а режим 'categories', переключаем на 'list'
    if (!showCat && guestsViewMode === 'categories') {
        guestsViewMode = 'list';
    }

    const catSubtabBtn = document.getElementById('subtab-btn-categories');
    if (catSubtabBtn) {
        if (!showCat) catSubtabBtn.classList.add('hidden');
        else catSubtabBtn.classList.remove('hidden');
    }

    const filtered = getFilteredGuests();
    document.getElementById('total-guests-count').innerText = filtered.length;

    // Toggle active filter dot
    const query = document.getElementById('search-input') ? document.getElementById('search-input').value.trim() : '';
    const filterCat = document.getElementById('filter-category') ? document.getElementById('filter-category').value : 'all';
    const filterTbl = document.getElementById('filter-table') ? document.getElementById('filter-table').value : 'all';
    const hasActiveFilters = query !== '' || filterCat !== 'all' || filterTbl !== 'all';
    const activeDot = document.getElementById('guests-filters-active-dot');
    if (activeDot) {
        if (hasActiveFilters) activeDot.classList.remove('hidden');
        else activeDot.classList.add('hidden');
    }

    // Toggle select-all checkbox checked state
    const allSelected = filtered.length > 0 && filtered.every(g => selectedGuests.has(g.id));
    const selectAllCb = document.getElementById('select-all-cb');
    if (selectAllCb) {
        selectAllCb.checked = allSelected;
    }

    if (guestsViewMode === 'spreadsheet') {
        list.classList.add('hidden');
        if (spreadsheetContainer) {
            spreadsheetContainer.classList.remove('hidden');
            renderSpreadsheetView();
        }
        if (empty) empty.classList.add('hidden');
        return;
    } else {
        if (spreadsheetContainer) {
            spreadsheetContainer.classList.add('hidden');
        }
        list.classList.remove('hidden');
    }

    if (filtered.length === 0) {
        empty.classList.remove('hidden');
        return;
    }
    empty.classList.add('hidden');

    if (guestsViewMode === 'list') {
        filtered.forEach(guest => {
            list.appendChild(createGuestCard(guest));
        });
    }
    else if (guestsViewMode === 'tables') {
        const tables = [...state.tables, { id: 'none', name: 'Без стола', number: '' }];
        
        tables.forEach(table => {
            const tableGuests = filtered.filter(g => (g.tableId === table.id) || (table.id === 'none' && (!g.tableId || g.tableId === 'none')));
            if (tableGuests.length === 0) return;
            
            const groupKey = 'tbl-group-' + table.id;
            const isCollapsed = collapsedGroups.has(groupKey);
            
            const header = document.createElement('div');
            header.className = 'col-span-full bg-stone-100 hover:bg-stone-200 border border-stone-200 px-4 py-2.5 rounded-xl flex items-center justify-between cursor-pointer transition select-none';
            header.onclick = () => toggleGroupCollapse(groupKey);
            
            const displayName = table.id === 'none' ? 'Без стола' : getTableName(table);
            header.innerHTML = `
                <div class="flex items-center gap-2.5">
                    <i data-lucide="armchair" class="w-4 h-4 text-emerald-800 shrink-0"></i>
                    <span class="text-xs font-extrabold text-stone-900">${displayName}</span>
                    <span class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-950 border border-emerald-100">
                        ${tableGuests.length} гостей
                    </span>
                </div>
                <i data-lucide="chevron-${isCollapsed ? 'down' : 'up'}" class="w-4 h-4 text-stone-500 transition"></i>
            `;
            list.appendChild(header);
            
            if (!isCollapsed) {
                tableGuests.forEach(guest => {
                    list.appendChild(createGuestCard(guest));
                });
            }
        });
    }
    else if (guestsViewMode === 'categories') {
        const categories = [...state.categories, { id: 'none', name: 'Без категории' }];
        
        categories.forEach(cat => {
            const catGuests = filtered.filter(g => (g.categoryId === cat.id) || (cat.id === 'none' && (!g.categoryId || g.categoryId === 'none')));
            if (catGuests.length === 0) return;
            
            const groupKey = 'cat-group-' + cat.id;
            const isCollapsed = collapsedGroups.has(groupKey);
            
            const header = document.createElement('div');
            header.className = 'col-span-full bg-stone-100 hover:bg-stone-200 border border-stone-200 px-4 py-2.5 rounded-xl flex items-center justify-between cursor-pointer transition select-none';
            header.onclick = () => toggleGroupCollapse(groupKey);
            
            header.innerHTML = `
                <div class="flex items-center gap-2.5">
                    <i data-lucide="tag" class="w-4 h-4 text-amber-600 shrink-0"></i>
                    <span class="text-xs font-extrabold text-stone-900">${cat.name}</span>
                    <span class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-900 border border-amber-100">
                        ${catGuests.length} гостей
                    </span>
                </div>
                <i data-lucide="chevron-${isCollapsed ? 'down' : 'up'}" class="w-4 h-4 text-stone-500 transition"></i>
            `;
            list.appendChild(header);
            
            if (!isCollapsed) {
                catGuests.forEach(guest => {
                    list.appendChild(createGuestCard(guest));
                });
            }
        });
    }
    
    lucide.createIcons();
}

// --- Выделение гостей ---
function toggleGuestSelection(guestId) {
    if (selectedGuests.has(guestId)) {
        selectedGuests.delete(guestId);
    } else {
        selectedGuests.add(guestId);
    }
    updateBulkActionBar();
    renderGuests();
}

function toggleSelectAllVisible() {
    const visible = getFilteredGuests();
    const allSelected = visible.every(g => selectedGuests.has(g.id));

    if (allSelected) {
        visible.forEach(g => selectedGuests.delete(g.id));
    } else {
        visible.forEach(g => selectedGuests.add(g.id));
    }
    updateBulkActionBar();
    renderGuests();
}

function updateBulkActionBar() {
    const bar = document.getElementById('bulk-action-bar');
    const badge = document.getElementById('selected-guests-badge');
    const massCatBtn = document.getElementById('bulk-btn-mass-category');

    if (massCatBtn) {
        if (state.profile?.trackCategories === false) {
            massCatBtn.classList.add('hidden');
        } else {
            massCatBtn.classList.remove('hidden');
        }
    }
    
    if (selectedGuests.size > 0) {
        badge.innerText = selectedGuests.size;
        bar.classList.remove('translate-y-28', 'opacity-0', 'pointer-events-none');
        bar.classList.add('translate-y-0', 'opacity-100');
    } else {
        bar.classList.add('translate-y-28', 'opacity-0', 'pointer-events-none');
        bar.classList.remove('translate-y-0', 'opacity-100');
    }
}

// --- CRUD гостей ---
function openGuestModal(guestId = null) {
    const title = document.getElementById('guest-modal-title');
    const idInput = document.getElementById('edit-guest-id');
    const nameInput = document.getElementById('guest-name');
    const phoneInput = document.getElementById('guest-phone');
    const catSelect = document.getElementById('guest-category');
    const tblSelect = document.getElementById('guest-table');

    updateDropdowns();

    // Синхронизация полей формы с настройками мероприятия
    const showPhone = state.profile?.trackPhones !== false;
    const showCat = state.profile?.trackCategories !== false;
    const phoneContainer = document.getElementById('guest-phone-container');
    const catContainer = document.getElementById('guest-category-container');
    if (phoneContainer) {
        if (!showPhone) phoneContainer.classList.add('hidden');
        else phoneContainer.classList.remove('hidden');
    }
    if (catContainer) {
        if (!showCat) catContainer.classList.add('hidden');
        else catContainer.classList.remove('hidden');
    }

    if (guestId) {
        const guest = state.guests.find(g => g.id === guestId);
        title.innerText = "Редактировать гостя";
        idInput.value = guest.id;
        nameInput.value = guest.name;
        phoneInput.value = guest.phone || "";
        catSelect.value = guest.categoryId || 'none';
        tblSelect.value = guest.tableId || 'none';
    } else {
        title.innerText = "Новый гость";
        idInput.value = "";
        nameInput.value = "";
        phoneInput.value = "";
        catSelect.value = "none";
        tblSelect.value = "none";
    }
    openModal('modal-guest');
}

function handleSaveGuest(e) {
    e.preventDefault();
    const id = document.getElementById('edit-guest-id').value;
    const name = document.getElementById('guest-name').value.trim();
    const phone = document.getElementById('guest-phone').value.trim();
    const categoryId = document.getElementById('guest-category').value;
    const tableId = document.getElementById('guest-table').value;

    if (!name) return;

    if (id) {
        const guest = state.guests.find(g => g.id === id);
        if (guest) {
            guest.name = name;
            guest.phone = phone;
            guest.categoryId = categoryId;
            if (guest.tableId !== tableId) {
                assignSeatToGuest(guest, tableId);
            }
        }
        showToast('Данные гостя изменены');
    } else {
        const newId = 'gst-' + Date.now();
        const newGuest = { id: newId, name, phone, giftAmount: 0, categoryId, tableId: 'none', seatIndex: -1 };
        assignSeatToGuest(newGuest, tableId);
        state.guests.push(newGuest);
        showToast('Гость успешно добавлен');
    }

    saveState();
    closeModal('modal-guest');
    renderAll();
}

function deleteGuest(id) {
    const guest = state.guests.find(g => g.id === id);
    showConfirm(
        'Удалить гостя?',
        `Вы действительно хотите удалить гостя «${guest.name}» из списка?`,
        () => {
            state.guests = state.guests.filter(g => g.id !== id);
            selectedGuests.delete(id);
            updateBulkActionBar();
            saveState();
            renderAll();
            showToast('Гость удален');
        }
    );
}

// --- Массовые действия ---
function openMassSeatModal() {
    if (selectedGuests.size === 0) return;
    document.getElementById('mass-seat-count').innerText = selectedGuests.size;
    
    const list = document.getElementById('mass-seat-list');
    list.innerHTML = '';

    const btnNone = document.createElement('button');
    btnNone.className = 'w-full text-left bg-stone-100 hover:bg-stone-200 active:scale-95 transition text-stone-850 text-xs font-bold py-3 px-4 rounded-xl flex justify-between items-center border border-stone-200';
    btnNone.innerHTML = `<span>Снять рассадку (Оставить без стола)</span> <i data-lucide="minus-circle" class="w-4 h-4 text-stone-500"></i>`;
    btnNone.onclick = () => applyMassSeat('none');
    list.appendChild(btnNone);

    state.tables.forEach(t => {
        const seated = state.guests.filter(g => g.tableId === t.id).length;
        const free = Math.max(0, t.capacity - seated);
        
        const btn = document.createElement('button');
        btn.className = 'w-full text-left bg-emerald-50 hover:bg-emerald-100/80 active:scale-95 transition text-emerald-950 text-xs font-bold py-3 px-4 rounded-xl flex justify-between items-center border border-emerald-100';
        btn.innerHTML = `
            <div>
                <span class="block text-sm font-extrabold text-emerald-900">${getTableName(t)}</span>
                <span class="text-[9px] text-emerald-700 font-semibold">Свободно мест: ${free} из ${t.capacity}</span>
            </div>
            <i data-lucide="chevron-right" class="w-4 h-4 text-emerald-800"></i>
        `;
        btn.onclick = () => applyMassSeat(t.id);
        list.appendChild(btn);
    });

    openModal('modal-mass-seat');
    lucide.createIcons();
}

function applyMassSeat(tableId) {
    state.guests.forEach(g => {
        if (selectedGuests.has(g.id)) {
            assignSeatToGuest(g, tableId);
        }
    });

    saveState();
    selectedGuests.clear();
    updateBulkActionBar();
    closeModal('modal-mass-seat');
    renderAll();
    showToast('Массовая рассадка успешно завершена!');
}

function openMassCategoryModal() {
    if (selectedGuests.size === 0) return;
    document.getElementById('mass-category-count').innerText = selectedGuests.size;
    
    const list = document.getElementById('mass-category-list');
    list.innerHTML = '';

    const btnNone = document.createElement('button');
    btnNone.className = 'w-full text-left bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-bold py-2.5 px-3 rounded-xl flex justify-between items-center border border-stone-200';
    btnNone.innerHTML = `<span>Без категории</span> <i data-lucide="minus-circle" class="w-4 h-4 text-stone-400"></i>`;
    btnNone.onclick = () => applyMassCategory('none');
    list.appendChild(btnNone);

    state.categories.forEach(cat => {
        const btn = document.createElement('button');
        btn.className = 'w-full text-left bg-stone-50 hover:bg-stone-100 active:scale-95 transition text-stone-800 text-xs font-bold py-2.5 px-3 rounded-xl flex justify-between items-center border border-stone-200';
        btn.innerHTML = `
            <span>${cat.name}</span>
            <i data-lucide="tag" class="w-4 h-4 text-stone-400"></i>
        `;
        btn.onclick = () => applyMassCategory(cat.id);
        list.appendChild(btn);
    });

    openModal('modal-mass-category');
    lucide.createIcons();
}

function applyMassCategory(categoryId) {
    state.guests = state.guests.map(g => {
        if (selectedGuests.has(g.id)) {
            return { ...g, categoryId };
        }
        return g;
    });

    saveState();
    selectedGuests.clear();
    updateBulkActionBar();
    closeModal('modal-mass-category');
    renderAll();
    showToast('Массовая смена категории завершена!');
}

function confirmMassDelete() {
    if (selectedGuests.size === 0) return;
    showConfirm(
        'Удалить группу гостей?',
        `Вы действительно хотите удалить выбранных гостей (${selectedGuests.size} чел.)? Это действие безвозвратно очистит их из базы данных.`,
        () => {
            state.guests = state.guests.filter(g => !selectedGuests.has(g.id));
            selectedGuests.clear();
            updateBulkActionBar();
            saveState();
            renderAll();
            showToast('Выбранные гости удалены');
        }
    );
}

// ==========================================
//    ПРЕДСТАВЛЕНИЕ: ТАБЛИЦА (EXCEL-СТИЛЬ)
// ==========================================

function renderSpreadsheetView() {
    const theadTr = document.getElementById('guests-spreadsheet-thead-tr');
    const tbody = document.getElementById('guests-spreadsheet-tbody');
    if (!theadTr || !tbody) return;

    const showPhone = state.profile?.trackPhones !== false;
    const showCat = state.profile?.trackCategories !== false;
    const currency = state.profile?.currency || 'KGS';

    // Заголовки таблицы
    theadTr.innerHTML = `
        <th class="p-2.5 text-center w-9 select-none">
            <input type="checkbox" id="spreadsheet-select-all" onchange="toggleSelectAllVisible()" class="w-4 h-4 text-emerald-800 rounded focus:ring-emerald-700">
        </th>
        <th class="p-2.5 w-10 text-center select-none text-stone-400">№</th>
        <th class="p-2.5 min-w-[200px]">ФИО / Имя гостя</th>
        ${showPhone ? '<th class="p-2.5 min-w-[140px]">Телефон</th>' : ''}
        ${showCat ? '<th class="p-2.5 min-w-[150px]">Категория</th>' : ''}
        <th class="p-2.5 min-w-[170px]">Стол рассадки</th>
        <th class="p-2.5 w-16 text-center">Место</th>
        <th class="p-2.5 min-w-[130px] text-right">Подарок (${currency})</th>
        <th class="p-2.5 w-14 text-center select-none"></th>
    `;

    tbody.innerHTML = '';
    const filtered = getFilteredGuests();

    const selectAllCb = document.getElementById('spreadsheet-select-all');
    if (selectAllCb) {
        selectAllCb.checked = filtered.length > 0 && filtered.every(g => selectedGuests.has(g.id));
    }

    if (filtered.length === 0) {
        const colSpan = 5 + (showPhone ? 1 : 0) + (showCat ? 1 : 0);
        tbody.innerHTML = `
            <tr>
                <td colspan="${colSpan}" class="text-center py-10 text-stone-400 text-xs italic">
                    Список пуст. Нажмите «+ Добавить строку» для быстрого создания гостя
                </td>
            </tr>
        `;
        return;
    }

    let categoryOptions = '<option value="none">Без категории</option>';
    state.categories.forEach(c => {
        categoryOptions += `<option value="${c.id}">${escapeHtml(c.name)}</option>`;
    });

    let tableOptions = '<option value="none">Без стола</option>';
    state.tables.forEach(t => {
        const count = state.guests.filter(g => g.tableId === t.id).length;
        tableOptions += `<option value="${t.id}">${getTableName(t)} (${count}/${t.capacity})</option>`;
    });

    filtered.forEach((guest, rowIdx) => {
        const isSelected = selectedGuests.has(guest.id);
        const tr = document.createElement('tr');
        tr.className = `hover:bg-emerald-50/40 transition-colors ${isSelected ? 'bg-emerald-50/70' : ''}`;
        tr.dataset.guestId = guest.id;
        tr.dataset.row = rowIdx;

        let colCounter = 0;
        const nameCol = colCounter++;

        let phoneTd = '';
        if (showPhone) {
            const phoneCol = colCounter++;
            phoneTd = `
                <td class="p-1">
                    <input type="text" value="${escapeHtml(guest.phone || '')}" 
                           placeholder="+996..." 
                           data-row="${rowIdx}" data-col="${phoneCol}" data-field="phone" data-guest-id="${guest.id}"
                           class="spreadsheet-cell font-mono">
                </td>
            `;
        }

        let catTd = '';
        if (showCat) {
            const catCol = colCounter++;
            catTd = `
                <td class="p-1">
                    <select data-row="${rowIdx}" data-col="${catCol}" data-field="categoryId" data-guest-id="${guest.id}"
                            class="spreadsheet-cell font-medium">
                        ${categoryOptions}
                    </select>
                </td>
            `;
        }

        const tableCol = colCounter++;
        const giftCol = colCounter++;

        tr.innerHTML = `
            <td class="p-1 text-center">
                <input type="checkbox" ${isSelected ? 'checked' : ''} onchange="toggleGuestSelection('${guest.id}')"
                       class="w-4 h-4 text-emerald-800 rounded focus:ring-emerald-700">
            </td>
            <td class="p-1 text-center font-bold text-stone-400 text-[11px] select-none">
                ${rowIdx + 1}
            </td>
            <td class="p-1">
                <input type="text" value="${escapeHtml(guest.name)}" 
                       placeholder="ФИО гостя..." 
                       data-row="${rowIdx}" data-col="${nameCol}" data-field="name" data-guest-id="${guest.id}"
                       class="spreadsheet-cell font-bold text-stone-900">
            </td>
            ${phoneTd}
            ${catTd}
            <td class="p-1">
                <select data-row="${rowIdx}" data-col="${tableCol}" data-field="tableId" data-guest-id="${guest.id}"
                        class="spreadsheet-cell font-medium ${guest.tableId && guest.tableId !== 'none' ? 'text-emerald-950 font-bold' : 'text-stone-500'}">
                    ${tableOptions}
                </select>
            </td>
            <td class="p-1 text-center text-[11px] font-bold text-stone-500 select-none">
                ${(guest.tableId && guest.tableId !== 'none') ? ((guest.seatIndex !== undefined && guest.seatIndex !== -1) ? (guest.seatIndex + 1) : '-') : '-'}
            </td>
            <td class="p-1">
                <input type="number" min="0" step="500" value="${guest.giftAmount || 0}" 
                       data-row="${rowIdx}" data-col="${giftCol}" data-field="giftAmount" data-guest-id="${guest.id}"
                       class="spreadsheet-cell text-right font-bold text-emerald-900">
            </td>
            <td class="p-1 text-center">
                <button type="button" onclick="deleteGuest('${guest.id}')" class="text-stone-300 hover:text-rose-600 p-1 rounded transition" title="Удалить">
                    <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
                </button>
            </td>
        `;

        tbody.appendChild(tr);

        if (showCat) {
            const catSelect = tr.querySelector(`select[data-field="categoryId"]`);
            if (catSelect) catSelect.value = guest.categoryId || 'none';
        }
        const tblSelect = tr.querySelector(`select[data-field="tableId"]`);
        if (tblSelect) tblSelect.value = guest.tableId || 'none';
    });

    attachSpreadsheetKeyNavigation();
    lucide.createIcons();
}

function attachSpreadsheetKeyNavigation() {
    const cells = document.querySelectorAll('.spreadsheet-cell');
    cells.forEach(cell => {
        cell.addEventListener('change', handleSpreadsheetCellChange);
        cell.addEventListener('keydown', handleSpreadsheetKeyDown);
    });
}

function handleSpreadsheetCellChange(e) {
    const cell = e.target;
    const guestId = cell.dataset.guestId;
    const field = cell.dataset.field;
    const guest = state.guests.find(g => g.id === guestId);
    if (!guest) return;

    if (field === 'giftAmount') {
        guest.giftAmount = Math.max(0, parseFloat(cell.value) || 0);
    } else if (field === 'tableId') {
        const newTableId = cell.value;
        if (guest.tableId !== newTableId) {
            assignSeatToGuest(guest, newTableId);
        }
    } else if (field === 'name') {
        guest.name = cell.value.trim();
    } else if (field === 'phone') {
        guest.phone = cell.value.trim();
    } else if (field === 'categoryId') {
        guest.categoryId = cell.value;
    }

    saveState();
    
    // Обновляем счетчики в шапке и карточках
    const seatedCount = state.guests.filter(g => g.tableId && g.tableId !== 'none').length;
    const pcCount = document.getElementById('pc-header-seated-count');
    const mobCount = document.getElementById('header-seated-count');
    if (pcCount) pcCount.innerText = `${seatedCount}/${state.guests.length}`;
    if (mobCount) mobCount.innerText = `${seatedCount}/${state.guests.length}`;
}

function handleSpreadsheetKeyDown(e) {
    const cell = e.target;
    const currentRow = parseInt(cell.dataset.row);
    const currentCol = parseInt(cell.dataset.col);
    const field = cell.dataset.field;
    const filtered = getFilteredGuests();
    const totalRows = filtered.length;

    if (e.key === 'Enter') {
        e.preventDefault();
        // Принудительно сохраняем
        cell.dispatchEvent(new Event('change'));

        if (e.shiftKey) {
            // Shift + Enter: вверх
            if (currentRow > 0) {
                const target = document.querySelector(`.spreadsheet-cell[data-row="${currentRow - 1}"][data-col="${currentCol}"]`);
                if (target) {
                    target.focus();
                    if (target.select) target.select();
                }
            }
        } else {
            // Enter: вниз на ту же колонку
            if (currentRow + 1 < totalRows) {
                const target = document.querySelector(`.spreadsheet-cell[data-row="${currentRow + 1}"][data-col="${currentCol}"]`);
                if (target) {
                    target.focus();
                    if (target.select) target.select();
                }
            } else if (field === 'name') {
                // Если нажали Enter на последней строке в колонке имени — создаем следующую строку
                addSpreadsheetRow();
            }
        }
    } else if (e.key === 'ArrowDown') {
        if (currentRow + 1 < totalRows) {
            const target = document.querySelector(`.spreadsheet-cell[data-row="${currentRow + 1}"][data-col="${currentCol}"]`);
            if (target) {
                target.focus();
                if (target.select) target.select();
            }
        }
    } else if (e.key === 'ArrowUp') {
        if (currentRow > 0) {
            const target = document.querySelector(`.spreadsheet-cell[data-row="${currentRow - 1}"][data-col="${currentCol}"]`);
            if (target) {
                target.focus();
                if (target.select) target.select();
            }
        }
    }
}

function addSpreadsheetRow() {
    const newId = 'gst-' + Date.now();
    const newGuest = {
        id: newId,
        name: '',
        phone: '',
        giftAmount: 0,
        categoryId: 'none',
        tableId: 'none',
        seatIndex: -1
    };
    state.guests.push(newGuest);
    saveState();
    renderGuests();

    // Автоматический фокус на поле имени в созданной строке
    setTimeout(() => {
        const lastRowIdx = getFilteredGuests().length - 1;
        const nameCell = document.querySelector(`.spreadsheet-cell[data-row="${lastRowIdx}"][data-field="name"]`);
        if (nameCell) {
            nameCell.focus();
        }
    }, 50);
}

// ==========================================
//    ПЕЧАТЬ И ПРИГЛАСИТЕЛЬНЫЕ ДЛЯ А4
// ==========================================

let printCurrentMode = 'seating'; // 'seating' | 'schema' | 'invitation_general' | 'invitation_personal'
let printTablesPerPage = 4;
let printInvGenLayout = 2; // 1, 2, or 4 per A4
let printInvPersLayout = 2; // 1, 2, or 4 per A4
let printCustomGeneralText = '';
let printCustomPersonalText = '';
let printIsZoomFit = true;

function openPrintModal(initialMode = 'seating', initialRecipient = null) {
    if (initialMode === 'invitation_general') {
        printCurrentMode = 'invitation_general';
    } else if (initialMode === 'invitation_personal') {
        printCurrentMode = 'invitation_personal';
    } else if (initialMode === 'invitation') {
        printCurrentMode = (initialRecipient === 'general') ? 'invitation_general' : 'invitation_personal';
    } else if (initialMode) {
        printCurrentMode = initialMode;
    }

    // Если настройки были в мобильном дровере, возвращаем их на место в сайдбар ПК
    const content = document.getElementById('print-settings-content');
    const pcSlot = document.getElementById('pc-print-sidebar-slot');
    if (content && pcSlot && content.parentElement !== pcSlot) {
        pcSlot.appendChild(content);
    }
    const mobileDrawer = document.getElementById('mobile-print-settings-drawer');
    if (mobileDrawer) mobileDrawer.classList.add('hidden');

    const select = document.getElementById('print-tables-per-page');
    if (select) {
        printTablesPerPage = parseInt(select.value) || 4;
    }

    // Заполняем поля сведений о событии для быстрой правки перед печатью
    const p = state.profile || {};
    const nameInput = document.getElementById('print-event-name');
    const dateInput = document.getElementById('print-event-date');
    const timeInput = document.getElementById('print-event-time');
    const venueInput = document.getElementById('print-event-venue');
    const hostsInput = document.getElementById('print-event-hosts');

    if (nameInput) nameInput.value = p.eventName || '';
    if (dateInput) dateInput.value = p.date || '';
    if (timeInput) {
        const timeVal = (p.timeStart ? p.timeStart + (p.timeEnd ? ' – ' + p.timeEnd : '') : '');
        timeInput.value = timeVal || '18:00 (сбор гостей в 17:30)';
    }
    if (venueInput) venueInput.value = p.venueName || '';
    if (hostsInput) hostsInput.value = p.hosts || '';

    // Инициализация текстов пригласительных
    const tKey = getDefaultInvitationTemplateKey();
    if (!printCustomGeneralText) {
        printCustomGeneralText = p.invitationText || invitationTemplates[tKey] || invitationTemplates.general;
    }
    if (!printCustomPersonalText) {
        printCustomPersonalText = p.invitationText || invitationTemplates[tKey] || invitationTemplates.wedding;
    }

    const genTextarea = document.getElementById('print-inv-gen-text');
    if (genTextarea) genTextarea.value = printCustomGeneralText;

    const persTextarea = document.getElementById('print-inv-pers-text');
    if (persTextarea) persTextarea.value = printCustomPersonalText;

    const genTplSelect = document.getElementById('print-inv-gen-template-select');
    if (genTplSelect) genTplSelect.value = tKey;

    const persTplSelect = document.getElementById('print-inv-pers-template-select');
    if (persTplSelect) persTplSelect.value = tKey;

    updatePrintGuestSelect(initialRecipient);
    updatePrintTableSelect();

    const filterSelect = document.getElementById('print-inv-pers-filter');
    if (initialRecipient && initialRecipient !== 'general' && initialRecipient !== 'all_personal') {
        if (filterSelect) filterSelect.value = 'selected_only';
    } else {
        if (filterSelect && filterSelect.value === 'selected_only') {
            filterSelect.value = 'all';
        }
    }

    applyPrintModeUI();
    updatePrintPreview();
    openModal('modal-print-guests');
}

function updatePrintTableSelect(selectedTableId = null) {
    const sel = document.getElementById('print-seating-table-filter');
    if (!sel) return;
    const currentVal = sel.value;
    sel.innerHTML = '<option value="all">Все столы (согласно сетке)</option>';

    if (state.tables && state.tables.length > 0) {
        const sorted = [...state.tables].sort((a, b) => (a.number || 0) - (b.number || 0));
        sorted.forEach(t => {
            const seated = state.guests.filter(g => g.tableId === t.id).length;
            const opt = document.createElement('option');
            opt.value = t.id;
            opt.innerText = `Стол №${t.number}${t.name ? ` «${t.name}»` : ''} (${seated}/${t.capacity} мест)`;
            if (selectedTableId && t.id === selectedTableId) {
                opt.selected = true;
            } else if (!selectedTableId && currentVal === t.id) {
                opt.selected = true;
            }
            sel.appendChild(opt);
        });
    }
}

function openPrintModalForTable(tableId) {
    openPrintModal('seating');
    setTimeout(() => {
        updatePrintTableSelect(tableId);
        const sel = document.getElementById('print-seating-table-filter');
        if (sel) {
            sel.value = tableId;
        }
        updatePrintPreview();
    }, 50);
}

function updatePrintGuestSelect(selectedGuestId = null) {
    const sel = document.getElementById('print-inv-pers-guest-select');
    if (!sel) return;
    sel.innerHTML = '';

    if (!state.guests || state.guests.length === 0) {
        sel.innerHTML = '<option value="">Нет гостей в списке</option>';
        return;
    }

    state.guests.forEach(g => {
        const table = state.tables.find(t => t.id === g.tableId);
        const tblName = table ? getTableName(table) : 'Без стола';
        const opt = document.createElement('option');
        opt.value = g.id;
        opt.innerText = `${g.name} (${tblName})`;
        if (selectedGuestId && g.id === selectedGuestId) {
            opt.selected = true;
        }
        sel.appendChild(opt);
    });
}

function switchPrintMode(mode) {
    printCurrentMode = mode;
    applyPrintModeUI();
    updatePrintPreview();
}

function applyPrintModeUI() {
    const seatingBtn = document.getElementById('print-tab-seating-btn');
    const schemaBtn = document.getElementById('print-tab-schema-btn');
    const invGenBtn = document.getElementById('print-tab-inv-gen-btn');
    const invPersBtn = document.getElementById('print-tab-inv-pers-btn');

    const mobileSeatingBtn = document.getElementById('mobile-tab-btn-seating');
    const mobileSchemaBtn = document.getElementById('mobile-tab-btn-schema');
    const mobileInvGenBtn = document.getElementById('mobile-tab-btn-inv-gen');
    const mobileInvPersBtn = document.getElementById('mobile-tab-btn-inv-pers');

    const seatingToolbar = document.getElementById('print-seating-toolbar');
    const schemaToolbar = document.getElementById('print-schema-toolbar');
    const invGenToolbar = document.getElementById('print-invitation-gen-toolbar');
    const invPersToolbar = document.getElementById('print-invitation-pers-toolbar');

    const pcHeading = document.getElementById('pc-print-modal-heading');
    const sheetTitle = document.getElementById('preview-sheet-title');

    // Сброс всех кнопок
    [seatingBtn, schemaBtn, invGenBtn, invPersBtn].forEach(b => {
        if (b) b.className = "py-1.5 px-1 rounded-lg text-[11px] font-bold transition flex items-center justify-center gap-1 text-stone-600 hover:text-stone-900";
    });
    [mobileSeatingBtn, mobileSchemaBtn, mobileInvGenBtn, mobileInvPersBtn].forEach(b => {
        if (b) b.className = "px-2 py-1 rounded-md text-[10px] font-bold transition flex items-center gap-1 text-stone-300 hover:text-white";
    });

    if (seatingToolbar) seatingToolbar.classList.add('hidden');
    if (schemaToolbar) schemaToolbar.classList.add('hidden');
    if (invGenToolbar) invGenToolbar.classList.add('hidden');
    if (invPersToolbar) invPersToolbar.classList.add('hidden');

    if (printCurrentMode === 'seating') {
        if (seatingBtn) seatingBtn.className = "py-1.5 px-1 rounded-lg text-[11px] font-bold transition flex items-center justify-center gap-1 bg-emerald-800 text-white shadow-xs";
        if (mobileSeatingBtn) mobileSeatingBtn.className = "px-2 py-1 rounded-md text-[10px] font-bold transition flex items-center gap-1 bg-emerald-800 text-white shadow-2xs";
        if (seatingToolbar) seatingToolbar.classList.remove('hidden');
        if (pcHeading) pcHeading.innerText = "Центр печати: Списки столов и рассадка (Формат А4)";
        if (sheetTitle) sheetTitle.innerText = "План рассадки столов (А4)";
    } else if (printCurrentMode === 'schema') {
        if (schemaBtn) schemaBtn.className = "py-1.5 px-1 rounded-lg text-[11px] font-bold transition flex items-center justify-center gap-1 bg-emerald-800 text-white shadow-xs";
        if (mobileSchemaBtn) mobileSchemaBtn.className = "px-2 py-1 rounded-md text-[10px] font-bold transition flex items-center gap-1 bg-emerald-800 text-white shadow-2xs";
        if (schemaToolbar) schemaToolbar.classList.remove('hidden');
        if (pcHeading) pcHeading.innerText = "Центр печати: Схема расстановки зала (Формат А4)";
        if (sheetTitle) sheetTitle.innerText = "Схема зала (А4)";
    } else if (printCurrentMode === 'invitation_general') {
        if (invGenBtn) invGenBtn.className = "py-1.5 px-1 rounded-lg text-[11px] font-bold transition flex items-center justify-center gap-1 bg-emerald-800 text-white shadow-xs";
        if (mobileInvGenBtn) mobileInvGenBtn.className = "px-2 py-1 rounded-md text-[10px] font-bold transition flex items-center gap-1 bg-emerald-800 text-white shadow-2xs";
        if (invGenToolbar) invGenToolbar.classList.remove('hidden');
        if (pcHeading) pcHeading.innerText = "Центр печати: Общий пригласительный билет (Формат А4 Альбомный, 1 на лист)";
        if (sheetTitle) sheetTitle.innerText = "Общий пригласительный билет (А4 Альбомный, 1 на лист)";
    } else {
        if (invPersBtn) invPersBtn.className = "py-1.5 px-1 rounded-lg text-[11px] font-bold transition flex items-center justify-center gap-1 bg-emerald-800 text-white shadow-xs";
        if (mobileInvPersBtn) mobileInvPersBtn.className = "px-2 py-1 rounded-md text-[10px] font-bold transition flex items-center gap-1 bg-emerald-800 text-white shadow-2xs";
        if (invPersToolbar) invPersToolbar.classList.remove('hidden');
        if (pcHeading) pcHeading.innerText = "Центр печати: Персональные пригласительные билеты (Формат А4 Альбомный, 1 на лист)";
        if (sheetTitle) sheetTitle.innerText = "Персональные билеты гостей (А4 Альбомный, 1 на лист)";
    }
    lucide.createIcons();
}

function openMobilePrintSettingsDrawer() {
    const content = document.getElementById('print-settings-content');
    const target = document.getElementById('mobile-print-controls-target');
    const drawer = document.getElementById('mobile-print-settings-drawer');
    if (content && target && content.parentElement !== target) {
        target.appendChild(content);
    }
    if (drawer) {
        drawer.classList.remove('hidden');
    }
    lucide.createIcons();
}

function closeMobilePrintSettingsDrawer() {
    const content = document.getElementById('print-settings-content');
    const pcSlot = document.getElementById('pc-print-sidebar-slot');
    const drawer = document.getElementById('mobile-print-settings-drawer');
    if (content && pcSlot && content.parentElement !== pcSlot) {
        pcSlot.appendChild(content);
    }
    if (drawer) {
        drawer.classList.add('hidden');
    }
    lucide.createIcons();
}

// При изменении размера экрана возвращаем настройки в сайдбар ПК
window.addEventListener('resize', () => {
    if (window.innerWidth >= 768) {
        closeMobilePrintSettingsDrawer();
    }
});

function togglePrintZoomFit() {
    printIsZoomFit = !printIsZoomFit;
    const btnText = document.getElementById('btn-print-zoom-text');
    const container = document.getElementById('print-preview-container');
    if (btnText && container) {
        if (printIsZoomFit) {
            btnText.innerText = 'По ширине';
            container.classList.remove('scale-90');
        } else {
            btnText.innerText = '100%';
            container.classList.add('scale-90');
        }
    }
}

function handlePrintEventDetailsChange() {
    const p = state.profile || {};
    const nameInput = document.getElementById('print-event-name');
    const dateInput = document.getElementById('print-event-date');
    const venueInput = document.getElementById('print-event-venue');

    if (nameInput && nameInput.value.trim()) p.eventName = nameInput.value.trim();
    if (dateInput && dateInput.value) p.date = dateInput.value;
    if (venueInput && venueInput.value.trim()) p.venueName = venueInput.value.trim();

    saveState();
    updatePrintPreview();
    if (typeof renderProfileView === 'function') {
        renderProfileView();
    }
}

function applyGeneralInvitationTemplate(templateKey) {
    if (typeof invitationTemplates !== 'undefined' && invitationTemplates[templateKey]) {
        printCustomGeneralText = invitationTemplates[templateKey];
        if (state.profile) {
            state.profile.invitationText = printCustomGeneralText;
            saveState();
        }
        const textarea = document.getElementById('print-inv-gen-text');
        if (textarea) textarea.value = printCustomGeneralText;
        updatePrintPreview();
        if (typeof renderMainInvitationCard === 'function') {
            renderMainInvitationCard();
        }
    }
}

function handleGeneralInvitationTextChange(event) {
    printCustomGeneralText = event.target.value;
    if (state.profile) {
        state.profile.invitationText = printCustomGeneralText;
        saveState();
    }
    updatePrintPreview();
    if (typeof renderMainInvitationCard === 'function') {
        renderMainInvitationCard();
    }
}

function applyPersonalInvitationTemplate(templateKey) {
    if (typeof invitationTemplates !== 'undefined' && invitationTemplates[templateKey]) {
        printCustomPersonalText = invitationTemplates[templateKey];
        const textarea = document.getElementById('print-inv-pers-text');
        if (textarea) textarea.value = printCustomPersonalText;
        updatePrintPreview();
    }
}

function handlePersonalInvitationTextChange(event) {
    printCustomPersonalText = event.target.value;
    updatePrintPreview();
}

function getPrintEventInfo() {
    const p = state.profile || {};
    const nameInputVal = document.getElementById('print-event-name')?.value?.trim();
    const dateInputVal = document.getElementById('print-event-date')?.value;
    const timeInputVal = document.getElementById('print-event-time')?.value?.trim();
    const venueInputVal = document.getElementById('print-event-venue')?.value?.trim();
    const hostsInputVal = document.getElementById('print-event-hosts')?.value?.trim();

    const showHdrName = document.getElementById('print-hdr-name')?.checked !== false;
    const showHdrDate = document.getElementById('print-hdr-date')?.checked !== false;
    const showHdrTime = document.getElementById('print-hdr-time')?.checked !== false;
    const showHdrVenue = document.getElementById('print-hdr-venue')?.checked !== false;
    const showHdrHosts = document.getElementById('print-hdr-hosts')?.checked !== false;
    const showHdrFooter = document.getElementById('print-hdr-footer')?.checked !== false;

    const eventTitle = nameInputVal || p.eventName?.trim() || 'Торжественное мероприятие';
    const eventType = p.eventType || 'Торжество';
    const eventDate = dateInputVal ? formatDate(dateInputVal) : (p.date ? formatDate(p.date) : 'Дата не указана');
    
    let eventTimeFormatted = timeInputVal;
    if (!eventTimeFormatted) {
        eventTimeFormatted = p.timeStart ? `${p.timeStart}${p.timeEnd ? ` – ${p.timeEnd}` : ''}` : '18:00';
    }

    const eventVenueFormatted = venueInputVal || p.venueName?.trim() || 'Место проведения уточняется';
    const eventHostsFormatted = hostsInputVal || p.hosts || '';

    let venueLink = p.venueLink ? p.venueLink.trim() : '';
    if (!venueLink && eventVenueFormatted && eventVenueFormatted !== 'Место проведения уточняется') {
        venueLink = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(eventVenueFormatted)}`;
    }

    return {
        eventTitle,
        eventType,
        eventDate,
        eventTimeFormatted,
        eventVenueFormatted,
        eventHostsFormatted,
        venueLink,
        showHdrName,
        showHdrDate,
        showHdrTime,
        showHdrVenue,
        showHdrHosts,
        showHdrFooter
    };
}

function buildPrintHeaderHtml(options) {
    const {
        eventTitle,
        eventType,
        eventDate,
        eventTimeFormatted,
        eventVenueFormatted,
        eventHostsFormatted,
        showHdrName,
        showHdrDate,
        showHdrTime,
        showHdrVenue,
        showHdrHosts,
        badgeText = 'ПЛАН РАССАДКИ ГОСТЕЙ',
        badgeColor = 'emerald',
        pageNum = 1,
        totalPages = 1,
        subInfo = ''
    } = options;

    const badgeColorClasses = badgeColor === 'amber' 
        ? 'text-amber-900 bg-amber-50 border-amber-300'
        : (badgeColor === 'rose' ? 'text-rose-900 bg-rose-50 border-rose-300' : 'text-emerald-900 bg-emerald-50 border-emerald-300');

    let metaItems = [];
    if (showHdrDate && eventDate) {
        metaItems.push(`<span class="flex items-center gap-1">📅 <strong>Дата:</strong> ${escapeHtml(eventDate)}</span>`);
    }
    if (showHdrTime && eventTimeFormatted) {
        metaItems.push(`<span class="flex items-center gap-1">🕒 <strong>Время:</strong> ${escapeHtml(eventTimeFormatted)}</span>`);
    }
    if (showHdrVenue && eventVenueFormatted) {
        metaItems.push(`<span class="flex items-center gap-1">📍 <strong>Место:</strong> ${escapeHtml(eventVenueFormatted)}</span>`);
    }
    if (showHdrHosts && eventHostsFormatted) {
        metaItems.push(`<span class="flex items-center gap-1">👑 <strong>Организаторы:</strong> ${escapeHtml(eventHostsFormatted)}</span>`);
    }

    const titleHtml = showHdrName 
        ? `<h2 class="text-lg md:text-xl font-extrabold text-stone-900 leading-tight">${escapeHtml(eventTitle)}</h2>`
        : '';

    const metaHtml = metaItems.length > 0 
        ? `<div class="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-stone-700 pt-0.5 font-medium">${metaItems.join('')}</div>`
        : '';

    return `
        <div class="border-b-2 border-stone-900 pb-2 mb-3.5 flex justify-between items-start">
            <div class="space-y-0.5">
                <div class="flex items-center gap-2">
                    <span class="text-[10px] uppercase tracking-widest font-bold border px-2 py-0.5 rounded ${badgeColorClasses}">${escapeHtml(eventType)}</span>
                    <span class="text-xs font-bold text-stone-500 uppercase tracking-wider">${escapeHtml(badgeText)}</span>
                </div>
                ${titleHtml}
                ${metaHtml}
            </div>
            <div class="text-right shrink-0">
                <div class="bg-stone-900 text-white text-[10px] uppercase font-bold px-2.5 py-1 rounded-md">
                    Лист ${pageNum} из ${totalPages}
                </div>
                ${subInfo ? `<span class="text-[10px] text-stone-400 block mt-1 font-semibold">${escapeHtml(subInfo)}</span>` : ''}
            </div>
        </div>
    `;
}

function updatePrintPreview() {
    const previewContainer = document.getElementById('print-preview-container');
    const printOutputArea = document.getElementById('print-output-area');
    if (!previewContainer) return;

    if (printCurrentMode === 'invitation_general') {
        renderInvitationPrintPreview(previewContainer, printOutputArea, 'general');
    } else if (printCurrentMode === 'invitation_personal') {
        renderInvitationPrintPreview(previewContainer, printOutputArea, 'personal');
    } else if (printCurrentMode === 'schema') {
        renderSchemaPrintPreview(previewContainer, printOutputArea);
    } else {
        renderSeatingPrintPreview(previewContainer, printOutputArea);
    }
}

function renderSeatingPrintPreview(previewContainer, printOutputArea) {
    const select = document.getElementById('print-tables-per-page');
    if (select) {
        printTablesPerPage = parseInt(select.value) || 4;
    }

    const tableFilter = document.getElementById('print-seating-table-filter')?.value || 'all';
    const optCheckin = document.getElementById('print-opt-checkin')?.checked !== false;
    const optPhone = document.getElementById('print-opt-phone')?.checked !== false && state.profile?.trackPhones !== false;
    const optCategory = document.getElementById('print-opt-category')?.checked !== false && state.profile?.trackCategories !== false;
    const optEmptySeats = document.getElementById('print-opt-empty-seats')?.checked !== false;
    const optWaiterNotes = document.getElementById('print-opt-waiter-notes')?.checked !== false;
    const optUnassigned = document.getElementById('print-opt-unassigned')?.checked !== false;

    const info = getPrintEventInfo();
    const { eventTitle, eventType, eventDate, eventTimeFormatted, eventVenueFormatted, eventHostsFormatted, showHdrName, showHdrDate, showHdrTime, showHdrVenue, showHdrHosts, showHdrFooter } = info;

    // Сортировка столов по номерам
    let sortedTables = [...state.tables].sort((a, b) => (a.number || 0) - (b.number || 0));

    const isSingleTableFiltered = (tableFilter !== 'all');
    if (isSingleTableFiltered) {
        const found = sortedTables.find(t => t.id === tableFilter);
        sortedTables = found ? [found] : sortedTables;
    }

    const isDedicatedTableMode = isSingleTableFiltered || (printTablesPerPage === 1);

    const tppContainer = document.getElementById('print-tables-per-page-container');
    if (tppContainer) {
        tppContainer.style.display = isSingleTableFiltered ? 'none' : 'block';
    }

    // Разбиваем столы на листы по выбранному количеству
    const chunks = [];
    if (isDedicatedTableMode) {
        sortedTables.forEach(t => chunks.push([t]));
    } else {
        for (let i = 0; i < sortedTables.length; i += printTablesPerPage) {
            chunks.push(sortedTables.slice(i, i + printTablesPerPage));
        }
    }

    const unassignedGuests = (!isSingleTableFiltered && optUnassigned) 
        ? state.guests.filter(g => !g.tableId || g.tableId === 'none')
        : [];
    const totalPages = Math.max(1, chunks.length + (unassignedGuests.length > 0 ? 1 : 0));

    let htmlPages = '';

    chunks.forEach((chunk, pageIndex) => {
        let tablesHtml = '';

        if (isDedicatedTableMode) {
            // === РЕЖИМ ПЕЧАТИ СТОЛА ОТДЕЛЬНО (VIP КАРТОЧКА СТОЛА НА ЛИСТ А4) ===
            const table = chunk[0];
            const tableGuests = state.guests.filter(g => g.tableId === table.id);
            const cat = state.categories.find(c => c.id === table.categoryId);

            let rowsHtml = '';
            tableGuests.forEach((g, idx) => {
                const gCat = state.categories.find(c => c.id === g.categoryId);
                rowsHtml += `
                    <tr class="border-b border-stone-200">
                        <td class="py-2 px-2 font-bold text-center w-8 text-stone-600 bg-stone-50 font-mono">${idx + 1}</td>
                        <td class="py-2 px-3 font-extrabold text-stone-900 text-sm">${escapeHtml(g.name)}</td>
                        ${optCategory ? `<td class="py-2 px-2 text-stone-600 text-xs font-semibold">${gCat ? escapeHtml(gCat.name) : '—'}</td>` : ''}
                        ${optPhone ? `<td class="py-2 px-2 font-mono text-xs text-stone-700">${escapeHtml(g.phone || '—')}</td>` : ''}
                        ${optCheckin ? `<td class="py-2 px-2 text-center w-16 border-l border-stone-200"><span class="inline-block w-4 h-4 border-2 border-stone-400 rounded-md"></span></td>` : ''}
                    </tr>
                `;
            });

            if (optEmptySeats && tableGuests.length < table.capacity) {
                const emptyCount = table.capacity - tableGuests.length;
                for (let e = 0; e < emptyCount; e++) {
                    const seatNum = tableGuests.length + e + 1;
                    rowsHtml += `
                        <tr class="border-b border-stone-200/60 bg-stone-50/50">
                            <td class="py-2 px-2 text-center w-8 text-stone-400 font-mono">${seatNum}</td>
                            <td class="py-2 px-3 text-stone-400 italic text-xs">[ Свободное место ]</td>
                            ${optCategory ? `<td class="text-stone-300">—</td>` : ''}
                            ${optPhone ? `<td class="text-stone-300 font-mono">—</td>` : ''}
                            ${optCheckin ? `<td class="border-l border-stone-200 text-center"><span class="inline-block w-4 h-4 border border-dashed border-stone-300 rounded-md"></span></td>` : ''}
                        </tr>
                    `;
                }
            }

            const waiterNotesHtml = optWaiterNotes ? `
                <div class="mt-4 border-2 border-dashed border-stone-300 rounded-2xl p-4 bg-stone-50/80 text-xs">
                    <div class="flex items-center justify-between text-stone-700 font-bold mb-3 pb-1.5 border-b border-stone-200">
                        <span class="flex items-center gap-1.5">
                            <span>📝</span>
                            <span>Заметки банкетной службы / официантов для ${getTableName(table)}:</span>
                        </span>
                        <span class="text-[9px] uppercase tracking-wider text-stone-400 font-mono">EM Pro v3 • Service Notes</span>
                    </div>
                    <div class="grid grid-cols-2 gap-4 text-xs">
                        <div>
                            <span class="font-bold text-stone-700 block mb-1">🍷 Напитки и подача алкоголя:</span>
                            <div class="border-b border-stone-300 h-6"></div>
                            <div class="border-b border-stone-300 h-6 mt-1"></div>
                        </div>
                        <div>
                            <span class="font-bold text-stone-700 block mb-1">🍲 График горячих блюд:</span>
                            <div class="border-b border-stone-300 h-6"></div>
                            <div class="border-b border-stone-300 h-6 mt-1"></div>
                        </div>
                    </div>
                    <div class="mt-3">
                        <span class="font-bold text-stone-700 text-xs block mb-1">⚠️ Особые пожелания (аллергии, детские стульчики, доп. приборы):</span>
                        <div class="border-b border-stone-300 h-6"></div>
                    </div>
                </div>
            ` : '';

            tablesHtml = `
                <div class="space-y-4">
                    <div class="border-2 border-stone-850 rounded-2xl overflow-hidden bg-white shadow-xs">
                        <div class="bg-gradient-to-r from-stone-900 to-emerald-950 text-white p-3.5 flex justify-between items-center">
                            <div class="flex items-center gap-2.5">
                                <span class="bg-amber-400 text-stone-950 text-xs font-black px-2.5 py-1 rounded-lg uppercase shadow-2xs">Стол № ${table.number}</span>
                                <h3 class="font-bold text-base serif-title tracking-wide">${table.name ? escapeHtml(table.name) : 'Праздничный стол'}</h3>
                            </div>
                            <div class="flex items-center gap-2 text-xs">
                                ${cat && optCategory ? `<span class="bg-white/15 px-2.5 py-1 rounded-lg font-bold">${escapeHtml(cat.name)}</span>` : ''}
                                <span class="bg-amber-400/90 text-stone-950 font-black px-2.5 py-1 rounded-lg">
                                    ${tableGuests.length} / ${table.capacity} мест
                                </span>
                            </div>
                        </div>
                        <table class="w-full text-left text-xs border-collapse">
                            <thead>
                                <tr class="bg-stone-100 border-b border-stone-300 text-[10px] uppercase tracking-wider text-stone-600 font-bold">
                                    <th class="py-2 px-2 text-center w-8">№</th>
                                    <th class="py-2 px-3">ФИО Гостя</th>
                                    ${optCategory ? `<th class="py-2 px-2">Категория</th>` : ''}
                                    ${optPhone ? `<th class="py-2 px-2">Телефон</th>` : ''}
                                    ${optCheckin ? `<th class="py-2 px-2 text-center w-16 border-l border-stone-300">Явка</th>` : ''}
                                </tr>
                            </thead>
                            <tbody class="divide-y divide-stone-100">
                                ${rowsHtml}
                            </tbody>
                        </table>
                    </div>
                    ${waiterNotesHtml}
                </div>
            `;
        } else {
            // === СЕТОЧНЫЙ РЕЖИМ (2, 4, 6 столов на А4) ===
            let gridClass = 'grid grid-cols-1 md:grid-cols-2 gap-4';
            if (printTablesPerPage === 2) gridClass = 'grid grid-cols-1 md:grid-cols-2 gap-4';
            else if (printTablesPerPage === 4) gridClass = 'grid grid-cols-2 gap-3.5';
            else if (printTablesPerPage === 6) gridClass = 'grid grid-cols-2 gap-2 text-[10px]';

            let gridCards = '';
            chunk.forEach(table => {
                const tableGuests = state.guests.filter(g => g.tableId === table.id);
                const cat = state.categories.find(c => c.id === table.categoryId);

                let rowsHtml = '';
                tableGuests.forEach((g, idx) => {
                    const gCat = state.categories.find(c => c.id === g.categoryId);
                    rowsHtml += `
                        <tr class="border-b border-stone-200">
                            <td class="py-1 px-1.5 font-bold text-center w-6 text-stone-500">${idx + 1}</td>
                            <td class="py-1 px-1.5 font-bold text-stone-900">${escapeHtml(g.name)}</td>
                            ${optCategory ? `<td class="py-1 px-1.5 text-stone-500 text-[10px]">${gCat ? escapeHtml(gCat.name) : ''}</td>` : ''}
                            ${optPhone ? `<td class="py-1 px-1.5 font-mono text-[10px] text-stone-600">${escapeHtml(g.phone || '')}</td>` : ''}
                            ${optCheckin ? `<td class="py-1 px-1.5 text-center w-12 border-l border-stone-200"><span class="inline-block w-3.5 h-3.5 border border-stone-400 rounded-xs"></span></td>` : ''}
                        </tr>
                    `;
                });

                if (optEmptySeats && tableGuests.length < table.capacity) {
                    const emptyCount = table.capacity - tableGuests.length;
                    for (let e = 0; e < emptyCount; e++) {
                        const seatNum = tableGuests.length + e + 1;
                        rowsHtml += `
                            <tr class="border-b border-stone-200/50 bg-stone-50/40">
                                <td class="py-1 px-1.5 text-center w-6 text-stone-300 font-mono">${seatNum}</td>
                                <td class="py-1 px-1.5 text-stone-300 italic text-[11px]">[ Свободное место ]</td>
                                ${optCategory ? `<td></td>` : ''}
                                ${optPhone ? `<td></td>` : ''}
                                ${optCheckin ? `<td class="border-l border-stone-200"></td>` : ''}
                            </tr>
                        `;
                    }
                }

                gridCards += `
                    <div class="border-2 border-stone-800 rounded-xl overflow-hidden print-avoid-break bg-white flex flex-col justify-between">
                        <div>
                            <div class="bg-stone-900 text-white px-3 py-1.5 flex justify-between items-center">
                                <h4 class="font-bold text-xs uppercase tracking-wide">${getTableName(table)}</h4>
                                <span class="text-[10px] font-bold bg-white/20 px-2 py-0.5 rounded">
                                    ${tableGuests.length} / ${table.capacity} чел
                                </span>
                            </div>
                            ${cat && optCategory ? `<div class="bg-stone-100 text-stone-600 px-3 py-0.5 text-[9px] font-bold border-b border-stone-200">Категория: ${escapeHtml(cat.name)}</div>` : ''}
                            <table class="w-full text-left text-xs border-collapse">
                                <thead>
                                    <tr class="bg-stone-100 border-b border-stone-300 text-[9px] uppercase tracking-wider text-stone-600 font-bold">
                                        <th class="py-1 px-1.5 text-center w-6">№</th>
                                        <th class="py-1 px-1.5">ФИО Гостя</th>
                                        ${optCategory ? `<th class="py-1 px-1.5">Категория</th>` : ''}
                                        ${optPhone ? `<th class="py-1 px-1.5">Телефон</th>` : ''}
                                        ${optCheckin ? `<th class="py-1 px-1.5 text-center w-12 border-l border-stone-300">Отм.</th>` : ''}
                                    </tr>
                                </thead>
                                <tbody>
                                    ${rowsHtml}
                                </tbody>
                            </table>
                        </div>
                    </div>
                `;
            });
            tablesHtml = `<div class="${gridClass}">${gridCards}</div>`;
        }

        const pageBadge = isDedicatedTableMode 
            ? `КАРТОЧКА СТОЛА №${chunk[0]?.number || ''}`
            : 'ПЛАН РАССАДКИ ГОСТЕЙ';

        const pageHeaderHtml = buildPrintHeaderHtml({
            eventTitle,
            eventType,
            eventDate,
            eventTimeFormatted,
            eventVenueFormatted,
            eventHostsFormatted,
            showHdrName,
            showHdrDate,
            showHdrTime,
            showHdrVenue,
            showHdrHosts,
            badgeText: pageBadge,
            badgeColor: 'emerald',
            pageNum: pageIndex + 1,
            totalPages: totalPages,
            subInfo: isDedicatedTableMode ? getTableName(chunk[0]) : `Столы: ${chunk.map(t => '#' + t.number).join(', ')}`
        });

        const footerHtml = showHdrFooter ? `
            <div class="border-t border-stone-300 pt-2 mt-4 flex justify-between items-center text-[9px] text-stone-400 select-none">
                <span>EM Pro v3 • Распечатано: ${new Date().toLocaleDateString('ru-RU')}</span>
                <span>Всего гостей за столами: ${state.guests.filter(g => g.tableId && g.tableId !== 'none').length} чел.</span>
            </div>
        ` : '';

        const fileSheetName = isDedicatedTableMode ? `Стол_${chunk[0]?.number || (pageIndex + 1)}` : `Рассадка_Лист_${pageIndex + 1}`;

        htmlPages += `
            <div id="seating-page-sheet-${pageIndex}" class="a4-sheet-preview print-page-sheet flex flex-col justify-between">
                <div>
                    <!-- Панель быстрых действий на листе стола (только на экране) -->
                    <div class="no-print flex flex-wrap justify-between items-center bg-stone-100/90 border border-stone-250 rounded-xl px-3 py-1.5 mb-2.5 text-xs select-none gap-2">
                        <span class="font-bold text-stone-700 flex items-center gap-1.5">
                            <span class="bg-emerald-800 text-white text-[10px] font-mono px-2 py-0.5 rounded-md">Лист ${pageIndex + 1} из ${totalPages}</span>
                            <span>${isDedicatedTableMode ? getTableName(chunk[0]) : `Столы: ${chunk.map(t => '#' + t.number).join(', ')}`}</span>
                        </span>
                        <div class="flex items-center gap-1.5">
                            <button type="button" onclick="downloadCurrentInvitationPDF(document.getElementById('seating-page-sheet-${pageIndex}'), '${fileSheetName}.pdf')" class="bg-emerald-800 hover:bg-emerald-700 text-white text-[11px] font-bold py-1 px-2.5 rounded-lg transition flex items-center gap-1 shadow-2xs active:scale-95" title="Скачать этот лист в PDF">
                                <i data-lucide="file-down" class="w-3.5 h-3.5"></i>
                                <span>Скачать PDF</span>
                            </button>
                            <button type="button" onclick="triggerPrint()" class="bg-amber-400 hover:bg-amber-300 text-stone-950 text-[11px] font-bold py-1 px-2.5 rounded-lg transition flex items-center gap-1 shadow-2xs active:scale-95" title="Печать">
                                <i data-lucide="printer" class="w-3.5 h-3.5"></i>
                                <span>Печать</span>
                            </button>
                        </div>
                    </div>
                    ${pageHeaderHtml}
                    ${tablesHtml}
                </div>
                ${footerHtml}
            </div>
        `;
    });

    // Страница гостей без стола (если есть и включено)
    if (optUnassigned && unassignedGuests.length > 0) {
        let unassignedRows = '';
        unassignedGuests.forEach((g, idx) => {
            const gCat = state.categories.find(c => c.id === g.categoryId);
            unassignedRows += `
                <tr class="border-b border-stone-200">
                    <td class="py-1 px-1.5 font-bold text-center w-8 text-stone-500">${idx + 1}</td>
                    <td class="py-1 px-1.5 font-bold text-stone-900">${escapeHtml(g.name)}</td>
                    ${optCategory ? `<td class="py-1 px-1.5 text-stone-500 text-[11px]">${gCat ? escapeHtml(gCat.name) : ''}</td>` : ''}
                    ${optPhone ? `<td class="py-1 px-1.5 font-mono text-[11px] text-stone-600">${escapeHtml(g.phone || '')}</td>` : ''}
                    ${optCheckin ? `<td class="py-1 px-1.5 text-center w-16 border-l border-stone-200"><span class="inline-block w-4 h-4 border border-stone-400 rounded-xs"></span></td>` : ''}
                </tr>
            `;
        });

        const unassignedHeader = buildPrintHeaderHtml({
            eventTitle,
            eventType,
            eventDate,
            eventTimeFormatted,
            eventVenueFormatted,
            eventHostsFormatted,
            showHdrName,
            showHdrDate,
            showHdrTime,
            showHdrVenue,
            showHdrHosts,
            badgeText: 'ГОСТИ БЕЗ СТОЛА / РЕЗЕРВ',
            badgeColor: 'rose',
            pageNum: totalPages,
            totalPages: totalPages,
            subInfo: 'Резерв'
        });

        const footerHtml = showHdrFooter ? `
            <div class="border-t border-stone-300 pt-2 mt-4 flex justify-between items-center text-[9px] text-stone-400">
                <span>EM Pro v3 • Нерассаженные гости: ${unassignedGuests.length} чел.</span>
                <span>Лист ${totalPages} из ${totalPages}</span>
            </div>
        ` : '';

        htmlPages += `
            <div class="a4-sheet-preview print-page-sheet flex flex-col justify-between">
                <div>
                    ${unassignedHeader}
                    <div class="border-2 border-stone-800 rounded-xl overflow-hidden">
                        <table class="w-full text-left text-xs border-collapse">
                            <thead>
                                <tr class="bg-stone-900 text-white text-[10px] uppercase font-bold">
                                    <th class="py-1.5 px-2 text-center w-8">№</th>
                                    <th class="py-1.5 px-2">ФИО Гостя</th>
                                    ${optCategory ? `<th class="py-1.5 px-2">Категория</th>` : ''}
                                    ${optPhone ? `<th class="py-1.5 px-2">Телефон</th>` : ''}
                                    ${optCheckin ? `<th class="py-1.5 px-2 text-center w-16">Отметка</th>` : ''}
                                </tr>
                            </thead>
                            <tbody>
                                ${unassignedRows}
                            </tbody>
                        </table>
                    </div>
                </div>
                ${footerHtml}
            </div>
        `;
    }

    if (sortedTables.length === 0 && unassignedGuests.length === 0) {
        htmlPages = `
            <div class="text-center py-16 text-stone-400">
                <i data-lucide="printer" class="w-12 h-12 mx-auto mb-2 text-stone-300"></i>
                <p class="text-sm font-bold">В списке пока нет столов и гостей для печати</p>
            </div>
        `;
    }

    previewContainer.innerHTML = htmlPages;
    if (printOutputArea) {
        printOutputArea.innerHTML = htmlPages;
    }
    lucide.createIcons();
}

function renderSchemaPrintPreview(previewContainer, printOutputArea) {
    const orientationSelect = document.getElementById('print-schema-orientation');
    const orientation = orientationSelect ? orientationSelect.value : 'landscape';
    const isLandscape = orientation === 'landscape';

    const optLegend = document.getElementById('print-schema-opt-legend')?.checked !== false;
    const optSummary = document.getElementById('print-schema-opt-summary')?.checked !== false;

    const info = getPrintEventInfo();
    const { eventTitle, eventType, eventDate, eventTimeFormatted, eventVenueFormatted, eventHostsFormatted, showHdrName, showHdrDate, showHdrTime, showHdrVenue, showHdrHosts, showHdrFooter } = info;

    const schemaImgUrl = (typeof getCanvasPrintImage === 'function') ? getCanvasPrintImage() : null;

    const totalTables = state.tables.length;
    const totalCapacity = state.tables.reduce((acc, t) => acc + (t.capacity || 0), 0);
    const seatedCount = state.guests.filter(g => g.tableId && g.tableId !== 'none').length;
    const freeCount = Math.max(0, totalCapacity - seatedCount);
    const seatedPercent = totalCapacity > 0 ? Math.round((seatedCount / totalCapacity) * 100) : 0;

    const headerHtml = buildPrintHeaderHtml({
        eventTitle,
        eventType,
        eventDate,
        eventTimeFormatted,
        eventVenueFormatted,
        eventHostsFormatted,
        showHdrName,
        showHdrDate,
        showHdrTime,
        showHdrVenue,
        showHdrHosts,
        badgeText: 'СХЕМА РАССТАНОВКИ СТОЛОВ ЗАЛА',
        badgeColor: 'amber',
        pageNum: 1,
        totalPages: 1,
        subInfo: `Всего столов: ${totalTables}`
    });

    const legendHtml = optLegend ? `
        <div class="bg-stone-50 border border-stone-200/90 rounded-xl p-2 px-3 mb-2.5 flex flex-wrap items-center justify-between gap-2 text-[10px] font-semibold text-stone-700">
            <span class="font-bold uppercase tracking-wider text-stone-500 text-[9px]">Обозначения:</span>
            <div class="flex items-center gap-1.5">
                <span class="w-3.5 h-3.5 rounded bg-amber-100 border border-amber-400 inline-block"></span>
                <span>Президиум (Сцена)</span>
            </div>
            <div class="flex items-center gap-1.5">
                <span class="w-3.5 h-3.5 rounded-full bg-emerald-900 border border-amber-400 inline-block"></span>
                <span>Занятое место</span>
            </div>
            <div class="flex items-center gap-1.5">
                <span class="w-3.5 h-3.5 rounded-full bg-white border border-stone-300 inline-block"></span>
                <span>Свободное место</span>
            </div>
            <div class="flex items-center gap-1.5">
                <span class="w-3.5 h-3.5 rounded-full bg-emerald-50 border border-emerald-600 inline-block"></span>
                <span>Стол рассадки</span>
            </div>
            <div class="flex items-center gap-1.5">
                <span class="w-3.5 h-3.5 rounded-full bg-red-50 border-2 border-red-600 inline-block"></span>
                <span>Полный стол (100%)</span>
            </div>
        </div>
    ` : '';

    const summaryHtml = optSummary ? `
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-2 text-center">
            <div class="bg-stone-50 border border-stone-200 rounded-lg p-1.5">
                <span class="text-[9px] text-stone-500 uppercase font-bold block">Столов в зале</span>
                <span class="text-sm font-extrabold text-stone-900">${totalTables}</span>
            </div>
            <div class="bg-emerald-50 border border-emerald-200 rounded-lg p-1.5">
                <span class="text-[9px] text-emerald-800 uppercase font-bold block">Вместимость зала</span>
                <span class="text-sm font-extrabold text-emerald-950">${totalCapacity} мест</span>
            </div>
            <div class="bg-amber-50 border border-amber-200 rounded-lg p-1.5">
                <span class="text-[9px] text-amber-800 uppercase font-bold block">Рассажено гостей</span>
                <span class="text-sm font-extrabold text-amber-950">${seatedCount} чел (${seatedPercent}%)</span>
            </div>
            <div class="bg-stone-50 border border-stone-200 rounded-lg p-1.5">
                <span class="text-[9px] text-stone-500 uppercase font-bold block">Свободных мест</span>
                <span class="text-sm font-extrabold text-stone-700">${freeCount} мест</span>
            </div>
        </div>
    ` : '';

    let imageBlock = '';
    if (schemaImgUrl) {
        imageBlock = `
            <div class="border-2 border-stone-800 rounded-2xl overflow-hidden bg-white shadow-xs p-1 flex items-center justify-center relative my-1">
                <img src="${schemaImgUrl}" alt="Схема зала" class="w-full ${isLandscape ? 'max-h-[125mm]' : 'max-h-[160mm]'} object-contain mx-auto">
            </div>
        `;
    } else {
        imageBlock = `
            <div class="border-2 border-dashed border-stone-300 rounded-2xl p-10 text-center text-stone-400">
                <i data-lucide="map" class="w-12 h-12 mx-auto mb-2 text-stone-300"></i>
                <p class="font-bold text-xs">Схема пока пуста. Добавьте столы во вкладке «Столы» или «Схема зала»</p>
            </div>
        `;
    }

    const footerHtml = showHdrFooter ? `
        <div class="border-t border-stone-300 pt-2 mt-3 flex justify-between items-center text-[9px] text-stone-500 select-none">
            <span>EM Pro v3 • Схема расстановки столов в банкетном зале • Сформировано: ${new Date().toLocaleDateString('ru-RU')}</span>
            <div class="flex items-center gap-6">
                <span>Администратор зала: _______________</span>
                <span>Организатор: _______________</span>
                <span>Лист 1 из 1</span>
            </div>
        </div>
    ` : '';

    const pageClass = isLandscape ? 'a4-sheet-preview a4-sheet-landscape print-page-sheet' : 'a4-sheet-preview print-page-sheet';

    const html = `
        <div class="${pageClass} flex flex-col justify-between">
            <div>
                ${headerHtml}
                ${legendHtml}
                ${summaryHtml}
                ${imageBlock}
            </div>
            ${footerHtml}
        </div>
    `;

    previewContainer.innerHTML = html;
    if (printOutputArea) {
        printOutputArea.innerHTML = html;
    }
    lucide.createIcons();
}

function renderInvitationPrintPreview(previewContainer, printOutputArea, invitationType = 'general') {
    const isGeneral = invitationType === 'general';
    const { eventTitle, eventType, eventDate, eventTimeFormatted, eventVenueFormatted, eventHostsFormatted, venueLink } = getPrintEventInfo();
    
    let invText = '';
    if (isGeneral) {
        invText = document.getElementById('print-inv-gen-text')?.value?.trim() || printCustomGeneralText || invitationTemplates.general;
    } else {
        invText = document.getElementById('print-inv-pers-text')?.value?.trim() || printCustomPersonalText || invitationTemplates.wedding;
    }

    let guestCardsData = [];
    if (isGeneral) {
        // ОБЩИЙ ПРИГЛАСИТЕЛЬНЫЙ: ровно 1 лист А4 горизонтального формата
        guestCardsData.push({
            name: null,
            tableInfo: null,
            isPersonal: false
        });
    } else {
        // ПЕРСОНАЛЬНЫЕ ПРИГЛАСИТЕЛЬНЫЕ: каждый гость получает 1 полный лист А4 альбомного формата
        const filterVal = document.getElementById('print-inv-pers-filter')?.value || 'all';
        let targetGuests = [...state.guests];
        if (filterVal === 'selected_only') {
            const selGuestId = document.getElementById('print-inv-pers-guest-select')?.value;
            const singleGuest = state.guests.find(g => g.id === selGuestId);
            if (singleGuest) {
                targetGuests = [singleGuest];
            }
        } else if (filterVal === 'seated_only') {
            targetGuests = targetGuests.filter(g => g.tableId && g.tableId !== 'none');
        }

        if (targetGuests.length > 0) {
            guestCardsData = targetGuests.map(g => {
                const table = state.tables.find(t => t.id === g.tableId);
                const tableInfo = table ? `${getTableName(table)}${table.name ? ` («${table.name}»)` : ''}` : 'Персональное место за праздничным столом';
                return {
                    id: g.id,
                    name: g.name,
                    phone: g.phone,
                    tableInfo: tableInfo,
                    isPersonal: true
                };
            });
        } else {
            guestCardsData = [{
                name: 'Уважаемый(ая) Гость',
                tableInfo: 'Стол № 1 («Почетные гости»)',
                isPersonal: true
            }];
        }
    }

    // Все пригласительные строго по 1 штуке на полный горизонтальный лист А4
    setPrintLandscape(true);

    let htmlPages = '';

    guestCardsData.forEach((card, pageIdx) => {
        const cardHtml = buildSingleInvitationCardHtml(
            card,
            eventTitle,
            eventType,
            eventDate,
            eventTimeFormatted,
            eventVenueFormatted,
            invText,
            venueLink,
            eventHostsFormatted
        );

        const safeGuestName = (card.isPersonal && card.name) ? card.name.replace(/[\\/:*?"<>|]/g, '_') : 'Общее';
        const fileBaseName = `Пригласительное_${safeGuestName}`;

        htmlPages += `
            <div id="inv-page-sheet-${pageIdx}" class="a4-sheet-preview a4-sheet-landscape print-page-sheet flex flex-col justify-between relative group" style="width: 297mm; max-width: 297mm; min-height: 200mm; max-height: 210mm; aspect-ratio: 297/210; box-sizing: border-box; overflow: hidden; padding: 6mm 8mm;">
                <!-- Верхняя компактная панель быстрых действий на листе (только на экране) -->
                <div class="no-print flex flex-wrap justify-between items-center bg-stone-100/90 border border-stone-250 rounded-xl px-3 py-1.5 mb-2.5 text-xs select-none gap-2">
                    <span class="font-bold text-stone-700 flex items-center gap-1.5">
                        <span class="bg-emerald-800 text-white text-[10px] font-mono px-2 py-0.5 rounded-md">Лист ${pageIdx + 1} из ${guestCardsData.length}</span>
                        <span class="truncate max-w-[200px] sm:max-w-xs">${card.isPersonal && card.name ? escapeHtml(card.name) : 'Общий бланк билета'}</span>
                        <span class="text-[10px] text-amber-800 font-semibold bg-amber-100/80 px-2 py-0.5 rounded-md">А4 Горизонтально</span>
                    </span>
                    <div class="flex items-center gap-1.5">
                        <button type="button" onclick="downloadCurrentInvitationImage(document.getElementById('inv-page-sheet-${pageIdx}'), '${fileBaseName}.png')" class="bg-amber-400 hover:bg-amber-300 text-stone-950 text-[11px] font-bold py-1 px-2.5 rounded-lg transition flex items-center gap-1 shadow-2xs active:scale-95" title="Скачать этот лист как фото (PNG)">
                            <i data-lucide="camera" class="w-3.5 h-3.5"></i>
                            <span class="hidden sm:inline">Скачать фото</span>
                        </button>
                        <button type="button" onclick="downloadCurrentInvitationPDF(document.getElementById('inv-page-sheet-${pageIdx}'), '${fileBaseName}.pdf')" class="bg-emerald-800 hover:bg-emerald-700 text-white text-[11px] font-bold py-1 px-2.5 rounded-lg transition flex items-center gap-1 shadow-2xs active:scale-95" title="Скачать этот лист в PDF (со ссылкой на место)">
                            <i data-lucide="file-down" class="w-3.5 h-3.5"></i>
                            <span class="hidden sm:inline">Скачать PDF</span>
                        </button>
                        ${card.isPersonal && card.id ? `
                        <button type="button" onclick="sendWhatsAppPersonalInvitation('${card.id}')" class="bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold py-1 px-2.5 rounded-lg transition flex items-center gap-1 shadow-2xs active:scale-95" title="Отправить гостю в WhatsApp">
                            <i data-lucide="message-circle" class="w-3.5 h-3.5 text-amber-300"></i>
                            <span class="hidden sm:inline">WhatsApp</span>
                        </button>
                        ` : ''}
                    </div>
                </div>

                <!-- Роскошный пригласительный билет на полный горизонтальный А4 -->
                <div class="flex-1 flex flex-col justify-between">
                    ${cardHtml}
                </div>

                <!-- Нижняя полоса с метаданными (скрыта при экспорте PDF/печати) -->
                <div class="no-print border-t border-stone-200 pt-1 mt-1 flex justify-between items-center text-[9px] text-stone-400 select-none">
                    <span>EM Pro v3 • ${isGeneral ? 'Общий пригласительный билет' : 'Персональный пригласительный билет'} • 1 билет на полный А4 горизонтально</span>
                    <span>Лист ${pageIdx + 1} из ${guestCardsData.length}</span>
                </div>
            </div>
        `;
    });

    previewContainer.innerHTML = htmlPages;
    if (printOutputArea) {
        printOutputArea.innerHTML = htmlPages;
    }
    lucide.createIcons();
}

function buildSingleInvitationCardHtml(cardData, eventTitle, eventType, eventDate, eventTimeFormatted, eventVenueFormatted, invText, venueLink, eventHostsFormatted) {
    if (!cardData) return '';

    const greetingHtml = cardData.isPersonal && cardData.name ? `
        <div class="serif-title font-bold text-amber-950 text-xl md:text-2xl">
            Дорогой(ая) <span class="underline decoration-amber-500 underline-offset-4 font-bold text-amber-950">${escapeHtml(cardData.name)}</span>!
        </div>
    ` : `
        <div class="serif-title font-bold text-amber-950 text-xl md:text-2xl">
            Дорогие друзья, родные и близкие!
        </div>
        <div class="text-xs text-stone-400 mt-1 font-mono">
            Уважаемый(ая) __________________________________________________
        </div>
    `;

    const activeMapLink = venueLink || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(eventVenueFormatted)}`;

    return `
        <div class="invitation-border-luxury rounded-3xl shadow-sm h-full flex flex-col justify-between relative overflow-hidden bg-[#fffdfa] p-3 md:p-5" style="height: 100%; max-height: 194mm; box-sizing: border-box;">
            <!-- Угловые золоченые орнаменты -->
            <div class="invitation-corner invitation-corner-tl"></div>
            <div class="invitation-corner invitation-corner-tr"></div>
            <div class="invitation-corner invitation-corner-bl"></div>
            <div class="invitation-corner invitation-corner-br"></div>

            <div class="invitation-border-inner rounded-2xl p-3 md:p-5 flex-1 flex flex-col justify-between space-y-2">
                <!-- ВЕРХНЯЯ ШАПКА ПРИГЛАШЕНИЯ -->
                <div class="text-center pt-0.5">
                    <span class="text-[9px] md:text-[10px] uppercase tracking-[0.3em] text-amber-800 font-extrabold inline-block bg-amber-100/80 border border-amber-300 px-3 py-0.5 rounded-full shadow-2xs">
                        ❖ П Р И Г Л А Ш Е Н И Е  Н А  Т О Р Ж Е С Т В О ❖
                    </span>
                    <h2 class="serif-title font-bold text-amber-950 text-2xl md:text-3xl tracking-wide leading-tight mt-1">
                        ${escapeHtml(eventTitle)}
                    </h2>
                    <div class="flex items-center justify-center gap-2 pt-0.5">
                        <span class="h-px w-12 bg-amber-500/50"></span>
                        <span class="text-xs text-amber-700">✦</span>
                        <span class="text-xs font-bold text-emerald-900 tracking-wider uppercase">${escapeHtml(eventType)}</span>
                        <span class="text-xs text-amber-700">✦</span>
                        <span class="h-px w-12 bg-amber-500/50"></span>
                    </div>
                </div>

                <!-- ОСНОВНАЯ ГОРИЗОНТАЛЬНАЯ ЧАСТЬ (2 КОЛОНКИ НА ГОРИЗОНТАЛЬНОМ ЛИСТЕ А4) -->
                <div class="grid grid-cols-1 md:grid-cols-12 gap-4 items-stretch my-auto py-0.5">
                    <!-- ЛЕВАЯ КОЛОНКА: ОБРАЩЕНИЕ, ТЕКСТ И ПОДПИСЬ -->
                    <div class="md:col-span-7 flex flex-col justify-between text-left space-y-2 pr-0 md:pr-2">
                        <!-- Обращение к гостю -->
                        <div>
                            ${greetingHtml}
                        </div>

                        <!-- Текст приглашения -->
                        <div class="flex-1 flex items-center">
                            <p class="text-stone-750 leading-relaxed italic px-1 whitespace-pre-line font-serif text-xs md:text-sm">
                                ${escapeHtml(invText)}
                            </p>
                        </div>

                        <!-- Подпись и пожелание -->
                        <div class="pt-1.5 text-stone-700 border-t border-amber-200/50">
                            <p class="italic serif-title text-xs md:text-sm text-stone-800">Будем счастливы разделить этот радостный день вместе с Вами!</p>
                            <span class="text-[9px] uppercase tracking-wider text-amber-800 font-bold block mt-0.5">
                                С любовью и уважением${eventHostsFormatted ? ` • ${escapeHtml(eventHostsFormatted)}` : ''}
                            </span>
                        </div>
                    </div>

                    <!-- ПРАВАЯ КОЛОНКА: ИНФОБЛОК ТОРЖЕСТВА + ССЫЛКА НА КАРТУ В PDF -->
                    <div class="md:col-span-5 bg-gradient-to-br from-amber-50/90 to-amber-100/60 border border-amber-300/80 rounded-2xl p-3.5 md:p-4 text-stone-850 space-y-2 text-left shadow-2xs flex flex-col justify-between">
                        <div class="text-[10px] uppercase tracking-widest text-amber-900 font-extrabold pb-1 border-b border-amber-200/80 flex items-center justify-between">
                            <span>ИНФОРМАЦИЯ О ТОРЖЕСТВЕ</span>
                            <span class="text-amber-700 font-mono">✦ VIP ✦</span>
                        </div>

                        <!-- Дата -->
                        <div class="flex items-center gap-2.5">
                            <div class="w-7 h-7 rounded-xl bg-amber-200/70 border border-amber-300/80 flex items-center justify-center shrink-0 text-sm shadow-2xs">
                                📅
                            </div>
                            <div>
                                <span class="text-[9px] uppercase font-bold text-stone-500 block leading-tight">Дата торжества</span>
                                <span class="font-bold text-stone-900 text-xs md:text-sm">${escapeHtml(eventDate)}</span>
                            </div>
                        </div>

                        <!-- Время сбора -->
                        <div class="flex items-center gap-2.5">
                            <div class="w-7 h-7 rounded-xl bg-amber-200/70 border border-amber-300/80 flex items-center justify-center shrink-0 text-sm shadow-2xs">
                                🕒
                            </div>
                            <div>
                                <span class="text-[9px] uppercase font-bold text-stone-500 block leading-tight">Время сбора гостей</span>
                                <span class="font-bold text-stone-900 text-xs md:text-sm">${escapeHtml(eventTimeFormatted)}</span>
                            </div>
                        </div>

                        <!-- Место проведения с активной ссылкой на карту прямо в названии -->
                        <div class="pt-1.5 border-t border-amber-200/70">
                            <div class="flex items-start gap-2.5">
                                <div class="w-7 h-7 rounded-xl bg-amber-200/70 border border-amber-300/80 flex items-center justify-center shrink-0 text-sm mt-0.5 shadow-2xs">
                                    📍
                                </div>
                                <div class="flex-1 min-w-0">
                                    <span class="text-[9px] uppercase font-bold text-stone-500 block leading-tight">Место проведения</span>
                                    <!-- Кликабельная ссылка прямо в тексте названия места проведения -->
                                    <a href="${escapeHtml(activeMapLink)}" target="_blank" rel="noopener noreferrer" class="venue-pdf-link font-extrabold text-stone-900 hover:text-emerald-800 text-xs md:text-sm block leading-snug underline decoration-amber-500 decoration-2 underline-offset-2 transition" title="Нажмите, чтобы открыть карту (2ГИС / Карты)">
                                        ${escapeHtml(eventVenueFormatted)} ↗
                                    </a>
                                    <div class="mt-1 flex items-center gap-2">
                                        <a href="${escapeHtml(activeMapLink)}" target="_blank" rel="noopener noreferrer" class="venue-pdf-link inline-flex items-center gap-1 bg-emerald-800 hover:bg-emerald-700 text-white font-bold py-1 px-2 rounded-lg shadow-2xs text-[10px] transition active:scale-95 no-underline">
                                            <span>🗺️ Открыть на карте</span>
                                            <svg class="w-3 h-3 inline-block text-emerald-200" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path></svg>
                                        </a>
                                        <span class="text-[8px] text-stone-400 font-mono truncate max-w-[130px] hidden md:inline">
                                            ${escapeHtml(activeMapLink)}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Персональный стол (если указан) -->
                        ${cardData.tableInfo ? `
                        <div class="pt-1.5 border-t border-amber-200/70 bg-emerald-50/90 -mx-1 px-2.5 py-1.5 rounded-xl border border-emerald-200">
                            <div class="flex items-center gap-2">
                                <span class="text-sm text-emerald-800 font-bold shrink-0">🪑</span>
                                <div class="min-w-0 flex-1">
                                    <span class="text-[8px] uppercase font-bold text-emerald-800 block leading-tight">Ваш стол в зале</span>
                                    <span class="font-bold text-emerald-950 text-xs md:text-sm truncate block">${escapeHtml(cardData.tableInfo)}</span>
                                </div>
                            </div>
                        </div>
                        ` : ''}
                    </div>
                </div>

                <!-- НИЖНЯЯ ДЕКОРАТИВНАЯ ЧЕРТА -->
                <div class="text-center text-[9px] text-stone-400 font-mono tracking-widest pt-0.5 border-t border-amber-200/50">
                    ✦ EM Pro v3 • ПРИГЛАСИТЕЛЬНЫЙ БИЛЕТ • ФОРМАТ А4 АЛЬБОМНЫЙ ✦
                </div>
            </div>
        </div>
    `;
}

// Управление динамической ориентацией страницы при печати
function setPrintLandscape(isLandscape) {
    let style = document.getElementById('dynamic-print-page-style');
    if (!style) {
        style = document.createElement('style');
        style.id = 'dynamic-print-page-style';
        document.head.appendChild(style);
    }
    if (isLandscape) {
        style.innerHTML = `@media print { @page { size: landscape; margin: 5mm; } body { width: 297mm !important; } }`;
        document.body.classList.add('print-landscape-mode');
    } else {
        style.innerHTML = `@media print { @page { size: portrait; margin: 6mm; } body { width: 210mm !important; } }`;
        document.body.classList.remove('print-landscape-mode');
    }
}

// Скачивание пригласительного как фото (PNG) высокого качества
async function downloadCurrentInvitationImage(targetElement = null, customFilename = null) {
    let sheet = targetElement;
    if (!sheet) {
        sheet = document.querySelector('#print-preview-container .a4-sheet-preview');
    }
    if (!sheet) {
        showToast('Лист пригласительного не найден');
        return;
    }

    const noPrintElements = sheet.querySelectorAll('.no-print');
    noPrintElements.forEach(el => el.style.visibility = 'hidden');

    showToast('📸 Подготовка фото высокого разрешения (PNG)...');
    try {
        const canvas = await html2canvas(sheet, {
            scale: 2,
            useCORS: true,
            allowTaint: true,
            backgroundColor: '#ffffff',
            logging: false,
            onclone: (clonedDoc) => {
                const clonedNoPrint = clonedDoc.querySelectorAll('.no-print');
                clonedNoPrint.forEach(el => el.style.display = 'none');
            }
        });

        noPrintElements.forEach(el => el.style.visibility = '');

        const imgData = canvas.toDataURL('image/png', 1.0);
        const a = document.createElement('a');
        let filename = customFilename;
        if (!filename) {
            const p = state.profile || {};
            const cleanTitle = (p.eventName || 'Пригласительное').replace(/[\\/:*?"<>|]/g, '_');
            if (printCurrentMode === 'invitation_personal') {
                const sel = document.getElementById('print-inv-pers-guest-select');
                const guestName = sel && sel.options[sel.selectedIndex] ? sel.options[sel.selectedIndex].text.split('(')[0].trim() : 'Гость';
                filename = `Пригласительное_${guestName.replace(/[\\/:*?"<>|]/g, '_')}.png`;
            } else {
                filename = `Пригласительное_${cleanTitle}.png`;
            }
        }
        a.download = filename;
        a.href = imgData;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        showToast(`✅ Фото успешно скачано! (${filename})`);
    } catch (err) {
        noPrintElements.forEach(el => el.style.visibility = '');
        console.error('Ошибка экспорта изображения:', err);
        showToast('Не удалось сформировать фото');
    }
}

// Скачивание как PDF с активной ссылкой на карту (гарантированно 1 страница без пустых листов)
async function downloadCurrentInvitationPDF(targetElement = null, customFilename = null) {
    let sheet = targetElement;
    if (!sheet) {
        sheet = document.querySelector('#print-preview-container .a4-sheet-preview');
    }
    if (!sheet) {
        showToast('Лист для экспорта PDF не найден');
        return;
    }

    const isLandscape = printCurrentMode === 'invitation_general' || printCurrentMode === 'invitation_personal' || printCurrentMode === 'schema' || sheet.classList.contains('a4-sheet-landscape');

    showToast('📄 Формирование одностраничного PDF (А4)...');
    try {
        let filename = customFilename;
        if (!filename) {
            const p = state.profile || {};
            const cleanTitle = (p.eventName || 'Пригласительное').replace(/[\\/:*?"<>|]/g, '_');
            if (printCurrentMode === 'invitation_personal') {
                const sel = document.getElementById('print-inv-pers-guest-select');
                const guestName = sel && sel.options[sel.selectedIndex] ? sel.options[sel.selectedIndex].text.split('(')[0].trim() : 'Гость';
                filename = `Пригласительное_${guestName.replace(/[\\/:*?"<>|]/g, '_')}.pdf`;
            } else if (printCurrentMode === 'seating') {
                const sel = document.getElementById('print-seating-table-filter');
                const tableName = (sel && sel.value !== 'all' && sel.options[sel.selectedIndex]) ? sel.options[sel.selectedIndex].text.replace(/[\\/:*?"<>|]/g, '_') : 'Рассадка_столов';
                filename = `${tableName}.pdf`;
            } else if (printCurrentMode === 'schema') {
                filename = `Схема_зала_${cleanTitle}.pdf`;
            } else {
                filename = `Пригласительное_${cleanTitle}.pdf`;
            }
        }

        const clone = sheet.cloneNode(true);
        const noPrintItems = clone.querySelectorAll('.no-print');
        noPrintItems.forEach(el => el.remove());

        const widthMm = isLandscape ? 297 : 210;
        const heightMm = isLandscape ? 210 : 297;

        clone.style.margin = '0';
        clone.style.boxShadow = 'none';
        clone.style.border = 'none';
        clone.style.width = `${widthMm}mm`;
        clone.style.maxWidth = `${widthMm}mm`;
        clone.style.height = `${heightMm}mm`;
        clone.style.maxHeight = `${heightMm}mm`;
        clone.style.boxSizing = 'border-box';
        clone.style.overflow = 'hidden';
        clone.style.padding = isLandscape ? '6mm 8mm' : '8mm 8mm';

        const tempContainer = document.createElement('div');
        tempContainer.style.position = 'fixed';
        tempContainer.style.left = '-99999px';
        tempContainer.style.top = '0';
        tempContainer.style.width = `${widthMm}mm`;
        tempContainer.style.height = `${heightMm}mm`;
        tempContainer.style.maxHeight = `${heightMm}mm`;
        tempContainer.style.overflow = 'hidden';
        tempContainer.style.background = '#ffffff';
        tempContainer.style.zIndex = '-1000';
        tempContainer.appendChild(clone);
        document.body.appendChild(tempContainer);

        const opt = {
            margin: 0,
            filename: filename,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: {
                scale: 2,
                useCORS: true,
                logging: false,
                width: isLandscape ? 1122 : 793,
                height: isLandscape ? 793 : 1122,
                windowWidth: isLandscape ? 1122 : 793,
                windowHeight: isLandscape ? 793 : 1122,
                scrollX: 0,
                scrollY: 0
            },
            jsPDF: { unit: 'mm', format: 'a4', orientation: isLandscape ? 'landscape' : 'portrait', compress: true },
            pagebreak: { mode: ['avoid-all'] },
            enableLinks: true
        };

        try {
            const worker = html2pdf().set(opt).from(clone);
            await worker.toPdf().get('pdf').then((pdf) => {
                const totalPages = pdf.internal.getNumberOfPages();
                if (totalPages > 1) {
                    for (let p = totalPages; p > 1; p--) {
                        pdf.deletePage(p);
                    }
                }
            }).save();
            showToast(`✅ Файл «${filename}» сохранён (1 страница)!`);
        } finally {
            if (tempContainer.parentElement) {
                document.body.removeChild(tempContainer);
            }
        }
    } catch (err) {
        console.error('Ошибка экспорта PDF:', err);
        showToast('Используем системный диалог печати PDF...');
        triggerPrint();
    }
}

// Скачивание фото выбранного гостя
function downloadSelectedGuestPhoto() {
    const sel = document.getElementById('print-inv-pers-guest-select');
    const guestId = sel ? sel.value : null;
    if (!guestId) {
        showToast('Выберите гостя из списка');
        return;
    }
    const guest = state.guests.find(g => g.id === guestId);
    const filterSelect = document.getElementById('print-inv-pers-filter');
    if (filterSelect) {
        filterSelect.value = 'selected_only';
    }
    updatePrintPreview();
    setTimeout(() => {
        const guestName = guest ? guest.name : 'Гость';
        const cleanName = guestName.replace(/[\\/:*?"<>|]/g, '_');
        downloadCurrentInvitationImage(null, `Пригласительное_${cleanName}.png`);
    }, 120);
}

function sendWhatsAppPersonalInvitation(guestId) {
    const guest = state.guests.find(g => g.id === guestId);
    if (!guest) {
        showToast('Гость не найден');
        return;
    }

    const p = state.profile || {};
    const eventTitle = p.eventName && p.eventName.trim() ? p.eventName.trim() : 'Торжественное мероприятие';
    const dateText = p.date ? formatDate(p.date) : '';
    const timeText = p.timeStart ? `${p.timeStart}${p.timeEnd ? ` – ${p.timeEnd}` : ''}` : '';
    const venueText = p.venueName && p.venueName.trim() ? p.venueName.trim() : '';
    const table = state.tables.find(t => t.id === guest.tableId);
    const tableName = table ? `${getTableName(table)}${table.name ? ` («${table.name}»)` : ''}` : 'Праздничный стол';
    const seatInfo = (guest.seatIndex !== undefined && guest.seatIndex !== -1) ? ` (Место № ${guest.seatIndex + 1})` : '';

    let msg = `✨ *ПЕРСОНАЛЬНОЕ ПРИГЛАШЕНИЕ* ✨\n\n`;
    msg += `Уважаемый(ая) *${guest.name}*!\n\n`;
    msg += `С искренней радостью приглашаем Вас на наше торжество: *«${eventTitle}»*!\n\n`;
    if (dateText) msg += `📅 *Дата:* ${dateText}\n`;
    if (timeText) msg += `🕒 *Время сбора:* ${timeText}\n`;
    if (venueText) msg += `📍 *Место проведения:* ${venueText}\n`;
    msg += `🍽️ *Ваш столик:* *${tableName}*${seatInfo}\n`;
    if (p.venueLink && p.venueLink.trim()) msg += `🗺️ *Карта / 2ГИС:* ${p.venueLink.trim()}\n`;
    msg += `\nБудем счастливы разделить этот особенный день вместе с Вами! ✨\n`;

    let cleanPhone = (guest.phone || '').replace(/[^0-9+]/g, '');
    if (cleanPhone.startsWith('+')) cleanPhone = cleanPhone.substring(1);
    
    let url = `https://api.whatsapp.com/send?text=${encodeURIComponent(msg)}`;
    if (cleanPhone && cleanPhone.length >= 9) {
        url = `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(msg)}`;
    }
    
    window.open(url, '_blank');
    showToast(`Приглашение для «${guest.name}» готово к отправке в WhatsApp`);
}

async function sendWhatsAppPersonalInvitationPDF(guestId) {
    const guest = state.guests.find(g => g.id === guestId);
    if (!guest) return;
    
    openPrintModal('invitation_personal', guest.id);
    const filterSelect = document.getElementById('print-inv-pers-filter');
    if (filterSelect) filterSelect.value = 'selected_only';
    updatePrintPreview();

    showToast(`📄 Формируем PDF «Пригласительное» для «${guest.name}»...`);
    
    setTimeout(async () => {
        const cleanName = guest.name.replace(/[\\/:*?"<>|]/g, '_');
        await downloadCurrentInvitationPDF(null, `Пригласительное_${cleanName}.pdf`);

        const p = state.profile || {};
        const eventTitle = p.eventName && p.eventName.trim() ? p.eventName.trim() : 'Торжественное мероприятие';
        const dateText = p.date ? formatDate(p.date) : '';
        const table = state.tables.find(t => t.id === guest.tableId);
        const tableName = table ? `${getTableName(table)}${table.name ? ` («${table.name}»)` : ''}` : 'Праздничный стол';

        let msg = `✨ *ПЕРСОНАЛЬНОЕ ПРИГЛАШЕНИЕ (PDF)* ✨\n\n`;
        msg += `Уважаемый(ая) *${guest.name}*!\n`;
        msg += `Приглашаем Вас на торжество *«${eventTitle}»*! 📅 ${dateText}\n`;
        msg += `🍽️ Стол рассадки: *${tableName}*\n`;
        if (p.venueLink && p.venueLink.trim()) msg += `🗺️ Место на карте / 2ГИС: ${p.venueLink.trim()}\n`;
        msg += `📄 _(Файл «Пригласительное.pdf» сформирован — прикрепляю к сообщению)_ ✨\n`;

        let cleanPhone = (guest.phone || '').replace(/[^0-9+]/g, '');
        if (cleanPhone.startsWith('+')) cleanPhone = cleanPhone.substring(1);
        
        setTimeout(() => {
            let url = `https://api.whatsapp.com/send?text=${encodeURIComponent(msg)}`;
            if (cleanPhone && cleanPhone.length >= 9) {
                url = `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(msg)}`;
            }
            window.open(url, '_blank');
        }, 500);
    }, 300);
}

function sendSelectedGuestWhatsApp() {
    const sel = document.getElementById('print-inv-pers-guest-select');
    const guestId = sel ? sel.value : null;
    if (guestId) {
        sendWhatsAppPersonalInvitation(guestId);
    } else {
        showToast('Выберите гостя из списка');
    }
}

function sendSelectedGuestWhatsAppPDF() {
    const sel = document.getElementById('print-inv-pers-guest-select');
    const guestId = sel ? sel.value : null;
    if (guestId) {
        sendWhatsAppPersonalInvitationPDF(guestId);
    } else {
        showToast('Выберите гостя из списка');
    }
}

function triggerPrint() {
    updatePrintPreview();
    const isInvitation = (printCurrentMode === 'invitation_general' || printCurrentMode === 'invitation_personal');
    const orientation = document.getElementById('print-schema-orientation')?.value;
    const isLandscape = isInvitation || (printCurrentMode === 'schema' && orientation === 'landscape');
    
    setPrintLandscape(isLandscape);
    window.print();
}

