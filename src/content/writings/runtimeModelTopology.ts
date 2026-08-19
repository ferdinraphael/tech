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

export function classifyRuntimeTopology(
  state: Pick<RuntimeState, 'entities' | 'relationships'>,
  fail: TopologyFailure = defaultFailure,
): RuntimeTopology {
  const { entities, relationships } = state

  if (relationships.length === 0) {
    const source = entities[0]
    if (
      entities.length !== 1 ||
      !isDirectValueSource(source)
    ) {
      fail('unsupported runtime topology: expected one direct-value variable')
    }
    return { kind: 'direct-value', source }
  }

  const entitiesById = new Map(entities.map((entity) => [entity.id, entity]))
  const seenRelationships = new Set<string>()
  for (const relationship of relationships) {
    const key = `${relationship.kind}\0${relationship.from}\0${relationship.to}`
    if (seenRelationships.has(key)) fail('state contains a duplicate relationship')
    seenRelationships.add(key)
  }

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
