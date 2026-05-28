// ===== TABLES.JS — Логика вкладки Столы и категории =====

// --- Рендер справочника столов ---
function renderTables() {
    const list = document.getElementById('tables-list');
    const empty = document.getElementById('tables-empty-state');
    list.innerHTML = '';

    if (state.tables.length === 0) {
        empty.classList.remove('hidden');
        return;
    }
    empty.classList.add('hidden');

    state.tables.forEach(table => {
        const seated = state.guests.filter(g => g.tableId === table.id).length;
        const percent = Math.min(100, Math.round((seated / table.capacity) * 100));
        const cat = state.categories.find(c => c.id === table.categoryId);

        let progColor = 'bg-emerald-800';
        if (percent >= 100) progColor = 'bg-rose-600';
        else if (percent > 80) progColor = 'bg-amber-600';

        const item = document.createElement('div');
        item.className = 'bg-white/90 glass-panel island-card p-3.5 border border-stone-200/50 space-y-2.5 cursor-pointer hover:border-emerald-700/40 hover:shadow-md transition-all duration-200';
        item.innerHTML = `
            <div class="flex justify-between items-start" onclick="openTableDetailsModal('${table.id}')">
                <div class="flex items-center gap-3 min-w-0 flex-1">
                    <div class="bg-emerald-50 text-emerald-800 p-2.5 rounded-xl border border-emerald-100 shrink-0">
                        <i data-lucide="armchair" class="w-4.5 h-4.5"></i>
                    </div>
                    <div class="min-w-0">
                        <h4 class="text-xs font-extrabold text-stone-900 truncate">${getTableName(table)}</h4>
                        <div class="flex items-center gap-1.5 mt-0.5">
                            <span class="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-stone-100 text-stone-500 truncate max-w-[180px]">
                                Категория стола: ${cat ? cat.name : 'Без категории'}
                            </span>
                        </div>
                    </div>
                </div>

                <div class="flex items-center gap-1.5 ml-2 shrink-0" onclick="event.stopPropagation()">
                    <span class="text-[10px] font-bold bg-stone-100 text-stone-700 rounded-lg px-2 py-1 cursor-default">
                        ${seated} / ${table.capacity}
                    </span>
                    <button onclick="openTableModal('${table.id}')" class="text-stone-300 hover:text-emerald-800 p-1 rounded-lg transition active:scale-90">
                        <i data-lucide="edit-3" class="w-4 h-4"></i>
                    </button>
                    <button onclick="deleteTable('${table.id}')" class="text-stone-300 hover:text-red-600 p-1 rounded-lg transition active:scale-90">
                        <i data-lucide="trash-2" class="w-4 h-4"></i>
                    </button>
                </div>
            </div>

            <div class="space-y-1" onclick="openTableDetailsModal('${table.id}')">
                <div class="w-full bg-stone-100 h-2 rounded-full overflow-hidden">
                    <div class="${progColor} h-full transition-all duration-300" style="width: ${percent}%"></div>
                </div>
            </div>
        `;
        list.appendChild(item);
    });
    lucide.createIcons();
}

// --- CRUD столов ---
function openTableModal(tableId = null) {
    const title = document.getElementById('table-modal-title');
    const idInput = document.getElementById('edit-table-id');
    const numInput = document.getElementById('table-number');
    const nameInput = document.getElementById('table-name');
    const capInput = document.getElementById('table-capacity');
    const catSelect = document.getElementById('table-category');

    updateDropdowns();

    if (tableId) {
        const table = state.tables.find(t => t.id === tableId);
        title.innerText = "Редактировать стол";
        idInput.value = table.id;
        numInput.value = table.number;
        nameInput.value = table.name || "";
        capInput.value = table.capacity;
        catSelect.value = table.categoryId || 'none';
    } else {
        title.innerText = "Новый стол";
        idInput.value = "";
        const nextNum = state.tables.length > 0 ? Math.max(...state.tables.map(t => t.number || 0)) + 1 : 1;
        numInput.value = nextNum;
        nameInput.value = "";
        capInput.value = "10";
        catSelect.value = "none";
    }
    openModal('modal-table');
}

