// ===== CANVAS.JS — Логика схемы зала (2D Canvas планировщик) =====

// --- Canvas переменные ---
var canvas = null;
var ctx = null;
var isDraggingTable = false;
var isDraggingGuest = false;
var isPanning = false;
var activeTable = null;

var zoom = 1.0;
var panX = 0;
var panY = 0;
var panStartX = 0;
var panStartY = 0;
var mouseStartX = 0;
var mouseStartY = 0;

var isZooming = false;
var initialTouchDist = 0;
var initialZoom = 1.0;
var initialTouchMid = { x: 0, y: 0 };
var initialTouchWorldMid = { x: 0, y: 0 };

var showFullNames = false;

var draggedGuest = null;
var draggedGuestSource = null;
var draggedGuestCurrentPos = { x: 0, y: 0 };

var dragStart = { x: 0, y: 0 };
var dragStartPos = { x: 0, y: 0 };
var dragHasMoved = false;
var canvasEventsInitialized = false;

var activeTooltip = null;
var longPressTimer = null;
var pendingGuestDrag = null;

// --- Центрирование вьюпорта ---
function centerCanvasViewport() {
    canvas = document.getElementById('seating-canvas');
    const wrap = document.getElementById('canvas-wrap');
    if (!canvas || !wrap) return;
    
    const wrapRect = wrap.getBoundingClientRect();
    canvas.width = Math.floor(wrapRect.width);
    canvas.height = Math.floor(wrapRect.height);
    
    panX = (canvas.width - 800 * zoom) / 2;
    panY = (canvas.height - 800 * zoom) / 2;
    
    drawCanvas();
}

