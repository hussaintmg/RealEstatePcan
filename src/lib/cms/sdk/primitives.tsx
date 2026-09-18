'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { PrimitiveNode, ActionConfig } from './types';
import { DynamicCmsIcon } from '../iconResolver';
import { PlayCanvasViewer } from '../../../components/3d/PlayCanvasViewer';
import {
  Sparkles,
  ArrowRight,
  ChevronDown,
  Star,
  CheckCircle2,
  Loader2,
  ExternalLink,
  Phone,
  Mail,
  Send,
} from 'lucide-react';

interface PrimitiveRendererProps {
  node: PrimitiveNode;
  dataContext: Record<string, any>;
  onAction?: (action: ActionConfig) => void;
  isEditing?: boolean;
}

export const PrimitiveDispatcher: React.FC<PrimitiveRendererProps> = ({
  node,
  dataContext,
  onAction,
  isEditing,
}) => {
  if (!node) return null;

  switch (node.type) {
    case 'Container':
      return <ContainerPrimitive node={node} dataContext={dataContext} onAction={onAction} isEditing={isEditing} />;
    case 'Heading':
      return <HeadingPrimitive node={node} dataContext={dataContext} />;
    case 'Text':
      return <TextPrimitive node={node} dataContext={dataContext} />;
    case 'Image':
      return <ImagePrimitive node={node} dataContext={dataContext} />;
    case 'Video':
      return <VideoPrimitive node={node} dataContext={dataContext} />;
    case 'Button':
      return <ButtonPrimitive node={node} dataContext={dataContext} onAction={onAction} />;
    case 'Icon':
      return <IconPrimitive node={node} dataContext={dataContext} />;
    case 'Badge':
      return <BadgePrimitive node={node} dataContext={dataContext} />;
    case 'Card':
      return <CardPrimitive node={node} dataContext={dataContext} onAction={onAction} isEditing={isEditing} />;
    case 'Grid':
      return <GridPrimitive node={node} dataContext={dataContext} onAction={onAction} isEditing={isEditing} />;
    case 'Stack':
      return <StackPrimitive node={node} dataContext={dataContext} onAction={onAction} isEditing={isEditing} />;
    case 'Columns':
      return <ColumnsPrimitive node={node} dataContext={dataContext} onAction={onAction} isEditing={isEditing} />;
    case 'Spacer':
      return <SpacerPrimitive node={node} />;
    case 'Divider':
      return <DividerPrimitive node={node} />;
    case 'Form':
      return <FormPrimitive node={node} dataContext={dataContext} onAction={onAction} />;
    case 'Repeater':
      return <RepeaterPrimitive node={node} dataContext={dataContext} onAction={onAction} isEditing={isEditing} />;
    case 'PlayCanvasViewer':
      return <PlayCanvasPrimitive node={node} dataContext={dataContext} />;
    case 'Tabs':
      return <TabsPrimitive node={node} dataContext={dataContext} onAction={onAction} isEditing={isEditing} />;
    case 'Accordion':
      return <AccordionPrimitive node={node} dataContext={dataContext} />;
    default:
      return (
        <div className="p-4 border border-dashed border-white/20 text-xs text-slate-400 rounded-xl">
          Unknown Primitive: {node.type}
        </div>
      );
  }
};

// 1. Container Primitive
export const ContainerPrimitive: React.FC<PrimitiveRendererProps> = ({ node, dataContext, onAction, isEditing }) => {
  const styles = node.styles || {};
  return (
    <div
      style={{
        maxWidth: styles.maxWidth || undefined,
        padding: styles.padding || undefined,
        margin: styles.margin || undefined,
        backgroundColor: styles.backgroundColor || undefined,
        color: styles.textColor || undefined,
        borderRadius: styles.borderRadius || undefined,
        boxShadow: styles.boxShadow || undefined,
      }}
      className={`relative w-full ${styles.customClasses || ''}`}
    >
      {node.children?.map((child) => (
        <PrimitiveDispatcher key={child.id} node={child} dataContext={dataContext} onAction={onAction} isEditing={isEditing} />
      ))}
    </div>
  );
};

