import { SectionCategory } from '../sdk/types';

export interface AiSectionPromptRequest {
  category: SectionCategory;
  purpose: string;
  themeContext?: string;
  targetAudience?: string;
}

/**
 * Generates an authoritative system prompt that guides AI models to output
 * strictly compliant Section SDK declarative definitions.
 */
export function generateAiSectionPrompt(request: AiSectionPromptRequest): {
  systemPrompt: string;
  userPrompt: string;
} {
  const systemPrompt = `
You are an expert Luxury Real Estate UI/UX Architect and Core Engine Engineer.
Your task is to generate a declarative website section definition complying with Section SDK Version 1.0.0.

CRITICAL ARCHITECTURAL CONSTRAINTS:
1. Do NOT generate JSX, React components, HTML strings, or arbitrary JavaScript.
2. Do NOT use "eval()", "<script>", "onclick", or inline executable code.
3. Output MUST be valid JSON adhering strictly to the Section SDK definition contract.
4. All visual elements MUST be composed exclusively from the approved low-level primitive nodes:
   - Layout: Container, Grid, Stack, Columns, Spacer, Divider
   - Content: Heading, Text, Image, Video, Button, Icon, Badge, Card
   - Interactive: Form, Repeater, PlayCanvasViewer, Tabs, Accordion, Carousel
5. All primitive nodes MUST have unique, stable string IDs (e.g. "node-hero-heading-1").
6. Heading primitives must declare semantic levels (h1, h2, h3).
7. Button primitives must specify valid ActionConfig objects (e.g. { type: "navigate", target: "/properties" }).
8. Variable bindings inside text fields must use safe token notation like "{{props.heading}}" or dynamic tokens like "{{property.price}}".
9. Animation types must be one of: "none", "fade", "slide_up", "scale", "reveal".
10. Hover effects must be one of: "none", "lift", "scale", "glow".

APPROVED MODEL VARIABLE TOKENS:
- property.title, property.price, property.location.city, property.location.address
- property.specs.bedrooms, property.specs.bathrooms, property.specs.areaSqFt
- property.amenities (array)
- brand.name, brand.logoUrl, site.contactPhone, site.contactEmail
`;

  const userPrompt = `
Generate a new high-end architectural section definition with the following specifications:
- Category: "${request.category}"
- Purpose / Goal: "${request.purpose}"
${request.themeContext ? `- Aesthetic / Theme Context: "${request.themeContext}"` : ''}
${request.targetAudience ? `- Target Audience: "${request.targetAudience}"` : ''}

Output ONLY the raw JSON object conforming to the SectionDefinition schema.
`;

  return { systemPrompt, userPrompt };
}
