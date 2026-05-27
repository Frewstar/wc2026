/** ISO 3166 codes for flagcdn.com (supports gb-eng, gb-sct) */
export const TEAM_FLAG_CODES: Record<string, string> = {
  'Algeria': 'dz',
  'Argentina': 'ar',
  'Australia': 'au',
  'Austria': 'at',
  'Belgium': 'be',
  'Bosnia & Herzegovina': 'ba',
  'Brazil': 'br',
  'Canada': 'ca',
  'Cape Verde': 'cv',
  'Colombia': 'co',
  'Croatia': 'hr',
  'Curaçao': 'cw',
  'Czechia': 'cz',
  'DR Congo': 'cd',
  'Ecuador': 'ec',
  'Egypt': 'eg',
  'England': 'gb-eng',
  'France': 'fr',
  'Germany': 'de',
  'Ghana': 'gh',
  'Haiti': 'ht',
  'Iran': 'ir',
  'Iraq': 'iq',
  'Ivory Coast': 'ci',
  'Japan': 'jp',
  'Jordan': 'jo',
  'Mexico': 'mx',
  'Morocco': 'ma',
  'Netherlands': 'nl',
  'New Zealand': 'nz',
  'Norway': 'no',
  'Panama': 'pa',
  'Paraguay': 'py',
  'Portugal': 'pt',
  'Qatar': 'qa',
  'Saudi Arabia': 'sa',
  'Scotland': 'gb-sct',
  'Senegal': 'sn',
  'South Africa': 'za',
  'South Korea': 'kr',
  'Spain': 'es',
  'Sweden': 'se',
  'Switzerland': 'ch',
  'Tunisia': 'tn',
  'Türkiye': 'tr',
  'Uruguay': 'uy',
  'USA': 'us',
  'Uzbekistan': 'uz',
}

export function getTeamFlagCode(team: string): string | null {
  return TEAM_FLAG_CODES[team] ?? null
}

export function getTeamFlagUrl(team: string, width = 40): string | null {
  const code = getTeamFlagCode(team)
  if (!code) return null
  return `https://flagcdn.com/w${width}/${code}.png`
}