// 2. Heading Primitive
export const HeadingPrimitive: React.FC<{ node: PrimitiveNode; dataContext: Record<string, any> }> = ({ node, dataContext }) => {
  const level = node.props.level || 'h2';
  const text = interpolateValue(node.props.text || '', dataContext);
  const styles = node.styles || {};

  const Tag = (['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].includes(level) ? level : 'h2') as any;

  const defaultClasses = {
    h1: 'text-4xl sm:text-6xl font-extrabold tracking-tight leading-tight',
    h2: 'text-3xl sm:text-4xl font-bold tracking-tight',
    h3: 'text-2xl sm:text-3xl font-bold',
    h4: 'text-xl sm:text-2xl font-semibold',
    h5: 'text-lg sm:text-xl font-semibold',
    h6: 'text-base font-semibold uppercase tracking-wider',
  }[level as 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6'];

  return (
    <Tag
      style={{
        color: styles.textColor || undefined,
        textAlign: styles.textAlign || undefined,
        margin: styles.margin || undefined,
      }}
      className={`${defaultClasses} text-white ${styles.customClasses || ''}`}
    >
      {text}
    </Tag>
  );
};

// 3. Text Primitive
export const TextPrimitive: React.FC<{ node: PrimitiveNode; dataContext: Record<string, any> }> = ({ node, dataContext }) => {
  const text = interpolateValue(node.props.text || '', dataContext);
  const styles = node.styles || {};

  return (
    <p
      style={{
        color: styles.textColor || undefined,
        textAlign: styles.textAlign || undefined,
        margin: styles.margin || undefined,
      }}
      className={`text-sm sm:text-base text-slate-300 font-light leading-relaxed ${styles.customClasses || ''}`}
    >
      {text}
    </p>
  );
};

// 4. Image Primitive
export const ImagePrimitive: React.FC<{ node: PrimitiveNode; dataContext: Record<string, any> }> = ({ node, dataContext }) => {
  const src = interpolateValue(node.props.src || '', dataContext);
  const alt = interpolateValue(node.props.alt || 'Real estate visual', dataContext);
  const styles = node.styles || {};

  return (
    <div className={`overflow-hidden rounded-2xl ${styles.customClasses || ''}`}>
      <img
        src={src || 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80'}
        alt={alt}
        style={{
          width: styles.width || '100%',
          borderRadius: styles.borderRadius || undefined,
          objectFit: (node.props.objectFit as any) || 'cover',
        }}
        className="w-full h-full block transition-transform duration-500 hover:scale-105"
      />
    </div>
  );
};

// 5. Video Primitive
export const VideoPrimitive: React.FC<{ node: PrimitiveNode; dataContext: Record<string, any> }> = ({ node, dataContext }) => {
  const src = interpolateValue(node.props.src || '', dataContext);
  const poster = interpolateValue(node.props.poster || '', dataContext);

  return (
    <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-white/10 bg-black/40">
      <video
        src={src}
        poster={poster || undefined}
        autoPlay={node.props.autoplay ?? true}
        muted={node.props.muted ?? true}
        loop={node.props.loop ?? true}
        controls={node.props.controls ?? false}
        playsInline
        className="w-full h-full object-cover"
      />
    </div>
  );
};

// 6. Button Primitive
export const ButtonPrimitive: React.FC<{
  node: PrimitiveNode;
  dataContext: Record<string, any>;
  onAction?: (action: ActionConfig) => void;
}> = ({ node, dataContext, onAction }) => {
  const text = interpolateValue(node.props.text || 'Explore', dataContext);
  const variant = node.props.variant || 'primary';
  const action = node.props.action as ActionConfig;

  const handleClick = (e: React.MouseEvent) => {
    if (onAction && action) {
      onAction(action);
    }
  };

  const variantClasses = {
    primary: 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/30',
    secondary: 'bg-white/5 hover:bg-white/10 text-white border border-white/10',
    outline: 'border border-blue-500/40 text-blue-400 hover:bg-blue-600/10',
    ghost: 'text-slate-300 hover:text-white hover:bg-white/5',
  }[variant as 'primary' | 'secondary' | 'outline' | 'ghost'] || 'bg-blue-600 text-white';

  if (action?.type === 'navigate' && action.target) {
    const isExternal = action.target.startsWith('http');
    return (
      <Link
        href={action.target}
        target={isExternal ? '_blank' : undefined}
        rel={isExternal ? 'noopener noreferrer' : undefined}
        className={`inline-flex items-center space-x-2 px-6 py-3 text-xs font-semibold rounded-xl transition-all hover:scale-105 ${variantClasses}`}
      >
        <span>{text}</span>
        {node.props.icon && <DynamicCmsIcon name={node.props.icon} className="w-3.5 h-3.5" />}
        {isExternal && <ExternalLink className="w-3 h-3 text-slate-400" />}
      </Link>
    );
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`inline-flex items-center space-x-2 px-6 py-3 text-xs font-semibold rounded-xl transition-all hover:scale-105 ${variantClasses}`}
    >
      <span>{text}</span>
      {node.props.icon && <DynamicCmsIcon name={node.props.icon} className="w-3.5 h-3.5" />}
    </button>
  );
};

// 7. Icon Primitive
export const IconPrimitive: React.FC<{ node: PrimitiveNode; dataContext: Record<string, any> }> = ({ node }) => {
  const name = node.props.name || 'Sparkles';
  const size = node.props.size || 20;

  return (
    <div style={{ color: node.styles?.textColor || undefined }} className="inline-block">
      <DynamicCmsIcon name={name} className="w-5 h-5" size={size} />
    </div>
  );
};

// 8. Badge Primitive
export const BadgePrimitive: React.FC<{ node: PrimitiveNode; dataContext: Record<string, any> }> = ({ node, dataContext }) => {
  const label = interpolateValue(node.props.label || 'Exclusive', dataContext);

  return (
    <div className="inline-flex items-center space-x-1.5 px-3 py-1 bg-blue-500/10 border border-blue-500/30 rounded-full text-blue-400 text-xs font-semibold uppercase tracking-wider">
      {node.props.icon && <DynamicCmsIcon name={node.props.icon} className="w-3.5 h-3.5" />}
      <span>{label}</span>
    </div>
  );
};

// 9. Card Primitive
export const CardPrimitive: React.FC<PrimitiveRendererProps> = ({ node, dataContext, onAction, isEditing }) => {
  const styles = node.styles || {};
  return (
    <div
      style={{
        backgroundColor: styles.backgroundColor || 'rgba(16, 21, 34, 0.7)',
        borderRadius: styles.borderRadius || '1.25rem',
        padding: styles.padding || '1.5rem',
        borderColor: styles.border || 'rgba(255, 255, 255, 0.1)',
        boxShadow: styles.boxShadow || undefined,
      }}
      className={`backdrop-blur-xl border transition-all hover:border-blue-500/30 group ${styles.customClasses || ''}`}
    >
      {node.children?.map((child) => (
        <PrimitiveDispatcher key={child.id} node={child} dataContext={dataContext} onAction={onAction} isEditing={isEditing} />
      ))}
    </div>
  );
};

// 10. Grid Primitive
export const GridPrimitive: React.FC<PrimitiveRendererProps> = ({ node, dataContext, onAction, isEditing }) => {
  const cols = node.props.columns || node.styles?.gridCols || 3;
  const gap = node.props.gap || node.styles?.gap || '1.5rem';

  const colClasses = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
    6: 'grid-cols-2 md:grid-cols-3 lg:grid-cols-6',
  }[cols as 1 | 2 | 3 | 4 | 6] || 'grid-cols-1 md:grid-cols-3';

  return (
    <div style={{ gap }} className={`grid ${colClasses} w-full ${node.styles?.customClasses || ''}`}>
      {node.children?.map((child) => (
        <PrimitiveDispatcher key={child.id} node={child} dataContext={dataContext} onAction={onAction} isEditing={isEditing} />
      ))}
    </div>
  );
};

// 11. Stack Primitive
export const StackPrimitive: React.FC<PrimitiveRendererProps> = ({ node, dataContext, onAction, isEditing }) => {
  const direction = node.props.direction || 'vertical';
  const gap = node.props.gap || '1rem';
  const align = node.props.align || 'start';

  return (
    <div
      style={{ gap }}
      className={`flex ${direction === 'vertical' ? 'flex-col' : 'flex-row flex-wrap'} items-${align} ${node.styles?.customClasses || ''}`}
    >
      {node.children?.map((child) => (
        <PrimitiveDispatcher key={child.id} node={child} dataContext={dataContext} onAction={onAction} isEditing={isEditing} />
      ))}
    </div>
  );
};

// 12. Columns Primitive
export const ColumnsPrimitive: React.FC<PrimitiveRendererProps> = ({ node, dataContext, onAction, isEditing }) => {
  return (
    <div className={`grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center ${node.styles?.customClasses || ''}`}>
      {node.children?.map((child) => (
        <PrimitiveDispatcher key={child.id} node={child} dataContext={dataContext} onAction={onAction} isEditing={isEditing} />
      ))}
    </div>
  );
};

// 13. Spacer Primitive
export const SpacerPrimitive: React.FC<{ node: PrimitiveNode }> = ({ node }) => {
  const height = node.props.height || '2rem';
  return <div style={{ height }} aria-hidden="true" />;
};

// 14. Divider Primitive
export const DividerPrimitive: React.FC<{ node: PrimitiveNode }> = ({ node }) => {
  return <hr className="border-t border-white/10 my-6 w-full" />;
};

// 15. Form Primitive
export const FormPrimitive: React.FC<{
  node: PrimitiveNode;
  dataContext: Record<string, any>;
  onAction?: (action: ActionConfig) => void;
}> = ({ node, dataContext }) => {
  const actionType = node.props.actionType || 'create_lead';
  const fields = node.props.fields || [
    { name: 'fullName', label: 'Full Name', type: 'text', required: true, placeholder: 'e.g. Tariq Khan' },
    { name: 'email', label: 'Email Address', type: 'email', required: true, placeholder: 'name@domain.com' },
    { name: 'phone', label: 'Phone / WhatsApp', type: 'tel', required: true, placeholder: '+92 300 1234567' },
    { name: 'notes', label: 'Message / Preferences', type: 'textarea', required: false, placeholder: 'How can we help?' },
  ];

  const [formData, setFormData] = useState<Record<string, any>>({});
  const [honeypot, setHoneypot] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (honeypot) return; // Silent bot block

    setSubmitting(true);
    setErrorMessage('');

    try {
      const res = await fetch('/api/cms/forms/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          actionType,
          formData,
          propertyId: dataContext?.property?._id || node.props.propertyId,
          pageSlug: dataContext?.route?.slug,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSubmitted(true);
      } else {
        setErrorMessage(data.error || 'Submission failed. Please check your inputs.');
      }
    } catch (err: any) {
      setErrorMessage('Network error occurred. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="p-8 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-center space-y-3 animate-in fade-in">
        <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
        <h4 className="text-base font-bold text-white">Inquiry Received</h4>
        <p className="text-xs text-slate-300">Thank you. Our dedicated property director will reach out shortly.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 text-xs w-full">
      {/* Anti-spam honeypot */}
      <input
        type="text"
        name="website_url_trap"
        value={honeypot}
        onChange={(e) => setHoneypot(e.target.value)}
        className="hidden"
        tabIndex={-1}
        autoComplete="off"
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {fields.map((f: any) => (
          <div key={f.name} className={f.type === 'textarea' ? 'sm:col-span-2' : ''}>
            <label className="block text-slate-300 mb-1 font-semibold">{f.label}</label>
            {f.type === 'textarea' ? (
              <textarea
                rows={3}
                required={f.required}
                placeholder={f.placeholder}
                value={formData[f.name] || ''}
                onChange={(e) => setFormData({ ...formData, [f.name]: e.target.value })}
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-blue-500"
              />
            ) : (
              <input
                type={f.type || 'text'}
                required={f.required}
                placeholder={f.placeholder}
                value={formData[f.name] || ''}
                onChange={(e) => setFormData({ ...formData, [f.name]: e.target.value })}
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-blue-500"
              />
            )}
          </div>
        ))}
      </div>

      {errorMessage && (
        <p className="text-xs text-rose-400 font-semibold">{errorMessage}</p>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl transition-all shadow-lg shadow-blue-600/30 flex items-center justify-center space-x-2"
      >
        {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        <span>{node.props.submitText || 'Submit Inquiry'}</span>
      </button>
    </form>
  );
};

// 16. Repeater Primitive
export const RepeaterPrimitive: React.FC<PrimitiveRendererProps> = ({ node, dataContext, onAction, isEditing }) => {
  // Source array resolution
  const sourceKey = node.props.source || '';
  let items: any[] = [];

  if (Array.isArray(node.props.items)) {
    items = node.props.items;
  } else if (sourceKey) {
    const cleanKey = sourceKey.replace(/[{}]/g, '').trim();
    items = resolveDeepPath(dataContext, cleanKey) || [];
  }

  if (!Array.isArray(items) || items.length === 0) {
    if (node.props.emptyFallback) {
      return <p className="text-xs text-slate-500 italic py-4">{node.props.emptyFallback}</p>;
    }
    return null;
  }

  const templateChild = node.children?.[0];
  if (!templateChild) return null;

  return (
    <div className={`w-full ${node.styles?.customClasses || ''}`}>
      {items.map((item, index) => {
        const itemContext = {
          ...dataContext,
          item,
          index,
          isFirst: index === 0,
          isLast: index === items.length - 1,
        };
        return (
          <PrimitiveDispatcher
            key={`${templateChild.id}-${index}`}
            node={templateChild}
            dataContext={itemContext}
            onAction={onAction}
            isEditing={isEditing}
          />
        );
      })}
    </div>
  );
};

// 17. PlayCanvas 3D Primitive
export const PlayCanvasPrimitive: React.FC<{ node: PrimitiveNode; dataContext: Record<string, any> }> = ({ node, dataContext }) => {
  const modelUrl = interpolateValue(node.props.modelUrl || '', dataContext);
  const title = interpolateValue(node.props.title || 'PlayCanvas 3D Experience', dataContext);

  return (
    <div className="py-4 w-full">
      <PlayCanvasViewer modelUrl={modelUrl} title={title} className="h-[520px] w-full" />
    </div>
  );
};

// 18. Tabs Primitive
export const TabsPrimitive: React.FC<PrimitiveRendererProps> = ({ node, dataContext, onAction, isEditing }) => {
  const tabs = node.props.tabs || [];
  const [activeTab, setActiveTab] = useState(0);

  return (
    <div className="space-y-6 w-full">
      <div className="flex border-b border-white/10 gap-2 pb-2">
        {tabs.map((tab: any, i: number) => (
          <button
            key={i}
            type="button"
            onClick={() => setActiveTab(i)}
            className={`px-4 py-2 text-xs font-semibold rounded-xl transition-all ${
              activeTab === i ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30' : 'text-slate-400 hover:text-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div>
        {node.children?.[activeTab] && (
          <PrimitiveDispatcher
            node={node.children[activeTab]}
            dataContext={dataContext}
            onAction={onAction}
            isEditing={isEditing}
          />
        )}
      </div>
    </div>
  );
};

// 19. Accordion Primitive
export const AccordionPrimitive: React.FC<{ node: PrimitiveNode; dataContext: Record<string, any> }> = ({ node, dataContext }) => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const items = node.props.items || [];

  return (
    <div className="space-y-3 max-w-3xl mx-auto w-full">
      {items.map((item: any, i: number) => {
        const isOpen = openIndex === i;
        const question = interpolateValue(item.question || '', dataContext);
        const answer = interpolateValue(item.answer || '', dataContext);

        return (
          <div key={i} className="border border-white/10 rounded-2xl overflow-hidden bg-white/[0.02]">
            <button
              type="button"
              onClick={() => setOpenIndex(isOpen ? null : i)}
              className="w-full p-4 flex items-center justify-between text-left text-xs sm:text-sm font-semibold text-white hover:bg-white/5 transition-colors"
            >
              <span>{question}</span>
              <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>
            {isOpen && (
              <div className="px-4 pb-4 text-xs text-slate-400 leading-relaxed border-t border-white/5 pt-2">
                {answer}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

// Helper: Deep property path resolver
function resolveDeepPath(obj: any, pathStr: string): any {
  if (!obj || !pathStr) return undefined;
  const parts = pathStr.split('.');
  let curr = obj;
  for (const part of parts) {
    if (curr === null || curr === undefined) return undefined;
    curr = curr[part];
  }
  return curr;
}

// Helper: String variable interpolation
function interpolateValue(str: string, context: Record<string, any>): string {
  if (typeof str !== 'string') return str;
  return str.replace(/\{\{([^}]+)\}\}/g, (_, key) => {
    const val = resolveDeepPath(context, key.trim());
    return val !== undefined && val !== null ? String(val) : '';
  });
}
