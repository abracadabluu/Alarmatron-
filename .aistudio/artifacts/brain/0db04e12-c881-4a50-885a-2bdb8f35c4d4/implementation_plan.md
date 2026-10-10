# Alarmatron — Implementation Plan

A precision web and mobile alarm clock crafted with the classic Wikipedia editorial aesthetic, persistent alarms, real Web Audio chime playback, fullscreen ringing modal with snooze/dismiss, and a turnkey GitHub Actions workflow for building Android debug APKs via Capacitor.

### User Review & Critical Decisions

> [!IMPORTANT]
> The following architectural and aesthetic choices were confirmed during Phase 1:
> - **APK Packaging Strategy**: Capacitor Android with Gradle workflow in GitHub Actions.
> - **Visual Theme**: Classic Wikipedia serif styling (`Georgia` / serif typography, `#F8F9FA` surface cards, `#A2A9B1` hairline borders, `#3366CC` encyclopedic link/accent colors).
> - **Alarm Trigger Behavior**: Web Audio synthesizer chime loops with a fullscreen ringing modal featuring Snooze and Dismiss actions.

---

### 1. Overview & Core Concept

- **What It Does**: Alarmatron is an alarm application that combines utility with the classic Wikipedia reading interface. Users can manage alarms with custom repetition schedules, toggle alarms on/off, edit/duplicate alarms, hear sound chimes, and experience real-time countdowns.
- **Android & GitHub Integration**: Includes a pre-configured `.github/workflows/build-debug-apk.yml` and `capacitor.config.json` so that pushing the repository to GitHub automatically triggers a build to produce a downloadable `app-debug.apk`.
- **Target Audience / Persona**: Users seeking a distraction-free, reliable alarm clock on Android and desktop with instant offline capability and zero fluff.

---

### 2. User Experience & Visual Design

#### Key User Flows
1. **Alarm List View (Main Screen)**:
   - Header modeled after Wikipedia's classic article banner ("*Alarmatron — From Wikipedia, the free encyclopedia of timekeeping*").
   - Quick encyclopedic Infobox with live digital clock, active alarms count, and next scheduled alarm countdown.
   - Clean list of alarms displaying:
     - Large serif time with AM/PM indicator.
     - Direct on/off toggle button (stylized toggle switch).
     - Repetition days (unboxed text: e.g. `Mon, Tue, Wed, Thu, Fri` or `Once`).
     - Alarm label (e.g. "Morning Routine", "Shift Standup").
     - Quick "Test Ring" and "Delete/Edit" actions.
   - PWA Install button in header/settings for mobile home screen pinning.
   - Prominent Floating Action Button (FAB) anchored at the bottom to transition to the Set Alarm page.
2. **Set Alarm View (Creation & Edit)**:
   - Header with back navigation arrow and article-style section marker ("*Edit Alarm Section*").
   - Large digital time input with hour, minute, and AM/PM segmented controls.
   - 7-day repetition selector (interactive circular/rectangular day toggles: Mon through Sun).
   - Label text field with helpful preset suggestions ("Wake up", "Workout", "Medicine", "Study").
   - Audio ringtone selector (Web Audio chime profiles: *Westminster Chime*, *Digital Beep*, *Crystal Marimba*, *Gentle Harp*).
   - Snooze interval selector (5 min, 10 min, 15 min).
   - Vibration toggle (uses HTML5 Vibration API on supported Android devices).
   - "Save Alarm" and "Cancel" actions with validation.
3. **Active Ringing Screen**:
   - High-visibility modal that triggers automatically when the system clock matches an active alarm.
   - Repeating Web Audio synthesized sound generator.
   - Displays alarm label, current time, and oversized "Snooze" and "Dismiss" buttons.
4. **Android Build & APK Info Drawer**:
   - In-app drawer detailing the GitHub Actions setup, secrets placeholder guide for upcoming signed APK/AAB keystores, and local testing instructions.

#### Visual Identity & Theme
- **Aesthetic Direction**: Classic Wikipedia encyclopedia article format (timeless, academic, serif-led, stark clarity).
- **Color Palette**:
  - Dominant Canvas: `#FFFFFF` (pure reading white)
  - Secondary Structural Surfaces: `#F8F9FA` (Wikipedia infobox gray), `#EAECF0` (subtle highlight)
  - Hairline Borders: `#A2A9B1` and `#C8CCD1` (Wikipedia classic rules)
  - Primary Accent & Links: `#3366CC` (Wikipedia blue), `#2A4B8D` (hover active)
  - Semantic Status: `#14866D` (active/on), `#72777D` (inactive/muted), `#D33D33` (danger/dismiss)
- **Typography**:
  - Display & Headings: `Georgia, 'Linux Libertine', 'Times New Roman', serif`
  - Body & Labels: `'Helvetica Neue', Helvetica, Arial, sans-serif`
  - Digits & Time: `font-serif font-bold tabular-nums` or `font-mono tabular-nums`
- **Zero-Pill Discipline**: Metadata displayed as clean unboxed text separated by typographic middots (`·`).

---

### 3. Key Product Decisions & Trade-Offs

