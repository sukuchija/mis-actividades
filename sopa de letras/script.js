// Configuración Global
let currentDiff = 'dificil';
const CONFIG = {
    medio: { size: 15, directions: [[0, 1], [1, 0], [1, 1]] },
    dificil: { size: 20, directions: [[0, 1], [1, 0], [1, 1], [1, -1]] },
    bachillerato: { size: 25, directions: [[0, 1], [1, 0], [1, 1], [1, -1], [-1, 1], [-1, -1], [0, -1], [-1, 0]] }
};

// Inicialización
document.addEventListener('DOMContentLoaded', function () {
    updateCounts();

    // Actualizar estado del template cuando se selecciona un archivo
    const templateFileInput = document.getElementById('templateFile');
    if (templateFileInput) {
        templateFileInput.addEventListener('change', function () {
            const statusBadge = document.getElementById('templateStatus');
            if (this.files && this.files.length > 0) {
                statusBadge.textContent = `Template seleccionado: ${this.files[0].name}`;
                statusBadge.style.background = 'var(--success)';
                statusBadge.style.color = 'white';
            } else {
                statusBadge.textContent = 'No se ha seleccionado template';
                statusBadge.style.background = 'var(--primary-light)';
                statusBadge.style.color = 'var(--primary-dark)';
            }
        });
    }
});

function setDiff(level) {
    currentDiff = level;
    document.querySelectorAll('.diff-card').forEach(c => c.classList.remove('selected'));
    document.getElementById(`diff-${level}`).classList.add('selected');
}

function parseInput(id, upper = false) {
    const val = document.getElementById(id).value;
    if (!val.trim()) return [];
    return val.split(/[\n,]+/).map(s => s.trim()).filter(s => s).map(s => upper ? s.toUpperCase() : s);
}

