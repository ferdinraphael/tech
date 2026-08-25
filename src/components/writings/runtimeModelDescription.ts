import type { RuntimeObjectEntity, RuntimeState } from '../../content/writings/types'
import {
  classifyRuntimeTopology,
  classifyRuntimeTransition,
} from '../../content/writings/runtimeModelTopology'

function objectDescription(object: RuntimeObjectEntity): string {
  if (object.scalarValue !== undefined) {
    return ` representing ${object.scalarValue}`
  }
  return ''
}

export function runtimeModelTransitionDescription(
  beforeState: RuntimeState,
  afterState: RuntimeState,
): string {
  const transition = classifyRuntimeTransition(beforeState, afterState)
  if (transition.kind === 'direct-value-change') {
    const { before, after } = transition
    return `Variable ${before.source.label} directly contains the ${before.source.directValue.type} value ${before.source.directValue.value} before the assignment. After the assignment, the same variable directly contains the ${after.source.directValue.type} value ${after.source.directValue.value}.`
  }
  if (transition.kind === 'direct-values-change') {
    const { before, after, changedValues } = transition
    const beforeText = directValuesDescription(before.sources)
    const afterSources = new Map(after.sources.map((source) => [source.id, source]))
    const orderedAfterSources = before.sources.map((source) => afterSources.get(source.id)!)
    const stable = before.sources.filter(
      (source) => !changedValues.some(({ id }) => id === source.id),
    )
    if (stable.length === 1 && changedValues.length === 1) {
      const changed = changedValues[0]
      return `Before the assignment, ${lowercaseSentenceStart(beforeText)} After the assignment, ${stable[0].label} still contains ${afterSources.get(stable[0].id)!.directValue.value} while ${changed.label} directly contains ${changed.afterValue}.`
    }
    return `Before the assignment, ${lowercaseSentenceStart(beforeText)} After the assignment, ${lowercaseSentenceStart(directValuesDescription(orderedAfterSources))}`
  }
  if (transition.kind === 'single-scalar-rebinding') {
    const { before, after } = transition
    return `Before the rebinding, the name ${before.sources[0].label} is bound to ${indefiniteArticle(before.target.typeLabel)} ${before.target.typeLabel} object representing ${before.target.scalarValue}. After the rebinding, ${after.sources[0].label} is bound to a different ${after.target.typeLabel} object representing ${after.target.scalarValue}.`
  }
  if (transition.kind === 'shared-target-split') {
    const { before, stableSource, changedSource, originalTargetAfter, newTarget } = transition
    const labels = `${before.sources[0].label} and ${before.sources[1].label}`
    const isBinding = before.sources[0].kind === 'name'
    const event = isBinding ? 'rebinding' : 'reassignment'
    if (before.target.scalarValue !== undefined) {
      return `Before the ${event}, the names ${labels} are bound to the same ${before.target.typeLabel} object representing ${before.target.scalarValue}. After the ${event}, ${stableSource.label} remains bound to the original ${originalTargetAfter.typeLabel} object representing ${originalTargetAfter.scalarValue}, while ${changedSource.label} is bound to a new ${newTarget.typeLabel} object representing ${newTarget.scalarValue}.`
    }
    const beforeSubject = isBinding
      ? `Before the ${event}, the names ${labels} are bound to the same`
      : `Before the ${event}, variables ${labels} refer to the same`
    const beforeMember = possessiveMemberDescription(before.target)
    const originalMember = compactMemberDescription(originalTargetAfter)
    const newMember = compactMemberDescription(newTarget)
    const afterSubject = isBinding
      ? `After the ${event}, ${stableSource.label} remains bound to the original ${originalTargetAfter.typeLabel} object${originalMember}, while ${changedSource.label} is bound to a new ${newTarget.typeLabel} object${newMember}.`
      : `After the ${event}, ${stableSource.label} still refers to the original ${originalTargetAfter.typeLabel} object${originalMember}, while ${changedSource.label} refers to a new ${newTarget.typeLabel} object${newMember}.`
    return `${beforeSubject} ${before.target.typeLabel} object${beforeMember} ${afterSubject}`
  }
  const { before, after } = transition
  const labels = `${before.sources[0].label} and ${before.sources[1].label}`
  const beforeSubject = before.sources[0].kind === 'name'
    ? `Before the mutation, the names ${labels} are bound to the same`
    : `Before the mutation, variables ${labels} refer to the same`
  const afterSubject = after.sources[0].kind === 'name'
    ? `After the mutation, ${labels} are still bound to the same`
    : `After the mutation, ${labels} still refer to the same`
  return `${beforeSubject} ${before.target.typeLabel} object.${memberDescriptions(before.target)} ${afterSubject} ${after.target.typeLabel} object.${memberDescriptions(after.target)}`
}

function lowercaseSentenceStart(value: string): string {
  return value.charAt(0).toLowerCase() + value.slice(1)
}

function directValuesDescription(
  sources: Array<{ label: string; directValue: { type: string; value: string } }>,
): string {
  const [first, second] = sources
  if (
    first.directValue.type === second.directValue.type &&
    first.directValue.value === second.directValue.value
  ) {
    return `Variables ${first.label} and ${second.label} each directly contain the ${first.directValue.type} value ${first.directValue.value}.`
  }
  return `Variable ${first.label} directly contains the ${first.directValue.type} value ${first.directValue.value}, while variable ${second.label} directly contains the ${second.directValue.type} value ${second.directValue.value}.`
}

function possessiveMemberDescription(object: RuntimeObjectEntity): string {
  const members = object.members ?? []
  return members.length > 0
    ? `, whose ${members.map((member) => `${member.name} ${member.kind} is ${member.value}`).join(' and whose ')}.`
    : '.'
}

function compactMemberDescription(object: RuntimeObjectEntity): string {
  const members = object.members ?? []
  return members.length > 0
    ? ` with ${members.map((member) => `${member.name} ${member.value}`).join(' and ')}`
    : ''
}

function indefiniteArticle(value: string): 'a' | 'an' {
  return /^[aeiou]/i.test(value) ? 'an' : 'a'
}

function memberDescriptions(object: RuntimeObjectEntity): string {
  return (object.members ?? [])
    .map((member) => ` Its ${member.name} ${member.kind} is ${member.value}.`)
    .join('')
}

export function runtimeModelDescription(state: RuntimeState): string {
  const topology = classifyRuntimeTopology(state)
  if (topology.kind === 'direct-value') {
    return `Variable ${topology.source.label} directly contains the ${topology.source.directValue.type} value ${topology.source.directValue.value}.`
  }
  if (topology.kind === 'direct-values') {
    return directValuesDescription(topology.sources)
  }

  const { sources, target } = topology
  if (topology.kind === 'shared-target') {
    const labels = `${sources[0].label} and ${sources[1].label}`
    const subject = sources[0].kind === 'name'
      ? `The names ${labels} are bound to the same`
      : `Variables ${labels} refer to the same`
    return `${subject} ${target.typeLabel} object${objectDescription(target)}.${memberDescriptions(target)}`
  }
  const subject = sources[0].kind === 'name'
    ? `The name ${sources[0].label} is bound to`
    : `Variable ${sources[0].label} refers to`
  return `${subject} ${indefiniteArticle(target.typeLabel)} ${target.typeLabel} object${objectDescription(target)}.${memberDescriptions(target)}`
}
