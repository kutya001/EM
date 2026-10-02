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
let isNewTableInModal = false;

function openTableModal(tableId = null) {
    const title = document.getElementById('table-modal-title');
    const idInput = document.getElementById('edit-table-id');
    const numInput = document.getElementById('table-number');
    const nameInput = document.getElementById('table-name');
    const capInput = document.getElementById('table-capacity');
    const catSelect = document.getElementById('table-category');

    updateDropdowns();

    if (tableId) {
        isNewTableInModal = false;
        const table = state.tables.find(t => t.id === tableId);
        title.innerText = "Редактировать стол";
        idInput.value = table.id;
        numInput.value = table.number;
        nameInput.value = table.name || "";
        capInput.value = table.capacity;
        catSelect.value = table.categoryId || 'none';
    } else {
        isNewTableInModal = true;
        title.innerText = "Новый стол";
        const nextNum = state.tables.length > 0 ? Math.max(...state.tables.map(t => t.number || 0)) + 1 : 1;
        const newId = 'tbl-' + Date.now();
        idInput.value = newId;
        numInput.value = nextNum;
        nameInput.value = "";
        capInput.value = "10";
        catSelect.value = "none";

        // Заранее регистрируем стол в state, чтобы к нему можно было сразу привязать гостей
        state.tables.push({
            id: newId,
            number: nextNum,
            name: "",
            capacity: 10,
            categoryId: "none",
            x: 260,
            y: 300
        });
    }

    editingGuestIdInTableModal = null;

    const showCat = state.profile?.trackCategories !== false;
    const catContainer = document.getElementById('table-category')?.parentElement;
    const capContainer = document.getElementById('table-capacity')?.parentElement;
    if (catContainer && capContainer) {
        if (!showCat) {
            catContainer.classList.add('hidden');
            capContainer.parentElement.classList.remove('grid-cols-2');
            capContainer.parentElement.classList.add('grid-cols-1');
        } else {
            catContainer.classList.remove('hidden');
            capContainer.parentElement.classList.add('grid-cols-2');
            capContainer.parentElement.classList.remove('grid-cols-1');
        }
    }

    renderTableModalGuests(idInput.value);
    hideTableInlineAddGuest();
    hideTableBulkPaste();

    // Навешиваем обработчик клавиш для быстрого ввода (Enter/Esc)
    setTimeout(() => {
        const inlineInput = document.getElementById('table-inline-guest-input');
        if (inlineInput && !inlineInput.dataset.bound) {
            inlineInput.dataset.bound = "true";
            inlineInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    e.stopPropagation();
                    submitTableInlineGuest();
                } else if (e.key === 'Escape') {
                    e.preventDefault();
                    hideTableInlineAddGuest();
                }
            });
        }
    }, 50);

    openModal('modal-table');
}

function handleCloseTableModal() {
    const idInput = document.getElementById('edit-table-id');
    const tableId = idInput ? idInput.value : null;

    if (isNewTableInModal && tableId) {
        const table = state.tables.find(t => t.id === tableId);
        const guestsAtTbl = state.guests.filter(g => g.tableId === tableId);
        // Если стол новый, без названия и без гостей — удаляем временную запись
        if (table && (!table.name || table.name.trim() === '') && guestsAtTbl.length === 0) {
            state.tables = state.tables.filter(t => t.id !== tableId);
        }
    }
    isNewTableInModal = false;
    editingGuestIdInTableModal = null;
    closeModal('modal-table');
}

let editingGuestIdInTableModal = null;

