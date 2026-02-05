/**
 * Export service for diagrams
 * Supports: JSON, PNG, SVG, Mermaid, PlantUML formats
 */

import { toPng, toSvg } from 'html-to-image';
import type { Diagram, ExportOptions } from '../store/types';

// ============================================================================
// JSON Export
// ============================================================================

export const exportToJSON = (diagram: Diagram, prettify: boolean = true): string => {
  const exportData = {
    version: diagram.version,
    metadata: {
      id: diagram.id,
      name: diagram.name,
      createdAt: diagram.createdAt,
      modifiedAt: diagram.modifiedAt,
      author: diagram.author,
      description: diagram.description,
      tags: diagram.tags,
    },
    diagram: {
      nodes: diagram.nodes,
      edges: diagram.edges,
      layoutDirection: diagram.layoutDirection,
      connectionLineType: diagram.connectionLineType,
      viewport: diagram.viewport,
    },
    mermaidCode: diagram.mermaidCode,
  };

  return prettify ? JSON.stringify(exportData, null, 2) : JSON.stringify(exportData);
};

export const downloadJSON = (diagram: Diagram, filename?: string) => {
  const json = exportToJSON(diagram);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename || `${sanitizeFilename(diagram.name)}-${Date.now()}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

// ============================================================================
// PNG Export (using html-to-image)
// ============================================================================

export const exportToPNG = async (
  elementId: string = 'react-flow-container',
  filename?: string,
  options?: {
    backgroundColor?: string;
    quality?: number;
    pixelRatio?: number;
    watermark?: boolean;
  }
): Promise<void> => {
  const element = document.querySelector(`[data-id="${elementId}"]`) ||
                  document.querySelector('.react-flow') ||
                  document.getElementById(elementId);

  if (!element) {
    throw new Error(`Element with id "${elementId}" not found`);
  }

  try {
    const dataUrl = await toPng(element as HTMLElement, {
      backgroundColor: options?.backgroundColor || '#ffffff',
      quality: options?.quality || 1,
      pixelRatio: options?.pixelRatio || 2,
      filter: (node) => {
        // Exclude controls, minimap from export
        if (node.classList) {
          return (
            !node.classList.contains('react-flow__controls') &&
            !node.classList.contains('react-flow__minimap') &&
            !node.classList.contains('react-flow__attribution')
          );
        }
        return true;
      },
    });

    // Add watermark if requested
    let finalDataUrl = dataUrl;
    if (options?.watermark) {
      finalDataUrl = await addWatermark(dataUrl, 'System Design Visualizer');
    }

    // Download
    const a = document.createElement('a');
    a.href = finalDataUrl;
    a.download = filename || `diagram-${Date.now()}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  } catch (error) {
    console.error('Failed to export PNG:', error);
    throw error;
  }
};

// ============================================================================
// SVG Export (using html-to-image)
// ============================================================================

