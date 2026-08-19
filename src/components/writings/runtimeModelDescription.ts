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
  if (transition.kind === 'shared-target-split') {
    const { before, stableSource, changedSource, originalTargetAfter, newTarget } = transition
    const labels = `${before.sources[0].label} and ${before.sources[1].label}`
    const isBinding = before.sources[0].kind === 'name'
    const event = isBinding ? 'rebinding' : 'reassignment'
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
