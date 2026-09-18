import { SectionDefinition } from './sdk/types';
import { validateSectionDefinition, ValidationResult } from './sdk/sectionValidator';

export interface SectionPackage {
  schemaVersion: '1.0.0';
  exportedAt: string;
  definition: SectionDefinition;
}

/**
 * Serializes a SectionDefinition into an exportable declarative JSON package.
 */
export function exportSectionPackage(definition: SectionDefinition): string {
  const pkg: SectionPackage = {
    schemaVersion: '1.0.0',
    exportedAt: new Date().toISOString(),
    definition,
  };
  return JSON.stringify(pkg, null, 2);
}

/**
 * Parses and strictly validates an imported section package string.
 * Completely rejects any executable code, scripts, or non-declarative payloads.
 */
export function importSectionPackage(jsonString: string): {
  success: boolean;
  definition?: SectionDefinition;
  errors: string[];
} {
  try {
    const raw = JSON.parse(jsonString);

    if (!raw || typeof raw !== 'object') {
      return { success: false, errors: ['Invalid package payload. Must be a JSON object.'] };
    }

    const definition: SectionDefinition = raw.definition || raw;

    // Validate using Section SDK validator
    const validation: ValidationResult = validateSectionDefinition(definition);
    if (!validation.valid) {
      return { success: false, errors: validation.errors };
    }

    // Explicitly mark source as imported
    definition.metadata.source = 'imported';

    return {
      success: true,
      definition,
      errors: [],
    };
  } catch (err: any) {
    return {
      success: false,
      errors: [`JSON parse error: ${err.message}`],
    };
  }
}
