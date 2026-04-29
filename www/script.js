document.addEventListener("DOMContentLoaded", () => {
    const generateBtn = document.getElementById("generate-btn");
    const svgMap = document.getElementById("hex-map");

    // Größe und Proportionen eines Hexagons
    const HEX_SIZE = 60;
    const HEX_WIDTH = Math.sqrt(3) * HEX_SIZE;
    const HEX_HEIGHT = 2 * HEX_SIZE;
    /*region BaseGame*/
    const resourceCounts = {
        "hex-desert": 1,
        "hex-lumber": 4,
        "hex-brick": 3,
        "hex-wool": 4,
        "hex-grain": 4,
        "hex-ore": 3
    };

    //füge die Ressourcen hinzu
    const baseResources = Object.entries(resourceCounts).flatMap(
        ([resource, count]) => Array(count).fill(resource)
    );

    // Inventar der Zahlenchips für das Basisspiel (Insgesamt 18 Stück)
    const numberCounts = {
        2: 1,
        3: 2,
        4: 2,
        5: 2,
        6: 2,
        //7 : 0,
        8: 2,
        9: 2,
        10: 2,
        11: 2,
        12: 1
    };

    // Umwandlung in ein flaches Array [2, 3, 3, 4, 4, 5, 5, ...]
    const baseNumbers = Object.entries(numberCounts).flatMap(
        ([num, count]) => Array(count).fill(parseInt(num))
    );

    // Das Axiale Koordinatensystem (q, r) für die typische Form
    const gridCoords = [
        [0, -2], [1, -2], [2, -2],             // Reihe 1 (3 Hexagone)
        [-1, -1], [0, -1], [1, -1], [2, -1],   // Reihe 2 (4 Hexagone)
        [-2, 0], [-1, 0], [0, 0], [1, 0], [2, 0], // Reihe 3 (5 Hexagone - Mitte)
        [-2, 1], [-1, 1], [0, 1], [1, 1],   // Reihe 4 (4 Hexagone)
        [-2, 2], [-1, 2], [0, 2]              // Reihe 5 (3 Hexagone)
    ];

    // Die 6 Richtungen im Axialsytem (q, r), um Nachbarn zu finden
    const hexDirections = [
        [+1, 0], [+1, -1], [0, -1],
        [-1, 0], [-1, +1], [0, +1]
    ];

    // Feste Hafenpositionen für das Basisspiel
    // Kante 0: Rechts (0°)
    // Kante 1: Unten Rechts (60°)
    // Kante 2: Unten Links (120°)
    // Kante 3: Links (180°)
    // Kante 4: Oben Links (240°)
    // Kante 5: Oben Rechts (300°)
    const baseHarbors = [
        { q: 1, r: -2, edge: 4, text: "3:1", color: "var(--color-3to1)" },
        { q: 2, r: -2, edge: 5, text: "3:1", color: "var(--color-3to1)" },
        { q: 2, r: -1, edge: 0, text: "Lehm", color: "var(--color-brick)" },
        { q: 1, r: 1, edge: 0, text: "Holz", color: "var(--color-lumber)" },
        { q: 0, r: 2, edge: 1, text: "3:1", color: "var(--color-3to1)" },
        { q: -1, r: 2, edge: 2, text: "Weizen", color: "var(--color-grain)" },
        { q: -2, r: 1, edge: 2, text: "Erz", color: "var(--color-ore)" },
        { q: -2, r: 0, edge: 3, text: "3:1", color: "var(--color-3to1)" },
        { q: -1, r: -1, edge: 4, text: "Schaf", color: "var(--color-wool)" },
    ];


    // Hilfsfunktion: Mischt ein Array zufällig (Fisher-Yates Algorithmus)
    function shuffleArray(array) {
        let shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }
    /*endregion base*/
    /*region Base5to6*/
    // --- DATEN: 5-6 SPIELER ERWEITERUNG ---

    // 1. Inventar (Insgesamt 30 Kacheln: +2 pro Sorte, +1 Wüste)
    const resourceCounts5to6 = {
        "hex-desert": 2, "hex-lumber": 6, "hex-brick": 5,
        "hex-wool": 6, "hex-grain": 6, "hex-ore": 5
    };
    const resources5to6 = Object.entries(resourceCounts5to6).flatMap(([res, count]) => Array(count).fill(res));

    // 2. Zahlenchips (Insgesamt 28 Stück für die 28 Rohstoff-Felder)
    const numberCounts5to6 = {
        2: 2, 3: 3, 4: 3, 5: 3, 6: 3,
        8: 3, 9: 3, 10: 3, 11: 3, 12: 2
    };
    const numbers5to6 = Object.entries(numberCounts5to6).flatMap(([num, count]) => Array(count).fill(parseInt(num)));

    // 3. Das neue, längliche Gitter (3, 4, 5, 6, 5, 4, 3)
    const gridCoords5to6 = [
        [1, -3], [2, -3], [3, -3],             // Reihe 1
        [0, -2], [1, -2], [2, -2], [3, -2],   // Reihe 2
        [-1, -1], [0, -1], [1, -1], [2, -1], [3, -1], // Reihe 3
        [-2, 0], [-1, 0], [0, 0], [1, 0], [2, 0], [3, 0], // Reihe 4
        [-2, 1], [-1, 1], [0, 1], [1, 1], [2, 1], // Reihe 5
        [-2, 2], [-1, 2], [0, 2], [1, 2],   // Reihe 6
        [-2, 3], [-1, 3], [0, 3]              // Reihe 7
    ];

    // 4. Die 11 Häfen für das große Brett
    // Kante 0: Rechts (0°)
    // Kante 1: Unten Rechts (60°)
    // Kante 2: Unten Links (120°)
    // Kante 3: Links (180°)
    // Kante 4: Oben Links (240°)
    // Kante 5: Oben Rechts (300°)
    const harbors5to6 = [
        { q: 1, r: -3, edge: 4, text: "3:1", color: "var(--color-3to1)" },
        { q: 2, r: -3, edge: 5, text: "Schaf", color: "var(--color-wool)" },
        { q: 3, r: -2, edge: 5, text: "3:1", color: "var(--color-3to1)" },
        { q: 3, r: 0, edge: 0, text: "3:1", color: "var(--color-3to1)" },
        { q: 2, r: 1, edge: 1, text: "Lehm", color: "var(--color-brick)" },
        { q: 0, r: 3, edge: 0, text: "Schaf", color: "var(--color-wool)" },
        { q: -1, r: 3, edge: 1, text: "Holz", color: "var(--color-lumber)" },
        { q: -2, r: 3, edge: 2, text: "3:1", color: "var(--color-3to1)" },
        { q: -2, r: 2, edge: 3, text: "Weizen", color: "var(--color-grain)" },
        { q: -2, r: 0, edge: 2, text: "3:1", color: "var(--color-3to1)" },
        { q: -1, r: -1, edge: 3, text: "Erz", color: "var(--color-ore)" },
    ];
    /*endregion Base5to6*/
    function getHexPolygonPoints(centerX, centerY, size) {
        let points = [];
        for (let i = 0; i < 6; i++) {
            const angle_deg = 60 * i - 30;
            const angle_rad = Math.PI / 180 * angle_deg;
            const x = centerX + size * Math.cos(angle_rad);
            const y = centerY + size * Math.sin(angle_rad);
            points.push(`${x},${y}`);
        }
        return points.join(" ");
    }

    function createRotatableGroup(cx, cy) {
        const container = document.createElementNS("http://www.w3.org/2000/svg", "g");
        container.setAttribute("class", "rotatable-content");
        container.setAttribute("data-cx", cx);
        container.setAttribute("data-cy", cy);
        if (window.isMapRotated) {
            container.setAttribute("transform", `rotate(-90, ${cx}, ${cy})`);
        }
        svgMap.appendChild(container);
        return container;
    }

    const portraitQuery = window.matchMedia("(orientation: portrait) and (max-width: 900px)");
    portraitQuery.addEventListener("change", (e) => {
        const isPortrait = e.matches;
        const isOPE = document.getElementById('ext-oceans-and-islands').checked || 
                      document.getElementById('ext-oceans-and-islands-5-6-player').checked ||
                      document.getElementById('ext-privateers-and-expeditions').checked ||
                      document.getElementById('ext-privateers-and-expeditions-5-6-player').checked;
        
        if (isOPE) {
            window.isMapRotated = isPortrait;
            
            if (isPortrait) {
                svgMap.classList.add("rotate-for-portrait");
                const vb = svgMap.getAttribute("data-viewbox-portrait");
                if (vb) svgMap.setAttribute("viewBox", vb);
            } else {
                svgMap.classList.remove("rotate-for-portrait");
                const vb = svgMap.getAttribute("data-viewbox-landscape");
                if (vb) svgMap.setAttribute("viewBox", vb);
            }

            const rotatables = svgMap.querySelectorAll(".rotatable-content");
            rotatables.forEach(group => {
                const cx = group.getAttribute("data-cx");
                const cy = group.getAttribute("data-cy");
                if (isPortrait) {
                    group.setAttribute("transform", `rotate(-90, ${cx}, ${cy})`);
                } else {
                    group.removeAttribute("transform");
                }
            });
        }
    });

    function drawHex(x, y, resourceClass) {
        const hex = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
        const points = getHexPolygonPoints(x, y, HEX_SIZE);
        hex.setAttribute("points", points);
        hex.setAttribute("class", resourceClass);
        svgMap.appendChild(hex);

        // Bild-Icon für die Standard-Ressourcen hinzufügen
        let iconFile = null;
        if (resourceClass === "hex-lumber") iconFile = "lumber.png";
        else if (resourceClass === "hex-brick") iconFile = "brick.png";
        else if (resourceClass === "hex-wool") iconFile = "wool.png";
        else if (resourceClass === "hex-grain") iconFile = "grain.png";
        else if (resourceClass === "hex-ore") iconFile = "ore.png";
        else if (resourceClass === "hex-gold") iconFile = "gold.png";

        if (iconFile) {
            let container = createRotatableGroup(x, y);
            const img = document.createElementNS("http://www.w3.org/2000/svg", "image");
            img.setAttribute("href", `./image/${iconFile}`);
            const imgSize = 44;
            img.setAttribute("x", x - imgSize / 2);
            img.setAttribute("y", y - imgSize / 2 - 15); // Leicht nach oben verschieben
            img.setAttribute("width", imgSize);
            img.setAttribute("height", imgSize);
            container.appendChild(img);
        }
    }

    function drawToken(x, y, number) {
        // Token leicht nach unten verschieben, da oben das Bild ist
        const tokenY = y + 25;

        let container = createRotatableGroup(x, y);

        // 1. Den Kreis zeichnen
        const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        circle.setAttribute("cx", x); // x-Mittelpunkt
        circle.setAttribute("cy", tokenY); // y-Mittelpunkt
        circle.setAttribute("r", 20); // Radius etwas kleiner gemacht
        circle.setAttribute("fill", "var(--color-token)"); // Leichtes Beige (Cornsilk)
        circle.setAttribute("stroke", "var(--color-dark)");
        circle.setAttribute("stroke-width", "1.5");
        container.appendChild(circle);

        // 2. Die Zahl (Text) einfügen
        const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
        text.setAttribute("x", x);
        text.setAttribute("y", tokenY + 5); // Leicht nach unten versetzt, damit es optisch mittig ist
        text.setAttribute("text-anchor", "middle"); // Text exakt zentrieren
        text.setAttribute("font-family", "sans-serif");
        text.setAttribute("font-size", "16"); // Schrift etwas verkleinert
        text.setAttribute("font-weight", "bold");

        // Regel: 6 und 8 werden rot markiert
        if (number === 6 || number === 8) {
            text.setAttribute("fill", "var(--color-red-num)"); // Dunkelrot
        } else {
            text.setAttribute("fill", "var(--color-num)"); // Dunkelgrün
        }

        text.textContent = number;
        container.appendChild(text);

        // Wahrscheinlichkeitspunkte zeichnen (optional, macht es authentischer)
        const dotsMapping = {
            2: 1, 3: 2, 4: 3, 5: 4, 6: 5, 8: 5, 9: 4, 10: 3, 11: 2, 12: 1
        };
        const dots = dotsMapping[number];
        if (dots) {
            const dotGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
            const dotSpacing = 4;
            const startX = x - ((dots - 1) * dotSpacing) / 2;
            for (let i = 0; i < dots; i++) {
                const dot = document.createElementNS("http://www.w3.org/2000/svg", "circle");
                dot.setAttribute("cx", startX + i * dotSpacing);
                dot.setAttribute("cy", tokenY + 10);
                dot.setAttribute("r", 1.2);
                dot.setAttribute("fill", (number === 6 || number === 8) ? "var(--color-red-num)" : "var(--color-num)");
                dotGroup.appendChild(dot);
            }
            container.appendChild(dotGroup);
        }
    }

    function drawUnexploredToken(x, y, type) {
        const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        circle.setAttribute("cx", x);
        circle.setAttribute("cy", y);
        circle.setAttribute("r", 20); // Ein minimal kleinerer Radius als die Zahlenchips (24) wirkt oft eleganter

        // Füllfarbe je nach Typ wählen (typisches Grün und Orange)
        if (type === 'green') {
            circle.setAttribute("fill", "#6a9e59");
        } else if (type === 'orange') {
            circle.setAttribute("fill", "#d87b33");
        }

        circle.setAttribute("stroke", "var(--color-dark)");
        circle.setAttribute("stroke-width", "1.5");
        svgMap.appendChild(circle);
    }

    function drawHarbor(hexX, hexY, edge, textValue, color) {
        // 1. Koordinaten der beiden Ecken berechnen, die diese Kante bilden
        // Ecke A entspricht Index 'edge', Ecke B entspricht Index 'edge + 1' (modulo 6, damit es nach 5 wieder auf 0 springt)
        const cornerA_angle = (60 * edge - 30) * (Math.PI / 180);
        const cornerB_angle = (60 * ((edge + 1) % 6) - 30) * (Math.PI / 180);

        const cornerAx = hexX + HEX_SIZE * Math.cos(cornerA_angle);
        const cornerAy = hexY + HEX_SIZE * Math.sin(cornerA_angle);

        const cornerBx = hexX + HEX_SIZE * Math.cos(cornerB_angle);
        const cornerBy = hexY + HEX_SIZE * Math.sin(cornerB_angle);

        // 2. Den Mittelpunkt des Hafens im Wasser berechnen
        // Die Distanz wird auf 1.4 erhöht (vorher 0.85), damit der Hafen deutlich im Wasser liegt
        const harborAngle = (60 * edge) * (Math.PI / 180);
        const harborDist = HEX_SIZE * 1.4;
        const harborX = hexX + harborDist * Math.cos(harborAngle);
        const harborY = hexY + harborDist * Math.sin(harborAngle);

        // 3. Die zwei braunen Holzstege zeichnen (Linien)
        const pier1 = document.createElementNS("http://www.w3.org/2000/svg", "line");
        pier1.setAttribute("x1", cornerAx);
        pier1.setAttribute("y1", cornerAy);
        pier1.setAttribute("x2", harborX);
        pier1.setAttribute("y2", harborY);
        pier1.setAttribute("stroke", "var(--color-pier)"); // Ein schönes, dunkles Holzbraun
        pier1.setAttribute("stroke-width", "5"); // Schöne dicke Stege
        pier1.setAttribute("stroke-linecap", "round");
        svgMap.appendChild(pier1);

        const pier2 = document.createElementNS("http://www.w3.org/2000/svg", "line");
        pier2.setAttribute("x1", cornerBx);
        pier2.setAttribute("y1", cornerBy);
        pier2.setAttribute("x2", harborX);
        pier2.setAttribute("y2", harborY);
        pier2.setAttribute("stroke", "var(--color-pier)");
        pier2.setAttribute("stroke-width", "5");
        pier1.setAttribute("stroke-linecap", "round");
        svgMap.appendChild(pier2);

        let container = createRotatableGroup(harborX, harborY);

        // 4. Den Hafen-Kreis zeichnen
        // Radius etwas vergrößert (auf 18), damit der Text besser reinpasst
        const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        circle.setAttribute("cx", harborX);
        circle.setAttribute("cy", harborY);
        circle.setAttribute("r", 18);
        circle.setAttribute("fill", color);
        circle.setAttribute("stroke", "var(--color-dark)");
        circle.setAttribute("stroke-width", "2");
        container.appendChild(circle);

        // 5. Den Text ("3:1" oder Rohstoff) hinzufügen
        const iconMap = {
            "Holz": "lumber.png",
            "Lehm": "brick.png",
            "Schaf": "wool.png",
            "Weizen": "grain.png",
            "Erz": "ore.png",
            "Gold": "gold.png"

        };

        if (textValue === "3:1") {
            // Für 3:1 zeichnen wir ganz normal den Text
            const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
            text.setAttribute("x", harborX);
            text.setAttribute("y", harborY + 4);
            text.setAttribute("text-anchor", "middle");
            text.setAttribute("font-family", "sans-serif");
            text.setAttribute("font-size", "11");
            text.setAttribute("font-weight", "bold");
            text.setAttribute("fill", "#333");
            text.textContent = textValue;
            container.appendChild(text);
        } else {
            // Für Ressourcen zeichnen wir das PNG
            const iconFilename = "image/" + iconMap[textValue];

            if (iconFilename) {
                const img = document.createElementNS("http://www.w3.org/2000/svg", "image");

                // Die Größe des Icons auf der Karte (24x24 Pixel passt super in den Radius von 18)
                const iconSize = 24;

                img.setAttribute("href", iconFilename); // Sagt dem SVG, wo das Bild liegt
                img.setAttribute("width", iconSize);
                img.setAttribute("height", iconSize);

                // Zentrieren: Vom Mittelpunkt des Kreises genau die halbe Bildbreite/-höhe nach oben links rutschen
                img.setAttribute("x", harborX - (iconSize / 2));
                img.setAttribute("y", harborY - (iconSize / 2));

                container.appendChild(img);
            }
        }
    }
    function drawHighwayman(hexX, hexY, edge) {
        // 1. Ecken berechnen (Exakt wie bei deinem Hafen)
        const cornerA_angle = (60 * edge - 30) * (Math.PI / 180);
        const cornerB_angle = (60 * ((edge + 1) % 6) - 30) * (Math.PI / 180);

        const cornerAx = hexX + HEX_SIZE * Math.cos(cornerA_angle);
        const cornerAy = hexY + HEX_SIZE * Math.sin(cornerA_angle);

        const cornerBx = hexX + HEX_SIZE * Math.cos(cornerB_angle);
        const cornerBy = hexY + HEX_SIZE * Math.sin(cornerB_angle);

        // 2. Den exakten Mittelpunkt der Kante berechnen
        const midX = (cornerAx + cornerBx) / 2;
        const midY = (cornerAy + cornerBy) / 2;

        let container = createRotatableGroup(midX, midY);

        // 3. Den Wegräuber zeichnen (Hier als markanter, schwarzer Kreis mit weißem Rand)
        // Du kannst hier später natürlich auch wieder ein <image> Tag mit einem PNG nutzen!
        const robber = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        robber.setAttribute("cx", midX);
        robber.setAttribute("cy", midY);
        robber.setAttribute("r", 10); // Schöne Größe für die Straße
        robber.setAttribute("fill", "#ffffff");
        robber.setAttribute("stroke", "#111111");
        robber.setAttribute("stroke-width", "2");

        // Optional: Ein kleines "W" oder Barbaren-Symbol in den Kreis schreiben
        const img = document.createElementNS("http://www.w3.org/2000/svg", "image");
        const iconSize = 20;
        img.setAttribute("href", "./image/robber.png");
        img.setAttribute("width", iconSize);
        img.setAttribute("height", iconSize);
        img.setAttribute("x", midX - (iconSize / 2));
        img.setAttribute("y", midY - (iconSize / 2));

        container.appendChild(robber);
        container.appendChild(img);
    }

    function checkMaxIslandSize(boardTiles, maxSize) {
        const visited = new Set();

        for (let tile of boardTiles) {
            // Wasser überspringen wir, uns interessiert nur Land
            if (tile.resource === "hex-sea") continue;

            const key = `${tile.q},${tile.r}`;
            if (visited.has(key)) continue;

            // Neue Insel gefunden! Wir starten den Scanner...
            let islandSize = 0;
            let queue = [{ q: tile.q, r: tile.r }];
            visited.add(key);

            while (queue.length > 0) {
                const current = queue.shift();
                islandSize++;

                // Alle 6 Richtungen prüfen
                for (let dir of hexDirections) {
                    const nq = current.q + dir[0];
                    const nr = current.r + dir[1];
                    const nKey = `${nq},${nr}`;

                    // Schauen, ob der Nachbar auf dem Brett existiert
                    const neighbor = boardTiles.find(t => t.q === nq && t.r === nr);

                    // Wenn der Nachbar Land ist und noch nicht gezählt wurde: zur Insel hinzufügen!
                    if (neighbor && neighbor.resource !== "hex-sea" && !visited.has(nKey)) {
                        visited.add(nKey);
                        queue.push({ q: nq, r: nr });
                    }
                }
            }

            // Wenn diese Insel größer ist als erlaubt, bricht der Test sofort ab!
            if (islandSize > maxSize) {
                return false;
            }
        }

        // Wenn alle Inseln geprüft wurden und keine zu groß war: Perfekt!
        return true;
    }

    function generateIslandMask(gridCoords, fixedCoords, totalLandNeeded, maxIslandSize) {
        let mask = new Map();
        let landPlaced = 0;

        // 1. Feste Meeres-Koordinaten übernehmen
        gridCoords.forEach(coord => {
            const key = `${coord[0]},${coord[1]}`;
            if (fixedCoords[key]) mask.set(key, "hex-sea");
        });

        let emergencyBrake = 0;

        // 2. Inseln wachsen lassen, bis alles Land verteilt ist
        while (landPlaced < totalLandNeeded && emergencyBrake < 500) {
            emergencyBrake++;

            // Finde alle noch komplett leeren Felder
            const emptySpots = gridCoords.filter(c => !mask.has(`${c[0]},${c[1]}`));
            if (emptySpots.length === 0) break;

            // Starte eine neue Insel an einem zufälligen leeren Punkt
            const seed = emptySpots[Math.floor(Math.random() * emptySpots.length)];

            // Würfle eine zufällige Größe für diese Insel aus (z.B. zwischen 4 und maxIslandSize)
            const targetSize = Math.min(
                Math.floor(Math.random() * (maxIslandSize - 3)) + 4,
                totalLandNeeded - landPlaced
            );

            let currentIsland = [seed];
            let islandKeys = new Set([`${seed[0]},${seed[1]}`]);

            let growAttempts = 0;

            // Lass die Insel Feld für Feld wachsen
            while (currentIsland.length < targetSize && growAttempts < 50) {
                growAttempts++;

                // Wähle ein Feld der aktuellen Insel, um von dort aus zu wachsen
                const baseHex = currentIsland[Math.floor(Math.random() * currentIsland.length)];

                // Finde alle 6 Nachbar-Koordinaten
                const neighbors = hexDirections.map(d => [baseHex[0] + d[0], baseHex[1] + d[1]]);

                const validNeighbors = neighbors.filter(n => {
                    const key = `${n[0]},${n[1]}`;

                    // Prüfen: Ist das Feld im Gitter? Ist es noch frei?
                    const inGrid = gridCoords.some(c => c[0] === n[0] && c[1] === n[1]);
                    if (!inGrid || mask.has(key) || islandKeys.has(key)) return false;

                    // DER INSELSCHUTZ: Berührt dieses neue Feld zufällig eine ANDERE fertige Insel?
                    // Wenn ja, dürfen wir hier nicht wachsen, sonst verschmelzen die Inseln!
                    const touchesOtherIsland = hexDirections.some(d => {
                        return mask.get(`${n[0] + d[0]},${n[1] + d[1]}`) === "land";
                    });

                    return !touchesOtherIsland;
                });

                // Wenn wir einen gültigen Platz zum Wachsen gefunden haben, fügen wir ihn zur Insel hinzu
                if (validNeighbors.length > 0) {
                    const nextHex = validNeighbors[Math.floor(Math.random() * validNeighbors.length)];
                    currentIsland.push(nextHex);
                    islandKeys.add(`${nextHex[0]},${nextHex[1]}`);
                }
            }

            // Die Insel ist fertig gewachsen. Wir kleben sie auf unsere Maske!
            currentIsland.forEach(hex => {
                mask.set(`${hex[0]},${hex[1]}`, "land");
                landPlaced++;
            });
        }

        // 3. Alles, was jetzt noch leer ist, wird mit Wasser aufgefüllt!
        gridCoords.forEach(coord => {
            const key = `${coord[0]},${coord[1]}`;
            if (!mask.has(key)) mask.set(key, "hex-sea");
        });

        return mask;
    }

    function isValidHexBoard(boardTiles) {
        const isStrictRedRuleActive = document.getElementById("strict-red-rule").checked;
        const isStrictLowRuleActive = document.getElementById("strict-low-rule").checked;

        if (isStrictRedRuleActive) {
            const redTiles = boardTiles.filter(tile => tile.number === 6 || tile.number === 8);

            for (let tile of redTiles) {
                for (let dir of hexDirections) {
                    const neighborQ = tile.q + dir[0];
                    const neighborR = tile.r + dir[1];

                    const conflict = redTiles.find(t => t.q === neighborQ && t.r === neighborR);

                    if (conflict) {
                        return false;
                    }
                }
            }
        }
        if (isStrictLowRuleActive) {
            const lowTiles = boardTiles.filter(tile => tile.number === 2 || tile.number === 12);

            for (let tile of lowTiles) {
                for (let dir of hexDirections) {
                    const neighborQ = tile.q + dir[0];
                    const neighborR = tile.r + dir[1];

                    const conflict = lowTiles.find(t => t.q === neighborQ && t.r === neighborR);

                    if (conflict) {
                        return false;
                    }
                }
            }
        }
        return true;
    }

    window.isMapRotated = false;

    function generateMap() {
        svgMap.innerHTML = "";

        svgMap.classList.remove("rotate-for-portrait");
        svgMap.style.transformOrigin = "";
        window.isMapRotated = false;

        const is5to6Player = document.getElementById("ext-5-6-player").checked;

        const isOI = document.getElementById('ext-oceans-and-islands').checked;
        const isOI5to6Player = document.getElementById('ext-oceans-and-islands-5-6-player').checked;

        const isPE = document.getElementById('ext-privateers-and-expeditions').checked;
        const isPE5to6Player = document.getElementById('ext-privateers-and-expeditions-5-6-player').checked;

        const isMH = document.getElementById('ext-markets-and-highwaymen').checked;
        const isMH5to6Player = document.getElementById('ext-markets-and-highwaymen-5-6-player').checked;

        const isMR = document.getElementById('ext-metropolises-and-raids').checked;
        const isMR5to6Player = document.getElementById('ext-metropolises-and-raids-5-6-player').checked;

        const isPortrait = window.matchMedia("(orientation: portrait) and (max-width: 900px)").matches;

        if (isOI || isOI5to6Player) {
            if (isPortrait) window.isMapRotated = true;
            generateOIMap(isOI5to6Player);
            if (isPortrait) {
                svgMap.classList.add("rotate-for-portrait");
                svgMap.style.transformOrigin = "500px 500px";
            }
        }

        else if (isPE || isPE5to6Player) {
            if (isPortrait) window.isMapRotated = true;
            generatePEMap(isPE5to6Player);
            if (isPortrait) {
                svgMap.classList.add("rotate-for-portrait");
                svgMap.style.transformOrigin = "300px 500px";
            }
        }

        else if (isMH || isMH5to6Player) {
            generateMHMap(isMH5to6Player);
        }

        else if (isMR || isMR5to6Player) {
            generateBaseMap(isMR5to6Player);
        }

        else {
            generateBaseMap(is5to6Player);
        }
    }

    function generateBaseMap(is5to6Player) {
        const currentGrid = is5to6Player ? gridCoords5to6 : gridCoords;
        const currentHarbors = is5to6Player ? harbors5to6 : baseHarbors;

        let validBoard = false;
        let boardTiles = [];

        // --- LOGIK-PHASE: Brett generieren und prüfen ---
        while (!validBoard) {
            // Inventare mischen
            let currentResourcesList = is5to6Player ? [...resources5to6] : [...baseResources];
            let currentNumbersList = is5to6Player ? [...numbers5to6] : [...baseNumbers];

            let shuffledResources = shuffleArray(currentResourcesList);
            let shuffledNumbers = shuffleArray(currentNumbersList);

            boardTiles = [];

            // Schleife über das DYNAMISCHE Gitter
            currentGrid.forEach(coord => {
                const q = coord[0];
                const r = coord[1];

                // Ganz normal Ressourcen aus dem Stapel ziehen
                let resource = shuffledResources.pop();
                let number = null;

                if (resource !== "hex-desert") {
                    number = shuffledNumbers.pop();
                }

                boardTiles.push({ q, r, resource, number });
            });

            validBoard = isValidHexBoard(boardTiles);
        }

        // --- ZEICHNEN-PHASE: Das gültige Brett rendern ---
        const centerX = 500;
        const centerY = 500;

        // 1. Häfen zeichnen
        currentHarbors.forEach(harbor => {
            const hx = centerX + HEX_WIDTH * (harbor.q + harbor.r / 2);
            const hy = centerY + HEX_SIZE * 1.5 * harbor.r;
            drawHarbor(hx, hy, harbor.edge, harbor.text, harbor.color);
        });

        // 2. Felder und Zahlen zeichnen
        boardTiles.forEach(tile => {
            const x = centerX + HEX_WIDTH * (tile.q + tile.r / 2);
            const y = centerY + HEX_SIZE * 1.5 * tile.r;

            drawHex(x, y, tile.resource);

            if (tile.number !== null) {
                drawToken(x, y, tile.number);
            }
        });

        // 3. Kamera an die Brettgröße anpassen
        if (is5to6Player) {
            svgMap.setAttribute("viewBox", "-50 -50 1100 1100");
        } else {
            svgMap.setAttribute("viewBox", "50 50 900 900");
        }
    }

    function generateOIMap(is5to6Players) {

        const isDesertTriangle = document.getElementById("sf-desert-triangle")?.checked;
        const isSmallIslands = document.getElementById("sf-small-islands")?.checked;

        // --- 1. KOORDINATEN & INVENTAR

        const gridCoords = [
            [-1, -3], [0, -3], [1, -3], [2, -3], [3, -3], [4, -3],                                // Reihe 1
            [-2, -2], [-1, -2], [0, -2], [1, -2], [2, -2], [3, -2], [4, -2],                      // Reihe 2
            [-3, -1], [-2, -1], [-1, -1], [0, -1], [1, -1], [2, -1], [3, -1], [4, -1],            // Reihe 3
            [-4, 0], [-3, 0], [-2, 0], [-1, 0], [0, 0], [1, 0], [2, 0], [3, 0], [4, 0],  // Reihe 4
            [-4, 1], [-3, 1], [-2, 1], [-1, 1], [0, 1], [1, 1], [2, 1], [3, 1],            // Reihe 5
            [-4, 2], [-3, 2], [-2, 2], [-1, 2], [0, 2], [1, 2], [2, 2],                      // Reihe 6
            [-4, 3], [-3, 3], [-2, 3], [-1, 3], [0, 3], [1, 3]                                 // Reihe 7
        ];
        const fixedOICoords = {
            "-4,0": "hex-sea",
            "4,0": "hex-sea"
        };
        const gridCoords5to6 = [
            [-2, -3], [-1, -3], [0, -3], [1, -3], [2, -3], [3, -3], [4, -3], [5, -3],                                 // Reihe 1
            [-3, -2], [-2, -2], [-1, -2], [0, -2], [1, -2], [2, -2], [3, -2], [4, -2], [5, -2],                       // Reihe 2
            [-4, -1], [-3, -1], [-2, -1], [-1, -1], [0, -1], [1, -1], [2, -1], [3, -1], [4, -1], [5, -1],             // Reihe 3
            [-5, 0], [-4, 0], [-3, 0], [-2, 0], [-1, 0], [0, 0], [1, 0], [2, 0], [3, 0], [4, 0], [5, 0],   // Reihe 4
            [-5, 1], [-4, 1], [-3, 1], [-2, 1], [-1, 1], [0, 1], [1, 1], [2, 1], [3, 1], [4, 1],             // Reihe 5
            [-5, 2], [-4, 2], [-3, 2], [-2, 2], [-1, 2], [0, 2], [1, 2], [2, 2], [3, 2],                       // Reihe 6
            [-5, 3], [-4, 3], [-3, 3], [-2, 3], [-1, 3], [0, 3], [1, 3], [2, 3]                                  // Reihe 7
        ];


        // Inventar
        const resourceCounts = {
            "hex-desert": 3, "hex-lumber": 5, "hex-brick": 5,
            "hex-wool": 5, "hex-grain": 5, "hex-ore": 5,
            "hex-gold": 2, "hex-sea": 19
        };

        // Zahlenchips (Menge muss mit den Ressourcen OHNE Wüste übereinstimmen)
        const numberCounts = {
            2: 2,
            3: 3,
            4: 3,
            5: 3,
            6: 3,
            8: 3,
            9: 3,
            10: 3,
            11: 3,
            12: 1
        };

        const sfHarborCounts = [
            { text: "3:1", color: "var(--color-3to1)" },
            { text: "3:1", color: "var(--color-3to1)" },
            { text: "3:1", color: "var(--color-3to1)" },
            { text: "3:1", color: "var(--color-3to1)" },
            { text: "3:1", color: "var(--color-3to1)" },
            { text: "Holz", color: "var(--color-lumber)" },
            { text: "Lehm", color: "var(--color-brick)" },
            { text: "Schaf", color: "var(--color-wool)" },
            { text: "Weizen", color: "var(--color-grain)" },
            { text: "Erz", color: "var(--color-ore)" }
        ];

        // Hafen-Inventar für 5-6 Spieler (meistens kommen 1-2 Häfen dazu, bitte mit Heft abgleichen!)
        const sfHarborCounts5to6 = [
            ...sfHarborCounts,
            { text: "Schaf", color: "var(--color-wool)" } // Beispiel-Ergänzung
        ];

        const resourceCounts5to6 = {
            "hex-desert": 3, "hex-lumber": 7, "hex-brick": 7,
            "hex-wool": 7, "hex-grain": 7, "hex-ore": 7,
            "hex-gold": 4, "hex-sea": 21
        };
        const numberCounts5to6 = {
            2: 2,
            3: 3,
            4: 4,
            5: 5,
            6: 5,
            8: 5,
            9: 5,
            10: 4,
            11: 4,
            12: 2
        };

        const fixedOICoords5to6 = {
            "-5,0": "hex-sea",
            "5,0": "hex-sea"
        };

        let currentGrid = is5to6Players ? gridCoords5to6 : gridCoords;
        let currentFixedOICoords = is5to6Players ? fixedOICoords5to6 : fixedOICoords;
        const currentResourceCounts = is5to6Players ? resourceCounts5to6 : resourceCounts;
        const currentNumberCounts = is5to6Players ? numberCounts5to6 : numberCounts;


        /*currentGrid.forEach(coord => {
            const q = coord[0];
            const r = coord[1];
            if (q === -3 || q >= 3) {
                fixedOICoords[`${q},${r}`] = "hex-sea";
            }
            // Du kannst auch einzelne Felder festlegen (z.B. für die Wunder-Wüsten)
            // fixedOICoords["0,0"] = "hex-desert";
        });

        */
        // --- 2. LOGIK-PHASE ---

        let totalLandCount = 0;
        Object.entries(currentResourceCounts).forEach(([res, count]) => {
            if (res !== "hex-sea") totalLandCount += count;
        });

        let currentResourcesList = Object.entries(currentResourceCounts).flatMap(([res, count]) => Array(count).fill(res));
        let currentNumbersList = Object.entries(currentNumberCounts).flatMap(([num, count]) => Array(count).fill(parseInt(num)));

        // 1. Feste Meeres-Felder aus dem Stapel nehmen
        /*Object.values(fixedOICoords).forEach(res => {
            const idx = currentResourcesList.indexOf(res);
            if (idx > -1) currentResourcesList.splice(idx, 1);
        });*/
        if (isSmallIslands) {
            currentResourcesList = currentResourcesList.filter(res => res !== "hex-sea");
        }

        // 2. NEU: Die 3 Wüsten aus dem Stapel nehmen, da wir sie als festen Block setzen!
        for (let i = 0; i < 3; i++) {
            const idx = currentResourcesList.indexOf("hex-desert");
            if (idx > -1) currentResourcesList.splice(idx, 1);
        }

        // 3. NEU: Alle möglichen Positionen für die "Spitze" des Dreiecks finden
        const validSpots = currentGrid.filter(coord => !currentFixedOICoords[`${coord[0]},${coord[1]}`]);

        // Variante A: Das strikte Dreieck (wie bisher)
        const possibleTriangles = validSpots.filter(coord => {
            const q = coord[0], r = coord[1];
            const hasBL = validSpots.some(c => c[0] === q - 1 && c[1] === r + 1);
            const hasBR = validSpots.some(c => c[0] === q && c[1] === r + 1);
            return hasBL && hasBR;
        }).map(coord => [
            `${coord[0]},${coord[1]}`,
            `${coord[0] - 1},${coord[1] + 1}`,
            `${coord[0]},${coord[1] + 1}`
        ]);

        // Variante B: Beliebig zusammenhängende Wüsten (Neu!)
        const possibleConnected = [];
        const uniqueTrios = new Set(); // Verhindert, dass wir dieselbe Form doppelt speichern

        validSpots.forEach(h1 => {
            // Finde alle gültigen Nachbarn von Feld 1 (Das ist Feld 2)
            const h1Neighbors = validSpots.filter(n =>
                hexDirections.some(d => n[0] === h1[0] + d[0] && n[1] === h1[1] + d[1])
            );

            h1Neighbors.forEach(h2 => {
                // Finde alle Nachbarn von Feld 1 ODER Feld 2 (Das ist Feld 3)
                const h3Candidates = validSpots.filter(h3 => {
                    if (h3[0] === h1[0] && h3[1] === h1[1]) return false; // Darf nicht Feld 1 sein
                    if (h3[0] === h2[0] && h3[1] === h2[1]) return false; // Darf nicht Feld 2 sein

                    const touchesH1 = hexDirections.some(d => h3[0] === h1[0] + d[0] && h3[1] === h1[1] + d[1]);
                    const touchesH2 = hexDirections.some(d => h3[0] === h2[0] + d[0] && h3[1] === h2[1] + d[1]);
                    return touchesH1 || touchesH2;
                });

                // Wir fügen die 3 Felder als Kombination zusammen
                h3Candidates.forEach(h3 => {
                    const trio = [`${h1[0]},${h1[1]}`, `${h2[0]},${h2[1]}`, `${h3[0]},${h3[1]}`].sort();
                    const trioKey = trio.join('|');

                    if (!uniqueTrios.has(trioKey)) {
                        uniqueTrios.add(trioKey);
                        possibleConnected.push(trio); // Speichere das Trio!
                    }
                });
            });
        });

        const finalDesertOptions = isDesertTriangle ? possibleTriangles : possibleConnected;

        let validBoard = false;
        let boardTiles = [];
        let greatWallSegments = [];

        let attempts = 0;
        const MAX_ATTEMPTS = is5to6Players ? 10000 : 3000;

        let failCountDesertSpace = 0; // Keine 3 zusammenhängenden Felder für Wüste gefunden
        let failCountBaseRules = 0;   // Rote Zahlen nebeneinander
        let failCountDesertEdge = 0;  // Wüste liegt nicht schön am Rand
        let failCountIslandSize = 0;  // Inseln sind zu groß geworden
        let failCountWonders = 0;     // Keine passenden Meerengen für Brücke/Leuchtturm gefunden

        let islandLimit = 11;
        if (is5to6Players) {
            islandLimit = 16; // Ein 11er Limit ist bei 42 Landfeldern fast unmöglich
        }

        // 4. Die Generierungs-Schleife
        while (!validBoard && attempts < MAX_ATTEMPTS) {
            attempts++;

            let shuffledLandResources = shuffleArray([...currentResourcesList]);
            let shuffledNumbers = shuffleArray([...currentNumbersList]);
            boardTiles = [];

            let islandMask = null;
            if (isSmallIslands) {
                islandMask = generateIslandMask(currentGrid, currentFixedOICoords, totalLandCount, islandLimit);
            }

            const validSpots = currentGrid.filter(coord => {
                const key = `${coord[0]},${coord[1]}`;
                // Wenn es eine Maske gibt, darf die Wüste NUR auf "land" platziert werden
                if (islandMask) return islandMask.get(key) === "land";
                return !currentFixedOICoords[key];
            });

            // Variante A: Das strikte Dreieck
            const possibleTriangles = validSpots.filter(coord => {
                const q = coord[0], r = coord[1];
                const hasBL = validSpots.some(c => c[0] === q - 1 && c[1] === r + 1);
                const hasBR = validSpots.some(c => c[0] === q && c[1] === r + 1);
                return hasBL && hasBR;
            }).map(coord => [
                `${coord[0]},${coord[1]}`,
                `${coord[0] - 1},${coord[1] + 1}`,
                `${coord[0]},${coord[1] + 1}`
            ]);

            // Variante B: Beliebig zusammenhängende Wüsten
            const possibleConnected = [];
            const uniqueTrios = new Set();
            validSpots.forEach(h1 => {
                const h1Neighbors = validSpots.filter(n =>
                    hexDirections.some(d => n[0] === h1[0] + d[0] && n[1] === h1[1] + d[1])
                );
                h1Neighbors.forEach(h2 => {
                    const h3Candidates = validSpots.filter(h3 => {
                        if (h3[0] === h1[0] && h3[1] === h1[1]) return false;
                        if (h3[0] === h2[0] && h3[1] === h2[1]) return false;
                        const touchesH1 = hexDirections.some(d => h3[0] === h1[0] + d[0] && h3[1] === h1[1] + d[1]);
                        const touchesH2 = hexDirections.some(d => h3[0] === h2[0] + d[0] && h3[1] === h2[1] + d[1]);
                        return touchesH1 || touchesH2;
                    });
                    h3Candidates.forEach(h3 => {
                        const trio = [`${h1[0]},${h1[1]}`, `${h2[0]},${h2[1]}`, `${h3[0]},${h3[1]}`].sort();
                        const trioKey = trio.join('|');
                        if (!uniqueTrios.has(trioKey)) {
                            uniqueTrios.add(trioKey);
                            possibleConnected.push(trio);
                        }
                    });
                });
            });

            const finalDesertOptions = isDesertTriangle ? possibleTriangles : possibleConnected;

            if (finalDesertOptions.length === 0) {
                failCountDesertSpace++;
                continue;
            }


            // ZUFALL: Einen gültigen Ort für das Wüstendreieck aussuchen
            const desertCoords = finalDesertOptions[Math.floor(Math.random() * finalDesertOptions.length)];

            currentGrid.forEach(coord => {
                const q = coord[0];
                const r = coord[1];
                const key = `${q},${r}`;

                let resource = null;
                let number = null;

                if (currentFixedOICoords[key]) {
                    resource = currentFixedOICoords[key];
                }

                else if (islandMask && islandMask.get(key) === "hex-sea") {
                    resource = "hex-sea";
                }

                else if (desertCoords.includes(key)) {
                    // DAS WÜSTEN-DREIECK EINSETZEN
                    resource = "hex-desert";
                }

                else {
                    resource = shuffledLandResources.pop();
                    number = null;
                }
                boardTiles.push({ q, r, resource, number });
            });

            // Basis-Prüfung (Rote Zahlen)
            validBoard = isValidHexBoard(boardTiles);
            if (!validBoard) failCountBaseRules++;
            // NEU: Prüfen, ob das Wüsten-Dreieck an mindestens 1 Landfeld (nicht Meer, nicht Wüste) grenzt
            if (validBoard) {
                const desertTiles = boardTiles.filter(t => t.resource === "hex-desert");
                const landNeighbors = [];
                const landNeighborKeys = new Set();

                // Schritt A: Alle einmaligen Land-Nachbarn rund um das gesamte Wüsten-Konstrukt sammeln
                for (let dt of desertTiles) {
                    for (let dir of hexDirections) {
                        const nq = dt.q + dir[0];
                        const nr = dt.r + dir[1];
                        const key = `${nq},${nr}`;

                        const neighbor = boardTiles.find(t => t.q === nq && t.r === nr);

                        // Ist es ein Landfeld und haben wir es noch nicht in der Liste?
                        if (neighbor && neighbor.resource !== "hex-sea" && neighbor.resource !== "hex-desert") {
                            if (!landNeighborKeys.has(key)) {
                                landNeighborKeys.add(key);
                                landNeighbors.push({ q: nq, r: nr });
                            }
                        }
                    }
                }

                // Regel 1: Genau 1 bis 3 Landfelder dürfen berührt werden
                if (landNeighbors.length < 1 || landNeighbors.length > 3) {
                    validBoard = false;
                    failCountDesertEdge++;
                }

                // Regel 2: Die berührten Landfelder MÜSSEN direkt nebeneinander liegen (zusammenhängen)
                if (validBoard && landNeighbors.length > 1) {
                    const visited = new Set();
                    const queue = [landNeighbors[0]]; // Wir starten beim ersten gefundenen Landfeld
                    visited.add(`${landNeighbors[0].q},${landNeighbors[0].r}`);

                    while (queue.length > 0) {
                        const current = queue.shift();

                        // Wir prüfen die direkten Nachbarn dieses Landfeldes
                        for (let dir of hexDirections) {
                            const nq = current.q + dir[0];
                            const nr = current.r + dir[1];
                            const nKey = `${nq},${nr}`;

                            // Wenn dieser Nachbar auch an der Wüste liegt UND noch nicht besucht wurde
                            if (landNeighborKeys.has(nKey) && !visited.has(nKey)) {
                                visited.add(nKey);
                                queue.push({ q: nq, r: nr });
                            }
                        }
                    }

                    // Das große Finale: Haben wir durch unser "Abwandern" alle Landfelder erreicht?
                    // Wenn nicht (z.B. visited.size ist 2, aber es gibt 3 Landfelder), ist die Linie gebrochen!
                    if (visited.size !== landNeighbors.length) {
                        validBoard = false;
                        failCountDesertEdge++;
                    }
                }
            }
            if (validBoard && isSmallIslands) {
                // Wir erlauben maximal 11 bzw. 16 Felder pro Insel
                validBoard = checkMaxIslandSize(boardTiles, is5to6Players ? 16 : 11);
                if (!validBoard) {
                    failCountIslandSize++; // <--- HIER EINTRAGEN
                }

            }

            const isLighthouseActive = document.getElementById("sf-lighthouse")?.checked;

            if (validBoard) {
                let validStraits = [];
                const seaTiles = boardTiles.filter(t => t.resource === "hex-sea");

                // Die Kanten-Richtungen (0=Rechts, 1=Unten Rechts...)
                const edgeDirections = [
                    [1, 0], [0, 1], [-1, 1], [-1, 0], [0, -1], [1, -1]
                ];

                seaTiles.forEach(sea => {
                    const isLand = (q, r) => {
                        const tile = boardTiles.find(t => t.q === q && t.r === r);
                        return tile && tile.resource !== "hex-sea" && tile.resource !== "hex-desert";
                    };

                    const isSea = (q, r) => {
                        const tile = boardTiles.find(t => t.q === q && t.r === r);
                        return tile && tile.resource === "hex-sea";
                    };

                    // Wir prüfen alle 6 Kanten dieses Wasserfeldes
                    for (let i = 0; i < 6; i++) {
                        // Da du KEINE komplett senkrechten Brücken willst, schließen wir Kante 0 und 3 aus
                        if (i === 0 || i === 3) continue;

                        const dir = edgeDirections[i];
                        const neighborQ = sea.q + dir[0];
                        const neighborR = sea.r + dir[1];

                        // BEDINGUNG 1: Das Feld auf der anderen Seite der Kante MUSS AUCH MEER SEIN!
                        if (isSea(neighborQ, neighborR)) {

                            // Wir ermitteln die Koordinaten der beiden Hexagone, die an den Enden dieser Kante liegen
                            const prevIdx = (i + 5) % 6;
                            const nextIdx = (i + 1) % 6;

                            const land1Q = sea.q + edgeDirections[prevIdx][0];
                            const land1R = sea.r + edgeDirections[prevIdx][1];

                            const land2Q = sea.q + edgeDirections[nextIdx][0];
                            const land2R = sea.r + edgeDirections[nextIdx][1];

                            // BEDINGUNG 2: An den Enden der Kante muss Land sein!
                            if (isLand(land1Q, land1R) && isLand(land2Q, land2R)) {
                                // Damit wir Kanten nicht doppelt zählen (Hex A Kante 1 ist Hex B Kante 4),
                                // erstellen wir eine eindeutige ID für diese Kante
                                const straitKey = [`${sea.q},${sea.r}`, `${neighborQ},${neighborR}`].sort().join('|');
                                validStraits.push({ key: straitKey, q: sea.q, r: sea.r, edge: i });
                            }
                        }
                    }

                });
                greatWallSegments = []; // Array leeren, falls neu gemischt wurde
                const desertTiles = boardTiles.filter(t => t.resource === "hex-desert");

                desertTiles.forEach(dt => {
                    edgeDirections.forEach((dir, edgeIndex) => {
                        const nq = dt.q + dir[0];
                        const nr = dt.r + dir[1];
                        const neighbor = boardTiles.find(t => t.q === nq && t.r === nr);

                        // Wenn der Nachbar existiert, KEIN Meer und KEINE Wüste ist, haben wir eine Grenze!
                        if (neighbor && neighbor.resource !== "hex-sea" && neighbor.resource !== "hex-desert") {
                            greatWallSegments.push({ q: dt.q, r: dt.r, edge: edgeIndex });
                        }
                    });
                });

                // Duplikate entfernen
                const uniqueStraitsMap = new Map();
                validStraits.forEach(strait => uniqueStraitsMap.set(strait.key, strait));
                validStraits = Array.from(uniqueStraitsMap.values());

                const wondersNeeded = isLighthouseActive ? 2 : 1;

                if (validStraits.length < wondersNeeded) {
                    validBoard = false; // Neu mischen, keine passenden Meereskanten gefunden!
                    failCountWonders++;
                } else {
                    validStraits = shuffleArray(validStraits);

                    const bridgeStrait = validStraits.pop();
                    const bridgeTile = boardTiles.find(t => t.q === bridgeStrait.q && t.r === bridgeStrait.r);
                    bridgeTile.wonder = "bridge";
                    bridgeTile.wonderEdge = bridgeStrait.edge; // Wir merken uns exakt die gefundene Kante!

                    if (isLighthouseActive) {
                        const lhStrait = validStraits.pop();
                        const lhTile = boardTiles.find(t => t.q === lhStrait.q && t.r === lhStrait.r);
                        lhTile.wonder = "lighthouse";
                        lhTile.wonderEdge = lhStrait.edge;
                    }
                }
            }
            if (validBoard) {
                let numbersValid = false;
                let numAttempts = 0;

                // Wir filtern alle Felder heraus, die eine Zahl brauchen (Kein Meer, Keine Wüste)
                const numberableTiles = boardTiles.filter(t => t.resource !== "hex-sea" && t.resource !== "hex-desert");

                // Wir mischen NUR die Zahlen, bis es passt (Maximal 500 Mal probieren)
                while (!numbersValid && numAttempts < 500) {
                    numAttempts++;
                    let tempNumbers = shuffleArray([...currentNumbersList]);

                    // Zahlen auf die Landfelder legen
                    numberableTiles.forEach(tile => {
                        tile.number = tempNumbers.pop();
                    });

                    // JETZT prüfen wir, ob rote Zahlen sich berühren
                    numbersValid = isValidHexBoard(boardTiles);
                }

                // Wenn wir nach 500 Zahlenschiebereien keine Lösung finden (z.B. weil die Insel Form
                // physikalisch zu eng für so viele rote Zahlen ist), werfen wir das Board weg.
                if (!numbersValid) {
                    validBoard = false;
                    failCountBaseRules++; // Ah! Hier schlägt der Zähler jetzt korrekt an!
                }
            }

            if (!validBoard && attempts >= MAX_ATTEMPTS) {
                // SVG leeren, damit keine halbgaren Kartenreste sichtbar sind
                svgMap.innerHTML = "";

                // ViewBox setzen, damit wir eine schöne Mitte für den Text haben
                svgMap.setAttribute("viewBox", "0 0 0 0");

                // Haupt-Fehlermeldung (Rot und Groß)
                const errorText = document.createElementNS("http://www.w3.org/2000/svg", "text");
                errorText.setAttribute("x", "500");
                errorText.setAttribute("y", "480");
                errorText.setAttribute("text-anchor", "middle");
                errorText.setAttribute("font-family", "sans-serif");
                errorText.setAttribute("font-size", "32");
                errorText.setAttribute("font-weight", "bold");
                errorText.setAttribute("fill", "#d9534f"); // Ein schönes Warn-Rot
                errorText.textContent = "FEHLER: Kartengenerierung fehlgeschlagen!";

                // Untertitel (Etwas kleiner, erklärt was zu tun ist)
                const hintText = document.createElementNS("http://www.w3.org/2000/svg", "text");
                hintText.setAttribute("x", "500");
                hintText.setAttribute("y", "530");
                hintText.setAttribute("text-anchor", "middle");
                hintText.setAttribute("font-family", "sans-serif");
                hintText.setAttribute("font-size", "20");
                hintText.setAttribute("fill", "#333");
                hintText.textContent = "Es konnte in " + MAX_ATTEMPTS + " Versuchen keine gültige Karte mit den aktuellen Einstellungen generiert werden.";

                const hintText2 = document.createElementNS("http://www.w3.org/2000/svg", "text");
                hintText2.setAttribute("x", "500");
                hintText2.setAttribute("y", "560");
                hintText2.setAttribute("text-anchor", "middle");
                hintText2.setAttribute("font-family", "sans-serif");
                hintText2.setAttribute("font-size", "20");
                hintText2.setAttribute("fill", "#333");
                hintText2.textContent = "Bitte versuche es erneut.";

                // Texte ins Bild einfügen
                svgMap.appendChild(errorText);
                svgMap.appendChild(hintText);
                svgMap.appendChild(hintText2);

                // SEHR WICHTIG: Die Funktion hier hart beenden!
                // Der Code für die Zeichnen-Phase wird dadurch nicht mehr ausgeführt.
                // return;

            }
        }
        //debugger;
        console.log(`%c--- Generierungs-Statistik (Erfolg: ${validBoard}) ---`, "font-weight: bold; color: #4CAF50; font-size: 14px;");
        console.log(`Gesamtversuche: %c${attempts}`, "font-weight: bold;");
        console.table({
            "Fehlender Platz für Wüste": failCountDesertSpace,
            "Rote Zahlen (Base Rules)": failCountBaseRules,
            "Wüste nicht am Rand": failCountDesertEdge,
            "Inseln zu groß": failCountIslandSize,
            "Fehlende Meerengen (Wunder)": failCountWonders
        });
        console.log("--------------------------------------------------");
        // --- 5. HÄFEN DYNAMISCH GENERIEREN ---
        let dynamicHarbors = [];
        let coastalHexes = [];

        const edgeDirections = [
            [1, 0], [0, 1], [-1, 1], [-1, 0], [0, -1], [1, -1]
        ];

        // 1. Alle Küstenkanten finden
        boardTiles.forEach(tile => {
            // KORREKTUR 1: Weder Meer NOCH Wüste dürfen eine Küste für Häfen sein!
            if (tile.resource !== "hex-sea" && tile.resource !== "hex-desert") {
                let seaEdges = [];

                edgeDirections.forEach((dir, edgeIndex) => {
                    const nq = tile.q + dir[0];
                    const nr = tile.r + dir[1];
                    const neighbor = boardTiles.find(t => t.q === nq && t.r === nr);

                    if (!neighbor || neighbor.resource === "hex-sea") {
                        seaEdges.push(edgeIndex);
                    }
                });

                if (seaEdges.length > 0) {
                    coastalHexes.push({ q: tile.q, r: tile.r, possibleEdges: seaEdges });
                }
            }
        });

        // 2. Küsten und Hafen-Inventar mischen
        coastalHexes = shuffleArray(coastalHexes);
        let harborsToPlace = is5to6Players ? [...sfHarborCounts5to6] : [...sfHarborCounts];
        harborsToPlace = shuffleArray(harborsToPlace);


        // KORREKTUR 2: Hilfsfunktion für den Abstands-Check
        // Diese Funktion berechnet (virtuell) den exakten Mittelpunkt eines Hafens
        const getHarborPixelPos = (q, r, edge) => {
            const hx = HEX_WIDTH * (q + r / 2);
            const hy = HEX_SIZE * 1.5 * r;
            const angle = (60 * edge) * (Math.PI / 180);
            return {
                x: hx + (HEX_SIZE * 1.4) * Math.cos(angle),
                y: hy + (HEX_SIZE * 1.4) * Math.sin(angle)
            };
        };

        // Der geforderte Mindestabstand (1.8-mal die Größe eines Hexagons sorgt für perfekte Abstände)
        const MIN_HARBOR_DISTANCE = HEX_SIZE * 1.8;

        // 4. Häfen verteilen (mit Kollisions-Schutz!)
        for (let harbor of harborsToPlace) {
            let placed = false;

            // Wir probieren so lange Küsten aus, bis der Hafen erfolgreich platziert wurde
            while (coastalHexes.length > 0 && !placed) {
                const targetCoast = coastalHexes.pop();

                // Wir mischen die möglichen Kanten dieses Landfeldes durch
                const shuffledEdges = shuffleArray([...targetCoast.possibleEdges]);

                for (let edge of shuffledEdges) {
                    const newPos = getHarborPixelPos(targetCoast.q, targetCoast.r, edge);

                    // Wir prüfen mit dem Satz des Pythagoras, ob irgendein bereits gebauter Hafen zu nah ist
                    const isTooClose = dynamicHarbors.some(existingHarbor => {
                        const exPos = getHarborPixelPos(existingHarbor.q, existingHarbor.r, existingHarbor.edge);
                        const dist = Math.sqrt(Math.pow(newPos.x - exPos.x, 2) + Math.pow(newPos.y - exPos.y, 2));
                        return dist < MIN_HARBOR_DISTANCE;
                    });

                    // Wenn wir weit genug von allen anderen Häfen weg sind, bauen wir ihn!
                    if (!isTooClose) {
                        dynamicHarbors.push({
                            q: targetCoast.q,
                            r: targetCoast.r,
                            edge: edge,
                            text: harbor.text,
                            color: harbor.color
                        });
                        placed = true;
                        break; // Bricht die innere Kanten-Schleife ab
                    }
                }

                // Wenn alle Kanten dieses einen Landfeldes blockiert waren,
                // läuft die while-Schleife einfach weiter und zieht das nächste Landfeld!
            }
        }

        if (validBoard) {
            // --- 3. ZEICHNEN-PHASE ---
            // Wir rücken das Spielfeld vermutlich etwas in die Mitte, je nachdem wie dein q,r System für dieses Szenario startet
            const centerX = 500;
            const centerY = 500;

            // Calculate dynamic viewBox
            let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
            boardTiles.forEach(tile => {
                const x = centerX + HEX_WIDTH * (tile.q + tile.r / 2);
                const y = centerY + HEX_SIZE * 1.5 * tile.r;
                if (x < minX) minX = x;
                if (x > maxX) maxX = x;
                if (y < minY) minY = y;
                if (y > maxY) maxY = y;
            });
            dynamicHarbors.forEach(harbor => {
                const hx = centerX + HEX_WIDTH * (harbor.q + harbor.r / 2);
                const hy = centerY + HEX_SIZE * 1.5 * harbor.r;
                const angle = (60 * harbor.edge) * (Math.PI / 180);
                const harborX = hx + (HEX_SIZE * 1.4) * Math.cos(angle);
                const harborY = hy + (HEX_SIZE * 1.4) * Math.sin(angle);
                if (harborX < minX) minX = harborX;
                if (harborX > maxX) maxX = harborX;
                if (harborY < minY) minY = harborY;
                if (harborY > maxY) maxY = harborY;
            });

            const isPortrait = window.matchMedia("(orientation: portrait) and (max-width: 900px)").matches;
            
            let lMinX = minX - 120;
            let lMaxX = maxX + 120;
            let lMinY = minY - 120;
            let lMaxY = maxY + 120;
            const viewBoxLandscape = `${lMinX} ${lMinY} ${lMaxX - lMinX} ${lMaxY - lMinY}`;

            const pMinX = centerX - maxY + centerY - 120;
            const pMaxX = centerX - minY + centerY + 120;
            const pMinY = centerY + minX - centerX - 120;
            const pMaxY = centerY + maxX - centerX + 120;
            const viewBoxPortrait = `${pMinX} ${pMinY} ${pMaxX - pMinX} ${pMaxY - pMinY}`;

            svgMap.setAttribute("data-viewbox-landscape", viewBoxLandscape);
            svgMap.setAttribute("data-viewbox-portrait", viewBoxPortrait);
            
            svgMap.setAttribute("viewBox", isPortrait ? viewBoxPortrait : viewBoxLandscape);

            boardTiles.forEach(tile => {
                const x = centerX + HEX_WIDTH * (tile.q + tile.r / 2);
                const y = centerY + HEX_SIZE * 1.5 * tile.r;

                drawHex(x, y, tile.resource);

                if (tile.number !== null) {
                    drawToken(x, y, tile.number);
                }
            });

            dynamicHarbors.forEach(harbor => {
                const hx = centerX + HEX_WIDTH * (harbor.q + harbor.r / 2);
                const hy = centerY + HEX_SIZE * 1.5 * harbor.r;
                drawHarbor(hx, hy, harbor.edge, harbor.text, harbor.color);
            });

            boardTiles.forEach(tile => {
                if (tile.wonder) {
                    const x = centerX + HEX_WIDTH * (tile.q + tile.r / 2);
                    const y = centerY + HEX_SIZE * 1.5 * tile.r;

                    let coast1X, coast1Y, coast2X, coast2Y;

                    // Wir berechnen alle 6 Ecken dieses Wasserfeldes
                    const ptTop = { x: x, y: y - HEX_SIZE };
                    const ptTopRight = { x: x + (HEX_WIDTH / 2), y: y - (HEX_SIZE / 2) };
                    const ptBottomRight = { x: x + (HEX_WIDTH / 2), y: y + (HEX_SIZE / 2) };
                    const ptBottom = { x: x, y: y + HEX_SIZE };
                    const ptBottomLeft = { x: x - (HEX_WIDTH / 2), y: y + (HEX_SIZE / 2) };
                    const ptTopLeft = { x: x - (HEX_WIDTH / 2), y: y - (HEX_SIZE / 2) };

                    // Wir setzen die Punkte genau auf die beiden Enden der gefundenen Kante!
                    switch (tile.wonderEdge) {
                        case 1: // Unten Rechts
                            coast1X = ptBottomRight.x; coast1Y = ptBottomRight.y;
                            coast2X = ptBottom.x; coast2Y = ptBottom.y;
                            break;
                        case 2: // Unten Links
                            coast1X = ptBottom.x; coast1Y = ptBottom.y;
                            coast2X = ptBottomLeft.x; coast2Y = ptBottomLeft.y;
                            break;
                        case 4: // Oben Links
                            coast1X = ptTopLeft.x; coast1Y = ptTopLeft.y;
                            coast2X = ptTop.x; coast2Y = ptTop.y;
                            break;
                        case 5: // Oben Rechts
                            coast1X = ptTop.x; coast1Y = ptTop.y;
                            coast2X = ptTopRight.x; coast2Y = ptTopRight.y;
                            break;
                    }

                    const drawWonderDot = (wx, wy, type) => {
                        const isBridge = type === "bridge";

                        let container = createRotatableGroup(wx, wy);

                        const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
                        circle.setAttribute("cx", wx);
                        circle.setAttribute("cy", wy);
                        circle.setAttribute("r", 12);

                        circle.setAttribute("fill", "#ffffff");
                        circle.setAttribute("stroke", isBridge ? "#8b4513" : "#d9534f");
                        circle.setAttribute("stroke-width", "2");
                        container.appendChild(circle);

                        const img = document.createElementNS("http://www.w3.org/2000/svg", "image");
                        const iconSize = 20;
                        img.setAttribute("href", isBridge ? "./image/bridge.png" : "./image/lighthouse.png");
                        img.setAttribute("width", iconSize);
                        img.setAttribute("height", iconSize);
                        img.setAttribute("x", wx - (iconSize / 2));
                        img.setAttribute("y", wy - (iconSize / 2));
                        container.appendChild(img);
                    };

                    // Zeichnet die Punkte!
                    drawWonderDot(coast1X, coast1Y, tile.wonder);
                    drawWonderDot(coast2X, coast2Y, tile.wonder);
                }
            });

            greatWallSegments.forEach(segment => {
                const x = centerX + HEX_WIDTH * (segment.q + segment.r / 2);
                const y = centerY + HEX_SIZE * 1.5 * segment.r;

                // Alle 6 Ecken des Wüsten-Hexagons
                const ptTop = { x: x, y: y - HEX_SIZE };
                const ptTopRight = { x: x + (HEX_WIDTH / 2), y: y - (HEX_SIZE / 2) };
                const ptBottomRight = { x: x + (HEX_WIDTH / 2), y: y + (HEX_SIZE / 2) };
                const ptBottom = { x: x, y: y + HEX_SIZE };
                const ptBottomLeft = { x: x - (HEX_WIDTH / 2), y: y + (HEX_SIZE / 2) };
                const ptTopLeft = { x: x - (HEX_WIDTH / 2), y: y - (HEX_SIZE / 2) };

                let p1, p2;

                // Die exakten Ecken der jeweiligen Kante zuweisen
                switch (segment.edge) {
                    case 0: p1 = ptTopRight; p2 = ptBottomRight; break; // Rechts
                    case 1: p1 = ptBottomRight; p2 = ptBottom; break;   // Unten Rechts
                    case 2: p1 = ptBottom; p2 = ptBottomLeft; break;    // Unten Links
                    case 3: p1 = ptBottomLeft; p2 = ptTopLeft; break;   // Links
                    case 4: p1 = ptTopLeft; p2 = ptTop; break;          // Oben Links
                    case 5: p1 = ptTop; p2 = ptTopRight; break;         // Oben Rechts
                }

                // Hilfsfunktion für den Mauer-Marker
                const drawWallDot = (wx, wy) => {
                    let container = createRotatableGroup(wx, wy);

                    const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
                    circle.setAttribute("cx", wx);
                    circle.setAttribute("cy", wy);
                    circle.setAttribute("r", 12);

                    // Ein schönes, massives Stein-Grau für die Mauer
                    circle.setAttribute("fill", "#ffffff");
                    circle.setAttribute("stroke", "#757575");
                    circle.setAttribute("stroke-width", "2");
                    container.appendChild(circle);

                    const img = document.createElementNS("http://www.w3.org/2000/svg", "image");
                    const iconSize = 20;
                    img.setAttribute("href", "./image/wall.png");
                    img.setAttribute("width", iconSize);
                    img.setAttribute("height", iconSize);
                    img.setAttribute("x", wx - (iconSize / 2));
                    img.setAttribute("y", wy - (iconSize / 2));
                    container.appendChild(img);
                };

                // Setzt die Marker auf die beiden Enden der Kante
                drawWallDot(p1.x, p1.y);
                drawWallDot(p2.x, p2.y);
            });
        }
    }

    function generatePEMap(is5to6Player) {

        const isPEStartField6Active = document.getElementById("ep-start-field-6").checked;
        const isPEShowPlateLabelsActive = document.getElementById("ep-show-plate-labels").checked;

        // 1. DEIN Gitter der Startinsel
        const epGridCoords = [
            { q: 1, r: -3, type: 'res' }, { q: 2, r: -3, type: 'res' },    // Reihe 1
            { q: 0, r: -2, type: 'res' }, { q: 1, r: -2, type: 'res' },    // Reihe 2
            { q: -1, r: -1, type: 'res' }, { q: 0, r: -1, type: 'res' },   // Reihe 3
            { q: -2, r: 0, type: 'start' }, { q: -1, r: 0, type: 'res' }, { q: 0, r: 0, type: 'res' },  // Reihe 4
            { q: -2, r: 1, type: 'res' }, { q: -1, r: 1, type: 'res' },    // Reihe 5
            { q: -2, r: 2, type: 'res' }, { q: -1, r: 2, type: 'res' },    // Reihe 6
            { q: -2, r: 3, type: 'res' }, { q: -1, r: 3, type: 'res' }     // Reihe 7
        ];

        // 2. NEU: Die angrenzenden Meer-Felder (Schließen exakt an deine Küste an)
        const epSeaCoords = [
            // Meerfeld D2
            { q: 1, r: 0, type: 'd2', label: 'D2' }, // Der Rat

            // Meerfeld E
            { q: 2, r: 0, type: 'sea', label: 'E' }, // Einzelnes Meerfeld E

            // Meerplatte F
            { q: 5, r: -1, type: 'sea', label: 'F' },
            { q: 3, r: 0, type: 'sea', label: 'F' }, { q: 4, r: 0, type: 'sea', label: 'F' }, { q: 5, r: 0, type: 'sea', label: 'F' }, { q: 6, r: 0, type: 'sea', label: 'F' },
            { q: 4, r: 1, type: 'sea', label: 'F' },

            // Meerplatte G
            { q: 7, r: -1, type: 'sea', label: 'G' },
            { q: 7, r: 0, type: 'sea', label: 'G' },
            { q: 6, r: 1, type: 'sea', label: 'G' },

            // Meerplatte C1
            { q: 3, r: -3, type: 'sea', label: 'C1' }, { q: 2, r: -2, type: 'sea', label: 'C1' }, { q: 1, r: -1, type: 'sea', label: 'C1' },
            { q: 4, r: -3, type: 'sea', label: 'C1' }, { q: 3, r: -2, type: 'sea', label: 'C1' }, { q: 2, r: -1, type: 'sea', label: 'C1' },


            // Meerplatte C2
            { q: 1, r: 1, type: 'sea', label: 'C2' }, { q: 1, r: 2, type: 'sea', label: 'C2' }, { q: 1, r: 3, type: 'sea', label: 'C2' },
            { q: 0, r: 3, type: 'sea', label: 'C2' }, { q: 0, r: 1, type: 'sea', label: 'C2' }, { q: 0, r: 2, type: 'sea', label: 'C2' },

            // restliches Meer
            { q: 8, r: 0, type: 'sea' }, { q: 9, r: 0, type: 'sea' }
        ];

        const epGreenCoords = [
            // 1. Reihe
            { q: 3, r: -1, type: 'green' }, { q: 4, r: -1, type: 'green' }, { q: 6, r: -1, type: 'green' }, { q: 8, r: -1, type: 'green' },
            { q: 9, r: -1, type: 'green' },

            // 2. Reihe
            { q: 4, r: -2, type: 'green' }, { q: 5, r: -2, type: 'green' }, { q: 6, r: -2, type: 'green' }, { q: 7, r: -2, type: 'green' },
            { q: 8, r: -2, type: 'green' }, { q: 9, r: -2, type: 'green' },

            // 3. Reihe
            { q: 5, r: -3, type: 'green' }, { q: 6, r: -3, type: 'green' }, { q: 7, r: -3, type: 'green' }, { q: 8, r: -3, type: 'green' },
            { q: 9, r: -3, type: 'green' }
        ];

        const epOrangeCoords = [
            // 1. Reihe
            { q: 2, r: 1, type: 'orange' }, { q: 3, r: 1, type: 'orange' }, { q: 5, r: 1, type: 'orange' }, { q: 7, r: 1, type: 'orange' },
            { q: 8, r: 1, type: 'orange' },

            // 2. Reihe
            { q: 2, r: 2, type: 'orange' }, { q: 3, r: 2, type: 'orange' }, { q: 4, r: 2, type: 'orange' }, { q: 5, r: 2, type: 'orange' },
            { q: 6, r: 2, type: 'orange' }, { q: 7, r: 2, type: 'orange' },

            // 3. Reihe
            { q: 2, r: 3, type: 'orange' }, { q: 3, r: 3, type: 'orange' }, { q: 4, r: 3, type: 'orange' }, { q: 5, r: 3, type: 'orange' },
            { q: 6, r: 3, type: 'orange' }
        ];

        // Inventar für Startinsel (14 Felder)
        const resourceCountsPE = {
            "hex-lumber": 3, "hex-brick": 3, "hex-wool": 3, "hex-grain": 3, "hex-ore": 2
        };

        // Zahlenchips (15 Stück)
        const numberCountsPE = {
            3: 1, 4: 2, 5: 2, 6: 3, 8: 2, 9: 2, 10: 2, 11: 1
        };

        const epGridCoords5to6 = [
            { q: 2, r: -4, type: 'res' }, { q: 3, r: -4, type: 'res' },    // Reihe 1
            { q: 1, r: -3, type: 'res' }, { q: 2, r: -3, type: 'res' },    // Reihe 2
            { q: 0, r: -2, type: 'res' }, { q: 1, r: -2, type: 'res' },    // Reihe 3
            { q: -1, r: -1, type: 'res' }, { q: 0, r: -1, type: 'res' }, { q: 1, r: -1, type: 'res' },   // Reihe 4
            { q: -2, r: 0, type: 'start' }, { q: -1, r: 0, type: 'res' }, { q: 0, r: 0, type: 'res' }, { q: 1, r: 0, type: 'res' }, //Reihe 5
            { q: -2, r: 1, type: 'res' }, { q: -1, r: 1, type: 'res' }, { q: 0, r: 1, type: 'res' },   // Reihe 6
            { q: -2, r: 2, type: 'res' }, { q: -1, r: 2, type: 'res' },    // Reihe 7
            { q: -2, r: 3, type: 'res' }, { q: -1, r: 3, type: 'res' },    // Reihe 8
            { q: -2, r: 4, type: 'res' }, { q: -1, r: 4, type: 'res' }     // Reihe 9
        ];
        const epSeaCoords5to6 = [
            // Meerplatte D3
            { q: 2, r: 0, type: 'd2', label: 'D3' }, { q: 2, r: -1, type: 'd2', label: 'D3' },
            { q: 1, r: 1, type: 'd2', label: 'D3' },

            // Meerfeld E
            { q: 9, r: 0, type: 'sea', label: 'E' },

            // Meerfelder EE
            { q: 3, r: -1, type: 'sea', label: 'EE' }, { q: 2, r: 1, type: 'sea', label: 'EE' },
            { q: 9, r: -4, type: 'sea', label: 'EE' }, { q: 5, r: 4, type: 'sea', label: 'EE' },


            // Meerplatte EG
            { q: 8, r: 0, type: 'sea', label: 'EG' }, { q: 9, r: -1, type: 'sea', label: 'EG' },
            { q: 8, r: 1, type: 'sea', label: 'EG' },


            // Meerplatte F
            { q: 5, r: -1, type: 'sea', label: 'F' },
            { q: 3, r: 0, type: 'sea', label: 'F' }, { q: 4, r: 0, type: 'sea', label: 'F' }, { q: 5, r: 0, type: 'sea', label: 'F' }, { q: 6, r: 0, type: 'sea', label: 'F' },
            { q: 4, r: 1, type: 'sea', label: 'F' },

            // Meerplatte G
            { q: 7, r: -1, type: 'sea', label: 'G' },
            { q: 7, r: 0, type: 'sea', label: 'G' },
            { q: 6, r: 1, type: 'sea', label: 'G' },

            // Meerplatte C1
            { q: 4, r: -4, type: 'sea', label: 'C1' }, { q: 3, r: -3, type: 'sea', label: 'C1' }, { q: 2, r: -2, type: 'sea', label: 'C1' },
            { q: 5, r: -4, type: 'sea', label: 'C1' }, { q: 4, r: -3, type: 'sea', label: 'C1' }, { q: 3, r: -2, type: 'sea', label: 'C1' },


            // Meerplatte C2
            { q: 1, r: 2, type: 'sea', label: 'C2' }, { q: 1, r: 3, type: 'sea', label: 'C2' }, { q: 1, r: 4, type: 'sea', label: 'C2' },
            { q: 0, r: 2, type: 'sea', label: 'C2' }, { q: 0, r: 3, type: 'sea', label: 'C2' }, { q: 0, r: 4, type: 'sea', label: 'C2' },
            //Meerfeld Standard Grün
            { q: 7, r: -4, type: 'sea', label: 'MSG' },

            //Meerfeld Standard Orange
            { q: 3, r: 4, type: 'sea', label: 'MSO' },

            //restliches Meer
            { q: 10, r: 0, type: 'sea' }
        ];
        const epGreenCoords5to6 = [
            // 1. Reihe
            { q: 4, r: -1, type: 'green' }, { q: 6, r: -1, type: 'green' }, { q: 8, r: -1, type: 'green' }, { q: 10, r: -1, type: 'green' },

            // 2. Reihe
            { q: 4, r: -2, type: 'green' }, { q: 5, r: -2, type: 'green' }, { q: 6, r: -2, type: 'green' }, { q: 7, r: -2, type: 'green' },
            { q: 8, r: -2, type: 'green' }, { q: 9, r: -2, type: 'green' }, { q: 10, r: -2, type: 'green' },

            // 3. Reihe
            { q: 5, r: -3, type: 'green' }, { q: 6, r: -3, type: 'green' }, { q: 7, r: -3, type: 'green' }, { q: 8, r: -3, type: 'green' },
            { q: 9, r: -3, type: 'green' }, { q: 10, r: -3, type: 'green' },

            // 4. Reihe
            { q: 6, r: -4, type: 'green' }, { q: 8, r: -4, type: 'green' }, { q: 10, r: -4, type: 'green' }
        ];

        const epOrangeCoords5to6 = [
            // 1. Reihe
            { q: 3, r: 1, type: 'orange' }, { q: 5, r: 1, type: 'orange' }, { q: 7, r: 1, type: 'orange' }, { q: 9, r: 1, type: 'orange' },

            // 2. Reihe
            { q: 2, r: 2, type: 'orange' }, { q: 3, r: 2, type: 'orange' }, { q: 4, r: 2, type: 'orange' }, { q: 5, r: 2, type: 'orange' },
            { q: 6, r: 2, type: 'orange' }, { q: 7, r: 2, type: 'orange' }, { q: 8, r: 2, type: 'orange' },

            // 3. Reihe
            { q: 2, r: 3, type: 'orange' }, { q: 3, r: 3, type: 'orange' }, { q: 4, r: 3, type: 'orange' }, { q: 5, r: 3, type: 'orange' },
            { q: 6, r: 3, type: 'orange' }, { q: 7, r: 3, type: 'orange' },

            // 4. Reihe
            { q: 2, r: 4, type: 'orange' }, { q: 4, r: 4, type: 'orange' }, { q: 6, r: 4, type: 'orange' }
        ];

        // Das größere Inventar für 5-6 Spieler
        const resourceCountsPE5to6 = {
            "hex-lumber": 4, "hex-brick": 4, "hex-wool": 4, "hex-grain": 5, "hex-ore": 4
        };

        const numberCountsPE5to6 = {
            2: 1,
            3: 2,
            4: 3,
            5: 2,
            6: 3,
            8: 3,
            9: 2,
            10: 3,
            11: 2,
            12: 1
        };

        let currentGridCoords = is5to6Player ? epGridCoords5to6 : epGridCoords;
        let currentSeaCoords = is5to6Player ? epSeaCoords5to6 : epSeaCoords;
        let currentGreenCoords = is5to6Player ? epGreenCoords5to6 : epGreenCoords;
        let currentOrangeCoords = is5to6Player ? epOrangeCoords5to6 : epOrangeCoords;


        const currentResourceCounts = is5to6Player ? resourceCountsPE5to6 : resourceCountsPE;
        const currentNumberCounts = is5to6Player ? numberCountsPE5to6 : numberCountsPE;


        const epResourcesList = Object.entries(currentResourceCounts).flatMap(([res, count]) => Array(count).fill(res));
        const epNumbersList = Object.entries(currentNumberCounts).flatMap(([num, count]) => Array(count).fill(parseInt(num)));

        let validBoard = false;
        let boardTiles = [];

        // --- LOGIK-PHASE ---
        while (!validBoard) {
            let shuffledResources = shuffleArray([...epResourcesList]);
            let shuffledNumbers = shuffleArray([...epNumbersList]);
            boardTiles = [];

            // Erst die Landfelder generieren
            currentGridCoords.forEach(cell => {
                let resource = null;
                let number = null;

                if (cell.type === 'start') {
                    resource = "hex-wool";
                    if (isPEStartField6Active) {
                        number = 6;
                        const sixIndex = shuffledNumbers.indexOf(6);
                        if (sixIndex !== -1) {
                            shuffledNumbers.splice(sixIndex, 1);
                        }
                    }
                    else
                        number = shuffledNumbers.pop();
                } else {
                    resource = shuffledResources.pop();
                    number = shuffledNumbers.pop();
                }

                boardTiles.push({ q: cell.q, r: cell.r, resource, number, type: cell.type });
            });

            validBoard = isValidHexBoard(boardTiles);
        }

        [...currentSeaCoords, ...currentGreenCoords, ...currentOrangeCoords].forEach(cell => {

            // Zuweisen der richtigen CSS-Klasse für das Sechseck
            let hexResource = 'hex-sea';
            if (cell.type === 'd2') hexResource = 'hex-ep-d2';
            if (cell.type === 'green' || cell.type === 'orange') hexResource = 'hex-unexplored';

            boardTiles.push({
                q: cell.q,
                r: cell.r,
                resource: hexResource,
                number: null,
                type: cell.type,
                label: cell.label
            });
        });

        // --- ZEICHNEN-PHASE ---
        const centerX = 300;
        const centerY = 500;

        boardTiles.forEach(tile => {
            const x = centerX + HEX_WIDTH * (tile.q + tile.r / 2);
            const y = centerY + HEX_SIZE * 1.5 * tile.r;

            // 1. Hexagon zeichnen
            drawHex(x, y, tile.resource);

            // 2. Zahlen-Chip zeichnen (nur wenn vorhanden)
            if (tile.number !== null) {
                drawToken(x, y, tile.number);
            }

            if (tile.type === 'green' || tile.type === 'orange') {
                drawUnexploredToken(x, y, tile.type);
            }

            // 3. NEU: Große Beschriftung zeichnen (C1, C2, D2, D3, E, EE, F, EG, G)
            if (tile.label && isPEShowPlateLabelsActive) {
                let container = createRotatableGroup(x, y);

                const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
                text.setAttribute("x", x);
                text.setAttribute("y", y + 8); // Leicht nach unten versetzt für perfekte Mitte
                text.setAttribute("text-anchor", "middle");
                text.setAttribute("font-family", "sans-serif");
                text.setAttribute("font-size", "24"); // Schön groß
                text.setAttribute("font-weight", "bold");

                // D2 (Braun) bekommt weiße Schrift, das Meer (Blau) bekommt eine sehr dunkle blaue Schrift
                text.setAttribute("fill", tile.type === 'd2' || tile.type === 'd3' ? "#ffffff" : "#1a365d");

                text.textContent = tile.label;
                container.appendChild(text);
            }
        });
        let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
        boardTiles.forEach(tile => {
            const x = centerX + HEX_WIDTH * (tile.q + tile.r / 2);
            const y = centerY + HEX_SIZE * 1.5 * tile.r;
            if (x < minX) minX = x;
            if (x > maxX) maxX = x;
            if (y < minY) minY = y;
            if (y > maxY) maxY = y;
        });

        const isPortrait = window.matchMedia("(orientation: portrait) and (max-width: 900px)").matches;
        
        let lMinX = minX - 120;
        let lMaxX = maxX + 120;
        let lMinY = minY - 120;
        let lMaxY = maxY + 120;
        const viewBoxLandscape = `${lMinX} ${lMinY} ${lMaxX - lMinX} ${lMaxY - lMinY}`;

        const pMinX = centerX - maxY + centerY - 120;
        const pMaxX = centerX - minY + centerY + 120;
        const pMinY = centerY + minX - centerX - 120;
        const pMaxY = centerY + maxX - centerX + 120;
        const viewBoxPortrait = `${pMinX} ${pMinY} ${pMaxX - pMinX} ${pMaxY - pMinY}`;

        svgMap.setAttribute("data-viewbox-landscape", viewBoxLandscape);
        svgMap.setAttribute("data-viewbox-portrait", viewBoxPortrait);

        svgMap.setAttribute("viewBox", isPortrait ? viewBoxPortrait : viewBoxLandscape);
    }

    function generateMHMap(is5to6Player) {
        const isRandomRobber = document.getElementById("tb-random-robber").checked;
        const isRandomDesert = document.getElementById("tb-random-desert").checked;

        const gridCoords5to6 = [
            [0, -3], [1, -3], [2, -3], [3, -3],                                 // Reihe 1
            [-1, -2], [0, -2], [1, -2], [2, -2], [3, -2],                       // Reihe 2
            [-2, -1], [-1, -1], [0, -1], [1, -1], [2, -1], [3, -1],             // Reihe 3
            [-3, 0], [-2, 0], [-1, 0], [0, 0], [1, 0], [2, 0], [3, 0],   // Reihe 4
            [-3, 1], [-2, 1], [-1, 1], [0, 1], [1, 1], [2, 1],             // Reihe 5
            [-3, 2], [-2, 2], [-1, 2], [0, 2], [1, 2],                       // Reihe 6
            [-3, 3], [-2, 3], [-1, 3], [0, 3]                                  // Reihe 7
        ];

        // Kante 0: Rechts (0°)
        // Kante 1: Unten Rechts (60°)
        // Kante 2: Unten Links (120°)
        // Kante 3: Links (180°)
        // Kante 4: Oben Links (240°)
        // Kante 5: Oben Rechts (300°)
        const harbors5to6 = [
            { q: 1, r: -3, edge: 4, text: "Erz", color: "var(--color-ore)" },
            { q: 3, r: -3, edge: 5, text: "3:1", color: "var(--color-3to1)" },
            { q: 3, r: -2, edge: 0, text: "Schaf", color: "var(--color-wool)" },
            { q: 2, r: 1, edge: 0, text: "3:1", color: "var(--color-3to1)" },
            { q: 0, r: 3, edge: 0, text: "Schaf", color: "var(--color-wool)" },
            { q: -1, r: 3, edge: 1, text: "Holz", color: "var(--color-lumber)" },
            { q: -3, r: 3, edge: 2, text: "3:1", color: "var(--color-3to1)" },
            { q: -3, r: 2, edge: 3, text: "Lehm", color: "var(--color-brick)" },
            { q: -3, r: 0, edge: 3, text: "3:1", color: "var(--color-3to1)" },
            { q: -2, r: -1, edge: 4, text: "Weizen", color: "var(--color-grain)" },
            { q: 0, r: -3, edge: 3, text: "3:1", color: "var(--color-3to1)" },
        ];

        const currentGrid = is5to6Player ? gridCoords5to6 : gridCoords;
        const currentHarbors = is5to6Player ? harbors5to6 : baseHarbors;

        let validBoard = false;
        let boardTiles = []; // Hier speichern wir das Brett vor dem Zeichnen


        // Feste Positionen für Händler & Barbaren (3-4 Spieler)
        const tbFixedCoords = {
            "0,-2": "hex-tb-castle-half", // Ganz oben links
            "2,0": "hex-tb-mine-half",   // Ganz rechts in der Mitte
            "-2,2": "hex-tb-cabin-half"   // Ganz unten links
        };

        // Feste Positionen für Händler & Barbaren (5-6 Spieler)
        let tbFixedCoords5to6;
        if (!isRandomDesert) {
            tbFixedCoords5to6 = {
                "0,0": "hex-tb-castle-full",

                "0,-3": "hex-tb-mine-half",
                "3,0": "hex-tb-mine-full",
                "-3,3": "hex-tb-mine-full",

                "0,3": "hex-tb-cabin-half",
                "-3,0": "hex-tb-cabin-full",
                "3,-3": "hex-tb-cabin-full",

                "0,2": "hex-desert",
                "0,-2": "hex-desert"
            }
        }
        else {
            tbFixedCoords5to6 = {
                "0,0": "hex-tb-castle-full",

                "0,-3": "hex-tb-mine-half",
                "3,0": "hex-tb-mine-full",
                "-3,3": "hex-tb-mine-full",

                "0,3": "hex-tb-cabin-half",
                "-3,0": "hex-tb-cabin-full",
                "3,-3": "hex-tb-cabin-full"
            }
        }
        const currentMHFixed = is5to6Player ? tbFixedCoords5to6 : tbFixedCoords;

        // --- LOGIK-PHASE: Brett generieren und prüfen ---
        while (!validBoard) {
            // Hier ebenfalls die richtigen Inventare mischen
            let currentResourcesList = is5to6Player ? [...resources5to6] : [...baseResources];
            let currentNumbersList = is5to6Player ? [...numbers5to6] : [...baseNumbers];

            const removeRes = (resName) => {
                const idx = currentResourcesList.indexOf(resName);
                if (idx > -1) currentResourcesList.splice(idx, 1);
            };
            const removeNum = (num) => {
                const idx = currentNumbersList.indexOf(num);
                if (idx > -1) currentNumbersList.splice(idx, 1);
            };
            if (!is5to6Player) {

                removeRes("hex-desert");
                removeRes("hex-lumber");
                removeRes("hex-wool");

                removeNum(2);
                removeNum(12);
            }
            else {
                if (!isRandomDesert) {
                    // --- 5-6 SPIELER LOGIK ---
                    // 1. Die beiden Wüsten aus dem Zufallsstapel löschen, da sie fest platziert werden
                    removeRes("hex-desert");
                    removeRes("hex-desert");
                }
            }


            let shuffledResources = shuffleArray(currentResourcesList);
            let shuffledNumbers = shuffleArray(currentNumbersList);

            boardTiles = [];

            // Schleife über das DYNAMISCHE Gitter
            currentGrid.forEach((coord) => {
                const q = coord[0];
                const r = coord[1];
                const coordKey = `${q},${r}`;

                let resource = null;
                let number = null;

                if (currentMHFixed[coordKey]) {
                    resource = currentMHFixed[coordKey];
                    number = null; // Feste Felder haben nie eine Zahl
                }
                else {
                    resource = shuffledResources.pop();

                    if (resource !== "hex-desert") {
                        number = shuffledNumbers.pop();
                    }
                }

                boardTiles.push({ q, r, resource, number });
            });

            validBoard = isValidHexBoard(boardTiles);
        }

        // --- ZEICHNEN-PHASE: Das gültige Brett rendern ---
        const centerX = 500;
        const centerY = 500;

        currentHarbors.forEach(harbor => {
            const hx = centerX + HEX_WIDTH * (harbor.q + harbor.r / 2);
            const hy = centerY + HEX_SIZE * 1.5 * harbor.r;
            drawHarbor(hx, hy, harbor.edge, harbor.text, harbor.color);
        });

        boardTiles.forEach(tile => {
            const x = centerX + HEX_WIDTH * (tile.q + tile.r / 2);
            const y = centerY + HEX_SIZE * 1.5 * tile.r;
            drawHex(x, y, tile.resource);
            if (tile.number !== null) {
                drawToken(x, y, tile.number);
            }
            if (tile.resource.startsWith("hex-tb-")) {
                let cornersToDraw = [0, 1, 2, 3, 4, 5];

                // Für halbe Kacheln nur 3 Wege Richtung Inselmitte (centerX, centerY) zeichnen
                if (tile.resource.endsWith("-half")) {
                    const dx = centerX - x;
                    const dy = centerY - y;
                    const angleToCenter = Math.atan2(dy, dx);

                    const cornerAngles = [
                        -Math.PI / 2,         // 0: Top
                        -Math.PI / 6,         // 1: Top-Right
                        Math.PI / 6,          // 2: Bottom-Right
                        Math.PI / 2,          // 3: Bottom
                        5 * Math.PI / 6,      // 4: Bottom-Left
                        -5 * Math.PI / 6      // 5: Top-Left
                    ];

                    let cornerDiffs = cornerAngles.map((ca, index) => {
                        let diff = Math.abs(ca - angleToCenter);
                        if (diff > Math.PI) diff = 2 * Math.PI - diff;
                        return { index, diff };
                    });

                    cornerDiffs.sort((a, b) => a.diff - b.diff);
                    cornersToDraw = cornerDiffs.slice(0, 4).map(c => c.index);
                }

                // Die 6 Ecken des Hexagons
                const hexCorners = [
                    { x: x, y: y - HEX_SIZE },                                  // 0: Top
                    { x: x + (HEX_WIDTH / 2), y: y - (HEX_SIZE / 2) },          // 1: Top-Right
                    { x: x + (HEX_WIDTH / 2), y: y + (HEX_SIZE / 2) },          // 2: Bottom-Right
                    { x: x, y: y + HEX_SIZE },                                  // 3: Bottom
                    { x: x - (HEX_WIDTH / 2), y: y + (HEX_SIZE / 2) },          // 4: Bottom-Left
                    { x: x - (HEX_WIDTH / 2), y: y - (HEX_SIZE / 2) }           // 5: Top-Left
                ];

                // Straßenlinien zeichnen
                cornersToDraw.forEach(idx => {
                    const pt = hexCorners[idx];
                    const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
                    line.setAttribute("x1", x);
                    line.setAttribute("y1", y);
                    line.setAttribute("x2", pt.x);
                    line.setAttribute("y2", pt.y);
                    line.setAttribute("stroke", "var(--color-pier)"); // Straßenfarbe Kupfer/Braun
                    line.setAttribute("stroke-width", "8");
                    svgMap.appendChild(line);
                });

                // Hexagon-Rand nochmal drüberzeichnen, damit die Straßen "unter" dem Rand liegen
                const hexOverlay = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
                const ptsString = hexCorners.map(p => `${p.x},${p.y}`).join(" ");
                hexOverlay.setAttribute("points", ptsString);
                hexOverlay.setAttribute("fill", "none");
                hexOverlay.setAttribute("stroke", "var(--color-dark)");
                hexOverlay.setAttribute("stroke-width", "2");
                svgMap.appendChild(hexOverlay);

                // Hintergrund-Kreis für das Gebäude-Bild
                const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
                circle.setAttribute("cx", x);
                circle.setAttribute("cy", y);
                circle.setAttribute("r", 22); // Größe des zentralen Platzes
                circle.setAttribute("fill", "#ffffff");
                circle.setAttribute("stroke", "var(--color-dark)");
                circle.setAttribute("stroke-width", "2");
                svgMap.appendChild(circle);

                // Das eigentliche Bild (Burg, Mine oder Hütte) laden
                let imgSrc = "";
                if (tile.resource.includes("castle")) imgSrc = "./image/castle.png";
                if (tile.resource.includes("mine")) imgSrc = "./image/mine.png";
                if (tile.resource.includes("cabin")) imgSrc = "./image/cabin.png";

                if (imgSrc) {
                    const img = document.createElementNS("http://www.w3.org/2000/svg", "image");
                    img.setAttribute("href", imgSrc);
                    // Bild zentrieren (etwas kleiner als der Kreis-Radius)
                    img.setAttribute("x", x - 14);
                    img.setAttribute("y", y - 14);
                    img.setAttribute("width", 28);
                    img.setAttribute("height", 28);
                    svgMap.appendChild(img);
                }
            }
        });

        let highwaymen = [];

        if (isRandomRobber) {
            // Wir filtern Wasser raus
            const landTiles = boardTiles.filter(t => t.resource !== "hex-sea");

            // NEU: Hilfsfunktion, die geteilte Kanten vereinheitlicht
            const getUniqueEdgeId = (q, r, edge) => {
                // Wandelt die linken Kanten (3,4,5) in die rechten Kanten (0,1,2) der Nachbarn um
                if (edge === 3) return `${q - 1},${r},0`;       // Links = Rechts vom linken Nachbarn
                if (edge === 4) return `${q},${r - 1},1`;       // Oben-Links = Unten-Rechts vom oberen Nachbarn
                if (edge === 5) return `${q + 1},${r - 1},2`;   // Oben-Rechts = Unten-Links vom obigen rechten Nachbarn
                return `${q},${r},${edge}`;                     // 0, 1 und 2 bleiben wie sie sind
            };

            const occupiedEdges = new Set(); // Speichert die eindeutigen Straßen
            const occupiedHexes = new Set(); // Speichert die Hexagone (damit sie sich gut verteilen)

            while (highwaymen.length < 3) {
                const randomTile = landTiles[Math.floor(Math.random() * landTiles.length)];
                const randomEdge = Math.floor(Math.random() * 6);

                const hexId = `${randomTile.q},${randomTile.r}`;
                const edgeId = getUniqueEdgeId(randomTile.q, randomTile.r, randomEdge);

                // PRÜFUNG: Steht schon jemand auf diesem Sechseck ODER auf exakt dieser Straße?
                if (!occupiedHexes.has(hexId) && !occupiedEdges.has(edgeId)) {

                    // Beide IDs als "besetzt" markieren
                    occupiedHexes.add(hexId);
                    occupiedEdges.add(edgeId);

                    // Den Räuber endgültig hinzufügen
                    highwaymen.push({ q: randomTile.q, r: randomTile.r, edge: randomEdge });
                }
            }
        } else {
            // STANDARD-LOGIK: Die festen Positionen aus dem Regelwerk
            // Kante 0: Rechts (0°)
            // Kante 1: Unten Rechts (60°)
            // Kante 2: Unten Links (120°)
            // Kante 3: Links (180°)
            // Kante 4: Oben Links (240°)
            // Kante 5: Oben Rechts (300°)
            if (is5to6Player) {
                highwaymen = [
                    { q: 1, r: 2, edge: 3 },
                    { q: -2, r: 0, edge: 2 },
                    { q: 2, r: -3, edge: 1 }
                ];
            } else {
                highwaymen = [
                    { q: 0, r: -1, edge: 3 },
                    { q: -1, r: 2, edge: 4 },
                    { q: 1, r: 0, edge: 5 }
                ];
            }
        }

        // Die gefundenen Wegräuber zeichnen
        highwaymen.forEach(robber => {
            const hexX = centerX + HEX_WIDTH * (robber.q + robber.r / 2);
            const hexY = centerY + HEX_SIZE * 1.5 * robber.r;
            drawHighwayman(hexX, hexY, robber.edge);
        });
        svgMap.setAttribute("viewBox", is5to6Player ? "-50 -50 1100 1100" : "50 50 900 900");
    }


    generateBtn.addEventListener("click", generateMap);
    generateMap();
});
// --- UI Logik: Modal steuern ---
const modalOverlay = document.getElementById("settings-modal");
const openSettingsBtn = document.getElementById("open-settings-btn");
const closeSettingsBtn = document.getElementById("close-settings-btn");

