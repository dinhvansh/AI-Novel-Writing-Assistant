import { useTranslation } from "react-i18next";
import type { CreativeHubStreamFrame } from "@ai-novel/shared/types/api";
import { Badge } from "@/components/ui/badge";

function toStatusLabel(status: string, t: (key: string) => string): string {
  if (status === "running") return t("creativeHub:activity.status.running");
  if (status === "queued") return t("creativeHub:activity.status.queued");
  if (status === "waiting_approval") return t("creativeHub:activity.status.waiting_approval");
  if (status === "succeeded") return t("creativeHub:activity.status.succeeded");
  if (status === "failed") return t("creativeHub:activity.status.failed");
  if (status === "cancelled") return t("creativeHub:activity.status.cancelled");
  return status;
}

function toVariant(frame: CreativeHubStreamFrame): "default" | "secondary" | "outline" | "destructive" {
  if (frame.event === "creative_hub/error" || frame.event === "error") {
    return "destructive";
  }
  if (frame.event === "creative_hub/interrupt") {
    return "secondary";
  }
  if (frame.event === "creative_hub/run_status" && frame.data.status === "failed") {
    return "destructive";
  }
  if (frame.event === "creative_hub/run_status" && frame.data.status === "waiting_approval") {
    return "secondary";
  }
  return "outline";
}

export function getActivityRunId(frame: CreativeHubStreamFrame): string | null {
  if (
    frame.event === "creative_hub/run_status"
    || frame.event === "creative_hub/tool_call"
    || frame.event === "creative_hub/tool_result"
  ) {
    return typeof frame.data.runId === "string" && frame.data.runId.trim()
      ? frame.data.runId
      : null;
  }
  if (frame.event === "creative_hub/interrupt") {
    return typeof frame.data.runId === "string" && frame.data.runId.trim()
      ? frame.data.runId
      : null;
  }
  return null;
}

function renderBody(frame: CreativeHubStreamFrame, t: (key: string, opts?: Record<string, unknown>) => string): { title: string; summary: string; meta: string[] } {
  if (frame.event === "creative_hub/run_status") {
    return {
      title: t("creativeHub:activity.runStatus.title"),
      summary: frame.data.message || t("creativeHub:activity.runStatus.summary", { status: toStatusLabel(frame.data.status, t) }),
      meta: [toStatusLabel(frame.data.status, t), frame.data.runId ? `Run ${frame.data.runId.slice(0, 8)}` : ""].filter(Boolean),
    };
  }
  if (frame.event === "creative_hub/tool_call") {
    return {
      title: t("creativeHub:activity.toolCall.title", { toolName: frame.data.toolName }),
      summary: frame.data.inputSummary || t("creativeHub:activity.toolCall.defaultSummary"),
      meta: [frame.data.runId ? `Run ${frame.data.runId.slice(0, 8)}` : "", frame.data.stepId ? `Step ${frame.data.stepId.slice(0, 8)}` : ""].filter(Boolean),
    };
  }
  if (frame.event === "creative_hub/tool_result") {
    return {
      title: t("creativeHub:activity.toolResult.title", { toolName: frame.data.toolName, result: frame.data.success ? t("creativeHub:activity.toolResult.success") : t("creativeHub:activity.toolResult.failed") }),
      summary: frame.data.outputSummary || t("creativeHub:activity.toolResult.defaultSummary"),
      meta: [frame.data.success ? t("creativeHub:activity.toolResult.success") : t("creativeHub:activity.toolResult.failed"), frame.data.runId ? `Run ${frame.data.runId.slice(0, 8)}` : ""].filter(Boolean),
    };
  }
  if (frame.event === "creative_hub/interrupt") {
    return {
      title: frame.data.title || t("creativeHub:activity.interrupt.defaultTitle"),
      summary: frame.data.summary,
      meta: [frame.data.targetType ? `${frame.data.targetType}:${frame.data.targetId ?? "-"}` : "", frame.data.runId ? `Run ${frame.data.runId.slice(0, 8)}` : ""].filter(Boolean),
    };
  }
  if (frame.event === "creative_hub/approval_resolved") {
    return {
      title: frame.data.action === "approved" ? t("creativeHub:activity.approval.approved") : t("creativeHub:activity.approval.rejected"),
      summary: frame.data.note?.trim() || t("creativeHub:activity.approval.defaultSummary"),
      meta: [frame.data.approvalId ? `Approval ${frame.data.approvalId.slice(0, 8)}` : ""].filter(Boolean),
    };
  }
  if (frame.event === "creative_hub/error" || frame.event === "error") {
    return {
      title: t("creativeHub:activity.error.title"),
      summary: frame.data.message,
      meta: [],
    };
  }
  if (frame.event === "metadata" && typeof frame.data.reasoning === "string") {
    return {
      title: t("creativeHub:activity.metadata.reasoning"),
      summary: frame.data.reasoning,
      meta: [],
    };
  }
  if (frame.event === "metadata" && typeof frame.data.planner === "object" && frame.data.planner) {
    const planner = frame.data.planner as Record<string, unknown>;
    return {
      title: t("creativeHub:activity.metadata.intentTitle"),
      summary: t("creativeHub:activity.metadata.intentSummary", { intent: String(planner.intent ?? "unknown"), source: String(planner.source ?? "unknown") }),
      meta: [
        "confidence" in planner ? t("creativeHub:activity.metadata.confidence", { value: String(planner.confidence ?? "-") }) : "",
      ].filter(Boolean),
    };
  }
  if (frame.event === "metadata" && typeof frame.data.checkpointId === "string") {
    return {
      title: t("creativeHub:activity.metadata.checkpointTitle"),
      summary: `Checkpoint ${frame.data.checkpointId.slice(0, 8)} ${t("creativeHub:activity.metadata.checkpointSaved")}`,
      meta: [typeof frame.data.runId === "string" ? `Run ${frame.data.runId.slice(0, 8)}` : ""].filter(Boolean),
    };
  }
  return {
    title: t("creativeHub:activity.system.title"),
    summary: "",
    meta: [],
  };
}

