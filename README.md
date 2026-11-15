# SAFIR (PyroGrav) — Spacecraft Atmosphere Fire Intelligence & Risk Platform

> **Tactical Aerospace Telemetry & Microgravity Combustion Decision System**  
> Built to SpaceX Dragon UI & Palantir Foundry telemetry specifications for human spaceflight missions (Artemis Gateway, Starship HLS, ISS, Mars Surface Habitats).

---

## 🚀 Overview

**SAFIR (PyroGrav)** is a zero-placeholder, production-grade aerospace platform designed to predict, visualize, and mitigate solid-fuel flammability hazards under altered gravity and oxygen-enriched spacecraft cabin environments.

It bridges ground-based **NASA-STD-6001B** testing with empirical microgravity flight data (*ISS FLARE, Cygnus Saffire I–IV, ISS BASS-II, ZARM Drop Tower, Zero-G Parabolic Flights*) through rigorous Bayesian Gaussian similarity retrieval, finite-difference transient smoke transport modeling, and a 60FPS procedural flame morphology visualizer.

---

## 🛠 Anti-AI Tactical Aerospace UI/UX Architecture

- **Color System:**
  - Deep Space Obsidian Canvas: `#06080D`
  - Elevated Telemetry Panels: `#0B0F17` with `1px solid rgba(255, 255, 255, 0.08)`
  - Tactical Glass: `backdrop-filter: blur(16px)` over `rgba(14, 20, 32, 0.78)`
  - Aerospace Accents: Thermal Amber (`#F97316`), Plasma Red (`#EF4444`), Cryo Cyan (`#06B6D4`), Telemetry Emerald (`#10B981`), Warning Gold (`#EAB308`).
- **Typography & Precision Readouts:**
  - `JetBrains Mono` with `font-variant-numeric: tabular-nums` to eliminate number jitter during real-time slider manipulation.
  - `Space Grotesk` uppercase tracking (`0.08em`) for telemetry micro-labels and mission headers.
- **Motion (`framer-motion`):**
  - Smooth spring transitions (`stiffness: 380, damping: 30`) across module navigation tabs with shared `layoutId`.
  - `<AnimatePresence mode="wait">` view transitions.

---

## 🔬 Mathematical & Physics Scaling Engine

All calculations execute live on every slider adjustment:

1. **Gravity-Adjusted Buoyancy ($G^*$):**
   $$G^* = \frac{g_{\text{target}}}{9.81}, \quad \text{Buoyant Velocity Ratio} = \sqrt{G^*}$$
2. **Oxygen Enrichment Index ($OI$) & Partial Pressures ($p_{O_2}$):**
   $$OI = \frac{X_{O_2}}{0.21}$$
   $$p_{O_2\text{ (psi)}} = X_{O_2} \times P_{\text{total (psi)}}, \quad p_{O_2\text{ (kPa)}} = p_{O_2\text{ (psi)}} \times 6.89476$$
3. **Ventilation-Coupled Effective Velocity ($u_{\text{eff}}$):**
   $$u_{\text{eff}} = u_{\text{vent}} + k_b \sqrt{G^*} \, u_{b,1g} \quad (u_{b,1g} = 0.30\text{ m/s}, \, k_b = 1.0)$$
4. **Opposed-Flow Flame Spread Rate ($\hat{V}_f$) & 90% Bayesian Credible Envelope:**
   $$\hat{V}_f = C_{\text{mat}} \cdot (u_{\text{eff}})^n \cdot \left(\frac{X_{O_2}}{0.21}\right)^{1.85} \cdot \left(\frac{P_{\text{total}}}{14.7}\right)^{0.65} \cdot \left(\frac{1.0}{\tau_{\text{mm}}}\right)^{0.45}$$
   Uncertainty bounds widened by $1 + 1.4(1 - C)$, where $C$ is the Evidence Confidence Score.
5. **Mahalanobis Similarity Retrieval & Applicability Kernel:**
   $$d(e,t) = \sqrt{\sum_i w_i \left(\frac{x_{i,e} - x_{i,t}}{\sigma_i}\right)^2}, \quad A(e,t) = \exp\left(-d(e,t)^2\right)$$
   Standard deviations: $\sigma = [0.05\text{ (O2)}, 3.0\text{ (psi)}, 2.5\text{ (g)}, 0.15\text{ (m/s)}, 1.0\text{ (mm)}]$; weights: $w = [0.30, 0.20, 0.25, 0.15, 0.10]$.
6. **5-Axis Evidence Confidence Score ($C$):**
   $$C = 0.25 Q + 0.15 R + 0.30 A + 0.20 C_{\text{coverage}} + 0.10 T$$
