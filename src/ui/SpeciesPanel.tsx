import { STATUS_LABELS, templateForDocumentName } from '../templates';
import { useEditorState } from './context';
import { Panel } from './Panel';

/** "Tür Bilgisi" card for the endemic species template currently on the cloth. */
export function SpeciesPanel() {
  const docName = useEditorState((s) => s.docName);
  const species = templateForDocumentName(docName)?.species;
  return (
    <Panel title="Tür Bilgisi" className="panel--species">
      {species ? (
        <div className="species">
          <div className="species__head">
            <span className="species__emoji" aria-hidden="true">
              {species.emoji}
            </span>
            <div>
              <h3 className="species__name">{species.name}</h3>
              <p className="species__latin">{species.latin}</p>
            </div>
          </div>
          <div className="species__tags">
            <span className="tag">{species.group}</span>
            <span className={'tag tag--' + species.status}>{STATUS_LABELS[species.status]}</span>
            <span className="tag tag--endemic">Türkiye’ye özgü</span>
          </div>
          <dl className="species__facts">
            <dt>Nerede yaşar?</dt>
            <dd>{species.region}</dd>
            <dt>Yaşam alanı</dt>
            <dd>{species.habitat}</dd>
          </dl>
          <p className="species__fact">
            <strong>Biliyor muydun?</strong> {species.fact}
          </p>
          <p className="species__why">
            <strong>Nasıl koruruz?</strong> {species.why}
          </p>
        </div>
      ) : (
        <p className="species__empty">Şablonlar menüsünden bir endemik tür seç; burada onun hikâyesi görünür.</p>
      )}
    </Panel>
  );
}
