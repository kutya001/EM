// ===== UI.JS — Общие UI-компоненты и навигация =====

// --- Навигация между вкладками ---
function switchTab(tabId) {
    currentTab = tabId;
    document.querySelectorAll('.tab-content').forEach(el => el.classList.add('hidden'));
    document.getElementById(`tab-${tabId}`).classList.remove('hidden');

    // Мобильные кнопки
    document.querySelectorAll('nav button').forEach(btn => {
        btn.classList.remove('text-emerald-800');
        btn.classList.add('text-stone-400');
    });
    const activeMobileBtn = document.getElementById(`btn-tab-${tabId}`);
    if (activeMobileBtn) {
        activeMobileBtn.classList.remove('text-stone-400');
        activeMobileBtn.classList.add('text-emerald-800');
    }

    // Кнопки для ПК
    const pcTabs = ['profile', 'guests', 'tables', 'schema', 'finance'];
    pcTabs.forEach(t => {
        const btn = document.getElementById(`pc-btn-tab-${t}`);
        if (btn) {
            btn.classList.remove('bg-stone-900/70', 'text-white');
            btn.classList.add('text-stone-300');
        }
    });
    const activePcBtn = document.getElementById(`pc-btn-tab-${tabId}`);
    if (activePcBtn) {
        activePcBtn.classList.remove('text-stone-300');
        activePcBtn.classList.add('bg-stone-900/70', 'text-white');
    }

    renderAll();
    lucide.createIcons();

    if (tabId === 'profile') {
        switchMainSubTab(currentMainSubTab || 'profile');
    }

    if (tabId === 'schema') {
        setTimeout(() => {
            initCanvas();
            centerCanvasViewport();
        }, 100);
    }
}

// Виртуальный полноэкранный режим для схемы зала
function toggleCanvasFullscreen() {
    const wrap = document.getElementById('canvas-wrap');
    const icon = document.getElementById('fullscreen-icon');
    const isFull = wrap.classList.contains('fixed');
    
    if (isFull) {
        wrap.className = "relative bg-stone-100 rounded-3xl border border-stone-200/80 overflow-hidden h-[480px] md:h-[650px] shadow-inner transition-all duration-300";
        icon.setAttribute('data-lucide', 'maximize-2');
        showToast("Обычный режим схемы");
    } else {
        wrap.className = "fixed inset-0 z-50 bg-stone-100 w-screen h-screen rounded-none border-none overflow-hidden flex flex-col transition-all duration-300";
        icon.setAttribute('data-lucide', 'minimize-2');
        showToast("Полноэкранный режим планировщика");
    }
    lucide.createIcons();
    setTimeout(() => {
        centerCanvasViewport();
    }, 150);
}

// --- Универсальные модальные окна ---
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    modal.classList.remove('hidden');
    setTimeout(() => {
        modal.firstElementChild.classList.remove('scale-95', 'opacity-0');
    }, 50);
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    modal.firstElementChild.classList.add('scale-95', 'opacity-0');
    setTimeout(() => {
        modal.classList.add('hidden');
    }, 200);
}

function showToast(text) {
    const toast = document.getElementById('toast');
    if (!toast) return;
    const toastText = document.getElementById('toast-text');
    if (toastText) toastText.innerText = text;
    
    toast.classList.remove('opacity-0', 'pointer-events-none', 'scale-90');
    toast.classList.add('opacity-100', 'scale-100');
    
    if (window.toastTimer) clearTimeout(window.toastTimer);
    window.toastTimer = setTimeout(() => {
        toast.classList.add('opacity-0', 'pointer-events-none', 'scale-90');
        toast.classList.remove('opacity-100', 'scale-100');
    }, 3000);
}

