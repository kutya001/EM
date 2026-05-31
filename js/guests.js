// ===== GUESTS.JS — Логика вкладки Гости =====

// --- Переключатель подвкладок списка гостей ---
function switchGuestsViewMode(mode) {
    guestsViewMode = mode;
    saveState();
    
    const modes = ['list', 'tables', 'categories'];
    modes.forEach(m => {
        const btn = document.getElementById(`subtab-btn-${m}`);
        if (btn) {
            if (m === mode) {
                btn.className = "flex-1 justify-center text-center py-1 px-1 rounded-md text-[10px] md:text-xs font-bold transition flex items-center gap-1 bg-emerald-800 text-white shadow-xs";
            } else {
                btn.className = "flex-1 justify-center text-center py-1 px-1 rounded-md text-[10px] md:text-xs font-bold transition flex items-center gap-1 text-stone-600 hover:text-stone-900";
            }
        }
    });
    
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

    const card = document.createElement('div');
    card.className = `p-3 rounded-2xl border transition-all duration-200 flex items-center justify-between ${
        isSelected ? 'bg-emerald-50/70 border-emerald-300 shadow-xs' : 'bg-white border-stone-200/60 shadow-xs hover:border-stone-300 transition-all'
    }`;

    const phoneHTML = guest.phone ? `
        <div class="flex items-center gap-1.5 mt-1.5 select-all">
            <a href="tel:${guest.phone}" class="bg-stone-100 hover:bg-stone-200 text-stone-700 px-2 py-0.5 rounded-md text-[9px] font-bold inline-flex items-center gap-1 transition" title="Позвонить">
                <i data-lucide="phone" class="w-2.5 h-2.5 text-emerald-800"></i> ${guest.phone}
            </a>
            <a href="https://wa.me/${guest.phone.replace(/[^0-9]/g, '')}" target="_blank" class="bg-emerald-50 hover:bg-emerald-100 text-emerald-950 px-2 py-0.5 rounded-md text-[9px] font-bold inline-flex items-center gap-1 transition" title="Написать в WhatsApp">
                <i data-lucide="message-square" class="w-2.5 h-2.5 text-emerald-600"></i> WhatsApp
            </a>
        </div>
    ` : '';

    card.innerHTML = `
        <div class="flex items-center gap-3 flex-1 min-w-0">
            <input type="checkbox" ${isSelected ? 'checked' : ''} onchange="toggleGuestSelection('${guest.id}')"
                   class="w-5 h-5 text-emerald-800 bg-stone-50 border-stone-300 rounded-md focus:ring-emerald-700 shrink-0">
            
            <div class="flex-1 min-w-0">
                <h4 class="text-xs font-extrabold text-stone-900 truncate">${guest.name}</h4>
                <div class="flex flex-wrap gap-1 mt-1">
                    <span class="text-[9px] font-bold px-2 py-0.5 rounded-md bg-stone-100 text-stone-600 truncate max-w-[150px]">
                        <i data-lucide="tag" class="w-2.5 h-2.5 inline mr-0.5 text-stone-400"></i> ${cat ? cat.name : 'Без категории'}
                    </span>
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