function parseWordList(id) {
    const val = document.getElementById(id).value;
    if (!val.trim()) return [];
    return val.split(/[\n,]+/).map(s => s.trim()).filter(s => s).map(s => {
        // Extraer palabra para búsqueda (todo lo antes del primer paréntesis)
        const match = s.match(/^([^(]+)/);
        const search = match ? match[1].trim().toUpperCase() : s.toUpperCase();
        return {
            display: s,
            search: search
        };
    });
}

function updateCounts() {
    const s = parseInput('studentsBulk');
    const w = parseWordList('wordsBulk');
    const validW = w.filter(word => /^[A-ZÁÉÍÓÚÑ]+$/i.test(word.search));

    document.getElementById('studentCount').innerText = `${s.length} estudiantes`;
    document.getElementById('wordCount').innerText = `${validW.length} válidas`;
}

function showAlert(msg, type = 'success') {
    const div = document.createElement('div');
    div.className = `alert alert-${type}`;
    div.innerText = msg;
    document.getElementById('alertContainer').appendChild(div);
    setTimeout(() => div.remove(), 4000);
}

// --- Lógica del Generador ---

function generateGrid(words, seed) {
    const settings = CONFIG[currentDiff];
    const size = settings.size;
    const grid = Array(size).fill(null).map(() => Array(size).fill(''));
    const random = seededRandom(seed);

    // Ordenar palabras por longitud descendente (mejor ajuste)
    const sortedWords = [...words].sort((a, b) => b.length - a.length);

    for (let word of sortedWords) {
        let placed = false;
        let attempts = 0;
        while (!placed && attempts < 150) {
            const r = Math.floor(random() * size);
            const c = Math.floor(random() * size);
            const dir = settings.directions[Math.floor(random() * settings.directions.length)];

            if (canPlace(grid, word, r, c, dir, size)) {
                place(grid, word, r, c, dir);
                placed = true;
            }
            attempts++;
        }
    }

    // Rellenar vacíos
    const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    for (let i = 0; i < size; i++) {
        for (let j = 0; j < size; j++) {
            if (grid[i][j] === '') grid[i][j] = letters[Math.floor(random() * letters.length)];
        }
    }
    return grid;
}

function canPlace(grid, word, r, c, dir, size) {
    for (let i = 0; i < word.length; i++) {
        const nr = r + dir[0] * i, nc = c + dir[1] * i;
        if (nr < 0 || nr >= size || nc < 0 || nc >= size) return false;
        if (grid[nr][nc] !== '' && grid[nr][nc] !== word[i]) return false;
    }
    return true;
}

function place(grid, word, r, c, dir) {
    for (let i = 0; i < word.length; i++) {
        grid[r + dir[0] * i][c + dir[1] * i] = word[i];
    }
}

function seededRandom(seed) {
    let x = Math.sin(seed++) * 10000;
    return () => {
        x = Math.sin(seed++) * 10000;
        return x - Math.floor(x);
    };
}

// --- Generación ZIP ---

// --- Generación DOC Único ---


async function generateWordDoc() {
    const students = parseInput('studentsBulk');
    const wordsObj = parseWordList('wordsBulk');
    const validWordsObj = wordsObj.filter(w => /^[A-ZÁÉÍÓÚÑ]+$/i.test(w.search));
    const seed = Date.now();

    if (students.length === 0) return showAlert('Agrega al menos un estudiante', 'error');
    if (validWordsObj.length === 0) return showAlert('Agrega palabras válidas', 'error');

    // Verificar si JSZip está disponible
    if (typeof JSZip === 'undefined') {
        return showAlert('JSZip no está disponible. Por favor recarga la página.', 'error');
    }

    // Obtener el archivo template seleccionado
    const templateFileInput = document.getElementById('templateFile');
    if (!templateFileInput.files || templateFileInput.files.length === 0) {
        return showAlert('Por favor selecciona el documento template primero', 'error');
    }

    try {
        // Cargar el documento template
        showAlert('Cargando template...', 'success');
        const templateFile = templateFileInput.files[0];
        const templateArrayBuffer = await templateFile.arrayBuffer();
        const templateZip = await JSZip.loadAsync(templateArrayBuffer);

        // Generar contenido para cada estudiante
        const searchWords = validWordsObj.map(w => w.search);
        const displayWords = validWordsObj.map(w => w.display);
        const grid = generateGrid(searchWords, seed);

        // Crear el documento final combinando todas las secciones
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

            // Generar el XML del contenido (nombre del estudiante, sopa de letras, palabras)
            const contentXML = generateContentXML(students, grid, displayWords, currentDiff);

            // Buscar el final del body y agregar el contenido antes del cierre
            // O buscar un marcador de posición si existe
            if (xmlContent.includes('</w:body>')) {
                // Insertar antes del cierre del body
                xmlContent = xmlContent.replace('</w:body>', contentXML + '</w:body>');
            } else {
                // Si no hay body, crear uno
                xmlContent = xmlContent.replace('</w:document>', '<w:body>' + contentXML + '</w:body></w:document>');
            }

            finalZip.file(documentFile, xmlContent);
        }

        // Generar el blob final
        const finalBlob = await finalZip.generateAsync({ type: 'blob' });
        saveAs(finalBlob, "Sopas_de_Letras_Imperial_Eagles.docx");
        showAlert(`¡Documento generado para ${students.length} estudiante(s)!`, 'success');
    } catch (e) {
        console.error(e);
        showAlert('Error al generar el documento: ' + e.message, 'error');
    }
}

async function getExctractedImage(dataUrl) {
    const res = await fetch(dataUrl);
    const blob = await res.blob();
    return await blob.arrayBuffer();
}

