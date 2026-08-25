import type {
  RuntimeDirectValue,
  RuntimeObjectEntity,
  RuntimeRelationship,
  RuntimeSourceEntity,
  RuntimeState,
  RuntimeVariableEntity,
} from './types'

type TopologyFailure = (message: string) => never

export type RuntimeTopology =
  | {
      kind: 'direct-value'
      source: RuntimeVariableEntity & { directValue: RuntimeDirectValue }
    }
  | {
      kind: 'direct-values'
      sources: [
        RuntimeVariableEntity & { directValue: RuntimeDirectValue },
        RuntimeVariableEntity & { directValue: RuntimeDirectValue },
      ]
    }
  | {
      kind: 'single-target'
      sources: [RuntimeSourceEntity]
      target: RuntimeObjectEntity
      relationships: [RuntimeRelationship]
    }
  | {
      kind: 'shared-target'
      sources: [RuntimeSourceEntity, RuntimeSourceEntity]
      target: RuntimeObjectEntity
      relationships: [RuntimeRelationship, RuntimeRelationship]
    }

export type SharedTargetTopology = Extract<RuntimeTopology, { kind: 'shared-target' }>
export type DirectValueTopology = Extract<RuntimeTopology, { kind: 'direct-value' }>
export type DirectValuesTopology = Extract<RuntimeTopology, { kind: 'direct-values' }>
export type SingleTargetTopology = Extract<RuntimeTopology, { kind: 'single-target' }>

export interface SplitTargetTopology {
  kind: 'split-target'
  sources: [RuntimeSourceEntity, RuntimeSourceEntity]
  targets: [RuntimeObjectEntity, RuntimeObjectEntity]
  relationships: [RuntimeRelationship, RuntimeRelationship]
}

export interface RuntimeMemberChange {
  name: string
  kind: 'field' | 'property'
  beforeValue: string
  afterValue: string
}

export interface RuntimeMutationTransition {
  kind: 'shared-target-mutation'
  before: SharedTargetTopology
  after: SharedTargetTopology
  changedMembers: RuntimeMemberChange[]
}

export interface RuntimeSplitTransition {
  kind: 'shared-target-split'
  before: SharedTargetTopology
  after: SplitTargetTopology
  stableSource: RuntimeSourceEntity
  changedSource: RuntimeSourceEntity
  originalTargetBefore: RuntimeObjectEntity
  originalTargetAfter: RuntimeObjectEntity
  newTarget: RuntimeObjectEntity
}

export interface RuntimeDirectValueChange {
  id: string
  label: string
  type: string
  beforeValue: string
  afterValue: string
}

export interface RuntimeDirectValueTransition {
  kind: 'direct-value-change'
  before: DirectValueTopology
  after: DirectValueTopology
  changedValues: [RuntimeDirectValueChange]
}

export interface RuntimeDirectValuesTransition {
  kind: 'direct-values-change'
  before: DirectValuesTopology
  after: DirectValuesTopology
  changedValues: RuntimeDirectValueChange[]
}

export interface RuntimeSingleScalarRebindingTransition {
  kind: 'single-scalar-rebinding'
  before: SingleTargetTopology
  after: SingleTargetTopology
}

export type RuntimeTransition =
  | RuntimeDirectValueTransition
  | RuntimeDirectValuesTransition
  | RuntimeSingleScalarRebindingTransition
  | RuntimeMutationTransition
  | RuntimeSplitTransition

function defaultFailure(message: string): never {
  throw new Error(message)
}

function isDirectValueSource(
  entity: RuntimeState['entities'][number] | undefined,
): entity is RuntimeVariableEntity & { directValue: RuntimeDirectValue } {
  return entity?.kind === 'variable' && entity.directValue !== undefined
}

function sourceFor(
  relationship: RuntimeRelationship,
  entitiesById: Map<string, RuntimeState['entities'][number]>,
  fail: TopologyFailure,
): RuntimeSourceEntity {
  const source = entitiesById.get(relationship.from)
  if (!source) fail(`relationship source "${relationship.from}" does not exist`)
  if (source.kind !== 'variable' && source.kind !== 'name') {
    fail('runtime relationships must originate from a variable or name')
  }
  if (source.kind === 'variable' && source.directValue) {
    fail('a direct-value variable cannot also reference an object')
  }
  return source
}

function targetFor(
  relationship: RuntimeRelationship,
  entitiesById: Map<string, RuntimeState['entities'][number]>,
  fail: TopologyFailure,
): RuntimeObjectEntity {
  const target = entitiesById.get(relationship.to)
  if (!target) fail(`relationship target "${relationship.to}" does not exist`)
  if (target.kind !== 'object') {
    fail(`${relationship.kind} relationships must target an object`)
  }
  return target
}

