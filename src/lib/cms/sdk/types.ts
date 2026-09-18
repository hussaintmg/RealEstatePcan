/**
 * Formal Section SDK Type Definitions
 * Every section (System, Developer, Owner Custom, AI-Generated, Imported) conforms to this contract.
 */

export type SectionSource =
  | 'system'
  | 'developer'
  | 'owner'
  | 'ai'
  | 'imported'
  | 'marketplace';

export type SectionCategory =
  | 'Hero'
  | 'Property Search'
  | 'Property Listings'
  | 'Property Detail'
  | 'Featured Property'
  | '3D'
  | 'Gallery'
  | 'Video'
  | 'Scroll Story'
  | 'Stats'
  | 'Features'
  | 'Amenities'
  | 'Neighborhood'
  | 'Floor Plans'
  | 'Agents'
  | 'Testimonials'
  | 'Logos'
  | 'Partners'
  | 'CTA'
  | 'Contact'
  | 'Forms'
  | 'FAQ'
  | 'Team'
  | 'Timeline'
  | 'Blog'
  | 'Pricing'
  | 'Comparison'
  | 'Footer'
  | 'Custom';

export type PropFieldType =
  | 'string'
  | 'richText'
  | 'number'
  | 'boolean'
  | 'select'
  | 'color'
  | 'media'
  | 'icon'
  | 'repeater'
  | 'object'
  | 'variable';

export interface PropFieldDefinition {
  key: string;
  label: string;
  type: PropFieldType;
  description?: string;
  defaultValue?: any;
  required?: boolean;
  options?: Array<{ label: string; value: string | number }>;
  supportsVariables?: boolean;
  allowedVariableTypes?: string[];
  placeholder?: string;
  min?: number;
  max?: number;
  step?: number;
}

export interface SectionSlotDefinition {
  name: string;
  label: string;
  allowedTypes?: string[];
  minChildren?: number;
  maxChildren?: number;
  required?: boolean;
}

export type PrimitiveType =
  | 'Container'
  | 'Heading'
  | 'Text'
  | 'Image'
  | 'Video'
  | 'Button'
  | 'Icon'
  | 'Badge'
  | 'Card'
  | 'Grid'
  | 'Stack'
  | 'Columns'
  | 'Spacer'
  | 'Divider'
  | 'Form'
  | 'Repeater'
  | 'PlayCanvasViewer'
  | 'Tabs'
  | 'Accordion'
  | 'Carousel';

export interface PrimitiveNode {
  id: string;
  type: PrimitiveType;
  props: Record<string, any>;
  children?: PrimitiveNode[];
  slot?: string;
  styles?: {
    padding?: string;
    margin?: string;
    backgroundColor?: string;
    textColor?: string;
    borderRadius?: string;
    border?: string;
    boxShadow?: string;
    textAlign?: 'left' | 'center' | 'right' | 'justify';
    gap?: string;
    maxWidth?: string;
    width?: string;
    display?: string;
    gridCols?: number;
    customClasses?: string;
  };
  responsive?: {
    desktop?: Record<string, any>;
    tablet?: Record<string, any>;
    mobile?: Record<string, any>;
  };
  conditions?: ConditionRule[];
  animation?: {
    type?: 'none' | 'fade' | 'slide_up' | 'scale' | 'reveal';
    duration?: number;
    delay?: number;
    hoverEffect?: 'none' | 'lift' | 'scale' | 'glow';
  };
}

export type ConditionOperator =
  | 'equals'
  | 'not_equals'
  | 'contains'
  | 'not_contains'
  | 'exists'
  | 'not_exists'
  | 'greater_than'
  | 'greater_or_equal'
  | 'less_than'
  | 'less_or_equal'
  | 'in'
  | 'not_in'
  | 'starts_with'
  | 'ends_with';

export interface ConditionRule {
  field: string;
  operator: ConditionOperator;
  value: any;
  logic?: 'AND' | 'OR';
}

export interface ActionConfig {
  type: 'navigate' | 'modal' | 'scroll_to' | 'phone' | 'email' | 'whatsapp' | 'form_submit';
  target?: string;
  payload?: Record<string, any>;
}

export interface SectionMetadata {
  key: string;
  version: string;
  name: string;
  description?: string;
  category: SectionCategory;
  tags?: string[];
  thumbnail?: string;
  author: string;
  source: SectionSource;
  compatibility?: string;
}

export interface SectionDefinition {
  key: string;
  version: string;
  metadata: SectionMetadata;
  propsSchema: PropFieldDefinition[];
  defaultProps: Record<string, any>;
  slots?: SectionSlotDefinition[];
  layoutTree: PrimitiveNode; // Root primitive node
  animations?: Record<string, any>;
  actions?: Record<string, ActionConfig>;
  isPublished?: boolean;
}

export interface SectionInstance {
  id: string; // Stable unique instance ID
  sectionKey: string;
  sectionVersion: string;
  title?: string;
  order: number;
  isVisible: boolean;
  isLocked?: boolean;
  props: Record<string, any>;
  bindings?: Record<string, string>; // field -> variable path
  conditions?: ConditionRule[];
  styles?: Record<string, any>;
  responsive?: {
    desktop?: Record<string, any>;
    tablet?: Record<string, any>;
    mobile?: Record<string, any>;
  };
  animation?: {
    type?: 'none' | 'fade' | 'slide_up' | 'scale' | 'reveal';
    duration?: number;
    delay?: number;
    hoverEffect?: 'none' | 'lift' | 'scale' | 'glow';
  };
  anchorId?: string;
  globalSectionId?: string;
  customTreeOverride?: PrimitiveNode; // Optional custom tree for custom studio sections
}

export interface PageSchema {
  version: number;
  pageId: string;
  title: string;
  slug: string;
  status: 'draft' | 'published' | 'disabled' | 'archived';
  isSystemPage?: boolean;
  sections: SectionInstance[];
  themeId?: string;
  seo?: {
    metaTitle?: string;
    metaDescription?: string;
    ogTitle?: string;
    ogDescription?: string;
    ogImage?: string;
    canonicalUrl?: string;
    noIndex?: boolean;
    structuredData?: Record<string, any>;
  };
  customVariables?: Array<{
    key: string;
    label: string;
    type: string;
    value: any;
  }>;
}