// --- Инициализация Canvas ---
function initCanvas() {
    canvas = document.getElementById('seating-canvas');
    if (!canvas) return;
    ctx = canvas.getContext('2d');

    // Динамическая адаптация инструкции для мобильных / ПК
    const isTouch = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
    const helperText = document.getElementById('schema-helper-text');
    if (helperText) {
        if (isTouch) {
            helperText.innerHTML = `💡 <strong>Управление на телефоне:</strong> Перетаскивайте столы пальцем. Масштабируйте жестом двух пальцев (pinch). Удерживайте стул 400мс, чтобы "поднять" гостя для пересадки.`;
        } else {
            helperText.innerHTML = `💡 <strong>Управление на ПК:</strong> Двигайте столы на <strong>ЛКМ</strong>. Двигайте сам зал на <strong>ПКМ</strong> или свободный фон. Колесо мыши / жест двумя пальцами — <strong>масштаб</strong>. Клик на стул выводит подсказку. Зажатие на 150мс поднимает гостя.`;
        }
    }
    
    if (!canvasEventsInitialized) {
        canvas.addEventListener('contextmenu', (e) => { e.preventDefault(); });

        canvas.addEventListener('wheel', (e) => {
            e.preventDefault();
            const rect = canvas.getBoundingClientRect();
            const screenX = e.clientX - rect.left;
            const screenY = e.clientY - rect.top;
            const worldX = (screenX - panX) / zoom;
            const worldY = (screenY - panY) / zoom;
            const zoomFactor = 1.1;
            let newZoom = e.deltaY < 0 ? zoom * zoomFactor : zoom / zoomFactor;
            newZoom = Math.max(0.4, Math.min(3.0, newZoom));
            panX = screenX - worldX * newZoom;
            panY = screenY - worldY * newZoom;
            zoom = newZoom;
            drawCanvas();
        }, { passive: false });

        canvas.addEventListener('mousedown', (e) => {
            const rect = canvas.getBoundingClientRect();
            const screenX = e.clientX - rect.left;
            const screenY = e.clientY - rect.top;
            if (e.button === 2) {
                isPanning = true;
                panStartX = panX; panStartY = panY;
                mouseStartX = screenX; mouseStartY = screenY;
                e.preventDefault();
            } else {
                handleStart(e.clientX, e.clientY, false);
            }
        });

        canvas.addEventListener('mousemove', (e) => {
            const rect = canvas.getBoundingClientRect();
            const screenX = e.clientX - rect.left;
            const screenY = e.clientY - rect.top;
            if (isPanning) {
                panX = panStartX + (screenX - mouseStartX);
                panY = panStartY + (screenY - mouseStartY);
                drawCanvas();
            } else {
                handleMove(e.clientX, e.clientY);
            }
        });

        canvas.addEventListener('mouseup', (e) => {
            if (isPanning) { isPanning = false; saveState(); }
            else { handleEnd(); }
        });

        canvas.addEventListener('mouseleave', () => {
            isPanning = false; handleEnd();
        });

        canvas.addEventListener('touchstart', (e) => {
            if (e.touches.length === 2) {
                isPanning = false; isZooming = true;
                const t1 = e.touches[0], t2 = e.touches[1];
                initialTouchDist = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
                initialZoom = zoom;
                const rect = canvas.getBoundingClientRect();
                const midX = ((t1.clientX + t2.clientX) / 2) - rect.left;
                const midY = ((t1.clientY + t2.clientY) / 2) - rect.top;
                initialTouchMid = { x: midX, y: midY };
                initialTouchWorldMid = { x: (midX - panX) / zoom, y: (midY - panY) / zoom };
                e.preventDefault();
            } else if (e.touches.length === 1) {
                const touch = e.touches[0];
                handleStart(touch.clientX, touch.clientY, true);
                if (activeTable || isDraggingGuest) e.preventDefault();
            }
        }, { passive: false });

        canvas.addEventListener('touchmove', (e) => {
            if (e.touches.length === 2 && isZooming) {
                const t1 = e.touches[0], t2 = e.touches[1];
                const dist = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
                const factor = dist / initialTouchDist;
                let newZoom = initialZoom * factor;
                newZoom = Math.max(0.4, Math.min(3.0, newZoom));
                const rect = canvas.getBoundingClientRect();
                const midX = ((t1.clientX + t2.clientX) / 2) - rect.left;
                const midY = ((t1.clientY + t2.clientY) / 2) - rect.top;
                panX = midX - initialTouchWorldMid.x * newZoom;
                panY = midY - initialTouchWorldMid.y * newZoom;
                zoom = newZoom;
                drawCanvas();
                e.preventDefault();
            } else if (e.touches.length === 1) {
                const touch = e.touches[0];
                const rect = canvas.getBoundingClientRect();
                const screenX = touch.clientX - rect.left;
                const screenY = touch.clientY - rect.top;
                if (isPanning) {
                    panX = panStartX + (screenX - mouseStartX);
                    panY = panStartY + (screenY - mouseStartY);
                    drawCanvas();
                } else {
                    handleMove(touch.clientX, touch.clientY);
                }
                if (activeTable || isDraggingGuest || isPanning) e.preventDefault();
            }
        }, { passive: false });

        canvas.addEventListener('touchend', (e) => {
            if (e.touches.length < 2) isZooming = false;
            if (isPanning) { isPanning = false; saveState(); }
            else { handleEnd(); }
        });

        canvasEventsInitialized = true;
    }
    drawCanvas();
}

function toggleNamesMode(checked) {
    showFullNames = checked;
    saveState();
    drawCanvas();
    showToast(showFullNames ? "Включен режим полных имен" : "Включен режим инициалов");
}

function drawSeatName(ctx, name, x, y) {
    const words = name.trim().split(/\s+/);
    ctx.font = 'bold 7px Inter';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    if (words.length === 1) {
        ctx.fillText(words[0], x, y);
    } else if (words.length >= 2) {
        const line1 = words[0];
        const line2 = words.slice(1).join(' ');
        if (line2.length > 10) ctx.font = 'bold 6.5px Inter';
        ctx.fillText(line1, x, y - 4.5);
        ctx.fillText(line2, x, y + 4.5);
    }
}

function showCanvasTooltip(name, tableName, seatNum, worldX, worldY) {
    activeTooltip = { text: name, x: worldX, y: worldY };
    drawCanvas();
    if (window.tooltipTimer) clearTimeout(window.tooltipTimer);
    window.tooltipTimer = setTimeout(() => { activeTooltip = null; drawCanvas(); }, 4000);
}