function generateContentXML(students, grid, displayWords, difficulty) {
    let contentXML = '';

    // Configuración de tamaños
    const titleSize = "32"; // 16pt
    const subtitleSize = "24"; // 12pt
    const textSize = "22"; // 11pt
    const gridFontSize = "28"; // 14pt (Letter size)

    for (let i = 0; i < students.length; i++) {
        const student = students[i];

        // Salto de página
        if (i > 0) {
            contentXML += '<w:p><w:r><w:br w:type="page"/></w:r></w:p>';
        }

        // --- SECCIÓN: HEADER COMPACTO (Estudiante + Título en misma línea) ---
        // Usamos una tabla de 2 columnas: Izq (Estudiante), Der (Título)
        contentXML += '<w:tbl><w:tblPr><w:tblW w:w="0" w:type="auto"/><w:tblBorders><w:top w:val="none"/><w:left w:val="none"/><w:bottom w:val="none"/><w:right w:val="none"/><w:insideH w:val="none"/><w:insideV w:val="none"/></w:tblBorders></w:tblPr><w:tblGrid><w:gridCol w:w="6000"/><w:gridCol w:w="3500"/></w:tblGrid><w:tr><w:tc><w:tcPr><w:tcW w:w="6000" w:type="dxa"/><w:vAlign w:val="bottom"/></w:tcPr><w:p><w:r><w:rPr><w:b/><w:sz w:val="' + subtitleSize + '"/></w:rPr><w:t xml:space="preserve">Student: </w:t></w:r><w:r><w:rPr><w:sz w:val="' + subtitleSize + '"/><w:u w:val="single"/></w:rPr><w:t xml:space="preserve">  ' + student + '  </w:t></w:r></w:p></w:tc><w:tc><w:tcPr><w:tcW w:w="3500" w:type="dxa"/><w:vAlign w:val="bottom"/></w:tcPr><w:p><w:pPr><w:jc w:val="right"/></w:pPr><w:r><w:rPr><w:b/><w:caps/><w:color w:val="2F5496"/><w:sz w:val="' + titleSize + '"/></w:rPr><w:t>Sopa de Letras</w:t></w:r></w:p></w:tc></w:tr></w:tbl>';

        // Pequeño espacio después del header
        contentXML += '<w:p><w:pPr><w:spacing w:after="100"/></w:pPr></w:p>';

        // --- SECCIÓN: GRID (SOPA DE LETRAS) ---
        const gridSize = grid.length;
        // Ajustar tamaño celda según nivel (Twips)
        // Bachillerato (25x25) necesita ser más pequeño para caber
        const cellSize = difficulty === 'bachillerato' ? 380 : 550;

        contentXML += '<w:tbl><w:tblPr><w:tblW w:w="0" w:type="auto"/><w:jc w:val="center"/><w:tblBorders><w:top w:val="single" w:sz="12" w:color="000000"/><w:left w:val="single" w:sz="12" w:color="000000"/><w:bottom w:val="single" w:sz="12" w:color="000000"/><w:right w:val="single" w:sz="12" w:color="000000"/><w:insideH w:val="single" w:sz="4" w:color="000000"/><w:insideV w:val="single" w:sz="4" w:color="000000"/></w:tblBorders></w:tblPr><w:tblGrid>';
        for (let c = 0; c < gridSize; c++) {
            contentXML += `<w:gridCol w:w="${cellSize}"/>`;
        }
        contentXML += '</w:tblGrid>';

        for (let r = 0; r < gridSize; r++) {
            contentXML += '<w:tr><w:trPr><w:trHeight w:val="' + cellSize + '" w:hRule="exact"/></w:trPr>'; // Altura exacta para celdas cuadradas
            for (let c = 0; c < gridSize; c++) {
                const letter = grid[r][c] || '';
                contentXML += `<w:tc><w:tcPr><w:tcW w:w="${cellSize}" w:type="dxa"/><w:vAlign w:val="center"/></w:tcPr><w:p><w:pPr><w:jc w:val="center"/><w:spacing w:after="0" w:before="0"/></w:pPr><w:r><w:rPr><w:b/><w:sz w:val="${gridFontSize}"/><w:szCs w:val="${gridFontSize}"/></w:rPr><w:t>${letter}</w:t></w:r></w:p></w:tc>`;
            }
            contentXML += '</w:tr>';
        }
        contentXML += '</w:tbl>';

        // Espaciador muy pequeño
        contentXML += '<w:p><w:pPr><w:spacing w:after="100"/></w:pPr></w:p>';

        // --- SECCIÓN: LISTA DE PALABRAS ---
        contentXML += `<w:p><w:pPr><w:spacing w:after="60"/></w:pPr><w:r><w:rPr><w:b/><w:sz w:val="${subtitleSize}"/></w:rPr><w:t xml:space="preserve">Palabras a buscar (${displayWords.length}):</w:t></w:r></w:p>`;

        // Tabla de palabras (4 columnas para mejor distribución)
        const cols = 4;
        const rowsCount = Math.ceil(displayWords.length / cols);
        const colWidth = Math.floor(10000 / cols); // Aprox ancho total pag / cols

        contentXML += '<w:tbl><w:tblPr><w:tblW w:w="0" w:type="auto"/><w:tblBorders><w:top w:val="none"/><w:left w:val="none"/><w:bottom w:val="none"/><w:right w:val="none"/><w:insideH w:val="none"/><w:insideV w:val="none"/></w:tblBorders></w:tblPr><w:tblGrid>';
        for (let k = 0; k < cols; k++) contentXML += `<w:gridCol w:w="${colWidth}"/>`;
        contentXML += '</w:tblGrid>';

        for (let i = 0; i < rowsCount; i++) {
            contentXML += '<w:tr>';
            for (let j = 0; j < cols; j++) {
                const wordIndex = i + (j * rowsCount);
                const text = displayWords[wordIndex] || '';
                contentXML += `<w:tc><w:tcPr><w:tcW w:w="${colWidth}" w:type="dxa"/></w:tcPr><w:p><w:pPr><w:spacing w:after="40"/></w:pPr><w:r><w:rPr><w:sz w:val="${textSize}"/><w:szCs w:val="${textSize}"/></w:rPr><w:t>${text ? '☐ ' + text : ''}</w:t></w:r></w:p></w:tc>`;
            }
            contentXML += '</w:tr>';
        }
        contentXML += '</w:tbl>';
    }

    return contentXML;
}

