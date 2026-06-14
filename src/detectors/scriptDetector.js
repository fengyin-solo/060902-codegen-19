const scriptDetector = {
  name: 'script',
  label: '剧本指数',
  description: '评估对话的戏剧性和故事性',

  detect(conversation) {
    const messages = conversation.messages
    if (messages.length < 4) {
      return { score: 0, tags: [] }
    }

    let score = 0
    const tags = []

    const sentimentShifts = countSentimentShifts(messages)
    if (sentimentShifts >= 3) score += 25
    else if (sentimentShifts >= 2) score += 15
    else if (sentimentShifts >= 1) score += 8

    const timeGaps = findTimeGaps(messages)
    if (timeGaps >= 2) score += 15
    else if (timeGaps >= 1) score += 8

    const interactionRate = calcInteractionRate(messages)
    if (interactionRate >= 0.7) score += 20
    else if (interactionRate >= 0.5) score += 10

    const emotionalKeywords = countEmotionalKeywords(messages)
    if (emotionalKeywords >= 4) score += 20
    else if (emotionalKeywords >= 2) score += 10

    if (sentimentShifts >= 2) tags.push(`剧情反转 ×${sentimentShifts}`)
    if (timeGaps >= 1) tags.push('时间跨度')
    if (emotionalKeywords >= 3) tags.push('情感丰富')
    if (interactionRate >= 0.5) tags.push('互动紧密')

    return { score, tags }
  }
}

function countSentimentShifts(messages) {
  let shifts = 0
  const positivePattern = /想你|爱|喜欢|开心|好呀|好的|么么|亲|抱抱|晚安|梦见|甜蜜|幸福/i
  const negativePattern = /对不起|抱歉|哼|不理|生气|讨厌|笨|死|绝交|错了|不要|伤心/i

  let prevSentiment = null
  for (const msg of messages) {
    if (!msg.body) continue
    let current = null
    if (positivePattern.test(msg.body)) current = 'positive'
    else if (negativePattern.test(msg.body)) current = 'negative'
    if (current && prevSentiment && current !== prevSentiment) {
      shifts++
    }
    if (current) prevSentiment = current
  }
  return shifts
}

function findTimeGaps(messages) {
  let gaps = 0
  for (let i = 1; i < messages.length; i++) {
    const diff = messages[i].date - messages[i - 1].date
    if (diff > 86400000) gaps++
  }
  return gaps
}

function calcInteractionRate(messages) {
  if (messages.length < 2) return 0
  let backAndForth = 0
  for (let i = 1; i < messages.length; i++) {
    if (messages[i].isSent !== messages[i - 1].isSent) backAndForth++
  }
  return backAndForth / messages.length
}

function countEmotionalKeywords(messages) {
  const pattern = /想你|爱|喜欢|晚安|对不起|抱歉|哼|生气|讨厌|笨|错了|抱抱|么么|亲|开心|幸福|梦见/i
  let count = 0
  for (const msg of messages) {
    if (msg.body && pattern.test(msg.body)) count++
  }
  return count
}

export function generateScript(loveLetter) {
  const messages = loveLetter.conversation.messages
  if (messages.length < 3) return null

  const total = messages.length
  const acts = partitionIntoActs(messages, total)
  const title = generateTitle(loveLetter)
  const synopsis = generateSynopsis(loveLetter, acts)

  return {
    id: 'script-' + loveLetter.conversation.id,
    title,
    synopsis,
    conversationId: loveLetter.conversation.id,
    conversationName: loveLetter.conversation.name,
    loveScore: loveLetter.loveScore,
    tags: loveLetter.tags,
    acts,
    totalMessages: total,
    createdAt: Date.now()
  }
}

function partitionIntoActs(messages, total) {
  if (total <= 5) {
    return [
      buildAct(messages, 0, Math.ceil(total * 0.4), 'opening', '开场'),
      buildAct(messages, Math.ceil(total * 0.4), Math.ceil(total * 0.7), 'turning', '转折'),
      buildAct(messages, Math.ceil(total * 0.7), total, 'ending', '结尾')
    ]
  }

  const turningPointIdx = findTurningPoint(messages)
  const openingEnd = Math.min(turningPointIdx, Math.ceil(total * 0.5))
  const endingStart = Math.max(turningPointIdx + 1, Math.floor(total * 0.7))

  return [
    buildAct(messages, 0, openingEnd, 'opening', '开场'),
    buildAct(messages, openingEnd, endingStart, 'turning', '转折'),
    buildAct(messages, endingStart, total, 'ending', '结尾')
  ]
}

