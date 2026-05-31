// ===== FINANCE.JS — Логика вкладки Финансы =====

function switchFinanceTab(tab) {
    currentFinanceTab = tab;
    document.getElementById('tab-fin-overview').classList.add('hidden');
    document.getElementById('tab-fin-expenses').classList.add('hidden');
    document.getElementById('tab-fin-income').classList.add('hidden');
    document.getElementById(`tab-fin-${tab}`).classList.remove('hidden');
    
    const tabs = ['overview', 'expenses', 'income'];
    tabs.forEach(t => {
        const btn = document.getElementById(`fintab-btn-${t}`);
        if (btn) {
            if (t === tab) {
                btn.className = "flex-1 text-center py-1.5 px-1 rounded-md text-[10px] md:text-xs font-bold transition bg-emerald-800 text-white shadow-xs flex items-center justify-center gap-1";
            } else {
                btn.className = "flex-1 text-center py-1.5 px-1 rounded-md text-[10px] md:text-xs font-bold transition text-stone-600 hover:text-stone-900 hover:bg-stone-200/50 flex items-center justify-center gap-1";
            }
        }
    });
    renderAll();
}

function switchExpenseSubTab(tab) {
    expenseSubTab = tab;
    const btnPlanned = document.getElementById('expense-subtab-planned');
    const btnActual = document.getElementById('expense-subtab-actual');
    if (tab === 'planned') {
        btnPlanned.className = "px-3 py-1 rounded-md font-bold transition bg-white text-stone-850 shadow-xs";
        btnActual.className = "px-3 py-1 rounded-md font-bold transition text-stone-500 hover:text-stone-800";
    } else {
        btnActual.className = "px-3 py-1 rounded-md font-bold transition bg-white text-stone-850 shadow-xs";
        btnPlanned.className = "px-3 py-1 rounded-md font-bold transition text-stone-500 hover:text-stone-800";
    }
    renderExpenses();
}

function renderExpenses() {
    const list = document.getElementById('finance-expenses-list');
    list.innerHTML = "";
    const currency = state.profile.currency || "KGS";
    const expList = state.finance.expenses.filter(e => e.type === expenseSubTab);
    if (expList.length === 0) {
        list.innerHTML = `<div class="text-stone-400 text-center py-8">Нет записей о расходах</div>`;
        return;
    }
    expList.forEach(exp => {
        const val = exp.amount || 0;
        const card = document.createElement('div');
        card.className = "bg-stone-50 border border-stone-200/50 rounded-xl p-2.5 flex justify-between items-center text-xs";
        card.innerHTML = `
            <div class="min-w-0 flex-1 pr-2">
                <span class="font-bold text-stone-900 block truncate">${exp.name}</span>
                <span class="text-[9px] text-stone-400 font-bold block uppercase tracking-wider mt-0.5">${exp.categoryId}</span>
            </div>
            <div class="flex items-center gap-3 shrink-0">
                <span class="font-extrabold text-stone-900">${val.toLocaleString()} ${currency}</span>
                <div class="flex gap-1">
                    <button onclick="openExpenseModal('${exp.id}')" class="text-stone-300 hover:text-emerald-800 p-1 transition"><i data-lucide="edit-3" class="w-3.5 h-3.5"></i></button>
                    <button onclick="deleteExpense('${exp.id}')" class="text-stone-300 hover:text-red-600 p-1 transition"><i data-lucide="trash-2" class="w-3.5 h-3.5"></i></button>
                </div>
            </div>
        `;
        list.appendChild(card);
    });
    lucide.createIcons();
}