function renderTableModalGuests(tableId) {
    const list = document.getElementById('table-modal-guests-list');
    const countEl = document.getElementById('table-modal-guests-count');
    if (!list) return;

    const table = state.tables.find(t => t.id === tableId);
    const capacity = table ? table.capacity : (parseInt(document.getElementById('table-capacity')?.value) || 10);
    const tableGuests = state.guests.filter(g => g.tableId === tableId);

    if (countEl) {
        countEl.innerText = `${tableGuests.length} из ${capacity} мест занято`;
        if (tableGuests.length > capacity) {
            countEl.className = "text-[10px] text-rose-600 font-bold block";
            countEl.innerText += " (Превышен лимит мест!)";
        } else {
            countEl.className = "text-[10px] text-stone-400 font-semibold block";
        }
    }

    list.innerHTML = '';
    if (tableGuests.length === 0) {
        list.innerHTML = `
            <div class="text-center py-3 text-stone-400 text-xs italic bg-stone-50 rounded-xl border border-stone-200/50">
                За этим столом пока нет гостей. Нажмите «+ Добавить» для быстрого ввода или «Вставить списком»
            </div>
        `;
        return;
    }

    tableGuests.forEach((guest, idx) => {
        const item = document.createElement('div');
        const cat = (state.profile?.trackCategories !== false) ? state.categories.find(c => c.id === guest.categoryId) : null;

        if (editingGuestIdInTableModal === guest.id) {
            item.className = 'p-2.5 bg-amber-50/90 rounded-xl border border-amber-300 text-xs space-y-2 animate-fadeIn';
            const catOptions = state.categories.map(c => 
                `<option value="${c.id}" ${c.id === guest.categoryId ? 'selected' : ''}>${escapeHtml(c.name)}</option>`
            ).join('');
            
            item.innerHTML = `
                <div class="flex items-center gap-1.5">
                    <span class="w-5 h-5 rounded-md bg-amber-200 text-amber-900 text-[10px] font-bold flex items-center justify-center shrink-0">
                        ${idx + 1}
                    </span>
                    <input type="text" id="modal-guest-edit-name-${guest.id}" value="${escapeHtml(guest.name)}" placeholder="Имя гостя"
                           class="flex-1 bg-white border border-amber-400 rounded-lg px-2.5 py-1 text-xs font-bold text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-700">
                    <button type="button" onclick="saveGuestInModalTable('${guest.id}', '${tableId}')" class="bg-emerald-800 hover:bg-emerald-700 text-white p-1.5 rounded-lg transition shrink-0" title="Сохранить изменения">
                        <i data-lucide="check" class="w-3.5 h-3.5"></i>
                    </button>
                    <button type="button" onclick="cancelEditGuestInModalTable('${tableId}')" class="text-stone-400 hover:text-stone-600 p-1.5 rounded-lg transition shrink-0" title="Отмена">
                        <i data-lucide="x" class="w-3.5 h-3.5"></i>
                    </button>
                </div>
                ${(state.profile?.trackPhones !== false || state.profile?.trackCategories !== false) ? `
                <div class="flex items-center gap-2 pl-6">
                    ${state.profile?.trackPhones !== false ? `
                        <input type="tel" id="modal-guest-edit-phone-${guest.id}" value="${escapeHtml(guest.phone || '')}" placeholder="Телефон (+996...)"
                               class="w-1/2 bg-white border border-stone-250 rounded-lg px-2 py-1 text-[11px] text-stone-800 font-mono focus:outline-none focus:ring-2 focus:ring-emerald-700">
                    ` : ''}
                    ${state.profile?.trackCategories !== false ? `
                        <select id="modal-guest-edit-cat-${guest.id}" class="w-1/2 bg-white border border-stone-250 rounded-lg px-2 py-1 text-[11px] text-stone-800 focus:outline-none focus:ring-2 focus:ring-emerald-700">
                            <option value="none">Без категории</option>
                            ${catOptions}
                        </select>
                    ` : ''}
                </div>
                ` : ''}
            `;
            setTimeout(() => {
                const inp = document.getElementById(`modal-guest-edit-name-${guest.id}`);
                if (inp) {
                    inp.focus();
                    inp.select();
                    inp.addEventListener('keydown', (e) => {
                        if (e.key === 'Enter') {
                            e.preventDefault();
                            saveGuestInModalTable(guest.id, tableId);
                        } else if (e.key === 'Escape') {
                            e.preventDefault();
                            cancelEditGuestInModalTable(tableId);
                        }
                    });
                }
            }, 30);
        } else {
            item.className = 'flex items-center justify-between p-2 bg-stone-50 hover:bg-stone-100/80 rounded-xl border border-stone-200/60 text-xs transition';
            const hasPhone = state.profile?.trackPhones !== false && guest.phone;
            item.innerHTML = `
                <div class="flex items-center gap-2 min-w-0 flex-1">
                    <span class="w-5 h-5 rounded-md bg-stone-200 text-stone-700 text-[10px] font-bold flex items-center justify-center shrink-0">
                        ${idx + 1}
                    </span>
                    <div class="min-w-0 flex-1">
                        <div class="flex items-center gap-1.5 flex-wrap">
                            <span class="font-bold text-stone-900 text-xs truncate">${escapeHtml(guest.name)}</span>
                            ${cat ? `<span class="text-[9px] text-stone-500 bg-stone-200/70 px-1.5 py-0.2 rounded truncate max-w-[110px] font-medium">${escapeHtml(cat.name)}</span>` : ''}
                        </div>
                        ${hasPhone ? `<span class="text-[10px] text-stone-400 font-mono block leading-none mt-0.5">${escapeHtml(guest.phone)}</span>` : ''}
                    </div>
                </div>
                <div class="flex items-center gap-1 shrink-0">
                    <button type="button" onclick="startEditGuestInModalTable('${guest.id}', '${tableId}')" class="text-stone-400 hover:text-amber-600 hover:bg-amber-100/60 p-1.5 rounded-lg transition" title="Редактировать гостя">
                        <i data-lucide="pencil" class="w-3.5 h-3.5"></i>
                    </button>
                    <button type="button" onclick="removeGuestFromModalTable('${guest.id}', '${tableId}')" class="text-stone-300 hover:text-rose-600 hover:bg-rose-50 p-1.5 rounded-lg transition" title="Убрать гостя со стола">
                        <i data-lucide="x" class="w-3.5 h-3.5"></i>
                    </button>
                </div>
            `;
        }
        list.appendChild(item);
    });
    lucide.createIcons();
}

