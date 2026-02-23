
        // Configuración Global
        let currentDiff = 'dificil';
        const CONFIG = {
            medio: { size: 15, directions: [[0, 1], [1, 0], [1, 1]] },
            dificil: { size: 20, directions: [[0, 1], [1, 0], [1, 1], [1, -1]] },
            bachillerato: { size: 25, directions: [[0, 1], [1, 0], [1, 1], [1, -1], [-1, 1], [-1, -1], [0, -1], [-1, 0]] }
        };

        // Inicialización
        document.addEventListener('DOMContentLoaded', updateCounts);

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

        function updateCounts() {
            const s = parseInput('studentsBulk');
            const w = parseInput('wordsBulk');
            const validW = w.filter(word => /^[A-ZÁÉÍÓÚÑ]+$/i.test(word));

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

        async function generateAndZip() {
            const students = parseInput('studentsBulk');
            const words = parseInput('wordsBulk', true).filter(w => /^[A-ZÁÉÍÓÚÑ]+$/i.test(w));

            if (students.length === 0 || words.length === 0) {
                return showAlert('Faltan estudiantes o palabras válidas', 'error');
            }

            const zip = new JSZip();
            const progressContainer = document.getElementById('progressContainer');
            const progressBar = document.getElementById('progressBar');
            const statusText = document.getElementById('statusText');

            progressContainer.style.display = 'block';
            statusText.innerText = 'Iniciando generación...';

            // Generar cada archivo
            for (let i = 0; i < students.length; i++) {
                const student = students[i];
                const pct = Math.round(((i + 1) / students.length) * 100);

                progressBar.style.width = `${pct}%`;
                statusText.innerText = `Generando sopa de letras para: ${student} (${i + 1}/${students.length})`;

                await new Promise(r => setTimeout(r, 10));

                const seed = Date.now() + i * 777;
                const grid = generateGrid(words, seed);
                const htmlContent = createDocContent(student, grid, words);

                zip.file(`Sopa_${student.replace(/[^a-z0-9]/gi, '_')}.doc`, htmlContent);
            }

            statusText.innerText = 'Comprimiendo archivos ZIP...';

            zip.generateAsync({ type: "blob" }).then(function (content) {
                saveAs(content, "Sopas_De_Letras_Clase.zip");
                statusText.innerText = '¡Descarga lista! Verifica tu carpeta de descargas.';
                showAlert('Archivo ZIP generado exitosamente', 'success');
                setTimeout(() => { progressContainer.style.display = 'none'; statusText.innerText = ''; }, 5000);
            });
        }

        function createDocContent(name, grid, words) {
            let rows = '';
            grid.forEach(row => {
                rows += '<tr>' + row.map(c => `<td>${c}</td>`).join('') + '</tr>';
            });

            return `
            <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
            <head><meta charset='utf-8'><title>${name}</title>
            <style>
                body { font-family: Arial; padding: 40px; }
                h1 { text-align: center; font-size: 24pt; color: #333; }
                .meta { text-align: center; font-size: 14pt; margin-bottom: 30px; color: #666; }
                table { border-collapse: collapse; margin: 0 auto; border: 3px solid black; }
                td { width: 30px; height: 30px; border: 1px solid #555; text-align: center; font-size: 14pt; font-weight: bold; }
                .words { margin-top: 40px; columns: 3; font-size: 12pt; }
            </style>
            </head>
            <body>
                <h1>Sopa de Letras - Evaluación</h1>
                <div class="meta">Estudiante: <strong>${name}</strong> | Nivel: ${currentDiff.toUpperCase()}</div>
                <table>${rows}</table>
                <div class="words"><h3>Palabras a buscar:</h3><ul>${words.map(w => `<li>${w}</li>`).join('')}</ul></div>
            </body></html>`;
        }

        async function preview() {
            const words = parseInput('wordsBulk', true).filter(w => /^[A-ZÁÉÍÓÚÑ]+$/i.test(w));
            if (words.length === 0) return showAlert('Agrega palabras para previsualizar', 'error');

            const grid = generateGrid(words, Date.now());
            const area = document.getElementById('previewArea');
            area.style.display = 'block';

            let html = `<h3 style="margin-bottom:15px">Vista Previa (${currentDiff})</h3><div class="grid-preview"><table>`;
            grid.forEach(row => {
                html += '<tr>' + row.map(c => `<td>${c}</td>`).join('') + '</tr>';
            });
            html += '</table></div>';
            area.innerHTML = html;
            area.scrollIntoView({ behavior: 'smooth' });
        }