async function addPageBorders(blob) {
    try {
        // Verificar si JSZip está disponible
        if (typeof JSZip === 'undefined') {
            console.warn('JSZip no disponible, no se pueden agregar bordes de página');
            return blob;
        }

        // Convertir blob a array buffer
        const arrayBuffer = await blob.arrayBuffer();
        const zip = await JSZip.loadAsync(arrayBuffer);

        // Buscar y modificar el archivo document.xml
        const documentFile = 'word/document.xml';
        if (zip.files[documentFile]) {
            let xmlContent = await zip.files[documentFile].async('string');

            // Buscar TODAS las etiquetas <w:sectPr> y agregar los bordes de página a cada una
            const pageBordersXML = `<w:pgBorders w:offsetFrom="page"><w:top w:val="double" w:sz="12" w:space="24" w:color="4F81BD" w:themeColor="accent1"/><w:left w:val="double" w:sz="12" w:space="24" w:color="4F81BD" w:themeColor="accent1"/><w:bottom w:val="double" w:sz="12" w:space="24" w:color="4F81BD" w:themeColor="accent1"/><w:right w:val="double" w:sz="12" w:space="24" w:color="4F81BD" w:themeColor="accent1"/></w:pgBorders>`;

            // Reemplazar todas las ocurrencias de </w:sectPr> con los bordes + </w:sectPr>
            // Pero solo si no tienen ya los bordes
            xmlContent = xmlContent.replace(/(<w:sectPr[^>]*>)([\s\S]*?)(<\/w:sectPr>)/g, function (match, openTag, content, closeTag) {
                // Si ya tiene pgBorders, no hacer nada
                if (content.includes('<w:pgBorders')) {
                    return match;
                }
                // Agregar los bordes antes del cierre
                return openTag + content + pageBordersXML + closeTag;
            });

            zip.file(documentFile, xmlContent);
        }

        // También modificar el header para que los bordes aparezcan en todas las páginas
        const headerFile = 'word/header1.xml';
        if (zip.files[headerFile]) {
            let headerContent = await zip.files[headerFile].async('string');

            // Buscar sectPr en el header y agregar bordes si no existen
            const pageBordersXML = `<w:pgBorders w:offsetFrom="page"><w:top w:val="double" w:sz="12" w:space="24" w:color="4F81BD" w:themeColor="accent1"/><w:left w:val="double" w:sz="12" w:space="24" w:color="4F81BD" w:themeColor="accent1"/><w:bottom w:val="double" w:sz="12" w:space="24" w:color="4F81BD" w:themeColor="accent1"/><w:right w:val="double" w:sz="12" w:space="24" w:color="4F81BD" w:themeColor="accent1"/></w:pgBorders>`;

            headerContent = headerContent.replace(/(<w:sectPr[^>]*>)([\s\S]*?)(<\/w:sectPr>)/g, function (match, openTag, content, closeTag) {
                if (content.includes('<w:pgBorders')) {
                    return match;
                }
                return openTag + content + pageBordersXML + closeTag;
            });

            zip.file(headerFile, headerContent);
        }

        // Generar el nuevo blob
        const newBlob = await zip.generateAsync({ type: 'blob' });
        return newBlob;
    } catch (error) {
        console.error('Error agregando bordes de página:', error);
        // Si hay error, retornar el blob original
        return blob;
    }
}

