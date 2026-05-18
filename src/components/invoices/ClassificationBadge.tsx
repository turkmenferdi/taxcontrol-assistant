"use client";

import Badge from "@/components/ui/Badge";
import { classificationColor } from "@/lib/utils";
import { useLanguage } from "@/contexts/language-context";

interface Props {
  classification?: string | null;
  accountantFinalDecision?: string | null;
}

export default function ClassificationBadge({ classification, accountantFinalDecision }: Props) {
  const { t } = useLanguage();

  const labelMap: Record<string, string> = {
    deductible: t.decisionDeductible,
    non_deductible: t.decisionNonDeductible,
    partially_deductible: t.decisionPartial,
    accountant_review_required: t.decisionReview,
  };

  const effective = accountantFinalDecision ?? classification;
  if (!effective) return <Badge variant="gray">{t.classUnclassified}</Badge>;

  const color = classificationColor(effective) as "green" | "red" | "yellow" | "orange" | "blue" | "gray";
  return (
    <Badge variant={color}>
      {accountantFinalDecision ? "✓ " : ""}
      {labelMap[effective] ?? effective}
    </Badge>
  );
}
