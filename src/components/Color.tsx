const primary = {
  lighter: "hsl(30, 100%, 90%)",
  light: "hsl(30, 100%, 60%)",
  normal: "hsl(30, 100%, 50%)",
};

const secondary = {};

const base = {
  white: "white",
  lightest: "hsl(186, 50%, 99%)",
  lighter: "hsl(186, 50%, 95%)",
  light: "hsl(186, 50%, 90%)",
  normal: "hsl(186, 50%, 50%)",
  dark: "hsl(186, 50%, 30%)",
  darker: "hsl(186, 50%, 20%)",
  black: "hsl(186, 50%, 10%)",
};

export const color = {
  // base
  border_primary: base.light,
  bg_primary: base.lighter,

  border_secondary: base.normal,
  bg_secondary: base.light,

  // component
  border_component: base.light,
  bg_component: base.lightest,

  border_component_active: base.normal,
  bg_component_active: base.white,

  // text
  text: base.darker,
  text_accent: base.dark,

  /* component */
  // button
  button_text: base.white,
  button_bg: base.normal,

  // input
  input_border: base.normal,
  input_border_active: primary.normal,
  input_bg: base.white,
};

