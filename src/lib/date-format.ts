/**
 * Settings-aware date rendering. The source app offers five date formats; the
 * choice persists in settings and every date surface honors it.
 */

export type DateFormatId = "MM/dd/yyyy" | "dd/MM/yyyy" | "yyyy-MM-dd" | "dd MMM yyyy" | "MMM dd, yyyy";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const pad = (value: number): string => String(value).padStart(2, "0");

export function formatDate(iso: string, format: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const monthName = MONTHS[date.getMonth()] ?? "";

  switch (format) {
    case "dd/MM/yyyy":
      return `${day}/${month}/${year}`;
    case "yyyy-MM-dd":
      return `${year}-${month}-${day}`;
    case "dd MMM yyyy":
      return `${date.getDate()} ${monthName} ${year}`;
    case "MMM dd, yyyy":
      return `${monthName} ${date.getDate()}, ${year}`;
    default:
      return `${month}/${day}/${year}`;
  }
}