function openExpenseModal(expenseId = null) {
    const title = document.getElementById('expense-modal-title');
    const idInput = document.getElementById('edit-expense-id');
    const typeInput = document.getElementById('expense-type');
    const nameInput = document.getElementById('expense-name');
    const catSelect = document.getElementById('expense-category');
    const amountLabel = document.getElementById('expense-amount-label');
    const amountInput = document.getElementById('expense-amount');
    
    catSelect.innerHTML = "";
    state.finance.expenseCategories.forEach(cat => {
        const opt = document.createElement('option');
        opt.value = cat; opt.innerText = cat;
        catSelect.appendChild(opt);
    });
    
    if (expenseId) {
        const exp = state.finance.expenses.find(e => e.id === expenseId);
        const isPlan = exp.type === 'planned';
        title.innerText = isPlan ? "Редактировать планируемый расход" : "Редактировать фактический расход";
        amountLabel.innerText = isPlan ? "Планируемая сумма (план)" : "Фактическая сумма (факт)";
        idInput.value = exp.id; typeInput.value = exp.type;
        nameInput.value = exp.name; catSelect.value = exp.categoryId;
        amountInput.value = exp.amount || 0;
    } else {
        const isPlan = expenseSubTab === 'planned';
        title.innerText = isPlan ? "Добавить планируемый расход" : "Добавить фактический расход";
        amountLabel.innerText = isPlan ? "Планируемая сумма (план)" : "Фактическая сумма (факт)";
        idInput.value = ""; typeInput.value = expenseSubTab;
        nameInput.value = ""; catSelect.selectedIndex = 0; amountInput.value = "";
    }
    openModal('modal-add-expense');
}

function handleSaveExpense(e) {
    e.preventDefault();
    const id = document.getElementById('edit-expense-id').value;
    const type = document.getElementById('expense-type').value || expenseSubTab;
    const name = document.getElementById('expense-name').value.trim();
    const categoryId = document.getElementById('expense-category').value;
    const amount = parseFloat(document.getElementById('expense-amount').value) || 0;
    if (!name) return;
    if (id) {
        const exp = state.finance.expenses.find(e => e.id === id);
        if (exp) { exp.name = name; exp.categoryId = categoryId; exp.amount = amount; exp.type = type; }
        showToast("Расход успешно изменен!");
    } else {
        const newId = 'exp-' + Date.now();
        state.finance.expenses.push({ id: newId, name, categoryId, amount, type });
        showToast("Новый расход добавлен!");
    }
    saveState(); closeModal('modal-add-expense'); renderAll();
}

function deleteExpense(id) {
    const exp = state.finance.expenses.find(e => e.id === id);
    showConfirm('Удалить расход?', `Вы действительно хотите удалить расход «${exp.name}»?`, () => {
        state.finance.expenses = state.finance.expenses.filter(e => e.id !== id);
        saveState(); renderAll(); showToast('Расход успешно удален');
    });
}

// --- Категории расходов ---
function openExpenseCategoryModal(oldName = null) {
    const title = document.getElementById('expense-category-modal-title');
    const oldNameInput = document.getElementById('edit-expense-category-old-name');
    const nameInput = document.getElementById('expense-category-name');
    if (oldName) {
        title.innerText = "Редактировать категорию расходов";
        oldNameInput.value = oldName; nameInput.value = oldName;
    } else {
        title.innerText = "Новая категория расходов";
        oldNameInput.value = ""; nameInput.value = "";
    }
    openModal('modal-expense-category');
}

function handleSaveExpenseCategory(event) {
    event.preventDefault();
    const oldName = document.getElementById('edit-expense-category-old-name').value.trim();
    const newName = document.getElementById('expense-category-name').value.trim();
    if (!newName) return;
    if (!state.finance.expenseCategories) state.finance.expenseCategories = [];
    if (oldName) {
        if (oldName !== newName) {
            if (state.finance.expenseCategories.includes(newName)) { showToast('Такая категория уже существует!'); return; }
            state.finance.expenseCategories = state.finance.expenseCategories.map(cat => cat === oldName ? newName : cat);
            state.finance.expenses = state.finance.expenses.map(e => e.categoryId === oldName ? { ...e, categoryId: newName } : e);
            showToast('Категория расходов обновлена');
        }
    } else {
        if (state.finance.expenseCategories.includes(newName)) { showToast('Такая категория уже существует!'); return; }
        state.finance.expenseCategories.push(newName);
        showToast('Категория расходов добавлена');
    }
    saveState(); closeModal('modal-expense-category'); renderAll();
}

