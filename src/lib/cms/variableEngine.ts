import { ICmsSectionCondition } from '../../models/CmsPage';

export function getNestedPathValue(obj: any, path: string): any {
  if (!obj || !path) return undefined;
  return path.split('.').reduce((acc, part) => (acc && acc[part] !== undefined ? acc[part] : undefined), obj);
}

export function evaluateCmsCondition(condition: ICmsSectionCondition, dataContext: Record<string, any>): boolean {
  if (!condition || !condition.field) return true;
  const fieldValue = getNestedPathValue(dataContext, condition.field);

  switch (condition.operator) {
    case 'equals':
      return String(fieldValue) === String(condition.value);
    case 'not_equals':
      return String(fieldValue) !== String(condition.value);
    case 'greater':
      return Number(fieldValue) > Number(condition.value);
    case 'less':
      return Number(fieldValue) < Number(condition.value);
    case 'contains':
      if (Array.isArray(fieldValue)) {
        return fieldValue.includes(condition.value);
      }
      return String(fieldValue || '').toLowerCase().includes(String(condition.value).toLowerCase());
    case 'exists':
      return fieldValue !== undefined && fieldValue !== null && fieldValue !== '';
    case 'true':
      return Boolean(fieldValue) === true;
    case 'false':
      return Boolean(fieldValue) === false;
    default:
      return true;
  }
}

export function evaluateAllConditions(conditions: ICmsSectionCondition[] | undefined, dataContext: Record<string, any>): boolean {
  if (!conditions || conditions.length === 0) return true;
  return conditions.every((cond) => evaluateCmsCondition(cond, dataContext));
}

export function interpolateTextWithVariables(template: string, dataContext: Record<string, any>): string {
  if (!template || typeof template !== 'string') return '';

  let output = template;

  // 1. Array Repeater Loop: {{#each arrayPath}} ... {{/each}}
  const loopRegex = /\{\{#each\s+([\w\.]+)\}\}([\s\S]*?)\{\{\/each\}\}/g;
  output = output.replace(loopRegex, (_, arrayPath, innerBlock) => {
    const list = getNestedPathValue(dataContext, arrayPath);
    if (!Array.isArray(list) || list.length === 0) return '';

    return list
      .map((item, index) => {
        let block = innerBlock;
        if (typeof item === 'object' && item !== null) {
          block = block.replace(/\{\{this\.([\w\.]+)\}\}/g, (__: string, prop: string) => {
            const val = getNestedPathValue(item, prop);
            return val !== undefined && val !== null ? String(val) : '';
          });
        }
        block = block.replace(/\{\{@index\}\}/g, String(index));
        block = block.replace(/\{\{this\}\}/g, String(item ?? ''));
        return block;
      })
      .join('');
  });

  // 2. Single Variable Interpolation: {{var.path}}
  const varRegex = /\{\{([\w\.]+)\}\}/g;
  output = output.replace(varRegex, (match, path) => {
    if (path === 'this' || path === '@index') return match;
    const val = getNestedPathValue(dataContext, path);
    return val !== undefined && val !== null ? String(val) : '';
  });

  return output;
}

export function resolveDeepObjectVariables(obj: any, dataContext: Record<string, any>): any {
  if (!obj) return obj;
  if (typeof obj === 'string') {
    return interpolateTextWithVariables(obj, dataContext);
  }
  if (Array.isArray(obj)) {
    return obj.map((item) => resolveDeepObjectVariables(item, dataContext));
  }
  if (typeof obj === 'object') {
    const result: Record<string, any> = {};
    for (const [key, value] of Object.entries(obj)) {
      result[key] = resolveDeepObjectVariables(value, dataContext);
    }
    return result;
  }
  return obj;
}

export function validateVariableCompatibility(
  targetType: 'text' | 'number' | 'image' | 'array' | 'boolean',
  variableType: string
): boolean {
  if (targetType === 'text') {
    return ['string', 'number', 'date', 'url'].includes(variableType);
  }
  if (targetType === 'number') {
    return variableType === 'number';
  }
  if (targetType === 'image') {
    return ['image', 'url'].includes(variableType);
  }
  if (targetType === 'array') {
    return variableType === 'array';
  }
  if (targetType === 'boolean') {
    return variableType === 'boolean';
  }
  return true;
}
