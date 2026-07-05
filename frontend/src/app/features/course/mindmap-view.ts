import { Component, ElementRef, effect, input, viewChild } from '@angular/core';
import * as d3 from 'd3';

import { MindMapNode } from '../../core/models';

const FALLBACK_COLORS = ['#7b1fa2', '#1976d2', '#388e3c', '#f57c00', '#d32f2f', '#00838f'];

/**
 * Renders the AI-generated node tree as a left-to-right mind-map using
 * d3-hierarchy for layout and plain SVG for the drawing. Each main branch
 * keeps its own color; nodes show the label plus the AI's catchphrase.
 */
@Component({
  selector: 'app-mindmap-view',
  imports: [],
  template: `<div class="map-scroll"><svg #svg></svg></div>`,
  styles: `
    .map-scroll {
      overflow: auto;
      border: 1px solid var(--mat-sys-outline-variant);
      border-radius: 8px;
      background: var(--mat-sys-surface-container-low);
    }
  `,
})
export class MindmapView {
  readonly root = input.required<MindMapNode>();

  private readonly svgRef = viewChild.required<ElementRef<SVGSVGElement>>('svg');

  private readonly render = effect(() => {
    const rootNode = this.root();
    const svgEl = this.svgRef().nativeElement;
    this.draw(svgEl, rootNode);
  });

  private draw(svgEl: SVGSVGElement, rootData: MindMapNode): void {
    const svg = d3.select(svgEl);
    svg.selectAll('*').remove();

    const hierarchy = d3.hierarchy<MindMapNode>(rootData, (node) => node.children);
    const nodeWidth = 210;
    const nodeHeight = 84;
    const layout = d3.tree<MindMapNode>().nodeSize([nodeHeight + 14, nodeWidth + 70]);
    const tree = layout(hierarchy);

    let minX = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    tree.each((node) => {
      minX = Math.min(minX, node.x);
      maxX = Math.max(maxX, node.x);
      maxY = Math.max(maxY, node.y);
    });

    const margin = 40;
    const width = maxY + nodeWidth + margin * 2;
    const height = maxX - minX + nodeHeight + margin * 2;
    svg.attr('width', width).attr('height', height);

    const g = svg
      .append('g')
      .attr('transform', `translate(${margin}, ${margin - minX + nodeHeight / 2})`);

    const branchColor = (node: d3.HierarchyPointNode<MindMapNode>): string => {
      // A node inherits the color of its depth-1 ancestor so branches stay coherent.
      let current: d3.HierarchyPointNode<MindMapNode> = node;
      while (current.depth > 1 && current.parent) {
        current = current.parent;
      }
      if (current.data.color) {
        return current.data.color;
      }
      const index = current.parent ? current.parent.children!.indexOf(current) : 0;
      return FALLBACK_COLORS[index % FALLBACK_COLORS.length];
    };

    g.selectAll('path.link')
      .data(tree.links())
      .join('path')
      .attr('fill', 'none')
      .attr('stroke', (link) => branchColor(link.target))
      .attr('stroke-width', 2.5)
      .attr('stroke-opacity', 0.6)
      .attr(
        'd',
        d3
          .linkHorizontal<d3.HierarchyPointLink<MindMapNode>, d3.HierarchyPointNode<MindMapNode>>()
          .x((node) => node.y + (node.depth === 0 ? nodeWidth : nodeWidth / 2))
          .y((node) => node.x),
      );

    const nodes = g
      .selectAll('g.node')
      .data(tree.descendants())
      .join('g')
      .attr('transform', (node) => `translate(${node.y}, ${node.x - nodeHeight / 2})`);

    nodes
      .append('rect')
      .attr('width', nodeWidth)
      .attr('height', nodeHeight)
      .attr('rx', 14)
      .attr('fill', (node) => (node.depth === 0 ? '#333' : (node.data.color ?? branchColor(node))))
      .attr('fill-opacity', (node) => (node.depth === 0 ? 1 : 0.15))
      .attr('stroke', (node) => (node.depth === 0 ? '#333' : branchColor(node)))
      .attr('stroke-width', 2);

    nodes
      .append('text')
      .attr('x', 12)
      .attr('y', 24)
      .attr('font-weight', 700)
      .attr('font-size', 14)
      .attr('fill', (node) => (node.depth === 0 ? '#fff' : '#222'))
      .text((node) => truncate(node.data.label, 26));

    nodes
      .append('text')
      .attr('x', 12)
      .attr('y', 46)
      .attr('font-size', 11.5)
      .attr('font-style', 'italic')
      .attr('fill', (node) => (node.depth === 0 ? '#eee' : '#444'))
      .each(function (node) {
        const words = (node.data.catchphrase ?? '').split(/\s+/);
        const lines: string[] = [];
        let line = '';
        for (const word of words) {
          if ((line + ' ' + word).trim().length > 34) {
            lines.push(line.trim());
            line = word;
          } else {
            line = (line + ' ' + word).trim();
          }
          if (lines.length === 2) {
            break;
          }
        }
        if (lines.length < 2 && line) {
          lines.push(line.trim());
        }
        d3.select(this)
          .selectAll('tspan')
          .data(lines.slice(0, 2))
          .join('tspan')
          .attr('x', 12)
          .attr('dy', (_, i) => (i === 0 ? 0 : 14))
          .text((text) => text);
      });
  }
}

function truncate(text: string, max: number): string {
  return text.length > max ? text.slice(0, max - 1) + '…' : text;
}