function handleSaveTable(event) {
    event.preventDefault();
    const id = document.getElementById('edit-table-id').value;
    const number = parseInt(document.getElementById('table-number').value);
    const name = document.getElementById('table-name').value.trim();
    const capacity = parseInt(document.getElementById('table-capacity').value);
    const categoryId = document.getElementById('table-category').value;

    if (isNaN(number) || number <= 0 || isNaN(capacity) || capacity <= 0) {
        showToast('Заполните корректно номер стола и лимит мест');
        return;
    }

    const duplicate = state.tables.find(t => t.number === number && t.id !== id);
    if (duplicate) {
        showToast(`Стол с номером ${number} уже существует!`);
        return;
    }

    if (id) {
        state.tables = state.tables.map(t => t.id === id ? { ...t, number, name, capacity, categoryId } : t);
        showToast('Данные стола обновлены');
    } else {
        const newId = 'tbl-' + Date.now();
        state.tables.push({ id: newId, number, name, capacity, categoryId, x: 260, y: 300 });
        showToast('Новый стол успешно добавлен');
    }

    saveState();
    ensureSeatIndices();
    closeModal('modal-table');
    renderAll();
}

function deleteTable(id) {
    const table = state.tables.find(t => t.id === id);
    const guestsAtTbl = state.guests.filter(g => g.tableId === id);
    showConfirm(
        'Удалить стол?',
        `${getTableName(table)} будет безвозвратно удален. Посаженные за него гости (${guestsAtTbl.length} чел.) будут сняты с рассадки.`,
        () => {
            state.guests = state.guests.map(g => g.tableId === id ? { ...g, tableId: 'none', seatIndex: -1 } : g);
            state.tables = state.tables.filter(t => t.id !== id);
            saveState();
            updateDropdowns();
            renderAll();
            showToast('Стол успешно удален');
        }
    );
}

// --- Инспектор стола ---
function openTableDetailsModal(tableId) {
    const table = state.tables.find(t => t.id === tableId);
    if (!table) return;
    
    const cat = state.categories.find(c => c.id === table.categoryId);
    const seatedCount = state.guests.filter(g => g.tableId === tableId).length;
    
    document.getElementById('detail-table-name').innerText = getTableName(table);
    document.getElementById('detail-table-category').innerText = cat ? `Назначение: ${cat.name}` : 'Назначение: Без категории';
    document.getElementById('detail-table-capacity').innerText = `${seatedCount} / ${table.capacity} мест`;
    
    const statusEl = document.getElementById('detail-table-status');
    if (seatedCount >= table.capacity) {
        statusEl.innerText = "Заполнен";
        statusEl.className = "font-bold text-xs text-red-600 bg-red-50 px-2.5 py-1 rounded-lg border border-red-100";
    } else {
        statusEl.innerText = `Свободно: ${table.capacity - seatedCount}`;
        statusEl.className = "font-bold text-xs text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-100";
    }
    
    renderTableDetailsGuests(tableId);
    openModal('modal-table-details');
}

function renderTableDetailsGuests(tableId) {
    const list = document.getElementById('detail-table-guests-list');
    list.innerHTML = '';
    
    const tableGuests = state.guests.filter(g => g.tableId === tableId);
    if (tableGuests.length === 0) {
        list.innerHTML = `
            <div class="text-center py-8 text-stone-400 text-xs font-semibold">
                <i data-lucide="users" class="w-8 h-8 mx-auto mb-2 text-stone-300"></i>
                За этим столом пока никого нет
            </div>
        `;
        lucide.createIcons();
        return;
    }
    
    tableGuests.forEach(guest => {
        const cat = state.categories.find(c => c.id === guest.categoryId);
        const row = document.createElement('div');
        row.className = 'flex items-center justify-between p-2.5 bg-stone-50 rounded-xl border border-stone-200/60 text-xs';
        
        let moveOptions = '<option value="" disabled selected>Пересадить...</option>';
        state.tables.forEach(t => {
            if (t.id !== tableId) {
                const count = state.guests.filter(g => g.tableId === t.id).length;
                const free = t.capacity - count;
                moveOptions += `<option value="${t.id}" ${free <= 0 ? 'disabled' : ''}>${getTableName(t)} (свободно: ${free})</option>`;
            }
        });
        
        row.innerHTML = `
            <div class="min-w-0 flex-1 pr-2">
                <span class="font-bold text-stone-950 block truncate">${guest.name}</span>
                <span class="text-[9px] text-stone-400 font-semibold block truncate">${cat ? cat.name : 'Без категории'}</span>
            </div>
            
            <div class="flex items-center gap-1.5 shrink-0">
                <select onchange="moveGuestFromInspector('${guest.id}', this.value, '${tableId}')" class="bg-white border border-stone-200 text-[10px] font-bold py-1.5 px-2 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-700 max-w-[110px]">
                    ${moveOptions}
                </select>
                <button onclick="removeGuestFromTable('${guest.id}', '${tableId}')" class="bg-rose-50 hover:bg-rose-100 text-rose-700 p-1.5 rounded-lg border border-rose-100 transition" title="Убрать со стола">
                    <i data-lucide="user-minus" class="w-3.5 h-3.5"></i>
                </button>
            </div>
        `;
        list.appendChild(row);
    });
    lucide.createIcons();
}

