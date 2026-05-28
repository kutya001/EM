// ===== STATE.JS — Управление состоянием и данные =====

// --- Исходные демонстрационные данные ---
const defaultCategories = [
    { id: "cat-1", name: "Родственники жениха (Мама)" },
    { id: "cat-2", name: "Родственники жениха (Папа)" },
    { id: "cat-3", name: "Родственники невесты (Мама)" },
    { id: "cat-4", name: "Родственники невесты (Папа)" },
    { id: "cat-5", name: "Друзья жениха" },
    { id: "cat-6", name: "Друзья невесты" },
    { id: "cat-7", name: "Коллеги жениха" },
    { id: "cat-8", name: "Коллеги невесты" }
];

const defaultTables = [
    { id: "tbl-1", number: 1, name: "Семья", capacity: 8, categoryId: "cat-1", x: 260, y: 170 },
    { id: "tbl-2", number: 2, name: "Друзья", capacity: 10, categoryId: "cat-5", x: 540, y: 170 },
    { id: "tbl-3", number: 3, name: "", capacity: 10, categoryId: "none", x: 260, y: 440 },
    { id: "tbl-4", number: 4, name: "", capacity: 10, categoryId: "none", x: 540, y: 440 }
];

const defaultGuests = [
    { id: "gst-1", name: "Данияров Кутман", phone: "+77071112233", giftAmount: 4000, categoryId: "cat-5", tableId: "tbl-2", seatIndex: 0 },
    { id: "gst-2", name: "Калиматова Асель", phone: "", giftAmount: 0, categoryId: "cat-1", tableId: "tbl-1", seatIndex: 0 },
    { id: "gst-3", name: "Макеев Бексултан", phone: "+77779998877", giftAmount: 5000, categoryId: "cat-5", tableId: "tbl-2", seatIndex: 1 },
    { id: "gst-4", name: "Исаев Каныбек", phone: "", giftAmount: 0, categoryId: "cat-7", tableId: "none", seatIndex: -1 },
    { id: "gst-5", name: "Смагулова Жанар", phone: "+77015554433", giftAmount: 10000, categoryId: "cat-3", tableId: "none", seatIndex: -1 },
    { id: "gst-6", name: "Осмонов Нурбек", phone: "", giftAmount: 0, categoryId: "cat-2", tableId: "tbl-1", seatIndex: 1 },
    { id: "gst-7", name: "Даниярова Чолпон", phone: "", giftAmount: 3000, categoryId: "cat-4", tableId: "none", seatIndex: -1 }
];

const defaultProfile = {
    eventName: "",
    date: "",
    timeStart: "",
    timeEnd: "",
    eventType: "Свадьба",
    eventTypes: ["Свадьба", "Кыз узатуу", "Бешик той", "День рождения", "Юбилей"],
    budget: 500000,
    currency: "KGS",
    avgGift: 3000,
    plannedGuests: 100,
    venueName: "",
    venueLink: ""
};

const defaultExpenses = [
    { id: "exp-1-plan", categoryId: "Аренда зала", name: "Аренда основного зала ресторана", amount: 150000, type: "planned" },
    { id: "exp-1-act", categoryId: "Аренда зала", name: "Аренда основного зала ресторана (предоплата)", amount: 150000, type: "actual" },
    { id: "exp-2-plan", categoryId: "Банкет / Меню", name: "Банкетное меню на 120 человек", amount: 240000, type: "planned" },
    { id: "exp-3-plan", categoryId: "Оформление / Декор", name: "Декор сцены и гостевых столов флористикой", amount: 60000, type: "planned" },
    { id: "exp-3-act", categoryId: "Оформление / Декор", name: "Аванс декораторам за флористику", amount: 30000, type: "actual" },
    { id: "exp-4-plan", categoryId: "Ведущий / Шоу", name: "Гонорар тамады и звукорежиссера с аппаратурой", amount: 45000, type: "planned" },
    { id: "exp-4-act", categoryId: "Ведущий / Шоу", name: "Аванс ведущему торжества", amount: 15000, type: "actual" },
    { id: "exp-5-plan", categoryId: "Фото и видео", name: "Свадебный фотограф и двухкамерная видеосъемка SDE", amount: 40000, type: "planned" },
    { id: "exp-5-act", categoryId: "Фото и видео", name: "Предоплата за свадебную съемку SDE", amount: 10000, type: "actual" }
];

// --- Глобальное состояние приложения ---
var state = {
    guests: [],
    tables: [],
    categories: [],
    profile: null,
    finance: null,
    showFullNames: false,
    guestsViewMode: 'list'
};

const STORAGE_KEY = 'wedding_seater_v3_kutman';
var selectedGuests = new Set();
var currentTab = 'profile';
var guestsViewMode = 'list';
var collapsedGroups = new Set();
var currentFinanceTab = 'overview';
var expenseSubTab = 'planned';
var financeGroupMode = 'list';
var financeCollapsedGroups = new Set();