7. **Composite Fire Risk ($R_{\text{fire}}$) & Hard Safety Lock Rule:**
   $$R_{\text{fire}} = 0.25\hat{V}_f + 0.25\hat{HRR} + 0.20\hat{S} + 0.15\hat{D}_{\text{delay}} + 0.15\hat{E}_{\text{suppression}}$$
   > **HARD SAFETY LOCK:** If $C < 0.35$, classification is strictly overridden to `INSUFFICIENT EVIDENCE (SAFETY LOCK)` and all "Low/Safe" authorizations are locked out until empirical microgravity testing is performed.

---

## 🖥 4 Integrated Workspace Modules

### 1. Risk, Live Flame Visualizer & Decision Engine
- **Microgravity Flame Morphology Visualizer (HTML5 Canvas 60FPS):**
  - **1g Earth ($9.81\text{ m/s}^2$):** Buoyant flickering teardrop plume ($u_b \propto \sqrt{G^*}$) with Rayleigh-Taylor turbulent oscillation.
  - **Lunar & Martian ($1.62\text{ / }3.71\text{ m/s}^2$):** Semi-buoyant tilted dome flame deflected by cabin ventilation vector.
  - **Microgravity ($0.00\text{ m/s}^2$):** Hemispherical blue diffusion flame with trailing soot tail (NASA BASS/FLARE morphology).
  - Incandescent cyan-white shift at $X_{O_2} > 30\%$, quenching animation below material LOC.
- **Risk Classification HUD:** Composite risk gauge needle, Bayesian 90% credible intervals, comparative curves ($1g$ vs Target $g$).
- **Mitigation Protocols & Decision Memo Export:** Printable NASA Flight Readiness Review report + JSON telemetry download.

### 2. Apples-to-Apples Evidence Explorer & Ingestor
- 16 authentic flight/ground test records (*ISS FLARE, Saffire I-IV, BASS-II, ZARM, Parabolic, WSTF*).
- Live Mahalanobis similarity ranking with color-coded deltas ($\Delta\text{O}_2, \Delta P, \Delta g, \Delta u_{\text{vent}}$).
- Split-screen JSON Schema Inspector with copyable payload.
- Working **"Ingest New NASA Test Record"** modal that immediately injects new data into the live prediction engine.

### 3. 2D Cabin Smoke Advection-Diffusion & Suppression Simulator
- Solves transient 2D transport on a $12 \times 6$ finite-difference grid ($6\text{m} \times 3\text{m}$ habitat):
  $$\frac{\partial C_s}{\partial t} + \mathbf{u}\cdot\nabla C_s = D_s\nabla^2 C_s + S_s - \Lambda C_s$$
- Move Fire Source and 3 Smoke Detectors ($\alpha, \beta, \gamma$) by clicking any cell.
- Time scrubber ($0\text{–}120\text{s}$) with instant deterministic simulation rewind/forward.
- Time-to-Alarm calculation for photoelectric and dual-wavelength laser detectors.
- Suppressant discharge system comparing Water Mist, $\text{CO}_2$, $\text{N}_2$ Mist, and FK-5-1-12 with reduced-gravity droplet dispersion warnings.

### 4. N-Dimensional Research-Gap Heatmap & Test Spec Generator
- $6 \times 5$ matrix across all 6 materials and 5 mission presets shaded by live confidence $C$.
- Auto-generates certified **NASA Targeted Experiment Specification Sheets** ready for copy or download in Markdown format.

---

## 🌐 Live Deployment & CI/CD

### 1. GitHub Pages (Automated via GitHub Actions)
The repository includes [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) for continuous deployment:
1. Go to **Settings** $\rightarrow$ **Pages** on your repository.
2. Under **Build and deployment** $\rightarrow$ **Source**, select **GitHub Actions**.
3. Every push to `main` will build and publish the live web app to:
   ```
   https://bldhanush777-tech.github.io/safe-flame/
   ```

### 2. Vercel (1-Click Deployment)
- Connect this repository on [Vercel](https://vercel.com/new) and click **Deploy**.
- Framework preset: `Vite`, build command: `npm run build`, output directory: `dist`.

---

## 🏃 Getting Started

### Local Development
```bash
# Clone or navigate to the repository
cd safe-flame

# Install dependencies
npm install

# Start development server
npm run dev
```

### Production Build & Preview
```bash
# Build production bundle
npm run build

# Preview production build locally
npm run preview
```
Application will be accessible at `http://localhost:4173/`.