function createDocxHeader(img1, img2) {
    // Template: 4 Columns según formato del colegio
    // Col 1: Logo 1 (rowspan 3)
    // Col 2-3: Título y subtítulo (colspan 2)
    // Col 4: Logo 2 (rowspan 3)

    return new docx.Table({
        width: {
            size: 10768,
            type: docx.WidthType.DXA,
        },
        borders: {
            top: { style: docx.BorderStyle.SINGLE, size: 4 },
            bottom: { style: docx.BorderStyle.SINGLE, size: 4 },
            left: { style: docx.BorderStyle.SINGLE, size: 4 },
            right: { style: docx.BorderStyle.SINGLE, size: 4 },
            insideHorizontal: { style: docx.BorderStyle.SINGLE, size: 4 },
            insideVertical: { style: docx.BorderStyle.SINGLE, size: 4 }
        },
        rows: [
            // Fila 1: Logo1 | Título (colspan 2) | Logo2
            new docx.TableRow({
                children: [
                    // Col 1: Logo 1 (rowspan 3) - ancho: 1555 twips (14.4%)
                    new docx.TableCell({
                        width: { size: 1555, type: docx.WidthType.DXA },
                        rowSpan: 3,
                        verticalAlign: docx.VerticalAlign.CENTER,
                        children: [
                            new docx.Paragraph({
                                children: [new docx.ImageRun({ data: img1, transformation: { width: 60, height: 80 } })],
                                alignment: docx.AlignmentType.CENTER,
                                spacing: { after: 0 }
                            })
                        ]
                    }),
                    // Col 2-3: Título (colspan 2) - ancho combinado: 7654 twips (5448 + 2206)
                    new docx.TableCell({
                        width: { size: 7654, type: docx.WidthType.DXA },
                        columnSpan: 2,
                        verticalAlign: docx.VerticalAlign.CENTER,
                        children: [
                            new docx.Paragraph({
                                children: [new docx.TextRun({ text: "IMPERIAL EAGLES BILINGUAL SCHOOL", bold: true, size: 16, font: "Verdana" })],
                                alignment: docx.AlignmentType.CENTER,
                                spacing: { after: 0 }
                            })
                        ]
                    }),
                    // Col 4: Logo 2 (rowspan 3) - ancho: 1559 twips (14.5%)
                    new docx.TableCell({
                        width: { size: 1559, type: docx.WidthType.DXA },
                        rowSpan: 3,
                        verticalAlign: docx.VerticalAlign.CENTER,
                        children: [
                            new docx.Paragraph({
                                children: [new docx.ImageRun({ data: img2, transformation: { width: 50, height: 50 } })],
                                alignment: docx.AlignmentType.CENTER,
                                spacing: { after: 0 }
                            })
                        ]
                    }),
                ]
            }),
            // Fila 2: (merged) | Subtítulo (colspan 2) | (merged)
            new docx.TableRow({
                children: [
                    // Col 2: Subtítulo (colspan 2 para ocupar col 2 y 3)
                    new docx.TableCell({
                        width: { size: 5448, type: docx.WidthType.DXA },
                        columnSpan: 2,
                        verticalAlign: docx.VerticalAlign.CENTER,
                        children: [
                            new docx.Paragraph({
                                children: [new docx.TextRun({ text: "FLORENCIA- CAQUETÁ", bold: true, size: 16, font: "Verdana" })],
                                alignment: docx.AlignmentType.CENTER,
                                spacing: { after: 0 }
                            })
                        ]
                    })
                ]
            }),
            // Fila 3: (merged) | Topic (colspan 2) | (merged)
            new docx.TableRow({
                children: [
                    // Col 2-3: Topic (colspan 2)
                    new docx.TableCell({
                        width: { size: 5448, type: docx.WidthType.DXA },
                        columnSpan: 2,
                        verticalAlign: docx.VerticalAlign.CENTER,
                        borders: {
                            bottom: { style: docx.BorderStyle.SINGLE, size: 4 }
                        },
                        children: [
                            new docx.Paragraph({
                                children: [
                                    new docx.TextRun({ text: "Topic: ", bold: true, size: 16, font: "Verdana" }),
                                    new docx.TextRun({ text: "Sopa de Letras", bold: true, size: 16, font: "Verdana" })
                                ],
                                spacing: { after: 0 }
                            })
                        ]
                    })
                ]
            }),
            // Fila 4: TERM (con DCT debajo) | TEACHER | SUBJECT | Grade
            new docx.TableRow({
                children: [
                    // Col 1: TERM y DCT.241-50-50.30 - ancho: 1555 twips
                    new docx.TableCell({
                        width: { size: 1555, type: docx.WidthType.DXA },
                        verticalAlign: docx.VerticalAlign.CENTER,
                        borders: {
                            bottom: { style: docx.BorderStyle.SINGLE, size: 4 }
                        },
                        children: [
                            new docx.Paragraph({
                                children: [
                                    new docx.TextRun({ text: "TERM", bold: true, size: 16, font: "Verdana" })
                                ],
                                alignment: docx.AlignmentType.LEFT,
                                spacing: { after: 0 }
                            }),
                            new docx.Paragraph({
                                children: [
                                    new docx.TextRun({ text: "DCT.241-50-50.30", size: 18, font: "Verdana" })
                                ],
                                alignment: docx.AlignmentType.LEFT,
                                spacing: { after: 0 }
                            })
                        ]
                    }),
                    // Col 2: TEACHER - ancho: 5448 twips
                    new docx.TableCell({
                        width: { size: 5448, type: docx.WidthType.DXA },
                        verticalAlign: docx.VerticalAlign.CENTER,
                        borders: {
                            bottom: { style: docx.BorderStyle.SINGLE, size: 4 }
                        },
                        children: [
                            new docx.Paragraph({
                                children: [
                                    new docx.TextRun({ text: "TEACHER: ", bold: true, size: 16, font: "Verdana" }),
                                    new docx.TextRun({ text: "Jhonatan Stiven Guzman Olaya", size: 16, font: "Verdana" })
                                ],
                                spacing: { after: 0 }
                            })
                        ]
                    }),
                    // Col 3: SUBJECT - ancho: 2206 twips
                    new docx.TableCell({
                        width: { size: 2206, type: docx.WidthType.DXA },
                        verticalAlign: docx.VerticalAlign.CENTER,
                        borders: {
                            bottom: { style: docx.BorderStyle.SINGLE, size: 4 }
                        },
                        children: [
                            new docx.Paragraph({
                                children: [
                                    new docx.TextRun({ text: "SUBJECT: ", bold: true, size: 16, font: "Verdana" }),
                                    new docx.TextRun({ text: "Matemática", size: 16, font: "Verdana" })
                                ],
                                spacing: { after: 0 }
                            })
                        ]
                    }),
                    // Col 4: Grade - ancho: 1559 twips
                    new docx.TableCell({
                        width: { size: 1559, type: docx.WidthType.DXA },
                        verticalAlign: docx.VerticalAlign.CENTER,
                        borders: {
                            bottom: { style: docx.BorderStyle.SINGLE, size: 4 }
                        },
                        children: [
                            new docx.Paragraph({
                                children: [
                                    new docx.TextRun({ text: "Grade: ", bold: true, size: 16, font: "Verdana" }),
                                    new docx.TextRun({ text: "7", size: 16, font: "Verdana" })
                                ],
                                alignment: docx.AlignmentType.LEFT,
                                spacing: { after: 0 }
                            })
                        ]
                    })
                ]
            })
        ]
    });
}