- **Decision 1: Synthesized Web Audio API vs External MP3 Files**
  - *Chosen Approach*: Pure programmatic audio synthesis using `AudioContext` oscillators, gain nodes, and envelopes.
  - *Why*: Zero network latency, zero broken external audio URLs, works 100% offline in PWA and Android webview, custom sound harmonic profiles.
- **Decision 2: Client-side LocalStorage Persistence**
  - *Chosen Approach*: Structured `localStorage` schema with export/import fallback.
  - *Why*: Immediate offline reliability on Android phone, instant state restoration, no login required.
- **Decision 3: Capacitor GitHub Actions Workflow**
  - *Chosen Approach*: Standardize on `@capacitor/core`, `@capacitor/cli`, and `@capacitor/android` with a GitHub Actions workflow `.github/workflows/build-debug-apk.yml`.
  - *Why*: Cleanest path to native Android APKs without requiring a local Android Studio installation on the user's desktop, and seamlessly prepared for upcoming signed keystore builds.

---

### 4. Technical Architecture & Data Strategy

```
┌────────────────────────────────────────────────────────────────────────┐
│                              Alarmatron                                │
│                                                                        │
│  ┌───────────────────────┐                  ┌───────────────────────┐  │
│  │   Navigation & View   │                  │  Audio & Time Engine  │  │
│  │  - AlarmListView      │                  │  - Clock tick (1 sec) │  │
│  │  - SetAlarmView       │                  │  - Match active alarm │  │
│  │  - RingingModal       │                  │  - Web Audio Chimes   │  │
│  │  - AndroidApkGuide    │                  │  - Vibration API      │  │
│  └───────────▲───────────┘                  └───────────▲───────────┘  │
│              │                                          │              │
│  ┌───────────▼──────────────────────────────────────────▼───────────┐  │
│  │                        Alarm State Store                         │  │
│  │   Alarms: [{ id, time, days[], label, sound, enabled, snooze }]  │  │
│  │   Storage: localStorage ('alarmatron_alarms_v1')                  │  │
│  └──────────────────────────────────▲───────────────────────────────┘  │
└─────────────────────────────────────┼──────────────────────────────────┘
                                      │
                     ┌────────────────┴────────────────┐
                     │     Packaging & CI/CD Layer     │
                     │  - capacitor.config.json        │
                     │  - .github/workflows/           │
                     │    build-debug-apk.yml          │
                     │  - PWA Manifest & Service Worker│
                     └─────────────────────────────────┘
```

#### Core Data Model
```typescript
export interface Alarm {
  id: string;
  hour: number;        // 0-23
  minute: number;      // 0-59
  label: string;       // e.g. "Morning Wake Up"
  days: number[];      // 0=Sun, 1=Mon, ..., 6=Sat (empty array = Once)
  enabled: boolean;
  sound: 'bell' | 'digital' | 'marimba' | 'harp';
  vibrate: boolean;
  snoozeMinutes: number;
  lastDismissedDate?: string; // YYYY-MM-DD to avoid re-triggering same day if single-shot
}
```

#### Interactive State Mapping
- `toggleAlarm(id)`: Flips active state, updates next ring calculation, saves to localStorage.
- `saveAlarm(draft)`: Validates hour/minute, computes label fallback, appends or updates alarm list, transitions back to list.
- `triggerAlarm(alarm)`: Opens ringing modal, plays periodic synthesized chime, initiates vibration pattern.
- `snoozeAlarm(alarm)`: Suspends current ring for chosen interval (e.g., 5 min), updates snooze countdown.
- `dismissAlarm(alarm)`: Halts audio, records dismissal timestamp, deactivates single-shot alarms or schedules next recurring day.

---

### 5. Step-by-Step Implementation Strategy

1. **Step 1: Configuration & Metadata Sync**
   - Update `metadata.json`, `index.html`, and PWA configuration with "Alarmatron".
   - Install `@capacitor/core` and `@capacitor/cli` for mobile packaging support.
2. **Step 2: Core Audio Synthesizer & Alarm Ticking Engine**
   - Implement `audioEngine.ts` with Web Audio harmonic presets (Classic Bell, Digital Beep, Crystal Marimba, Gentle Harp).
   - Implement live clock hook with background interval and ring detection logic.
3. **Step 3: Classic Wikipedia UI Design System**
   - Style layout with Wikipedia article typography, infobox components, and article section dividers.
   - Build alarm list card rows with toggle switches, unboxed metadata, and action triggers.
   - Build floating action button (FAB) anchored cleanly at bottom right with mobile safe-zone spacing.
4. **Step 4: Set Alarm Screen & Modal Views**
   - Build intuitive time selector with AM/PM toggle, day-of-week recurrence selectors, label presets, sound tester, and validation.
5. **Step 5: Fullscreen Ringing Modal & Test Mode**
   - Build high-visibility alert screen with Snooze and Dismiss actions.
   - Add instant "Test Ring" buttons so testing on desktop and mobile web is effortless.
6. **Step 6: GitHub Actions Workflow for Android Debug APK**
   - Create `.github/workflows/build-debug-apk.yml` with automated Gradle build and artifact publishing.
   - Create `capacitor.config.json` configured for Android APK compilation.
   - Provide in-app APK instructions dialog for immediate review.
7. **Step 7: Compilation & Verification**
   - Run `compile_applet` and verify zero TypeScript or bundler errors.
