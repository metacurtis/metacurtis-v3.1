export const TELEMETRY = {
  TRACE_MAX: 500,
  EVENTLOG_MAX: 500,
  INCIDENT_MAX: 200,
};

export function ringPush(array, item, max) {
  if (!Array.isArray(array)) return array;
  array.push(item);
  if (max > 0 && array.length > max) {
    array.splice(0, array.length - max);
  }
  return array;
}