function handleStart(clientX, clientY, isTouch) {
    const rect = canvas.getBoundingClientRect();
    const screenX = clientX - rect.left;
    const screenY = clientY - rect.top;
    const worldX = (screenX - panX) / zoom;
    const worldY = (screenY - panY) / zoom;

    const tableRadius = showFullNames ? 65 : 46;
    const chairOffset = showFullNames ? 28 : 18;
    const seatHitRadius = showFullNames ? 24 : 14;

    let clickedSeat = null;
    for (let t of state.tables) {
        for (let i = 0; i < t.capacity; i++) {
            const angle = (i * 2 * Math.PI) / t.capacity - Math.PI / 2;
            const seatX = t.x + (tableRadius + chairOffset) * Math.cos(angle);
            const seatY = t.y + (tableRadius + chairOffset) * Math.sin(angle);
            const dist = Math.sqrt((worldX - seatX)**2 + (worldY - seatY)**2);
            if (dist <= seatHitRadius) {
                clickedSeat = { table: t, seatIndex: i, x: seatX, y: seatY };
                break;
            }
        }
        if (clickedSeat) break;
    }

    if (clickedSeat) {
        const guest = state.guests.find(g => g.tableId === clickedSeat.table.id && g.seatIndex === clickedSeat.seatIndex);
        if (guest) {
            showCanvasTooltip(guest.name, clickedSeat.table.name, clickedSeat.seatIndex + 1, clickedSeat.x, clickedSeat.y);
            dragStartPos = { x: worldX, y: worldY };
            pendingGuestDrag = { guest, table: clickedSeat.table, seatIndex: clickedSeat.seatIndex };
            const dragDelay = isTouch ? 400 : 150;
            longPressTimer = setTimeout(() => {
                isDraggingGuest = true;
                draggedGuest = pendingGuestDrag.guest;
                draggedGuestSource = { tableId: pendingGuestDrag.table.id, seatIndex: pendingGuestDrag.seatIndex };
                draggedGuestCurrentPos = { x: worldX, y: worldY };
                pendingGuestDrag = null;
                if (isTouch && navigator.vibrate) navigator.vibrate(60);
                showToast(`Перетаскивание: ${draggedGuest.name}`);
                drawCanvas();
            }, dragDelay);
        } else {
            showCanvasTooltip("Свободное место", clickedSeat.table.name, clickedSeat.seatIndex + 1, clickedSeat.x, clickedSeat.y);
        }
        return;
    }

    if (activeTooltip) { activeTooltip = null; drawCanvas(); }

    const table = findTableAt(worldX, worldY);
    if (table) {
        activeTable = table;
        isDraggingTable = true;
        dragStart.x = worldX - table.x;
        dragStart.y = worldY - table.y;
        dragHasMoved = false;
        return;
    }

    isPanning = true;
    panStartX = panX; panStartY = panY;
    mouseStartX = screenX; mouseStartY = screenY;
}

function handleMove(clientX, clientY) {
    const rect = canvas.getBoundingClientRect();
    const screenX = clientX - rect.left;
    const screenY = clientY - rect.top;
    const worldX = (screenX - panX) / zoom;
    const worldY = (screenY - panY) / zoom;

    if (isDraggingTable && activeTable) {
        activeTable.x = Math.max(65, Math.min(735, worldX - dragStart.x));
        activeTable.y = Math.max(65, Math.min(735, worldY - dragStart.y));
        dragHasMoved = true;
        drawCanvas();
    } else if (isDraggingGuest && draggedGuest) {
        draggedGuestCurrentPos = { x: worldX, y: worldY };
        drawCanvas();
    } else if (pendingGuestDrag) {
        const dist = Math.sqrt((worldX - dragStartPos.x)**2 + (worldY - dragStartPos.y)**2);
        if (dist > 10) { clearTimeout(longPressTimer); pendingGuestDrag = null; }
    }
}

