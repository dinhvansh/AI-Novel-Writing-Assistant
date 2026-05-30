import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import type { TFunction } from "i18next";
import { Download, RefreshCw, RotateCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  checkForDesktopUpdates,
  copyDesktopLogPath,
  openDesktopLogsDirectory,
  restartDesktopApp,
  quitAndInstallDesktopUpdate,
  type DesktopBootstrapSnapshot,
  type DesktopUpdaterSnapshot,
  useDesktopUpdater,
} from "@/lib/desktop";
import { cn } from "@/lib/utils";
import DesktopBrandMark from "./DesktopBrandMark";

interface DesktopBootstrapShellProps {
  snapshot: DesktopBootstrapSnapshot;
  overlay?: boolean;
}

function resolveStateLabel(snapshot: DesktopBootstrapSnapshot, t: TFunction): string {
  switch (snapshot.state) {
    case "launching": return t("desktop:bootstrap.state.launching");
    case "starting-server": return t("desktop:bootstrap.state.startingServer");
    case "loading-ui": return t("desktop:bootstrap.state.loadingUi");
    case "ready": return t("desktop:bootstrap.state.ready");
    case "error": return t("desktop:bootstrap.state.error");
    default: return snapshot.state;
  }
}

function resolveStageLabel(snapshot: DesktopBootstrapSnapshot, t: TFunction): string {
  switch (snapshot.stage) {
    case "launching": return t("desktop:bootstrap.stage.launching");
    case "app-ready": return t("desktop:bootstrap.stage.appReady");
    case "splash-shown": return t("desktop:bootstrap.stage.splashShown");
    case "server-starting": return t("desktop:bootstrap.stage.serverStarting");
    case "server-healthy": return t("desktop:bootstrap.stage.serverHealthy");
    case "renderer-ready": return t("desktop:bootstrap.stage.rendererReady");
    case "main-window-shown": return t("desktop:bootstrap.stage.mainWindowShown");
    case "error": return t("desktop:bootstrap.stage.error");
    default: return snapshot.stage;
  }
}

function resolveProgressHint(snapshot: DesktopBootstrapSnapshot, t: TFunction): string {
  switch (snapshot.state) {
    case "launching": return t("desktop:bootstrap.progressHint.launching");
    case "starting-server": return t("desktop:bootstrap.progressHint.startingServer");
    case "loading-ui": return t("desktop:bootstrap.progressHint.loadingUi");
    case "ready": return t("desktop:bootstrap.progressHint.ready");
    case "error": return t("desktop:bootstrap.progressHint.error");
    default: return snapshot.detail;
  }
}

function resolveUpdaterStatusLabel(status: DesktopUpdaterSnapshot["status"], t: TFunction): string {
  switch (status) {
    case "disabled": return t("desktop:bootstrap.updater.status.disabled");
    case "idle": return t("desktop:bootstrap.updater.status.idle");
    case "checking": return t("desktop:bootstrap.updater.status.checking");
    case "update-available": return t("desktop:bootstrap.updater.status.updateAvailable");
    case "downloading": return t("desktop:bootstrap.updater.status.downloading");
    case "downloaded": return t("desktop:bootstrap.updater.status.downloaded");
    case "not-available": return t("desktop:bootstrap.updater.status.notAvailable");
    case "error": return t("desktop:bootstrap.updater.status.error");
    default: return status;
  }
}

function resolveUpdaterHint(updater: DesktopUpdaterSnapshot, bootstrapState: DesktopBootstrapSnapshot["state"], t: TFunction): string {
  if (!updater.isSupported) {
    if (updater.isPortable) {
      return t("desktop:bootstrap.updater.hint.portable");
    }

    if (!updater.isPackaged) {
      return t("desktop:bootstrap.updater.hint.dev");
    }

    return updater.message;
  }

  switch (updater.status) {
    case "idle":
      return bootstrapState === "error"
        ? t("desktop:bootstrap.updater.hint.errorState")
        : t("desktop:bootstrap.updater.hint.idle");
    case "checking":
      return t("desktop:bootstrap.updater.hint.checking");
    case "update-available":
      return t("desktop:bootstrap.updater.hint.updateAvailable", { version: updater.availableVersion ?? t("desktop:bootstrap.updater.newVersion") });
    case "downloading":
      return t("desktop:bootstrap.updater.hint.downloading");
    case "downloaded":
      return t("desktop:bootstrap.updater.hint.downloaded");
    case "not-available":
      return t("desktop:bootstrap.updater.hint.notAvailable");
    case "error":
      return updater.message || t("desktop:bootstrap.updater.hint.error");
    default:
      return updater.message;
  }
}

