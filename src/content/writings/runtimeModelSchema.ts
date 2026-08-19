import type {
  RuntimeDirectValue,
  RuntimeEntity,
  RuntimeObjectMember,
  RuntimeRelationship,
  RuntimeState,
  RuntimeStateId,
  RuntimeStateSequence,
} from './types'
import { classifyRuntimeTopology, classifyRuntimeTransition } from './runtimeModelTopology'

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
    allowedKeys(entity, ['id', 'kind', 'typeLabel', 'scalarValue', 'members'], context, fail)
    const scalarValue = entity.scalarValue === undefined
      ? undefined
      : nonEmptyString(entity.scalarValue, `${context}.scalarValue`, fail)
    const members = entity.members === undefined
      ? undefined
      : parseObjectMembers(entity.members, `${context}.members`, fail)
    if (scalarValue !== undefined && members !== undefined) {
      fail(`${context} cannot contain both scalarValue and members`)
    }
    if (scalarValue === undefined && members === undefined) {
      fail(`${context} requires scalarValue or members`)
    }
    return {
      id,
      kind: 'object',
      typeLabel: nonEmptyString(entity.typeLabel, `${context}.typeLabel`, fail),
      ...(scalarValue === undefined ? {} : { scalarValue }),
      ...(members === undefined ? {} : { members }),
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

function parseState(value: unknown, fail: RuntimeModelFailure): RuntimeState {
  const rawState = mapping(value, 'state', fail)
  allowedKeys(rawState, ['id', 'label', 'entities', 'relationships'], 'state', fail)
  if (rawState.id !== 'current' && rawState.id !== 'before' && rawState.id !== 'after') {
    fail('runtime-model state id must be "current", "before", or "after"')
  }
  const id: RuntimeStateId = rawState.id
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

  return { id, label, entities, relationships }
}

export function validateRuntimeModel(
  value: unknown,
  fail: RuntimeModelFailure,
): RuntimeStateSequence {
  const root = mapping(value, 'model root', fail)
  allowedKeys(root, ['states'], 'model root', fail)
  if (root.states === undefined) fail('model root requires states')
  const rawStates = array(root.states, 'model states', fail)
  if (rawStates.length !== 1 && rawStates.length !== 2) {
    fail('runtime models require either one current state or exactly before and after states')
  }
  const states = rawStates.map((state) => parseState(state, fail))
  if (states.length === 1) {
    if (states[0].id !== 'current') fail('single-state runtime models require id "current"')
    classifyRuntimeTopology(states[0], fail)
    return [states[0]]
  }
  const before = states.find(({ id }) => id === 'before')
  const after = states.find(({ id }) => id === 'after')
  if (!before || !after) {
    fail('two-state runtime models require exactly one "before" and one "after" state')
  }
  classifyRuntimeTransition(before, after, fail)
  return [before, after]
}