function validateRelationshipKind(
  relationship: RuntimeRelationship,
  source: RuntimeSourceEntity,
  fail: TopologyFailure,
): void {
  if (relationship.kind === 'reference' && source.kind !== 'variable') {
    fail('reference relationships must originate from a variable')
  }
  if (relationship.kind === 'binding' && source.kind !== 'name') {
    fail('binding relationships must originate from a name')
  }
}

function validateUniqueRelationships(
  relationships: RuntimeRelationship[],
  fail: TopologyFailure,
): void {
  const seenRelationships = new Set<string>()
  for (const relationship of relationships) {
    const key = `${relationship.kind}\0${relationship.from}\0${relationship.to}`
    if (seenRelationships.has(key)) fail('state contains a duplicate relationship')
    seenRelationships.add(key)
  }
}

export function classifyRuntimeTopology(
  state: Pick<RuntimeState, 'entities' | 'relationships'>,
  fail: TopologyFailure = defaultFailure,
): RuntimeTopology {
  const { entities, relationships } = state

  if (relationships.length === 0) {
    if (entities.length === 1 && isDirectValueSource(entities[0])) {
      return { kind: 'direct-value', source: entities[0] }
    }
    if (
      entities.length === 2 &&
      isDirectValueSource(entities[0]) &&
      isDirectValueSource(entities[1])
    ) {
      return { kind: 'direct-values', sources: [entities[0], entities[1]] }
    }
    fail('unsupported runtime topology: expected one or exactly two direct-value variables')
  }

  const entitiesById = new Map(entities.map((entity) => [entity.id, entity]))
  validateUniqueRelationships(relationships, fail)

  const relationshipSources = relationships.map((relationship) =>
    sourceFor(relationship, entitiesById, fail))
  const relationshipTargets = relationships.map((relationship) =>
    targetFor(relationship, entitiesById, fail))

  if (relationships.length === 1) {
    if (entities.length !== 2) {
      fail('unsupported runtime topology: single-target models require exactly one source and one object')
    }
    const source = relationshipSources[0]
    const target = relationshipTargets[0]
    validateRelationshipKind(relationships[0], source, fail)
    return {
      kind: 'single-target',
      sources: [source],
      target,
      relationships: [relationships[0]],
    }
  }

  if (relationships.length !== 2) {
    fail('unsupported runtime topology: shared-target models require exactly two relationships')
  }
  if (new Set(relationships.map(({ to }) => to)).size !== 1) {
    fail('shared-target relationships must target the same object')
  }
  if (entities.length !== 3) {
    fail('unsupported runtime topology: shared-target models require exactly two sources and one object')
  }
  if (new Set(relationships.map(({ from }) => from)).size !== 2) {
    fail('each shared-target source must participate in exactly one relationship')
  }
  if (new Set(relationshipSources.map(({ kind }) => kind)).size !== 1) {
    fail('shared-target sources must use the same semantic kind')
  }
  if (new Set(relationships.map(({ kind }) => kind)).size !== 1) {
    fail('shared-target relationships must use the same semantic kind')
  }
  relationships.forEach((relationship, index) =>
    validateRelationshipKind(relationship, relationshipSources[index], fail))

  const sourceIds = new Set(relationships.map(({ from }) => from))
  const sources = entities.filter(
    (entity): entity is RuntimeSourceEntity =>
      sourceIds.has(entity.id) && (entity.kind === 'variable' || entity.kind === 'name'),
  )
  if (sources.length !== 2) {
    fail('unsupported runtime topology: shared-target sources are incomplete')
  }
  const relationshipsBySource = new Map(
    relationships.map((relationship) => [relationship.from, relationship]),
  )
  return {
    kind: 'shared-target',
    sources: [sources[0], sources[1]],
    target: relationshipTargets[0],
    relationships: [
      relationshipsBySource.get(sources[0].id)!,
      relationshipsBySource.get(sources[1].id)!,
    ],
  }
}

