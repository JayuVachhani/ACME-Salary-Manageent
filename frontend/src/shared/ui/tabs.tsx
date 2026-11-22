import { useId, useRef } from 'react';
import type { ReactNode } from 'react';

type Tab = { id: string; label: string; content: ReactNode; disabled?: boolean };
export function Tabs({
  label,
  tabs,
  selected,
  onSelect,
}: {
  label: string;
  tabs: Tab[];
  selected: string;
  onSelect: (id: string) => void;
}) {
  const prefix = useId();
  const buttons = useRef(new Map<string, HTMLButtonElement>());
  return (
    <>
      <div className="detail-tabs" role="tablist" aria-label={label}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            id={`${prefix}-${tab.id}-tab`}
            aria-controls={`${prefix}-${tab.id}-panel`}
            aria-selected={selected === tab.id}
            tabIndex={selected === tab.id ? 0 : -1}
            disabled={tab.disabled}
            ref={(node) => {
              if (node) buttons.current.set(tab.id, node);
              else buttons.current.delete(tab.id);
            }}
            onClick={() => onSelect(tab.id)}
            onKeyDown={(event) => {
              if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
              event.preventDefault();
              const enabled = tabs.filter((item) => !item.disabled);
              const index = enabled.findIndex((item) => item.id === tab.id);
              const next =
                event.key === 'Home'
                  ? enabled[0]
                  : event.key === 'End'
                    ? enabled.at(-1)
                    : enabled[
                        (index + (event.key === 'ArrowRight' ? 1 : -1) + enabled.length) %
                          enabled.length
                      ];
              if (next) {
                onSelect(next.id);
                buttons.current.get(next.id)?.focus();
              }
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>
      {tabs.map((tab) => (
        <div
          key={tab.id}
          role="tabpanel"
          id={`${prefix}-${tab.id}-panel`}
          aria-labelledby={`${prefix}-${tab.id}-tab`}
          hidden={selected !== tab.id}
          tabIndex={0}
        >
          {selected === tab.id && tab.content}
        </div>
      ))}
    </>
  );
}
