import { useId } from 'react'
import { codeLanguageLabel } from '../../content/writings/languages'
import type {
  LanguageVariant,
  RuntimeModelVariant,
  RuntimeObjectEntity,
  RuntimeSourceEntity,
  RuntimeState,
  RuntimeVariableEntity,
} from '../../content/writings/types'
import {
  classifyRuntimeTopology,
  classifyRuntimeTransition,
} from '../../content/writings/runtimeModelTopology'
import type { RuntimeSplitTransition } from '../../content/writings/runtimeModelTopology'
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
  identity,
}: {
  object: RuntimeObjectEntity
  changedMembers?: Set<string>
  identity?: 'original' | 'new'
}) {
  return (
    <div
      className={styles.objectCard}
      data-runtime-entity="object"
      data-runtime-object-identity={identity}
    >
      {identity && <p className={styles.objectIdentity}>{identity}</p>}
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

function DirectValueItem({
  source,
  changed = false,
}: {
  source: RuntimeVariableEntity & { directValue: { type: string; value: string } }
  changed?: boolean
}) {
  return (
    <div className={styles.directValueItem} data-runtime-entity="variable">
      <p className={styles.sourceLabel}>{source.label}</p>
      <div className={styles.valueCard} data-runtime-changed={changed ? 'true' : undefined}>
        <span>{source.directValue.type}</span>
        <strong>
          {source.directValue.value}
          {changed && <span className={styles.changedLabel}>changed</span>}
        </strong>
      </div>
    </div>
  )
}

function RuntimeModelState({
  state,
  changedMembers,
  changedValues,
  described = true,
  targetIdentity,
}: {
  state: RuntimeState
  changedMembers?: Set<string>
  changedValues?: Set<string>
  described?: boolean
  targetIdentity?: 'original'
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
          <DirectValueItem source={source} changed={changedValues?.has(source.id)} />
        </div>
        {described && <p id={descriptionId} className={styles.visuallyHidden}>{description}</p>}
      </figure>
    )
  }

  if (topology.kind === 'direct-values') {
    return (
      <figure className={styles.state} aria-describedby={described ? descriptionId : undefined}>
        <figcaption>{state.label}</figcaption>
        <div className={styles.directValuesModel} data-runtime-topology="direct-values" aria-hidden="true">
          {topology.sources.map((source) => (
            <DirectValueItem
              key={source.id}
              source={source}
              changed={changedValues?.has(source.id)}
            />
          ))}
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
          <ObjectCard
            object={topology.target}
            changedMembers={changedMembers}
            identity={targetIdentity}
          />
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

function SplitTargetAfterState({
  state,
  transition,
}: {
  state: RuntimeState
  transition: RuntimeSplitTransition
}) {
  const relationships = new Map(
    transition.after.relationships.map((relationship) => [relationship.from, relationship]),
  )
  const targets = new Map(transition.after.targets.map((target) => [target.id, target]))

  return (
    <figure className={styles.state}>
      <figcaption>{state.label}</figcaption>
      <div className={styles.splitRelationshipModel} data-runtime-topology="split-target" aria-hidden="true">
        {transition.before.sources.map((source) => {
          const relationship = relationships.get(source.id)!
          const target = targets.get(relationship.to)!
          const targetForDisplay: RuntimeObjectEntity = target.members
            ? {
                ...target,
                members: transition.originalTargetBefore.members!.map(({ name }) =>
                  target.members!.find((member) => member.name === name)!),
              }
            : target
          const changed = source.id === transition.changedSource.id
          return (
            <div
              key={source.id}
              className={styles.splitPair}
              data-runtime-relationship-changed={changed ? 'true' : undefined}
            >
              <SourceCard source={source} />
              <span className={styles.arrow}>→</span>
              <ObjectCard
                object={targetForDisplay}
                identity={target.id === transition.originalTargetAfter.id ? 'original' : 'new'}
              />
              {changed && <span className={styles.relationshipChanged}>changed target</span>}
            </div>
          )
        })}
      </div>
    </figure>
  )
}

function RuntimeModelVariantView({ variant }: { variant: RuntimeModelVariant }) {
  const transitionDescriptionId = useId()
  if (variant.states.length === 2) {
    const [before, after] = variant.states
    const transition = classifyRuntimeTransition(before, after)
    if (transition.kind === 'shared-target-split') {
      return (
        <>
          <CodeBlock code={variant.code.code} language={variant.code.language} />
          <div className={styles.transition} aria-describedby={transitionDescriptionId}>
            <RuntimeModelState state={before} described={false} targetIdentity="original" />
            <div className={styles.transitionCue} aria-hidden="true">
              <span>↓</span>
              <strong>relationship changed</strong>
            </div>
            <SplitTargetAfterState state={after} transition={transition} />
            <p id={transitionDescriptionId} className={styles.visuallyHidden}>
              {runtimeModelTransitionDescription(before, after)}
            </p>
          </div>
        </>
      )
    }
    if (
      transition.kind === 'direct-value-change' ||
      transition.kind === 'direct-values-change'
    ) {
      const changedValues = new Set(transition.changedValues.map(({ id }) => id))
      const afterEntities = new Map(after.entities.map((entity) => [entity.id, entity]))
      const afterForDisplay: RuntimeState = transition.kind === 'direct-value-change'
        ? after
        : {
            ...after,
            entities: transition.before.sources.map((source) => afterEntities.get(source.id)!),
          }
      return (
        <>
          <CodeBlock code={variant.code.code} language={variant.code.language} />
          <div className={styles.transition} aria-describedby={transitionDescriptionId}>
            <RuntimeModelState state={before} described={false} />
            <div className={styles.transitionCue} aria-hidden="true">
              <span>↓</span>
              <strong>value assigned</strong>
            </div>
            <RuntimeModelState
              state={afterForDisplay}
              changedValues={changedValues}
              described={false}
            />
            <p id={transitionDescriptionId} className={styles.visuallyHidden}>
              {runtimeModelTransitionDescription(before, after)}
            </p>
          </div>
        </>
      )
    }
    if (transition.kind === 'single-scalar-rebinding') {
      return (
        <>
          <CodeBlock code={variant.code.code} language={variant.code.language} />
          <div className={styles.transition} aria-describedby={transitionDescriptionId}>
            <RuntimeModelState state={before} described={false} />
            <div className={styles.transitionCue} aria-hidden="true">
              <span>↓</span>
              <strong>relationship changed</strong>
            </div>
            <RuntimeModelState state={after} described={false} />
            <p id={transitionDescriptionId} className={styles.visuallyHidden}>
              {runtimeModelTransitionDescription(before, after)}
            </p>
          </div>
        </>
      )
    }
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
