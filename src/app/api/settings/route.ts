import { db } from "@/lib/db";
import { errorResponse, fail, ok, safeJson } from "@/lib/api";
import { ensureSeeded } from "@/lib/seed";
import type { SettingsDto } from "@/lib/types";

const SETTING_KEYS = ["currency", "dateFormat", "pushNotifications", "emailAlerts", "budgetWarnings", "monthlyReports"] as const;
type SettingKey = (typeof SETTING_KEYS)[number];

const DEFAULTS: Record<SettingKey, string> = {
  currency: "USD",
  dateFormat: "MM/dd/yyyy",
  pushNotifications: "false",
  emailAlerts: "false",
  budgetWarnings: "true",
  monthlyReports: "false",
};

function toDto(rows: { key: string; value: string }[]): SettingsDto {
  const map = new Map(rows.map((row) => [row.key, row.value]));
  return {
    currency: map.get("currency") ?? DEFAULTS.currency,
    dateFormat: map.get("dateFormat") ?? DEFAULTS.dateFormat,
    pushNotifications: (map.get("pushNotifications") ?? DEFAULTS.pushNotifications) === "true",
    emailAlerts: (map.get("emailAlerts") ?? DEFAULTS.emailAlerts) === "true",
    budgetWarnings: (map.get("budgetWarnings") ?? DEFAULTS.budgetWarnings) === "true",
    monthlyReports: (map.get("monthlyReports") ?? DEFAULTS.monthlyReports) === "true",
  };
}

export async function GET() {
  try {
    await ensureSeeded();
    const rows = await db.setting.findMany();
    return ok(toDto(rows));
  } catch (error) {
    return errorResponse(error);
  }
}

interface SettingsPayload {
  currency?: unknown;
  dateFormat?: unknown;
  pushNotifications?: unknown;
  emailAlerts?: unknown;
  budgetWarnings?: unknown;
  monthlyReports?: unknown;
}

export async function PUT(request: Request) {
  try {
    const body = await safeJson<SettingsPayload>(request);
    if (!body) return fail("Invalid JSON body", 400);
    const updates: { key: SettingKey; value: string }[] = [];
    if (typeof body.currency === "string" && body.currency.length === 3) {
      updates.push({ key: "currency", value: body.currency.toUpperCase() });
    }
    if (typeof body.dateFormat === "string" && body.dateFormat.length <= 20) {
      updates.push({ key: "dateFormat", value: body.dateFormat });
    }
    for (const key of ["pushNotifications", "emailAlerts", "budgetWarnings", "monthlyReports"] as const) {
      const value = body[key];
      if (typeof value === "boolean") updates.push({ key, value: String(value) });
    }
    for (const update of updates) {
      const existing = await db.setting.findUnique({ where: { key: update.key } });
      if (existing) {
        await db.setting.update({ where: { key: update.key }, data: { value: update.value } });
      } else {
        await db.setting.create({ data: { key: update.key, value: update.value } });
      }
    }
    const rows = await db.setting.findMany();
    return ok(toDto(rows));
  } catch (error) {
    return errorResponse(error);
  }
}
