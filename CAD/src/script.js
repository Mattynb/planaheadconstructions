// CAD/src/script.js

// Get the canvas element and its 2D rendering context
const canvas = document.getElementById('cadCanvas');
const ctx = canvas.getContext('2d');

// Get control buttons
const drawModeBtn = document.getElementById('drawModeBtn');
const selectModeBtn = document.getElementById('selectModeBtn');
const addComponentBtn = document.getElementById('addComponentBtn');
const clearCanvasBtn = document.getElementById('clearCanvasBtn');

// Get editing panel elements
const editPanel = document.getElementById('editPanel');
const wallLengthGroup = document.getElementById('wallLengthGroup');
const componentDimensionsGroup = document.getElementById('componentDimensionsGroup');
const wallLengthInput = document.getElementById('wallLengthInput');
const componentTitleInput = document.getElementById('componentTitleInput');
const componentWidthInput = document.getElementById('componentWidthInput');
const componentHeightInput = document.getElementById('componentHeightInput');
const setDimensionsBtn = document.getElementById('setDimensionsBtn');
const deleteElementBtn = document.getElementById('deleteElementBtn');
const moveElementBtn = document.getElementById('moveElementBtn');
const rotateElementBtn = document.getElementById('rotateElementBtn'); // New rotate button

// Get confirmation modal elements
const confirmModal = document.getElementById('confirmModal');
const confirmYesBtn = document.getElementById('confirmYesBtn');
const confirmNoBtn = document.getElementById('confirmNoBtn');

// Get status message element
const statusMessageDiv = document.getElementById('statusMessage');

// Variables to manage drawing state
let isDrawing = false;
let currentMode = 'drawWalls'; // 'drawWalls', 'select', 'addComponent', 'moveElement'
let startPoint = null;
let currentEndPoint = null;
let selectedElement = null; // Stores the currently selected wall or component object
let snapDirection = null;

// Variables for pan and zoom
let scale = 1.0;
let offsetX = 0;
let offsetY = 0;
let isPanning = false;
let lastPanX = 0;
let lastPanY = 0;

// Variables for moving elements
let isMoving = false;
let moveStartWorldX = 0;
let moveStartWorldY = 0;
let elementOriginalX = 0; // For components
let elementOriginalY = 0; // For components
let wallOriginalStartX = 0; // For walls
let wallOriginalStartY = 0; // For walls
let wallOriginalEndX = 0;   // For walls
let wallOriginalEndY = 0;   // For walls


// Arrays to store all drawn elements
const walls = [];
const components = [];

// Drawing properties
const wallColor = '#3b82f6';
const componentColor = '#8b5cf6';
const selectedColor = '#ef4444';
const wallWidth = 5;
const textColor = '#1a202c';

// Scale: 5 pixels = 1 inch
const pixelsPerInch = 5;
const gridColor = '#e2e8f0';

// Default component size in inches
const defaultComponentWidth = 24;
const defaultComponentHeight = 24;

/**
 * Updates the status message displayed to the user.
 * @param {string} message - The message to display.
 * @param {string} type - 'info' for normal messages, 'error' for error messages.
 */
function updateStatusMessage(message, type = 'info') {
    statusMessageDiv.textContent = message;
    statusMessageDiv.className = `text-sm mt-2 ${type === 'error' ? 'status-error' : 'text-gray-600'}`;
}

/**
 * Sets the active button and updates the currentMode.
 * @param {string} mode - The mode to set ('drawWalls', 'select', 'addComponent', 'moveElement').
 */