function handleEnd() {
    clearTimeout(longPressTimer);
    pendingGuestDrag = null;

    if (isDraggingTable) {
        isDraggingTable = false;
        activeTable = null;
        saveState();
    }

    if (isDraggingGuest && draggedGuest) {
        const x = draggedGuestCurrentPos.x;
        const y = draggedGuestCurrentPos.y;

        if (x >= 200 && x <= 600 && y >= 710 && y <= 790) {
            state.guests = state.guests.map(g => g.id === draggedGuest.id ? { ...g, tableId: 'none', seatIndex: -1 } : g);
            saveState();
            showToast(`Гость «${draggedGuest.name}» снят с рассадки`);
            selectedGuests.delete(draggedGuest.id);
            updateBulkActionBar();
        } else {
            let targetSeat = null;
            const tableRadius = showFullNames ? 65 : 46;
            const chairOffset = showFullNames ? 28 : 18;
            const seatHitRadius = 22;

            for (let t of state.tables) {
                for (let i = 0; i < t.capacity; i++) {
                    const angle = (i * 2 * Math.PI) / t.capacity - Math.PI / 2;
                    const seatX = t.x + (tableRadius + chairOffset) * Math.cos(angle);
                    const seatY = t.y + (tableRadius + chairOffset) * Math.sin(angle);
                    const dist = Math.sqrt((x - seatX)**2 + (y - seatY)**2);
                    if (dist <= seatHitRadius) { targetSeat = { table: t, seatIndex: i }; break; }
                }
                if (targetSeat) break;
            }

            if (targetSeat) {
                const occupant = state.guests.find(g => g.tableId === targetSeat.table.id && g.seatIndex === targetSeat.seatIndex);
                if (occupant) {
                    occupant.tableId = draggedGuestSource.tableId;
                    occupant.seatIndex = draggedGuestSource.seatIndex;
                    draggedGuest.tableId = targetSeat.table.id;
                    draggedGuest.seatIndex = targetSeat.seatIndex;
                    showToast("Гости поменялись местами!");
                } else {
                    draggedGuest.tableId = targetSeat.table.id;
                    draggedGuest.seatIndex = targetSeat.seatIndex;
                    showToast(`Гость пересажен за ${getTableName(targetSeat.table)}`);
                }
                saveState();
            }
        }

        isDraggingGuest = false;
        draggedGuest = null;
        draggedGuestSource = null;
        renderAll();
    }
}

function findTableAt(x, y) {
    const radius = showFullNames ? 67 : 48;
    for (let i = state.tables.length - 1; i >= 0; i--) {
        const t = state.tables[i];
        const dx = x - t.x, dy = y - t.y;
        if (Math.sqrt(dx * dx + dy * dy) <= radius) return t;
    }
    return null;
}

function drawCanvasTooltip() {
    if (!activeTooltip) return;
    ctx.save();
    ctx.shadowColor = 'rgba(15, 23, 42, 0.25)'; ctx.shadowBlur = 10; ctx.shadowOffsetY = 4;
    ctx.font = 'bold 10px Inter';
    const text = activeTooltip.text;
    const textWidth = ctx.measureText(text).width;
    const padX = 12, padY = 7, w = textWidth + padX * 2, h = 24;
    const tx = activeTooltip.x, ty = activeTooltip.y - 25;
    ctx.fillStyle = '#0f172a'; ctx.strokeStyle = '#f59e0b'; ctx.lineWidth = 1;
    drawRoundedRect(tx - w/2, ty - h/2, w, h, 8, true, true);
    ctx.beginPath(); ctx.moveTo(tx - 6, ty + h/2); ctx.lineTo(tx + 6, ty + h/2); ctx.lineTo(tx, ty + h/2 + 6); ctx.closePath();
    ctx.fillStyle = '#0f172a'; ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(tx - 5, ty + h/2); ctx.lineTo(tx + 5, ty + h/2);
    ctx.strokeStyle = '#0f172a'; ctx.lineWidth = 1.5; ctx.stroke();
    ctx.shadowColor = 'transparent';
    ctx.fillStyle = '#fef3c7'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(text, tx, ty);
    ctx.restore();
}

