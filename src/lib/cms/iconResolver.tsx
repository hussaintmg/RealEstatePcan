import React from 'react';
import * as LucideIcons from 'lucide-react';

interface DynamicIconProps {
  name?: string;
  className?: string;
  size?: number;
  color?: string;
  fallbackIcon?: React.ReactNode;
}

export const DynamicCmsIcon: React.FC<DynamicIconProps> = ({
  name,
  className = 'w-4 h-4',
  size,
  color,
  fallbackIcon,
}) => {
  if (!name) return <>{fallbackIcon || null}</>;

  // If it's a URL or image path
  if (name.startsWith('http://') || name.startsWith('https://') || name.startsWith('/')) {
    return (
      <img
        src={name}
        alt="icon"
        className={className}
        style={{ width: size, height: size }}
      />
    );
  }

  // If it's a Lucide icon name (e.g. 'Home', 'Compass', 'Building2', etc.)
  const formattedName =
    name.charAt(0).toUpperCase() +
    name.slice(1).replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());

  const IconComponent = (LucideIcons as any)[formattedName] || (LucideIcons as any)[name];

  if (IconComponent) {
    return <IconComponent className={className} size={size} color={color} />;
  }

  return <>{fallbackIcon || null}</>;
};