function showConfirm(title, text, onYes) {
    const modal = document.getElementById('modal-confirm');
    if (!modal) return;
    const titleEl = document.getElementById('confirm-title');
    const textEl = document.getElementById('confirm-text');
    if (titleEl) titleEl.innerText = title;
    if (textEl) textEl.innerText = text;
    
    openModal('modal-confirm');

    const btnYes = document.getElementById('confirm-btn-yes');
    const btnCancel = document.getElementById('confirm-btn-cancel');
    if (!btnYes || !btnCancel) return;

    const newYes = btnYes.cloneNode(true);
    const newCancel = btnCancel.cloneNode(true);
    btnYes.parentNode.replaceChild(newYes, btnYes);
    btnCancel.parentNode.replaceChild(newCancel, btnCancel);

    newYes.addEventListener('click', () => {
        onYes();
        closeModal('modal-confirm');
    });
    newCancel.addEventListener('click', () => {
        closeModal('modal-confirm');
    });
}

// --- Обновление выпадающих селектов ---
function updateDropdowns() {
    const gCat = document.getElementById('guest-category');
    const gTbl = document.getElementById('guest-table');
    const tCat = document.getElementById('table-category');
    
    const fCat = document.getElementById('filter-category');
    const fTbl = document.getElementById('filter-table');

    let catHTML = '<option value="none">Без категории</option>';
    state.categories.forEach(c => {
        catHTML += `<option value="${c.id}">${c.name}</option>`;  
    });
    gCat.innerHTML = catHTML;
    tCat.innerHTML = catHTML;

    let tblHTML = '<option value="none">Без стола (Не рассажен)</option>';
    state.tables.forEach(t => {
        tblHTML += `<option value="${t.id}">${getTableName(t)} (До ${t.capacity} чел.)</option>`;
    });
    gTbl.innerHTML = tblHTML;

    let filterCatHTML = '<option value="all">Все категории гостей</option>';
    state.categories.forEach(c => {
        filterCatHTML += `<option value="${c.id}">${c.name}</option>`;  
    });
    fCat.innerHTML = filterCatHTML;

    let filterTblHTML = '<option value="all">Все столы</option><option value="none">Без стола</option>';
    state.tables.forEach(t => {
        filterTblHTML += `<option value="${t.id}">${getTableName(t)}</option>`;  
    });
    fTbl.innerHTML = filterTblHTML;
}

// --- Отрисовка активных данных ---
function renderAll() {
    updateDashboardStats();
    if (currentTab === 'profile') {
        if (currentMainSubTab === 'stats') {
            renderAnalyticsTab();
        } else if (currentMainSubTab === 'database') {
            renderMiniCategories();
            renderMiniExpenseCategories();
        } else {
            renderProfileView();
        }
    }
    if (currentTab === 'guests') renderGuests();
    if (currentTab === 'tables') renderTables();
    if (currentTab === 'schema') drawCanvas();
    if (currentTab === 'finance') {
        renderExpenses();
        renderFinanceGuests();
        renderFinanceAnalysis();
    }
}

// --- Статистика в шапке ---
function updateDashboardStats() {
    const total = state.guests.length;
    const seated = state.guests.filter(g => g.tableId && g.tableId !== 'none').length;
    const unseated = total - seated;
    const percent = total > 0 ? Math.round((seated / total) * 100) : 0;

    // Мобильная шапка
    document.getElementById('header-seated-count').innerText = `${seated}/${total}`;
    // ПК шапка
    const pcSeated = document.getElementById('pc-header-seated-count');
    if (pcSeated) pcSeated.innerText = `${seated}/${total}`;

    document.getElementById('stats-seated').innerText = seated;
    document.getElementById('stats-unseated').innerText = unseated;
    document.getElementById('stats-percent').innerText = `${percent}%`;
    document.getElementById('stats-progress-bar').style.width = `${percent}%`;
}

// --- Canvas-утилита скруглённый прямоугольник ---
function drawRoundedRect(x, y, width, height, radius, fill, stroke) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
    if (fill) ctx.fill();
    if (stroke) ctx.stroke();
}

// --- ИНТЕРАКТИВНЫЙ ОНБОРДИНГ (МАСТЕР ВВОДА ДАННЫХ) ---
var onboardingCurrentStep = 1;
const onboardingTotalSteps = 4;