function deleteExpenseCategory(name) {
    showConfirm('Удалить категорию расходов?', `Категория «${name}» будет удалена. Все расходы этой категории будут перенесены в «Прочее».`, () => {
        state.finance.expenseCategories = state.finance.expenseCategories.filter(cat => cat !== name);
        if (!state.finance.expenseCategories.includes("Прочее")) state.finance.expenseCategories.push("Прочее");
        state.finance.expenses = state.finance.expenses.map(e => e.categoryId === name ? { ...e, categoryId: "Прочее" } : e);
        saveState(); renderAll(); showToast('Категория расходов удалена');
    });
}

// --- Группировка прихода ---
function switchFinanceGroupMode(mode) {
    financeGroupMode = mode;
    const modes = ['list', 'tables', 'categories'];
    modes.forEach(m => {
        const btn = document.getElementById(`fin-subtab-${m}`);
        if (btn) {
            if (m === mode) btn.className = "px-3.5 py-1.5 rounded-lg font-bold transition bg-white text-stone-850 shadow-xs";
            else btn.className = "px-3.5 py-1.5 rounded-lg font-bold transition text-stone-600 hover:text-stone-900";
        }
    });
    renderFinanceGuests();
}

function toggleFinanceGroupCollapse(groupKey) {
    if (financeCollapsedGroups.has(groupKey)) financeCollapsedGroups.delete(groupKey);
    else financeCollapsedGroups.add(groupKey);
    renderFinanceGuests();
}

function createFinanceGuestCard(guest) {
    const row = document.createElement('div');
    row.className = "flex justify-between items-center bg-stone-50 border border-stone-200/50 px-2 py-1.5 rounded-xl text-xs gap-3";
    const currency = state.profile.currency || "KGS";
    row.innerHTML = `
        <div class="min-w-0 flex-1">
            <span class="font-extrabold text-stone-900 truncate block">${guest.name}</span>
        </div>
        <div class="flex items-center gap-1.5 shrink-0">
            <input type="number" value="${guest.giftAmount || 0}" 
                   onchange="updateGuestGift('${guest.id}', parseFloat(this.value) || 0)"
                   placeholder="Сумма" 
                   class="bg-white border border-stone-200 rounded-lg py-1 px-1.5 text-right font-bold text-stone-950 w-16 text-[11px] focus:outline-none focus:ring-1 focus:ring-emerald-700">
            <span class="font-bold text-[10px] text-stone-500">${currency}</span>
        </div>
    `;
    return row;
}

