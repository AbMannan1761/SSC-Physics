/**
 * Interactive Energy Conservation & Pendulum/Rollercoaster Lab
 * Visualizes live energy exchange between Kinetic Energy (Ek) and Potential Energy (Ep)
 * with animated telemetry bars.
 */

class EnergyLab {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas.getContext('2d');

    // System parameters
    this.mass = 2.0;       // kg
    this.length = 180;     // px (pendulum string)
    this.maxAngleDeg = 45; // amplitude in degrees
    this.g = 9.8;          // m/s²

    // State
    this.angleRad = (this.maxAngleDeg * Math.PI) / 180;
    this.angularVelocity = 0;
    this.isPlaying = true;
    this.animationFrameId = null;

    this.setupListeners();
    this.play();
  }

  setMass(val) {
    this.mass = parseFloat(val);
    this.updateTelemetry();
  }

  setAmplitude(val) {
    this.maxAngleDeg = parseFloat(val);
    this.angleRad = (this.maxAngleDeg * Math.PI) / 180;
    this.angularVelocity = 0;
    this.updateTelemetry();
  }

  play() {
    if (this.animationFrameId) return;
    let lastTs = performance.now();

    const loop = (ts) => {
      const dt = Math.min((ts - lastTs) / 1000, 0.05);
      lastTs = ts;

      // Pendulum differential equation: alpha = - (g / L) * sin(theta)
      // Scaled length in meters: L_m = this.length / 100
      const L_m = this.length / 100;
      const angularAcc = - (this.g / L_m) * Math.sin(this.angleRad);

      this.angularVelocity += angularAcc * dt;
      this.angleRad += this.angularVelocity * dt;

      this.updateTelemetry();
      this.render();

      this.animationFrameId = requestAnimationFrame(loop);
    };

    this.animationFrameId = requestAnimationFrame(loop);
  }

  updateTelemetry() {
    // Height from lowest point h = L * (1 - cos(theta))
    const L_m = this.length / 100;
    const h = L_m * (1 - Math.cos(this.angleRad));
    const Ep = this.mass * this.g * h;

    // Linear velocity v = omega * L
    const v = Math.abs(this.angularVelocity * L_m);
    const Ek = 0.5 * this.mass * v * v;
    const ETotal = Ep + Ek;

    const elEp = document.getElementById('energyEp');
    const elEk = document.getElementById('energyEk');
    const elTotal = document.getElementById('energyTotal');
    const elH = document.getElementById('energyHeight');

    if (elEp) elEp.textContent = `${Ep.toFixed(1)} J`;
    if (elEk) elEk.textContent = `${Ek.toFixed(1)} J`;
    if (elTotal) elTotal.textContent = `${ETotal.toFixed(1)} J`;
    if (elH) elH.textContent = `${h.toFixed(2)} m`;

    // Update Bar indicators if present
    const barEp = document.getElementById('barEp');
    const barEk = document.getElementById('barEk');
    if (barEp && ETotal > 0) barEp.style.width = `${(Ep / ETotal) * 100}%`;
    if (barEk && ETotal > 0) barEk.style.width = `${(Ek / ETotal) * 100}%`;
  }

  setupListeners() {
    window.addEventListener('resize', () => this.render());
  }

  render() {
    if (!this.canvas) return;
    const rect = this.canvas.getBoundingClientRect();
    this.canvas.width = rect.width * window.devicePixelRatio || 800;
    this.canvas.height = 280 * window.devicePixelRatio || 280;

    const ctx = this.ctx;
    ctx.save();
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    const width = rect.width;
    const height = 280;

    // Background
    ctx.fillStyle = '#060913';
    ctx.fillRect(0, 0, width, height);

    const pivotX = width / 2;
    const pivotY = 30;

    // Pivot mount
    ctx.fillStyle = '#475569';
    ctx.fillRect(pivotX - 30, pivotY - 10, 60, 10);
    ctx.fillStyle = '#38bdf8';
    ctx.beginPath();
    ctx.arc(pivotX, pivotY, 4, 0, Math.PI * 2);
    ctx.fill();

    // Bob coordinates
    const bobX = pivotX + this.length * Math.sin(this.angleRad);
    const bobY = pivotY + this.length * Math.cos(this.angleRad);

    // String
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(pivotX, pivotY);
    ctx.lineTo(bobX, bobY);
    ctx.stroke();

    // Lowest reference dashed line
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(pivotX - 120, pivotY + this.length);
    ctx.lineTo(pivotX + 120, pivotY + this.length);
    ctx.stroke();
    ctx.setLineDash([]);

    // Bob
    const bobRadius = 14 + Math.min(this.mass * 3, 15);
    const gradient = ctx.createRadialGradient(bobX - 4, bobY - 4, 2, bobX, bobY, bobRadius);
    gradient.addColorStop(0, '#38bdf8');
    gradient.addColorStop(1, '#0284c7');

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(bobX, bobY, bobRadius, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#7dd3fc';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.restore();
  }
}

window.EnergyLab = EnergyLab;
