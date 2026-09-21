export const number = (value, digits = 0) =>
  value === null || value === undefined || !Number.isFinite(Number(value))
    ? "—"
    : new Intl.NumberFormat("en-GB", { maximumFractionDigits: digits }).format(
        Number(value),
      );
export const money = (value, currency = "EUR") =>
  value === null || value === undefined || !Number.isFinite(Number(value))
    ? "—"
    : new Intl.NumberFormat("en-GB", {
        style: "currency",
        currency,
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      }).format(Number(value));
export const percent = (value) =>
  value === null || value === undefined ? "—" : `${number(value, 1)}%`;
export const label = (value) =>
  value
    ? String(value)
        .toLowerCase()
        .split("_")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ")
    : "—";
export const fullName = (user) =>
  user ? `${user.firstName} ${user.lastName}` : "—";
export const initials = (user) =>
  user
    ? `${user.firstName?.charAt(0) ?? ""}${user.lastName?.charAt(0) ?? ""}`
    : "CC";
export const date = (value) => {
  if (!value) return "—";
  const parsed = new Date(value.length === 10 ? `${value}T12:00:00` : value);
  return Number.isNaN(parsed.getTime())
    ? "—"
    : new Intl.DateTimeFormat("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      }).format(parsed);
};
export const shortDate = (value) =>
  value
    ? new Intl.DateTimeFormat("en-GB", {
        day: "numeric",
        month: "short",
      }).format(new Date(`${value.slice(0, 10)}T12:00:00`))
    : "—";
export const localDate = (value = new Date()) =>
  `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, "0")}-${String(value.getDate()).padStart(2, "0")}`;
export const currentPeriod = (end = localDate()) => ({
  start: `${end.slice(0, 7)}-01`,
  end,
});
export function downloadCsv(filename, rows) {
  const cell = (value) => {
    let text = value === null || value === undefined ? "" : String(value);
    if (["=", "+", "-", "@", "\t", "\r"].includes(text.charAt(0)))
      text = `'${text}`;
    return `"${text.split('"').join('""')}"`;
  };
  const url = URL.createObjectURL(
    new Blob(
      ["\uFEFF", rows.map((row) => row.map(cell).join(",")).join("\r\n")],
      { type: "text/csv;charset=utf-8" },
    ),
  );
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}
