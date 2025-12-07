/**
 * Utilitários para validação de dados
 */

/**
 * Valida email
 */
export const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

/**
 * Valida telefone brasileiro
 * Aceita formatos: (11) 98765-4321, 11987654321, etc
 */
export const validatePhone = (phone: string): boolean => {
    const phoneRegex = /^(\(?\d{2}\)?\s?)?9?\d{4}-?\d{4}$/;
    return phoneRegex.test(phone.replace(/\s/g, ''));
};

/**
 * Valida CPF
 */
export const validateCPF = (cpf: string): boolean => {
    // Remove caracteres não numéricos
    const cleanCPF = cpf.replace(/\D/g, '');

    // Verifica se tem 11 dígitos
    if (cleanCPF.length !== 11) return false;

    // Verifica se todos os dígitos são iguais
    if (/^(\d)\1+$/.test(cleanCPF)) return false;

    // Validação dos dígitos verificadores
    let sum = 0;
    for (let i = 0; i < 9; i++) {
        sum += parseInt(cleanCPF.charAt(i)) * (10 - i);
    }
    let digit = 11 - (sum % 11);
    if (digit >= 10) digit = 0;
    if (digit !== parseInt(cleanCPF.charAt(9))) return false;

    sum = 0;
    for (let i = 0; i < 10; i++) {
        sum += parseInt(cleanCPF.charAt(i)) * (11 - i);
    }
    digit = 11 - (sum % 11);
    if (digit >= 10) digit = 0;
    if (digit !== parseInt(cleanCPF.charAt(10))) return false;

    return true;
};

/**
 * Valida CNS (Cartão Nacional de Saúde)
 */
export const validateCNS = (cns: string): boolean => {
    // Remove caracteres não numéricos
    const cleanCNS = cns.replace(/\D/g, '');

    // CNS deve ter 15 dígitos
    if (cleanCNS.length !== 15) return false;

    // Validação básica (a validação completa é mais complexa)
    // Aceita CNS que começa com 1, 2, 7, 8 ou 9
    const firstDigit = cleanCNS.charAt(0);
    if (!['1', '2', '7', '8', '9'].includes(firstDigit)) return false;

    return true;
};

/**
 * Valida se string não está vazia
 */
export const validateRequired = (value: string): boolean => {
    return value.trim().length > 0;
};

/**
 * Valida tamanho mínimo
 */
export const validateMinLength = (value: string, minLength: number): boolean => {
    return value.length >= minLength;
};

/**
 * Valida tamanho máximo
 */
export const validateMaxLength = (value: string, maxLength: number): boolean => {
    return value.length <= maxLength;
};
