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
