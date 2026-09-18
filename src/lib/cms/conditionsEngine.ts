import { ConditionRule, ConditionOperator } from './sdk/types';

/**
 * Resolves a nested dot-delimited property path from an object context safely.
 */
export function resolvePath(obj: any, path: string): any {
  if (!obj || !path) return undefined;
  const cleanPath = path.replace(/[{}]/g, '').trim();
  const segments = cleanPath.split('.');
  let curr = obj;

  for (const seg of segments) {
    if (curr === null || curr === undefined) return undefined;
    curr = curr[seg];
  }

  return curr;
}

/**
 * Evaluates a single condition operator rule against resolved value and comparison target.
 */
export function evaluateRule(resolvedVal: any, operator: ConditionOperator, targetVal: any): boolean {
  switch (operator) {
    case 'equals':
      return String(resolvedVal ?? '').toLowerCase() === String(targetVal ?? '').toLowerCase();

    case 'not_equals':
      return String(resolvedVal ?? '').toLowerCase() !== String(targetVal ?? '').toLowerCase();

    case 'contains':
      if (Array.isArray(resolvedVal)) {
        return resolvedVal.some((item) =>
          String(item).toLowerCase().includes(String(targetVal).toLowerCase())
        );
      }
      return String(resolvedVal ?? '').toLowerCase().includes(String(targetVal ?? '').toLowerCase());

    case 'not_contains':
      if (Array.isArray(resolvedVal)) {
        return !resolvedVal.some((item) =>
          String(item).toLowerCase().includes(String(targetVal).toLowerCase())
        );
      }
      return !String(resolvedVal ?? '').toLowerCase().includes(String(targetVal ?? '').toLowerCase());

    case 'exists':
      return resolvedVal !== undefined && resolvedVal !== null && resolvedVal !== '';

    case 'not_exists':
      return resolvedVal === undefined || resolvedVal === null || resolvedVal === '';

    case 'greater_than':
      return Number(resolvedVal) > Number(targetVal);

    case 'greater_or_equal':
      return Number(resolvedVal) >= Number(targetVal);

    case 'less_than':
      return Number(resolvedVal) < Number(targetVal);

    case 'less_or_equal':
      return Number(resolvedVal) <= Number(targetVal);

    case 'in':
      if (Array.isArray(targetVal)) {
        return targetVal.includes(resolvedVal);
      }
      if (typeof targetVal === 'string') {
        const parts = targetVal.split(',').map((s) => s.trim().toLowerCase());
        return parts.includes(String(resolvedVal).toLowerCase());
      }
      return false;

    case 'not_in':
      if (Array.isArray(targetVal)) {
        return !targetVal.includes(resolvedVal);
      }
      if (typeof targetVal === 'string') {
        const parts = targetVal.split(',').map((s) => s.trim().toLowerCase());
        return !parts.includes(String(resolvedVal).toLowerCase());
      }
      return true;

    case 'starts_with':
      return String(resolvedVal ?? '').toLowerCase().startsWith(String(targetVal ?? '').toLowerCase());

    case 'ends_with':
      return String(resolvedVal ?? '').toLowerCase().endsWith(String(targetVal ?? '').toLowerCase());

    default:
      return true;
  }
}

/**
 * Evaluates an array of condition rules with AND / OR logic groups.
 */
export function evaluateConditions(
  conditions?: ConditionRule[],
  context: Record<string, any> = {}
): boolean {
  if (!conditions || conditions.length === 0) {
    return true;
  }

  // Split into OR groups; all conditions within each OR group must pass (AND)
  let currentGroupPassed = true;
  let overallPassed = false;

  for (let i = 0; i < conditions.length; i++) {
    const rule = conditions[i];
    const resolvedVal = resolvePath(context, rule.field);
    const passes = evaluateRule(resolvedVal, rule.operator, rule.value);

    if (rule.logic === 'OR') {
      if (currentGroupPassed) {
        overallPassed = true;
      }
      currentGroupPassed = passes;
    } else {
      // Default: AND logic
      currentGroupPassed = currentGroupPassed && passes;
    }
  }

  return overallPassed || currentGroupPassed;
}
