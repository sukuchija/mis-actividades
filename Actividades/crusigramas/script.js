document.addEventListener('DOMContentLoaded', () => {
    const generateBtn = document.getElementById('generateBtn');
    const downloadWordBtn = document.getElementById('downloadWordBtn'); // New button
    const studentsInput = document.getElementById('studentsInput');
    const wordsInput = document.getElementById('wordsInput');
    const printArea = document.getElementById('printArea');
    const puzzleTitleInput = document.getElementById('puzzleTitle');
    const puzzleInstructionsInput = document.getElementById('puzzleInstructions');

    let currentPuzzlesData = []; // Store generated data for export

    generateBtn.addEventListener('click', generatePuzzles);
    downloadWordBtn.addEventListener('click', downloadWord);

    // Actualizar estado del template cuando se selecciona un archivo
    const templateFileInput = document.getElementById('templateFile');
    if (templateFileInput) {
        templateFileInput.addEventListener('change', function () {
            const statusBadge = document.getElementById('templateStatus');
            if (this.files && this.files.length > 0) {
                statusBadge.textContent = `Template seleccionado: ${this.files[0].name}`;
                statusBadge.style.background = '#4caf50';
                statusBadge.style.color = 'white';
            } else {
                statusBadge.textContent = 'No se ha seleccionado template';
                statusBadge.style.background = '#f0f0f0';
                statusBadge.style.color = '#333';
            }
        });
    }

    function generatePuzzles() {
        const students = studentsInput.value.trim().split('\n').filter(s => s.trim() !== '');
        const rawWords = wordsInput.value.trim().split('\n').filter(w => w.trim() !== '');

        const wordList = rawWords.map(line => {
            const parts = line.split(':');
            const word = parts[0] ? parts[0].trim().toUpperCase().replace(/[^A-Z]/g, '') : '';
            const clue = parts.length > 1 ? parts.slice(1).join(':').trim() : 'Sin pista';
            return { word, clue };
        }).filter(item => item.word.length > 1);

        if (students.length === 0 || wordList.length === 0) {
            alert('Por favor, ingresa al menos un estudiante y una palabra válida.');
            return;
        }

        printArea.innerHTML = '';
        printArea.style.display = 'block';
        currentPuzzlesData = []; // Reset storage

        let generatedCount = 0;
        students.forEach((student, index) => {
            const shuffledWords = [...wordList];
            fisherYatesShuffle(shuffledWords);

            let bestGrid = null;
            let bestPlacedCount = 0;

            for (let attempt = 0; attempt < 50; attempt++) {
                if (attempt > 0) fisherYatesShuffle(shuffledWords);
                const result = generateCrosswordGrid(shuffledWords);
                if (result.placedWords.length > bestPlacedCount) {
                    bestGrid = result;
                    bestPlacedCount = result.placedWords.length;
                }
                if (bestPlacedCount === wordList.length) break;
            }

            if (bestGrid && bestGrid.placedWords.length > 0) {
                // Store data for Word export
                currentPuzzlesData.push({
                    studentName: student,
                    gridData: bestGrid,
                    puzzleId: index + 1
                });
                renderPuzzle(student, bestGrid, index + 1);
                generatedCount++;
            } else {
                console.error(`No se pudo generar crucigrama para ${student}`);
            }
        });

        console.log(`Generados ${generatedCount} crucigramas.`);
        if (generatedCount > 0) {
            downloadWordBtn.style.display = 'block'; // Ensure button is visible if hidden
        }
    }

    // ... (fisherYatesShuffle, generateCrosswordGrid, tryPlaceIntersecting, canPlace, placeWord remain same) ...
    // To save lines, I will include them full here for correctness but simplified mentally where logic is identical.

    function fisherYatesShuffle(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }

    function generateCrosswordGrid(wordsToPlace) {
        const gridSize = 30;
        const grid = Array(gridSize).fill(null).map(() => Array(gridSize).fill(null));
        const placedWords = [];

        for (const item of wordsToPlace) {
            const word = item.word;
            let placed = false;

            if (placedWords.length === 0) {
                const r = Math.floor(gridSize / 2);
                const c = Math.floor((gridSize - word.length) / 2);
                const dir = Math.random() > 0.5 ? 'horizontal' : 'vertical';
                if (canPlace(grid, word, r, c, dir)) {
                    placeWord(grid, item, r, c, dir);
                    placedWords.push({ ...item, r, c, dir });
                    placed = true;
                }
            } else {
                placed = tryPlaceIntersecting(grid, item, placedWords);
            }
        }
        return { grid, placedWords };
    }

    function tryPlaceIntersecting(grid, item, placedWords) {
        const word = item.word;
        const possibleMoves = [];

        for (let i = 0; i < word.length; i++) {
            const char = word[i];
            for (const placed of placedWords) {
                for (let j = 0; j < placed.word.length; j++) {
                    if (placed.word[j] === char) {
                        let intersectR, intersectC;
                        if (placed.dir === 'horizontal') {
                            intersectR = placed.r;
                            intersectC = placed.c + j;
                        } else {
                            intersectR = placed.r + j;
                            intersectC = placed.c;
                        }

                        const newDir = placed.dir === 'horizontal' ? 'vertical' : 'horizontal';
                        let newR, newC;
                        if (newDir === 'horizontal') {
                            newR = intersectR;
                            newC = intersectC - i;
                        } else {
                            newR = intersectR - i;
                            newC = intersectC;
                        }
                        possibleMoves.push({ r: newR, c: newC, dir: newDir });
                    }
                }
            }
        }
        fisherYatesShuffle(possibleMoves);
        for (const move of possibleMoves) {
            if (canPlace(grid, word, move.r, move.c, move.dir)) {
                placeWord(grid, item, move.r, move.c, move.dir);
                placedWords.push({ ...item, r: move.r, c: move.c, dir: move.dir });
                return true;
            }
        }
        return false;
    }

    function canPlace(grid, word, r, c, dir) {
        const height = grid.length;
        const width = grid[0].length;
        if (r < 0 || c < 0) return false;
        if (dir === 'horizontal') {
            if (c + word.length > width) return false;
        } else {
            if (r + word.length > height) return false;
        }

        for (let i = 0; i < word.length; i++) {
            const currR = dir === 'horizontal' ? r : r + i;
            const currC = dir === 'horizontal' ? c + i : c;
            const cell = grid[currR][currC];
            if (cell !== null && cell.char !== word[i]) return false;

            if (cell === null) {
                const neighbors = [
                    { dr: -1, dc: 0 }, { dr: 1, dc: 0 },
                    { dr: 0, dc: -1 }, { dr: 0, dc: 1 }
                ];
                for (const n of neighbors) {
                    const nR = currR + n.dr;
                    const nC = currC + n.dc;
                    if (nR >= 0 && nR < height && nC >= 0 && nC < width) {
                        if (grid[nR][nC] !== null) {
                            let isPrev = false;
                            let isNext = false;
                            if (dir === 'horizontal') {
                                if (n.dr === 0 && n.dc === -1) isPrev = true;
                                if (n.dr === 0 && n.dc === 1) isNext = true;
                            } else {
                                if (n.dr === -1 && n.dc === 0) isPrev = true;
                                if (n.dr === 1 && n.dc === 0) isNext = true;
                            }
                            let allowed = false;
                            if (isPrev && i > 0) {
                                if (grid[nR][nC].char === word[i - 1]) allowed = true;
                            }
                            if (isNext && i < word.length - 1) {
                                if (grid[nR][nC].char === word[i + 1]) allowed = true;
                            }
                            if (!allowed) return false;
                        }
                    }
                }
            }
        }

        if (dir === 'horizontal') {
            if (c > 0 && grid[r][c - 1] !== null) return false;
            if (c + word.length < width && grid[r][c + word.length] !== null) return false;
        } else {
            if (r > 0 && grid[r - 1][c] !== null) return false;
            if (r + word.length < height && grid[r + word.length][c] !== null) return false;
        }
        return true;
    }

    function placeWord(grid, item, r, c, dir) {
        for (let i = 0; i < item.word.length; i++) {
            const currR = dir === 'horizontal' ? r : r + i;
            const currC = dir === 'horizontal' ? c + i : c;
            grid[currR][currC] = { char: item.word[i] };
        }
    }

    function renderPuzzle(studentName, gridData, puzzleId) {
        // ... (existing render code for web view) ...
        // We reuse the exact same logic but with slight refactoring if we wanted to DRY code,
        // but for now, let's keep the DOM updating logic separate from data logic to be safe.
        // Copying the existing renderPuzzle body here for completeness and stability.

        const { grid, placedWords } = gridData;
        const page = document.createElement('div');
        page.className = 'puzzle-page';

        const cellNumbers = new Map();
        let currentNumber = 1;

        placedWords.forEach(w => { delete w.number; });

        let minR = grid.length, maxR = 0, minC = grid[0].length, maxC = 0;
        for (let r = 0; r < grid.length; r++) {
            for (let c = 0; c < grid[0].length; c++) {
                if (grid[r][c]) {
                    if (r < minR) minR = r;
                    if (r > maxR) maxR = r;
                    if (c < minC) minC = c;
                    if (c > maxC) maxC = c;
                }
            }
        }

        // Grid width/height
        const width = maxC - minC + 1;
        const height = maxR - minR + 1;

        // Assign numbers
        for (let r = minR; r <= maxR; r++) {
            for (let c = minC; c <= maxC; c++) {
                if (grid[r][c]) {
                    const startsH = placedWords.some(w => w.r === r && w.c === c && w.dir === 'horizontal');
                    const startsV = placedWords.some(w => w.r === r && w.c === c && w.dir === 'vertical');

                    if (startsH || startsV) {
                        cellNumbers.set(`${r},${c}`, currentNumber);
                        placedWords.forEach(w => {
                            if (w.r === r && w.c === c) { if (!w.number) w.number = currentNumber; }
                        });
                        currentNumber++;
                    }
                }
            }
        }

        // This 'placedWords' object is now mutated with numbers, which is good for data storage reference.
        // But for display we need to render the grid now.

        let gridHtml = `<div class="crossword-grid skeleton" style="grid-template-columns: repeat(${width}, 32px); grid-template-rows: repeat(${height}, 32px);">`;
        for (let r = minR; r <= maxR; r++) {
            for (let c = minC; c <= maxC; c++) {
                const cell = grid[r][c];
                const number = cellNumbers.has(`${r},${c}`) ? cellNumbers.get(`${r},${c}`) : '';
                if (cell) {
                    gridHtml += `<div class="grid-cell"><span class="cell-number">${number}</span></div>`;
                } else {
                    gridHtml += `<div class="grid-cell black"></div>`;
                }
            }
        }
        gridHtml += `</div>`;

        // Clues
        const hWords = placedWords.filter(w => w.dir === 'horizontal');
        const vWords = placedWords.filter(w => w.dir === 'vertical');

        // Ordenar por número para que sea más fácil de buscar
        hWords.sort((a, b) => a.number - b.number);
        vWords.sort((a, b) => a.number - b.number);

        const horizontalClues = hWords.map(w => `<li><strong>${w.number}.</strong> ${w.clue}</li>`).join('');
        const verticalClues = vWords.map(w => `<li><strong>${w.number}.</strong> ${w.clue}</li>`).join('');

        const puzzleInstructions = document.getElementById('puzzleInstructions').value;
        const puzzleTitle = document.getElementById('puzzleTitle').value;

        // Fecha actual formateada
        const date = new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'long' });

        page.innerHTML = `
            <div class="puzzle-header">
                <div class="header-left">
                    <div class="institution-name">ACTIVIDAD ACADÉMICA</div>
                    <h1>${puzzleTitle}</h1>
                    <p>${puzzleInstructions}</p>
                </div>
                <div class="header-right">
                    <div class="student-info-box">
                        <div class="info-line"><span class="info-label">Student:</span> ${studentName}</div>
                        <div class="info-line"><span class="info-label">Date:</span> ___________________</div>
                        <div class="info-line"><span class="info-label">Grade:</span> __________________</div>
                    </div>
                </div>
            </div>
            
            <div class="puzzle-grid-container">${gridHtml}</div>
            
            <div class="clues-container">
                <div class="clue-section">
                    <h3>Horizontales</h3>
                    <ul class="clue-list">${horizontalClues}</ul>
                </div>
                <div class="clue-section">
                    <h3>Verticales</h3>
                    <ul class="clue-list">${verticalClues}</ul>
                </div>
            </div>
            
            <div style="text-align: center; margin-top: 40px; border-top: 1px solid #ccc; padding-top: 10px; font-size: 9pt; color: #666;">
                Generado para uso educativo - ${date}
            </div>
        `;
        printArea.appendChild(page);
    }

    async function downloadWord() {
        if (currentPuzzlesData.length === 0) {
            alert('Primero debes generar los crucigramas.');
            return;
        }

        // Verificar si JSZip está disponible
        if (typeof JSZip === 'undefined') {
            alert('JSZip no está disponible. Por favor recarga la página.');
            return;
        }

        // Obtener el archivo template seleccionado
        const templateFileInput = document.getElementById('templateFile');
        if (!templateFileInput.files || templateFileInput.files.length === 0) {
            alert('Por favor selecciona el documento template primero');
            return;
        }

        const puzzleTitle = document.getElementById('puzzleTitle').value;
        const instructions = document.getElementById('puzzleInstructions').value;

        try {
            // Cargar el documento template
            const templateFile = templateFileInput.files[0];
            const templateArrayBuffer = await templateFile.arrayBuffer();
            const templateZip = await JSZip.loadAsync(templateArrayBuffer);

            // Crear el documento final
            const finalZip = new JSZip();

            // Copiar todos los archivos del template
            for (const fileName in templateZip.files) {
                if (!templateZip.files[fileName].dir) {
                    const fileContent = await templateZip.files[fileName].async('uint8array');
                    finalZip.file(fileName, fileContent);
                }
            }

            // Modificar el document.xml para insertar el contenido
            const documentFile = 'word/document.xml';
            if (finalZip.files[documentFile]) {
                let xmlContent = await finalZip.files[documentFile].async('string');

                // Generar el XML del contenido
                const contentXML = generateCrosswordContentXML(currentPuzzlesData, puzzleTitle, instructions);

                // Insertar antes del cierre del body
                if (xmlContent.includes('</w:body>')) {
                    xmlContent = xmlContent.replace('</w:body>', contentXML + '</w:body>');
                } else {
                    xmlContent = xmlContent.replace('</w:document>', '<w:body>' + contentXML + '</w:body></w:document>');
                }

                finalZip.file(documentFile, xmlContent);
            }

            // Generar el blob final
            const finalBlob = await finalZip.generateAsync({ type: 'blob' });
            saveAs(finalBlob, `Crucigramas_${puzzleTitle.replace(/\s+/g, '_')}.docx`);
            alert(`¡Documento generado para ${currentPuzzlesData.length} estudiante(s)!`);
        } catch (e) {
            console.error(e);
            alert('Error al generar el documento: ' + e.message);
        }
    }

    function generateCrosswordContentXML(puzzlesData, puzzleTitle, instructions) {
        let contentXML = '';
        const titleSize = "28"; // 14pt (Reduced from 16pt)
        const subtitleSize = "22"; // 11pt (Reduced from 12pt)
        const textSize = "20"; // 10pt (Reduced from 11pt)
        const cellSize = 400; // ~0.7cm (Reduced from 500)

        puzzlesData.forEach((data, index) => {
            const { grid, placedWords } = data.gridData;

            // Salto de página para el siguiente estudiante
            if (index > 0) {
                contentXML += '<w:p><w:r><w:br w:type="page"/></w:r></w:p>';
            }

            // --- HEADER PROFESIONAL (Tabla invisible) ---
            // Reduced spacing within header
            contentXML += '<w:tbl><w:tblPr><w:tblW w:w="0" w:type="auto"/><w:tblBorders><w:top w:val="none"/><w:left w:val="none"/><w:bottom w:val="none"/><w:right w:val="none"/><w:insideH w:val="none"/><w:insideV w:val="none"/></w:tblBorders></w:tblPr><w:tblGrid><w:gridCol w:w="6000"/><w:gridCol w:w="3500"/></w:tblGrid><w:tr><w:tc><w:tcPr><w:tcW w:w="6000" w:type="dxa"/><w:vAlign w:val="top"/></w:tcPr>';

            // Título e Instrucciones (Izquierda)
            contentXML += `<w:p><w:pPr><w:spacing w:after="0"/></w:pPr><w:r><w:rPr><w:b/><w:caps/><w:sz w:val="20"/></w:rPr><w:t>ACTIVIDAD ACADÉMICA</w:t></w:r></w:p>`;
            contentXML += `<w:p><w:pPr><w:spacing w:after="40"/></w:pPr><w:r><w:rPr><w:b/><w:sz w:val="${titleSize}"/></w:rPr><w:t>${escapeXml(puzzleTitle)}</w:t></w:r></w:p>`;
            contentXML += `<w:p><w:pPr><w:spacing w:after="0"/></w:pPr><w:r><w:rPr><w:i/><w:sz w:val="${textSize}"/></w:rPr><w:t>${escapeXml(instructions)}</w:t></w:r></w:p>`;

            contentXML += '</w:tc><w:tc><w:tcPr><w:tcW w:w="3500" w:type="dxa"/><w:vAlign w:val="top"/></w:tcPr>';

            // Info Estudiante (Derecha - Caja)
            // Borde eliminado a petición (w:val="none")
            contentXML += '<w:tbl><w:tblPr><w:tblW w:w="0" w:type="auto"/><w:tblBorders><w:top w:val="none"/><w:left w:val="none"/><w:bottom w:val="none"/><w:right w:val="none"/><w:insideH w:val="none"/><w:insideV w:val="none"/></w:tblBorders></w:tblPr><w:tblGrid><w:gridCol w:w="3500"/></w:tblGrid>';
            contentXML += `<w:tr><w:tc><w:tcPr><w:tcW w:w="3500" w:type="dxa"/></w:tcPr><w:p><w:pPr><w:spacing w:after="0"/></w:pPr><w:r><w:rPr><w:b/><w:sz w:val="${textSize}"/></w:rPr><w:t xml:space="preserve">Student: </w:t></w:r><w:r><w:rPr><w:sz w:val="${textSize}"/></w:rPr><w:t>${escapeXml(data.studentName)}</w:t></w:r></w:p></w:tc></w:tr>`;
            contentXML += `<w:tr><w:tc><w:tcPr><w:tcW w:w="3500" w:type="dxa"/></w:tcPr><w:p><w:pPr><w:spacing w:after="0"/></w:pPr><w:r><w:rPr><w:b/><w:sz w:val="${textSize}"/></w:rPr><w:t xml:space="preserve">Date: </w:t></w:r><w:r><w:rPr><w:sz w:val="${textSize}"/></w:rPr><w:t>___________________</w:t></w:r></w:p></w:tc></w:tr>`;
            contentXML += `<w:tr><w:tc><w:tcPr><w:tcW w:w="3500" w:type="dxa"/></w:tcPr><w:p><w:pPr><w:spacing w:after="0"/></w:pPr><w:r><w:rPr><w:b/><w:sz w:val="${textSize}"/></w:rPr><w:t xml:space="preserve">Grade: </w:t></w:r><w:r><w:rPr><w:sz w:val="${textSize}"/></w:rPr><w:t>__________________</w:t></w:r></w:p></w:tc></w:tr>`;
            contentXML += '</w:tbl>';

            contentXML += '</w:tc></w:tr></w:tbl>';

            // Espacio tras header (Reduced)
            contentXML += '<w:p><w:pPr><w:spacing w:after="100"/></w:pPr></w:p>';

            // Calcular bounds del grid
            let minR = grid.length, maxR = 0, minC = grid[0].length, maxC = 0;
            for (let r = 0; r < grid.length; r++) {
                for (let c = 0; c < grid[0].length; c++) {
                    if (grid[r][c]) {
                        if (r < minR) minR = r;
                        if (r > maxR) maxR = r;
                        if (c < minC) minC = c;
                        if (c > maxC) maxC = c;
                    }
                }
            }

            const width = maxC - minC + 1;
            const height = maxR - minR + 1;

            // --- GRID DEL CRUCIGRAMA ---
            contentXML += '<w:tbl><w:tblPr><w:tblW w:w="0" w:type="auto"/><w:jc w:val="center"/><w:tblBorders><w:top w:val="none"/><w:left w:val="none"/><w:bottom w:val="none"/><w:right w:val="none"/><w:insideH w:val="none"/><w:insideV w:val="none"/></w:tblBorders></w:tblPr><w:tblGrid>';
            for (let c = 0; c < width; c++) {
                contentXML += `<w:gridCol w:w="${cellSize}"/>`;
            }
            contentXML += '</w:tblGrid>';

            for (let r = minR; r <= maxR; r++) {
                contentXML += `<w:tr><w:trPr><w:trHeight w:val="${cellSize}" w:hRule="exact"/></w:trPr>`;
                for (let c = minC; c <= maxC; c++) {
                    const cell = grid[r][c];
                    const wordStarting = placedWords.find(w => w.r === r && w.c === c);
                    const number = (wordStarting && wordStarting.number) ? wordStarting.number : '';

                    if (cell) {
                        // Celda con letra (visible)
                        // Borde sólido (single) pero fino (sz=4)
                        contentXML += `<w:tc><w:tcPr><w:tcW w:w="${cellSize}" w:type="dxa"/><w:shd w:fill="FFFFFF" w:val="clear"/><w:tcBorders><w:top w:val="single" w:sz="4" w:color="000000"/><w:left w:val="single" w:sz="4" w:color="000000"/><w:bottom w:val="single" w:sz="4" w:color="000000"/><w:right w:val="single" w:sz="4" w:color="000000"/></w:tcBorders><w:vAlign w:val="top"/></w:tcPr><w:p><w:pPr><w:spacing w:before="20" w:after="0" w:line="240" w:lineRule="auto"/><w:jc w:val="left"/></w:pPr>`;
                        if (number) {
                            contentXML += `<w:r><w:rPr><w:sz w:val="16"/><w:szCs w:val="16"/><w:vertAlign w:val="superscript"/></w:rPr><w:t>${number}</w:t></w:r>`;
                        }
                        contentXML += '</w:p></w:tc>';
                    } else {
                        // Celda vacía (invisible) - Explicitamente SIN bordes (nil)
                        contentXML += `<w:tc><w:tcPr><w:tcW w:w="${cellSize}" w:type="dxa"/><w:shd w:fill="auto" w:val="clear"/><w:tcBorders><w:top w:val="nil"/><w:left w:val="nil"/><w:bottom w:val="nil"/><w:right w:val="nil"/></w:tcBorders><w:vAlign w:val="center"/></w:tcPr><w:p><w:pPr><w:spacing w:before="0" w:after="0"/></w:pPr></w:p></w:tc>`;
                    }
                }
                contentXML += '</w:tr>';
            }
            contentXML += '</w:tbl>';

            // Espaciador (Reduced)
            contentXML += '<w:p><w:pPr><w:spacing w:after="100"/></w:pPr></w:p>';

            // --- PISTAS (2 Columas) ---
            const hWords = placedWords.filter(w => w.dir === 'horizontal').sort((a, b) => a.number - b.number);
            const vWords = placedWords.filter(w => w.dir === 'vertical').sort((a, b) => a.number - b.number);

            contentXML += '<w:tbl><w:tblPr><w:tblW w:w="0" w:type="auto"/><w:tblBorders><w:top w:val="none"/><w:left w:val="none"/><w:bottom w:val="none"/><w:right w:val="none"/><w:insideH w:val="none"/><w:insideV w:val="none"/></w:tblBorders></w:tblPr><w:tblGrid><w:gridCol w:w="5000"/><w:gridCol w:w="5000"/></w:tblGrid><w:tr><w:tc><w:tcPr><w:tcW w:w="5000" w:type="dxa"/><w:vAlign w:val="top"/></w:tcPr>';

            // Columna Horizontales
            contentXML += `<w:p><w:pPr><w:spacing w:after="40"/><w:pBdr><w:bottom w:val="single" w:sz="4" w:space="1" w:color="000000"/></w:pBdr></w:pPr><w:r><w:rPr><w:b/><w:caps/><w:sz w:val="${subtitleSize}"/></w:rPr><w:t>HORIZONTALES</w:t></w:r></w:p>`;
            hWords.forEach(w => {
                // Sangría francesa comprimida
                contentXML += `<w:p><w:pPr><w:spacing w:after="20"/><w:ind w:left="240" w:hanging="240"/></w:pPr><w:r><w:rPr><w:b/><w:sz w:val="${textSize}"/></w:rPr><w:t>${w.number}. </w:t></w:r><w:r><w:rPr><w:sz w:val="${textSize}"/></w:rPr><w:t>${escapeXml(w.clue)}</w:t></w:r></w:p>`;
            });

            contentXML += '</w:tc><w:tc><w:tcPr><w:tcW w:w="5000" w:type="dxa"/><w:vAlign w:val="top"/></w:tcPr>';

            // Columna Verticales
            contentXML += `<w:p><w:pPr><w:spacing w:after="40"/><w:pBdr><w:bottom w:val="single" w:sz="4" w:space="1" w:color="000000"/></w:pBdr></w:pPr><w:r><w:rPr><w:b/><w:caps/><w:sz w:val="${subtitleSize}"/></w:rPr><w:t>VERTICALES</w:t></w:r></w:p>`;
            vWords.forEach(w => {
                contentXML += `<w:p><w:pPr><w:spacing w:after="20"/><w:ind w:left="240" w:hanging="240"/></w:pPr><w:r><w:rPr><w:b/><w:sz w:val="${textSize}"/></w:rPr><w:t>${w.number}. </w:t></w:r><w:r><w:rPr><w:sz w:val="${textSize}"/></w:rPr><w:t>${escapeXml(w.clue)}</w:t></w:r></w:p>`;
            });

            contentXML += '</w:tc></w:tr></w:tbl>';
        });

        return contentXML;
    }

    function escapeXml(text) {
        if (!text) return '';
        return String(text)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&apos;');
    }
});
