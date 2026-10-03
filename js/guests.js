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
        if (pcHeading) pcHeading.innerText = "Центр печати: Общий пригласительный билет (Формат А4)";
        if (sheetTitle) sheetTitle.innerText = "Общий пригласительный билет (А4)";
    } else {
        if (invPersBtn) invPersBtn.className = "py-1.5 px-1 rounded-lg text-[11px] font-bold transition flex items-center justify-center gap-1 bg-emerald-800 text-white shadow-xs";
        if (mobileInvPersBtn) mobileInvPersBtn.className = "px-2 py-1 rounded-md text-[10px] font-bold transition flex items-center gap-1 bg-emerald-800 text-white shadow-2xs";
        if (invPersToolbar) invPersToolbar.classList.remove('hidden');
        if (pcHeading) pcHeading.innerText = "Центр печати: Персональные пригласительные карточки (Формат А4)";
        if (sheetTitle) sheetTitle.innerText = "Персональные карточки гостей (А4)";
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

    return {
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

    const optCheckin = document.getElementById('print-opt-checkin')?.checked !== false;
    const optPhone = document.getElementById('print-opt-phone')?.checked !== false && state.profile?.trackPhones !== false;
    const optCategory = document.getElementById('print-opt-category')?.checked !== false && state.profile?.trackCategories !== false;
    const optEmptySeats = document.getElementById('print-opt-empty-seats')?.checked !== false;
    const optUnassigned = document.getElementById('print-opt-unassigned')?.checked !== false;

    const info = getPrintEventInfo();
    const { eventTitle, eventType, eventDate, eventTimeFormatted, eventVenueFormatted, eventHostsFormatted, showHdrName, showHdrDate, showHdrTime, showHdrVenue, showHdrHosts, showHdrFooter } = info;

    // Сортировка столов по номерам
    const sortedTables = [...state.tables].sort((a, b) => (a.number || 0) - (b.number || 0));

    // Разбиваем столы на листы по выбранному количеству (по умолчанию 4 стола на А4)
    const chunks = [];
    for (let i = 0; i < sortedTables.length; i += printTablesPerPage) {
        chunks.push(sortedTables.slice(i, i + printTablesPerPage));
    }

    const unassignedGuests = state.guests.filter(g => !g.tableId || g.tableId === 'none');
    const totalPages = Math.max(1, chunks.length + ((optUnassigned && unassignedGuests.length > 0) ? 1 : 0));

    let htmlPages = '';

    // Генерация страниц со столами
    chunks.forEach((chunk, pageIndex) => {
        let gridClass = 'grid grid-cols-1 md:grid-cols-2 gap-4';
        if (printTablesPerPage === 1) gridClass = 'grid grid-cols-1 gap-4';
        else if (printTablesPerPage === 2) gridClass = 'grid grid-cols-1 md:grid-cols-2 gap-4';
        else if (printTablesPerPage === 4) gridClass = 'grid grid-cols-2 gap-3.5';
        else if (printTablesPerPage === 6) gridClass = 'grid grid-cols-2 gap-2 text-[10px]';

        let tablesHtml = '';
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

            // Дозаполнение пустыми местами до лимита стола
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

            tablesHtml += `
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
            badgeText: 'ПЛАН РАССАДКИ ГОСТЕЙ',
            badgeColor: 'emerald',
            pageNum: pageIndex + 1,
            totalPages: totalPages,
            subInfo: `Столы: ${chunk.map(t => '#' + t.number).join(', ')}`
        });

        const footerHtml = showHdrFooter ? `
            <div class="border-t border-stone-300 pt-2 mt-4 flex justify-between items-center text-[9px] text-stone-400 select-none">
                <span>EM Pro v3 • Распечатано: ${new Date().toLocaleDateString('ru-RU')}</span>
                <span>Всего гостей за столами: ${state.guests.filter(g => g.tableId && g.tableId !== 'none').length} чел.</span>
            </div>
        ` : '';

        htmlPages += `
            <div class="a4-sheet-preview print-page-sheet flex flex-col justify-between">
                <div>
                    ${pageHeaderHtml}
                    <div class="${gridClass}">
                        ${tablesHtml}
                    </div>
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
    const layoutSelect = isGeneral 
        ? document.getElementById('print-inv-gen-layout')
        : document.getElementById('print-inv-pers-layout');
    
    const layout = layoutSelect ? (parseInt(layoutSelect.value) || 2) : 2;

    const { eventTitle, eventType, eventDate, eventTimeFormatted, eventVenueFormatted } = getPrintEventInfo();
    
    let invText = '';
    if (isGeneral) {
        invText = document.getElementById('print-inv-gen-text')?.value?.trim() || printCustomGeneralText || invitationTemplates.general;
    } else {
        invText = document.getElementById('print-inv-pers-text')?.value?.trim() || printCustomPersonalText || invitationTemplates.wedding;
    }

    let guestCardsData = [];
    if (isGeneral) {
        // ОБЩИЙ ПРИГЛАСИТЕЛЬНЫЙ: генерирует ровно один лист А4 с пустыми строками для рукописного заполнения
        for (let i = 0; i < layout; i++) {
            guestCardsData.push({
                name: null,
                tableInfo: 'Праздничный стол торжества',
                isPersonal: false
            });
        }
    } else {
        // ПЕРСОНАЛЬНЫЕ ПРИГЛАСИТЕЛЬНЫЕ: генерирует карточки с именами конкретных гостей и их столами
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

    // Разбиваем на листы А4 по layout (1, 2 или 4 на лист)
    const cardsPerPage = layout;
    const pages = [];
    for (let i = 0; i < guestCardsData.length; i += cardsPerPage) {
        pages.push(guestCardsData.slice(i, i + cardsPerPage));
    }

    let htmlPages = '';

    pages.forEach((pageCards, pageIdx) => {
        let cardsHtml = '';

        if (cardsPerPage === 1) {
            // 1 роскошный большой билет на весь лист А4
            const card = pageCards[0];
            cardsHtml = `
                <div class="h-full flex flex-col justify-center">
                    ${buildSingleInvitationCardHtml(card, eventTitle, eventType, eventDate, eventTimeFormatted, eventVenueFormatted, invText, 'large')}
                </div>
            `;
        } else if (cardsPerPage === 2) {
            // 2 пригласительных на лист А4 с пунктирной линией отреза
            cardsHtml = `
                <div class="flex flex-col gap-4 h-full justify-between">
                    <div class="flex-1">
                        ${buildSingleInvitationCardHtml(pageCards[0], eventTitle, eventType, eventDate, eventTimeFormatted, eventVenueFormatted, invText, 'medium')}
                    </div>
                    <div class="invitation-cut-line-h py-1 text-center select-none">
                        <span class="bg-white px-3 text-[10px] text-stone-400 font-mono tracking-widest inline-flex items-center gap-1.5">
                            ✂️ ЛИНИЯ РАЗРЕЗА А5 ✂️
                        </span>
                    </div>
                    <div class="flex-1">
                        ${pageCards[1] ? buildSingleInvitationCardHtml(pageCards[1], eventTitle, eventType, eventDate, eventTimeFormatted, eventVenueFormatted, invText, 'medium') : ''}
                    </div>
                </div>
            `;
        } else if (cardsPerPage === 4) {
            // 4 карточки на лист А4 (Сетка 2x2) с линиями отреза
            const c1 = pageCards[0];
            const c2 = pageCards[1];
            const c3 = pageCards[2];
            const c4 = pageCards[3];

            cardsHtml = `
                <div class="grid grid-cols-2 gap-3.5 h-full relative">
                    <div class="p-1">${c1 ? buildSingleInvitationCardHtml(c1, eventTitle, eventType, eventDate, eventTimeFormatted, eventVenueFormatted, invText, 'small') : ''}</div>
                    <div class="p-1">${c2 ? buildSingleInvitationCardHtml(c2, eventTitle, eventType, eventDate, eventTimeFormatted, eventVenueFormatted, invText, 'small') : ''}</div>
                    <div class="col-span-2 invitation-cut-line-h text-center -my-1 select-none">
                        <span class="bg-white px-2 text-[9px] text-stone-400 font-mono">✂️ РАЗРЕЗ А6 ✂️</span>
                    </div>
                    <div class="p-1">${c3 ? buildSingleInvitationCardHtml(c3, eventTitle, eventType, eventDate, eventTimeFormatted, eventVenueFormatted, invText, 'small') : ''}</div>
                    <div class="p-1">${c4 ? buildSingleInvitationCardHtml(c4, eventTitle, eventType, eventDate, eventTimeFormatted, eventVenueFormatted, invText, 'small') : ''}</div>
                </div>
            `;
        }

        htmlPages += `
            <div class="a4-sheet-preview print-page-sheet flex flex-col justify-between" style="min-height: 290mm;">
                <div class="flex-1">
                    ${cardsHtml}
                </div>
                <div class="border-t border-stone-200 pt-1.5 mt-2 flex justify-between items-center text-[9px] text-stone-400 select-none">
                    <span>EM Pro v3 • ${isGeneral ? 'Общий пригласительный билет' : 'Персональные пригласительные карточки'}</span>
                    <span>Лист ${pageIdx + 1} из ${pages.length}</span>
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

function buildSingleInvitationCardHtml(cardData, eventTitle, eventType, eventDate, eventTimeFormatted, eventVenueFormatted, invText, size) {
    if (!cardData) return '';

    const isSmall = size === 'small';
    const isLarge = size === 'large';

    const greetingHtml = cardData.isPersonal && cardData.name ? `
        <div class="serif-title font-bold text-amber-950 ${isSmall ? 'text-xs' : (isLarge ? 'text-xl' : 'text-sm')}">
            Дорогой(ая) <span class="underline decoration-amber-500 underline-offset-4">${escapeHtml(cardData.name)}</span>!
        </div>
    ` : `
        <div class="serif-title font-bold text-amber-950 ${isSmall ? 'text-xs' : (isLarge ? 'text-xl' : 'text-sm')}">
            Дорогие друзья, родные и близкие!
        </div>
        <div class="text-[10px] text-stone-400 mt-1 font-mono">
            Уважаемый(ая) __________________________________________________
        </div>
    `;

    return `
        <div class="invitation-border-luxury rounded-2xl shadow-sm h-full flex flex-col justify-between text-center relative overflow-hidden bg-[#fffdfa] ${isSmall ? 'p-2.5' : (isLarge ? 'p-6' : 'p-4')}">
            <!-- Угловые золоченые орнаменты -->
            <div class="invitation-corner invitation-corner-tl"></div>
            <div class="invitation-corner invitation-corner-tr"></div>
            <div class="invitation-corner invitation-corner-bl"></div>
            <div class="invitation-corner invitation-corner-br"></div>

            <div class="invitation-border-inner rounded-xl space-y-2 flex-1 flex flex-col justify-between ${isSmall ? 'p-2' : (isLarge ? 'p-5' : 'p-3')}">
                <!-- Шапка приглашения -->
                <div>
                    <span class="text-[9px] uppercase tracking-[0.25em] text-amber-800 font-bold block mb-0.5">П Р И Г Л А Ш Е Н И Е</span>
                    <h3 class="serif-title font-bold text-amber-950 leading-tight ${isSmall ? 'text-sm' : (isLarge ? 'text-2xl' : 'text-lg')}">
                        ${escapeHtml(eventTitle)}
                    </h3>
                    <div class="w-16 h-0.5 bg-amber-600/50 mx-auto mt-1 mb-1.5"></div>
                </div>

                <!-- Обращение к гостю -->
                <div class="py-0.5">
                    ${greetingHtml}
                </div>

                <!-- Текст приглашения (с сохранением переносов) -->
                <p class="text-stone-700 leading-relaxed italic px-2 whitespace-pre-line font-serif ${isSmall ? 'text-[10px] line-clamp-4' : (isLarge ? 'text-sm' : 'text-xs')}">
                    ${escapeHtml(invText)}
                </p>

                <!-- Сведения о мероприятии (Дата, Время, Место, Стол) -->
                <div class="bg-amber-50/70 border border-amber-200/80 rounded-xl p-2 my-1 text-stone-800 space-y-1 text-left font-medium ${isSmall ? 'text-[9px]' : (isLarge ? 'text-xs p-3.5 space-y-1.5' : 'text-[11px]')}">
                    <div class="flex items-center gap-2">
                        <span class="text-amber-800 font-bold w-4 text-center shrink-0">📅</span>
                        <span class="font-bold text-stone-900">Дата торжества:</span>
                        <span class="text-stone-700">${escapeHtml(eventDate)}</span>
                    </div>
                    <div class="flex items-center gap-2">
                        <span class="text-amber-800 font-bold w-4 text-center shrink-0">🕒</span>
                        <span class="font-bold text-stone-900">Время сбора:</span>
                        <span class="text-stone-700">${escapeHtml(eventTimeFormatted)}</span>
                    </div>
                    <div class="flex items-center gap-2">
                        <span class="text-amber-800 font-bold w-4 text-center shrink-0">📍</span>
                        <span class="font-bold text-stone-900">Место проведения:</span>
                        <span class="text-stone-700">${escapeHtml(eventVenueFormatted)}</span>
                    </div>
                    ${cardData.tableInfo ? `
                    <div class="flex items-center gap-2 pt-0.5 border-t border-amber-200/70 text-emerald-900 font-semibold">
                        <span class="text-emerald-800 font-bold w-4 text-center shrink-0">🪑</span>
                        <span>Ваш стол:</span>
                        <span class="text-emerald-800 font-bold">${escapeHtml(cardData.tableInfo)}</span>
                    </div>
                    ` : ''}
                </div>

                <!-- Подпись внизу -->
                <div class="pt-1 text-center text-stone-600">
                    <p class="italic serif-title ${isSmall ? 'text-[9px]' : (isLarge ? 'text-xs' : 'text-[10px]')}">Ждём вас с нетерпением и радостью!</p>
                    <span class="text-[8px] uppercase tracking-wider text-amber-800 font-semibold block mt-0.5">С любовью и уважением</span>
                </div>
            </div>
        </div>
    `;
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

function sendWhatsAppPersonalInvitationPDF(guestId) {
    const guest = state.guests.find(g => g.id === guestId);
    if (!guest) return;
    
    openPrintModal('invitation_personal', guest.id);
    
    const p = state.profile || {};
    const eventTitle = p.eventName && p.eventName.trim() ? p.eventName.trim() : 'Торжественное мероприятие';
    const dateText = p.date ? formatDate(p.date) : '';
    const table = state.tables.find(t => t.id === guest.tableId);
    const tableName = table ? `${getTableName(table)}${table.name ? ` («${table.name}»)` : ''}` : 'Праздничный стол';

    let msg = `✨ *ПЕРСОНАЛЬНОЕ ПРИГЛАШЕНИЕ (PDF)* ✨\n\n`;
    msg += `Уважаемый(ая) *${guest.name}*!\n`;
    msg += `Приглашаем Вас на торжество *«${eventTitle}»*! 📅 ${dateText}\n`;
    msg += `🍽️ Стол рассадки: *${tableName}*\n`;
    msg += `📄 _(Прикрепляю персональный пригласительный билет в PDF)_ ✨\n`;

    let cleanPhone = (guest.phone || '').replace(/[^0-9+]/g, '');
    if (cleanPhone.startsWith('+')) cleanPhone = cleanPhone.substring(1);
    
    showToast(`Сформирован билет для «${guest.name}». Сохраните в PDF и отправьте в чат`);
    setTimeout(() => {
        let url = `https://api.whatsapp.com/send?text=${encodeURIComponent(msg)}`;
        if (cleanPhone && cleanPhone.length >= 9) {
            url = `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(msg)}`;
        }
        window.open(url, '_blank');
    }, 700);
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
    const orientation = document.getElementById('print-schema-orientation')?.value;
    if (printCurrentMode === 'schema' && orientation === 'landscape') {
        document.body.classList.add('print-landscape-mode');
    } else {
        document.body.classList.remove('print-landscape-mode');
    }
    window.print();
}

