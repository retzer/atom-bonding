import { useEffect, useRef } from "react";
import type { LessonAnimationPart, ViewportAnnotation } from "../types";

type Props = {
  annotations: ViewportAnnotation[];
  animParts?: LessonAnimationPart[];
  revealedCount?: number;
  stepText?: string;
  stepIndex?: number;
  totalSteps?: number;
  atoms: Array<{ id: string; x: number; y: number; radius: number; symbol: string; index: number }>;
  bonds: Array<{ id: string; a: string; b: string }>;
  width: number;
  height: number;
  theme: string;
  zoom?: number;
};

export function LessonOverlay({ annotations, animParts, revealedCount, stepText, stepIndex, totalSteps, atoms, bonds, width, height, theme, zoom = 1 }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const frameRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let running = true;

    const offsetX = Math.max(0, (width - 920) / 2);
    const offsetY = (height * 0.5) - 300;

    const draw = () => {
      if (!running) return;
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

      const drawCentered = (fn: () => void) => {
        ctx.save();
        ctx.translate(offsetX, offsetY);
        fn();
        ctx.restore();
      };

      // --- Annotations ---
      for (const ann of annotations) {
        if (ann.duration <= 0) continue;
        ctx.save();
        ctx.globalAlpha = 0.94;
        const atom = ann.atomId ? atomById.get(ann.atomId) : undefined;
        let cx = width / 2;
        let cy = height * 0.2;
        if (atom) { cx = atom.x; cy = atom.y - atom.radius - 38; }
        if (ann.type === "highlight" && atom) {
          ctx.strokeStyle = accentColor; ctx.lineWidth = 3;
          ctx.shadowColor = accentColor; ctx.shadowBlur = 14;
          ctx.beginPath(); ctx.arc(atom.x, atom.y, atom.radius + 10, 0, Math.PI * 2); ctx.stroke(); ctx.shadowBlur = 0;
        }
        if (ann.type === "pulse" && atom) {
          ctx.strokeStyle = accentColor; ctx.lineWidth = 2; ctx.globalAlpha = 0.42;
          const pulse = 1 + Math.sin(now * 0.004) * 0.08;
          ctx.beginPath(); ctx.arc(atom.x, atom.y, (atom.radius + 14) * pulse, 0, Math.PI * 2); ctx.stroke(); ctx.globalAlpha = 0.94;
        }
        if (ann.message) drawAnnotationBox(ctx, ann.message, cx, cy, bgColor, accentColor, textColor);
        ctx.restore();
      }

      // --- Animation Parts ---
      const maxReveal = revealedCount ?? 999;
      let partIdx = 0;
      if (animParts?.length) {
        for (const part of animParts) {
          partIdx++;
          if (partIdx > maxReveal) break;
          ctx.save();
          ctx.globalAlpha = 0.9;

          const isAtomBound = "atomIndex" in part && part.atomIndex !== undefined && atoms[part.atomIndex];
          const a = isAtomBound ? atoms[(part as any).atomIndex] : null;

          // Ring (atom-bound, no centering)
          if (part.type === "ring" && a) {
            ctx.strokeStyle = (part as any).color; ctx.lineWidth = 2; ctx.setLineDash([4, 4]);
            const pulse = 1 + Math.sin(t * 1.8) * 0.04;
            ctx.beginPath(); ctx.arc(a.x, a.y, (part as any).radius * pulse, 0, Math.PI * 2); ctx.stroke(); ctx.setLineDash([]);
          }

          // Highlight (atom-bound, no centering)
          if (part.type === "highlight" && a) {
            const color = part.color ?? accentColor;
            ctx.strokeStyle = color; ctx.lineWidth = 3;
            ctx.shadowColor = color; ctx.shadowBlur = 14;
            ctx.beginPath(); ctx.arc(a.x, a.y, a.radius + 12, 0, Math.PI * 2); ctx.stroke(); ctx.shadowBlur = 0;
          }

          // Pulse (atom-bound, no centering)
          if (part.type === "pulse" && a) {
            ctx.strokeStyle = accentColor; ctx.lineWidth = 2; ctx.globalAlpha = 0.5;
            const pulse = 1 + Math.sin(t * 2.8) * 0.1;
            ctx.beginPath(); ctx.arc(a.x, a.y, (a.radius + 14) * pulse, 0, Math.PI * 2); ctx.stroke(); ctx.globalAlpha = 0.9;
          }

          // Arrow between atoms (no centering)
          if (part.type === "arrow" && "fromIndex" in part && atoms[part.fromIndex] && atoms[part.toIndex]) {
            const from = atoms[part.fromIndex]; const to = atoms[part.toIndex];
            const color = (part as any).color ?? accentColor;
            const dx = to.x - from.x; const dy = to.y - from.y;
            const dist = Math.max(0.01, Math.hypot(dx, dy));
            const ux = dx / dist; const uy = dy / dist;
            ctx.strokeStyle = color; ctx.fillStyle = color; ctx.lineWidth = 2.5;
            ctx.beginPath(); ctx.moveTo(from.x + ux * (from.radius + 8), from.y + uy * (from.radius + 8));
            ctx.lineTo(to.x - ux * (to.radius + 8), to.y - uy * (to.radius + 8)); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(to.x, to.y);
            ctx.lineTo(to.x - ux * 10 + -uy * 5, to.y - uy * 10 + ux * 5);
            ctx.lineTo(to.x - ux * 10 - -uy * 5, to.y - uy * 10 - ux * 5);
            ctx.closePath(); ctx.fill();
          }

          // Label anchored to atom (no centering)
          if (part.type === "label" && a) {
            let lx = a.x; let ly = a.y;
            if ((part as any).position === "top") ly = a.y - a.radius - 28;
            else if ((part as any).position === "bottom") ly = a.y + a.radius + 28;
            else if ((part as any).position === "left") lx = a.x - a.radius - 70;
            else lx = a.x + a.radius + 70;
            drawAnnotationBox(ctx, (part as any).text, lx, ly, bgColor, accentColor, textColor);
          }

          // Sub-atomic: electrons anchored to atom (no centering)
          if (part.type === "electrons" && a) {
            drawElectronShells(ctx, (part as any).shells, a.x, a.y, t, accentColor);
          }

          // Orbital anchored to atom (no centering)
          if (part.type === "orbital" && a) {
            drawOrbital(ctx, (part as any).count, (part as any).radius, a.x, a.y, (part as any).color ?? accentColor, t);
          }

          // ---- Centered content (fixed-position, not tied to sim atoms) ----
          drawCentered(() => {

            // Nucleus
            if (part.type === "nucleus") {
              drawNucleus(ctx, (part as any).x, (part as any).y, (part as any).protons, (part as any).neutrons, (part as any).radius ?? 20, t, textColor);
            }

            // Electron shells (static position)
            if (part.type === "electrons-at") {
              drawElectronShells(ctx, (part as any).shells, (part as any).x, (part as any).y, t, accentColor);
            }

            // Orbital (static)
            if (part.type === "orbital-at") {
              const p = part as any; drawOrbital(ctx, p.count, p.radius, p.x, p.y, p.color ?? accentColor, t);
            }

            // Position-anchored text
            if (part.type === "text-at") {
              let tx = (part as any).x; let ty = (part as any).y;
              if ((part as any).anchor === "top") ty -= 25;
              else if ((part as any).anchor === "bottom") ty += 25;
              else if ((part as any).anchor === "left") tx -= 70;
              else if ((part as any).anchor === "right") tx += 70;
              drawAnnotationBox(ctx, (part as any).message, tx, ty, bgColor, accentColor, textColor);
            }

            // Mini grid table
            if (part.type === "grid") {
              for (let row = 0; row < (part as any).rows; row++) {
                for (let col = 0; col < (part as any).cols; col++) {
                  const idx = row * (part as any).cols + col;
                  if (idx >= (part as any).cells.length) continue;
                  const cell = (part as any).cells[idx];
                  const gx = (part as any).x + col * (part as any).cellW;
                  const gy = (part as any).y + row * (part as any).cellH;
                  ctx.fillStyle = cell.bgColor ?? (isDark ? "rgba(30,40,50,0.7)" : "rgba(240,245,250,0.85)");
                  roundRect(ctx, gx + 2, gy + 2, (part as any).cellW - 4, (part as any).cellH - 4, 5);
                  ctx.fill();
                  if (cell.active) {
                    ctx.strokeStyle = cell.ringColor ?? accentColor; ctx.lineWidth = 2;
                    roundRect(ctx, gx + 2, gy + 2, (part as any).cellW - 4, (part as any).cellH - 4, 5);
                    ctx.stroke();
                  }
                  ctx.fillStyle = cell.textColor ?? textColor;
                  ctx.font = "bold 13px Inter"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
                  ctx.fillText(cell.label, gx + (part as any).cellW / 2, gy + (part as any).cellH / 2 - (cell.sub ? 6 : 0));
                  if (cell.sub) {
                    ctx.font = "700 9px Inter"; ctx.fillStyle = isDark ? "#9ca3af" : "#6b7280";
                    ctx.fillText(cell.sub, gx + (part as any).cellW / 2, gy + (part as any).cellH / 2 + 10);
                  }
                }
              }
            }

            // Bar chart
            if (part.type === "bar") {
              const h = 22;
              roundRect(ctx, (part as any).x, (part as any).y, (part as any).totalWidth, h, 4);
              ctx.fillStyle = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)";
              ctx.fill();
              const w = Math.max(4, (part as any).width * ((part as any).totalWidth / Math.max(1, (part as any).totalWidth)));
              ctx.fillStyle = (part as any).color;
              roundRect(ctx, (part as any).x, (part as any).y, w, h, 4);
              ctx.fill();
              if ((part as any).label) {
                ctx.fillStyle = textColor; ctx.font = "700 10px Inter"; ctx.textAlign = "left"; ctx.textBaseline = "middle";
                ctx.fillText((part as any).label, (part as any).x + 6, (part as any).y + h / 2);
              }
              if ((part as any).sub) {
                ctx.fillStyle = isDark ? "#9ca3af" : "#6b7280";
                ctx.font = "700 9px Inter"; ctx.textAlign = "right";
                ctx.fillText((part as any).sub, (part as any).x + (part as any).totalWidth + 6, (part as any).y + h / 2);
              }
            }

            // Bar group
            if (part.type === "bar-group") {
              const h = 28; const gap = 4; let bOffset = (part as any).y;
              for (const item of (part as any).items) {
                roundRect(ctx, (part as any).x, bOffset, item.width, h, 4);
                ctx.fillStyle = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)";
                ctx.fill();
                ctx.fillStyle = item.color;
                roundRect(ctx, (part as any).x, bOffset, item.width, h, 4);
                ctx.fill();
                ctx.fillStyle = "#fff"; ctx.font = "800 10px Inter"; ctx.textAlign = "left"; ctx.textBaseline = "middle";
                ctx.fillText(item.label, (part as any).x + 8, bOffset + h / 2);
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
          if (screenIdx > (revealedCount ?? 999)) break;
          if (part.type !== "text") continue;
          let tx = width / 2; let ty = height * 0.3;
          if ((part as any).position === "top") ty = 56;
          else if ((part as any).position === "bottom") ty = height - 52;
          drawAnnotationBox(ctx, (part as any).message, tx, ty, bgColor, accentColor, textColor);
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

      if (running) frameRef.current = requestAnimationFrame(draw);
    };

    draw();
    return () => { running = false; cancelAnimationFrame(frameRef.current); if (ctx) ctx.clearRect(0, 0, width, height); };
  }, [annotations, stepText, stepIndex, totalSteps, animParts, revealedCount, atoms, bonds, height, theme, width, zoom]);

  return (
    <canvas
      ref={canvasRef}
      className="simulation-canvas lesson-overlay-canvas"
      aria-hidden="true"
    />
  );
}

function drawElectronShells(ctx: CanvasRenderingContext2D, shells: Array<{ radius: number; count: number; color?: string; orbit?: boolean }>, x: number, y: number, t: number, accentColor: string) {
  for (const shell of shells) {
    ctx.strokeStyle = shell.color ?? accentColor; ctx.lineWidth = 2.5; ctx.setLineDash([5, 5]);
    ctx.beginPath(); ctx.arc(x, y, shell.radius * 1.6, 0, Math.PI * 2); ctx.stroke(); ctx.setLineDash([]);
    for (let i = 0; i < shell.count; i++) {
      const angle = (shell.orbit !== false ? t * 1.2 : 0) + (i * Math.PI * 2 / shell.count);
      ctx.fillStyle = shell.color ?? accentColor;
      ctx.beginPath(); ctx.arc(x + Math.cos(angle) * shell.radius * 1.6, y + Math.sin(angle) * shell.radius * 1.6, 7, 0, Math.PI * 2); ctx.fill();
      ctx.shadowColor = shell.color ?? accentColor; ctx.shadowBlur = 10;
      ctx.fill(); ctx.shadowBlur = 0;
    }
  }
}

function drawOrbital(ctx: CanvasRenderingContext2D, count: number, radius: number, x: number, y: number, color: string, t: number) {
  ctx.strokeStyle = color; ctx.lineWidth = 2.5; ctx.setLineDash([4, 6]);
  ctx.beginPath(); ctx.arc(x, y, radius * 1.5, 0, Math.PI * 2); ctx.stroke(); ctx.setLineDash([]);
  for (let i = 0; i < count; i++) {
    const angle = t * 1.5 + (i * Math.PI * 2 / count);
    ctx.fillStyle = color;
    ctx.beginPath(); ctx.arc(x + Math.cos(angle) * radius * 1.5, y + Math.sin(angle) * radius * 1.5, 6, 0, Math.PI * 2); ctx.fill();
  }
}

function drawNucleus(ctx: CanvasRenderingContext2D, x: number, y: number, protons: number, neutrons: number, size: number, t: number, textColor: string) {
  const scale = 2.4;
  const r = Math.max(6, size / 5 * scale);
  const total = protons + neutrons;
  const pts: Array<{ x: number; y: number; color: string; isProton: boolean }> = [];

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
    ctx.beginPath(); ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
    ctx.fillStyle = p.color; ctx.fill();
    ctx.strokeStyle = "rgba(0,0,0,0.15)"; ctx.lineWidth = 1; ctx.stroke();
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

function drawAnnotationBox(
  ctx: CanvasRenderingContext2D, text: string, cx: number, cy: number,
  bgColor: string, accentColor: string, textColor: string
) {
  ctx.font = "800 13px Inter, system-ui";
  const maxWidth = Math.min(560, ctx.canvas.width - 60);
  const words = text.split(" ");
  const lines: string[] = []; let current = "";
  for (const w of words) {
    const test = current ? `${current} ${w}` : w;
    if (ctx.measureText(test).width > maxWidth) { lines.push(current); current = w; }
    else { current = test; }
  }
  if (current) lines.push(current);
  const lineH = 20; const totalH = lines.length * lineH + 18;
  const tw = Math.min(maxWidth, Math.max(...lines.map((l) => ctx.measureText(l).width))) + 28;
  const tx = cx - tw / 2; const ty = cy - totalH / 2;
  ctx.fillStyle = bgColor;
  ctx.strokeStyle = "rgba(94,234,212,0.3)"; ctx.lineWidth = 1;
  roundRect(ctx, tx, ty, tw, totalH, 8);
  ctx.fill(); ctx.stroke();
  ctx.fillStyle = textColor; ctx.textAlign = "center"; ctx.textBaseline = "top";
  const startY = ty + 9; lines.forEach((line, i) => { ctx.fillText(line, cx, startY + i * lineH); });
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath(); ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}