function setActiveMode(mode) {
    currentMode = mode;
    // Remove active class from all main control buttons
    [drawModeBtn, selectModeBtn, addComponentBtn, clearCanvasBtn].forEach(btn => {
        btn.classList.remove('btn-active');
    });
    // Also remove active class from move and rotate buttons in panel
    moveElementBtn.classList.remove('btn-active');
    rotateElementBtn.classList.remove('btn-active');


    // Set canvas cursor based on mode
    canvas.classList.remove('select-mode-cursor', 'panning-cursor', 'move-element-cursor', 'active-drag');
    if (mode === 'drawWalls') {
        drawModeBtn.classList.add('btn-active');
        canvas.style.cursor = 'crosshair';
    } else if (mode === 'select') {
        selectModeBtn.classList.add('btn-active');
        canvas.classList.add('select-mode-cursor');
    } else if (mode === 'addComponent') {
        addComponentBtn.classList.add('btn-active');
        canvas.style.cursor = 'pointer';
    } else if (mode === 'moveElement') {
        // The move button itself will get the active class when clicked
        canvas.classList.add('move-element-cursor');
    }


    // Reset drawing/selection/moving state
    isDrawing = false;
    startPoint = null;
    currentEndPoint = null;
    snapDirection = null;
    // selectedElement is NOT set to null here, it's managed by event handlers
    isPanning = false;
    isMoving = false; // Reset moving state
    hideEditPanel();
    hideConfirmModal(); // Ensure modal is hidden on mode change
    drawAll(); // Redraw to reflect changes
}

/**
 * Adjusts the canvas size to fill its container and maintains aspect ratio if needed.
 * Redraws all elements after resizing.
 */
function resizeCanvas() {
    const container = canvas.parentElement;
    const containerWidth = container.clientWidth - parseInt(getComputedStyle(container).paddingLeft) - parseInt(getComputedStyle(container).paddingRight);
    canvas.width = containerWidth;
    canvas.height = Math.min(containerWidth * 0.6, window.innerHeight * 0.7);
    drawAll();
}

/**
 * Clears the entire canvas.
 */
function clearCanvas() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
}

/**
 * Clears all elements (walls and components) from the canvas.
 */
function clearAllElements() {
    walls.length = 0;
    components.length = 0;
    selectedElement = null;
    hideEditPanel();
    scale = 1.0; offsetX = 0; offsetY = 0; // Reset pan and zoom
    setActiveMode('drawWalls'); // Default to draw mode after clearing
    updateStatusMessage('Canvas cleared. Ready to draw walls.', 'info');
    drawAll();
}

/**
 * Draws the grid on the canvas.
 */
function drawGrid() {
    ctx.strokeStyle = gridColor;
    ctx.lineWidth = 1 / scale;

    const worldVisibleLeft = -offsetX / scale;
    const worldVisibleTop = -offsetY / scale;
    const worldVisibleRight = worldVisibleLeft + canvas.width / scale;
    const worldVisibleBottom = worldVisibleTop + canvas.height / scale;

    let startX = Math.floor(worldVisibleLeft / pixelsPerInch) * pixelsPerInch;
    let startY = Math.floor(worldVisibleTop / pixelsPerInch) * pixelsPerInch;

    for (let x = startX; x <= worldVisibleRight; x += pixelsPerInch) {
        ctx.beginPath();
        ctx.moveTo(x, worldVisibleTop);
        ctx.lineTo(x, worldVisibleBottom);
        ctx.stroke();
    }

    for (let y = startY; y <= worldVisibleBottom; y += pixelsPerInch) {
        ctx.beginPath();
        ctx.moveTo(worldVisibleLeft, y);
        ctx.lineTo(worldVisibleRight, y);
        ctx.stroke();
    }
}

/**
 * Draws a single wall segment and its length.
 * @param {object} wall - An object containing start and end points ({x, y}).
 */
