import type { CSSProperties } from 'react';
import { STITCH_LABELS, STITCH_TYPES } from '../core/constants';
import { PALETTE } from '../core/editor';
import type { Tool } from '../core/types';
import { useEditor, useEditorState } from './context';
import { EyedropperIcon, StitchGlyph, TOOL_ICONS } from './icons';
import { Panel } from './Panel';

interface PickProps {
  onPick?: () => void;
}

export function StitchModeList({ onPick }: PickProps) {
  const editor = useEditor();
  const current = useEditorState((s) => s.stitchType);
  return (
    <div className="modelist" role="radiogroup" aria-label="Stitch mode">
      {STITCH_TYPES.map((type, i) => (
        <button
          key={type}
          type="button"
          role="radio"
          aria-checked={current === type}
          className={'modelist__item' + (current === type ? ' is-active' : '')}
          onClick={() => {
            editor.setStitchType(type);
            onPick?.();
          }}
          title={`${STITCH_LABELS[type]} (${i + 1})`}
        >
          <span className="modelist__icon">
            <StitchGlyph type={type} />
          </span>
          <span className="modelist__label">{STITCH_LABELS[type]}</span>
        </button>
      ))}
    </div>
  );
}

export function StitchModePanel() {
  return (
    <Panel title="Stitch Mode">
      <StitchModeList />
    </Panel>
  );
}

const TOOLS: { tool: Tool; label: string; key: string }[] = [
  { tool: 'needle', label: 'Needle (Draw)', key: 'N' },
  { tool: 'eraser', label: 'Eraser', key: 'E' },
  { tool: 'pan', label: 'Pan', key: 'H' },
  { tool: 'zoom', label: 'Zoom', key: 'Z' },
];

export function ToolList({ onPick }: PickProps) {
  const editor = useEditor();
  const current = useEditorState((s) => s.tool);
  return (
    <div className="modelist" role="radiogroup" aria-label="Tools">
      {TOOLS.map(({ tool, label, key }) => {
        const Icon = TOOL_ICONS[tool];
        return (
          <button
            key={tool}
            type="button"
            role="radio"
            aria-checked={current === tool}
            className={'modelist__item modelist__item--tool' + (current === tool ? ' is-active' : '')}
            onClick={() => {
              editor.setTool(tool);
              onPick?.();
            }}
            title={`${label} (${key})`}
          >
            <span className="modelist__toolicon">
              <Icon size={24} />
            </span>
            <span className="modelist__label">{label}</span>
          </button>
        );
      })}
    </div>
  );
}

export function ToolsPanel() {
  return (
    <Panel title="Tools">
      <ToolList />
    </Panel>
  );
}

export function Swatches({ onPick }: PickProps) {
  const editor = useEditor();
  const color = useEditorState((s) => s.color);
  const eyedropper = useEditorState((s) => s.tool) === 'eyedropper';
  return (
    <div className="swatches" role="radiogroup" aria-label="Thread colors">
      {PALETTE.map((c) => (
        <button
          key={c}
          type="button"
          role="radio"
          aria-checked={color === c}
          aria-label={c}
          className={'swatch' + (color === c ? ' is-active' : '')}
          style={{ '--swatch': c } as CSSProperties}
          onClick={() => {
            editor.setColor(c);
            if (eyedropper) editor.setTool('needle');
            onPick?.();
          }}
        />
      ))}
      {!PALETTE.includes(color) && (
        <span
          className="swatch is-active is-custom"
          style={{ '--swatch': color } as CSSProperties}
          title={`Picked ${color}`}
        />
      )}
      <button
        type="button"
        className={'swatch swatch--eyedropper' + (eyedropper ? ' is-active' : '')}
        aria-pressed={eyedropper}
        title="Eyedropper: pick a thread color from the fabric (I)"
        onClick={() => editor.setTool(eyedropper ? 'needle' : 'eyedropper')}
      >
        <EyedropperIcon size={22} />
      </button>
    </div>
  );
}

export function ThreadColorsPanel() {
  return (
    <Panel title="Thread Colors">
      <Swatches />
    </Panel>
  );
}

interface SliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (v: number) => void;
}

function Slider({ label, value, min, max, step = 1, onChange }: SliderProps) {
  const pct = ((value - min) / (max - min)) * 100;
  const id = 'slider-' + label.toLowerCase().replace(/\s+/g, '-');
  return (
    <div className="slider">
      <label className="slider__label" htmlFor={id}>
        {label}
      </label>
      <div className="slider__row">
        <input
          id={id}
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          style={{ '--pct': pct + '%' } as CSSProperties}
        />
        <output className="slider__value" htmlFor={id}>
          {value} px
        </output>
      </div>
    </div>
  );
}

export function SettingsFields() {
  const editor = useEditor();
  const length = useEditorState((s) => s.length);
  const thickness = useEditorState((s) => s.thickness);
  const showGrid = useEditorState((s) => s.showGrid);
  return (
    <>
      <Slider label="Stitch Length" value={length} min={3} max={30} onChange={(v) => editor.setLength(v)} />
      <Slider label="Thread Thickness" value={thickness} min={1} max={8} onChange={(v) => editor.setThickness(v)} />
      <div className="switchrow">
        <span id="grid-label">Show Grid</span>
        <button
          type="button"
          role="switch"
          aria-checked={showGrid}
          aria-labelledby="grid-label"
          className={'switch' + (showGrid ? ' is-on' : '')}
          onClick={() => editor.toggleGrid()}
        >
          <span className="switch__knob" />
        </button>
      </div>
    </>
  );
}

export function SettingsPanel() {
  return (
    <Panel title="Stitch Settings">
      <SettingsFields />
    </Panel>
  );
}
