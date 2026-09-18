import { SectionDefinition, PrimitiveNode, PrimitiveType } from './types';

const ALLOWED_PRIMITIVES: Set<string> = new Set([
  'Container',
  'Heading',
  'Text',
  'Image',
  'Video',
  'Button',
  'Icon',
  'Badge',
  'Card',
  'Grid',
  'Stack',
  'Columns',
  'Spacer',
  'Divider',
  'Form',
  'Repeater',
  'PlayCanvasViewer',
  'Tabs',
  'Accordion',
  'Carousel',
]);

const ALLOWED_ANIMATIONS: Set<string> = new Set([
  'none',
  'fade',
  'slide_up',
  'scale',
  'reveal',
]);

const ALLOWED_HOVER: Set<string> = new Set([
  'none',
  'lift',
  'scale',
  'glow',
]);

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Validates a SectionDefinition to ensure it complies strictly with the Section SDK,
 * contains only declarative primitives, contains no executable script injections,
 * and maintains structural integrity.
 */
export function validateSectionDefinition(def: Partial<SectionDefinition>): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // 1. Metadata Validation
  if (!def.key || typeof def.key !== 'string') {
    errors.push('Section key is required and must be a non-empty string.');
  } else if (!/^[a-z0-9-_]+$/.test(def.key)) {
    errors.push(`Section key "${def.key}" must only contain lowercase alphanumeric characters, dashes, or underscores.`);
  }

  if (!def.version || typeof def.version !== 'string') {
    errors.push('Section version is required (e.g. "1.0.0").');
  }

  if (!def.metadata?.name) {
    errors.push('Section metadata.name is required.');
  }

  if (!def.metadata?.category) {
    errors.push('Section metadata.category is required.');
  }

  // 2. Props Schema Validation
  if (def.propsSchema && !Array.isArray(def.propsSchema)) {
    errors.push('Section propsSchema must be an array of PropFieldDefinitions.');
  }

  // 3. Layout Tree Validation
  if (!def.layoutTree || typeof def.layoutTree !== 'object') {
    errors.push('Section layoutTree root node is required.');
  } else {
    validatePrimitiveNode(def.layoutTree, errors, warnings, new Set());
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Recursively validates a primitive AST node.
 */
function validatePrimitiveNode(
  node: PrimitiveNode,
  errors: string[],
  warnings: string[],
  visitedIds: Set<string>,
  depth: number = 0
) {
  if (depth > 20) {
    errors.push(`Maximum nesting depth (20) exceeded at node ${node.id || 'unknown'}. Possible circular structure.`);
    return;
  }

  if (!node.id) {
    errors.push(`Primitive node of type "${node.type}" is missing a stable unique ID.`);
  } else if (visitedIds.has(node.id)) {
    errors.push(`Duplicate primitive node ID detected: "${node.id}". All node IDs must be unique.`);
  } else {
    visitedIds.add(node.id);
  }

  if (!ALLOWED_PRIMITIVES.has(node.type)) {
    errors.push(`Unsupported primitive type: "${node.type}". Must be an approved primitive.`);
  }

  // Check animation key
  if (node.animation?.type && !ALLOWED_ANIMATIONS.has(node.animation.type)) {
    warnings.push(`Unknown animation type: "${node.animation.type}" on node ${node.id}.`);
  }

  if (node.animation?.hoverEffect && !ALLOWED_HOVER.has(node.animation.hoverEffect)) {
    warnings.push(`Unknown hoverEffect: "${node.animation.hoverEffect}" on node ${node.id}.`);
  }

  // Check for suspicious script injection strings
  const stringified = JSON.stringify(node);
  if (
    stringified.includes('<script') ||
    stringified.includes('javascript:') ||
    stringified.includes('eval(') ||
    stringified.includes('__proto__') ||
    stringified.includes('constructor.prototype')
  ) {
    errors.push(`Security violation: node ${node.id} contains unsafe or executable syntax patterns.`);
  }

  // Recurse children
  if (node.children && Array.isArray(node.children)) {
    for (const child of node.children) {
      validatePrimitiveNode(child, errors, warnings, visitedIds, depth + 1);
    }
  }
}
