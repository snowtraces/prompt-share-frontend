import { GlobalStyles } from "@mui/material";
import type { Theme } from "@mui/material";

export default function MuiCssVars({ theme }: { theme: Theme }) {
    return (
        <GlobalStyles
            styles={{
                ":root": {
                    "--mui-primary": theme.palette.primary.main,
                    "--mui-secondary": theme.palette.secondary.main,
                    "--mui-success": theme.palette.success.main,
                    "--mui-warning": theme.palette.warning.main,
                    "--mui-error": theme.palette.error.main,
                    "--mui-info": theme.palette.info.main,
                    "--mui-bg": theme.palette.background.default,
                    "--mui-surface": theme.palette.background.paper,
                    "--mui-text": theme.palette.text.primary,
                    "--mui-text-secondary": theme.palette.text.secondary,
                },
            }}
        />
    );
}
