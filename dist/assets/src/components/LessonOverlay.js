import { jsx as _jsx } from "react/jsx-runtime";
import { useEffect, useRef } from "react";
export function LessonOverlay({ annotations, animParts, revealedCount, stepText, stepIndex, totalSteps, atoms, bonds, width, height, theme, zoom = 1 }) {
    const canvasRef = useRef(null);
    const frameRef = useRef(0);
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas)
            return;
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx)
            return;
        let running = true;
        const offsetX = Math.max(0, (width - 920) / 2);
        const offsetY = (height * 0.5) - 300;
        const draw = () => {
            if (!running)
                return;
            const now = Date.now();
            const t = performance.now() * 0.001;
            ctx.clearRect(0, 0, width, height);
            ctx.save();
            ctx.translate(width / 2, height / 2);
            ctx.scale(zoom, zoom);
            ctx.translate(-width / 2, -height / 2);
            const atomById = new Map(atoms.map((a) => [a.id, a]));
            const isDark = theme === "dark";
            const textColor = isDark ? "#f8fafc" : "#17211d";
            const accentColor = "#5eead4";
            const bgColor = isDark ? "rgba(10,14,22,0.88)" : "rgba(255,255,255,0.92)";
            const drawCentered = (fn) => {
                ctx.save();
                ctx.translate(offsetX, offsetY);
                fn();
                ctx.restore();
            };
            // --- Annotations ---
            for (const ann of annotations) {
                if (ann.duration <= 0)
                    continue;
                ctx.save();
                ctx.globalAlpha = 0.94;
                const atom = ann.atomId ? atomById.get(ann.atomId) : undefined;
                let cx = width / 2;
                let cy = height * 0.2;
                if (atom) {
                    cx = atom.x;
                    cy = atom.y - atom.radius - 38;
                }
                if (ann.type === "highlight" && atom) {
                    ctx.strokeStyle = accentColor;
                    ctx.lineWidth = 3;
                    ctx.shadowColor = accentColor;
                    ctx.shadowBlur = 14;
                    ctx.beginPath();
                    ctx.arc(atom.x, atom.y, atom.radius + 10, 0, Math.PI * 2);
                    ctx.stroke();
                    ctx.shadowBlur = 0;
                }
                if (ann.type === "pulse" && atom) {
                    ctx.strokeStyle = accentColor;
                    ctx.lineWidth = 2;
                    ctx.globalAlpha = 0.42;
                    const pulse = 1 + Math.sin(now * 0.004) * 0.08;
                    ctx.beginPath();
                    ctx.arc(atom.x, atom.y, (atom.radius + 14) * pulse, 0, Math.PI * 2);
                    ctx.stroke();
                    ctx.globalAlpha = 0.94;
                }
                if (ann.message)
                    drawAnnotationBox(ctx, ann.message, cx, cy, bgColor, accentColor, textColor);
                ctx.restore();
            }
            // --- Animation Parts ---
            const maxReveal = revealedCount ?? 999;
            let partIdx = 0;
            if (animParts?.length) {
                for (const part of animParts) {
                    partIdx++;
                    if (partIdx > maxReveal)
                        break;
                    ctx.save();
                    ctx.globalAlpha = 0.9;
                    const isAtomBound = "atomIndex" in part && part.atomIndex !== undefined && atoms[part.atomIndex];
                    const a = isAtomBound ? atoms[part.atomIndex] : null;
                    // Ring (atom-bound, no centering)
                    if (part.type === "ring" && a) {
                        ctx.strokeStyle = part.color;
                        ctx.lineWidth = 2;
                        ctx.setLineDash([4, 4]);
                        const pulse = 1 + Math.sin(t * 1.8) * 0.04;
                        ctx.beginPath();
                        ctx.arc(a.x, a.y, part.radius * pulse, 0, Math.PI * 2);
                        ctx.stroke();
                        ctx.setLineDash([]);
                    }
                    // Highlight (atom-bound, no centering)
                    if (part.type === "highlight" && a) {
                        const color = part.color ?? accentColor;
                        ctx.strokeStyle = color;
                        ctx.lineWidth = 3;
                        ctx.shadowColor = color;
                        ctx.shadowBlur = 14;
                        ctx.beginPath();
                        ctx.arc(a.x, a.y, a.radius + 12, 0, Math.PI * 2);
                        ctx.stroke();
                        ctx.shadowBlur = 0;
                    }
                    // Pulse (atom-bound, no centering)
                    if (part.type === "pulse" && a) {
                        ctx.strokeStyle = accentColor;
                        ctx.lineWidth = 2;
                        ctx.globalAlpha = 0.5;
                        const pulse = 1 + Math.sin(t * 2.8) * 0.1;
                        ctx.beginPath();
                        ctx.arc(a.x, a.y, (a.radius + 14) * pulse, 0, Math.PI * 2);
                        ctx.stroke();
                        ctx.globalAlpha = 0.9;
                    }
                    // Arrow between atoms (no centering)
                    if (part.type === "arrow" && "fromIndex" in part && atoms[part.fromIndex] && atoms[part.toIndex]) {
                        const from = atoms[part.fromIndex];
                        const to = atoms[part.toIndex];
                        const color = part.color ?? accentColor;
                        const dx = to.x - from.x;
                        const dy = to.y - from.y;
                        const dist = Math.max(0.01, Math.hypot(dx, dy));
                        const ux = dx / dist;
                        const uy = dy / dist;
                        ctx.strokeStyle = color;
                        ctx.fillStyle = color;
                        ctx.lineWidth = 2.5;
                        ctx.beginPath();
                        ctx.moveTo(from.x + ux * (from.radius + 8), from.y + uy * (from.radius + 8));
                        ctx.lineTo(to.x - ux * (to.radius + 8), to.y - uy * (to.radius + 8));
                        ctx.stroke();
                        ctx.beginPath();
                        ctx.moveTo(to.x, to.y);
                        ctx.lineTo(to.x - ux * 10 + -uy * 5, to.y - uy * 10 + ux * 5);
                        ctx.lineTo(to.x - ux * 10 - -uy * 5, to.y - uy * 10 - ux * 5);
                        ctx.closePath();
                        ctx.fill();
                    }
                    // Label anchored to atom (no centering)
                    if (part.type === "label" && a) {
                        let lx = a.x;
                        let ly = a.y;
                        if (part.position === "top")
                            ly = a.y - a.radius - 28;
                        else if (part.position === "bottom")
                            ly = a.y + a.radius + 28;
                        else if (part.position === "left")
                            lx = a.x - a.radius - 70;
                        else
                            lx = a.x + a.radius + 70;
                        drawAnnotationBox(ctx, part.text, lx, ly, bgColor, accentColor, textColor);
                    }
                    // Sub-atomic: electrons anchored to atom (no centering)
                    if (part.type === "electrons" && a) {
                        drawElectronShells(ctx, part.shells, a.x, a.y, t, accentColor);
                    }
                    // Orbital anchored to atom (no centering)
                    if (part.type === "orbital" && a) {
                        drawOrbital(ctx, part.count, part.radius, a.x, a.y, part.color ?? accentColor, t);
                    }
                    // ---- Centered content (fixed-position, not tied to sim atoms) ----
                    drawCentered(() => {
                        // Nucleus
                        if (part.type === "nucleus") {
                            drawNucleus(ctx, part.x, part.y, part.protons, part.neutrons, part.radius ?? 20, t, textColor);
                        }
                        // Electron shells (static position)
                        if (part.type === "electrons-at") {
                            drawElectronShells(ctx, part.shells, part.x, part.y, t, accentColor);
                        }
                        // Orbital (static)
                        if (part.type === "orbital-at") {
                            const p = part;
                            drawOrbital(ctx, p.count, p.radius, p.x, p.y, p.color ?? accentColor, t);
                        }
                        if (part.type === "cloud-at") {
                            const p = part;
                            drawProbabilityCloud(ctx, p.x, p.y, p.radius, p.count ?? 44, p.color ?? accentColor, p.label, t, textColor);
                        }
                        // Position-anchored text
                        if (part.type === "text-at") {
                            let tx = part.x;
                            let ty = part.y;
                            if (part.anchor === "top")
                                ty -= 25;
                            else if (part.anchor === "bottom")
                                ty += 25;
                            else if (part.anchor === "left")
                                tx -= 70;
                            else if (part.anchor === "right")
                                tx += 70;
                            drawAnnotationBox(ctx, part.message, tx, ty, bgColor, accentColor, textColor);
                        }
                        // Mini grid table
                        if (part.type === "grid") {
                            for (let row = 0; row < part.rows; row++) {
                                for (let col = 0; col < part.cols; col++) {
                                    const idx = row * part.cols + col;
                                    if (idx >= part.cells.length)
                                        continue;
                                    const cell = part.cells[idx];
                                    const gx = part.x + col * part.cellW;
                                    const gy = part.y + row * part.cellH;
                                    ctx.fillStyle = cell.bgColor ?? (isDark ? "rgba(30,40,50,0.7)" : "rgba(240,245,250,0.85)");
                                    roundRect(ctx, gx + 2, gy + 2, part.cellW - 4, part.cellH - 4, 5);
                                    ctx.fill();
                                    if (cell.active) {
                                        ctx.strokeStyle = cell.ringColor ?? accentColor;
                                        ctx.lineWidth = 2;
                                        roundRect(ctx, gx + 2, gy + 2, part.cellW - 4, part.cellH - 4, 5);
                                        ctx.stroke();
                                    }
                                    ctx.fillStyle = cell.textColor ?? textColor;
                                    ctx.font = "bold 13px Inter";
                                    ctx.textAlign = "center";
                                    ctx.textBaseline = "middle";
                                    ctx.fillText(cell.label, gx + part.cellW / 2, gy + part.cellH / 2 - (cell.sub ? 6 : 0));
                                    if (cell.sub) {
                                        ctx.font = "700 9px Inter";
                                        ctx.fillStyle = isDark ? "#9ca3af" : "#6b7280";
                                        ctx.fillText(cell.sub, gx + part.cellW / 2, gy + part.cellH / 2 + 10);
                                    }
                                }
                            }
                        }
                        // Bar chart
                        if (part.type === "bar") {
                            const h = 22;
                            roundRect(ctx, part.x, part.y, part.totalWidth, h, 4);
                            ctx.fillStyle = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)";
                            ctx.fill();
                            const w = Math.max(4, part.width * (part.totalWidth / Math.max(1, part.totalWidth)));
                            ctx.fillStyle = part.color;
                            roundRect(ctx, part.x, part.y, w, h, 4);
                            ctx.fill();
                            if (part.label) {
                                ctx.fillStyle = textColor;
                                ctx.font = "700 10px Inter";
                                ctx.textAlign = "left";
                                ctx.textBaseline = "middle";
                                ctx.fillText(part.label, part.x + 6, part.y + h / 2);
                            }
                            if (part.sub) {
                                ctx.fillStyle = isDark ? "#9ca3af" : "#6b7280";
                                ctx.font = "700 9px Inter";
                                ctx.textAlign = "right";
                                ctx.fillText(part.sub, part.x + part.totalWidth + 6, part.y + h / 2);
                            }
                        }
                        // Bar group
                        if (part.type === "bar-group") {
                            const h = 28;
                            const gap = 4;
                            let bOffset = part.y;
                            for (const item of part.items) {
                                roundRect(ctx, part.x, bOffset, item.width, h, 4);
                                ctx.fillStyle = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)";
                                ctx.fill();
                                ctx.fillStyle = item.color;
                                roundRect(ctx, part.x, bOffset, item.width, h, 4);
                                ctx.fill();
                                ctx.fillStyle = "#fff";
                                ctx.font = "800 10px Inter";
                                ctx.textAlign = "left";
                                ctx.textBaseline = "middle";
                                ctx.fillText(item.label, part.x + 8, bOffset + h / 2);
                                bOffset += h + gap;
                            }
                        }
                    });
                    ctx.restore();
                }
            }
            ctx.restore();
            // --- Screen-space text overlays (outside zoom/centering) ---
            if (animParts?.length) {
                let screenIdx = 0;
                for (const part of animParts) {
                    screenIdx++;
                    if (screenIdx > (revealedCount ?? 999))
                        break;
                    if (part.type !== "text")
                        continue;
                    let tx = width / 2;
                    let ty = height * 0.3;
                    if (part.position === "top")
                        ty = 56;
                    else if (part.position === "bottom")
                        ty = height - 52;
                    drawAnnotationBox(ctx, part.message, tx, ty, bgColor, accentColor, textColor);
                }
            }
            if (totalSteps && totalSteps > 0) {
                ctx.save();
                ctx.globalAlpha = 0.82;
                ctx.font = "800 11px Inter, system-ui";
                const hint = "Press Spacebar to move to the next step.";
                const paddingX = 12;
                const hintWidth = ctx.measureText(hint).width + paddingX * 2;
                const hintHeight = 28;
                const x = Math.max(14, width - hintWidth - 16);
                const y = height - hintHeight - 16;
                ctx.fillStyle = bgColor;
                ctx.strokeStyle = "rgba(94,234,212,0.22)";
                ctx.lineWidth = 1;
                roundRect(ctx, x, y, hintWidth, hintHeight, 8);
                ctx.fill();
                ctx.stroke();
                ctx.fillStyle = textColor;
                ctx.textAlign = "center";
                ctx.textBaseline = "middle";
                ctx.fillText(hint, x + hintWidth / 2, y + hintHeight / 2 + 0.5);
                ctx.restore();
            }
            if (running)
                frameRef.current = requestAnimationFrame(draw);
        };
        draw();
        return () => { running = false; cancelAnimationFrame(frameRef.current); if (ctx)
            ctx.clearRect(0, 0, width, height); };
    }, [annotations, stepText, stepIndex, totalSteps, animParts, revealedCount, atoms, bonds, height, theme, width, zoom]);
    return (_jsx("canvas", { ref: canvasRef, className: "simulation-canvas lesson-overlay-canvas", "aria-hidden": "true" }));
}
function drawElectronShells(ctx, shells, x, y, t, accentColor) {
    for (const shell of shells) {
        ctx.strokeStyle = shell.color ?? accentColor;
        ctx.lineWidth = 2.5;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.arc(x, y, shell.radius * 1.6, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
        for (let i = 0; i < shell.count; i++) {
            const angle = (shell.orbit !== false ? t * 1.2 : 0) + (i * Math.PI * 2 / shell.count);
            ctx.fillStyle = shell.color ?? accentColor;
            ctx.beginPath();
            ctx.arc(x + Math.cos(angle) * shell.radius * 1.6, y + Math.sin(angle) * shell.radius * 1.6, 7, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowColor = shell.color ?? accentColor;
            ctx.shadowBlur = 10;
            ctx.fill();
            ctx.shadowBlur = 0;
        }
    }
}
function drawOrbital(ctx, count, radius, x, y, color, t) {
    ctx.strokeStyle = color;
    ctx.lineWidth = 2.5;
    ctx.setLineDash([4, 6]);
    ctx.beginPath();
    ctx.arc(x, y, radius * 1.5, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
    for (let i = 0; i < count; i++) {
        const angle = t * 1.5 + (i * Math.PI * 2 / count);
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(x + Math.cos(angle) * radius * 1.5, y + Math.sin(angle) * radius * 1.5, 6, 0, Math.PI * 2);
        ctx.fill();
    }
}
function drawProbabilityCloud(ctx, x, y, radius, count, color, label, t, textColor) {
    const outer = radius * 1.65;
    const gradient = ctx.createRadialGradient(x, y, radius * 0.18, x, y, outer);
    gradient.addColorStop(0, colorWithAlpha(color, 0.22));
    gradient.addColorStop(0.48, colorWithAlpha(color, 0.13));
    gradient.addColorStop(1, colorWithAlpha(color, 0));
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(x, y, outer, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = colorWithAlpha(color, 0.46);
    for (let i = 0; i < count; i += 1) {
        const seed = (i + 1) * 17;
        const angle = seed * 2.399963 + t * 0.18;
        const dist = outer * (0.16 + 0.82 * Math.sqrt(((seed * 43) % 113) / 112));
        const px = x + Math.cos(angle) * dist;
        const py = y + Math.sin(angle) * dist * (0.62 + 0.14 * Math.sin(seed));
        ctx.beginPath();
        ctx.arc(px, py, 2.1, 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.lineCap = "round";
    for (let i = 0; i < 5; i += 1) {
        const phase = i * 1.35;
        const angle = t * (1.05 + i * 0.12) + phase;
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(phase * 0.35);
        ctx.strokeStyle = colorWithAlpha(color, 0.45);
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.ellipse(0, 0, outer * 0.72, outer * (0.32 + i * 0.055), 0, angle - 0.45, angle + 0.08);
        ctx.stroke();
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(Math.cos(angle) * outer * 0.72, Math.sin(angle) * outer * (0.32 + i * 0.055), 4.4, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
    if (label) {
        ctx.font = "900 13px Inter, system-ui";
        ctx.textAlign = "center";
        ctx.textBaseline = "top";
        ctx.fillStyle = textColor;
        ctx.fillText(label, x, y + outer + 18);
    }
}
function drawNucleus(ctx, x, y, protons, neutrons, size, t, textColor) {
    const scale = 2.4;
    const r = Math.max(6, size / 5 * scale);
    const total = protons + neutrons;
    const pts = [];
    for (let i = 0; i < total; i++) {
        const angle = (i * Math.PI * 2 / total) + t * 0.2;
        const dist = r * 2.2;
        const isProton = i < protons;
        pts.push({
            x: x + Math.cos(angle) * dist,
            y: y + Math.sin(angle) * dist,
            color: isProton ? "#ef4444" : "#9ca3af",
            isProton
        });
    }
    for (const p of pts) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.fill();
        ctx.strokeStyle = "rgba(0,0,0,0.15)";
        ctx.lineWidth = 1;
        ctx.stroke();
    }
    const labelW = 150;
    const labelH = 50;
    let labelX = x - labelW / 2;
    labelX = Math.max(16, Math.min(ctx.canvas.width - labelW - 16, labelX));
    const labelY = Math.max(16, Math.min(ctx.canvas.height - labelH - 16, y + Math.max(120, size * 4.9)));
    const darkText = textColor.toLowerCase() === "#f8fafc";
    ctx.shadowColor = "rgba(15,23,42,0.18)";
    ctx.shadowBlur = 10;
    ctx.shadowOffsetY = 3;
    ctx.fillStyle = darkText ? "rgba(10,14,22,0.98)" : "rgba(255,255,255,0.98)";
    ctx.strokeStyle = darkText ? "rgba(94,234,212,0.45)" : "rgba(20,184,166,0.32)";
    ctx.lineWidth = 1.4;
    roundRect(ctx, labelX, labelY, labelW, labelH, 8);
    ctx.fill();
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;
    ctx.font = "900 13px Inter, system-ui";
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "#ef4444";
    ctx.fillText(`${protons} protons (+)`, labelX + 14, labelY + 18);
    ctx.fillStyle = darkText ? "#d1d5db" : "#4b5563";
    ctx.fillText(`${neutrons} neutrons`, labelX + 14, labelY + 36);
}
function colorWithAlpha(color, alpha) {
    if (!color.startsWith("#"))
        return color;
    const clean = color.slice(1);
    const value = Number.parseInt(clean.length === 3 ? clean.split("").map((part) => part + part).join("") : clean, 16);
    const r = (value >> 16) & 255;
    const g = (value >> 8) & 255;
    const b = value & 255;
    return `rgba(${r},${g},${b},${Math.max(0, Math.min(1, alpha))})`;
}
function drawAnnotationBox(ctx, text, cx, cy, bgColor, accentColor, textColor) {
    ctx.font = "800 13px Inter, system-ui";
    const maxWidth = Math.min(560, ctx.canvas.width - 60);
    const words = text.split(" ");
    const lines = [];
    let current = "";
    for (const w of words) {
        const test = current ? `${current} ${w}` : w;
        if (ctx.measureText(test).width > maxWidth) {
            lines.push(current);
            current = w;
        }
        else {
            current = test;
        }
    }
    if (current)
        lines.push(current);
    const lineH = 20;
    const totalH = lines.length * lineH + 18;
    const tw = Math.min(maxWidth, Math.max(...lines.map((l) => ctx.measureText(l).width))) + 28;
    const tx = cx - tw / 2;
    const ty = cy - totalH / 2;
    ctx.fillStyle = bgColor;
    ctx.strokeStyle = "rgba(94,234,212,0.3)";
    ctx.lineWidth = 1;
    roundRect(ctx, tx, ty, tw, totalH, 8);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = textColor;
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    const startY = ty + 9;
    lines.forEach((line, i) => { ctx.fillText(line, cx, startY + i * lineH); });
}
function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
}