function drawWall(wall) {
    ctx.beginPath();
    ctx.moveTo(wall.start.x, wall.start.y);
    ctx.lineTo(wall.end.x, wall.end.y);

    if (wall === selectedElement) {
        ctx.strokeStyle = selectedColor;
        ctx.lineWidth = (wallWidth + 2) / scale;
    } else {
        ctx.strokeStyle = wallColor;
        ctx.lineWidth = wallWidth / scale;
    }
    ctx.lineCap = 'round';
    ctx.stroke();

    const dx = wall.end.x - wall.start.x;
    const dy = wall.end.y - wall.start.y;
    const lengthPixels = Math.sqrt(dx * dx + dy * dy);
    const lengthInches = lengthPixels / pixelsPerInch;

    if (lengthInches > 0.5 && (isDrawing || wall === selectedElement)) {
        const midX = (wall.start.x + wall.end.x) / 2;
        const midY = (wall.start.y + wall.end.y) / 2;

        ctx.fillStyle = textColor;
        ctx.font = `${12 / scale}px Inter, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        const angle = Math.atan2(dy, dx);

        ctx.save();
        ctx.translate(midX, midY);
        ctx.rotate(angle);
        ctx.fillText(`${lengthInches.toFixed(1)} in`, 0, -(wallWidth / scale) - (5 / scale));
        ctx.restore();
    }
}

/**
 * Draws a single component (rectangle with text).
 * @param {object} component - An object containing type, x, y, width, height, text.
 */
function drawComponent(component) {
    // Component dimensions are now stored in pixels, consistent with wall coordinates
    const x = component.x;
    const y = component.y;
    const widthPixels = component.width;
    const heightPixels = component.height;

    if (component === selectedElement) {
        ctx.strokeStyle = selectedColor;
        ctx.lineWidth = 2 / scale;
    } else {
        ctx.strokeStyle = componentColor;
        ctx.lineWidth = 1 / scale;
    }
    ctx.fillStyle = componentColor + '33';
    ctx.fillRect(x, y, widthPixels, heightPixels);
    ctx.strokeRect(x, y, widthPixels, heightPixels);

    // Draw text label (title)
    ctx.fillStyle = textColor;
    ctx.font = `${14 / scale}px Inter, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(component.text, x + widthPixels / 2, y + heightPixels / 2);

    // Draw dimensions in inches below the title
    const widthInches = (widthPixels / pixelsPerInch).toFixed(1);
    const heightInches = (heightPixels / pixelsPerInch).toFixed(1);
    ctx.font = `${10 / scale}px Inter, sans-serif`; // Smaller font for dimensions
    ctx.fillText(`${widthInches}x${heightInches} in`, x + widthPixels / 2, y + heightPixels / 2 + (15 / scale));
}

/**
 * Draws all stored elements (walls and components).
 */
function drawAll() {
    clearCanvas();

    ctx.save();
    ctx.translate(offsetX, offsetY);
    ctx.scale(scale, scale);

    drawGrid();

    walls.forEach(wall => drawWall(wall));
    components.forEach(component => drawComponent(component));

    if (isDrawing && startPoint && currentEndPoint) {
        drawWall({ start: startPoint, end: currentEndPoint });
    }

    ctx.restore();
}

/**
 * Gets the mouse/touch coordinates relative to the canvas, converted to world coordinates.
 * @param {Event} event - The mouse or touch event.
 * @returns {object} An object with x and y coordinates in world space.
 */
function getCanvasCoordinates(event) {
    const rect = canvas.getBoundingClientRect();
    let clientX, clientY;

    if (event.touches && event.touches.length > 0) {
        clientX = event.touches[0].clientX;
        clientY = event.touches[0].clientY;
    } else {
        clientX = event.clientX;
        clientY = event.clientY;
    }

    const screenX = clientX - rect.left;
    const screenY = clientY - rect.top;

    const worldX = (screenX - offsetX) / scale;
    const worldY = (screenY - offsetY) / scale;

    return { x: worldX, y: worldY };
}

/**
 * Gets the mouse/touch coordinates relative to the canvas (screen pixels).
 * @param {Event} event - The mouse or touch event.
 * @returns {object} An object with x and y coordinates in screen space.
 */
function getScreenCoordinates(event) {
    const rect = canvas.getBoundingClientRect();
    let clientX, clientY;

    if (event.touches && event.touches.length > 0) {
        clientX = event.touches[0].clientX;
        clientY = event.touches[0].clientY;
    } else {
        clientX = event.clientX;
        clientY = event.clientY;
    }

    return {
        x: clientX - rect.left,
        y: clientY - rect.top
    };
}

/**
 * Helper function to check if a point is near a line segment.
 * @param {number} px, py - Point coordinates.
 * @param {number} x1, y1, x2, y2 - Line segment coordinates.
 * @param {number} tolerance - Max distance.
 * @returns {boolean} True if point is near line segment.
 */
function isPointNearLine(px, py, x1, y1, x2, y2, tolerance) {
    const L2 = (x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1);
    if (L2 === 0) {
        return Math.sqrt((px - x1) * (px - x1) + (py - y1) * (py - y1)) < tolerance;
    }
    const t = ((px - x1) * (x2 - x1) + (py - y1) * (y2 - y1)) / L2;
    let closestX, closestY;
    if (t < 0) { closestX = x1; closestY = y1; }
    else if (t > 1) { closestX = x2; closestY = y2; }
    else { closestX = x1 + t * (x2 - x1); closestY = y1 + t * (y2 - y1); }
    const distance = Math.sqrt((px - closestX) * (px - closestX) + (py - closestY) * (py - closestY));
    return distance < tolerance;
}

/**
 * Helper function to check if a point is inside a rectangle.
 * @param {number} px, py - Point coordinates.
 * @param {object} rect - Rectangle object {x, y, width, height}.
 * @returns {boolean} True if point is inside rectangle.
 */
function isPointInsideRectangle(px, py, rect) {
    return px >= rect.x && px <= (rect.x + rect.width) &&
           py >= rect.y && py <= (rect.y + rect.height);
}

/**
 * Event handler for mouse/touch down.
 * Handles drawing, placing components, selection, and panning.
 * @param {Event} event - The mouse or touch event.
 */
function handleMouseDown(event) {
    const coords = getCanvasCoordinates(event);
    const screenCoords = getScreenCoordinates(event);

    // If we are in move mode and an element is selected, start moving it
    if (currentMode === 'moveElement' && selectedElement) {
        isMoving = true;
        canvas.classList.add('active-drag'); // Change cursor to grabbing
        moveStartWorldX = coords.x; // Store world coordinates of mouse click
        moveStartWorldY = coords.y;

        if (selectedElement.type === 'component') {
            elementOriginalX = selectedElement.x;
            elementOriginalY = selectedElement.y;
        } else if (selectedElement.type === 'wall') {
            wallOriginalStartX = selectedElement.start.x;
            wallOriginalStartY = selectedElement.start.y;
            wallOriginalEndX = selectedElement.end.x;
            wallOriginalEndY = selectedElement.end.y;
        }
        updateStatusMessage(`Moving ${selectedElement.type === 'wall' ? 'wall' : selectedElement.text}...`, 'info');
        return; // Exit to prevent other mode actions
    }

    // Deselect any element initially for other modes
    selectedElement = null;
    hideEditPanel();

    if (currentMode === 'drawWalls') {
        isDrawing = true;
        // Snap start point to grid
        startPoint = {
            x: Math.round(coords.x / pixelsPerInch) * pixelsPerInch,
            y: Math.round(coords.y / pixelsPerInch) * pixelsPerInch
        };
        currentEndPoint = { ...startPoint };
        snapDirection = null;
        updateStatusMessage('Drawing wall...');
    } else if (currentMode === 'addComponent') {
        const newComponent = {
            type: 'component',
            x: coords.x,
            y: coords.y,
            // Store component dimensions in pixels directly
            width: defaultComponentWidth * pixelsPerInch,
            height: defaultComponentHeight * pixelsPerInch,
            text: 'New Component'
        };
        components.push(newComponent);
        selectedElement = newComponent;
        setActiveMode('select'); // Switch to select mode after placing
        showEditPanel(selectedElement);
        updateStatusMessage(`New Component added. Select it to edit.`, 'info');
    } else if (currentMode === 'select') {
        const wallTolerance = (wallWidth / 2 + 5) / scale;

        for (let i = walls.length - 1; i >= 0; i--) {
            const wall = walls[i];
            if (isPointNearLine(coords.x, coords.y, wall.start.x, wall.start.y, wall.end.x, wall.end.y, wallTolerance)) {
                selectedElement = wall;
                selectedElement.type = 'wall';
                selectedElement.index = i; // For deletion
                break;
            }
        }

        if (!selectedElement) {
            for (let i = components.length - 1; i >= 0; i--) {
                const component = components[i];
                // Use pixel dimensions for collision detection
                const tempComponentRect = { x: component.x, y: component.y, width: component.width, height: component.height };
                if (isPointInsideRectangle(coords.x, coords.y, tempComponentRect)) {
                    selectedElement = component;
                    selectedElement.type = 'component';
                    selectedElement.index = i; // For deletion
                    break;
                }
            }
        }

        if (selectedElement) {
            showEditPanel(selectedElement);
            updateStatusMessage(`${selectedElement.type === 'wall' ? 'Wall' : selectedElement.text} selected. Use panel below to edit.`, 'info');
        } else {
            isPanning = true;
            canvas.classList.add('panning-cursor');
            lastPanX = screenCoords.x;
            lastPanY = screenCoords.y;
            updateStatusMessage('Click and drag to pan, scroll to zoom. Click an element to select it.', 'info');
        }
    }
    drawAll();
}

/**
 * Event handler for mouse/touch move.
 * Handles drawing, moving, or panning.
 * @param {Event} event - The mouse or touch event.
 */
function handleMouseMove(event) {
    const rawCoords = getCanvasCoordinates(event);
    const screenCoords = getScreenCoordinates(event);

    if (isDrawing && currentMode === 'drawWalls') {
        let snappedX = Math.round(rawCoords.x / pixelsPerInch) * pixelsPerInch; // Snap to grid
        let snappedY = Math.round(rawCoords.y / pixelsPerInch) * pixelsPerInch; // Snap to grid

        if (!snapDirection) {
            const dx = Math.abs(snappedX - startPoint.x);
            const dy = Math.abs(snappedY - startPoint.y);
            if (dx > (5 / scale) || dy > (5 / scale)) {
                if (dx > dy) { snapDirection = 'horizontal'; }
                else { snapDirection = 'vertical'; }
            }
        }

        if (snapDirection === 'horizontal') { snappedY = startPoint.y; }
        else if (snapDirection === 'vertical') { snappedX = startPoint.x; }

        currentEndPoint = { x: snappedX, y: snappedY };
        requestAnimationFrame(drawAll);
    } else if (isMoving && currentMode === 'moveElement') {
        const deltaX = rawCoords.x - moveStartWorldX;
        const deltaY = rawCoords.y - moveStartWorldY;

        if (selectedElement.type === 'component') {
            // Calculate new position and snap to grid
            const newX = elementOriginalX + deltaX;
            const newY = elementOriginalY + deltaY;
            selectedElement.x = Math.round(newX / pixelsPerInch) * pixelsPerInch;
            selectedElement.y = Math.round(newY / pixelsPerInch) * pixelsPerInch;
        } else if (selectedElement.type === 'wall') {
            // Calculate new positions for start and end points and snap to grid
            const newStartX = wallOriginalStartX + deltaX;
            const newStartY = wallOriginalStartY + deltaY;
            const newEndX = wallOriginalEndX + deltaX;
            const newEndY = wallOriginalEndY + deltaY;

            selectedElement.start.x = Math.round(newStartX / pixelsPerInch) * pixelsPerInch;
            selectedElement.start.y = Math.round(newStartY / pixelsPerInch) * pixelsPerInch;
            selectedElement.end.x = Math.round(newEndX / pixelsPerInch) * pixelsPerInch;
            selectedElement.end.y = Math.round(newEndY / pixelsPerInch) * pixelsPerInch;
        }
        requestAnimationFrame(drawAll);
    }
    else if (isPanning) {
        const dx = screenCoords.x - lastPanX;
        const dy = screenCoords.y - lastPanY;
        offsetX += dx;
        offsetY += dy;
        lastPanX = screenCoords.x;
        lastPanY = screenCoords.y;
        requestAnimationFrame(drawAll);
    }
}

/**
 * Event handler for mouse/touch up.
 * Finishes drawing, moving, or ends panning.
 * @param {Event} event - The mouse or touch event.
 */
function handleMouseUp(event) {
    if (isDrawing && currentMode === 'drawWalls') {
        isDrawing = false;
        const rawEndPoint = getCanvasCoordinates(event);
        let finalEndPoint = { x: rawEndPoint.x, y: rawEndPoint.y };

        if (snapDirection === 'horizontal') { finalEndPoint.y = startPoint.y; }
        else if (snapDirection === 'vertical') { finalEndPoint.x = startPoint.x; }

        // Ensure final endpoint is also snapped to grid
        finalEndPoint.x = Math.round(finalEndPoint.x / pixelsPerInch) * pixelsPerInch;
        finalEndPoint.y = Math.round(finalEndPoint.y / pixelsPerInch) * pixelsPerInch;


        if (startPoint && (Math.abs(startPoint.x - finalEndPoint.x) > (2 / pixelsPerInch) || Math.abs(startPoint.y - finalEndPoint.y) > (2 / pixelsPerInch))) {
            walls.push({ type: 'wall', start: startPoint, end: finalEndPoint });
            updateStatusMessage('Wall drawn successfully.', 'info');
        } else {
            updateStatusMessage('Wall too short to draw.', 'error');
        }
        startPoint = null;
        currentEndPoint = null;
        snapDirection = null;
        drawAll();
    } else if (isMoving && currentMode === 'moveElement') {
        isMoving = false;
        canvas.classList.remove('active-drag'); // Remove grabbing cursor
        updateStatusMessage(`${selectedElement.type === 'wall' ? 'Wall' : selectedElement.text} moved.`, 'info');
        showEditPanel(selectedElement); // Re-show panel with potentially updated coordinates
    }
    else if (isPanning) {
        isPanning = false;
        canvas.classList.remove('panning-cursor');
        updateStatusMessage('Panning stopped.', 'info');
    }
}

/**
 * Event handler for mouse/touch leave.
 * This function is called when the mouse leaves the canvas.
 * It should stop any ongoing drawing, moving, or panning operations.
 */
function handleMouseLeave() {
    if (isDrawing) {
        isDrawing = false;
        startPoint = null;
        currentEndPoint = null;
        snapDirection = null;
        updateStatusMessage('Drawing cancelled (mouse left canvas).', 'info');
    } else if (isMoving) {
        isMoving = false;
        canvas.classList.remove('active-drag');
        updateStatusMessage('Moving cancelled (mouse left canvas).', 'info');
    } else if (isPanning) {
        isPanning = false;
        canvas.classList.remove('panning-cursor');
        updateStatusMessage('Panning stopped (mouse left canvas).', 'info');
    }
    drawAll(); // Redraw to reflect the cancelled operation or state change
}

/**
 * Handles mouse wheel for zooming.
 * @param {Event} event - The wheel event.
 */
function handleWheel(event) {
    event.preventDefault();

    const zoomFactor = 1.1;
    const rect = canvas.getBoundingClientRect();

    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;

    const worldX = (mouseX - offsetX) / scale;
    const worldY = (mouseY - offsetY) / scale;

    if (event.deltaY < 0) { scale *= zoomFactor; }
    else { scale /= zoomFactor; }

    scale = Math.max(0.1, Math.min(scale, 10.0));

    offsetX = mouseX - worldX * scale;
    offsetY = mouseY - worldY * scale;

    drawAll();
    updateStatusMessage(`Zoom: ${scale.toFixed(1)}x`, 'info');
}

/**
 * Shows the editing panel and populates it based on the selected element type.
 * @param {object} element - The selected wall or component object.
 */
function showEditPanel(element) {
    editPanel.style.display = 'flex';
    if (element.type === 'wall') {
        wallLengthGroup.style.display = 'flex';
        componentDimensionsGroup.style.display = 'none';
        rotateElementBtn.style.display = 'none'; // Hide rotate for walls

        const dx = element.end.x - element.start.x;
        const dy = element.end.y - element.start.y;
        const lengthPixels = Math.sqrt(dx * dx + dy * dy);
        const lengthInches = lengthPixels / pixelsPerInch;
        wallLengthInput.value = lengthInches.toFixed(1);
    } else if (element.type === 'component') {
        wallLengthGroup.style.display = 'none';
        componentDimensionsGroup.style.display = 'flex';
        rotateElementBtn.style.display = 'inline-block'; // Show rotate for components

        // Display component dimensions in inches
        componentTitleInput.value = element.text;
        componentWidthInput.value = (element.width / pixelsPerInch).toFixed(1);
        componentHeightInput.value = (element.height / pixelsPerInch).toFixed(1);
    }
}

/**
 * Hides the editing panel.
 */
function hideEditPanel() {
    editPanel.style.display = 'none';
    wallLengthInput.value = '';
    componentTitleInput.value = '';
    componentWidthInput.value = '';
    componentHeightInput.value = '';
    rotateElementBtn.classList.remove('btn-active'); // Ensure rotate button is not active when panel hides
}

/**
 * Shows the confirmation modal.
 */
function showConfirmModal() {
    confirmModal.style.display = 'flex';
}

/**
 * Hides the confirmation modal.
 */
function hideConfirmModal() {
    confirmModal.style.display = 'none';
}

// --- Event Listeners for Controls ---

// Mouse/Touch Event Listeners for Canvas
canvas.addEventListener('mousedown', handleMouseDown);
canvas.addEventListener('mousemove', handleMouseMove);
canvas.addEventListener('mouseup', handleMouseUp);
canvas.addEventListener('mouseleave', handleMouseLeave);

canvas.addEventListener('touchstart', handleMouseDown);
canvas.addEventListener('touchmove', (e) => {
    e.preventDefault();
    handleMouseMove(e);
}, { passive: false });
canvas.addEventListener('touchend', handleMouseUp);
canvas.addEventListener('touchcancel', handleMouseUp);

canvas.addEventListener('wheel', handleWheel, { passive: false });

// Control Button Event Listeners
drawModeBtn.addEventListener('click', () => {
    selectedElement = null; // Deselect any element
    setActiveMode('drawWalls');
    updateStatusMessage('Draw mode active. Click and drag to draw straight walls.', 'info');
});

selectModeBtn.addEventListener('click', () => {
    selectedElement = null; // Deselect any element
    setActiveMode('select');
    updateStatusMessage('Select mode active. Click an element to select it, or drag to pan.', 'info');
});

addComponentBtn.addEventListener('click', () => {
    selectedElement = null; // Deselect any element
    setActiveMode('addComponent');
    updateStatusMessage('Click on the canvas to place a new component.', 'info');
});

clearCanvasBtn.addEventListener('click', () => {
    showConfirmModal(); // Show confirmation modal instead of clearing directly
});

// Event listeners for the confirmation modal buttons
confirmYesBtn.addEventListener('click', () => {
    clearAllElements(); // Call the actual clear function
    hideConfirmModal();
});

confirmNoBtn.addEventListener('click', () => {
    hideConfirmModal();
    updateStatusMessage('Clear operation cancelled.', 'info');
});


// New event listener for the "Move" button in the edit panel
moveElementBtn.addEventListener('click', () => {
    if (selectedElement) {
        // Set the mode to move, but keep the selectedElement.
        // The actual moving starts on mousedown if in this mode.
        setActiveMode('moveElement');
        moveElementBtn.classList.add('btn-active'); // Highlight the move button
        updateStatusMessage(`Move mode active. Drag the selected ${selectedElement.type === 'wall' ? 'wall' : selectedElement.text}.`, 'info');
    } else {
        updateStatusMessage('Please select a wall or component first to move it.', 'error');
        setActiveMode('select'); // Switch to select mode if nothing is selected
    }
});

// New event listener for the "Rotate" button in the edit panel
rotateElementBtn.addEventListener('click', () => {
    if (selectedElement && selectedElement.type === 'component') {
        // Swap width and height, ensuring conversion from pixels to inches and back
        const tempWidthInches = selectedElement.width / pixelsPerInch;
        const tempHeightInches = selectedElement.height / pixelsPerInch;

        selectedElement.width = tempHeightInches * pixelsPerInch;
        selectedElement.height = tempWidthInches * pixelsPerInch;

        // Update input fields in the panel to show inches
        componentWidthInput.value = (selectedElement.width / pixelsPerInch).toFixed(1);
        componentHeightInput.value = (selectedElement.height / pixelsPerInch).toFixed(1);

        drawAll(); // Redraw with new dimensions
        updateStatusMessage(`${selectedElement.text} rotated. New dimensions: ${(selectedElement.width / pixelsPerInch).toFixed(1)}x${(selectedElement.height / pixelsPerInch).toFixed(1)} inches.`, 'info');
    } else {
        updateStatusMessage('Please select a component to rotate.', 'error');
    }
});


// Event listener for the "Set Dimensions" button in the edit panel
setDimensionsBtn.addEventListener('click', () => {
    if (!selectedElement) {
        updateStatusMessage("No element selected to set dimensions.", 'error');
        return;
    }

    if (selectedElement.type === 'wall') {
        const newLengthInches = parseFloat(wallLengthInput.value);
        if (isNaN(newLengthInches) || newLengthInches <= 0.1) {
            updateStatusMessage("Invalid length. Please enter a positive number.", 'error');
            return;
        }

        const newLengthPixels = newLengthInches * pixelsPerInch;
        const dx = selectedElement.end.x - selectedElement.start.x;
        const dy = selectedElement.end.y - selectedElement.start.y;
        const currentLengthPixels = Math.sqrt(dx * dx + dy * dy);

        if (currentLengthPixels === 0) {
            selectedElement.end.x = selectedElement.start.x + newLengthPixels;
            selectedElement.end.y = selectedElement.start.y;
        } else {
            const unitDx = dx / currentLengthPixels;
            const unitDy = dy / currentLengthPixels;
            selectedElement.end.x = selectedElement.start.x + unitDx * newLengthPixels;
            selectedElement.end.y = selectedElement.start.y + unitDy * newLengthPixels;
        }
        updateStatusMessage(`Wall length updated to ${newLengthInches.toFixed(1)} inches.`, 'info');

    } else if (selectedElement.type === 'component') {
        const newTitle = componentTitleInput.value.trim();
        const newWidthInches = parseFloat(componentWidthInput.value);
        const newHeightInches = parseFloat(componentHeightInput.value);

        if (newTitle === "") {
            updateStatusMessage("Component title cannot be empty.", 'error');
            return;
        }
        if (isNaN(newWidthInches) || newWidthInches <= 0.1 || isNaN(newHeightInches) || newHeightInches <= 0.1) {
            updateStatusMessage("Invalid dimensions. Please enter positive numbers for width and height.", 'error');
            return;
        }
        selectedElement.text = newTitle;
        // Convert input inches to pixels for storage
        selectedElement.width = newWidthInches * pixelsPerInch;
        selectedElement.height = newHeightInches * pixelsPerInch;
        updateStatusMessage(`${selectedElement.text} dimensions updated to ${newWidthInches.toFixed(1)}x${newHeightInches.toFixed(1)} inches.`, 'info');
    }
    drawAll();
    // Close panel and return to select mode after setting dimensions
    selectedElement = null;
    hideEditPanel();
    setActiveMode('select');
});

// Event listener for the "Delete" button in the edit panel
deleteElementBtn.addEventListener('click', () => {
    if (!selectedElement) {
        updateStatusMessage("No element selected to delete.", 'error');
        return;
    }

    if (selectedElement.type === 'wall') {
        const index = walls.indexOf(selectedElement);
        if (index > -1) {
            walls.splice(index, 1);
        }
        updateStatusMessage('Wall deleted.', 'info');
    } else if (selectedElement.type === 'component') {
        const index = components.indexOf(selectedElement);
        if (index > -1) {
            components.splice(index, 1);
        }
        updateStatusMessage(`${selectedElement.text} deleted.`, 'info');
    }
    selectedElement = null;
    hideEditPanel();
    drawAll();
    setActiveMode('select'); // After deleting, go back to select mode
});

// Initial setup on page load
window.addEventListener('load', () => {
    resizeCanvas();
    setActiveMode('drawWalls'); // Set initial mode
    updateStatusMessage('Welcome! Draw walls, add components, or select elements to edit.', 'info');
});

// Re-adjust canvas size and redraw on window resize
window.addEventListener('resize', () => {
    resizeCanvas();
    drawAll();
});

// Global click listener to close panel and return to select mode
document.addEventListener('mousedown', (event) => {
    // Check if the click was outside the editPanel and not on the canvas
    const isClickOutsidePanel = !editPanel.contains(event.target);
    const isClickOnCanvas = canvas.contains(event.target);
    const isClickOnModal = confirmModal.contains(event.target); // Check if click is on the modal

    // Only act if the panel is visible and the click is outside both the panel and canvas AND not on the modal
    if (editPanel.style.display === 'flex' && isClickOutsidePanel && !isClickOnCanvas && !isClickOnModal) {
        selectedElement = null; // Deselect the element
        hideEditPanel();
        setActiveMode('select'); // Go back to select mode
        updateStatusMessage('Panel closed. Switched to Select mode.', 'info');
    }
});
