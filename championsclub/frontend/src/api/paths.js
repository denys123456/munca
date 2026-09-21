import { query } from "./client.js";
export function subject(user, advisorId) {
  return advisorId || user.role === "ADVISOR"
    ? { subjectId: advisorId || user.id, subjectType: "ADVISOR" }
    : { subjectId: user.dealershipId, subjectType: "DEALERSHIP" };
}
export const owner = (user, advisorId) => {
  const scope = subject(user, advisorId);
  return { ownerId: scope.subjectId, ownerType: scope.subjectType };
};
export const dashboardPath = (user) =>
  user.role === "MANAGER"
    ? `/api/dashboard/manager/${user.id}/dealership/${user.dealershipId}`
    : `/api/dashboard/advisor/${user.id}`;
export const analyticsPath = (user, dates, advisorId) =>
  query("/api/analytics", { ...subject(user, advisorId), ...dates });
