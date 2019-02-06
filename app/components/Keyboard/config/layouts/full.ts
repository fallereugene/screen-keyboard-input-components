export interface IFullLayouts {
    'ru-normal': string[];
    'ru-shift': string[];
    'en-normal': string[];
    'en-shift': string[];
    'num': string[];
}

const full = {
    'ru-normal': [
        `й ц у к е н г ш щ з х {bksp}`,
        `ф ы в а п р о л д ж э ъ`,
        `{shift:ru-shift} я ч с м и т ь б ю , .`,
        `[123&]{num} {space} [EN]{lang:en-normal} @ {clear}`
    ],
    'ru-shift': [
        `Й Ц У К Е Н Г Ш Щ З Х {bksp}`,
        `Ф Ы В А П Р О Л Д Ж Э Ъ`,
        `{shift:ru-normal} Я Ч С М И Т Ь Б Ю , _`,
        `[123&]{num} {space} [EN]{lang:en-shift} @ {clear}`
    ],
    'en-normal': [
        `q w e r t y u i o p " {bksp}`,
        `a s d f g h j k l = [ ]`,
        `{shift:en-shift} z x c v b n m { } , .`,
        `[123&]{num:param1} {space} [RU]{lang:ru-normal} @ -`
    ],
    'en-shift': [
        `Q W E R T Y U I O P " {bksp}`,
        `A S D F G H J K L = [ ]`,
        `{shift:en-normal} Z X C V B N M { } , .`,
        `[123&]{num} {space} [RU]{lang:ru-shift} @ -`
    ],
    'num': [
        `1 2 3 4 5 6 7 8 9 0 / {bksp}`,
        `! " № $ % ^ & * ( ) = +`,
        `{shift} ~ # € ; : ? ' < > , _`,
        `[123&]{num} {space} [RU]{lang:ru-normal} @ .`

    ]
};

export default full;
