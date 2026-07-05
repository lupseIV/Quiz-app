import {
  AfterViewInit,
  Component,
  ElementRef,
  computed,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatIconModule } from '@angular/material/icon';
import { MatSliderModule } from '@angular/material/slider';
import { MatTooltipModule } from '@angular/material/tooltip';

interface StrokePoint {
  x: number;
  y: number;
  pressure: number;
}

interface Stroke {
  points: StrokePoint[];
  color: string;
  width: number;
  eraser: boolean;
}

const COLORS = ['#1a1a1a', '#d32f2f', '#1976d2', '#388e3c', '#f57c00', '#7b1fa2'];

/**
 * Canvas drawing surface built on the Pointer Events API so pen/stylus, touch
 * and mouse all work through the same handlers, including pressure where the
 * device reports it. Strokes are kept as vector data so undo/redo can replay them.
 */
@Component({
  selector: 'app-drawing-canvas',
  imports: [
    MatButtonModule,
    MatButtonToggleModule,
    MatIconModule,
    MatSliderModule,
    MatTooltipModule,
  ],
  template: `
    <div class="toolbar">
      <mat-button-toggle-group
        [value]="tool()"
        (change)="tool.set($event.value)"
        aria-label="Drawing tool"
      >
        <mat-button-toggle value="pen" matTooltip="Pen"><mat-icon>edit</mat-icon></mat-button-toggle>
        <mat-button-toggle value="eraser" matTooltip="Eraser">
          <mat-icon>ink_eraser</mat-icon>
        </mat-button-toggle>
      </mat-button-toggle-group>

      <div class="colors" role="radiogroup" aria-label="Pen color">
        @for (c of colors; track c) {
          <button
            type="button"
            class="color-swatch"
            [style.background]="c"
            [class.selected]="color() === c"
            (click)="color.set(c)"
            [attr.aria-label]="'Color ' + c"
          ></button>
        }
      </div>

      <mat-slider min="1" max="24" step="1" discrete class="width-slider">
        <input matSliderThumb [value]="strokeWidth()" (valueChange)="strokeWidth.set($event)" />
      </mat-slider>

      <span class="toolbar-spacer"></span>

      <button matIconButton (click)="undo()" [disabled]="!canUndo()" matTooltip="Undo">
        <mat-icon>undo</mat-icon>
      </button>
      <button matIconButton (click)="redo()" [disabled]="!canRedo()" matTooltip="Redo">
        <mat-icon>redo</mat-icon>
      </button>
      <button matIconButton (click)="clear()" [disabled]="!canUndo()" matTooltip="Clear canvas">
        <mat-icon>delete_sweep</mat-icon>
      </button>
    </div>

    <canvas
      #canvas
      width="900"
      height="560"
      (pointerdown)="onPointerDown($event)"
      (pointermove)="onPointerMove($event)"
      (pointerup)="onPointerUp($event)"
      (pointercancel)="onPointerUp($event)"
    ></canvas>

    <div class="actions">
      <button matButton="filled" (click)="emitSave()" [disabled]="!canUndo()">
        <mat-icon>save</mat-icon> Save drawing
      </button>
    </div>
  `,
  styles: `
    .toolbar {
      display: flex;
      align-items: center;
      gap: 12px;
      flex-wrap: wrap;
      margin-bottom: 8px;
    }
    .toolbar-spacer {
      flex: 1;
    }
    .colors {
      display: flex;
      gap: 6px;
    }
    .color-swatch {
      width: 26px;
      height: 26px;
      border-radius: 50%;
      border: 2px solid transparent;
      cursor: pointer;
      padding: 0;
    }
    .color-swatch.selected {
      border-color: var(--mat-sys-primary);
      outline: 2px solid var(--mat-sys-primary-container);
    }
    .width-slider {
      width: 120px;
    }
    canvas {
      width: 100%;
      max-width: 900px;
      border: 1px solid var(--mat-sys-outline-variant);
      border-radius: 8px;
      background: #fff;
      /* Critical for stylus/touch drawing: stop the browser panning/zooming instead */
      touch-action: none;
      display: block;
    }
    .actions {
      margin-top: 8px;
    }
  `,
})
export class DrawingCanvas implements AfterViewInit {
  readonly saved = output<string>();