function formatSnapshotTime(value: string): string {
  if (!value) {
    return "-";
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return parsed.toLocaleString("zh-CN", {
    hour12: false,
  });
}

function DesktopBootstrapUpdatePanel({ snapshot }: { snapshot: DesktopBootstrapSnapshot }) {
  const { t } = useTranslation();
  const updater = useDesktopUpdater();
  const didRequestStartupCheckRef = useRef(false);
  const [isBusy, setIsBusy] = useState(false);
  const isPromptingUpdate = updater.status === "update-available" || updater.status === "downloaded";
  const isCheckingOrDownloading = updater.status === "checking" || updater.status === "downloading";
  const showDownloadButton = updater.status === "update-available";
  const showInstallButton = updater.status === "downloaded";
  const showCheckButton = updater.isSupported && !showDownloadButton && !showInstallButton && updater.status !== "downloading";

  useEffect(() => {
    if (didRequestStartupCheckRef.current || !updater.isSupported) {
      return;
    }

    if (updater.lastCheckedAt || updater.status !== "idle") {
      return;
    }

    if (snapshot.state !== "launching" && snapshot.state !== "starting-server" && snapshot.state !== "error") {
      return;
    }

    didRequestStartupCheckRef.current = true;
    void checkForDesktopUpdates().catch(() => {
      didRequestStartupCheckRef.current = false;
    });
  }, [snapshot.state, updater.isSupported, updater.lastCheckedAt, updater.status]);

  const runUpdaterAction = async (action: "check" | "install") => {
    setIsBusy(true);
    try {
      if (action === "install") {
        await quitAndInstallDesktopUpdate();
      } else {
        await checkForDesktopUpdates();
      }
    } catch (error) {
      console.error("[desktop] updater action failed.", error);
    } finally {
      setIsBusy(false);
    }
  };

  return (
    <div
      className={cn(
        "rounded-3xl border p-5",
        isPromptingUpdate
          ? "border-amber-300/70 bg-amber-300/10"
          : "border-slate-800 bg-slate-900/70",
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="text-xs font-medium uppercase tracking-[0.2em] text-slate-400">{t("desktop:bootstrap.updater.title")}</div>
        <Badge
          variant="outline"
          className={cn(
            "border-slate-600 bg-slate-950/60 text-slate-100",
            isPromptingUpdate ? "border-amber-300/80 bg-amber-300/15 text-amber-100" : null,
          )}
        >
          {resolveUpdaterStatusLabel(updater.status, t)}
        </Badge>
      </div>

      <div className="mt-3 grid gap-2 text-sm text-slate-300">
        <div className="flex items-center justify-between gap-3">
          <span>{t("desktop:bootstrap.updater.currentVersion")}</span>
          <span className="font-medium text-slate-100">{updater.currentVersion}</span>
        </div>
        <div className="flex items-center justify-between gap-3">
          <span>{t("desktop:bootstrap.updater.availableVersion")}</span>
          <span className="font-medium text-slate-100">{updater.availableVersion ?? "-"}</span>
        </div>
        <div className="flex items-center justify-between gap-3 text-slate-400">
          <span>{t("desktop:bootstrap.updater.lastChecked")}</span>
          <span className="font-medium text-slate-200">{formatSnapshotTime(updater.lastCheckedAt ?? "")}</span>
        </div>
      </div>

      <div className="mt-3 rounded-2xl border border-slate-800 bg-slate-950/60 px-4 py-3 text-sm leading-6 text-slate-300">
        {resolveUpdaterHint(updater, snapshot.state, t)}
        {typeof updater.progressPercent === "number" ? ` ${t("desktop:bootstrap.updater.downloadProgress", { percent: Math.round(updater.progressPercent) })}` : ""}
      </div>

      <div className="mt-4 flex flex-wrap gap-3">
        {showCheckButton ? (
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="border-slate-600 bg-slate-800 text-slate-100 hover:bg-slate-700 hover:text-white"
            disabled={isBusy || updater.status === "checking"}
            onClick={() => void runUpdaterAction("check")}
          >
            <RefreshCw className={cn("h-4 w-4", updater.status === "checking" ? "animate-spin" : null)} aria-hidden="true" />
            {updater.status === "checking" ? t("desktop:bootstrap.updater.status.checking") : updater.status === "error" || updater.status === "not-available" ? t("desktop:bootstrap.updater.recheck") : t("desktop:bootstrap.updater.checkUpdate")}
          </Button>
        ) : null}
        {showDownloadButton ? (
          <Button
            type="button"
            size="sm"
            className="bg-amber-300 text-slate-950 hover:bg-amber-200"
            disabled={isBusy || isCheckingOrDownloading}
            onClick={() => void runUpdaterAction("check")}
          >
            <Download className="h-4 w-4" aria-hidden="true" />
            {t("desktop:bootstrap.updater.downloadUpdate")}
          </Button>
        ) : null}
        {showInstallButton ? (
          <Button
            type="button"
            size="sm"
            className="bg-cyan-400 text-slate-950 hover:bg-cyan-300"
            disabled={isBusy || !updater.canInstall}
            onClick={() => void runUpdaterAction("install")}
          >
            <RotateCw className="h-4 w-4" aria-hidden="true" />
            {t("desktop:bootstrap.updater.restartInstall")}
          </Button>
        ) : null}
      </div>
    </div>
  );
}

export default function DesktopBootstrapShell({ snapshot, overlay = false }: DesktopBootstrapShellProps) {
  const { t } = useTranslation();
  const surfaceClassName = overlay
    ? "bg-background/88 backdrop-blur-xl"
    : "bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.18),transparent_42%),radial-gradient(circle_at_bottom_right,rgba(245,158,11,0.16),transparent_38%),linear-gradient(145deg,#08101f_0%,#122033_55%,#101d2e_100%)]";

  return (
    <div className={cn("fixed inset-0 z-[90] flex items-center justify-center px-6 py-8", surfaceClassName)}>
      <div className="w-full max-w-3xl overflow-hidden rounded-[30px] border border-slate-700/50 bg-slate-950/82 text-slate-50 shadow-[0_24px_90px_rgba(2,6,23,0.5)]">
        <div className="grid gap-0 lg:grid-cols-[1.15fr_0.85fr]">
          <section className="space-y-6 border-b border-slate-800/80 px-8 py-8 lg:border-b-0 lg:border-r">
            <div className="flex items-center gap-4">
              <DesktopBrandMark className="h-20 w-20" />
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge className="bg-cyan-500/20 text-cyan-100 hover:bg-cyan-500/20">
                    {t("desktop:bootstrap.betaBadge")}
                  </Badge>
                  <Badge variant="outline" className="border-slate-600 bg-slate-900/70 text-slate-100">
                    {resolveStageLabel(snapshot, t)}
                  </Badge>
                </div>
                <h1 className="text-3xl font-semibold tracking-tight">{t("desktop:bootstrap.appTitle")}</h1>
              </div>
            </div>

            <div className="space-y-3">
              <h2 className="text-2xl font-semibold tracking-tight">{snapshot.title}</h2>
              <p className="max-w-xl text-sm leading-7 text-slate-300">{snapshot.detail}</p>
            </div>

            <div className="space-y-3">
              <div className="h-2 w-full overflow-hidden rounded-full bg-slate-800">
                {snapshot.state === "error" ? (
                  <span className="block h-full w-full rounded-full bg-rose-400" />
                ) : (
                  <span className="block h-full w-1/2 animate-[desktop-shell-progress_1.4s_ease-in-out_infinite] rounded-full bg-[linear-gradient(90deg,#76e5ff_0%,#f6b24c_100%)]" />
                )}
              </div>
              <div className="rounded-2xl border border-slate-800 bg-slate-900/70 px-4 py-4 text-sm leading-6 text-slate-300">
                {t("desktop:bootstrap.splashHint")}
              </div>
            </div>
          </section>

          <section className="space-y-5 px-8 py-8">
            <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-5">
              <div className="text-xs font-medium uppercase tracking-[0.2em] text-slate-400">{t("desktop:bootstrap.currentProgress")}</div>
              <div className="mt-3 space-y-3 text-sm text-slate-200">
                <div className="flex items-center justify-between gap-3">
                  <span>{t("desktop:bootstrap.statusLabel")}</span>
                  <span className="font-medium">{resolveStateLabel(snapshot, t)}</span>
                </div>
                <div className="rounded-2xl border border-slate-800 bg-slate-950/60 px-4 py-3 text-slate-300">
                  {resolveProgressHint(snapshot, t)}
                </div>
                <div className="flex items-center justify-between gap-3 text-slate-400">
                  <span>{t("desktop:bootstrap.lastUpdated")}</span>
                  <span className="font-medium text-slate-200">{formatSnapshotTime(snapshot.updatedAt)}</span>
                </div>
              </div>
            </div>

            <DesktopBootstrapUpdatePanel snapshot={snapshot} />

            <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-5">
              <div className="text-xs font-medium uppercase tracking-[0.2em] text-slate-400">{t("desktop:bootstrap.logsTitle")}</div>
              <div className="mt-3 text-sm leading-6 text-slate-300">
                {t("desktop:bootstrap.logsHint")}
              </div>
              <div className="mt-4 flex flex-wrap gap-3">
                <Button
                  variant="secondary"
                  className="bg-slate-50 text-slate-950 hover:bg-white"
                  onClick={() => void openDesktopLogsDirectory()}
                >
                  {t("desktop:bootstrap.openLogsDir")}
                </Button>
                <Button
                  variant="outline"
                  className="border-slate-600 bg-slate-800 text-slate-100 hover:bg-slate-700 hover:text-white"
                  onClick={() => void copyDesktopLogPath()}
                >
                  {t("desktop:bootstrap.copyLogPath")}
                </Button>
                {snapshot.state === "error" && snapshot.canRetry ? (
                  <Button
                    className="bg-cyan-400 text-slate-950 hover:bg-cyan-300"
                    onClick={() => void restartDesktopApp()}
                  >
                    {t("desktop:bootstrap.restart")}
                  </Button>
                ) : null}
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
