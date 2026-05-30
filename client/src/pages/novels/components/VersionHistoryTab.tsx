import { useTranslation } from "react-i18next";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createNovelSnapshot, listNovelSnapshots, restoreNovelSnapshot } from "@/api/novel";
import { queryKeys } from "@/api/queryKeys";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface VersionHistoryTabProps {
  novelId: string;
}

function formatSnapshotTrigger(triggerType: string, t: ReturnType<typeof useTranslation>["t"]): string {
  if (triggerType === "manual") {
    return t("novel:versionHistory.trigger.manual");
  }
  if (triggerType === "auto_milestone") {
    return t("novel:versionHistory.trigger.autoMilestone");
  }
  if (triggerType === "before_pipeline") {
    return t("novel:versionHistory.trigger.beforePipeline");
  }
  return t("novel:versionHistory.trigger.snapshot");
}

function summarizeSnapshot(snapshotData: string): {
  chapterCount: number;
  writtenChapterCount: number;
  totalWordCount: number;
  latestChapterLabel: string;
  hasOutline: boolean;
  hasStructuredOutline: boolean;
  recentChapterTitles: string[];
} | null {
  try {
    const parsed = JSON.parse(snapshotData) as {
      outline?: string | null;
      structuredOutline?: string | null;
      chapters?: Array<{ title?: string | null; order?: number | null; content?: string | null }>;
    };
    const chapters = Array.isArray(parsed.chapters) ? parsed.chapters : [];
    const writtenChapters = chapters.filter((chapter) => Boolean(chapter.content?.trim()));
    const totalWordCount = writtenChapters.reduce((sum, chapter) => sum + (chapter.content?.trim().length ?? 0), 0);
    const latestChapter = [...chapters]
      .sort((left, right) => (right.order ?? 0) - (left.order ?? 0))[0];

    return {
      chapterCount: chapters.length,
      writtenChapterCount: writtenChapters.length,
      totalWordCount,
      latestChapterLabel: latestChapter
        ? `第 ${latestChapter.order ?? "?"} 章 · ${latestChapter.title?.trim() || "未命名章节"}`
        : "",
      hasOutline: Boolean(parsed.outline?.trim()),
      hasStructuredOutline: Boolean(parsed.structuredOutline?.trim()),
      recentChapterTitles: chapters
        .slice(0, 3)
        .map((chapter) => chapter.title?.trim())
        .filter((title): title is string => Boolean(title)),
    };
  } catch {
    return null;
  }
}

export default function VersionHistoryTab({ novelId }: VersionHistoryTabProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const snapshotsQuery = useQuery({
    queryKey: queryKeys.novels.snapshots(novelId),
    queryFn: () => listNovelSnapshots(novelId),
    enabled: Boolean(novelId),
  });

  const createMutation = useMutation({
    mutationFn: () => createNovelSnapshot(novelId, {
      triggerType: "manual",
      label: `manual-${new Date().toLocaleString()}`,
    }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.novels.snapshots(novelId) });
    },
  });

  const restoreMutation = useMutation({
    mutationFn: (snapshotId: string) => restoreNovelSnapshot(novelId, snapshotId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.novels.detail(novelId) });
      await queryClient.invalidateQueries({ queryKey: queryKeys.novels.snapshots(novelId) });
    },
  });

  const snapshots = snapshotsQuery.data?.data ?? [];

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 rounded-2xl border border-border/70 bg-muted/15 p-4 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="font-medium">{t("novel:versionHistory.title")}</div>
          <div className="text-sm text-muted-foreground">
            {t("novel:versionHistory.description")}
          </div>
        </div>
        <Button onClick={() => createMutation.mutate()} disabled={createMutation.isPending}>
          {createMutation.isPending ? t("novel:versionHistory.saving") : t("novel:versionHistory.saveButton")}
        </Button>
      </div>

      <div className="space-y-3">
        {snapshots.map((snapshot) => {
          const summary = summarizeSnapshot(snapshot.snapshotData);
          const isRestoringCurrent = restoreMutation.isPending && restoreMutation.variables === snapshot.id;

          return (
            <div key={snapshot.id} className="rounded-2xl border border-border/70 bg-background p-4 shadow-sm">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="space-y-3">
                  <div className="space-y-1">
                    <div className="font-medium">{snapshot.label || t("novel:versionHistory.unnamedVersion")}</div>
                    <div className="text-xs text-muted-foreground">
                      {formatSnapshotTrigger(snapshot.triggerType, t)} · {new Date(snapshot.createdAt).toLocaleString()}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline">{t("novel:versionHistory.badge.chapters", { count: summary?.chapterCount ?? 0 })}</Badge>
                    <Badge variant="outline">{t("novel:versionHistory.badge.writtenChapters", { count: summary?.writtenChapterCount ?? 0 })}</Badge>
                    <Badge variant="outline">{t("novel:versionHistory.badge.wordCount", { count: summary?.totalWordCount ?? 0 })}</Badge>
                    {summary?.hasOutline ? <Badge variant="secondary">{t("novel:versionHistory.badge.hasOutline")}</Badge> : null}
                    {summary?.hasStructuredOutline ? <Badge variant="secondary">{t("novel:versionHistory.badge.hasStructuredOutline")}</Badge> : null}
                  </div>

                  <div className="text-sm leading-6 text-muted-foreground">
                    {summary
                      ? t("novel:versionHistory.summaryWithChapter", { chapterLabel: summary.latestChapterLabel })
                      : t("novel:versionHistory.summaryUnparseable")}
                  </div>

                  {summary?.recentChapterTitles.length ? (
                    <div className="text-xs text-muted-foreground">
                      {t("novel:versionHistory.recentChapters", { titles: summary.recentChapterTitles.join(" / ") })}
                    </div>
                  ) : null}
                </div>

                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    const confirmed = window.confirm(t("novel:versionHistory.restoreConfirm"));
                    if (confirmed) {
                      restoreMutation.mutate(snapshot.id);
                    }
                  }}
                  disabled={restoreMutation.isPending}
                >
                  {isRestoringCurrent ? t("novel:versionHistory.restoring") : t("novel:versionHistory.restoreButton")}
                </Button>
              </div>
            </div>
          );
        })}
        {snapshots.length === 0 ? (
          <div className="rounded-2xl border border-dashed p-6 text-sm text-muted-foreground">
            {t("novel:versionHistory.empty")}
          </div>
        ) : null}
      </div>
    </div>
  );
}