export function isRenderableActivity(frame: CreativeHubStreamFrame): boolean {
  if (
    frame.event === "creative_hub/run_status"
    || frame.event === "creative_hub/approval_resolved"
    || frame.event === "creative_hub/error"
    || frame.event === "error"
  ) {
    return true;
  }
  if (frame.event === "metadata") {
    return typeof frame.data.reasoning === "string"
      || typeof frame.data.checkpointId === "string"
      || (typeof frame.data.planner === "object" && frame.data.planner !== null);
  }
  return false;
}

interface CreativeHubActivityFeedProps {
  activities: CreativeHubStreamFrame[];
  onQuickAction?: (prompt: string) => void;
}

export default function CreativeHubActivityFeed({
  activities,
  onQuickAction,
}: CreativeHubActivityFeedProps) {
  const { t } = useTranslation();
  if (activities.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      {activities.slice(-8).map((activity, index) => {
        if (
          activity.event === "creative_hub/tool_call"
          || activity.event === "creative_hub/tool_result"
          || activity.event === "creative_hub/interrupt"
        ) {
          return null;
        }
        const body = renderBody(activity, t);
        if (!body.summary && !body.meta.length) {
          return null;
        }
        return (
          <div
            key={`${activity.event}-${index}`}
            className="mr-auto max-w-[92%] rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="text-sm font-medium text-slate-900">{body.title}</div>
              <Badge variant={toVariant(activity)}>{activity.event.replace("creative_hub/", "")}</Badge>
            </div>
            <div className="mt-2 text-xs leading-5 text-slate-700">{body.summary}</div>
            {body.meta.length > 0 ? (
              <div className="mt-3 flex flex-wrap gap-2">
                {body.meta.map((item) => (
                  <span key={item} className="rounded-full bg-slate-100 px-2 py-1 text-[11px] text-slate-600">
                    {item}
                  </span>
                ))}
              </div>
            ) : null}
            {activity.event === "metadata"
            && typeof activity.data === "object"
            && activity.data
            && "planner" in activity.data
            && activity.data.planner
            && typeof activity.data.planner === "object" ? (
              <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-700">
                <div className="mb-1 text-[11px] font-medium text-slate-500">{t("creativeHub:activity.metadata.intentTitle")}</div>
                <div>{t("creativeHub:activity.metadata.source")}: {String((activity.data.planner as Record<string, unknown>).source ?? "unknown")}</div>
                <div>{t("creativeHub:activity.metadata.intent")}: {String((activity.data.planner as Record<string, unknown>).intent ?? "unknown")}</div>
                {"confidence" in (activity.data.planner as Record<string, unknown>) ? (
                  <div>{t("creativeHub:activity.metadata.confidenceLabel")}: {String((activity.data.planner as Record<string, unknown>).confidence ?? "-")}</div>
                ) : null}
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
