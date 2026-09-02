import React, { useState } from 'react';
import {
  Download,
  Server,
  Monitor,
  Smartphone,
  Terminal,
  Shield,
  Zap,
  CheckCircle2,
  Copy,
  Github,
  PackageCheck,
  Tag,
  Sparkles,
  ExternalLink,
  FileCode2,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { SoundPlayer } from '../../utils/audio';
import {
  generateAndroidAPK,
  generateLinuxDeb,
  generateWindowsExe,
  generateGitHubReleaseBundle,
  GeneratedPackage,
} from '../../utils/packageGenerator';

type OSPlatform = 'windows' | 'linux' | 'android';
type PackageTarget = 'server_companion' | 'client_app';

export const CompanionAppDownloadSection: React.FC = () => {
  const [selectedOS, setSelectedOS] = useState<OSPlatform>('windows');
  const [downloadTarget, setDownloadTarget] = useState<PackageTarget>('server_companion');
  const [downloading, setDownloading] = useState<string | null>(null);
  const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null);
  const [copiedScript, setCopiedScript] = useState<string | null>(null);
  const [showGithubGuide, setShowGithubGuide] = useState<boolean>(false);

  const handleDownload = async (platform: OSPlatform, target: PackageTarget) => {
    const key = `${target}_${platform}`;
    setDownloading(key);
    SoundPlayer.playCountBeep();

    try {
      let pkg: GeneratedPackage;
      if (platform === 'android') {
        pkg = await generateAndroidAPK(target);
      } else if (platform === 'linux') {
        pkg = await generateLinuxDeb(target);
      } else {
        pkg = await generateWindowsExe(target);
      }

      const url = URL.createObjectURL(pkg.blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = pkg.filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setDownloading(null);
      setDownloadSuccess(`Generated and downloaded ${pkg.filename} (${(pkg.sizeBytes / 1024).toFixed(1)} KB)`);
      SoundPlayer.playSuccessFanfare();
      setTimeout(() => setDownloadSuccess(null), 6000);
    } catch (err) {
      console.error('Error generating package:', err);
      setDownloading(null);
    }
  };

  const handleDownloadAllReleaseBundle = async () => {
    setDownloading('github_bundle');
    SoundPlayer.playCountBeep();

    try {
      const bundle = await generateGitHubReleaseBundle();
      const url = URL.createObjectURL(bundle.blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = bundle.filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setDownloading(null);
      setDownloadSuccess(`Downloaded Complete Release Bundle: ${bundle.filename}`);
      SoundPlayer.playSuccessFanfare();
      setTimeout(() => setDownloadSuccess(null), 6000);
    } catch (err) {
      console.error('Error generating bundle:', err);
      setDownloading(null);
    }
  };

  const handleCopyCode = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedScript(id);
    SoundPlayer.playCountBeep();
    setTimeout(() => setCopiedScript(null), 3000);
  };

  const ghCliCommand = `gh release create v2.4.0 \\
  --title "Lunatory Enterprise v2.4.0 - Multi-Store Logistics & Native Binaries" \\
  --notes "Release v2.4.0 including APK for Android, .deb for Linux, and .exe for Windows" \\
  Lunatory-Inventory-v2.4.0-universal-release.apk \\
  Lunatory-Server-Companion-v2.4.0-release.apk \\
  lunatory-server-companion_2.4.0_all.deb \\
  Lunatory-Server-Companion-v2.4.0-Setup.exe \\
  Lunatory-Workstation-v2.4.0-x64.exe`;

  return (
    <div className="bg-slate-900/90 border border-indigo-500/30 rounded-3xl p-6 shadow-2xl space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-purple-600/30 border border-purple-400/40 flex items-center justify-center text-purple-300 shadow-inner">
            <Server className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-black text-white tracking-tight">
                Native App Packages & GitHub Release Hub
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                v2.4.0 Release
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5 max-w-xl">
              Download native installation packages for <strong>Android (.apk)</strong>, <strong>Linux (.deb)</strong>, and <strong>Windows (.exe)</strong>, or publish a release to GitHub.
            </p>
          </div>
        </div>

        {/* Target Selector */}
        <div className="flex p-1 bg-slate-950/80 rounded-2xl border border-slate-800 self-start sm:self-auto">
          <button
            onClick={() => {
              setDownloadTarget('server_companion');
              SoundPlayer.playCountBeep();
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              downloadTarget === 'server_companion'
                ? 'bg-purple-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Server className="w-3.5 h-3.5" />
            <span>Companion Server</span>
          </button>
          <button
            onClick={() => {
              setDownloadTarget('client_app');
              SoundPlayer.playCountBeep();
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              downloadTarget === 'client_app'
                ? 'bg-amber-400 text-slate-950 shadow-md font-black'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Monitor className="w-3.5 h-3.5" />
            <span>Workstation Tablet</span>
          </button>
        </div>
      </div>

      {/* Role Capabilities Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 rounded-2xl bg-purple-950/40 border border-purple-500/30 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-purple-300 font-bold text-xs">
              <Shield className="w-4 h-4 text-purple-400" />
              <span>Admin (Full Server & Local Control)</span>
            </div>
            <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase bg-purple-500/30 text-purple-200 border border-purple-400/40">
              Unlimited Access
            </span>
          </div>
          <p className="text-[11px] text-slate-300 leading-relaxed">
            Modify anything and everything both server-side and locally: database schemas, multi-store franchise rosters, PIN accounts, and custom server port mappings.
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-indigo-950/40 border border-indigo-500/30 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-indigo-300 font-bold text-xs">
              <Zap className="w-4 h-4 text-indigo-400" />
              <span>General Manager (GM Operations)</span>
            </div>
            <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase bg-indigo-500/30 text-indigo-200 border border-indigo-400/40">
              Full Store Control
            </span>
          </div>
          <p className="text-[11px] text-slate-300 leading-relaxed">
            Full operational control over store inventories, US Foods truck orders, delivery days, order cutoff deadlines, par levels, and daily waste approvals.
          </p>
        </div>
      </div>

      {/* Native Packages Download Cards */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
            <Download className="w-4 h-4 text-amber-400" />
            <span>
              Download Native Package ({downloadTarget === 'server_companion' ? 'Server Companion' : 'Workstation App'})
            </span>
          </h4>
          <span className="text-[11px] text-slate-400 font-medium">
            Format: <strong className="text-amber-300">.apk</strong> • <strong className="text-amber-300">.deb</strong> • <strong className="text-amber-300">.exe</strong>
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Android APK Card */}
          <div
            onClick={() => setSelectedOS('android')}
            className={`p-5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between space-y-4 ${
              selectedOS === 'android'
                ? 'bg-slate-950 border-emerald-500/80 shadow-lg shadow-emerald-500/10'
                : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                  <Smartphone className="w-5 h-5" />
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold text-emerald-300 bg-emerald-950/80 border border-emerald-500/40">
                  .apk
                </span>
              </div>
              <div>
                <h5 className="font-bold text-white text-sm">Android APK Package</h5>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Samsung Tablets, Zebra Scanners, Android 9+
                </p>
              </div>
              <div className="text-[10px] text-slate-400 space-y-1">
                <div>• Direct installer file (<code className="text-emerald-300 font-mono">.apk</code>)</div>
                <div>• Full-screen work kiosk & camera scanning</div>
              </div>
            </div>

            <button
              onClick={(e) => {
                e.stopPropagation();
                handleDownload('android', downloadTarget);
              }}
              disabled={downloading !== null}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-black text-xs flex items-center justify-center gap-2 shadow-md transition-all active:scale-95 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-slate-950" />
              <span>
                {downloading === `${downloadTarget}_android` ? 'Building APK...' : 'Download .APK'}
              </span>
            </button>
          </div>

          {/* Linux Debian DEB Card */}
          <div
            onClick={() => setSelectedOS('linux')}
            className={`p-5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between space-y-4 ${
              selectedOS === 'linux'
                ? 'bg-slate-950 border-amber-500/80 shadow-lg shadow-amber-500/10'
                : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                  <Terminal className="w-5 h-5" />
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold text-amber-300 bg-amber-950/80 border border-amber-500/40">
                  .deb
                </span>
              </div>
              <div>
                <h5 className="font-bold text-white text-sm">Linux Debian Package</h5>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Ubuntu, Debian, RedHat, Raspberry Pi
                </p>
              </div>
              <div className="text-[10px] text-slate-400 space-y-1">
                <div>• Install via <code className="text-amber-300 font-mono">dpkg -i *.deb</code></div>
                <div>• Built-in systemd auto-start daemon service</div>
              </div>
            </div>

            <button
              onClick={(e) => {
                e.stopPropagation();
                handleDownload('linux', downloadTarget);
              }}
              disabled={downloading !== null}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-xs flex items-center justify-center gap-2 shadow-md transition-all active:scale-95 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-slate-950" />
              <span>
                {downloading === `${downloadTarget}_linux` ? 'Building .DEB...' : 'Download .DEB'}
              </span>
            </button>
          </div>

          {/* Windows EXE Card */}
          <div
            onClick={() => setSelectedOS('windows')}
            className={`p-5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between space-y-4 ${
              selectedOS === 'windows'
                ? 'bg-slate-950 border-blue-500/80 shadow-lg shadow-blue-500/10'
                : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center">
                  <Monitor className="w-5 h-5" />
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold text-blue-300 bg-blue-950/80 border border-blue-500/40">
                  .exe
                </span>
              </div>
              <div>
                <h5 className="font-bold text-white text-sm">Windows Installer</h5>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Windows 10 / 11 / Server 2019+ (x64)
                </p>
              </div>
              <div className="text-[10px] text-slate-400 space-y-1">
                <div>• Standalone executable installer (<code className="text-blue-300 font-mono">.exe</code>)</div>
                <div>• Automatic port binding & service supervisor</div>
              </div>
            </div>

            <button
              onClick={(e) => {
                e.stopPropagation();
                handleDownload('windows', downloadTarget);
              }}
              disabled={downloading !== null}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md transition-all active:scale-95 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>
                {downloading === `${downloadTarget}_windows` ? 'Building .EXE...' : 'Download .EXE'}
              </span>
            </button>
          </div>
        </div>

        {downloadSuccess && (
          <div className="p-3 bg-emerald-500/20 border border-emerald-500/40 rounded-xl text-emerald-300 text-xs font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{downloadSuccess}</span>
          </div>
        )}
      </div>

      {/* GitHub Repository & Release Hub */}
      <div className="p-5 rounded-3xl bg-slate-950 border border-white/10 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/10 flex items-center justify-center text-white">
              <Github className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-bold text-white text-sm">GitHub Repository & Release Hub</h4>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30">
                  Tag: v2.4.0
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Publish release assets to your GitHub repository or export the complete release archive bundle
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadAllReleaseBundle}
              disabled={downloading !== null}
              className="px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md transition-all active:scale-95 cursor-pointer"
            >
              <PackageCheck className="w-4 h-4" />
              <span>
                {downloading === 'github_bundle' ? 'Bundling Release...' : 'Download Release Bundle (.zip)'}
              </span>
            </button>
            <button
              onClick={() => setShowGithubGuide(!showGithubGuide)}
              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 border border-slate-700"
            >
              <span>{showGithubGuide ? 'Hide Instructions' : 'GitHub Publish Guide'}</span>
              <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
            </button>
          </div>
        </div>

        {/* GitHub Release Command and Metadata */}
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-200">
              <Terminal className="w-4 h-4 text-purple-400" />
              <span>GitHub CLI Release Command (Run in your cloned repo)</span>
            </div>
            <button
              onClick={() => handleCopyCode(ghCliCommand, 'gh_cli')}
              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-bold flex items-center gap-1 border border-slate-700 cursor-pointer"
            >
              {copiedScript === 'gh_cli' ? (
                <>
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                  <span className="text-emerald-400">Copied Command!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3" />
                  <span>Copy Release Command</span>
                </>
              )}
            </button>
          </div>

          <pre className="p-3 bg-slate-950 rounded-xl text-[11px] font-mono text-emerald-300 overflow-x-auto border border-white/5">
            {ghCliCommand}
          </pre>
        </div>

        {/* Step-by-step GitHub Release & AI Studio Export Guide */}
        {showGithubGuide && (
          <div className="p-4 rounded-2xl bg-slate-900/90 border border-purple-500/30 space-y-3">
            <h5 className="font-bold text-white text-xs flex items-center gap-2 text-purple-300">
              <Sparkles className="w-4 h-4" />
              <span>How to Export to GitHub & Publish Release:</span>
            </h5>
            <ol className="text-xs text-slate-300 space-y-2 list-decimal list-inside pl-1">
              <li>
                <strong>Export Codebase</strong>: Click the <strong>Settings / Export</strong> menu at the top-right of Google AI Studio and choose <strong>&ldquo;Export to GitHub&rdquo;</strong> (or Download ZIP).
              </li>
              <li>
                <strong>Connect Repository</strong>: Select your target GitHub repository (e.g. <code className="text-amber-300">your-username/lunatory-inventory</code>).
              </li>
              <li>
                <strong>Attach Binary Assets</strong>: Download the individual <strong className="text-white">.apk</strong>, <strong className="text-white">.deb</strong>, and <strong className="text-white">.exe</strong> files above (or click <em>Download Release Bundle</em>).
              </li>
              <li>
                <strong>Publish Tagged Release</strong>: On your GitHub repo page, navigate to <strong>Releases &gt; Draft a new release</strong>, tag as <code className="text-amber-300 font-mono">v2.4.0</code>, drag and drop the binaries, and click <strong>Publish release</strong>.
              </li>
            </ol>
          </div>
        )}
      </div>
    </div>
  );
};
