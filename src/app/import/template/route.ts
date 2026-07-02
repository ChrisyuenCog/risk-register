import { buildTemplateWorkbook } from "@/server/import-core";

export const dynamic = "force-dynamic";

export function GET() {
  return new Response(new Uint8Array(buildTemplateWorkbook()), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": 'attachment; filename="risk-register-import-template.xlsx"',
    },
  });
}