function renderFinanceGuests() {
    const list = document.getElementById('finance-guests-list');
    list.innerHTML = "";
    const query = document.getElementById('finance-guest-search').value.toLowerCase().trim();
    const currency = state.profile.currency || "KGS";
    const filtered = state.guests.filter(g => g.name.toLowerCase().includes(query));
    if (filtered.length === 0) {
        list.innerHTML = `<div class="text-stone-400 text-center py-8">Ни один гость не найден</div>`;
        return;
    }

    if (financeGroupMode === 'list') {
        const grid = document.createElement('div');
        grid.className = "grid grid-cols-1 sm:grid-cols-2 gap-2";
        filtered.forEach(guest => { grid.appendChild(createFinanceGuestCard(guest)); });
        list.appendChild(grid);
    } else if (financeGroupMode === 'tables') {
        const tables = [...state.tables, { id: 'none', name: 'Без стола', number: '' }];
        tables.forEach(table => {
            const tableGuests = filtered.filter(g => (g.tableId === table.id) || (table.id === 'none' && (!g.tableId || g.tableId === 'none')));
            if (tableGuests.length === 0) return;
            const groupKey = 'fin-tbl-group-' + table.id;
            const isCollapsed = financeCollapsedGroups.has(groupKey);
            const groupSum = tableGuests.reduce((sum, g) => sum + (g.giftAmount || 0), 0);
            const displayName = table.id === 'none' ? 'Без стола' : getTableName(table);
            const header = document.createElement('div');
            header.className = 'w-full bg-stone-150 hover:bg-stone-200 border border-stone-200 px-3 py-2 rounded-xl flex items-center justify-between cursor-pointer transition select-none text-xs';
            header.onclick = () => toggleFinanceGroupCollapse(groupKey);
            header.innerHTML = `
                <div class="flex items-center gap-2">
                    <i data-lucide="armchair" class="w-3.5 h-3.5 text-emerald-800 shrink-0"></i>
                    <span class="font-extrabold text-stone-900">${displayName}</span>
                    <span class="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-950 border border-emerald-100">${tableGuests.length}</span>
                    <span class="text-[9px] font-extrabold text-stone-500">Приход: ${groupSum.toLocaleString()} ${currency}</span>
                </div>
                <i data-lucide="chevron-${isCollapsed ? 'down' : 'up'}" class="w-3.5 h-3.5 text-stone-500 transition"></i>
            `;
            list.appendChild(header);
            if (!isCollapsed) {
                const grid = document.createElement('div');
                grid.className = "grid grid-cols-1 sm:grid-cols-2 gap-2 mt-1 pl-1";
                tableGuests.forEach(guest => { grid.appendChild(createFinanceGuestCard(guest)); });
                list.appendChild(grid);
            }
        });
    } else if (financeGroupMode === 'categories') {
        const categories = [...state.categories, { id: 'none', name: 'Без категории' }];
        categories.forEach(cat => {
            const catGuests = filtered.filter(g => (g.categoryId === cat.id) || (cat.id === 'none' && (!g.categoryId || g.categoryId === 'none')));
            if (catGuests.length === 0) return;
            const groupKey = 'fin-cat-group-' + cat.id;
            const isCollapsed = financeCollapsedGroups.has(groupKey);
            const groupSum = catGuests.reduce((sum, g) => sum + (g.giftAmount || 0), 0);
            const header = document.createElement('div');
            header.className = 'w-full bg-stone-150 hover:bg-stone-200 border border-stone-200 px-3 py-2 rounded-xl flex items-center justify-between cursor-pointer transition select-none text-xs';
            header.onclick = () => toggleFinanceGroupCollapse(groupKey);
            header.innerHTML = `
                <div class="flex items-center gap-2">
                    <i data-lucide="tag" class="w-3.5 h-3.5 text-amber-600 shrink-0"></i>
                    <span class="font-extrabold text-stone-900">${cat.name}</span>
                    <span class="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-amber-50 text-amber-900 border border-amber-100">${catGuests.length}</span>
                    <span class="text-[9px] font-extrabold text-stone-500">Приход: ${groupSum.toLocaleString()} ${currency}</span>
                </div>
                <i data-lucide="chevron-${isCollapsed ? 'down' : 'up'}" class="w-3.5 h-3.5 text-stone-500 transition"></i>
            `;
            list.appendChild(header);
            if (!isCollapsed) {
                const grid = document.createElement('div');
                grid.className = "grid grid-cols-1 sm:grid-cols-2 gap-2 mt-1 pl-1";
                catGuests.forEach(guest => { grid.appendChild(createFinanceGuestCard(guest)); });
                list.appendChild(grid);
            }
        });
    }
    lucide.createIcons();
}

function updateGuestGift(guestId, amount) {
    const guest = state.guests.find(g => g.id === guestId);
    if (guest) {
        guest.giftAmount = amount;
        saveState();
        renderAll();
        showToast(`Записан подарок от ${guest.name}: ${amount} ${state.profile.currency}`);
    }
}