function classifySplitTarget(
  state: Pick<RuntimeState, 'entities' | 'relationships'>,
  fail: TopologyFailure,
): SplitTargetTopology {
  const { entities, relationships } = state
  if (entities.length !== 4) {
    fail('split-target after state requires exactly two sources and two objects')
  }
  if (relationships.length !== 2) {
    fail('split-target after state requires exactly two relationships')
  }
  validateUniqueRelationships(relationships, fail)

  const sources = entities.filter(
    (entity): entity is RuntimeSourceEntity => entity.kind === 'variable' || entity.kind === 'name',
  )
  const targets = entities.filter(
    (entity): entity is RuntimeObjectEntity => entity.kind === 'object',
  )
  if (sources.length !== 2 || targets.length !== 2) {
    fail('split-target after state requires exactly two sources and two objects')
  }
  if (sources.some((source) => source.kind === 'variable' && source.directValue !== undefined)) {
    fail('a direct-value variable cannot also reference an object')
  }

  const entitiesById = new Map(entities.map((entity) => [entity.id, entity]))
  const relationshipSources = relationships.map((relationship) =>
    sourceFor(relationship, entitiesById, fail))
  const relationshipTargets = relationships.map((relationship) =>
    targetFor(relationship, entitiesById, fail))
  relationships.forEach((relationship, index) =>
    validateRelationshipKind(relationship, relationshipSources[index], fail))

  if (new Set(sources.map(({ kind }) => kind)).size !== 1) {
    fail('split-target sources must use the same semantic kind')
  }
  if (new Set(relationships.map(({ kind }) => kind)).size !== 1) {
    fail('split-target relationships must use the same semantic kind')
  }
  if (new Set(relationships.map(({ from }) => from)).size !== 2) {
    fail('each split-target source must participate in exactly one relationship')
  }
  if (new Set(relationships.map(({ to }) => to)).size !== 2) {
    fail('split-target relationships must target different objects')
  }
  if (!sameSet(relationshipSources.map(({ id }) => id), sources.map(({ id }) => id))) {
    fail('each split-target source must participate in exactly one relationship')
  }
  if (!sameSet(relationshipTargets.map(({ id }) => id), targets.map(({ id }) => id))) {
    fail('each split-target object must be targeted exactly once')
  }

  const relationshipsBySource = new Map(
    relationships.map((relationship) => [relationship.from, relationship]),
  )
  return {
    kind: 'split-target',
    sources: [sources[0], sources[1]],
    targets: [targets[0], targets[1]],
    relationships: [
      relationshipsBySource.get(sources[0].id)!,
      relationshipsBySource.get(sources[1].id)!,
    ],
  }
}

function sameSet(left: string[], right: string[]): boolean {
  return left.length === right.length && left.every((value) => right.includes(value))
}

