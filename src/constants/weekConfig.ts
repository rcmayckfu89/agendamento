// Configuração dos dias da semana
export const daysOfWeek = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB'];
export const weekDaySlugs = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sab'];

// Mapeamento de slug para índice do dia da semana
export const slugToDayIndex: Record<string, number> = {
    'dom': 0,
    'seg': 1,
    'ter': 2,
    'qua': 3,
    'qui': 4,
    'sex': 5,
    'sab': 6
};

// Mapeamento de índice para slug
export const dayIndexToSlug: Record<number, string> = {
    0: 'dom',
    1: 'seg',
    2: 'ter',
    3: 'qua',
    4: 'qui',
    5: 'sex',
    6: 'sab'
};