function drawCanvas() {
    if (!canvas || !ctx) return;
    ctx.fillStyle = '#fafaf9';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    ctx.translate(panX, panY);
    ctx.scale(zoom, zoom);

    // Сетка
    ctx.strokeStyle = 'rgba(120, 113, 108, 0.06)'; ctx.lineWidth = 1;
    const gridSpacing = 20;
    ctx.beginPath();
    for (let x = -1000; x < 2000; x += gridSpacing) { ctx.moveTo(x, -1000); ctx.lineTo(x, 2000); }
    for (let y = -1000; y < 2000; y += gridSpacing) { ctx.moveTo(-1000, y); ctx.lineTo(2000, y); }
    ctx.stroke();

    // Президиум
    ctx.fillStyle = '#fef3c7'; ctx.strokeStyle = '#f59e0b'; ctx.lineWidth = 1.5;
    drawRoundedRect(400 - 120, 20, 240, 40, 10, true, true);
    ctx.fillStyle = '#78350f'; ctx.font = 'bold 11px Inter'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('⭐ ПРЕЗИДИУМ (СЦЕНА)', 400, 40);

    // Столы и стулья
    state.tables.forEach(table => {
        const tableGuests = state.guests.filter(g => g.tableId === table.id);
        const occupiedCount = tableGuests.length;
        const tableRadius = showFullNames ? 65 : 46;
        const chairOffset = showFullNames ? 28 : 18;

        for (let i = 0; i < table.capacity; i++) {
            const angle = (i * 2 * Math.PI) / table.capacity - Math.PI / 2;
            const seatX = table.x + (tableRadius + chairOffset) * Math.cos(angle);
            const seatY = table.y + (tableRadius + chairOffset) * Math.sin(angle);
            const guestOnSeat = tableGuests.find(g => g.seatIndex === i);

            if (guestOnSeat) {
                if (showFullNames) {
                    const seatW = 62, seatH = 22;
                    ctx.fillStyle = '#064e3b'; ctx.strokeStyle = '#fbbf24'; ctx.lineWidth = 1.5;
                    ctx.save();
                    drawRoundedRect(seatX - seatW/2, seatY - seatH/2, seatW, seatH, 6, true, true);
                    ctx.restore();
                    drawSeatName(ctx, guestOnSeat.name, seatX, seatY);
                } else {
                    ctx.beginPath(); ctx.arc(seatX, seatY, 9, 0, 2 * Math.PI);
                    ctx.fillStyle = '#064e3b'; ctx.strokeStyle = '#fbbf24'; ctx.lineWidth = 1.5;
                    ctx.fill(); ctx.stroke();
                    const initials = getInitials(guestOnSeat.name);
                    ctx.fillStyle = '#ffffff'; ctx.font = 'bold 7px Inter';
                    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
                    ctx.fillText(initials, seatX, seatY);
                }
            } else {
                if (showFullNames) {
                    const seatW = 62, seatH = 22;
                    ctx.fillStyle = '#fafaf9'; ctx.strokeStyle = '#d6d3d1'; ctx.lineWidth = 1;
                    ctx.setLineDash([2, 2]);
                    drawRoundedRect(seatX - seatW/2, seatY - seatH/2, seatW, seatH, 6, true, true);
                    ctx.setLineDash([]);
                } else {
                    ctx.beginPath(); ctx.arc(seatX, seatY, 9, 0, 2 * Math.PI);
                    ctx.fillStyle = '#fafaf9'; ctx.strokeStyle = '#d6d3d1'; ctx.lineWidth = 1;
                    ctx.setLineDash([2, 2]); ctx.fill(); ctx.stroke(); ctx.setLineDash([]);
                }
            }
        }

        // Тело стола
        ctx.beginPath(); ctx.arc(table.x, table.y, tableRadius, 0, 2 * Math.PI);
        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = 'rgba(0, 0, 0, 0.05)'; ctx.shadowBlur = 8; ctx.shadowOffsetX = 0; ctx.shadowOffsetY = 4;
        ctx.fill(); ctx.shadowColor = 'transparent';
        ctx.lineWidth = 2.5;
        if (occupiedCount >= table.capacity) ctx.strokeStyle = '#dc2626';
        else if (occupiedCount > 0) ctx.strokeStyle = '#047857';
        else ctx.strokeStyle = '#cbd5e1';
        ctx.stroke();

        ctx.fillStyle = '#1c1917'; ctx.font = showFullNames ? 'bold 11px Inter' : 'bold 10px Inter';
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(getTableName(table), table.x, table.y - 12);

        const cat = state.categories.find(c => c.id === table.categoryId);
        ctx.fillStyle = '#78716c'; ctx.font = '500 7px Inter';
        const catText = cat ? cat.name : 'Без категории';
        const truncatedCat = catText.length > 13 ? catText.substring(0, 11) + '..' : catText;
        ctx.fillText(truncatedCat, table.x, table.y + 3);

        ctx.fillStyle = occupiedCount >= table.capacity ? '#dc2626' : '#047857';
        ctx.font = 'bold 8.5px Inter';
        ctx.fillText(`${occupiedCount}/${table.capacity} мест`, table.x, table.y + 16);
    });

    // Зона сброса
    if (isDraggingGuest) {
        ctx.fillStyle = 'rgba(239, 68, 68, 0.08)'; ctx.strokeStyle = 'rgba(239, 68, 68, 0.4)';
        ctx.lineWidth = 2; ctx.setLineDash([6, 4]);
        drawRoundedRect(200, 720, 400, 60, 12, true, true);
        ctx.setLineDash([]);
        ctx.fillStyle = '#b91c1c'; ctx.font = 'bold 11px Inter';
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText('🗑️ Перетащите сюда для высадки гостя', 400, 750);

        if (draggedGuest) {
            ctx.shadowColor = 'rgba(0, 0, 0, 0.25)'; ctx.shadowBlur = 12; ctx.shadowOffsetX = 0; ctx.shadowOffsetY = 6;
            ctx.beginPath(); ctx.arc(draggedGuestCurrentPos.x, draggedGuestCurrentPos.y, 22, 0, 2 * Math.PI);
            ctx.fillStyle = '#064e3b'; ctx.strokeStyle = '#fbbf24'; ctx.lineWidth = 2.5;
            ctx.fill(); ctx.stroke();
            ctx.shadowColor = 'transparent';
            ctx.fillStyle = '#ffffff'; ctx.font = 'bold 11px Inter';
            ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
            ctx.fillText(getInitials(draggedGuest.name), draggedGuestCurrentPos.x, draggedGuestCurrentPos.y);
            ctx.fillStyle = '#1c1917'; ctx.font = 'bold 9px Inter';
            ctx.fillText(draggedGuest.name, draggedGuestCurrentPos.x, draggedGuestCurrentPos.y - 30);
        }
    }

    drawCanvasTooltip();
    ctx.restore();
}

