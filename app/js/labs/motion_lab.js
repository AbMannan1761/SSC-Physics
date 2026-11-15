/**
 * Multi-body Kinematics & Live Real-Time Motion Lab
 * Simulates real-time car/object motion with simultaneously plotted s-t and v-t graphs,
 * slope tangent, and displacement area visualization.
 */

class MotionLab {
  constructor(canvasTrackId, canvasGraphId) {
    this.trackCanvas = document.getElementById(canvasTrackId);
    this.graphCanvas = document.getElementById(canvasGraphId);
    this.trackCtx = this.trackCanvas.getContext('2d');
    this.graphCtx = this.graphCanvas.getContext('2d');

    // Motion parameters
    this.u = 0;    // Initial velocity (m/s)
    this.a = 2.5;  // Acceleration (m/s²)
    this.maxTime = 8; // Max simulation time (s)

    // State
    this.currentTime = 0;
    this.isPlaying = false;
    this.animationFrameId = null;
    this.history = []; // Array of {t, s, v}

    this.setupListeners();
    this.reset();
  }

  setInitialVelocity(val) {
    this.u = parseFloat(val);
    this.reset();
  }

  setAcceleration(val) {
    this.a = parseFloat(val);
    this.reset();
  }

  reset() {
    this.pause();
    this.currentTime = 0;
    this.history = [{
      t: 0,
      s: 0,
      v: this.u
    }];
    this.updateTelemetry();
    this.renderTrack();
    this.renderGraph();
  }

