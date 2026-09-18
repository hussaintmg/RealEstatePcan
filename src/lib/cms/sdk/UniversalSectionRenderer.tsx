'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { motion } from 'framer-motion';
import { SectionInstance, SectionDefinition, ActionConfig } from './types';
import { PrimitiveDispatcher } from './primitives';
import { evaluateConditions } from '../conditionsEngine';
import { AlertTriangle } from 'lucide-react';

interface UniversalSectionRendererProps {
  section: SectionInstance;
  definition?: SectionDefinition;
  dataContext?: Record<string, any>;
  onAction?: (action: ActionConfig) => void;
  isEditing?: boolean;
}

interface SectionErrorBoundaryProps {
  sectionId: string;
  sectionKey: string;
  children: ReactNode;
}

interface SectionErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

export class SectionErrorBoundary extends Component<
  SectionErrorBoundaryProps,
  SectionErrorBoundaryState
> {
  constructor(props: SectionErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): SectionErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error(`Error in section [${this.props.sectionKey}] (ID: ${this.props.sectionId}):`, error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="my-4 p-6 border border-amber-500/30 bg-amber-500/10 rounded-2xl text-center space-y-2 max-w-xl mx-auto text-xs text-amber-300">
          <div className="flex items-center justify-center space-x-2 font-bold">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            <span>Section Temporarily Unavailable</span>
          </div>
          <p className="text-[11px] text-slate-400">
            Section key: <span className="font-mono text-slate-300">{this.props.sectionKey}</span> encountered a display error and was safely isolated.
          </p>
        </div>
      );
    }
    return this.props.children;
  }
}

export const UniversalSectionRenderer: React.FC<UniversalSectionRendererProps> = ({
  section,
  definition,
  dataContext = {},
  onAction,
  isEditing = false,
}) => {
  // 1. Visibility Check
  if (section.isVisible === false && !isEditing) {
    return null;
  }

  // 2. Evaluate Conditional Visibility Rules
  if (section.conditions && section.conditions.length > 0) {
    const isVisible = evaluateConditions(section.conditions, dataContext);
    if (!isVisible && !isEditing) {
      return null;
    }
  }

  // 3. Resolve Root Layout Tree (Custom Tree Override > Definition Layout Tree)
  const layoutTree = section.customTreeOverride || definition?.layoutTree;
  if (!layoutTree) {
    return null;
  }

  // 4. Merge Section Props into Context
  const mergedContext = {
    ...dataContext,
    props: {
      ...(definition?.defaultProps || {}),
      ...(section.props || {}),
    },
  };

  // 5. Animations & Motion Configuration
  const animation = section.animation || { type: 'fade', duration: 0.5 };
  const getMotionProps = () => {
    switch (animation.type) {
      case 'slide_up':
        return {
          initial: { opacity: 0, y: 30 },
          whileInView: { opacity: 1, y: 0 },
          viewport: { once: true, margin: '-40px' },
          transition: { duration: animation.duration || 0.6, delay: animation.delay || 0 },
        };
      case 'scale':
        return {
          initial: { opacity: 0, scale: 0.95 },
          whileInView: { opacity: 1, scale: 1 },
          viewport: { once: true, margin: '-40px' },
          transition: { duration: animation.duration || 0.5, delay: animation.delay || 0 },
        };
      case 'reveal':
        return {
          initial: { opacity: 0, filter: 'blur(8px)' },
          whileInView: { opacity: 1, filter: 'blur(0px)' },
          viewport: { once: true },
          transition: { duration: animation.duration || 0.7, delay: animation.delay || 0 },
        };
      case 'none':
        return {};
      default: // 'fade'
        return {
          initial: { opacity: 0 },
          whileInView: { opacity: 1 },
          viewport: { once: true },
          transition: { duration: animation.duration || 0.5, delay: animation.delay || 0 },
        };
    }
  };

  const getHoverProps = () => {
    switch (animation.hoverEffect) {
      case 'lift':
        return { whileHover: { y: -4 } };
      case 'scale':
        return { whileHover: { scale: 1.01 } };
      case 'glow':
        return { whileHover: { boxShadow: '0 0 30px rgba(59, 130, 246, 0.3)' } };
      default:
        return {};
    }
  };

  const styles = section.styles || {};

  return (
    <SectionErrorBoundary sectionId={section.id} sectionKey={section.sectionKey}>
      <motion.section
        id={section.anchorId || undefined}
        {...getMotionProps()}
        {...getHoverProps()}
        style={{
          paddingTop: styles.paddingTop || styles.padding || undefined,
          paddingBottom: styles.paddingBottom || styles.padding || undefined,
          backgroundColor: styles.backgroundColor || undefined,
          borderRadius: styles.borderRadius || undefined,
        }}
        className={`w-full relative transition-all ${styles.customClasses || ''}`}
      >
        <div
          className="mx-auto px-4 sm:px-6 lg:px-8 w-full"
          style={{ maxWidth: styles.maxWidth || '1280px' }}
        >
          <PrimitiveDispatcher
            node={layoutTree}
            dataContext={mergedContext}
            onAction={onAction}
            isEditing={isEditing}
          />
        </div>
      </motion.section>
    </SectionErrorBoundary>
  );
};