function getCanvasPrintImage() {
    if (!canvas) {
        initCanvas();
    }
    if (!canvas || !ctx) return null;

    // Вычисляем границы всех столов
    let minX = 150, maxX = 650, minY = 10, maxY = 500;
    if (state.tables && state.tables.length > 0) {
        minX = Math.min(...state.tables.map(t => t.x - 90), 200);
        maxX = Math.max(...state.tables.map(t => t.x + 90), 600);
        minY = Math.min(...state.tables.map(t => t.y - 90), 10);
        maxY = Math.max(...state.tables.map(t => t.y + 90), 450);
    }

    const contentWidth = Math.max(450, maxX - minX + 80);
    const contentHeight = Math.max(320, maxY - minY + 80);

    // Создаем отдельный Canvas повышенной четкости для печати А4 (1600px)
    const offCanvas = document.createElement('canvas');
    offCanvas.width = 1600;
    offCanvas.height = Math.round(1600 * (contentHeight / contentWidth));
    const offCtx = offCanvas.getContext('2d');
    if (!offCtx) return null;

    // Фоновая заливка
    offCtx.fillStyle = '#fafaf9';
    offCtx.fillRect(0, 0, offCanvas.width, offCanvas.height);

    const scale = (offCanvas.width - 80) / contentWidth;
    offCtx.save();
    offCtx.translate(40 - minX * scale, 40 - minY * scale);
    offCtx.scale(scale, scale);

    // Легкая координатная сетка
    offCtx.strokeStyle = 'rgba(120, 113, 108, 0.08)';
    offCtx.lineWidth = 1 / scale;
    for (let x = minX - 100; x < maxX + 100; x += 30) {
        offCtx.beginPath(); offCtx.moveTo(x, minY - 100); offCtx.lineTo(x, maxY + 100); offCtx.stroke();
    }
    for (let y = minY - 100; y < maxY + 100; y += 30) {
        offCtx.beginPath(); offCtx.moveTo(minX - 100, y); offCtx.lineTo(maxX + 100, y); offCtx.stroke();
    }

    // Президиум (Сцена)
    offCtx.fillStyle = '#fef3c7'; offCtx.strokeStyle = '#f59e0b'; offCtx.lineWidth = 2.5;
    drawRoundedRectCtx(offCtx, 400 - 130, 20, 260, 44, 12, true, true);
    offCtx.fillStyle = '#78350f'; offCtx.font = 'bold 13px Inter, sans-serif'; offCtx.textAlign = 'center'; offCtx.textBaseline = 'middle';
    offCtx.fillText('⭐ ПРЕЗИДИУМ (СЦЕНА)', 400, 42);

    // Отрисовка всех столов и стульев
    state.tables.forEach(table => {
        const tableGuests = state.guests.filter(g => g.tableId === table.id);
        const occupiedCount = tableGuests.length;
        const tableRadius = 48;
        const chairOffset = 22;

        for (let i = 0; i < table.capacity; i++) {
            const angle = (i * 2 * Math.PI) / table.capacity - Math.PI / 2;
            const seatX = table.x + (tableRadius + chairOffset) * Math.cos(angle);
            const seatY = table.y + (tableRadius + chairOffset) * Math.sin(angle);
            const guestOnSeat = tableGuests.find(g => g.seatIndex === i);

            offCtx.beginPath();
            offCtx.arc(seatX, seatY, 11, 0, 2 * Math.PI);
            if (guestOnSeat) {
                offCtx.fillStyle = '#064e3b';
                offCtx.strokeStyle = '#fbbf24';
                offCtx.lineWidth = 2;
                offCtx.fill();
                offCtx.stroke();
                const initials = getInitials(guestOnSeat.name);
                offCtx.fillStyle = '#ffffff';
                offCtx.font = 'bold 8.5px Inter, sans-serif';
                offCtx.textAlign = 'center';
                offCtx.textBaseline = 'middle';
                offCtx.fillText(initials, seatX, seatY);
            } else {
                offCtx.fillStyle = '#ffffff';
                offCtx.strokeStyle = '#cbd5e1';
                offCtx.lineWidth = 1.5;
                offCtx.fill();
                offCtx.stroke();
                offCtx.fillStyle = '#94a3b8';
                offCtx.font = 'bold 8px Inter, sans-serif';
                offCtx.textAlign = 'center';
                offCtx.textBaseline = 'middle';
                offCtx.fillText(String(i + 1), seatX, seatY);
            }
        }

        // Стол
        offCtx.beginPath();
        offCtx.arc(table.x, table.y, tableRadius, 0, 2 * Math.PI);
        const cat = state.categories.find(c => c.id === table.categoryId);
        offCtx.fillStyle = cat ? (cat.color ? cat.color + '22' : '#ecfdf5') : '#f8fafc';
        offCtx.strokeStyle = (occupiedCount >= table.capacity) ? '#dc2626' : (cat ? (cat.color || '#059669') : '#059669');
        offCtx.lineWidth = (occupiedCount >= table.capacity) ? 3 : 2;
        offCtx.fill();
        offCtx.stroke();

        // Надписи стола
        offCtx.fillStyle = '#0f172a';
        offCtx.font = 'bold 12.5px Inter, sans-serif';
        offCtx.textAlign = 'center';
        offCtx.textBaseline = 'middle';
        offCtx.fillText(`Стол ${table.number}`, table.x, table.y - (table.name ? 10 : 6));

        if (table.name) {
            offCtx.fillStyle = '#475569';
            offCtx.font = '9.5px Inter, sans-serif';
            offCtx.fillText(table.name, table.x, table.y + 4);
        }

        offCtx.fillStyle = (occupiedCount >= table.capacity) ? '#dc2626' : '#047857';
        offCtx.font = 'bold 10.5px Inter, sans-serif';
        offCtx.fillText(`${occupiedCount} / ${table.capacity}`, table.x, table.y + (table.name ? 18 : 10));
    });

    offCtx.restore();
    return offCanvas.toDataURL('image/png');
}