function moveGuestFromInspector(guestId, targetTableId, currentTableId) {
    if (!targetTableId) return;
    
    const targetTable = state.tables.find(t => t.id === targetTableId);
    const currentSeated = state.guests.filter(g => g.tableId === targetTableId).length;
    if (currentSeated >= targetTable.capacity) {
        showToast(`За столом «${getTableName(targetTable)}» нет свободных мест!`);
        return;
    }
    
    const guest = state.guests.find(g => g.id === guestId);
    if (guest) {
        assignSeatToGuest(guest, targetTableId);
    }
    saveState();
    showToast('Гость успешно пересажен!');
    
    openTableDetailsModal(currentTableId);
    renderAll();
}

function removeGuestFromTable(guestId, currentTableId) {
    state.guests = state.guests.map(g => g.id === guestId ? { ...g, tableId: 'none', seatIndex: -1 } : g);
    saveState();
    showToast('Гость убран из-за стола');
    
    openTableDetailsModal(currentTableId);
    renderAll();
}

// --- Справочник категорий ---
function openCategoryModal(categoryId = null) {
    const title = document.getElementById('category-modal-title');
    const idInput = document.getElementById('edit-category-id');
    const nameInput = document.getElementById('category-name');

    if (categoryId) {
        const cat = state.categories.find(c => c.id === categoryId);
        title.innerText = "Редактировать категорию";
        idInput.value = cat.id;
        nameInput.value = cat.name;
    } else {
        title.innerText = "Новая категория";
        idInput.value = "";
        nameInput.value = "";
    }
    openModal('modal-category');
}

function handleSaveCategory(event) {
    event.preventDefault();
    const id = document.getElementById('edit-category-id').value;
    const name = document.getElementById('category-name').value.trim();

    if (!name) return;

    if (id) {
        state.categories = state.categories.map(c => c.id === id ? { ...c, name } : c);
        showToast('Название категории обновлено во всей базе');
    } else {
        const newId = 'cat-' + Date.now();
        state.categories.push({ id: newId, name });
        showToast('Новая категория успешно создана');
    }

    saveState();
    closeModal('modal-category');
    renderAll();
}

function deleteCategory(id) {
    const cat = state.categories.find(c => c.id === id);
    const guestsInCat = state.guests.filter(g => g.categoryId === id);
    const tablesInCat = state.tables.filter(t => t.categoryId === id);

    showConfirm(
        'Удалить категорию?',
        `Категория «${cat.name}» будет безвозвратно удалена. Будет сброшена привязка у гостей (${guestsInCat.length}) и столов (${tablesInCat.length}).`,
        () => {
            state.guests = state.guests.map(g => g.categoryId === id ? { ...g, categoryId: 'none' } : g);
            state.tables = state.tables.map(t => t.categoryId === id ? { ...t, categoryId: 'none' } : t);
            state.categories = state.categories.filter(c => c.id !== id);
            
            saveState();
            updateDropdowns();
            renderAll();
            showToast('Категория успешно удалена');
        }
    );
}
