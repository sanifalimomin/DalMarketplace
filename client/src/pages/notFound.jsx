import { useNavigate } from "react-router-dom";
import { Box, Stack, Typography, Button } from "@mui/material";
import { useAuth } from "../contexts/AuthContext";
import AppNav from "../components/AppNav";

export default function NotFound() {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "#f2f2f2" }}>
      {user && <AppNav />}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: user ? "calc(100vh - 64px)" : "100vh",
          px: 3,
        }}
      >
        <Stack alignItems="center" spacing={2}>
          <Typography sx={{ fontSize: 72, fontWeight: 700, color: "#1a1a1a", letterSpacing: "-2px" }}>
            404
          </Typography>
          <Typography sx={{ fontSize: 18, fontWeight: 600, color: "#1a1a1a" }}>
            Page not found
          </Typography>
          <Typography color="text.secondary" sx={{ textAlign: "center", maxWidth: 360 }}>
            The page you&rsquo;re looking for doesn&rsquo;t exist or may have been moved.
          </Typography>
          <Button
            variant="contained"
            onClick={() => navigate(user ? "/dashboard" : "/signin")}
            sx={{ textTransform: "none", bgcolor: "#1a1a1a", "&:hover": { bgcolor: "#333" }, mt: 1 }}
          >
            {user ? "Back to browse" : "Back to sign in"}
          </Button>
        </Stack>
      </Box>
    </Box>
  );
}