// Fenster öffnen
openSettingsBtn.addEventListener("click", () => {
    modalOverlay.classList.remove("hidden");
});

// Fenster schließen (Klick auf das X)
closeSettingsBtn.addEventListener("click", () => {
    modalOverlay.classList.add("hidden");
});

// Profi-Feature: Fenster schließen, wenn man daneben ins Dunkle klickt
modalOverlay.addEventListener("click", (event) => {
    if (event.target === modalOverlay) {
        modalOverlay.classList.add("hidden");
    }
});

// --- UI Logik: Credits Modal steuern ---
const creditsModal = document.getElementById("credits-modal");
const openCreditsBtn = document.getElementById("open-credits-btn");
const closeCreditsBtn = document.getElementById("close-credits-btn");

if (openCreditsBtn && creditsModal && closeCreditsBtn) {
    openCreditsBtn.addEventListener("click", () => {
        creditsModal.classList.remove("hidden");
    });

    closeCreditsBtn.addEventListener("click", () => {
        creditsModal.classList.add("hidden");
    });

    creditsModal.addEventListener("click", (event) => {
        if (event.target === creditsModal) {
            creditsModal.classList.add("hidden");
        }
    });
}


if ("serviceWorker" in navigator) {
    window.addEventListener("load", function () {
        navigator.serviceWorker.register("./sw.js")
            .then(res => console.log("Service Worker aktiv!"))
            .catch(err => console.log("Service Worker Fehler", err));
    });
}

window.addEventListener('load', function () {
    const zoomElement = document.getElementById("panzoom-layer");

    panzoom(zoomElement, {
        maxZoom: 1.5,      // Wie weit man hineinzoomen kann
        minZoom: 0.33,    // Wie weit man herauszoomen kann
        bounds: true,    // Verhindert, dass man die Karte komplett aus dem Bildschirm wischt
        boundsPadding: 0.1,
        smoothScroll: false // Besser für Handys
    });
});