/**
 * Utilitários para cores e estilos
 */

/**
 * Mapeamento de cores para classes Tailwind
 */
export const colorClassMap = {
    violet: {
        borderHover: 'hover:border-violet-400',
        textGroupHover: 'group-hover:text-violet-500',
        ring: 'text-violet-500'
    },
    green: {
        borderHover: 'hover:border-green-400',
        textGroupHover: 'group-hover:text-green-500',
        ring: 'text-green-500'
    },
    sky: {
        borderHover: 'hover:border-sky-400',
        textGroupHover: 'group-hover:text-sky-500',
        ring: 'text-sky-500'
    },
    destructive: {
        borderHover: 'hover:border-destructive/70',
        textGroupHover: '',
        ring: 'text-destructive'
    }
};

/**
 * Obtém classes de cor para um componente
 */
export const getColorClasses = (colorName: string) => {
    return colorClassMap[colorName as keyof typeof colorClassMap] || colorClassMap.violet;
};

/**
 * Lista de cores disponíveis para avatares
 */
export const avatarColors = [
    'primary',
    'violet',
    'green',
    'sky',
    'amber',
    'rose',
    'indigo'
];

/**
 * Gera estilo de avatar baseado na cor
 */
export const getAvatarStyle = (color: string) => {
    const colorMap: Record<string, { bg: string; text: string; ring: string }> = {
        'primary': { bg: 'bg-primary/10', text: 'text-primary', ring: 'ring-primary/20' },
        'violet': { bg: 'bg-violet-100', text: 'text-violet-700', ring: 'ring-violet-200' },
        'green': { bg: 'bg-green-100', text: 'text-green-700', ring: 'ring-green-200' },
        'sky': { bg: 'bg-sky-100', text: 'text-sky-700', ring: 'ring-sky-200' },
        'amber': { bg: 'bg-amber-100', text: 'text-amber-700', ring: 'ring-amber-200' },
        'rose': { bg: 'bg-rose-100', text: 'text-rose-700', ring: 'ring-rose-200' },
        'indigo': { bg: 'bg-indigo-100', text: 'text-indigo-700', ring: 'ring-indigo-200' }
    };
    return colorMap[color] || colorMap['primary'];
};

/**
 * Seleciona cor aleatória da lista de cores de avatar
 */
export const getRandomAvatarColor = (): string => {
    return avatarColors[Math.floor(Math.random() * avatarColors.length)];
};