function startOnboarding() {
    onboardingCurrentStep = 1;
    
    const p = state.profile || {};
    document.getElementById('onb-event-name').value = p.eventName || "";
    document.getElementById('onb-event-type').value = p.eventType || "Свадьба";
    document.getElementById('onb-date').value = p.date || "";
    document.getElementById('onb-time-start').value = p.timeStart || "";
    document.getElementById('onb-time-end').value = p.timeEnd || "";
    document.getElementById('onb-venue-name').value = p.venueName || "";
    document.getElementById('onb-venue-link').value = p.venueLink || "";
    document.getElementById('onb-budget').value = p.budget || 500000;
    document.getElementById('onb-planned-guests').value = p.plannedGuests || 100;
    document.getElementById('onb-currency').value = p.currency || "KGS";
    document.getElementById('onb-avg-gift').value = p.avgGift || 3000;
    
    const useFin = p.useFinance !== false;
    document.getElementById('onb-use-finance').checked = useFin;
    toggleOnboardingFinanceFields(useFin);

    selectOnboardingStep(1);
    openModal('modal-onboarding');
}

function selectOnboardingStep(stepIdx) {
    onboardingCurrentStep = stepIdx;
    
    for (let i = 1; i <= onboardingTotalSteps; i++) {
        const slide = document.getElementById(`onb-step-${i}`);
        if (slide) slide.classList.add('hidden');
        
        const dot = document.getElementById(`onb-dot-${i}`);
        if (dot) {
            dot.className = `w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                i === stepIdx ? 'bg-amber-400 w-6' : 'bg-stone-300'
            }`;
        }
    }
    
    const currentSlide = document.getElementById(`onb-step-${stepIdx}`);
    if (currentSlide) currentSlide.classList.remove('hidden');
    
    const btnPrev = document.getElementById('onb-btn-prev');
    const btnNext = document.getElementById('onb-btn-next');
    
    if (btnPrev) {
        if (stepIdx === 1) {
            btnPrev.classList.add('invisible');
        } else {
            btnPrev.classList.remove('invisible');
        }
    }
    
    if (btnNext) {
        if (stepIdx === onboardingTotalSteps) {
            btnNext.innerText = "Начать планирование!";
        } else {
            btnNext.innerText = "Далее";
        }
    }
}

function nextOnboardingStep() {
    if (onboardingCurrentStep === 1) {
        const name = document.getElementById('onb-event-name').value.trim();
        if (!name) {
            showToast("Пожалуйста, введите название вашего мероприятия");
            const input = document.getElementById('onb-event-name');
            input.focus();
            input.classList.add('ring-2', 'ring-red-500');
            setTimeout(() => input.classList.remove('ring-2', 'ring-red-500'), 2000);
            return;
        }
    }
    
    if (onboardingCurrentStep < onboardingTotalSteps) {
        selectOnboardingStep(onboardingCurrentStep + 1);
    } else {
        completeOnboarding();
    }
}

function prevOnboardingStep() {
    if (onboardingCurrentStep > 1) {
        selectOnboardingStep(onboardingCurrentStep - 1);
    }
}