  private readonly canvasRef = viewChild.required<ElementRef<HTMLCanvasElement>>('canvas');

  protected readonly colors = COLORS;
  protected readonly tool = signal<'pen' | 'eraser'>('pen');
  protected readonly color = signal(COLORS[0]);
  protected readonly strokeWidth = signal(4);

  private readonly strokes = signal<Stroke[]>([]);
  private readonly redoStack = signal<Stroke[]>([]);
  private currentStroke: Stroke | null = null;

  protected readonly canUndo = computed(() => this.strokes().length > 0);
  protected readonly canRedo = computed(() => this.redoStack().length > 0);

  ngAfterViewInit(): void {
    this.redraw();
  }

  protected onPointerDown(event: PointerEvent): void {
    event.preventDefault();
    const canvas = this.canvasRef().nativeElement;
    canvas.setPointerCapture(event.pointerId);
    this.currentStroke = {
      points: [this.toPoint(event)],
      color: this.color(),
      width: this.strokeWidth(),
      eraser: this.tool() === 'eraser',
    };
  }

  protected onPointerMove(event: PointerEvent): void {
    if (!this.currentStroke) {
      return;
    }
    // getCoalescedEvents captures the high-frequency samples between frames
    // that pens produce, giving much smoother handwriting.
    const events = event.getCoalescedEvents?.() ?? [event];
    for (const e of events) {
      this.currentStroke.points.push(this.toPoint(e));
    }
    this.redraw();
  }

  protected onPointerUp(event: PointerEvent): void {
    if (!this.currentStroke) {
      return;
    }
    this.canvasRef().nativeElement.releasePointerCapture(event.pointerId);
    if (this.currentStroke.points.length > 1) {
      this.strokes.update((strokes) => [...strokes, this.currentStroke!]);
      this.redoStack.set([]);
    }
    this.currentStroke = null;
    this.redraw();
  }

  protected undo(): void {
    const strokes = this.strokes();
    if (strokes.length === 0) {
      return;
    }
    this.redoStack.update((redo) => [...redo, strokes[strokes.length - 1]]);
    this.strokes.set(strokes.slice(0, -1));
    this.redraw();
  }

  protected redo(): void {
    const redo = this.redoStack();
    if (redo.length === 0) {
      return;
    }
    this.strokes.update((strokes) => [...strokes, redo[redo.length - 1]]);
    this.redoStack.set(redo.slice(0, -1));
    this.redraw();
  }

  protected clear(): void {
    if (this.strokes().length && !confirm('Clear the whole canvas?')) {
      return;
    }
    this.strokes.set([]);
    this.redoStack.set([]);
    this.redraw();
  }

  protected emitSave(): void {
    this.saved.emit(this.canvasRef().nativeElement.toDataURL('image/png'));
    this.strokes.set([]);
    this.redoStack.set([]);
    this.redraw();
  }

  private toPoint(event: PointerEvent): StrokePoint {
    const canvas = this.canvasRef().nativeElement;
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((event.clientX - rect.left) / rect.width) * canvas.width,
      y: ((event.clientY - rect.top) / rect.height) * canvas.height,
      // Mice report pressure 0 while pens report real values; default to full.
      pressure: event.pressure > 0 ? event.pressure : 1,
    };
  }

  private redraw(): void {
    const canvas = this.canvasRef().nativeElement;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return;
    }
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    for (const stroke of [...this.strokes(), ...(this.currentStroke ? [this.currentStroke] : [])]) {
      this.drawStroke(ctx, stroke);
    }
  }

  private drawStroke(ctx: CanvasRenderingContext2D, stroke: Stroke): void {
    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = stroke.eraser ? '#ffffff' : stroke.color;
    for (let i = 1; i < stroke.points.length; i++) {
      const from = stroke.points[i - 1];
      const to = stroke.points[i];
      ctx.beginPath();
      ctx.lineWidth = stroke.width * (stroke.eraser ? 3 : to.pressure);
      ctx.moveTo(from.x, from.y);
      ctx.lineTo(to.x, to.y);
      ctx.stroke();
    }
    ctx.restore();
  }
}
