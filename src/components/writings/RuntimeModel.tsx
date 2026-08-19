import { useId } from 'react'
import { codeLanguageLabel } from '../../content/writings/languages'
import type {
  LanguageVariant,
  RuntimeModelVariant,
  RuntimeObjectEntity,
  RuntimeSourceEntity,
  RuntimeState,
} from '../../content/writings/types'
import {
  classifyRuntimeTopology,
  classifyRuntimeTransition,
} from '../../content/writings/runtimeModelTopology'
import { CodeBlock } from './CodeBlock'
import {
  runtimeModelDescription,
  runtimeModelTransitionDescription,
} from './runtimeModelDescription'
import { useLanguagePreference } from './useLanguagePreference'
import styles from './RuntimeModel.module.css'

function ObjectCard({
  object,
  changedMembers = new Set<string>(),
}: {
  object: RuntimeObjectEntity
  changedMembers?: Set<string>
}) {
  return (
    <div className={styles.objectCard} data-runtime-entity="object">
      <p className={styles.objectType}>{object.typeLabel}</p>
      {object.scalarValue !== undefined ? (
        <p className={styles.scalarValue}>{object.scalarValue}</p>
      ) : (
        <dl className={styles.members}>
          {(object.members ?? []).map((member) => (
            <div
              key={member.name}
              data-runtime-changed={changedMembers.has(member.name) ? 'true' : undefined}
            >
              <dt>
                {member.name}
                <span>{member.kind}</span>
              </dt>
              <dd>
                {member.value}
                {changedMembers.has(member.name) && (
                  <span className={styles.changedLabel}>changed</span>
                )}
              </dd>
            </div>
          ))}
        </dl>
      )}
    </div>
  )
}

function SourceCard({ source }: { source: RuntimeSourceEntity }) {
  return (
    <div className={styles.sourceCard} data-runtime-entity={source.kind}>
      <span>{source.kind}</span>
      <strong>{source.label}</strong>
    </div>
  )
}

function RuntimeModelState({
  state,
  changedMembers,
  described = true,
}: {
  state: RuntimeState
  changedMembers?: Set<string>
  described?: boolean
}) {
  const descriptionId = useId()
  const description = runtimeModelDescription(state)
  const topology = classifyRuntimeTopology(state)

  if (topology.kind === 'direct-value') {
    const { source } = topology
    return (
      <figure className={styles.state} aria-describedby={described ? descriptionId : undefined}>
        <figcaption>{state.label}</figcaption>
        <div className={styles.directModel} aria-hidden="true">
          <p className={styles.sourceLabel}>{source.label}</p>
          <div className={styles.valueCard}>
            <span>{source.directValue.type}</span>
            <strong>{source.directValue.value}</strong>
          </div>
        </div>
        {described && <p id={descriptionId} className={styles.visuallyHidden}>{description}</p>}
      </figure>
    )
  }

  if (topology.kind === 'shared-target') {
    return (
      <figure className={styles.state} aria-describedby={described ? descriptionId : undefined}>
        <figcaption>{state.label}</figcaption>
        <div className={styles.sharedRelationshipModel} aria-hidden="true">
          <div className={styles.sharedSources}>
            {topology.sources.map((source) => (
              <SourceCard key={source.id} source={source} />
            ))}
          </div>
          <svg
            className={styles.sharedConnector}
            viewBox="0 0 72 100"
            preserveAspectRatio="none"
            focusable="false"
          >
            <path d="M0 24 H20 Q32 24 32 38 V50 H60" />
            <path d="M0 76 H20 Q32 76 32 62 V50" />
            <path className={styles.arrowHead} d="M59 42 L72 50 L59 58 Z" />
          </svg>
          <span className={styles.sharedArrowMobile}>↓</span>
          <ObjectCard object={topology.target} changedMembers={changedMembers} />
        </div>
        {described && <p id={descriptionId} className={styles.visuallyHidden}>{description}</p>}
      </figure>
    )
  }

  const [source] = topology.sources
  return (
    <figure className={styles.state} aria-describedby={described ? descriptionId : undefined}>
      <figcaption>{state.label}</figcaption>
      <div className={styles.relationshipModel} aria-hidden="true">
        <SourceCard source={source} />
        <span className={styles.arrow}>→</span>
        <ObjectCard object={topology.target} changedMembers={changedMembers} />
      </div>
      {described && <p id={descriptionId} className={styles.visuallyHidden}>{description}</p>}
    </figure>
  )
}

function RuntimeModelVariantView({ variant }: { variant: RuntimeModelVariant }) {
  const transitionDescriptionId = useId()
  if (variant.states.length === 2) {
    const [before, after] = variant.states
    const transition = classifyRuntimeTransition(before, after)
    const changedMembers = new Set(transition.changedMembers.map(({ name }) => name))
    const afterEntities = new Map(after.entities.map((entity) => [entity.id, entity]))
    const afterMembers = new Map(
      transition.after.target.members!.map((member) => [member.name, member]),
    )
    const afterForDisplay: RuntimeState = {
      ...after,
      entities: [
        ...transition.before.sources.map((source) => afterEntities.get(source.id)!),
        {
          ...transition.after.target,
          members: transition.before.target.members!.map(({ name }) => afterMembers.get(name)!),
        },
      ],
    }
    return (
      <>
        <CodeBlock code={variant.code.code} language={variant.code.language} />
        <div className={styles.transition} aria-describedby={transitionDescriptionId}>
          <RuntimeModelState state={before} described={false} />
          <div className={styles.transitionCue} aria-hidden="true">
            <span>↓</span>
            <strong>object mutated</strong>
          </div>
          <RuntimeModelState state={afterForDisplay} changedMembers={changedMembers} described={false} />
          <p id={transitionDescriptionId} className={styles.visuallyHidden}>
            {runtimeModelTransitionDescription(before, after)}
          </p>
        </div>
      </>
    )
  }
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

  // Runtime models deliberately retain the selected language during Compare. A later
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
