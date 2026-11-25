
export interface ApplicationStateInfo {
    description: string;
    nextStep: string;
    responsibleRole: 'students' | 'referents' | 'staff' | null;
    severity: 'success' | 'info' | 'warn' | 'danger' | 'secondary';
}

export const APPLICATION_STATES: Record<string, ApplicationStateInfo> = {

    'created': {
        description:
            'L’Application è stata creata e deve ancora essere sottoposta alla valutazione del referente.',
        nextStep:
            'Caricare il Learning Agreement.',
        responsibleRole: 'students',
        severity: 'info'
    },

    'awaiting learning agreement approval by referent': {
        description:
            'Il Learning Agreement è in attesa della valutazione accademica del referente.',
        nextStep:
            'Il referente deve approvare o rifiutare il Learning Agreement.',
        responsibleRole: 'referents',
        severity: 'warn'
    },

    'rejected by referent': {
        description:
            'Il referente ha rifiutato il Learning Agreement.',
        nextStep:
            'Modificare il piano di studi e caricare un nuovo Learning Agreement.',
        responsibleRole: 'students',
        severity: 'danger'
    },

    'awaiting learning agreement approval by staff': {
        description:
            'Il referente ha approvato il Learning Agreement.',
        nextStep:
            'Lo staff deve verificare e completare la fase pre-partenza.',
        responsibleRole: 'staff',
        severity: 'warn'
    },

    'pre departure completed': {
        description:
            'La fase pre-partenza è stata completata.',
        nextStep:
            'Avviare la mobilità e inserire le date effettive.',
        responsibleRole: 'students',
        severity: 'success'
    },

    'mobility in progress': {
        description:
            'La mobilità presso l’università ospitante è in corso.',
        nextStep:
            'Aggiornare le date di mobilità ed eventualmente modificare il piano di studi.',
        responsibleRole: 'students',
        severity: 'success'
    },

    'awaiting changes approval': {
        description:
            'È stata proposta una modifica del piano di studi.',
        nextStep:
            'Il referente deve valutare le modifiche proposte.',
        responsibleRole: 'referents',
        severity: 'warn'
    },

    'getting exam score': {
        description:
            'La mobilità è terminata ed è necessario completare i risultati degli esami.',
        nextStep:
            'Inserire voti e date degli esami e caricare il Transcript of Records.',
        responsibleRole: 'students',
        severity: 'info'
    },

    'waiting exam score approval by referent': {
        description:
            'I risultati degli esami sono in attesa di valutazione.',
        nextStep:
            'Il referente deve approvare gli esami e i relativi voti.',
        responsibleRole: 'referents',
        severity: 'warn'
    },

    'waiting exam score approval by staff': {
        description:
            'Il referente ha completato la valutazione degli esami.',
        nextStep:
            'Lo staff deve verificare e chiudere l’Application.',
        responsibleRole: 'staff',
        severity: 'warn'
    },

    'closed': {
        description:
            'La procedura di mobilità è stata completata.',
        nextStep:
            'È possibile consultare le informazioni e i documenti.',
        responsibleRole: null,
        severity: 'success'
    },

    'canceled': {
        description:
            'L’Application è stata annullata.',
        nextStep:
            'Nessuna operazione richiesta.',
        responsibleRole: null,
        severity: 'danger'
    }
};

export function normalizeApplicationState(state: string): string {
    return state
        .trim()
        .replace(/;+$/, '')
        .trim()
        .replace(/\s+/g, ' ')
        .toLowerCase();
}

export function getApplicationStateInfo(
    state: string
): ApplicationStateInfo {

    return APPLICATION_STATES[normalizeApplicationState(state)] ?? {
        description: 'Stato dell’Application non riconosciuto.',
        nextStep: 'Nessuna indicazione disponibile.',
        responsibleRole: null,
        severity: 'secondary'
    };
}
