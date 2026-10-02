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
//    ПЕЧАТЬ СПИСКА ГОСТЕЙ ДЛЯ А4
// ==========================================

let printTablesPerPage = 4;

function openPrintModal() {
    const select = document.getElementById('print-tables-per-page');
    if (select) {
        printTablesPerPage = parseInt(select.value) || 4;
    }
    updatePrintPreview();
    openModal('modal-print-guests');
}

function updatePrintPreview() {
    const select = document.getElementById('print-tables-per-page');
    if (select) {
        printTablesPerPage = parseInt(select.value) || 4;
    }

    const previewContainer = document.getElementById('print-preview-container');
    const printOutputArea = document.getElementById('print-output-area');
    if (!previewContainer) return;

    const optCheckin = document.getElementById('print-opt-checkin')?.checked !== false;
    const optPhone = document.getElementById('print-opt-phone')?.checked !== false && state.profile?.trackPhones !== false;
    const optCategory = document.getElementById('print-opt-category')?.checked !== false && state.profile?.trackCategories !== false;
    const optEmptySeats = document.getElementById('print-opt-empty-seats')?.checked !== false;
    const optUnassigned = document.getElementById('print-opt-unassigned')?.checked !== false;

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

    const p = state.profile || {};
    const eventTitle = p.eventName && p.eventName.trim() ? p.eventName : 'Мероприятие';
    const eventType = p.eventType || 'Торжество';
    const eventDate = p.date ? formatDate(p.date) : 'Дата не указана';
    const eventVenue = p.venueName || '';

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
                        ${optCategory ? `<td class="py-1 px-1.5 text-stone-500 text-[10px]">${gCat ? gCat.name : ''}</td>` : ''}
                        ${optPhone ? `<td class="py-1 px-1.5 font-mono text-[10px] text-stone-600">${g.phone || ''}</td>` : ''}
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
                        ${cat && optCategory ? `<div class="bg-stone-100 text-stone-600 px-3 py-0.5 text-[9px] font-bold border-b border-stone-200">Категория: ${cat.name}</div>` : ''}
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
                    <!-- Заголовок страницы А4 -->
                    <div class="border-b-2 border-stone-900 pb-2 mb-3 flex justify-between items-end">
                        <div>
                            <span class="text-[10px] uppercase tracking-widest text-emerald-800 font-bold block">${eventType}</span>
                            <h2 class="text-lg font-extrabold text-stone-900 leading-tight">${eventTitle}</h2>
                            <p class="text-[11px] text-stone-600 mt-0.5 font-medium">
                                📅 ${eventDate} ${eventVenue ? `• 📍 ${eventVenue}` : ''}
                            </p>
                        </div>
                        <div class="text-right">
                            <span class="text-xs font-bold text-stone-700 block">ПЛАН РАССАДКИ</span>
                            <span class="text-[10px] text-stone-400">Лист ${pageIndex + 1} из ${totalPages}</span>
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
                    ${optCategory ? `<td class="py-1 px-1.5 text-stone-500 text-[11px]">${gCat ? gCat.name : ''}</td>` : ''}
                    ${optPhone ? `<td class="py-1 px-1.5 font-mono text-[11px] text-stone-600">${g.phone || ''}</td>` : ''}
                    ${optCheckin ? `<td class="py-1 px-1.5 text-center w-16 border-l border-stone-200"><span class="inline-block w-4 h-4 border border-stone-400 rounded-xs"></span></td>` : ''}
                </tr>
            `;
        });

        htmlPages += `
            <div class="a4-sheet-preview print-page-sheet flex flex-col justify-between">
                <div>
                    <div class="border-b-2 border-stone-900 pb-2 mb-3 flex justify-between items-end">
                        <div>
                            <span class="text-[10px] uppercase tracking-widest text-rose-800 font-bold block">${eventType}</span>
                            <h2 class="text-lg font-extrabold text-stone-900 leading-tight">${eventTitle}</h2>
                            <p class="text-[11px] text-stone-600 mt-0.5 font-medium">
                                📅 ${eventDate} • <strong>ГОСТИ БЕЗ СТОЛА / РЕЗЕРВ</strong>
                            </p>
                        </div>
                        <div class="text-right">
                            <span class="text-xs font-bold text-stone-700 block">РЕЗЕРВ</span>
                            <span class="text-[10px] text-stone-400">Лист ${totalPages} из ${totalPages}</span>
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

function triggerPrint() {
    updatePrintPreview();
    window.print();
}
