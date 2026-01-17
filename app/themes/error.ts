const themes = {
  /* =======================
     LIGHT (WHITE) THEMES
  ======================= */

  redWhite: {
    background: '254 226 226',
    text: '153 27 27',
    border: '252 165 165',
    iconColor: '220 38 38',
    gradient: {
      from: '252 165 165',
      to: '248 113 113',
    },
    pointColor: '220 38 38',
  },

  orangeWhite: {
    background: '255 237 213',
    text: '154 52 18',
    border: '253 186 116',
    iconColor: '234 88 12',
    gradient: {
      from: '253 186 116',
      to: '251 146 60',
    },
    pointColor: '234 88 12',
  },

  yellowWhite: {
    background: '254 249 195',
    text: '133 77 14',
    border: '253 224 71',
    iconColor: '202 138 4',
    gradient: {
      from: '253 224 71',
      to: '250 204 21',
    },
    pointColor: '202 138 4',
  },

  greenWhite: {
    background: '220 252 231',
    text: '22 101 52',
    border: '134 239 172',
    iconColor: '22 163 74',
    gradient: {
      from: '134 239 172',
      to: '74 222 128',
    },
    pointColor: '22 163 74',
  },

  blueWhite: {
    background: '219 234 254',
    text: '30 64 175',
    border: '147 197 253',
    iconColor: '37 99 235',
    gradient: {
      from: '147 197 253',
      to: '96 165 250',
    },
    pointColor: '37 99 235',
  },

  grayWhite: {
    background: '243 244 246',
    text: '55 65 81',
    border: '209 213 219',
    iconColor: '107 114 128',
    gradient: {
      from: '209 213 219',
      to: '156 163 175',
    },
    pointColor: '107 114 128',
  },

  /* =======================
     DARK THEMES
  ======================= */

  redDark: {
    background: '69 10 10',
    text: '254 226 226',
    border: '127 29 29',
    iconColor: '248 113 113',
    gradient: {
      from: '127 29 29',
      to: '185 28 28',
    },
    pointColor: '252 165 165',
  },

  orangeDark: {
    background: '67 20 7',
    text: '255 237 213',
    border: '124 45 18',
    iconColor: '251 146 60',
    gradient: {
      from: '124 45 18',
      to: '194 65 12',
    },
    pointColor: '253 186 116',
  },

  yellowDark: {
    background: '66 32 6',
    text: '254 249 195',
    border: '113 63 18',
    iconColor: '250 204 21',
    gradient: {
      from: '113 63 18',
      to: '161 98 7',
    },
    pointColor: '253 224 71',
  },

  greenDark: {
    background: '6 46 22',
    text: '220 252 231',
    border: '20 83 45',
    iconColor: '74 222 128',
    gradient: {
      from: '20 83 45',
      to: '22 163 74',
    },
    pointColor: '134 239 172',
  },

  blueDark: {
    background: '23 37 84',
    text: '219 234 254',
    border: '30 58 138',
    iconColor: '96 165 250',
    gradient: {
      from: '30 58 138',
      to: '37 99 235',
    },
    pointColor: '147 197 253',
  },

  grayDark: {
    background: '17 24 39',
    text: '243 244 246',
    border: '55 65 81',
    iconColor: '156 163 175',
    gradient: {
      from: '55 65 81',
      to: '107 114 128',
    },
    pointColor: '209 213 219',
  },

  /* =======================
     MAIN (UNCHANGED)
  ======================= */

  main: {
    background: '30 41 59',
    text: '255 255 255',
    border: '71 85 105',
    iconColor: '255 255 255',
    gradient: {
      from: '51 65 85',
      to: '71 85 105',
    },
    pointColor: '251 191 36',
  },
}


export default themes
export type ThemeName = keyof typeof themes
export type Theme = typeof themes[ThemeName]