import { createTheme } from "@mui/material/styles";
import type {} from "@mui/x-data-grid/themeAugmentation";

export const theme = createTheme({
  palette: {
    primary: { main: "#1976D2" },
    success: { main: "#2E7D32" },
    warning: { main: "#ED6C02" },
    error: { main: "#D32F2F" },
    background: { default: "#F5F7FA" },
  },
  typography: {
    fontFamily: [
      "Inter",
      "-apple-system",
      "BlinkMacSystemFont",
      '"Segoe UI"',
      "sans-serif",
    ].join(","),
    h5: { fontWeight: 600 },
    h6: { fontWeight: 600 },
    subtitle2: { fontWeight: 600 },
  },
  shape: { borderRadius: 8 },
  components: {
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: { textTransform: "none", fontWeight: 500 },
      },
    },
    MuiPaper: {
      defaultProps: { elevation: 0 },
    },
    MuiTableCell: {
      styleOverrides: {
        head: { fontWeight: 600 },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: { fontWeight: 500 },
      },
    },
    MuiDataGrid: {
      styleOverrides: {
        root: {
          border: "none",
          "& .MuiDataGrid-row": { cursor: "pointer" },
          "& .MuiDataGrid-cell:focus": { outline: "none" },
          "& .MuiDataGrid-cell:focus-within": { outline: "none" },
        },
      },
    },
  },
});
