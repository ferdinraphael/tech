import type { RuntimeObjectEntity, RuntimeState } from '../../content/writings/types'

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
  return (object.fields ?? [])
    .map((member) => ` Its ${member.name} ${member.kind} is ${member.value}.`)
    .join('')
}

export function runtimeModelDescription(state: RuntimeState): string {
  if (state.relationships.length === 0) {
    const variable = state.entities.find((entity) => entity.kind === 'variable')
    if (!variable || variable.kind !== 'variable' || !variable.directValue) {
      throw new Error('Direct runtime model is missing its value variable')
    }
    return `Variable ${variable.label} directly contains the ${variable.directValue.type} value ${variable.directValue.value}.`
  }

  const relationship = state.relationships[0]
  const source = state.entities.find((entity) => entity.id === relationship.from)
  const target = state.entities.find((entity) => entity.id === relationship.to)
  if (!source || !target || target.kind !== 'object') {
    throw new Error('Runtime model relationship is incomplete')
  }
  if (source.kind !== 'name' && source.kind !== 'variable') {
    throw new Error('Runtime model relationship source is invalid')
  }
  const subject = source.kind === 'name'
    ? `The name ${source.label} is bound to`
    : `Variable ${source.label} refers to`
  return `${subject} ${indefiniteArticle(target.typeLabel)} ${target.typeLabel} object${objectDescription(target)}.${memberDescriptions(target)}`
}