// --- Утилитарные функции ---
function getTableName(table) {
    if (!table) return "";
    return `Стол №${table.number}` + (table.name && table.name.trim() ? ` (${table.name})` : "");
}

function getInitials(name) {
    if (!name) return "";
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
        return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return parts[0].substring(0, 2).toUpperCase();
}

// --- Сохранение / загрузка ---
function saveState() {
    state.showFullNames = showFullNames;
    state.guestsViewMode = guestsViewMode;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

async function loadDemoData() {
    try {
        const response = await fetch('demo_data.json');
        if (!response.ok) {
            throw new Error(`Failed to fetch: ${response.statusText}`);
        }
        const data = await response.json();
        
        state.categories = data.categories;
        state.tables = data.tables;
        state.guests = data.guests;
        state.profile = data.profile;
        state.finance = data.finance;
    } catch (e) {
        console.warn("Could not load demo_data.json, using hardcoded fallback data:", e);
        state.categories = JSON.parse(JSON.stringify(defaultCategories));
        state.tables = JSON.parse(JSON.stringify(defaultTables));
        state.guests = JSON.parse(JSON.stringify(defaultGuests));
        state.profile = JSON.parse(JSON.stringify(defaultProfile));
        state.finance = {
            expenseCategories: ["Аренда зала", "Банкет / Меню", "Оформление / Декор", "Ведущий / Шоу", "Фото и видео", "Полиграфия / Пригласительные", "Транспорт", "Прочее"],
            expenses: JSON.parse(JSON.stringify(defaultExpenses))
        };
    }
    state.showFullNames = false;
    state.guestsViewMode = 'list';
    saveState();
}

function clearAllData() {
    state.categories = [];
    state.tables = [];
    state.guests = [];
    state.profile = {
        eventName: "",
        date: "",
        timeStart: "",
        timeEnd: "",
        eventType: "Свадьба",
        eventTypes: ["Свадьба", "Кыз узатуу", "Бешик той", "День рождения", "Юбилей"],
        budget: 0,
        currency: "KGS",
        avgGift: 0,
        plannedGuests: 0,
        venueName: "",
        venueLink: ""
    };
    state.finance = {
        expenseCategories: ["Аренда зала", "Банкет / Меню", "Оформление / Декор", "Ведущий / Шоу", "Фото и видео", "Полиграфия / Пригласительные", "Транспорт", "Прочее"],
        expenses: []
    };
    state.showFullNames = false;
    state.guestsViewMode = 'list';
    saveState();
    
    if (typeof startOnboarding === 'function') {
        startOnboarding();
    }
}

// Гарантируем уникальность seatIndex для гостей стола
function ensureSeatIndices() {
    state.tables.forEach(table => {
        const tableGuests = state.guests.filter(g => g.tableId === table.id);
        let usedIndices = [];
        tableGuests.forEach(g => {
            if (g.seatIndex === undefined || g.seatIndex === -1 || usedIndices.includes(g.seatIndex) || g.seatIndex >= table.capacity) {
                let assigned = false;
                for (let i = 0; i < table.capacity; i++) {
                    if (!usedIndices.includes(i)) {
                        g.seatIndex = i;
                        usedIndices.push(i);
                        assigned = true;
                        break;
                    }
                }
                if (!assigned) {
                    g.seatIndex = table.capacity;
                }
            } else {
                usedIndices.push(g.seatIndex);
            }
        });
    });
    state.guests.forEach(g => {
        if (!g.tableId || g.tableId === 'none') {
            g.seatIndex = -1;
        }
    });
}

// Автоматическая выдача свободного индекса сиденья гостю за столом
function assignSeatToGuest(guest, tableId) {
    if (tableId === 'none') {
        guest.tableId = 'none';
        guest.seatIndex = -1;
        return;
    }
    const table = state.tables.find(t => t.id === tableId);
    if (!table) return;
    
    const occupiedIndices = state.guests
        .filter(g => g.tableId === tableId && g.id !== guest.id)
        .map(g => g.seatIndex);
        
    let foundIndex = -1;
    for (let i = 0; i < table.capacity; i++) {
        if (!occupiedIndices.includes(i)) {
            foundIndex = i;
            break;
        }
    }
    
    if (foundIndex !== -1) {
        guest.tableId = tableId;
        guest.seatIndex = foundIndex;
    } else {
        guest.tableId = tableId;
        guest.seatIndex = table.capacity;
    }
}

// Фильтрация гостей по поиску и фильтрам
function getFilteredGuests() {
    const query = document.getElementById('search-input').value.toLowerCase().trim();
    const filterCat = document.getElementById('filter-category').value;
    const filterTbl = document.getElementById('filter-table').value;

    return state.guests.filter(g => {
        const matchesSearch = g.name.toLowerCase().includes(query);
        const matchesCategory = (filterCat === 'all') || (g.categoryId === filterCat);
        const matchesTable = (filterTbl === 'all') || 
                              (filterTbl === 'none' && (!g.tableId || g.tableId === 'none')) || 
                              (g.tableId === filterTbl);
        return matchesSearch && matchesCategory && matchesTable;
    });
}
