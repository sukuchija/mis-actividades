// --- CONFIGURACIÓN Y DATOS DE LA HISTORIA (EXPANDIDA) ---
// Campaña: "Las Crónicas de los Números Perdidos"

const gameData = {
    "biomes": {
        "forest": { "icon": "🌲", "color": "biome-forest" },     // Bosque
        "desert": { "icon": "🌵", "color": "biome-desert" },     // Desierto
        "water": { "icon": "🌊", "color": "biome-water" },       // Agua
        "mountain": { "icon": "🌋", "color": "biome-mountain" }, // Montaña
        "ruins": { "icon": "🏰", "color": "biome-castle" },      // Ruinas
        "danger": { "icon": "🧟", "color": "biome-desert" },     // Enemigos
        "loot": { "icon": "💎", "color": "biome-forest" },       // Tesoro
        "magic": { "icon": "🔮", "color": "biome-end" }          // Magia
    },

    "story": {
        // ------------------------------------------------------------------
        // PRÓLOGO: LA LLEGADA
        // ------------------------------------------------------------------
        "start": {
            "text": "⚔️ **PRÓLOGO: La Llamada del Destino**<br><br>Vuestro grupo desembarca en las costas de <em>Arithmos</em>, una isla olvidada donde las leyes de la física obedecen a reglas matemáticas antiguas. El Rey ha prometido riquezas a quien recupere la **Corona del Infinito**.<br><br>Ante vosotros se abren dos caminos principales.",
            "mapAction": "A1",
            "options": [
                { "text": "Entrar al Bosque de los Racionales (Camino del Orden)", "target": "act1_forest_entry" },
                { "text": "Escalar los Picos Irracionales (Camino del Caos)", "target": "act1_mountain_entry" }
            ]
        },

        // ------------------------------------------------------------------
        // ACTO 1: EL CAMINO DEL ORDEN (Racionales)
        // ------------------------------------------------------------------
        "act1_forest_entry": {
            "text": "🌲 **BOSQUE DE LA DIVISIÓN**<br><br>Los árboles aquí crecen en patrones fractales perfectos. Encontráis a un **Druida** que está partiendo hogazas de pan para alimentar a sus bestias, pero parece confundido.",
            "mapAction": "B1",
            "question": {
                "context": "El Druida tiene 5 hogazas de pan y debe alimentar a 4 osos por igual.",
                "prompt": "¿Qué número racional representa la cantidad exacta que recibe cada oso?",
                "options": ["A) 0.8", "B) 5/4 (1.25)", "C) 4/5 (0.8)", "D) 1.5"],
                "answer": "B) 5/4 (1.25)"
            },
            "gm_note": "Es una división simple (5 ÷ 4). Si fallan, los osos atacan.",
            "options": [
                { "text": "Ayudar al Druida (Correcto)", "target": "act2_river" },
                { "text": "Fallar y Huir", "target": "fail_minor_forest" }
            ]
        },

        "fail_minor_forest": {
            "text": "Los osos rugen insatisfechos y os persiguen. Perdéis provisiones en la huida, pero lográis llegar al río.",
            "gm_note": "El grupo pierde 1 HP.",
            "options": [{ "text": "Llegar al Río", "target": "act2_river" }]
        },

        // ------------------------------------------------------------------
        // ACTO 1: EL CAMINO DEL CAOS (Irracionales)
        // ------------------------------------------------------------------
        "act1_mountain_entry": {
            "text": "🌋 **ACANTILADO DE PITÁGORAS**<br><br>El viento aúlla fórmulas incomprensibles. El sendero está cortado por un abismo triangular. Un puente de luz requiere que digáis su longitud exacta para materializarse.",
            "mapAction": "B2",
            "question": {
                "context": "El abismo forma un triángulo rectángulo con catetos de 3 metros y 4 metros.",
                "prompt": "¿Cuál es la longitud de la hipotenusa (el puente)?",
                "options": ["A) 5 metros", "B) 7 metros", "C) √7 metros", "D) 12 metros"],
                "answer": "A) 5 metros"
            },
            "gm_note": "Teorema de Pitágoras: √(3² + 4²) = √25 = 5. (Terna pitagórica 3-4-5).",
            "options": [
                { "text": "Invocar Puente (Correcto)", "target": "act2_cave" },
                { "text": "Caer al Vacío", "target": "fail_minor_mountain" }
            ]
        },

        "fail_minor_mountain": {
            "text": "Calculáis mal y el puente se desvanece a mitad de camino. Lográis aferraros al borde, pero sufrís heridas.",
            "gm_note": "El grupo pierde 1 HP.",
            "options": [{ "text": "Escalar hacia la Cueva", "target": "act2_cave" }]
        },

        // ------------------------------------------------------------------
        // ACTO 2: CONVERGENCIA INTERMEDIA
        // ------------------------------------------------------------------
        "act2_river": {
            "text": "🌊 **RÍO DE LOS DECIMALES**<br><br>El camino os lleva a un río de mercurio líquido. Un barquero esquelético exige un pago. 'Solo acepto monedas cuyo valor sea un decimal finito'.",
            "mapAction": "C3",
            "question": {
                "context": "Tenéis monedas con los siguientes valores grabados: {1/3, 5/2, √2, π}.",
                "prompt": "¿Cuál de estas fracciones es un decimal finito (exacto)?",
                "options": ["A) 1/3 (0.333...)", "B) √2 (1.414...)", "C) 5/2 (2.5)", "D) π (3.141...)"],
                "answer": "C) 5/2 (2.5)"
            },
            "options": [
                { "text": "Pagar (Correcto)", "target": "act3_ruins" },
                { "text": "El Barquero se enfurece", "target": "fail_medium" }
            ]
        },

        "act2_cave": {
            "text": "💎 **CUEVA DE LOS CRISTALES NEGATIVOS**<br><br>Entráis en una caverna oscura. La temperatura desciende bajo cero. Un Espectro de Hielo bloquea la salida. 'Para pasar, debéis equilibrar la balanza térmica'.",
            "mapAction": "C4",
            "question": {
                "context": "La temperatura actual es -8°C. El espectro lanzará un hechizo de +5°C.",
                "prompt": "¿Cuál será la temperatura final?",
                "options": ["A) -13°C", "B) -3°C", "C) 3°C", "D) 13°C"],
                "answer": "B) -3°C"
            },
            "gm_note": "Suma de enteros: -8 + 5 = -3.",
            "options": [
                { "text": "Romper el Hechizo (Correcto)", "target": "act3_ruins" },
                { "text": "Congelarse", "target": "fail_medium" }
            ]
        },

        "fail_medium": {
            "text": "💥 **¡DAÑO CRÍTICO!**<br><br>La magia salvaje os golpea con fuerza. Parte de vuestro equipo queda inutilizado.",
            "gm_note": "El grupo pierde 2 HP. ¡Cuidado, están débiles!",
            "options": [{ "text": "Avanzar penosamente...", "target": "act3_ruins" }]
        },

        // ------------------------------------------------------------------
        // ACTO 3: LAS RUINAS CENTRALES
        // ------------------------------------------------------------------
        "act3_ruins": {
            "text": "🏰 **CIUDADELA DE LA IGUALDAD**<br><br>Ambos caminos convergen en las ruinas de una antigua fortaleza. En el patio central, una estatua gigante sostiene una balanza desequilibrada. Es un acertijo algebraico.",
            "mapAction": "D5",
            "question": {
                "context": "En un platillo hay una caja misteriosa (X) y 3 pesas de 1kg. En el otro hay 10 pesas de 1kg. La balanza está equilibrada.",
                "prompt": "¿Cuánto pesa la caja misteriosa (X)?",
                "options": ["A) 3 kg", "B) 7 kg", "C) 10 kg", "D) 13 kg"],
                "answer": "B) 7 kg"
            },
            "gm_note": "Ecuación simple: X + 3 = 10 -> X = 7.",
            "options": [
                { "text": "Resolver Enigma", "target": "act4_pre_boss" },
                { "text": "Forzar la Puerta (Fallo)", "target": "fail_major" }
            ]
        },

        "fail_major": {
            "text": "La estatua cobra vida y golpea el suelo. El impacto os lanza contra la pared.",
            "gm_note": "El grupo pierde 2 HP. Si llegan a 0, mueren.",
            "options": [{ "text": "Levantarse y seguir", "target": "act4_pre_boss" }]
        },

        // ------------------------------------------------------------------
        // ACTO 4: ANTESALA DEL JEFE
        // ------------------------------------------------------------------
        "act4_pre_boss": {
            "text": "🔮 **EL VÓRTICE DEL INFINITO**<br><br>Habéis llegado al salón del trono. Flotando en el aire está el **Señor del Infinito**, una entidad hecha de números puros que cambian constantemente. Protege la Corona.",
            "mapAction": "E5",
            "gm_note": "Preparad al grupo. Es la batalla final. Deben usar todo lo aprendido.",
            "options": [
                { "text": "Desafiar al Jefe", "target": "boss_phase1" }
            ]
        },

        // ------------------------------------------------------------------
        // JEFE FINAL
        // ------------------------------------------------------------------
        "boss_phase1": {
            "text": "👿 **JEFE: EL SEÑOR DEL INFINITO**<br><br><em>'¡Soy el principio y el fin! ¡Soy Alpha y Omega!'</em><br>El Jefe lanza un ataque de **Raíces Cuadradas**. Os encierra en una jaula de energía.",
            "mapAction": "F6",
            "question": {
                "context": "Para romper los barrotes, debéis encontrar el valor de √144 + 5².",
                "prompt": "Calculad: 12 + 25",
                "options": ["A) 17", "B) 27", "C) 37", "D) 169"],
                "answer": "C) 37"
            },
            "options": [
                { "text": "Contraatacar (Correcto)", "target": "victory" },
                { "text": "Recibir el golpe", "target": "game_over" }
            ]
        },

        // ------------------------------------------------------------------
        // FINALES
        // ------------------------------------------------------------------
        "victory": {
            "text": "👑 **¡VICTORIA LEGENDARIA!**<br><br>El Señor del Infinito se disuelve en una lluvia de números dorados. La Corona cae en vuestras manos. Habéis demostrado que el conocimiento es el verdadero poder.",
            "mapAction": "F6",
            "gm_note": "¡Felicidades! Entregar recomenas (puntos extra, dulces) a los estudiantes.",
            "options": [
                { "text": "Jugar Nueva Partida", "target": "start" }
            ]
        },

        "game_over": {
            "text": "💀 **GAME OVER**<br><br>Vuestros cálculos fallaron. La realidad colapsa sobre vosotros. Vuestra historia termina aquí... por ahora.",
            "gm_note": "El grupo ha sido derrotado. Animadles a estudiar y volver a intentarlo.",
            "options": [
                { "text": "Reintentar Aventura", "target": "start" }
            ]
        }
    }
};
