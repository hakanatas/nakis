import type { ReactNode } from 'react';

interface PanelProps {
  title?: string;
  className?: string;
  children: ReactNode;
}

export function Panel({ title, children, className }: PanelProps) {
  return (
    <section className={'panel' + (className ? ' ' + className : '')}>
      {title && <h2 className="panel__title">{title}</h2>}
      {children}
    </section>
  );
}