function drawRoundedRectCtx(c, x, y, width, height, radius, fill, stroke) {
    c.beginPath();
    c.moveTo(x + radius, y);
    c.lineTo(x + width - radius, y);
    c.quadraticCurveTo(x + width, y, x + width, y + radius);
    c.lineTo(x + width, y + height - radius);
    c.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    c.lineTo(x + radius, y + height);
    c.quadraticCurveTo(x, y + height, x, y + height - radius);
    c.lineTo(x, y + radius);
    c.quadraticCurveTo(x, y, x + radius, y);
    c.closePath();
    if (fill) c.fill();
    if (stroke) c.stroke();
}

// ===== УМНАЯ И СТРУКТУРИРОВАННАЯ РАССТАНОВКА СТОЛОВ ОТ СЦЕНЫ =====
function autoArrangeTables(mode = 'smart') {
    if (!state.tables || state.tables.length === 0) {
        showToast('В зале пока нет столов для расстановки');
        return;
    }

    // Сортируем столы по их номеру, чтобы сохранять логический порядок от сцены
    const sorted = [...state.tables].sort((a, b) => (a.number || 0) - (b.number || 0));
    const count = sorted.length;

    let numRows = 2;
    if (mode === 'rows-2') {
        numRows = 2;
    } else if (mode === 'rows-3') {
        numRows = 3;
    } else {
        // Умный адаптивный расчет рядов:
        if (count <= 4) {
            numRows = 2;
        } else if (count <= 9) {
            numRows = (count >= 7) ? 3 : 2;
        } else if (count <= 15) {
            numRows = 3;
        } else {
            numRows = 4;
        }
    }

    // Президиум (сцена) находится в (X: 400, Y: 40), ширина 240px
    // Центральный проход (walkway): коридор по центру X = 400 шириной ~160px
    const startY = (numRows >= 4) ? 160 : 180;
    const rowGap = (numRows === 2) ? 230 : ((numRows === 3) ? 175 : 140);

    const tablesPerRow = Math.ceil(count / numRows);
    let tableIndex = 0;

    for (let r = 0; r < numRows; r++) {
        const remaining = count - tableIndex;
        if (remaining <= 0) break;

        const inThisRow = Math.min(tablesPerRow, remaining);
        const y = startY + r * rowGap;

        // Симметрично делим столы в ряду на Левое и Правое крыло
        // оставляя центральный проход к сцене открытым
        const leftCount = Math.ceil(inThisRow / 2);
        const rightCount = inThisRow - leftCount;

        // Левое крыло (X < 400, от 140 до 310)
        for (let i = 0; i < leftCount; i++) {
            const t = sorted[tableIndex++];
            let x;
            if (leftCount === 1) {
                x = 230;
            } else {
                const step = (310 - 140) / (leftCount - 1);
                x = Math.round(140 + i * step);
            }
            const targetTable = state.tables.find(tbl => tbl.id === t.id);
            if (targetTable) {
                targetTable.x = x;
                targetTable.y = y;
            }
        }

        // Правое крыло (X > 400, от 490 до 660)
        for (let j = 0; j < rightCount; j++) {
            const t = sorted[tableIndex++];
            let x;
            if (rightCount === 1) {
                x = 570;
            } else {
                const step = (660 - 490) / (rightCount - 1);
                x = Math.round(490 + j * step);
            }
            const targetTable = state.tables.find(tbl => tbl.id === t.id);
            if (targetTable) {
                targetTable.x = x;
                targetTable.y = y;
            }
        }
    }

    saveState();
    centerCanvasViewport();
    drawCanvas();

    if (mode === 'rows-2') {
        showToast('📐 Столы расставлены в 2 ряда от сцены');
    } else if (mode === 'rows-3') {
        showToast('📐 Столы расставлены в 3 ряда от сцены');
    } else {
        showToast('✨ Выполнена умная расстановка зала с центральным проходом');
    }
}
