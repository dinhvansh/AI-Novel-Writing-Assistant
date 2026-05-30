import { useMemo, useState } from "react";
import { NOVEL_LIST_PAGE_LIMIT_MAX } from "@ai-novel/shared/types/pagination";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { flattenGenreTreeOptions, getGenreTree } from "@/api/genre";
import { getNovelList } from "@/api/novel";
import { queryKeys } from "@/api/queryKeys";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import TitleFactoryPanel from "./components/TitleFactoryPanel";
import TitleLibraryPanel from "./components/TitleLibraryPanel";

export default function TitleStudioPage() {
  const { t } = useTranslation("titles");
  const [tab, setTab] = useState("factory");
  const genreTreeQuery = useQuery({
    queryKey: queryKeys.genres.all,
    queryFn: getGenreTree,
  });
  const novelListQuery = useQuery({
    queryKey: queryKeys.novels.list(1, NOVEL_LIST_PAGE_LIMIT_MAX),
    queryFn: () => getNovelList({ page: 1, limit: NOVEL_LIST_PAGE_LIMIT_MAX }),
  });

  const genreTree = genreTreeQuery.data?.data ?? [];
  const genreOptions = useMemo(() => flattenGenreTreeOptions(genreTree), [genreTree]);
  const novels = novelListQuery.data?.data?.items ?? [];

  return (
    <div className="mx-auto max-w-6xl space-y-4">
      <Card>
        <CardHeader className="space-y-2">
          <CardTitle>{t("studio.title")}</CardTitle>
          <CardDescription>
            {t("studio.description")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={tab} onValueChange={setTab} className="space-y-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="factory">{t("studio.tabs.factory")}</TabsTrigger>
              <TabsTrigger value="library">{t("studio.tabs.library")}</TabsTrigger>
            </TabsList>

            <TabsContent value="factory">
              <TitleFactoryPanel genreTree={genreTree} novels={novels} />
            </TabsContent>

            <TabsContent value="library">
              <TitleLibraryPanel genreOptions={genreOptions} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
