import type {
  RuntimeDirectValue,
  RuntimeEntity,
  RuntimeObjectMember,
  RuntimeRelationship,
  RuntimeState,
} from './types'

type RuntimeModelFailure = (message: string) => never

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function mapping(
  value: unknown,
  context: string,
  fail: RuntimeModelFailure,
): Record<string, unknown> {
  if (!isRecord(value)) fail(`${context} must be a mapping`)
  return value
}

function allowedKeys(
  value: Record<string, unknown>,
  allowed: readonly string[],
  context: string,
  fail: RuntimeModelFailure,
): void {
  const allowedSet = new Set(allowed)
  const unknown = Object.keys(value).find((key) => !allowedSet.has(key))
  if (unknown) fail(`${context} contains unsupported property "${unknown}"`)
}

function nonEmptyString(
  value: unknown,
  context: string,
  fail: RuntimeModelFailure,
): string {
  if (typeof value !== 'string' || value.trim() === '') {
    fail(`${context} must be a non-empty string`)
  }
  return value.trim()
}

function array(
  value: unknown,
  context: string,
  fail: RuntimeModelFailure,
): unknown[] {
  if (!Array.isArray(value)) fail(`${context} must be an array`)
  return value
}

function parseDirectValue(
  value: unknown,
  context: string,
  fail: RuntimeModelFailure,
): RuntimeDirectValue {
  const directValue = mapping(value, context, fail)
  allowedKeys(directValue, ['type', 'value'], context, fail)
  return {
    type: nonEmptyString(directValue.type, `${context}.type`, fail),
    value: nonEmptyString(directValue.value, `${context}.value`, fail),
  }
}

function parseObjectMembers(
  value: unknown,
  context: string,
  fail: RuntimeModelFailure,
): RuntimeObjectMember[] {
  const rawMembers = array(value, context, fail)
  if (rawMembers.length === 0) fail(`${context} must not be empty`)
  const seen = new Set<string>()
  return rawMembers.map((rawMember, index) => {
    const memberContext = `${context}[${index}]`
    const member = mapping(rawMember, memberContext, fail)
    allowedKeys(member, ['name', 'kind', 'value'], memberContext, fail)
    const name = nonEmptyString(member.name, `${memberContext}.name`, fail)
    if (seen.has(name)) fail(`${context} repeats member "${name}"`)
    seen.add(name)
    if (member.kind !== 'field' && member.kind !== 'property') {
      fail(`${memberContext}.kind must be "field" or "property"`)
    }
    return {
      name,
      kind: member.kind,
      value: nonEmptyString(member.value, `${memberContext}.value`, fail),
    }
  })
}

function parseEntity(
  value: unknown,
  index: number,
  fail: RuntimeModelFailure,
): RuntimeEntity {
  const context = `state.entities[${index}]`
  const entity = mapping(value, context, fail)
  const id = nonEmptyString(entity.id, `${context}.id`, fail)

  if (entity.kind === 'variable') {
    allowedKeys(entity, ['id', 'kind', 'label', 'directValue'], context, fail)
    return {
      id,
      kind: 'variable',
      label: nonEmptyString(entity.label, `${context}.label`, fail),
      ...(entity.directValue === undefined
        ? {}
        : { directValue: parseDirectValue(entity.directValue, `${context}.directValue`, fail) }),
    }
  }

  if (entity.kind === 'name') {
    if (entity.directValue !== undefined) {
      fail(`${context}: name entities must not contain directValue`)
    }
    allowedKeys(entity, ['id', 'kind', 'label'], context, fail)
    return {
      id,
      kind: 'name',
      label: nonEmptyString(entity.label, `${context}.label`, fail),
    }
  }

  if (entity.kind === 'object') {
    allowedKeys(entity, ['id', 'kind', 'typeLabel', 'scalarValue', 'fields'], context, fail)
    const scalarValue = entity.scalarValue === undefined
      ? undefined
      : nonEmptyString(entity.scalarValue, `${context}.scalarValue`, fail)
    const fields = entity.fields === undefined
      ? undefined
      : parseObjectMembers(entity.fields, `${context}.fields`, fail)
    if (scalarValue !== undefined && fields !== undefined) {
      fail(`${context} cannot contain both scalarValue and fields in Stage D`)
    }
    if (scalarValue === undefined && fields === undefined) {
      fail(`${context} requires scalarValue or fields in Stage D`)
    }
    return {
      id,
      kind: 'object',
      typeLabel: nonEmptyString(entity.typeLabel, `${context}.typeLabel`, fail),
      ...(scalarValue === undefined ? {} : { scalarValue }),
      ...(fields === undefined ? {} : { fields }),
    }
  }

  fail(`${context}.kind is unsupported`)
}