function createGridTable(grid, difficulty) {
    const rows = [];
    const cellSize = difficulty === 'bachillerato' ? 400 : 500; // Twips roughly

    for (let r = 0; r < grid.length; r++) {
        const cells = [];
        for (let c = 0; c < grid[r].length; c++) {
            cells.push(new docx.TableCell({
                children: [
                    new docx.Paragraph({
                        children: [new docx.TextRun({ text: grid[r][c], bold: true, size: 24, font: "Verdana" })],
                        alignment: docx.AlignmentType.CENTER
                    })
                ],
                verticalAlign: docx.VerticalAlign.CENTER,
                width: { size: cellSize, type: docx.WidthType.DXA },
                height: { value: 300, rule: docx.HeightRule.ATLEAST }, // Min height
                borders: {
                    top: { style: docx.BorderStyle.SINGLE, size: 1 },
                    bottom: { style: docx.BorderStyle.SINGLE, size: 1 },
                    left: { style: docx.BorderStyle.SINGLE, size: 1 },
                    right: { style: docx.BorderStyle.SINGLE, size: 1 }
                }
            }));
        }
        rows.push(new docx.TableRow({ children: cells }));
    }

    return new docx.Table({
        rows: rows,
        alignment: docx.AlignmentType.CENTER
    });
}

