export async function getAIInsight({ mood, sleepHours, sleepQuality, triggers, meds, medsTaken, history, exerciseDone, energy, social }) {
  await new Promise(r => setTimeout(r, 800))
  return localInsight({ mood, sleepHours, sleepQuality, triggers, meds, medsTaken, history, exerciseDone, energy, social })
}

function countConsecutive(history) {
  const valid = [...history].reverse()
  let high = 0, low = 0
  for (const v of valid) {
    if (v >= 3) high++; else break
  }
  for (const v of valid) {
    if (v <= -3) low++; else break
  }
  return { high, low }
}

function localInsight({ mood, sleepHours, sleepQuality, triggers, meds, medsTaken, history, exerciseDone, energy, social }) {
  const validHistory = history.filter(v => v !== null && v !== 0)
  const avg = validHistory.length ? validHistory.reduce((a, b) => a + b, 0) / validHistory.length : 0
  const hasRisk = triggers.some(t => t.toLowerCase().includes('álcool') || t.toLowerCase().includes('alcool'))
  const consecutive = countConsecutive(history)
  const allMedsTaken = meds > 0 && medsTaken === meds
  const missedMeds = meds > 0 && medsTaken < meds

  // padrão — agora considera energia e exercício
  let pattern = ''
  if (consecutive.high >= 2) pattern = `Seu humor está elevado há ${consecutive.high} dias seguidos — fique atento a sinais de hipomania como menos necessidade de sono e pensamentos acelerados.`
  else if (consecutive.low >= 2) pattern = `Você está com humor baixo há ${consecutive.low} dias consecutivos. É normal ter dias difíceis, mas vale ficar de olho na duração.`
  else if (exerciseDone && energy >= 4) pattern = 'Ótima combinação hoje: exercício e energia alta. Atividade física é um dos melhores reguladores de humor no transtorno bipolar.'
  else if (exerciseDone && mood <= -1) pattern = 'Você se exercitou mesmo com o humor baixo — isso exige esforço e faz diferença real no seu bem-estar.'
  else if (!exerciseDone && energy <= 2) pattern = 'Energia baixa e sem exercício hoje. Dias assim acontecem — não se cobre demais.'
  else if (Math.abs(avg) < 1.5) pattern = 'Seu humor tem se mantido relativamente estável nos últimos dias — isso é um bom sinal de equilíbrio.'
  else pattern = 'Seu humor oscilou um pouco ao longo da semana, o que é esperado.'

  // alerta — considera sociabilidade e energia
  let alert = ''
  if (hasRisk) {
    alert = 'Álcool foi marcado hoje — ele pode amplificar oscilações de humor no transtorno bipolar, então vale redobrar a atenção.'
  } else if (social === 'isolado' && mood <= -2) {
    alert = 'Isolamento com humor baixo é uma combinação que merece atenção — tente ter pelo menos uma interação breve hoje, mesmo que pequena.'
  } else if (social === 'social' && mood >= 3) {
    alert = 'Muita agitação social combinada com humor elevado pode ser um sinal de hipomania — observe seu ritmo com carinho.'
  } else if (energy >= 5 && sleepHours < 7) {
    alert = 'Muita energia com pouco sono pode indicar um episódio hipomaníaco se persistir — monitore nos próximos dias.'
  } else if (sleepHours < 6) {
    alert = `Com apenas ${sleepHours}h de sono, seu cérebro pode estar mais vulnerável a oscilações — o sono é um dos pilares do equilíbrio bipolar.`
  } else if (sleepHours > 10) {
    alert = `Dormir mais de ${sleepHours}h pode ser sinal de humor baixo ou sedação — vale mencionar isso na próxima consulta.`
  } else if (sleepQuality === 'ruim') {
    alert = 'A qualidade do sono está ruim — tente evitar telas e cafeína à tarde para amanhã ser melhor.'
  } else if (missedMeds) {
    alert = `Você tomou ${medsTaken} de ${meds} medicamento(s) hoje — a regularidade da medicação é fundamental no manejo do transtorno bipolar.`
  } else if (mood >= 3) {
    alert = 'Humor bastante elevado hoje — observe se está dormindo menos ou sentindo mais energia do que o normal.'
  } else if (mood <= -3) {
    alert = 'Humor bem baixo hoje. Você não está sozinho — se isso persistir, considera conversar com seu psiquiatra.'
  } else {
    alert = allMedsTaken ? 'Medicação em dia — ótimo! Isso faz toda a diferença no longo prazo.' : 'Tente manter a rotina de sono e medicação nos próximos dias.'
  }

  // ação — considera exercício
  let action = ''
  if (hasRisk) {
    action = 'Para hoje: hidrate-se bem e evite ambientes que estimulem o consumo.'
  } else if (mood >= 3 && !exerciseDone) {
    action = 'Para hoje: um exercício leve como caminhada pode ajudar a canalizar a energia de forma saudável.'
  } else if (mood <= -3 && !exerciseDone) {
    action = 'Para hoje: tente sair por 10 minutos — luz natural e movimento ajudam o humor mesmo quando parece difícil.'
  } else if (exerciseDone) {
    action = 'Para hoje: bom trabalho com o exercício! Agora cuide do descanso — recuperação também conta.'
  } else if (sleepHours < 6) {
    action = 'Para hoje: tente ir para a cama 30 minutos mais cedo que o usual.'
  } else if (energy <= 2 && !exerciseDone) {
    action = 'Para hoje: uma caminhada curta pode ajudar a recuperar a energia — não precisa ser intensa.'
  } else {
    action = 'Para hoje: mantenha sua rotina — ela é sua âncora.'
  }

  return `${pattern} ${alert} ${action}`
}
