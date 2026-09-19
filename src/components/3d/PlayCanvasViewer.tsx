'use client';

import React from 'react';
import { RealEstate3DViewer, RealEstate3DViewerProps } from './RealEstate3DViewer';

export { RealEstate3DViewer };

export interface PlayCanvasViewerProps extends Partial<RealEstate3DViewerProps> {
  modelUrl?: string;
  title?: string;
  className?: string;
}

export const PlayCanvasViewer: React.FC<PlayCanvasViewerProps> = (props) => {
  return <RealEstate3DViewer {...props} />;
};

export default PlayCanvasViewer;
