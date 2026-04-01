const primary = '#97BD11';
const backgrounds = {
  bg1: '#DBDBDB',
  bg2: '#E8EDED',
  bg3: '#F6F8F8',
  bg4: '#FFFFFF',
};
const semanticColors = {
  danger: '#DE1E1E',
  info: '#2B6CEE',
  success: '#37B24D',
  warning: '#DE7A16',
};
const texts = {
  text1: '#1A2021',
  text2: '#535859',
  text3: '#989B9B',
};

export const theme = {
  components: {
    Card: {
      colorBorderSecondary: backgrounds.bg1,
    },
    Checkbox: {
      colorBgContainerDisabled: backgrounds.bg3,
      colorBorder: texts.text3,
      colorBorderDisabled: backgrounds.bg2,
      colorTextDisabled: texts.text3,
    },
    DatePicker: {
      cellBgDisabled: backgrounds.bg3,
      colorBorder: backgrounds.bg1,
      colorBorderDisabled: backgrounds.bg1,
      colorErrorBorder: semanticColors.danger,
      colorTextDisabled: texts.text3,
    },
    Input: {
      colorBorder: backgrounds.bg1,
      colorBorderDisabled: backgrounds.bg1,
      colorErrorBorder: semanticColors.danger,
    },
    Radio: {
      colorBorder: texts.text3,
    },
    Select: {
      colorBorder: backgrounds.bg1,
      colorBorderDisabled: backgrounds.bg1,
      colorErrorBorder: semanticColors.danger,
    },
    Table: {
      borderColor: backgrounds.bg1,
    },
  },
  token: {
    colorPrimary: primary,
    colorSuccess: semanticColors.success,
    colorError: semanticColors.danger,
    colorInfo: semanticColors.info,
    colorWarning: semanticColors.warning,
    colorText: texts.text1,
    colorTextSecondary: texts.text2,
    colorTextPlaceholder: texts.text3,
  },
};