function completeOnboarding() {
    const eventName = document.getElementById('onb-event-name').value.trim();
    const eventType = document.getElementById('onb-event-type').value;
    const date = document.getElementById('onb-date').value;
    const timeStart = document.getElementById('onb-time-start').value;
    const timeEnd = document.getElementById('onb-time-end').value;
    const venueName = document.getElementById('onb-venue-name').value.trim();
    const venueLink = document.getElementById('onb-venue-link').value.trim();
    const budget = parseFloat(document.getElementById('onb-budget').value) || 0;
    const plannedGuests = parseInt(document.getElementById('onb-planned-guests').value) || 0;
    const currency = document.getElementById('onb-currency').value;
    const avgGift = parseFloat(document.getElementById('onb-avg-gift').value) || 0;
    const useFinance = document.getElementById('onb-use-finance').checked;

    state.profile = {
        ...state.profile,
        eventName,
        date,
        timeStart,
        timeEnd,
        eventType,
        venueName,
        venueLink,
        budget,
        plannedGuests,
        currency,
        avgGift,
        useFinance,
        eventTypes: state.profile ? (state.profile.eventTypes || ["Свадьба", "Кыз узатуу", "Бешик той", "День рождения", "Юбилей"]) : ["Свадьба", "Кыз узатуу", "Бешик той", "День рождения", "Юбилей"]
    };

    if (!state.categories || state.categories.length === 0) {
        state.categories = [
            { id: "cat-1", name: "Родственники жениха (Мама)" },
            { id: "cat-2", name: "Родственники жениха (Папа)" },
            { id: "cat-3", name: "Родственники невесты (Мама)" },
            { id: "cat-4", name: "Родственники невесты (Папа)" },
            { id: "cat-5", name: "Друзья жениха" },
            { id: "cat-6", name: "Друзья невесты" },
            { id: "cat-7", name: "Коллеги жениха" },
            { id: "cat-8", name: "Коллеги невесты" }
        ];
    }
    if (!state.finance) {
        state.finance = {
            expenseCategories: ["Аренда зала", "Банкет / Меню", "Оформление / Декор", "Ведущий / Шоу", "Фото и видео", "Полиграфия / Пригласительные", "Транспорт", "Прочее"],
            expenses: []
        };
    }

    saveState();
    closeModal('modal-onboarding');
    
    const subtitle = document.getElementById('header-subtitle');
    if (subtitle) {
        subtitle.innerText = eventName ? eventName : "Система планирования мероприятий";
    }
    document.querySelectorAll('.fin-curr-label').forEach(el => {
        el.innerText = currency;
    });

    updateFinanceVisibility();
    renderAll();
    showToast("Мероприятие успешно создано! Приступайте к планированию.");
}

async function onboardingLoadDemo() {
    closeModal('modal-onboarding');
    showToast("Загрузка демонстрационных данных...");
    await loadDemoData();
    ensureSeatIndices();
    updateDropdowns();
    selectedGuests.clear();
    updateBulkActionBar();
    
    const p = state.profile;
    const subtitle = document.getElementById('header-subtitle');
    if (subtitle) {
        subtitle.innerText = p.eventName ? p.eventName : "Система планирования мероприятий";
    }
    
    updateFinanceVisibility();
    renderAll();
    showToast("Демонстрационные данные успешно загружены!");
}

function confirmClearAllData() {
    showConfirm(
        'Сбросить все данные и настроить заново?',
        'Вы уверены? Это действие безвозвратно удалит текущий прогресс планировки и запустит интерактивный помощник настройки с нуля.',
        () => {
            clearAllData();
        }
    );
}

function switchHelpTab(tabIdx) {
    const tabsCount = 5;
    const slideIndex = document.getElementById('help-slide-index');
    const btnBack = document.getElementById('help-btn-back');

    if (tabIdx === 0) {
        // Show index/roadmap dashboard
        if (slideIndex) slideIndex.classList.remove('hidden');
        if (btnBack) btnBack.classList.add('hidden');
        
        for (let i = 1; i <= tabsCount; i++) {
            const slide = document.getElementById(`help-slide-${i}`);
            if (slide) slide.classList.add('hidden');
        }
    } else {
        // Show specific help page slide
        if (slideIndex) slideIndex.classList.add('hidden');
        if (btnBack) btnBack.classList.remove('hidden');
        
        for (let i = 1; i <= tabsCount; i++) {
            const slide = document.getElementById(`help-slide-${i}`);
            if (slide) {
                if (i === tabIdx) slide.classList.remove('hidden');
                else slide.classList.add('hidden');
            }
        }
    }
    
    // Highlight roadmap steps dynamically if present
    for (let i = 1; i <= tabsCount; i++) {
        const stepBadge = document.getElementById(`roadmap-step-badge-${i}`);
        if (stepBadge) {
            if (tabIdx === i) {
                stepBadge.classList.add('roadmap-step-active');
            } else {
                stepBadge.classList.remove('roadmap-step-active');
            }
        }
    }
    
    // Dynamic Footer update
    updateHelpModalFooter(tabIdx);
    
    lucide.createIcons();
}

