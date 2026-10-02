// ===== GUESTS.JS — Логика вкладки Гости =====

// --- Переключатель подвкладок списка гостей ---
function switchGuestsViewMode(mode) {
    guestsViewMode = mode;
    saveState();
    
    const modes = ['list', 'spreadsheet', 'tables', 'categories'];
    modes.forEach(m => {
        const btn = document.getElementById(`subtab-btn-${m}`);
        if (btn) {
            if (m === mode) {
                btn.className = "flex-1 justify-center text-center py-1.5 px-1 rounded-md text-[10px] md:text-xs font-bold transition flex items-center gap-1 bg-emerald-800 text-white shadow-xs";
            } else {
                btn.className = "flex-1 justify-center text-center py-1.5 px-1 rounded-md text-[10px] md:text-xs font-bold transition flex items-center gap-1 text-stone-600 hover:text-stone-900 hover:bg-stone-200/50";
            }
        }
    });

    // Если категории отключены, можно скрывать субвкладку категорий
    const catBtn = document.getElementById('subtab-btn-categories');
    if (catBtn) {
        if (state.profile?.trackCategories === false) {
            catBtn.classList.add('hidden');
        } else {
            catBtn.classList.remove('hidden');
        }
    }
    
    renderGuests();
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
        <div class="flex items-center gap-1.5 mt-1.5 select-all">
            <a href="tel:${guest.phone}" class="bg-stone-100 hover:bg-stone-200 text-stone-700 px-2 py-0.5 rounded-md text-[9px] font-bold inline-flex items-center gap-1 transition" title="Позвонить">
                <i data-lucide="phone" class="w-2.5 h-2.5 text-emerald-800"></i> ${guest.phone}
            </a>
            <a href="https://wa.me/${guest.phone.replace(/[^0-9]/g, '')}" target="_blank" class="bg-emerald-50 hover:bg-emerald-100 text-emerald-950 px-2 py-0.5 rounded-md text-[9px] font-bold inline-flex items-center gap-1 transition" title="Написать в WhatsApp">
                <i data-lucide="message-square" class="w-2.5 h-2.5 text-emerald-600"></i> WhatsApp
            </a>
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
            <button onclick="openGuestModal('${guest.id}')" class="text-stone-300 hover:text-emerald-800 p-2 rounded-lg active:scale-90 transition">
                <i data-lucide="edit-3" class="w-4 h-4"></i>
            </button>
            <button onclick="deleteGuest('${guest.id}')" class="text-stone-300 hover:text-red-600 p-2 rounded-lg active:scale-90 transition">
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

let printCurrentMode = 'seating'; // 'seating' | 'invitation'
let printTablesPerPage = 4;
let printInvitationLayout = 2; // 1, 2, or 4 per A4
let printInvitationRecipient = 'all_personal'; // 'all_personal' | 'general'
let printCustomInvitationText = '';

const invitationTemplates = {
    wedding: "С огромной радостью и трепетом в сердце приглашаем вас разделить с нами самый счастливый и незабываемый день нашей жизни — день нашего бракосочетания!\n\nВаше присутствие, тёплые слова и улыбки станут для нас самым бесценным подарком. Будем счастливы видеть вас среди наших самых дорогих и близких гостей!",
    kyz_uzatuu: "Уважаемые и дорогие наши гости!\n\nПриглашаем вас на торжественный вечер проводов невесты (Кыз узатуу). Будем искренне рады разделить с вами этот светлый, радостный и благословенный семейный праздник в кругу самых близких людей!",
    birthday: "Дорогие друзья, родные и близкие!\n\nПриглашаю вас разделить со мной радость торжества и юбилея! В этот особенный день мне будет невероятно приятно собрать всех близких людей за одним праздничным столом и провести этот незабываемый вечер вместе.",
    general: "Дорогие друзья, родные и близкие!\n\nС большой радостью приглашаем вас на наше праздничное семейное торжество! Будем счастливы разделить эти неповторимые мгновения радости, счастья и веселья вместе с вами!",
    short: "Приглашаем вас разделить с нами радость этого праздничного дня! Ждём вас с нетерпением и радостью!"
};

function getDefaultInvitationTemplateKey() {
    const et = (state.profile?.eventType || '').toLowerCase();
    if (et.includes('свадьб')) return 'wedding';
    if (et.includes('кыз') || et.includes('бешик')) return 'kyz_uzatuu';
    if (et.includes('рожден') || et.includes('юбилей')) return 'birthday';
    return 'general';
}

function openPrintModal(initialMode) {
    if (initialMode) {
        printCurrentMode = initialMode;
    }

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

    if (nameInput) nameInput.value = p.eventName || '';
    if (dateInput) dateInput.value = p.date || '';
    if (timeInput) {
        const timeVal = (p.timeStart ? p.timeStart + (p.timeEnd ? ' – ' + p.timeEnd : '') : '');
        timeInput.value = timeVal || '18:00 (сбор гостей в 17:30)';
    }
    if (venueInput) venueInput.value = p.venueName || '';

    // Инициализация текста приглашения
    if (!printCustomInvitationText) {
        const tKey = getDefaultInvitationTemplateKey();
        printCustomInvitationText = invitationTemplates[tKey];
        const templateSelect = document.getElementById('print-invitation-template-select');
        if (templateSelect) templateSelect.value = tKey;
    }
    const invTextarea = document.getElementById('print-invitation-text');
    if (invTextarea) {
        invTextarea.value = printCustomInvitationText;
    }

    applyPrintModeUI();
    updatePrintPreview();
    openModal('modal-print-guests');
}

function switchPrintMode(mode) {
    printCurrentMode = mode;
    applyPrintModeUI();
    updatePrintPreview();
}

function applyPrintModeUI() {
    const seatingBtn = document.getElementById('print-tab-seating-btn');
    const invBtn = document.getElementById('print-tab-invitation-btn');
    const seatingToolbar = document.getElementById('print-seating-toolbar');
    const invToolbar = document.getElementById('print-invitation-toolbar');
    const heading = document.getElementById('print-modal-heading');

    if (printCurrentMode === 'seating') {
        if (seatingBtn) seatingBtn.className = "px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 bg-emerald-800 text-white shadow-xs";
        if (invBtn) invBtn.className = "px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 text-stone-600 hover:text-stone-900";
        if (seatingToolbar) seatingToolbar.classList.remove('hidden');
        if (invToolbar) invToolbar.classList.add('hidden');
        if (heading) heading.innerText = "Печать рассадки гостей (Формат А4)";
    } else {
        if (seatingBtn) seatingBtn.className = "px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 text-stone-600 hover:text-stone-900";
        if (invBtn) invBtn.className = "px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 bg-emerald-800 text-white shadow-xs";
        if (seatingToolbar) seatingToolbar.classList.add('hidden');
        if (invToolbar) invToolbar.classList.remove('hidden');
        if (heading) heading.innerText = "Печать праздничных пригласительных (Формат А4)";
    }
}

function togglePrintEventDetails() {
    const drawer = document.getElementById('print-event-details-drawer');
    const btn = document.getElementById('btn-toggle-print-details');
    if (drawer) {
        const isHidden = drawer.classList.contains('hidden');
        drawer.classList.toggle('hidden');
        if (btn) {
            btn.classList.toggle('bg-emerald-100', isHidden);
            btn.classList.toggle('border-emerald-300', isHidden);
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
}

function applyInvitationTemplate(templateKey) {
    if (invitationTemplates[templateKey]) {
        printCustomInvitationText = invitationTemplates[templateKey];
        const textarea = document.getElementById('print-invitation-text');
        if (textarea) textarea.value = printCustomInvitationText;
        updatePrintPreview();
    }
}

function handleInvitationTextChange(event) {
    printCustomInvitationText = event.target.value;
    updatePrintPreview();
}

function getPrintEventInfo() {
    const p = state.profile || {};
    const nameInputVal = document.getElementById('print-event-name')?.value?.trim();
    const dateInputVal = document.getElementById('print-event-date')?.value;
    const timeInputVal = document.getElementById('print-event-time')?.value?.trim();
    const venueInputVal = document.getElementById('print-event-venue')?.value?.trim();

    const eventTitle = nameInputVal || p.eventName?.trim() || 'Торжественное мероприятие';
    const eventType = p.eventType || 'Торжество';
    const eventDate = dateInputVal ? formatDate(dateInputVal) : (p.date ? formatDate(p.date) : 'Дата не указана');
    
    let eventTimeFormatted = timeInputVal;
    if (!eventTimeFormatted) {
        eventTimeFormatted = p.timeStart ? `${p.timeStart}${p.timeEnd ? ` – ${p.timeEnd}` : ''}` : '18:00';
    }

    const eventVenueFormatted = venueInputVal || p.venueName?.trim() || 'Место проведения уточняется';

    return {
        eventTitle,
        eventType,
        eventDate,
        eventTimeFormatted,
        eventVenueFormatted
    };
}

function updatePrintPreview() {
    const previewContainer = document.getElementById('print-preview-container');
    const printOutputArea = document.getElementById('print-output-area');
    if (!previewContainer) return;

    if (printCurrentMode === 'invitation') {
        renderInvitationPrintPreview(previewContainer, printOutputArea);
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

    const { eventTitle, eventType, eventDate, eventTimeFormatted, eventVenueFormatted } = getPrintEventInfo();

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

        htmlPages += `
            <div class="a4-sheet-preview print-page-sheet flex flex-col justify-between">
                <div>
                    <!-- Заголовок страницы А4 с временем, названием и местом -->
                    <div class="border-b-2 border-stone-900 pb-2 mb-3.5 flex justify-between items-start">
                        <div class="space-y-0.5">
                            <div class="flex items-center gap-2">
                                <span class="text-[10px] uppercase tracking-widest text-emerald-800 font-bold bg-emerald-50 border border-emerald-300 px-2 py-0.5 rounded">${escapeHtml(eventType)}</span>
                                <span class="text-xs font-bold text-stone-500 uppercase tracking-wider">ПЛАН РАССАДКИ ГОСТЕЙ</span>
                            </div>
                            <h2 class="text-lg md:text-xl font-extrabold text-stone-900 leading-tight">${escapeHtml(eventTitle)}</h2>
                            <div class="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-stone-700 pt-0.5 font-medium">
                                <span class="flex items-center gap-1">📅 <strong>Дата:</strong> ${escapeHtml(eventDate)}</span>
                                <span class="flex items-center gap-1">🕒 <strong>Время:</strong> ${escapeHtml(eventTimeFormatted)}</span>
                                <span class="flex items-center gap-1">📍 <strong>Место проведения:</strong> ${escapeHtml(eventVenueFormatted)}</span>
                            </div>
                        </div>
                        <div class="text-right shrink-0">
                            <div class="bg-stone-900 text-white text-[10px] uppercase font-bold px-2.5 py-1 rounded-md">
                                Лист ${pageIndex + 1} из ${totalPages}
                            </div>
                            <span class="text-[10px] text-stone-400 block mt-1 font-semibold">Столы: ${chunk.map(t => '#' + t.number).join(', ')}</span>
                        </div>
                    </div>

                    <!-- Сетка столов (например 4 стола на страницу: 2х2) -->
                    <div class="${gridClass}">
                        ${tablesHtml}
                    </div>
                </div>

                <!-- Подвал листа А4 -->
                <div class="border-t border-stone-300 pt-2 mt-4 flex justify-between items-center text-[9px] text-stone-400 select-none">
                    <span>EM Pro v3 • Распечатано: ${new Date().toLocaleDateString('ru-RU')}</span>
                    <span>Всего гостей за столами: ${state.guests.filter(g => g.tableId && g.tableId !== 'none').length} чел.</span>
                </div>
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

        htmlPages += `
            <div class="a4-sheet-preview print-page-sheet flex flex-col justify-between">
                <div>
                    <div class="border-b-2 border-stone-900 pb-2 mb-3.5 flex justify-between items-start">
                        <div class="space-y-0.5">
                            <div class="flex items-center gap-2">
                                <span class="text-[10px] uppercase tracking-widest text-rose-800 font-bold bg-rose-50 border border-rose-300 px-2 py-0.5 rounded">${escapeHtml(eventType)}</span>
                                <span class="text-xs font-bold text-stone-500 uppercase tracking-wider">ГОСТИ БЕЗ СТОЛА / РЕЗЕРВ</span>
                            </div>
                            <h2 class="text-lg md:text-xl font-extrabold text-stone-900 leading-tight">${escapeHtml(eventTitle)}</h2>
                            <div class="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-stone-700 pt-0.5 font-medium">
                                <span class="flex items-center gap-1">📅 <strong>Дата:</strong> ${escapeHtml(eventDate)}</span>
                                <span class="flex items-center gap-1">🕒 <strong>Время:</strong> ${escapeHtml(eventTimeFormatted)}</span>
                                <span class="flex items-center gap-1">📍 <strong>Место проведения:</strong> ${escapeHtml(eventVenueFormatted)}</span>
                            </div>
                        </div>
                        <div class="text-right shrink-0">
                            <div class="bg-stone-900 text-white text-[10px] uppercase font-bold px-2.5 py-1 rounded-md">
                                Лист ${totalPages} из ${totalPages}
                            </div>
                            <span class="text-[10px] text-stone-400 block mt-1 font-semibold">Резерв</span>
                        </div>
                    </div>

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

                <div class="border-t border-stone-300 pt-2 mt-4 flex justify-between items-center text-[9px] text-stone-400">
                    <span>EM Pro v3 • Нерассаженные гости: ${unassignedGuests.length} чел.</span>
                    <span>Лист ${totalPages} из ${totalPages}</span>
                </div>
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

function renderInvitationPrintPreview(previewContainer, printOutputArea) {
    const layoutSelect = document.getElementById('print-invitation-layout');
    if (layoutSelect) {
        printInvitationLayout = parseInt(layoutSelect.value) || 2;
    }
    const recipSelect = document.getElementById('print-invitation-recipient');
    if (recipSelect) {
        printInvitationRecipient = recipSelect.value || 'all_personal';
    }

    const { eventTitle, eventType, eventDate, eventTimeFormatted, eventVenueFormatted } = getPrintEventInfo();
    const invText = document.getElementById('print-invitation-text')?.value?.trim() || printCustomInvitationText || invitationTemplates.wedding;

    // Список получателей для генерации
    let guestCardsData = [];
    if (printInvitationRecipient === 'all_personal') {
        if (state.guests && state.guests.length > 0) {
            guestCardsData = state.guests.map(g => {
                const table = state.tables.find(t => t.id === g.tableId);
                const tableInfo = table ? `${getTableName(table)}${table.name ? ` («${table.name}»)` : ''}` : 'Персональное место за праздничным столом';
                return {
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
    } else {
        // Общий бланк (генерируем ровно одну страницу с 1, 2 или 4 карточками)
        for (let i = 0; i < printInvitationLayout; i++) {
            guestCardsData.push({
                name: null,
                tableInfo: 'Праздничный стол торжества',
                isPersonal: false
            });
        }
    }

    // Разбиваем на листы А4 по layout (1, 2 или 4 на лист)
    const cardsPerPage = printInvitationLayout;
    const pages = [];
    for (let i = 0; i < guestCardsData.length; i += cardsPerPage) {
        pages.push(guestCardsData.slice(i, i + cardsPerPage));
    }

    let htmlPages = '';

    pages.forEach((pageCards, pageIdx) => {
        let cardsHtml = '';

        if (cardsPerPage === 1) {
            // 1 роскошное большое приглашение на лист А4
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
                    <span>EM Pro v3 • Праздничные пригласительные</span>
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

function triggerPrint() {
    updatePrintPreview();
    window.print();
}

