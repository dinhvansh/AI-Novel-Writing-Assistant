import { useTranslation } from "react-i18next";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function AstrologyPage() {
  const { t } = useTranslation("common");
  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("astrology.title")}</CardTitle>
        <CardDescription>{t("astrology.description")}</CardDescription>
      </CardHeader>
      <CardContent>{t("astrology.content")}</CardContent>
    </Card>
  );
}