function updateHelpModalFooter(tabIdx) {
    const footer = document.getElementById('help-modal-footer');
    if (!footer) return;

    if (tabIdx === 0) {
        footer.innerHTML = `
            <span class="text-[10px] text-stone-400 font-bold">EM Pro v3 — Создано для идеальных событий</span>
            <button type="button" onclick="closeModal('modal-help')" class="bg-emerald-800 text-white text-xs font-bold py-2.5 px-5 rounded-xl hover:bg-emerald-700 active:scale-95 transition shadow-sm">
                Понятно, завершить
            </button>
        `;
    } else {
        const useFinance = state.profile && state.profile.useFinance !== false;
        
        let nextAction = "";
        let nextText = "Далее";
        
        if (tabIdx === 5) {
            nextAction = "closeModal('modal-help')";
            nextText = "Понятно, завершить";
        } else if (tabIdx === 4 && !useFinance) {
            nextAction = "closeModal('modal-help')";
            nextText = "Понятно, завершить";
        } else {
            nextAction = `switchHelpTab(${tabIdx + 1})`;
        }
        
        footer.innerHTML = `
            <button type="button" onclick="switchHelpTab(${tabIdx - 1})" class="bg-white border border-stone-200 text-stone-700 text-xs font-bold py-2.5 px-4 rounded-xl hover:bg-stone-100 active:scale-95 transition">
                Назад
            </button>
            <button type="button" onclick="${nextAction}" class="bg-emerald-800 text-white text-xs font-bold py-2.5 px-5 rounded-xl hover:bg-emerald-700 active:scale-95 transition shadow-sm">
                ${nextText}
            </button>
        `;
    }
}

function updateFinanceVisibility() {
    const useFinance = state.profile && state.profile.useFinance !== false;
    
    // PC tab button
    const pcFinBtn = document.getElementById('pc-btn-tab-finance');
    if (pcFinBtn) {
        if (useFinance) pcFinBtn.classList.remove('hidden');
        else pcFinBtn.classList.add('hidden');
    }
    
    // Mobile tab button
    const mbFinBtn = document.getElementById('btn-tab-finance');
    if (mbFinBtn) {
        if (useFinance) mbFinBtn.classList.remove('hidden');
        else mbFinBtn.classList.add('hidden');
    }

    // Profile page financial stats card
    const viewBudgetCard = document.getElementById('profile-view-budget-card');
    if (viewBudgetCard) {
        if (useFinance) viewBudgetCard.classList.remove('hidden');
        else viewBudgetCard.classList.add('hidden');
    }

    // Profile edit budget fields
    const editBudgetContainer = document.getElementById('profile-edit-budget-container');
    if (editBudgetContainer) {
        if (useFinance) editBudgetContainer.classList.remove('hidden');
        else editBudgetContainer.classList.add('hidden');
    }

    // Help index financial elements
    const helpFinCard = document.getElementById('help-index-card-finance');
    if (helpFinCard) {
        if (useFinance) helpFinCard.classList.remove('hidden');
        else helpFinCard.classList.add('hidden');
    }
    const helpFinStep = document.getElementById('roadmap-step-btn-5');
    if (helpFinStep) {
        if (useFinance) helpFinStep.classList.remove('hidden');
        else helpFinStep.classList.add('hidden');
    }

    // Force switch tab if on finance and it is disabled
    if (!useFinance && currentTab === 'finance') {
        switchTab('profile');
    }
}

function toggleOnboardingFinanceFields(checked) {
    const container = document.getElementById('onb-financial-fields-container');
    if (container) {
        if (checked) container.classList.remove('hidden');
        else container.classList.add('hidden');
    }
}
