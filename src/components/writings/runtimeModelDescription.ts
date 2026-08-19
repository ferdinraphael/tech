import type { RuntimeObjectEntity, RuntimeState } from '../../content/writings/types'
import { classifyRuntimeTopology } from '../../content/writings/runtimeModelTopology'

function objectDescription(object: RuntimeObjectEntity): string {
  if (object.scalarValue !== undefined) {
    return ` representing ${object.scalarValue}`
  }
  return ''
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
