/**
 * Batalla Naval en Q - Script logic
 * Fixes: Wrapped logic in DOMContentLoaded, unified event listeners, fixed syntax errors in export string.
 */

document.addEventListener('DOMContentLoaded', () => {
    // State management
    let generatedCanvases = [];
    
    // DOM Elements
    const btnGenerate = document.getElementById('btnGenerate');
    const btnDownload = document.getElementById('btnDownload');
    const studentListInput = document.getElementById('studentList');
    const previewArea = document.getElementById('preview-area');

    // Event Listeners
    btnGenerate.addEventListener('click', generateBoards);
    btnDownload.addEventListener('click', exportToWord);

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

    /**
     * Generates a board for each student name entered
     */
    function generateBoards() {
        const text = studentListInput.value;
        const names = text.split('\n').filter(n => n.trim() !== '');
        
        // Reset state
        previewArea.innerHTML = '';
        generatedCanvases = [];
        btnDownload.classList.remove('visible');

        if (names.length === 0) {
            alert("Por favor ingresa al menos un nombre para generar los tableros.");
            return;
        }

        names.forEach(name => {
            // Create card container
            const card = document.createElement('div');
            card.className = 'student-card';

            const title = document.createElement('h3');
            title.textContent = `Capitán: ${name}`;

            const canvas = document.createElement('canvas');
            canvas.width = 500;
            canvas.height = 500;

            // Draw the math board
            drawCartesianPlane(canvas);

            // Append elements
            card.appendChild(title);
            card.appendChild(canvas);
            previewArea.appendChild(card);

            // Store data for export
            generatedCanvases.push({ 
                name: name.trim(), 
                dataUrl: canvas.toDataURL('image/png') 
            });
        });

        // Show download button
        btnDownload.classList.add('visible');
    }

    /**
     * Draws the Cartesian plane on the given canvas
     */
    function drawCartesianPlane(canvas) {
        const ctx = canvas.getContext('2d');
        const width = canvas.width;
        const height = canvas.height;
        const centerX = width / 2;
        const centerY = height / 2;
        const step = 40; // Pixels per integer unit

        // White background
        ctx.fillStyle = "white";
        ctx.fillRect(0, 0, width, height);

        // 1. Secondary Grid (0.5 units) - Light Gray
        ctx.beginPath();
        ctx.strokeStyle = "#e0e0e0";
        ctx.lineWidth = 1;
        for (let x = 0; x <= width; x += step / 2) {
            ctx.moveTo(x, 0); ctx.lineTo(x, height);
        }
        for (let y = 0; y <= height; y += step / 2) {
            ctx.moveTo(0, y); ctx.lineTo(width, y);
        }
        ctx.stroke();

        // 2. Primary Grid (Integer units) - Medium Gray
        ctx.beginPath();
        ctx.strokeStyle = "#a0a0a0";
        ctx.lineWidth = 1;
        // Align with center
        for (let x = centerX % step; x <= width; x += step) {
            ctx.moveTo(x, 0); ctx.lineTo(x, height);
        }
        for (let y = centerY % step; y <= height; y += step) {
            ctx.moveTo(0, y); ctx.lineTo(width, y);
        }
        ctx.stroke();

        // 3. Axes X and Y - Strong Black
        ctx.beginPath();
        ctx.strokeStyle = "#000";
        ctx.lineWidth = 2;
        ctx.moveTo(centerX, 0); ctx.lineTo(centerX, height); // Y Axis
        ctx.moveTo(0, centerY); ctx.lineTo(width, centerY);   // X Axis
        ctx.stroke();

        // 4. Numbers
        ctx.font = "bold 12px Arial";
        ctx.fillStyle = "#000";
        ctx.textAlign = "center";
        
        // X Axis labels
        ctx.textBaseline = "top";
        let unit = 0;
        // Right side
        for (let x = centerX; x < width; x += step) {
            if (unit !== 0) ctx.fillText(unit, x, centerY + 6);
            unit++;
        }
        // Left side
        unit = 0;
        for (let x = centerX; x > 0; x -= step) {
            if (unit !== 0) ctx.fillText(unit, x, centerY + 6);
            unit--;
        }

        // Y Axis labels
        ctx.textBaseline = "middle";
        ctx.textAlign = "right";
        unit = 0;
        // Up
        for (let y = centerY; y > 0; y -= step) {
            if (unit !== 0) ctx.fillText(unit, centerX - 6, y);
            unit++;
        }
        // Down
        unit = 0;
        for (let y = centerY; y < height; y += step) {
            if (unit !== 0) ctx.fillText(unit, centerX - 6, y);
            unit--;
        }
        
        // Origin label
        ctx.fillText("0", centerX - 5, centerY + 5);
    }

    /**
     * Exports the generated boards to a Word (.docx) file using template
     */
    async function exportToWord() {
        if (generatedCanvases.length === 0) {
            alert('Primero debes generar los tableros.');
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

            // Convertir imágenes de canvas a base64 y agregarlas al documento
            const imagePromises = generatedCanvases.map(async (item, index) => {
                const imageData = await getImageAsArrayBuffer(item.dataUrl);
                const imageName = `image${index + 1}.png`;
                const imagePath = `word/media/${imageName}`;
                finalZip.file(imagePath, imageData);
                return { name: item.name, imagePath, imageName, imageRId: `rId${index + 100}` };
            });

            const imageData = await Promise.all(imagePromises);

            // Modificar document.xml.rels para agregar las imágenes
            const relsFile = 'word/_rels/document.xml.rels';
            if (finalZip.files[relsFile]) {
                let relsContent = await finalZip.files[relsFile].async('string');
                // Contar relaciones existentes
                const existingRels = (relsContent.match(/Relationship Id="rId\d+"/g) || []).length;
                imageData.forEach((img, idx) => {
                    const rId = `rId${existingRels + idx + 1}`;
                    img.imageRId = rId;
                    const relEntry = `<Relationship Id="${rId}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/${img.imageName}"/>`;
                    relsContent = relsContent.replace('</Relationships>', relEntry + '</Relationships>');
                });
                finalZip.file(relsFile, relsContent);
            }

            // Modificar el document.xml para insertar el contenido
            const documentFile = 'word/document.xml';
            if (finalZip.files[documentFile]) {
                let xmlContent = await finalZip.files[documentFile].async('string');

                // Generar el XML del contenido
                const contentXML = generateNavalContentXML(imageData);

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
            saveAs(finalBlob, `Tableros_Batalla_Naval_${new Date().toISOString().slice(0,10)}.docx`);
            alert(`¡Documento generado para ${generatedCanvases.length} estudiante(s)!`);
        } catch (e) {
            console.error(e);
            alert('Error al generar el documento: ' + e.message);
        }
    }

    async function getImageAsArrayBuffer(dataUrl) {
        const res = await fetch(dataUrl);
        const blob = await res.blob();
        return await blob.arrayBuffer();
    }

    function generateNavalContentXML(imageData) {
        let contentXML = '';
        const titleSize = "32";
        const subtitleSize = "24";
        const textSize = "22";

        imageData.forEach((item, index) => {
            // Salto de página
            if (index > 0) {
                contentXML += '<w:p><w:r><w:br w:type="page"/></w:r></w:p>';
            }

            // Header: Estudiante + Título
            contentXML += '<w:tbl><w:tblPr><w:tblW w:w="0" w:type="auto"/><w:tblBorders><w:top w:val="none"/><w:left w:val="none"/><w:bottom w:val="none"/><w:right w:val="none"/><w:insideH w:val="none"/><w:insideV w:val="none"/></w:tblBorders></w:tblPr><w:tblGrid><w:gridCol w:w="6000"/><w:gridCol w:w="3500"/></w:tblGrid><w:tr><w:tc><w:tcPr><w:tcW w:w="6000" w:type="dxa"/><w:vAlign w:val="bottom"/></w:tcPr><w:p><w:r><w:rPr><w:b/><w:sz w:val="' + subtitleSize + '"/></w:rPr><w:t xml:space="preserve">Capitán: </w:t></w:r><w:r><w:rPr><w:sz w:val="' + subtitleSize + '"/><w:u w:val="single"/></w:rPr><w:t xml:space="preserve">  ' + escapeXml(item.name) + '  </w:t></w:r></w:p></w:tc><w:tc><w:tcPr><w:tcW w:w="3500" w:type="dxa"/><w:vAlign w:val="bottom"/></w:tcPr><w:p><w:pPr><w:jc w:val="right"/></w:pPr><w:r><w:rPr><w:b/><w:caps/><w:color w:val="2F5496"/><w:sz w:val="' + titleSize + '"/></w:rPr><w:t>Batalla Naval</w:t></w:r></w:p></w:tc></w:tr></w:tbl>';

            // Instrucciones
            contentXML += '<w:p><w:pPr><w:spacing w:after="100"/></w:pPr><w:r><w:rPr><w:sz w:val="' + textSize + '"/><w:i/></w:rPr><w:t>Instrucciones: Ubica tus barcos usando coordenadas racionales (ej: 2.5, -1/2).</w:t></w:r></w:p>';

            // Imagen del plano cartesiano (formato DrawingML simplificado)
            contentXML += '<w:p><w:pPr><w:jc w:val="center"/><w:spacing w:after="200"/></w:pPr><w:r><w:drawing><wp:inline distT="0" distB="0" distL="0" distR="0"><wp:extent cx="4750000" cy="4750000"/><wp:effectExtent l="0" t="0" r="0" b="0"/><wp:docPr id="' + (index + 1) + '" name="Plano ' + (index + 1) + '"/><wp:cNvGraphicFramePr><a:graphicFrameLocks xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" noChangeAspect="1"/></wp:cNvGraphicFramePr><a:graphic xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"><a:graphicData uri="http://schemas.openxmlformats.org/officeDocument/2006/picture"><pic:pic xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:nvPicPr><pic:cNvPr id="' + (index + 1) + '" name="Plano"/><pic:cNvPicPr/></pic:nvPicPr><pic:blipFill><a:blip r:embed="' + item.imageRId + '"/><a:stretch><a:fillRect/></a:stretch></pic:blipFill><pic:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="4750000" cy="4750000"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr></pic:pic></a:graphicData></a:graphic></wp:inline></w:drawing></w:r></w:p>';

            // Firma
            contentXML += '<w:p><w:pPr><w:spacing w:before="400"/><w:jc w:val="center"/></w:pPr></w:p><w:p><w:pPr><w:jc w:val="center"/></w:pPr><w:r><w:rPr><w:sz w:val="' + textSize + '"/></w:rPr><w:t>_____________________________________</w:t></w:r></w:p><w:p><w:pPr><w:jc w:val="center"/></w:pPr><w:r><w:rPr><w:sz w:val="' + textSize + '"/><w:i/></w:rPr><w:t>Firma del Oponente (Testigo)</w:t></w:r></w:p>';
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
