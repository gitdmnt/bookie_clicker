export const componentStyle = {
  container: {
    init: {
      height: "100vh",
      paddingBlock: "8rem",
      display: "grid",
      gridTemplateColumns: "repeat(3, 1fr)",
      gridTemplateRows: "2fr 1fr",
      gap: "0rem",
    },
    usual: {
      minHeight: "100vh",
      display: "grid",
      gridTemplateColumns: "1fr 3fr",
      paddingBlock: "6rem",
    },
  },

  title: {
    init: {
      gridCol: "1 / 3",
      gridRow: "1 / 2",
      justifySelf: "end",
      fontWeight: "bold",
    },
    usual: {
      display: "none",
    },
  },
  index: {
    init: {
      gridRow: "2 / 3",
      fontSize: "1.5rem",
      lineHeight: "2rem",
    },
    usual: {
      gridRow: "1 / 2",
      fontSize: "1rem",
      lineHeight: "1.5rem",
    },
  },
};