export function classifyRuntimeTransition(
  beforeState: RuntimeState,
  afterState: RuntimeState,
  fail: TopologyFailure = defaultFailure,
): RuntimeTransition {
  const before = classifyRuntimeTopology(beforeState, fail)

  if (before.kind === 'direct-value') {
    const after = classifyRuntimeTopology(afterState, fail)
    if (after.kind !== 'direct-value') {
      fail('direct-value change requires exactly one direct-value variable in both states')
    }
    if (before.source.id !== after.source.id) {
      fail('direct-value change must retain the same variable id')
    }
    if (before.source.label !== after.source.label) {
      fail('direct-value change must retain the variable label')
    }
    if (before.source.directValue.type !== after.source.directValue.type) {
      fail('direct-value change must retain the directValue type')
    }
    if (before.source.directValue.value === after.source.directValue.value) {
      fail('direct-value change must change the value')
    }
    return {
      kind: 'direct-value-change',
      before,
      after,
      changedValues: [{
        id: before.source.id,
        label: before.source.label,
        type: before.source.directValue.type,
        beforeValue: before.source.directValue.value,
        afterValue: after.source.directValue.value,
      }],
    }
  }

  if (before.kind === 'direct-values') {
    const after = classifyRuntimeTopology(afterState, fail)
    if (after.kind !== 'direct-values') {
      fail('direct-values change requires exactly two direct-value variables in both states')
    }
    if (!sameSet(before.sources.map(({ id }) => id), after.sources.map(({ id }) => id))) {
      fail('direct-values change must retain the same variable id set')
    }
    const afterSources = new Map(after.sources.map((source) => [source.id, source]))
    const changedValues = before.sources.flatMap((source): RuntimeDirectValueChange[] => {
      const afterSource = afterSources.get(source.id)!
      if (source.label !== afterSource.label) {
        fail(`direct-value variable "${source.id}" must retain its label`)
      }
      if (source.directValue.type !== afterSource.directValue.type) {
        fail(`direct-value variable "${source.id}" must retain its type`)
      }
      return source.directValue.value === afterSource.directValue.value
        ? []
        : [{
            id: source.id,
            label: source.label,
            type: source.directValue.type,
            beforeValue: source.directValue.value,
            afterValue: afterSource.directValue.value,
          }]
    })
    if (changedValues.length === 0) {
      fail('direct-values change must change at least one value')
    }
    return { kind: 'direct-values-change', before, after, changedValues }
  }

  if (before.kind === 'single-target') {
    const after = classifyRuntimeTopology(afterState, fail)
    if (after.kind !== 'single-target') {
      fail('single scalar rebinding requires single-target topology in both states')
    }
    const beforeSource = before.sources[0]
    const afterSource = after.sources[0]
    if (
      beforeSource.kind !== 'name' ||
      afterSource.kind !== 'name' ||
      before.relationships[0].kind !== 'binding' ||
      after.relationships[0].kind !== 'binding'
    ) {
      fail('before/after runtime models require shared-target topology unless using name/binding scalar rebinding')
    }
    if (beforeSource.id !== afterSource.id) {
      fail('single scalar rebinding must retain the source id')
    }
    if (beforeSource.label !== afterSource.label) {
      fail('single scalar rebinding must retain the source label')
    }
    if (before.target.scalarValue === undefined || after.target.scalarValue === undefined) {
      fail('single scalar rebinding requires scalarValue targets; members are unsupported')
    }
    if (before.target.typeLabel !== after.target.typeLabel) {
      fail('single scalar rebinding must retain the target typeLabel')
    }
    if (before.target.id === after.target.id) {
      fail('single scalar rebinding must use a new target object id')
    }
    if (before.target.scalarValue === after.target.scalarValue) {
      fail('single scalar rebinding must change the scalar value')
    }
    return { kind: 'single-scalar-rebinding', before, after }
  }

  if (before.kind !== 'shared-target') {
    fail('before/after runtime models require a supported transition topology')
  }

  if (afterState.entities.length === 4) {
    const after = classifySplitTarget(afterState, fail)
    const beforeSourceIds = before.sources.map(({ id }) => id)
    const afterSourceIds = after.sources.map(({ id }) => id)
    if (!sameSet(beforeSourceIds, afterSourceIds)) {
      fail('shared-target split must retain the same source id set')
    }

    const afterSources = new Map(after.sources.map((source) => [source.id, source]))
    for (const source of before.sources) {
      const afterSource = afterSources.get(source.id)!
      if (source.kind !== afterSource.kind) {
        fail(`source "${source.id}" must retain its kind across before/after`)
      }
      if (source.label !== afterSource.label) {
        fail(`source "${source.id}" must retain its label across before/after`)
      }
      if (afterSource.kind === 'variable' && afterSource.directValue !== undefined) {
        fail(`source "${source.id}" must not introduce directValue across before/after`)
      }
    }

    const originalTargetAfter = after.targets.find(({ id }) => id === before.target.id)
    if (!originalTargetAfter) {
      fail('shared-target split must retain the original target object id')
    }
    const newTarget = after.targets.find(({ id }) => id !== before.target.id)
    if (!newTarget) fail('shared-target split requires one new target object id')
    if (originalTargetAfter.typeLabel !== before.target.typeLabel) {
      fail('shared-target split must retain the original target object typeLabel')
    }
    if (newTarget.typeLabel !== before.target.typeLabel) {
      fail('shared-target split new target must retain the original target typeLabel')
    }
    if (before.target.members) {
      if (!originalTargetAfter.members || !newTarget.members) {
        fail('shared-target split must retain the member-backed target representation')
      }
      const assertSameMemberSchema = (
        left: RuntimeObjectEntity,
        right: RuntimeObjectEntity,
        context: string,
      ) => {
        const leftMembers = left.members!
        const rightMembers = right.members!
        if (!sameSet(leftMembers.map(({ name }) => name), rightMembers.map(({ name }) => name))) {
          fail(`${context} must retain the same member names`)
        }
        const rightByName = new Map(rightMembers.map((member) => [member.name, member]))
        for (const member of leftMembers) {
          if (rightByName.get(member.name)!.kind !== member.kind) {
            fail(`${context} member "${member.name}" must retain its kind`)
          }
        }
      }
      assertSameMemberSchema(before.target, originalTargetAfter, 'original target')
      assertSameMemberSchema(before.target, newTarget, 'new target')
      const originalAfterMembers = new Map(
        originalTargetAfter.members.map((member) => [member.name, member]),
      )
      for (const member of before.target.members) {
        if (originalAfterMembers.get(member.name)!.value !== member.value) {
          fail('shared-target split must not mutate the original target')
        }
      }
    } else {
      if (
        before.sources[0].kind !== 'name' ||
        before.relationships[0].kind !== 'binding' ||
        originalTargetAfter.scalarValue === undefined ||
        newTarget.scalarValue === undefined ||
        before.target.scalarValue === undefined
      ) {
        fail('scalar shared-target split requires names, bindings, and scalarValue targets')
      }
      if (originalTargetAfter.scalarValue !== before.target.scalarValue) {
        fail('shared-target split must not change the original scalar value')
      }
      if (newTarget.scalarValue === before.target.scalarValue) {
        fail('scalar shared-target split new target must represent a different value')
      }
    }

    const beforeRelationships = new Map(
      before.relationships.map((relationship) => [relationship.from, relationship]),
    )
    const afterRelationships = new Map(
      after.relationships.map((relationship) => [relationship.from, relationship]),
    )
    const stableSources: RuntimeSourceEntity[] = []
    const changedSources: RuntimeSourceEntity[] = []
    for (const source of before.sources) {
      const beforeRelationship = beforeRelationships.get(source.id)!
      const afterRelationship = afterRelationships.get(source.id)!
      if (beforeRelationship.kind !== afterRelationship.kind) {
        fail(`source "${source.id}" must retain its relationship kind across before/after`)
      }
      if (afterRelationship.to === beforeRelationship.to) stableSources.push(source)
      else changedSources.push(source)
    }
    if (stableSources.length !== 1 || changedSources.length !== 1) {
      fail('shared-target split requires exactly one stable source and one changed source')
    }
    const changedRelationship = afterRelationships.get(changedSources[0].id)!
    if (changedRelationship.to !== newTarget.id) {
      fail('the changed source must target the new object')
    }

    return {
      kind: 'shared-target-split',
      before,
      after,
      stableSource: stableSources[0],
      changedSource: changedSources[0],
      originalTargetBefore: before.target,
      originalTargetAfter,
      newTarget,
    }
  }

  const after = classifyRuntimeTopology(afterState, fail)
  if (after.kind !== 'shared-target') {
    fail('before/after runtime models require a supported shared-target transition')
  }
  if (before.target.id !== after.target.id) {
    fail('before/after runtime model must retain the same target object id')
  }
  if (!before.target.members) {
    fail('shared-target mutation requires object members; scalarValue is immutable')
  }
  if (before.target.typeLabel !== after.target.typeLabel) {
    fail('before/after runtime model must retain the target object typeLabel')
  }
  if (!after.target.members) {
    fail('before/after runtime models require object members; scalarValue is unsupported')
  }

  const beforeIds = beforeState.entities.map(({ id }) => id)
  const afterIds = afterState.entities.map(({ id }) => id)
  if (!sameSet(beforeIds, afterIds)) {
    fail('before/after runtime model must retain the same entity id set')
  }
  const afterEntities = new Map(afterState.entities.map((entity) => [entity.id, entity]))
  for (const beforeEntity of beforeState.entities) {
    const afterEntity = afterEntities.get(beforeEntity.id)!
    if (beforeEntity.kind !== afterEntity.kind) {
      fail(`entity "${beforeEntity.id}" must retain its kind across before/after`)
    }
    if (beforeEntity.kind === 'variable' || beforeEntity.kind === 'name') {
      if (afterEntity.kind !== beforeEntity.kind || beforeEntity.label !== afterEntity.label) {
        fail(`source "${beforeEntity.id}" must retain its label across before/after`)
      }
    }
  }

  const relationshipKey = ({ kind, from, to }: RuntimeRelationship) => `${kind}\0${from}\0${to}`
  const beforeRelationships = beforeState.relationships.map(relationshipKey)
  const afterRelationships = afterState.relationships.map(relationshipKey)
  if (!sameSet(beforeRelationships, afterRelationships)) {
    fail('before/after runtime model must retain the same relationship set')
  }

  const afterMembers = new Map(after.target.members.map((member) => [member.name, member]))
  if (!sameSet(
    before.target.members.map(({ name }) => name),
    after.target.members.map(({ name }) => name),
  )) {
    fail('before/after runtime model must retain the same member names')
  }
  const changedMembers = before.target.members.flatMap((member): RuntimeMemberChange[] => {
    const afterMember = afterMembers.get(member.name)!
    if (member.kind !== afterMember.kind) {
      fail(`member "${member.name}" must retain its kind across before/after`)
    }
    return member.value === afterMember.value
      ? []
      : [{ name: member.name, kind: member.kind, beforeValue: member.value, afterValue: afterMember.value }]
  })
  if (changedMembers.length === 0) {
    fail('before/after runtime model must change at least one object member value')
  }
  return { kind: 'shared-target-mutation', before, after, changedMembers }
}