function findTurningPoint(messages) {
  let maxShift = 0
  let turningIdx = Math.floor(messages.length / 2)

  const positivePattern = /想你|爱|喜欢|开心|好呀|好的|么么|亲|抱抱|晚安/i
  const negativePattern = /对不起|抱歉|哼|不理|生气|讨厌|笨|死|绝交|错了|不要/i

  for (let i = 2; i < messages.length - 2; i++) {
    const before = messages.slice(0, i)
    const after = messages.slice(i)

    let posBefore = 0, negBefore = 0, posAfter = 0, negAfter = 0
    for (const m of before) {
      if (!m.body) continue
      if (positivePattern.test(m.body)) posBefore++
      if (negativePattern.test(m.body)) negBefore++
    }
    for (const m of after) {
      if (!m.body) continue
      if (positivePattern.test(m.body)) posAfter++
      if (negativePattern.test(m.body)) negAfter++
    }

    const sentimentBefore = posBefore - negBefore
    const sentimentAfter = posAfter - negAfter
    const shift = Math.abs(sentimentAfter - sentimentBefore)

    if (shift > maxShift) {
      maxShift = shift
      turningIdx = i
    }
  }

  return turningIdx
}

function buildAct(messages, start, end, type, label) {
  const actMessages = messages.slice(start, end)
  const narrative = generateNarrative(actMessages, type)

  return {
    type,
    label,
    actIcon: type === 'opening' ? '🎬' : type === 'turning' ? '⚡' : '🌙',
    narrative,
    messages: actMessages.map(msg => ({
      ...msg,
      originalIndex: messages.indexOf(msg)
    })),
    messageRange: { start, end: end - 1 },
    startTime: actMessages.length > 0 ? actMessages[0].date : null,
    endTime: actMessages.length > 0 ? actMessages[actMessages.length - 1].date : null
  }
}

function generateNarrative(messages, actType) {
  if (messages.length === 0) return ''

  const bodies = messages.filter(m => m.body).map(m => m.body)

  if (actType === 'opening') {
    const firstMsg = bodies[0] || ''
    if (/晚安|早上|早安|嗨|嘿|在吗/i.test(firstMsg)) {
      return '故事从一条日常的问候开始……'
    }
    if (/想|爱|喜欢/i.test(firstMsg)) {
      return '故事的起点，是藏不住的心意……'
    }
    return '一段关系的序幕，悄然拉开……'
  }

  if (actType === 'turning') {
    const hasConflict = messages.some(m => m.body && /对不起|抱歉|生气|吵架|哼|不理/i.test(m.body))
    const hasConfession = messages.some(m => m.body && /想你|爱你|喜欢你|喜欢你/i.test(m.body))
    if (hasConflict) {
      return '风雨来临，感情迎来考验……'
    }
    if (hasConfession) {
      return '情意翻涌，心防开始松动……'
    }
    return '故事在这里拐了个弯……'
  }

  if (actType === 'ending') {
    const hasReconcile = messages.some(m => m.body && /好呀|好的|原谅|和好|么么|抱抱/i.test(m.body))
    const hasGoodbye = messages.some(m => m.body && /晚安|梦里|明天见|再见/i.test(m.body))
    if (hasReconcile) {
      return '雨过天晴，两颗心靠得更近了。'
    }
    if (hasGoodbye) {
      return '夜深了，但故事还没有结束……'
    }
    return '在这个节点，一切有了新的意义。'
  }

  return ''
}

function generateTitle(loveLetter) {
  const tags = loveLetter.tags.join('')
  const name = loveLetter.conversation.name

  if (tags.includes('冤家') || tags.includes('争吵')) return `《${name}：欢喜冤家》`
  if (tags.includes('撒娇') || tags.includes('可爱')) return `《${name}：甜蜜日常》`
  if (tags.includes('想念') || tags.includes('思念')) return `《${name}：思念成书》`
  if (tags.includes('爱意') || tags.includes('双向奔赴')) return `《${name}：双向奔赴》`
  return `《${name}：时光情书》`
}

function generateSynopsis(loveLetter, acts) {
  const opening = acts.find(a => a.type === 'opening')
  const turning = acts.find(a => a.type === 'turning')
  const ending = acts.find(a => a.type === 'ending')

  const parts = []
  if (opening) parts.push(opening.narrative)
  if (turning) parts.push(turning.narrative)
  if (ending) parts.push(ending.narrative)

  return parts.join(' → ')
}

export function generateAllScripts(loveLetters) {
  return loveLetters
    .filter(l => l.totalScore > 10 && l.conversation.messages.length >= 4)
    .map(l => generateScript(l))
    .filter(Boolean)
    .sort((a, b) => b.loveScore - a.loveScore)
}

export default scriptDetector
