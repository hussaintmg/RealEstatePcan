import { SectionDefinition } from '../sdk/types';
import { validateSectionDefinition, ValidationResult } from '../sdk/sectionValidator';

/**
 * Validates raw AI JSON output before registration or preview sandbox display.
 */
export function validateAiSectionOutput(rawJson: string | object): {
  valid: boolean;
  definition?: SectionDefinition;
  errors: string[];
} {
  let parsed: any;

  if (typeof rawJson === 'string') {
    try {
      // Strip markdown code block wrappers if present (e.g. ```json ... ```)
      const cleanJson = rawJson.replace(/^```json\s*/, '').replace(/\s*```$/, '').trim();
      parsed = JSON.parse(cleanJson);
    } catch (err: any) {
      return {
        valid: false,
        errors: [`Invalid JSON string format: ${err.message}`],
      };
    }
  } else {
    parsed = rawJson;
  }

  if (!parsed || typeof parsed !== 'object') {
    return { valid: false, errors: ['AI output must be a valid JSON object.'] };
  }

  // Ensure source is tagged as 'ai'
  if (parsed.metadata) {
    parsed.metadata.source = 'ai';
  }

  const validation: ValidationResult = validateSectionDefinition(parsed);

  return {
    valid: validation.valid,
    definition: validation.valid ? (parsed as SectionDefinition) : undefined,
    errors: validation.errors,
  };
}