function createWordsTable(words) {
    // 3 Columns word list
    const cols = 3;
    const rowsCount = Math.ceil(words.length / cols);
    const tableRows = [];

    for (let i = 0; i < rowsCount; i++) {
        const cells = [];
        for (let j = 0; j < cols; j++) {
            const wordIndex = i + (j * rowsCount);
            const text = words[wordIndex] || "";
            cells.push(new docx.TableCell({
                children: [new docx.Paragraph({ children: [new docx.TextRun({ text: text, size: 18, font: "Verdana" })] })],
                borders: {
                    top: { style: docx.BorderStyle.NONE },
                    bottom: { style: docx.BorderStyle.NONE },
                    left: { style: docx.BorderStyle.NONE },
                    right: { style: docx.BorderStyle.NONE }
                },
                width: { size: 33, type: docx.WidthType.PERCENTAGE }
            }));
        }
        tableRows.push(new docx.TableRow({ children: cells }));
    }

    return new docx.Table({
        rows: tableRows,
        width: { size: 100, type: docx.WidthType.PERCENTAGE }
    });
}

async function preview() {
    const wordsObj = parseWordList('wordsBulk');
    const validWordsObj = wordsObj.filter(w => /^[A-ZÁÉÍÓÚÑ]+$/i.test(w.search));

    if (validWordsObj.length === 0) return showAlert('Agrega palabras para previsualizar', 'error');

    const searchWords = validWordsObj.map(w => w.search);
    const grid = generateGrid(searchWords, Date.now());

    // Simple HTML preview since docx preview is hard
    let html = '<div style="display:flex;justify-content:center;margin:20px;overflow:auto;"><table style="border-collapse:collapse;">';
    grid.forEach(row => {
        html += '<tr>' + row.map(c => `<td style="border:1px solid #333;width:25px;height:25px;text-align:center;font-weight:bold;">${c}</td>`).join('') + '</tr>';
    });
    html += '</table></div>';

    // We don't have a specific preview div in the original HTML, usually handled by alert or existing structure
    // Let's create a modal or just append
    const container = document.querySelector('.container');
    let prevDiv = document.getElementById('preview-div');
    if (!prevDiv) {
        prevDiv = document.createElement('div');
        prevDiv.id = 'preview-div';
        container.appendChild(prevDiv);
    }
    prevDiv.innerHTML = html;
    prevDiv.scrollIntoView();
}
