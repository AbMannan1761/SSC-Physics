/**
 * Interactive Force, Friction & Conservation of Momentum Collision Lab
 */

class ForceLab {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas.getContext('2d');

    // Body 1
    this.m1 = 2.0; // kg
    this.u1 = 4.0; // m/s
    this.x1 = 80;  // px

    // Body 2
    this.m2 = 3.0; // kg
    this.u2 = -2.0; // m/s
    this.x2 = 450; // px

    // Collision type: 'elastic' or 'inelastic'
    this.collisionType = 'elastic';

    // Simulation state
    this.isPlaying = false;
    this.hasCollided = false;
    this.v1 = this.u1;
    this.v2 = this.u2;
    this.animationFrameId = null;

    this.setupListeners();
    this.reset();
  }

  setM1(val) { this.m1 = parseFloat(val); this.reset(); }
  setU1(val) { this.u1 = parseFloat(val); this.reset(); }
  setM2(val) { this.m2 = parseFloat(val); this.reset(); }
  setU2(val) { this.u2 = parseFloat(val); this.reset(); }
  setCollisionType(type) { this.collisionType = type; this.reset(); }

  reset() {
    this.pause();
    this.x1 = 120;
    this.x2 = 480;
    this.v1 = this.u1;
    this.v2 = this.u2;
    this.hasCollided = false;
    this.updateTelemetry();
    this.render();
  }

  calculatePostCollisionVelocities() {
    const m1 = this.m1;
    const m2 = this.m2;
    const u1 = this.u1;
    const u2 = this.u2;

    if (this.collisionType === 'elastic') {
      // 1D Perfectly Elastic Collision formulas:
      // v1 = ((m1 - m2)/(m1 + m2))*u1 + ((2*m2)/(m1 + m2))*u2
      // v2 = ((2*m1)/(m1 + m2))*u1 + ((m2 - m1)/(m1 + m2))*u2
      const postV1 = ((m1 - m2) / (m1 + m2)) * u1 + ((2 * m2) / (m1 + m2)) * u2;
      const postV2 = ((2 * m1) / (m1 + m2)) * u1 + ((m2 - m1) / (m1 + m2)) * u2;
      return { v1: postV1, v2: postV2 };
    } else {
      // Inelastic: Combined common velocity V = (m1*u1 + m2*u2) / (m1 + m2)
      const commonV = (m1 * u1 + m2 * u2) / (m1 + m2);
      return { v1: commonV, v2: commonV };
    }
  }

  play() {
    if (this.isPlaying) return;
    this.isPlaying = true;
    let lastTs = performance.now();

    const loop = (ts) => {
      if (!this.isPlaying) return;
      const dt = (ts - lastTs) / 1000;
      lastTs = ts;

      // Move bodies (scaled 60 px per m/s)
      this.x1 += this.v1 * dt * 60;
      this.x2 += this.v2 * dt * 60;

      // Check collision
      const r1 = 15 + Math.min(this.m1 * 5, 25);
      const r2 = 15 + Math.min(this.m2 * 5, 25);

      if (!this.hasCollided && (this.x1 + r1 >= this.x2 - r2)) {
        this.hasCollided = true;
        const post = this.calculatePostCollisionVelocities();
        this.v1 = post.v1;
        this.v2 = post.v2;
      }

      this.updateTelemetry();
      this.render();

      if (this.isPlaying) {
        this.animationFrameId = requestAnimationFrame(loop);
      }
    };

    this.animationFrameId = requestAnimationFrame(loop);
  }

  pause() {
    this.isPlaying = false;
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  togglePlay() {
    if (this.isPlaying) this.pause();
    else this.play();
  }

  updateTelemetry() {
    const p1 = this.m1 * this.v1;
    const p2 = this.m2 * this.v2;
    const pTotal = p1 + p2;

    const elP1 = document.getElementById('forceP1');
    const elP2 = document.getElementById('forceP2');
    const elPTotal = document.getElementById('forcePTotal');
    const elStatus = document.getElementById('forceStatus');

    if (elP1) elP1.textContent = `${p1.toFixed(1)} kg·m/s`;
    if (elP2) elP2.textContent = `${p2.toFixed(1)} kg·m/s`;
    if (elPTotal) elPTotal.textContent = `${pTotal.toFixed(1)} kg·m/s`;
    if (elStatus) elStatus.textContent = this.hasCollided ? 'সংঘর্ষের পর (Post)' : 'সংঘর্ষের পূর্বে (Pre)';
  }

  setupListeners() {
    window.addEventListener('resize', () => this.render());
  }

  render() {
    if (!this.canvas) return;
    const rect = this.canvas.getBoundingClientRect();
    this.canvas.width = rect.width * window.devicePixelRatio || 800;
    this.canvas.height = 240 * window.devicePixelRatio || 240;

    const ctx = this.ctx;
    ctx.save();
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    const width = rect.width;
    const height = 240;

    // Background
    ctx.fillStyle = '#060913';
    ctx.fillRect(0, 0, width, height);

    const trackY = 160;
    // Track line
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(0, trackY, width, 40);
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, trackY);
    ctx.lineTo(width, trackY);
    ctx.stroke();

    const r1 = 15 + Math.min(this.m1 * 5, 25);
    const r2 = 15 + Math.min(this.m2 * 5, 25);

    // --- Body 1 (Cyan) ---
    ctx.fillStyle = '#38bdf8';
    ctx.beginPath();
    ctx.arc(this.x1, trackY - r1, r1, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#7dd3fc';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 11px JetBrains Mono';
    ctx.textAlign = 'center';
    ctx.fillText(`${this.m1}kg`, this.x1, trackY - r1 + 4);

    // Vector v1
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(this.x1, trackY - r1 - 18);
    ctx.lineTo(this.x1 + this.v1 * 12, trackY - r1 - 18);
    ctx.stroke();
    ctx.fillStyle = '#94a3b8';
    ctx.font = '10px JetBrains Mono';
    ctx.fillText(`v1=${this.v1.toFixed(1)}`, this.x1, trackY - r1 - 24);

    // --- Body 2 (Rose) ---
    ctx.fillStyle = '#f43f5e';
    ctx.beginPath();
    ctx.arc(this.x2, trackY - r2, r2, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#fda4af';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = '#fff';
    ctx.font = 'bold 11px JetBrains Mono';
    ctx.fillText(`${this.m2}kg`, this.x2, trackY - r2 + 4);

    // Vector v2
    ctx.strokeStyle = '#f43f5e';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(this.x2, trackY - r2 - 18);
    ctx.lineTo(this.x2 + this.v2 * 12, trackY - r2 - 18);
    ctx.stroke();
    ctx.fillStyle = '#94a3b8';
    ctx.font = '10px JetBrains Mono';
    ctx.fillText(`v2=${this.v2.toFixed(1)}`, this.x2, trackY - r2 - 24);

    ctx.restore();
  }
}

window.ForceLab = ForceLab;
