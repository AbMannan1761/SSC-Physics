/**
 * Virtual Vernier Caliper Interactive Lab
 * Simulates high-precision slider caliper with live scale markings,
 * vernier coincidence (সমপাতন) indicator, and actual cylinder diameter readout.
 */

class VernierLab {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas.getContext('2d');
    
    // Scale parameters (mm)
    this.objectDiameter = 18.7; // in mm
    this.vernierDivisions = 20; // 20 divisions = 19 mm => VC = 0.05 mm
    this.scaleFactor = 16; // pixels per mm
    this.zeroError = 0.00; // in mm
    
    this.setupListeners();
    this.render();
  }

  setDiameter(val) {
    this.objectDiameter = parseFloat(val);
    this.render();
    this.updateTelemetry();
  }

  setZeroError(val) {
    this.zeroError = parseFloat(val);
    this.render();
    this.updateTelemetry();
  }

  setupListeners() {
    window.addEventListener('resize', () => this.render());
  }

  calculateReadout() {
    const vc = 1.0 / this.vernierDivisions; // 0.05 mm
    const totalReading = this.objectDiameter + this.zeroError;
    const mainScale = Math.floor(totalReading); // mm
    const fraction = totalReading - mainScale;
    const coincidence = Math.round(fraction / vc) % this.vernierDivisions;
    const measuredLength = mainScale + (coincidence * vc);
    const correctedLength = measuredLength - this.zeroError;

    return {
      mainScale,
      coincidence,
      vc,
      measuredLength,
      correctedLength
    };
  }

  updateTelemetry() {
    const data = this.calculateReadout();
    const elM = document.getElementById('vernierMainScale');
    const elV = document.getElementById('vernierCoincidence');
    const elVC = document.getElementById('vernierVC');
    const elTotal = document.getElementById('vernierTotal');

    if (elM) elM.textContent = `${data.mainScale} mm`;
    if (elV) elV.textContent = `${data.coincidence}`;
    if (elVC) elVC.textContent = `${data.vc.toFixed(2)} mm`;
    if (elTotal) elTotal.textContent = `${data.correctedLength.toFixed(2)} mm`;
  }

  render() {
    if (!this.canvas) return;
    const rect = this.canvas.getBoundingClientRect();
    this.canvas.width = rect.width * window.devicePixelRatio || 800;
    this.canvas.height = 320 * window.devicePixelRatio || 320;
    
    const ctx = this.ctx;
    ctx.save();
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    const width = rect.width;
    const height = 320;

    // Background
    ctx.fillStyle = '#060913';
    ctx.fillRect(0, 0, width, height);

    const originX = 140;
    const mainScaleY = 120;
    const mainScaleHeight = 55;
    const jawHeight = 110;

    const openingMm = this.objectDiameter;
    const sliderShiftPx = openingMm * this.scaleFactor;

    // --- 1. Draw Fixed Main Beam & Left Jaw ---
    // Left Jaw
    ctx.fillStyle = '#1e293b';
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(originX - 40, mainScaleY);
    ctx.lineTo(originX, mainScaleY);
    ctx.lineTo(originX, mainScaleY + jawHeight);
    ctx.lineTo(originX - 35, mainScaleY + jawHeight - 20);
    ctx.lineTo(originX - 40, mainScaleY);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Main Scale Beam
    ctx.fillStyle = '#0f172a';
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 1.5;
    ctx.fillRect(originX, mainScaleY, width - originX - 30, mainScaleHeight);
    ctx.strokeRect(originX, mainScaleY, width - originX - 30, mainScaleHeight);

    // Main Scale Markings (0 to ~40 mm)
    ctx.fillStyle = '#94a3b8';
    ctx.font = '11px JetBrains Mono';
    ctx.textAlign = 'center';

    for (let mm = 0; mm <= 45; mm++) {
      const x = originX + mm * this.scaleFactor;
      if (x > width - 40) break;

      const isCm = mm % 10 === 0;
      const isHalfCm = mm % 5 === 0 && !isCm;
      const markLength = isCm ? 22 : (isHalfCm ? 15 : 9);

      ctx.beginPath();
      ctx.moveTo(x, mainScaleY);
      ctx.lineTo(x, mainScaleY + markLength);
      ctx.strokeStyle = isCm ? '#38bdf8' : (isHalfCm ? '#cbd5e1' : '#64748b');
      ctx.lineWidth = isCm ? 2 : 1;
      ctx.stroke();

      if (isCm) {
        ctx.fillStyle = '#38bdf8';
        ctx.fillText(`${mm / 10}`, x, mainScaleY + markLength + 14);
      }
    }

    // --- 2. Draw Cylindrical Test Object between jaws ---
    if (openingMm > 0.5) {
      const objRadiusPx = sliderShiftPx / 2;
      const objCenterX = originX + objRadiusPx;
      const objCenterY = mainScaleY + 60;

      // Object Body
      const gradient = ctx.createLinearGradient(originX, objCenterY - objRadiusPx, originX + sliderShiftPx, objCenterY + objRadiusPx);
      gradient.addColorStop(0, '#f59e0b');
      gradient.addColorStop(0.5, '#fbbf24');
      gradient.addColorStop(1, '#d97706');

      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(objCenterX, objCenterY, Math.min(objRadiusPx, 45), 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#fef08a';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Dimension Arrow
      ctx.strokeStyle = '#fde047';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(originX + 4, mainScaleY + jawHeight + 25);
      ctx.lineTo(originX + sliderShiftPx - 4, mainScaleY + jawHeight + 25);
      ctx.stroke();

      ctx.fillStyle = '#fde047';
      ctx.font = '12px Outfit';
      ctx.fillText(`ব্যাস d = ${this.objectDiameter.toFixed(1)} mm`, objCenterX, mainScaleY + jawHeight + 42);
    }

    // --- 3. Draw Sliding Vernier Scale & Right Jaw ---
    const vernierX = originX + sliderShiftPx;

    // Right Jaw
    ctx.fillStyle = '#1e293b';
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(vernierX, mainScaleY);
    ctx.lineTo(vernierX + 35, mainScaleY);
    ctx.lineTo(vernierX + 35, mainScaleY + jawHeight - 20);
    ctx.lineTo(vernierX, mainScaleY + jawHeight);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Vernier Scale Window Box
    const vernierBoxWidth = 20 * (19 / 20) * this.scaleFactor + 30;
    ctx.fillStyle = 'rgba(30, 41, 59, 0.95)';
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 1.5;
    ctx.fillRect(vernierX, mainScaleY - 45, vernierBoxWidth, 45);
    ctx.strokeRect(vernierX, mainScaleY - 45, vernierBoxWidth, 45);

    // Vernier Markings (20 divisions matching 19 mm)
    const vc = 1.0 / this.vernierDivisions;
    const totalReading = this.objectDiameter + this.zeroError;
    const fraction = totalReading - Math.floor(totalReading);
    const coincidence = Math.round(fraction / vc) % this.vernierDivisions;

    for (let v = 0; v <= this.vernierDivisions; v++) {
      // 1 vernier division = 19/20 mm = 0.95 mm
      const vx = vernierX + (v * (19 / 20)) * this.scaleFactor;
      const isCoincident = v === coincidence;

      ctx.beginPath();
      ctx.moveTo(vx, mainScaleY);
      ctx.lineTo(vx, mainScaleY - (isCoincident ? 22 : (v % 5 === 0 ? 16 : 10)));
      ctx.strokeStyle = isCoincident ? '#10b981' : '#cbd5e1';
      ctx.lineWidth = isCoincident ? 2.5 : 1;
      ctx.stroke();

      if (isCoincident) {
        // Highlight indicator
        ctx.fillStyle = '#10b981';
        ctx.font = 'bold 11px JetBrains Mono';
        ctx.fillText(`★${v}`, vx, mainScaleY - 26);
      } else if (v % 5 === 0) {
        ctx.fillStyle = '#94a3b8';
        ctx.font = '10px JetBrains Mono';
        ctx.fillText(`${v}`, vx, mainScaleY - 20);
      }
    }

    ctx.restore();
  }
}

window.VernierLab = VernierLab;
