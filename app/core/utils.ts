export const createRootElementIn = (targetEl: HTMLElement): HTMLElement => {
    const rootEl = document.createElement('div');
    rootEl.id = 'root';
    targetEl.appendChild(rootEl);

    return rootEl;
};

export const createStringFromSymbol = (e: string | number): string => {
    let symbolBolToModel;
    switch (e) {
        case ' ':
            symbolBolToModel = '\u00A0';
            break;
        case '&nbsp;':
            symbolBolToModel = '\u00A0';
            break;
        case '&lt;':
            symbolBolToModel = '<';
            break;
        case '&gt;':
            symbolBolToModel = '>';
            break;
        case '&amp;':
            symbolBolToModel = '&';
            break;
        default:
            symbolBolToModel = e;
            break;
    }
    return symbolBolToModel;
};