function renderFinanceAnalysis() {
    const currency = state.profile.currency || "KGS";
    const plannedGuests = state.profile.plannedGuests || 0;
    const avgGift = state.profile.avgGift || 0;
    const budgetLimit = state.profile.budget || 0;
    const expectedIncome = plannedGuests * avgGift;
    const actualIncome = state.guests.reduce((sum, g) => sum + (g.giftAmount || 0), 0);
    const plannedExpenses = state.finance.expenses.filter(e => e.type === 'planned').reduce((sum, e) => sum + (e.amount || 0), 0);
    const actualExpenses = state.finance.expenses.filter(e => e.type === 'actual').reduce((sum, e) => sum + (e.amount || 0), 0);

    document.getElementById('fin-expected-income').innerText = expectedIncome.toLocaleString();
    document.getElementById('fin-actual-income').innerText = actualIncome.toLocaleString();
    document.getElementById('fin-planned-expenses').innerText = plannedExpenses.toLocaleString();
    document.getElementById('fin-actual-expenses').innerText = actualExpenses.toLocaleString();
    document.getElementById('fin-budget-limit-hint').innerText = `Лимит бюджета: ${budgetLimit.toLocaleString()} ${currency}`;

    document.getElementById('ana-planned-inc').innerText = expectedIncome.toLocaleString();
    document.getElementById('ana-actual-inc').innerText = actualIncome.toLocaleString();
    document.getElementById('ana-planned-exp').innerText = plannedExpenses.toLocaleString();
    document.getElementById('ana-actual-exp').innerText = actualExpenses.toLocaleString();

    const plannedBalance = expectedIncome - plannedExpenses;
    const actualBalance = actualIncome - actualExpenses;
    document.getElementById('ana-planned-bal').innerText = plannedBalance.toLocaleString();
    const actualBalEl = document.getElementById('ana-actual-bal');
    actualBalEl.innerText = actualBalance.toLocaleString();
    actualBalEl.className = actualBalance >= 0 ? "text-emerald-800 font-bold" : "text-red-600 font-bold";

    const txtEl = document.getElementById('ana-budget-analysis-text');
    if (actualExpenses > budgetLimit) {
        txtEl.innerHTML = `⚠️ <strong>Внимание!</strong> Фактические расходы превысили заложенный лимит бюджета на <span class="text-red-600 font-bold">${(actualExpenses - budgetLimit).toLocaleString()} ${currency}</span>. Попробуйте оптимизировать будущие траты.`;
        txtEl.className = "p-3 rounded-xl bg-red-50 border border-red-150 text-[10px] text-red-800 font-semibold leading-relaxed";
    } else if (actualBalance < 0) {
        txtEl.innerHTML = `⚠️ <strong>Внимание!</strong> Текущие расходы превышают собранные подарки гостей. Баланс торжества ушел в минус на <span class="text-red-600 font-bold">${Math.abs(actualBalance).toLocaleString()} ${currency}</span>.`;
        txtEl.className = "p-3 rounded-xl bg-red-50 border border-red-150 text-[10px] text-red-800 font-semibold leading-relaxed";
    } else {
        txtEl.innerHTML = `✅ <strong>Отличный баланс!</strong> Торжество окупается. Текущий чистый профицит (остаток прибыли) составляет <span class="text-emerald-800 font-bold">${actualBalance.toLocaleString()} ${currency}</span>.`;
        txtEl.className = "p-3 rounded-xl bg-emerald-50 border border-emerald-150 text-[10px] text-emerald-800 font-semibold leading-relaxed";
    }

    const tbody = document.getElementById('finance-analysis-category-rows');
    tbody.innerHTML = "";
    state.finance.expenseCategories.forEach(cat => {
        const catExpenses = state.finance.expenses.filter(e => e.categoryId === cat);
        const plannedSum = catExpenses.filter(e => e.type === 'planned').reduce((sum, e) => sum + (e.amount || 0), 0);
        const actualSum = catExpenses.filter(e => e.type === 'actual').reduce((sum, e) => sum + (e.amount || 0), 0);
        const diff = plannedSum - actualSum;
        if (plannedSum === 0 && actualSum === 0) return;
        const tr = document.createElement('tr');
        tr.className = "border-b border-stone-100";
        const diffClass = diff >= 0 ? "text-emerald-800 font-bold" : "text-red-600 font-bold";
        const diffSymbol = diff >= 0 ? "+" : "";
        tr.innerHTML = `
            <td class="py-2 font-semibold text-stone-900">${cat}</td>
            <td class="py-2 text-right text-stone-600">${plannedSum.toLocaleString()}</td>
            <td class="py-2 text-right text-stone-950 font-bold">${actualSum.toLocaleString()}</td>
            <td class="py-2 text-right ${diffClass}">${diffSymbol}${diff.toLocaleString()}</td>
        `;
        tbody.appendChild(tr);
    });
}