function startEditGuestInModalTable(guestId, tableId) {
    editingGuestIdInTableModal = guestId;
    renderTableModalGuests(tableId);
}

function cancelEditGuestInModalTable(tableId) {
    editingGuestIdInTableModal = null;
    renderTableModalGuests(tableId);
}

function saveGuestInModalTable(guestId, tableId) {
    const nameInp = document.getElementById(`modal-guest-edit-name-${guestId}`);
    if (!nameInp) return;
    const newName = nameInp.value.trim();
    if (!newName) {
        showToast('Имя гостя не может быть пустым');
        nameInp.focus();
        return;
    }
    const guest = state.guests.find(g => g.id === guestId);
    if (!guest) return;

    guest.name = newName;

    const phoneInp = document.getElementById(`modal-guest-edit-phone-${guestId}`);
    if (phoneInp) {
        guest.phone = phoneInp.value.trim();
    }

    const catSelect = document.getElementById(`modal-guest-edit-cat-${guestId}`);
    if (catSelect) {
        guest.categoryId = catSelect.value;
    }

    saveState();
    editingGuestIdInTableModal = null;
    renderTableModalGuests(tableId);
    showToast(`Гость «${newName}» обновлен`);
}

function showTableInlineAddGuest() {
    const row = document.getElementById('table-inline-add-row');
    const input = document.getElementById('table-inline-guest-input');
    if (row && input) {
        row.classList.remove('hidden');
        input.value = '';
        input.focus();
    }
}

function hideTableInlineAddGuest() {
    const row = document.getElementById('table-inline-add-row');
    const input = document.getElementById('table-inline-guest-input');
    if (row && input) {
        input.value = '';
        row.classList.add('hidden');
    }
}

function submitTableInlineGuest() {
    const input = document.getElementById('table-inline-guest-input');
    const tableId = document.getElementById('edit-table-id').value;
    if (!input || !tableId) return;

    const name = input.value.trim();
    if (!name) {
        hideTableInlineAddGuest();
        return;
    }

    const tableCategory = document.getElementById('table-category').value;
    const newGuest = {
        id: 'gst-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
        name: name,
        phone: '',
        giftAmount: 0,
        categoryId: (tableCategory && tableCategory !== 'none') ? tableCategory : 'none',
        tableId: tableId,
        seatIndex: -1
    };

    assignSeatToGuest(newGuest, tableId);
    state.guests.push(newGuest);
    saveState();

    renderTableModalGuests(tableId);
    showToast(`Гость «${name}» добавлен за стол`);

    // Автоматически очищаем поле и держим фокус для непрерывного быстрого ввода
    input.value = '';
    input.focus();
}

