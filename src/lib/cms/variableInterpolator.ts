function getNestedValue(obj: any, path: string): any {
  if (!obj || !path) return '';
  return path.split('.').reduce((acc, part) => (acc && acc[part] !== undefined ? acc[part] : ''), obj);
}

export function interpolateTemplateVariables(template: string, dataContext: Record<string, any>): string {
  if (!template) return '';

  let output = template;

  // 1. Process Loops: {{#each arrayPath}} ... {{/each}}
  const loopRegex = /\{\{#each\s+([\w\.]+)\}\}([\s\S]*?)\{\{\/each\}\}/g;
  output = output.replace(loopRegex, (_, arrayPath, innerBlock) => {
    const list = getNestedValue(dataContext, arrayPath);
    if (!Array.isArray(list) || list.length === 0) return '';

    return list
      .map((item) => {
        let block = innerBlock;
        if (typeof item === 'object' && item !== null) {
          // Replace {{this.fieldName}}
          block = block.replace(/\{\{this\.([\w\.]+)\}\}/g, (__: string, prop: string) => {
            return getNestedValue(item, prop) ?? '';
          });
        }
        // Replace {{this}} for primitive items
        block = block.replace(/\{\{this\}\}/g, String(item ?? ''));
        return block;
      })
      .join('');
  });

  // 2. Process Single Variables: {{variable.path}}
  const varRegex = /\{\{([\w\.]+)\}\}/g;
  output = output.replace(varRegex, (match, path) => {
    if (path === 'this') return match; // Handled in loops
    const val = getNestedValue(dataContext, path);
    return val !== undefined && val !== null ? String(val) : '';
  });

  return output;
}
