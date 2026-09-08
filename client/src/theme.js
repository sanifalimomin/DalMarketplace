import { createTheme } from "@mui/material/styles";

const fontFamily = '"Inter", system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif';

const theme = createTheme({
  palette: {
    primary: { main: "#1a1a1a" },
    background: { default: "#f2f2f2" },
  },
  shape: { borderRadius: 8 },
  typography: {
    fontFamily,
    button: { textTransform: "none", fontWeight: 600 },
  },
});

export default theme;