export const exportToSVG = async (
  elementId: string = 'react-flow-container',
  filename?: string,
  options?: {
    backgroundColor?: string;
    watermark?: boolean;
  }
): Promise<void> => {
  const element = document.querySelector(`[data-id="${elementId}"]`) ||
                  document.querySelector('.react-flow') ||
                  document.getElementById(elementId);

  if (!element) {
    throw new Error(`Element with id "${elementId}" not found`);
  }

  try {
    const dataUrl = await toSvg(element as HTMLElement, {
      backgroundColor: options?.backgroundColor || '#ffffff',
      filter: (node) => {
        if (node.classList) {
          return (
            !node.classList.contains('react-flow__controls') &&
            !node.classList.contains('react-flow__minimap') &&
            !node.classList.contains('react-flow__attribution')
          );
        }
        return true;
      },
    });

    // Download
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = filename || `diagram-${Date.now()}.svg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  } catch (error) {
    console.error('Failed to export SVG:', error);
    throw error;
  }
};

// ============================================================================
// Mermaid Export
// ============================================================================

export const exportToMermaid = (diagram: Diagram): string => {
  // If we have existing mermaid code, return it
  if (diagram.mermaidCode) {
    return diagram.mermaidCode;
  }

  // Otherwise, generate from nodes/edges
  let mermaid = 'graph LR\n';

  // Add nodes
  diagram.nodes.forEach((node) => {
    const id = sanitizeId(node.id);
    const label = node.data.label || 'Untitled';

    // Choose shape based on node type
    let shape = '[]'; // default rectangle
    switch (node.type) {
      case 'databaseNode':
        shape = '[(Database)]';
        break;
      case 'clientNode':
        shape = '{{Client}}';
        break;
      case 'loadBalancerNode':
        shape = '{{Load Balancer}}';
        break;
      case 'cacheNode':
        shape = '[(Cache)]';
        break;
      case 'userNode':
        shape = '((User))';
        break;
      case 'subflowNode':
        shape = '[Subflow]';
        break;
      default:
        shape = '[Server]';
    }

    mermaid += `    ${id}${shape.replace('[]', `[${label}]`)}\n`;
  });

  // Add edges
  diagram.edges.forEach((edge) => {
    const source = sanitizeId(edge.source);
    const target = sanitizeId(edge.target);
    const label = edge.label || edge.data?.label || '';
    const arrow = edge.animated ? '==>' : '-->';

    if (label) {
      mermaid += `    ${source} ${arrow}|${label}| ${target}\n`;
    } else {
      mermaid += `    ${source} ${arrow} ${target}\n`;
    }
  });

  return mermaid;
};

export const downloadMermaid = (diagram: Diagram, filename?: string) => {
  const mermaid = exportToMermaid(diagram);
  const blob = new Blob([mermaid], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename || `${sanitizeFilename(diagram.name)}-${Date.now()}.mmd`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

// ============================================================================
// PlantUML Export
// ============================================================================

export const exportToPlantUML = (diagram: Diagram): string => {
  let puml = '@startuml\n';
  puml += '!theme plain\n';
  puml += 'skinparam componentStyle rectangle\n\n';

  // Add components
  diagram.nodes.forEach((node) => {
    const id = sanitizeId(node.id);
    const label = node.data.label || 'Untitled';
    const tech = node.data.tech ? `\\n${node.data.tech}` : '';

    let componentType = 'component';
    switch (node.type) {
      case 'databaseNode':
        componentType = 'database';
        break;
      case 'clientNode':
        componentType = 'actor';
        break;
      case 'loadBalancerNode':
        componentType = 'component';
        break;
      case 'cacheNode':
        componentType = 'storage';
        break;
      case 'userNode':
        componentType = 'actor';
        break;
      default:
        componentType = 'component';
    }

    puml += `${componentType} "${label}${tech}" as ${id}\n`;
  });

  puml += '\n';

  // Add relationships
  diagram.edges.forEach((edge) => {
    const source = sanitizeId(edge.source);
    const target = sanitizeId(edge.target);
    const label = edge.label || edge.data?.label || '';

    if (label) {
      puml += `${source} --> ${target} : ${label}\n`;
    } else {
      puml += `${source} --> ${target}\n`;
    }
  });

  puml += '@enduml\n';
  return puml;
};

export const downloadPlantUML = (diagram: Diagram, filename?: string) => {
  const puml = exportToPlantUML(diagram);
  const blob = new Blob([puml], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename || `${sanitizeFilename(diagram.name)}-${Date.now()}.puml`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

// ============================================================================
// Markdown Documentation Export
// ============================================================================

export const exportToMarkdown = (diagram: Diagram): string => {
  let md = `# ${diagram.name}\n\n`;

  if (diagram.description) {
    md += `${diagram.description}\n\n`;
  }

  md += '## Metadata\n\n';
  md += `- **Created**: ${new Date(diagram.createdAt).toLocaleString()}\n`;
  md += `- **Modified**: ${new Date(diagram.modifiedAt).toLocaleString()}\n`;
  if (diagram.author) {
    md += `- **Author**: ${diagram.author}\n`;
  }
  if (diagram.tags && diagram.tags.length > 0) {
    md += `- **Tags**: ${diagram.tags.join(', ')}\n`;
  }
  md += '\n';

  md += '## Architecture Diagram\n\n';
  md += '```mermaid\n';
  md += exportToMermaid(diagram);
  md += '\n```\n\n';

  md += '## Components\n\n';
  diagram.nodes.forEach((node) => {
    md += `### ${node.data.label}\n\n`;
    if (node.data.description) {
      md += `${node.data.description}\n\n`;
    }
    if (node.data.tech) {
      md += `**Technology**: ${node.data.tech}\n\n`;
    }
    md += `**Type**: ${node.type}\n\n`;
  });

  md += '## Connections\n\n';
  diagram.edges.forEach((edge) => {
    const sourceNode = diagram.nodes.find((n) => n.id === edge.source);
    const targetNode = diagram.nodes.find((n) => n.id === edge.target);
    const sourceName = sourceNode?.data.label || edge.source;
    const targetName = targetNode?.data.label || edge.target;
    const label = edge.label || edge.data?.label || '';

    md += `- **${sourceName}** → **${targetName}**`;
    if (label) {
      md += ` (${label})`;
    }
    md += '\n';
  });

  md += '\n---\n\n';
  md += '*Generated by System Design Visualizer*\n';

  return md;
};

export const downloadMarkdown = (diagram: Diagram, filename?: string) => {
  const md = exportToMarkdown(diagram);
  const blob = new Blob([md], { type: 'text/markdown' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename || `${sanitizeFilename(diagram.name)}-${Date.now()}.md`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

// ============================================================================
// Utility Functions
// ============================================================================

const sanitizeFilename = (filename: string): string => {
  return filename
    .replace(/[^a-z0-9]/gi, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase();
};

const sanitizeId = (id: string): string => {
  return id.replace(/[^a-zA-Z0-9]/g, '_');
};

const addWatermark = async (dataUrl: string, text: string): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        resolve(dataUrl);
        return;
      }

      ctx.drawImage(img, 0, 0);

      // Add watermark
      ctx.font = '16px sans-serif';
      ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
      ctx.textAlign = 'right';
      ctx.fillText(text, canvas.width - 10, canvas.height - 10);

      resolve(canvas.toDataURL('image/png'));
    };
    img.src = dataUrl;
  });
};

// ============================================================================
// Unified Export Function
// ============================================================================

export const exportDiagram = async (
  diagram: Diagram,
  options: ExportOptions
): Promise<void> => {
  switch (options.format) {
    case 'json':
      downloadJSON(diagram);
      break;
    case 'png':
      await exportToPNG('react-flow-container', undefined, {
        pixelRatio: options.imageResolution || 2,
        watermark: options.watermark,
      });
      break;
    case 'svg':
      await exportToSVG('react-flow-container', undefined, {
        watermark: options.watermark,
      });
      break;
    case 'mermaid':
      downloadMermaid(diagram);
      break;
    case 'plantuml':
      downloadPlantUML(diagram);
      break;
    default:
      throw new Error(`Unsupported export format: ${options.format}`);
  }
};
