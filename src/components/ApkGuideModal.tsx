import React, { useState } from 'react';
import { X, Check, Copy, Github, Smartphone, Key, Terminal, Download, ShieldCheck } from 'lucide-react';

interface ApkGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const WORKFLOW_YML_SNIPPET = `name: Build Alarmatron Debug APK

on:
  push:
    branches: [ main, master ]
  workflow_dispatch:

jobs:
  build-apk:
    name: Build Android Debug APK
    runs-on: ubuntu-latest

    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Setup Node.js 20
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'

      - name: Install dependencies
        run: npm install

      - name: Build Web Application
        run: npm run build

      - name: Set up Java 17
        uses: actions/setup-java@v4
        with:
          distribution: 'temurin'
          java-version: '17'

      - name: Setup Android SDK
        uses: android-actions/setup-android@v3

      - name: Add and Sync Capacitor Android
        run: |
          npx cap add android || true
          npx cap sync android

      - name: Build Android Debug APK with Gradle
        run: |
          cd android
          ./gradlew assembleDebug --stacktrace

      - name: Upload Debug APK Artifact
        uses: actions/upload-artifact@v4
        with:
          name: alarmatron-debug-apk
          path: android/app/build/outputs/apk/debug/app-debug.apk
          retention-days: 14`;

export const ApkGuideModal: React.FC<ApkGuideModalProps> = ({ isOpen, onClose }) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(WORKFLOW_YML_SNIPPET);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 bg-[#202122]/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
    >
      <div className="w-full max-w-3xl bg-white border border-[#a2a9b1] shadow-2xl my-8">
        {/* Header */}
        <div className="bg-[#f8f9fa] border-b border-[#a2a9b1] px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Github className="w-5 h-5 text-[#202122]" />
            <h2 className="text-base font-bold font-wiki-serif text-[#202122]">
              Android APK Build Specification (GitHub Actions)
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-[#54595d] hover:text-[#202122] hover:bg-[#eaecf0] rounded-xs"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 sm:p-6 space-y-6 text-xs text-[#202122] max-h-[75vh] overflow-y-auto">
          {/* Phase 1 Overview Banner */}
          <div className="bg-[#e8f6f3] border border-[#a2d8ce] p-4 rounded-xs">
            <div className="flex items-start gap-3">
              <Smartphone className="w-5 h-5 text-[#14866d] shrink-0 mt-0.5" />
              <div>
                <h3 className="font-bold text-sm text-[#14866d]">
                  Phase 1 Ready: Automated Debug APK Generation
                </h3>
                <p className="text-xs text-[#202122] mt-1 leading-relaxed">
                  The workflow file <code className="bg-white px-1 py-0.5 border border-[#a2d8ce] rounded-xs font-mono">.github/workflows/build-debug-apk.yml</code> has been created. Once you push your changes to your GitHub repository, GitHub Actions will compile your project into an installable Android Debug APK!
                </p>
              </div>
            </div>
          </div>

          {/* How to download on your phone */}
          <div className="border border-[#c8ccd1] p-4 bg-white">
            <h4 className="font-bold text-xs uppercase tracking-wider text-[#54595d] mb-2 flex items-center gap-1.5">
              <Download className="w-4 h-4 text-[#3366cc]" />
              How to Get the APK on Your Android Phone
            </h4>
            <ol className="list-decimal list-inside space-y-1.5 text-xs text-[#202122] pl-1">
              <li>Push this repository or branch to your GitHub account.</li>
              <li>Navigate to your repository's <strong>Actions</strong> tab.</li>
              <li>Click on the workflow <strong>Build Android Debug APK</strong>.</li>
              <li>
                When the run finishes (green checkmark), look at the <strong>Artifacts</strong> section at the bottom.
              </li>
              <li>
                Download <span className="font-mono font-semibold text-[#3366cc]">alarmatron-debug-apk.zip</span> and open the <span className="font-mono">app-debug.apk</span> directly on your phone!
              </li>
            </ol>
          </div>

          {/* Phase 2: Signed APK / AAB Readiness */}
          <div className="border border-[#c8ccd1] p-4 bg-[#f8f9fa]">
            <h4 className="font-bold text-xs uppercase tracking-wider text-[#54595d] mb-2 flex items-center gap-1.5">
              <Key className="w-4 h-4 text-[#78350f]" />
              Phase 2 Preparation: Signed APK & AAB Production Builds
            </h4>
            <p className="text-xs text-[#54595d] leading-relaxed mb-3">
              When you are ready for Play Store or release distribution, simply provide your keystore credentials and secret names. We will configure:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 font-mono text-[11px]">
              <div className="bg-white p-2 border border-[#eaecf0]">
                <div className="text-[10px] text-[#54595d] font-sans">Secret 1:</div>
                <code>KEYSTORE_BASE64</code>
              </div>
              <div className="bg-white p-2 border border-[#eaecf0]">
                <div className="text-[10px] text-[#54595d] font-sans">Secret 2:</div>
                <code>KEY_ALIAS</code>
              </div>
              <div className="bg-white p-2 border border-[#eaecf0]">
                <div className="text-[10px] text-[#54595d] font-sans">Secret 3:</div>
                <code>KEYSTORE_PASSWORD</code>
              </div>
            </div>
            <p className="text-[11px] text-[#54595d] mt-2 italic">
              Gradle command for release: <code>./gradlew bundleRelease</code> (for Google Play AAB) and <code>./gradlew assembleRelease</code> (for direct signed APK).
            </p>
          </div>

          {/* Workflow Code Viewer */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="font-mono text-xs text-[#54595d]">
                .github/workflows/build-debug-apk.yml
              </span>
              <button
                onClick={handleCopy}
                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs border border-[#a2a9b1] bg-[#f8f9fa] hover:bg-[#eaecf0] rounded-xs font-sans text-[#202122] transition-colors"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-[#14866d]" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy YAML</span>
                  </>
                )}
              </button>
            </div>
            <pre className="bg-[#202122] text-[#f8f9fa] p-3 text-[11px] font-mono rounded-xs overflow-x-auto max-h-56 leading-relaxed border border-[#a2a9b1]">
              {WORKFLOW_YML_SNIPPET}
            </pre>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-[#eaecf0] border-t border-[#a2a9b1] px-5 py-3 flex items-center justify-between">
          <span className="text-[11px] text-[#54595d]">
            Target Package: <code className="font-mono text-[#202122]">org.alarmatron.app</code>
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold bg-[#3366cc] text-white hover:bg-[#2a4b8d] rounded-xs transition-colors"
          >
            Close Guide
          </button>
        </div>
      </div>
    </div>
  );
};