  play() {
    if (this.isPlaying) return;
    this.isPlaying = true;
    let lastTs = performance.now();

    const loop = (ts) => {
      if (!this.isPlaying) return;
      const dt = (ts - lastTs) / 1000;
      lastTs = ts;

      this.currentTime += dt;
      if (this.currentTime >= this.maxTime) {
        this.currentTime = this.maxTime;
        this.pause();
      }

      // Physics equations: s = u*t + 0.5*a*t^2, v = u + a*t
      const t = this.currentTime;
      const s = Math.max(0, this.u * t + 0.5 * this.a * t * t);
      const v = this.u + this.a * t;

      this.history.push({ t, s, v });
      this.updateTelemetry();
      this.renderTrack();
      this.renderGraph();

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
    if (this.isPlaying) {
      this.pause();
    } else {
      if (this.currentTime >= this.maxTime) this.currentTime = 0;
      this.play();
    }
  }

  updateTelemetry() {
    const t = this.currentTime;
    const s = Math.max(0, this.u * t + 0.5 * this.a * t * t);
    const v = this.u + this.a * t;

    const elT = document.getElementById('motionTime');
    const elV = document.getElementById('motionVelocity');
    const elS = document.getElementById('motionDisplacement');
    const elA = document.getElementById('motionAcceleration');

    if (elT) elT.textContent = `${t.toFixed(2)} s`;
    if (elV) elV.textContent = `${v.toFixed(2)} m/s`;
    if (elS) elS.textContent = `${s.toFixed(2)} m`;
    if (elA) elA.textContent = `${this.a.toFixed(2)} m/s²`;
  }

  setupListeners() {
    window.addEventListener('resize', () => {
      this.renderTrack();
      this.renderGraph();
    });
  }

  renderTrack() {
    if (!this.trackCanvas) return;
    const rect = this.trackCanvas.getBoundingClientRect();
    this.trackCanvas.width = rect.width * window.devicePixelRatio || 800;
    this.trackCanvas.height = 140 * window.devicePixelRatio || 140;
    
    const ctx = this.trackCtx;
    ctx.save();
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    const width = rect.width;
    const height = 140;

    // Background Road
    ctx.fillStyle = '#0a0f1d';
    ctx.fillRect(0, 0, width, height);

    const roadY = 90;
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(0, roadY, width, 40);

    // Distance Markers every 10 meters (scaled)
    const maxDistanceScale = 120; // 120 meters max view
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 1;
    ctx.fillStyle = '#94a3b8';
    ctx.font = '10px JetBrains Mono';
    ctx.textAlign = 'center';

    for (let d = 0; d <= maxDistanceScale; d += 10) {
      const x = 50 + (d / maxDistanceScale) * (width - 100);
      ctx.beginPath();
      ctx.moveTo(x, roadY);
      ctx.lineTo(x, roadY + 8);
      ctx.stroke();
      ctx.fillText(`${d}m`, x, roadY + 24);
    }

    // Current Car Position
    const t = this.currentTime;
    const s = Math.max(0, this.u * t + 0.5 * this.a * t * t);
    const carX = 50 + Math.min(s / maxDistanceScale, 1.0) * (width - 100);
    const carY = roadY - 24;

    // Car Body
    ctx.fillStyle = '#38bdf8';
    ctx.beginPath();
    ctx.roundRect(carX - 22, carY, 44, 20, 6);
    ctx.fill();

    // Car Roof
    ctx.fillStyle = '#0284c7';
    ctx.beginPath();
    ctx.roundRect(carX - 12, carY - 12, 24, 14, 4);
    ctx.fill();

    // Wheels
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.arc(carX - 12, carY + 20, 5, 0, Math.PI * 2);
    ctx.arc(carX + 12, carY + 20, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Velocity Vector Arrow
    const currentV = this.u + this.a * t;
    if (Math.abs(currentV) > 0.1) {
      const arrowLen = Math.min(Math.abs(currentV) * 2.5, 70);
      const dir = currentV >= 0 ? 1 : -1;

      ctx.strokeStyle = '#10b981';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(carX, carY - 20);
      ctx.lineTo(carX + arrowLen * dir, carY - 20);
      ctx.stroke();

      // Arrow head
      ctx.fillStyle = '#10b981';
      ctx.beginPath();
      ctx.moveTo(carX + arrowLen * dir, carY - 20);
      ctx.lineTo(carX + (arrowLen - 6) * dir, carY - 24);
      ctx.lineTo(carX + (arrowLen - 6) * dir, carY - 16);
      ctx.closePath();
      ctx.fill();

      ctx.font = 'bold 10px JetBrains Mono';
      ctx.fillText(`v = ${currentV.toFixed(1)} m/s`, carX + (arrowLen / 2) * dir, carY - 28);
    }

    ctx.restore();
  }

  renderGraph() {
    if (!this.graphCanvas) return;
    const rect = this.graphCanvas.getBoundingClientRect();
    this.graphCanvas.width = rect.width * window.devicePixelRatio || 500;
    this.graphCanvas.height = 260 * window.devicePixelRatio || 260;
    
    const ctx = this.graphCtx;
    ctx.save();
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    const width = rect.width;
    const height = 260;

    // Background
    ctx.fillStyle = '#060913';
    ctx.fillRect(0, 0, width, height);

    const padL = 45;
    const padB = 35;
    const padT = 25;
    const padR = 25;
    const gWidth = width - padL - padR;
    const gHeight = height - padB - padT;

    // Axes
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(padL, padT);
    ctx.lineTo(padL, height - padB);
    ctx.lineTo(width - padR, height - padB);
    ctx.stroke();

    // Axis Labels
    ctx.fillStyle = '#94a3b8';
    ctx.font = '11px Outfit';
    ctx.textAlign = 'center';
    ctx.fillText('সময় t (সেকেন্ড)', padL + gWidth / 2, height - 10);
    ctx.save();
    ctx.translate(14, padT + gHeight / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText('বেগ v (m/s)', 0, 0);
    ctx.restore();

    // Max scales
    const maxV = Math.max(30, (this.u + this.a * this.maxTime) * 1.2);

    // Gridlines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 1;
    for (let t = 2; t <= this.maxTime; t += 2) {
      const gx = padL + (t / this.maxTime) * gWidth;
      ctx.beginPath();
      ctx.moveTo(gx, padT);
      ctx.lineTo(gx, height - padB);
      ctx.stroke();

      ctx.fillStyle = '#64748b';
      ctx.font = '10px JetBrains Mono';
      ctx.fillText(`${t}s`, gx, height - padB + 14);
    }

    // Area Under Curve (Displacement representation)
    if (this.history.length > 1) {
      ctx.fillStyle = 'rgba(56, 189, 248, 0.15)';
      ctx.beginPath();
      ctx.moveTo(padL, height - padB);

      for (let i = 0; i < this.history.length; i++) {
        const pt = this.history[i];
        const gx = padL + (pt.t / this.maxTime) * gWidth;
        const gy = (height - padB) - (pt.v / maxV) * gHeight;
        ctx.lineTo(gx, gy);
      }

      const lastPt = this.history[this.history.length - 1];
      const lastX = padL + (lastPt.t / this.maxTime) * gWidth;
      ctx.lineTo(lastX, height - padB);
      ctx.closePath();
      ctx.fill();

      // v-t Line
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 3;
      ctx.beginPath();
      for (let i = 0; i < this.history.length; i++) {
        const pt = this.history[i];
        const gx = padL + (pt.t / this.maxTime) * gWidth;
        const gy = (height - padB) - (pt.v / maxV) * gHeight;
        if (i === 0) ctx.moveTo(gx, gy);
        else ctx.lineTo(gx, gy);
      }
      ctx.stroke();

      // Current Point Indicator
      const curX = lastX;
      const curY = (height - padB) - (lastPt.v / maxV) * gHeight;
      ctx.fillStyle = '#f43f5e';
      ctx.beginPath();
      ctx.arc(curX, curY, 5, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }
}

window.MotionLab = MotionLab;
