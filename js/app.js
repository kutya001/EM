// ===== APP.JS — Точка входа и инициализация приложения =====

function initApp() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
        try {
            state = JSON.parse(saved);
        } catch (e) {
            loadDemoData();
        }
    } else {
        loadDemoData();
    }

    // Защита от старых сохранений
    if (!state.profile) {
        state.profile = JSON.parse(JSON.stringify(defaultProfile));
    }
    if (state.profile.plannedGuests === undefined) {
        state.profile.plannedGuests = state.guests.length > 0 ? state.guests.length : 100;
    }
    if (!state.finance) {
        state.finance = {
            expenseCategories: ["Аренда зала", "Банкет / Меню", "Оформление / Декор", "Ведущий / Шоу", "Фото и видео", "Полиграфия / Пригласительные", "Транспорт", "Прочее"],
            expenses: JSON.parse(JSON.stringify(defaultExpenses))
        };
    } else {
        // Миграция расходов
        if (state.finance.expenses) {
            let migrated = false;
            const newExpenses = [];
            state.finance.expenses.forEach(e => {
                if (e.planned !== undefined || e.actual !== undefined) {
                    migrated = true;
                    const plannedVal = parseFloat(e.planned) || 0;
                    const actualVal = parseFloat(e.actual) || 0;
                    if (plannedVal > 0) {
                        newExpenses.push({ id: e.id + '-plan', name: e.name, categoryId: e.categoryId, amount: plannedVal, type: 'planned' });
                    }
                    if (actualVal > 0) {
                        newExpenses.push({ id: e.id + '-act', name: e.name + ' (Фактически)', categoryId: e.categoryId, amount: actualVal, type: 'actual' });
                    }
                    if (plannedVal === 0 && actualVal === 0) {
                        newExpenses.push({ id: e.id + '-plan', name: e.name, categoryId: e.categoryId, amount: 0, type: 'planned' });
                    }
                } else {
                    newExpenses.push(e);
                }
            });
            if (migrated) state.finance.expenses = newExpenses;
        }
    }
    
    // Защита giftAmount
    state.guests.forEach(g => {
        if (g.giftAmount === undefined) g.giftAmount = 0;
    });
    
    // Миграция столов
    if (state.tables) {
        state.tables.forEach((t, index) => {
            if (t.number === undefined) {
                const match = t.name.match(/Стол\s*№?\s*(\d+)(?:\s*\((.*?)\))?/i);
                if (match) {
                    t.number = parseInt(match[1]) || (index + 1);
                    t.name = match[2] ? match[2].trim() : "";
                } else {
                    t.number = index + 1;
                }
            }
        });
    }
    
    showFullNames = state.showFullNames || false;
    guestsViewMode = state.guestsViewMode || 'list';
    const toggleNamesBtn = document.getElementById('toggle-names-mode');
    if (toggleNamesBtn) toggleNamesBtn.checked = showFullNames;
    
    switchGuestsViewMode(guestsViewMode);
    initProfileUI();

    selectedGuests.clear();
    ensureSeatIndices();
    updateBulkActionBar();
    updateDropdowns();
    
    switchTab('profile');
    switchFinanceTab('overview');
    switchFinanceGroupMode('list');
    
    lucide.createIcons();
}

// --- Импорт / Экспорт ---
function exportToJSON() {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(state, null, 2));
    const dlAnchorElem = document.createElement('a');
    dlAnchorElem.setAttribute("href", dataStr);
    dlAnchorElem.setAttribute("download", `event_database_${new Date().toISOString().slice(0,10)}.json`);
    dlAnchorElem.click();
    showToast('JSON файл экспортирован!');
}

function importFromJSON(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(evt) {
        try {
            const imported = JSON.parse(evt.target.result);
            if (imported.guests && imported.tables && imported.categories) {
                state = imported;
                saveState();
                ensureSeatIndices();
                updateDropdowns();
                selectedGuests.clear();
                updateBulkActionBar();
                showFullNames = state.showFullNames || false;
                guestsViewMode = state.guestsViewMode || 'list';
                const toggleNamesBtn = document.getElementById('toggle-names-mode');
                if (toggleNamesBtn) toggleNamesBtn.checked = showFullNames;
                switchGuestsViewMode(guestsViewMode);
                initProfileUI();
                centerCanvasViewport();
                renderAll();
                showToast('База данных успешно импортирована из JSON!');
            } else {
                showToast('Ошибка: Неверная структура JSON!');
            }
        } catch (err) {
            showToast('Не удалось распознать JSON-файл.');
        }
    };
    reader.readAsText(file);
    e.target.value = '';
}

function confirmResetData() {
    showConfirm(
        'Сбросить все данные?',
        'Вы уверены? Это действие безвозвратно удалит текущий прогресс планировки и загрузит демонстрационные данные.',
        () => {
            loadDemoData();
            updateDropdowns();
            selectedGuests.clear();
            ensureSeatIndices();
            updateBulkActionBar();
            showFullNames = false;
            guestsViewMode = 'list';
            const toggleNamesBtn = document.getElementById('toggle-names-mode');
            if (toggleNamesBtn) toggleNamesBtn.checked = false;
            switchGuestsViewMode('list');
            initProfileUI();
            centerCanvasViewport();
            renderAll();
            showToast('База успешно сброшена');
        }
    );
}

// --- Автоинициализация ---
window.onload = function() {
    initApp();
    document.getElementById('search-input').addEventListener('input', renderGuests);
    document.getElementById('filter-category').addEventListener('change', renderGuests);
    document.getElementById('filter-table').addEventListener('change', renderGuests);
    window.addEventListener('resize', () => {
        if (currentTab === 'schema') centerCanvasViewport();
    });
};