function parseRelationship(
  value: unknown,
  index: number,
  fail: RuntimeModelFailure,
): RuntimeRelationship {
  const context = `state.relationships[${index}]`
  const relationship = mapping(value, context, fail)
  allowedKeys(relationship, ['kind', 'from', 'to'], context, fail)
  if (relationship.kind !== 'reference' && relationship.kind !== 'binding') {
    fail(`${context}.kind must be "reference" or "binding"`)
  }
  return {
    kind: relationship.kind,
    from: nonEmptyString(relationship.from, `${context}.from`, fail),
    to: nonEmptyString(relationship.to, `${context}.to`, fail),
  }
}

function validateRelationships(
  entities: RuntimeEntity[],
  relationships: RuntimeRelationship[],
  fail: RuntimeModelFailure,
): void {
  const byId = new Map(entities.map((entity) => [entity.id, entity]))
  const seen = new Set<string>()

  for (const relationship of relationships) {
    const key = `${relationship.kind}\0${relationship.from}\0${relationship.to}`
    if (seen.has(key)) fail('state contains a duplicate relationship')
    seen.add(key)
    const source = byId.get(relationship.from)
    const target = byId.get(relationship.to)
    if (!source) fail(`relationship source "${relationship.from}" does not exist`)
    if (!target) fail(`relationship target "${relationship.to}" does not exist`)
    if (relationship.kind === 'reference' && source.kind !== 'variable') {
      fail('reference relationships must originate from a variable')
    }
    if (relationship.kind === 'binding' && source.kind !== 'name') {
      fail('binding relationships must originate from a name')
    }
    if (target.kind !== 'object') {
      fail(`${relationship.kind} relationships must target an object`)
    }
    if (source.kind === 'variable' && source.directValue) {
      fail('a direct-value variable cannot also reference an object in Stage D')
    }
  }

  const targetCounts = new Map<string, number>()
  for (const relationship of relationships) {
    targetCounts.set(relationship.to, (targetCounts.get(relationship.to) ?? 0) + 1)
  }
  if ([...targetCounts.values()].some((count) => count > 1)) {
    fail('shared-target relationships are unsupported in Stage D')
  }
}

function validateTopology(
  entities: RuntimeEntity[],
  relationships: RuntimeRelationship[],
  fail: RuntimeModelFailure,
): void {
  if (relationships.length === 0) {
    if (
      entities.length !== 1 ||
      entities[0].kind !== 'variable' ||
      !entities[0].directValue
    ) {
      fail('unsupported Stage D topology: expected one direct-value variable')
    }
    return
  }

  if (relationships.length !== 1 || entities.length !== 2) {
    fail('unsupported Stage D topology: expected one source and one object')
  }
  const relationship = relationships[0]
  const entityIds = new Set(entities.map(({ id }) => id))
  if (!entityIds.has(relationship.from) || !entityIds.has(relationship.to)) {
    fail('unsupported Stage D topology: unrelated entities are present')
  }
}

export function validateRuntimeModel(
  value: unknown,
  fail: RuntimeModelFailure,
): RuntimeState[] {
  const root = mapping(value, 'model root', fail)
  allowedKeys(root, ['states'], 'model root', fail)
  if (root.states === undefined) fail('model root requires states')
  const rawStates = array(root.states, 'model states', fail)
  if (rawStates.length !== 1) fail('Stage D runtime models require exactly one state')

  const rawState = mapping(rawStates[0], 'state', fail)
  allowedKeys(rawState, ['id', 'label', 'entities', 'relationships'], 'state', fail)
  if (rawState.id !== 'current') fail('Stage D state id must be "current"')
  const label = nonEmptyString(rawState.label, 'state.label', fail)
  const rawEntities = array(rawState.entities, 'state.entities', fail)
  if (rawEntities.length === 0) fail('state.entities must not be empty')
  const entities = rawEntities.map((entity, index) => parseEntity(entity, index, fail))
  const entityIds = new Set<string>()
  for (const entity of entities) {
    if (entityIds.has(entity.id)) fail(`state repeats entity id "${entity.id}"`)
    entityIds.add(entity.id)
  }
  if (rawState.relationships === undefined) fail('state requires relationships')
  const relationships = array(rawState.relationships, 'state.relationships', fail)
    .map((relationship, index) => parseRelationship(relationship, index, fail))

  validateRelationships(entities, relationships, fail)
  validateTopology(entities, relationships, fail)
  return [{ id: 'current', label, entities, relationships }]
}
