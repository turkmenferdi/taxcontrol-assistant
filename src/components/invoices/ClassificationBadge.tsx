import Badge from "@/components/ui/Badge";
import { classificationLabel, classificationColor } from "@/lib/utils";

interface Props {
  classification?: string | null;
  accountantFinalDecision?: string | null;
}

export default function ClassificationBadge({ classification, accountantFinalDecision }: Props) {
  const effective = accountantFinalDecision ?? classification;
  if (!effective) return <Badge variant="gray">Sınıflandırılmadı</Badge>;

  const color = classificationColor(effective) as "green" | "red" | "yellow" | "orange" | "blue" | "gray";
  return (
    <Badge variant={color}>
      {accountantFinalDecision ? "✓ " : ""}
      {classificationLabel(effective)}
    </Badge>
  );
}