function toggleTableBulkPaste() {
    const container = document.getElementById('table-bulk-paste-container');
    const textarea = document.getElementById('table-bulk-paste-text');
    if (container) {
        const isHidden = container.classList.contains('hidden');
        if (isHidden) {
            container.classList.remove('hidden');
            if (textarea) {
                textarea.value = '';
                textarea.focus();
            }
        } else {
            container.classList.add('hidden');
        }
    }
}

function hideTableBulkPaste() {
    const container = document.getElementById('table-bulk-paste-container');
    if (container) container.classList.add('hidden');
}

function applyTableBulkPaste() {
    const textarea = document.getElementById('table-bulk-paste-text');
    const tableId = document.getElementById('edit-table-id').value;
    if (!textarea || !tableId) return;

    const text = textarea.value;
    if (!text.trim()) {
        showToast('Пожалуйста, вставьте список имен');
        return;
    }

    const lines = text.split(/\r?\n/);
    const tableCategory = document.getElementById('table-category').value;
    let addedCount = 0;

    lines.forEach((line, index) => {
        // Очищаем нумерацию вида "1. ", "2) ", "- " и лишние пробелы
        let cleanName = line.replace(/^\s*\d+[\.\)\-]\s*/, '').trim();
        if (cleanName.length > 0) {
            const newGuest = {
                id: 'gst-' + Date.now() + '-' + index + '-' + Math.floor(Math.random() * 100),
                name: cleanName,
                phone: '',
                giftAmount: 0,
                categoryId: (tableCategory && tableCategory !== 'none') ? tableCategory : 'none',
                tableId: tableId,
                seatIndex: -1
            };
            assignSeatToGuest(newGuest, tableId);
            state.guests.push(newGuest);
            addedCount++;
        }
    });

    if (addedCount > 0) {
        saveState();
        renderTableModalGuests(tableId);
        hideTableBulkPaste();
        showToast(`Успешно добавлено ${addedCount} гостей за стол!`);
    } else {
        showToast('Не удалось распознать имена гостей');
    }
}

function removeGuestFromModalTable(guestId, tableId) {
    const guest = state.guests.find(g => g.id === guestId);
    if (!guest) return;
    guest.tableId = 'none';
    guest.seatIndex = -1;
    saveState();
    renderTableModalGuests(tableId);
    showToast(`Гость «${guest.name}» снят со стола`);
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

    const existingIndex = state.tables.findIndex(t => t.id === id);
    if (existingIndex !== -1) {
        state.tables[existingIndex] = { ...state.tables[existingIndex], number, name, capacity, categoryId };
        showToast('Данные стола сохранены');
    } else {
        state.tables.push({ id, number, name, capacity, categoryId, x: 260, y: 300 });
        showToast('Новый стол успешно добавлен');
    }

    isNewTableInModal = false;
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
    
    const showCat = state.profile?.trackCategories !== false;
    const cat = showCat ? state.categories.find(c => c.id === table.categoryId) : null;
    const seatedCount = state.guests.filter(g => g.tableId === tableId).length;
    
    document.getElementById('detail-table-name').innerText = getTableName(table);
    const detailCatEl = document.getElementById('detail-table-category');
    if (detailCatEl) {
        if (!showCat) {
            detailCatEl.classList.add('hidden');
        } else {
            detailCatEl.classList.remove('hidden');
            detailCatEl.innerText = cat ? `Назначение: ${cat.name}` : 'Назначение: Без категории';
        }
    }
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

    const showCat = state.profile?.trackCategories !== false;
    const showPhone = state.profile?.trackPhones !== false;
    
    tableGuests.forEach(guest => {
        const cat = showCat ? state.categories.find(c => c.id === guest.categoryId) : null;
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

        const catBadgeHtml = showCat ? `<span class="text-[9px] text-stone-400 font-semibold block truncate">${cat ? cat.name : 'Без категории'}</span>` : '';
        const phoneHtml = (showPhone && guest.phone) ? `<span class="text-[9px] text-stone-400 font-mono block">${escapeHtml(guest.phone)}</span>` : '';
        
        row.innerHTML = `
            <div class="min-w-0 flex-1 pr-2">
                <span class="font-bold text-stone-950 block truncate">${escapeHtml(guest.name)}</span>
                ${catBadgeHtml}
                ${phoneHtml}
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
