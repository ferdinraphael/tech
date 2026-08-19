import { useId } from 'react'
import { codeLanguageLabel } from '../../content/writings/languages'
import type {
  LanguageVariant,
  RuntimeModelVariant,
  RuntimeObjectEntity,
  RuntimeState,
} from '../../content/writings/types'
import { CodeBlock } from './CodeBlock'
import { runtimeModelDescription } from './runtimeModelDescription'
import { useLanguagePreference } from './useLanguagePreference'
import styles from './RuntimeModel.module.css'

function ObjectCard({ object }: { object: RuntimeObjectEntity }) {
  return (
    <div className={styles.objectCard}>
      <p className={styles.objectType}>{object.typeLabel}</p>
      {object.scalarValue !== undefined ? (
        <p className={styles.scalarValue}>{object.scalarValue}</p>
      ) : (
        <dl className={styles.members}>
          {(object.fields ?? []).map((member) => (
            <div key={member.name}>
              <dt>
                {member.name}
                <span>{member.kind}</span>
              </dt>
              <dd>{member.value}</dd>
            </div>
          ))}
        </dl>
      )}
    </div>
  )
}

function RuntimeModelState({ state }: { state: RuntimeState }) {
  const descriptionId = useId()
  const description = runtimeModelDescription(state)

  if (state.relationships.length === 0) {
    const variable = state.entities.find((entity) => entity.kind === 'variable')
    if (!variable || variable.kind !== 'variable' || !variable.directValue) {
      throw new Error('Direct runtime model is missing its value variable')
    }
    return (
      <figure className={styles.state} aria-describedby={descriptionId}>
        <figcaption>{state.label}</figcaption>
        <div className={styles.directModel} aria-hidden="true">
          <p className={styles.sourceLabel}>{variable.label}</p>
          <div className={styles.valueCard}>
            <span>{variable.directValue.type}</span>
            <strong>{variable.directValue.value}</strong>
          </div>
        </div>
        <p id={descriptionId} className={styles.visuallyHidden}>{description}</p>
      </figure>
    )
  }

  const relationship = state.relationships[0]
  const source = state.entities.find((entity) => entity.id === relationship.from)
  const target = state.entities.find((entity) => entity.id === relationship.to)
  if (!source || (source.kind !== 'variable' && source.kind !== 'name')) {
    throw new Error('Runtime model source is missing')
  }
  if (!target || target.kind !== 'object') {
    throw new Error('Runtime model object is missing')
  }
  return (
    <figure className={styles.state} aria-describedby={descriptionId}>
      <figcaption>{state.label}</figcaption>
      <div className={styles.relationshipModel} aria-hidden="true">
        <div className={styles.sourceCard}>
          <span>{source.kind}</span>
          <strong>{source.label}</strong>
        </div>
        <span className={styles.arrow}>→</span>
        <ObjectCard object={target} />
      </div>
      <p id={descriptionId} className={styles.visuallyHidden}>{description}</p>
    </figure>
  )
}

function RuntimeModelVariantView({ variant }: { variant: RuntimeModelVariant }) {
  return (
    <>
      <CodeBlock code={variant.code.code} language={variant.code.language} />
      {variant.states.map((state) => (
        <RuntimeModelState key={state.id} state={state} />
      ))}
    </>
  )
}

export function RuntimeModel({
  variants,
}: {
  variants: Array<LanguageVariant<RuntimeModelVariant>>
}) {
  const { readingState } = useLanguagePreference()
  if (!readingState) {
    throw new Error('runtime-model requires an article reader configuration')
  }
  const variant = variants.find(({ language }) => language === readingState.language)
  if (!variant) throw new Error(`runtime-model is missing ${readingState.language}`)

  // Stage D deliberately retains the selected language during Compare. A later
  // stage can add a true multi-language model comparison without changing state.
  return (
    <section
      className={styles.runtimeModel}
      aria-label={`${codeLanguageLabel(variant.language)} runtime model`}
    >
      <RuntimeModelVariantView variant={variant} />
    </section>
  )
}
